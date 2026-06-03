'use client'

interface PlaybackControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  playbackSpeed: number
  onChangeSpeed: (speed: number) => void
  onSkipBackward: () => void
  onSkipForward: () => void
}

export default function PlaybackControls({
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onSkipBackward,
  onSkipForward
}: PlaybackControlsProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
      padding: '0.75rem', background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)'
    }}>
      <button 
        onClick={onSkipBackward}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem' }}
        title="Mundur 5 detik"
      >
        ⏮️
      </button>
      
      <button
        onClick={onTogglePlay}
        className="btn-primary"
        style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      
      <button 
        onClick={onSkipForward}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem' }}
        title="Maju 5 detik"
      >
        ⏭️
      </button>
      
      <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 4, 8].map(speed => (
          <button
            key={speed}
            onClick={() => onChangeSpeed(speed)}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: playbackSpeed === speed ? 'var(--color-brand-main)' : 'var(--color-border)',
              background: playbackSpeed === speed ? 'var(--color-brand-light)' : 'white',
              color: playbackSpeed === speed ? 'var(--color-brand-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: playbackSpeed === speed ? 600 : 400
            }}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
