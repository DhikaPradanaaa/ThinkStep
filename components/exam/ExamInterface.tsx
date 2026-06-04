'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Lock, SendHorizonal, XCircle } from 'lucide-react'
import ExamTimer from './ExamTimer'

type ExamQuestion = {
  id: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  subject: string
  topic: string
  gradeLevel: string
  order: number
}

type SubmitResult = {
  success: boolean
  score: number | null
  correctCount: number
  scorableCount: number
  submittedAt: string
  tabSwitches: number
}

interface ExamInterfaceProps {
  exam: {
    id: string
    title: string
    durationMins: number
    endsAt: string | null
  }
  questions: ExamQuestion[]
  initialAnswers: Record<string, string>
  initialTabSwitches: number
  initialSubmittedAt: string | null
  initialScore: number | null
}

const difficultyLabel = {
  EASY: 'Mudah',
  MEDIUM: 'Sedang',
  HARD: 'Sulit',
}

const difficultyClass = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
}

export default function ExamInterface({
  exam,
  questions,
  initialAnswers,
  initialTabSwitches,
  initialSubmittedAt,
  initialScore,
}: ExamInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches)
  const [endsAt, setEndsAt] = useState<string | null>(exam.endsAt)
  const [isStarting, setIsStarting] = useState(!initialSubmittedAt)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showFocusWarning, setShowFocusWarning] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(
    initialSubmittedAt
      ? {
          success: true,
          score: initialScore,
          correctCount: 0,
          scorableCount: 0,
          submittedAt: initialSubmittedAt,
          tabSwitches: initialTabSwitches,
        }
      : null
  )

  const hasSubmittedRef = useRef(Boolean(initialSubmittedAt))
  const currentQuestion = questions[currentIndex]
  const totalDurationMs = exam.durationMins * 60 * 1000
  const answeredCount = questions.filter((question) => answers[question.id]?.trim()).length
  const isSubmitted = hasSubmittedRef.current || Boolean(submitResult)

  useEffect(() => {
    if (initialSubmittedAt) return

    let isMounted = true

    async function startExam() {
      try {
        const response = await fetch(`/api/exam/${exam.id}/start`, { method: 'POST' })
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Gagal memulai ujian')
        }

        const data = await response.json()
        if (!isMounted) return

        setAnswers(data.answers ?? {})
        setTabSwitches(data.tabSwitches ?? 0)
        setEndsAt(data.endsAt)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memulai ujian')
      } finally {
        if (isMounted) setIsStarting(false)
      }
    }

    startExam()

    return () => {
      isMounted = false
    }
  }, [exam.id, initialSubmittedAt])

  useEffect(() => {
    if (isSubmitted) return

    const recordFocusLoss = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitches((value) => value + 1)
        setShowFocusWarning(true)
      }
    }

    document.addEventListener('visibilitychange', recordFocusLoss)
    window.addEventListener('blur', recordFocusLoss)

    return () => {
      document.removeEventListener('visibilitychange', recordFocusLoss)
      window.removeEventListener('blur', recordFocusLoss)
    }
  }, [isSubmitted])

  const submitExam = useCallback(async () => {
    if (hasSubmittedRef.current || isSubmitting) return

    hasSubmittedRef.current = true
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/exam/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, tabSwitches }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Gagal mengumpulkan ujian')
      }

      const data = await response.json()
      setSubmitResult(data)
    } catch (err) {
      hasSubmittedRef.current = false
      setError(err instanceof Error ? err.message : 'Gagal mengumpulkan ujian')
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, exam.id, isSubmitting, tabSwitches])

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }))
  }

  const goToPrevious = () => setCurrentIndex((index) => Math.max(0, index - 1))
  const goToNext = () => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="card max-w-lg text-center">
          <XCircle className="mx-auto text-danger-main mb-3" size={36} />
          <h1 className="text-heading-lg mb-2">Ujian belum punya soal</h1>
          <p className="text-body-sm text-text-secondary">
            Minta guru menambahkan soal sebelum ujian dimulai.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-30 border-b border-danger-main bg-danger-light">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-xl bg-surface p-2 text-danger-main shadow-sm">
                <Lock size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-label-sm font-bold uppercase text-danger-dark">
                  Mode Ujian Aktif - AI tidak tersedia
                </p>
                <h1 className="text-heading-lg text-text-primary">{exam.title}</h1>
                <p className="text-body-sm text-danger-dark">
                  Navigasi belajar dan petunjuk dinonaktifkan sampai ujian selesai.
                </p>
              </div>
            </div>

            {endsAt && !submitResult && (
              <ExamTimer
                endsAt={endsAt}
                totalDurationMs={totalDurationMs}
                isSubmitted={Boolean(submitResult)}
                onExpire={submitExam}
              />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-danger-main bg-danger-light px-4 py-3 text-body-sm font-semibold text-danger-dark">
            {error}
          </div>
        )}

        {isStarting ? (
          <div className="card flex min-h-[360px] items-center justify-center text-center">
            <div>
              <Lock className="mx-auto mb-3 text-ink-400" size={36} />
              <p className="text-heading-sm">Menyiapkan sesi ujian...</p>
              <p className="text-body-sm text-text-secondary">Timer akan berjalan setelah sesi terkunci.</p>
            </div>
          </div>
        ) : submitResult ? (
          <section className="card mx-auto w-full max-w-xl text-center">
            <CheckCircle2 className="mx-auto mb-4 text-success-main" size={44} />
            <h2 className="text-heading-lg mb-2">Ujian sudah dikumpulkan</h2>
            <p className="text-body-sm text-text-secondary mb-5">
              Jawabanmu tersimpan. Guru dapat melihat hasil dan catatan fokus ujian.
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-label-sm text-text-secondary">Skor otomatis</p>
                <p className="text-display-sm text-text-primary">
                  {submitResult.score === null ? '-' : `${Math.round(submitResult.score)}%`}
                </p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-label-sm text-text-secondary">Pindah tab</p>
                <p className="text-display-sm text-text-primary">{submitResult.tabSwitches}</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="card flex-1 !p-0 overflow-hidden">
              <div className="border-b border-border bg-surface px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-label-sm text-text-secondary">
                      Soal {currentIndex + 1} dari {questions.length}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-heading-sm">{currentQuestion.subject}</span>
                      <span className={`badge-base ${difficultyClass[currentQuestion.difficulty]}`}>
                        {difficultyLabel[currentQuestion.difficulty]}
                      </span>
                      <span className="text-caption">{currentQuestion.topic}</span>
                    </div>
                  </div>
                  <div className="rounded-full border border-border bg-surface-alt px-3 py-1 text-label-sm text-text-secondary">
                    Terjawab {answeredCount}/{questions.length}
                  </div>
                </div>
              </div>

              <div className="px-5 py-6 md:px-8">
                <div className="prose-thinkstep mb-6 whitespace-pre-wrap text-body-lg text-text-primary">
                  {currentQuestion.content}
                </div>

                <label className="text-label-lg text-text-primary" htmlFor={`answer-${currentQuestion.id}`}>
                  Jawaban kamu
                </label>
                <textarea
                  id={`answer-${currentQuestion.id}`}
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(event) => updateAnswer(currentQuestion.id, event.target.value)}
                  className="input-base mt-2 min-h-[180px] resize-y"
                  placeholder="Tulis jawabanmu di sini..."
                  disabled={isSubmitting}
                />
              </div>
            </section>

            <footer className="sticky bottom-0 mt-5 rounded-2xl border border-white/50 bg-surface/80 p-4 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex min-h-[44px] items-center gap-2"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0 || isSubmitting}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                    Sebelumnya
                  </button>
                  <button
                    className="btn-secondary flex min-h-[44px] items-center gap-2"
                    onClick={goToNext}
                    disabled={currentIndex === questions.length - 1 || isSubmitting}
                  >
                    Selanjutnya
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>

                <button
                  className="btn-primary flex min-h-[44px] items-center justify-center gap-2"
                  onClick={submitExam}
                  disabled={isSubmitting}
                >
                  <SendHorizonal size={18} aria-hidden="true" />
                  {isSubmitting ? 'Mengumpulkan...' : 'Kumpulkan Ujian'}
                </button>
              </div>
            </footer>
          </>
        )}
      </main>

      {showFocusWarning && !submitResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-warning-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-danger-main bg-surface p-6 text-center shadow-2xl">
            <AlertTriangle className="mx-auto mb-4 text-danger-main" size={44} />
            <h2 id="focus-warning-title" className="text-heading-lg mb-2">
              Fokus ujian tercatat
            </h2>
            <p className="text-body-sm text-text-secondary mb-5">
              Sistem mendeteksi perpindahan tab atau jendela. Catatan ini akan terlihat oleh guru.
            </p>
            <button className="btn-primary w-full min-h-[44px]" onClick={() => setShowFocusWarning(false)}>
              Kembali ke ujian
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
