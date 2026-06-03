import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ExamInterface from '@/components/exam/ExamInterface'
import { redirect } from 'next/navigation'

interface ExamPageProps {
  params: Promise<{ examId: string }>
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

export default async function StudentExamPage({ params }: ExamPageProps) {
  const { examId } = await params
  const session = await auth()

  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'STUDENT') redirect('/teacher/dashboard')

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { question: true },
      },
      results: {
        where: { userId: user.id },
        take: 1,
      },
    },
  })

  if (!exam) redirect('/student/dashboard')

  const existingResult = exam.results[0]
  const isSameSchool = exam.schoolId === user.schoolId
  const isTargetGrade = exam.targetGrade === user.gradeLevel
  const isActive = exam.isActive && (!exam.endsAt || exam.endsAt > new Date())

  if (!isSameSchool || !isTargetGrade) redirect('/student/dashboard')
  if (!isActive && !existingResult?.submittedAt) redirect('/student/dashboard')

  return (
    <ExamInterface
      exam={{
        id: exam.id,
        title: exam.title,
        durationMins: exam.durationMins,
        endsAt: exam.endsAt?.toISOString() ?? null,
      }}
      questions={exam.questions.map((item) => ({
        id: item.question.id,
        content: item.question.content,
        type: item.question.type,
        difficulty: item.question.difficulty,
        subject: item.question.subject,
        topic: item.question.topic,
        gradeLevel: item.question.gradeLevel,
        order: item.order,
      }))}
      initialAnswers={parseAnswers(existingResult?.answers)}
      initialTabSwitches={existingResult?.tabSwitches ?? 0}
      initialSubmittedAt={existingResult?.submittedAt?.toISOString() ?? null}
      initialScore={existingResult?.score ?? null}
    />
  )
}
