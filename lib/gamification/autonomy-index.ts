// Autonomy Index Engine — ThinkStep Gamification
// Menghitung dan memperbarui Autonomy Index untuk semua siswa secara batch
import { prisma } from '@/lib/db'
import { calculateAutonomyIndex } from './scoring'

export interface AutonomySnapshot {
  userId: string
  autonomyIndex: number
  totalSessions: number
  totalCorrect: number
  totalNoHintCorrect: number
  avgHintsPerQuestion: number
}

/**
 * Recalculate and persist the Autonomy Index for a single user.
 * Called after each completed learning session.
 */
export async function updateUserAutonomyIndex(userId: string): Promise<number> {
  const sessions = await prisma.learningSession.findMany({
    where: { userId, isCompleted: true },
    select: { isCorrect: true, hintsUsed: true },
  })

  if (sessions.length === 0) return 0

  const totalSessions = sessions.length
  const totalCorrect = sessions.filter(s => s.isCorrect === true).length
  const totalNoHintCorrect = sessions.filter(s => s.isCorrect === true && s.hintsUsed === 0).length
  const avgHintsPerQuestion =
    sessions.reduce((sum, s) => sum + (s.hintsUsed ?? 0), 0) / totalSessions

  const autonomyIndex = calculateAutonomyIndex({
    totalSessions,
    totalCorrect,
    totalNoHintCorrect,
    avgHintsPerQuestion,
  })

  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      autonomyIndex,
      totalSessions,
      totalCorrect,
      totalNoHintCorrect,
    },
    update: {
      autonomyIndex,
      totalSessions,
      totalCorrect,
      totalNoHintCorrect,
    },
  })

  return autonomyIndex
}

/**
 * Batch-recalculate Autonomy Index for all students in a school.
 * Suitable for use in cron jobs or background tasks.
 */
export async function recalculateSchoolAutonomyIndices(schoolId: string): Promise<AutonomySnapshot[]> {
  const students = await prisma.user.findMany({
    where: { schoolId, role: 'STUDENT' },
    select: { id: true },
  })

  const snapshots: AutonomySnapshot[] = []

  for (const student of students) {
    const sessions = await prisma.learningSession.findMany({
      where: { userId: student.id, isCompleted: true },
      select: { isCorrect: true, hintsUsed: true },
    })

    if (sessions.length === 0) {
      snapshots.push({
        userId: student.id,
        autonomyIndex: 0,
        totalSessions: 0,
        totalCorrect: 0,
        totalNoHintCorrect: 0,
        avgHintsPerQuestion: 0,
      })
      continue
    }

    const totalSessions = sessions.length
    const totalCorrect = sessions.filter(s => s.isCorrect === true).length
    const totalNoHintCorrect = sessions.filter(s => s.isCorrect === true && s.hintsUsed === 0).length
    const avgHintsPerQuestion =
      sessions.reduce((sum, s) => sum + (s.hintsUsed ?? 0), 0) / totalSessions

    const autonomyIndex = calculateAutonomyIndex({
      totalSessions,
      totalCorrect,
      totalNoHintCorrect,
      avgHintsPerQuestion,
    })

    await prisma.userStats.upsert({
      where: { userId: student.id },
      create: { userId: student.id, autonomyIndex, totalSessions, totalCorrect, totalNoHintCorrect },
      update: { autonomyIndex, totalSessions, totalCorrect, totalNoHintCorrect },
    })

    snapshots.push({ userId: student.id, autonomyIndex, totalSessions, totalCorrect, totalNoHintCorrect, avgHintsPerQuestion })
  }

  return snapshots
}

/**
 * Get Autonomy Index trend for a specific student (weekly breakdown).
 * Returns the last N weeks of average autonomy derived from session data.
 */
export async function getAutonomyTrend(userId: string, weeks = 8): Promise<{ week: string; index: number }[]> {
  const now = new Date()
  const trend: { week: string; index: number }[] = []

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (w + 1) * 7)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - w * 7)
    weekEnd.setHours(23, 59, 59, 999)

    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        isCompleted: true,
        startedAt: { gte: weekStart, lte: weekEnd },
      },
      select: { isCorrect: true, hintsUsed: true },
    })

    const label = `Minggu ${weeks - w}`

    if (sessions.length === 0) {
      trend.push({ week: label, index: 0 })
      continue
    }

    const totalSessions = sessions.length
    const totalCorrect = sessions.filter(s => s.isCorrect === true).length
    const totalNoHintCorrect = sessions.filter(s => s.isCorrect === true && s.hintsUsed === 0).length
    const avgHintsPerQuestion =
      sessions.reduce((sum, s) => sum + (s.hintsUsed ?? 0), 0) / totalSessions

    const weekIndex = calculateAutonomyIndex({
      totalSessions,
      totalCorrect,
      totalNoHintCorrect,
      avgHintsPerQuestion,
    })

    trend.push({ week: label, index: weekIndex })
  }

  return trend
}
