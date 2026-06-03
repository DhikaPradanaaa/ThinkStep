'use client'

interface OverviewCard {
  title: string
  value: string | number
  subtitle: string
  icon: string
  color: string
  bg: string
  trend?: { label: string; direction: 'up' | 'down' | 'neutral'; isGood: boolean }
}

interface OverviewCardsProps {
  activeStudents: number
  avgHints: number
  noHintPercent: number
  needsHelp: number
}

export default function OverviewCards({ activeStudents, avgHints, noHintPercent, needsHelp }: OverviewCardsProps) {
  const cards: OverviewCard[] = [
    {
      title: 'Siswa Aktif',
      value: activeStudents,
      subtitle: 'belajar minggu ini',
      icon: '👥',
      color: '#059669',
      bg: '#ECFDF5',
      trend: { label: '+3 dari minggu lalu', direction: 'up', isGood: true },
    },
    {
      title: 'Rata-rata Hint',
      value: avgHints.toFixed(1),
      subtitle: 'per soal, minggu ini',
      icon: '💡',
      color: '#F59E0B',
      bg: '#FEF3C7',
      trend: { label: `Turun 0.3 dari minggu lalu`, direction: 'down', isGood: true },
    },
    {
      title: 'Tanpa Hint',
      value: `${noHintPercent}%`,
      subtitle: 'soal diselesaikan mandiri',
      icon: '🧠',
      color: '#3B82F6',
      bg: '#EFF6FF',
      trend: { label: 'Naik 5% dari bulan lalu', direction: 'up', isGood: true },
    },
    {
      title: 'Perlu Bantuan',
      value: needsHelp,
      subtitle: 'siswa dengan indeks rendah',
      icon: '⚠️',
      color: '#F43F5E',
      bg: '#FFE4E6',
      trend: { label: 'Sama seperti minggu lalu', direction: 'neutral', isGood: false },
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
    }}>
      {cards.map((card) => (
        <div key={card.title} className="card hover-lift" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}>{card.title}</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1,
              }}>{card.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {card.subtitle}
              </p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: card.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
            }}>
              {card.icon}
            </div>
          </div>

          {card.trend && (
            <div style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>
                {card.trend.direction === 'up' ? (card.trend.isGood ? '↑' : '↑') :
                 card.trend.direction === 'down' ? (card.trend.isGood ? '↓' : '↓') : '→'}
              </span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 500,
                color: card.trend.isGood
                  ? (card.trend.direction === 'neutral' ? 'var(--color-text-muted)' : 'var(--color-success-dark)')
                  : 'var(--color-danger-dark)',
              }}>
                {card.trend.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
