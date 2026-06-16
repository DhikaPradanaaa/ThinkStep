import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: "2026-06"
    
    // Parse start and end dates of the month if provided, else use current month
    let startDate = new Date()
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)
    
    if (month) {
      const [yearStr, monthStr] = month.split('-')
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
    }
    
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    const events: any[] = []

    if (user.role === 'STUDENT') {
      // 1. Tugas Sekolah (Assignment)
      const userWithClasses = await prisma.user.findUnique({
        where: { id: user.id },
        include: { joinedClasses: { select: { id: true } } }
      })
      const classIds = userWithClasses?.joinedClasses.map((c: any) => c.id) || []

      const assignments = await prisma.assignment.findMany({
        where: {
          isPublished: true,
          deadline: { gte: startDate, lt: endDate },
          OR: [
            { classId: { in: classIds } },
            { classId: null }
          ]
        }
      })

      assignments.forEach((a: any) => {
        events.push({
          id: `assignment-${a.id}`,
          date: a.deadline.toISOString().split('T')[0],
          type: 'assignment',
          title: a.title,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          href: '/student/assignments',
          description: `Tenggat Waktu: ${a.deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
        })
      })

      // 2. Ujian (Exam)
      const exams = user.schoolId ? await prisma.exam.findMany({
        where: {
          schoolId: user.schoolId,
          startsAt: { gte: startDate, lt: endDate },
          OR: [
            { classId: { in: classIds } },
            { classId: null }
          ]
        }
      }) : []

      exams.forEach((e: any) => {
        if (e.startsAt) {
          events.push({
            id: `exam-${e.id}`,
            date: e.startsAt.toISOString().split('T')[0],
            type: 'exam',
            title: `Ujian: ${e.title}`,
            color: 'bg-red-100 text-red-700 border-red-200',
            href: `/student/exam/${e.id}`,
            description: `Waktu: ${e.startsAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
          })
        }
      })

      // 3. Tugas Pribadi (Task)
      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          deadline: { gte: startDate, lt: endDate },
          status: { not: 'DONE' }
        }
      })

      tasks.forEach((t: any) => {
        if (t.deadline) {
          events.push({
            id: `task-${t.id}`,
            date: t.deadline.toISOString().split('T')[0],
            type: 'task',
            title: t.title,
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            href: '/student/tasks',
            description: `Prioritas: ${t.priority}`
          })
        }
      })

    } else if (user.role === 'TEACHER') {
      // Teacher Events
      const assignments = await prisma.assignment.findMany({
        where: { createdById: user.id, deadline: { gte: startDate, lt: endDate } }
      })

      assignments.forEach((a: any) => {
        events.push({
          id: `assignment-${a.id}`,
          date: a.deadline.toISOString().split('T')[0],
          type: 'assignment',
          title: `Tenggat: ${a.title}`,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          href: '/teacher/assignments',
        })
      })

      const exams = await prisma.exam.findMany({
        where: { createdById: user.id, startsAt: { gte: startDate, lt: endDate } }
      })

      exams.forEach((e: any) => {
        if (e.startsAt) {
          events.push({
            id: `exam-${e.id}`,
            date: e.startsAt.toISOString().split('T')[0],
            type: 'exam',
            title: `Ujian: ${e.title}`,
            color: 'bg-red-100 text-red-700 border-red-200',
            href: `/teacher/exam`,
          })
        }
      })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('API /calendar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
