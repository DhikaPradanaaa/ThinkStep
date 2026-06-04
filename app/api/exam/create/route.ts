import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, durationMins, targetGrade, questionIds, classId } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Judul ujian harus diisi' }, { status: 400 })
  if (!targetGrade) return NextResponse.json({ error: 'Kelas target harus dipilih' }, { status: 400 })
  if (!questionIds || questionIds.length === 0) return NextResponse.json({ error: 'Pilih minimal 1 soal' }, { status: 400 })

  try {
    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        durationMins: durationMins || 60,
        targetGrade,
        schoolId: user.schoolId || 'no-school',
        classId: classId || null,
        createdById: user.id,
        isActive: true,
        questions: {
          create: questionIds.map((qId: string, idx: number) => ({
            questionId: qId,
            order: idx + 1,
          })),
        },
      },
    })

    return NextResponse.json({ examId: exam.id, message: 'Ujian berhasil dibuat' })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json({ error: 'Gagal membuat ujian' }, { status: 500 })
  }
}
