'use client'

interface AnalysisReportCardProps {
  report: {
    overallVerdict: 'HUMAN' | 'SUSPICIOUS' | 'LIKELY_AI'
    confidenceScore: number
    flags: Array<{
      type: string
      severity: string
      description: string
    }>
    metrics: {
      averageWPM: number
      revisionRatio: number
      pasteAttempts: number
      longestPauseMs: number
      focusLossCount: number
    }
  } | null
}

export default function AnalysisReportCard({ report }: AnalysisReportCardProps) {
  if (!report) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Laporan analisis belum tersedia.
      </div>
    )
  }

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case 'LIKELY_AI':
        return { label: 'Indikasi Kuat AI', color: 'var(--color-danger-main)', icon: '🚨' }
      case 'SUSPICIOUS':
        return { label: 'Mencurigakan', color: 'var(--color-warning-main)', icon: '⚠️' }
      default:
        return { label: 'Karya Asli (Human)', color: 'var(--color-success-dark)', icon: '✅' }
    }
  }

  const info = getVerdictInfo(report.overallVerdict)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="text-heading-sm" style={{ marginBottom: '1rem' }}>Hasil Deteksi Keaslian</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>{info.icon}</div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: info.color }}>
              {info.label}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Confidence Score: {report.confidenceScore}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem' }}>
        <h4 className="text-heading-sm" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Metrik Penulisan</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Kecepatan Rata-rata</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{report.metrics.averageWPM} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>WPM</span></div>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Rasio Revisi</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{(report.metrics.revisionRatio * 100).toFixed(1)}%</div>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Percobaan Paste</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: report.metrics.pasteAttempts > 0 ? 'var(--color-danger-main)' : 'inherit' }}>
              {report.metrics.pasteAttempts}
            </div>
          </div>
          <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Pindah Tab (Blur)</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{report.metrics.focusLossCount}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h4 className="text-heading-sm" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Bendera Deteksi (Flags)</h4>
        {report.flags.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Tidak ada anomali terdeteksi.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.flags.map((flag, idx) => (
              <div key={idx} style={{ 
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '0.75rem', borderRadius: '6px',
                background: flag.severity === 'CRITICAL' ? 'var(--color-danger-light)' : 'var(--color-warning-light)'
              }}>
                <span style={{ fontSize: '1rem' }}>{flag.severity === 'CRITICAL' ? '🔴' : '🟡'}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{flag.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
