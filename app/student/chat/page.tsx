import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import TutorChatInterface from '@/components/chat/TutorChatInterface'

export default async function StudentChatPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as any).id

  // Find or create global tutor session
  let learningSession = await prisma.learningSession.findFirst({
    where: {
      userId,
      subject: 'Tanya Lumina',
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  if (!learningSession) {
    learningSession = await prisma.learningSession.create({
      data: {
        userId,
        subject: 'Tanya Lumina',
        isCompleted: false,
      },
    })
  }

  const messages = await prisma.message.findMany({
    where: { sessionId: learningSession.id },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <TutorChatInterface
        sessionId={learningSession.id}
        initialMessages={messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))}
        studentName={session.user.name?.split(' ')[0] ?? 'Siswa'}
      />
    </AppLayout>
  )
}
