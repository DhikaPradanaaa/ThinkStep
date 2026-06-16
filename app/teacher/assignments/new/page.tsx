'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

export default function NewAssignmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(data => {
      if (data.classes) setClasses(data.classes)
    })
  }, [])
  
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    instructions: '',
    minWordCount: '',
    maxDurationMins: '60',
    deadlineDays: '7',
    assignmentType: 'ESSAY',
  })
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'assignments')

    try {
      const res = await fetch('/api/assignment/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setAttachments(prev => [...prev, data.url])
      } else {
        alert('Gagal mengupload file')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat upload')
    } finally {
      setUploadingFile(false)
      if (e.target) e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/assignment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          instructions: formData.instructions,
          assignmentType: formData.assignmentType,
          classId: formData.classId || undefined,
          minWordCount: formData.minWordCount ? parseInt(formData.minWordCount) : null,
          maxDurationMins: parseInt(formData.maxDurationMins),
          deadlineDays: parseInt(formData.deadlineDays),
          attachmentUrls: attachments,
        }),
      })

      if (res.ok) {
        router.push('/teacher/assignments')
      } else {
        alert('Gagal membuat tugas')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout role="TEACHER" userName="Guru" avatarColor="#3b82f6">
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/teacher/assignments" style={{ color: 'var(--color-brand-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Kembali
          </Link>
          <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginTop: '1rem' }}>
            Buat Tugas Baru
          </h1>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Judul Tugas
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Contoh: Esai Dampak Media Sosial"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Tipe Tugas
                </label>
                <select
                  value={formData.assignmentType}
                  onChange={e => setFormData({ ...formData, assignmentType: e.target.value })}
                  className="input-field"
                >
                  <option value="ESSAY">Esai (Anti-AI Tracking)</option>
                  <option value="GENERAL">Tugas Umum (Bebas Format + Upload File)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Pilih Kelas
                </label>
                <select
                  value={formData.classId}
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Semua Kelas (Global) --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Batas Waktu (Hari)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.deadlineDays}
                  onChange={e => setFormData({ ...formData, deadlineDays: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Instruksi Penulisan
              </label>
              <textarea
                required
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                className="input-field"
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Jelaskan detail tugas yang harus dikerjakan siswa..."
              />
            </div>

            <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Lampiran File (Opsional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="file"
                  id="assignment-file"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                <label 
                  htmlFor="assignment-file" 
                  className="btn-secondary" 
                  style={{ cursor: uploadingFile ? 'not-allowed' : 'pointer', display: 'inline-block' }}
                >
                  {uploadingFile ? '⏳ Mengupload...' : '📎 Pilih File'}
                </label>
              </div>
              
              {attachments.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachments.map((url, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {url.split('/').pop()}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, index) => index !== i))}
                        style={{ color: 'var(--color-danger-dark)', cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        ❌ Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Durasi Maksimal (Menit)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  value={formData.maxDurationMins}
                  onChange={e => setFormData({ ...formData, maxDurationMins: e.target.value })}
                  className="input-field"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Waktu pengerjaan saat sesi dimulai</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Minimal Kata (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minWordCount}
                  onChange={e => setFormData({ ...formData, minWordCount: e.target.value })}
                  className="input-field"
                  placeholder="Contoh: 300"
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Link href="/teacher/assignments">
                <button type="button" className="btn-secondary">Batal</button>
              </Link>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Terbitkan Tugas'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  )
}
