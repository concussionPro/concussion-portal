'use client'

import { useParams, useRouter } from 'next/navigation'
import { getModulesMeta } from '@/data/module-meta'
import { useProgress } from '@/contexts/ProgressContext'
import { CONFIG } from '@/lib/config'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, FileText, Brain, Menu, X, Lock, BookOpen, Rocket } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CourseNavigationProps {
  sectionTitles?: string[]
  currentSectionIndex?: number
  onSectionNavigate?: (index: number) => void
  lockedAfterIndex?: number
  visitedSections?: Set<number>
}

export function CourseNavigation({
  sectionTitles,
  currentSectionIndex,
  onSectionNavigate,
  lockedAfterIndex,
  visitedSections,
}: CourseNavigationProps = {}) {
  const router = useRouter()
  const params = useParams()
  const currentModuleId = parseInt(params.id as string)
  const modules = getModulesMeta()
  const { isModuleComplete: rawIsModuleComplete, getModuleProgress } = useProgress()
  /**
   * Course progress lives in localStorage + a server sync (ProgressContext), so
   * the SERVER render of this nav can only ever show zero completions. That was
   * invisible while the module player refused to render anything before a
   * client-side auth check; now that /modules/[id] genuinely server-renders its
   * content, a returning student with 8/8 complete hydrated a nav full of green
   * ticks onto a server nav with none — React threw #418 and threw the whole
   * server tree away (reproduced 2026-08-06: mismatch for the 8/8 account,
   * clean for a 0/8 account on the identical page).
   *
   * Effects never run before hydration, so `hydrated` is false for the
   * hydrating render on every browser — it matches the server by construction —
   * and the ticks appear on the very next commit.
   */
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  const isModuleComplete = (id: number) => hydrated && rawIsModuleComplete(id)
  const [expandedModules, setExpandedModules] = useState<number[]>([currentModuleId])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'preview' | 'online-only' | 'full-course' | null>(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setAccessLevel(data.user.accessLevel)
          }
        }
      } catch (error) {
        console.error('Failed to check access level:', error)
      }
    }
    checkAccess()
  }, [])

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const navigateToSection = (moduleId: number, sectionId?: string) => {
    router.push(`/modules/${moduleId}${sectionId ? `#${sectionId}` : ''}`)
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  // ── FREE SHORT COURSE (module 104) — isolated experience ──────────────────
  // Module 104 is the standalone free "Concussion Care Has Changed" awareness
  // course. It must NOT render the paid 8-module tree (getModulesMeta) — a
  // short-course viewer should see ONLY this course's chapters plus an obvious
  // upgrade path, never the full course or its content, regardless of their
  // access level. (Owner: a logged-in full-course user was seeing full access.)
  if (currentModuleId === 104) {
    const isPaid = accessLevel === 'online-only' || accessLevel === 'full-course'
    return (
      <>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-lg"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
        </button>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMobileMenu} />
        )}
        <div className={cn(
          "h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300",
          "w-full sm:w-96 md:w-80",
          "fixed md:sticky md:top-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Header — this is the FREE short course, not the full course */}
          <div className="p-6 border-b border-slate-200">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5 mb-3">
              Free short course
            </span>
            <button
              onClick={() => router.push(isPaid ? '/dashboard' : '/learning')}
              className="flex items-start gap-3 text-left hover:opacity-70 transition-all w-full group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Concussion Care Has Changed</h1>
                <p className="text-xs text-slate-500 mt-1">~1 hour · certificate on completion</p>
              </div>
            </button>
          </div>

          {/* Chapters — this free course's sections (engageable) + the paid
              content shown BELOW as visible-but-locked (see, don't engage). */}
          <div className="flex-1 overflow-y-auto py-4">
            <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wide text-teal-600">This free course</p>
            <nav className="space-y-0.5 px-3">
              {(sectionTitles ?? []).map((title, idx) => {
                const isCurrent = idx === currentSectionIndex
                const isVisited = visitedSections?.has(idx)
                return (
                  <button
                    key={idx}
                    onClick={() => { if (onSectionNavigate) { onSectionNavigate(idx) } else { navigateToSection(104) } setMobileMenuOpen(false) }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                      isCurrent ? "bg-teal-50 border border-teal-200" : "hover:bg-slate-50"
                    )}
                  >
                    {isVisited && !isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    ) : (
                      <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex-shrink-0", isCurrent ? "border-teal-500 bg-teal-500" : "border-slate-300")} />
                    )}
                    <span className={cn("text-xs truncate", isCurrent ? "text-teal-700 font-semibold" : "text-slate-600 group-hover:text-slate-800")}>
                      {title}
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* Paid content — VISIBLE but LOCKED. Free users see everything they'd
                unlock (they can't open any until they pay); clicking → pricing. */}
            {!isPaid && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 px-6 mb-2">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Locked · unlock when you enrol</span>
                </div>
                <nav className="space-y-0.5 px-3">
                  <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold text-slate-500">Concussion Clinical Mastery — full course</p>
                  {modules.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => router.push('/pricing')}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left opacity-70 hover:opacity-100 hover:bg-slate-50 transition-all"
                      title="Enrol to unlock"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-xs text-slate-500 truncate">{m.title}</span>
                    </button>
                  ))}
                  <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold text-slate-500">Other assets</p>
                  {/* CRM's own sales page. This pointed at /pricing-international,
                      the USD offer for overseas buyers — so an Australian free-tier
                      user clicking the CRM row was quoted a foreign-currency price
                      for a different package. */}
                  <button onClick={() => router.push('/concussion-rehab-mastery')} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left opacity-70 hover:opacity-100 hover:bg-slate-50 transition-all" title="Enrol to unlock">
                    <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-500 truncate">Concussion Rehab Mastery (CRM) — exercise stream</span>
                  </button>
                  <button onClick={() => router.push('/pricing')} className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left opacity-70 hover:opacity-100 hover:bg-slate-50 transition-all" title="Enrol to unlock">
                    <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-slate-500 truncate">Clinical Tools — SST Trainer + Baseline</span>
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Upgrade path — obvious route to the full paid course */}
          <div className="p-4 border-t border-slate-200 bg-gradient-to-br from-teal-50 to-emerald-50">
            {isPaid ? (
              <button onClick={() => router.push('/dashboard')} className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                Go to your full course
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <Rocket className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Go further</span>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
                  This is the awareness primer. The full <strong>Concussion Clinical Mastery</strong> course — 8 modules of diagnosis, assessment &amp; rehab — is where clinical competence is built.
                </p>
                <button onClick={() => router.push('/pricing')} className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                  Unlock the full course — A${CONFIG.COURSE.PRICE_ONLINE}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-lg"
        aria-label="Toggle navigation"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-slate-800" />
        ) : (
          <Menu className="w-6 h-6 text-slate-800" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={cn(
        "h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300",
        "w-full sm:w-96 md:w-80",
        "fixed md:sticky md:top-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
            Published
          </span>
        </div>
        <button
          onClick={() => router.push(accessLevel === 'preview' ? '/learning' : '/dashboard')}
          className="flex items-start gap-3 text-left hover:opacity-70 transition-all w-full group"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors leading-tight">
              Concussion Clinical Mastery
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Click brain icon to return home</p>
          </div>
        </button>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id)
            const isActive = currentModuleId === module.id
            const isComplete = isModuleComplete(module.id)
            // Same hydration rule as isModuleComplete above — the quiz tick a
            // few lines down is read straight off this object.
            const progress = hydrated
              ? getModuleProgress(module.id)
              : { quizCompleted: false, quizScore: null, quizTotalQuestions: null }

            return (
              <div key={module.id} className="space-y-0.5">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2.5 rounded-lg transition-all text-left group",
                    isActive ? "bg-slate-100" : "hover:bg-slate-50"
                  )}
                >
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-0.5 mt-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                  </div>

                  {/* Expand/Collapse Icon */}
                  <div className="mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Module {module.id}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 leading-tight mb-1">
                      {module.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {module.duration} • {module.points} CPD {module.points === 1 ? 'hour' : 'hours'}
                    </div>
                  </div>
                </button>

                {/* Module Sections/Lessons */}
                {isExpanded && (
                  <div className="ml-9 space-y-0.5 mt-0.5">
                    {/* Per-section navigation for active module */}
                    {isActive && sectionTitles && sectionTitles.length > 0 ? (
                      <>
                        {sectionTitles.map((title, idx) => {
                          const isCurrent = idx === currentSectionIndex
                          const isLocked = lockedAfterIndex !== undefined && idx > lockedAfterIndex
                          const isVisited = visitedSections?.has(idx)

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (!isLocked && onSectionNavigate) {
                                  onSectionNavigate(idx)
                                } else if (!isLocked) {
                                  navigateToSection(module.id)
                                }
                                setMobileMenuOpen(false)
                              }}
                              disabled={isLocked}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all text-left group",
                                isCurrent ? "bg-teal-50 border border-teal-200" : "hover:bg-slate-50",
                                isLocked && "opacity-40 cursor-not-allowed"
                              )}
                            >
                              {isLocked ? (
                                <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                              ) : isVisited && !isCurrent ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                              ) : (
                                <div className={cn(
                                  "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0",
                                  isCurrent ? "border-teal-500 bg-teal-500" : "border-slate-300"
                                )} />
                              )}
                              <span className={cn(
                                "text-xs truncate",
                                isCurrent ? "text-teal-700 font-semibold" : "text-slate-600 group-hover:text-slate-800"
                              )}>
                                {title}
                              </span>
                            </button>
                          )
                        })}
                      </>
                    ) : (
                      <>
                        {/* Fallback: simple module content + quiz links */}
                        <button
                          onClick={() => navigateToSection(module.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                            "hover:bg-slate-50"
                          )}
                        >
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-600 group-hover:text-slate-800">
                            Module Content
                          </span>
                        </button>

                        <button
                          onClick={() => navigateToSection(module.id, 'quiz')}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                            "hover:bg-slate-50"
                          )}
                        >
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-600 group-hover:text-slate-800">
                            Knowledge Check
                          </span>
                          {progress.quizCompleted &&
                           progress.quizScore !== null &&
                           progress.quizTotalQuestions !== null &&
                           (progress.quizScore / progress.quizTotalQuestions) >= 0.75 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 ml-auto" />
                          )}
                          {(!progress.quizCompleted ||
                            progress.quizScore === null ||
                            progress.quizTotalQuestions === null ||
                            (progress.quizScore / progress.quizTotalQuestions) < 0.75) && (
                            <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-full ml-auto" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Your Progress</span>
            <span className="font-semibold text-slate-800">
              {modules.filter(m => isModuleComplete(m.id)).length} / {modules.length} Modules
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${(modules.filter(m => isModuleComplete(m.id)).length / modules.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
