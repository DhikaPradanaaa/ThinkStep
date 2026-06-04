'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { syncOfflineMessages } from '@/lib/offline/message-queue'
import { 
  Home, BookOpen, PenSquare, Award, 
  LayoutDashboard, Users, Library, ClipboardList, FileText,
  LogOut, Menu, X, Brain, Wifi, WifiOff, ListTodo, Presentation, MessageCircle
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const studentNav: NavItem[] = [
  { href: '/student/dashboard', label: 'Beranda', icon: Home },
  { href: '/student/study', label: 'Belajar', icon: BookOpen },
  { href: '/student/chat', label: 'Tanya Lumina', icon: MessageCircle },
  { href: '/student/tasks', label: 'Tugas Pribadi', icon: ListTodo },
  { href: '/student/assignments', label: 'Tugas Sekolah', icon: PenSquare },
  { href: '/student/profile', label: 'Profil', icon: Award },
]


const teacherNav: NavItem[] = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/classes', label: 'Kelas', icon: Presentation },
  { href: '/teacher/students', label: 'Siswa', icon: Users },
  { href: '/teacher/question-bank', label: 'Bank Soal', icon: Library },
  { href: '/teacher/assignments', label: 'Tugas', icon: FileText },
  { href: '/teacher/exam', label: 'Ujian', icon: ClipboardList },
]

const parentNav: NavItem[] = [
  { href: '/parent/dashboard', label: 'Beranda', icon: Home },
]

interface AppLayoutProps {
  children: React.ReactNode
  role: 'STUDENT' | 'TEACHER' | 'PARENT'
  userName?: string
  avatarColor?: string
  onlineStatus?: 'online' | 'offline'
}

export default function AppLayout({ children, role, userName = 'Pengguna', avatarColor = '#3B82F6' }: AppLayoutProps) {
  const pathname = usePathname()
  const nav = role === 'TEACHER' ? teacherNav : (role === 'PARENT' ? parentNav : studentNav)
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  
  const [isOnline, setIsOnline] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineMessages()
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile Sidebar Overlay (for Teacher/Parent) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Desktop Sidebar & Mobile Drawer */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-ink-900 text-white flex items-center justify-center shadow-md">
              <Brain size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-ink-900 font-display">
              ThinkStep
            </span>
          </Link>
          <button className="md:hidden text-ink-500 hover:text-ink-900" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* User Info Profile */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt border border-border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-ink-100 text-ink-900 border border-ink-200 flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
              <p className="text-xs text-text-muted font-medium">
                {role === 'TEACHER' ? 'Guru' : role === 'PARENT' ? 'Orang Tua' : 'Siswa'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-text-muted mb-3 px-3 uppercase tracking-wider">
            Menu Utama
          </div>
          {nav.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm
                  ${isActive 
                    ? 'bg-ink-900 text-white shadow-md' 
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'opacity-100' : 'opacity-70'} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-6 border-t border-border bg-surface-alt/50">
          <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold mb-4 transition-colors ${isOnline ? 'bg-success-light text-success-dark border border-success-main/20' : 'bg-hint-light text-hint-dark border border-hint-main/20'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Sistem Online' : 'Sistem Offline'}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-danger-main hover:bg-danger-light rounded-xl transition-colors"
          >
            <LogOut size={20} className="opacity-70" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-text-secondary hover:text-ink-900 rounded-lg hover:bg-surface-alt transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-ink-900 truncate max-w-[200px] sm:max-w-md font-display">
              {nav.find(i => pathname.startsWith(i.href))?.label || 'Aplikasi'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-success-light text-success-dark border border-success-main/20' : 'bg-hint-light text-hint-dark border border-hint-main/20'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-main' : 'bg-hint-main'} animate-pulse`} />
              {isOnline ? 'Terhubung' : 'Offline'}
            </div>
            
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-bold text-text-primary">{userName}</p>
                <p className="text-xs text-text-muted font-medium">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-ink-900 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto relative z-10 pb-20 md:pb-0">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation (Only for Students to keep it clean, or all) */}
        {role === 'STUDENT' && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border pb-safe pt-2 px-2 flex items-center justify-around z-30">
            {nav.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-colors
                    ${isActive ? 'text-ink-900' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    <div className={`${isActive ? 'bg-ink-100 rounded-full p-1.5' : 'p-1.5'}`}>
                      <Icon size={22} className={isActive ? 'opacity-100' : 'opacity-80'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
