import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'

export const dynamic = 'force-dynamic'

export default async function ParentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'PARENT') redirect('/student/dashboard')

  // BUG-004 FIX: Filter by schoolId for more relevant student data
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT', schoolId: user.schoolId ?? undefined },
    include: {
      userStats: true,
      sessions: {
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: { question: { select: { subject: true, topic: true } } }
      }
    }
  })

  return (
    <AppLayout role="PARENT" userName={user.name || 'Orang Tua'} avatarColor={user.avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)' }}>Dashboard Orang Tua</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Pantau perkembangan belajar anak Anda setiap saat.</p>
        </div>

        {student ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Student Info Card */}
            <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: student.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white' }}>
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-heading-md">{student.name}</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Siswa Kelas {student.gradeLevel || '8'}</p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Skor XP</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand-main)' }}>{student.userStats?.totalPoints || 0}</div>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Soal Diselesaikan</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success-main)' }}>{student.userStats?.totalCorrect || 0}</div>
              </div>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Indeks Kemandirian</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning-main)' }}>{student.userStats?.autonomyIndex || 0}%</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="text-heading-sm" style={{ marginBottom: '1.5rem' }}>Aktivitas Belajar Terakhir</h3>
              {student.sessions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {student.sessions.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.subject} - {s.question?.topic}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date(s.startedAt).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: s.isCorrect ? 'var(--color-success-main)' : 'var(--color-text-muted)' }}>
                          {s.isCorrect ? 'Selesai' : 'Belum Selesai'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{s.hintsUsed} Bantuan</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>Belum ada aktivitas.</p>
              )}
            </div>

          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p>Data anak belum terhubung ke akun Anda.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
