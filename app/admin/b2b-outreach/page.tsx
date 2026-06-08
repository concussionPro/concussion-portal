'use client'

import { Fragment, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Loader2, MapPin, Mail, ExternalLink,
  Copy, Check, AlertCircle, Calendar, MessageSquare,
} from 'lucide-react'

interface Target {
  email: string
  clinic: string | null
  firstName: string | null
  fullName: string | null
  role: string | null
  state: string | null
  city: string | null
  region: string | null
  teamSize: number | null
  source: string
  opens: number
  clicks: number
  lastClickedSubject: string | null
  lastClickAt: string | null
  pricingViews: number
  checkoutStarts: number
  portalViews: number
  lastSiteIntentAt: string | null
  wiSubmits: number
  wiCities: string | null
  intentScore: number
  angle: string
  lastSignalAt: string | null
  // Promotion / cadence
  hasBookedCall: boolean
  hasTalkRequest: boolean
  inPersonalLane: boolean
  reachByDate: string | null
  priorityBucket: 'today' | 'this-week' | 'calm' | 'overdue' | 'done'
  personalScript: string | null
}

interface DemandRow {
  city: string | null
  region: string | null
  ipBrowsers: number
  wiSubmits: number
  coldProspects: number
  buyersInRegion: number
  score: number
}

interface Resp {
  states: string[]
  minScore: number
  count: number
  targets: Target[]
  demandByCity: DemandRow[]
}

const STATE_OPTIONS = ['NSW', 'VIC', 'QLD', 'ACT', 'SA']

function daysAgo(iso: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (!t || new Date(iso).getFullYear() < 2000) return '—'
  const d = Math.floor((Date.now() - t) / 86400000)
  if (d < 1) return 'today'
  if (d === 1) return '1d'
  if (d < 30) return `${d}d`
  if (d < 365) return `${Math.floor(d / 30)}mo`
  return '—'
}

function tierBadge(score: number): { label: string; tone: string } {
  if (score >= 30) return { label: 'HOT', tone: 'bg-rose-100 text-rose-700 border-rose-200' }
  if (score >= 20) return { label: 'Warm', tone: 'bg-amber-100 text-amber-700 border-amber-200' }
  if (score >= 10) return { label: 'Engaged', tone: 'bg-blue-100 text-blue-700 border-blue-200' }
  return { label: 'Cool', tone: 'bg-slate-100 text-slate-600 border-slate-200' }
}

