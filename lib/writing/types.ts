// lib/writing/types.ts
// Shared types for the Writing module (anti-AI detection & timelapse playback)

export interface KeystrokeEvent {
  writingSessionId: string
  sequenceNumber: number
  absoluteTimestamp: number
  deltaFromPrevious: number
  eventType: 'INSERT' | 'DELETE_BACK' | 'DELETE_FORWARD' | 'SELECT' | 'CURSOR_MOVE' | 'PASTE_BLOCKED' | 'FOCUS' | 'BLUR'
  characters?: string
  deleteCount?: number
  cursorPosition: number
  contentLength: number
  contentSnapshot?: string
}

export interface PasteAttemptData {
  timestamp: number
  source: 'keyboard' | 'drag-drop' | 'context-menu'
  clipboardLength?: number
}

export interface WritingMetrics {
  finalWordCount: number
  totalDurationMs: number
  averageWPM: number
  backspaceCount: number
  pasteAttempts: number
  longestPauseMs: number
  averagePauseMs: number
  focusLossCount: number
  revisionRatio: number
}
