'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PlaybackFrame } from '@/lib/writing/anti-ai-engine'

interface WPMChartProps {
  frames: PlaybackFrame[]
}

export default function WPMChart({ frames }: WPMChartProps) {
  // We need to calculate rolling WPM per minute if not provided in frames.
  // For simplicity, let's create a rough aggregation over 30s intervals.

  if (frames.length === 0) return <div>Data tidak cukup</div>

  const startTime = frames[0].timestamp
  const endTime = frames[frames.length - 1].timestamp
  const totalDuration = endTime - startTime

  // If duration is less than 30 seconds, don't chart
  if (totalDuration < 30000) return <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>Durasi terlalu pendek untuk grafik WPM</div>

  const INTERVAL = 30000 // 30 seconds
  const buckets: { time: number; wpm: number }[] = []
  
  let currentBucketStart = startTime
  let charsInBucket = 0

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]
    if (f.timestamp > currentBucketStart + INTERVAL) {
      // close bucket
      const wpm = Math.round((charsInBucket / 5) / (INTERVAL / 60000))
      buckets.push({ time: Math.round((currentBucketStart - startTime) / 60000), wpm })
      
      currentBucketStart += INTERVAL
      charsInBucket = 0
    }
    
    if (f.eventType === 'INSERT' && f.content.length > 0) {
      // Rough estimation: diff from previous frame content length
      if (i > 0) {
        const diff = f.content.length - frames[i-1].content.length
        if (diff > 0) charsInBucket += diff
      }
    }
  }

  // add last bucket
  if (charsInBucket > 0) {
    const wpm = Math.round((charsInBucket / 5) / (INTERVAL / 60000))
    buckets.push({ time: Math.round((currentBucketStart - startTime) / 60000), wpm })
  }

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand-main)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-brand-main)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(val) => `${val}m`}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} 
            axisLine={false} 
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => [`${value} WPM`, 'Kecepatan']}
            labelFormatter={(label) => `Menit ke-${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="wpm" 
            stroke="var(--color-brand-main)" 
            fillOpacity={1} 
            fill="url(#colorWpm)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
