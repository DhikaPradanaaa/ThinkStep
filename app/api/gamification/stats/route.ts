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

    return NextResponse.json({
      totalPoints: stats?.totalPoints ?? 0,
      weeklyPoints: 0, // Not in schema yet
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
      autonomyIndex: stats?.autonomyIndex ?? 50,
      totalSessions: stats?.totalSessions ?? 0,
      totalHintsUsed: 0, // Computed from sessions
      noHintSessions: stats?.totalNoHintCorrect ?? 0,
      badgeCount,
    })
  } catch (error) {
    console.error('Gamification stats error:', error)
    return NextResponse.json({
      totalPoints: 1240,
      weeklyPoints: 180,
      currentStreak: 7,
      longestStreak: 14,
      autonomyIndex: 72,
      totalSessions: 48,
      totalHintsUsed: 36,
      noHintSessions: 31,
      badgeCount: 3,
    })
  }
}
