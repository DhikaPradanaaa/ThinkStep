'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'

interface ExamTimerProps {
  endsAt: string
  totalDurationMs: number
  isSubmitted: boolean
  onExpire: () => void
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function ExamTimer({
  endsAt,
  totalDurationMs,
  isSubmitted,
  onExpire,
}: ExamTimerProps) {
  const endTime = useMemo(() => new Date(endsAt).getTime(), [endsAt])
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endTime - Date.now()))

  useEffect(() => {
    if (isSubmitted) return

    const updateRemaining = () => {
      const nextRemaining = Math.max(0, endTime - Date.now())
      setRemainingMs(nextRemaining)

      if (nextRemaining <= 0) {
        onExpire()
      }
    }

    updateRemaining()
    const intervalId = window.setInterval(updateRemaining, 1000)

    return () => window.clearInterval(intervalId)
  }, [endTime, isSubmitted, onExpire])

  const progress = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100))
  const isUrgent = progress <= 20

  return (
    <div className="w-full" role="timer" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-bold text-danger-dark">
        <Clock size={18} aria-hidden="true" />
        <span>{formatTime(remainingMs)}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white border border-rose-200">
        <div
          className={`exam-timer-bar h-full rounded-full ${isUrgent ? 'urgent' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
