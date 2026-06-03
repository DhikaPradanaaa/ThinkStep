'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'STUDENT' | 'AI'
  content: string
  timestamp: string
  hintsUsed?: number
}

interface Session {
  id: string
  questionTitle: string
  subject: string
  date: string
  durationMins: number
  hintsUsed: number
  resolved: boolean
  messages: Message[]
}

interface SessionTimelineProps {
  sessions?: Session[]
  studentName?: string
}

const DEMO_SESSIONS: Session[] = [
  {
    id: 'sess1',
    questionTitle: 'Persamaan Linear Dua Variabel',
    subject: 'Matematika',
    date: '2 Jun 2026, 14:30',
    durationMins: 18,
    hintsUsed: 1,
    resolved: true,
    messages: [
      { role: 'AI', content: 'Halo! Apa yang kamu ketahui tentang persamaan linear dua variabel?', timestamp: '14:30' },
      { role: 'STUDENT', content: 'Saya tahu ada dua variabel, x dan y', timestamp: '14:31' },
      { role: 'AI', content: 'Bagus! Lalu, apa artinya "linear"? Apa yang terjadi jika kita gambar persamaannya?', timestamp: '14:32', hintsUsed: 0 },
      { role: 'STUDENT', content: 'Oh, menjadi garis lurus!', timestamp: '14:34' },
      { role: 'AI', content: 'Tepat sekali! Sekarang, bagaimana caramu menemukan titik potong dua garis?', timestamp: '14:35' },
    ],
  },
  {
    id: 'sess2',
    questionTitle: 'Sistem Persamaan Linear',
    subject: 'Matematika',
    date: '1 Jun 2026, 10:15',
    durationMins: 35,
    hintsUsed: 3,
    resolved: false,
    messages: [
      { role: 'AI', content: 'Apa metode yang kamu ketahui untuk menyelesaikan SPLDV?', timestamp: '10:15' },
      { role: 'STUDENT', content: 'Saya lupa cara substitusinya', timestamp: '10:17' },
      { role: 'AI', content: '💡 Petunjuk 1: Coba pilih salah satu persamaan. Bisa kamu nyatakan x dalam y (atau sebaliknya)?', timestamp: '10:19', hintsUsed: 1 },
    ],
  },
]

export default function SessionTimeline({ sessions = DEMO_SESSIONS, studentName = 'Siswa' }: SessionTimelineProps) {
  const [activeSession, setActiveSession] = useState<string | null>(null)

  return (
    <div>
      <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Riwayat Sesi Belajar
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sessions.map((session) => (
          <div key={session.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Session header */}
            <button
              onClick={() => setActiveSession(activeSession === session.id ? null : session.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '1rem 1.25rem', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: session.resolved ? '#10B981' : '#F59E0B',
                }} />

                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {session.questionTitle}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {session.subject} · {session.date} · {session.durationMins} menit
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Hint count */}
                <span className={`badge-base hint-badge-${Math.min(session.hintsUsed, 3) || 1}`} style={{ fontSize: '0.7rem' }}>
                  {session.hintsUsed === 0 ? '✨ Mandiri' : `💡 ${session.hintsUsed} Hint`}
                </span>

                {/* Status */}
                <span className={`badge-base ${session.resolved ? 'autonomy-very-high' : 'autonomy-medium'}`} style={{ fontSize: '0.65rem' }}>
                  {session.resolved ? '✅ Selesai' : '⏳ Belum selesai'}
                </span>

                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', transform: activeSession === session.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▼</span>
              </div>
            </button>

            {/* Expanded conversation */}
            {activeSession === session.id && (
              <div style={{
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '1rem 1.25rem',
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  Percakapan Replay
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {session.messages.map((msg, i) => (
                    <div
                      key={i}
                      className="bubble-enter"
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'STUDENT' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '75%',
                        background: msg.role === 'STUDENT' ? 'var(--color-ink-500)' : 'white',
                        color: msg.role === 'STUDENT' ? 'white' : 'var(--color-text-primary)',
                        border: msg.role === 'AI' ? '1px solid var(--color-border)' : 'none',
                        borderRadius: msg.role === 'STUDENT' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                      }}>
                        {msg.hintsUsed && msg.hintsUsed > 0 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-hint-dark)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💡 Petunjuk {msg.hintsUsed}
                          </div>
                        )}
                        {msg.content}
                        <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
