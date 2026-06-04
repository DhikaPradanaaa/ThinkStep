import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import GenerateDailyButton from '@/components/student/GenerateDailyButton'

export const dynamic = 'force-dynamic'

const SUBJECT_ICONS: Record<string, string> = {
  Matematika: '📐',
  IPA: '🔬',
  IPS: '🗺️',
  'Bahasa Indonesia': '📖',
  'Bahasa Inggris': '🌍',
}

export default async function StudyPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = (session.user as any).role
  if (role !== 'STUDENT') redirect('/teacher/dashboard')

  const user = session.user as any
  const gradeLevel = user.gradeLevel as string | null
  const today = new Date().toISOString().split('T')[0]

  // Ambil soal harian untuk grade siswa ini
  let dailySets: Array<{
    subject: string
    questions: Array<{
      id: string
      content: string
      difficulty: string
      isHots: boolean
      isDone: boolean
    }>
  }> = []

  if (gradeLevel) {
    const sets = await prisma.dailyQuestionSet.findMany({
      where: { date: today, gradeLevel },
      orderBy: { subject: 'asc' },
    })

    // Ambil semua sesi hari ini untuk tau soal mana yang sudah dikerjakan
    const todayStart = new Date(today)
    const doneSessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        isCompleted: true,
        startedAt: { gte: todayStart },
      },
      select: { questionId: true },
    })
    const doneQuestionIds = new Set(doneSessions.map(s => s.questionId).filter(Boolean))

    for (const set of sets) {
      const ids: string[] = JSON.parse(set.questionIds)
      const questions = await prisma.question.findMany({
        where: { id: { in: ids } },
        select: { id: true, content: true, difficulty: true, isHots: true },
      })
      // Maintain order from questionIds
      const orderedQs = ids
        .map(id => questions.find(q => q.id === id))
        .filter(Boolean)
        .map(q => ({
          ...q!,
          isDone: doneQuestionIds.has(q!.id),
        }))

      dailySets.push({ subject: set.subject, questions: orderedQs })
    }
  }

  // Soal latihan biasa (non-harian)
  const questions = await prisma.question.findMany({
    where: { isDailyGenerated: false },
    orderBy: [{ subject: 'asc' }, { difficulty: 'asc' }],
    take: 50,
  })

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

  const hasDailyQuestions = dailySets.length > 0
  const totalDaily = dailySets.reduce((sum, s) => sum + s.questions.length, 0)
  const doneDaily = dailySets.reduce((sum, s) => sum + s.questions.filter(q => q.isDone).length, 0)

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="text-display-sm">📖 Latihan Soal</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.875rem' }}>
              Pilih soal, lalu diskusikan dengan Lumina AI menggunakan Metode Bimbingan Analitik
            </p>
          </div>
          {gradeLevel && <GenerateDailyButton gradeLevel={gradeLevel} />}
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

        {/* ─── SOAL HARIAN SECTION ─────────────────────────────── */}
        {!gradeLevel && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '1rem' }}>
            <p style={{ fontWeight: 600, color: '#B45309' }}>⚠️ Kelas belum diatur</p>
            <p style={{ fontSize: '0.85rem', color: '#92400E', marginTop: '4px' }}>
              Soal Harian disesuaikan dengan kelasmu. Hubungi guru atau perbarui profilmu untuk melihat soal harian.
            </p>
          </div>
        )}

        {gradeLevel && (
          <div style={{ marginBottom: '2.5rem' }}>
            {/* Daily Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="text-heading-md" style={{ color: 'var(--color-text-primary)' }}>
                  🌟 Soal Harian Hari Ini
                </h2>
                <span style={{
                  padding: '3px 10px', borderRadius: '999px',
                  background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {gradeLevel}
                </span>
              </div>
              {hasDailyQuestions && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  ✅ {doneDaily} / {totalDaily} selesai hari ini
                </span>
              )}
            </div>

            {!hasDailyQuestions ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea0d, #764ba20d)', border: '2px dashed var(--color-ink-200)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Soal harian belum dibuat untuk hari ini
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  Soal harian dibuat otomatis setiap pagi. Kamu bisa meminta guru untuk generate soal sekarang.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {dailySets.map(({ subject, questions: qs }) => {
                  const doneCount = qs.filter(q => q.isDone).length
                  const progressPct = Math.round((doneCount / qs.length) * 100)
                  const icon = SUBJECT_ICONS[subject] ?? '📚'
                  return (
                    <div key={subject} className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                      {/* Progress bar bg */}
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '3px', width: `${progressPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '2px', transition: 'width 0.5s ease' }} />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{subject}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: doneCount === qs.length ? '#166534' : 'var(--color-text-muted)' }}>
                          {doneCount}/{qs.length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {qs.map((q, idx) => {
                          const diff = difficultyColor[q.difficulty as keyof typeof difficultyColor]
                          return (
                            <Link key={q.id} href={`/student/study/${q.id}`} style={{ textDecoration: 'none' }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 10px', borderRadius: '8px',
                                background: q.isDone ? '#F0FDF4' : 'var(--color-surface-alt)',
                                border: `1px solid ${q.isDone ? '#BBF7D0' : 'var(--color-border)'}`,
                                transition: 'all 0.15s ease',
                              }}>
                                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                                  {q.isDone ? '✅' : `${idx + 1}.`}
                                </span>
                                <p style={{
                                  flex: 1, fontSize: '0.78rem', lineHeight: 1.4,
                                  color: q.isDone ? '#166534' : 'var(--color-text-primary)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {q.content.slice(0, 60)}{q.content.length > 60 ? '…' : ''}
                                </p>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                  {q.isHots && (
                                    <span style={{ padding: '1px 6px', borderRadius: '999px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.6rem', fontWeight: 700 }}>
                                      HOTS
                                    </span>
                                  )}
                                  <span style={{ padding: '1px 6px', borderRadius: '999px', background: diff.bg, color: diff.text, fontSize: '0.6rem', fontWeight: 700 }}>
                                    {diff.label}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Soal Bank Latihan
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        {/* ─── SOAL BANK (NON-HARIAN) ─────────────────────────── */}
        {Object.keys(bySubject).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
            <p style={{ fontWeight: 600 }}>Bank soal masih kosong</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Guru perlu menambahkan soal ke bank soal.</p>
          </div>
        ) : (
          Object.entries(bySubject).map(([subject, qs]) => (
            <div key={subject} style={{ marginBottom: '2rem' }}>
              <h2 className="text-heading-md" style={{
                marginBottom: '1rem', paddingBottom: '8px',
                borderBottom: '2px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}>
                {SUBJECT_ICONS[subject] ?? '📚'} {subject}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  ({qs.length} soal)
                </span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {qs.map((q) => {
                  const diff = difficultyColor[q.difficulty as keyof typeof difficultyColor]
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
          ))
        )}
      </div>
    </AppLayout>
  )
}
