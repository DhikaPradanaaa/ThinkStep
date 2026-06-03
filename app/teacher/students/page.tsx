import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import StudentTable from '@/components/teacher/StudentTable'
import SessionTimeline from '@/components/teacher/SessionTimeline'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TeacherStudentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  let students: any[] = []
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const dbStudents = await prisma.user.findMany({
      where: { role: 'STUDENT', schoolId: user.schoolId || 'no-school' },
      include: {
        userStats: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
      },
    })

    students = dbStudents.map(s => {
      const recentSessions = s.sessions.filter(sess => sess.startedAt >= thirtyDaysAgo)
      const avgHints = recentSessions.length > 0
        ? recentSessions.reduce((sum, sess) => sum + (sess.hintsUsed ?? 0), 0) / recentSessions.length
        : 0
      const noHintCount = recentSessions.filter(sess => (sess.hintsUsed ?? 0) === 0).length
      const noHintPct = recentSessions.length > 0 ? Math.round((noHintCount / recentSessions.length) * 100) : 0
      const autonomy = s.userStats?.autonomyIndex ?? 50

      return {
        id: s.id, name: s.name,
        gradeLevel: s.gradeLevel ?? 'Kelas 8',
        totalSessions: recentSessions.length,
        avgHintsUsed: Math.round(avgHints * 10) / 10,
        noHintPercent: noHintPct,
        autonomyIndex: autonomy,
        lastActive: recentSessions[0]?.startedAt ? 'Baru-baru ini' : 'Belum aktif',
        needsHelp: autonomy < 35,
      }
    })
  } catch (e) {
    console.error('DB fallback:', e)
  }

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor="#059669">
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Daftar Siswa
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Pantau perkembangan dan indeks kemandirian setiap siswa
            </p>
          </div>
          <Link href="/teacher/dashboard">
            <button className="btn-ghost">← Kembali ke Dashboard</button>
          </Link>
        </div>

        <StudentTable students={students.length > 0 ? students : undefined} />
      </div>
    </AppLayout>
  )
}
