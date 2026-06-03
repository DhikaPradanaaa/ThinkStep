'use client'

import { useState, useEffect, useRef } from 'react'
import type { PlaybackFrame } from '@/lib/writing/anti-ai-engine'
import PlaybackControls from './PlaybackControls'
import PlaybackTimeline from './PlaybackTimeline'

interface TimelapsePlayerProps {
  frames: PlaybackFrame[]
}

export default function TimelapsePlayer({ frames }: TimelapsePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isPlaying && currentIndex < frames.length - 1) {
      // Calculate delay based on real time delta between frames, divided by speed
      // But bound it so we don't wait forever on long pauses
      const startPlay = () => {
        if (!isPlaying) return
        
        const currentFrame = frames[currentIndex]
        const nextFrame = frames[currentIndex + 1]
        
        if (!nextFrame) {
          setIsPlaying(false)
          return
        }

        let delayMs = nextFrame.timestamp - currentFrame.timestamp
        delayMs = delayMs / playbackSpeed
        
        // Cap max pause at 2 seconds in real playback time
        if (delayMs > 2000) delayMs = 2000
        if (delayMs < 16) delayMs = 16 // min 60fps

        timerRef.current = setTimeout(() => {
          setCurrentIndex(prev => {
            if (prev >= frames.length - 1) {
              setIsPlaying(false)
              return prev
            }
            return prev + 1
          })
        }, delayMs)
      }

      startPlay()
    } else if (currentIndex >= frames.length - 1 && isPlaying) {
      setIsPlaying(false)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentIndex, frames, playbackSpeed])

  // Scroll to cursor
  useEffect(() => {
    if (textareaRef.current && frames[currentIndex]) {
      const el = textareaRef.current
      el.selectionStart = frames[currentIndex].cursorPos
      el.selectionEnd = frames[currentIndex].cursorPos
      
      // Basic auto-scroll (naive approach)
      const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24
      const lines = el.value.substr(0, el.selectionStart).split('\n').length
      el.scrollTop = (lines * lineHeight) - (el.clientHeight / 2)
    }
  }, [currentIndex, frames])

  if (frames.length === 0) return <div>No playback data available.</div>

  const currentFrame = frames[currentIndex]
  const currentContent = currentFrame.content

  const handleTogglePlay = () => {
    if (!isPlaying && currentIndex >= frames.length - 1) {
      setCurrentIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleSkipForward = () => {
    // Skip 10% or 10 frames
    const step = Math.max(10, Math.floor(frames.length * 0.1))
    setCurrentIndex(prev => Math.min(frames.length - 1, prev + step))
  }

  const handleSkipBackward = () => {
    const step = Math.max(10, Math.floor(frames.length * 0.1))
    setCurrentIndex(prev => Math.max(0, prev - step))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      
      {/* Editor view (read-only) */}
      <div style={{ flex: 1, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
        <textarea
          ref={textareaRef}
          value={currentContent}
          readOnly
          style={{
            width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none',
            fontFamily: 'var(--font-body)', fontSize: '1rem', lineHeight: 1.6,
            color: 'var(--color-text-primary)', background: 'transparent'
          }}
        />
        
        {currentFrame.isAnomalyFrame && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-danger-main)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, animation: 'pulse 2s infinite' }}>
            ⚠️ Anomali Terdeteksi
          </div>
        )}
      </div>
      
      {/* Timeline & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
        <PlaybackTimeline 
          frames={frames} 
          currentIndex={currentIndex} 
          onSeek={(idx) => {
            setCurrentIndex(idx)
            setIsPlaying(false)
          }} 
        />
        <PlaybackControls 
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          onSkipBackward={handleSkipBackward}
          onSkipForward={handleSkipForward}
        />
      </div>
    </div>
  )
}
