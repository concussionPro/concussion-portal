'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, Clock, Award, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { getModulesMeta, getSCATModulesMeta } from '@/data/module-meta'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useState } from 'react'
import { CONFIG } from '@/lib/config'
import { SessionProvider, useSession } from '@/contexts/SessionContext'

export default function LearningSuite() {
  return (
    <SessionProvider>
      <LearningSuiteInner />
    </SessionProvider>
  )
}

function LearningSuiteInner() {
  const router = useRouter()
  const { getTotalCompletedModules, getTotalCPDPoints, getTotalStudyTime, isModuleComplete, getModuleProgress, progress } = useProgress()
  const { user, isLoading: accessLoading } = useSession()
  const [showFramingCard, setShowFramingCard] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('framing-card-dismissed') !== 'true'
  })
  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  const paidModules = getModulesMeta()
  const scatModules = getSCATModulesMeta()

  const accessLevel = user?.accessLevel || ''
  const isPreview = accessLevel === 'preview'
  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // SCAT progress for preview users
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && p.completed,
  ).length
  // SCAT modules have 0 CPD (free lead gen course)
  const scatCPD = 0

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
                    ? 'Free SCAT6, SCOAT6 & Child SCAT6 Assessment Training'
                    : accessLevel === 'full-course'
                    ? `${CONFIG.COURSE.ONLINE_CPD_POINTS} Online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} In-Person CPD Points (${CONFIG.COURSE.TOTAL_CPD_POINTS} Total) · Evidence-Based Concussion Management`
                    : `${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD Points · Evidence-Based Concussion Management`}
                </p>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Modules Complete</div>
                  <div className="text-xl font-bold text-gradient">
                    {isPreview ? `${scatCompleted} / 3` : `${completedModules} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{isPreview ? 'Free CPD Points' : 'Online CPD Points'}</div>
                  <div className="text-xl font-bold text-gradient">
                    {isPreview ? 'Free' : `${cpdPoints} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Study Time</div>
                  <div className="text-xl font-bold text-gradient">{studyTime > 0 ? `${studyTime.toFixed(1)}h` : '\u2014'}</div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              {(() => {
                const totalModules = isPreview ? 3 : 8
                const done = isPreview ? scatCompleted : completedModules
                const pct = Math.round((done / totalModules) * 100)
                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
                      <span className="text-xs font-bold text-foreground">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Course Framing Card — shown to users who haven't started Module 1 */}
            {!isPreview && showFramingCard && !getModuleProgress(1).startedAt && (
              <div className="glass rounded-xl p-5 mb-5 border-l-4 border-teal-500 relative">
                <button
                  onClick={(e) => { e.stopPropagation(); localStorage.setItem('framing-card-dismissed', 'true'); setShowFramingCard(false) }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg leading-none"
                  aria-label="Dismiss"
                >
                  &times;
                </button>
                <h3 className="text-sm font-bold text-foreground mb-1">How This Course Works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  8 online modules build your clinical reasoning foundation. The full-day practical workshop (full-course access) is where you apply assessment skills hands-on.
                </p>
              </div>
            )}

            {/* Resume Banner — shown when user has a module in progress */}
            {!isPreview && (() => {
              const inProgressModule = modules.find(m => {
                const p = getModuleProgress(m.id)
                return p.startedAt !== null && !isModuleComplete(m.id)
              })
              if (inProgressModule) {
                return (
                  <button
                    onClick={() => handleModuleClick(inProgressModule.id)}
                    className="w-full glass glass-hover rounded-xl p-4 mb-5 flex items-center gap-4 group text-left border-l-4 border-amber-400"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-amber-600 mb-0.5">Continue where you left off</div>
                      <div className="text-sm font-bold text-foreground truncate">Module {inProgressModule.id}: {inProgressModule.title}</div>
                    </div>
                    <span className="btn-primary px-3 sm:px-4 py-2 rounded-lg text-xs font-bold">
                      Continue
                    </span>
                  </button>
                )
              }
              return null
            })()}

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
                    role="button"
                    tabIndex={0}
                    onClick={() => handleModuleClick(module.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModuleClick(module.id) } }}
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
                      className="glass rounded-xl relative overflow-hidden"
                    >
                      <div className="p-5 sm:p-6 opacity-40 pointer-events-none select-none">
                        {/* Module Header — greyed, non-interactive */}
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0">
                            <div className="text-2xl sm:text-3xl font-bold text-slate-200 tracking-tight min-w-[40px] sm:min-w-[50px] flex-shrink-0">
                              {module.id.toString().padStart(2, '0')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg sm:text-xl font-bold text-slate-500 tracking-tight">
                                {module.title}
                              </h2>
                              <p className="text-sm text-slate-400 font-medium mb-2">
                                {module.subtitle}
                              </p>
                              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                            <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Locked
                          </div>
                        </div>

                        {/* Module Meta */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-slate-400 font-medium">{module.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" strokeWidth={2} />
                            <span className="text-xs text-slate-400 font-medium">{module.points} CPD pt</span>
                          </div>
                        </div>
                      </div>

                      {/* Unlock button — sits above the greyed content */}
                      <button
                        onClick={() => router.push('/pricing')}
                        className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5 z-10"
                      >
                        <Lock className="w-3 h-3" />
                        Unlock
                      </button>
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
                      <h3 className="text-base font-bold text-foreground mb-1">Ready to manage concussion cases with confidence?</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        The full course goes beyond SCAT6 — learn VOMS screening, BESS scoring, return-to-play protocols, and phenotype-based rehabilitation. Add a <strong className="text-foreground">hands-on workshop</strong> to practice these skills with expert feedback. Online: <strong className="text-foreground">{CONFIG.COURSE.ONLINE_CPD_POINTS} CPD</strong> for ${CONFIG.COURSE.PRICE_ONLINE}. Complete (online + workshop): <strong className="text-foreground">{CONFIG.COURSE.TOTAL_CPD_POINTS} CPD</strong> from ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early bird. 7-day guarantee · Afterpay / Klarna available.
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
                    <h3 className="text-sm font-bold text-foreground mb-1">Complete your 14 CPD points — add the workshop</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your online modules teach the theory. The full-day workshop is where you practice SCAT6 administration, VOMS testing &amp; BESS scoring with expert feedback — the skills you can&apos;t learn from a screen.
                    </p>
                    <button
                      onClick={() => router.push('/upgrade')}
                      className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      Add Workshop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59') && (
                      <p className="text-[11px] text-orange-600 font-medium mt-2">
                        Early bird ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })} — save ${CONFIG.COURSE.SAVINGS}
                      </p>
                    )}
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
