'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useSession, type SessionUser } from '@/contexts/SessionContext'
import { CONFIG } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

// Pages where the HARD (generic) sticky CTA should NOT appear.
// Keep in sync (in intent) with ExitIntentPopup EXCLUDED_PREFIXES: workshop
// pages (/courses/*) carry their own CTAs — don't stack another on top.
const EXCLUDED_PATHS = [
  '/pricing',
  '/courses',
  '/checkout',
  '/login',
  '/dashboard',
  '/settings',
  '/learning',
  '/modules',
  '/admin',
  '/auth',
  '/scat-course',
  '/scat-forms',
  '/clinical-toolkit',
  '/resources',
  '/references',
  '/complete-reference',
  '/certificate',
  // Product apps + their landings (owner directive 2026-07-04): no course
  // cross-sell chrome on patient/clinic product surfaces.
  '/preseason',
  '/sst-trainer',
  '/platform',
  '/scat-mastery',
  '/preview',
  // Lead-capture page — the $-course sticky bar competes with the email gate.
  '/scat6-download',
  // 2026-08-11 (owner, MSCC demo prep): clinician workspace + demo surfaces —
  // product demonstrations, often screen-shared to a prospect clinic. No
  // course cross-sell chrome there (mirrors ExitIntentPopup).
  '/clinical-testing',
  '/clinical-hub',
  '/demo',
  '/mscc-demo',
  // WRONG-STREAM CROSS-SELL (2026-08-06). This bar links to /pricing, which is
  // Concussion Clinical Mastery — the physio/osteo/chiro product. It was
  // rendering over the exercise-physiology surfaces (/concussion-rehab-mastery
  // is the ESSA-accredited CRM landing, /ep-course its course home), so an EP
  // arriving from ESSA got a persistent bottom bar selling them the course
  // their registration is NOT the audience for. Same defect class as the
  // top-right "Enrol" fix in SiteNav.
  '/concussion-rehab-mastery',
  '/ep-course',
  // SST / clinical-suite is a separate product with its own funnel and its own
  // pricing page. /clinical-suite/start is the paid-trial signup form — a
  // fixed bottom bar sits over its submit button on a 375px viewport.
  '/clinical-suite',
// International audience pages (2026-08-15, owner: "clean everything for cata
  // traffic"): the bar advertises the AU product — 16 CPD hours, AUD pricing —
  // to visitors who are geo-priced and CPD-credited differently. Every intl
  // surface carries its own price card; no AU cross-sell chrome on any of them.
  '/cata', '/canada', '/acsm', '/uk', '/pricing-international', '/international',
  '/cep-uk', '/hpcsa', '/csep', '/cimspa',
]

const SCAT_SOFT_DISMISS_KEY = 'scat_soft_cta_dismissed'
const HARD_DISMISS_KEY = 'sticky_cta_dismissed'

/** Free SCAT lead surfaces that get a soft CCM promo (once / session), not the hard bar. */
function isScatSoftPath(pathname: string): boolean {
  if (pathname.startsWith('/scat-mastery') || pathname.startsWith('/scat-course')) return true
  // Free SCAT modules 101–103 only — not 104 awareness, not paid 1–8.
  return /^\/modules\/10[123](\/|$)/.test(pathname)
}

function isFreeScatAudience(user: SessionUser | null): boolean {
  // Unsigned visitors on the lead magnet: soft CTA is fine.
  if (!user) return true
  // CRM buyers carry accessLevel 'preview' — never pitch them CCM here.
  if (user.ownsCrm) return false
  // Paid CCM / online-only: no soft upsell chrome on the free course they already outgrew.
  if (user.accessLevel === 'full-course' || user.accessLevel === 'online-only') return false
  // Demo tours are product sales surfaces — keep course chrome off them.
  if (user.isDemo) return false
  return user.accessLevel === 'preview'
}

export function StickyCTA() {
  const pathname = usePathname()
  const { user, isLoading: sessionLoading } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [scatDismissed, setScatDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  const scatSoft = isScatSoftPath(pathname)
  const freeScat = isFreeScatAudience(user)

  // Show after scrolling 400px
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if dismissed this session (separate keys so hard/soft don't fight)
  useEffect(() => {
    if (sessionStorage.getItem(HARD_DISMISS_KEY)) setDismissed(true)
    if (sessionStorage.getItem(SCAT_SOFT_DISMISS_KEY)) setScatDismissed(true)
  }, [])

  // ── Soft SCAT6 promo sticky (leak board: monetize SCAT lead magnets, once not spam)
  if (!sessionLoading && scatSoft && freeScat && !scatDismissed && visible) {
    const promoHref = `/pricing?promo=${CONFIG.COURSE.PROMO_CODE}`
    const handleScatDismiss = () => {
      setScatDismissed(true)
      sessionStorage.setItem(SCAT_SOFT_DISMISS_KEY, '1')
    }
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 animate-slideUp">
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 border-t border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <p className="text-sm text-white/85 truncate">
                <span className="font-semibold text-white">
                  SCAT6 completers: A${CONFIG.COURSE.SCAT_DISCOUNT_AUD} off CCM
                </span>
                <span className="hidden sm:inline">
                  {' '}· code {CONFIG.COURSE.PROMO_CODE} · VOMS, BESS & return-to-play
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={promoHref}
                onClick={() => trackEvent('upgrade_cta_click', { source: 'scat_soft_sticky', promo: CONFIG.COURSE.PROMO_CODE })}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-900 rounded-lg text-sm font-bold hover:bg-white/90 transition-all"
              >
                Enrol Online — A${CONFIG.COURSE.SCAT_DISCOUNT_AUD} off
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/clinical-suite"
                onClick={() => trackEvent('upgrade_cta_click', { source: 'scat_soft_sticky_sst' })}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/10 transition-all"
              >
                Or SST
              </Link>
              <button
                onClick={handleScatDismiss}
                className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't show hard sticky on excluded paths / signed-in users / soft-path handling
  const isExcluded =
    !!user || sessionLoading || scatSoft || EXCLUDED_PATHS.some(p => pathname.startsWith(p))
  if (isExcluded || dismissed || !visible) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(HARD_DISMISS_KEY, '1')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slideUp">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate">
              <span className="font-semibold text-white">Stop guessing on concussion cases.</span>
              <span className="hidden sm:inline"> Online + hands-on training · {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-white/90 transition-all"
            >
              Enrol from A${CONFIG.COURSE.PRICE_ONLINE}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
