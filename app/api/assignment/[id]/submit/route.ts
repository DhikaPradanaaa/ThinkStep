import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: assignmentId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { content, fileUrls } = body

  if (!content && (!fileUrls || fileUrls.length === 0)) {
    return NextResponse.json({ error: 'Kirim setidaknya teks jawaban atau satu file lampiran' }, { status: 400 })
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 })
    }

    if (new Date(assignment.deadline) < new Date()) {
      return NextResponse.json({ error: 'Tenggat waktu tugas sudah lewat' }, { status: 400 })
    }

    // Upsert writing session for this submission
    const writingSession = await prisma.writingSession.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
      update: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionContent: content || '',
        submissionFileUrls: JSON.stringify(fileUrls || []),
      },
      create: {
        assignmentId,
        studentId: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionContent: content || '',
        submissionFileUrls: JSON.stringify(fileUrls || []),
      }
    })

    // Update corresponding task status to DONE
    await prisma.task.updateMany({
      where: {
        userId: user.id,
        title: `Tugas: ${assignment.title}`
      },
      data: {
        status: 'DONE'
      }
    })

    // Trigger async AI analysis
    if (assignment.assignmentType === 'GENERAL' && (content || fileUrls?.length > 0)) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
        const prompt = `
          Anda adalah asisten guru yang ahli. Tugas Anda adalah menilai tugas siswa berikut.
          
          Judul Tugas: ${assignment.title}
          Instruksi: ${assignment.instructions}
          
          Jawaban Siswa (Teks):
          ${content || '(Tidak ada teks, hanya lampiran)'}
          
          Lampiran File:
          ${fileUrls && fileUrls.length > 0 ? fileUrls.join(', ') : '(Tidak ada lampiran)'}
          
          Berikan evaluasi Anda dalam format JSON berikut (tanpa markdown backticks):
          {
            "score": <angka_0_sampai_100>,
            "reasoning": "<penjelasan_singkat_mengapa_mendapat_nilai_tersebut>"
          }
        `
        
        // We do not await this to avoid blocking the response, but Next.js might kill it.
        // For a robust setup, we should use a background job. Here we await it.
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        
        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0])
          
          await prisma.writingSession.update({
            where: { id: writingSession.id },
            data: {
              aiRecommendedScore: aiResult.score,
              aiScoreReasoning: aiResult.reasoning
            }
          })
        }
      } catch (aiError) {
        console.error('AI Grading failed:', aiError)
      }
    }

    return NextResponse.json({ success: true, writingSession })
  } catch (error) {
    console.error('Submit assignment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
