import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 })
    }

    const parentId = (session.user as any).id

    // Cari student berdasarkan email
    const student = await prisma.user.findUnique({
      where: { email }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Siswa dengan email tersebut tidak ditemukan' }, { status: 404 })
    }

    // Cek apakah sudah terhubung
    const existingLink = await prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id
        }
      }
    })

    if (existingLink) {
      return NextResponse.json({ error: 'Anda sudah terhubung dengan siswa ini' }, { status: 400 })
    }

    // Buat link
    await prisma.parentStudentLink.create({
      data: {
        parentId,
        studentId: student.id
      }
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('API /parent/link-child error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
