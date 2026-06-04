import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const period = searchParams.get('period') || 'alltime' // alltime | weekly
    const category = searchParams.get('category') || 'points' // points | streak | sessions

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    // Ambil siswa di kelas tersebut
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          select: { id: true, name: true, avatarColor: true }
        }
      }
    })

    if (!targetClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const studentIds = targetClass.students.map(s => s.id)

    let leaderboard: any[] = []

    if (period === 'alltime') {
      const stats = await prisma.userStats.findMany({
        where: { userId: { in: studentIds } },
        include: {
          user: { select: { id: true, name: true, avatarColor: true } }
        }
      })

      leaderboard = stats.map(s => ({
        userId: s.userId,
        name: s.user.name,
        avatarColor: s.user.avatarColor,
        points: s.totalPoints,
        streak: s.currentStreak,
        sessions: s.totalSessions,
      }))
    } else {
      // Weekly
      const now = new Date()
      // get last monday
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      const startOfWeek = new Date(now.setDate(diff))
      startOfWeek.setHours(0, 0, 0, 0)

      const sessions = await prisma.learningSession.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
          startedAt: { gte: startOfWeek }
        },
        _sum: { pointsEarned: true },
        _count: { id: true }
      })

      const userStats = await prisma.userStats.findMany({
        where: { userId: { in: studentIds } },
        select: { userId: true, currentStreak: true, user: { select: { id: true, name: true, avatarColor: true } } }
      })

      leaderboard = userStats.map(s => {
        const weekStats = sessions.find(sess => sess.userId === s.userId)
        return {
          userId: s.userId,
          name: s.user.name,
          avatarColor: s.user.avatarColor,
          points: weekStats?._sum.pointsEarned || 0,
          streak: s.currentStreak, // Streak tetap diambil dari current
          sessions: weekStats?._count.id || 0,
        }
      })
    }

    // Sort by category
    leaderboard.sort((a, b) => {
      if (category === 'points') return b.points - a.points
      if (category === 'streak') return b.streak - a.streak
      if (category === 'sessions') return b.sessions - a.sessions
      return 0
    })

    // Add badge count
    const badges = await prisma.userBadge.groupBy({
      by: ['userId'],
      where: { userId: { in: studentIds } },
      _count: { badgeId: true }
    })

    const finalLeaderboard = leaderboard.map((item, index) => {
      const badgeStat = badges.find(b => b.userId === item.userId)
      return {
        rank: index + 1,
        badgeCount: badgeStat?._count.badgeId || 0,
        ...item
      }
    })

    return NextResponse.json({ leaderboard: finalLeaderboard })
  } catch (error) {
    console.error('API /leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
