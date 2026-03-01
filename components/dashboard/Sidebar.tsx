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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  href: string;
  soon?: boolean;
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
    // Try session API first for accurate data, fallback to localStorage
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
        className="md:hidden fixed top-4 left-4 z-50 glass p-3 rounded-xl"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 glass border-r border-border p-6 flex flex-col z-40 transition-transform duration-300 overflow-y-auto overscroll-contain",
        "md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Logo */}
      <Link href="/" className="mb-8 group cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b9aa6] to-[#6b9da8] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
            Concussion<span className="text-accent">Pro</span>
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-13">Professional Workspace</p>
      </Link>

      {/* CPD Progress Ring */}
      <div className="mb-8">
        <ProgressRing progress={completedModules} total={8} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return item.soon ? (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'opacity-50 cursor-not-allowed text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-auto text-xs text-accent">Soon</span>
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMobileMenu}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'glass-hover',
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-border space-y-4">
        {/* User Info */}
        {user && (
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}

        {/* CPD Status */}
        <div>
          <p className="text-xs text-muted-foreground">AHPRA Compliant</p>
          <p className="text-xs text-muted-foreground">CPD Tracking Active</p>
        </div>
      </div>
    </div>
    </>
  )
}
