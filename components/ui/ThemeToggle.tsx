'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // placeholder
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg text-text-secondary hover:text-text-primary dark:hover:text-ink-50 hover:bg-surface-alt transition-colors flex items-center justify-center"
      title="Ganti Tema"
      aria-label="Ganti Tema"
    >
      {currentTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