function priorityCell(t: Target): { label: string; tone: string; sortKey: number } {
  if (t.hasBookedCall) return { label: '✓ Booked', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200', sortKey: 5 }
  if (t.hasTalkRequest) return { label: '✓ Talk req', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200', sortKey: 5 }
  if (t.priorityBucket === 'today')     return { label: 'TODAY',     tone: 'bg-rose-600 text-white border-rose-700 animate-pulse', sortKey: 0 }
  if (t.priorityBucket === 'overdue')   return { label: 'OVERDUE',   tone: 'bg-rose-100 text-rose-700 border-rose-300', sortKey: 1 }
  if (t.priorityBucket === 'this-week') return { label: 'This week', tone: 'bg-amber-100 text-amber-700 border-amber-200', sortKey: 2 }
  return { label: 'Watch',  tone: 'bg-slate-100 text-slate-500 border-slate-200', sortKey: 3 }
}

function reachByLabel(t: Target): string {
  if (t.hasBookedCall) return 'Booked'
  if (t.hasTalkRequest) return 'Talk req'
  if (!t.reachByDate) return '—'
  const r = new Date(t.reachByDate).getTime()
  const now = Date.now()
  const d = Math.round((r - now) / 86400000)
  if (d < 0) return `${-d}d overdue`
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  return `in ${d}d`
}

function intentSummary(t: Target): string {
  const parts: string[] = []
  if (t.checkoutStarts > 0) parts.push(`${t.checkoutStarts} checkout-start`)
  if (t.portalViews > 0) parts.push(`${t.portalViews} portal`)
  if (t.pricingViews > 0) parts.push(`${t.pricingViews} pricing`)
  if (t.wiSubmits > 0) parts.push(`${t.wiSubmits} WI`)
  if (t.clicks > 0) parts.push(`${t.clicks} click${t.clicks === 1 ? '' : 's'}`)
  if (t.opens > 0) parts.push(`${t.opens} open${t.opens === 1 ? '' : 's'}`)
  return parts.join(' · ') || '—'
}

function dealEstimate(t: Target): string {
  if ((t.teamSize ?? 0) >= 6) return '$8k+'
  if ((t.teamSize ?? 0) >= 3) return '$4k+'
  if (t.wiSubmits > 0) return '$1.5k+'
  return '—'
}

export default function B2bOutreachPage() {
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [selectedStates, setSelectedStates] = useState<string[]>(STATE_OPTIONS)
  const [minScore, setMinScore] = useState(5)
  const [view, setView] = useState<'targets' | 'demand'>('targets')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [personalLaneOnly, setPersonalLaneOnly] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      /* silent */
    }
  }

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const url = `/api/admin/b2b-outreach-targets?states=${selectedStates.join(',')}&minScore=${minScore}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalDealValue = useMemo(() => {
    if (!data) return 0
    return data.targets.reduce((sum, t) => {
      if ((t.teamSize ?? 0) >= 6) return sum + 8000
      if ((t.teamSize ?? 0) >= 3) return sum + 4000
      return sum + 1500
    }, 0)
  }, [data])

  // Filtered targets — personal-lane toggle drops anyone still in cold cron territory
  const visibleTargets = useMemo(() => {
    if (!data) return [] as Target[]
    if (!personalLaneOnly) return data.targets
    return data.targets.filter((t) => t.inPersonalLane || t.hasBookedCall || t.hasTalkRequest || t.priorityBucket === 'today' || t.priorityBucket === 'overdue')
  }, [data, personalLaneOnly])

  const todayCount = useMemo(() => (data?.targets || []).filter((t) => t.priorityBucket === 'today').length, [data])
  const overdueCount = useMemo(() => (data?.targets || []).filter((t) => t.priorityBucket === 'overdue').length, [data])
  // HOT NOW = anyone with portal_views ≥ 5 OR clicks ≥ 3 in the last 14 days.
  // These are the prospects to email/call BEFORE the rest of the cold queue.
  const hotNow = useMemo(() => {
    if (!data) return [] as Target[]
    return data.targets
      .filter((t) => (t.portalViews ?? 0) >= 5 || (t.clicks ?? 0) >= 3)
      .filter((t) => !t.hasBookedCall && !t.hasTalkRequest)
      .sort((a, b) => (b.portalViews + b.clicks * 2) - (a.portalViews + a.clicks * 2))
      .slice(0, 12)
  }, [data])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">B2B Personal Outreach</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold disabled:opacity-50 hover:bg-slate-700"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-5 max-w-3xl">
          Personal email / call targets. $4–8k+ on-site team training deals, 1/month, east-coast travel.
        </p>

        {/* Controls + stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Targets</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{data?.count ?? 0}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Est. revenue</div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">${totalDealValue.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">States</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {STATE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${selectedStates.includes(s) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-end gap-2">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Min score</div>
              <input
                type="number" value={minScore} min={0}
                onChange={(e) => setMinScore(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5"
              />
            </div>
            <button onClick={load} className="px-2.5 py-1.5 rounded bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-700">Apply</button>
          </div>
        </div>

        {/* HOT NOW panel — engagement-gold prospects with portal views ≥ 5
            or email clicks ≥ 3 in last 14d. Sort by combined activity score.
            These are the immediate revenue targets — pinned at top above the
            urgency banner so Zac sees them every time he opens the dashboard. */}
        {hotNow.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-white border border-rose-200 rounded-md p-3 mb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white animate-pulse">🔥 HOT NOW</span>
                <span className="text-xs font-bold text-slate-900">
                  {hotNow.length} prospect{hotNow.length === 1 ? '' : 's'} with deep engagement — reach out today
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-slate-500 font-bold border-b border-rose-200/50">
                    <th className="px-2 py-1">Contact / Clinic</th>
                    <th className="px-2 py-1 text-right">Portal views</th>
                    <th className="px-2 py-1 text-right">Clicks</th>
                    <th className="px-2 py-1 text-right">Score</th>
                    <th className="px-2 py-1">Recent</th>
                  </tr>
                </thead>
                <tbody>
                  {hotNow.map((t, i) => (
                    <tr key={t.email + i} className="border-b border-rose-100/50 hover:bg-white/60">
                      <td className="px-2 py-1.5">
                        <div className="font-semibold text-slate-900">{t.firstName ?? '?'} <span className="text-slate-500 font-normal">— {t.clinic ?? '?'}</span></div>
                        <a href={`mailto:${t.email}?subject=${encodeURIComponent(`Quick follow-up on ${t.clinic ?? 'concussion training'}`)}`} className="text-[10.5px] text-blue-600 hover:underline">{t.email}</a>
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-rose-700 tabular-nums">{t.portalViews}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-amber-700 tabular-nums">{t.clicks}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-slate-900 tabular-nums">{t.intentScore}</td>
                      <td className="px-2 py-1.5 text-[10px] text-slate-500 truncate max-w-[180px]">{t.lastClickedSubject ? `clicked: "${t.lastClickedSubject.slice(0, 28)}"` : daysAgo(t.lastSignalAt) + ' since last signal'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10.5px] text-rose-700/80 mt-2">
              Threshold: ≥5 portal views or ≥3 email clicks · click email to draft a personal follow-up
            </p>
          </div>
        )}

        {/* Urgency banner — pinned to top so Zac sees who to reach out to TODAY */}
        {(todayCount > 0 || overdueCount > 0) && (
          <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bold text-rose-900">
                {todayCount > 0 && <span>Reach out today: <strong>{todayCount}</strong> prospect{todayCount === 1 ? '' : 's'}</span>}
                {todayCount > 0 && overdueCount > 0 && <span className="mx-2">·</span>}
                {overdueCount > 0 && <span>Overdue: <strong>{overdueCount}</strong></span>}
              </div>
              <div className="text-[11px] text-rose-700/80 mt-0.5">
                These crossed the personal-lane threshold (intent ≥20) and haven&apos;t booked or replied. They&apos;re paused from the cold cron — your move.
              </div>
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          <button
            onClick={() => setView('targets')}
            className={`px-3 py-1 text-[11px] font-semibold rounded ${view === 'targets' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >Targets ({data?.count ?? 0})</button>
          <button
            onClick={() => setView('demand')}
            className={`px-3 py-1 text-[11px] font-semibold rounded ${view === 'demand' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >Demand by location ({data?.demandByCity?.length ?? 0})</button>
          {view === 'targets' && (
            <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox" checked={personalLaneOnly}
                onChange={(e) => setPersonalLaneOnly(e.target.checked)}
                className="rounded"
              />
              Personal lane only ({visibleTargets.length})
            </label>
          )}
        </div>

        {err && <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-3 text-xs text-rose-700">{err}</div>}

        {loading && !data && (
          <div className="bg-white rounded-lg border border-slate-200 p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        )}

        {data && view === 'targets' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left">
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 w-20">Reach by</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Contact / Clinic</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Loc</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Team</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Deal</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Score</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Signals</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Last</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTargets.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No targets in this view.</td></tr>
                  )}
                  {visibleTargets.map((t, i) => {
                    const rowKey = t.email + i
                    const isExpanded = expandedRow === rowKey
                    const pri = priorityCell(t)
                    return (
                      <Fragment key={rowKey}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                          className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${pri.sortKey <= 1 ? 'bg-rose-50/30' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${pri.tone}`}>{pri.label}</span>
                              <span className="text-[10px] text-slate-500">{reachByLabel(t)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900 truncate max-w-[260px]">
                              {t.firstName ?? '?'} {t.fullName && t.firstName ? t.fullName.replace(new RegExp(`^${t.firstName}\\s*`), '').slice(0, 18) : ''}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
                              {t.clinic ?? <span className="italic">interest form</span>}
                              {t.role && <span> · {t.role.slice(0, 28)}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {(t.city || t.state) ? (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {t.city ?? ''} {t.state ?? t.region ?? ''}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{t.teamSize ?? '—'}</td>
                          <td className="px-3 py-2 text-right text-emerald-700 font-semibold tabular-nums">{dealEstimate(t)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{t.intentScore}</td>
                          <td className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[200px]">{intentSummary(t)}</td>
                          <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{daysAgo(t.lastSignalAt)}</td>
                          <td className="px-3 py-2 text-right">
                            <a
                              href={`mailto:${t.email}?subject=${encodeURIComponent(`Concussion training for ${t.clinic ?? 'your team'}`)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 text-[11px]"
                              title={t.email}
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-amber-50/40 border-b border-slate-100">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Angle</div>
                                    <div className="text-[12px] text-slate-800">{t.angle}</div>
                                  </div>
                                  <div className="text-[11px] space-y-1">
                                    <div><span className="font-bold text-slate-500">Email:</span> <a href={`mailto:${t.email}`} className="text-blue-600 underline">{t.email}</a></div>
                                    {t.lastClickedSubject && <div><span className="font-bold text-slate-500">Last clicked:</span> <em>&quot;{t.lastClickedSubject}&quot;</em></div>}
                                    {t.wiCities && <div><span className="font-bold text-slate-500">Workshop interest:</span> {t.wiCities}</div>}
                                    <div><span className="font-bold text-slate-500">Source:</span> <span className="font-mono">{t.source}</span></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500">Personal email script</div>
                                    {t.personalScript && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(t.personalScript!, rowKey) }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-700"
                                      >
                                        {copiedKey === rowKey ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                      </button>
                                    )}
                                  </div>
                                  {t.personalScript ? (
                                    <pre className="bg-white border border-slate-200 rounded-md p-3 text-[11px] font-sans whitespace-pre-wrap text-slate-800 leading-relaxed max-h-[280px] overflow-auto">{t.personalScript}</pre>
                                  ) : (
                                    <div className="text-[11px] text-slate-400 italic bg-slate-50 rounded p-3">Not in personal-outreach tier yet — keep in the nurture sequence.</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && view === 'demand' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">City</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Region</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">IP browsers (90d)</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Workshop interest</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Cold pool</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Buyers</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.demandByCity.map((d, i) => (
                  <tr key={`${d.city}-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{d.city ?? '?'}</td>
                    <td className="px-3 py-2 text-slate-500">{d.region ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{d.ipBrowsers || ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-blue-600 font-semibold">{d.wiSubmits || ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{d.coldProspects || ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-semibold">{d.buyersInRegion || ''}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{d.score}</td>
                  </tr>
                ))}
                {data.demandByCity.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No location data yet — IP geo captures only start from today&apos;s deploy onwards.</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-2.5 text-[10.5px] text-slate-500 border-t border-slate-100 bg-slate-50">
              Score = IP browsers + (5 × workshop interest) + (2 × cold pool) + (10 × buyers). Heaviest weight on self-declared signals.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
