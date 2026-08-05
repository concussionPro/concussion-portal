'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider } from '@/contexts/SessionContext'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * /clinical-testing/subscribe — convert off the free trial. Presents the
 * three Clinical Testing tiers and starts a Stripe subscription Checkout via
 * /api/sst/subscribe. Amounts shown mirror the Stripe prices (kept in sync
 * manually — the source of truth for billing is the Stripe price).
 */
const TIERS = [
  { plan: 'single', name: 'Starter', who: 'Up to 5 active patients', price: 'A$49', popular: false },
  { plan: 'clinic', name: 'Clinic', who: 'Up to 10 active patients', price: 'A$99', popular: true },
  { plan: 'enterprise', name: 'Unlimited', who: 'Unlimited patients', price: 'A$149', popular: false },
] as const

export default function SubscribePage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function Shell() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/clinical-testing" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Clinical Testing
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Subscribe to keep going</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            You&rsquo;ve used your 3 free trial patients. Plans are priced on active caseload
            (patients with a session in the last 30 days) — every plan includes unlimited
            clinicians, each with their own login. Your existing patients keep working either way.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.plan} className="relative flex flex-col rounded-2xl border bg-white p-6" style={{ borderColor: t.popular ? 'var(--accent)' : '#e2e8f0', borderWidth: t.popular ? 2 : 1 }}>
                {t.popular && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-white">Most clinics</span>}
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.who}</p>
                <p className="mt-3 text-3xl font-extrabold text-foreground">{t.price}<span className="text-sm font-semibold text-muted-foreground"> / mo</span></p>
                <button
                  type="button"
                  onClick={() => void subscribe(t.plan)}
                  disabled={loading !== null}
                  className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading === t.plan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading === t.plan ? 'Starting…' : 'Choose ' + t.name}
                </button>
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
