import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import ExamCreateForm from '@/components/exam/ExamCreateForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const DEMO_QUESTIONS = [
  { id: 'q1', content: 'Tentukan nilai x pada persamaan 2x + 5 = 15', subject: 'Matematika', topic: 'Persamaan Linear', difficulty: 'EASY', gradeLevel: 'Kelas 8' },
  { id: 'q2', content: 'Selesaikan sistem persamaan: 3x + y = 12 dan x - 2y = -1', subject: 'Matematika', topic: 'SPLDV', difficulty: 'MEDIUM', gradeLevel: 'Kelas 8' },
  { id: 'q3', content: 'Jelaskan perbedaan antara sel prokariotik dan eukariotik!', subject: 'IPA', topic: 'Sel & Jaringan', difficulty: 'MEDIUM', gradeLevel: 'Kelas 8' },
  { id: 'q4', content: 'Identifikasi struktur teks eksposisi dari paragraf berikut...', subject: 'Bahasa Indonesia', topic: 'Struktur Teks', difficulty: 'EASY', gradeLevel: 'Kelas 8' },
  { id: 'q5', content: 'Hitung luas lingkaran jika jari-jarinya 7 cm (π = 22/7)', subject: 'Matematika', topic: 'Geometri', difficulty: 'EASY', gradeLevel: 'Kelas 8' },
  { id: 'q6', content: 'Mengapa sisir plastik dapat menarik kertas setelah digosok ke rambut?', subject: 'IPA', topic: 'Listrik Statis', difficulty: 'HARD', gradeLevel: 'Kelas 8' },
  { id: 'q7', content: 'Hasil dari (-12) ÷ 3 + 5 × 2 adalah...', subject: 'Matematika', topic: 'Bilangan', difficulty: 'EASY', gradeLevel: 'Kelas 7' },
  { id: 'q8', content: 'Gambarkan rantai makanan dari ekosistem sawah dan jelaskan peran setiap organisme!', subject: 'IPA', topic: 'Ekosistem', difficulty: 'HARD', gradeLevel: 'Kelas 7' },
]

export default async function NewExamPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  let questions = DEMO_QUESTIONS
  try {
    const dbQuestions = await prisma.question.findMany({
      where: { createdById: user.id },
      orderBy: { subject: 'asc' },
      take: 100,
    })
    if (dbQuestions.length > 0) {
      questions = dbQuestions.map(q => ({
        id: q.id,
        content: q.content,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        gradeLevel: q.gradeLevel,
      }))
    }
  } catch (e) {
    console.error('DB fallback for questions:', e)
  }

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor="#059669">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)' }}>
                Buat Ujian Baru
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Pilih soal dan konfigurasi mode ujian — AI akan nonaktif saat ujian berlangsung
            </p>
          </div>
          <Link href="/teacher/dashboard">
            <button className="btn-ghost">← Batal</button>
          </Link>
        </div>

        <ExamCreateForm questions={questions} teacherName={user.name || 'Guru'} />
      </div>
    </AppLayout>
  )
}
