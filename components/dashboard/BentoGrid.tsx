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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'

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
  const isPreview = accessLevel === 'preview'
  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // For preview users, show SCAT progress
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && p.completed,
  ).length
  // SCAT modules have 0 CPD (free lead gen course)
  const scatCPD = 0
  const scatInProgress = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && !!p.startedAt && !p.completed,
  ).length

  const displayModules = isPreview ? scatCompleted : completedModules
  const displayMaxModules = isPreview ? 3 : 8
  const displayCPD = isPreview ? scatCPD : cpdPoints
  const displayMaxCPD = isPreview ? 0 : 8

  const inProgressCount = isPreview
    ? scatInProgress
    : Object.values(progress).filter(
        (p) => p.moduleId >= 1 && p.moduleId <= 8 && !!p.startedAt && !p.completed,
      ).length

  const pctComplete = Math.round((displayModules / displayMaxModules) * 100)

  return (
    <div className="bento-premium">
      {/* ── 1. Course Progress (wide) ─────────────────── */}
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

      {/* ── 2. CPD Points ───────────────────────────── */}
      <Card href="/learning">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
            <Award className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">{isPreview ? 'Free CPD Points' : 'Online CPD Points'}</p>
        </div>
        <p className="stat-value-accent">
          {displayCPD}<span className="text-base text-muted-foreground font-medium"> / {displayMaxCPD}</span>
        </p>
        <div className="mt-3 progress-track">
          <div className="progress-fill" style={{ width: `${displayMaxCPD > 0 ? (displayCPD / displayMaxCPD) * 100 : 0}%` }} />
        </div>
        {displayModules === displayMaxModules && displayMaxModules > 0 && (
          <p className="text-xs text-accent font-semibold mt-2">All {isPreview ? 'free' : 'online'} points earned</p>
        )}
      </Card>

      {/* ── 3. Study Time ───────────────────────────── */}
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

      {/* ── 4. Learning Suite ───────────────────────── */}
      <Card href="/learning">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">Learning Suite</p>
        </div>
        <p className="text-sm text-foreground font-semibold mb-1">{isPreview ? '3 Free SCAT Modules' : '8 Clinical Modules'}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isPreview
            ? 'SCAT6 & SCOAT6 mastery training — completely free.'
            : 'Evidence-based concussion management training with AHPRA-aligned CPD tracking.'}
        </p>
      </Card>

      {/* ── 5. Clinical Toolkit ─────────────────────── */}
      <Card href="/clinical-toolkit">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            isPreview
              ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
              : 'bg-gradient-to-br from-emerald-500/10 to-emerald-400/5'
          )}>
            {isPreview
              ? <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
              : <FileText className="w-[18px] h-[18px] text-emerald-600/70" strokeWidth={1.8} />
            }
          </div>
          <p className="stat-label mb-0">Clinical Toolkit</p>
          {isPreview && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
              Paid
            </span>
          )}
        </div>
        <p className="text-sm text-foreground font-semibold mb-1">Printable Resources</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assessment templates, return-to-play protocols, and clinical decision aids.
        </p>
      </Card>

      {/* ── 6. SCAT Forms ───────────────────────────── */}
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

      {/* ── 7. Reference Repository (wide) ──────────── */}
      <Card href="/references" span2>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            isPreview
              ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
              : 'bg-gradient-to-br from-amber-500/10 to-amber-400/5'
          )}>
            {isPreview
              ? <Lock className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
              : <Library className="w-5 h-5 text-amber-600/70" strokeWidth={1.8} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="stat-label">Reference Repository</p>
              {isPreview && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                  Paid
                </span>
              )}
            </div>
            <p className="text-sm text-foreground font-semibold mb-1">140+ Peer-Reviewed Sources</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Searchable library of concussion research — journal articles, meta-analyses, and clinical guidelines.
            </p>
          </div>
        </div>
      </Card>

      {/* ── 8. In-Person Workshop ───────────────────── */}
      <WorkshopCard
        accessLevel={accessLevel}
        isPreview={isPreview}
        allModulesComplete={completedModules >= 8}
        workshopLocation={workshopLocation}
        onWorkshopNominated={onWorkshopNominated}
      />
    </div>
  )
}

/* ──────────────── Workshop Card ──────────────── */
function WorkshopCard({
  accessLevel,
  isPreview,
  allModulesComplete,
  workshopLocation,
  onWorkshopNominated,
}: {
  accessLevel?: string
  isPreview: boolean
  allModulesComplete: boolean
  workshopLocation?: string | null
  onWorkshopNominated?: (location: string) => void
}) {
  const isFullCourse = accessLevel === 'full-course'
  const isOnlineOnly = accessLevel === 'online-only'
  const showNomination = isFullCourse && allModulesComplete && !workshopLocation
  const hasNominated = isFullCourse && !!workshopLocation

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
        setFeedback({ type: 'success', message: `Nominated for ${cityLabel(selectedCity)}! We'll email you ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks before your workshop date.` })
        setTimeout(() => onWorkshopNominated?.(selectedCity), 1500)
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
        <p className="text-sm text-foreground font-semibold mb-2">Choose Your Workshop City</p>
        <p className="text-xs text-muted-foreground mb-3">
          Online modules complete. Nominate your city — once {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} clinicians register, we confirm a date.
        </p>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full py-2 px-2.5 rounded-lg border border-border/50 bg-background text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Select city...</option>
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
        <p className="text-sm text-foreground font-semibold mb-1">6 Practical CPD Points</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Nominated for {cityLabel(workshopLocation!)}. You&apos;ll be notified {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks before your workshop date.
        </p>
      </Card>
    )
  }

  // Default: preview/online-only/full-course pre-completion
  return (
    <Card href={isPreview ? '/pricing' : isOnlineOnly ? '/upgrade' : '/in-person'}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          isPreview || isOnlineOnly
            ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
            : 'bg-gradient-to-br from-rose-500/10 to-rose-400/5'
        )}>
          {isPreview || isOnlineOnly
            ? <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
            : <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
          }
        </div>
        <p className="stat-label mb-0">In-Person Workshop</p>
        {isFullCourse && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Included
          </span>
        )}
        {isOnlineOnly && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">
            Upgrade
          </span>
        )}
        {isPreview && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
            Paid
          </span>
        )}
      </div>
      <p className="text-sm text-foreground font-semibold mb-1">6 Practical CPD Points</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isFullCourse && !allModulesComplete
          ? 'Complete your online modules to nominate your workshop city.'
          : isOnlineOnly
          ? 'Add the hands-on workshop to earn all 14 CPD points. SCAT6, VOMS & BESS with expert feedback.'
          : 'Hands-on training with standardised assessments, sideline protocols, and case studies.'}
      </p>
    </Card>
  )
}
