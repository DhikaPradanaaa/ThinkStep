'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function JoinClassButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      })

      const data = await res.json()
      
      if (res.ok) {
        setIsOpen(false)
        setCode('')
        router.refresh()
      } else {
        setError(data.error || 'Gagal bergabung dengan kelas')
      }
    } catch (err) {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
      >
        <Plus size={16} /> Gabung Kelas
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '400px',
            borderRadius: '16px', padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 className="text-heading-md" style={{ marginBottom: '1rem' }}>Gabung Kelas</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Masukkan kode 6 digit dari guru Anda.
            </p>
            
            <form onSubmit={handleJoin}>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: 8AX39B"
                className="input-field"
                style={{ fontSize: '1.25rem', letterSpacing: '2px', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase' }}
                maxLength={6}
                autoFocus
              />
              
              {error && (
                <div style={{ color: 'var(--color-error-main)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="btn-ghost"
                  disabled={loading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading || code.length < 6}
                >
                  {loading ? 'Bergabung...' : 'Gabung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
