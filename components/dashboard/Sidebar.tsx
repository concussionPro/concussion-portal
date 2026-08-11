'use client'

import { Home, BookOpen, Brain, Activity, Settings, LogOut, User, FileText, Library, Menu, X, BookMarked, ExternalLink, Cloud, Loader2, AlertCircle, WifiOff, CheckCircle2, Lock, Mail, MapPin, Stethoscope, Sparkles, ArrowRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONFIG, upgradePriceFor } from '@/lib/config'
import { holdsOnlineWithoutPracticalDay } from '@/lib/practical-day-seat'
import { ProgressRing } from './ProgressRing'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import { isOwnerEmail } from '@/lib/owner'
import { clearIdentity } from '@/lib/analytics'
import { clearLocalLearnerState } from '@/contexts/ProgressContext'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
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
  ownerOnly?: boolean
  clinicalGated?: boolean
  /** Shown only to CRM (EP stream) owners — the CCM sidebar never links it. */
  crmOnly?: boolean
}> = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Learning Suite', href: '/learning' },
  // CRM has NO standalone sidebar entry (owner 2026-08-07: "why is rehab
  // mastery showing in sidebar? it should just live in learning suite with
  // others"). The Learning Suite is the single course catalogue: it already
  // renders CRM with `accessible: ownsCrm` and CCM with `accessible: isPaidCcm`,
  // so a CRM buyer sees their course open and CCM locked, and a CCM buyer sees
  // the reverse. A second top-level link duplicated that and made CRM look like
  // a different kind of thing from every other course.
  // Clinical Testing = the live patient tools (SST Trainer + pre-season
  // baseline). PRE-RELEASE: ownerOnly until the subscription launch
  // (owner directive 2026-07-05) — hidden from every other dashboard.
  { icon: Stethoscope, label: 'Clinical Testing', href: '/clinical-testing', clinicalGated: true },
  // The patient-roster hub was only reachable through the SST setup rail —
  // invisible exactly where a clinic looks first (owner, 2026-08-11). The
  // /clinical-testing/hub redirector resolves this clinician's code + viewKey
  // and forwards; DEMO00 goes keyless.
  { icon: Radio, label: 'Live Hub', href: '/clinical-testing/hub', clinicalGated: true },
  { icon: FileText, label: 'Clinical Toolkit', href: '/clinical-toolkit', paidOnly: true },
  { icon: Mail, label: 'Outreach Kit', href: '/outreach-kit', paidOnly: true },
  // Admin Workflow removed: Hub Pack material (clinic operations), not
  // individual-course content — /admin-workflow now explains + pitches the Hub.
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
  // EP/CRM modules are namespaced 201-208 in the shared progress store
  // (EP_MODULE_ID_OFFSET) — getTotalCompletedModules() only counts CCM 1-8, so a
  // CRM buyer's ring would otherwise read 0/8 forever.
  const crmCompletedModules = Object.values(progress).filter(
    (p) => p.moduleId >= 201 && p.moduleId <= 208 && p.completed
  ).length
  const { user: sessionUser } = useSession()
  const clinicalAccess = useClinicalAccess()
  const showClinicalTesting = ['owner', 'course', 'sst', 'demo'].includes(clinicalAccess)
  // Demo viewers (/demo/clinic prospects, reviewer previews): browsing is
  // real, identity is synthetic — hide account affordances (sync line,
  // sign-out, Settings) and show a clean demo card instead.
  const isDemo = sessionUser?.isDemo === true
  const user = sessionUser ? {
    id: sessionUser.id || '1',
    email: sessionUser.email || '',
    name: sessionUser.name || sessionUser.email?.split('@')[0] || 'Student',
    accessLevel: sessionUser.accessLevel || 'preview',
    enrolledAt: sessionUser.createdAt || '',
    // Clinic Hub Pack seat — 'full-course' access, ONLINE only.
    hubPackSeat: sessionUser.hubPackSeat === true,
  } : null
  // THREE tiers, not two. A CRM buyer's access_level stays 'preview' (streams
  // are isolated — lib/crm-course.ts), so a single isPreview flag was wrong in
  // both directions: keyed on accessLevel it showed a paying EP customer a
  // free-trial sidebar; flipped off wholesale it would have unlocked the CCM
  // paid tools they never bought.
  //   isCcmPaid  — bought CCM: CCM content + every CCM paid tool
  //   ownsCrm    — bought CRM: /ep-course ONLY; CCM tools stay locked (siloed)
  //   isFreeTier — bought neither: the free SCAT trial funnel
  const ownsCrm = sessionUser?.ownsCrm === true
  const isCcmPaid = user?.accessLevel === 'online-only' || user?.accessLevel === 'full-course'
  const isFreeTier = !isCcmPaid && !ownsCrm
  // In-person upgrade price for the user's NOMINATED city (single source:
  // upgradePriceFor tracks the early-bird window). No city yet → the generic
  // early-bird difference, and /upgrade collects the nomination.
  const upgradeCitySlug = sessionUser?.workshopLocation || null
  const upgradePrice = upgradePriceFor(upgradeCitySlug)
  // Hub Pack seat: paid ONLINE access with no practical-day seat. The add-on
  // is priced per clinician for the clinic, not the solo online→Complete
  // difference, and has no self-serve checkout — so it informs, not sells.
  const isHubPackSeat = user?.accessLevel === 'full-course' && user?.hubPackSeat === true
  const upgradeCityLabel =
    Object.values(CONFIG.LOCATIONS).find((l) => l.slug === upgradeCitySlug)?.city ?? null
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
    // The server clears every identity-bearing COOKIE, but the browser also
    // holds two identity-bearing localStorage keys that survived sign-out.
    // This is the sign-out a paying student actually clicks, so it is the one
    // that mattered most. See components/SiteNav.tsx for the full rationale:
    //   cea_user_email  — attached as user_email to EVERY subsequent analytics
    //                     event, so on a shared clinic machine the next
    //                     person's browsing was recorded under the previous
    //                     clinician's email address.
    //   login_redirect  — a stale gated destination bounces the NEXT sign-in.
    //   concussion-pro-progress — the course progress blob (added 2026-08-06).
    //                     Not user-scoped, and the next sign-in MERGES it into
    //                     whoever logs in next, carrying quiz answers that the
    //                     certificate route treats as proof of completion.
    // Runs even if the logout POST threw — the browser state is ours to clear.
    clearIdentity()
    clearLocalLearnerState()
    try { localStorage.removeItem('login_redirect') } catch { /* private mode */ }
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
              CEA<span className="text-accent"> Portal</span>
            </h1>
          </div>
          <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
            Concussion Education Australia
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
        <div className="mb-8 shrink-0">
          <ProgressRing
            progress={isCcmPaid ? completedModules : ownsCrm ? crmCompletedModules : scatCompletedModules}
            total={isFreeTier ? 3 : 8}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {/* Preview (free) users see the paid CONTENT features (Toolkit,
              Outreach, References, Complete Ref) LOCKED with a carrot — only the
              free course + free items are open. Clinical Testing is different:
              it is filtered out entirely unless the visitor is entitled
              (owner/course/sst), so it never renders locked. CRM (EP) items
              render only for CRM owners — the streams stay isolated. */}
          {navItems.filter((item) =>
            (!item.ownerOnly || isOwnerEmail(sessionUser?.email)) &&
            (!item.clinicalGated || showClinicalTesting) &&
            (!item.crmOnly || ownsCrm) &&
            // No account to configure in a demo — Settings is noise there.
            !(isDemo && item.href === '/settings')
          ).map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            // paidOnly items are CCM entitlements (Toolkit, Outreach Kit,
            // References, Complete Reference) — they lock for anyone without CCM,
            // INCLUDING CRM buyers. The destination pages gate on accessLevel
            // themselves, so unlocking the icon for a CRM buyer would only have
            // sent them to a page that turns them away.
            // Clinical Testing is different: it only reaches this list when
            // showClinicalTesting is true (owner/course/sst entitled), so
            // padlocking it told an entitled user they were locked out of a page
            // that lets them straight in.
            const isLocked = item.paidOnly && !isCcmPaid

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

        {/* Upgrade carrot — genuinely FREE-tier users only. A CRM buyer is a
            paying customer of the other stream, not a free-trial lead, and must
            never be shown the free-course upgrade funnel. */}
        {isFreeTier && (
          <Link
            href="/pricing"
            onClick={closeMobileMenu}
            className="mt-3 block shrink-0 rounded-xl bg-gradient-to-br from-accent to-accent-dark p-3.5 text-white shadow-md shadow-accent/20 hover:shadow-lg hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              <span className="text-sm font-bold">Unlock everything</span>
            </div>
            <p className="text-[11px] text-white/85 leading-snug mb-2">
              The full 8-module course, the clinical tools (SST + Baseline) and every reference — assess and manage, don&rsquo;t just recognise.
            </p>
            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-white/15 rounded-lg px-2.5 py-1 group-hover:bg-white/25 transition-colors">
              Enrol — A${CONFIG.COURSE.PRICE_ONLINE}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        {/* In-person upgrade — ONLINE-ONLY buyers, on every dashboard page.
            Upgrade CTAs existed on individual pages (dashboard bento, module
            completion, references, toolkit) but never on the sidebar, the one
            surface present throughout the dash. Price is DERIVED from
            upgradePriceFor() for the user's nominated city — never hardcoded —
            so it tracks the early-bird window automatically.

            Clinic Hub Pack seats read as 'full-course' but bought ONLINE seats
            only, so they belong in this audience too — with the CLINIC add-on
            price (CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE) and NOT the solo
            /upgrade checkout, which sells a different product. */}
        {holdsOnlineWithoutPracticalDay({
          accessLevel: user?.accessLevel,
          hubPackSeat: user?.hubPackSeat,
        }) && (
          <Link
            href={isHubPackSeat ? '/in-person' : '/upgrade'}
            onClick={closeMobileMenu}
            className="mt-3 block shrink-0 rounded-xl border border-amber-300/70 bg-gradient-to-br from-amber-50 to-white p-3.5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-amber-700" strokeWidth={2} />
              <span className="text-sm font-bold text-amber-900">Add the practical day</span>
            </div>
            <p className="text-[11px] text-amber-900/75 leading-snug mb-2">
              {upgradeCityLabel
                ? `Hands-on VOMS, BESS, cervical & vestibular assessment — ${upgradeCityLabel}.`
                : 'Hands-on VOMS, BESS, cervical & vestibular assessment. Nominate your city.'}
              {' '}Takes you to {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours.
            </p>
            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-amber-100 text-amber-900 rounded-lg px-2.5 py-1 group-hover:bg-amber-200 transition-colors">
              {isHubPackSeat
                ? `Add-on — A$${CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE}/clinician`
                : `Upgrade — A$${upgradePrice}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        {/* Footer */}
        <div className="shrink-0 pt-5 border-t border-white/30 space-y-3">
          {user && isDemo ? (
            /* Demo identity: no email, no sync, no sign-out — a clean badge
               that says what this is and where it leads. */
            <div className="glass-premium rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" />
                <p className="text-sm font-bold text-foreground m-0">Demo access</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug m-0">
                Explore freely — nothing you do here is saved.
              </p>
            </div>
          ) : user ? (
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
          ) : null}

          <div className="px-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              AHPRA Aligned
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">CPD Certificates</p>
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
