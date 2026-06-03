'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ExamCreateFormProps {
  questions: {
    id: string
    content: string
    subject: string
    topic: string
    difficulty: string
    gradeLevel: string
  }[]
  teacherName: string
}

export default function ExamCreateForm({ questions, teacherName }: ExamCreateFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [durationMins, setDurationMins] = useState(60)
  const [targetGrade, setTargetGrade] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [filterSubject, setFilterSubject] = useState('Semua')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const subjects = ['Semua', ...new Set(questions.map(q => q.subject))]
  const grades = [...new Set(questions.map(q => q.gradeLevel))].sort()

  const filteredQuestions = questions.filter(q =>
    filterSubject === 'Semua' || q.subject === filterSubject
  )

  function toggleQuestion(id: string) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Judul ujian harus diisi')
    if (!targetGrade) return setError('Pilih kelas target')
    if (selectedQuestions.length === 0) return setError('Pilih minimal 1 soal')

    setIsLoading(true)
    try {
      const res = await fetch('/api/exam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, durationMins, targetGrade, questionIds: selectedQuestions }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat ujian')
      }

      setSuccess(true)
      setTimeout(() => router.push('/teacher/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 className="text-heading-lg" style={{ color: 'var(--color-success-dark)', marginBottom: '0.5rem' }}>
          Ujian Berhasil Dibuat!
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Mengalihkan ke dashboard...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* Left: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Title */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="text-heading-sm" style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              📋 Informasi Ujian
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Judul Ujian *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="contoh: Ulangan Harian Persamaan Linear"
                  className="input-base"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Kelas Target *
                  </label>
                  <select
                    value={targetGrade}
                    onChange={e => setTargetGrade(e.target.value)}
                    className="input-base"
                    style={{ cursor: 'pointer' }}
                    required
                  >
                    <option value="">Pilih kelas...</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="Kelas 8A">Kelas 8A</option>
                    <option value="Kelas 8B">Kelas 8B</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={e => setDurationMins(Number(e.target.value))}
                    min={10}
                    max={300}
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Selector */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)' }}>
                📚 Pilih Soal ({selectedQuestions.length} dipilih)
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {subjects.slice(0, 4).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterSubject(s)}
                    style={{
                      padding: '4px 10px', borderRadius: '9999px',
                      fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: filterSubject === s ? 'var(--color-ink-400)' : 'var(--color-border)',
                      background: filterSubject === s ? 'var(--color-ink-50)' : 'white',
                      color: filterSubject === s ? 'var(--color-ink-700)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '400px', overflowY: 'auto' }}>
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestions.includes(q.id)
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${isSelected ? 'var(--color-ink-400)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-ink-50)' : 'white',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '6px', flexShrink: 0,
                      border: `2px solid ${isSelected ? 'var(--color-ink-500)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-ink-500)' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: '2px',
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.65rem', background: 'var(--color-ink-50)', color: 'var(--color-ink-700)', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                          {q.subject}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{q.topic}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                        {q.content.length > 100 ? q.content.slice(0, 100) + '...' : q.content}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 className="text-heading-sm" style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              📊 Ringkasan Ujian
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Judul', value: title || '—' },
                { label: 'Kelas Target', value: targetGrade || '—' },
                { label: 'Durasi', value: `${durationMins} menit` },
                { label: 'Jumlah Soal', value: `${selectedQuestions.length} soal` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.625rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Warnings */}
            <div style={{ marginTop: '1rem', padding: '10px', background: 'var(--color-danger-light)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--color-danger-dark)' }}>
              🔒 Mode ujian akan menonaktifkan AI asisten dan memblokir pindah tab.
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--color-danger-light)', borderRadius: '8px', color: 'var(--color-danger-dark)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }}
          >
            {isLoading ? '⏳ Membuat Ujian...' : '🚀 Aktifkan Ujian'}
          </button>
        </div>
      </div>
    </form>
  )
}
