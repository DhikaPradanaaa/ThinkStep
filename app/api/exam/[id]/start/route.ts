import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

function parseAnswers(value: string | null | undefined): Record<string, string> {
  if (!value) return {}

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).map(([key, answer]) => [key, String(answer ?? '')])
    )
  } catch {
    return {}
  }
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await auth()

    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const user = session.user as any
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) return new NextResponse('Exam not found', { status: 404 })

    if (user.role === 'TEACHER') {
      if (exam.schoolId !== user.schoolId && exam.createdById !== user.id) {
        return new NextResponse('Exam is not owned by this teacher', { status: 403 })
      }

      const startsAt = new Date()
      const endsAt = new Date(startsAt.getTime() + exam.durationMins * 60 * 1000)
      const activeExam = await prisma.exam.update({
        where: { id: exam.id },
        data: {
          isActive: true,
          startsAt,
          endsAt,
        },
      })

      return NextResponse.json({
        examId: activeExam.id,
        isActive: activeExam.isActive,
        startsAt: activeExam.startsAt?.toISOString() ?? null,
        endsAt: activeExam.endsAt?.toISOString() ?? null,
      })
    }

    if (user.role !== 'STUDENT') {
      return new NextResponse('Only students or teachers can start exams', { status: 403 })
    }

    if (exam.schoolId !== user.schoolId || exam.targetGrade !== user.gradeLevel) {
      return new NextResponse('Exam is not assigned to this student', { status: 403 })
    }

    const now = new Date()
    const globalEndsAt = exam.endsAt
    const isActive = exam.isActive && (!globalEndsAt || globalEndsAt > now)

    if (!isActive) {
      return new NextResponse('Exam is not active', { status: 403 })
    }

    let result = await prisma.examResult.findUnique({
      where: { examId_userId: { examId: exam.id, userId: user.id } },
    })

    if (!result) {
      result = await prisma.examResult.create({
        data: {
          examId: exam.id,
          userId: user.id,
          startedAt: now,
          answers: '{}',
        },
      })
    }

    const personalEndsAt = new Date(result.startedAt.getTime() + exam.durationMins * 60 * 1000)
    const endsAt = globalEndsAt && globalEndsAt < personalEndsAt ? globalEndsAt : personalEndsAt
    const timeRemainingMs = Math.max(0, endsAt.getTime() - now.getTime())

    if (timeRemainingMs <= 0 && !result.submittedAt) {
      result = await prisma.examResult.update({
        where: { id: result.id },
        data: { submittedAt: now },
      })
    }

    return NextResponse.json({
      resultId: result.id,
      startedAt: result.startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timeRemainingMs,
      answers: parseAnswers(result.answers),
      tabSwitches: result.tabSwitches,
      submittedAt: result.submittedAt?.toISOString() ?? null,
      score: result.score,
    })
  } catch (error) {
    console.error('[Exam Start] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
