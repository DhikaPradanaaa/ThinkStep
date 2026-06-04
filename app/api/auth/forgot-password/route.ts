import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { sendResetPasswordEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ message: 'Jika email terdaftar, instruksi reset telah dikirim.' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const emailSent = await sendResetPasswordEmail(user.email, resetUrl)

    if (!emailSent) {
      return NextResponse.json({ error: 'Gagal mengirim email reset. Silakan coba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Jika email terdaftar, instruksi reset telah dikirim.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}
