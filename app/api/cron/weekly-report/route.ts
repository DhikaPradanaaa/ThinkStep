import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateWeeklyReportHTML } from '@/lib/email/weekly-report'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  // In production, verify authHeader matches CRON_SECRET from env
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get all parents
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      select: { id: true, email: true, name: true }
    })

    // 2. Since we don't have explicit parent-child relations, we'll mock it for now.
    // In a real scenario, you would fetch `parent.children`.
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: {
        userStats: true,
        sessions: {
          where: { startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          select: { startedAt: true, endedAt: true },
        }
      }
    })

    if (!student || !student.userStats) {
      return NextResponse.json({ ok: true, message: 'No student data to report' })
    }

    const htmlReport = generateWeeklyReportHTML(student.name, {
      points: student.userStats.totalPoints,
      // BUG-001 FIX: Use totalCorrect (existing field) instead of non-existent questionsSolved
      questionsSolved: student.userStats.totalCorrect,
      autonomyIndex: student.userStats.autonomyIndex,
      // BUG-001 FIX: Estimate hours from sessions count (totalStudyTimeMs doesn't exist in schema)
      hoursSpent: student.sessions.reduce((total: number, s: { startedAt: Date; endedAt: Date | null }) => {
        if (s.endedAt) return total + (s.endedAt.getTime() - s.startedAt.getTime()) / 3600000;
        return total + 0.25; // assume ~15min per session without endedAt
      }, 0)
    })

    // 3. Send email to each parent (Mocked via console.log)
    for (const parent of parents) {
      // e.g. await sendEmail({ to: parent.email, subject: 'Laporan Belajar', html: htmlReport })
      console.log(`[CRON] Weekly report sent to ${parent.email}`)
    }

    return NextResponse.json({ ok: true, sentTo: parents.length })
  } catch (error) {
    console.error('Failed to run weekly report cron:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
