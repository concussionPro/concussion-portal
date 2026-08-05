'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getEpModulesMeta as getModulesMeta, epProgressId } from '@/data/ep-module-meta'
import { useProgress } from '@/contexts/ProgressContext'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, FileText, Brain, Menu, X, Lock, BookOpen, Rocket, Library, Award, Wrench, Stethoscope } from 'lucide-react'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { CrmPracticalUpsell } from '@/components/ep-course/CrmPracticalUpsell'
import type { SessionUser } from '@/contexts/SessionContext'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CourseNavigationProps {
  sectionTitles?: string[]
  currentSectionIndex?: number
  onSectionNavigate?: (index: number) => void
  lockedAfterIndex?: number
  visitedSections?: Set<number>
}

export function EpCourseNavigation({
  sectionTitles,
  currentSectionIndex,
  onSectionNavigate,
  lockedAfterIndex,
  visitedSections,
}: CourseNavigationProps = {}) {
  const router = useRouter()
  const params = useParams()
  // On the dashboard there is no [id] route param, so params.id is undefined and
  // currentModuleId is NaN. That's fine: NaN never === a real module id, so no
  // module gets the active highlight and nothing pre-expands. Guard the initial
  // expanded state so we never seed [NaN].
  const currentModuleId = params.id ? parseInt(params.id as string) : NaN
  const modules = getModulesMeta()
  const { isModuleComplete, getModuleProgress } = useProgress()
  // CRM enrolment bundles the clinical platform (SST Trainer + Baseline).
  // Provisioning grants the SST entitlement, so buyers resolve door 'sst' —
  // without this link the ONLY route to the tools they paid for was the
  // welcome email (2026-07-27 sweep: "if a CRM buyer activates today can
  // they actually use this tool?").
  const clinicalAccess = useClinicalAccess()
  const showClinicalTesting = ['owner', 'course', 'sst'].includes(clinicalAccess)
  const [expandedModules, setExpandedModules] = useState<number[]>(
    Number.isNaN(currentModuleId) ? [] : [currentModuleId]
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Session user, for the practical-day upgrade card below. (This used to hold
  // only `accessLevel`, which nothing in this file ever read — and accessLevel
  // is the WRONG signal for the EP course anyway: a CRM buyer carries
  // 'preview'. `ownsCrm && !ownsCrmPractical` is the CRM analogue of CCM's
  // 'online-only'.)
  const [user, setUser] = useState<SessionUser | null>(null)
  const allModulesComplete =
    modules.length > 0 && modules.every((m) => isModuleComplete(epProgressId(m.id)))

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
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
    router.push(`/ep-course/modules/${moduleId}${sectionId ? `#${sectionId}` : ''}`)
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
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
          onClick={() => router.push('/ep-course/dashboard')}
          className="flex items-start gap-3 text-left hover:opacity-70 transition-all w-full group"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors leading-tight">
              Concussion Rehab for EPs
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Back to your course dashboard</p>
          </div>
        </button>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id)
            const isActive = currentModuleId === module.id
            // Meta ids are DISPLAY ids (1-8); the shared progress store
            // namespaces EP modules to 201-208 — read progress via epProgressId
            // so EP completion never reflects (or corrupts) flagship modules 1-8.
            const isComplete = isModuleComplete(epProgressId(module.id))
            const progress = getModuleProgress(epProgressId(module.id))

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
                      {module.duration} • {module.points} CPD hours
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
                           (progress.quizScore / progress.quizTotalQuestions) >= 0.8 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 ml-auto" />
                          )}
                          {(!progress.quizCompleted ||
                            progress.quizScore === null ||
                            progress.quizTotalQuestions === null ||
                            (progress.quizScore / progress.quizTotalQuestions) < 0.8) && (
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

        {/* Course resources — the rest of the suite */}
        <div className="px-3 pb-4">
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Resources</p>
          {showClinicalTesting && (
            <Link
              href="/clinical-testing"
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
            >
              <Stethoscope className="h-4 w-4 text-teal-600" />
              Clinical Testing
              <span className="ml-auto rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-700">SST + Baseline</span>
            </Link>
          )}
          <Link
            href="/ep-course/references"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Library className="h-4 w-4 text-slate-400" />
            Reference Repository
          </Link>
          <Link
            href="/ep-course/toolkit"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Wrench className="h-4 w-4 text-slate-400" />
            Clinical Toolkit
          </Link>
          <Link
            href="/ep-course/admin-docs"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Admin Documents
          </Link>
          {/* Certificate — a REAL link, always. It was a non-clickable grey div,
              so a CRM buyer who finished all 8 modules had no route anywhere in
              the course to the certificate they'd paid for (2026-08-05 parity).
              The dashboard anchor holds both the specimen and the live
              /api/certificate?type=crm download. */}
          <Link
            href="/ep-course/dashboard#certificate"
            className={cn(
              'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
              allModulesComplete
                ? 'font-semibold text-teal-700 hover:bg-teal-50'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Award className={cn('h-4 w-4', allModulesComplete ? 'text-teal-600' : 'text-slate-400')} />
            Certificate
            <span className="ml-auto text-[10px]">{allModulesComplete ? 'ready' : 'on completion'}</span>
          </Link>

          {/* Practical-day upgrade — CCM has had a persistent sidebar card for
              online-only buyers since launch; the EP sidebar had no commercial
              surface at all. Demo/reviewer sessions never see it. */}
          {user && !user.isDemo && user.ownsCrm && !user.ownsCrmPractical && (
            <div className="mt-4">
              <CrmPracticalUpsell
                email={user.email}
                workshopLocation={user.workshopLocation}
                variant="sidebar"
                source="ep_sidebar"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Your Progress</span>
            <span className="font-semibold text-slate-800">
              {modules.filter(m => isModuleComplete(epProgressId(m.id))).length} / {modules.length} Modules
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${(modules.filter(m => isModuleComplete(epProgressId(m.id))).length / modules.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
