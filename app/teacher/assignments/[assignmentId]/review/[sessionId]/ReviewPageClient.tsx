'use client'

import { useEffect, useState } from 'react'
import TimelapsePlayer from '@/components/playback/TimelapsePlayer'
import AnalysisReportCard from '@/components/playback/AnalysisReportCard'
import WPMChart from '@/components/playback/WPMChart'

interface ReviewPageClientProps {
  sessionId: string
  initialSession?: any
}

export default function ReviewPageClient({ sessionId, initialSession }: ReviewPageClientProps) {
  const [frames, setFrames] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(initialSession?.assignment?.assignmentType === 'ESSAY')
  const [score, setScore] = useState(initialSession?.teacherFinalScore || '')
  const [comment, setComment] = useState(initialSession?.teacherComment || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialSession?.assignment?.assignmentType !== 'ESSAY') return

    async function loadData() {
      try {
        const [playbackRes, reportRes] = await Promise.all([
          fetch(`/api/writing/session/${sessionId}/playback`),
          fetch(`/api/writing/session/${sessionId}/report`),
        ])
        
        if (playbackRes.ok) {
          const pData = await playbackRes.json()
          setFrames(pData.frames)
        }
        
        if (reportRes.ok) {
          const rData = await reportRes.json()
          setReport(rData)
        }
      } catch (error) {
        console.error('Failed to load review data', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [sessionId, initialSession])

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/assignment/${initialSession?.assignmentId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          teacherFinalScore: Number(score),
          teacherComment: comment,
        }),
      })

      if (res.ok) {
        alert('Nilai berhasil disimpan!')
      } else {
        alert('Gagal menyimpan nilai.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Memuat data sesi...
      </div>
    )
  }

  const isGeneral = initialSession?.assignment?.assignmentType === 'GENERAL'
  const submissionFiles = initialSession?.submissionFileUrls ? JSON.parse(initialSession.submissionFileUrls) : []

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      
      {/* Main Content Section */}
      <div style={{ flex: '1 1 60%', minWidth: '400px' }}>
        {isGeneral ? (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 className="text-heading-sm" style={{ marginBottom: '1.5rem' }}>Jawaban Siswa</h3>
            
            {initialSession?.submissionContent && (
              <div style={{ marginBottom: '2rem', background: 'var(--color-surface-alt)', padding: '1.5rem', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {initialSession.submissionContent}
              </div>
            )}

            {submissionFiles.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>File Lampiran:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {submissionFiles.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', textDecoration: 'none', color: 'var(--color-brand-main)' }}>
                      📄 {url.split('/').pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!initialSession?.submissionContent && submissionFiles.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>Siswa belum mengumpulkan jawaban.</p>
            )}
          </div>
        ) : (
          <div style={{ height: '600px' }}>
            <h3 className="text-heading-sm" style={{ marginBottom: '1rem' }}>Rekonstruksi Penulisan</h3>
            <TimelapsePlayer frames={frames} />
          </div>
        )}
      </div>

      {/* Sidebar: Report & Grading */}
      <div style={{ flex: '1 1 30%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {!isGeneral && <AnalysisReportCard report={report} />}
        {!isGeneral && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="text-heading-sm" style={{ marginBottom: '1rem' }}>Tren Kecepatan (WPM)</h3>
            <WPMChart frames={frames} />
          </div>
        )}

        {/* Grading Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-heading-sm" style={{ marginBottom: '1.5rem' }}>Penilaian Akhir</h3>
          
          {initialSession?.aiRecommendedScore !== null && initialSession?.aiRecommendedScore !== undefined && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: '8px', borderLeft: '4px solid var(--color-brand-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-main)', textTransform: 'uppercase' }}>Rekomendasi AI</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{initialSession.aiRecommendedScore}/100</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {initialSession.aiScoreReasoning || 'AI telah menganalisis jawaban ini dan memberikan rekomendasi nilai.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Nilai Guru (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={score}
                onChange={e => setScore(e.target.value)}
                className="input-field"
                placeholder="Masukkan nilai akhir..."
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Komentar / Feedback
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="input-field"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Berikan umpan balik untuk siswa..."
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </form>
        </div>
      </div>
      
    </div>
  )
}
