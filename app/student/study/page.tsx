import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export default async function StudyPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = (session.user as any).role
  if (role !== 'STUDENT') redirect('/teacher/dashboard')

  const questions = await prisma.question.findMany({
    orderBy: [{ subject: 'asc' }, { difficulty: 'asc' }],
    take: 50,
  })

  // Group by subject
  const bySubject = questions.reduce((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = []
    acc[q.subject].push(q)
    return acc
  }, {} as Record<string, typeof questions>)

  const difficultyColor = {
    EASY: { bg: '#D1FAE5', text: '#065F46', label: 'Mudah' },
    MEDIUM: { bg: '#FEF3C7', text: '#B45309', label: 'Sedang' },
    HARD: { bg: '#FFE4E6', text: '#9F1239', label: 'Sulit' },
  }

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="text-display-sm">📖 Pilih Soal untuk Belajar</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Pilih soal, lalu diskusikan dengan Lumina AI menggunakan Metode Bimbingan Analitik
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          padding: '12px 16px', background: '#EFF6FF', borderRadius: '0.75rem',
          border: '1px solid var(--color-ink-200)', marginBottom: '2rem',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-700)' }}>
            <strong>Ingat:</strong> Lumina AI tidak akan memberikan jawaban langsung. Ia akan memandu kamu berpikir melalui pertanyaan-pertanyaan analitik. Semakin mandiri kamu berpikir, semakin banyak poin yang kamu dapatkan!
          </p>
        </div>

        {Object.entries(bySubject).map(([subject, qs]) => (
          <div key={subject} style={{ marginBottom: '2rem' }}>
            <h2 className="text-heading-md" style={{
              marginBottom: '1rem', paddingBottom: '8px',
              borderBottom: '2px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}>
              {subject === 'Matematika' ? '📐' : subject === 'IPA' ? '🔬' : '📝'} {subject}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                ({qs.length} soal)
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {qs.map((q) => {
                const diff = difficultyColor[q.difficulty]
                return (
                  <div key={q.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px',
                            background: diff.bg, color: diff.text,
                            borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                          }}>{diff.label}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            {q.topic} · {q.gradeLevel} · {q.phase}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                          {q.content.length > 120 ? q.content.slice(0, 120) + '...' : q.content}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          🧠 3 tingkat petunjuk tersedia
                        </p>
                      </div>
                      <Link href={`/student/study/${q.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                          Belajar →
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
