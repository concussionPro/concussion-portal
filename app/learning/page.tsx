'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, Clock, Award, Lock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { getModulesMeta, getSCATModulesMeta } from '@/data/module-meta'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CONFIG } from '@/lib/config'

export default function LearningSuite() {
  const router = useRouter()
  const { getTotalCompletedModules, getTotalCPDPoints, getTotalStudyTime, isModuleComplete, getModuleProgress, progress } = useProgress()
  const paidModules = getModulesMeta()
  const scatModules = getSCATModulesMeta()
  const [hasAccess, setHasAccess] = useState(false)
  const [accessLevel, setAccessLevel] = useState<string>('')
  const [accessLoading, setAccessLoading] = useState(true)
  useAnalytics() // Track page views

  const isPreview = accessLevel === 'preview'
  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // SCAT progress for preview users
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 105 && p.completed,
  ).length
  // Modules 101-104 are 0.5 CPD each, Module 105 is 0 CPD
  const scatCPD = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 104 && p.completed,
  ).length * 0.5

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user && data.user.accessLevel) {
            setAccessLevel(data.user.accessLevel)
            setHasAccess(data.user.accessLevel === 'online-only' || data.user.accessLevel === 'full-course')
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setAccessLoading(false)
      }
    }

    checkAccess()
  }, [router])

  const handleModuleClick = (moduleId: number) => {
    router.push(`/modules/${moduleId}`)
  }

  // Choose which modules to show based on access level
  const modules = isPreview ? scatModules : paidModules

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1 relative">
          {/* Subtle background gradient */}
          <div className="fixed inset-0 ml-0 md:ml-64 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#64a8b0]/3 via-transparent to-[#7ba8b0]/3" />
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px] relative z-10">
            {/* Header Card */}
            <div className="glass rounded-xl p-6 mb-5 border-l-4 border-[#64a8b0]">
              <div className="border-b border-slate-200/50 pb-4 mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                  {isPreview ? 'SCAT6/SCOAT6 Mastery Course' : 'Clinical Mastery Training'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isPreview
                    ? '2 Free CPD Points · SCAT6, SCOAT6 & Child SCAT6 Assessment Training'
                    : `${CONFIG.COURSE.ONLINE_CPD_POINTS} Online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} In-Person CPD Points (${CONFIG.COURSE.TOTAL_CPD_POINTS} Total) · Evidence-Based Concussion Management`}
                </p>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Modules Complete</div>
                  <div className="text-xl font-bold text-gradient">
                    {isPreview ? `${scatCompleted} / 5` : `${completedModules} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{isPreview ? 'Free CPD Points' : 'Online CPD Points'}</div>
                  <div className="text-xl font-bold text-gradient">
                    {isPreview ? `${scatCPD} / 2` : `${cpdPoints} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Study Time</div>
                  <div className="text-xl font-bold text-gradient">{studyTime.toFixed(1)}h</div>
                </div>
              </div>
            </div>

            {/* Module Cards — accessible modules */}
            <div className="space-y-3 mt-5">
              {modules.map((module) => {
                const completed = isModuleComplete(module.id)
                const modProgress = getModuleProgress(module.id)
                const hasStarted = modProgress.startedAt !== null

                return (
                  <div
                    key={module.id}
                    className="glass glass-hover rounded-xl cursor-pointer group"
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Module Header */}
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0">
                          <div className="text-2xl sm:text-3xl font-bold text-slate-300 tracking-tight min-w-[40px] sm:min-w-[50px] flex-shrink-0">
                            {isPreview
                              ? (module.id - 100).toString()
                              : module.id.toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 tracking-tight group-hover:text-gradient transition-colors">
                              {module.title}
                            </h2>
                            <p className="text-sm text-slate-600 font-medium mb-2">
                              {module.subtitle}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {module.description}
                            </p>
                          </div>
                        </div>
                        {completed && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#6b9da8] bg-teal-50 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                            Complete
                          </div>
                        )}
                        {!completed && hasStarted && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                            In Progress
                          </div>
                        )}
                      </div>

                      {/* Module Meta */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200/50 gap-2">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{module.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{module.points} CPD pt</span>
                          </div>
                        </div>
                        <button
                          className={cn(
                            "px-5 py-2 rounded-lg text-xs font-bold transition-all",
                            completed
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "btn-primary"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleModuleClick(module.id)
                          }}
                        >
                          {completed ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Locked paid modules — shown to preview users as upgrade teaser */}
            {isPreview && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Unlock 8 Advanced Modules</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                    Paid Course
                  </span>
                </div>
                <div className="space-y-3">
                  {paidModules.map((module) => (
                    <div
                      key={module.id}
                      className="glass rounded-xl opacity-50 cursor-pointer hover:opacity-60 transition-opacity"
                      onClick={() => router.push('/pricing')}
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-5">
                          <div className="text-2xl sm:text-3xl font-bold text-slate-200 tracking-tight min-w-[40px] sm:min-w-[50px] flex-shrink-0">
                            {module.id.toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                                {module.title}
                              </h2>
                              <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium mb-2">
                              {module.subtitle}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {module.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 mt-4 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium">{module.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium">{module.points} CPD pt</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upgrade CTA */}
                <div className="mt-6 glass rounded-xl p-6 border-2 border-accent/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-1">Upgrade to the Full Course</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        Unlock 8 advanced modules, the Clinical Toolkit, Reference Repository, and earn <strong className="text-foreground">14 AHPRA CPD points</strong> — from ${CONFIG.COURSE.PRICE_ONLINE} AUD.
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                      >
                        View Pricing & Enrol
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade banner for online-only users */}
            {accessLevel === 'online-only' && (
              <div className="mt-6 glass rounded-xl p-5 border-l-4 border-orange-400">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                    <Award className="w-5 h-5 text-orange-500" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">Add the hands-on workshop</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to the complete course for 6 additional CPD points. Practice SCAT6, VOMS &amp; BESS with expert feedback in a full-day workshop.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      View Workshop Options
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
