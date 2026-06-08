'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GraduationCap, Presentation, Users, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

type Role = 'STUDENT' | 'TEACHER' | 'PARENT'

const GRADE_LEVELS = [
  'Kelas 7', 'Kelas 8', 'Kelas 9',
  'Kelas 10', 'Kelas 11', 'Kelas 12',
]

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [role, setRole] = useState<Role>('STUDENT')
  const [gradeLevel, setGradeLevel] = useState('Kelas 7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const isComplete = (session.user as any).onboardingCompleted
      if (isComplete === true) {
        const role = (session.user as any).role
        if (role === 'TEACHER') router.push('/teacher/dashboard')
        else if (role === 'PARENT') router.push('/parent/dashboard')
        else router.push('/student/dashboard')
      }
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session, router])

  const roleOptions: { value: Role; label: string; desc: string; Icon: any }[] = [
    { value: 'STUDENT', label: 'Siswa', desc: 'Belajar & latihan soal', Icon: GraduationCap },
    { value: 'TEACHER', label: 'Guru', desc: 'Kelola soal & tugas', Icon: Presentation },
    { value: 'PARENT', label: 'Orang Tua', desc: 'Pantau perkembangan', Icon: Users },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, gradeLevel: role === 'STUDENT' ? gradeLevel : undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan')
        setLoading(false)
        return
      }

      // Profile complete, update session token and redirect
      await update({ role, gradeLevel: role === 'STUDENT' ? gradeLevel : undefined })
      
      // We do a hard redirect to ensure session is refreshed in server components too
      window.location.href = role === 'TEACHER' ? '/teacher/dashboard' : role === 'PARENT' ? '/parent/dashboard' : '/student/dashboard'
    } catch (err) {
      setError('Terjadi kesalahan jaringan')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg scale-in relative z-10 glass-panel rounded-3xl p-8 sm:p-10">
        <h1 className="text-heading-md text-text-primary mb-2 font-display text-center">
          Lengkapi Profil Anda
        </h1>
        <p className="text-text-secondary text-sm font-medium mb-8 text-center">
          Pilih peran Anda untuk melanjutkan ke aplikasi
        </p>

        {error && (
          <div className="bg-danger-light text-danger-dark border border-danger-main/30 rounded-xl p-4 mb-6 text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="font-medium leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Saya adalah
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roleOptions.map(({ value, label, desc, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
                    role === value
                      ? 'border-brand-main bg-brand-main text-brand-text shadow-lg'
                      : 'border-border bg-surface text-text-secondary hover:border-ink-400 hover:bg-surface-alt'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-sm font-bold">{label}</span>
                  <span className={`text-xs font-medium leading-tight hidden sm:block ${role === value ? 'text-ink-300' : 'text-text-muted'}`}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {role === 'STUDENT' && (
            <div className="animate-fade-in">
              <label htmlFor="gradeLevel" className="block text-sm font-semibold text-text-primary mb-2">
                Kelas
              </label>
              <select
                id="gradeLevel"
                name="gradeLevel"
                className="input-base cursor-pointer"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3.5 mt-4 text-base shadow-lg shadow-brand-main/20 group"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Selesai & Masuk
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
