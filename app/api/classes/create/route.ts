import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper to generate a 6-character random alphanumeric string
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama kelas harus diisi' }, { status: 400 })
    }

    // Generate unique code
    let code = generateJoinCode()
    let isUnique = false
    while (!isUnique) {
      const existing = await prisma.class.findUnique({ where: { code } })
      if (!existing) isUnique = true
      else code = generateJoinCode()
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        code,
        teacherId: user.id,
        schoolId: user.schoolId || null,
      }
    })

    return NextResponse.json({ class: newClass, message: 'Kelas berhasil dibuat!' })
  } catch (error) {
    console.error('Failed to create class:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
