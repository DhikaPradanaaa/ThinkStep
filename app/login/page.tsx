'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap, Presentation, ArrowRight, AlertCircle, Loader2, CheckCircle2, UserPlus } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setJustRegistered(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const isComplete = (session.user as any).onboardingCompleted
      if (isComplete === false) {
        router.push('/onboarding')
        return
      }
      
      const role = (session.user as any).role
      if (role === 'TEACHER') router.push('/teacher/dashboard')
      else if (role === 'PARENT') router.push('/parent/dashboard')
      else router.push('/student/dashboard')
    }
  }, [status, session, router])

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

  function fillDemo(type: 'student' | 'teacher' | 'parent') {
    if (type === 'student') {
      setEmail('andi@thinkstep.demo')
      setPassword('demo123')
    } else if (type === 'teacher') {
      setEmail('guru@thinkstep.demo')
      setPassword('demo123')
    } else {
      setEmail('ortu@thinkstep.demo')
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
          <div className="flex flex-col items-center justify-center text-center space-y-3 slide-up">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-ink-900 shadow-md flex items-center justify-center mb-2 overflow-hidden relative">
              <Image src="/logo-baru.png" alt="ThinkStep Logo" fill className="object-cover dark:invert" />
            </div>
            <h1 className="text-display-sm font-bold text-text-primary">Selamat Datang Kembali</h1>
          </div>
          <p className="text-text-secondary text-sm font-medium mt-3">
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
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs font-semibold text-brand-main hover:text-brand-dark transition-colors">
                  Lupa Password?
                </Link>
              </div>
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

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border text-xs font-medium text-text-muted uppercase tracking-wider">
              Atau
            </div>
            <button
              onClick={() => signIn('google')}
              type="button"
              className="btn-secondary w-full py-3 gap-2 font-semibold hover:border-ink-400 group flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </button>
          </div>

          {/* Link Daftar */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted mb-3">Belum punya akun?</p>
            <Link href="/register">
              <button
                id="goto-register"
                className="btn-secondary w-full py-3 gap-2 font-semibold hover:border-ink-400 group"
              >
                <UserPlus size={16} className="text-ink-600 group-hover:text-text-primary transition-colors" />
                Daftar Akun Baru
              </button>
            </Link>
          </div>

          {/* Demo Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[11px] font-bold text-text-muted mb-4 text-center uppercase tracking-widest">
              Coba Akun Demo
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="demo-student"
                type="button"
                className="btn-secondary py-2.5 px-3 flex-col gap-1 h-auto text-[10px] font-semibold hover:border-ink-400 group"
                onClick={() => fillDemo('student')}
              >
                <GraduationCap size={20} className="text-ink-600 group-hover:text-text-primary transition-colors" />
                Demo Siswa
              </button>
              <button
                id="demo-teacher"
                type="button"
                className="btn-secondary py-2.5 px-3 flex-col gap-1 h-auto text-[10px] font-semibold hover:border-ink-400 group"
                onClick={() => fillDemo('teacher')}
              >
                <Presentation size={20} className="text-ink-600 group-hover:text-text-primary transition-colors" />
                Demo Guru
              </button>
              <button
                id="demo-parent"
                type="button"
                className="btn-secondary py-2.5 px-3 flex-col gap-1 h-auto text-[10px] font-semibold hover:border-ink-400 group"
                onClick={() => fillDemo('parent')}
              >
                <UserPlus size={20} className="text-ink-600 group-hover:text-text-primary transition-colors" />
                Demo Ortu
              </button>
            </div>
            <p className="text-xs font-medium text-text-muted text-center mt-4">
              Password: <span className="font-mono bg-ink-100 px-1.5 py-0.5 rounded text-ink-700">demo123</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-text-muted">
          <Link href="/" className="font-semibold text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1">
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
