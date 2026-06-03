'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EventBatcher } from '@/lib/writing/event-batcher'
import { attachPasteBlocker } from '@/lib/writing/paste-blocker'
import type { PasteAttemptData } from '@/lib/writing/types'

interface Assignment {
  id: string
  title: string
  instructions: string
  minWordCount?: number
  maxDurationMins: number
  deadline: string
  allowAttachment: boolean
}

interface WritingEditorProps {
  writingSessionId: string
  assignment: Assignment
  onSubmit: (content: string) => void
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function WritingEditor({ writingSessionId, assignment, onSubmit }: WritingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const batcherRef = useRef<EventBatcher | null>(null)
  const sequenceRef = useRef(1)
  const prevTimestampRef = useRef(Date.now())
  const prevLengthRef = useRef(0)
  const snapshotCountRef = useRef(0)

  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPasteWarning, setShowPasteWarning] = useState(false)
  const [pasteAttempts, setPasteAttempts] = useState(0)
  const [instructionsOpen, setInstructionsOpen] = useState(true)

  const maxSeconds = assignment.maxDurationMins * 60

  // Init batcher and timer
  useEffect(() => {
    batcherRef.current = new EventBatcher(writingSessionId)

    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        if (prev >= maxSeconds) {
          // Auto-submit
          handleAutoSubmit()
          clearInterval(timer)
        }
        return prev + 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      batcherRef.current?.flushAndWait()
      batcherRef.current?.destroy()
    }
  }, [writingSessionId, maxSeconds])

  // Attach paste blocker
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    const cleanup = attachPasteBlocker(el, writingSessionId, (attempt: PasteAttemptData) => {
      setPasteAttempts(prev => prev + 1)
      setShowPasteWarning(true)
      setTimeout(() => setShowPasteWarning(false), 3000)
    })

    return cleanup
  }, [writingSessionId])

  const recordEvent = useCallback((
    type: string,
    chars?: string,
    deleteCount?: number
  ) => {
    const el = textareaRef.current
    if (!el || !batcherRef.current) return

    const now = Date.now()
    const delta = now - prevTimestampRef.current
    prevTimestampRef.current = now

    snapshotCountRef.current++
    const shouldSnapshot = snapshotCountRef.current % 50 === 0

    batcherRef.current.add({
      sequenceNumber: sequenceRef.current++,
      absoluteTimestamp: now,
      deltaFromPrevious: delta,
      eventType: type as any,
      characters: chars,
      deleteCount,
      cursorPosition: el.selectionStart,
      contentLength: el.value.length,
      contentSnapshot: shouldSnapshot ? el.value : undefined,
    })
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Backspace') {
      recordEvent('DELETE_BACK', undefined, 1)
    } else if (e.key === 'Delete') {
      recordEvent('DELETE_FORWARD', undefined, 1)
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value
    const newLen = newContent.length
    const oldLen = prevLengthRef.current
    prevLengthRef.current = newLen

    if (newLen > oldLen) {
      const inserted = newContent.slice(oldLen - newLen) || newContent[newContent.length - 1] || ''
      recordEvent('INSERT', inserted)
    }

    setContent(newContent)
    setWordCount(countWords(newContent))
  }

  function handleFocus() {
    recordEvent('FOCUS')
  }

  function handleBlur() {
    recordEvent('BLUR')
  }

  async function handleAutoSubmit() {
    if (isSubmitted) return
    await batcherRef.current?.flushAndWait()
    onSubmit(content)
    setIsSubmitted(true)
  }

  async function handleSubmit() {
    if (isSubmitted || isSubmitting) return
    setIsSubmitting(true)
    await batcherRef.current?.flushAndWait()
    onSubmit(content)
    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  // Format elapsed time
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const remainingSeconds = maxSeconds - elapsedSeconds
  const remainingMins = Math.floor(remainingSeconds / 60)
  const remainingSecs = remainingSeconds % 60
  const isUrgent = remainingSeconds < 300 // < 5 minutes
  const isNearMinWord = assignment.minWordCount ? wordCount >= assignment.minWordCount : true
  const progressPercent = (elapsedSeconds / maxSeconds) * 100

  if (isSubmitted) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 className="text-heading-lg" style={{ color: 'var(--color-success-dark)', marginBottom: '0.5rem' }}>
          Tugas Berhasil Dikumpulkan!
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {wordCount} kata · {minutes} menit {seconds} detik
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Timer bar */}
      <div style={{ height: '4px', background: 'var(--color-surface-alt)' }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: isUrgent ? 'var(--color-danger-main)' : 'var(--color-ink-500)',
          transition: 'width 1s linear, background 0.3s ease',
        }} />
      </div>

      {/* Header bar */}
      <div style={{
        padding: '0.75rem 1.5rem',
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            ✍️ {assignment.title}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Word count */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: isNearMinWord ? 'var(--color-success-dark)' : 'var(--color-text-primary)' }}>
              {wordCount}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              {assignment.minWordCount ? `/ ${assignment.minWordCount} kata` : 'kata'}
            </p>
          </div>

          {/* Elapsed */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>berlalu</p>
          </div>

          {/* Remaining */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: isUrgent ? 'var(--color-danger-main)' : 'var(--color-text-secondary)' }}>
              {String(remainingMins).padStart(2, '0')}:{String(remainingSecs).padStart(2, '0')}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>sisa</p>
          </div>
        </div>
      </div>

      {/* Paste warning */}
      {showPasteWarning && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--color-danger-light)',
          borderBottom: '1px solid var(--color-danger-main)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'slide-up 0.2s ease',
        }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-danger-dark)', fontWeight: 500 }}>
            Salin-tempel dinonaktifkan! Percobaan paste dicatat ({pasteAttempts}x). Silakan ketik secara manual.
          </span>
        </div>
      )}

      {/* Instructions (collapsible) */}
      <div style={{
        background: 'var(--color-ink-50)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          style={{
            width: '100%', textAlign: 'left', background: 'none',
            border: 'none', cursor: 'pointer',
            padding: '10px 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-ink-700)' }}>
            📋 Instruksi Tugas
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-500)', transform: instructionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▼</span>
        </button>
        {instructionsOpen && (
          <div style={{ padding: '0 1.5rem 12px', fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            {assignment.instructions}
          </div>
        )}
      </div>

      {/* Main editor area */}
      <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onInput={handleInput as any}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleInput}
          placeholder="Mulai menulis di sini... (copy-paste dinonaktifkan)"
          style={{
            width: '100%',
            minHeight: '400px',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            lineHeight: 1.8,
            color: 'var(--color-text-primary)',
            background: 'transparent',
            caretColor: 'var(--color-ink-500)',
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      {/* Bottom action bar */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'white',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            🔒 Pengetikan direkam untuk verifikasi keaslian
          </span>
          {pasteAttempts > 0 && (
            <span style={{ fontSize: '0.72rem', background: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
              ⚠️ {pasteAttempts}x percobaan paste
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {assignment.minWordCount && wordCount < assignment.minWordCount && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-hint-dark)' }}>
              ⚡ {assignment.minWordCount - wordCount} kata lagi
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!!assignment.minWordCount && wordCount < assignment.minWordCount)}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            {isSubmitting ? '⏳ Mengumpulkan...' : '📤 Kumpulkan Tugas'}
          </button>
        </div>
      </div>
    </div>
  )
}
