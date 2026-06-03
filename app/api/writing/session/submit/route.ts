import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeWritingSession } from '@/lib/writing/anti-ai-engine'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { writingSessionId, finalContent } = body

  if (!writingSessionId || finalContent === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const writingSession = await prisma.writingSession.findUnique({
      where: { id: writingSessionId },
    })

    if (!writingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (writingSession.studentId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (writingSession.status === 'SUBMITTED') return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

    const wordCount = finalContent.trim().split(/\s+/).filter(Boolean).length

    await prisma.writingSession.update({
      where: { id: writingSessionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        finalContent,
        wordCount,
      },
    })

    // Run anti-AI analysis asynchronously (don't block submission)
    analyzeWritingSession(writingSessionId).catch(err => {
      console.error('Analysis failed:', err)
    })

    return NextResponse.json({
      success: true,
      wordCount,
      message: 'Tugas berhasil dikumpulkan',
    })
  } catch (error) {
    console.error('Submit writing session error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
