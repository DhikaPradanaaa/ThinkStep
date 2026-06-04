'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      setStatus('success')
      setMessage(data.message)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

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
          <h1 className="text-xl font-bold text-text-primary mb-2">Lupa Password?</h1>
          <p className="text-text-secondary text-sm font-medium">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mengatur ulang password.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-success-main/20">
                <CheckCircle2 size={32} className="text-success-main" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-2">Email Terkirim!</h2>
              <p className="text-sm text-text-secondary mb-6">{message}</p>
              <Link href="/login">
                <button className="btn-primary w-full py-3">
                  Kembali ke Login
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
                  Email Akun Anda
                </label>
                <input
                  type="email"
                  className="input-base"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  'Kirim Link Reset'
                )}
              </button>
            </form>
          )}
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
