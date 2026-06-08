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
import { useSearchParams } from 'next/navigation'
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
  topSignal?: 'cal_booked' | 'scat_course_signup' | 'preseason_signup' | 'portal_cta_click' | 'portal_deep_dive' | 'cal_click' | 'return_view' | 'portal_long_dwell' | 'product_click' | 'multi_day_opens' | 'scanner_suspect' | 'single_view' | 'single_open' | 'none'
  calBookedAt?: string | null
  calBookingStatus?: string | null
  portalFlow?: {
    sectionFunnel: Record<string, number>
    ctaClicks: Record<string, number>
    exitSections: Record<string, number>
    avgDwellMs: number | null
  } | null
  openDays?: number
  viewDays?: number
  calClicks?: number
  calClickDays?: number
  distinctUrlClicks?: number
  productClicks?: number
  otherClicks?: number
  lastClickedSubject?: string | null
  realSessions?: number
  lastRealSessionAt?: string | null
  outreachStatus?: 'cool' | 'go' | 'last-chance' | 'long-nurture' | 'done' | 'not-hot'
  hoursSinceHotSignal?: number | null
  lastSignalAt?: string | null
  engagedToday?: boolean
  hasTalkRequest?: boolean
  // Real portal-side engagement — actual time spent + dashboard CTAs
  portalTotalDwellMs?: number
  portalMaxDwellMs?: number
  portalEngagedSessions?: number
  portalCtaClicks?: number
  portalTopCtaTarget?: string | null
  portalUniqueSections?: number
  portalDeepestSection?: string | null
  scannerSuspect?: boolean
  scatCourseSignups?: number
  preseasonSignups?: number
  scatCourseFirstAt?: string | null
  preseasonFirstAt?: string | null
  hasFreeContentSignup?: boolean
  // Behavioural lead score + tier classification
  engagementScore?: number
  personalOutreachCandidate?: boolean
  daysSinceFirstSend?: number | null
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
interface FunnelSection {
  section: string
  views: number
  exits: number
  ctaClicks: number
  uniqueProspects: number
  avgExitDwellMs: number | null
  medianExitDwellMs: number | null
  exitRate: number      // 0-1 fraction
  ctaRate: number       // 0-1 fraction
}
interface CtaTarget {
  target: string
  clicks: number
  uniqueProspects: number
}
interface ProspectsData {
  count: number
  prospects: ProspectRow[]
  aggregates?: ProspectAggregates
  funnelSections?: FunnelSection[]
  ctaTargets?: CtaTarget[]
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
const VALID_TAB_TYPES: TabType[] = ['overview', 'channels', 'flow', 'funnel', 'events', 'retargeting', 'insights', 'pool', 'preseason', 'users', 'report', 'google-ads', 'prospects']

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d')
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams?.get('tab') as TabType | null
  const initialTab: TabType = tabFromUrl && VALID_TAB_TYPES.includes(tabFromUrl) ? tabFromUrl : 'insights'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
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
  // Sortable column state for the "Outreach sent" table (click column header
  // to sort by that field; click again to toggle direction).
  type SentSortCol = 'clinic' | 'tier' | 'location' | 'team' | 'offer' | 'sends' | 'opens' | 'clicks' | 'views' | 'replies' | 'lastSent' | 'status' | 'score'
  const [sentSortCol, setSentSortCol] = useState<SentSortCol>('score')
  const [sentSortDir, setSentSortDir] = useState<'asc' | 'desc'>('desc')
  // Collapsible page-optimization panels (default collapsed - they're
  // reference data, not action data, and shouldnt dominate the top).
  const [showExitFunnel, setShowExitFunnel] = useState(false)
  const [showBreakdowns, setShowBreakdowns] = useState(false)
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
              // ── 3-TIER LEAD CLASSIFICATION (HubSpot/Marketo standard) ──
              // COLD/WARM/HOT only. All prospects keep getting nurtured
              // regardless of tier - tier just tells Zac who to monitor
              // closely. ENGAGED/REPLIED/WON are terminal states surfaced
              // separately (cal-booked + replied tracked in their own
              // panels). Tier flows from accumulating engagement score
              // (industry-standard behavioural scoring).
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
                { key: 'cold',    label: 'Cold',    action: 'Auto-sequence handles · let nurture run',                             threshold: 'Score < 5 · no real signal yet',         colour: 'bg-slate-400',  badgeBg: 'bg-slate-100',  badgeText: 'text-slate-700',  icon: Snowflake },
                { key: 'warm',    label: 'Warm',    action: 'Active interest building · auto-T2 fires + accelerates if engagement continues', threshold: 'Score 5-24 · multiple touches', colour: 'bg-amber-300',  badgeBg: 'bg-amber-50',   badgeText: 'text-amber-700',  icon: Flame },
                { key: 'hot',     label: 'Hot',     action: 'Monitor closely · personal-outreach candidate after 7-10d in sequence', threshold: 'Score 25+ · sustained engagement',       colour: 'bg-orange-500', badgeBg: 'bg-orange-50',  badgeText: 'text-orange-700', icon: Flame },
                { key: 'engaged', label: 'Booked',  action: 'Booking confirmed via cal.com OR /talk · prep for the call',          threshold: 'Cal webhook OR talk-req submitted',      colour: 'bg-rose-500',   badgeBg: 'bg-rose-50',    badgeText: 'text-rose-700',   icon: Phone },
                { key: 'replied', label: 'Replied', action: 'Direct reply received · respond inside 2 business hours',             threshold: 'Direct reply to outreach',               colour: 'bg-emerald-500',badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700',icon: Sparkles },
                { key: 'won',     label: 'Won',     action: 'Deal closed · onboarding email sent',                                  threshold: 'Deal closed',                            colour: 'bg-emerald-700',badgeBg: 'bg-emerald-100',badgeText: 'text-emerald-800',icon: CheckCircle2 },
              ]
              const tierCounts: Record<string, number> = agg.byEngagementTier ?? {}
              // Total restricted to non-dead — matches API logic
              const tierTotalForPct = TIER_META.reduce((acc, t) => acc + (tierCounts[t.key] ?? 0), 0)

              // Signal-strength score — rewritten 2026-06-08 to weight by the
              // three highest-intent signals per Zac: (1) contact/call intent,
              // (2) dashboard CTA clicks, (3) real time on portal. Email opens
              // and email "product clicks" deprioritised because they're
              // mostly Apple-MPP / scanner noise.
              //
              // Hierarchy (high → low intent):
              //   cal booked (calendar confirmed)         : 100_000
              //   talk request (filled /talk form)        :  50_000
              //   dashboard CTA click (per click)         :  10_000  ← real intent to act
              //   cal.com clicks on 2+ different days     :   5_000  ← scanner-immune
              //   engaged session (per >30s session)      :   1_000  ← real read
              //   time on portal (per minute, cap 30m)    :     100  ← real dwell
              //   return-day views (extra days, gated)    :     500  ← repeat visit
              //   multi-day opens (3+ total, extra days)  :      50  ← MPP-resistant
              const signalScore = (p: ProspectRow): number => {
                let s = 0
                if (p.calBookedAt && p.calBookingStatus === 'booked') s += 100_000
                if (p.hasTalkRequest) s += 50_000
                // Free-content signups = submitted email for free SCAT course or
                // pre-season baseline-testing tool. Slightly weaker than booking
                // a call but stronger than a dashboard CTA click (which is a
                // single tap, not a form submission).
                s += (p.preseasonSignups ?? 0) * 25_000   // pre-season > scat course (more committed: athletes-testing)
                s += (p.scatCourseSignups ?? 0) * 15_000
                s += (p.portalCtaClicks ?? 0) * 10_000
                if ((p.calClickDays ?? 0) >= 2) s += 5_000
                s += (p.portalEngagedSessions ?? 0) * 1_000
                const minutesOnPortal = Math.min(30, Math.round((p.portalTotalDwellMs ?? 0) / 60_000))
                s += minutesOnPortal * 100
                if ((p.portalEngagedSessions ?? 0) >= 1) {
                  s += Math.max(0, (p.viewDays ?? 0) - 1) * 500
                }
                if ((p.totalOpens ?? 0) >= 3) {
                  s += Math.max(0, (p.openDays ?? 0) - 1) * 50
                }
                return s
              }

              const callRecommendedList = prospects
                .filter(p => p.callRecommended)
                .sort((a, b) => signalScore(b) - signalScore(a))

              // Cal.com bookings — surface above "Call now" so Zac sees
              // the scheduled meetings first. Includes cancelled bookings
              // (status='cancelled') as a separate visual state.
              const upcomingBookings = prospects
                .filter(p => p.calBookedAt && p.calBookingStatus === 'booked')
                .sort((a, b) => new Date(a.calBookedAt!).getTime() - new Date(b.calBookedAt!).getTime())

              // "Why call" copy — derived from topSignal so the dashboard
              // explains the actual reason in human language, not a number.
              const fmtTime = (ms: number): string => {
                if (!ms) return '—'
                const s = Math.round(ms / 1000)
                if (s < 60) return `${s}s`
                const m = Math.floor(s / 60)
                const r = s % 60
                return r === 0 ? `${m}m` : `${m}m ${r}s`
              }

              const whyCallCopy = (p: ProspectRow): string => {
                switch (p.topSignal) {
                  case 'cal_booked':       return `${p.contactFirstName} booked via cal.com — prep notes for the call, no manual outreach needed.`
                  case 'preseason_signup': return `${p.contactFirstName} registered for the free pre-season baseline-testing tool — strongest free-content signal (filled the form for athlete-testing). Personal email today, lead with how the Hub Pack / on-site cohort builds on the baseline data.`
                  case 'scat_course_signup': return `${p.contactFirstName} signed up for the free SCAT mastery course — submitted email for clinical content. Personal email today, reference the course + offer the deeper hub.`
                  case 'portal_deep_dive': return `${p.contactFirstName} viewed ${p.portalUniqueSections} sections with ${p.portalEngagedSessions} engaged session${p.portalEngagedSessions === 1 ? '' : 's'} >30s${p.portalDeepestSection ? ` (deepest: ${p.portalDeepestSection.replace(/-/g, ' ')})` : ''} — genuine deep read. Personal note within 48h.`
                  case 'cal_click':        return `${p.contactFirstName} clicked cal.com on ${p.calClickDays} different days — definitely a human. Call today before momentum fades.`
                  case 'return_view':      return `${p.contactFirstName} returned to the dashboard on ${p.viewDays} different days with real dwell — research mode. Personal note within 48h.`
                  case 'portal_long_dwell':return `${p.contactFirstName} spent ${fmtTime(p.portalMaxDwellMs ?? 0)} on the dashboard in a single session — genuine read. Personal email this week.`
                  case 'multi_day_opens':  return `Opens on ${p.openDays} separate days (${p.totalOpens} total) — sustained interest, not MPP noise. Soft nudge ahead of next auto-send.`
                  case 'scanner_suspect':  return `${p.realSessions} portal session${p.realSessions === 1 ? '' : 's'} but all under 30s = anti-malware scanner pre-fetch (Defender/Cloudflare etc render the page to inspect links). Treat as no signal — let auto-sequence handle.`
                  case 'product_click':    return `${p.contactFirstName} only clicked through from the email. Likely anti-malware scanner pre-fetch — let auto-sequence handle.`
                  case 'single_view':      return `Single portal view — let auto T2 deliver, gates the price reveal.`
                  case 'single_open':      return `Single open only — likely Apple Mail Privacy prefetch. Auto-sequence handles it.`
                  default:                 return `No verified human signal yet — auto-sequence will deliver T2/T3.`
                }
              }

