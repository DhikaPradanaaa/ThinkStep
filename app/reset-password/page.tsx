'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!token) {
      setStatus('error')
      setMessage('Token reset tidak ditemukan. Silakan minta link reset yang baru.')
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Password tidak cocok!')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      setStatus('success')
      setMessage('Password Anda berhasil diubah! Anda sekarang bisa login.')
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  if (!token && status === 'idle') {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="text-danger-main mx-auto mb-4" />
        <h2 className="text-lg font-bold text-text-primary mb-2">Link Tidak Valid</h2>
        <p className="text-sm text-text-secondary mb-6">Link reset password tidak valid atau tidak lengkap.</p>
        <Link href="/forgot-password">
          <button className="btn-primary w-full py-3">
            Minta Link Baru
          </button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {status === 'success' ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-success-main/20">
            <CheckCircle2 size={32} className="text-success-main" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Password Berhasil Diubah!</h2>
          <p className="text-sm text-text-secondary mb-6">{message}</p>
          <Link href="/login">
            <button className="btn-primary w-full py-3">
              Pergi ke Halaman Login
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {status === 'error' && (
            <div className="bg-danger-light text-danger-dark border border-danger-main/30 rounded-xl p-4 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Password Baru
            </label>
            <input
              type="password"
              className="input-base"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              className="input-base"
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3.5 mt-2"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <Loader2 size={20} className="animate-spin mx-auto" />
            ) : (
              'Simpan Password Baru'
            )}
          </button>
        </form>
      )}
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md scale-in relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 justify-center mb-3 group hover:opacity-90 transition-opacity">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-ink-900 shadow-md flex items-center justify-center mb-2 overflow-hidden relative">
              <Image src="/logo-light.png" alt="ThinkStep Logo" fill className="object-cover dark:hidden" />
              <Image src="/logo-dark.png" alt="ThinkStep Logo" fill className="object-cover hidden dark:block" />
            </div>
            <span className="font-bold text-2xl text-text-primary tracking-tight font-display">
              ThinkStep
            </span>
          </Link>
          <h1 className="text-xl font-bold text-text-primary mb-2">Atur Ulang Password</h1>
          <p className="text-text-secondary text-sm font-medium">
            Silakan masukkan password baru untuk akun Anda.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 size={32} className="animate-spin text-brand-main" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center mt-8 text-sm text-text-muted">
          <Link href="/login" className="font-semibold text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  )
}
