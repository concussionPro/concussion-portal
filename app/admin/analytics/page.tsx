'use client'

/**
 * app/admin/analytics/page.tsx
 *
 * Marketing Brain Dashboard — your command centre for course sales.
 * Tracks channels, funnels, retargeting, IP intent, and session flow.
 *
 * Auth: handled by parent admin layout (reads admin_api_key from sessionStorage).
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Eye,
  TrendingUp,
  Clock,
  RefreshCw,
  Globe,
  Monitor,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Activity,
  BarChart2,
  Target,
  Zap,
  ArrowRight,
  Smartphone,
  Laptop,
  Tablet,
  Hash,
  MousePointer,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsStats {
  pageviews: { value: number; prev: number }
  uniques: { value: number; prev: number }
  bounces: { value: number; prev: number }
  totaltime: { value: number; prev: number }
}

interface PageviewPoint { x: string; y: number }
interface AnalyticsPageviews { pageviews: PageviewPoint[]; sessions: PageviewPoint[] }
interface MetricRow { x: string; y: number }

interface ChannelRow {
  channel: string; sessions: number; pageviews: number
  bounceRate: number; avgDuration: number; conversions: number
  conversionRate: number; pricingViews: number; intentRate: number
}
interface UtmRow { name: string; sessions: number; conversions: number; pricingViews: number; bounceRate: number }
interface ChannelsData { channels: ChannelRow[]; utmSources: UtmRow[]; utmCampaigns: UtmRow[] }

interface FlowData {
  entryPages: MetricRow[]; exitPages: MetricRow[]
  topTransitions: MetricRow[]; visitDistribution: MetricRow[]
  devices: MetricRow[]
}

interface HotLead {
  ip: string; visits: number; pageviews: number; pricingViews: number
  lastSeen: number; pagesVisited: string[]; channel: string; device: string
}
interface PreseasonLead {
  ip: string; visits: number; lastSeen: number
  hasRegistered: boolean; hasSubmitted: boolean; channel: string
}
interface RetargetingData {
  hotLeads: HotLead[]; preseasonLeads: PreseasonLead[]
  summary: {
    totalVisitors: number; returningVisitors: number; returningRate: number
    pricingViewers: number; pricingToConversion: number; converters: number
  }
}

interface FunnelStep { label: string; count: number }
interface FunnelData { directFunnel: FunnelStep[]; preseasonFunnel: FunnelStep[] }

interface EventGroup {
  eventType: string; count: number
  latest: { timestamp: number; data: Record<string, unknown>; path: string }[]
}

type Period = '24h' | '7d' | '30d' | '90d'
type TabType = 'overview' | 'channels' | 'flow' | 'funnel' | 'events' | 'retargeting'

// ── Constants ─────────────────────────────────────────────────────────────────
const PERIODS: { label: string; value: Period }[] = [
  { label: '24h', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function fmtDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function pct(value: number, prev: number): { delta: number; sign: string; color: string; isNew: boolean } {
  if (prev === 0 && value > 0) return { delta: 0, sign: '', color: 'text-[var(--accent)]', isNew: true }
  if (prev === 0) return { delta: 0, sign: '', color: 'text-gray-400', isNew: false }
  const delta = ((value - prev) / prev) * 100
  const sign = delta >= 0 ? '+' : ''
  const color = delta >= 0 ? 'text-emerald-600' : 'text-rose-500'
  return { delta: Math.abs(delta), sign, color, isNew: false }
}

function normaliseMetrics(data: any): MetricRow[] {
  if (!data) return []
  if (Array.isArray(data)) return data as MetricRow[]
  if (Array.isArray(data?.data)) return data.data as MetricRow[]
  return []
}

const EVENT_LABELS: Record<string, string> = {
  preseason_clinic_register: 'Clinic Registration',
  preseason_baseline_submit: 'Baseline Submission',
  shop_click: 'Shop / Enrol Click',
  enroll_button_click: 'Enrol Button Click',
  pricing_view: 'Pricing Page View',
  login_attempt: 'Login Attempt',
  login_success: 'Login Success',
  logout: 'Logout',
  module_start: 'Module Started',
  module_complete: 'Module Completed',
  quiz_start: 'Quiz Started',
  quiz_submit: 'Quiz Submitted',
  toolkit_download: 'Toolkit Download',
  reference_view: 'Reference View',
  search_query: 'Search Query',
  error: 'Error',
}

// ── Components ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-gradient-to-r from-[rgba(13,115,119,0.04)] via-[rgba(13,115,119,0.08)] to-[rgba(13,115,119,0.04)] animate-pulse ${className}`} />
  )
}

function StatCard({
  label, value, prev, icon: Icon, format = 'number', loading = false,
}: {
  label: string; value: number; prev: number; icon: React.ElementType
  format?: 'number' | 'percent' | 'duration'; loading?: boolean
}) {
  const { delta, sign, color, isNew } = pct(value, prev)
  const displayVal = format === 'duration' ? fmtDuration(value)
    : format === 'percent' ? fmtPct(value) : fmtNum(value)

  return (
    <div className="card stat-tile group" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
      <div className="flex items-start justify-between mb-3">
        <div className="icon-container w-9 h-9">
          <Icon size={16} className="text-[var(--accent)]" />
        </div>
        {!loading && isNew && (
          <span className="text-xs font-semibold text-[var(--accent)] bg-[rgba(13,115,119,0.08)] px-2 py-0.5 rounded-full">New</span>
        )}
        {!loading && !isNew && delta > 0 && (
          <span className={`text-xs font-semibold ${color} tabular-nums`}>{sign}{delta.toFixed(1)}%</span>
        )}
      </div>
      {loading ? (
        <><Skeleton className="h-7 w-24 mb-1" /><Skeleton className="h-3 w-16 mt-1" /></>
      ) : (
        <><p className="stat-value">{displayVal}</p><p className="stat-label mt-1">{label}</p></>
      )}
    </div>
  )
}

function MetricRowBar({ label, value, max }: { label: string; value: number; max: number }) {
  const widthPct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="group py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[var(--foreground)] truncate max-w-[70%]" title={label}>{label || '(direct)'}</span>
        <span className="text-sm font-semibold text-[var(--accent)] tabular-nums ml-2 shrink-0">{fmtNum(value)}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill transition-all duration-700 ease-out" style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  )
}

function Sparkline({ data }: { data: PageviewPoint[] }) {
  if (!data || data.length === 0) return null
  const maxY = Math.max(...data.map((d) => d.y), 1)
  const w = 100, h = 40
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w
    const y = h - (d.y / maxY) * h
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill="url(#sparkGrad)" strokeWidth="0" opacity="0.15" />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
      <Icon size={24} className="mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      {subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
    </div>
  )
}

function FunnelStepRow({ step, index, total, isLast }: { step: FunnelStep; index: number; total: number; isLast: boolean }) {
  const convRate = total > 0 ? (step.count / total) * 100 : 0
  return (
    <div className="relative">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.6)] border border-[rgba(13,115,119,0.08)] backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-[rgba(13,115,119,0.06)] border border-[rgba(13,115,119,0.1)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--accent)]">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-[var(--foreground)]">{step.label}</span>
            <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{fmtNum(step.count)}</span>
          </div>
          <div className="flex items-center justify-end">
            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">{convRate.toFixed(1)}%</span>
          </div>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: `${convRate}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex justify-center my-1">
          <ChevronDown size={14} className="text-[var(--accent)] opacity-40" />
        </div>
      )}
    </div>
  )
}

function DeviceIcon({ device }: { device: string }) {
  if (device === 'Mobile') return <Smartphone size={14} />
  if (device === 'Tablet') return <Tablet size={14} />
  return <Laptop size={14} />
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d')
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Core data
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [pageviews, setPageviews] = useState<AnalyticsPageviews | null>(null)
  const [topPages, setTopPages] = useState<MetricRow[]>([])
  const [referrers, setReferrers] = useState<MetricRow[]>([])
  const [browsers, setBrowsers] = useState<MetricRow[]>([])

  // Marketing data
  const [channelsData, setChannelsData] = useState<ChannelsData | null>(null)
  const [flowData, setFlowData] = useState<FlowData | null>(null)
  const [retargetingData, setRetargetingData] = useState<RetargetingData | null>(null)
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [eventsData, setEventsData] = useState<EventGroup[]>([])

  const getAdminKey = useCallback((): string => {
    if (typeof window === 'undefined') return ''
    return sessionStorage.getItem('admin_api_key') ?? ''
  }, [])

  const fetchData = useCallback(
    async (type: string, extra: Record<string, string> = {}): Promise<any> => {
      const adminKey = getAdminKey()
      if (!adminKey) return null
      const apiPeriod = period === '24h' ? '1d' : period
      const params = new URLSearchParams({ type, period: apiPeriod, ...extra })
      const res = await fetch(`/api/analytics/data?${params}`, {
        headers: { 'x-admin-key': adminKey },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return await res.json()
    },
    [getAdminKey, period]
  )

  const loadAll = useCallback(async () => {
    const adminKey = getAdminKey()
    if (!adminKey) return
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        fetchData('stats'),          // 0
        fetchData('pageviews'),      // 1
        fetchData('metrics', { metricType: 'url' }),      // 2
        fetchData('metrics', { metricType: 'referrer' }), // 3
        fetchData('metrics', { metricType: 'browser' }),  // 4
        fetchData('channels'),       // 5
        fetchData('flow'),           // 6
        fetchData('retargeting'),    // 7
        fetchData('funnel'),         // 8
        fetchData('events'),         // 9
      ])

      const get = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : null

      if (get(0)) setStats(get(0) as AnalyticsStats)
      if (get(1)) setPageviews(get(1) as AnalyticsPageviews)
      if (get(2)) setTopPages(normaliseMetrics(get(2)).slice(0, 20))
      if (get(3)) setReferrers(normaliseMetrics(get(3)).slice(0, 10))
      if (get(4)) setBrowsers(normaliseMetrics(get(4)).slice(0, 8))
      if (get(5)) setChannelsData(get(5) as ChannelsData)
      if (get(6)) setFlowData(get(6) as FlowData)
      if (get(7)) setRetargetingData(get(7) as RetargetingData)
      if (get(8)) setFunnelData(get(8) as FunnelData)
      if (get(9) && Array.isArray(get(9))) setEventsData(get(9) as EventGroup[])

      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Analytics] Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [getAdminKey, fetchData])

  useEffect(() => { loadAll() }, [period, loadAll])

  const bounceRate = stats ? stats.bounces.value / Math.max(stats.uniques.value, 1) : 0
  const avgDuration = stats ? Math.round(stats.totaltime.value / Math.max(stats.uniques.value, 1)) : 0
  const maxPages = topPages[0]?.y ?? 1

  const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'channels', label: 'Channels', icon: Globe },
    { id: 'flow', label: 'Flow', icon: ArrowRight },
    { id: 'funnel', label: 'Funnel', icon: BarChart2 },
    { id: 'events', label: 'Events', icon: Zap },
    { id: 'retargeting', label: 'Retargeting', icon: Target },
  ]

  return (
    <div className="min-h-screen dashboard-bg">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="glass sticky top-0 z-50 px-4 sm:px-6">
        <div className="container-xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[rgba(13,115,119,0.1)] border border-[rgba(13,115,119,0.12)] flex items-center justify-center">
              <BarChart2 size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--foreground)]" style={{ letterSpacing: '-0.01em' }}>Marketing Brain</h1>
              {lastRefresh && (
                <p className="text-xs text-[var(--muted-foreground)] hidden sm:block">
                  Updated {lastRefresh.toLocaleTimeString('en-AU', { timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.08)]">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    period === p.value
                      ? 'bg-white shadow-sm text-[var(--accent)] border border-[rgba(13,115,119,0.1)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={loadAll} disabled={loading} className="action-pill" title="Refresh">
              <RefreshCw size={13} className={loading ? 'animate-spin text-[var(--accent)]' : 'text-[var(--muted-foreground)]'} />
              <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Unique Visitors" value={stats?.uniques.value ?? 0} prev={stats?.uniques.prev ?? 0} icon={Users} loading={loading && !stats} />
          <StatCard label="Page Views" value={stats?.pageviews.value ?? 0} prev={stats?.pageviews.prev ?? 0} icon={Eye} loading={loading && !stats} />
          <StatCard label="Bounce Rate" value={bounceRate} prev={stats ? stats.bounces.prev / Math.max(stats.uniques.prev, 1) : 0} icon={TrendingUp} format="percent" loading={loading && !stats} />
          <StatCard label="Avg. Session" value={avgDuration} prev={stats ? Math.round(stats.totaltime.prev / Math.max(stats.uniques.prev, 1)) : 0} icon={Clock} format="duration" loading={loading && !stats} />
        </div>

        {/* ── Retargeting summary cards ──────────────────────────────────── */}
        {retargetingData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><Target size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtNum(retargetingData.summary.pricingViewers)}</p>
              <p className="stat-label mt-1">Pricing Viewers</p>
            </div>
            <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><MousePointer size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtPct(retargetingData.summary.pricingToConversion)}</p>
              <p className="stat-label mt-1">Pricing → Convert</p>
            </div>
            <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><Users size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtPct(retargetingData.summary.returningRate)}</p>
              <p className="stat-label mt-1">Return Visitors</p>
            </div>
            <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><CheckCircle2 size={16} className="text-emerald-600" /></div>
              </div>
              <p className="stat-value">{fmtNum(retargetingData.summary.converters)}</p>
              <p className="stat-label mt-1">Conversions</p>
            </div>
          </div>
        )}

        {/* ── Sparkline ──────────────────────────────────────────────── */}
        {(pageviews?.pageviews?.length ?? 0) > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="stat-label">Pageviews over time</p>
                <p className="text-lg font-bold text-[var(--foreground)]" style={{ letterSpacing: '-0.02em' }}>
                  {fmtNum(stats?.pageviews.value ?? 0)} views
                </p>
              </div>
              {stats?.uniques.value !== undefined && (
                <div className="text-right">
                  <p className="stat-label">Sessions</p>
                  <p className="text-base font-semibold text-[var(--accent)]">
                    {fmtNum(pageviews?.sessions.reduce((a, b) => a + b.y, 0) ?? 0)}
                  </p>
                </div>
              )}
            </div>
            <Sparkline data={pageviews?.pageviews ?? []} />
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[rgba(13,115,119,0.07)] bg-[rgba(13,115,119,0.02)]">
            {TABS.map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === id
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-white'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[rgba(13,115,119,0.02)]'
                }`}
              >
                <TabIcon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── OVERVIEW ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Top Pages" subtitle="Most viewed pages" />
                  <div className="space-y-2">
                    {loading && topPages.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="py-2"><Skeleton className="h-4 w-full mb-1.5" /><Skeleton className="h-1.5 w-full" /></div>
                      ))
                    ) : topPages.length === 0 ? (
                      <EmptyState icon={CheckCircle2} message="No page data yet for this period" />
                    ) : (
                      topPages.slice(0, 8).map((row) => (
                        <MetricRowBar key={row.x} label={row.x} value={row.y} max={maxPages} />
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SectionTitle title="Referrers" />
                    {referrers.length === 0 ? (
                      <EmptyState icon={Globe} message="No referrer data" />
                    ) : (
                      <div className="space-y-1">
                        {referrers.map((row) => (
                          <MetricRowBar key={row.x} label={row.x || '(direct)'} value={row.y} max={referrers[0]?.y ?? 1} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <SectionTitle title="Browsers" />
                    {browsers.length === 0 ? (
                      <EmptyState icon={Monitor} message="No browser data" />
                    ) : (
                      <div className="space-y-1">
                        {browsers.map((row) => (
                          <MetricRowBar key={row.x} label={row.x} value={row.y} max={browsers[0]?.y ?? 1} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── CHANNELS ─────────────────────────────────────────── */}
            {activeTab === 'channels' && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Traffic Channels" subtitle="Sessions grouped by acquisition source with conversion data" />
                  {!channelsData?.channels?.length ? (
                    <EmptyState icon={Globe} message="No channel data for this period" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Channel</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Sessions</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">Bounce</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">Avg Time</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Intent</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Conv.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelsData.channels.map((ch) => (
                            <tr key={ch.channel} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)]">{ch.channel}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)] font-semibold">{fmtNum(ch.sessions)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)] hidden sm:table-cell">{fmtPct(ch.bounceRate)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)] hidden sm:table-cell">{fmtDuration(ch.avgDuration)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums">
                                <span className={ch.intentRate > 0.1 ? 'text-emerald-600 font-semibold' : 'text-[var(--muted-foreground)]'}>
                                  {fmtPct(ch.intentRate)}
                                </span>
                              </td>
                              <td className="py-2.5 pl-2 text-right tabular-nums">
                                <span className={ch.conversions > 0 ? 'text-emerald-600 font-bold' : 'text-[var(--muted-foreground)]'}>
                                  {ch.conversions}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {(channelsData?.utmSources?.length ?? 0) > 0 && (
                  <div>
                    <SectionTitle title="UTM Sources" subtitle="Traffic by utm_source parameter (Google Ads, email campaigns)" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Source</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Sessions</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pricing</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Conv.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelsData!.utmSources.map((u) => (
                            <tr key={u.name} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)]">{u.name}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)]">{fmtNum(u.sessions)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{u.pricingViews}</td>
                              <td className="py-2.5 pl-2 text-right tabular-nums font-semibold text-emerald-600">{u.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(channelsData?.utmCampaigns?.length ?? 0) > 0 && (
                  <div>
                    <SectionTitle title="Campaigns" subtitle="Performance by utm_campaign — measure each cold email blast and ad campaign" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Campaign</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Sessions</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Bounce</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pricing</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Conv.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelsData!.utmCampaigns.map((u) => (
                            <tr key={u.name} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)] truncate max-w-[200px]" title={u.name}>{u.name}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)]">{fmtNum(u.sessions)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{fmtPct(u.bounceRate)}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{u.pricingViews}</td>
                              <td className="py-2.5 pl-2 text-right tabular-nums font-semibold text-emerald-600">{u.conversions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FLOW ──────────────────────────────────────────────── */}
            {activeTab === 'flow' && (
              <div className="space-y-6">
                {!flowData ? (
                  <EmptyState icon={ArrowRight} message="No flow data for this period" />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <SectionTitle title="Entry Pages" subtitle="Where visitors land first" />
                        <div className="space-y-1">
                          {flowData.entryPages.map((row) => (
                            <MetricRowBar key={row.x} label={row.x} value={row.y} max={flowData.entryPages[0]?.y ?? 1} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionTitle title="Exit Pages" subtitle="Where visitors leave" />
                        <div className="space-y-1">
                          {flowData.exitPages.map((row) => (
                            <MetricRowBar key={row.x} label={row.x} value={row.y} max={flowData.exitPages[0]?.y ?? 1} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionTitle title="Top Page Transitions" subtitle="Most common page-to-page journeys" />
                      <div className="space-y-1">
                        {flowData.topTransitions.length === 0 ? (
                          <EmptyState icon={ArrowRight} message="Not enough multi-page sessions" />
                        ) : (
                          flowData.topTransitions.map((row) => (
                            <MetricRowBar key={row.x} label={row.x} value={row.y} max={flowData.topTransitions[0]?.y ?? 1} />
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <SectionTitle title="Visit Number" subtitle="How many times visitors return before converting" />
                        <div className="space-y-1">
                          {flowData.visitDistribution.map((row) => (
                            <MetricRowBar key={row.x} label={`Visit #${row.x}`} value={row.y} max={flowData.visitDistribution[0]?.y ?? 1} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionTitle title="Devices" subtitle="Desktop vs Mobile vs Tablet" />
                        <div className="space-y-1">
                          {flowData.devices.map((row) => (
                            <div key={row.x} className="group py-2.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-[var(--foreground)] flex items-center gap-2">
                                  <DeviceIcon device={row.x} />
                                  {row.x}
                                </span>
                                <span className="text-sm font-semibold text-[var(--accent)] tabular-nums">{fmtNum(row.y)}</span>
                              </div>
                              <div className="progress-track">
                                <div className="progress-fill transition-all duration-700 ease-out" style={{ width: `${(row.y / (flowData.devices[0]?.y ?? 1)) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── FUNNEL ────────────────────────────────────────────── */}
            {activeTab === 'funnel' && (
              <div className="space-y-8">
                <div>
                  <SectionTitle title="Direct Course Funnel" subtitle="Homepage → Preview → Pricing → Enrol → Checkout" />
                  {!funnelData?.directFunnel?.length ? (
                    <EmptyState icon={BarChart2} message="No funnel data for this period" />
                  ) : (
                    <div className="space-y-0">
                      {funnelData.directFunnel.map((step, i) => (
                        <FunnelStepRow
                          key={step.label}
                          step={step}
                          index={i}
                          total={funnelData.directFunnel[0]?.count || 1}
                          isLast={i === funnelData.directFunnel.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[rgba(13,115,119,0.08)] pt-6">
                  <SectionTitle title="Preseason → Course Funnel" subtitle="Baseline tool lead magnet → course conversion" />
                  {!funnelData?.preseasonFunnel?.length ? (
                    <EmptyState icon={BarChart2} message="No preseason funnel data" />
                  ) : (
                    <div className="space-y-0">
                      {funnelData.preseasonFunnel.map((step, i) => (
                        <FunnelStepRow
                          key={step.label}
                          step={step}
                          index={i}
                          total={funnelData.preseasonFunnel[0]?.count || 1}
                          isLast={i === funnelData.preseasonFunnel.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── EVENTS ────────────────────────────────────────────── */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <SectionTitle title="Custom Events" subtitle="All tracked actions excluding pageviews" />
                {eventsData.length === 0 ? (
                  <EmptyState icon={Zap} message="No custom events for this period" />
                ) : (
                  <div className="space-y-3">
                    {eventsData.map((group) => (
                      <div key={group.eventType} className="rounded-xl border border-[rgba(13,115,119,0.08)] bg-[rgba(255,255,255,0.6)] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-[var(--accent)]" />
                            <span className="text-sm font-semibold text-[var(--foreground)]">
                              {EVENT_LABELS[group.eventType] || group.eventType}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-[var(--accent)] tabular-nums">{fmtNum(group.count)}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] font-mono mb-2">{group.eventType}</p>
                        {group.latest.length > 0 && (
                          <div className="space-y-1 mt-3 pt-3 border-t border-[rgba(13,115,119,0.06)]">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Recent</p>
                            {group.latest.slice(0, 3).map((entry, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-[var(--muted-foreground)] truncate max-w-[60%]" title={entry.path}>{entry.path}</span>
                                <span className="text-[var(--muted-foreground)] tabular-nums shrink-0 ml-2">{timeAgo(entry.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RETARGETING ──────────────────────────────────────── */}
            {activeTab === 'retargeting' && (
              <div className="space-y-6">
                <div>
                  <SectionTitle title="Hot Leads — Pricing Viewers (Not Converted)" subtitle="Visitors who viewed pricing but haven't purchased. Priority retargeting targets." />
                  {!retargetingData?.hotLeads?.length ? (
                    <EmptyState icon={Target} message="No hot leads identified for this period" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">IP</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Visits</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pages</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pricing</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">Channel</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden md:table-cell">Device</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Last Seen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {retargetingData.hotLeads.map((lead) => (
                            <tr key={lead.ip} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--foreground)]">{lead.ip}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)] font-semibold">{lead.visits}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{lead.pageviews}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-amber-600">{lead.pricingViews}x</td>
                              <td className="py-2.5 px-2 text-[var(--muted-foreground)] hidden sm:table-cell">{lead.channel}</td>
                              <td className="py-2.5 px-2 hidden md:table-cell">
                                <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                                  <DeviceIcon device={lead.device} />{lead.device}
                                </span>
                              </td>
                              <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">{timeAgo(lead.lastSeen)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="border-t border-[rgba(13,115,119,0.08)] pt-6">
                  <SectionTitle title="Preseason Leads — Not Yet Engaged with Course" subtitle="Clinicians who used baseline tool but haven't viewed pricing. Nurture via email." />
                  {!retargetingData?.preseasonLeads?.length ? (
                    <EmptyState icon={Users} message="No preseason-only leads for this period" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">IP</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Visits</th>
                            <th className="text-center py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Registered</th>
                            <th className="text-center py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Submitted</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">Channel</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Last Seen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {retargetingData.preseasonLeads.map((lead) => (
                            <tr key={lead.ip} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--foreground)]">{lead.ip}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)]">{lead.visits}</td>
                              <td className="py-2.5 px-2 text-center">
                                {lead.hasRegistered ? <CheckCircle2 size={14} className="inline text-emerald-600" /> : <span className="text-[var(--muted-foreground)]">-</span>}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {lead.hasSubmitted ? <CheckCircle2 size={14} className="inline text-emerald-600" /> : <span className="text-[var(--muted-foreground)]">-</span>}
                              </td>
                              <td className="py-2.5 px-2 text-[var(--muted-foreground)] hidden sm:table-cell">{lead.channel}</td>
                              <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">{timeAgo(lead.lastSeen)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-[var(--muted-foreground)] opacity-40">
            Self-hosted analytics · Powered by Vercel Blob
          </p>
        </div>
      </div>
    </div>
  )
}
