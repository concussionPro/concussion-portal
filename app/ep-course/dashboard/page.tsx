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
} from 'lucide-react'
import { getEpModulesMeta } from '@/data/ep-modules'
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
              <strong className="text-white">up to 14 AHPRA CPD hours</strong>.
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

  const totalModules = modules.length
  const completedCount = modules.filter((m) => isModuleComplete(m.id)).length
  const totalCPD = modules.reduce((sum, m) => sum + m.points, 0)
  const earnedCPD = modules
    .filter((m) => isModuleComplete(m.id))
    .reduce((sum, m) => sum + m.points, 0)
  const pct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  // Primary "Continue"/"Start" affordance: the first in-progress module, else the
  // first not-yet-completed module.
  const inProgressModule = modules.find((m) => {
    const p = getModuleProgress(m.id)
    return p.startedAt !== null && !isModuleComplete(m.id)
  })
  const nextModule = inProgressModule || modules.find((m) => !isModuleComplete(m.id))
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
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-[0.14em]">
                Concussion Education Australia · Endorsed CPD
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
              const completed = isModuleComplete(module.id)
              const progress = getModuleProgress(module.id)
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
                <div className="text-sm font-semibold text-slate-800">Admin Documents</div>
                <div className="text-xs text-slate-500">Accreditation &amp; governance</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
            </Link>

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Award className="w-[18px] h-[18px] text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-500">Certificate</div>
                <div className="text-xs text-slate-400">Issued on course completion</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
