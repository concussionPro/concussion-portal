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
  if (access === 'locked' || access === 'demo') {
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
  const trialUsed = usage?.plan === 'trial' && usage.cap != null && !usage.canAddPatient
  const subtitle =
    hasClinic === false
      ? 'Create your clinic code first — plans attach to the code your patients use. '
      : usage?.plan === 'active'
        ? 'Your clinic is already on a plan. Change or cancel it from Manage billing in your workspace rather than starting a second subscription. '
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
                {hasClinic === false ? (
                  <Link
                    href="/clinical-testing"
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Create your clinic code
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void subscribe(t.plan)}
                    disabled={loading !== null || usage?.plan === 'active'}
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                  >
                    {loading === t.plan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading === t.plan ? 'Starting…' : usage?.plan === 'active' ? 'Manage in billing portal' : 'Choose ' + t.name}
                  </button>
                )}
              </div>
            ))}
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          <p className="mt-5 text-xs text-muted-foreground">Prices in AUD ex GST. Billed monthly via Stripe; cancel anytime from your billing portal.</p>
        </div>
      </main>
    </div>
  )
}
