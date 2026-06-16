import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createNotification } from '@/lib/notifications/create'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: assignmentId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { sessionId, teacherFinalScore, teacherComment } = body

  if (!sessionId || typeof teacherFinalScore !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const writingSession = await prisma.writingSession.update({
      where: { id: sessionId },
      data: {
        teacherFinalScore,
        teacherComment,
        gradedAt: new Date()
      },
      include: {
        assignment: true,
        student: true
      }
    })

    // Notify the student
    await createNotification({
      userId: writingSession.studentId,
      type: 'ASSIGNMENT_GRADED',
      title: 'Tugas Dinilai',
      message: `Guru telah menilai tugas "${writingSession.assignment.title}". Nilai Anda: ${teacherFinalScore}`,
      href: `/student/assignments`, // Or specific submission page if it exists
    })

    return NextResponse.json({ success: true, writingSession })
  } catch (error) {
    console.error('Grade assignment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
