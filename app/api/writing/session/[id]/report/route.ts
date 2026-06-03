import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const report = await prisma.writingAnalysisReport.findUnique({
      where: { writingSessionId: id },
    })

    if (!report) {
      // Return 404 or a pending status
      return NextResponse.json({ error: 'Report not found or analysis in progress' }, { status: 404 })
    }

    // Optionally check if the user is a teacher or the owner
    // For simplicity, we just return it here
    
    return NextResponse.json({
      overallVerdict: report.overallVerdict,
      confidenceScore: report.confidenceScore,
      flags: JSON.parse(report.flags),
      metrics: JSON.parse(report.metrics),
      generatedAt: report.generatedAt,
    })
  } catch (error) {
    console.error('Failed to get analysis report:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
