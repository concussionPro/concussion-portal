'use client'

import { Home, BookOpen, Brain, Activity, Settings, LogOut, User, FileText, Library, Menu, X, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import { useProgress } from '@/contexts/ProgressContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { useState, useEffect } from 'react'

const navItems: Array<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  href: string
  soon?: boolean
}> = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Learning Suite', href: '/learning' },
  { icon: FileText, label: 'Clinical Toolkit', href: '/clinical-toolkit' },
  { icon: Activity, label: 'SCAT Forms', href: '/scat-forms' },
  { icon: Library, label: 'Reference Repository', href: '/references' },
  { icon: BookMarked, label: 'Complete Reference', href: '/complete-reference' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const { getTotalCompletedModules } = useProgress()
  const pathname = usePathname()
  const router = useRouter()
  const completedModules = getTotalCompletedModules()
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser({
              id: data.user.id || '1',
              email: data.user.email || '',
              name: data.user.name || data.user.email?.split('@')[0] || 'Student',
              enrolledAt: data.user.enrolledAt || data.user.createdAt || new Date().toISOString(),
            })
            return
          }
        }
      } catch (_) {
        // Fallback to localStorage
      }
      setUser(getCurrentUser())
    }
    loadUser()
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 glass-premium p-3 rounded-xl shadow-md"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex flex-col z-40 transition-transform duration-300 overflow-y-auto overscroll-contain',
          'md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <Link href="/" className="mb-8 group cursor-pointer">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-accent/15">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors tracking-tight">
              Concussion<span className="text-accent">Pro</span>
            </h1>
          </div>
          <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
            Professional Workspace
          </p>
        </Link>

        {/* CPD Progress Ring */}
        <div className="mb-8">
          <ProgressRing progress={completedModules} total={8} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return item.soon ? (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-muted-foreground relative"
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="ml-auto text-[10px] font-bold text-accent uppercase tracking-wider">
                  Soon
                </span>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative',
                  isActive
                    ? 'bg-accent/8 text-accent font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40',
                )}
              >
                {isActive && <div className="nav-active-indicator" />}
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="pt-5 border-t border-white/30 space-y-3">
          {user && (
            <div className="glass-premium rounded-xl p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-accent hover:bg-accent/5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}

          <div className="px-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              AHPRA Compliant
            </p>
            <p className="text-[10px] text-muted-foreground">CPD Tracking Active</p>
          </div>
        </div>
      </div>
    </>
  )
}