              const fmt$ = (n: number) => `A$${n.toLocaleString('en-AU')}`

              // ── HOT NOW (rebuilt 2026-06-08) - ACTION required, no dwell-only ──
              // Reading a marketing dashboard isnt buying intent. HOT NOW
              // requires the prospect to have ACTED:
              //   - >=1 dashboard CTA click (Book/Pricing/Talk - JS event)
              //   - >=2 days of cal.com clicks (scanner only fetches once)
              // Engaged sessions / time-on-portal alone -> WARM, not HOT.
              const hotNowSortScore = (p: ProspectRow): number => {
                let s = 0
                s += (p.preseasonSignups ?? 0) * 25_000
                s += (p.scatCourseSignups ?? 0) * 15_000
                s += (p.portalCtaClicks ?? 0) * 10_000
                if ((p.calClickDays ?? 0) >= 2) s += 5_000
                s += (p.portalEngagedSessions ?? 0) * 1_000
                s += Math.min(30, Math.round((p.portalTotalDwellMs ?? 0) / 60_000)) * 100
                return s
              }
              const hotNow = prospects
                .filter(p =>
                  ((p.portalCtaClicks ?? 0) >= 1 ||
                   (p.calClickDays ?? 0) >= 2 ||
                   (p.preseasonSignups ?? 0) >= 1 ||
                   (p.scatCourseSignups ?? 0) >= 1) &&
                  !(p.calBookedAt && p.calBookingStatus === 'booked') &&
                  !p.hasTalkRequest &&
                  p.replies === 0
                )
                .sort((a, b) => hotNowSortScore(b) - hotNowSortScore(a))
                .slice(0, 12)
              // Flag for the redundant panels now consolidated into the
              // "Who is engaging right now" unified table at the top of Overview.
              // Set to false 2026-06-09 per Zac: he wants ONE table answering
              // "who's browsing, where in nurture, prep custom pitch?" rather
              // than 4 separate panels each surfacing partial views.
              const showLegacyEngagementPanels = false
              // WARM tier — actively building interest. Shown beneath HOT NOW.
              const warmNoAction = prospects
                .filter(p =>
                  p.engagementTier === 'warm' &&
                  !(p.calBookedAt && p.calBookingStatus === 'booked') &&
                  !p.hasTalkRequest &&
                  p.replies === 0
                )
                .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
                .slice(0, 10)
              // PERSONAL OUTREACH CANDIDATES — HOT-tier prospects 7-21 days
              // into the nurture sequence with no booking yet. Industry
              // research (Salesloft/HubSpot/Outreach.io): manual touch in
              // this window converts ~3x the average when behavioural score
              // sits in the upper quartile.
              const personalOutreachCandidates = prospects
                .filter(p => p.personalOutreachCandidate === true)
                .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))

              // Today's engagers — any signal in the last 24h, regardless of tier
              const engagedToday = prospects.filter(p => p.engagedToday)

              // Outreach-status badge — time-frame green-light for personal email
              const outreachStatusBadge = (p: ProspectRow): { label: string; tone: string; sortKey: number } | null => {
                if (!p.outreachStatus || p.outreachStatus === 'not-hot') return null
                if (p.outreachStatus === 'done') return { label: '✓ Done', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200', sortKey: 5 }
                if (p.outreachStatus === 'go') {
                  const h = p.hoursSinceHotSignal ?? 0
                  // GO window = 48h-120h (2-5 days post hot signal)
                  const daysRemaining = Math.max(0, Math.floor((120 - h) / 24))
                  return { label: `🟢 GO NOW (${daysRemaining}d left)`, tone: 'bg-emerald-600 text-white border-emerald-700 animate-pulse', sortKey: 0 }
                }
                if (p.outreachStatus === 'cool') {
                  const h = p.hoursSinceHotSignal ?? 0
                  return { label: `⏳ Wait ${Math.max(0, 48 - h)}h more`, tone: 'bg-slate-100 text-slate-600 border-slate-200', sortKey: 2 }
                }
                if (p.outreachStatus === 'last-chance') return { label: '🟡 Last chance (≤10d)', tone: 'bg-amber-100 text-amber-700 border-amber-300', sortKey: 1 }
                if (p.outreachStatus === 'long-nurture') return { label: '🔴 Drop to long-nurture', tone: 'bg-rose-100 text-rose-700 border-rose-200', sortKey: 3 }
                return null
              }

              // Nurture-stage label — where each prospect sits in T1/T2/T3 sequence
              const nurtureStage = (p: ProspectRow): { label: string; tone: string } => {
                if (p.replies > 0) return { label: 'Replied', tone: 'text-emerald-700' }
                if (p.status === 'won') return { label: 'Won', tone: 'text-emerald-700 font-bold' }
                const slug = p.nextTemplateSlug
                const sent = p.totalSends
                if (sent === 0 && !p.scheduledSendAt) return { label: 'Researching', tone: 'text-slate-500' }
                if (sent === 0 && p.scheduledSendAt) {
                  const days = Math.round((new Date(p.scheduledSendAt).getTime() - Date.now()) / 86_400_000)
                  return { label: `T1 in ${days <= 0 ? 'today' : `${days}d`}`, tone: 'text-blue-600' }
                }
                if (sent >= 1 && slug && slug !== 'initial') {
                  const next = slug === 'followup' ? 'T2' : slug === 'final' ? 'T3' : slug
                  if (p.scheduledSendAt) {
                    const days = Math.round((new Date(p.scheduledSendAt).getTime() - Date.now()) / 86_400_000)
                    return { label: `${next} in ${days <= 0 ? 'today' : `${days}d`}`, tone: 'text-violet-600' }
                  }
                  return { label: `${next} next`, tone: 'text-violet-600' }
                }
                if (sent >= 3) return { label: 'Sequence done', tone: 'text-slate-500' }
                return { label: `T${sent} sent`, tone: 'text-slate-600' }
              }

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
                    const goNowCount = prospects.filter(p => p.outreachStatus === 'go').length
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div
                          className={`card rounded-xl p-4 ${hotNow.length > 0 ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-amber-50' : ''}`}
                          title="Real browser sessions ≥2 OR distinct-URL clicks ≥3 OR cal.com clicks ≥1 — unfakeable engagement"
                        >
                          <div className="text-xs text-rose-700 uppercase tracking-wider font-bold">🔥 HOT NOW</div>
                          <div className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{hotNow.length}</div>
                          <div className="text-xs text-rose-700/70 mt-0.5">
                            {goNowCount > 0 ? `${goNowCount} 🟢 GO NOW · email today` : engagedToday.length > 0 ? `${engagedToday.length} engaged today` : 'no green-lights yet'}
                          </div>
                        </div>
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
                  {prospectsSubTab === 'overview' && (() => {
                    const goNow = prospects.filter(p => p.outreachStatus === 'go' && !p.calBookedAt && !p.hasTalkRequest && p.replies === 0)
                    const coolWaiting = prospects.filter(p => p.outreachStatus === 'cool')
                    const lastChance = prospects.filter(p => p.outreachStatus === 'last-chance')
                    const dropToLongNurture = prospects.filter(p => p.outreachStatus === 'long-nurture')
                    const totalActiveSends = prospects.filter(p => p.totalSends > 0).length
                    return (
                    <div className="space-y-6">
                      {/* ── WHAT NEEDS YOU NOW · DEPRECATED 2026-06-09: empty-tile
                          panel removed in favour of the unified engagement table
                          + tier bento at the top of Overview. Suppressed via flag. */}
                      {showLegacyEngagementPanels && (
                      <div className="card rounded-2xl border-2 border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/[0.04] via-white to-amber-50/30 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--accent)]">Today · what needs you</div>
                            <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                              {goNow.length === 0 && upcomingBookings.length === 0
                                ? 'Nothing on your plate — auto-sequence is running'
                                : `${goNow.length + upcomingBookings.length} action${(goNow.length + upcomingBookings.length) === 1 ? '' : 's'} required`}
                            </h3>
                          </div>
                          <div className="text-[10.5px] text-[var(--muted-foreground)] text-right">
                            <div>{totalActiveSends} prospects in active outreach</div>
                            <div>{hotNow.length} HOT · {engagedToday.length} engaged today</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                          {/* GO NOW — actually email today */}
                          <button
                            onClick={() => goNow[0] && setSelectedProspectId(goNow[0].id)}
                            disabled={goNow.length === 0}
                            className={`text-left p-3 rounded-lg border transition-all ${goNow.length > 0 ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-500 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-default opacity-60'}`}
                          >
                            <div className={`text-[10px] uppercase tracking-wider font-bold ${goNow.length > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>🟢 GO NOW · email today</div>
                            <div className={`text-2xl font-bold tabular-nums mt-0.5 ${goNow.length > 0 ? 'text-emerald-800' : 'text-slate-400'}`}>{goNow.length}</div>
                            <div className="text-[10.5px] text-[var(--muted-foreground)] mt-1 leading-snug">
                              {goNow.length === 0 ? 'No one crossed the 48hr digest window yet' : `${goNow[0].contactFirstName} · ${goNow[0].shortName}${goNow.length > 1 ? ` + ${goNow.length - 1} more` : ''}`}
                            </div>
                          </button>
                          {/* Cal bookings */}
                          <button
                            onClick={() => upcomingBookings[0] && setSelectedProspectId(upcomingBookings[0].id)}
                            disabled={upcomingBookings.length === 0}
                            className={`text-left p-3 rounded-lg border transition-all ${upcomingBookings.length > 0 ? 'bg-emerald-50 border-emerald-400 hover:border-emerald-600 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-default opacity-60'}`}
                          >
                            <div className={`text-[10px] uppercase tracking-wider font-bold ${upcomingBookings.length > 0 ? 'text-emerald-800' : 'text-slate-500'}`}>📅 Calls booked · prep</div>
                            <div className={`text-2xl font-bold tabular-nums mt-0.5 ${upcomingBookings.length > 0 ? 'text-emerald-900' : 'text-slate-400'}`}>{upcomingBookings.length}</div>
                            <div className="text-[10.5px] text-[var(--muted-foreground)] mt-1 leading-snug">
                              {upcomingBookings.length === 0 ? 'No upcoming cal.com bookings' : `Next: ${upcomingBookings[0].contactFirstName} · ${new Date(upcomingBookings[0].calBookedAt!).toLocaleDateString('en-AU')}`}
                            </div>
                          </button>
                          {/* Wait — cool window */}
                          <button
                            onClick={() => coolWaiting[0] && setSelectedProspectId(coolWaiting[0].id)}
                            disabled={coolWaiting.length === 0}
                            className={`text-left p-3 rounded-lg border transition-all ${coolWaiting.length > 0 ? 'bg-amber-50 border-amber-300 hover:border-amber-500 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-default opacity-60'}`}
                          >
                            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">⏳ WAIT · let T2 land</div>
                            <div className="text-2xl font-bold text-amber-800 tabular-nums mt-0.5">{coolWaiting.length}</div>
                            <div className="text-[10.5px] text-[var(--muted-foreground)] mt-1 leading-snug">
                              {coolWaiting.length === 0 ? 'No fresh engagers in cool window' : 'Engaged in last 48h — personal outreach would compete with auto-sequence'}
                            </div>
                          </button>
                          {/* Long-nurture drop */}
                          <button
                            onClick={() => dropToLongNurture[0] && setSelectedProspectId(dropToLongNurture[0].id)}
                            disabled={dropToLongNurture.length === 0 && lastChance.length === 0}
                            className={`text-left p-3 rounded-lg border transition-all ${(dropToLongNurture.length + lastChance.length) > 0 ? 'bg-rose-50 border-rose-200 hover:border-rose-400 cursor-pointer' : 'bg-slate-50 border-slate-200 cursor-default opacity-60'}`}
                          >
                            <div className="text-[10px] uppercase tracking-wider font-bold text-rose-700">🟡🔴 Fading / drop</div>
                            <div className="text-2xl font-bold text-rose-800 tabular-nums mt-0.5">{lastChance.length}<span className="text-base text-rose-600 font-normal ml-1">+ {dropToLongNurture.length}</span></div>
                            <div className="text-[10.5px] text-[var(--muted-foreground)] mt-1 leading-snug">
                              {lastChance.length + dropToLongNurture.length === 0 ? 'No fading prospects' : `${lastChance.length} last-chance · ${dropToLongNurture.length} drop to long-nurture`}
                            </div>
                          </button>
                        </div>
                      </div>
                      )}

                      {/* HOT NOW — DEPRECATED 2026-06-09: content now in the unified
                          "Who is engaging right now" table at the top of Overview. */}
                      {showLegacyEngagementPanels && hotNow.length > 0 && (
                        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-amber-50 to-white p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white animate-pulse">🔥 HOT NOW</span>
                              <span className="text-sm font-bold text-[var(--foreground)]">
                                {hotNow.length} prospect{hotNow.length === 1 ? '' : 's'} with deep engagement — manual outreach today
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-[10px] uppercase text-rose-700/70 font-bold border-b border-rose-200/50">
                                  <th className="px-2 py-1.5">Contact / Clinic</th>
                                  <th className="px-2 py-1.5 text-right" title="Total time on prospect portal (sum of all sessions) — real human dwell">⏱ Time</th>
                                  <th className="px-2 py-1.5 text-right" title="Clicks on dashboard CTAs (Book/Pricing/Talk) — client-side JS, scanner-immune">🎯 CTAs</th>
                                  <th className="px-2 py-1.5 text-right" title="Cal.com clicks on multiple calendar days — multi-day = real human">📅 Cal-d</th>
                                  <th className="px-2 py-1.5">Outreach</th>
                                  <th className="px-2 py-1.5">Nurture</th>
                                </tr>
                              </thead>
                              <tbody>
                                {hotNow.map(p => {
                                  const status = outreachStatusBadge(p)
                                  const stage = nurtureStage(p)
                                  return (
                                    <tr
                                      key={p.id}
                                      onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }}
                                      className="border-b border-rose-100/40 hover:bg-white/60 cursor-pointer"
                                    >
                                      <td className="px-2 py-2">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName} <span className="text-[var(--muted-foreground)] font-normal">— {p.shortName}</span></div>
                                        <div className="text-[10.5px] text-[var(--muted-foreground)]">{p.contactEmail}</div>
                                      </td>
                                      <td className="px-2 py-2 text-right font-bold text-rose-700 tabular-nums">{(p.portalTotalDwellMs ?? 0) > 0 ? fmtTime(p.portalTotalDwellMs ?? 0) : '—'}</td>
                                      <td className="px-2 py-2 text-right font-bold text-emerald-700 tabular-nums">{p.portalCtaClicks || '—'}</td>
                                      <td className="px-2 py-2 text-right font-bold text-amber-700 tabular-nums">{p.calClickDays || (p.calClicks ? `${p.calClicks}×` : '—')}</td>
                                      <td className="px-2 py-2">
                                        {status ? (
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${status.tone}`}>{status.label}</span>
                                        ) : <span className="text-[10px] text-[var(--muted-foreground)]">—</span>}
                                      </td>
                                      <td className={`px-2 py-2 text-[10.5px] font-semibold ${stage.tone}`}>{stage.label}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[10.5px] text-rose-700/80 mt-2">
                            HOT requires ACTION — dashboard CTA click (Book/Pricing/Talk) OR cal.com clicks on 2+ days. Dwell-alone doesnt count (warm at best). Sorted by intent: CTA ▶ cal multi-day ▶ engaged sessions ▶ time.
                          </p>
                        </div>
                      )}

                      {/* ── ENGAGEMENT BENTO · HEADLINE ── 6-tile tier breakdown at the
                          very top so Zac sees Cold/Warm/Hot/Booked/Replied/Won at a glance. */}
                      <div>
                        <SectionTitle
                          title="Engagement tiers · who is in the pipeline right now"
                          subtitle={`${tierCounts.warm ?? 0} warm · ${tierCounts.hot ?? 0} hot · ${tierCounts.engaged ?? 0} booked · score-based, behavioural · all tiers continue receiving the nurture sequence`}
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
                                className="card rounded-xl p-3.5 text-left hover:border-[var(--accent)] transition-colors cursor-pointer group"
                                title={`${count} ${t.label.toLowerCase()} prospects · ${t.threshold}`}
                              >
                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeText} text-[10px] font-bold uppercase tracking-wider mb-1.5`}>
                                  <Icon size={11} />{t.label}
                                </div>
                                <div className="text-2xl font-bold text-[var(--foreground)]">{count}</div>
                                <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{pct.toFixed(0)}% of pipeline</div>
                                <div className={`mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden`}>
                                  <div className={`h-full ${t.colour}`} style={{ width: `${pct}%` }} />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* ── WHOS ENGAGING RIGHT NOW · single unified table ──
                          Replaces the three separate panels (HOT NOW, WARM, Personal
                          outreach) with one prioritized list answering all three
                          questions at a glance:
                            1. Which clinics + people are actively browsing
                            2. Where they sit in the nurture sequence
                            3. Whether to prep a custom pitch for personal outreach */}
                      {(() => {
                        const engaging = prospects
                          .filter(p =>
                            (p.engagementScore ?? 0) >= 5 ||
                            p.engagementTier === 'hot' || p.engagementTier === 'warm' ||
                            p.engagementTier === 'engaged' || p.engagementTier === 'replied' ||
                            p.callRecommended === true
                          )
                          .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
                          .slice(0, 30)
                        if (engaging.length === 0) return null
                        return (
                          <div>
                            <SectionTitle
                              title={`Who is engaging right now · ${engaging.length}`}
                              subtitle="Browsing + emailing prospects · ranked by behavioural score · prep-pitch flag = HOT tier 7-21d into nurture (research: manual nudge ~3× conversion here)"
                            />
                            <div className="card rounded-2xl overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-[rgba(13,115,119,0.04)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                                  <tr>
                                    <th className="text-left px-3 py-3 font-semibold">Contact / Clinic</th>
                                    <th className="text-center px-2 py-3 font-semibold" title="Behavioural lead score">Score</th>
                                    <th className="text-left px-2 py-3 font-semibold">Tier</th>
                                    <th className="text-left px-3 py-3 font-semibold">Nurture stage</th>
                                    <th className="text-left px-2 py-3 font-semibold" title="Real time on portal · click count · dwell">Engagement</th>
                                    <th className="text-center px-3 py-3 font-semibold" title="Prep custom pitch? Yes if HOT tier 7-21d into nurture (research-backed personal-touch window)">Prep pitch?</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {engaging.map(p => {
                                    const tier = TIER_META.find(t => t.key === p.engagementTier) ?? TIER_META[0]
                                    const TierIcon = tier.icon
                                    const stage = nurtureStage(p)
                                    const isPrep = p.personalOutreachCandidate === true
                                    const scoreColour = (p.engagementScore ?? 0) >= 25 ? 'text-orange-700' : (p.engagementScore ?? 0) >= 5 ? 'text-amber-700' : 'text-[var(--muted-foreground)]'
                                    return (
                                      <tr
                                        key={p.id}
                                        onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }}
                                        className={`border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer ${isPrep ? 'bg-orange-50/40' : ''}`}
                                      >
                                        <td className="px-3 py-3">
                                          <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName} <span className="text-[var(--muted-foreground)] font-normal">— {p.shortName}</span></div>
                                          <div className="text-[11px] text-[var(--muted-foreground)]">{p.contactEmail}</div>
                                        </td>
                                        <td className={`px-2 py-3 text-center font-bold tabular-nums ${scoreColour}`}>{p.engagementScore ?? 0}</td>
                                        <td className="px-2 py-3">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText} text-[10px] font-bold uppercase tracking-wider`}>
                                            <TierIcon size={10} />{tier.label}
                                          </span>
                                        </td>
                                        <td className={`px-3 py-3 text-[11px] font-semibold whitespace-nowrap ${stage.tone}`}>{stage.label}</td>
                                        <td className="px-2 py-3 text-[10.5px] text-[var(--muted-foreground)] whitespace-nowrap">
                                          {/* When scanner-suspect, suppress all portal-based "engagement"
                                              metrics (they're headless renders, not human reading). Show
                                              only signals that cannot be faked. */}
                                          {p.scannerSuspect ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">🤖 scanner</span>
                                          ) : (
                                            <>
                                              {(p.portalEngagedSessions ?? 0) > 0 && <span className="text-rose-700 font-bold">🔥 {p.portalEngagedSessions} session{p.portalEngagedSessions === 1 ? '' : 's'} &gt;60s</span>}
                                              {(p.portalEngagedSessions ?? 0) > 0 && (p.portalTotalDwellMs ?? 0) > 0 && <span className="text-[var(--foreground)]"> · {fmtTime(p.portalTotalDwellMs ?? 0)}</span>}
                                            </>
                                          )}
                                          {(p.portalCtaClicks ?? 0) > 0 && <span className="text-emerald-700 font-bold"> · 🎯 {p.portalCtaClicks} CTA</span>}
                                          {(p.calClickDays ?? 0) >= 2 && <span className="text-amber-700 font-bold"> · 📅 {p.calClickDays}d cal</span>}
                                          {p.hasFreeContentSignup && <span className="text-emerald-700 font-bold"> · 🎁 signup</span>}
                                          {!p.scannerSuspect && (p.distinctUrlClicks ?? 0) > 0 && (p.portalEngagedSessions ?? 0) === 0 && <span> · {p.distinctUrlClicks} email click{p.distinctUrlClicks === 1 ? '' : 's'}</span>}
                                          {(p.openDays ?? 0) >= 2 && <span> · {p.openDays}d opens</span>}
                                          {p.scannerSuspect && (p.openDays ?? 0) < 2 && (p.portalCtaClicks ?? 0) === 0 && <span className="text-[var(--muted-foreground)]/70"> · no real signal</span>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          {isPrep ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500 text-white text-[10.5px] font-bold whitespace-nowrap">👤 YES · prep pitch</span>
                                          ) : p.engagementTier === 'hot' && (p.daysSinceFirstSend ?? 0) < 7 ? (
                                            <span className="text-[10.5px] text-amber-700/80">⏳ Wait · day {p.daysSinceFirstSend ?? 0}/7</span>
                                          ) : (
                                            <span className="text-[10.5px] text-[var(--muted-foreground)]">No · auto-nurture</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })()}

                      {/* PERSONAL OUTREACH CANDIDATES — HOT-tier 7-21d into nurture.
                          This is the only sub-list that warrants Zacs personal email
                          per industry-standard 7-10d post-T1 manual touch window. */}
                      {showLegacyEngagementPanels && personalOutreachCandidates.length > 0 && (
                        <div className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-600 text-white">👤 PERSONAL OUTREACH · candidates</span>
                              <span className="text-sm font-bold text-[var(--foreground)]">
                                {personalOutreachCandidates.length} HOT prospect{personalOutreachCandidates.length === 1 ? '' : 's'} · 7-21d into nurture · manual nudge converts ~3× here
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-[10px] uppercase text-orange-700/70 font-bold border-b border-orange-200/50">
                                  <th className="px-2 py-1.5">Contact / Clinic</th>
                                  <th className="px-2 py-1.5 text-right" title="Behavioural lead score - HubSpot/Marketo model">Score</th>
                                  <th className="px-2 py-1.5 text-right">Day</th>
                                  <th className="px-2 py-1.5">Top signal</th>
                                  <th className="px-2 py-1.5">Nurture stage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {personalOutreachCandidates.map(p => {
                                  const stage = nurtureStage(p)
                                  return (
                                    <tr
                                      key={p.id}
                                      onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }}
                                      className="border-b border-orange-100/40 hover:bg-white/60 cursor-pointer"
                                    >
                                      <td className="px-2 py-2">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName} <span className="text-[var(--muted-foreground)] font-normal">— {p.shortName}</span></div>
                                        <div className="text-[10.5px] text-[var(--muted-foreground)]">{p.contactEmail}</div>
                                      </td>
                                      <td className="px-2 py-2 text-right font-bold text-orange-700 tabular-nums">{p.engagementScore ?? 0}</td>
                                      <td className="px-2 py-2 text-right font-semibold text-orange-700 tabular-nums">{p.daysSinceFirstSend ?? '—'}d</td>
                                      <td className="px-2 py-2 text-[10.5px] text-[var(--foreground)]">{whyCallCopy(p).split(' — ')[0].slice(0, 38)}</td>
                                      <td className={`px-2 py-2 text-[10.5px] font-semibold ${stage.tone}`}>{stage.label}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[10.5px] text-orange-700/80 mt-2">
                            HOT (score ≥25) + 7-21 days since T1 + no booking yet = research-backed manual-touch window. All still receive auto-nurture in parallel.
                          </p>
                        </div>
                      )}

                      {/* WARM panel — DEPRECATED 2026-06-09: content now in unified table. */}
                      {showLegacyEngagementPanels && warmNoAction.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-600 text-white">🟡 WARM · no action yet</span>
                              <span className="text-sm font-bold text-[var(--foreground)]">
                                {warmNoAction.length} prospect{warmNoAction.length === 1 ? '' : 's'} reading but not clicking — auto-sequence handles
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-[10px] uppercase text-amber-700/70 font-bold border-b border-amber-200/50">
                                  <th className="px-2 py-1.5">Contact / Clinic</th>
                                  <th className="px-2 py-1.5 text-right">⏱ Time</th>
                                  <th className="px-2 py-1.5 text-right">🔥 Sessions &gt;60s</th>
                                  <th className="px-2 py-1.5 text-right">📅 Open days</th>
                                  <th className="px-2 py-1.5">Nurture</th>
                                </tr>
                              </thead>
                              <tbody>
                                {warmNoAction.map(p => {
                                  const stage = nurtureStage(p)
                                  return (
                                    <tr
                                      key={p.id}
                                      onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }}
                                      className="border-b border-amber-100/40 hover:bg-white/60 cursor-pointer"
                                    >
                                      <td className="px-2 py-2">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName} <span className="text-[var(--muted-foreground)] font-normal">— {p.shortName}</span></div>
                                        <div className="text-[10.5px] text-[var(--muted-foreground)]">{p.contactEmail}</div>
                                      </td>
                                      <td className="px-2 py-2 text-right font-semibold text-amber-700 tabular-nums">{(p.portalTotalDwellMs ?? 0) > 0 ? fmtTime(p.portalTotalDwellMs ?? 0) : '—'}</td>
                                      <td className="px-2 py-2 text-right font-semibold text-amber-700 tabular-nums">{p.portalEngagedSessions || '—'}</td>
                                      <td className="px-2 py-2 text-right font-semibold text-amber-700 tabular-nums">{p.openDays || '—'}</td>
                                      <td className={`px-2 py-2 text-[10.5px] font-semibold ${stage.tone}`}>{stage.label}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[10.5px] text-amber-700/80 mt-2">
                            These are reading the dashboard but havent clicked a CTA or booked a call. T2 (value-led, free SCAT + baseline tools) will fire ~4 BD after T1 instead of 7 BD — cron auto-accelerates when engagement detected. No manual outreach unless they cross into HOT.
                          </p>
                        </div>
                      )}

                      {/* Today's engagement — count + quick context if no HOT/WARM above */}
                      {engagedToday.length > 0 && hotNow.length === 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-[var(--foreground)]">📬 {engagedToday.length} prospect{engagedToday.length === 1 ? '' : 's'} engaged today</span>
                            <button
                              onClick={() => setProspectsSubTab('queue')}
                              className="text-[11px] text-amber-700 font-semibold hover:underline"
                            >View all in Queue →</button>
                          </div>
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            Below the unfakeable HOT NOW threshold but still showing live activity — let the auto-sequence handle them unless they cross the green-light window.
                          </p>
                        </div>
                      )}

                      {/* ── WHERE PROSPECTS DROP OFF · cross-portal exit funnel ──
                          Collapsible — this is page-optimisation data, not action data,
                          so it shouldnt dominate the top of the dashboard. Default
                          closed. Click to expand and use the drop-off insights to
                          tune the prospect portal sections + CTA copy. */}
                      {prospectsData.funnelSections && prospectsData.funnelSections.length > 0 && (
                        <div className="card rounded-2xl border-slate-200 overflow-hidden">
                          <button
                            onClick={() => setShowExitFunnel(v => !v)}
                            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50/60 transition-colors"
                          >
                            <div>
                              <div className="text-xs uppercase tracking-wider font-bold text-[var(--muted-foreground)]">{showExitFunnel ? '▼' : '▶'} Page-optimisation data</div>
                              <div className="text-sm font-bold text-[var(--foreground)] mt-0.5">Where prospects drop off · {prospectsData.funnelSections.length} sections tracked</div>
                            </div>
                            <span className="text-[10.5px] text-[var(--muted-foreground)]">click to {showExitFunnel ? 'hide' : 'show'}</span>
                          </button>
                          {showExitFunnel && (
                            <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                              {/* The original exit-funnel render content lives below this wrapper. */}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Original funnel render — only shown when expanded. We gate via the same flag. */}
                      {showExitFunnel && prospectsData.funnelSections && prospectsData.funnelSections.length > 0 && (() => {
                        const sections = prospectsData.funnelSections!.filter(s => s.views >= 2)
                        if (sections.length === 0) return null
                        const maxViews = Math.max(...sections.map(s => s.views), 1)
                        // Canonical scroll order to render top → bottom of page
                        const SECTION_ORDER = ['hero','credibility','trial-cta','onsite-hero','team-snapshot','multidisciplinary','pricing','local-hub','risk-reversal','next-step','individual-signup','footer']
                        const ordered = [...sections].sort((a, b) => {
                          const ai = SECTION_ORDER.indexOf(a.section)
                          const bi = SECTION_ORDER.indexOf(b.section)
                          if (ai === -1 && bi === -1) return b.views - a.views
                          if (ai === -1) return 1
                          if (bi === -1) return -1
                          return ai - bi
                        })
                        // Top exit-rate offender (where the most prospects are leaving)
                        const dropOff = [...sections].filter(s => s.views >= 3).sort((a, b) => b.exitRate - a.exitRate)[0]
                        const topCta = (prospectsData.ctaTargets ?? [])[0]
                        const totalCtaClicks = (prospectsData.ctaTargets ?? []).reduce((sum, c) => sum + c.clicks, 0)
                        const totalSectionViews = sections.reduce((sum, s) => sum + s.views, 0)
                        const overallCtaRate = totalSectionViews > 0 ? totalCtaClicks / totalSectionViews : 0
                        return (
                          <div>
                            <SectionTitle
                              title="Where prospects drop off"
                              subtitle="Cross-portal exit funnel · which section bleeds the most, which CTAs actually pull · the conversion-bottleneck story"
                            />
                            <div className="card rounded-2xl p-5 border-orange-200/40">
                              {/* Headline insight */}
                              {dropOff && (
                                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                                  <div className="text-[11px] uppercase tracking-wider font-bold text-rose-700 mb-1">🚪 Biggest drop-off</div>
                                  <div className="text-sm text-rose-900 font-semibold">
                                    <strong>{dropOff.section.replace(/-/g, ' ')}</strong> · {Math.round(dropOff.exitRate * 100)}% exit rate · {dropOff.exits} of {dropOff.views} views ended here
                                  </div>
                                  <p className="text-[11.5px] text-rose-700/90 mt-1">
                                    {dropOff.section === 'pricing' ? 'Sticker shock or pricing copy not converting. Test: add risk-reversal next to price, or split-test cohort vs Hub Pack framing.'
                                      : dropOff.section === 'hero' ? 'Above-fold isnt earning the scroll. Test: clinic-name personalisation, clinician-count + admin-time-saved benefit, region-specific stat.'
                                      : dropOff.section === 'trial-cta' ? 'Trial CTA not converting. Test: free-content offer (SCAT pack / preseason) above the cohort pitch.'
                                      : dropOff.section === 'team-snapshot' ? 'Team display isnt landing. Test: lead with clinician count + admin pain-point.'
                                      : 'Section copy or position isnt converting - test alternatives.'}
                                  </p>
                                </div>
                              )}

                              {/* Section funnel — full bar chart */}
                              <div className="mb-4">
                                <div className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold mb-2">Section funnel · views vs exits</div>
                                <div className="space-y-1.5">
                                  {ordered.map(s => {
                                    const viewPct = (s.views / maxViews) * 100
                                    const exitPctOfViews = s.views > 0 ? (s.exits / s.views) * 100 : 0
                                    const exitColour = exitPctOfViews >= 50 ? 'bg-rose-500' : exitPctOfViews >= 25 ? 'bg-amber-400' : 'bg-emerald-400'
                                    const dwellSec = s.medianExitDwellMs ? Math.round(s.medianExitDwellMs / 1000) : null
                                    return (
                                      <div key={s.section} className="flex items-center gap-2 text-xs">
                                        <div className="w-28 text-[var(--foreground)] capitalize truncate font-medium" title={s.section}>{s.section.replace(/-/g, ' ')}</div>
                                        <div className="flex-1 bg-slate-100 rounded h-6 relative overflow-hidden">
                                          <div className="absolute inset-y-0 left-0 bg-[var(--accent)]/30" style={{ width: `${viewPct}%` }} />
                                          <div className={`absolute inset-y-0 left-0 ${exitColour} opacity-70`} style={{ width: `${(s.exits / maxViews) * 100}%` }} />
                                          <div className="absolute inset-0 flex items-center justify-between px-2 text-[10.5px] font-bold">
                                            <span className="text-[var(--foreground)]">{s.views} views · {s.uniqueProspects} prospects</span>
                                            <span className={exitPctOfViews >= 25 ? 'text-rose-700' : 'text-emerald-700'}>
                                              {s.exits > 0 ? `${s.exits} exits (${Math.round(exitPctOfViews)}%)` : 'no exits'}
                                              {dwellSec != null && exitPctOfViews >= 25 && ` · ~${dwellSec}s before exit`}
                                            </span>
                                          </div>
                                        </div>
                                        {s.ctaClicks > 0 && (
                                          <div className="w-20 text-right text-[10.5px] text-emerald-700 font-semibold">🎯 {s.ctaClicks} CTA</div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* CTA performance */}
                              {(prospectsData.ctaTargets ?? []).length > 0 && (
                                <div>
                                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] font-bold mb-2">CTA performance · which buttons actually pull</div>
                                  <div className="flex flex-wrap gap-2">
                                    {(prospectsData.ctaTargets ?? []).slice(0, 10).map(c => (
                                      <span key={c.target} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-semibold border border-[var(--accent)]/20">
                                        {c.target}
                                        <span className="text-[var(--foreground)]/70 font-bold">×{c.clicks}</span>
                                        <span className="text-[10px] text-[var(--muted-foreground)]">· {c.uniqueProspects} prospect{c.uniqueProspects === 1 ? '' : 's'}</span>
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-[10.5px] text-[var(--muted-foreground)] mt-2">
                                    Top: <strong>{topCta?.target ?? '—'}</strong> ({topCta?.clicks ?? 0} clicks). Overall CTA-click-per-section-view rate: {(overallCtaRate * 100).toFixed(1)}%
                                    {overallCtaRate < 0.05 && ' — CTAs are not converting browsers to actions. Test stronger value drops above each CTA (free SCAT pack, baseline tool, clinic-name personalisation).'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Engagement tier strip — DEPRECATED 2026-06-09: moved to TOP of Overview as the headline. */}
                      {showLegacyEngagementPanels && (
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
                      )}

                      {/* Upcoming cal.com bookings — auto-populated by the cal.com
                          webhook (BOOKING_CREATED). Show before Call-now so Zac
                          sees scheduled meetings before lists of who-to-call. */}
                      {upcomingBookings.length > 0 && (
                        <div>
                          <SectionTitle
                            title={`Upcoming bookings (${upcomingBookings.length})`}
                            subtitle="Cal.com booked via the prospect cold-outreach pipeline · prep, don't outreach"
                          />
                          <div className="card rounded-2xl overflow-hidden border-emerald-200">
                            <table className="w-full text-sm">
                              <thead className="bg-emerald-50 text-xs uppercase tracking-wider text-emerald-700">
                                <tr>
                                  <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                                  <th className="text-left px-4 py-3 font-semibold">Scheduled</th>
                                  <th className="text-right px-4 py-3 font-semibold">Offer</th>
                                  <th className="text-left px-4 py-3 font-semibold">Prep</th>
                                </tr>
                              </thead>
                              <tbody>
                                {upcomingBookings.map(p => {
                                  const when = p.calBookedAt ? new Date(p.calBookedAt) : null
                                  const whenLabel = when
                                    ? when.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                    : '—'
                                  const isOnSite = p.recommendedOffer === 'on-site-cohort'
                                  return (
                                    <tr key={p.id} onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }} className="border-t border-emerald-100/60 hover:bg-emerald-50/40 cursor-pointer">
                                      <td className="px-4 py-3">
                                        <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{p.city || 'Unknown'}, {p.state} · {p.clinicalCount} clinical</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName}</div>
                                        <div className="text-[var(--muted-foreground)]">{p.contactDiscipline}</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs font-bold text-emerald-700">{whenLabel}</td>
                                      <td className="px-4 py-3 text-right text-xs">
                                        <div className={`font-semibold ${isOnSite ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{isOnSite ? `On-site · ${fmt$(p.dealValue ?? p.recoCohortTotal)}` : `Hub Pack · ${fmt$(p.dealValue ?? 1497)}`}</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] leading-snug">Review {p.shortName}&apos;s team mix + city · pull last portal-view section · 15-min agenda</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Call-now list — clinics with strong signals + no reply yet.
                          This is the actionable surface: Zac's time goes here.
                          Outreach + Nurture columns surface time-frame green
                          light + current sequence stage so Zac sees both
                          WHO to chase AND WHERE they sit in the cold cron. */}
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
                                  <th className="text-left px-3 py-3 font-semibold">Outreach</th>
                                  <th className="text-left px-4 py-3 font-semibold">Clinic</th>
                                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                                  <th className="text-left px-3 py-3 font-semibold">Nurture</th>
                                  <th className="text-left px-3 py-3 font-semibold">Tier</th>
                                  <th className="text-left px-3 py-3 font-semibold">Top signal</th>
                                  <th className="text-center px-2 py-3 font-semibold" title="Total time on prospect portal (sum of all sessions) — real human dwell">⏱ Time</th>
                                  <th className="text-center px-2 py-3 font-semibold" title="Clicks on dashboard CTAs (Book/Pricing/Talk) — client-side JS, scanner-immune">🎯 CTAs</th>
                                  <th className="text-center px-2 py-3 font-semibold" title="Cal.com clicks on multiple calendar days (single-day click = scanner suspect)">📅 Cal-d</th>
                                  <th className="text-right px-3 py-3 font-semibold">Offer</th>
                                  <th className="text-left px-4 py-3 font-semibold">Why call</th>
                                </tr>
                              </thead>
                              <tbody>
                                {callRecommendedList
                                  .map(p => ({ p, status: outreachStatusBadge(p), stage: nurtureStage(p) }))
                                  .sort((a, b) => (a.status?.sortKey ?? 99) - (b.status?.sortKey ?? 99))
                                  .slice(0, 20)
                                  .map(({ p, status, stage }) => {
                                  const tier = TIER_META.find(t => t.key === p.engagementTier)!
                                  const TierIcon = tier.icon
                                  const isOnSite = p.recommendedOffer === 'on-site-cohort'
                                  const offerLabel = isOnSite
                                    ? `On-site · ${fmt$(p.dealValue ?? p.recoCohortTotal)}`
                                    : `Hub Pack · ${fmt$(p.dealValue ?? 1497)}`
                                  // Top-signal label — what's the strongest signal
                                  const SIGNAL_LABELS: Record<NonNullable<ProspectRow['topSignal']>, string> = {
                                    cal_booked: '📅 Cal booked',
                                    preseason_signup: '🏃 Pre-season signup',
                                    scat_course_signup: '📚 SCAT course signup',
                                    portal_cta_click: '🎯 Dashboard CTA',
                                    portal_deep_dive: '🔍 Deep dive',
                                    cal_click: '🎯 Cal click (multi-day)',
                                    return_view: '↻ Return visit',
                                    portal_long_dwell: '⏱ Long read',
                                    product_click: '→ Email click (scanner?)',
                                    multi_day_opens: '📅 Multi-day opens',
                                    scanner_suspect: '🤖 Scanner pre-fetch',
                                    single_view: '👁 Single view',
                                    single_open: '✉️ Single open',
                                    none: '—',
                                  }
                                  const rowTint = status?.sortKey === 0 ? 'bg-emerald-50/30' : status?.sortKey === 1 ? 'bg-amber-50/30' : ''
                                  return (
                                    <tr key={p.id} onClick={() => { setSelectedProspectId(p.id); setProspectsSubTab('queue') }} className={`border-t border-[rgba(13,115,119,0.06)] hover:bg-[rgba(13,115,119,0.04)] cursor-pointer ${rowTint}`}>
                                      <td className="px-3 py-3">
                                        {status ? (
                                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${status.tone}`}>{status.label}</span>
                                        ) : <span className="text-[10px] text-[var(--muted-foreground)]">—</span>}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-semibold text-[var(--foreground)]">{p.shortName}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{p.city || 'Unknown'}, {p.state} · {p.clinicalCount} clinical</div>
                                      </td>
                                      <td className="px-4 py-3 text-xs">
                                        <div className="font-semibold text-[var(--foreground)]">{p.contactFirstName}</div>
                                        <div className="text-[var(--muted-foreground)]">{p.contactDiscipline}</div>
                                      </td>
                                      <td className={`px-3 py-3 text-[11px] font-semibold whitespace-nowrap ${stage.tone}`}>{stage.label}</td>
                                      <td className="px-3 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tier.badgeBg} ${tier.badgeText} text-[10px] font-bold uppercase tracking-wider`}>
                                          <TierIcon size={10} />{tier.label}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 text-[11px] font-semibold text-[var(--foreground)]">{SIGNAL_LABELS[p.topSignal ?? 'none']}</td>
                                      <td className="px-2 py-3 text-center text-sm font-bold text-rose-700 tabular-nums">{(p.portalTotalDwellMs ?? 0) > 0 ? fmtTime(p.portalTotalDwellMs ?? 0) : '—'}</td>
                                      <td className="px-2 py-3 text-center text-sm font-bold text-emerald-700 tabular-nums">{p.portalCtaClicks || '—'}</td>
                                      <td className="px-2 py-3 text-center text-sm font-bold text-amber-700 tabular-nums">{p.calClickDays || (p.calClicks ? `${p.calClicks}×` : '—')}</td>
                                      <td className="px-3 py-3 text-right text-xs">
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
                    )
                  })()}

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
                      {selectedProspect && (() => {
                        const sp = selectedProspect
                        const status = outreachStatusBadge(sp)
                        const stage = nurtureStage(sp)
                        const lastSentAgo = sp.lastSentAt ? Math.round((Date.now() - new Date(sp.lastSentAt).getTime()) / 86_400_000) : null
                        const nextSendIn = sp.scheduledSendAt ? Math.round((new Date(sp.scheduledSendAt).getTime() - Date.now()) / 86_400_000) : null
                        const hoursSinceSignal = sp.hoursSinceHotSignal
                        // Verdict: what should Zac do right now?
                        let verdict: { tone: 'wait' | 'go' | 'monitor' | 'done'; headline: string; copy: string } = {
                          tone: 'monitor',
                          headline: 'Let auto-sequence handle it',
                          copy: `No strong signal yet — the cold cron will deliver T2/T3 on schedule.`,
                        }
                        if (sp.calBookedAt && sp.calBookingStatus === 'booked') {
                          verdict = { tone: 'done', headline: '📅 Booked — prep, do not outreach', copy: `Cal.com booking confirmed for ${new Date(sp.calBookedAt).toLocaleString('en-AU')}. Review their team mix + last portal section, prep a 15-min agenda.` }
                        } else if (sp.hasTalkRequest) {
                          verdict = { tone: 'done', headline: '✓ Talk request submitted — respond inside 2hrs', copy: `They filled out the /talk form. Reply directly via email — they expect a response within hours, not days.` }
                        } else if (sp.replies > 0) {
                          verdict = { tone: 'done', headline: '✓ Replied — respond inside 2hrs', copy: `Direct reply received. Auto-sequence paused. Personal reply now.` }
                        } else if (sp.scannerSuspect && sp.outreachStatus !== 'go') {
                          verdict = { tone: 'monitor', headline: '🤖 SCANNER SUSPECT — let auto-sequence handle', copy: `${sp.realSessions} portal session${sp.realSessions === 1 ? '' : 's'} recorded but all under 30s (total ${fmtTime(sp.portalTotalDwellMs ?? 0)}). This is the anti-malware link-inspector pattern (Defender ATP, Cloudflare Email Security, etc) — headless Chrome renders the page, fires IntersectionObserver for every section, then closes in 2-3s. No real human read. Don't waste a personal email — let T2 deliver.` }
                        } else if (sp.outreachStatus === 'go') {
                          const daysLeft = Math.max(0, Math.floor((168 - (hoursSinceSignal ?? 0)) / 24))
                          verdict = { tone: 'go', headline: `🟢 GO NOW — ${daysLeft}d window`, copy: `${sp.contactFirstName} crossed the hot threshold ${Math.floor((hoursSinceSignal ?? 0) / 24)}d ago and has had time to digest T1. Personal email today — reference their strongest signal (${sp.topSignal?.replace(/_/g, ' ') ?? 'engagement'}). Window closes in ${daysLeft}d before they cool.` }
                        } else if (sp.outreachStatus === 'cool') {
                          const hoursToGo = Math.max(0, 48 - (hoursSinceSignal ?? 0))
                          const nextSendCopy = nextSendIn != null ? ` T${(sp.totalSends ?? 0) + 1} is scheduled in ${nextSendIn <= 0 ? 'today' : `${nextSendIn}d`} — let it land.` : ''
                          verdict = { tone: 'wait', headline: `⏳ WAIT ${hoursToGo}h — don't compete with the auto-sequence`, copy: `${sp.contactFirstName} engaged ${hoursSinceSignal != null ? `${hoursSinceSignal}h ago` : 'recently'}. Reaching out personally now will compete with their fresh memory of T1 and look desperate.${nextSendCopy} Status flips to 🟢 GO NOW after the 48hr digest window.` }
                        } else if (sp.outreachStatus === 'last-chance') {
                          verdict = { tone: 'wait', headline: `🟡 LAST CHANCE — one tactical follow-up`, copy: `Engagement is fading (${hoursSinceSignal}h since last signal). Personal email referencing what they clicked, or let T3 deliver. Drop to long-nurture after another week of silence.` }
                        } else if (sp.outreachStatus === 'long-nurture') {
                          verdict = { tone: 'wait', headline: `🔴 Drop to long-nurture`, copy: `${hoursSinceSignal != null ? Math.floor(hoursSinceSignal / 24) : '14+'}d since last signal. Personal outreach is unlikely to convert — move them to quarterly seasonal cadence (regulatory updates, AIS guideline releases).` }
                        } else if (sp.callRecommended) {
                          verdict = { tone: 'go', headline: '📞 Call recommended', copy: `Strong signal (${sp.topSignal?.replace(/_/g, ' ') ?? 'engagement'}) but no time-frame green light yet. Open the prospect portal first, then dial.` }
                        }
                        const verdictTone = {
                          wait: 'border-amber-300 bg-amber-50/60',
                          go: 'border-emerald-300 bg-emerald-50/60',
                          monitor: 'border-slate-200 bg-slate-50/60',
                          done: 'border-emerald-400 bg-emerald-50/80',
                        }[verdict.tone]
                        const verdictText = {
                          wait: 'text-amber-900',
                          go: 'text-emerald-900',
                          monitor: 'text-slate-700',
                          done: 'text-emerald-900',
                        }[verdict.tone]
                        return (
                        <div className="card rounded-2xl p-6 border-[rgba(13,115,119,0.25)] bg-[rgba(13,115,119,0.02)]">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Drill-down · {sp.priorityWave}</div>
                              <h3 className="text-xl font-bold text-[var(--foreground)] mt-1">{sp.shortName}</h3>
                              <p className="text-sm text-[var(--muted-foreground)]">{sp.contactFullName} · {sp.contactRole ?? sp.contactDiscipline} · {sp.contactEmail}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-1">{sp.city}, {sp.state} · {sp.region}</p>
                            </div>
                            <button onClick={() => setSelectedProspectId(null)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Close ×</button>
                          </div>
                          {/* VERDICT — what to do, why, when. Replaces the buried buttons. */}
                          <div className={`rounded-lg border p-4 mb-4 ${verdictTone}`}>
                            <div className={`text-sm font-bold ${verdictText} mb-1`}>{verdict.headline}</div>
                            <p className={`text-xs ${verdictText}/90 leading-relaxed`}>{verdict.copy}</p>
                            <div className="flex gap-2 flex-wrap mt-3">
                              <a href={`https://portal.concussion-education-australia.com/p/${sp.slug}?k=${(sp as ProspectRow & { accessKey?: string }).accessKey ?? ''}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[rgba(13,115,119,0.2)] hover:bg-[rgba(13,115,119,0.04)] flex items-center gap-1.5">
                                <ExternalLink size={12} /> Open their portal
                              </a>
                              {(verdict.tone === 'go' || verdict.tone === 'done') && (
                                <a href={`mailto:${sp.contactEmail}?subject=${encodeURIComponent('Following up — concussion training for ' + sp.shortName)}`} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 ${verdict.tone === 'done' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                                  <Mail size={12} /> {verdict.tone === 'done' ? 'Reply now' : 'Personal email now'}
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Context strip — team / cohort / nurture stage / status */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Team</div>
                              <div className="text-lg font-bold">{sp.clinicalCount} clinical</div>
                              <div className="text-xs text-[var(--muted-foreground)]">of {sp.totalCount} total</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Cohort</div>
                              <div className="text-lg font-bold capitalize">{sp.cohortRecommendation}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{fmt$(sp.recoCohortTotal)}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Nurture stage</div>
                              <div className={`text-lg font-bold ${stage.tone}`}>{stage.label}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {lastSentAgo != null ? `last sent ${lastSentAgo <= 0 ? 'today' : `${lastSentAgo}d ago`}` : 'no sends yet'}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-xs text-[var(--muted-foreground)]">Outreach status</div>
                              {status ? (
                                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${status.tone} mt-1`}>{status.label}</span>
                              ) : (
                                <div className="text-lg font-bold capitalize">{sp.status}</div>
                              )}
                              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                                {hoursSinceSignal != null ? `${hoursSinceSignal}h since last signal` : sp.scheduledSendAt ? `next send ${new Date(sp.scheduledSendAt).toLocaleDateString('en-AU')}` : 'no signal'}
                              </div>
                            </div>
                          </div>
                          {/* WHAT HAPPENS NEXT — full auto-sequence timeline + manual-outreach trigger.
                              Answers two questions: (1) what subject + when will the next email fire?
                              (2) when do we switch to manual? Predicts T2 subject from engagement state
                              (clicked/opened/none mirrors the email-templates.ts gating). */}
                          {(() => {
                            // Predict T2 subject — mirrors the value-led variant logic
                            // in lib/prospect/email-templates.ts (rewritten 2026-06-08
                            // to drop tracking-acknowledgment subjects).
                            const t2Variants = [
                              `Two free tools for ${sp.shortName} - SCAT refresher + baseline testing`,
                              `Test ${sp.shortName}'s athletes free + free SCAT mini-course`,
                              `Free baseline testing tool for ${sp.shortName} (no setup)`,
                            ]
                            const t2Idx = sp.slug.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % t2Variants.length
                            const predictedT2Subject = t2Variants[t2Idx]
                            // Price reveal still gated by engagement (clicked/opened),
                            // but the body lead is always the free resource — no
                            // tracking acknowledgment in subject or intro.
                            const engagedWithT1 =
                              (sp.distinctUrlClicks ?? 0) > 0 || (sp.portalCtaClicks ?? 0) > 0
                                ? 'clicked'
                                : (sp.openDays ?? 0) > 0
                                  ? 'opened'
                                  : 'none'
                            const t2RevealsPrice = engagedWithT1 !== 'none'
                            const predictedT3Subject = `In case you were still weighing this up — ${sp.shortName}`
                            const t2Date = sp.scheduledSendAt ? new Date(sp.scheduledSendAt) : null
                            const t2DaysAway = t2Date ? Math.round((t2Date.getTime() - Date.now()) / 86_400_000) : null
                            // T3 fires ~14 BD after T2 (~ 20 calendar days, research-backed final-touch window)
                            const t3Date = t2Date ? new Date(t2Date.getTime() + 20 * 86_400_000) : null
                            const t3DaysAway = t3Date ? Math.round((t3Date.getTime() - Date.now()) / 86_400_000) : null
                            // Lookup actual sent records by template slug.
                            // sp.sends is ordered most-recent-first per the
                            // prospect-engagement endpoint; templateSlug is
                            // the canonical key (initial/followup/final).
                            const t1Send = sp.sends.find(s => s.templateSlug === 'initial')
                            const t2Send = sp.sends.find(s => s.templateSlug === 'followup')
                            const t3Send = sp.sends.find(s => s.templateSlug === 'final')
                            const sentT1 = !!t1Send
                            const sentT2 = !!t2Send
                            const sentT3 = !!t3Send
                            const fmtDate = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
                            return (
                              <div className="bg-white rounded-lg p-4 mb-4 border border-[var(--accent)]/20">
                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                  Whats next · auto-sequence + manual trigger
                                </div>
                                <div className="space-y-2.5">
                                  {/* T1 (actual send) */}
                                  {sentT1 && t1Send && (
                                    <div className="flex items-start gap-3">
                                      <div className="text-emerald-600 text-sm font-bold mt-0.5 w-6 shrink-0">✓</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--foreground)]">T1 · sent {fmtDate(new Date(t1Send.sentAt))}</div>
                                        <div className="text-[11px] text-[var(--muted-foreground)] truncate">&quot;{t1Send.subject}&quot;</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t1Send.openedCount} opens · {t1Send.clickedCount} clicks</div>
                                      </div>
                                    </div>
                                  )}
                                  {/* T2 (actual send) */}
                                  {sentT2 && t2Send && (
                                    <div className="flex items-start gap-3">
                                      <div className="text-emerald-600 text-sm font-bold mt-0.5 w-6 shrink-0">✓</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--foreground)]">T2 · sent {fmtDate(new Date(t2Send.sentAt))}</div>
                                        <div className="text-[11px] text-[var(--muted-foreground)] truncate">&quot;{t2Send.subject}&quot;</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t2Send.openedCount} opens · {t2Send.clickedCount} clicks</div>
                                      </div>
                                    </div>
                                  )}
                                  {/* T3 (actual send) */}
                                  {sentT3 && t3Send && (
                                    <div className="flex items-start gap-3">
                                      <div className="text-emerald-600 text-sm font-bold mt-0.5 w-6 shrink-0">✓</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--foreground)]">T3 · sent {fmtDate(new Date(t3Send.sentAt))}</div>
                                        <div className="text-[11px] text-[var(--muted-foreground)] truncate">&quot;{t3Send.subject}&quot;</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t3Send.openedCount} opens · {t3Send.clickedCount} clicks</div>
                                      </div>
                                    </div>
                                  )}
                                  {/* T2 — predicted (only if not yet sent) */}
                                  {!sentT2 && (
                                    <div className="flex items-start gap-3">
                                      <div className={`text-sm font-bold mt-0.5 w-6 shrink-0 ${t2Date && t2DaysAway != null && t2DaysAway <= 1 ? 'text-amber-600' : 'text-blue-600'}`}>🔜</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--foreground)]">
                                          T2 · {t2Date ? `${fmtDate(t2Date)} (${t2DaysAway === 0 ? 'today' : t2DaysAway === 1 ? 'tomorrow' : `${t2DaysAway}d`})` : 'not scheduled yet'}
                                        </div>
                                        <div className="text-[11px] text-[var(--muted-foreground)] italic truncate">&quot;{predictedT2Subject}&quot;</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                                          🎁 free SCAT mini-course + free pre-season baseline testing
                                          {t2RevealsPrice ? ' · 💲 price reveal' : ''}
                                          {' · CTA: book 15-min discovery call'}
                                          <br />
                                          {engagedWithT1 !== 'none'
                                            ? '⚡ ENGAGEMENT DETECTED — cron auto-accelerates from +7 BD to +4 BD (memory still fresh)'
                                            : 'Cold cadence (+7 BD); accelerates to +4 BD if open/click/portal-view detected'}
                                          {' · skipped if: reply · cal booking · personal-lane'}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* T3 — predicted */}
                                  {!sentT3 && (
                                    <div className="flex items-start gap-3">
                                      <div className="text-slate-500 text-sm font-bold mt-0.5 w-6 shrink-0">📨</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--foreground)]">
                                          T3 · {t3Date ? `~${fmtDate(t3Date)} (~${t3DaysAway}d)` : 'after T2 lands'}
                                        </div>
                                        <div className="text-[11px] text-[var(--muted-foreground)] italic truncate">&quot;{predictedT3Subject}&quot;</div>
                                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">📋 warm options recap (online + on-site) · no new gift · CTA: book 15-min discovery call · 14 BD after T2 (~3 wks post-T1)</div>
                                      </div>
                                    </div>
                                  )}
                                  {/* After T3 */}
                                  {!sentT3 && (
                                    <div className="flex items-start gap-3 pt-1.5 border-t border-slate-100">
                                      <div className="text-rose-400 text-sm font-bold mt-0.5 w-6 shrink-0">↓</div>
                                      <div className="flex-1 min-w-0 text-[10.5px] text-[var(--muted-foreground)]">
                                        After T3 silence → archived to <strong>long-nurture</strong> (quarterly seasonal cadence: AIS guideline updates, AFL class-action news, regulatory changes). No more cold sends.
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Manual-outreach trigger panel */}
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] mb-1.5">Switch to manual outreach when:</div>
                                  <ul className="text-[10.5px] text-[var(--muted-foreground)] space-y-1 leading-snug">
                                    <li>
                                      <strong className={sp.outreachStatus === 'go' ? 'text-emerald-700' : 'text-[var(--muted-foreground)]'}>🟢 GO NOW window (48hr-5d after a hot signal)</strong>
                                      {sp.outreachStatus === 'go' && <span className="text-emerald-700 font-semibold"> ← {sp.contactFirstName} is HERE</span>}
                                      <span> — personal email today, T2 auto-skipped. Conversion drops 30% past day 5.</span>
                                    </li>
                                    <li>
                                      <strong className={sp.outreachStatus === 'cool' ? 'text-amber-700' : 'text-[var(--muted-foreground)]'}>⏳ Cool window (0-48h after hot signal)</strong>
                                      {sp.outreachStatus === 'cool' && <span className="text-amber-700 font-semibold"> ← {sp.contactFirstName} is HERE</span>}
                                      <span> — wait, dont compete with fresh T1 memory.</span>
                                    </li>
                                    <li>
                                      <strong className={sp.outreachStatus === 'last-chance' ? 'text-amber-700' : 'text-[var(--muted-foreground)]'}>🟡 Last chance (5-10d silent after hot)</strong>
                                      {sp.outreachStatus === 'last-chance' && <span className="text-amber-700 font-semibold"> ← {sp.contactFirstName} is HERE</span>}
                                      <span> — one tactical follow-up before dropping.</span>
                                    </li>
                                    <li>
                                      <strong className={sp.outreachStatus === 'long-nurture' || sp.outreachStatus === 'not-hot' ? 'text-rose-700' : 'text-[var(--muted-foreground)]'}>🔴 10d+ silent · 🤖 scanner-only · WARM-but-no-action · no signal</strong>
                                      {(sp.outreachStatus === 'long-nurture' || sp.outreachStatus === 'not-hot') && <span className="text-rose-700 font-semibold"> ← {sp.contactFirstName} is HERE</span>}
                                      <span> — let auto-sequence finish, then long-nurture. No personal email.</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            )
                          })()}

                          {/* REAL portal engagement — time on page + dashboard CTA breakdown.
                              These are the unfakeable signals. Email "product click"
                              is mostly scanner pre-fetch, so we lean on these instead. */}
                          <div className={`bg-white rounded-lg p-4 mb-4 ${sp.scannerSuspect ? 'border border-amber-300' : ''}`}>
                            {sp.scannerSuspect && (
                              <div className="mb-3 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                                <strong>🤖 Scanner-suspect data.</strong> All {sp.realSessions} portal session{sp.realSessions === 1 ? '' : 's'} were under 30s — likely Defender/Cloudflare link inspector rendering the page in headless Chrome. Section views and dwell numbers below are NOT human interactions.
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Real portal engagement · unfakeable</div>
                              <div className="text-[10px] text-[var(--muted-foreground)]">JS-only · scanners cant fire client events</div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-rose-600 font-bold">⏱ Time on portal</div>
                                <div className="text-xl font-bold text-rose-700 tabular-nums">{fmtTime(sp.portalTotalDwellMs ?? 0)}</div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  total across {sp.realSessions ?? 0} session{sp.realSessions === 1 ? '' : 's'}
                                  {(sp.portalMaxDwellMs ?? 0) > 0 && `, longest ${fmtTime(sp.portalMaxDwellMs ?? 0)}`}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">🎯 Dashboard CTAs</div>
                                <div className="text-xl font-bold text-emerald-700 tabular-nums">{sp.portalCtaClicks ?? 0}</div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  {(sp.portalCtaClicks ?? 0) > 0
                                    ? `top: ${sp.portalTopCtaTarget ?? 'unknown'}`
                                    : 'no CTA clicks on dashboard yet'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">🔍 Sections viewed</div>
                                <div className="text-xl font-bold text-amber-700 tabular-nums">{sp.portalUniqueSections ?? 0}</div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  {sp.scannerSuspect
                                    ? 'scanner pre-fetch — not human'
                                    : (sp.portalUniqueSections ?? 0) >= 5 ? 'deep dive — read the whole page'
                                    : (sp.portalUniqueSections ?? 0) >= 2 ? `scrolled past hero${sp.portalDeepestSection ? ` to ${sp.portalDeepestSection.replace(/-/g, ' ')}` : ''}`
                                    : 'hero only — bounced'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-bold">🔥 Engaged sessions</div>
                                <div className="text-xl font-bold text-[var(--accent)] tabular-nums">{sp.portalEngagedSessions ?? 0}<span className="text-sm text-[var(--muted-foreground)] font-normal ml-1">/ {sp.realSessions ?? 0}</span></div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  sessions {'>'}30s (not a bounce)
                                </div>
                              </div>
                            </div>
                            {/* Free-content signups - attributed from cold-email URL params */}
                            {((sp.preseasonSignups ?? 0) > 0 || (sp.scatCourseSignups ?? 0) > 0) && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-2">🎁 Free-content signups · STRONGEST intent</div>
                                <div className="flex flex-wrap gap-2">
                                  {(sp.preseasonSignups ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                                      🏃 Pre-season baseline signup ×{sp.preseasonSignups}
                                      {sp.preseasonFirstAt && <span className="text-[10px] text-emerald-700/70 font-normal">· {new Date(sp.preseasonFirstAt).toLocaleDateString('en-AU')}</span>}
                                    </span>
                                  )}
                                  {(sp.scatCourseSignups ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                                      📚 Free SCAT course signup ×{sp.scatCourseSignups}
                                      {sp.scatCourseFirstAt && <span className="text-[10px] text-emerald-700/70 font-normal">· {new Date(sp.scatCourseFirstAt).toLocaleDateString('en-AU')}</span>}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-[var(--muted-foreground)] mt-2 italic">Form submitted from a cold-email link — verified buying signal, stronger than a dashboard CTA click.</p>
                              </div>
                            )}

                            <div className="text-[10.5px] text-[var(--muted-foreground)] mt-2 pt-2 border-t border-slate-100">
                              <strong className="text-[var(--foreground)]">Verdict:</strong> {' '}
                              {(sp.portalCtaClicks ?? 0) > 0
                                ? `${sp.portalCtaClicks} dashboard CTA click${sp.portalCtaClicks === 1 ? '' : 's'} = real buying signal. This is the strongest non-cal-booking intent.`
                                : (sp.portalUniqueSections ?? 0) >= 5 && (sp.portalMaxDwellMs ?? 0) >= 60_000
                                  ? `Deep dive (${sp.portalUniqueSections} sections, ${fmtTime(sp.portalMaxDwellMs ?? 0)} longest session) — serious research mode.`
                                  : (sp.portalEngagedSessions ?? 0) >= 1
                                    ? `${sp.portalEngagedSessions} engaged session${sp.portalEngagedSessions === 1 ? '' : 's'} (>30s) — they read it. Soft nudge or let auto-sequence handle.`
                                    : (sp.realSessions ?? 0) > 0
                                      ? `${sp.realSessions} portal session${sp.realSessions === 1 ? '' : 's'} but all under 30s — bounced. Auto-sequence handles.`
                                      : 'No real portal engagement yet — let T2/T3 deliver.'}
                            </div>
                          </div>

                          {/* Email signals — secondary, lower trust */}
                          <div className="bg-slate-50 rounded-lg p-4 mb-4">
                            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Email signals · scanner-prone</div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">URL clicks</div>
                                <div className="text-lg font-bold text-amber-700 tabular-nums">{sp.distinctUrlClicks ?? 0}<span className="text-sm text-[var(--muted-foreground)] font-normal ml-1">/ {sp.totalClicks} raw</span></div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  {(sp.totalClicks ?? 0) > (sp.distinctUrlClicks ?? 0) * 2
                                    ? `${(sp.totalClicks ?? 0) - (sp.distinctUrlClicks ?? 0)} likely scanner pre-fetches`
                                    : 'caps anti-scanner'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Cal.com clicks</div>
                                <div className="text-lg font-bold text-emerald-700 tabular-nums">{sp.calClickDays ?? 0}<span className="text-sm text-[var(--muted-foreground)] font-normal ml-1">days</span></div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  {(sp.calClickDays ?? 0) >= 2 ? 'multi-day = human' : (sp.calClicks ?? 0) > 0 ? '1 day — scanner suspect' : 'none'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Open days</div>
                                <div className="text-lg font-bold text-[var(--foreground)] tabular-nums">{sp.openDays ?? 0}<span className="text-sm text-[var(--muted-foreground)] font-normal ml-1">/ {sp.totalOpens}</span></div>
                                <div className="text-[10.5px] text-[var(--muted-foreground)] leading-snug mt-0.5">
                                  {(sp.openDays ?? 0) >= 2 ? 'real interest' : 'Apple MPP noise possible'}
                                </div>
                              </div>
                            </div>
                            {sp.lastClickedSubject && (
                              <p className="text-[10.5px] text-[var(--muted-foreground)] mt-3 italic">Last email clicked: &quot;{sp.lastClickedSubject}&quot;</p>
                            )}
                          </div>
                          {/* Portal flow funnel — what they viewed, clicked, exited on */}
                          {sp.portalFlow && (Object.keys(sp.portalFlow.sectionFunnel).length > 0 || Object.keys(sp.portalFlow.ctaClicks).length > 0) && (
                            <div className="bg-white rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Section flow · clicks · exits</div>
                                  <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">section_view counts · CTA click destinations · where they left</div>
                                </div>
                                {sp.portalFlow.avgDwellMs != null && (
                                  <div className="text-right">
                                    <div className="text-xs text-[var(--muted-foreground)]">avg session</div>
                                    <div className="text-sm font-bold text-[var(--foreground)]">{fmtTime(sp.portalFlow.avgDwellMs)}</div>
                                  </div>
                                )}
                              </div>
                              {/* Section funnel — ordered by canonical scroll order */}
                              {(() => {
                                const SECTION_ORDER = ['hero', 'credibility', 'trial-cta', 'onsite-hero', 'team-snapshot', 'multidisciplinary', 'pricing', 'risk-reversal', 'local-hub', 'next-step', 'individual-signup', 'footer']
                                const funnel = selectedProspect.portalFlow!.sectionFunnel
                                const exits = selectedProspect.portalFlow!.exitSections
                                const maxN = Math.max(...Object.values(funnel), 1)
                                const ordered = SECTION_ORDER.filter(s => funnel[s])
                                if (ordered.length === 0) return null
                                return (
                                  <div className="space-y-1 mb-3">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold mb-1">Section funnel · exits flagged</div>
                                    {ordered.map(s => {
                                      const n = funnel[s] ?? 0
                                      const ex = exits[s] ?? 0
                                      const pct = (n / maxN) * 100
                                      return (
                                        <div key={s} className="flex items-center gap-2 text-xs">
                                          <div className="w-28 text-[var(--foreground)] capitalize truncate" title={s}>{s.replace(/-/g, ' ')}</div>
                                          <div className="flex-1 bg-slate-100 rounded h-4 relative overflow-hidden">
                                            <div className="absolute inset-y-0 left-0 bg-[var(--accent)] opacity-70" style={{ width: `${pct}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold">
                                              <span className="text-white mix-blend-difference">{n}</span>
                                              {ex > 0 && <span className="text-rose-600">↶ {ex} exit{ex === 1 ? '' : 's'}</span>}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              })()}
                              {/* CTA clicks */}
                              {Object.keys(sp.portalFlow!.ctaClicks).length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold mb-1">CTA clicks</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(sp.portalFlow!.ctaClicks).map(([t, n]) => (
                                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10.5px] font-bold">
                                        {t} <span className="text-[var(--foreground)]/70">×{n}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

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
                        )
                      })()}

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
                      {sentTable.length > 0 && (() => {
                        // Click column header to sort; click again to toggle.
                        const handleSort = (col: SentSortCol) => {
                          if (sentSortCol === col) {
                            setSentSortDir(d => d === 'desc' ? 'asc' : 'desc')
                          } else {
                            setSentSortCol(col)
                            setSentSortDir(col === 'clinic' || col === 'location' || col === 'tier' ? 'asc' : 'desc')
                          }
                        }
                        const sortArrow = (col: SentSortCol) => sentSortCol === col ? (sentSortDir === 'desc' ? ' ↓' : ' ↑') : ''
                        const SortableTh = ({ col, label, align = 'left', title }: { col: SentSortCol; label: string; align?: 'left' | 'right'; title?: string }) => (
                          <th className={`text-${align} px-4 py-3 font-semibold cursor-pointer select-none hover:text-[var(--accent)] transition-colors ${sentSortCol === col ? 'text-[var(--accent)]' : ''}`} onClick={() => handleSort(col)} title={title ?? `Sort by ${label}`}>
                            {label}{sortArrow(col)}
                          </th>
                        )
                        // Column-aware value extractor for sorting.
                        const colVal = (p: ProspectRow, col: SentSortCol): string | number => {
                          switch (col) {
                            case 'clinic':   return p.shortName || ''
                            case 'tier':     {
                              const rank: Record<string, number> = { replied: 6, engaged: 5, hot: 4, warm: 3, won: 2, cold: 1 }
                              return rank[p.engagementTier] ?? 0
                            }
                            case 'location': return `${p.city || ''}, ${p.state || ''}, ${p.region || ''}`
                            case 'team':     return p.clinicalCount ?? 0
                            case 'offer':    return p.dealValue ?? p.recoCohortTotal ?? 0
                            case 'sends':    return p.totalSends ?? 0
                            case 'opens':    return p.totalOpens ?? 0
                            case 'clicks':   return p.totalClicks ?? 0
                            case 'views':    return p.totalPortalViews ?? 0
                            case 'replies':  return p.replies ?? 0
                            case 'lastSent': return p.lastSentAt ? new Date(p.lastSentAt).getTime() : 0
                            case 'status':   return p.status || ''
                            case 'score':    return p.engagementScore ?? 0
                          }
                        }
                        const sortedRows = [...sentTable].sort((a, b) => {
                          const va = colVal(a, sentSortCol)
                          const vb = colVal(b, sentSortCol)
                          let cmp = 0
                          if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
                          else cmp = String(va).localeCompare(String(vb))
                          if (sentSortDir === 'desc') cmp = -cmp
                          // Secondary stable sort: lastSent desc when primary ties
                          if (cmp === 0) {
                            const ta = a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0
                            const tb = b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0
                            return tb - ta
                          }
                          return cmp
                        })
                        return (
                        <div>
                          <SectionTitle title="Outreach sent" subtitle={`Every prospect with at least one send · click column headers to sort · currently: ${sentSortCol} ${sentSortDir}`} />
                          <div className="card rounded-2xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-[rgba(13,115,119,0.04)] text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                                <tr>
                                  <SortableTh col="clinic" label="Clinic" />
                                  <SortableTh col="score" label="Score" align="right" title="Behavioural lead score (HubSpot/Marketo model)" />
                                  <SortableTh col="tier" label="Tier" />
                                  <SortableTh col="location" label="Location" />
                                  <SortableTh col="team" label="Team" align="right" />
                                  <SortableTh col="offer" label="Offer" />
                                  <SortableTh col="sends" label="Sends" align="right" />
                                  <SortableTh col="opens" label="Opens" align="right" />
                                  <SortableTh col="clicks" label="Clicks" align="right" />
                                  <SortableTh col="views" label="Views" align="right" />
                                  <SortableTh col="replies" label="Replies" align="right" />
                                  <SortableTh col="lastSent" label="Last sent" align="right" />
                                  <SortableTh col="status" label="Status" />
                                </tr>
                              </thead>
                              <tbody>
                                {sortedRows.map(p => {
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
                                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                                        <span className={(p.engagementScore ?? 0) >= 25 ? 'text-orange-600' : (p.engagementScore ?? 0) >= 5 ? 'text-amber-600' : 'text-[var(--muted-foreground)]'}>{p.engagementScore ?? 0}</span>
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
                                      <td className="px-4 py-3 text-right tabular-nums">{p.totalOpens || '—'}</td>
                                      <td className="px-4 py-3 text-right tabular-nums">{p.totalClicks > 0 ? <span className="font-bold text-orange-600">{p.totalClicks}</span> : '—'}</td>
                                      <td className="px-4 py-3 text-right tabular-nums">{p.totalPortalViews > 0 ? <span className="font-bold text-[var(--accent)]">{p.totalPortalViews}</span> : '—'}</td>
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
                        )
                      })()}
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
