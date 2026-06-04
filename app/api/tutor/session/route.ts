import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const user = session.user as any

    // Find existing global tutor session
    let tutorSession = await prisma.learningSession.findFirst({
      where: {
        userId: user.id,
        subject: 'Tanya Lumina',
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    if (!tutorSession) {
      tutorSession = await prisma.learningSession.create({
        data: {
          userId: user.id,
          subject: 'Tanya Lumina',
          isCompleted: false,
        }
      })
    }

    return NextResponse.json({ sessionId: tutorSession.id })
  } catch (error) {
    console.error('[TUTOR_SESSION]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
