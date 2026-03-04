'use client'

/**
 * app/admin/analytics/page.tsx  (or wherever you mount it)
 *
 * Analytics dashboard — fetches from /api/analytics/umami proxy.
 * Design: frosted glass cards, teal accent, Geist font.
 * No external chart libraries — pure CSS progress bars for data viz.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users,
  Eye,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowRight,
  Globe,
  Monitor,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Activity,
  BarChart2,
  Lock,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface UmamiStats {
  _isMockData?: boolean
  _message?: string
  error?: string
  pageviews: { value: number; prev: number }
  uniques: { value: number; prev: number }
  bounces: { value: number; prev: number }
  totaltime: { value: number; prev: number }
}

interface PageviewPoint {
  x: string
  y: number
}

interface UmamiPageviews {
  _isMockData?: boolean
  pageviews: PageviewPoint[]
  sessions: PageviewPoint[]
}

interface MetricRow {
  x: string
  y: number
}

interface UmamiMetrics {
  _isMockData?: boolean
  data?: MetricRow[]
  // Umami v2 returns array directly
  [index: number]: MetricRow
}

type Period = '24h' | '7d' | '30d' | '90d'
type TabType = 'overview' | 'pages' | 'referrers' | 'browsers' | 'funnel'

// ── Constants ─────────────────────────────────────────────────────────────────
const PERIODS: { label: string; value: Period }[] = [
  { label: '24h', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

const FUNNEL_STEPS = [
  { label: 'Homepage', path: '/', description: 'All visitors' },
  { label: 'Pricing / Courses', path: '/pricing', description: 'Showing intent' },
  { label: 'Checkout', path: '/checkout', description: 'Purchase intent' },
  { label: 'Enrolment Success', path: '/success', description: 'Conversions' },
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

function pct(value: number, prev: number): { delta: number; sign: string; color: string } {
  if (prev === 0) return { delta: 0, sign: '', color: 'text-gray-400' }
  const delta = ((value - prev) / prev) * 100
  const sign = delta >= 0 ? '+' : ''
  const color = delta >= 0 ? 'text-emerald-600' : 'text-rose-500'
  return { delta: Math.abs(delta), sign, color }
}

function normaliseMetrics(data: UmamiMetrics | null): MetricRow[] {
  if (!data) return []
  // Umami v2 returns the array directly
  if (Array.isArray(data)) return data as MetricRow[]
  if (Array.isArray((data as any).data)) return (data as any).data as MetricRow[]
  return []
}

// ── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-[rgba(13,115,119,0.04)] via-[rgba(13,115,119,0.08)] to-[rgba(13,115,119,0.04)] animate-pulse ${className}`}
    />
  )
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  prev,
  icon: Icon,
  format = 'number',
  loading = false,
}: {
  label: string
  value: number
  prev: number
  icon: React.ElementType
  format?: 'number' | 'percent' | 'duration'
  loading?: boolean
}) {
  const { delta, sign, color } = pct(value, prev)
  const displayVal =
    format === 'duration'
      ? fmtDuration(value)
      : format === 'percent'
      ? `${(value * 100).toFixed(1)}%`
      : fmtNum(value)

  return (
    <div
      className="card stat-tile group"
      style={{ '--shimmer-delay': '0s' } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="icon-container w-9 h-9">
          <Icon size={16} className="text-[var(--accent)]" />
        </div>
        {!loading && delta > 0 && (
          <span className={`text-xs font-semibold ${color} tabular-nums`}>
            {sign}{delta.toFixed(1)}%
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-3 w-16 mt-1" />
        </>
      ) : (
        <>
          <p className="stat-value">{displayVal}</p>
          <p className="stat-label mt-1">{label}</p>
        </>
      )}
    </div>
  )
}

// ── Bar row for top-pages / referrers / browsers ───────────────────────
function MetricRow({ label, value, max }: { label: string; value: number; max: number }) {
  const widthPct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="group py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-sm text-[var(--foreground)] truncate max-w-[70%]"
          title={label}
        >
          {label || '(direct)'}
        </span>
        <span className="text-sm font-semibold text-[var(--accent)] tabular-nums ml-2 shrink-0">
          {fmtNum(value)}
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill transition-all duration-700 ease-out"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  )
}

// ── Setup banner ────────────────────────────────────────────────────────────
function SetupBanner({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-6">
      <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="text-sm font-semibold mb-0.5">Setup Required</p>
        <p className="text-xs leading-relaxed">
          {message ??
            'Add UMAMI_WEBSITE_ID and UMAMI_API_TOKEN to your Vercel environment variables. Dashboard is showing placeholder state.'}
        </p>
      </div>
    </div>
  )
}

// ── Funnel step ─────────────────────────────────────────────────────────────
function FunnelStep({
  step,
  count,
  total,
  isLast,
}: {
  step: { label: string; path: string; description: string }
  count: number
  total: number
  isLast: boolean
}) {
  const convRate = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="relative">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.6)] border border-[rgba(13,115,119,0.08)] backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-[rgba(13,115,119,0.06)] border border-[rgba(13,115,119,0.1)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--accent)]">{FUNNEL_STEPS.indexOf(step) + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-[var(--foreground)]">{step.label}</span>
            <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{fmtNum(count)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{step.path}</span>
            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">{convRate.toFixed(1)}%</span>
          </div>
          <div className="progress-track mt-2">
            <div
              className="progress-fill"
              style={{ width: `${convRate}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }}
            />
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

// ── Sparkline (CSS only) ─────────────────────────────────────────────────
function Sparkline({ data }: { data: PageviewPoint[] }) {
  if (!data || data.length === 0) return null
  const maxY = Math.max(...data.map((d) => d.y), 1)
  const w = 100
  const h = 40
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w
    const y = h - (d.y / maxY) * h
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <polyline
        points={`0,${h} ${pts.join(' ')} ${w},${h}`}
        fill="url(#sparkGrad)"
        strokeWidth="0"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Auth gate ───────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (key.trim().length < 8) {
      setError('Please enter a valid admin key.')
      return
    }
    onAuth(key.trim())
  }

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(13,115,119,0.08)] border border-[rgba(13,115,119,0.12)] flex items-center justify-center">
              <Lock size={20} className="text-[var(--accent)]" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-[var(--foreground)] mb-1" style={{ letterSpacing: '-0.02em' }}>
            Analytics
          </h1>
          <p className="text-sm text-center text-[var(--muted-foreground)] mb-6">
            Enter your admin key to access the dashboard
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={(e) => { setKey(e.target.value); setError('') }}
                placeholder="Admin key"
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,115,119,0.12)] bg-[rgba(255,255,255,0.7)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(13,115,119,0.1)] transition-all"
                autoFocus
              />
              {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              className="btn-enhanced btn-primary-enhanced w-full"
            >
              Access Dashboard
              <ArrowRight size={15} />
            </button>
          </form>
          <p className="text-xs text-center text-[var(--muted-foreground)] mt-4 opacity-60">
            portal.concussion-education-australia.com
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ──────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('7d')
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isMockData, setIsMockData] = useState(false)
  const [mockMessage, setMockMessage] = useState<string>()

  // Data state
  const [stats, setStats] = useState<UmamiStats | null>(null)
  const [pageviews, setPageviews] = useState<UmamiPageviews | null>(null)
  const [topPages, setTopPages] = useState<MetricRow[]>([])
  const [referrers, setReferrers] = useState<MetricRow[]>([])
  const [browsers, setBrowsers] = useState<MetricRow[]>([])

  // Hydrate admin key from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('analytics_admin_key')
    if (stored) setAdminKey(stored)
  }, [])

  const handleAuth = useCallback((key: string) => {
    sessionStorage.setItem('analytics_admin_key', key)
    setAdminKey(key)
  }, [])

  // ── Fetch helper ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (type: string, extra: Record<string, string> = {}): Promise<any> => {
      if (!adminKey) return null
      const params = new URLSearchParams({ type, period, ...extra })
      const res = await fetch(`/api/analytics/umami?${params}`, {
        headers: { 'x-admin-key': adminKey },
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`API error ${res.status}`)
      }
      const data = await res.json()
      // Track mock data status
      if (data._isMockData) {
        setIsMockData(true)
        setMockMessage(data._message)
      }
      return data
    },
    [adminKey, period]
  )

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setIsMockData(false)
    try {
      const [statsData, pvData, pagesData, refData, browserData] = await Promise.allSettled([
        fetchData('stats'),
        fetchData('pageviews'),
        fetchData('metrics', { metricType: 'url' }),
        fetchData('metrics', { metricType: 'referrer' }),
        fetchData('metrics', { metricType: 'browser' }),
      ])

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value as UmamiStats)
      }
      if (pvData.status === 'fulfilled' && pvData.value) {
        setPageviews(pvData.value as UmamiPageviews)
      }
      if (pagesData.status === 'fulfilled') {
        setTopPages(normaliseMetrics(pagesData.value as UmamiMetrics).slice(0, 10))
      }
      if (refData.status === 'fulfilled') {
        setReferrers(normaliseMetrics(refData.value as UmamiMetrics).slice(0, 8))
      }
      if (browserData.status === 'fulfilled') {
        setBrowsers(normaliseMetrics(browserData.value as UmamiMetrics).slice(0, 6))
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Analytics] Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [adminKey, fetchData])

  // Load on auth / period change
  useEffect(() => {
    if (adminKey) loadAll()
  }, [adminKey, period, loadAll])

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!adminKey) {
    return <AuthGate onAuth={handleAuth} />
  }

  // ── Funnel: find page counts from topPages data ──────────────────────
  const getFunnelCount = (path: string): number => {
    const row = topPages.find((p) => p.x === path || p.x?.startsWith(path))
    return row?.y ?? 0
  }
  const funnelTotal = getFunnelCount('/') || stats?.pageviews.value || 0

  const bounceRate = stats ? stats.bounces.value / Math.max(stats.uniques.value, 1) : 0
  const avgDuration = stats ? Math.round(stats.totaltime.value / Math.max(stats.uniques.value, 1)) : 0

  const maxPages = topPages[0]?.y ?? 1
  const maxRef = referrers[0]?.y ?? 1
  const maxBrowser = browsers[0]?.y ?? 1

  const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'pages', label: 'Top Pages', icon: FileText },
    { id: 'referrers', label: 'Referrers', icon: Globe },
    { id: 'browsers', label: 'Browsers', icon: Monitor },
    { id: 'funnel', label: 'Funnel', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen dashboard-bg">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="glass sticky top-0 z-50 px-4 sm:px-6">
        <div className="container-xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[rgba(13,115,119,0.1)] border border-[rgba(13,115,119,0.12)] flex items-center justify-center">
              <BarChart2 size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--foreground)]" style={{ letterSpacing: '-0.01em' }}>
                Analytics
              </h1>
              {lastRefresh && (
                <p className="text-xs text-[var(--muted-foreground)] hidden sm:block">
                  Updated {lastRefresh.toLocaleTimeString('en-AU', { timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
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

            {/* Refresh */}
            <button
              onClick={loadAll}
              disabled={loading}
              className="action-pill"
              title="Refresh"
            >
              <RefreshCw
                size={13}
                className={loading ? 'animate-spin text-[var(--accent)]' : 'text-[var(--muted-foreground)]'}
              />
              <span className="hidden sm:inline">{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>

            {/* Sign out */}
            <button
              onClick={() => {
                sessionStorage.removeItem('analytics_admin_key')
                setAdminKey(null)
              }}
              className="action-pill text-[var(--muted-foreground)] hover:text-rose-500"
              title="Sign out"
            >
              <Lock size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Setup banner ─────────────────────────────────────── */}
        {isMockData && <SetupBanner message={mockMessage} />}

        {/* ── KPI grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Unique Visitors"
            value={stats?.uniques.value ?? 0}
            prev={stats?.uniques.prev ?? 0}
            icon={Users}
            loading={loading && !stats}
          />
          <StatCard
            label="Page Views"
            value={stats?.pageviews.value ?? 0}
            prev={stats?.pageviews.prev ?? 0}
            icon={Eye}
            loading={loading && !stats}
          />
          <StatCard
            label="Bounce Rate"
            value={bounceRate}
            prev={stats ? stats.bounces.prev / Math.max(stats.uniques.prev, 1) : 0}
            icon={TrendingUp}
            format="percent"
            loading={loading && !stats}
          />
          <StatCard
            label="Avg. Session"
            value={avgDuration}
            prev={stats ? Math.round(stats.totaltime.prev / Math.max(stats.uniques.prev, 1)) : 0}
            icon={Clock}
            format="duration"
            loading={loading && !stats}
          />
        </div>

        {/* ── Pageviews sparkline ───────────────────────────── */}
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

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
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

          {/* Tab content */}
          <div className="p-5">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-2">
                {loading && topPages.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="py-2">
                      <Skeleton className="h-4 w-full mb-1.5" />
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))
                ) : topPages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
                    <CheckCircle2 size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No page data yet for this period</p>
                  </div>
                ) : (
                  topPages.slice(0, 8).map((row) => (
                    <MetricRow key={row.x} label={row.x} value={row.y} max={maxPages} />
                  ))
                )}
              </div>
            )}

            {/* Top pages */}
            {activeTab === 'pages' && (
              <div className="space-y-1">
                {topPages.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
                    <FileText size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No page data for this period</p>
                  </div>
                ) : (
                  topPages.map((row) => (
                    <MetricRow key={row.x} label={row.x} value={row.y} max={maxPages} />
                  ))
                )}
              </div>
            )}

            {/* Referrers */}
            {activeTab === 'referrers' && (
              <div className="space-y-1">
                {referrers.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
                    <Globe size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No referrer data for this period</p>
                  </div>
                ) : (
                  referrers.map((row) => (
                    <MetricRow key={row.x} label={row.x || '(direct)'} value={row.y} max={maxRef} />
                  ))
                )}
              </div>
            )}

            {/* Browsers */}
            {activeTab === 'browsers' && (
              <div className="space-y-1">
                {browsers.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
                    <Monitor size={24} className="mb-2 opacity-30" />
                    <p className="text-sm">No browser data for this period</p>
                  </div>
                ) : (
                  browsers.map((row) => (
                    <MetricRow key={row.x} label={row.x} value={row.y} max={maxBrowser} />
                  ))
                )}
              </div>
            )}

            {/* Funnel */}
            {activeTab === 'funnel' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Google Ads Conversion Funnel</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Tracks visitor journey from homepage → enrolment
                    </p>
                  </div>
                  {funnelTotal > 0 && (
                    <div className="text-right">
                      <p className="stat-label">Overall conversion</p>
                      <p className="text-base font-bold text-[var(--accent)]">
                        {((getFunnelCount('/success') / funnelTotal) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-0">
                  {FUNNEL_STEPS.map((step, i) => (
                    <FunnelStep
                      key={step.path}
                      step={step}
                      count={getFunnelCount(step.path)}
                      total={funnelTotal}
                      isLast={i === FUNNEL_STEPS.length - 1}
                    />
                  ))}
                </div>
                {funnelTotal === 0 && (
                  <p className="text-xs text-center text-[var(--muted-foreground)] mt-4">
                    Funnel data populates once pageview metrics load.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="text-center py-2">
          <p className="text-xs text-[var(--muted-foreground)] opacity-40">
            Powered by{' '}
            <a
              href="https://umami.is"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              Umami Analytics
            </a>
            {' \u00b7 '}
            <a
              href="https://www.perplexity.ai/computer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              Built with Perplexity Computer
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
