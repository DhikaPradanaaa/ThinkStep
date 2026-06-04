'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Plus, Users, Copy, CheckCircle2 } from 'lucide-react'

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDesc, setNewClassDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, description: newClassDesc })
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewClassName('')
        setNewClassDesc('')
        fetchClasses()
      } else {
        alert('Gagal membuat kelas')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <AppLayout role="TEACHER">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Manajemen Kelas
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Kelola kelas Anda dan bagikan kode bergabung ke siswa
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Buat Kelas Baru
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Memuat data kelas...
          </div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
            <h3 className="text-heading-md" style={{ marginBottom: '0.5rem' }}>Belum Ada Kelas</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Buat kelas pertama Anda untuk mulai mengelola siswa dan tugas.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">Buat Kelas Baru</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {classes.map(cls => (
              <div key={cls.id} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)' }}>{cls.name}</h3>
                  </div>
                  {cls.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                      {cls.description}
                    </p>
                  )}
                  
                  <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Kode Bergabung</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--color-primary-main)' }}>{cls.code}</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(cls.code)}
                      style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Salin Kode"
                    >
                      {copiedCode === cls.code ? <CheckCircle2 size={18} color="var(--color-success-main)" /> : <Copy size={18} color="var(--color-text-secondary)" />}
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-alt)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      <Users size={16} /> {cls._count?.students || 0} Siswa
                    </div>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Buat Kelas */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              background: 'var(--color-surface)', width: '100%', maxWidth: '500px',
              borderRadius: '16px', padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
              <h2 className="text-heading-md" style={{ marginBottom: '1.5rem' }}>Buat Kelas Baru</h2>
              <form onSubmit={handleCreateClass}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                    Nama Kelas <span style={{ color: 'var(--color-error-main)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: Matematika 8A"
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                    Deskripsi Singkat (Opsional)
                  </label>
                  <textarea
                    value={newClassDesc}
                    onChange={e => setNewClassDesc(e.target.value)}
                    className="input-field"
                    placeholder="Contoh: Kelas Matematika Semester Ganjil 2026"
                    rows={3}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost"
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting || !newClassName.trim()}
                  >
                    {submitting ? 'Menyimpan...' : 'Buat Kelas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
