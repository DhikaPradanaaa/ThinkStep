'use client'

import { useRef, useEffect, useState } from 'react'
import type { PlaybackFrame } from '@/lib/writing/anti-ai-engine'

interface PlaybackTimelineProps {
  frames: PlaybackFrame[]
  currentIndex: number
  onSeek: (index: number) => void
}

export default function PlaybackTimeline({ frames, currentIndex, onSeek }: PlaybackTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    handleSeek(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleSeek(e.clientX)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleSeek = (clientX: number) => {
    if (!containerRef.current || frames.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percentage = x / rect.width
    let targetIndex = Math.floor(percentage * frames.length)
    targetIndex = Math.max(0, Math.min(targetIndex, frames.length - 1))
    onSeek(targetIndex)
  }

  const progressPercentage = frames.length > 0 ? (currentIndex / (frames.length - 1)) * 100 : 0

  return (
    <div style={{ padding: '0.5rem 1rem' }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          height: '12px',
          background: 'var(--color-surface-alt)',
          borderRadius: '6px',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          touchAction: 'none'
        }}
      >
        {/* Progress fill */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progressPercentage}%`,
          background: 'var(--color-brand-main)',
          pointerEvents: 'none'
        }} />
        
        {/* Anomaly markers */}
        {frames.map((f, i) => {
          if (!f.isAnomalyFrame) return null
          const leftPercent = (i / (frames.length - 1)) * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: 0, bottom: 0,
                width: '3px',
                background: 'var(--color-danger-main)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
