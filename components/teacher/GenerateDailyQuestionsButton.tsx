'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

export default function GenerateDailyQuestionsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ generated: number; skipped: number; errors: string[] } | null>(null)

  const handleGenerate = async () => {
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch('/api/cron/generate-daily-questions', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal')
      setStatus('success')
      setResult({ generated: data.generated, skipped: data.skipped, errors: data.errors })
    } catch (e: any) {
      setStatus('error')
      setResult({ generated: 0, skipped: 0, errors: [e.message] })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 18px', borderRadius: '10px',
          background: status === 'loading' ? '#e5e7eb'
            : status === 'success' ? '#ECFDF5'
            : status === 'error' ? '#FEF2F2'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: status === 'loading' ? '#6b7280'
            : status === 'success' ? '#166534'
            : status === 'error' ? '#991B1B'
            : 'white',
          border: `1px solid ${status === 'success' ? '#BBF7D0' : status === 'error' ? '#FECACA' : 'transparent'}`,
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
          boxShadow: status === 'idle' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        }}
      >
        {status === 'loading' ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Sparkles size={14} />
        )}
        {status === 'loading' ? 'Generating...'
          : status === 'success' ? '✅ Selesai!'
          : status === 'error' ? '❌ Gagal'
          : '🤖 Generate Soal Harian'}
      </button>

      {result && (
        <div style={{ fontSize: '0.72rem', textAlign: 'right', maxWidth: '220px' }}>
          {result.generated > 0 && (
            <p style={{ color: '#166534', fontWeight: 600 }}>✅ {result.generated} set soal dibuat</p>
          )}
          {result.skipped > 0 && (
            <p style={{ color: '#6b7280' }}>⏭️ {result.skipped} sudah ada</p>
          )}
          {result.errors.length > 0 && (
            <p style={{ color: '#DC2626' }}>❌ {result.errors.length} error</p>
          )}
        </div>
      )}
    </div>
  )
}
