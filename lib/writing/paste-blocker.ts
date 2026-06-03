// lib/writing/paste-blocker.ts
// Client-side paste prevention and recording

import type { PasteAttemptData } from './types'

type PasteCallback = (attempt: PasteAttemptData) => void

export function attachPasteBlocker(
  element: HTMLTextAreaElement,
  sessionId: string,
  onPasteAttempt?: PasteCallback
): () => void {
  function recordAttempt(source: PasteAttemptData['source'], clipboardLength?: number) {
    const attempt: PasteAttemptData = {
      timestamp: Date.now(),
      source,
      clipboardLength: clipboardLength ?? 0,
    }
    onPasteAttempt?.(attempt)

    // Also send to server
    fetch('/api/writing/paste-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...attempt }),
      keepalive: true,
    }).catch(() => {})
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const length = e.clipboardData?.getData('text').length ?? 0
    recordAttempt('keyboard', length)
    // Visual feedback is handled by component
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    recordAttempt('context-menu')
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    recordAttempt('drag-drop')
  }

  element.addEventListener('paste', handlePaste)
  element.addEventListener('contextmenu', handleContextMenu)
  element.addEventListener('drop', handleDrop)

  // Return cleanup function
  return () => {
    element.removeEventListener('paste', handlePaste)
    element.removeEventListener('contextmenu', handleContextMenu)
    element.removeEventListener('drop', handleDrop)
  }
}
