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
  const cta = data?.ctaClicks as { book_melbourne: number; upgrade: number; start_online: number } | null
  const nominators = (data?.nominationDetail as { city: string; email: string; name: string; created_at: string; country: string | null }[] | undefined) ?? []
  const suspects = (data?.suspectDetail as { city: string; email: string; name: string; created_at: string; country: string | null }[] | undefined) ?? []
  const clicks = (data?.clickSessions as { first_ev: string; ip: string; country: string | null; dur_s: number; events: number; pages: number; links: (string | null)[]; user_email: string | null; ip_distinct_links: number; verdict: 'scanner' | 'human' | 'unclear' }[] | undefined) ?? []
  const mailSends = data?.mailSends as { total: number; upgrade: number; registered: number; other: number } | null
  const mailCta = data?.mailCtaClicks as { train: number; train_upgrade: number } | null
  const mailTraffic = data?.mailTraffic as { sessions: number; checkout_starts: number; purchases: number } | null
  const mailClicks = (data?.mailClickSessions as { session_id: string; first_ev: string; ip: string; country: string | null; dur_s: number; events: number; pages: number; user_email: string | null; verdict: 'scanner' | 'human' | 'unclear' }[] | undefined) ?? []
  const mailAbandons = (data?.mailAbandons as { session_id: string; started_at: string; user_email: string | null; ip: string }[] | undefined) ?? []
  const attributed = data?.attributedPurchases as { buyers: number; revenue_aud: number } | null

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">Q4 course-registration campaign</h1>
      <p className="text-sm text-muted-foreground mb-8">
        LIVE: Mac Mail 1:1 round (from 18 Aug) — 88 personal sends from zac@, staggered.
        The 16 Aug Resend blast is collapsed below as history.
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!data && !err && <p className="text-sm text-muted-foreground">Loading…</p>}
      {plan != null && (
        <details className="mb-8">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            16 Aug Resend blast — audience snapshot (historical, superseded by the 1:1 round)
          </summary>
        <section className="mt-3 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 mb-2">Blast audience as planned (fired 16 Aug)</h2>
          <p className="text-sm text-amber-900">
            Audience {String((plan.audience as Record<string, unknown> | undefined)?.total ?? '—')} ·
            interest register {String((plan.audience as Record<string, unknown> | undefined)?.registeredInterest ?? '—')} ·
            recent free users {String((plan.audience as Record<string, unknown> | undefined)?.otherSegment ?? '—')} ·
            suppressed {String((plan.audience as Record<string, unknown> | undefined)?.suppressedOrErrored ?? '—')}
          </p>
          <a href="/preview/blast" className="mt-2 inline-block text-sm font-semibold text-amber-900 underline">Preview the email →</a>
          {Array.isArray(plan.recipients) && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Full recipient list ({(plan.recipients as unknown[]).length})
              </p>
              <div className="max-h-[480px] overflow-y-auto rounded-lg border border-amber-200 bg-white">
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0 bg-amber-50">
                    <tr className="text-left text-amber-900">
                      <th className="px-3 py-1.5">Email</th>
                      <th className="px-3 py-1.5">Name</th>
                      <th className="px-3 py-1.5">Segment</th>
                      <th className="px-3 py-1.5">City reg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(plan.recipients as { email: string; name: string; registered: boolean; city: string | null }[]).map((r) => (
                      <tr key={r.email} className="border-t border-slate-100">
                        <td className="px-3 py-1">{r.email}</td>
                        <td className="px-3 py-1">{r.name}</td>
                        <td className="px-3 py-1">{r.registered ? 'register' : 'free-60d'}</td>
                        <td className="px-3 py-1">{r.city ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        </details>
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
              Confirmed city nominations — the run/no-run numbers
            </h2>
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              Counts only on-page Confirm taps. Raw email clicks proved to be mail-scanner
              detonations and are quarantined below — they count toward nothing.
            </p>
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
          {nominators.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                Confirmed nominators — message these people directly
              </h2>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2">City</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Clicked</th>
                      <th className="px-3 py-2">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominators.map((n) => (
                      <tr key={n.email + n.city} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 font-semibold">{n.city}</td>
                        <td className="px-3 py-1.5"><a className="text-teal-700 underline" href={`mailto:${n.email}`}>{n.email}</a></td>
                        <td className="px-3 py-1.5">{n.name || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-500">{new Date(n.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className={`px-3 py-1.5 font-semibold ${n.country === 'AU' ? 'text-emerald-700' : n.country ? 'text-amber-600' : 'text-slate-400'}`}>{n.country ?? 'unverified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {clicks.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-1">
                Every email click, classified by what it did after landing
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                Human = multiple events over real dwell time. Scanner = one 0-second hit, or the
                same IP walking several of the email&apos;s links. Only human rows are engagement.
              </p>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2">Landed</th>
                      <th className="px-3 py-2">Link</th>
                      <th className="px-3 py-2">Who</th>
                      <th className="px-3 py-2">Country</th>
                      <th className="px-3 py-2">Dwell</th>
                      <th className="px-3 py-2">Events</th>
                      <th className="px-3 py-2">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.map((c, i) => (
                      <tr key={i} className={`border-t border-slate-100 ${c.verdict === 'scanner' ? 'text-slate-400' : ''}`}>
                        <td className="px-3 py-1.5">{new Date(c.first_ev).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-3 py-1.5">{(c.links || []).filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-3 py-1.5">{c.user_email || c.ip}</td>
                        <td className="px-3 py-1.5">{c.country ?? '—'}</td>
                        <td className="px-3 py-1.5">{c.dur_s}s</td>
                        <td className="px-3 py-1.5">{c.events}</td>
                        <td className={`px-3 py-1.5 font-bold ${c.verdict === 'human' ? 'text-emerald-700' : c.verdict === 'scanner' ? 'text-slate-400' : 'text-amber-600'}`}>
                          {c.verdict}{c.ip_distinct_links >= 2 ? ' (multi-link IP)' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {suspects.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-1">
                Quarantined — scanner detonations, NOT nominations
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                These clicks came from Microsoft 365 mail-security sandboxes (Azure IPs, multiple
                links per email hit within seconds). Do not message or count them. If any of these
                people confirm on the landing page later, they move up automatically.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden mb-8 opacity-70">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2">City</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Detonated</th>
                      <th className="px-3 py-2">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspects.map((n) => (
                      <tr key={n.email + n.city} className="border-t border-slate-100 text-slate-500">
                        <td className="px-3 py-1.5">{n.city}</td>
                        <td className="px-3 py-1.5">{n.email}</td>
                        <td className="px-3 py-1.5">{new Date(n.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-3 py-1.5">{n.country ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Email CTA clicks (tracked on-site — Resend tracking is off)
            </h2>
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              Raw landings — scanner detonations are NOT filtered out of these, so treat them as a
              ceiling, not humans. Only the confirmed nominations above are verified people.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{cta?.book_melbourne ?? 0}</p>
                <p className="text-xs text-muted-foreground">Take a Melbourne seat</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{cta?.upgrade ?? 0}</p>
                <p className="text-xs text-muted-foreground">Upgrade ($693)</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{cta?.start_online ?? 0}</p>
                <p className="text-xs text-muted-foreground">Start online</p>
              </div>
            </div>
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

          <section className="mt-10 rounded-2xl border-2 border-teal-200 bg-teal-50/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800 mb-1">
              Mac Mail 1:1 round — LIVE (from 18 Aug)
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Personal sends from zac@ (clean bare links — traffic keyed on the email-only pages) ·
              abandons below are the follow-up list.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
              <div className="rounded-xl border-2 border-teal-300 bg-white p-4">
                <p className="text-2xl font-bold text-teal-800">{mailSends?.total ?? 0}<span className="text-sm font-semibold text-muted-foreground">/88</span></p>
                <p className="text-xs text-muted-foreground">Sent so far</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{mailCta?.train ?? 0}</p>
                <p className="text-xs text-muted-foreground">Seat-link clicks</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{mailCta?.train_upgrade ?? 0}</p>
                <p className="text-xs text-muted-foreground">Upgrade-link clicks</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{mailTraffic?.sessions ?? 0}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{mailTraffic?.checkout_starts ?? 0}</p>
                <p className="text-xs text-muted-foreground">Checkout starts</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-2xl font-bold text-foreground">{mailTraffic?.purchases ?? 0}</p>
                <p className="text-xs text-muted-foreground">Purchases</p>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">
              Checkout abandons — follow up (no purchase after checkout_start)
            </h3>
            {mailAbandons.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-5">None yet.</p>
            ) : (
              <table className="w-full text-xs mb-5">
                <thead><tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-3">Started</th><th className="py-1 pr-3">Email</th><th className="py-1">IP</th>
                </tr></thead>
                <tbody>
                  {mailAbandons.map((a) => (
                    <tr key={a.session_id} className="border-t border-slate-200">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(a.started_at).toLocaleString('en-AU')}</td>
                      <td className="py-1.5 pr-3 font-semibold text-foreground">{a.user_email || <span className="text-muted-foreground font-normal">anonymous</span>}</td>
                      <td className="py-1.5 text-muted-foreground">{a.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Click sessions (nav depth · human/scanner verdict)
            </h3>
            {mailClicks.length === 0 ? (
              <p className="text-xs text-muted-foreground">None yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-3">First seen</th><th className="py-1 pr-3">Who</th>
                  <th className="py-1 pr-3">Events</th><th className="py-1 pr-3">Pages</th>
                  <th className="py-1 pr-3">Duration</th><th className="py-1">Verdict</th>
                </tr></thead>
                <tbody>
                  {mailClicks.map((c) => (
                    <tr key={c.session_id + c.first_ev} className="border-t border-slate-200">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(c.first_ev).toLocaleString('en-AU')}</td>
                      <td className="py-1.5 pr-3 font-semibold text-foreground">{c.user_email || c.ip}{c.country ? ` (${c.country})` : ''}</td>
                      <td className="py-1.5 pr-3">{c.events}</td>
                      <td className="py-1.5 pr-3">{c.pages}</td>
                      <td className="py-1.5 pr-3">{c.dur_s}s</td>
                      <td className={`py-1.5 font-bold ${c.verdict === 'human' ? 'text-teal-700' : c.verdict === 'scanner' ? 'text-red-600' : 'text-amber-600'}`}>{c.verdict}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
