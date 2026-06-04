import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  try {
    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    })

    const badgeCount = await prisma.userBadge.count({ where: { userId: user.id } })

    // Hitung weeklyPoints dari sesi 7 hari terakhir
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklySessionsAgg = await prisma.learningSession.aggregate({
      where: {
        userId: user.id,
        isCompleted: true,
        endedAt: { gte: sevenDaysAgo },
      },
      _sum: { pointsEarned: true },
    })
    const weeklyPoints = weeklySessionsAgg._sum.pointsEarned ?? 0

    // Hitung totalHintsUsed dari seluruh sesi
    const totalHintsAgg = await prisma.learningSession.aggregate({
      where: { userId: user.id, isCompleted: true },
      _sum: { hintsUsed: true },
    })
    const totalHintsUsed = totalHintsAgg._sum.hintsUsed ?? 0

    return NextResponse.json({
      totalPoints: stats?.totalPoints ?? 0,
      weeklyPoints,
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      autonomyIndex: stats?.autonomyIndex ?? 0,
      totalSessions: stats?.totalSessions ?? 0,
      totalHintsUsed,
      noHintSessions: stats?.totalNoHintCorrect ?? 0,
      badgeCount,
    })
  } catch (error) {
    console.error('Gamification stats error:', error)
    return NextResponse.json({
      totalPoints: 0,
      weeklyPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      autonomyIndex: 0,
      totalSessions: 0,
      totalHintsUsed: 0,
      noHintSessions: 0,
      badgeCount: 0,
    })
  }
}
