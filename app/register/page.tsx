'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, AlertCircle, Loader2, CheckCircle2,
  Eye, EyeOff, GraduationCap, Presentation, Users,
} from 'lucide-react'

type Role = 'STUDENT' | 'TEACHER' | 'PARENT'

const GRADE_LEVELS = [
  'Kelas 7', 'Kelas 8', 'Kelas 9',
  'Kelas 10', 'Kelas 11', 'Kelas 12',
]

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Sangat Lemah', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Lemah', color: 'bg-orange-400' }
  if (score === 3) return { score, label: 'Cukup', color: 'bg-yellow-400' }
  if (score === 4) return { score, label: 'Kuat', color: 'bg-blue-500' }
  return { score, label: 'Sangat Kuat', color: 'bg-emerald-500' }
}

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as Role,
    gradeLevel: 'Kelas 7',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = getPasswordStrength(form.password)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function setRole(role: Role) {
    setForm(prev => ({ ...prev, role }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validasi
    if (form.name.trim().length < 3) {
      setError('Nama minimal 3 karakter.')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan.')
        return
      }

      setSuccess(true)
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.push('/login?registered=1')
      }, 2000)
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions: { value: Role; label: string; desc: string; Icon: any }[] = [
    { value: 'STUDENT', label: 'Siswa', desc: 'Belajar & latihan soal', Icon: GraduationCap },
    { value: 'TEACHER', label: 'Guru', desc: 'Kelola soal & tugas', Icon: Presentation },
    { value: 'PARENT', label: 'Orang Tua', desc: 'Pantau perkembangan', Icon: Users },
  ]

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />
        <div className="text-center scale-in relative z-10">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-heading-lg text-text-primary mb-3">Akun Berhasil Dibuat! 🎉</h1>
          <p className="text-text-secondary text-base mb-2">
            Selamat datang di ThinkStep, <strong>{form.name.split(' ')[0]}</strong>!
          </p>
          <p className="text-text-muted text-sm">Mengalihkan ke halaman login...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 size={20} className="animate-spin text-ink-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg scale-in relative z-10">
        {/* Logo */}
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
          <p className="text-text-secondary text-sm font-medium">
            Buat akun baru untuk mulai belajar
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative">
          <h2 className="text-heading-md text-text-primary mb-6 font-display">Daftar Akun</h2>

          {error && (
            <div className="bg-danger-light text-danger-dark border border-danger-main/30 rounded-xl p-4 mb-6 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Pilih Role */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Saya adalah
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
                      form.role === value
                        ? 'border-brand-main bg-brand-main text-brand-text shadow-lg'
                        : 'border-border bg-surface text-text-secondary hover:border-ink-400 hover:bg-surface-alt'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-bold">{label}</span>
                    <span className={`text-[10px] font-medium leading-tight ${form.role === value ? 'text-ink-300' : 'text-text-muted'}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-2">
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input-base"
                placeholder="cth. Andi Kusuma"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            {/* Grade Level untuk Siswa */}
            {form.role === 'STUDENT' && (
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-semibold text-text-primary mb-2">
                  Kelas
                </label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  className="input-base cursor-pointer"
                  value={form.gradeLevel}
                  onChange={handleChange}
                >
                  {GRADE_LEVELS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-base"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-base pr-12"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-ink-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">
                    Kekuatan: <span className="font-semibold text-text-secondary">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-primary mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className={`input-base pr-12 ${
                    form.confirmPassword.length > 0 && form.password !== form.confirmPassword
                      ? 'border-danger-main ring-2 ring-danger-main/20'
                      : form.confirmPassword.length > 0 && form.password === form.confirmPassword
                      ? 'border-success-main ring-2 ring-success-main/20'
                      : ''
                  }`}
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                <p className="text-xs text-danger-main mt-1 font-medium">Password tidak cocok</p>
              )}
              {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                <p className="text-xs text-success-main mt-1 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Password cocok
                </p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn-primary w-full py-3.5 mt-2 text-base shadow-lg shadow-brand-main/20 group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Buat Akun
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link ke Login */}
          <p className="text-center mt-6 text-sm text-text-muted">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-ink-800 hover:text-text-primary transition-colors underline underline-offset-2">
              Masuk di sini
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-text-muted">
          <Link href="/" className="font-semibold text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1">
            ← Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
