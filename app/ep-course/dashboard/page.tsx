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
} from 'lucide-react'
import { getEpModulesMeta } from '@/data/ep-modules'
import { useProgress } from '@/contexts/ProgressContext'
import { cn } from '@/lib/utils'
import { CONFIG } from '@/lib/config'
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

  const goToModule = (id: number) => router.push(`/ep-course/modules/${id}`)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Course header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-sm">
            <Brain className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                Concussion Education Australia
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Concussion Rehab Mastery
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1.5 leading-relaxed">
              Evidence-based concussion rehabilitation for exercise physiologists — {totalModules}{' '}
              modules, up to {totalCPD} CPD hours.
            </p>
          </div>
        </div>

        {/* Progress summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Modules Complete</div>
              <div className="text-xl font-bold text-slate-900">
                {completedCount} / {totalModules}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">CPD Hours Earned</div>
              <div className="text-xl font-bold text-slate-900">
                {earnedCPD} / {totalCPD}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Overall Progress</div>
              <div className="text-xl font-bold text-slate-900">{pct}%</div>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Primary continue / start affordance */}
        {nextModule && !allComplete && (
          <button
            onClick={() => goToModule(nextModule.id)}
            className="w-full text-left mb-8 group rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 p-6 flex items-center gap-5 transition-all hover:shadow-md"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
              <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                {inProgressModule ? 'Continue where you left off' : 'Start the course'}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Module {nextModule.id}: {nextModule.title}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{nextModule.subtitle}</div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold flex-shrink-0">
              {inProgressModule ? 'Continue' : 'Start'}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        )}

        {allComplete && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 p-6 flex items-center gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">Course complete</div>
              <div className="text-sm text-slate-600 mt-0.5">
                You&apos;ve finished all {totalModules} modules and earned {totalCPD} CPD hours.
              </div>
            </div>
          </div>
        )}

        {/* Module list */}
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">
          Modules
        </h2>
        <div className="space-y-3 mb-10">
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
                  'group cursor-pointer rounded-2xl bg-white border shadow-sm p-5 sm:p-6 transition-all hover:shadow-md',
                  isNext ? 'border-teal-300' : 'border-slate-200'
                )}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-200 tracking-tight min-w-[40px] sm:min-w-[48px] flex-shrink-0">
                    {module.id.toString().padStart(2, '0')}
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
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 font-medium mb-3">{module.subtitle}</p>
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
                          'px-4 py-1.5 rounded-lg text-xs font-bold transition-colors',
                          completed
                            ? 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                            : 'bg-slate-900 text-white group-hover:bg-slate-800'
                        )}
                      >
                        {completed ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resources */}
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">
          Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/ep-course/references"
            className="group flex items-center gap-3 rounded-xl bg-white border border-slate-200 shadow-sm p-4 transition-all hover:shadow-md hover:border-teal-200"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
              <Library className="w-4.5 h-4.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
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
              <Wrench className="w-4.5 h-4.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
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
              <FileText className="w-4.5 h-4.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800">Admin Documents</div>
              <div className="text-xs text-slate-500">Accreditation &amp; governance</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
          </Link>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Award className="w-4.5 h-4.5 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-500">Certificate</div>
              <div className="text-xs text-slate-400">Issued on course completion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
