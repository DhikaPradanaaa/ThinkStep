'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export default function SendReportButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      // Endpoint cron ini awalnya GET. Kita panggil saja.
      const res = await fetch('/api/cron/weekly-report')
      const data = await res.json()
      
      if (res.ok) {
        setStatus('success')
        setMessage(data.message === 'Sukses' ? 'Email berhasil terkirim ke kotak masuk Anda!' : data.message)
      } else {
        setStatus('error')
        setMessage(data.error || 'Terjadi kesalahan')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card hover-lift" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-brand-light) 0%, white 100%)', border: '1px solid var(--color-brand-main)' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'var(--color-brand-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={30} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="text-heading-sm" style={{ color: 'var(--color-ink-900)' }}>Coba Fitur Email Laporan</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Kirimkan simulasi laporan mingguan anak Anda langsung ke alamat email Anda sekarang juga.
          </p>
        </div>
        <div>
          <button 
            onClick={handleSend}
            disabled={loading || status === 'success'}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (status === 'success' ? <CheckCircle2 size={18} /> : <Mail size={18} />)}
            {loading ? 'Mengirim...' : (status === 'success' ? 'Terkirim' : 'Kirim Sekarang')}
          </button>
        </div>
      </div>

      {status === 'success' && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-success-light)', color: 'var(--color-success-dark)', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
      {status === 'error' && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {message}
        </div>
      )}
    </div>
  )
}
