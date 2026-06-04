import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  try {
    const info = await transporter.sendMail({
      from: `"ThinkStep AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset Password Akun ThinkStep Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Reset Password</h2>
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset password akun ThinkStep Anda. Klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password Sekarang</a>
          </div>
          <p>Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Jika Anda tidak meminta reset password, abaikan email ini. Link ini akan kedaluwarsa dalam 1 jam.
          </p>
        </div>
      `,
    })
    console.log('Reset email sent: %s', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending reset email:', error)
    return false
  }
}
