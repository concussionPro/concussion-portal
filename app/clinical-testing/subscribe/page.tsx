'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'
import { CONFIG, SST_TIERS, sstTierAllowance } from '@/lib/config'
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react'

/**
 * /clinical-testing/subscribe — convert off the free trial. Presents the
 * three Clinical Testing tiers and starts a Stripe subscription Checkout via
 * /api/sst/subscribe. Amounts shown mirror the Stripe prices (kept in sync
 * manually — the source of truth for billing is the Stripe price); the display
 * model itself comes from CONFIG's SST_TIERS so every surface agrees.
 */
const TIERS = SST_TIERS.map((t) => ({
  plan: t.plan,
  name: t.name,
  who: sstTierAllowance(t),
  price: `A$${t.monthlyAud}`,
  popular: t.popular,
  /** kept so the page can mark the CURRENT plan from server-reported usage */
  activePatientCap: t.activePatientCap as number | null,
}))

export default function SubscribePage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

interface Usage {
  plan: 'trial' | 'active'
  patientCount: number
  cap: number | null
  canAddPatient: boolean
  /** On the trial ALLOWANCE because an enrolment's included year lapsed — a
   *  paying course buyer, not a trialist. Changes what this page may say. */
  includedLapsed?: boolean
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">{children}</main>
    </div>
  )
}

