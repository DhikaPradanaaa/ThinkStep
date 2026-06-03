import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

type AnswersPayload = Record<string, string>

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}

function extractNumber(value: string) {
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function splitAnswerCandidates(correctAnswer: string) {
  return correctAnswer
    .split(/[;/|]/)
    .map((candidate) => candidate.trim())
    .filter(Boolean)
}

function isAnswerCorrect(submittedAnswer: string, correctAnswer: string | null) {
  if (!correctAnswer || !submittedAnswer.trim()) return false

  const submittedNumber = extractNumber(submittedAnswer)
  const candidates = splitAnswerCandidates(correctAnswer)

  for (const candidate of candidates) {
    const candidateNumber = extractNumber(candidate)
    if (
      candidateNumber !== null &&
      submittedNumber !== null &&
      Math.abs(candidateNumber - submittedNumber) < 0.001
    ) {
      return true
    }

    const submitted = normalizeText(submittedAnswer)
    const expected = normalizeText(candidate)

    if (!submitted || !expected) continue
    if (expected.length <= 3 && submitted === expected) return true
    if (expected.length > 3 && (submitted.includes(expected) || expected.includes(submitted))) {
      return true
    }
  }

  return false
}

function safeAnswers(value: unknown): AnswersPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).map(([questionId, answer]) => [questionId, String(answer ?? '')])
  )
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await auth()

    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const user = session.user as any
    if (user.role !== 'STUDENT') {
      return new NextResponse('Only students can submit exams', { status: 403 })
    }

    const body = await req.json()
    const answers = safeAnswers(body.answers)
    const tabSwitches = Math.max(0, Number(body.tabSwitches ?? 0))

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!exam) return new NextResponse('Exam not found', { status: 404 })

    if (exam.schoolId !== user.schoolId || exam.targetGrade !== user.gradeLevel) {
      return new NextResponse('Exam is not assigned to this student', { status: 403 })
    }

    let result = await prisma.examResult.findUnique({
      where: { examId_userId: { examId: exam.id, userId: user.id } },
    })

    if (!result) {
      result = await prisma.examResult.create({
        data: {
          examId: exam.id,
          userId: user.id,
          startedAt: new Date(),
          answers: '{}',
        },
      })
    }

    if (result.submittedAt) {
      return NextResponse.json({
        success: true,
        score: result.score,
        correctCount: 0,
        scorableCount: 0,
        submittedAt: result.submittedAt.toISOString(),
        tabSwitches: result.tabSwitches,
      })
    }

    const scorableQuestions = exam.questions.filter((item) => Boolean(item.question.correctAnswer))
    const correctCount = scorableQuestions.reduce((count, item) => {
      const answer = answers[item.questionId] ?? ''
      return count + (isAnswerCorrect(answer, item.question.correctAnswer) ? 1 : 0)
    }, 0)
    const scorableCount = scorableQuestions.length
    const score = scorableCount > 0 ? (correctCount / scorableCount) * 100 : null
    const submittedAt = new Date()

    result = await prisma.examResult.update({
      where: { id: result.id },
      data: {
        answers: JSON.stringify(answers),
        score,
        tabSwitches: Math.max(result.tabSwitches, tabSwitches),
        submittedAt,
      },
    })

    return NextResponse.json({
      success: true,
      score: result.score,
      correctCount,
      scorableCount,
      submittedAt: submittedAt.toISOString(),
      tabSwitches: result.tabSwitches,
    })
  } catch (error) {
    console.error('[Exam Submit] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
