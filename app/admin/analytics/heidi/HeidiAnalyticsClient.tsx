'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  Clock,
  Eye,
  MousePointer,
  FileCheck,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Mail,
  MapPin,
  Hash,
} from 'lucide-react'

const HEIDI_ORG = 'Heidi Health'

interface TimelineEvent {
  event_type: string
  event_data: Record<string, unknown>
  path: string | null
  timestamp_ms: number
  session_id: string
}

interface PageRow {
  path: string
  views: number
  avg_dwell_seconds: number | null
}

interface AcceptanceRow {
  id: number
  email: string
  organisation: string
  nda_version: string
  ip_address: string | null
  accepted_at: string
}

interface SummaryRow {
  organisation: string
  first_seen_ms: string
  last_seen_ms: string
  event_count: number
  sessions: number
  unique_pages: number
  nda_acceptances: number
  pageviews: number
  modules_opened: number
  quizzes_submitted: number
}

interface DemoActivityResponse {
  success: boolean
  summary: SummaryRow[]
  acceptances: AcceptanceRow[]
  topPages: PageRow[]
  timeline: TimelineEvent[]
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null || isNaN(seconds)) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

function fmtPath(path: string | null): string {
  if (!path) return '(no path)'
  return path.replace('/courses/', '').replace('/ai-in-clinical-practice', '/ai-course')
}

