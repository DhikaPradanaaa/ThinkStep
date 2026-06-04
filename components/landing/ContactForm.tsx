'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return

    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (res.ok) {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-surface rounded-3xl shadow-sm border border-border mt-10">
      <h3 className="text-heading-sm mb-6 text-text-primary text-center">Tinggalkan Pesan atau Ulasan</h3>
      
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-success-light text-success-main rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="text-heading-sm text-text-primary mb-2">Terima Kasih!</h4>
          <p className="text-body-sm text-text-secondary">
            Pesan Anda telah berhasil dikirim. Kami sangat menghargai masukan Anda.
          </p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-6 btn-secondary px-6 py-2"
          >
            Kirim Pesan Lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-text-primary mb-1">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama Anda"
              required
              className="input-base bg-surface-alt w-full"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-text-primary mb-1">Alamat Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="input-base bg-surface-alt w-full"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-bold text-text-primary mb-1">Pesan / Ulasan</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan pengalaman, saran, atau pertanyaan Anda di sini..."
              required
              className="input-base bg-surface-alt w-full min-h-[120px] resize-y"
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-danger-main text-sm font-medium bg-danger-light p-3 rounded-lg border border-danger-main/20">
              <AlertCircle size={16} /> Gagal mengirim pesan. Silakan coba lagi.
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <span className="animate-pulse">Mengirim...</span>
            ) : (
              <>Kirim Pesan <Send size={18} /></>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
