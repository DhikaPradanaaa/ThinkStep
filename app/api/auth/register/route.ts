import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, confirmPassword, role, gradeLevel } = body

    // ── Validasi field wajib ──
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi.' },
        { status: 400 }
      )
    }

    // ── Validasi nama ──
    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nama minimal 3 karakter.' },
        { status: 400 }
      )
    }

    // ── Validasi format email ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    // ── Validasi password ──
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password dan konfirmasi password tidak cocok.' },
        { status: 400 }
      )
    }

    // ── Cek email sudah terdaftar ──
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 409 }
      )
    }

    // ── Hash password ──
    const passwordHash = await bcrypt.hash(password, 12)

    // ── Tentukan role ──
    const validRoles = ['STUDENT', 'TEACHER', 'PARENT']
    const userRole = validRoles.includes(role) ? role : 'STUDENT'

    // ── Buat user + UserStats dalam satu transaksi ──
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: userRole,
          gradeLevel: userRole === 'STUDENT' ? (gradeLevel || 'Kelas 7') : null,
          avatarColor: generateAvatarColor(name),
        },
      })

      // Buat UserStats untuk siswa
      if (userRole === 'STUDENT') {
        await tx.userStats.create({
          data: { userId: newUser.id },
        })
      }

      return newUser
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Akun berhasil dibuat! Silakan login.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}

// ── Helper: generate warna avatar dari nama ──
function generateAvatarColor(name: string): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
    '#F59E0B', '#EF4444', '#06B6D4', '#84CC16',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
