'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  gradeLevel: string
}

export default function GenerateDailyButton({ gradeLevel }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleGenerate = async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/cron/generate-daily-questions', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate soal')

      const { generated, skipped } = data
      if (generated > 0) {
        setStatus('success')
        setMessage(`✅ ${generated} set soal berhasil dibuat! Halaman akan direfresh...`)
        setTimeout(() => window.location.reload(), 1500)
      } else if (skipped > 0) {
        setStatus('success')
        setMessage(`Soal harian untuk hari ini sudah ada (${skipped} set). Refresh halaman.`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus('error')
        setMessage('Tidak ada soal yang dibuat. Coba lagi nanti.')
      }
    } catch (e: any) {
      setStatus('error')
      setMessage(e.message || 'Terjadi kesalahan')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '10px',
          background: status === 'loading' ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: status === 'loading' ? '#6b7280' : 'white',
          border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
          boxShadow: status === 'loading' ? 'none' : '0 2px 8px rgba(99,102,241,0.35)',
        }}
      >
        {status === 'loading' ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Sparkles size={14} />
        )}
        {status === 'loading' ? 'Membuat soal...' : '🤖 Minta Soal Harian AI'}
      </button>

      {message && (
        <p style={{
          fontSize: '0.72rem', fontWeight: 500, maxWidth: '260px', textAlign: 'right',
          color: status === 'error' ? '#DC2626' : '#16A34A',
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
