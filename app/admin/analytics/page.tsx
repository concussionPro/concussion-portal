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
  Lightbulb,
  AlertTriangle,
  Flame,
  TrendingDown,
  MapPin,
  Building2,
  Mail,
  Download,
  Newspaper,
  DollarSign,
  ExternalLink,
  Search,
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

interface Insight {
  type: 'critical' | 'warning' | 'opportunity' | 'positive'
  category: string
  title: string
  detail: string
  metric: string
  action: string
}

type Period = '24h' | '7d' | '30d' | '90d'
type TabType = 'overview' | 'channels' | 'flow' | 'funnel' | 'events' | 'retargeting' | 'insights' | 'pool' | 'preseason' | 'users' | 'report' | 'google-ads'


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

function generateDailyReport(
  stats: AnalyticsStats | null,
  retargetingData: RetargetingData | null,
  funnelData: FunnelData | null,
  preseasonData: { totalClinics: number; totalBaselines: number } | null,
  channelsData: ChannelsData | null,
  usersData: Array<{ accessLevel: string; createdAt: string }>,
  period: string,
): string {
  const parts: string[] = []
  const periodLabel = period === '24h' ? 'today' : period === '7d' ? 'this week' : period === '30d' ? 'this month' : 'this quarter'

  // Traffic summary
  if (stats) {
    const visitors = stats.uniques.value
    const views = stats.pageviews.value
    const prevVisitors = stats.uniques.prev
    const bounce = Math.round((stats.bounces.value / Math.max(visitors, 1)) * 100)
    const avgSec = Math.round(stats.totaltime.value / Math.max(visitors, 1))
    const avgMin = Math.floor(avgSec / 60)
    const avgS = avgSec % 60
    const avgLabel = avgMin > 0 ? `${avgMin}m ${avgS}s` : `${avgS}s`
    const trend = prevVisitors > 0
      ? visitors > prevVisitors ? `up ${Math.round(((visitors - prevVisitors) / prevVisitors) * 100)}% from the previous period` : visitors < prevVisitors ? `down ${Math.round(((prevVisitors - visitors) / prevVisitors) * 100)}% from the previous period` : 'flat vs the previous period'
      : visitors > 0 ? '(first period with data)' : ''
    if (visitors > 0) {
      parts.push(`${visitors} unique visitors ${periodLabel} across ${views} page views ${trend}. Bounce rate sits at ${bounce}% with an average session of ${avgLabel}.`)
    } else {
      parts.push(`No visitor traffic recorded ${periodLabel}.`)
    }
  }

  // Retargeting / leads
  if (retargetingData) {
    const hotCount = retargetingData.hotLeads.length
    const preLeadCount = retargetingData.preseasonLeads.length
    const pricingViewers = retargetingData.summary.pricingViewers
    const converters = retargetingData.summary.converters
    const returnRate = Math.round(retargetingData.summary.returningRate * 100)

    if (returnRate > 0) {
      parts.push(`${returnRate}% of visitors are returning, which shows early engagement.`)
    }

    if (pricingViewers > 0 && converters === 0) {
      parts.push(`${pricingViewers} visitor${pricingViewers !== 1 ? 's' : ''} viewed the pricing page but none converted yet — these are your warmest leads.`)
    } else if (pricingViewers > 0 && converters > 0) {
      parts.push(`${pricingViewers} pricing page viewers with ${converters} conversion${converters !== 1 ? 's' : ''} (${Math.round(retargetingData.summary.pricingToConversion * 100)}% rate).`)
    }

    if (preLeadCount > 0) {
      const registeredCount = retargetingData.preseasonLeads.filter(l => l.hasRegistered).length
      const submittedCount = retargetingData.preseasonLeads.filter(l => l.hasSubmitted).length
      parts.push(`${preLeadCount} visitor${preLeadCount !== 1 ? 's' : ''} interacted with the preseason baseline tool (${registeredCount} registered, ${submittedCount} submitted) but none have engaged with the course or pricing yet.`)
    }
  }

  // Preseason vs retargeting discrepancy
  const clinicsRegistered = preseasonData?.totalClinics ?? 0
  const baselinesSubmitted = preseasonData?.totalBaselines ?? 0
  const preseasonLeadCount = retargetingData?.preseasonLeads?.length ?? 0

  // Check for data discrepancy between event tracking and stored records
  const eventRegistrations = retargetingData?.preseasonLeads?.filter(l => l.hasRegistered).length ?? 0
  const eventSubmissions = retargetingData?.preseasonLeads?.filter(l => l.hasSubmitted).length ?? 0
  if ((eventRegistrations > 0 || eventSubmissions > 0) && clinicsRegistered === 0 && baselinesSubmitted === 0) {
    parts.push(`Data discrepancy: analytics tracked ${eventRegistrations} registration${eventRegistrations !== 1 ? 's' : ''} and ${eventSubmissions} baseline submission${eventSubmissions !== 1 ? 's' : ''}, but the preseason database shows 0 clinics and 0 baselines. This likely means the registration events fired but the data didn't persist to storage — check the preseason API endpoints and database connection.`)
  } else if (preseasonLeadCount > 0 && clinicsRegistered === 0 && eventRegistrations === 0) {
    parts.push(`${preseasonLeadCount} IP${preseasonLeadCount !== 1 ? 's are' : ' is'} browsing preseason pages but none have started registration — the baseline tool is getting eyeballs but the registration flow isn't converting.`)
  } else if (clinicsRegistered > 0) {
    parts.push(`${clinicsRegistered} clinic${clinicsRegistered !== 1 ? 's' : ''} registered with ${baselinesSubmitted} baseline${baselinesSubmitted !== 1 ? 's' : ''} submitted.`)
  }

  // Channels
  if (channelsData?.channels?.length) {
    const sorted = [...channelsData.channels].sort((a, b) => b.sessions - a.sessions)
    const topChannel = sorted[0]
    if (topChannel && topChannel.sessions > 0) {
      const summary = sorted.filter(c => c.sessions > 0).map(c => `${c.channel} (${c.sessions})`).join(', ')
      parts.push(`Traffic by channel: ${summary}.`)
    }
  }

  // Users
  const newToday = usersData.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length
  const paidUsers = usersData.filter(u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course').length
  const totalUsers = usersData.length
  if (totalUsers > 0) {
    const userParts = [`${totalUsers} total user${totalUsers !== 1 ? 's' : ''}`]
    if (paidUsers > 0) userParts.push(`${paidUsers} paid`)
    if (newToday > 0) userParts.push(`${newToday} new today`)
    parts.push(userParts.join(', ') + '.')
  }

  // Focus recommendation
  const focusParts: string[] = []
  if ((retargetingData?.summary.pricingViewers ?? 0) > 0 && (retargetingData?.summary.converters ?? 0) === 0) {
    focusParts.push('pricing page visitors aren\'t converting — review the offer, add testimonials, or reduce friction')
  }
  if ((eventRegistrations > 0 || eventSubmissions > 0) && clinicsRegistered === 0) {
    focusParts.push('fix the preseason data pipeline — registration events are firing but records aren\'t being stored')
  } else if (preseasonLeadCount > 0 && clinicsRegistered === 0 && eventRegistrations === 0) {
    focusParts.push('add stronger CTAs on preseason pages to push visitors into registration')
  }
  if (stats && stats.bounces.value / Math.max(stats.uniques.value, 1) > 0.6) {
    focusParts.push(`${Math.round((stats.bounces.value / Math.max(stats.uniques.value, 1)) * 100)}% bounce rate — improve landing page hooks and above-fold CTAs`)
  }
  if (stats && stats.uniques.value === 0) {
    focusParts.push('no traffic yet — prioritise outreach, social posts, or ad spend')
  }
  if (focusParts.length > 0) {
    parts.push(`Focus: ${focusParts.join('. ')}.`)
  }

  return parts.join(' ') || `No data available for ${periodLabel}. Check back once traffic starts flowing.`
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
  const [activeTab, setActiveTab] = useState<TabType>('insights')
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
  const [insightsData, setInsightsData] = useState<Insight[]>([])

  // Ready-to-train pool data
  const [poolData, setPoolData] = useState<{ totalCount: number; cities: Array<{ city: string; label: string; count: number; registrations: Array<{ email: string; name: string; city: string; registeredAt: string; completedAt: string }> }> } | null>(null)

  // Preseason data
  const [preseasonData, setPreseasonData] = useState<{ clinics: Array<{ clinicName: string; contactName: string; email: string; code: string; createdAt: string }>; baselines: Array<{ clinicCode: string; clinicName?: string; athleteName?: string; submittedAt: string; symptomCount?: number; symptomSeverity?: number; cognitiveScore?: number }>; totalClinics: number; totalBaselines: number } | null>(null)

  // Users/emails data
  const [usersData, setUsersData] = useState<Array<{ id: string; email: string; name: string; accessLevel: string; createdAt: string; lastLogin: string | null; completedModules?: number; totalCPDPoints?: number; moduleDetails?: Record<number, { completed: boolean; quizScore: number | null }> }>>([])
  const [usersFilter, setUsersFilter] = useState<'all' | 'preview' | 'paid'>('all')


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
        fetchData('insights'),       // 10
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
      if (get(10) && Array.isArray(get(10))) setInsightsData(get(10) as Insight[])

      // Fetch additional admin data (separate endpoints)
      try {
        const [poolRes, preseasonRes, usersRes] = await Promise.allSettled([
          fetch('/api/admin/ready-to-train', { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
          fetch('/api/admin/preseason', { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
          fetch('/api/admin/emails', { headers: { 'x-admin-key': adminKey }, cache: 'no-store' }),
        ])

        if (poolRes.status === 'fulfilled' && poolRes.value.ok) {
          const poolJson = await poolRes.value.json()
          if (poolJson.success) setPoolData(poolJson)
        }
        if (preseasonRes.status === 'fulfilled' && preseasonRes.value.ok) {
          const preseasonJson = await preseasonRes.value.json()
          if (preseasonJson.success) setPreseasonData(preseasonJson)
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const usersJson = await usersRes.value.json()
          if (usersJson.success) setUsersData(usersJson.emails || [])
        }
      } catch (err) {
        console.warn('[Analytics] Admin data load error:', err)
      }

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
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'channels', label: 'Channels', icon: Globe },
    { id: 'flow', label: 'Flow', icon: ArrowRight },
    { id: 'funnel', label: 'Funnel', icon: BarChart2 },
    { id: 'events', label: 'Events', icon: Zap },
    { id: 'retargeting', label: 'Retargeting', icon: Target },
    { id: 'pool', label: 'Ready to Train', icon: MapPin },
    { id: 'preseason', label: 'Preseason', icon: Building2 },
    { id: 'users', label: 'Users', icon: Mail },
    { id: 'report', label: 'Daily Report', icon: Newspaper },
    { id: 'google-ads', label: 'Google Ads', icon: DollarSign },
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
            {/* ── INSIGHTS ─────────────────────────────────────────── */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <SectionTitle title="Marketing Insights" subtitle="Auto-generated recommendations based on your data. Read top to bottom — most urgent first." />
                {insightsData.length === 0 ? (
                  <EmptyState icon={Lightbulb} message="Not enough data yet — insights appear after a few days of traffic" />
                ) : (
                  <div className="space-y-3">
                    {insightsData.map((insight, i) => {
                      const borderColor = insight.type === 'critical' ? 'border-rose-300 bg-rose-50/50'
                        : insight.type === 'warning' ? 'border-amber-300 bg-amber-50/50'
                        : insight.type === 'opportunity' ? 'border-blue-300 bg-blue-50/50'
                        : 'border-emerald-300 bg-emerald-50/50'
                      const IconComp = insight.type === 'critical' ? Flame
                        : insight.type === 'warning' ? AlertTriangle
                        : insight.type === 'opportunity' ? Target
                        : CheckCircle2
                      const iconColor = insight.type === 'critical' ? 'text-rose-600'
                        : insight.type === 'warning' ? 'text-amber-600'
                        : insight.type === 'opportunity' ? 'text-blue-600'
                        : 'text-emerald-600'
                      const typeLabel = insight.type === 'critical' ? 'CRITICAL'
                        : insight.type === 'warning' ? 'WARNING'
                        : insight.type === 'opportunity' ? 'OPPORTUNITY'
                        : 'POSITIVE'
                      const typeBg = insight.type === 'critical' ? 'bg-rose-100 text-rose-700'
                        : insight.type === 'warning' ? 'bg-amber-100 text-amber-700'
                        : insight.type === 'opportunity' ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'

                      return (
                        <div key={i} className={`rounded-xl border-2 p-5 ${borderColor}`}>
                          <div className="flex items-start gap-3">
                            <IconComp size={20} className={`${iconColor} shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBg}`}>{typeLabel}</span>
                                <span className="text-xs text-[var(--muted-foreground)] font-medium uppercase">{insight.category}</span>
                                <span className="text-xs font-bold text-[var(--accent)] tabular-nums ml-auto">{insight.metric}</span>
                              </div>
                              <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">{insight.title}</h3>
                              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">{insight.detail}</p>
                              <div className="rounded-lg bg-white/80 border border-[rgba(13,115,119,0.1)] p-3">
                                <p className="text-xs font-semibold text-[var(--accent)] mb-1">What to do:</p>
                                <p className="text-sm text-[var(--foreground)] leading-relaxed">{insight.action}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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

            {/* ── Ready to Train Pool ──────────────────────────────────────── */}
            {activeTab === 'pool' && (
              <div className="space-y-6">
                {!poolData ? (
                  <EmptyState icon={MapPin} message="Loading pool data..." />
                ) : (
                  <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {poolData.cities.map((city) => {
                        const progress = Math.min((city.count / 8) * 100, 100)
                        const isReady = city.count >= 8
                        return (
                          <div
                            key={city.city}
                            className={`glass rounded-xl p-4 ${isReady ? 'border-2 border-emerald-400' : ''}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={14} className={isReady ? 'text-emerald-600' : 'text-[var(--accent)]'} />
                              <span className="text-xs font-bold text-[var(--foreground)]">{city.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                              {city.count}<span className="text-sm font-normal text-[var(--muted-foreground)]"> / 8</span>
                            </p>
                            <div className="mt-2 w-full bg-[rgba(13,115,119,0.08)] rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${isReady ? 'bg-emerald-500' : 'bg-[var(--accent)]'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              {isReady ? 'Ready to schedule!' : `${8 - city.count} more needed`}
                            </p>
                          </div>
                        )
                      })}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={14} className="text-[var(--accent)]" />
                          <span className="text-xs font-bold text-[var(--foreground)]">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{poolData.totalCount}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-3">Across all cities</p>
                      </div>
                    </div>

                    {/* Per-city tables */}
                    {poolData.cities.map((city) => (
                      <div key={city.city}>
                        <SectionTitle title={`${city.label} (${city.count})`} subtitle={city.count >= 8 ? 'Threshold reached — ready to schedule workshop' : `${8 - city.count} more clinicians needed`} />
                        {city.registrations.length === 0 ? (
                          <EmptyState icon={Users} message={`No registrations for ${city.label}`} />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[rgba(13,115,119,0.08)]">
                                  <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Name</th>
                                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Email</th>
                                  <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Registered</th>
                                </tr>
                              </thead>
                              <tbody>
                                {city.registrations.map((r, i) => (
                                  <tr key={i} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                                    <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{r.name}</td>
                                    <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{r.email}</td>
                                    <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">
                                      {new Date(r.registeredAt).toLocaleDateString('en-AU')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}

                    {poolData.cities.length === 0 && (
                      <EmptyState icon={MapPin} message="No ready-to-train registrations yet" />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Preseason ─────────────────────────────────────────────── */}
            {activeTab === 'preseason' && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Clinics Registered</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{preseasonData?.totalClinics ?? 0}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Baselines Submitted</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{preseasonData?.totalBaselines ?? 0}</p>
                  </div>
                </div>

                <SectionTitle title="Registered Clinics" subtitle="Clinics that have registered for preseason baseline testing" />
                {!preseasonData?.clinics?.length ? (
                  <EmptyState icon={Building2} message="No clinic registrations yet. Data will appear once the preseason registration flow is active." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(13,115,119,0.08)]">
                          <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Clinic</th>
                          <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Contact</th>
                          <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Email</th>
                          <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Code</th>
                          <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preseasonData.clinics.map((c, i) => (
                          <tr key={i} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                            <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{c.clinicName}</td>
                            <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{c.contactName}</td>
                            <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{c.email}</td>
                            <td className="py-2.5 px-2"><span className="px-2 py-0.5 rounded-full bg-[rgba(13,115,119,0.08)] text-xs font-semibold text-[var(--accent)]">{c.code}</span></td>
                            <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">{new Date(c.createdAt).toLocaleDateString('en-AU')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-[rgba(13,115,119,0.08)] pt-6">
                  <SectionTitle title="Baseline Submissions" subtitle="Athlete baselines submitted through the preseason tool" />
                  {!preseasonData?.baselines?.length ? (
                    <EmptyState icon={FileText} message="No baseline submissions yet. Data will appear once athletes complete baselines." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(13,115,119,0.08)]">
                            <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Athlete</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Clinic</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Symptoms</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Severity</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Cognitive</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...preseasonData.baselines].reverse().map((b, i) => (
                            <tr key={i} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{b.athleteName || '—'}</td>
                              <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{b.clinicName || b.clinicCode}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{b.symptomCount != null ? `${b.symptomCount}/22` : '—'}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{b.symptomSeverity != null ? `${b.symptomSeverity}/132` : '—'}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[var(--foreground)]">{b.cognitiveScore != null ? `${b.cognitiveScore}/50` : '—'}</td>
                              <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">{new Date(b.submittedAt).toLocaleDateString('en-AU')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Users / Emails ──────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{usersData.length}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Free</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{usersData.filter(u => u.accessLevel === 'preview').length}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-purple-600" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Paid</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{usersData.filter(u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course').length}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-orange-600" />
                      <span className="text-xs font-bold text-[var(--foreground)]">Today</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{usersData.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length}</p>
                  </div>
                </div>

                {/* Filters + Export */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.08)]">
                    {([['all', 'All'], ['preview', 'Free'], ['paid', 'Paid']] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setUsersFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          usersFilter === key
                            ? 'bg-white shadow-sm text-[var(--accent)] border border-[rgba(13,115,119,0.1)]'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {label} ({key === 'all' ? usersData.length : key === 'preview' ? usersData.filter(u => u.accessLevel === 'preview').length : usersData.filter(u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course').length})
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const filtered = usersData.filter(u => {
                        if (usersFilter === 'preview') return u.accessLevel === 'preview'
                        if (usersFilter === 'paid') return u.accessLevel === 'online-only' || u.accessLevel === 'full-course'
                        return true
                      })
                      const csv = ['Email,Name,Access Level,Modules Completed,CPD Points,Created,Last Login', ...filtered.map(u =>
                        `${u.email},${u.name},${u.accessLevel},${u.completedModules || 0}/8,${u.totalCPDPoints || 0},${new Date(u.createdAt).toLocaleDateString()},${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}`
                      )].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    <Download size={12} />
                    Export CSV
                  </button>
                </div>

                {/* Users table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(13,115,119,0.08)]">
                        <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Email</th>
                        <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Name</th>
                        <th className="text-center py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Access</th>
                        <th className="text-center py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Progress</th>
                        <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Signed Up</th>
                        <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.filter(u => {
                        if (usersFilter === 'preview') return u.accessLevel === 'preview'
                        if (usersFilter === 'paid') return u.accessLevel === 'online-only' || u.accessLevel === 'full-course'
                        return true
                      }).map((u) => {
                        const completed = u.completedModules || 0
                        const pctDone = Math.round((completed / 8) * 100)
                        return (
                        <tr key={u.id} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                          <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{u.email}</td>
                          <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{u.name}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              u.accessLevel === 'preview' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {u.accessLevel === 'preview' ? 'Free' : u.accessLevel === 'full-course' ? 'Full' : 'Online'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    completed === 8 ? 'bg-emerald-500' : completed > 0 ? 'bg-[var(--accent)]' : 'bg-gray-200'
                                  }`}
                                  style={{ width: `${pctDone}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold tabular-nums ${
                                completed === 8 ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'
                              }`}>
                                {completed}/8
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right text-xs text-[var(--muted-foreground)]">{new Date(u.createdAt).toLocaleDateString('en-AU')}</td>
                          <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-AU') : 'Never'}</td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Daily Report ──────────────────────────────────────────── */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                <SectionTitle title="Daily Report" subtitle={`Summary for ${period === '24h' ? 'today' : period === '7d' ? 'the last 7 days' : period === '30d' ? 'the last 30 days' : 'the last 90 days'} · ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />
                <div className="rounded-xl border-2 border-[rgba(13,115,119,0.12)] bg-[rgba(13,115,119,0.02)] p-6">
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    {generateDailyReport(stats, retargetingData, funnelData, preseasonData, channelsData, usersData, period)}
                  </p>
                </div>
              </div>
            )}

            {/* ── Google Ads ───────────────────────────────────────────── */}
            {activeTab === 'google-ads' && (() => {
              // Generate recommendations from existing analytics data
              const recs: Array<{ priority: 'high' | 'medium' | 'low'; category: string; title: string; instruction: string; where: string }> = []

              // Analyse top pages for landing page recommendations
              const preseasonPages = topPages.filter(p => p.x.includes('preseason'))
              const pricingPages = topPages.filter(p => p.x.includes('pricing') || p.x.includes('shop') || p.x.includes('enrol'))
              const scatPages = topPages.filter(p => p.x.includes('scat'))
              const coursePages = topPages.filter(p => p.x.includes('course') || p.x.includes('module') || p.x.includes('scat-mastery'))
              const totalViews = stats?.pageviews.value ?? 0
              const bounce = stats ? stats.bounces.value / Math.max(stats.uniques.value, 1) : 0
              const pricingViewers = retargetingData?.summary.pricingViewers ?? 0
              const converters = retargetingData?.summary.converters ?? 0
              const preseasonLeadCount = retargetingData?.preseasonLeads?.length ?? 0

              // Campaign structure recommendations
              recs.push({
                priority: 'high',
                category: 'Campaign Structure',
                title: 'Create two separate campaigns',
                instruction: 'Create Campaign 1: "Course Sales" targeting healthcare professionals searching for concussion CPD. Create Campaign 2: "Preseason Baseline" targeting sports clubs and clinics looking for baseline testing. Separate budgets let you control spend on each goal independently.',
                where: 'Google Ads > Campaigns > + New Campaign > Search',
              })

              // Keyword recommendations based on what\'s working on site
              const courseKeywords = [
                'concussion CPD course', 'concussion education australia', 'SCAT6 training',
                'concussion management course', 'AHPRA CPD concussion', 'sports concussion CPD',
                'concussion assessment training', 'SCAT6 course online',
              ]
              const preseasonKeywords = [
                'preseason baseline testing', 'concussion baseline test', 'SCAT6 baseline',
                'sports team concussion screening', 'athlete concussion baseline',
                'pre-season concussion assessment',
              ]

              recs.push({
                priority: 'high',
                category: 'Keywords — Course Campaign',
                title: 'Add these keywords to your Course Sales campaign',
                instruction: courseKeywords.map(k => `[${k}]`).join('\n') + '\n\nUse Exact Match [brackets] to start. Add Phrase Match "quotes" versions once you see which keywords convert. Set starting bids at $2-4 AUD — concussion CPD is niche so competition is low.',
                where: 'Google Ads > Course Sales campaign > Ad Groups > Keywords > +',
              })

              recs.push({
                priority: 'high',
                category: 'Keywords — Preseason Campaign',
                title: 'Add these keywords to your Preseason campaign',
                instruction: preseasonKeywords.map(k => `"${k}"`).join('\n') + '\n\nUse Phrase Match "quotes" for preseason — athletes and club admins search more varied terms. Bids at $1-2 AUD since this is a free tool (lead gen, not direct sale).',
                where: 'Google Ads > Preseason campaign > Ad Groups > Keywords > +',
              })

              // Negative keywords
              recs.push({
                priority: 'medium',
                category: 'Negative Keywords',
                title: 'Add negative keywords to avoid wasted spend',
                instruction: 'Add these as negative keywords across both campaigns:\nfree concussion test online\nconcussion symptoms\ndo I have a concussion\nconcussion treatment\nconcussion recovery time\nconcussion protocol NFL\nchild hit head\n\nThese are informational searches — people looking for answers, not courses or baseline tools.',
                where: 'Google Ads > All Campaigns > Keywords > Negative Keywords > +',
              })

              // Ad copy based on site data
              recs.push({
                priority: 'high',
                category: 'Ad Copy — Course',
                title: 'Set up responsive search ads for the course',
                instruction: `Headlines (max 30 chars each):\n• Concussion CPD Course\n• SCAT6 & SCOAT6 Training\n• AHPRA CPD Points\n• Online Self-Paced Course\n• Master Concussion Mgmt\n• Evidence-Based Training\n• Start Free — 2 CPD Points\n\nDescriptions (max 90 chars each):\n• Learn SCAT6 administration and interpretation. AHPRA-accredited. Start free today.\n• Concussion education for physios, GPs, and sports medicine professionals. Online, self-paced.\n• Free 2 CPD point module. Full course covers VOMS, BESS, return-to-play protocols.\n\nFinal URL: portal.concussion-education-australia.com/scat-mastery`,
                where: 'Google Ads > Course Sales > Ad Group > Ads > + Responsive Search Ad',
              })

              recs.push({
                priority: 'high',
                category: 'Ad Copy — Preseason',
                title: 'Set up responsive search ads for preseason baseline',
                instruction: 'Headlines:\n• Free Baseline Testing Tool\n• SCAT6 Preseason Baseline\n• Athlete Baseline Screening\n• Self-Administered SCAT6\n• For Clinics & Sports Clubs\n• PDF Report Emailed to You\n\nDescriptions:\n• Register your clinic free. Athletes self-complete SCAT6 baseline remotely. PDF emailed to you.\n• Pre-season concussion baseline tool. No login needed. Share one link with your entire team.\n\nFinal URL: portal.concussion-education-australia.com/preseason',
                where: 'Google Ads > Preseason > Ad Group > Ads > + Responsive Search Ad',
              })

              // Landing page / extensions recommendations from analytics
              if (bounce > 0.5) {
                recs.push({
                  priority: 'high',
                  category: 'Landing Pages',
                  title: `Bounce rate is ${Math.round(bounce * 100)}% — improve landing page relevance`,
                  instruction: `Your site bounce rate is ${Math.round(bounce * 100)}%. For Google Ads, send course traffic to /scat-mastery (not the homepage) and preseason traffic to /preseason. In each campaign, set the Final URL to the specific landing page. A high bounce rate raises your CPC because Google sees poor ad-to-page relevance.`,
                  where: 'Google Ads > Each Ad > Edit > Final URL field',
                })
              }

              if (pricingViewers > 0 && converters === 0) {
                recs.push({
                  priority: 'high',
                  category: 'Conversion Tracking',
                  title: `${pricingViewers} pricing viewers but 0 conversions — set up conversion tracking`,
                  instruction: 'You have pricing page visitors who aren\'t converting. Before spending on ads, set up Google Ads conversion tracking so you know which keywords and ads drive sales.\n\n1. In Google Ads: Tools > Conversions > + New > Website\n2. Name: "Course Purchase", Category: Purchase, Value: use your course price\n3. Copy the conversion tag\n4. Add it to your thank-you/success page after purchase\n\nWithout this, Google can\'t optimise your campaigns.',
                  where: 'Google Ads > Tools & Settings > Measurement > Conversions',
                })
              }

              // Budget recommendation
              recs.push({
                priority: 'medium',
                category: 'Budget',
                title: 'Recommended starting budget',
                instruction: 'Start with $10-20/day for the Course campaign and $5-10/day for Preseason. Run for 2 weeks to gather data before optimising. After 2 weeks, pause keywords with 0 conversions and high spend, and increase budget on keywords that convert.',
                where: 'Google Ads > Each Campaign > Settings > Budget',
              })

              // Location targeting
              recs.push({
                priority: 'medium',
                category: 'Location Targeting',
                title: 'Target Australia only',
                instruction: 'Set location targeting to Australia. Your course is AHPRA-accredited (Australian Health Practitioner Regulation Agency) so targeting outside AU wastes spend. You can further narrow to specific states if you find certain regions convert better.',
                where: 'Google Ads > Each Campaign > Settings > Locations',
              })

              // Ad extensions
              recs.push({
                priority: 'medium',
                category: 'Ad Extensions',
                title: 'Add sitelink and callout extensions',
                instruction: 'Sitelinks (add 4):\n• "Free SCAT6 Module" → /scat-mastery\n• "Baseline Testing Tool" → /preseason\n• "Course Pricing" → /pricing\n• "About the Course" → /\n\nCallout extensions:\n• AHPRA Accredited\n• Self-Paced Online\n• Start Free\n• Evidence-Based\n• Certificate Included\n\nThese increase your ad size and CTR at no extra cost.',
                where: 'Google Ads > Ads & Extensions > Extensions > +',
              })

              // Audience suggestion based on preseason leads
              if (preseasonLeadCount > 0) {
                recs.push({
                  priority: 'low',
                  category: 'Audiences',
                  title: `${preseasonLeadCount} preseason leads — create a remarketing audience`,
                  instruction: 'People who used your baseline tool are warm leads for the paid course. Create a remarketing audience of /preseason page visitors and layer it onto your Course campaign as "Observation" (not Targeting) with a +20% bid adjustment. This increases your bid for people who already know your brand.',
                  where: 'Google Ads > Tools > Audience Manager > + Custom Audience',
                })
              }

              const priorityOrder = { high: 0, medium: 1, low: 2 }
              const priorityColor = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }
              const priorityIcon = { high: Flame, medium: AlertTriangle, low: Lightbulb }

              return (
                <div className="space-y-6">
                  <SectionTitle title="Google Ads Playbook" subtitle={`${recs.length} actionable steps based on your site data · Open Google Ads and follow each step`} />

                  <a
                    href="https://ads.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={14} />
                    Open Google Ads
                  </a>

                  <div className="space-y-3">
                    {recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map((rec, i) => {
                      const PIcon = priorityIcon[rec.priority]
                      return (
                        <details key={i} className="card group" open={i < 3}>
                          <summary className="flex items-start gap-3 cursor-pointer list-none p-4 hover:bg-[rgba(13,115,119,0.02)] rounded-xl transition-colors">
                            <div className="mt-0.5 shrink-0">
                              <PIcon size={14} className={rec.priority === 'high' ? 'text-rose-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor[rec.priority]}`}>
                                  {rec.priority}
                                </span>
                                <span className="text-xs font-semibold text-[var(--muted-foreground)]">{rec.category}</span>
                              </div>
                              <p className="text-sm font-semibold text-[var(--foreground)] mt-1">{rec.title}</p>
                            </div>
                            <ChevronDown size={14} className="text-[var(--muted-foreground)] mt-1 shrink-0 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="px-4 pb-4 pt-0 ml-7">
                            <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap font-sans leading-relaxed bg-[rgba(13,115,119,0.03)] rounded-lg p-4 mb-3">{rec.instruction}</pre>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                              <ArrowRight size={11} />
                              <span className="font-medium">{rec.where}</span>
                            </div>
                          </div>
                        </details>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

        <div className="text-center py-2">
          <p className="text-xs text-[var(--muted-foreground)] opacity-40">
            Self-hosted analytics · Powered by Vercel Blob
          </p>
        </div>
      </div>
    </div>
  )
}
