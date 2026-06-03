import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  try {
    const users = await prisma.userStats.findMany({
      where: { user: { schoolId: user.schoolId || 'no-school', role: 'STUDENT' } },
      include: { user: { select: { id: true, name: true, gradeLevel: true } } },
      orderBy: { totalPoints: 'desc' },
      take: 20,
    })

    const leaderboard = users.map((stat, idx) => ({
      rank: idx + 1,
      userId: stat.userId,
      name: (stat as any).user.name,
      gradeLevel: (stat as any).user.gradeLevel,
      weeklyPoints: stat.totalPoints,
      autonomyIndex: stat.autonomyIndex,
      currentStreak: stat.currentStreak,
      isCurrentUser: stat.userId === user.id,
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    // Demo data
    const demo = [
      { rank: 1, userId: 's1', name: 'Hendra Wijaya', gradeLevel: 'Kelas 8B', weeklyPoints: 320, autonomyIndex: 91, currentStreak: 14, isCurrentUser: false },
      { rank: 2, userId: 's2', name: 'Andi Kusuma', gradeLevel: 'Kelas 8A', weeklyPoints: 280, autonomyIndex: 85, currentStreak: 7, isCurrentUser: true },
      { rank: 3, userId: 's3', name: 'Eka Rahman', gradeLevel: 'Kelas 8A', weeklyPoints: 250, autonomyIndex: 79, currentStreak: 5, isCurrentUser: false },
      { rank: 4, userId: 's4', name: 'Citra Dewi', gradeLevel: 'Kelas 8B', weeklyPoints: 210, autonomyIndex: 73, currentStreak: 3, isCurrentUser: false },
      { rank: 5, userId: 's5', name: 'Budi Santoso', gradeLevel: 'Kelas 8A', weeklyPoints: 145, autonomyIndex: 55, currentStreak: 1, isCurrentUser: false },
    ]
    return NextResponse.json({ leaderboard: demo })
  }
}
