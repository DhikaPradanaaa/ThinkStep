import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    subject, topic, subtopic, gradeLevel, phase, difficulty, type,
    content, correctAnswer, explanation,
    hintTier1, hintTier2, hintTier3,
  } = body

  if (!subject || !topic || !gradeLevel || !content || !explanation || !hintTier1 || !hintTier2 || !hintTier3) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const question = await prisma.question.create({
      data: {
        subject,
        topic,
        subtopic: subtopic || null,
        gradeLevel,
        phase,
        difficulty: difficulty as any,
        type: type as any,
        content,
        correctAnswer: correctAnswer || null,
        explanation,
        hintTier1,
        hintTier2,
        hintTier3,
        createdById: user.id,
        isPublic: true,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Failed to create question:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