function Shell() {
  const { isLoading } = useSession()
  // GATE (2026-08-05 crawl #7): this was the only page in the segment with no
  // access branch — a free-preview visitor or a demo viewer saw the full
  // pricing page and got the literal word "Forbidden" on clicking a tier.
  const access = useClinicalAccess()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<Usage | null>(null)
  const [hasClinic, setHasClinic] = useState<boolean | null>(null)

  useEffect(() => {
    if (!(access === 'owner' || access === 'course' || access === 'sst')) return
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setHasClinic(!!d?.clinic)
        setUsage((d?.usage as Usage) ?? null)
      })
      .catch(() => setHasClinic(null))
  }, [access])

  // An ACTIVE clinic's tier buttons said "Manage in billing portal" and were
  // DISABLED — a labelled control that could not act, on the one page a clinic
  // lands on to change plan. Upgrades are portal-only by design (a second
  // checkout 409s), so the page has to be able to OPEN the portal.
  const [portalBusy, setPortalBusy] = useState(false)
  const PORTAL_COPY: Record<string, string> = {
    'no-customer': 'This clinic’s access is complimentary — there’s no subscription to manage.',
    'not-owner': 'Only the clinic owner can manage billing.',
    'no-clinic': 'Create your clinic code before managing billing.',
  }
  async function openBillingPortal() {
    if (portalBusy) return
    setPortalBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sst/billing-portal', { method: 'POST', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.url) window.location.href = data.url
      else setError(PORTAL_COPY[data?.code as string] || data?.error || 'Could not open billing portal.')
    } catch {
      setError('Could not open billing portal — check your connection and try again.')
    } finally {
      setPortalBusy(false)
    }
  }

  async function subscribe(plan: string) {
    setLoading(plan)
    setError('')
    try {
      const res = await fetch('/api/sst/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data?.message || data?.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.')
      setLoading(null)
    }
  }

  if (isLoading || access === 'loading') {
    return <Frame><p className="text-sm text-muted-foreground">Loading…</p></Frame>
  }
  if (access === 'unreleased') return <ClinicalTestingComingSoon />
  // FAIL CLOSED. The access route also returns 'none' (no session) — a value
  // outside the ClinicalAccess union — which fell straight through to the live
  // pricing page and a "Forbidden" at checkout. Anything not explicitly
  // entitled gets the locked view.
  if (!(access === 'owner' || access === 'course' || access === 'sst')) {
    return (
      <Frame>
        <div className="mx-auto max-w-2xl">
          <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Clinical Testing plans
            </h1>
            <p className="mx-auto mb-5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              {access === 'demo'
                ? 'This is the demo workspace — subscriptions are set up on your own clinic code. Book a scoping call and we’ll size the commercials for your organisation.'
                : 'The Clinical Testing suite comes with your enrolment. Unlock it first — plans only apply once you’re running your own clinic code.'}
            </p>
            <a
              href={access === 'demo' ? 'https://cal.com/zac-lewis-so8zjs/30min' : CONFIG.SHOP_URL}
              {...(access === 'demo' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-accent/90"
            >
              {access === 'demo' ? 'Book 30 minutes' : 'Unlock with Concussion Clinical Mastery'}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Frame>
    )
  }

  // Copy states the TRUTH about this clinic's usage — the page used to tell
  // every visitor "You've used your 3 free trial patients" unconditionally.
  const isActive = usage?.plan === 'active'
  const trialUsed = usage?.plan === 'trial' && usage.cap != null && !usage.canAddPatient
  const subtitle =
    hasClinic === false
      ? 'Create your clinic code first — plans attach to the code your patients use. '
      : isActive
        ? usage.cap != null && !usage.canAddPatient
          ? `Your plan covers ${usage.cap} active patients and you’re at the limit. Change plan in the billing portal — a second subscription would double-bill you, so checkout is closed here. `
          : 'Your clinic is already on a plan. Change or cancel it in the billing portal — starting a second subscription would double-bill you. '
        : // A clinic whose INCLUDED platform year (bought with a course
          // enrolment) has lapsed is on the trial ALLOWANCE but never was a
          // trialist. "You've used your 3 free trial patients" is false to
          // them and reads as a bait-and-switch on what they were sold.
          usage?.includedLapsed
          ? `The platform year included with your enrolment has ended, so you’re on the free-trial allowance — ${usage.patientCount} of ${usage.cap ?? 3} patients. Subscribe to restore full access; your existing patients keep working either way. `
          : trialUsed
            ? `You’ve used your ${usage?.cap ?? 3} free trial patients. `
            : usage?.plan === 'trial' && usage.cap != null
              ? `You’re on the free trial — ${usage.patientCount} of ${usage.cap} patients used. Subscribe whenever you’re ready; nothing stops until you hit the cap. `
              : ''

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/clinical-testing" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Clinical Testing
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {usage?.plan === 'active' ? 'Your Clinical Testing plan' : 'Subscribe to keep going'}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {subtitle}Plans are priced on active caseload (patients with a session in the last 30
            days) — every plan includes unlimited clinicians, each with their own login. Your
            existing patients keep working either way.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.plan} className="relative flex flex-col rounded-2xl border bg-white p-6" style={{ borderColor: t.popular ? 'var(--accent)' : '#e2e8f0', borderWidth: t.popular ? 2 : 1 }}>
                {t.popular && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-white">Most clinics</span>}
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.who}</p>
                <p className="mt-3 text-3xl font-extrabold text-foreground">{t.price}<span className="text-sm font-semibold text-muted-foreground"> / mo</span></p>
                {/* "Your current plan" is asserted ONLY from the server's own
                    reported cap, and only for a numeric one — an unlimited cap
                    is equally a comped clinic (tier null), so claiming the
                    Unlimited plan there would be a billing claim we can't back. */}
                {isActive && usage?.cap != null && usage.cap === t.activePatientCap && (
                  <p className="mt-1.5 m-0 text-[11px] font-bold text-emerald-700">Your current plan</p>
                )}
                {hasClinic === false ? (
                  <Link
                    href="/clinical-testing"
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Create your clinic code
                  </Link>
                ) : isActive ? (
                  <button
                    type="button"
                    onClick={() => void openBillingPortal()}
                    disabled={portalBusy}
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {portalBusy ? 'Opening…' : 'Change plan in billing portal'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void subscribe(t.plan)}
                    disabled={loading !== null}
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                  >
                    {loading === t.plan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading === t.plan ? 'Starting…' : 'Choose ' + t.name}
                  </button>
                )}
              </div>
            ))}
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          {/* GST: CEA quotes and charges GST-INCLUSIVE prices (lib/tax-invoice.ts
              breaks GST out of the total at 1/11). "ex GST" advertised a 10%
              surcharge that Stripe never adds — the amount shown IS the amount
              billed. */}
          <p className="mt-5 text-xs text-muted-foreground">Prices in AUD, inclusive of GST. Billed monthly via Stripe; cancel anytime from your billing portal.</p>
        </div>
      </main>
    </div>
  )
}
