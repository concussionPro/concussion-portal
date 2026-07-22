'use client'

/**
 * Course overview / dashboard for the private "Concussion Rehab Mastery" course
 * (Exercise Physiologist edition). This is the landing surface a normal user — or
 * an ESSA reviewer arriving via /demo/essa (demo_key cookie) — sees first, mirroring
 * the flagship /learning dashboard rather than dumping straight into Module 1.
 *
 * Access gating replicates app/ep-course/modules/[id]/page.tsx: we check
 * /api/auth/session (which returns a synthetic full-course demo viewer when the
 * demo_key cookie is present). Unauthenticated visitors get the same upgrade-offer
 * screen the module pages show.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Brain,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  Loader2,
  Library,
  Wrench,
  FileText,
  Lock,
  PlayCircle,
  Sparkles,
  X,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react'
import { getEpModulesMeta, epProgressId } from '@/data/ep-modules'
import { useProgress } from '@/contexts/ProgressContext'
import { cn } from '@/lib/utils'
import { CONFIG } from '@/lib/config'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Upgrade offer for unauthenticated visitors — mirrors the module page screen.
function UpgradeOfferScreen({ router }: { router: AppRouterInstance }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border-2 border-slate-700 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Professional CPD Course</h1>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              This course is part of our{' '}
              <strong className="text-white">complete 8-module professional program</strong>. Get
              instant access to all modules, downloadable resources, and earn{' '}
              <strong className="text-white">up to 8 AHPRA CPD hours</strong>.
            </p>
            <a
              href={CONFIG.SHOP_URL}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 mb-4"
            >
              View Course Details &amp; Enrol
              <ArrowRight className="w-5 h-5" />
            </a>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-slate-300 text-sm mb-4">Looking for free training?</p>
              <button
                onClick={() => router.push('/scat-mastery')}
                className="text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                Try Our Free SCAT6 Course →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function EpCourseDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Replicate the module page's access gate: /api/auth/session returns a synthetic
  // full-course demo viewer when the demo_key cookie is present.
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            // Preview users have no access to the paid EP course — route them to
            // Module 1, which serves a truncated preview just like the module page.
            if (data.user.accessLevel === 'preview') {
              router.push('/ep-course/modules/1')
              return
            }
            setIsAuthenticated(true)
            setCheckingAuth(false)
            return
          }
        }
        setIsAuthenticated(false)
        setCheckingAuth(false)
      } catch {
        setIsAuthenticated(false)
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <UpgradeOfferScreen router={router} />
  }

  return <DashboardContent />
}

// Circular progress ring — the centrepiece of the progress panel.
function ProgressRing({ pct }: { pct: number }) {
  const size = 132
  const stroke = 11
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ep-progress-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ep-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{pct}%</span>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Complete</span>
      </div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { isModuleComplete, getModuleProgress } = useProgress()
  const modules = getEpModulesMeta()
  const [showCert, setShowCert] = useState(false)

  // Meta ids are DISPLAY ids (1-8) for URLs/labels; the shared progress store
  // namespaces EP modules to 201-208 — always read progress via epProgressId.
  const isEpComplete = (displayId: number) => isModuleComplete(epProgressId(displayId))

  const totalModules = modules.length
  const completedCount = modules.filter((m) => isEpComplete(m.id)).length
  const totalCPD = modules.reduce((sum, m) => sum + m.points, 0)
  const earnedCPD = modules
    .filter((m) => isEpComplete(m.id))
    .reduce((sum, m) => sum + m.points, 0)
  const pct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  // Primary "Continue"/"Start" affordance: the first in-progress module, else the
  // first not-yet-completed module.
  const inProgressModule = modules.find((m) => {
    const p = getModuleProgress(epProgressId(m.id))
    return p.startedAt !== null && !isEpComplete(m.id)
  })
  const nextModule = inProgressModule || modules.find((m) => !isEpComplete(m.id))
  const allComplete = completedCount === totalModules
  const notStarted = completedCount === 0 && !inProgressModule

  const goToModule = (id: number) => router.push(`/ep-course/modules/${id}`)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 w-full overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Editorial hero */}
          <div className="mb-8">
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-[0.14em]">
                  Concussion Education Australia · CPD — 8 hours
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 pl-3.5">
                ESSA endorsement pending — under review by two ESSA-appointed reviewers; no endorsement is currently held or claimed.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 items-center justify-center shadow-md shadow-teal-500/20">
                <Brain className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-[1.7rem] sm:text-4xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                  Concussion Rehab Mastery
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2.5 leading-relaxed max-w-2xl">
                  Evidence-based concussion rehabilitation for exercise physiologists. {totalModules}{' '}
                  clinical modules, taken at your own pace — up to {totalCPD} CPD hours on completion.
                </p>
              </div>
            </div>
          </div>

          {/* Progress panel — ring + stat tiles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-9">
              <ProgressRing pct={pct} />
              <div className="flex-1 w-full grid grid-cols-3 gap-3 sm:gap-5">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {completedCount}
                    <span className="text-lg text-slate-300 font-semibold"> / {totalModules}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Modules complete</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {earnedCPD}
                    <span className="text-lg text-slate-300 font-semibold"> / {totalCPD}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">CPD hours earned</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {totalModules - completedCount}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Modules remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary continue / start affordance */}
          {nextModule && !allComplete && (
            <button
              onClick={() => goToModule(nextModule.id)}
              className="w-full text-left mb-9 group rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center gap-5 transition-all hover:shadow-xl hover:shadow-slate-900/15"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
                <PlayCircle className="w-6 h-6 text-teal-300" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-teal-300 uppercase tracking-[0.12em] mb-1">
                  {notStarted ? 'Start the course' : 'Continue where you left off'}
                </div>
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  Module {nextModule.id}: {nextModule.title}
                </div>
                <div className="text-sm text-slate-400 mt-0.5 truncate">{nextModule.subtitle}</div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-bold flex-shrink-0 group-hover:gap-2.5 transition-all">
                {notStarted ? 'Begin' : 'Resume'}
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          )}

          {allComplete && (
            <div className="mb-9 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 p-6 flex items-center gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-slate-900">Course complete</div>
                <div className="text-sm text-slate-600 mt-0.5">
                  You&apos;ve finished all {totalModules} modules and earned {totalCPD} CPD hours. Your certificate is on its way.
                </div>
              </div>
            </div>
          )}

          {/* Module list */}
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
              Course Modules
            </h2>
            <span className="text-xs text-slate-400 font-medium">{completedCount} of {totalModules} done</span>
          </div>
          <div className="space-y-3 mb-12">
            {modules.map((module) => {
              const completed = isEpComplete(module.id)
              const progress = getModuleProgress(epProgressId(module.id))
              const hasStarted = progress.startedAt !== null
              const isNext = nextModule?.id === module.id

              return (
                <div
                  key={module.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToModule(module.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      goToModule(module.id)
                    }
                  }}
                  className={cn(
                    'group cursor-pointer rounded-2xl bg-white border shadow-sm p-5 sm:p-6 transition-all hover:shadow-md hover:-translate-y-0.5',
                    isNext ? 'border-teal-300 ring-1 ring-teal-100' : 'border-slate-200'
                  )}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Number badge — solid for completed, outlined otherwise */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base transition-colors',
                        completed
                          ? 'bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-sm'
                          : isNext
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 group-hover:border-slate-300'
                      )}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
                      ) : (
                        module.id.toString().padStart(2, '0')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-teal-600 transition-colors">
                          {module.title}
                        </h3>
                        {completed ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Complete
                          </span>
                        ) : hasStarted ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                            In Progress
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 px-2.5 py-1 flex-shrink-0">
                            Not started
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 font-medium mb-2">{module.subtitle}</p>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                        {module.description}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                            {module.duration}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Award className="w-3.5 h-3.5" strokeWidth={2} />
                            {module.points} CPD {module.points === 1 ? 'hour' : 'hours'}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                            completed
                              ? 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                              : 'bg-slate-900 text-white group-hover:bg-slate-800'
                          )}
                        >
                          {completed ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resources */}
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 mb-4">
            Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/ep-course/references"
              className="group flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4 transition-all hover:shadow-md hover:border-teal-200"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Library className="w-[18px] h-[18px] text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">Reference Repository</div>
                <div className="text-xs text-slate-500">Cited evidence base</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/ep-course/toolkit"
              className="group flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4 transition-all hover:shadow-md hover:border-teal-200"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-[18px] h-[18px] text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">Clinical Toolkit</div>
                <div className="text-xs text-slate-500">Protocols &amp; worksheets</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/ep-course/admin-docs"
              className="group flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4 transition-all hover:shadow-md hover:border-teal-200"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-[18px] h-[18px] text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">Clinical Report Templates</div>
                <div className="text-xs text-slate-500">NDIS · WorkCover/CTP · GP referrer</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </Link>

            <button
              type="button"
              onClick={() => setShowCert(true)}
              className="group flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-left transition-all hover:shadow-md hover:border-teal-200"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Award className="w-[18px] h-[18px] text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">Certificate</div>
                <div className="text-xs text-slate-500">View sample certificate</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </button>
          </div>

          {/* Course author & governance — reviewer surface */}
          <CourseAuthorPanel />

          {/* Quality / complaints policy — required for accreditation, not yet in repo */}
          <QualityPolicyPanel />
        </div>
      </main>

      {showCert && <SampleCertificateModal onClose={() => setShowCert(false)} />}
    </div>
  )
}

