'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Loader2, MapPin, Phone, Mail,
  MousePointerClick, MailOpen, Eye, TrendingUp, Users,
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
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 1) return 'today'
  if (d === 1) return '1d ago'
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function intentChips(t: Target) {
  const chips: Array<{ label: string; tone: string }> = []
  if (t.checkoutStarts > 0) chips.push({ label: `${t.checkoutStarts}× checkout-start`, tone: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' })
  if (t.portalViews > 0) chips.push({ label: `${t.portalViews}× portal`, tone: 'bg-violet-50 text-violet-700 border-violet-200' })
  if (t.pricingViews > 0) chips.push({ label: `${t.pricingViews}× pricing`, tone: 'bg-amber-50 text-amber-700 border-amber-200' })
  if (t.wiSubmits > 0) chips.push({ label: `${t.wiSubmits}× workshop interest`, tone: 'bg-blue-50 text-blue-700 border-blue-200' })
  if (t.clicks > 0) chips.push({ label: `${t.clicks} clicks`, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
  if (t.opens > 0) chips.push({ label: `${t.opens} opens`, tone: 'bg-slate-100 text-slate-600 border-slate-200' })
  return chips
}

export default function B2bOutreachPage() {
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [selectedStates, setSelectedStates] = useState<string[]>(STATE_OPTIONS)
  const [minScore, setMinScore] = useState(5)
  const [view, setView] = useState<'targets' | 'demand'>('targets')

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
      if ((t.teamSize ?? 0) >= 6) return sum + 8000 // estimated on-site fee
      if ((t.teamSize ?? 0) >= 3) return sum + 4000
      return sum + 1500
    }, 0)
  }, [data])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl md:text-2xl font-bold">B2B Personal Outreach</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6 max-w-3xl">
          High-intent east-coast prospects worth a personal email or phone call from Zac.
          These are <strong>$4k–8k+ on-site team training</strong> deals — 1 per month cadence,
          NSW/VIC/QLD/ACT/SA travel. Don&apos;t hit them with the templated cold sequence.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4 mb-6 bg-white rounded-xl border border-slate-200 p-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-1">States</label>
            <div className="flex gap-1">
              {STATE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-2 py-1 text-xs font-semibold rounded ${selectedStates.includes(s) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-1">Min intent score</label>
            <input type="number" value={minScore} onChange={(e) => setMinScore(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-20 px-2 py-1 border border-slate-200 rounded text-sm" />
          </div>
          <button onClick={load} className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold">Apply</button>
          <div className="ml-auto text-xs text-slate-500">
            {data && (
              <>
                <span className="font-bold text-slate-900">{data.count}</span> targets ·
                est. revenue <span className="font-bold text-emerald-700">${totalDealValue.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('targets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${view === 'targets' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >Outreach targets ({data?.count ?? 0})</button>
          <button
            onClick={() => setView('demand')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${view === 'demand' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >Demand by location ({data?.demandByCity?.length ?? 0})</button>
        </div>

        {err && <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-sm text-rose-700">{err}</div>}

        {loading && !data && <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}

        {data && view === 'targets' && (
          <div className="space-y-3">
            {data.targets.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                No targets match the current filter. Lower the min-score or expand states.
              </div>
            )}
            {data.targets.map((t, i) => {
              const dealEstimate = (t.teamSize ?? 0) >= 6 ? '$8,000+' : (t.teamSize ?? 0) >= 3 ? '$4,000+' : '$1,500+'
              return (
                <div key={t.email + i} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[10px] font-bold tracking-wide text-slate-500 uppercase bg-slate-100 rounded px-1.5 py-0.5">#{i + 1}</div>
                        <h3 className="font-bold text-slate-900 truncate">
                          {t.firstName ?? '?'} {t.fullName && t.firstName ? t.fullName.replace(new RegExp(`^${t.firstName}\\s*`), '') : ''}
                        </h3>
                        <div className="text-sm text-slate-600 truncate">— {t.clinic ?? '(no clinic name)'}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        {t.role && <span>{t.role}</span>}
                        {t.role && (t.state || t.city) && <span>·</span>}
                        {(t.state || t.city) && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.city ?? ''} {t.state ?? t.region ?? ''}</span>
                        )}
                        {t.teamSize != null && t.teamSize > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />team {t.teamSize}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{dealEstimate}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-slate-900">{t.intentScore}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">intent</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {intentChips(t).map((c, j) => (
                      <span key={j} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.tone}`}>{c.label}</span>
                    ))}
                  </div>

                  <div className="bg-amber-50 border-l-2 border-amber-400 px-3 py-2 text-xs text-amber-900 mb-2">
                    <span className="font-bold">Angle:</span> {t.angle}
                  </div>

                  {(t.lastClickedSubject || t.wiCities) && (
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      {t.lastClickedSubject && <div className="truncate">Last clicked: <em>&quot;{t.lastClickedSubject}&quot;</em></div>}
                      {t.wiCities && <div>Workshop interest cities: <strong>{t.wiCities}</strong></div>}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      Last signal: <span className="font-semibold text-slate-700">{daysAgo(t.lastSignalAt)}</span>
                      <span className="mx-2">·</span>
                      Source: <span className="font-mono">{t.source}</span>
                    </div>
                    <div className="flex gap-1">
                      <a href={`mailto:${t.email}?subject=Concussion%20training%20for%20your%20team`} className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />{t.email}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {data && view === 'demand' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">City</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Region</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">IP browsers (90d)</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Workshop interest</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Cold pool</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Buyers</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase font-bold tracking-wide text-slate-500">Demand score</th>
                </tr>
              </thead>
              <tbody>
                {data.demandByCity.map((d, i) => (
                  <tr key={`${d.city}-${i}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-semibold text-slate-900">{d.city ?? '?'}</td>
                    <td className="px-4 py-2 text-slate-500">{d.region ?? '—'}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.ipBrowsers}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-blue-600 font-semibold">{d.wiSubmits || ''}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.coldProspects}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-700 font-semibold">{d.buyersInRegion || ''}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-slate-900">{d.score}</td>
                  </tr>
                ))}
                {data.demandByCity.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No location data yet. Captures start flowing as IP geo events accumulate.</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-3 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50">
              <strong>Demand score</strong> = IP browsers + (5 × workshop interest) + (2 × cold prospects) + (10 × paying buyers). Tells you where the next workshop should run.
              Workshop interest + buyers are heaviest weighted because they&apos;ve already self-declared.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
