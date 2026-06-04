'use client'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="thinkstep-theme"
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  )
}

