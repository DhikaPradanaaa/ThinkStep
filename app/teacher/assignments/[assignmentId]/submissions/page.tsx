import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SubmissionsPageProps {
  params: Promise<{ assignmentId: string }>
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { assignmentId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  let assignment: any = null
  let submissions: any[] = []

  try {
    assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        writingSessions: {
          include: {
            student: { select: { name: true, email: true } },
            analysisReport: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })

    if (!assignment) redirect('/teacher/assignments')
    submissions = assignment.writingSessions
  } catch (e) {
    console.error('Failed to fetch submissions:', e)
  }

  const getVerdictBadge = (verdict: string | undefined, conf: number | undefined) => {
    if (!verdict) return <span className="badge-base autonomy-medium" style={{ fontSize: '0.7rem' }}>⏳ Menunggu Analisis</span>
    if (verdict === 'LIKELY_AI') return <span className="badge-base autonomy-low" style={{ fontSize: '0.7rem' }}>🚨 AI ({conf}%)</span>
    if (verdict === 'SUSPICIOUS') return <span className="badge-base autonomy-medium" style={{ fontSize: '0.7rem' }}>⚠️ Ragu ({conf}%)</span>
    return <span className="badge-base autonomy-very-high" style={{ fontSize: '0.7rem' }}>✅ Asli ({conf}%)</span>
  }

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/teacher/assignments" style={{ color: 'var(--color-brand-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Kembali ke Daftar Tugas
          </Link>
          <h1 className="text-heading-lg" style={{ color: 'var(--color-text-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>
            Submissions: {assignment?.title || 'Tugas'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Total {submissions.length} siswa telah mengerjakan
          </p>
        </div>

        {/* Submissions List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nama Siswa</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  {assignment?.assignmentType === 'GENERAL' ? 'Lampiran' : 'Kata'}
                </th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  {assignment?.assignmentType === 'GENERAL' ? 'Nilai (AI/Guru)' : 'Keaslian (AI)'}
                </th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover-lift">
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sub.student.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub.student.email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {sub.status === 'SUBMITTED' ? (
                      <span style={{ color: 'var(--color-success-dark)', fontSize: '0.875rem', fontWeight: 600 }}>Selesai</span>
                    ) : sub.status === 'TIMED_OUT' ? (
                      <span style={{ color: 'var(--color-warning-dark)', fontSize: '0.875rem', fontWeight: 600 }}>Waktu Habis</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Dikerjakan</span>
                    )}
                    {sub.submittedAt && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(sub.submittedAt).toLocaleDateString('id-ID')}</div>}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {assignment.assignmentType === 'GENERAL' ? (
                      sub.submissionFileUrls && JSON.parse(sub.submissionFileUrls).length > 0 
                        ? `📎 ${JSON.parse(sub.submissionFileUrls).length} file` 
                        : (sub.submissionContent ? '📝 Teks' : '—')
                    ) : (
                      sub.wordCount || 0
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {assignment.assignmentType === 'GENERAL' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          AI: {sub.aiRecommendedScore !== null ? <strong style={{ color: 'var(--color-brand-main)' }}>{sub.aiRecommendedScore}</strong> : '⏳'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                          Guru: {sub.teacherFinalScore !== null ? <span style={{ color: 'var(--color-success-dark)' }}>{sub.teacherFinalScore}</span> : '—'}
                        </span>
                      </div>
                    ) : (
                      getVerdictBadge(sub.analysisReport?.overallVerdict, sub.analysisReport?.confidenceScore)
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <Link href={`/teacher/assignments/${assignmentId}/review/${sub.id}`}>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                        Lihat Detail
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Belum ada siswa yang mengumpulkan tugas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AppLayout>
  )
}
