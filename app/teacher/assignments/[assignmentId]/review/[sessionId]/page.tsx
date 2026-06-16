import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import ReviewPageClient from './ReviewPageClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ReviewPageProps {
  params: Promise<{ assignmentId: string; sessionId: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { assignmentId, sessionId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  // Verify the assignment belongs to this teacher or teacher's school
  let assignmentTitle = 'Tugas'
  let studentName = 'Siswa'

  let writingSession: any = null

  try {
    writingSession = await prisma.writingSession.findUnique({
      where: { id: sessionId },
      include: {
        assignment: true,
        student: { select: { name: true } },
      },
    })

    if (!writingSession) redirect('/teacher/dashboard')
    
    assignmentTitle = writingSession.assignment.title
    studentName = writingSession.student.name || 'Siswa'
  } catch (e) {
    console.error('Failed to fetch session details:', e)
  }

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/teacher/assignments/${assignmentId}/submissions`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            ← Kembali
          </Link>
          <div style={{ height: '24px', width: '1px', background: 'var(--color-border)' }} />
          <div>
            <h1 className="text-heading-lg" style={{ color: 'var(--color-text-primary)' }}>
              Review: {studentName}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {assignmentTitle}
            </p>
          </div>
        </div>

        <ReviewPageClient sessionId={sessionId} initialSession={writingSession} />

      </div>
    </AppLayout>
  )
}
