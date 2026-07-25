'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, Clock, Award, Lock, ArrowRight, Loader2, Sparkles, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { getModulesMeta, getSCATModulesMeta, getFreeShortCourseMeta } from '@/data/module-meta'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useState, useEffect } from 'react'
import { CONFIG, workshopPriceFor } from '@/lib/config'
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
  // Start false and resolve the localStorage dismissal in an effect — reading
  // localStorage inside the useState initializer made the server render (true)
  // diverge from the client's first render, causing a hydration mismatch.
  const [showFramingCard, setShowFramingCard] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('framing-card-dismissed') !== 'true') {
      setShowFramingCard(true)
    }
  }, [])
  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  const paidModules = getModulesMeta()
  const scatModules = getSCATModulesMeta()
  const freeShortCourse = getFreeShortCourseMeta()
  const freeShortCourseComplete = isModuleComplete(freeShortCourse.id)

  const accessLevel = user?.accessLevel || ''
  // THREE tiers (see Sidebar). CRM ownership is course_purchases-based, NOT
  // access_level, so a CRM-only buyer carries 'preview'. They are NOT a
  // free-trial lead (don't show them the SCAT funnel as "their" course) and NOT
  // a CCM buyer (CCM modules/tools stay locked — the streams stay siloed).
  const ownsCrm = user?.ownsCrm === true
  const isPaidCcm = accessLevel === 'online-only' || accessLevel === 'full-course'
  const isFreeTier = !isPaidCcm && !ownsCrm
  // `isPreview` drives the CCM-vs-free framing of the header/progress panel. A
  // CRM buyer gets neither — their own stream panel is selected below.
  const isPreview = isFreeTier
  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  // SCAT progress for preview users
  const scatCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 101 && p.moduleId <= 103 && p.completed,
  ).length
  // SCAT course = 1 CPD hour (awarded on completing all 3 modules)
  const scatCPD = scatCompleted === 3 ? 1 : 0
  // EP/CRM modules are namespaced 201-208 in the shared progress store
  // (EP_MODULE_ID_OFFSET); getTotalCompletedModules() counts CCM 1-8 only, so a
  // CRM buyer's panel would read 0/8 forever off the CCM counter.
  const crmCompleted = Object.values(progress).filter(
    (p) => p.moduleId >= 201 && p.moduleId <= 208 && p.completed,
  ).length
  // The completed-module count for whichever 8-module stream this user owns.
  const streamCompleted = isPaidCcm ? completedModules : crmCompleted

  const handleModuleClick = (moduleId: number) => {
    router.push(`/modules/${moduleId}`)
  }

  // Which course's modules drive the "resume where you left off" banner. A CRM
  // buyer must NOT be pointed at CCM modules they don't own, nor at the free
  // SCAT funnel — they resume their own stream.
  const modules = isPaidCcm ? paidModules : isFreeTier ? scatModules : []

  // COURSES — the Learning Suite lists COURSES (not one course's modules).
  // Each course opens its modules in the course player. Paid courses the user
  // doesn't own show locked + price (visible-but-locked upsell).
  const nextCcm = paidModules.find((m) => !isModuleComplete(m.id)) || paidModules[0]
  const nextScat = scatModules.find((m) => !isModuleComplete(m.id)) || scatModules[0]
  type CourseCard = {
    key: string; title: string; subtitle: string; description: string
    moduleCount: number; cpd: number; completed: number; free?: boolean
    accessible: boolean; href: string; price: number | null
  }
  const courses: CourseCard[] = [
    {
      key: 'ccm',
      title: 'Concussion Clinical Mastery',
      subtitle: 'Diagnosis, assessment & clinical management',
      description: 'SCAT6/SCOAT6, VOMS & BESS, clinical phenotyping, return-to-play protocols and medicolegal documentation — the diagnosis & management course.',
      moduleCount: 8,
      cpd: CONFIG.COURSE.ONLINE_CPD_POINTS,
      completed: completedModules,
      accessible: isPaidCcm,
      href: isPaidCcm ? `/modules/${nextCcm.id}` : '/pricing',
      price: CONFIG.COURSE.PRICE_ONLINE,
    },
    {
      key: 'crm',
      title: 'Concussion Rehab Mastery',
      subtitle: 'Exercise rehabilitation — EP stream',
      description: 'Graded exercise testing, heart-rate-threshold prescription, phenotype reconditioning and graded return-to-activity — the exercise-physiology course.',
      moduleCount: 8,
      cpd: 8,
      completed: crmCompleted,
      // A CRM owner opens their course; everyone else gets the sales page.
      // Was hardcoded `accessible: false`, which locked paying EP buyers out of
      // the card for the course they had just bought.
      accessible: ownsCrm,
      href: ownsCrm ? '/ep-course' : '/concussion-rehab-mastery',
      price: null,
    },
    {
      key: 'scat',
      title: 'SCAT6 / SCOAT6 Mastery',
      subtitle: 'Free assessment training',
      description: 'Master SCAT6, SCOAT6 and Child SCAT6 administration and scoring across age groups. Certificate on completion.',
      moduleCount: 3,
      cpd: 1,
      completed: scatCompleted,
      accessible: true,
      free: true,
      href: `/modules/${nextScat.id}`,
      price: null,
    },
    // CRM (EP/ESSA stream) is NOT live until ESSA endorsement lands — filtered
    // out below until CONFIG.FEATURES.ESSA_ACCREDITED flips.
  ].filter((c) => c.key !== 'crm' || CONFIG.FEATURES.ESSA_ACCREDITED)

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
                  {isFreeTier
                    ? 'SCAT6/SCOAT6 Mastery Course'
                    : isPaidCcm
                      ? 'Clinical Mastery Training'
                      : 'Concussion Rehab Mastery'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isFreeTier
                    ? 'Free SCAT6, SCOAT6 & Child SCAT6 Assessment Training'
                    : !isPaidCcm
                    ? `${CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD Points · Exercise Rehabilitation for Concussion`
                    : accessLevel === 'full-course'
                    ? `${CONFIG.COURSE.ONLINE_CPD_POINTS} Online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} In-Person CPD Hours (${CONFIG.COURSE.TOTAL_CPD_POINTS} Total) · Evidence-Based Concussion Management`
                    : `${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD Hours · Evidence-Based Concussion Management`}
                </p>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Modules Complete</div>
                  <div className="text-xl font-bold text-gradient">
                    {isFreeTier ? `${scatCompleted} / 3` : `${streamCompleted} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {isFreeTier ? 'Free CPD Hours' : isPaidCcm ? 'Online CPD Hours' : 'ESSA CPD Points'}
                  </div>
                  <div className="text-xl font-bold text-gradient">
                    {isFreeTier ? `${scatCPD} / 1` : `${streamCompleted} / 8`}
                  </div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Study Time</div>
                  <div className="text-xl font-bold text-gradient">{studyTime > 0 ? `${studyTime.toFixed(1)}h` : '\u2014'}</div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              {(() => {
                const totalModules = isFreeTier ? 3 : 8
                const done = isFreeTier ? scatCompleted : streamCompleted
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

            {/* Course Framing Card — shown to ALL users (free/preview included —
                they're the segment that most needs orientation) until they start
                their first module */}
            {showFramingCard && !getModuleProgress(isFreeTier ? 101 : isPaidCcm ? 1 : 201).startedAt && (
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
                  {isFreeTier
                    ? '3 short modules take you through SCAT6, SCOAT6 and Child SCAT6 — about an hour all up, with 1 CPD hour and a certificate on completion. The full program adds 8 clinical modules (8 CPD hours online, up to 14 with the hands-on workshop).'
                    : isPaidCcm
                    ? '8 online modules build your clinical reasoning foundation. The full-day practical workshop (full-course access) is where you apply assessment skills hands-on.'
                    : '8 online modules build your exercise-rehabilitation reasoning — graded testing, heart-rate-threshold prescription and graded return to activity. The shared practical day is where you apply it hands-on.'}
                </p>
              </div>
            )}

            {/* Resume Banner — shown to ALL users with a module in progress
                (previously hidden from free/preview users) */}
            {(() => {
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
                      <div className="text-sm font-bold text-foreground truncate">Module {isPreview ? inProgressModule.id - 100 : inProgressModule.id}: {inProgressModule.title}</div>
                    </div>
                    <span className="btn-primary px-3 sm:px-4 py-2 rounded-lg text-xs font-bold">
                      Continue
                    </span>
                  </button>
                )
              }
              return null
            })()}

            {/* Free Short Course — DISTINCT featured banner (module 104).
                Shown to EVERYONE (free/preview AND paid). Deliberately styled
                unlike the glass module cards and the locked paid cards: a
                dark-teal gradient banner with an amber "FREE" eyebrow so it
                reads as a separate, no-cost offering — not another module. */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleModuleClick(freeShortCourse.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModuleClick(freeShortCourse.id) } }}
              className="group relative mt-5 cursor-pointer overflow-hidden rounded-xl border border-teal-400/30 bg-gradient-to-br from-[#0d5c63] via-[#0f766e] to-[#155e75] p-6 sm:p-7 shadow-lg shadow-teal-900/20 transition-all hover:shadow-xl hover:shadow-teal-900/30"
            >
              {/* decorative glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Eyebrow badge — amber accent, distinct from paid styling */}
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-950">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Free Short Course
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {freeShortCourse.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-teal-50/90">
                    {freeShortCourse.subtitle}
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-teal-100/80">
                    The 2022 consensus rewrote concussion treatment. Most clinicians were trained on the old model — this free module brings you up to date.
                  </p>

                  {/* Meta chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                      {freeShortCourse.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
                      <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                      {freeShortCourse.sectionsCount} lessons
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
                      <Award className="h-3.5 w-3.5" strokeWidth={2} />
                      Certificate on completion
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-300/30">
                      No cost
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleModuleClick(freeShortCourse.id) }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0f766e] shadow-sm transition-all hover:bg-teal-50 hover:shadow-md sm:w-auto"
                  >
                    {freeShortCourseComplete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                        Review the free module
                      </>
                    ) : (
                      <>
                        Start the free module
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* COURSES — course-level cards (not one course's modules). Each
                accessible course opens its next module in the course player;
                courses the user doesn't own show locked + price (upsell). */}
            <div className="mt-6">
              <h2 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Courses</h2>
              <div className="space-y-3">
                {courses.map((c) => {
                  const pct = c.moduleCount ? Math.round((c.completed / c.moduleCount) * 100) : 0
                  const started = c.completed > 0
                  const done = c.completed >= c.moduleCount
                  const cardProps = c.accessible
                    ? { role: 'button' as const, tabIndex: 0, onClick: () => router.push(c.href),
                        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(c.href) } } }
                    : {}
                  return (
                    <div
                      key={c.key}
                      className={cn('glass rounded-xl p-5 sm:p-6 group', c.accessible && 'glass-hover cursor-pointer')}
                      {...cardProps}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3 className={cn('text-lg sm:text-xl font-bold tracking-tight', c.accessible ? 'text-foreground group-hover:text-gradient transition-colors' : 'text-slate-500')}>
                              {c.title}
                            </h3>
                            {c.free && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">Free</span>
                            )}
                            {!c.accessible && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>
                          <p className={cn('text-sm font-medium mb-1', c.accessible ? 'text-slate-600' : 'text-slate-400')}>{c.subtitle}</p>
                          <p className={cn('text-xs leading-relaxed line-clamp-2 mb-3', c.accessible ? 'text-muted-foreground' : 'text-slate-400')}>{c.description}</p>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" strokeWidth={2} />{c.moduleCount} modules</span>
                            <span className="inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" strokeWidth={2} />{c.cpd} CPD hours</span>
                            {c.accessible && started && <span className="font-semibold text-accent">{c.completed}/{c.moduleCount} complete</span>}
                          </div>
                          {c.accessible && started && (
                            <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden mt-3">
                              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {c.accessible ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(c.href) }}
                              className={cn('px-5 py-2.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5', done ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'btn-primary')}
                            >
                              {done ? 'Review' : started ? 'Continue' : 'Start'}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <Link
                              href={c.href}
                              onClick={(e) => e.stopPropagation()}
                              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
                            >
                              <Lock className="w-3 h-3" />
                              {c.price ? `Unlock — A$${c.price}` : 'Explore'}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Upgrade banner for online-only users */}
            {accessLevel === 'online-only' && (
              <div className="mt-6 glass rounded-xl p-5 border-l-4 border-orange-400">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                    <Award className="w-5 h-5 text-orange-500" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">Complete your 14 CPD hours — add the workshop</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your online modules teach the theory. The full-day workshop is where you practice SCAT6 administration, VOMS testing &amp; BESS scoring with expert feedback — the skills you can&apos;t learn from a screen.
                    </p>
                    <Link
                      href="/upgrade"
                      className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      Add Workshop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
