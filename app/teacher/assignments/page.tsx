import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TeacherAssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  let assignments: any[] = []

  try {
    assignments = await prisma.assignment.findMany({
      where: { schoolId: user.schoolId || 'no-school' }, // or createdById
      include: {
        _count: {
          select: { writingSessions: true },
        },
        writingSessions: {
          where: { status: 'SUBMITTED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (e) {
    console.error('Failed to fetch assignments:', e)
  }

  const getStatus = (deadline: Date) => {
    if (new Date(deadline) < new Date()) {
      return <span className="badge-base autonomy-low">Selesai</span>
    }
    return <span className="badge-base autonomy-very-high">Aktif</span>
  }

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Manajemen Tugas
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Kelola tugas essay dan pantau pengumpulan siswa
            </p>
          </div>
          <Link href="/teacher/assignments/new">
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>➕</span> Buat Tugas Baru
            </button>
          </Link>
        </div>

        {/* Assignments Grid */}
        {assignments.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {assignments.map(a => (
              <div key={a.id} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{a.title}</h3>
                    {getStatus(a.deadline)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      📝 Kelas {a.targetGrade}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      ⏱️ {a.maxDurationMins} Menit
                    </span>
                    {a.minWordCount && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        ✍️ Min. {a.minWordCount} kata
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.instructions}
                  </p>
                </div>
                
                <div style={{ padding: '1rem 1.5rem', background: 'var(--color-surface-alt)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{a.writingSessions.length}</strong> / {a._count.writingSessions || 0} Terkumpul
                  </div>
                  <Link href={`/teacher/assignments/${a.id}/submissions`}>
                    <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                      Lihat Hasil
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h3 className="text-heading-md" style={{ marginBottom: '0.5rem' }}>Belum ada tugas</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Buat tugas pertama Anda untuk mulai menguji kemampuan menulis siswa.
            </p>
            <Link href="/teacher/assignments/new">
              <button className="btn-primary">Buat Tugas Baru</button>
            </Link>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
