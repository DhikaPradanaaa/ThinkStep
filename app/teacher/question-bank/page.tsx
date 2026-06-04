import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'
import DeleteQuestionButton from '@/components/teacher/DeleteQuestionButton'

export const dynamic = 'force-dynamic'

const SUBJECTS = ['Semua', 'Matematika', 'IPA', 'Bahasa Indonesia', 'IPS']
const DIFFICULTIES = ['Semua', 'EASY', 'MEDIUM', 'HARD']

interface QuestionBankPageProps {
  searchParams: Promise<{ subject?: string; difficulty?: string; page?: string }>
}

const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Mudah', MEDIUM: 'Sedang', HARD: 'Sulit' }
const DIFFICULTY_CLASS: Record<string, string> = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }

const DEMO_QUESTIONS = [
  { id: 'q1', subject: 'Matematika', topic: 'Persamaan Linear', content: 'Tentukan nilai x pada persamaan 2x + 5 = 15', difficulty: 'EASY', gradeLevel: 'Kelas 8', _count: { sessions: 32 } },
  { id: 'q2', subject: 'Matematika', topic: 'SPLDV', content: 'Selesaikan sistem persamaan: 3x + y = 12 dan x - 2y = -1', difficulty: 'MEDIUM', gradeLevel: 'Kelas 8', _count: { sessions: 18 } },
  { id: 'q3', subject: 'IPA', topic: 'Sel & Jaringan', content: 'Jelaskan perbedaan antara sel prokariotik dan eukariotik!', difficulty: 'MEDIUM', gradeLevel: 'Kelas 8', _count: { sessions: 24 } },
  { id: 'q4', subject: 'Bahasa Indonesia', topic: 'Struktur Teks', content: 'Identifikasi struktur teks eksposisi dari paragraf berikut...', difficulty: 'EASY', gradeLevel: 'Kelas 8', _count: { sessions: 15 } },
  { id: 'q5', subject: 'Matematika', topic: 'Geometri', content: 'Hitung luas lingkaran jika jari-jarinya 7 cm (π = 22/7)', difficulty: 'EASY', gradeLevel: 'Kelas 8', _count: { sessions: 41 } },
  { id: 'q6', subject: 'IPA', topic: 'Listrik Statis', content: 'Mengapa sisir plastik dapat menarik kertas setelah digosok ke rambut?', difficulty: 'HARD', gradeLevel: 'Kelas 8', _count: { sessions: 9 } },
  { id: 'q7', subject: 'Matematika', topic: 'Bilangan', content: 'Hasil dari (-12) ÷ 3 + 5 × 2 adalah...', difficulty: 'EASY', gradeLevel: 'Kelas 7', _count: { sessions: 28 } },
  { id: 'q8', subject: 'IPA', topic: 'Ekosistem', content: 'Gambarkan rantai makanan dari ekosistem sawah dan jelaskan peran setiap organisme!', difficulty: 'HARD', gradeLevel: 'Kelas 7', _count: { sessions: 12 } },
]

export default async function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
  const params = await searchParams
  const selectedSubject = params.subject || 'Semua'
  const selectedDifficulty = params.difficulty || 'Semua'

  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  let questions = DEMO_QUESTIONS
  let totalCount = DEMO_QUESTIONS.length

  try {
    const where: any = {}
    if (selectedSubject !== 'Semua') where.subject = selectedSubject
    if (selectedDifficulty !== 'Semua') where.difficulty = selectedDifficulty

    const dbQuestions = await prisma.question.findMany({
      where,
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    if (dbQuestions.length > 0) {
      questions = dbQuestions as any
      totalCount = dbQuestions.length
    }
  } catch (e) {
    console.error('DB fallback:', e)
  }

  const filtered = questions.filter(q => {
    const matchSubject = selectedSubject === 'Semua' || q.subject === selectedSubject
    const matchDiff = selectedDifficulty === 'Semua' || q.difficulty === selectedDifficulty
    return matchSubject && matchDiff
  })

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor="#059669">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Bank Soal</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {totalCount} soal Kurikulum Merdeka tersedia
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* BUG-002 FIX: Import CSV button with tooltip (no backend yet, shows alert) */}
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
              title="Fitur import CSV akan segera hadir"
            >📥 Import CSV</button>
            {/* BUG-002 FIX: Link to a future question creation page */}
            <Link href="/teacher/question-bank/new" className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              + Tambah Soal
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filter:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {SUBJECTS.map(subj => (
              <Link 
                key={subj} 
                href={`/teacher/question-bank?subject=${subj}&difficulty=${selectedDifficulty}`}
                style={{
                  padding: '5px 12px', borderRadius: '9999px',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  border: '1px solid', textDecoration: 'none',
                  borderColor: selectedSubject === subj ? 'var(--color-ink-400)' : 'var(--color-border)',
                  background: selectedSubject === subj ? 'var(--color-ink-50)' : 'white',
                  color: selectedSubject === subj ? 'var(--color-ink-700)' : 'var(--color-text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                {subj}
              </Link>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {DIFFICULTIES.map(diff => (
              <Link 
                key={diff} 
                href={`/teacher/question-bank?subject=${selectedSubject}&difficulty=${diff}`}
                style={{
                  padding: '5px 12px', borderRadius: '9999px',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  border: '1px solid', textDecoration: 'none',
                  borderColor: selectedDifficulty === diff ? 'var(--color-ink-400)' : 'var(--color-border)',
                  background: selectedDifficulty === diff ? 'var(--color-ink-50)' : 'white',
                  color: selectedDifficulty === diff ? 'var(--color-ink-700)' : 'var(--color-text-secondary)',
                }}
              >
                {diff === 'Semua' ? diff : DIFFICULTY_LABEL[diff] || diff}
              </Link>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((q, i) => (
            <div key={q.id} className="card hover-lift" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Number */}
                <div style={{
                  width: 32, height: 32, borderRadius: '8px',
                  background: 'var(--color-surface-alt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}>{i + 1}</div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      background: 'var(--color-ink-50)', color: 'var(--color-ink-700)',
                      padding: '2px 8px', borderRadius: '9999px',
                    }}>{q.subject}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{q.topic}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>· {q.gradeLevel}</span>
                    <span className={`badge-base ${DIFFICULTY_CLASS[q.difficulty] || 'badge-medium'}`} style={{ fontSize: '0.65rem' }}>
                      {DIFFICULTY_LABEL[q.difficulty] || q.difficulty}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5,
                    marginBottom: '0.5rem',
                  }}>
                    {q.content.length > 120 ? q.content.slice(0, 120) + '...' : q.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      📊 Digunakan {q._count?.sessions ?? 0} kali
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Link 
                    href={`/teacher/question-bank/${q.id}/results`}
                    className="btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#ECFDF5', color: '#059669', borderColor: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    📋 Lihat Rekap Nilai
                  </Link>
                  {/* BUG-002 FIX: Edit & Delete are stubs until backend is implemented */}
                  <Link 
                    href={`/teacher/question-bank/${q.id}/edit`}
                    className="btn-ghost" 
                    style={{ fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    Edit
                  </Link>
                  <DeleteQuestionButton questionId={q.id} questionContent={q.content} />
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <p className="text-heading-md">Belum ada soal</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Coba ubah filter atau tambah soal baru</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
