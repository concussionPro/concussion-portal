'use client'

/**
 * app/admin/analytics/page.tsx
 *
 * Marketing Brain Dashboard — your command centre for course sales.
 * Tracks channels, funnels, retargeting, IP intent, and session flow.
 *
 * Auth: handled by middleware (admin_session httpOnly cookie).
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
  Bell,
  Trash2,
  Loader2,
  Phone,
  Snowflake,
  Sparkles,
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
  lastSeen: number; pagesVisited: string[]; channel: string; device: string; country?: string
}
interface PreseasonLead {
  ip: string; visits: number; lastSeen: number
  hasRegistered: boolean; hasSubmitted: boolean; channel: string; country?: string
}
interface GeoEntry { country: string; visitors: number }
interface RetargetingData {
  hotLeads: HotLead[]; preseasonLeads: PreseasonLead[]
  geography?: GeoEntry[]
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
type TabType = 'overview' | 'channels' | 'flow' | 'funnel' | 'events' | 'retargeting' | 'insights' | 'pool' | 'preseason' | 'users' | 'report' | 'google-ads' | 'prospects'

interface ProspectSend {
  id: number
  templateSlug: string
  subject: string
  bodyPreview: string
  sentAt: string
  resendEmailId: string | null
  openedCount: number
  clickedCount: number
  repliedAt: string | null
  replyText: string | null
  replySentiment: string | null
}
interface ProspectRow {
  id: number
  slug: string
  shortName: string
  city: string
  state: string
  region: string
  contactFirstName: string
  contactFullName: string
  contactEmail: string
  contactRole: string | null
  contactDiscipline: string
  clinicalCount: number
  totalCount: number
  cohortRecommendation: string
  recoCohortClinicians: number
  recoCohortPerClinician: number
  recoCohortTotal: number
  weightedPipelineValue: number
  travelBand: string
  travelSurcharge: number
  status: string
  totalSends: number
  totalOpens: number
  totalClicks: number
  replies: number
  lastSentAt: string | null
  lastSentTemplate: string | null
  lastSentSubject: string | null
  totalPortalViews: number
  firstPortalViewAt: string | null
  lastPortalViewAt: string | null
  scheduledSendAt: string | null
  nextTemplateSlug: string | null
  priorityWave: string | null
  pitchVariant: string | null
  engagementTier: 'cold' | 'warm' | 'hot' | 'engaged' | 'replied' | 'won'
  callRecommended: boolean
  topSignal?: 'cal_click' | 'return_view' | 'product_click' | 'multi_day_opens' | 'single_view' | 'single_open' | 'none'
  openDays?: number
  viewDays?: number
  calClicks?: number
  productClicks?: number
  otherClicks?: number
  recommendedOffer?: 'hub-pack' | 'on-site-cohort'
  sizeBucket?: string
  dealValue?: number
  sends: ProspectSend[]
}
interface ProspectAggregates {
  byStatus: Record<string, number>
  byRegion: Record<string, number>
  byCohort: Record<string, number>
  byTravelBand: Record<string, number>
  byEngagementTier?: Record<string, number>
  byOffer?: Record<string, number>
  bySizeBucket?: Record<string, number>
  callRecommendedCount?: number
  revenue: { totalRevenuePotential: number; weightedPipeline: number; wins: number; hubPackPipelineValue?: number; onSitePipelineValue?: number }
  funnel: {
    totalSends: number; totalOpens: number; totalClicks: number; totalViews: number; totalReplies: number; wins: number
    sendOpenRate: number; openClickRate: number; sendReplyRate: number; replyToWinRate: number
  }
}
interface ProspectsData {
  count: number
  prospects: ProspectRow[]
  aggregates?: ProspectAggregates
  status?: string
  message?: string
}


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
  const sign = delta >= 0 ? '+' : '-'
  const color = delta >= 0 ? 'text-emerald-600' : 'text-rose-500'
  return { delta: Math.abs(delta), sign, color, isNew: false }
}

const COUNTRY_NAMES: Record<string, string> = {
  AU: 'Australia', US: 'United States', GB: 'United Kingdom', NZ: 'New Zealand',
  CA: 'Canada', IE: 'Ireland', SG: 'Singapore', IN: 'India', ZA: 'South Africa',
  DE: 'Germany', FR: 'France', JP: 'Japan', HK: 'Hong Kong', AE: 'UAE',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  MY: 'Malaysia', PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand',
  KR: 'South Korea', CN: 'China', BR: 'Brazil', MX: 'Mexico', IT: 'Italy',
  ES: 'Spain', PT: 'Portugal', PL: 'Poland', AT: 'Austria', CH: 'Switzerland',
  BE: 'Belgium', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', EG: 'Egypt',
}

function countryLabel(code: string): string {
  if (!code || code === 'Unknown') return 'Unknown'
  // Convert country code to flag emoji
  const flag = code.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
  const name = COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase()
  return `${flag} ${name}`
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
  usersData: Array<{ accessLevel: string; createdAt: string; signupSource?: string | null; isTest?: boolean }>,
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

  // Users (exclude test users from metrics)
  const realUsers = usersData.filter(u => !u.isTest)
  const now = new Date()
  const periodDays = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90
  const periodStart = new Date(now.getTime() - periodDays * 86400000)
  const newSignups = realUsers.filter(u => new Date(u.createdAt) >= periodStart)
  const newToday = realUsers.filter(u => new Date(u.createdAt).toDateString() === now.toDateString()).length
  const freeUsers = realUsers.filter(u => u.accessLevel === 'preview').length
  const paidUsers = realUsers.filter(u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course').length
  const totalUsers = realUsers.length
  if (totalUsers > 0) {
    const userParts = [`${totalUsers} total user${totalUsers !== 1 ? 's' : ''} (${freeUsers} free, ${paidUsers} paid)`]
    if (newSignups.length > 0) userParts.push(`${newSignups.length} new signup${newSignups.length !== 1 ? 's' : ''} ${periodLabel}`)
    if (newToday > 0) userParts.push(`${newToday} today`)
    parts.push(userParts.join(', ') + '.')

    // Signup source breakdown for new signups
    if (newSignups.length > 0) {
      const sourceCounts: Record<string, number> = {}
      for (const u of newSignups) {
        const src = u.signupSource || 'unknown'
        sourceCounts[src] = (sourceCounts[src] || 0) + 1
      }
      const sourceBreakdown = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([src, count]) => `${src}: ${count}`)
        .join(', ')
      parts.push(`Signup sources ${periodLabel}: ${sourceBreakdown}.`)
    }

    if (totalUsers > 5 && paidUsers > 0) {
      const convRate = Math.round((paidUsers / totalUsers) * 100)
      parts.push(`Free-to-paid conversion: ${convRate}%.`)
    }
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

function buildUserInsights(
  users: Array<{ accessLevel: string; createdAt: string; lastLogin: string | null; signupSource?: string | null; isTest?: boolean; completedScatModules?: number }>,
): Insight[] {
  const insights: Insight[] = []
  if (users.length === 0) return insights

  const now = Date.now()
  const DAY = 86400000

  // --- Signup source breakdown ---
  const sourceCounts: Record<string, number> = {}
  for (const u of users) {
    const src = u.signupSource || '(unknown)'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  }
  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  if (sourceEntries.length > 0) {
    const dominant = sourceEntries[0]
    const dominantPct = (dominant[1] / users.length) * 100
    const zeroSources = ['free-course', 'preseason', 'purchase'].filter(
      s => !sourceCounts[s] || sourceCounts[s] === 0
    )
    const breakdown = sourceEntries.map(([s, c]) => `${s}: ${c}`).join(', ')

    if (zeroSources.length > 0) {
      insights.push({
        type: 'warning',
        category: 'users',
        title: `No signups from: ${zeroSources.join(', ')}`,
        detail: `Current breakdown: ${breakdown}. ${zeroSources.length > 1 ? 'Multiple channels' : `The ${zeroSources[0]} channel`} showing zero signups.`,
        metric: `${sourceEntries.length} sources`,
        action: `Investigate why ${zeroSources.join(' and ')} ${zeroSources.length > 1 ? 'are' : 'is'} not converting. Check the signup flow and CTAs for these paths.`,
      })
    } else if (dominantPct > 80) {
      insights.push({
        type: 'opportunity',
        category: 'users',
        title: `${dominant[0]} drives ${dominantPct.toFixed(0)}% of signups`,
        detail: `Signup sources: ${breakdown}. Heavy reliance on a single channel.`,
        metric: `${dominantPct.toFixed(0)}% from ${dominant[0]}`,
        action: 'Diversify acquisition — invest in underperforming signup channels to reduce single-source risk.',
      })
    }
  }

  // --- Free-to-paid conversion rate ---
  // 'engagedFreeUsers' = preview users who actually intended to use the
  // portal: signed up via free-course / scat-export / preseason flows, OR
  // imported from Squarespace AND have at least logged in once. Excludes
  // SCAT-PDF-only downloaders auto-imported as preview accounts. Without
  // this filter, the engagement stats are dominated by 60+ Squarespace
  // ghosts who only wanted the form, not a course.
  const allFreeUsers = users.filter(u => u.accessLevel === 'preview')
  const freeUsers = allFreeUsers.filter(u =>
    u.signupSource !== 'squarespace' || !!u.lastLogin
  )
  const paidUsers = users.filter(u => u.accessLevel === 'online-only' || u.accessLevel === 'full-course')
  if (users.length > 5) {
    const convRate = users.length > 0 ? paidUsers.length / users.length : 0
    if (convRate < 0.05) {
      insights.push({
        type: 'critical',
        category: 'users',
        title: `Free-to-paid conversion at ${(convRate * 100).toFixed(1)}%`,
        detail: `${paidUsers.length} paid out of ${users.length} total users. ${freeUsers.length} free users haven't upgraded.`,
        metric: `${(convRate * 100).toFixed(1)}% conversion`,
        action: 'Review the upgrade path. Add nudges in the free course completion flow. Consider limited-time pricing or email nurture sequences targeting free users.',
      })
    } else if (convRate > 0.15) {
      insights.push({
        type: 'positive',
        category: 'users',
        title: `Strong ${(convRate * 100).toFixed(1)}% free-to-paid conversion`,
        detail: `${paidUsers.length} paid out of ${users.length} total users. Your free-to-paid funnel is working well.`,
        metric: `${(convRate * 100).toFixed(1)}% conversion`,
        action: 'Focus on driving more top-of-funnel signups — the conversion engine is healthy.',
      })
    } else {
      insights.push({
        type: 'opportunity',
        category: 'users',
        title: `${(convRate * 100).toFixed(1)}% free-to-paid conversion`,
        detail: `${paidUsers.length} paid, ${freeUsers.length} free users. Room to improve upsell.`,
        metric: `${(convRate * 100).toFixed(1)}% conversion`,
        action: 'Test stronger upgrade CTAs after SCAT module completion. Highlight paid-only content and CPD hours.',
      })
    }
  }

  // --- User engagement (free users SCAT module completion) ---
  if (freeUsers.length > 3) {
    const zeroModules = freeUsers.filter(u => !u.completedScatModules || u.completedScatModules === 0).length
    const someModules = freeUsers.filter(u => (u.completedScatModules || 0) > 0 && (u.completedScatModules || 0) < 3).length
    const allModules = freeUsers.filter(u => (u.completedScatModules || 0) >= 3).length
    const zeroPct = (zeroModules / freeUsers.length) * 100

    if (zeroPct > 60) {
      const ghostNote = (allFreeUsers.length - freeUsers.length) > 0
        ? ` (${allFreeUsers.length - freeUsers.length} non-consented Squarespace contacts excluded — they only downloaded the SCAT form).`
        : ''
      insights.push({
        type: 'warning',
        category: 'users',
        title: `${zeroPct.toFixed(0)}% of engaged free users completed 0 modules`,
        detail: `Of ${freeUsers.length} engaged free users: ${zeroModules} completed 0, ${someModules} completed some, ${allModules} completed all 3 SCAT modules.${ghostNote}`,
        metric: `${zeroPct.toFixed(0)}% inactive`,
        action: 'Send a reminder email to users who signed up but never started. Add onboarding nudges. Check if the first module is too intimidating.',
      })
    } else if (allModules > 0) {
      insights.push({
        type: 'positive',
        category: 'users',
        title: `${allModules} free user${allModules !== 1 ? 's' : ''} completed all SCAT modules`,
        detail: `Of ${freeUsers.length} free users: ${zeroModules} at 0, ${someModules} in progress, ${allModules} completed all 5. These completers are prime upgrade targets.`,
        metric: `${allModules} completers`,
        action: 'Target users who completed all free modules with a personalised upgrade email highlighting paid content they\'re missing.',
      })
    }
  }

  // --- Recent signups trend (this week vs last week) ---
  // Squarespace imports are bulk one-time data syncs, NOT organic acquisition.
  // Including them inflates the WoW baseline (e.g. 41 squarespace imports on a
  // single day in May made the next "real" week look like a 90% drop). Exclude
  // squarespace-source signups from both windows to compare like-for-like
  // organic acquisition only.
  const isOrganicSignup = (src: string | null | undefined) => src !== 'squarespace'
  const thisWeek = users.filter(u =>
    now - new Date(u.createdAt).getTime() < 7 * DAY && isOrganicSignup(u.signupSource)
  ).length
  const lastWeek = users.filter(u => {
    const age = now - new Date(u.createdAt).getTime()
    return age >= 7 * DAY && age < 14 * DAY && isOrganicSignup(u.signupSource)
  }).length
  // Surface squarespace imports separately so admin can see the bulk-import
  // story without it polluting the WoW signal
  const squarespaceImportsThisFortnight = users.filter(u => {
    const age = now - new Date(u.createdAt).getTime()
    return age < 14 * DAY && u.signupSource === 'squarespace'
  }).length

  if (thisWeek > 0 || lastWeek > 0) {
    if (lastWeek > 0) {
      const growth = ((thisWeek - lastWeek) / lastWeek) * 100
      const importNote = squarespaceImportsThisFortnight > 0
        ? ` (${squarespaceImportsThisFortnight} squarespace bulk-import signup${squarespaceImportsThisFortnight === 1 ? '' : 's'} excluded from this comparison)`
        : ''
      if (growth > 30) {
        insights.push({
          type: 'positive',
          category: 'users',
          title: `Organic signups up ${growth.toFixed(0)}% week-on-week`,
          detail: `${thisWeek} organic signups this week vs ${lastWeek} last week. Growth momentum is building.${importNote}`,
          metric: `+${growth.toFixed(0)}% WoW`,
          action: 'Identify what changed — new ad, blog post, or referral? Double down on what\'s working.',
        })
      } else if (growth < -30 && lastWeek > 2) {
        insights.push({
          type: 'warning',
          category: 'users',
          title: `Organic signups down ${Math.abs(growth).toFixed(0)}% week-on-week`,
          detail: `${thisWeek} organic signups this week vs ${lastWeek} last week. Acquisition is slowing.${importNote}`,
          metric: `${growth.toFixed(0)}% WoW`,
          action: 'Check if ad campaigns are still running. Review traffic sources. Consider a new outreach push or content piece.',
        })
      }
    } else if (thisWeek > 0) {
      insights.push({
        type: 'positive',
        category: 'users',
        title: `${thisWeek} new organic signup${thisWeek !== 1 ? 's' : ''} this week`,
        detail: `${thisWeek} organic signup${thisWeek !== 1 ? 's' : ''} (squarespace bulk imports excluded).`,
        metric: `${thisWeek} new`,
        action: 'Keep momentum going — track which channels drove these signups.',
      })
    }
  }

  // --- Active users (logged in within last 7 days) ---
  if (users.length > 5) {
    const activeUsers = users.filter(u => u.lastLogin && (now - new Date(u.lastLogin).getTime()) < 7 * DAY).length
    const activeRate = activeUsers / users.length

    if (activeRate < 0.2) {
      insights.push({
        type: 'warning',
        category: 'users',
        title: `Only ${(activeRate * 100).toFixed(0)}% of users active in the last 7 days`,
        detail: `${activeUsers} of ${users.length} users logged in this week. Most accounts are dormant.`,
        metric: `${(activeRate * 100).toFixed(0)}% active`,
        action: 'Send re-engagement emails to dormant users. Highlight new content or upcoming CPD deadlines. Consider push notifications.',
      })
    } else if (activeRate > 0.5) {
      insights.push({
        type: 'positive',
        category: 'users',
        title: `${(activeRate * 100).toFixed(0)}% of users active this week`,
        detail: `${activeUsers} of ${users.length} users logged in within the last 7 days. Strong engagement.`,
        metric: `${(activeRate * 100).toFixed(0)}% active`,
        action: 'High engagement — ensure these active users see upgrade CTAs and referral prompts.',
      })
    }
  }

  const priority: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, positive: 3 }
  insights.sort((a, b) => priority[a.type] - priority[b.type])
  return insights
}

const EVENT_LABELS: Record<string, string> = {
  preseason_clinic_register: 'Clinic Registration',
  preseason_baseline_submit: 'Baseline Submission',
  shop_click: 'Shop / Enrol Click',
  enroll_button_click: 'Enrol Button Click',
  checkout_start: 'Checkout Started',
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
  label, value, prev, icon: Icon, format = 'number', loading = false, onClick, invertColor = false,
}: {
  label: string; value: number; prev: number; icon: React.ElementType
  format?: 'number' | 'percent' | 'duration'; loading?: boolean; onClick?: () => void; invertColor?: boolean
}) {
  const { delta, sign, color: rawColor, isNew } = pct(value, prev)
  const color = invertColor ? (rawColor === 'text-emerald-600' ? 'text-rose-500' : rawColor === 'text-rose-500' ? 'text-emerald-600' : rawColor) : rawColor
  const displayVal = format === 'duration' ? fmtDuration(value)
    : format === 'percent' ? fmtPct(value) : fmtNum(value)

  return (
    <div
      className={`card stat-tile group ${onClick ? 'cursor-pointer hover:border-[rgba(13,115,119,0.25)] hover:shadow-md transition-all' : ''}`}
      style={{ '--shimmer-delay': '0s' } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
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

function BreakdownCard({ title, data, icon: Icon }: { title: string; data: Record<string, number>; icon: React.ElementType }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((acc, [, v]) => acc + v, 0)
  if (entries.length === 0) {
    return (
      <div className="card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3"><Icon size={14} className="text-[var(--accent)]" /><span className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">{title}</span></div>
        <p className="text-xs text-[var(--muted-foreground)]">No data.</p>
      </div>
    )
  }
  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3"><Icon size={14} className="text-[var(--accent)]" /><span className="text-xs uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">{title}</span></div>
      <ul className="space-y-2">
        {entries.map(([label, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <li key={label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-[var(--foreground)] font-semibold capitalize">{label}</span>
                <span className="text-[var(--muted-foreground)]">{count} · {pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Inline add-form for the Interest Registrations section. Lets Zac paste a
 * Squarespace form-submission email's contents directly into the analytics
 * page — name, email, city → /api/admin/import-interest → row inserted →
 * onAdded() refreshes the pool data so the new entry appears immediately.
 */
