import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import WritingPageClient from './WritingPageClient'

export const dynamic = 'force-dynamic'

interface WritePageProps {
  params: Promise<{ assignmentId: string }>
}

// Demo assignment data for when DB fails
const DEMO_ASSIGNMENT = {
  id: 'demo',
  title: 'Esai Dampak Media Sosial',
  instructions: 'Tuliskan esai argumentatif tentang dampak media sosial pada remaja Indonesia. Gunakan argumen yang kuat dan sertakan contoh nyata.',
  minWordCount: 300 as number | undefined,
  maxDurationMins: 90,
  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  allowAttachment: false,
}

export default async function WritePage({ params }: WritePageProps) {
  const { assignmentId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'STUDENT') redirect('/teacher/dashboard')

  let dbAssignment = null;
  let existing = null;

  try {
    dbAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (dbAssignment) {
      existing = await prisma.writingSession.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
      })
    }
  } catch (e) {
    console.error('DB fetch error for write page:', e)
  }

  if (!dbAssignment) redirect('/student/assignments')
  if (!dbAssignment.isPublished) redirect('/student/assignments')
  if (new Date(dbAssignment.deadline) < new Date()) redirect('/student/assignments')

  if (existing?.status === 'SUBMITTED' || existing?.status === 'TIMED_OUT') {
    redirect('/student/assignments')
  }

  let writingSessionId = `demo-${user.id}-${assignmentId}`
  
  try {
    if (existing) {
      writingSessionId = existing.id
    } else {
      const newSession = await prisma.writingSession.create({
        data: { assignmentId, studentId: user.id, status: 'IN_PROGRESS' },
      })
      writingSessionId = newSession.id
    }
  } catch (e) {
    console.error('DB session create error for write page:', e)
  }

  const assignmentData = {
    id: dbAssignment.id,
    title: dbAssignment.title,
    instructions: dbAssignment.instructions,
    minWordCount: dbAssignment.minWordCount ?? undefined,
    maxDurationMins: dbAssignment.maxDurationMins,
    deadline: dbAssignment.deadline.toISOString(),
    allowAttachment: dbAssignment.allowAttachment,
  }

  return (
    <WritingPageClient
      writingSessionId={writingSessionId}
      assignment={assignmentData}
    />
  )
}
