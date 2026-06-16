import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createNotificationForClass } from '@/lib/notifications/create'


export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, instructions, minWordCount, maxDurationMins, deadlineDays, classId, assignmentType, attachmentUrls } = body

  if (!title || !instructions) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + (parseInt(deadlineDays) || 7))

    const assignment = await prisma.assignment.create({
      data: {
        title,
        instructions,
        targetGrade: classId ? 'Khusus' : 'Global',
        minWordCount: minWordCount ? parseInt(minWordCount) : null,
        maxDurationMins: parseInt(maxDurationMins) || 60,
        deadline,
        isPublished: true,
        assignmentType: assignmentType || 'ESSAY',
        attachmentUrls: attachmentUrls ? JSON.stringify(attachmentUrls) : '[]',
        schoolId: user.schoolId || 'no-school',
        classId: classId || null,
        createdById: user.id,
      },
    })

    // Temukan siswa yang akan mendapatkan tugas ini
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(classId 
          ? { joinedClasses: { some: { id: classId } } }
          : { schoolId: user.schoolId || 'no-school' }
        )
      },
      select: { id: true }
    })

    if (students.length > 0) {
      // Create Tasks for each student
      await prisma.task.createMany({
        data: students.map(s => ({
          userId: s.id,
          title: `Tugas: ${title}`,
          description: `Tenggat Waktu: ${deadline.toLocaleDateString('id-ID')}`,
          deadline: deadline,
          priority: 'HIGH',
          status: 'TODO'
        }))
      })
    }

    if (classId) {
      await createNotificationForClass({
        classId,
        type: 'ASSIGNMENT_NEW',
        title: 'Tugas Baru: ' + title,
        message: 'Guru telah memberikan tugas baru. Segera kerjakan!',
        href: '/student/assignments',
      })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to create assignment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
