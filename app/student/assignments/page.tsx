import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DEMO_ASSIGNMENTS = [
  {
    id: 'a1',
    title: 'Esai Dampak Media Sosial terhadap Remaja',
    instructions: 'Tuliskan esai argumentatif tentang dampak positif dan negatif media sosial pada kehidupan remaja Indonesia.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    maxDurationMins: 90,
    minWordCount: 300 as number | undefined,
    isPublished: true,
    status: 'PENDING',
    createdBy: { name: 'Bu Sari' },
  },
  {
    id: 'a2',
    title: 'Laporan Percobaan Sains: Hukum Archimedes',
    instructions: 'Berdasarkan percobaan yang dilakukan di kelas, tuliskan laporan ilmiah lengkap.',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxDurationMins: 60,
    minWordCount: 200,
    isPublished: true,
    status: 'SUBMITTED',
    createdBy: { name: 'Pak Budi' },
  },
  {
    id: 'a3',
    title: 'Analisis Cerpen "Robohnya Surau Kami"',
    instructions: 'Analisislah unsur intrinsik dan ekstrinsik cerpen tersebut.',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    maxDurationMins: 120,
    minWordCount: 400,
    isPublished: true,
    status: 'TIMED_OUT',
    createdBy: { name: 'Bu Rina' },
  },
]

function getStatusInfo(status: string, deadline: string) {
  const isExpired = new Date(deadline) < new Date()
  if (status === 'SUBMITTED') return { label: '✅ Dikumpulkan', cls: 'autonomy-very-high' }
  if (status === 'TIMED_OUT' || isExpired) return { label: '⏰ Waktu habis', cls: 'autonomy-low' }
  return { label: '📝 Belum dikerjakan', cls: 'autonomy-medium' }
}

function formatDeadline(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return `Berakhir ${Math.abs(diffDays)} hari lalu`
  if (diffDays === 0) return 'Berakhir hari ini!'
  return `${diffDays} hari lagi (${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`
}

export default async function StudentAssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as any
  if (user.role !== 'STUDENT') redirect('/teacher/dashboard')

  let assignments = DEMO_ASSIGNMENTS
  try {
    const dbAssignments = await prisma.assignment.findMany({
      where: { targetGrade: user.gradeLevel, isPublished: true },
      include: {
        createdBy: { select: { name: true } },
        writingSessions: { where: { studentId: user.id }, take: 1 },
      },
      orderBy: { deadline: 'asc' },
    })

    if (dbAssignments.length > 0) {
      assignments = dbAssignments.map(a => ({
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        deadline: a.deadline.toISOString(),
        maxDurationMins: a.maxDurationMins,
        minWordCount: a.minWordCount ?? undefined,
        isPublished: a.isPublished,
        status: a.writingSessions[0]?.status ?? 'PENDING',
        createdBy: { name: a.createdBy.name },
      }))
    }
  } catch (e) {
    console.error('DB fallback for assignments:', e)
  }

  const pending = assignments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS')
  const done = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT')

  return (
    <AppLayout role="STUDENT" userName={user.name || 'Siswa'} avatarColor={user.avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            Tugas Saya
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {pending.length} tugas belum dikerjakan
          </p>
        </div>

        {/* Pending Assignments */}
        {pending.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="text-heading-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              PERLU DIKERJAKAN
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pending.map(a => {
                const statusInfo = getStatusInfo(a.status, a.deadline)
                const isUrgent = new Date(a.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000
                return (
                  <div key={a.id} className="card hover-lift" style={{ padding: '1.25rem', borderLeft: `4px solid ${isUrgent ? 'var(--color-danger-main)' : 'var(--color-ink-500)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.title}</h3>
                          <span className={`badge-base ${statusInfo.cls}`} style={{ fontSize: '0.65rem' }}>{statusInfo.label}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          {a.instructions.slice(0, 120)}...
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>👩‍🏫 {a.createdBy.name}</span>
                          <span style={{ fontSize: '0.75rem', color: isUrgent ? 'var(--color-danger-dark)' : 'var(--color-text-muted)', fontWeight: isUrgent ? 600 : 400 }}>
                            ⏰ {formatDeadline(a.deadline)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>⌛ {a.maxDurationMins} menit</span>
                          {a.minWordCount && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📝 Min. {a.minWordCount} kata</span>}
                        </div>
                      </div>
                      <Link href={`/student/assignments/${a.id}/write`}>
                        <button className="btn-primary" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {a.status === 'IN_PROGRESS' ? '▶ Lanjutkan' : '✏️ Kerjakan'}
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <h2 className="text-heading-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              SELESAI
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {done.map(a => {
                const statusInfo = getStatusInfo(a.status, a.deadline)
                return (
                  <div key={a.id} className="card" style={{ padding: '1rem', opacity: 0.75 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.title}</span>
                          <span className={`badge-base ${statusInfo.cls}`} style={{ fontSize: '0.65rem' }}>{statusInfo.label}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {a.createdBy.name} · {new Date(a.deadline).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {assignments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p className="text-heading-md">Belum ada tugas</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Guru belum memberikan tugas untuk kelasmu</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
