'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export default function NewQuestionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: 'Matematika',
    topic: '',
    subtopic: '',
    gradeLevel: 'Kelas 8',
    phase: 'D',
    difficulty: 'MEDIUM',
    type: 'ESSAY',
    content: '',
    correctAnswer: '',
    explanation: '',
    hintTier1: '',
    hintTier2: '',
    hintTier3: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/question/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        router.push('/teacher/question-bank')
      } else {
        const err = await res.json()
        alert('Gagal menyimpan soal: ' + (err.error || 'Unknown error'))
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const SUBJECTS = ['Matematika', 'IPA', 'Bahasa Indonesia', 'IPS', 'PKn']
  const GRADES = ['Kelas 7', 'Kelas 8', 'Kelas 9']
  const PHASES = ['C', 'D', 'E', 'F']
  const DIFFICULTIES = [
    { value: 'EASY', label: 'Mudah' },
    { value: 'MEDIUM', label: 'Sedang' },
    { value: 'HARD', label: 'Sulit' },
  ]
  const TYPES = [
    { value: 'ESSAY', label: 'Esai' },
    { value: 'SHORT_ANSWER', label: 'Jawaban Singkat' },
    { value: 'MULTIPLE_CHOICE', label: 'Pilihan Ganda' },
  ]

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{hint}</p>}
    </div>
  )

  return (
    <AppLayout role="TEACHER" userName="Guru" avatarColor="#059669">
      <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/teacher/question-bank" style={{ color: 'var(--color-brand-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Kembali ke Bank Soal
          </Link>
          <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginTop: '1rem' }}>
            Tambah Soal Baru
          </h1>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              {field('Mata Pelajaran',
                <select className="input-field" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {field('Kelas',
                <select className="input-field" value={formData.gradeLevel} onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
              {field('Fase Kurikulum',
                <select className="input-field" value={formData.phase} onChange={e => setFormData({ ...formData, phase: e.target.value })}>
                  {PHASES.map(p => <option key={p} value={p}>Fase {p}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {field('Topik', <input required className="input-field" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} placeholder="Contoh: Persamaan Linear" />)}
              {field('Sub-topik (opsional)', <input className="input-field" value={formData.subtopic} onChange={e => setFormData({ ...formData, subtopic: e.target.value })} placeholder="Contoh: SPLDV" />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {field('Tipe Soal',
                <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              )}
              {field('Tingkat Kesulitan',
                <select className="input-field" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                  {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              )}
            </div>

            {field('Pertanyaan / Isi Soal',
              <textarea required className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Tuliskan pertanyaan soal di sini..." />
            )}

            {field('Kunci Jawaban',
              <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })} placeholder="Jawaban yang diharapkan (digunakan AI untuk penilaian)" />
            )}

            {field('Penjelasan Jawaban',
              <textarea required className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })} placeholder="Penjelasan lengkap mengapa ini jawabannya..." />
            )}

            <div style={{ padding: '1.25rem', background: 'var(--color-surface-alt)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
                💡 Petunjuk Bertingkat (3 Level)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {field('Petunjuk 1 (Paling Ringan)',
                  <input required className="input-field" value={formData.hintTier1} onChange={e => setFormData({ ...formData, hintTier1: e.target.value })} placeholder="Arahan awal tanpa memberi jawaban langsung" />,
                  'Berikan petunjuk yang merangsang berpikir, bukan jawaban'
                )}
                {field('Petunjuk 2 (Sedang)',
                  <input required className="input-field" value={formData.hintTier2} onChange={e => setFormData({ ...formData, hintTier2: e.target.value })} placeholder="Petunjuk lebih spesifik jika siswa masih bingung" />
                )}
                {field('Petunjuk 3 (Hampir Penuh)',
                  <input required className="input-field" value={formData.hintTier3} onChange={e => setFormData({ ...formData, hintTier3: e.target.value })} placeholder="Petunjuk mendekati jawaban (masih perlu dikerjakan siswa)" />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <Link href="/teacher/question-bank">
                <button type="button" className="btn-secondary">Batal</button>
              </Link>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Soal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