export function HeidiAnalyticsClient() {
  const [data, setData] = useState<DemoActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/demo-activity?org=${encodeURIComponent(HEIDI_ORG)}&days=14`,
        { credentials: 'include' }
      )
      if (!res.ok) {
        setError(`API returned ${res.status}`)
        setLoading(false)
        return
      }
      const json = (await res.json()) as DemoActivityResponse
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const summary = data?.summary?.[0]
  const acceptances = data?.acceptances || []
  const topPages = data?.topPages || []
  const timeline = data?.timeline || []

  // Derived metrics
  const status = useMemo(() => {
    if (!summary) return { label: 'Waiting for first visit', color: 'slate', pulse: false }
    const lastSeenMs = Number(summary.last_seen_ms)
    const minsSince = (Date.now() - lastSeenMs) / 60_000
    if (minsSince < 5) return { label: 'Live now', color: 'emerald', pulse: true }
    if (minsSince < 60) return { label: `Active ${Math.floor(minsSince)}m ago`, color: 'emerald', pulse: false }
    if (minsSince < 1440) return { label: `Last seen ${Math.floor(minsSince / 60)}h ago`, color: 'amber', pulse: false }
    return { label: `Last seen ${Math.floor(minsSince / 1440)}d ago`, color: 'slate', pulse: false }
  }, [summary])

  // Tour stops engagement — derived from timeline
  const tourStopClicks = useMemo(() => {
    return timeline
      .filter(
        (e) =>
          e.event_type === 'demo_resource_clicked' &&
          (e.event_data?.resource === 'tour-stop' || e.event_data?.resource === 'conversation-card')
      )
      .reverse() // oldest first to show click order
  }, [timeline])

  // Total time engaged (sum of all dwell ms reported)
  const totalDwellMs = useMemo(() => {
    return timeline.reduce((sum, e) => {
      const d = Number(e.event_data?.previousDwellMs)
      return sum + (isNaN(d) ? 0 : d)
    }, 0)
  }, [timeline])

  // Conversation card preference
  const convAClicks = useMemo(
    () =>
      timeline.filter(
        (e) =>
          e.event_type === 'demo_resource_clicked' &&
          e.event_data?.resource === 'conversation-card' &&
          e.event_data?.conversation === 'Conversation A'
      ).length,
    [timeline]
  )
  const convBClicks = useMemo(
    () =>
      timeline.filter(
        (e) =>
          e.event_type === 'demo_resource_clicked' &&
          e.event_data?.resource === 'conversation-card' &&
          e.event_data?.conversation === 'Conversation B'
      ).length,
    [timeline]
  )

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="max-w-3xl mx-auto rounded-xl border-2 border-red-300 bg-red-50 p-6">
          <p className="text-sm font-bold text-red-900 mb-1">Tracking API error</p>
          <p className="text-xs text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">
              Pitch tracking · Heidi Health
            </p>
            <h1 className="text-2xl font-bold text-foreground">What Paul is doing right now</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh 15s
            </label>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div
          className={`mb-6 rounded-xl border-2 p-5 flex items-center justify-between ${
            status.color === 'emerald'
              ? 'border-emerald-300 bg-emerald-50'
              : status.color === 'amber'
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                status.color === 'emerald'
                  ? 'bg-emerald-500'
                  : status.color === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              } ${status.pulse ? 'animate-pulse' : ''}`}
            />
            <div>
              <p className="text-sm font-bold text-foreground">{status.label}</p>
              {summary && (
                <p className="text-xs text-muted-foreground">
                  First arrived {relativeTime(Number(summary.first_seen_ms))} · {summary.sessions}{' '}
                  {summary.sessions === 1 ? 'session' : 'sessions'} · {summary.event_count} events captured
                </p>
              )}
            </div>
          </div>
          <Link
            href="/d/heidi-h8k3q9p"
            target="_blank"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            Open Paul&rsquo;s demo link
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* TOP-LINE METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Metric
            icon={Eye}
            label="Page views"
            value={summary?.pageviews ?? 0}
            sub={`${summary?.unique_pages ?? 0} unique pages`}
          />
          <Metric
            icon={Clock}
            label="Total engaged"
            value={fmtDuration(totalDwellMs / 1000)}
            sub="Sum of measured dwell"
          />
          <Metric
            icon={FileCheck}
            label="NDA acceptances"
            value={summary?.nda_acceptances ?? acceptances.length}
            sub={
              acceptances[0]?.email
                ? `Last: ${acceptances[0].email.slice(0, 24)}`
                : 'Awaiting'
            }
          />
          <Metric
            icon={MousePointer}
            label="Tour stops + cards"
            value={tourStopClicks.length}
            sub="Resource clicks"
          />
        </div>

        {/* TWO-CONVERSATIONS PREFERENCE */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Two-conversations engagement
            </p>
            <p className="text-[10px] text-muted-foreground">Which framing got the click</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ConvCell
              label="Conversation A"
              tier="Smaller"
              title="Partnership / licensing"
              clicks={convAClicks}
            />
            <ConvCell
              label="Conversation B"
              tier="Preferred"
              title="Acqui-hire"
              clicks={convBClicks}
              highlight
            />
          </div>
          {convAClicks === 0 && convBClicks === 0 && (
            <p className="mt-3 text-[11px] text-slate-500 italic">
              No conversation acknowledgement yet — Paul hasn&rsquo;t tapped either card.
            </p>
          )}
        </section>

        {/* TOUR-STOP CLICK ORDER */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Tour stops + resource click order (oldest → newest)
          </p>
          {tourStopClicks.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              No stop clicks yet. Tour stops fire on click of the 3-stop tour cards or conversation cards.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {tourStopClicks.map((e, i) => {
                const isStop = e.event_data?.resource === 'tour-stop'
                const stopNum = e.event_data?.stop
                const conv = e.event_data?.conversation
                const title = e.event_data?.title as string | undefined
                return (
                  <li key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-foreground font-medium flex-1">
                      {isStop ? `Stop ${stopNum}` : `Card ${conv}`}: {title || '(untitled)'}
                    </span>
                    <span className="text-slate-500 tabular-nums shrink-0">
                      {relativeTime(Number(e.timestamp_ms))}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* PAGE-BY-PAGE WITH DWELL */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Pages visited (sorted by views)
            </p>
            <p className="text-[10px] text-muted-foreground">avg dwell = how long Paul stayed</p>
          </div>
          {topPages.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">No page views yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 font-semibold">Path</th>
                    <th className="text-right py-2 font-semibold">Views</th>
                    <th className="text-right py-2 font-semibold">Avg dwell</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.path} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 font-mono text-[11px]">{fmtPath(p.path)}</td>
                      <td className="py-2 text-right tabular-nums">{p.views}</td>
                      <td className="py-2 text-right tabular-nums">{fmtDuration(p.avg_dwell_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* NDA RECORDS */}
        {acceptances.length > 0 && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
              NDA acceptances ({acceptances.length})
            </p>
            <ul className="space-y-2">
              {acceptances.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs text-foreground truncate">{a.email}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.ip_address && (
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.ip_address}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      DEM-2026-{String(a.id).padStart(4, '0')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(a.accepted_at).toLocaleString('en-AU', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* RAW TIMELINE (forensic detail) */}
        <details className="mb-6 rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:bg-slate-50 flex items-center justify-between">
            <span>Raw event timeline ({timeline.length})</span>
            <span className="text-[10px] font-normal normal-case text-slate-400">click to expand</span>
          </summary>
          <div className="px-5 pb-5 max-h-[480px] overflow-y-auto">
            <ul className="space-y-1">
              {timeline.map((e, i) => (
                <li key={i} className="text-[10px] font-mono py-1 border-b border-slate-100 last:border-0 flex items-start gap-2">
                  <span className="text-slate-400 tabular-nums shrink-0">
                    {new Date(Number(e.timestamp_ms)).toLocaleTimeString('en-AU', { hour12: false })}
                  </span>
                  <span className="text-accent font-bold shrink-0">{e.event_type}</span>
                  <span className="text-slate-600 truncate flex-1">
                    {e.path || ''}
                    {e.event_data?.resource ? ` · ${e.event_data.resource}` : ''}
                    {e.event_data?.previousDwellMs
                      ? ` · dwell ${Math.round(Number(e.event_data.previousDwellMs) / 1000)}s`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
          <Link
            href="/admin/demo-activity"
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-sm font-bold text-foreground">All partner demos</p>
            <p className="text-[11px] text-muted-foreground">Other orgs · pipeline view</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-sm font-bold text-foreground">Marketing dashboard</p>
            <p className="text-[11px] text-muted-foreground">Channels · funnels · IP intent</p>
          </Link>
          <Link
            href="/courses/heidi-tour"
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-sm font-bold text-foreground">Tour page (admin view)</p>
            <p className="text-[11px] text-muted-foreground">What Paul lands on</p>
          </Link>
        </section>

        {/* PRE-SEND VERIFICATION */}
        {!summary && (
          <section className="mt-8 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pre-send checklist (no Heidi activity yet)
            </p>
            <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-5">
              <li>Verify <code className="font-mono bg-white px-1 rounded">HEIDI_DEMO_KEY</code> is set in Vercel production env</li>
              <li>Click the link above in an incognito window to confirm NDA flow works end-to-end</li>
              <li>Confirm your test acceptance disappears from this dashboard (filter is org=&ldquo;Heidi Health&rdquo;, your test should match if you use that org name)</li>
              <li>Then send Paul the email + monitor this page during business hours</li>
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Activity
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function ConvCell({
  label,
  tier,
  title,
  clicks,
  highlight,
}: {
  label: string
  tier: string
  title: string
  clicks: number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-accent/30 bg-accent/5'
          : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-accent">{label}</p>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
          {highlight && <Sparkles className="w-2.5 h-2.5" />}
          {tier}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{clicks}</p>
      <p className="text-[10px] text-muted-foreground mt-1">acknowledgement clicks</p>
    </div>
  )
}

void Mail
void ArrowRight
