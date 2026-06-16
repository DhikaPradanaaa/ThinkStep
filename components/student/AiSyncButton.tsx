'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AiSyncButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const syncAi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })
      if (res.ok) {
        router.refresh()
      } else {
        console.error('Failed to sync AI')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={syncAi}
      disabled={loading}
      className={`btn-secondary text-sm px-4 py-2 flex items-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <span className={loading ? 'animate-spin' : ''}>🤖</span>
      {loading ? 'Menyinkronkan...' : 'Sync AI Engine'}
    </button>
  )
}
