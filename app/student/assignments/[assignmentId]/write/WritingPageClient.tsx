'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WritingEditor from '@/components/writing/WritingEditor'

interface WritingPageClientProps {
  writingSessionId: string
  assignment: {
    id: string
    title: string
    instructions: string
    minWordCount?: number
    maxDurationMins: number
    deadline: string
    allowAttachment: boolean
  }
}

export default function WritingPageClient({ writingSessionId, assignment }: WritingPageClientProps) {
  const router = useRouter()
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(finalContent: string) {
    try {
      const res = await fetch('/api/writing/session/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writingSessionId, finalContent }),
      })

      if (res.ok) {
        setIsComplete(true)
        setTimeout(() => router.push('/student/assignments'), 3000)
      }
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  if (isComplete) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface)',
      }}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
          <h1 className="text-display-sm" style={{ color: 'var(--color-success-dark)', marginBottom: '0.75rem' }}>
            Tugas Dikumpulkan!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Mengalihkan ke halaman tugas...
          </p>
          <div style={{ width: '200px', height: '4px', background: 'var(--color-surface-alt)', borderRadius: '2px', margin: '0 auto' }}>
            <div className="slide-progress-bar" style={{
              height: '100%', borderRadius: '2px',
              background: 'var(--color-success-dark)',
              animation: 'progress-fill 3s linear forwards',
            }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'white',
    }}>
      <WritingEditor
        writingSessionId={writingSessionId}
        assignment={assignment}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
