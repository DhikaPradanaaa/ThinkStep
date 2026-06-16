import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { analyzeWritingSession } from '@/lib/writing/anti-ai-engine'
import { validateContent, sanitizeContent } from '@/lib/writing/content-validator'

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

    // Validate and sanitize content
    const assignment = await prisma.assignment.findUnique({ where: { id: writingSession.assignmentId } })
    const sanitized = sanitizeContent(finalContent)
    const validation = validateContent(sanitized, {
      minWordCount: assignment?.minWordCount ?? 50,
    })

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validasi konten gagal',
        details: validation.errors,
        warnings: validation.warnings,
        wordCount: validation.wordCount,
      }, { status: 422 })
    }

    const wordCount = validation.wordCount

    await prisma.writingSession.update({
      where: { id: writingSessionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        finalContent: sanitized,
        wordCount,
      },
    })

    // Run anti-AI analysis asynchronously
    analyzeWritingSession(writingSessionId).catch(err => {
      console.error('Analysis failed:', err)
    })

    // Also run AI Grading asynchronously
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
      const prompt = `
        Anda adalah asisten guru yang ahli. Tugas Anda adalah menilai tugas esai siswa berikut.
        
        Judul Tugas: ${assignment?.title}
        Instruksi: ${assignment?.instructions}
        
        Jawaban Esai Siswa:
        ${sanitized}
        
        Berikan evaluasi Anda dalam format JSON berikut (tanpa markdown backticks):
        {
          "score": <angka_0_sampai_100>,
          "reasoning": "<penjelasan_singkat_mengapa_mendapat_nilai_tersebut>"
        }
      `
      
      model.generateContent(prompt).then(async (result: any) => {
        const responseText = result.response.text()
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0])
          await prisma.writingSession.update({
            where: { id: writingSessionId },
            data: {
              aiRecommendedScore: aiResult.score,
              aiScoreReasoning: aiResult.reasoning
            }
          })
        }
      }).catch((aiErr: any) => console.error('AI Essay Grading failed:', aiErr))
    } catch (e) {
      console.error('Failed to trigger AI Grading:', e)
    }

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
