'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Loader2, ArrowUpRight, MailOpen, MousePointerClick, Eye, ArrowLeft, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'

interface ProspectRow {
  id: number
  slug: string
  short_name: string
  contact_email: string
  status: string
  region: string
  travel_band: string
  last_sent_at: string | null
  last_sent_template: string | null
  total_sends: number | string
  total_opens: number | string
  total_clicks: number | string
  total_portal_views: number | string
  first_portal_view_at: string | null
  last_portal_view_at: string | null
  reply_count: number | string
  updated_at: string
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  researching: { label: 'Researching', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  approved: { label: 'Approved · ready to send', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent: { label: 'Sent · awaiting', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  opened: { label: 'Opened', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  engaged: { label: 'Engaged (clicked)', tone: 'bg-accent/10 text-accent border-accent/20' },
  replied: { label: '🎯 Replied', tone: 'bg-violet-50 text-violet-700 border-violet-200 font-bold' },
  won: { label: '✅ Won', tone: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
  lost: { label: 'Lost', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
  archived: { label: 'Archived', tone: 'bg-slate-100 text-slate-400 border-slate-200' },
}

type SortKey = 'updated' | 'opens' | 'clicks' | 'views' | 'sent' | 'status'

function num(v: number | string): number {
  return typeof v === 'string' ? parseInt(v, 10) || 0 : v
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function ProspectsAnalyticsPage() {
  const [data, setData] = useState<ProspectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setError(null)
    try {
      const res = await fetch('/api/admin/prospect-engagement', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.prospects ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Pipeline summary
  const summary = useMemo(() => {
    const total = data.length
    const counts: Record<string, number> = {}
    for (const p of data) counts[p.status] = (counts[p.status] ?? 0) + 1
    const totalSends = data.reduce((acc, p) => acc + num(p.total_sends), 0)
    const totalOpens = data.reduce((acc, p) => acc + num(p.total_opens), 0)
    const totalClicks = data.reduce((acc, p) => acc + num(p.total_clicks), 0)
    const totalViews = data.reduce((acc, p) => acc + num(p.total_portal_views), 0)
    const replied = num(counts.replied ?? 0)
    const won = num(counts.won ?? 0)
    return { total, counts, totalSends, totalOpens, totalClicks, totalViews, replied, won }
  }, [data])

  // Re-engage queue: opened or engaged in last 14 days, no reply
  const reEngageQueue = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    return data
      .filter((p) => {
        if (num(p.reply_count) > 0) return false
        if (!['opened', 'engaged'].includes(p.status)) return false
        const lastSeen = p.last_portal_view_at ?? p.last_sent_at
        if (!lastSeen) return false
        return new Date(lastSeen).getTime() > fourteenDaysAgo
      })
      .sort((a, b) => {
        const scoreA = num(a.total_portal_views) * 3 + num(a.total_clicks) * 2 + num(a.total_opens)
        const scoreB = num(b.total_portal_views) * 3 + num(b.total_clicks) * 2 + num(b.total_opens)
        return scoreB - scoreA
      })
      .slice(0, 12)
  }, [data])

  // Sorted table
  const sorted = useMemo(() => {
    const arr = [...data]
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'opens': return num(b.total_opens) - num(a.total_opens)
        case 'clicks': return num(b.total_clicks) - num(a.total_clicks)
        case 'views': return num(b.total_portal_views) - num(a.total_portal_views)
        case 'sent':
          return new Date(b.last_sent_at ?? 0).getTime() - new Date(a.last_sent_at ?? 0).getTime()
        case 'status': {
          const order = ['replied', 'engaged', 'opened', 'sent', 'approved', 'researching', 'won', 'lost', 'archived']
          return order.indexOf(a.status) - order.indexOf(b.status)
        }
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
    return arr
  }, [data, sortKey])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3 h-3" /> Back to analytics
          </Link>
          <button
            onClick={() => { setRefreshing(true); load() }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">B2B Outreach Pipeline</h1>
        <p className="text-sm text-slate-500 mb-6">
          Cold-outreach prospects + engagement signals from the Resend pipeline. Re-engage queue surfaces warm-no-reply prospects most likely to convert with a personal nudge.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-900">Failed to load</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Pipeline funnel summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Stat label="Total prospects" value={summary.total} />
          <Stat label="Sends" value={summary.totalSends} />
          <Stat label="Opens" value={summary.totalOpens} tint="emerald" />
          <Stat label="Clicks" value={summary.totalClicks} tint="accent" />
          <Stat label="Portal views" value={summary.totalViews} tint="violet" />
          <Stat label="Replies · wins" value={`${summary.replied} · ${summary.won}`} tint="rose" />
        </div>

        {/* Re-engage queue */}
        {reEngageQueue.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                🔥 Re-engage queue · {reEngageQueue.length}
              </h2>
              <p className="text-xs text-slate-500">
                Opened or clicked in last 14 days · ranked by engagement depth · no reply yet
              </p>
            </div>
            <div className="rounded-xl bg-amber-50/40 border border-amber-200 divide-y divide-amber-200">
              {reEngageQueue.map((p) => {
                const score = num(p.total_portal_views) * 3 + num(p.total_clicks) * 2 + num(p.total_opens)
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 truncate">{p.short_name}</p>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{p.region}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{p.contact_email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <Metric icon={<MailOpen className="w-3.5 h-3.5" />} value={num(p.total_opens)} label="opens" />
                      <Metric icon={<MousePointerClick className="w-3.5 h-3.5" />} value={num(p.total_clicks)} label="clicks" />
                      <Metric icon={<Eye className="w-3.5 h-3.5" />} value={num(p.total_portal_views)} label="views" />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Score {score}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">last: {timeAgo(p.last_portal_view_at ?? p.last_sent_at)}</p>
                    </div>
                    <a
                      href={`mailto:${p.contact_email}?subject=Following up — ${p.short_name}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90"
                    >
                      Personal nudge
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Full pipeline table */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">All prospects · {data.length}</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Sort:</span>
              {([
                ['updated', 'Recent'],
                ['status', 'Status'],
                ['opens', 'Opens'],
                ['clicks', 'Clicks'],
                ['views', 'Views'],
                ['sent', 'Last sent'],
              ] as Array<[SortKey, string]>).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-2 py-1 rounded ${sortKey === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="text-left px-3 py-2.5">Clinic</th>
                    <th className="text-left px-3 py-2.5">Status</th>
                    <th className="text-right px-3 py-2.5">Sends</th>
                    <th className="text-right px-3 py-2.5">Opens</th>
                    <th className="text-right px-3 py-2.5">Clicks</th>
                    <th className="text-right px-3 py-2.5">Views</th>
                    <th className="text-left px-3 py-2.5">Last sent</th>
                    <th className="text-left px-3 py-2.5">Last activity</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                        No prospects yet. Create the first one via <code className="text-xs">/api/admin/prospect-create</code> or the bulk endpoint.
                      </td>
                    </tr>
                  )}
                  {sorted.map((p) => {
                    const s = STATUS_LABELS[p.status] ?? { label: p.status, tone: 'bg-slate-100 text-slate-600 border-slate-200' }
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">{p.short_name}</p>
                          <p className="text-[11px] text-slate-500">{p.contact_email} · {p.region}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${s.tone}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{num(p.total_sends)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{num(p.total_opens)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{num(p.total_clicks)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{num(p.total_portal_views)}</td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">{timeAgo(p.last_sent_at)}{p.last_sent_template ? ` · ${p.last_sent_template}` : ''}</td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">{timeAgo(p.last_portal_view_at)}</td>
                        <td className="px-3 py-2.5">
                          <a
                            href={`/p/${p.slug}?k=preview`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center text-xs text-accent hover:text-accent-dark"
                            title="Open portal in new tab"
                          >
                            Portal <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, tint }: { label: string; value: number | string; tint?: 'emerald' | 'accent' | 'violet' | 'rose' }) {
  const tintClass = {
    emerald: 'text-emerald-700',
    accent: 'text-accent',
    violet: 'text-violet-700',
    rose: 'text-rose-700',
  }[tint ?? 'emerald']
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4">
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${tint ? tintClass : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1 text-slate-600">
      {icon}
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-slate-400 text-[10px]">{label}</span>
    </div>
  )
}
