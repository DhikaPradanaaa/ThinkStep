import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any

    if (user.role === 'TEACHER') {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        include: {
          _count: {
            select: { students: true, assignments: true, exams: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ classes })
    } else if (user.role === 'STUDENT') {
      const classes = await prisma.class.findMany({
        where: { students: { some: { id: user.id } } },
        include: {
          teacher: { select: { name: true } },
          _count: {
            select: { assignments: true, exams: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ classes })
    }

    return NextResponse.json({ classes: [] })
  } catch (error) {
    console.error('Failed to fetch classes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
