'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Award,
  Clock,
  ArrowUpRight,
  FileText,
  Activity,
  Library,
  GraduationCap,
  Lock,
  MapPin,
  Check,
  Loader2,
  HeartPulse,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import { HubSeatsCard } from '@/components/dashboard/HubSeatsCard'
import { isOwnerEmail } from '@/lib/owner'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { useCourseTier } from './useCourseTier'
import Link from 'next/link'
import { CONFIG, upgradePriceFor, SST_TIER_FROM_AUD } from '@/lib/config'
import { holdsPracticalDaySeat, holdsOnlineWithoutPracticalDay } from '@/lib/practical-day-seat'
import { COURSES, getEffectiveStatus, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'
import { REFERENCE_COUNT } from '@/data/reference-count'
import { epModulesMeta, epProgressId } from '@/data/ep-module-meta'

/* Short-course cross-sell — sourced from the catalogue (single source of truth
   for price + CPD hours) so dashboard copy can never drift from checkout.
   Only surface courses that are effectively LIVE and self-serve purchasable:
   Vagus is 'pilot' / hidden until its funnel exists, so it must not appear here
   (it re-appears automatically the moment its status flips to live). */
const CROSS_SELL_COURSES = ['vagus-nerve']
  .map(id => COURSES.find(c => c.id === id))
  .filter((c): c is NonNullable<typeof c> =>
    !!c && c.purchasableViaCheckout && getEffectiveStatus(c) === 'live')

/* ──────────────── Micro Progress Ring ──────────────── */
function MicroRing({ value, max, size = 40 }: { value: number; max: number; size?: number }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="ring-fill"
        strokeWidth={4}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  )
}

/* ──────────────── Card Wrapper ──────────────── */
interface CardProps {
  children: React.ReactNode
  className?: string
  href?: string
  onClick?: () => void
  span2?: boolean
}

function Card({ children, className, href, onClick, span2 }: CardProps) {
  const isInteractive = !!href || !!onClick
  const inner = (
    <>
      {children}
      {isInteractive && (
        <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      )}
    </>
  )

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className={cn(
          'glass-premium rounded-2xl relative overflow-hidden group',
          span2 && 'bento-span-2',
          className,
        )}
      >
        <Link href={href} className="block p-5 sm:p-6">
          {inner}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={onClick ? { y: -3 } : undefined}
      onClick={onClick}
      className={cn(
        'glass-premium rounded-2xl p-5 sm:p-6 relative overflow-hidden group',
        onClick && 'cursor-pointer',
        span2 && 'bento-span-2',
        className,
      )}
    >
      {inner}
    </motion.div>
  )
}

/* ──────────────── Section Label ────────────────
   Groups the quick-reference home into its three pillars: Courses, Clinical
   Tools, Documents & Reference. Each pillar's tiles click straight into the
   relevant content. */
