import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import OverviewCards from '@/components/teacher/OverviewCards'
import HintDistributionChart from '@/components/teacher/HintDistributionChart'
import TopicHeatmap from '@/components/teacher/TopicHeatmap'
import StudentTable from '@/components/teacher/StudentTable'
import GenerateDailyQuestionsButton from '@/components/teacher/GenerateDailyQuestionsButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if ((session.user as any).onboardingCompleted === false) {
    redirect('/onboarding')
  }

  const user = session.user as any
  if (user.role === 'STUDENT') redirect('/student/dashboard')
  if (user.role === 'PARENT') redirect('/parent/dashboard')

  // Fetch real data with fallback
  let students: any[] = []
  let sessions30Days = 0
  let totalHints = 0
  let noHintSessions = 0

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const dbSessions = await prisma.learningSession.findMany({
      where: {
        startedAt: { gte: thirtyDaysAgo },
        user: { schoolId: user.schoolId || 'no-school', role: 'STUDENT' },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    })

    sessions30Days = dbSessions.length
    totalHints = dbSessions.reduce((sum, s) => sum + (s.hintsUsed ?? 0), 0)
    noHintSessions = dbSessions.filter(s => (s.hintsUsed ?? 0) === 0).length

    const dbStudents = await prisma.user.findMany({
      where: { role: 'STUDENT', schoolId: user.schoolId || 'no-school' },
      include: {
        userStats: true,
        sessions: {
          where: { startedAt: { gte: thirtyDaysAgo } },
        },
      },
    })

    students = dbStudents.map(s => {
      const studentSessions = s.sessions
      const avgHints = studentSessions.length > 0
        ? studentSessions.reduce((sum, sess) => sum + (sess.hintsUsed ?? 0), 0) / studentSessions.length
        : 0
      const noHintCount = studentSessions.filter(sess => (sess.hintsUsed ?? 0) === 0).length
      const noHintPct = studentSessions.length > 0 ? Math.round((noHintCount / studentSessions.length) * 100) : 0
      const autonomy = s.userStats?.autonomyIndex ?? 50

      return {
        id: s.id,
        name: s.name,
        gradeLevel: s.gradeLevel ?? 'Kelas 8',
        totalSessions: studentSessions.length,
        avgHintsUsed: Math.round(avgHints * 10) / 10,
        noHintPercent: noHintPct,
        autonomyIndex: autonomy,
        lastActive: studentSessions[0]?.startedAt ? 'Aktif baru-baru ini' : 'Belum aktif',
        needsHelp: autonomy < 35 || (s.userStats?.predictedScore !== null && s.userStats!.predictedScore < 60),
        aiCluster: s.userStats?.aiCluster ?? '-',
        predictedScore: s.userStats?.predictedScore ?? null,
      }
    })
  } catch (error) {
    // Use demo data if DB fails
    console.error('DB error, using demo data:', error)
  }

  const activeStudents = students.filter(s => s.totalSessions > 0).length
  const avgHints = sessions30Days > 0 ? Math.round((totalHints / sessions30Days) * 10) / 10 : 0
  const noHintPercent = sessions30Days > 0 ? Math.round((noHintSessions / sessions30Days) * 100) : 0
  const needsHelp = students.filter(s => s.needsHelp).length

  const avatarColor = '#059669'
  const userName = user.name || 'Guru'

  return (
    <AppLayout role="TEACHER" userName={userName} avatarColor={avatarColor}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">

        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Dashboard Analitik
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Pantau perkembangan kemandirian belajar siswa Anda
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <GenerateDailyQuestionsButton />
            <Link href="/teacher/exam/new" className="btn-secondary text-sm px-4 py-2">
              📋 Buat Ujian
            </Link>
            <Link href="/teacher/assignments/new" className="btn-primary text-sm px-4 py-2">
              + Tugas Baru
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-6">
          <OverviewCards
            activeStudents={activeStudents}
            avgHints={avgHints}
            noHintPercent={noHintPercent}
            needsHelp={needsHelp}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HintDistributionChart />
          
          {/* AI Early Warning Panel */}
          <div className="card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-sm">Siswa Berisiko (AI XGBoost) ⚠️</h2>
            </div>
            {students.filter(s => s.predictedScore !== null && s.predictedScore < 60).length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-surface/50 rounded-xl border border-dashed border-ink-200">
                <p className="text-sm text-text-muted">Tidak ada siswa berisiko terdeteksi.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {students.filter(s => s.predictedScore !== null && s.predictedScore < 60).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100">
                    <div>
                      <p className="text-sm font-bold text-red-900">{s.name}</p>
                      <p className="text-xs text-red-700">Cluster: {s.aiCluster}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-red-800">Prediksi Skor</p>
                      <p className="text-lg font-bold text-red-600">{s.predictedScore}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { icon: '👥', label: 'Daftar Siswa', desc: 'Lihat semua siswa & detail', href: '/teacher/students', color: '#059669', bg: '#ECFDF5' },
            { icon: '📚', label: 'Bank Soal', desc: 'Kelola & tambah soal', href: '/teacher/question-bank', color: '#3B82F6', bg: '#EFF6FF' },
            { icon: '📝', label: 'Tugas', desc: 'Tugas aktif & submission', href: '/teacher/assignments', color: '#7C3AED', bg: '#F5F3FF' },
          ].map(action => (
            <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
              <div className="card hover-lift" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {action.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{action.label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{action.desc}</p>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '14px' }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Student Table */}
        <StudentTable students={students} />
      </div>
    </AppLayout>
  )
}
