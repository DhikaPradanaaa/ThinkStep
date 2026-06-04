import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// SECURITY: Simple HTML entity escaper to prevent HTML injection in emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// SECURITY: Validate email format server-side
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    // SECURITY: Validate presence and types
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // SECURITY: Strict length limits to prevent abuse and email header injection
    if (typeof name !== 'string' || name.length > 100) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if (typeof email !== 'string' || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    // SECURITY: Sanitize all user input before interpolating into HTML/email headers
    const safeName = escapeHtml(name.trim())
    const safeEmail = escapeHtml(email.trim().toLowerCase())
    const safeMessage = escapeHtml(message.trim())

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: `"ThinkStep Feedback" <${process.env.EMAIL_USER}>`,
      to: 'thinkstepai@gmail.com',
      // SECURITY: replyTo uses sanitized email, subject uses safeName (no HTML)
      replyTo: safeEmail,
      subject: `Tinjauan Baru dari ${safeName} - ThinkStep`,
      // SECURITY: plain text version always included
      text: `Nama: ${safeName}\nEmail: ${safeEmail}\n\nPesan:\n${safeMessage}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Tinjauan Pengguna Baru</h2>
          <p><strong>Nama:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, message: 'Pesan berhasil dikirim' })
  } catch (error) {
    // SECURITY: Never leak internal error details to the client
    console.error('Error sending contact email:', error)
    return NextResponse.json({ error: 'Gagal mengirim pesan. Silakan coba lagi.' }, { status: 500 })
  }
}
