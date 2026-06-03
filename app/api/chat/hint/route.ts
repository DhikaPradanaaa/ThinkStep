import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const user = session.user as any
    const activeExam = await prisma.exam.findFirst({
      where: {
        schoolId: user.schoolId || 'no-school',
        targetGrade: user.gradeLevel,
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    })

    if (activeExam) {
      return new NextResponse('Mode Ujian Aktif - petunjuk tidak tersedia', { status: 403 })
    }

    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return new NextResponse('Missing sessionId', { status: 400 })
    }

    const learningSession = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { question: true }
    })

    if (!learningSession || learningSession.userId !== user.id) {
      return new NextResponse('Session not found', { status: 404 })
    }

    if (learningSession.isCompleted) {
      return new NextResponse('Session already completed', { status: 400 })
    }

    const currentHintTier = learningSession.hintsUsed + 1

    if (currentHintTier > 3) {
      return new NextResponse('Maximum hints reached', { status: 400 })
    }

    // Determine the hint content based on tier
    let hintContent = ''
    if (currentHintTier === 1) hintContent = learningSession.question?.hintTier1 ?? ''
    else if (currentHintTier === 2) hintContent = learningSession.question?.hintTier2 ?? ''
    else if (currentHintTier === 3) hintContent = learningSession.question?.hintTier3 ?? ''

    // Update session hint count
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { hintsUsed: currentHintTier }
    })

    // Save hint message as ASSISTANT response
    const message = await prisma.message.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: hintContent,
        isHint: true,
        hintTier: currentHintTier,
      }
    })

    return NextResponse.json({
      message,
      hintsUsed: currentHintTier
    })
  } catch (error) {
    console.error('Hint API Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
