import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { assignmentId } = body

  if (!assignmentId) return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })

  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    if (!assignment.isPublished) return NextResponse.json({ error: 'Assignment not published' }, { status: 403 })

    // Check if already started
    const existing = await prisma.writingSession.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    })

    if (existing) {
      if (existing.status === 'SUBMITTED' || existing.status === 'TIMED_OUT') {
        return NextResponse.json({ error: 'Sudah pernah mengumpulkan tugas ini' }, { status: 400 })
      }
      return NextResponse.json({ writingSessionId: existing.id })
    }

    const writingSession = await prisma.writingSession.create({
      data: {
        assignmentId,
        studentId: user.id,
        status: 'IN_PROGRESS',
      },
    })

    return NextResponse.json({ writingSessionId: writingSession.id })
  } catch (error) {
    console.error('Start writing session error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
