'use client'

import { useEffect, useRef } from 'react'

interface HintData {
  label: string
  count: number
  color: string
}

interface HintDistributionChartProps {
  data?: HintData[]
}

const DEFAULT_DATA: HintData[] = [
  { label: 'Tanpa Hint', count: 0, color: '#10B981' },
  { label: '1 Hint', count: 0, color: '#3B82F6' },
  { label: '2 Hint', count: 0, color: '#F59E0B' },
  { label: '3 Hint', count: 0, color: '#F43F5E' },
]

export default function HintDistributionChart({ data = DEFAULT_DATA }: HintDistributionChartProps) {
  const maxCount = Math.max(...data.map(d => d.count)) || 1
  const total = data.reduce((sum, d) => sum + d.count, 0) || 0

  return (
    <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)' }}>
            Distribusi Penggunaan Hint
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {total} soal dikerjakan minggu ini
          </p>
        </div>
        <div style={{
          fontSize: '0.7rem', fontWeight: 600,
          background: 'var(--color-success-light)',
          color: 'var(--color-success-dark)',
          padding: '4px 10px', borderRadius: '9999px',
        }}>
          Minggu Ini
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.map((item) => {
          const barWidth = (item.count / maxCount) * 100
          const percent = total > 0 ? Math.round((item.count / total) * 100) : 0

          return (
            <div key={item.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {item.count}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '32px', textAlign: 'right' }}>
                    {percent}%
                  </span>
                </div>
              </div>
              <div style={{
                height: '32px', background: 'var(--color-surface-alt)',
                borderRadius: '6px', overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  background: item.color,
                  borderRadius: '6px',
                  transition: 'width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative',
                  display: 'flex', alignItems: 'center',
                  paddingLeft: '8px',
                }}>
                  {barWidth > 20 && (
                    <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                      {item.count} siswa
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary footer */}
      <div style={{
        marginTop: '1.25rem', paddingTop: '1rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-success-dark)' }}>
              {total > 0 ? Math.round((data[0]?.count || 0) / total * 100) : 0}%
            </strong> siswa mandiri
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Target: 70% ✓
        </div>
      </div>
    </div>
  )
}
