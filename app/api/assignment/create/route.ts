import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, instructions, targetGrade, minWordCount, maxDurationMins, deadlineDays, classId } = body

  if (!title || !instructions || !targetGrade) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + (parseInt(deadlineDays) || 7))

    const assignment = await prisma.assignment.create({
      data: {
        title,
        instructions,
        targetGrade,
        minWordCount: minWordCount ? parseInt(minWordCount) : null,
        maxDurationMins: parseInt(maxDurationMins) || 60,
        deadline,
        isPublished: true,
        schoolId: user.schoolId || 'no-school',
        classId: classId || null,
        createdById: user.id,
      },
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to create assignment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
