import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, gradeLevel } = await req.json()

    if (!['STUDENT', 'TEACHER', 'PARENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        gradeLevel: role === 'STUDENT' ? gradeLevel : null,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
