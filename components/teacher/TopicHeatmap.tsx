'use client'

interface TopicData {
  topic: string
  subject: string
  avgHints: number
  sessionCount: number
}

interface TopicHeatmapProps {
  data?: TopicData[]
}

const DEMO_DATA: TopicData[] = []

function getHeatColor(avgHints: number): { bg: string; text: string; label: string } {
  if (avgHints >= 2.5) return { bg: '#FEE2E2', text: '#991B1B', label: 'Sulit' }
  if (avgHints >= 1.5) return { bg: '#FEF3C7', text: '#92400E', label: 'Sedang' }
  if (avgHints >= 0.8) return { bg: '#D1FAE5', text: '#065F46', label: 'Mudah' }
  return { bg: '#ECFDF5', text: '#065F46', label: 'Sangat Mudah' }
}

const SUBJECTS = ['Matematika', 'IPA', 'B.Indonesia']

export default function TopicHeatmap({ data = DEMO_DATA }: TopicHeatmapProps) {
  return (
    <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)' }}>
          Topik Paling Sulit
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Berdasarkan rata-rata hint yang digunakan
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Sangat Mudah', bg: '#ECFDF5', text: '#065F46' },
          { label: 'Mudah', bg: '#D1FAE5', text: '#065F46' },
          { label: 'Sedang', bg: '#FEF3C7', text: '#92400E' },
          { label: 'Sulit', bg: '#FEE2E2', text: '#991B1B' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '3px', background: l.bg, border: `1px solid ${l.text}30` }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grouped by subject */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SUBJECTS.map(subject => {
          const topicsBySubject = data.filter(d => d.subject === subject)
            .sort((a, b) => b.avgHints - a.avgHints)

          if (topicsBySubject.length === 0) return null

          return (
            <div key={subject}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
              }}>{subject}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {topicsBySubject.map(topic => {
                  const color = getHeatColor(topic.avgHints)
                  return (
                    <div key={topic.topic} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: '8px',
                      background: color.bg,
                      border: `1px solid ${color.text}20`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {topic.topic}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          ({topic.sessionCount} sesi)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: color.text }}>
                          {topic.avgHints.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: color.text }}>hint</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>Belum ada data topik tersedia.</p>
          </div>
        )}
      </div>
    </div>
  )
}
