import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateWeeklyReportHTML } from '@/lib/email/weekly-report'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // SECURITY: Strictly enforce CRON_SECRET — do not allow fallback to dev mode in production
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET env variable is not set. Aborting for safety.')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON] Unauthorized weekly-report access attempt blocked.')
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

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // 3. Send email to each parent
    const sentEmails = []
    for (const parent of parents) {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[MOCK EMAIL] To: ${parent.email}\n${htmlReport}`)
        continue
      }
      
      try {
        await transporter.sendMail({
          from: `"ThinkStep AI" <${process.env.EMAIL_USER}>`,
          to: parent.email,
          subject: '📊 Laporan Progres Belajar Mingguan ThinkStep',
          html: htmlReport,
        })
        sentEmails.push(parent.email)
        console.log(`[CRON] Email terkirim ke ${parent.email}`)
      } catch (err) {
        console.error(`[CRON] Gagal mengirim email ke ${parent.email}`, err)
      }
    }

    return NextResponse.json({ 
      ok: true, 
      sentTo: parents.length, 
      actualEmailsSent: sentEmails,
      message: (!process.env.EMAIL_USER) ? "Set EMAIL_USER dan EMAIL_PASS di .env untuk mengirim email beneran." : "Sukses"
    })
  } catch (error) {
    console.error('Failed to run weekly report cron:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
