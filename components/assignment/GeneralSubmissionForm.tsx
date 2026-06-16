'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GeneralSubmissionFormProps {
  assignment: any
  writingSessionId: string
}

export default function GeneralSubmissionForm({ assignment, writingSessionId }: GeneralSubmissionFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const assignmentAttachments = assignment.attachmentUrls ? JSON.parse(assignment.attachmentUrls) : []

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB')
      return
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'submissions')

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
    if (!content.trim() && attachments.length === 0) {
      alert('Kirim setidaknya teks jawaban atau satu file lampiran')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/assignment/${assignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileUrls: attachments
        })
      })

      if (res.ok) {
        router.push('/student/assignments')
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal mengumpulkan tugas')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan saat mengumpulkan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/student/assignments" style={{ color: 'var(--color-brand-main)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          ← Kembali
        </Link>
        <h1 className="text-display-sm" style={{ color: 'var(--color-text-primary)', marginTop: '1rem' }}>
          {assignment.title}
        </h1>
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instruksi:</h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
            {assignment.instructions}
          </p>
          
          {assignmentAttachments.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lampiran dari Guru:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {assignmentAttachments.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', textDecoration: 'none', color: 'var(--color-brand-main)' }}>
                    📄 {url.split('/').pop()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
        <h2 className="text-heading-sm" style={{ marginBottom: '1.5rem' }}>Lembar Jawaban</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            Jawaban Teks (Opsional jika ada lampiran)
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="input-field"
            style={{ minHeight: '200px', resize: 'vertical' }}
            placeholder="Ketik jawaban Anda di sini..."
          />
        </div>

        <div style={{ background: 'var(--color-surface-alt)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            Lampiran File (Opsional jika ada teks)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="file"
              id="submission-file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            <label 
              htmlFor="submission-file" 
              className="btn-secondary" 
              style={{ cursor: uploadingFile ? 'not-allowed' : 'pointer', display: 'inline-block' }}
            >
              {uploadingFile ? '⏳ Mengupload...' : '📎 Pilih File (Max 10MB)'}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting || (!content.trim() && attachments.length === 0)}>
            {isSubmitting ? 'Mengumpulkan...' : 'Kumpulkan Tugas'}
          </button>
        </div>
      </form>
    </div>
  )
}
