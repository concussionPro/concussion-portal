'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { clearIdentity } from '@/lib/analytics'

// 'Courses' → /pricing (owner 2026-07-29: the old /courses/streams chooser
// was retired as a homepage duplicate, leaving the tab a pointless reload).
// Until this changed, the ESSA-accredited CRM (exercise-physiology) stream had
// no route from the global nav at all: an EP landing on a blog post, /scat-forms
// or /clinical-suite had no path to their own product, and "Pricing" led only to
// the physio/osteo/chiro course.
// 2026-08-04 routing fix (owner): "Courses" led to the CCM-only pricing page
// while the tabbed CCM⇄CRM hub lived unlinked at /courses. Free Training stays
// on /scat-mastery, which carries BOTH free courses (CCHC block near the top).
const BASE_NAV_ITEMS = [
  { label: 'Free Training', path: '/scat-mastery', accent: true },
  { label: 'Courses', path: '/courses', accent: false },
  { label: 'SCAT Forms', path: '/scat-forms', accent: false },
  { label: 'Clinical Tools', path: '/clinical-suite', accent: false },
  { label: 'Blog', path: '/blog', accent: false },
]

// ownsCrm rides along because a CRM (EP) buyer's accessLevel is 'preview' —
// without it the nav sent a paying EP customer to the free SCAT course.
type AuthState = { accessLevel: string; ownsCrm: boolean } | null // null = loading/unknown

export function SiteNav({ logoHref = '/' }: { logoHref?: string } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const onPricing = pathname === '/pricing'
  // WHICH product "Enrol" means depends on which stream the reader is in.
  //
  // CONFIG.SHOP_URL is /pricing — Concussion Clinical Mastery, the physio/osteo
  // stream. An exercise physiologist reading the ESSA-accredited CRM landing
  // and clicking the persistent top-right "Enrol" was therefore taken to the
  // wrong product for their registration, with no way to tell until the
  // checkout named it. ESSA lists the course to its members on 20 Aug, so this
  // is the nav that audience will arrive under. Keep EP readers in the EP
  // stream; everyone else is unaffected.
  const onCrmSurface =
    pathname === '/concussion-rehab-mastery' || pathname.startsWith('/ep-course')
  const enrolHref = onCrmSurface ? '/concussion-rehab-mastery#pricing-cards' : CONFIG.SHOP_URL

  // Auth-aware nav: detect login state
  const [auth, setAuth] = useState<AuthState>(null)
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data.user) {
          setAuth({ accessLevel: data.user.accessLevel, ownsCrm: data.user.ownsCrm === true })
        } else {
          setAuth({ accessLevel: '', ownsCrm: false }) // not logged in
        }
      })
      .catch(() => setAuth({ accessLevel: '', ownsCrm: false }))
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
    // A CRM buyer is 'preview' on the CCM ladder but a paying customer of the
    // EP stream — "My Course" must be THEIR course, not the free SCAT one.
    navItems.push({
      label: 'My Course',
      path: auth.ownsCrm ? '/ep-course' : '/scat-course',
      accent: false,
    })
  } else {
    navItems.push({ label: 'Dashboard', path: '/dashboard', accent: false })
  }

  const isLoggedIn = auth && auth.accessLevel !== ''

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    // The server clears every identity-bearing COOKIE, but the browser also
    // holds two identity-bearing localStorage keys that survived sign-out:
    //   cea_user_email  — set by /auth/verify on every magic-link login, and
    //                     attached as user_email to EVERY subsequent
    //                     analytics event (lib/analytics.ts). Left behind, the
    //                     next person on a shared clinic front-desk machine
    //                     had their whole anonymous browsing session written
    //                     into analytics_events under the previous clinician's
    //                     email address.
    //   login_redirect  — a stashed gated destination; a stale one sends the
    //                     NEXT sign-in to a page that user may not be entitled
    //                     to, producing a bounce instead of their dashboard.
    // clearIdentity() existed but had no caller anywhere in the codebase.
    clearIdentity()
    try { localStorage.removeItem('login_redirect') } catch { /* private mode */ }
    setAuth({ accessLevel: '', ownsCrm: false })
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
            href={logoHref}
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-accent rounded"
            aria-label="Concussion Education Australia home"
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
              Concussion Education Australia
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
            {/* An action, not a link — this was an <a href="/"> with
                preventDefault, which read as navigation to assistive tech and
                tripped no-html-link-for-pages. */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-[13px] font-medium px-3 py-2 rounded-md transition-colors text-[var(--muted-foreground)] hover:bg-[rgba(13,115,119,0.04)]"
              >
                Logout
              </button>
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
                href={enrolHref}
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
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                className="text-left text-sm py-2.5 px-3 rounded-md transition-colors text-[var(--muted-foreground)] hover:bg-[rgba(13,115,119,0.04)]"
              >
                Logout
              </button>
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
                href={enrolHref}
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
