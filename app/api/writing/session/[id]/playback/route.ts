import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildPlaybackFrames, reduceFrames } from '@/lib/writing/anti-ai-engine'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const writingSession = await prisma.writingSession.findUnique({
      where: { id },
      include: {
        events: { orderBy: { sequenceNumber: 'asc' } },
        analysisReport: true,
      },
    })

    if (!writingSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const events = writingSession.events

    // Get anomaly timestamps from report flags if available
    const anomalyTimestamps = new Set<number>()
    if (writingSession.analysisReport?.flags) {
      const flags = JSON.parse(writingSession.analysisReport.flags)
      for (const flag of flags) {
        if (typeof flag === 'object' && flag.timestamp) {
          anomalyTimestamps.add(flag.timestamp + writingSession.startedAt.getTime())
        }
      }
    }

    const allFrames = buildPlaybackFrames(events, anomalyTimestamps)
    const playbackFrames = reduceFrames(allFrames, 500) // 1 frame per 500ms minimum

    return NextResponse.json({
      frames: playbackFrames,
      totalEvents: events.length,
      startedAt: writingSession.startedAt,
      submittedAt: writingSession.submittedAt,
    })
  } catch (error) {
    console.error('Failed to get playback data:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
