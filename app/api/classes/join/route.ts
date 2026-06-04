import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'STUDENT') return NextResponse.json({ error: 'Hanya siswa yang dapat bergabung ke kelas' }, { status: 403 })

    const body = await req.json()
    const { code } = body

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Kode kelas harus diisi' }, { status: 400 })
    }

    const targetClass = await prisma.class.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { students: { select: { id: true } } }
    })

    if (!targetClass) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan. Periksa kembali kode Anda.' }, { status: 404 })
    }

    // Cek apakah sudah bergabung
    const alreadyJoined = targetClass.students.some(s => s.id === user.id)
    if (alreadyJoined) {
      return NextResponse.json({ error: 'Anda sudah bergabung di kelas ini' }, { status: 400 })
    }

    // Tambahkan siswa ke kelas
    await prisma.class.update({
      where: { id: targetClass.id },
      data: {
        students: {
          connect: { id: user.id }
        }
      }
    })

    return NextResponse.json({ message: `Berhasil bergabung dengan kelas ${targetClass.name}!` })
  } catch (error) {
    console.error('Failed to join class:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
