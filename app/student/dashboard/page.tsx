import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import { BADGES } from '@/lib/gamification/badges'
import { getAutonomyLabel } from '@/lib/gamification/scoring'
import JoinClassButton from '@/components/student/JoinClassButton'

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const role = (session.user as any).role
  if (role !== 'STUDENT') redirect('/teacher/dashboard')

  const schoolId = (session.user as any).schoolId as string | null
  const gradeLevel = (session.user as any).gradeLevel as string | null

  const userWithClasses = await prisma.user.findUnique({
    where: { id: userId },
    include: { joinedClasses: { select: { id: true } } }
  })
  const classIds = userWithClasses?.joinedClasses.map(c => c.id) || []

  const [stats, badges, recentSessions, assignments, activeExam, pendingTasks] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'desc' }, take: 5 }),
    prisma.learningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 3,
      include: { question: true },
    }),
    prisma.assignment.findMany({
      where: { 
        isPublished: true, 
        OR: [
          { classId: { in: classIds } },
          { classId: null, targetGrade: gradeLevel ?? 'Kelas 8' }
        ]
      },
      orderBy: { deadline: 'asc' },
      take: 3,
    }),
    // Hanya query exam jika user punya schoolId (user baru dari registrasi belum punya)
    schoolId
      ? prisma.exam.findFirst({
          where: {
            schoolId,
            isActive: true,
            OR: [
              { classId: { in: classIds } },
              { classId: null, targetGrade: gradeLevel ?? 'Kelas 8' }
            ],
            AND: [
              { endsAt: null },
              { endsAt: { gt: new Date() } },
            ],
          },
          include: { questions: true },
          orderBy: { startsAt: 'desc' },
        })
      : Promise.resolve(null),
    prisma.task.findMany({
      where: { userId, status: { not: 'DONE' } },
      orderBy: [{ priority: 'desc' }, { deadline: 'asc' }, { createdAt: 'desc' }],
      take: 4,
    }),
  ])

  // Soal Harian: hitung progress hari ini
  const today = new Date().toISOString().split('T')[0]
  let dailyProgress = { total: 0, done: 0, subjects: [] as { name: string; done: number; total: number }[] }

  if (gradeLevel) {
    const dailySets = await prisma.dailyQuestionSet.findMany({
      where: { date: today, gradeLevel },
    })

    if (dailySets.length > 0) {
      const todayStart = new Date(today)
      const doneSessions = await prisma.learningSession.findMany({
        where: { userId, isCompleted: true, startedAt: { gte: todayStart } },
        select: { questionId: true },
      })
      const doneSet = new Set(doneSessions.map(s => s.questionId).filter(Boolean))

      let totalQ = 0, doneQ = 0
      const subjects: typeof dailyProgress.subjects = []
      for (const set of dailySets) {
        const ids: string[] = JSON.parse(set.questionIds)
        const doneInSet = ids.filter(id => doneSet.has(id)).length
        totalQ += ids.length
        doneQ += doneInSet
        subjects.push({ name: set.subject, done: doneInSet, total: ids.length })
      }
      dailyProgress = { total: totalQ, done: doneQ, subjects }
    }
  }


  const autonomy = getAutonomyLabel(stats?.autonomyIndex ?? 0)
  const recentBadges = badges.map(b => ({
    ...b,
    badge: BADGES.find(bg => bg.id === b.badgeId),
  })).filter(b => b.badge)

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      {/* Premium Hero Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-hero -z-10 opacity-70 mask-image-b" />
      
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start fade-in">
          <div className="space-y-2">
            <h1 className="text-display-md text-gradient text-gradient-primary">
              Halo, {session.user.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-body-lg text-text-secondary font-medium">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <JoinClassButton />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 slide-up">
          {[
            { label: 'Total Poin', value: (stats?.totalPoints ?? 0).toLocaleString(), icon: '⭐', color: 'text-amber-500', bg: 'bg-amber-100/50' },
            { label: 'Sesi Belajar', value: stats?.totalSessions ?? 0, icon: '📖', color: 'text-blue-500', bg: 'bg-blue-100/50' },
            { label: 'Streak Hari', value: `${stats?.currentStreak ?? 0} hari`, icon: '🔥', color: 'text-rose-500', bg: 'bg-rose-100/50' },
            { label: 'Indeks Kemandirian', value: `${Math.round(stats?.autonomyIndex ?? 0)}%`, icon: '🧠', color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
          ].map((s, i) => (
            <div key={s.label} className="glass-card hover-lift p-5" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-label-sm text-text-secondary uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-display-sm text-text-primary font-bold">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center text-2xl shadow-inner`}>
                  <span className="drop-shadow-sm">{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Questions Progress Widget */}
        {dailyProgress.total > 0 && (
          <div className="glass-card p-6 slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-heading-sm">🌟 Soal Harian Hari Ini</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {dailyProgress.done} dari {dailyProgress.total} soal selesai
                </p>
              </div>
              <Link href="/student/study" className="text-sm font-semibold text-ink-600 hover:text-ink-700">
                Kerjakan →
              </Link>
            </div>

            {/* Overall progress bar */}
            <div className="w-full h-3 bg-ink-50/50 rounded-full overflow-hidden shadow-inner border border-ink-100 mb-4">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${dailyProgress.total > 0 ? Math.round((dailyProgress.done / dailyProgress.total) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>

            {/* Per-subject mini progress */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {dailyProgress.subjects.map(s => {
                const icons: Record<string, string> = { Matematika: '📐', IPA: '🔬', IPS: '🗺️', 'Bahasa Indonesia': '📖', 'Bahasa Inggris': '🌍' }
                const pct = Math.round((s.done / s.total) * 100)
                return (
                  <div key={s.name} className="text-center p-2 rounded-xl bg-white/60 border border-white/40">
                    <p className="text-xl mb-1">{icons[s.name] ?? '📚'}</p>
                    <p className="text-xs font-semibold text-ink-800 leading-tight" style={{ fontSize: '0.65rem' }}>
                      {s.name.replace('Bahasa ', 'B. ')}
                    </p>
                    <p className="text-xs font-bold mt-1" style={{ color: s.done === s.total ? '#16A34A' : '#6366f1' }}>
                      {s.done}/{s.total}
                    </p>
                  </div>
                )
              })}
            </div>

            {dailyProgress.done === dailyProgress.total && (
              <div className="mt-4 text-center p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm font-bold text-green-800">🎉 Semua soal harian selesai! Keren banget!</p>
              </div>
            )}
          </div>
        )}

        {activeExam && (
          <div className="rounded-2xl border border-danger-main bg-danger-light p-5 shadow-sm slide-up">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-label-sm font-bold uppercase text-danger-dark">Mode Ujian Aktif</p>
                <h2 className="text-heading-md text-text-primary">{activeExam.title}</h2>
                <p className="text-body-sm text-danger-dark">
                  {activeExam.questions.length} soal - AI dan petunjuk dinonaktifkan selama ujian.
                </p>
              </div>
              <Link href={`/student/exam/${activeExam.id}`} className="block outline-none">
                <button className="btn-primary min-h-[44px] bg-danger-main hover:bg-danger-dark">
                  Masuk Ujian
                </button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up" style={{ animationDelay: '200ms' }}>
          {/* Autonomy Card */}
          <div className="glass-card p-6 flex flex-col justify-between hover-lift">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-heading-sm">Indeks Kemandirian</h2>
              <span className={`badge-base shadow-sm ${autonomy.color}`}>{autonomy.label}</span>
            </div>

            <div className="relative mb-4">
              <div className="w-full h-4 bg-ink-50/50 rounded-full overflow-hidden shadow-inner border border-ink-100">
                <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden bg-gradient-to-r from-blue-500 to-emerald-400"
                     style={{ width: `${stats?.autonomyIndex ?? 0}%` }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-text-secondary font-medium">
              <span>Soal tanpa hint: <strong className="text-ink-700">{stats?.totalNoHintCorrect ?? 0}</strong> / {stats?.totalSessions ?? 0}</span>
              <span className="font-bold text-ink-700">{Math.round(stats?.autonomyIndex ?? 0)}%</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h2 className="text-heading-sm mb-4">Mulai Belajar</h2>
            <div className="flex flex-col gap-3">
              <Link href="/student/study" className="block outline-none">
                <button className="btn-primary w-full p-4 text-left flex items-center justify-between hover-glow bg-gradient-primary">
                  <span className="flex items-center gap-2 text-base"><span className="text-xl">📖</span> Latihan Soal AI</span>
                  <span>→</span>
                </button>
              </Link>
              <Link href="/student/tasks" className="block outline-none">
                <button className="btn-secondary w-full p-4 text-left flex items-center justify-between hover-lift bg-white/60">
                  <span className="flex items-center gap-2 text-base"><span className="text-xl">📋</span> Tugas Pribadi ({pendingTasks.length} pending)</span>
                  <span>→</span>
                </button>
              </Link>
              <Link href="/student/assignments" className="block outline-none">
                <button className="btn-secondary w-full p-4 text-left flex items-center justify-between hover-lift bg-white/60">
                  <span className="flex items-center gap-2 text-base"><span className="text-xl">📝</span> Tugas Sekolah ({assignments.length})</span>
                  <span>→</span>
                </button>
              </Link>
              <Link href="/student/profile" className="block outline-none">
                <button className="btn-ghost w-full p-4 text-left flex items-center gap-2 text-base hover:bg-white/50">
                  <span className="text-xl">🏆</span> Profil & Koleksi Badge
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tugas Pribadi Widget */}
        {pendingTasks.length > 0 && (
          <div className="glass-card p-6 slide-up" style={{ animationDelay: '250ms' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-heading-sm">Tugas Perlu Dikerjakan 📋</h2>
              <Link href="/student/tasks" className="text-sm font-semibold text-ink-600 hover:text-ink-700">Lihat semua &rarr;</Link>
            </div>
            <div className="flex flex-col gap-2">
              {pendingTasks.map((task) => {
                const priorityColor = task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                return (
                  <Link key={task.id} href="/student/tasks" className="block">
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-colors">
                      <span className="text-lg">{task.status === 'IN_PROGRESS' ? '⚡' : '⭕'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{task.title}</p>
                        {task.deadline && (
                          <p className={`text-xs font-medium mt-0.5 ${isOverdue ? 'text-red-600' : 'text-text-muted'}`}>
                            {isOverdue ? '⚠️ Terlambat · ' : '📅 '}
                            {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColor}`}>
                        {task.priority === 'HIGH' ? 'Tinggi' : task.priority === 'MEDIUM' ? 'Sedang' : 'Rendah'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="glass-card p-6 slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-heading-sm">Koleksi Badge Terbaru 🏅</h2>
              <Link href="/student/profile" className="text-sm font-semibold text-ink-600 hover:text-ink-700">Lihat semua &rarr;</Link>
            </div>
            <div className="flex gap-4 flex-wrap">
              {recentBadges.map(({ badge, id }) => badge && (
                <div key={id} className="badge-unlocked flex items-center gap-3 px-4 py-2.5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-full border border-amber-200/60 shadow-sm hover-lift">
                  <span className="text-2xl drop-shadow-sm">{badge.icon}</span>
                  <span className="text-sm font-bold text-amber-900">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="glass-card p-6 slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-heading-sm mb-5">Riwayat Latihan Terakhir</h2>
            <div className="flex flex-col gap-3">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${s.isCorrect ? 'bg-emerald-100' : s.isCompleted ? 'bg-rose-100' : 'bg-amber-100'}`}>
                    {s.isCorrect ? '✅' : s.isCompleted ? '❌' : '⏸️'}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-text-primary">
                      {s.question?.topic ?? s.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-700">{s.subject}</span>
                      <span className="text-xs font-medium text-text-secondary">{s.hintsUsed} hint • <strong className="text-amber-500">+{s.pointsEarned} poin</strong></span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-muted">
                    {new Date(s.startedAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
