'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Users, MousePointer, Clock, FileCheck, Eye } from 'lucide-react'

interface Summary {
  organisation: string
  first_seen_ms: number
  last_seen_ms: number
  event_count: number
  sessions: number
  unique_pages: number
  nda_acceptances: number
  pageviews: number
  modules_opened: number
  quizzes_submitted: number
}

interface Acceptance {
  id: number
  email: string
  organisation: string
  nda_version: string
  ip_address: string | null
  accepted_at: string
}

interface TopPage {
  path: string
  views: number
  avg_dwell_seconds: number | null
}

interface TimelineEvent {
  event_type: string
  event_data: Record<string, unknown>
  path: string
  timestamp_ms: number
  session_id: string
}

interface ApiResponse {
  success: boolean
  summary: Summary[]
  acceptances: Acceptance[]
  topPages: TopPage[]
  timeline: TimelineEvent[]
  filters: { org: string | null; days: number }
}

export function DemoActivityClient() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgFilter, setOrgFilter] = useState<string>('')

  const refresh = async (org?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/admin/demo-activity?days=90${org ? `&org=${encodeURIComponent(org)}` : ''}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      setData(j)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-700">← Admin</Link>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs text-slate-700">Demo Activity</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Partner demo activity</h1>
        <p className="text-sm text-slate-600 mb-8">
          Behaviour tracking for NDA-accepted partner previews. Last 90 days.
        </p>

        {/* Org filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter by org:</span>
          <button
            onClick={() => { setOrgFilter(''); refresh() }}
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${!orgFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}
          >
            All organisations
          </button>
          {data?.summary.map((s) => (
            <button
              key={s.organisation}
              onClick={() => { setOrgFilter(s.organisation); refresh(s.organisation) }}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${orgFilter === s.organisation ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}
            >
              {s.organisation || '(unknown)'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary cards per org */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3">Organisations</h2>
              {data.summary.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No demo activity in the last 90 days. Send a demo URL to a partner to start tracking.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.summary.map((s) => (
                    <div key={s.organisation} className="bg-white rounded-xl border border-slate-200 p-5">
                      <p className="text-base font-bold text-slate-900 mb-3">{s.organisation || '(unknown)'}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <Stat label="Events" value={s.event_count} icon={MousePointer} />
                        <Stat label="Sessions" value={s.sessions} icon={Users} />
                        <Stat label="Pageviews" value={s.pageviews} icon={Eye} />
                        <Stat label="Modules opened" value={s.modules_opened} icon={Clock} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-3">
                        First: {new Date(s.first_seen_ms).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}<br />
                        Last: {new Date(s.last_seen_ms).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* NDA acceptances */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                NDA acceptances
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {data.acceptances.length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-4">No NDA acceptances yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="text-left px-3 py-2">Agreement</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">Organisation</th>
                        <th className="text-left px-3 py-2">IP</th>
                        <th className="text-left px-3 py-2">Accepted</th>
                        <th className="text-left px-3 py-2">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.acceptances.map((a) => (
                        <tr key={a.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs">DEM-2026-{String(a.id).padStart(4, '0')}</td>
                          <td className="px-3 py-2 text-slate-700">{a.email}</td>
                          <td className="px-3 py-2 text-slate-700">{a.organisation}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs">{a.ip_address || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{new Date(a.accepted_at).toLocaleString('en-AU')}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{a.nda_version}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Top pages */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3">Most-viewed pages</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {data.topPages.length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-4">No pageviews recorded yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="text-left px-3 py-2">Path</th>
                        <th className="text-right px-3 py-2">Views</th>
                        <th className="text-right px-3 py-2">Avg dwell</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.map((p) => (
                        <tr key={p.path} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{p.path}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{p.views}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                            {p.avg_dwell_seconds !== null ? `${p.avg_dwell_seconds}s` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Recent timeline */}
            <section>
              <h2 className="text-lg font-bold mb-3">Recent events (last 200)</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[600px] overflow-y-auto">
                {data.timeline.length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-4">No events.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Time</th>
                        <th className="text-left px-3 py-2">Event</th>
                        <th className="text-left px-3 py-2">Path</th>
                        <th className="text-left px-3 py-2">Org</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.timeline.map((e, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-1.5 text-slate-500">
                            {new Date(e.timestamp_ms).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-slate-700">{e.event_type}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-500 max-w-[280px] truncate">{e.path}</td>
                          <td className="px-3 py-1.5 text-slate-600">{String(e.event_data?.demoOrg ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
    </div>
  )
}