function SectionLabel({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/12 to-accent/4 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-accent" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-foreground leading-none tracking-tight">{title}</h3>
        <p className="text-[11px] text-muted-foreground leading-none mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

/* ──────────────── Main Bento Grid ──────────────── */
export function BentoGrid({ accessLevel: accessLevelProp, workshopLocation, onWorkshopNominated }: {
  accessLevel?: string
  workshopLocation?: string | null
  onWorkshopNominated?: (location: string) => void
}) {
  const { user } = useSession()
  const {
    getTotalCompletedModules,
    getTotalCPDPoints,
    getTotalStudyTime,
    progress,
  } = useProgress()

  const accessLevel = user?.accessLevel || accessLevelProp || ''
  const { isFreeTier: bentoFreeTier, ownsCrm: bentoOwnsCrm, isCcmPaid: isCcmPaidTier } = useCourseTier(accessLevel)
  const isPreview = bentoFreeTier

  // SST Trainer + Clinical Testing must stay invisible to EVERYONE but the owner
  // until the clinical suite launches — including paid users (owner directive).
  // Same gate the sidebar uses: 'unreleased' for all non-owners while
  // SST_CLINICAL_LIVE is off, so the whole Clinical Tools card is hidden.
  const clinicalAccess = useClinicalAccess()
  const showClinicalTools = ['owner', 'course', 'sst'].includes(clinicalAccess)

  // SST Trainer subscription — HIDDEN until launch. Flip
  // NEXT_PUBLIC_SST_SUBSCRIPTIONS_LIVE=true AND set the Stripe price IDs to
  // reveal this card. The /api/sst/subscribe route is independently guarded on
  // the real price IDs, so current paid users never see or hit it pre-launch.
  const sstLive = process.env.NEXT_PUBLIC_SST_SUBSCRIPTIONS_LIVE === 'true'
  // Clinical Hub launch flag — when on, the "Clinical Toolkit" bento becomes the
  // Clinical Hub entry (/clinical-hub) and the printable docs fold in as a tab.
  // Off (default) → paid users keep seeing the static docs Toolkit.
  const clinicalHubLive = process.env.NEXT_PUBLIC_CLINICAL_HUB_LIVE === 'true'
  const hubForPaid = clinicalHubLive && !isPreview
  const [sstLoading, setSstLoading] = useState<null | 'monthly' | 'annual'>(null)
  const startSstCheckout = async (plan: 'monthly' | 'annual') => {
    setSstLoading(plan)
    try {
      const res = await fetch('/api/sst/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (data?.url) window.location.href = data.url
      else setSstLoading(null)
    } catch {
      setSstLoading(null)
    }
  }

  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // For preview users, show SCAT progress
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && p.completed,
  ).length
  // SCAT course = 1 CPD hour (awarded on completing all 3 modules)
  const scatCPD = scatCompleted === 3 ? 1 : 0
  const scatInProgress = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && !!p.startedAt && !p.completed,
  ).length

  // CRM (EP) buyers are access_level 'preview' but own an 8-module paid stream
  // namespaced 201-208 — counting them off the CCM 1-8 range left their tiles
  // reading 0/8 forever, and counting them as free showed SCAT stats.
  const crmCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 201 && p.moduleId <= 208 && p.completed,
  ).length
  const crmInProgress = Object.values(progress).filter(
    (p) => p.moduleId >= 201 && p.moduleId <= 208 && !!p.startedAt && !p.completed,
  ).length
  // CPD is NOT the module count. CRM module points are 1 / 0.5 / 1.5 / 1.5 / 1 /
  // 1 / 1 / 0.5 — using crmCompleted as the hours figure made /dashboard
  // disagree with /ep-course/dashboard (which sums points correctly) for every
  // partially-complete CRM buyer. Sum the same source of truth.
  const completedCrmIds = new Set(
    Object.values(progress)
      .filter((p) => p.moduleId >= 201 && p.moduleId <= 208 && p.completed)
      .map((p) => p.moduleId),
  )
  const crmCPD = epModulesMeta
    .filter((m) => completedCrmIds.has(epProgressId(m.id)))
    .reduce((sum, m) => sum + m.points, 0)
  const streamCompleted = bentoOwnsCrm && !isCcmPaidTier ? crmCompleted : completedModules

  const displayModules = isPreview ? scatCompleted : streamCompleted
  const displayMaxModules = isPreview ? 3 : 8
  const displayCPD = isPreview ? scatCPD : bentoOwnsCrm && !isCcmPaidTier ? crmCPD : cpdPoints
  // Free SCAT6 Mastery course = 1 CPD hour (awarded when all 3 modules complete).
  const displayMaxCPD = isPreview ? 1 : 8
  // The CPD hour is awarded all-at-once on completion, so for preview users the
  // bar tracks module completion toward that 1 hour (honest progress, not a
  // fractional CPD claim).
  const cpdBarPct = isPreview
    ? (scatCompleted / 3) * 100
    : displayMaxCPD > 0 ? (displayCPD / displayMaxCPD) * 100 : 0

  const inProgressCount = isPreview
    ? scatInProgress
    : bentoOwnsCrm && !isCcmPaidTier
    ? crmInProgress
    : Object.values(progress).filter(
        (p) => p.moduleId >= 1 && p.moduleId <= 8 && !!p.startedAt && !p.completed,
      ).length

  const pctComplete = Math.round((displayModules / displayMaxModules) * 100)

  const clinicalToolkitHref = hubForPaid && isOwnerEmail(user?.email) ? '/clinical-testing' : '/clinical-toolkit'

  // The /clinical-toolkit and /references pages are CCM entitlements:
  // lib/toolkit-access.ts and /references admit online-only / full-course /
  // book-owner ONLY. Styling them off `isPreview` (free tier) rendered them
  // fully unlocked — emerald icon, no chip — for a CRM buyer, who is neither
  // free nor admitted, so the two tiles a paying EP customer is most likely to
  // click both dead-ended on a locked screen selling them the other course.
  // A CRM buyer isn't locked out of a toolkit or a reference library, though —
  // theirs live in their own stream, and those pages let them straight in.
  const crmOnlyTier = bentoOwnsCrm && !isCcmPaidTier
  const ccmToolsLocked = !isCcmPaidTier && !crmOnlyTier
  const toolkitHref = crmOnlyTier
    ? '/ep-course/toolkit'
    : ccmToolsLocked
      ? '/pricing'
      : clinicalToolkitHref
  const referencesHref = crmOnlyTier ? '/ep-course/references' : '/references'

  return (
    <div className="space-y-8">
      {/* ═══ Quick stats strip — where you are, at a glance ═══ */}
      <div className="bento-premium">
        {/* Course Progress (wide) */}
        <Card href="/learning" span2>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <MicroRing value={displayModules} max={displayMaxModules} size={56} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                {pctComplete}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="stat-label">{isPreview ? 'SCAT Course Progress' : 'Course Progress'}</p>
              <p className="stat-value">{displayModules} <span className="text-base font-medium text-muted-foreground">/ {displayMaxModules} modules</span></p>
              <div className="mt-3">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pctComplete}%` }} />
                </div>
              </div>
              {inProgressCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {inProgressCount} module{inProgressCount > 1 ? 's' : ''} in progress
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Hub Pack owner seat visibility — renders null for non-owners */}
        <HubSeatsCard />

        {/* CPD Hours */}
        <Card href="/learning">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
              <Award className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
            </div>
            <p className="stat-label mb-0">{isPreview ? 'Free CPD Hours' : 'Online CPD Hours'}</p>
          </div>
          <p className="stat-value-accent">
            {displayCPD}<span className="text-base text-muted-foreground font-medium"> / {displayMaxCPD}</span>
          </p>
          <div className="mt-3 progress-track">
            <div className="progress-fill" style={{ width: `${cpdBarPct}%` }} />
          </div>
          {displayModules === displayMaxModules && displayMaxModules > 0 ? (
            <p className="text-xs text-accent font-semibold mt-2">All {isPreview ? 'free' : 'online'} points earned</p>
          ) : isPreview ? (
            <p className="text-xs text-muted-foreground mt-2">1 CPD hour awarded on completing all 3 modules</p>
          ) : null}
        </Card>

        {/* Study Time */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-blue-600/70" strokeWidth={1.8} />
            </div>
            <p className="stat-label mb-0">Study Time</p>
          </div>
          {studyTime < 0.1 ? (
            <>
              <p className="stat-value text-lg">Start Learning</p>
              <p className="text-xs text-muted-foreground mt-1">Your study hours appear here</p>
            </>
          ) : (
            <>
              <p className="stat-value">{studyTime.toFixed(1)}<span className="text-base font-medium text-muted-foreground"> hrs</span></p>
              <p className="text-xs text-muted-foreground mt-1">Active learning time</p>
            </>
          )}
        </Card>
      </div>

      {/* ═══ PILLAR 1 — COURSES ═══ */}
      <section>
        <SectionLabel icon={BookOpen} title="Courses" subtitle="Your training, CPD and workshop" />
        <div className="bento-premium">
          {/* Learning Suite — entry to all courses (CCM / CRM / free SCAT) */}
          <Card href="/learning" span2>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-accent" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="stat-label">Learning Suite</p>
                <p className="text-sm text-foreground font-semibold mb-1">{isPreview ? '3 Free SCAT Modules' : 'All your courses & modules'}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isPreview
                    ? 'SCAT6 & SCOAT6 mastery training — completely free. Enrol to unlock the full 8-module clinical course.'
                    : 'Concussion Clinical Mastery, SCAT6/SCOAT6 training and specialty courses — with AHPRA-aligned CPD certificates.'}
                </p>
              </div>
            </div>
          </Card>

          {/* In-Person Workshop */}
          <WorkshopCard
            accessLevel={accessLevel}
            hubPackSeat={user?.hubPackSeat === true}
            isPreview={isPreview}
            allModulesComplete={completedModules >= 8}
            workshopLocation={workshopLocation}
            onWorkshopNominated={onWorkshopNominated}
          />

          {/* More CPD from CEA — short-course cross-sell */}
          {CROSS_SELL_COURSES.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-400/5 flex items-center justify-center">
                  <GraduationCap className="w-[18px] h-[18px] text-teal-600/70" strokeWidth={1.8} />
                </div>
                <p className="stat-label mb-0">More CPD from CEA</p>
              </div>
              <p className="text-sm text-foreground font-semibold mb-3">Short specialty courses</p>
              <div className="space-y-2">
                {CROSS_SELL_COURSES.map(c => (
                  <Link
                    key={c.id}
                    href={c.route}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white/50 px-3.5 py-2.5 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-foreground leading-tight truncate">{c.title}</span>
                      <span className="block text-[11px] text-muted-foreground leading-tight">
                        {c.cpdHours} CPD {c.cpdHours === 1 ? 'hr' : 'hrs'}{getEffectivePrice(c).price !== null && <> · A${getEffectivePrice(c).price!.toLocaleString('en-AU')}</>}
                      </span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-600/60 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* ═══ PILLAR 2 — CLINICAL TOOLS ═══ */}
      <section>
        <SectionLabel icon={Stethoscope} title="Clinical Tools" subtitle="Instruments to assess & manage patients" />
        <div className="bento-premium">
          {/* In-clinic instruments (SST Trainer + baseline). PRE-RELEASE:
              owner/clinical-access only — hidden entirely from everyone else
              (owner directive: unfinished tools must not appear usable). */}
          {showClinicalTools && (
            <Card span2 className="border border-emerald-200/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 flex items-center justify-center">
                  <Stethoscope className="w-[18px] h-[18px] text-emerald-600/70" strokeWidth={1.8} />
                </div>
                <p className="stat-label mb-0">In-Clinic Instruments</p>
              </div>
              <p className="text-sm text-foreground font-semibold mb-3">Assessment &amp; rehab — use with your patients</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link href="/preseason" className="flex items-center gap-2.5 rounded-xl border border-border bg-white/50 px-3.5 py-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors">
                  <FileText className="w-4 h-4 text-emerald-600/70 flex-shrink-0" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground leading-tight">Baseline Testing</span>
                    <span className="block text-[11px] text-muted-foreground leading-tight">SCAT6 baselines · initial exam</span>
                  </span>
                </Link>
                <Link href="/sst-trainer" className="flex items-center gap-2.5 rounded-xl border border-border bg-white/50 px-3.5 py-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors">
                  <Stethoscope className="w-4 h-4 text-emerald-600/70 flex-shrink-0" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground leading-tight">SST Trainer</span>
                    <span className="block text-[11px] text-muted-foreground leading-tight">Sub-symptom-threshold rehab · wearable</span>
                  </span>
                </Link>
              </div>
            </Card>
          )}

          {/* Preview/free-course users: locked instruments teaser — the carrot.
              They're learning to ASSESS; the tools to MANAGE come with the course. */}
          {!showClinicalTools && isPreview && (
            <Card href="/pricing" span2 className="border border-amber-200/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center">
                  <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
                </div>
                <p className="stat-label mb-0">In-Clinic Instruments</p>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                  Paid
                </span>
              </div>
              <p className="text-sm text-foreground font-semibold mb-1">The tools to manage what you learn to assess</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                SST Trainer (heart-rate-paced rehab) and SCAT6 baseline testing come with the full course — the instruments to manage patients through recovery, not just diagnose them. Enrol to unlock the course; the clinical suite is included and available now.
              </p>
            </Card>
          )}

          {/* SST Trainer subscription (HIDDEN until launch) */}
          {sstLive && (
            <Card span2 className="border border-accent/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center flex-shrink-0">
                  <HeartPulse className="w-[20px] h-[20px] text-accent" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-foreground font-semibold">SST Trainer</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 uppercase tracking-wider">
                      Subscription
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Prescribe heart-rate-paced, sub-symptom-threshold exercise rehab and track your patients&apos; recovery. Manage sessions right here in your dashboard.
                  </p>
                  {/* 2026-08-04 audit P1-2: the old monthly/annual plan buttons
                      posted a plan the API no longer accepts and swallowed the
                      400 silently. Route to the live tier page instead. */}
                  <a href="/clinical-testing/subscribe" className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 transition">
                    View clinic plans — from A${SST_TIER_FROM_AUD}/month
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* SCAT Forms — digital assessment, available to all */}
          <Card href="/scat-forms">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-400/5 flex items-center justify-center">
                <Activity className="w-[18px] h-[18px] text-violet-600/70" strokeWidth={1.8} />
              </div>
              <p className="stat-label mb-0">SCAT Forms</p>
            </div>
            <p className="text-sm text-foreground font-semibold mb-1">Digital Assessment</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SCAT6, Child SCAT6, and SCOAT6 — fillable and downloadable.
            </p>
          </Card>
        </div>
      </section>

      {/* ═══ PILLAR 3 — DOCUMENTS & REFERENCE (doc output) ═══ */}
      <section>
        <SectionLabel icon={FileText} title="Documents & Reference" subtitle="Printable resources & the evidence base" />
        <div className="bento-premium">
          {/* Clinical Toolkit → becomes Clinical Hub when launched.
              Bare /clinical-hub renders the DEMO roster — route paid users
              through Clinical Testing, which owns their real code + hub link. */}
          <Card href={toolkitHref} span2>
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                ccmToolsLocked
                  ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
                  : 'bg-gradient-to-br from-emerald-500/10 to-emerald-400/5'
              )}>
                {ccmToolsLocked
                  ? <Lock className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
                  : hubForPaid
                    ? <Stethoscope className="w-5 h-5 text-emerald-600/70" strokeWidth={1.8} />
                    : <FileText className="w-5 h-5 text-emerald-600/70" strokeWidth={1.8} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="stat-label">{hubForPaid ? 'Clinical Hub' : 'Clinical Toolkit'}</p>
                  {ccmToolsLocked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                      Paid
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground font-semibold mb-1">
                  {hubForPaid ? 'Manage your patients' : 'Printable clinical resources'}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hubForPaid
                    ? 'SST programs, SCAT6 baselines and recovery tracking — plus your printable resources.'
                    : 'Assessment templates, return-to-play protocols, referral letters and clinical decision aids — ready to print or hand to a patient.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Reference Repository — CCM entitlement; see ccmToolsLocked. */}
          <Card href={referencesHref}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                ccmToolsLocked
                  ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
                  : 'bg-gradient-to-br from-amber-500/10 to-amber-400/5'
              )}>
                {ccmToolsLocked
                  ? <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
                  : <Library className="w-[18px] h-[18px] text-amber-600/70" strokeWidth={1.8} />
                }
              </div>
              <p className="stat-label mb-0">Reference Repository</p>
              {ccmToolsLocked && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                  Paid
                </span>
              )}
            </div>
            {/* REFERENCE_COUNT is the CCM repository's count. A CRM buyer is
                sent to /ep-course/references, a different corpus — quoting the
                CCM number at them would be a figure we can't stand behind. */}
            <p className="text-sm text-foreground font-semibold mb-1">
              {crmOnlyTier ? 'The cited evidence base' : `${REFERENCE_COUNT} Peer-Reviewed Sources`}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Searchable library of concussion research — journal articles, meta-analyses, and clinical guidelines.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

/* ──────────────── Workshop Card ──────────────── */
function WorkshopCard({
  accessLevel,
  hubPackSeat,
  isPreview,
  allModulesComplete,
  workshopLocation,
  onWorkshopNominated,
}: {
  accessLevel?: string
  hubPackSeat?: boolean
  isPreview: boolean
  allModulesComplete: boolean
  workshopLocation?: string | null
  onWorkshopNominated?: (location: string) => void
}) {
  // "Owns the in-person day" is NOT the same as "has paid course access": a
  // Clinic Hub Pack seat is 'full-course' but bought ONLINE seats only, with
  // the practical day sold separately (lib/practical-day-seat.ts).
  const holdsSeat = holdsPracticalDaySeat({ accessLevel, hubPackSeat })
  const needsPracticalDay = holdsOnlineWithoutPracticalDay({ accessLevel, hubPackSeat })
  const isHubPackSeat = needsPracticalDay && accessLevel === 'full-course'
  const showNomination = holdsSeat && allModulesComplete && !workshopLocation
  const hasNominated = holdsSeat && !!workshopLocation

  const [selectedCity, setSelectedCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const cityLabel = (slug: string) => {
    const match = Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === slug)
    return match ? match.city : slug
  }

  const handleNominate = async () => {
    if (!selectedCity) return
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/workshop/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: selectedCity }),
      })
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: needsPracticalDay
            ? `Nominated for ${cityLabel(selectedCity)} — costs nothing. You'll get first notice the moment a ${cityLabel(selectedCity)} date is scheduled.`
            : `Nominated for ${cityLabel(selectedCity)}! When your city's round fills we confirm a date and give you ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice.`,
        })
        // Only a PAID practical-day seat sets workshop_location — don't flip
        // the parent's state for an interest-only nomination (online-only, or
        // a Clinic Hub Pack seat that hasn't bought the add-on).
        if (holdsSeat) setTimeout(() => onWorkshopNominated?.(selectedCity), 1500)
      } else {
        setFeedback({ type: 'error', message: 'Failed to save. Please try again.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error. Please check your connection.' })
    } finally {
      setSaving(false)
    }
  }

  // Full-course user who completed online — show nomination
  if (showNomination) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">Workshop Ready</p>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Nominate
          </span>
        </div>
        <p className="text-sm text-foreground font-semibold mb-2">Nominate Your Workshop City</p>
        <p className="text-xs text-muted-foreground mb-3">
          Online modules complete. Nominate your city — a date is confirmed once your city&apos;s round fills. This is a nomination, not a scheduled date.
        </p>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full py-2 px-2.5 rounded-lg border border-border/50 bg-background text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Nominate a city...</option>
          {/* All cities stay listed (including ones whose last round has run) —
              this is a Ready-to-Train NOMINATION selector, not a scheduled-date
              picker. A completed city simply starts collecting for its next round. */}
          {Object.values(CONFIG.LOCATIONS).map(loc => (
            <option key={loc.slug} value={loc.slug}>{loc.city}</option>
          ))}
        </select>
        <button
          onClick={handleNominate}
          disabled={!selectedCity || saving || feedback?.type === 'success'}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Nominate City'}
        </button>
        {feedback && (
          <p className={cn(
            'text-[11px] mt-2 font-medium',
            feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {feedback.message}
          </p>
        )}
      </Card>
    )
  }

  // Paid ONLINE access without a practical-day seat — classic online-only
  // buyers AND Clinic Hub Pack seats (the pack sells online seats; the day is
  // a separate per-clinician add-on). No-charge city nomination (a demand
  // signal + first notice), with the paid add-on as the SECONDARY action —
  // never push pre-paying to wait indefinitely for a sparse city to fill.
  //
  // This branch is what un-suppresses the add-on for a hub seat: before the
  // hubPackSeat signal existed they rendered as full-course, saw "Included",
  // and had no route to buy the practical day at all.
  if (needsPracticalDay) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">In-Person Workshop</p>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
            {isHubPackSeat ? 'Add-on' : 'Upgrade'}
          </span>
        </div>
        <p className="text-sm text-foreground font-semibold mb-2">Nominate Your Workshop City</p>
        <p className="text-xs text-muted-foreground mb-3">
          {isHubPackSeat
            ? `Your clinic's pack covers the ${CONFIG.COURSE.ONLINE_CPD_POINTS} online CPD hours. Nominating costs nothing and counts toward launching your city's date — the practical day is a separate add-on.`
            : 'Nominating costs nothing and counts toward launching your city\u2019s date — you\u2019ll get first notice when it\u2019s scheduled. Add the hands-on day whenever you\u2019re ready.'}
        </p>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full py-2 px-2.5 rounded-lg border border-border/50 bg-background text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Nominate a city...</option>
          {Object.values(CONFIG.LOCATIONS).map(loc => (
            <option key={loc.slug} value={loc.slug}>{loc.city}</option>
          ))}
        </select>
        <button
          onClick={handleNominate}
          disabled={!selectedCity || saving || feedback?.type === 'success'}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Nominate City'}
        </button>
        {feedback && (
          <p className={cn(
            'text-[11px] mt-2 font-medium',
            feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {feedback.message}
          </p>
        )}
        <Link
          href={isHubPackSeat ? '/in-person' : '/upgrade'}
          className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-accent hover:underline"
        >
          {isHubPackSeat
            // Clinic add-on price, not the solo upgrade — and there is no
            // self-serve checkout for it (lib/schemas.ts marks
            // 'clinic-workshop-upgrade' unfulfilled), so this informs rather
            // than pretending to sell.
            ? `Add the practical day — A$${CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE}/clinician`
            : `Ready now? Add the workshop — $${upgradePriceFor(selectedCity || null)} early-bird`}
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </Card>
    )
  }

  // Full-course user who has nominated
  if (hasNominated) {
    return (
      <Card href="/in-person">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-400/5 flex items-center justify-center">
            <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">In-Person Workshop</p>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            <Check className="w-2.5 h-2.5 inline mr-0.5" />{cityLabel(workshopLocation!)}
          </span>
        </div>
        <p className="text-sm text-foreground font-semibold mb-1">{CONFIG.COURSE.IN_PERSON_CPD_POINTS} Practical CPD Hours</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Nominated for {cityLabel(workshopLocation!)}. We confirm a date once the round fills — you&apos;ll get {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&apos; notice.
        </p>
      </Card>
    )
  }

  // Default: preview / online-without-the-day / seat-holder pre-completion
  return (
    <Card href={isPreview ? '/pricing' : needsPracticalDay ? '/in-person' : '/in-person'}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          isPreview || needsPracticalDay
            ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
            : 'bg-gradient-to-br from-rose-500/10 to-rose-400/5'
        )}>
          {isPreview || needsPracticalDay
            ? <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
            : <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
          }
        </div>
        <p className="stat-label mb-0">In-Person Workshop</p>
        {holdsSeat && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Included
          </span>
        )}
        {needsPracticalDay && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
            {isHubPackSeat ? 'Add-on' : 'Upgrade'}
          </span>
        )}
        {isPreview && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
            Paid
          </span>
        )}
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">{CONFIG.COURSE.IN_PERSON_CPD_POINTS} Practical CPD Hours</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {holdsSeat && !allModulesComplete
          ? 'Complete your online modules to nominate your workshop city.'
          : isHubPackSeat
          // The Hub Pack sells online seats; the practical day is the clinic
          // add-on, priced per clinician from CONFIG (never hardcoded).
          ? `Your clinic's pack covers the ${CONFIG.COURSE.ONLINE_CPD_POINTS} online CPD hours. Add the practical day for A$${CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE}/clinician to reach all ${CONFIG.COURSE.TOTAL_CPD_POINTS}.`
          : needsPracticalDay
          ? `Add the hands-on workshop to earn all ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours. SCAT6, VOMS & BESS with expert feedback.`
          : 'Hands-on training with standardised assessments, sideline protocols, and case studies.'}
      </p>
    </Card>
  )
}
