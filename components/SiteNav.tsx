'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'

const BASE_NAV_ITEMS = [
  { label: 'Free Training', path: '/scat-mastery', accent: true },
  { label: 'Pricing', path: '/pricing', accent: false },
  { label: 'SCAT Forms', path: '/scat-forms', accent: false },
  { label: 'Preseason Baseline', path: '/preseason', accent: false },
  { label: 'Blog', path: '/blog', accent: false },
]

type AuthState = { accessLevel: string } | null // null = loading/unknown

export function SiteNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const onPricing = pathname === '/pricing'

  // Auth-aware nav: detect login state
  const [auth, setAuth] = useState<AuthState>(null)
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data.user) {
          setAuth({ accessLevel: data.user.accessLevel })
        } else {
          setAuth({ accessLevel: '' }) // not logged in
        }
      })
      .catch(() => setAuth({ accessLevel: '' }))
  }, [])

  // Demo watermark sits at top:0 z-[100]; if present, push nav below it.
  const [hasDemoBar, setHasDemoBar] = useState(false)
  useEffect(() => {
    if (typeof document === 'undefined') return
    setHasDemoBar(/(?:^|;\s*)demo_org=/.test(document.cookie))
  }, [pathname])

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Build nav items based on auth state
  const navItems = [...BASE_NAV_ITEMS]
  if (!auth) {
    // Still loading — show Login (no flash)
    navItems.push({ label: 'Login', path: '/login', accent: false })
  } else if (auth.accessLevel === '') {
    navItems.push({ label: 'Login', path: '/login', accent: false })
  } else if (auth.accessLevel === 'preview') {
    navItems.push({ label: 'My Course', path: '/scat-course', accent: false })
  } else {
    navItems.push({ label: 'Dashboard', path: '/dashboard', accent: false })
  }

  const isLoggedIn = auth && auth.accessLevel !== ''

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setAuth({ accessLevel: '' })
    router.push('/')
  }

  return (
    <nav
      className={`fixed left-0 right-0 z-50 glass ${hasDemoBar ? 'top-7' : 'top-0'}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-[60px]">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-accent rounded"
            aria-label="ConcussionPro home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="white" strokeWidth="1.5"/>
                <path d="M12 6C9.5 6 7 8 7 12s2.5 6 5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 6c2.5 0 5 2 5 6s-2.5 6-5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
              ConcussionPro
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                aria-current={pathname === item.path ? 'page' : undefined}
                className={`text-[13px] font-medium px-3 py-2 rounded-md transition-colors ${
                  pathname === item.path
                    ? 'text-[var(--accent)] bg-[rgba(13,115,119,0.06)]'
                    : item.accent
                    ? 'text-[var(--accent)] font-semibold hover:bg-[rgba(13,115,119,0.05)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[rgba(13,115,119,0.04)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); handleLogout() }}
                className="text-[13px] font-medium px-3 py-2 rounded-md transition-colors text-[var(--muted-foreground)] hover:bg-[rgba(13,115,119,0.04)]"
              >
                Logout
              </a>
            )}
            {new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59') && (
              <span className="hidden lg:inline-flex ml-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap">
                Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {onPricing ? (
              <button
                type="button"
                onClick={() => document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary ml-2 px-4 py-2 rounded-lg text-[13px] inline-flex items-center gap-1.5"
              >
                Enrol
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={CONFIG.SHOP_URL}
                className="btn-primary ml-2 px-4 py-2 rounded-lg text-[13px] inline-flex items-center gap-1.5"
              >
                Enrol
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-[rgba(13,115,119,0.04)] transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-[1.5px] w-5 bg-[var(--foreground)] transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block h-[1.5px] w-5 bg-[var(--foreground)] transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-[1.5px] w-5 bg-[var(--foreground)] transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden fixed inset-0 z-40 ${hasDemoBar ? 'top-[88px]' : 'top-[60px]'}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-50 border-t border-[rgba(13,115,119,0.06)] bg-[rgba(248,250,251,0.95)] backdrop-blur-xl px-5 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={pathname === item.path ? 'page' : undefined}
                className={`text-left text-sm py-2.5 px-3 rounded-md transition-colors ${
                  pathname === item.path
                    ? 'text-[var(--accent)] font-semibold bg-[rgba(13,115,119,0.06)]'
                    : item.accent
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-foreground)]'
                } hover:bg-[rgba(13,115,119,0.04)]`}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); handleLogout() }}
                className="text-left text-sm py-2.5 px-3 rounded-md transition-colors text-[var(--muted-foreground)] hover:bg-[rgba(13,115,119,0.04)]"
              >
                Logout
              </a>
            )}
            {onPricing ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="btn-primary mt-1 py-2.5 px-4 rounded-lg text-sm text-center font-semibold"
              >
                Enrol Now
              </button>
            ) : (
              <Link
                href={CONFIG.SHOP_URL}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary mt-1 py-2.5 px-4 rounded-lg text-sm text-center font-semibold"
              >
                Enrol Now
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
