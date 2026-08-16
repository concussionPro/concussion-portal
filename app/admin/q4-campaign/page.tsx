'use client'

import { useEffect, useState } from 'react'

/**
 * /admin/q4-campaign — the Q4 course-registration blast tracker. Live counts
 * from /api/admin/q4-campaign; every number is zero until the blast fires.
 */
export default function Q4CampaignPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/admin/q4-campaign', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setErr(String(e)))
    // Dry-run audience preview from the blast route itself — the PLANNED
    // campaign is visible before anything fires (owner: "its empty").
    fetch('/api/admin/quarterly-practical-blast', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setPlan)
      .catch(() => null)
  }, [])

  const sends = (data?.blastSends as { segment: string; n: number }[] | undefined) ?? []
  const cities = (data?.cityNominations as { city: string; nominations: number }[] | undefined) ?? []
  const traffic = data?.campaignTraffic as { sessions: number; checkout_starts: number; purchases: number } | null
  const attributed = data?.attributedPurchases as { buyers: number; revenue_aud: number } | null

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">Q4 course-registration campaign</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Melbourne Sat 7 Nov blast · one-click Sydney/Byron nominations · attributed revenue. All
        zeros until the blast fires.
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!data && !err && <p className="text-sm text-muted-foreground">Loading…</p>}
      {plan != null && (
        <section className="mb-8 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-2">Planned blast (dry-run, nothing sent)</h2>
          <p className="text-sm text-amber-900">
            Audience {String((plan.audience as Record<string, unknown> | undefined)?.total ?? '—')} ·
            interest register {String((plan.audience as Record<string, unknown> | undefined)?.registeredInterest ?? '—')} ·
            recent free users {String((plan.audience as Record<string, unknown> | undefined)?.otherSegment ?? '—')} ·
            suppressed {String((plan.audience as Record<string, unknown> | undefined)?.suppressedOrErrored ?? '—')}
          </p>
          <a href="/preview/blast" className="mt-2 inline-block text-sm font-semibold text-amber-900 underline">Preview the email →</a>
        </section>
      )}
      {data && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Sends</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sends.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No sends yet.</p>}
              {sends.map((s) => (
                <div key={s.segment} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-bold text-foreground">{s.n}</p>
                  <p className="text-xs text-muted-foreground">{s.segment === 'registered' ? 'Interest register' : 'Recent free users'}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              City nominations — the run/no-run numbers
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {['sydney', 'byron-bay'].map((slug) => {
                const row = cities.find((c) => c.city === slug)
                return (
                  <div key={slug} className="rounded-xl border-2 border-teal-200 bg-teal-50/40 p-4">
                    <p className="text-3xl font-bold text-teal-800">{row?.nominations ?? 0}</p>
                    <p className="text-xs font-semibold text-teal-700">{slug === 'sydney' ? 'Sydney (pencilled late Nov)' : 'Byron Bay (late Oct or Dec)'}</p>
                  </div>
                )
              })}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Traffic & revenue</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{traffic?.sessions ?? 0}</p>
                <p className="text-xs text-muted-foreground">Campaign sessions</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{traffic?.checkout_starts ?? 0}</p>
                <p className="text-xs text-muted-foreground">Checkout starts</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{attributed?.buyers ?? 0}</p>
                <p className="text-xs text-muted-foreground">Attributed buyers</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">A${(attributed?.revenue_aud ?? 0).toLocaleString('en-AU')}</p>
                <p className="text-xs text-muted-foreground">Attributed revenue</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
