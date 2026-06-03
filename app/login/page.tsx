'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Brain, GraduationCap, Presentation, ArrowRight, AlertCircle, Loader2, CheckCircle2, UserPlus } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setJustRegistered(true)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah. Coba lagi!')
      } else {
        const res = await fetch('/api/auth/session')
        const session = await res.json()
        const role = session?.user?.role

        if (role === 'TEACHER') router.push('/teacher/dashboard')
        else if (role === 'PARENT') router.push('/parent/dashboard')
        else router.push('/student/dashboard')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(type: 'student' | 'teacher') {
    if (type === 'student') {
      setEmail('andi@thinkstep.demo')
      setPassword('demo123')
    } else {
      setEmail('guru@thinkstep.demo')
      setPassword('demo123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 justify-center mb-3 group hover:opacity-90 transition-opacity">
            <div className="w-12 h-12 rounded-2xl bg-ink-900 text-white flex items-center justify-center shadow-xl shadow-ink-900/20 group-hover:scale-105 transition-transform duration-300">
              <Brain size={28} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl text-ink-900 tracking-tight font-display">
              ThinkStep
            </span>
          </Link>
          <p className="text-text-secondary text-sm font-medium">
            Masuk untuk mulai belajar bersama Lumina AI
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative">

          {/* Banner registrasi berhasil */}
          {justRegistered && (
            <div className="bg-success-light text-success-dark border border-success-main/30 rounded-xl p-4 mb-6 text-sm flex items-start gap-3">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-success-main" />
              <p className="font-medium leading-tight">
                Akun berhasil dibuat! Silakan login dengan email dan password Anda.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-danger-light text-danger-dark border border-danger-main/30 rounded-xl p-4 mb-6 text-sm flex items-start gap-3 animate-pulse">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary w-full py-3.5 mt-2 text-base shadow-lg shadow-brand-main/20 group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Masuk Aplikasi
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link Daftar */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted mb-3">Belum punya akun?</p>
            <Link href="/register">
              <button
                id="goto-register"
                className="btn-secondary w-full py-3 gap-2 font-semibold hover:border-ink-400 group"
              >
                <UserPlus size={16} className="text-ink-600 group-hover:text-ink-900 transition-colors" />
                Daftar Akun Baru
              </button>
            </Link>
          </div>

          {/* Demo Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[11px] font-bold text-text-muted mb-4 text-center uppercase tracking-widest">
              Coba Akun Demo
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="demo-student"
                type="button"
                className="btn-secondary py-2.5 px-3 flex-col gap-1 h-auto text-xs font-semibold hover:border-ink-400 group"
                onClick={() => fillDemo('student')}
              >
                <GraduationCap size={20} className="text-ink-600 group-hover:text-ink-900 transition-colors" />
                Demo Siswa
              </button>
              <button
                id="demo-teacher"
                type="button"
                className="btn-secondary py-2.5 px-3 flex-col gap-1 h-auto text-xs font-semibold hover:border-ink-400 group"
                onClick={() => fillDemo('teacher')}
              >
                <Presentation size={20} className="text-ink-600 group-hover:text-ink-900 transition-colors" />
                Demo Guru
              </button>
            </div>
            <p className="text-xs font-medium text-text-muted text-center mt-4">
              Password: <span className="font-mono bg-ink-100 px-1.5 py-0.5 rounded text-ink-700">demo123</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-text-muted">
          <Link href="/" className="font-semibold text-text-secondary hover:text-ink-900 transition-colors inline-flex items-center gap-1">
            ← Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-ink-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
