'use client'

import { useEffect, useState } from 'react'
import TimelapsePlayer from '@/components/playback/TimelapsePlayer'
import AnalysisReportCard from '@/components/playback/AnalysisReportCard'
import WPMChart from '@/components/playback/WPMChart'

interface ReviewPageClientProps {
  sessionId: string
}

export default function ReviewPageClient({ sessionId }: ReviewPageClientProps) {
  const [frames, setFrames] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [playbackRes, reportRes] = await Promise.all([
          fetch(`/api/writing/session/${sessionId}/playback`),
          fetch(`/api/writing/session/${sessionId}/report`),
        ])
        
        if (playbackRes.ok) {
          const pData = await playbackRes.json()
          setFrames(pData.frames)
        }
        
        if (reportRes.ok) {
          const rData = await reportRes.json()
          setReport(rData)
        }
      } catch (error) {
        console.error('Failed to load review data', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [sessionId])

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Memuat data sesi...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      
      {/* Player Section */}
      <div style={{ flex: '1 1 60%', minWidth: '400px', height: '600px' }}>
        <h3 className="text-heading-sm" style={{ marginBottom: '1rem' }}>Rekonstruksi Penulisan</h3>
        <TimelapsePlayer frames={frames} />
      </div>

      {/* Report Section */}
      <div style={{ flex: '1 1 30%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <AnalysisReportCard report={report} />
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-heading-sm" style={{ marginBottom: '1rem' }}>Tren Kecepatan (WPM)</h3>
          <WPMChart frames={frames} />
        </div>
      </div>
      
    </div>
  )
}
