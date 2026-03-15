'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Activity,
  Library,
  GraduationCap,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { useRouter } from 'next/navigation'

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
  onClick?: () => void
  span2?: boolean
}

function Card({ children, className, onClick, span2 }: CardProps) {
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
      {children}
      {onClick && (
        <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      )}
    </motion.div>
  )
}

/* ──────────────── Main Bento Grid ──────────────── */
export function BentoGrid({ accessLevel }: { accessLevel?: string }) {
  const router = useRouter()
  const {
    getTotalCompletedModules,
    getTotalCPDPoints,
    getTotalStudyTime,
    progress,
  } = useProgress()

  const isPreview = accessLevel === 'preview'
  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // For preview users, show SCAT progress
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 105 && p.completed,
  ).length
  // Modules 101-104 are 0.5 CPD each, Module 105 is 0 CPD
  const scatCPD = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 104 && p.completed,
  ).length * 0.5
  const scatInProgress = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 105 && !!p.startedAt && !p.completed,
  ).length

  const displayModules = isPreview ? scatCompleted : completedModules
  const displayMaxModules = isPreview ? 5 : 8
  const displayCPD = isPreview ? scatCPD : cpdPoints
  const displayMaxCPD = isPreview ? 2 : 8

  const inProgressCount = isPreview
    ? scatInProgress
    : Object.values(progress).filter(
        (p) => p.moduleId >= 1 && p.moduleId <= 8 && !!p.startedAt && !p.completed,
      ).length

  const pctComplete = Math.round((displayModules / displayMaxModules) * 100)

  return (
    <div className="bento-premium">
      {/* ── 1. Course Progress (wide) ─────────────────── */}
      <Card onClick={() => router.push('/learning')} span2>
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
      <Card onClick={() => router.push('/learning')}>
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
      <Card onClick={() => router.push('/learning')}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} />
          </div>
          <p className="stat-label mb-0">Learning Suite</p>
        </div>
        <p className="text-sm text-foreground font-semibold mb-1">{isPreview ? '5 Free SCAT Modules' : '8 Clinical Modules'}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isPreview
            ? 'SCAT6 & SCOAT6 mastery training — earn 2 free CPD points.'
            : 'Evidence-based concussion management training with AHPRA-aligned CPD tracking.'}
        </p>
      </Card>

      {/* ── 5. Clinical Toolkit ─────────────────────── */}
      <Card onClick={() => router.push(isPreview ? '/pricing' : '/clinical-toolkit')} className={isPreview ? 'opacity-60' : undefined}>
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
      <Card onClick={() => router.push('/scat-forms')}>
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
      <Card onClick={() => router.push(isPreview ? '/pricing' : '/references')} span2 className={isPreview ? 'opacity-60' : undefined}>
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
            <p className="text-sm text-foreground font-semibold mb-1">150+ Peer-Reviewed Sources</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Searchable library of concussion research — journal articles, meta-analyses, and clinical guidelines.
            </p>
          </div>
        </div>
      </Card>

      {/* ── 8. In-Person Workshop ───────────────────── */}
      <Card onClick={() => router.push(isPreview ? '/pricing' : '/in-person')} className={isPreview ? 'opacity-60' : undefined}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            isPreview
              ? 'bg-gradient-to-br from-slate-200/50 to-slate-100/50'
              : 'bg-gradient-to-br from-rose-500/10 to-rose-400/5'
          )}>
            {isPreview
              ? <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
              : <GraduationCap className="w-[18px] h-[18px] text-rose-600/70" strokeWidth={1.8} />
            }
          </div>
          <p className="stat-label mb-0">In-Person Workshop</p>
          {accessLevel === 'full-course' && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Included
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
          Hands-on training with standardised assessments, sideline protocols, and case studies.
        </p>
      </Card>
    </div>
  )
}
