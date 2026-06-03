import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import ChatInterface from '@/components/chat/ChatInterface'

interface Props {
  params: Promise<{ questionId: string }>
}

export default async function StudySessionPage({ params }: Props) {
  const { questionId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) redirect('/student/study')

  // Create or find existing session
  const userId = (session.user as any).id
  let learningSession = await prisma.learningSession.findFirst({
    where: { userId, questionId, isCompleted: false },
  })

  if (!learningSession) {
    learningSession = await prisma.learningSession.create({
      data: {
        userId,
        questionId: question.id,
        subject: question.subject,
      },
    })
  }

  const messages = await prisma.message.findMany({
    where: { sessionId: learningSession.id },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <ChatInterface
        question={{
          id: question.id,
          content: question.content,
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty,
          gradeLevel: question.gradeLevel,
          hintTier1: question.hintTier1,
          hintTier2: question.hintTier2,
          hintTier3: question.hintTier3,
        }}
        sessionId={learningSession.id}
        initialMessages={messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          isHint: m.isHint,
          hintTier: m.hintTier ?? undefined,
          createdAt: m.createdAt,
        }))}
        hintsUsed={learningSession.hintsUsed}
        studentName={session.user.name ?? 'Siswa'}
      />
    </AppLayout>
  )
}
