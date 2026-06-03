// lib/writing/event-batcher.ts
// Client-side batching system for keystroke events

import type { KeystrokeEvent } from './types'

const FLUSH_INTERVAL_MS = 3000
const FLUSH_THRESHOLD = 50
const MAX_BUFFER_SIZE = 200

export class EventBatcher {
  private buffer: KeystrokeEvent[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private sessionId: string
  private isFlushing = false

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  add(event: Omit<KeystrokeEvent, 'writingSessionId'>) {
    const fullEvent: KeystrokeEvent = { ...event, writingSessionId: this.sessionId }
    this.buffer.push(fullEvent)

    if (this.buffer.length >= FLUSH_THRESHOLD) {
      this.flush()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS)
    }

    // Force flush if buffer is too big
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isFlushing) return

    this.isFlushing = true
    const batch = [...this.buffer]
    this.buffer = []

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    try {
      await fetch('/api/writing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true, // ensures request completes even if page closes
      })
    } catch (error) {
      // Re-add events to buffer if failed (best effort)
      this.buffer = [...batch, ...this.buffer].slice(0, MAX_BUFFER_SIZE)
      console.error('Failed to flush events:', error)
    } finally {
      this.isFlushing = false
    }
  }

  async flushAndWait(): Promise<void> {
    // Flush remaining buffer and wait for completion
    const remaining = [...this.buffer]
    this.buffer = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    if (remaining.length === 0) return

    await fetch('/api/writing/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: remaining }),
    })
  }

  destroy() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}
