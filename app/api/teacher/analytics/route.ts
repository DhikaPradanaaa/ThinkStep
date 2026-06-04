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

    // Find student IDs to include
    let studentIds: string[] = []
    
    if (classId && classId !== 'all') {
      const targetClass = await prisma.class.findUnique({
        where: { id: classId },
        include: { students: { select: { id: true } } }
      })
      if (targetClass) {
        studentIds = targetClass.students.map(s => s.id)
      }
    } else {
      // Default to all students in school
      const schoolId = (session.user as any).schoolId
      if (schoolId) {
        const students = await prisma.user.findMany({
          where: { role: 'STUDENT', schoolId },
          select: { id: true }
        })
        studentIds = students.map(s => s.id)
      }
    }

    if (studentIds.length === 0) {
      return NextResponse.json({
        topicStats: [],
        atRiskStudents: [],
        timeline: []
      })
    }

    // 1. At-Risk Students
    const studentStats = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      include: {
        userStats: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    })

    const atRiskStudents = studentStats
      .filter(s => {
        const stats = s.userStats
        if (!stats) return true
        return stats.autonomyIndex < 35 || stats.currentStreak === 0
      })
      .map(s => ({
        id: s.id,
        name: s.name,
        avatarColor: s.avatarColor,
        autonomyIndex: s.userStats?.autonomyIndex || 0,
        streak: s.userStats?.currentStreak || 0,
        lastActive: s.sessions[0]?.startedAt || null
      }))
      .sort((a, b) => a.autonomyIndex - b.autonomyIndex)
      .slice(0, 10)

    // 2. Topic Stats (Last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentSessions = await prisma.learningSession.findMany({
      where: {
        userId: { in: studentIds },
        startedAt: { gte: thirtyDaysAgo }
      },
      include: { question: { select: { topic: true } } }
    })

    const topicMap: Record<string, { total: number; wrong: number; hints: number }> = {}
    
    recentSessions.forEach(s => {
      if (!s.question?.topic) return
      const t = s.question.topic
      if (!topicMap[t]) topicMap[t] = { total: 0, wrong: 0, hints: 0 }
      
      topicMap[t].total += 1
      if (s.isCorrect === false) topicMap[t].wrong += 1
      topicMap[t].hints += s.hintsUsed || 0
    })

    const topicStats = Object.keys(topicMap).map(topic => ({
      topic,
      total: topicMap[topic].total,
      wrongPercent: Math.round((topicMap[topic].wrong / topicMap[topic].total) * 100),
      avgHints: Math.round((topicMap[topic].hints / topicMap[topic].total) * 10) / 10
    })).sort((a, b) => b.wrongPercent - a.wrongPercent).slice(0, 8)

    // 3. Timeline (Sessions per day)
    const timelineMap: Record<string, number> = {}
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      timelineMap[d.toISOString().split('T')[0]] = 0
    }

    const lastWeekSessions = recentSessions.filter(s => s.startedAt >= sevenDaysAgo)
    lastWeekSessions.forEach(s => {
      const dateStr = s.startedAt.toISOString().split('T')[0]
      if (timelineMap[dateStr] !== undefined) {
        timelineMap[dateStr] += 1
      }
    })

    const timeline = Object.keys(timelineMap).map(date => ({
      date,
      sessions: timelineMap[date]
    }))

    return NextResponse.json({
      topicStats,
      atRiskStudents,
      timeline
    })
  } catch (error) {
    console.error('API /teacher/analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
