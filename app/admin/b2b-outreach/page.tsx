'use client'

import { Fragment, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Loader2, MapPin, Mail, ExternalLink,
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

        {/* View toggle */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setView('targets')}
            className={`px-3 py-1 text-[11px] font-semibold rounded ${view === 'targets' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >Targets ({data?.count ?? 0})</button>
          <button
            onClick={() => setView('demand')}
            className={`px-3 py-1 text-[11px] font-semibold rounded ${view === 'demand' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >Demand by location ({data?.demandByCity?.length ?? 0})</button>
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
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 w-8">#</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Contact / Clinic</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Loc</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Team</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Deal</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Score</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Tier</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Signals</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500 text-right">Last</th>
                    <th className="px-3 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.targets.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">No targets match this filter.</td></tr>
                  )}
                  {data.targets.map((t, i) => {
                    const tier = tierBadge(t.intentScore)
                    const rowKey = t.email + i
                    const isExpanded = expandedRow === rowKey
                    return (
                      <Fragment key={rowKey}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="px-3 py-2 text-slate-400 tabular-nums">{i + 1}</td>
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
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.tone}`}>{tier.label}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px] truncate max-w-[200px]">{intentSummary(t)}</td>
                          <td className="px-3 py-2 text-right text-slate-500 tabular-nums">{daysAgo(t.lastSignalAt)}</td>
                          <td className="px-3 py-2">
                            <a
                              href={`mailto:${t.email}?subject=Concussion%20training%20for%20your%20team`}
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
                            <td colSpan={10} className="px-4 py-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                <div>
                                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Angle</div>
                                  <div className="text-slate-800">{t.angle}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Detail</div>
                                  <div className="text-slate-700 font-mono text-[10.5px]">
                                    <a href={`mailto:${t.email}`} className="underline">{t.email}</a>
                                    {t.lastClickedSubject && <div className="text-slate-500 mt-1">Last clicked: <em>&quot;{t.lastClickedSubject}&quot;</em></div>}
                                    {t.wiCities && <div className="text-slate-500 mt-1">Workshop interest: {t.wiCities}</div>}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-1">Source</div>
                                  <div className="text-slate-700 font-mono text-[10.5px]">{t.source}</div>
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
