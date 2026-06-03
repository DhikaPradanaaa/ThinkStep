import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { events } = body

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'No events provided' }, { status: 400 })
  }

  // Validate session belongs to user
  const sessionId = events[0]?.writingSessionId
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  try {
    const writingSession = await prisma.writingSession.findUnique({
      where: { id: sessionId },
    })

    if (!writingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (writingSession.studentId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (writingSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ ok: true, skipped: true }) // silently accept for closed sessions
    }

    // Batch insert events
    await prisma.writingEvent.createMany({
      data: events.map((e: any) => ({
        writingSessionId: e.writingSessionId,
        sequenceNumber: e.sequenceNumber,
        absoluteTimestamp: BigInt(e.absoluteTimestamp),
        deltaFromPrevious: e.deltaFromPrevious,
        eventType: e.eventType,
        characters: e.characters,
        deleteCount: e.deleteCount,
        cursorPosition: e.cursorPosition,
        contentLength: e.contentLength,
        contentSnapshot: e.contentSnapshot,
      })),
    })

    return NextResponse.json({ ok: true, saved: events.length })
  } catch (error) {
    console.error('Writing events error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