function InterestAddForm({ onAdded }: { onAdded: () => Promise<void> | void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<'melbourne' | 'sydney' | 'byron-bay' | 'adelaide' | 'wa'>('melbourne')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' | 'duplicate'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!name.trim() || name.trim().length < 2) {
      setFeedback({ kind: 'error', message: 'Name must be at least 2 characters.' })
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({ kind: 'error', message: 'Enter a valid email.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/import-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), city }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setFeedback({ kind: 'error', message: data?.error || 'Could not add registration.' })
      } else if (data.duplicate) {
        setFeedback({ kind: 'duplicate', message: data.message || 'Already registered for this city.' })
        setName('')
        setEmail('')
      } else {
        setFeedback({ kind: 'success', message: `Added ${data.email} → ${data.city}` })
        setName('')
        setEmail('')
        await onAdded()
      }
    } catch {
      setFeedback({ kind: 'error', message: 'Network error — try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-[rgba(13,115,119,0.12)] bg-[rgba(255,255,255,0.6)] backdrop-blur-sm p-4 mb-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_160px_auto] gap-2 items-start">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          autoComplete="off"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50"
          aria-label="Name"
        />
        <input
          type="email"
          name="email"
          placeholder="email@clinic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="off"
          inputMode="email"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50"
          aria-label="Email"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value as typeof city)}
          disabled={submitting}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50"
          aria-label="City"
        >
          <option value="melbourne">Melbourne</option>
          <option value="sydney">Sydney</option>
          <option value="byron-bay">Byron Bay</option>
          <option value="adelaide">Adelaide (SA)</option>
          <option value="wa">Perth / WA</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--foreground)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--foreground)]/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {submitting ? 'Adding…' : 'Add'}
        </button>
      </form>
      {feedback && (
        <p
          role="status"
          className={`text-xs mt-2 ${
            feedback.kind === 'success'
              ? 'text-emerald-700'
              : feedback.kind === 'duplicate'
                ? 'text-amber-700'
                : 'text-red-700'
          }`}
        >
          {feedback.message}
        </p>
      )}
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
  const [poolData, setPoolData] = useState<{
    totalCount: number
    cities: Array<{ city: string; label: string; count: number; registrations: Array<{ email: string; name: string; city: string; registeredAt: string; completedAt: string }> }>
    paidThreshold?: Array<{ city: string; label: string; count: number; threshold: number; registrants: Array<{ name: string; email: string; createdAt: string }> }>
    paidTotal?: number
    interest?: Array<{ city: string; label: string; count: number; registrations: Array<{ email: string; name: string; source: string; createdAt: string }> }>
    interestTotal?: number
  } | null>(null)
  const [deletingInterest, setDeletingInterest] = useState<Set<string>>(new Set())

  const handleDeleteInterest = async (email: string, city: string, name: string) => {
    if (!confirm(`Remove ${name || email} (${city}) from unpaid interest? This cannot be undone.`)) return
    const key = `${email}|${city}`
    setDeletingInterest(prev => new Set(prev).add(key))
    try {
      const res = await fetch(
        `/api/admin/workshop-interest-list?email=${encodeURIComponent(email)}&city=${encodeURIComponent(city)}`,
        { method: 'DELETE', cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(`Delete failed: ${data?.error || 'unknown error'}`)
        return
      }
      setPoolData(prev => {
        if (!prev || !prev.interest) return prev
        const nextInterest = prev.interest
          .map(c =>
            c.city !== city
              ? c
              : {
                  ...c,
                  registrations: c.registrations.filter(r => r.email.toLowerCase() !== email.toLowerCase()),
                }
          )
          .map(c => ({ ...c, count: c.registrations.length }))
          .filter(c => c.count > 0)
        return { ...prev, interest: nextInterest, interestTotal: (prev.interestTotal ?? 0) - 1 }
      })
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'network error'}`)
    } finally {
      setDeletingInterest(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Preseason data
  const [preseasonData, setPreseasonData] = useState<{ clinics: Array<{ clinicName: string; contactName: string; email: string; code: string; createdAt: string }>; baselines: Array<{ clinicCode: string; clinicName?: string; athleteName?: string; submittedAt: string; symptomCount?: number; symptomSeverity?: number; cognitiveScore?: number }>; totalClinics: number; totalBaselines: number } | null>(null)

  // Users/emails data
  const [usersData, setUsersData] = useState<Array<{ id: string; email: string; name: string; accessLevel: string; createdAt: string; lastLogin: string | null; signupSource?: string | null; isTest?: boolean; completedModules?: number; completedScatModules?: number; totalCPDPoints?: number; moduleDetails?: Record<number, { completed: boolean; quizScore: number | null }> }>>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersFilter, setUsersFilter] = useState<'all' | 'preview' | 'paid'>('all')

  // B2B prospects data
  const [prospectsData, setProspectsData] = useState<ProspectsData | null>(null)
  const [prospectsError, setProspectsError] = useState<string | null>(null)
  const [prospectsSubTab, setProspectsSubTab] = useState<'overview' | 'schedule' | 'pipeline' | 'breakdowns' | 'queue'>('overview')
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(null)
  const [bootstrapBusy, setBootstrapBusy] = useState(false)
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null)


  const fetchData = useCallback(
    async (type: string, extra: Record<string, string> = {}): Promise<any> => {
      const apiPeriod = period === '24h' ? '1d' : period
      const params = new URLSearchParams({ type, period: apiPeriod, ...extra })
      const res = await fetch(`/api/analytics/data?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      return await res.json()
    },
    [period]
  )

  const loadAll = useCallback(async () => {
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
        const [poolRes, preseasonRes, usersRes, prospectsRes] = await Promise.allSettled([
          fetch('/api/admin/ready-to-train', { cache: 'no-store' }),
          fetch('/api/admin/preseason', { cache: 'no-store' }),
          fetch('/api/admin/emails', { cache: 'no-store' }),
          fetch('/api/admin/prospect-engagement', { cache: 'no-store' }),
        ])

        if (poolRes.status === 'fulfilled' && poolRes.value.ok) {
          const poolJson = await poolRes.value.json()
          if (poolJson.success) setPoolData({
            totalCount: poolJson.readyTotal ?? 0,
            cities: poolJson.readyToUpgrade ?? [],
            paidThreshold: poolJson.paidEnrollments,
            paidTotal: poolJson.paidTotal ?? 0,
            interest: poolJson.interest ?? [],
            interestTotal: poolJson.interestTotal ?? 0,
          })
        }
        if (preseasonRes.status === 'fulfilled' && preseasonRes.value.ok) {
          const preseasonJson = await preseasonRes.value.json()
          if (preseasonJson.success) setPreseasonData(preseasonJson)
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const usersJson = await usersRes.value.json()
          if (usersJson.success) {
            setUsersData(usersJson.emails || [])
            setUsersError(null)
          } else {
            setUsersError(usersJson.error || 'Failed to load users')
          }
        } else {
          const statusCode = usersRes.status === 'fulfilled' ? usersRes.value.status : 'network error'
          setUsersError(`Database connection failed (${statusCode}). Check POSTGRES_URL env var.`)
        }
        if (prospectsRes.status === 'fulfilled' && prospectsRes.value.ok) {
          const prospectsJson = await prospectsRes.value.json()
          if (prospectsJson.ok) {
            setProspectsData(prospectsJson as ProspectsData)
            setProspectsError(null)
          } else {
            setProspectsError(prospectsJson.error || 'Failed to load prospects')
          }
        } else if (prospectsRes.status === 'fulfilled') {
          setProspectsError(`Prospects endpoint failed (${prospectsRes.value.status})`)
        } else {
          setProspectsError('Prospects endpoint network error')
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
  }, [fetchData])

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
    { id: 'prospects', label: 'B2B Prospects', icon: Building2 },
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
            <a
              href="/admin/analytics/heidi"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[rgba(13,115,119,0.2)] text-[var(--accent)] hover:bg-[rgba(13,115,119,0.04)] transition-colors"
              title="Heidi pitch tracking"
            >
              heidi user →
            </a>
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
          <StatCard label="Unique Visitors" value={stats?.uniques.value ?? 0} prev={stats?.uniques.prev ?? 0} icon={Users} loading={loading && !stats} onClick={() => setActiveTab('overview')} />
          <StatCard label="Page Views" value={stats?.pageviews.value ?? 0} prev={stats?.pageviews.prev ?? 0} icon={Eye} loading={loading && !stats} onClick={() => setActiveTab('overview')} />
          <StatCard label="Bounce Rate" value={bounceRate} prev={stats ? stats.bounces.prev / Math.max(stats.uniques.prev, 1) : 0} icon={TrendingUp} format="percent" loading={loading && !stats} onClick={() => setActiveTab('channels')} invertColor />
          <StatCard label="Avg. Session" value={avgDuration} prev={stats ? Math.round(stats.totaltime.prev / Math.max(stats.uniques.prev, 1)) : 0} icon={Clock} format="duration" loading={loading && !stats} onClick={() => setActiveTab('flow')} />
        </div>

        {/* ── Retargeting summary cards ──────────────────────────────────── */}
        {retargetingData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card stat-tile cursor-pointer hover:border-[rgba(13,115,119,0.25)] hover:shadow-md transition-all" style={{ '--shimmer-delay': '0s' } as React.CSSProperties} onClick={() => setActiveTab('retargeting')} role="button" tabIndex={0}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><Target size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtNum(retargetingData.summary.pricingViewers)}</p>
              <p className="stat-label mt-1">Pricing Viewers</p>
            </div>
            <div className="card stat-tile cursor-pointer hover:border-[rgba(13,115,119,0.25)] hover:shadow-md transition-all" style={{ '--shimmer-delay': '0s' } as React.CSSProperties} onClick={() => setActiveTab('funnel')} role="button" tabIndex={0}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><MousePointer size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtPct(retargetingData.summary.pricingToConversion)}</p>
              <p className="stat-label mt-1">Pricing → Convert</p>
            </div>
            <div className="card stat-tile cursor-pointer hover:border-[rgba(13,115,119,0.25)] hover:shadow-md transition-all" style={{ '--shimmer-delay': '0s' } as React.CSSProperties} onClick={() => setActiveTab('retargeting')} role="button" tabIndex={0}>
              <div className="flex items-start justify-between mb-3">
                <div className="icon-container w-9 h-9"><Users size={16} className="text-[var(--accent)]" /></div>
              </div>
              <p className="stat-value">{fmtPct(retargetingData.summary.returningRate)}</p>
              <p className="stat-label mt-1">Return Visitors</p>
            </div>
            <div className="card stat-tile cursor-pointer hover:border-[rgba(13,115,119,0.25)] hover:shadow-md transition-all" style={{ '--shimmer-delay': '0s' } as React.CSSProperties} onClick={() => setActiveTab('users')} role="button" tabIndex={0}>
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
            {activeTab === 'insights' && (() => {
              const userInsights = buildUserInsights(usersData.filter(u => !u.isTest))
              const allInsights = [...insightsData, ...userInsights]
              const priority: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, positive: 3 }
              allInsights.sort((a, b) => priority[a.type] - priority[b.type])

              return (
              <div className="space-y-4">
                <SectionTitle title="Marketing Insights" subtitle="Auto-generated recommendations based on your traffic and user data. Read top to bottom — most urgent first." />
                {allInsights.length === 0 ? (
                  <EmptyState icon={Lightbulb} message="Not enough data yet — insights appear after a few days of traffic" />
                ) : (
                  <div className="space-y-3">
                    {allInsights.map((insight, i) => {
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
              )
            })()}

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

                {/* Geography */}
                {retargetingData?.geography && retargetingData.geography.length > 0 && (
                  <div>
                    <SectionTitle title="Visitors by Country" subtitle="Geographic distribution of unique visitors" />
                    <div className="space-y-1">
                      {retargetingData.geography.map((row) => (
                        <MetricRowBar key={row.country} label={countryLabel(row.country)} value={row.visitors} max={retargetingData.geography![0]?.visitors ?? 1} />
                      ))}
                    </div>
                  </div>
                )}
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
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">Country</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Visits</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pages</th>
                            <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Pricing</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden md:table-cell">Channel</th>
                            <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)] hidden lg:table-cell">Device</th>
                            <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Last Seen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {retargetingData.hotLeads.map((lead) => (
                            <tr key={lead.ip} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--foreground)]">{lead.ip}</td>
                              <td className="py-2.5 px-2 text-xs text-[var(--muted-foreground)] hidden sm:table-cell">{countryLabel(lead.country || '')}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)] font-semibold">{lead.visits}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{lead.pageviews}</td>
                              <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-amber-600">{lead.pricingViews}x</td>
                              <td className="py-2.5 px-2 text-[var(--muted-foreground)] hidden md:table-cell">{lead.channel}</td>
                              <td className="py-2.5 px-2 hidden lg:table-cell">
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
                    {/* Paid Threshold Cards */}
                    {poolData.paidThreshold && poolData.paidThreshold.length > 0 && (
                      <>
                        <SectionTitle title="Workshop Threshold (Paid)" subtitle="Full-course registrants per city — 8 needed to confirm a date" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {poolData.paidThreshold.map((city: { city: string; label: string; count: number; threshold: number }) => {
                            const progress = Math.min((city.count / city.threshold) * 100, 100)
                            const isReady = city.count >= city.threshold
                            return (
                              <div
                                key={city.city}
                                className={`glass rounded-xl p-4 ${isReady ? 'border-2 border-emerald-400' : ''}`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin size={14} className={isReady ? 'text-emerald-600' : 'text-[var(--accent)]'} />
                                  <span className="text-xs font-bold text-[var(--foreground)]">{city.label}</span>
                                  {isReady && <CheckCircle2 size={14} className="text-emerald-600" />}
                                </div>
                                <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                                  {city.count}<span className="text-sm font-normal text-[var(--muted-foreground)]"> / {city.threshold}</span>
                                </p>
                                <div className="mt-2 w-full bg-[rgba(13,115,119,0.08)] rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${isReady ? 'bg-emerald-500' : 'bg-[var(--accent)]'}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                  {isReady ? 'Threshold reached — confirm date!' : `${city.threshold - city.count} more to confirm`}
                                </p>
                              </div>
                            )
                          })}
                          <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Users size={14} className="text-[var(--accent)]" />
                              <span className="text-xs font-bold text-[var(--foreground)]">Total Paid</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{poolData.paidTotal ?? 0}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-3">Full-course across all cities</p>
                          </div>
                        </div>

                        {/* Per-city paid registrant tables */}
                        {poolData.paidThreshold.map((city: { city: string; label: string; count: number; registrants: Array<{ name: string; email: string; createdAt: string }> }) => (
                          city.registrants.length > 0 && (
                            <div key={`paid-${city.city}`}>
                              <SectionTitle title={`${city.label} — Paid Registrants (${city.count})`} subtitle="Full-course purchasers" />
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-[rgba(13,115,119,0.08)]">
                                      <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Name</th>
                                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Email</th>
                                      <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)]">Purchased</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {city.registrants.map((r: { name: string; email: string; createdAt: string }, i: number) => (
                                      <tr key={i} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                                        <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{r.name}</td>
                                        <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{r.email}</td>
                                        <td className="py-2.5 pl-2 text-right text-xs text-[var(--muted-foreground)]">
                                          {new Date(r.createdAt).toLocaleDateString('en-AU')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )
                        ))}
                      </>
                    )}

                    {/* Interest Registrations (workshop_interest table).
                        Auto-filters out anyone who's converted to full-course
                        paid — they appear in "Workshop Threshold (Paid)" above
                        instead. Inline form lets admin add Squarespace email
                        submissions manually without leaving the page. */}
                    <SectionTitle
                      title="Interest Registrations (Unpaid)"
                      subtitle="Pre-purchase signups. Auto-removed when they buy the full course. Add new entries below as Squarespace submissions land in your inbox."
                    />
                    <InterestAddForm
                      onAdded={async () => {
                        // Refresh pool data after adding so the new entry shows
                        try {
                          const res = await fetch('/api/admin/ready-to-train', { cache: 'no-store' })
                          if (res.ok) {
                            const j = await res.json()
                            if (j.success) setPoolData({
                              totalCount: j.readyTotal ?? 0,
                              cities: j.readyToUpgrade ?? [],
                              paidThreshold: j.paidEnrollments,
                              paidTotal: j.paidTotal ?? 0,
                              interest: j.interest ?? [],
                              interestTotal: j.interestTotal ?? 0,
                            })
                          }
                        } catch { /* silent */ }
                      }}
                    />
                    {poolData.interest && poolData.interest.length > 0 ? (
                      <>
                        <p className="text-xs text-[var(--muted-foreground)] mb-4">
                          {poolData.interestTotal ?? 0} unpaid interest registrations across {poolData.interest.length} {poolData.interest.length === 1 ? 'city' : 'cities'}. Bento tiles above show <strong>paid</strong> full-course registrants per city; the lists below show <strong>unpaid</strong> interest. Anyone who buys the full course auto-disappears from the list and is counted in the bento above.
                        </p>

                        {/* Per-city interest tables (no duplicate bento — paid count is already shown above) */}
                        {poolData.interest.map((city) => (
                          <div key={`interest-table-${city.city}`}>
                            <SectionTitle
                              title={`${city.label} — Unpaid Interest (${city.count})`}
                              subtitle="Pre-purchase signups via /pricing form, Squarespace, or admin manual entry."
                            />
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[rgba(13,115,119,0.08)]">
                                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-[var(--muted-foreground)]">Name</th>
                                    <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Email</th>
                                    <th className="text-left py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Source</th>
                                    <th className="text-right py-2.5 px-2 text-xs font-semibold text-[var(--muted-foreground)]">Registered</th>
                                    <th className="text-right py-2.5 pl-2 text-xs font-semibold text-[var(--muted-foreground)] w-12">Remove</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {city.registrations.map((r, i) => {
                                    const delKey = `${r.email}|${city.city}`
                                    const isDeleting = deletingInterest.has(delKey)
                                    return (
                                      <tr key={i} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                                        <td className="py-2.5 pr-4 text-[var(--foreground)] font-medium">{r.name}</td>
                                        <td className="py-2.5 px-2 text-[var(--muted-foreground)]">{r.email}</td>
                                        <td className="py-2.5 px-2 text-xs text-[var(--muted-foreground)]">{r.source}</td>
                                        <td className="py-2.5 px-2 text-right text-xs text-[var(--muted-foreground)]">
                                          {new Date(r.createdAt).toLocaleDateString('en-AU')}
                                        </td>
                                        <td className="py-2.5 pl-2 text-right">
                                          <button
                                            onClick={() => handleDeleteInterest(r.email, city.city, r.name)}
                                            disabled={isDeleting}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            aria-label={`Remove ${r.email} from unpaid interest`}
                                            title="Remove from unpaid interest"
                                          >
                                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)] mb-4">
                        No unpaid interest registrations yet. Bento tiles above show <strong>paid</strong> full-course registrants per city; once you add unpaid interest entries (via the form above, or as they sync from Squarespace), they&apos;ll appear here as per-city lists.
                      </p>
                    )}

                    {/* Online completers — Ready to Upgrade (workshop_ready_to_train table) */}
                    <SectionTitle title="Online Completers — Ready to Upgrade" subtitle="Online-only buyers who finished all modules and selected a workshop city" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {poolData.cities.map((city: { city: string; label: string; count: number }) => {
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

                    {/* Per-city interest tables */}
                    {poolData.cities.map((city: { city: string; label: string; count: number; registrations: Array<{ name: string; email: string; registeredAt: string }> }) => (
                      <div key={city.city}>
                        <SectionTitle title={`${city.label} — Interest (${city.count})`} subtitle={city.count >= 8 ? 'Threshold reached' : `${8 - city.count} more clinicians needed`} />
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
                                {city.registrations.map((r: { name: string; email: string; registeredAt: string }, i: number) => (
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
                              <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[var(--foreground)]">{b.cognitiveScore != null ? `${b.cognitiveScore}/${b.cognitiveScore > 30 ? 50 : 30}` : '—'}</td>
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
                {usersError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Users data unavailable</p>
                      <p className="text-xs text-red-600 mt-1">{usersError}</p>
                    </div>
                  </div>
                )}
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
                      const csv = ['Email,Name,Access Level,Modules Completed,SCAT Modules,CPD Hours,Created,Last Login', ...filtered.map(u =>
                        `${u.email},${u.name},${u.accessLevel},${u.completedModules || 0}/8,${u.completedScatModules || 0}/3,${u.totalCPDPoints || 0},${new Date(u.createdAt).toLocaleDateString()},${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}`
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
                        const scatCompleted = u.completedScatModules || 0
                        const isFree = u.accessLevel === 'preview'
                        const progressCount = isFree ? scatCompleted : completed
                        const progressTotal = isFree ? 3 : 8
                        const pctDone = Math.round((progressCount / progressTotal) * 100)
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
                            {u.isTest && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">TEST</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progressCount === progressTotal ? 'bg-emerald-500' : progressCount > 0 ? 'bg-[var(--accent)]' : 'bg-gray-200'
                                  }`}
                                  style={{ width: `${pctDone}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold tabular-nums ${
                                progressCount === progressTotal ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'
                              }`}>
                                {progressCount}/{progressTotal}
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

                {/* Test Emails */}
                <div className="rounded-xl border border-[rgba(13,115,119,0.08)] bg-white p-5">
                  <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Email Templates</p>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">Send all 18 nurture and admin emails to inspect styling.</p>
                  <div className="flex items-center gap-2">
                    <input
                      id="test-email-to"
                      type="email"
                      defaultValue="z.lew87@gmail.com"
                      placeholder="recipient@example.com"
                      className="flex-1 px-3 py-2 rounded-lg border border-[rgba(13,115,119,0.15)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <button
                      onClick={async () => {
                        const input = document.getElementById('test-email-to') as HTMLInputElement
                        const to = input?.value
                        if (!to) return
                        const btn = document.getElementById('test-email-btn') as HTMLButtonElement
                        btn.disabled = true
                        btn.textContent = 'Sending...'
                        try {
                          const res = await fetch('/api/admin/test-emails', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to }),
                          })
                          const data = await res.json()
                          btn.textContent = data.success ? `Sent ${data.message?.match(/\d+\/\d+/)?.[0] || 'all'}` : 'Failed'
                        } catch {
                          btn.textContent = 'Error'
                        }
                        setTimeout(() => { btn.disabled = false; btn.textContent = 'Send All Emails' }, 4000)
                      }}
                      id="test-email-btn"
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      Send All Emails
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Google Ads ───────────────────────────────────────────── */}
            {activeTab === 'google-ads' && (() => {
              // Live Paid Search data from channelsData
              const paidSearch = channelsData?.channels?.find(c => c.channel === 'Paid Search')
              const paidSessions = paidSearch?.sessions ?? 0
              const paidPageviews = paidSearch?.pageviews ?? 0
              const paidBounce = paidSearch?.bounceRate ?? 0
              const paidAvgDuration = paidSearch?.avgDuration ?? 0
              const paidConversions = paidSearch?.conversions ?? 0
              const paidIntentRate = paidSearch?.intentRate ?? 0
              const paidPricingViews = paidSearch?.pricingViews ?? 0

              // Filter UTM data for google/cpc sources
              const googleCampaigns = channelsData?.utmCampaigns ?? []
              const googleSources = (channelsData?.utmSources ?? []).filter(
                s => s.name.toLowerCase().includes('google') || s.name.toLowerCase().includes('cpc')
              )

              // Configurable active campaigns
              const ACTIVE_CAMPAIGNS = [
                {
                  name: 'C1 - Preseason Sports Clinic',
                  adGroups: ['1A - Preseason Baseline Testing', '1B - Sports Clinic Owner Intent'],
                  goal: 'Lead gen (free baseline tool)',
                  landingPage: '/preseason',
                },
                {
                  name: 'C2 - Course Purchase Intent',
                  adGroups: ['2A - Concussion Course Direct', '2B - SCAT6 Purchase Intent', '2C - CPD Deadline Intent'],
                  goal: 'Course sales ($497)',
                  landingPage: '/pricing',
                },
                {
                  name: 'C3 - SCAT6 Free Lead Capture',
                  adGroups: ['3 - SCAT6 Free Lead Capture'],
                  goal: 'Free course signup → nurture → upsell',
                  landingPage: '/scat-mastery',
                },
              ]

              // Dynamic recommendations based on actual data
              const recs: Array<{ priority: 'high' | 'medium' | 'low'; title: string; detail: string; action: string }> = []

              if (paidSessions === 0) {
                recs.push({
                  priority: 'high',
                  title: 'No Google Ads traffic detected',
                  detail: 'Zero paid search sessions this period. Campaigns may be paused, budgets exhausted, or tracking broken.',
                  action: 'Check campaign status in Google Ads. Verify UTM parameters are set on all ad URLs. Ensure budget is allocated.',
                })
              }

              if (paidSessions > 0 && paidBounce > 0.5) {
                recs.push({
                  priority: 'high',
                  title: `Ad traffic bouncing at ${fmtPct(paidBounce)}`,
                  detail: `${fmtPct(paidBounce)} of paid visitors leave after one page. Ad copy may not match landing page content.`,
                  action: 'Review landing page alignment. Ensure ad keywords match page content. Check mobile page speed. Consider negative keywords for irrelevant queries.',
                })
              }

              if (paidSessions > 0 && paidIntentRate > 0.15) {
                recs.push({
                  priority: 'low',
                  title: `Ads driving quality traffic — ${fmtPct(paidIntentRate)} intent rate`,
                  detail: `${fmtPct(paidIntentRate)} of paid visitors view pricing. Your ads are attracting qualified buyers.`,
                  action: 'Consider increasing ad budget on high-performing campaigns. This intent rate justifies higher bids.',
                })
              }

              if (paidConversions > 0) {
                recs.push({
                  priority: 'low',
                  title: `${paidConversions} conversion${paidConversions !== 1 ? 's' : ''} from paid search`,
                  detail: `Paid search generated ${paidConversions} conversion${paidConversions !== 1 ? 's' : ''} this period. Tracking is working.`,
                  action: 'Optimise for ROAS — increase bids on converting keywords, pause high-spend zero-conversion keywords.',
                })
              }

              if (paidPricingViews > 0 && paidConversions === 0) {
                recs.push({
                  priority: 'medium',
                  title: `${paidPricingViews} pricing viewer${paidPricingViews !== 1 ? 's' : ''} from ads but 0 conversions`,
                  detail: 'Paid traffic is reaching the pricing page but not converting. The offer or pricing may need adjustment.',
                  action: 'Review pricing page for objections. Add testimonials, money-back guarantee, or payment plans. Check checkout flow on mobile.',
                })
              }

              if (paidSessions > 0 && paidIntentRate < 0.05) {
                recs.push({
                  priority: 'medium',
                  title: `Low intent from ads — only ${fmtPct(paidIntentRate)} view pricing`,
                  detail: `Most paid visitors never reach the pricing page. Landing pages may not be driving purchase intent.`,
                  action: 'Add clear CTAs to pricing on landing pages. Ensure ad keywords target purchase-intent queries rather than informational ones.',
                })
              }

              // Weekly checklist
              const weeklyChecklist = [
                'Review Search Terms report — add irrelevant terms as negatives',
                'Pause ads with CTR < 2% after 200+ impressions',
                'Increase bids on converting keywords, decrease on high-spend/no-conversion',
                'Check budget pacing — under-spending may mean bids are too low',
                'Aim for Quality Score 6+ on all keywords',
              ]

              const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
              const priorityColor: Record<string, string> = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }

              return (
                <div className="space-y-6">
                  <SectionTitle title="Google Ads — Paid Search Performance" subtitle="Live metrics from your paid search traffic this period" />

                  <a
                    href="https://ads.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={14} />
                    Open Google Ads
                  </a>

                  {/* Section A: Paid Search Performance Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><Search size={16} className="text-[var(--accent)]" /></div>
                      </div>
                      <p className="stat-value">{fmtNum(paidSessions)}</p>
                      <p className="stat-label mt-1">Paid Sessions</p>
                    </div>
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><Eye size={16} className="text-[var(--accent)]" /></div>
                      </div>
                      <p className="stat-value">{fmtNum(paidPageviews)}</p>
                      <p className="stat-label mt-1">Pageviews</p>
                    </div>
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><TrendingDown size={16} className={paidBounce > 0.5 ? 'text-rose-500' : 'text-[var(--accent)]'} /></div>
                      </div>
                      <p className="stat-value">{fmtPct(paidBounce)}</p>
                      <p className="stat-label mt-1">Bounce Rate</p>
                    </div>
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><Clock size={16} className="text-[var(--accent)]" /></div>
                      </div>
                      <p className="stat-value">{fmtDuration(paidAvgDuration)}</p>
                      <p className="stat-label mt-1">Avg Duration</p>
                    </div>
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><Target size={16} className={paidIntentRate > 0.1 ? 'text-emerald-600' : 'text-[var(--accent)]'} /></div>
                      </div>
                      <p className="stat-value">{fmtPct(paidIntentRate)}</p>
                      <p className="stat-label mt-1">Intent Rate</p>
                    </div>
                    <div className="card stat-tile" style={{ '--shimmer-delay': '0s' } as React.CSSProperties}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="icon-container w-9 h-9"><CheckCircle2 size={16} className={paidConversions > 0 ? 'text-emerald-600' : 'text-[var(--accent)]'} /></div>
                      </div>
                      <p className="stat-value">{paidConversions}</p>
                      <p className="stat-label mt-1">Conversions</p>
                    </div>
                  </div>

                  {/* Section B: Campaign & Source Breakdown */}
                  {googleCampaigns.length > 0 && (
                    <div>
                      <SectionTitle title="Campaign Performance" subtitle="UTM campaigns with sessions, conversions, and pricing views" />
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
                            {googleCampaigns.map((c) => (
                              <tr key={c.name} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                                <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)] truncate max-w-[200px]" title={c.name}>{c.name}</td>
                                <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)] font-semibold">{fmtNum(c.sessions)}</td>
                                <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{fmtPct(c.bounceRate)}</td>
                                <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{c.pricingViews}</td>
                                <td className="py-2.5 pl-2 text-right tabular-nums font-semibold text-emerald-600">{c.conversions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {googleSources.length > 0 && (
                    <div>
                      <SectionTitle title="Google / CPC Sources" subtitle="Traffic from Google Ads UTM sources" />
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
                            {googleSources.map((s) => (
                              <tr key={s.name} className="border-b border-[rgba(13,115,119,0.04)] hover:bg-[rgba(13,115,119,0.02)]">
                                <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)]">{s.name}</td>
                                <td className="py-2.5 px-2 text-right tabular-nums text-[var(--accent)]">{fmtNum(s.sessions)}</td>
                                <td className="py-2.5 px-2 text-right tabular-nums text-[var(--muted-foreground)]">{s.pricingViews}</td>
                                <td className="py-2.5 pl-2 text-right tabular-nums font-semibold text-emerald-600">{s.conversions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {paidSessions === 0 && googleCampaigns.length === 0 && (
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-800">No paid search data this period</p>
                          <p className="text-sm text-amber-700 mt-1">Either campaigns are paused, UTM tracking is missing, or no ads have served. Check Google Ads account status and ensure all ad URLs include UTM parameters.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Campaigns Overview */}
                  <div className="card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Active Campaigns</h3>
                    <div className="space-y-3">
                      {ACTIVE_CAMPAIGNS.map((c) => (
                        <div key={c.name} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[var(--foreground)]">{c.name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {c.goal} · Landing: <code className="bg-[rgba(13,115,119,0.06)] px-1 rounded">{c.landingPage}</code>
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                              Ad groups: {c.adGroups.join(', ')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Dynamic Recommendations */}
                  {recs.length > 0 && (
                    <div>
                      <SectionTitle title="Recommendations" subtitle="Data-driven suggestions based on your paid search performance" />
                      <div className="space-y-3">
                        {recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map((rec, i) => (
                          <div key={i} className={`rounded-xl border-2 p-5 ${
                            rec.priority === 'high' ? 'border-rose-300 bg-rose-50/50'
                              : rec.priority === 'medium' ? 'border-amber-300 bg-amber-50/50'
                              : 'border-emerald-300 bg-emerald-50/50'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-0.5">
                                {rec.priority === 'high' ? <Flame size={18} className="text-rose-600" /> : rec.priority === 'medium' ? <AlertTriangle size={18} className="text-amber-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityColor[rec.priority]}`}>{rec.priority.toUpperCase()}</span>
                                </div>
                                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">{rec.title}</h3>
                                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">{rec.detail}</p>
                                <div className="rounded-lg bg-white/80 border border-[rgba(13,115,119,0.1)] p-3">
                                  <p className="text-xs font-semibold text-[var(--accent)] mb-1">What to do:</p>
                                  <p className="text-sm text-[var(--foreground)] leading-relaxed">{rec.action}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section D: Weekly Optimization Checklist */}
                  <div className="card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Weekly Optimization Checklist</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">Run through every Monday — don't optimise daily, Google needs 3-7 days per change.</p>
                    <div className="space-y-2">
                      {weeklyChecklist.map((item, i) => (
                        <label key={i} className="flex items-start gap-2.5 text-sm cursor-pointer group">
                          <input type="checkbox" className="mt-0.5 accent-[var(--accent)]" />
                          <span className="text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── B2B Prospects ────────────────────────────────────────── */}
            {activeTab === 'prospects' && (() => {
              const runBootstrap = async (url: string, label: string, payload?: object) => {
                setBootstrapBusy(true)
                setBootstrapMessage(`${label} running…`)
                try {
                  const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload ?? {}),
                    cache: 'no-store',
                  })
                  const json = await res.json()
                  if (!res.ok) {
                    setBootstrapMessage(`${label} failed: ${json.error ?? res.status}`)
                  } else {
                    setBootstrapMessage(`${label} done. Reload to see data.`)
                    loadAll()
                  }
                } catch (err) {
                  setBootstrapMessage(`${label} network error: ${err instanceof Error ? err.message : String(err)}`)
                } finally {
                  setBootstrapBusy(false)
                }
              }

              if (prospectsError) {
                return (
                  <div className="card rounded-2xl p-6 border-rose-200 bg-rose-50/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Could not load prospect engagement data</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">{prospectsError}</p>
                      </div>
                    </div>
                  </div>
                )
              }
              if (!prospectsData) {
                return (
                  <div className="card rounded-2xl p-6">
                    <p className="text-sm text-[var(--muted-foreground)]">Loading prospect data…</p>
                  </div>
                )
              }
              if (prospectsData.status === 'schema-not-applied') {
                return (
                  <div className="space-y-4">
                    <div className="card rounded-2xl p-6 border-amber-200 bg-amber-50/50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Schema not applied</h3>
                          <p className="text-sm text-[var(--muted-foreground)] mb-3">{prospectsData.message ?? 'Run lib/prospect/schema.sql against production Postgres.'}</p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => runBootstrap('/api/admin/prospect-schema-bootstrap', 'Apply schema')}
                              disabled={bootstrapBusy}
                              className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                              {bootstrapBusy ? 'Working…' : '1. Apply schema now'}
                            </button>
                            <button
                              onClick={() => runBootstrap('/api/admin/prospect-bootstrap-targets', 'Seed targets')}
                              disabled={bootstrapBusy}
                              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
                            >
                              2. Seed P1-P5 target list + schedule
                            </button>
                          </div>
                          {bootstrapMessage && (
                            <p className="text-xs text-[var(--foreground)] mt-3 font-mono">{bootstrapMessage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              const { prospects, aggregates } = prospectsData
              const agg = aggregates ?? {
                byStatus: {}, byRegion: {}, byCohort: {}, byTravelBand: {},
                byEngagementTier: {}, byOffer: {}, bySizeBucket: {}, callRecommendedCount: 0,
                revenue: { totalRevenuePotential: 0, weightedPipeline: 0, wins: 0, hubPackPipelineValue: 0, onSitePipelineValue: 0 },
                funnel: { totalSends: 0, totalOpens: 0, totalClicks: 0, totalViews: 0, totalReplies: 0, wins: 0, sendOpenRate: 0, openClickRate: 0, sendReplyRate: 0, replyToWinRate: 0 },
              }

              // Engagement tier definitions — calibrated against B2B + healthcare-CPD
              // benchmarks. Each tier has: count, label, recommended next action,
              // colour. Single opens / single same-day views are NOT auto-promoted
              // to warm anymore — Apple Mail Privacy Protection prefetches single
              // opens so they're effectively noise. Real signals: cal-click,
              // return-day view, product click, multi-day opens.
              const TIER_META: Array<{
                key: 'cold' | 'warm' | 'hot' | 'engaged' | 'replied' | 'won'
                label: string
                action: string
                threshold: string
                colour: string
                badgeBg: string
                badgeText: string
                icon: React.ElementType
              }> = [
                { key: 'cold',     label: 'Cold',     action: 'Wait for T1/T2 to land · no manual action',                                threshold: 'No signal · or only single open (Apple MPP noise)',   colour: 'bg-slate-400',   badgeBg: 'bg-slate-100',   badgeText: 'text-slate-700',   icon: Snowflake },
                { key: 'warm',     label: 'Warm',     action: 'Real attention but not strong · let T2 ride · price-reveal unlocks',      threshold: 'Opens on 2+ days OR 1 portal view',                  colour: 'bg-amber-300',   badgeBg: 'bg-amber-50',    badgeText: 'text-amber-700',   icon: Flame },
                { key: 'hot',      label: 'Hot',      action: 'Product click OR return visit — personal LinkedIn DM in 24h',              threshold: 'Product click OR 2+ view days OR 3+ opens spanning 2+ days', colour: 'bg-orange-500',  badgeBg: 'bg-orange-50',   badgeText: 'text-orange-700',  icon: Flame },
                { key: 'engaged',  label: 'Engaged',  action: 'CALL THIS WEEK · highest-intent signal · book a slot · follow up by EOW',  threshold: 'Cal click · OR return visit + click · OR product click + multi-day opens', colour: 'bg-rose-500',    badgeBg: 'bg-rose-50',     badgeText: 'text-rose-700',    icon: Phone },
                { key: 'replied',  label: 'Replied',  action: 'Reply received — respond inside 2 business hours',                          threshold: 'Direct reply to outreach',                            colour: 'bg-emerald-500', badgeBg: 'bg-emerald-50',  badgeText: 'text-emerald-700', icon: Sparkles },
                { key: 'won',      label: 'Won',      action: 'Closed — onboarding email sent · log in CRM',                                threshold: 'Deal closed',                                         colour: 'bg-emerald-700', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', icon: CheckCircle2 },
              ]
              const tierCounts: Record<string, number> = agg.byEngagementTier ?? {}
              // Total restricted to non-dead — matches API logic
              const tierTotalForPct = TIER_META.reduce((acc, t) => acc + (tierCounts[t.key] ?? 0), 0)

              // Signal-strength score reflects the calibrated hierarchy:
              //   cal-click (literal booking intent)            = 1000
              //   return-day view (genuine research follow-up)  = 500
              //   product click (clicked the dashboard preview) = 200
              //   multi-day opens                                = 50
              //   single-day events                              = 10
              const signalScore = (p: ProspectRow): number =>
                (p.calClicks ?? 0) * 1000
                + (Math.max(0, (p.viewDays ?? 0) - 1)) * 500
                + (p.productClicks ?? 0) * 200
                + (Math.max(0, (p.openDays ?? 0) - 1)) * 50
                + p.totalPortalViews * 10
                + p.totalOpens

              const callRecommendedList = prospects
                .filter(p => p.callRecommended)
                .sort((a, b) => signalScore(b) - signalScore(a))

              // "Why call" copy — derived from topSignal so the dashboard
              // explains the actual reason in human language, not a number.
              const whyCallCopy = (p: ProspectRow): string => {
                switch (p.topSignal) {
                  case 'cal_click':       return `${p.contactFirstName} clicked the cal.com link — they want to book. Call today before momentum fades.`
                  case 'return_view':     return `${p.contactFirstName} returned to the dashboard on a separate day (${p.viewDays}× view-days) — research mode. Personal note within 48h.`
                  case 'product_click':   return `${p.contactFirstName} clicked through to the preview${p.productClicks && p.productClicks > 1 ? ` (×${p.productClicks})` : ''} — strongest non-reply intent. LinkedIn DM in 24h.`
                  case 'multi_day_opens': return `Opens on ${p.openDays} separate days — genuine sustained interest, no Apple-MPP noise. Soft nudge ahead of next auto-send.`
                  case 'single_view':     return `Single portal view — let auto T2 deliver, gates the price reveal.`
                  case 'single_open':     return `Single open only — likely Apple Mail Privacy prefetch. Auto-sequence handles it.`
                  default:                return `No verified human signal yet — auto-sequence will deliver T2/T3.`
                }
              }

              const fmt$ = (n: number) => `A$${n.toLocaleString('en-AU')}`

              if (prospects.length === 0) {
                return (
                  <div className="space-y-4">
                    <div className="card rounded-2xl p-8 text-center">
                      <Building2 size={32} className="mx-auto text-[var(--muted-foreground)] opacity-50 mb-3" />
                      <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">No prospects yet</h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-4">Schema is applied but no prospects loaded. Seed the P1-P5 target list to start tracking.</p>
                      <button
                        onClick={() => runBootstrap('/api/admin/prospect-bootstrap-targets', 'Seed targets')}
                        disabled={bootstrapBusy}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {bootstrapBusy ? 'Seeding…' : 'Seed P1-P5 target list + schedule'}
                      </button>
                      {bootstrapMessage && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-3 font-mono">{bootstrapMessage}</p>
                      )}
                    </div>
                  </div>
                )
              }

              // Derived data sets for sub-tabs
              const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
              const reEngageQueue = prospects
                .filter(p => p.replies === 0 && (p.totalOpens > 0 || p.totalClicks > 0 || p.totalPortalViews > 0))
                .filter(p => !p.lastSentAt || new Date(p.lastSentAt).getTime() < fourteenDaysAgo)
                .map(p => ({ ...p, engagementScore: p.totalPortalViews * 3 + p.totalClicks * 2 + p.totalOpens }))
                .sort((a, b) => b.engagementScore - a.engagementScore)

              const sentTable = prospects
                .filter(p => p.totalSends > 0)
                .sort((a, b) => (b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0) - (a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0))

              // Schedule view — group prospects by scheduled_send_at day
              const scheduleByDay = new Map<string, ProspectRow[]>()
              for (const p of prospects) {
                if (!p.scheduledSendAt) continue
                if (p.totalSends > 0) continue // already sent
                const dayKey = new Date(p.scheduledSendAt).toISOString().slice(0, 10)
                if (!scheduleByDay.has(dayKey)) scheduleByDay.set(dayKey, [])
                scheduleByDay.get(dayKey)!.push(p)
              }
              const scheduleDays = [...scheduleByDay.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(0, 30) // next 30 days

              const FUNNEL_STAGES = [
                { key: 'researching', label: 'Researching', colour: 'bg-slate-400' },
                { key: 'approved', label: 'Approved', colour: 'bg-blue-500' },
                { key: 'sent', label: 'Sent', colour: 'bg-indigo-500' },
                { key: 'opened', label: 'Opened', colour: 'bg-violet-500' },
                { key: 'engaged', label: 'Engaged', colour: 'bg-purple-500' },
                { key: 'replied', label: 'Replied', colour: 'bg-amber-500' },
                { key: 'won', label: 'Won', colour: 'bg-emerald-500' },
              ]
              const funnelMax = Math.max(...FUNNEL_STAGES.map(s => agg.byStatus[s.key] ?? 0), 1)

              // Drill-down selected prospect
              const selectedProspect = prospects.find(p => p.id === selectedProspectId) ?? null

              const subTabs: Array<{ id: typeof prospectsSubTab; label: string; icon: React.ElementType }> = [
                { id: 'overview', label: 'Overview', icon: BarChart2 },
                { id: 'schedule', label: 'Schedule', icon: Clock },
                { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
                { id: 'breakdowns', label: 'Breakdowns', icon: MapPin },
                { id: 'queue', label: 'Queue & Activity', icon: Activity },
              ]

              return (
                <div className="space-y-6">
                  {/* Header strip — pipeline summary always visible */}
                  {(() => {
                    const activeStatuses = ['approved', 'sent', 'opened', 'engaged', 'replied', 'won']
                    const activePipeline = prospects
                      .filter(p => activeStatuses.includes(p.status))
                      .reduce((acc, p) => acc + p.recoCohortTotal, 0)
                    const activeCount = prospects.filter(p => activeStatuses.includes(p.status)).length
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Prospects</div>
                          <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{prospects.length}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{agg.byStatus.researching ?? 0} researching · {agg.byStatus.approved ?? 0} approved</div>
                        </div>
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Active pipeline</div>
                          <div className="text-2xl font-bold text-[var(--accent)] mt-1">{fmt$(activePipeline)}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{activeCount} approved+sent · {fmt$(agg.revenue.totalRevenuePotential)} total potential</div>
                        </div>
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Engagement</div>
                          <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{agg.funnel.totalOpens} opens</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{agg.funnel.totalClicks} clicks · {agg.funnel.totalViews} portal views</div>
                        </div>
                        <div className="card rounded-xl p-4" title={`Weighted ${fmt$(agg.revenue.weightedPipeline)} = stage probability × cohort value`}>
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Replies / Wins</div>
                          <div className="text-2xl font-bold text-emerald-600 mt-1">{agg.funnel.totalReplies} / {agg.revenue.wins}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{(agg.funnel.sendOpenRate * 100).toFixed(0)}% open · {(agg.funnel.sendReplyRate * 100).toFixed(1)}% reply · weighted {fmt$(agg.revenue.weightedPipeline)}</div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Sub-tab nav */}
                  <div className="flex gap-1 border-b border-[rgba(13,115,119,0.1)] overflow-x-auto">
                    {subTabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setProspectsSubTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                          prospectsSubTab === id
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Overview ── */}
                  {prospectsSubTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Engagement tier strip — calibrated against B2B + healthcare-CPD
                          benchmarks (Apollo 2024, Salesloft 2023, healthcare CPD trends).
                          Each tile shows threshold + recommended action. */}
                      <div>
                        <SectionTitle
                          title="Engagement tiers"
                          subtitle="Calibrated against B2B + healthcare-CPD benchmarks · Apple-MPP-resistant · click destinations classified (cal · product · other)"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {TIER_META.map(t => {
                            const count = tierCounts[t.key] ?? 0
                            const pct = tierTotalForPct > 0 ? (count / tierTotalForPct) * 100 : 0
                            const Icon = t.icon
                            return (
                              <button
                                key={t.key}
                                onClick={() => setProspectsSubTab('queue')}
                                className="card rounded-xl p-4 text-left hover:border-[var(--accent)] transition-colors cursor-pointer group"
                                title={`${count} ${t.label.toLowerCase()} prospects · threshold: ${t.threshold}`}
                              >
                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeText} text-[10px] font-bold uppercase tracking-wider mb-2`}>
                                  <Icon size={11} />{t.label}
                                </div>
                                <div className="text-2xl font-bold text-[var(--foreground)]">{count}</div>
                                <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{pct.toFixed(0)}% of pipeline</div>
                                <div className={`mt-2 h-1 rounded-full bg-slate-100 overflow-hidden`}>
                                  <div className={`h-full ${t.colour}`} style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10.5px] text-[var(--muted-foreground)]/80 mt-2.5 leading-snug italic">{t.threshold}</p>
                                <p className="text-[11px] text-[var(--foreground)] mt-1.5 leading-snug font-semibold">{t.action}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Call-now list — clinics with strong signals + no reply yet.
                          This is the actionable surface: Zac's time goes here. */}
                      {callRecommendedList.length > 0 && (
                        <div>
                          <SectionTitle
                            title={`Call now (${callRecommendedList.length})`}
                            subtitle="Clinics with click/view signal but no reply yet — manual outreach likely to close · sorted by signal strength"
                          />
                          <div className="card rounded-2xl overflow-hidden border-orange-200">
                            <table className="w-full text-sm">
                              <thead className="bg-orange-50 text-xs uppercase tracking-wider text-orange-700">
                                <tr>
                                  <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                                  <th className="text-left px-4 py-3 font-semibold">Tier</th>
                                  <th className="text-left px-4 py-3 font-semibold">Top signal</th>
                                  <th className="text-center px-3 py-3 font-semibold" title="Distinct calendar days with opens">Open days</th>
                                  <th className="text-center px-3 py-3 font-semibold" title="Distinct calendar days with portal views">View days</th>
                                  <th className="text-center px-3 py-3 font-semibold" title="Cal.com / product / other">Click type</th>
                                  <th className="text-right px-4 py-3 font-semibold">Offer</th>
                                  <th className="text-left px-4 py-3 font-semibold">Why call</th>
                                </tr>
                              </thead>
                              <tbody>
                                {callRecommendedList.slice(0, 20).map(p => {
                                  const tier = TIER_META.find(t => t.key === p.engagementTier)!
                                  const TierIcon = tier.icon
                                  const isOnSite = p.recommendedOffer === 'on-site-cohort'
                                  const offerLabel = isOnSite
                                    ? `On-site · ${fmt$(p.dealValue ?? p.recoCohortTotal)}`
                                    : `Hub Pack · ${fmt$(p.dealValue ?? 1497)}`
                                  // Click-type breakdown — surfaces which kind of click happened
                                  const cal = p.calClicks ?? 0
                                  const prod = p.productClicks ?? 0
                                  const oth = p.otherClicks ?? 0
                                  const clickBreakdown = cal + prod + oth === 0
                                    ? '—'
                                    : [cal > 0 ? `${cal}× cal` : '', prod > 0 ? `${prod}× product` : '', oth > 0 ? `${oth}× other` : ''].filter(Boolean).join(' · ')
                                  // Top-signal label — what's the strongest signal
                                  const SIGNAL_LABELS: Record<NonNullable<ProspectRow['topSignal']>, string> = {
                                    cal_click: '🎯 Cal click',
                                    return_view: '↻ Return visit',
                                    product_click: '→ Product click',
                                    multi_day_opens: '📅 Multi-day opens',
                                    single_view: '👁 Single view',
                                    single_open: '✉️ Single open',
                                    none: '—',
                                  }
                                  return (
                                    <tr key={p.id} onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }} className="border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer">
                                      <td className="px-4 py-3">
                                        <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{p.city || 'Unknown'}, {p.state} · {p.clinicalCount} clinical</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName}</div>
                                        <div className="text-[var(--muted-foreground)]">{p.contactDiscipline}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText} text-[10px] font-bold uppercase tracking-wider`}>
                                          <TierIcon size={10} />{tier.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-[11px] font-semibold text-[var(--foreground)]">{SIGNAL_LABELS[p.topSignal ?? 'none']}</td>
                                      <td className="px-3 py-3 text-center text-sm font-semibold">{p.openDays ?? '—'}</td>
                                      <td className="px-3 py-3 text-center text-sm font-bold text-[var(--accent)]">{p.viewDays ?? '—'}</td>
                                      <td className="px-3 py-3 text-center text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">{clickBreakdown}</td>
                                      <td className="px-4 py-3 text-right text-xs">
                                        <div className={`font-semibold ${isOnSite ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{offerLabel}</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] leading-snug max-w-xs">{whyCallCopy(p)}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          {callRecommendedList.length > 20 && (
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">Showing top 20 by signal strength. {callRecommendedList.length - 20} more in Queue tab.</p>
                          )}
                        </div>
                      )}

                      {/* Top 10 by weighted value */}
                      <div>
                        <SectionTitle title="Top weighted prospects" subtitle="Highest expected-value prospects · weighted by stage probability" />
                        <div className="card rounded-2xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-[rgba(13,115,119,0.04)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                              <tr>
                                <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                <th className="text-left px-4 py-3 font-semibold">Region</th>
                                <th className="text-left px-4 py-3 font-semibold">Wave</th>
                                <th className="text-left px-4 py-3 font-semibold">Variant</th>
                                <th className="text-right px-4 py-3 font-semibold">Cohort</th>
                                <th className="text-right px-4 py-3 font-semibold">Weighted</th>
                                <th className="text-left px-4 py-3 font-semibold">Status</th>
                                <th className="text-left px-4 py-3 font-semibold"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...prospects].sort((a, b) => b.weightedPipelineValue - a.weightedPipelineValue).slice(0, 10).map(p => (
                                <tr key={p.id} onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }} className="border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{p.contactDiscipline} · {p.clinicalCount} clinical</div>
                                  </td>
                                  <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{p.region}, {p.state}</td>
                                  <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold">{p.priorityWave ?? '—'}</span></td>
                                  <td className="px-4 py-3 text-xs capitalize text-[var(--muted-foreground)]">{p.pitchVariant ?? 'metro'}</td>
                                  <td className="px-4 py-3 text-right font-semibold">{fmt$(p.recoCohortTotal)}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[var(--accent)]">{fmt$(p.weightedPipelineValue)}</td>
                                  <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-[rgba(13,115,119,0.1)] text-[var(--accent)] font-semibold">{p.status}</span></td>
                                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">→</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Schedule ── */}
                  {prospectsSubTab === 'schedule' && (
                    <div className="space-y-6">
                      <div className="card rounded-2xl p-4 bg-[rgba(13,115,119,0.03)]">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Schedule is auto-generated: P1 first, Mon/Wed/Fri only, ≤5 sends per day. Re-run <code className="px-1.5 py-0.5 bg-white rounded">/api/admin/prospect-bootstrap-targets</code> with <code>{`{"startDate":"YYYY-MM-DD"}`}</code> to rebuild.
                        </p>
                      </div>
                      {scheduleDays.length === 0 ? (
                        <div className="card rounded-2xl p-6 text-center text-sm text-[var(--muted-foreground)]">No scheduled sends — all prospects already sent or no schedule applied.</div>
                      ) : (
                        <div className="space-y-3">
                          {scheduleDays.map(([day, items]) => {
                            const date = new Date(day + 'T00:00:00')
                            const weekday = date.toLocaleDateString('en-AU', { weekday: 'long' })
                            const dateLabel = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
                            const dayTotal = items.reduce((acc, p) => acc + p.recoCohortTotal, 0)
                            return (
                              <div key={day} className="card rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 bg-[rgba(13,115,119,0.04)] flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-bold text-[var(--foreground)]">{weekday}, {dateLabel}</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">{items.length} send{items.length === 1 ? '' : 's'} · {fmt$(dayTotal)} potential</div>
                                  </div>
                                </div>
                                <table className="w-full text-sm">
                                  <tbody>
                                    {items.map(p => (
                                      <tr key={p.id} onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }} className="border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer">
                                        <td className="px-4 py-2.5">
                                          <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">{p.priorityWave ?? '—'}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                          <div className="text-xs text-[var(--muted-foreground)]">{p.city}, {p.state}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold capitalize">{p.pitchVariant ?? 'metro'}</span></td>
                                        <td className="px-4 py-2.5 text-right text-xs">{p.clinicalCount} clinical</td>
                                        <td className="px-4 py-2.5 text-right font-semibold">{fmt$(p.recoCohortTotal)}</td>
                                        <td className="px-4 py-2.5 text-right text-xs text-[var(--muted-foreground)]">{p.nextTemplateSlug ?? 'initial'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Pipeline funnel ── */}
                  {prospectsSubTab === 'pipeline' && (
                    <div className="space-y-6">
                      <div>
                        <SectionTitle title="Pipeline funnel" subtitle="Prospect count + conversion rate at each stage" />
                        <div className="card rounded-2xl p-6 space-y-3">
                          {FUNNEL_STAGES.map(stage => {
                            const count = agg.byStatus[stage.key] ?? 0
                            const widthPct = (count / funnelMax) * 100
                            const stageRevenue = prospects
                              .filter(p => p.status === stage.key)
                              .reduce((acc, p) => acc + p.recoCohortTotal, 0)
                            return (
                              <div key={stage.key} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-semibold text-[var(--foreground)]">{stage.label}</div>
                                <div className="flex-1 bg-slate-100 rounded-lg h-8 relative overflow-hidden">
                                  <div className={`absolute inset-y-0 left-0 ${stage.colour} flex items-center justify-end pr-3 text-xs font-bold text-white`} style={{ width: `${widthPct}%`, minWidth: count > 0 ? '40px' : 0 }}>
                                    {count > 0 && count}
                                  </div>
                                </div>
                                <div className="w-32 text-xs text-right text-[var(--muted-foreground)]">{fmt$(stageRevenue)}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-3">Send → Open conversion</div>
                          <div className="text-3xl font-bold text-[var(--accent)]">{(agg.funnel.sendOpenRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{agg.funnel.totalOpens} opens / {agg.funnel.totalSends} sends</div>
                        </div>
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-3">Open → Click conversion</div>
                          <div className="text-3xl font-bold text-[var(--accent)]">{(agg.funnel.openClickRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{agg.funnel.totalClicks} clicks / {agg.funnel.totalOpens} opens</div>
                        </div>
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-3">Send → Reply conversion</div>
                          <div className="text-3xl font-bold text-amber-600">{(agg.funnel.sendReplyRate * 100).toFixed(2)}%</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{agg.funnel.totalReplies} replies / {agg.funnel.totalSends} sends</div>
                        </div>
                        <div className="card rounded-xl p-4">
                          <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-3">Reply → Win conversion</div>
                          <div className="text-3xl font-bold text-emerald-600">{(agg.funnel.replyToWinRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">{agg.revenue.wins} wins / {agg.funnel.totalReplies} replies</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Breakdowns ── */}
                  {prospectsSubTab === 'breakdowns' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <BreakdownCard title="By engagement tier" data={agg.byEngagementTier ?? {}} icon={Flame} />
                      <BreakdownCard title="By offer (Hub Pack vs on-site)" data={agg.byOffer ?? {}} icon={DollarSign} />
                      <BreakdownCard title="By clinic size" data={agg.bySizeBucket ?? {}} icon={Building2} />
                      <BreakdownCard title="By region" data={agg.byRegion} icon={MapPin} />
                      <BreakdownCard title="By cohort tier" data={agg.byCohort} icon={Target} />
                      <BreakdownCard title="By travel band" data={agg.byTravelBand} icon={Globe} />
                      <BreakdownCard title="By priority wave" data={prospects.reduce<Record<string, number>>((acc, p) => {
                        const k = p.priorityWave ?? 'unassigned'
                        acc[k] = (acc[k] ?? 0) + 1
                        return acc
                      }, {})} icon={Flame} />
                      <BreakdownCard title="By discipline" data={prospects.reduce<Record<string, number>>((acc, p) => {
                        acc[p.contactDiscipline] = (acc[p.contactDiscipline] ?? 0) + 1
                        return acc
                      }, {})} icon={Users} />
                      <BreakdownCard title="By pitch variant" data={prospects.reduce<Record<string, number>>((acc, p) => {
                        const k = p.pitchVariant ?? 'metro'
                        acc[k] = (acc[k] ?? 0) + 1
                        return acc
                      }, {})} icon={MousePointer} />
                    </div>
                  )}

                  {/* ── Queue & Activity (combines re-engage queue + sent table + drill-down) ── */}
                  {prospectsSubTab === 'queue' && (
                    <div className="space-y-6">
                      {/* Drill-down modal */}
                      {selectedProspect && (
                        <div className="card rounded-2xl p-6 border-[rgba(13,115,119,0.25)] bg-[rgba(13,115,119,0.02)]">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Drill-down · {selectedProspect.priorityWave}</div>
                              <h3 className="text-xl font-bold text-[var(--foreground)] mt-1">{selectedProspect.shortName}</h3>
                              <p className="text-sm text-[var(--muted-foreground)]">{selectedProspect.contactFullName} · {selectedProspect.contactRole ?? selectedProspect.contactDiscipline} · {selectedProspect.contactEmail}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-1">{selectedProspect.city}, {selectedProspect.state} · {selectedProspect.region}</p>
                            </div>
                            <button onClick={() => setSelectedProspectId(null)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Close ×</button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Team</div>
                              <div className="text-lg font-bold">{selectedProspect.clinicalCount} clinical</div>
                              <div className="text-xs text-[var(--muted-foreground)]">of {selectedProspect.totalCount} total</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Cohort</div>
                              <div className="text-lg font-bold capitalize">{selectedProspect.cohortRecommendation}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{fmt$(selectedProspect.recoCohortTotal)}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Engagement</div>
                              <div className="text-lg font-bold">{selectedProspect.totalOpens}/{selectedProspect.totalClicks}/{selectedProspect.totalPortalViews}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">opens / clicks / views</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Status</div>
                              <div className="text-lg font-bold capitalize">{selectedProspect.status}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{selectedProspect.scheduledSendAt ? `scheduled ${new Date(selectedProspect.scheduledSendAt).toLocaleDateString('en-AU')}` : 'no schedule'}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap mb-4">
                            <a href={`https://portal.concussion-education-australia.com/p/${selectedProspect.slug}?k=${(selectedProspect as ProspectRow & { accessKey?: string }).accessKey ?? ''}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[rgba(13,115,119,0.2)] hover:bg-[rgba(13,115,119,0.04)] flex items-center gap-1.5">
                              <ExternalLink size={12} /> Open prospect portal
                            </a>
                            <a href={`mailto:${selectedProspect.contactEmail}?subject=${encodeURIComponent('Following up — concussion training for ' + selectedProspect.shortName)}`} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[rgba(13,115,119,0.2)] hover:bg-[rgba(13,115,119,0.04)] flex items-center gap-1.5">
                              <Mail size={12} /> Personal nudge
                            </a>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Send history ({selectedProspect.sends.length})</div>
                            {selectedProspect.sends.length === 0 ? (
                              <p className="text-xs text-[var(--muted-foreground)]">No sends yet.</p>
                            ) : (
                              <ul className="space-y-2">
                                {selectedProspect.sends.map(s => (
                                  <li key={s.id} className="text-xs border-l-2 border-[rgba(13,115,119,0.2)] pl-3">
                                    <div className="font-semibold text-[var(--foreground)]">{s.subject}</div>
                                    <div className="text-[var(--muted-foreground)]">{new Date(s.sentAt).toLocaleString('en-AU')} · {s.templateSlug} · {s.openedCount} opens · {s.clickedCount} clicks{s.repliedAt ? ` · replied ${new Date(s.repliedAt).toLocaleDateString('en-AU')}` : ''}</div>
                                    <div className="text-[var(--muted-foreground)] mt-1 line-clamp-2 opacity-70">{s.bodyPreview}</div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Re-engage queue */}
                      {reEngageQueue.length > 0 && (
                        <div>
                          <SectionTitle title="Re-engage queue" subtitle="Engaged but no reply · last contact 14+ days ago · ranked by engagement score" />
                          <div className="card rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-[rgba(13,115,119,0.04)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                                <tr>
                                  <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                  <th className="text-left px-4 py-3 font-semibold">Region</th>
                                  <th className="text-right px-4 py-3 font-semibold">Score</th>
                                  <th className="text-right px-4 py-3 font-semibold">Last activity</th>
                                  <th className="text-right px-4 py-3 font-semibold">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reEngageQueue.map(p => (
                                  <tr key={p.id} onClick={() => setSelectedProspectId(p.id)} className="border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer">
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                      <div className="text-xs text-[var(--muted-foreground)]">{p.contactFullName} · {p.contactDiscipline}</div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.region}, {p.state}</td>
                                    <td className="px-4 py-3 text-right font-bold text-[var(--accent)]">{p.engagementScore}</td>
                                    <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">
                                      {p.lastPortalViewAt ? `viewed ${timeAgo(new Date(p.lastPortalViewAt).getTime())}` : p.lastSentAt ? `sent ${timeAgo(new Date(p.lastSentAt).getTime())}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">{fmt$(p.recoCohortTotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Sent outreach */}
                      {sentTable.length > 0 && (
                        <div>
                          <SectionTitle title="Outreach sent" subtitle="Every prospect with at least one send · sorted by engagement tier (hottest first) · click to drill in" />
                          <div className="card rounded-2xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-[rgba(13,115,119,0.04)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                                <tr>
                                  <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                  <th className="text-left px-4 py-3 font-semibold">Tier</th>
                                  <th className="text-left px-4 py-3 font-semibold">Location</th>
                                  <th className="text-right px-4 py-3 font-semibold">Team</th>
                                  <th className="text-left px-4 py-3 font-semibold">Offer</th>
                                  <th className="text-right px-4 py-3 font-semibold">Sends</th>
                                  <th className="text-right px-4 py-3 font-semibold">Opens / Clicks</th>
                                  <th className="text-right px-4 py-3 font-semibold">Views</th>
                                  <th className="text-right px-4 py-3 font-semibold">Replies</th>
                                  <th className="text-right px-4 py-3 font-semibold">Last sent</th>
                                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...sentTable].sort((a, b) => {
                                  // Sort by engagement tier descending — hottest first
                                  const rank: Record<string, number> = { replied: 6, engaged: 5, hot: 4, warm: 3, won: 2, cold: 1 }
                                  const ra = rank[a.engagementTier] ?? 0
                                  const rb = rank[b.engagementTier] ?? 0
                                  if (rb !== ra) return rb - ra
                                  return (b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0) - (a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0)
                                }).map(p => {
                                  const tier = TIER_META.find(t => t.key === p.engagementTier) ?? TIER_META[0]
                                  const TierIcon = tier.icon
                                  const isOnSite = p.recommendedOffer === 'on-site-cohort'
                                  return (
                                    <tr key={p.id} onClick={() => setSelectedProspectId(p.id)} className={`border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer ${p.callRecommended ? 'bg-orange-50/40' : ''}`}>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                          {p.callRecommended && <Phone size={12} className="text-orange-600" aria-label="Personal call recommended" />}
                                          <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                        </div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{p.contactFullName}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText} text-[10px] font-bold uppercase tracking-wider`}>
                                          <TierIcon size={10} />{tier.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{p.city}, {p.state}<div>{p.region}</div></td>
                                      <td className="px-4 py-3 text-right">{p.clinicalCount}<span className="text-xs text-[var(--muted-foreground)]"> / {p.totalCount}</span></td>
                                      <td className="px-4 py-3 text-xs">
                                        <div className={`font-semibold ${isOnSite ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{isOnSite ? 'On-site' : 'Hub Pack'}</div>
                                        <div className="text-[var(--muted-foreground)]">{fmt$(p.dealValue ?? p.recoCohortTotal)}</div>
                                      </td>
                                      <td className="px-4 py-3 text-right">{p.totalSends}</td>
                                      <td className="px-4 py-3 text-right">{p.totalOpens} / {p.totalClicks > 0 ? <span className="font-bold text-orange-600">{p.totalClicks}</span> : 0}</td>
                                      <td className="px-4 py-3 text-right">{p.totalPortalViews > 0 ? <span className="font-bold text-[var(--accent)]">{p.totalPortalViews}</span> : 0}</td>
                                      <td className="px-4 py-3 text-right">{p.replies > 0 ? <span className="font-bold text-emerald-600">{p.replies}</span> : '—'}</td>
                                      <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">{p.lastSentAt ? timeAgo(new Date(p.lastSentAt).getTime()) : '—'}<div>{p.lastSentTemplate}</div></td>
                                      <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-[rgba(13,115,119,0.1)] text-[var(--accent)] font-semibold">{p.status}</span></td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