// ── Course author & governance ────────────────────────────────────────────
// Reviewer-facing credentials panel. Every fact here is sourced from the ACSM
// submission pack (A5 — Presenter Biography) and the applicant identification
// block; nothing is invented. The instructor bio paragraph is quoted verbatim.
function CourseAuthorPanel() {
  return (
    <section className="mt-12">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 mb-4">
        Course Author &amp; Governance
      </h2>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 items-center justify-center shadow-sm">
            <BadgeCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Zac Lewis — B.Clin.Sci, M.Ost.Med
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Registered Osteopath (AHPRA) · Sole author &amp; presenter
            </p>

            {/* Credential chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                AHPRA reg. OST0001852866
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Master of Osteopathic Medicine
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Bachelor of Clinical Science
              </span>
            </div>

            {/* Bio — quoted verbatim from ACSM pack A5 */}
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
              Zac Lewis is an AHPRA-registered osteopath and the founder of Concussion Education
              Australia. He holds a Bachelor of Clinical Science and a Master of Osteopathic Medicine,
              and has more than a decade of clinical experience in neurological health with a
              concentrated focus on concussion assessment and rehabilitation. He is the sole author of
              Concussion Rehab Mastery — the module structure, all instructional content, the 136-item
              peer-reviewed evidence base, and all 87 assessment items.
            </p>

            {/* Provider + governance grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 pt-5 border-t border-slate-100">
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Provider</dt>
                <dd className="text-sm text-slate-700 font-medium mt-0.5">
                  Concussion Education Australia Pty Ltd
                </dd>
                <dd className="text-xs text-slate-500">ABN 74 688 155 508</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Course</dt>
                <dd className="text-sm text-slate-700 font-medium mt-0.5">
                  Concussion Rehab Mastery
                </dd>
                <dd className="text-xs text-slate-500">8 modules · 8 CPD hours · 80% quiz pass mark · 136 references</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Endorsement status</dt>
                <dd className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                  ESSA endorsement of Concussion Rehab Mastery is{' '}
                  <strong className="text-slate-700">pending</strong> — under review by two ESSA-appointed
                  reviewers; no ESSA endorsement is currently held or claimed. Osteopathy Australia&apos;s
                  CPD endorsement applies to the companion Concussion Clinical Mastery program, not to this
                  course.
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Published protocol</dt>
                <dd className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                  The rehabilitation method taught here is a published, citable clinical protocol:{' '}
                  <a
                    href="https://doi.org/10.5281/zenodo.21482634"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 font-medium hover:underline"
                  >
                    <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise
                    Rehabilitation after Concussion (mTBI)</em>, Lewis&nbsp;Z. (2026), Zenodo, CC-BY-4.0
                  </a>{' '}
                  (DOI 10.5281/zenodo.21482634). The SST Trainer operationalises it — graded BCTT/BCBT
                  test, measured HR threshold, sub-symptom-threshold prescription and monitored home
                  sessions.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Quality / complaints policy ───────────────────────────────────────────
// Reviewer-facing summary of the REAL published policy at /terms (identical for
// AU, NZ and international buyers). Every fact here is sourced verbatim from that
// page — refund window, complaints channel, ACL preservation and Privacy-Act
// handling. Full authoritative text lives at /terms.
function QualityPolicyPanel() {
  return (
    <section className="mt-6 mb-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Quality assurance &amp; complaints policy
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Published policy — applies identically to AU, NZ and international participants
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-5">
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Refunds</dt>
                <dd className="text-sm text-slate-600 leading-relaxed mt-1">
                  Full refund within 7 days of purchase if less than 25% of the course has been accessed
                  (fewer than 2 modules). No refund once more than 25% has been consumed. Approved refunds are
                  processed within 5&ndash;10 business days.
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Complaints &amp; refund requests</dt>
                <dd className="text-sm text-slate-600 leading-relaxed mt-1">
                  Email{' '}
                  <a href="mailto:zac@concussion-education-australia.com" className="text-teal-700 font-medium hover:underline">
                    zac@concussion-education-australia.com
                  </a>
                  . We respond within 1 business day.
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Australian Consumer Law</dt>
                <dd className="text-sm text-slate-600 leading-relaxed mt-1">
                  Your rights under the Australian Consumer Law are preserved. Where there is a major failure,
                  you are entitled to a refund regardless of the timeframe above.
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Privacy</dt>
                <dd className="text-sm text-slate-600 leading-relaxed mt-1">
                  Personal information is handled under the Australian Privacy Principles (Privacy Act 1988).
                </dd>
              </div>
            </dl>

            <p className="text-sm text-slate-500 mt-5 pt-4 border-t border-slate-100">
              Full terms:{' '}
              <Link href="/terms" className="text-teal-700 font-medium hover:underline">
                /terms
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Sample (specimen) certificate ─────────────────────────────────────────
// A watermarked SPECIMEN that mirrors the real CPD certificate template
// (lib/certificate.ts — the `online-course` type: 8 CPD hours, landscape A4,
// #5b9aa6 border/accents, CEA header, Zac Lewis signature block). It is
// populated ONLY with known-true facts. The OA endorsement line that the live
// PDF template carries is deliberately omitted here — OA endorses the companion
// CCM program, not this course. A placeholder marks where an accreditation /
// registration number would sit once an accreditor assigns one.
function SampleCertificateModal({ onClose }: { onClose: () => void }) {
  const teal = '#5b9aa6'
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sample certificate"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-white/80 uppercase tracking-[0.14em]">
            Specimen certificate — not a completion record
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate canvas — landscape A4 proportion, mirrors the PDF */}
        <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* SPECIMEN watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="text-[7rem] sm:text-[9rem] font-black tracking-[0.15em] -rotate-[24deg] select-none"
              style={{ color: 'rgba(91,154,166,0.12)' }}
            >
              SPECIMEN
            </span>
          </div>

          {/* Double border */}
          <div className="m-2.5 border-2 rounded-sm" style={{ borderColor: teal }}>
            <div className="m-1 border rounded-sm px-6 sm:px-12 py-8 sm:py-10 text-center" style={{ borderColor: teal }}>
              {/* Header */}
              <div className="text-[13px] sm:text-sm font-bold tracking-wide" style={{ color: teal }}>
                CONCUSSION EDUCATION AUSTRALIA
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                Concussion Education Australia Pty Ltd · ABN 74 688 155 508
              </div>

              <div className="mt-6 text-[11px] sm:text-xs tracking-[0.14em] text-slate-500 uppercase">
                Certificate of Completion
              </div>
              <div className="mx-auto mt-2 h-px w-24" style={{ backgroundColor: teal }} />

              <div className="mt-5 text-xs sm:text-sm text-slate-600">This is to certify that</div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-800 italic">
                [ Participant name ]
              </div>
              <div className="mx-auto mt-1.5 h-px w-56 max-w-full" style={{ backgroundColor: teal }} />

              <div className="mt-4 text-xs sm:text-sm text-slate-600">
                has successfully completed the following CPD activity:
              </div>
              <div className="mt-2 text-lg sm:text-xl font-bold" style={{ color: teal }}>
                Concussion Rehab Mastery
              </div>
              <div className="mt-2 text-[11px] sm:text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
                Evidence-based concussion rehabilitation for exercise physiologists — 8 clinical modules
                covering the neurometabolic cascade, sub-symptom-threshold aerobic rehabilitation,
                phenotype-directed management and staged return-to-activity.
              </div>

              {/* Details grid */}
              <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto">
                <div>
                  <div className="text-[9px] sm:text-[10px] tracking-wide text-slate-400 uppercase">CPD hours awarded</div>
                  <div className="text-xl sm:text-2xl font-bold mt-1" style={{ color: teal }}>8</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">AHPRA-Aligned</div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] tracking-wide text-slate-400 uppercase">Date of completion</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700 mt-1">Issued on completion</div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] tracking-wide text-slate-400 uppercase">Mode of delivery</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700 mt-1">Online — Self-Paced</div>
                </div>
              </div>

              {/* Accreditation / registration number region */}
              <div className="mt-6 mx-auto max-w-md rounded-md border border-dashed border-slate-300 bg-slate-50/70 px-4 py-2.5">
                <div className="text-[9px] sm:text-[10px] tracking-wide text-slate-400 uppercase">
                  Accreditation / registration number
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  [ Assigned by the accrediting body on approval — e.g. ACSM / CASES / HPCSA / CEP-UK ]
                </div>
              </div>

              {/* Signature block */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                <div className="text-center sm:text-left">
                  <div className="text-lg italic" style={{ color: teal }}>Zac Lewis</div>
                  <div className="mx-auto sm:mx-0 mt-1 h-px w-40" style={{ backgroundColor: '#cbd5e1' }} />
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 leading-snug">
                    Zac Lewis — B.Clin.Sci, M.Ost.Med
                    <br />
                    Registered Osteopath · AHPRA OST0001852866
                    <br />
                    Concussion Education Australia
                  </div>
                </div>
                <div className="text-center sm:text-right text-[10px] sm:text-xs text-slate-400 leading-snug">
                  Certificate ID: CEA-ONL-YYYY-XXXXXXXX
                  <br />
                  <span className="italic">(specimen — no verifiable ID)</span>
                  <br />
                  Verify: portal.concussion-education-australia.com
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-white/60">
          Watermarked specimen for accreditation review. Live certificates are generated per participant
          on verified course completion (80% quiz pass mark across all modules).
        </p>
      </div>
    </div>
  )
}
