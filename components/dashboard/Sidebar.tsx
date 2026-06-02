'use client'

import { Home, BookOpen, Brain, Activity, Settings, LogOut, User, FileText, Library, Menu, X, BookMarked, ExternalLink, Cloud, Loader2, AlertCircle, WifiOff, CheckCircle2, Lock, Mail, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'


const navItems: Array<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  href: string
  soon?: boolean
  paidOnly?: boolean
}> = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Learning Suite', href: '/learning' },
  { icon: FileText, label: 'Clinical Toolkit', href: '/clinical-toolkit', paidOnly: true },
  { icon: Mail, label: 'Outreach Kit', href: '/outreach-kit', paidOnly: true },
  { icon: Stethoscope, label: 'Admin Workflow', href: '/admin-workflow', paidOnly: true },
  { icon: Activity, label: 'SCAT Forms', href: '/scat-forms' },
  { icon: Library, label: 'Reference Repository', href: '/references', paidOnly: true },
  { icon: BookMarked, label: 'Complete Reference', href: '/complete-reference', paidOnly: true },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const { getTotalCompletedModules, syncState, restoredFromServer, progress } = useProgress()
  const pathname = usePathname()
  const router = useRouter()
  const completedModules = getTotalCompletedModules()
  const scatCompletedModules = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && p.completed
  ).length
  const { user: sessionUser } = useSession()
  const user = sessionUser ? {
    id: sessionUser.id || '1',
    email: sessionUser.email || '',
    name: sessionUser.name || sessionUser.email?.split('@')[0] || 'Student',
    accessLevel: sessionUser.accessLevel || 'preview',
    enrolledAt: sessionUser.createdAt || '',
  } : null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  // Show restored-from-cloud banner once per session
  useEffect(() => {
    if (restoredFromServer && typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('progress-restored-shown')
      if (!shown) {
        setShowRestoredBanner(true)
        sessionStorage.setItem('progress-restored-shown', '1')
        const timer = setTimeout(() => setShowRestoredBanner(false), 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [restoredFromServer])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (_) {
      // Continue with redirect even if API fails
    }
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
        <Link href="/learning" className="mb-8 group cursor-pointer">
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

        {/* Restored from cloud banner */}
        {showRestoredBanner && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Cloud className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] text-emerald-700 font-medium">Progress restored from cloud</span>
          </div>
        )}

        {/* CPD Progress Ring */}
        <div className="mb-8">
          <ProgressRing
            progress={user?.accessLevel === 'preview' ? scatCompletedModules : completedModules}
            total={user?.accessLevel === 'preview' ? 3 : 8}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const isLocked = item.paidOnly && user?.accessLevel === 'preview'

            if (isLocked) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg opacity-50 cursor-pointer text-muted-foreground hover:opacity-70 transition-all relative group"
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                  <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
                </Link>
              )
            }

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
                <span className="text-sm font-medium">{item.label}</span>
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

              {/* Sync status */}
              <SyncStatusLine syncState={syncState} />

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
              AHPRA Aligned
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">CPD Tracking Active</p>
            <a
              href="https://concussion-education-australia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
            >
              <Image src="/logo.png" alt="" width={14} height={14} className="w-3.5 h-3.5 rounded-sm" />
              Main Site
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

function SyncStatusLine({ syncState }: { syncState: string }) {
  if (syncState === 'idle') return null

  const config = {
    syncing: { icon: Loader2, text: 'Syncing...', color: 'text-blue-500', spin: true },
    synced: { icon: CheckCircle2, text: 'Saved to cloud', color: 'text-emerald-500', spin: false },
    error: { icon: AlertCircle, text: 'Sync error', color: 'text-amber-500', spin: false },
    offline: { icon: WifiOff, text: 'Offline', color: 'text-slate-400', spin: false },
  }[syncState]

  if (!config) return null
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
      <Icon className={cn('w-3 h-3', config.color, config.spin && 'animate-spin')} />
      <span className={cn('text-[10px] font-medium', config.color)}>{config.text}</span>
    </div>
  )
}
