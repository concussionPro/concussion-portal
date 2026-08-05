'use client'

import { useParams, useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import React, { useState, useEffect, useCallback, useRef, type ComponentType } from 'react'
import Link from 'next/link'
import { CheckCircle2, Award, AlertCircle, ArrowRight, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent, ANALYTICS_EVENTS, trackFreeCourseCompletion, trackModuleProgress } from '@/lib/analytics'
import { DynamicContentRenderer } from '@/components/course/DynamicContentRenderer'
import { DownloadableResources } from '@/components/course/DownloadableResources'
import { ApplyTomorrow } from '@/components/course/ApplyTomorrow'
import { ContentLockedBanner } from '@/components/course/ContentLockedBanner'
import { SectionStepper, type VirtualSection } from '@/components/course/SectionStepper'
import { SectionNavButtons } from '@/components/course/SectionNavButtons'
import { ModuleNotes } from '@/components/course/ModuleNotes'
import { CoursePwaRegister } from '@/components/course/CoursePwaRegister'
import { SectionTypeBadge, estimateReadingTime } from '@/components/course/SectionTypeBadge'
import { useModuleData, type CourseKey, type InitialModuleData } from '@/hooks/useModuleData'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { CONFIG } from '@/lib/config'
import type { QuizQuestion, Section } from '@/data/modules'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * Shared course module page.
 *
 * The flagship learning suite (app/modules/[id]) and the EP course
 * (app/ep-course/modules/[id]) used to be byte-identical forks of this file
 * with ~213 mechanically differing lines. Both routes now render this single
 * implementation, parameterised by a CourseModuleDescriptor. Every point
 * where the two forks differed is a descriptor field — nothing else may vary
 * between courses.
 */

/** Props both sidebar navigations (CourseNavigation / EpCourseNavigation) accept. */
export interface CourseModuleNavProps {
  sectionTitles?: string[]
  currentSectionIndex?: number
  onSectionNavigate?: (index: number) => void
  lockedAfterIndex?: number
  visitedSections?: Set<number>
}

/** Props passed to the per-section interactive-elements component.
 *  (EpInteractiveElements only consumes moduleId + section; the extra
 *  sectionIndex prop is simply ignored there.) */
export interface CourseModuleInteractiveProps {
  moduleId: number
  section: Section
  sectionIndex: number
}

export interface CourseModuleDescriptor {
  /** Course key fed to useModuleData — selects the content API endpoint. */
  course: CourseKey
  /** Sidebar navigation component. */
  NavComponent: ComponentType<CourseModuleNavProps>
  /** Per-section supplementary interactive elements. */
  InteractiveComponent: ComponentType<CourseModuleInteractiveProps>
  /**
   * Maps the DISPLAY id from the URL to the ProgressContext id. The shared
   * progress store namespaces EP modules to 201-208 (EP shares the store with
   * the flagship course, whose modules are 1-8 — identical ids corrupted
   * progress across the two courses). ALL progress reads/writes use this id.
   * Flagship is the identity mapping.
   */
  progressIdFor: (displayId: number) => number
  /**
   * localStorage key for the section checkpoint. The EP course uses an
   * ep- prefixed key so it can never collide with the flagship course's
   * `module-N-checkpoint` keys.
   */
  checkpointKeyFor: (displayId: number) => string
  /** Path (pre-encoding) used for the login redirect on the unauthenticated upgrade screen. */
  loginPathFor: (displayId: number) => string
  /** Course dashboard / "back" destination ('/learning' | '/ep-course/modules/1'). */
  backHref: string
  /** Base path for module routes ('/modules' | '/ep-course/modules') — next-module navigation. */
  moduleBasePath: string
  /**
   * Quiz pass mark as a whole percent. Flagship 75. EP 80 — matches the
   * on-screen copy ("Score at least 80%"), the quiz intro
   * (Math.ceil(quiz.length * 0.8)), the completion-requirements check, the
   * QUIZ_SUBMIT analytics flag AND ProgressContext's canMarkModuleComplete
   * gate (quizPassThreshold returns 0.8 for the namespaced EP ids 201-208).
   */
  passMarkPercent: number
  /**
   * Append the Downloadable Resources / Apply Tomorrow virtual sections for
   * full-access users. EP suppresses them: those components are keyed by
   * moduleId and the EP modules share ids 1-8 with the flagship, so they'd
   * leak flagship content. Content sections + the Knowledge Check only.
   */
  showResources: boolean
  /**
   * Honour demo/ESSA-review sessions (data.user.isDemo). Demo / ESSA-review
   * viewers share an ephemeral synthetic session — their quiz answers must
   * never persist or restore, so the review always sees blank quizzes.
   */
  supportsDemoViewer: boolean
  /**
   * This course hosts the free SCAT modules (ids 101-104) with their special
   * quiz access, completion screens, upsells and free-course completion
   * tracking. Flagship only.
   */
  hasScatModules: boolean
  /** Final-module celebration surfaces the claim-your-certificate CTA. Flagship only. */
  showCertificateCta: boolean
  /**
   * "Module N" header label source: 'data' renders module.id, 'url' renders
   * the display id from the URL. EP must use 'url' — its module data ids are
   * the namespaced 201-208.
   */
  headerModuleNumber: 'data' | 'url'
  /**
   * Copy rendered after "full concussion management course — " in the
   * SCAT-module quiz-fail upsell (course-specific CPD framing).
   */
  scatQuizFailUpsellSuffix: string
}

// Upgrade offer screen for unauthenticated users
function UpgradeOfferScreen({ moduleId, router, loginPath }: { moduleId: number; router: AppRouterInstance; loginPath: string }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border-2 border-slate-700 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Professional CPD Course
            </h1>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Module {moduleId} is part of our <strong className="text-white">complete 8-module professional course</strong>. Get instant access to all modules, downloadable resources, and earn <strong className="text-white">up to {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD hours</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">8</div>
                <div className="text-sm text-slate-300">Complete Modules</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">Up to {CONFIG.COURSE.TOTAL_CPD_POINTS}</div>
                <div className="text-sm text-slate-300">{CONFIG.COURSE.ONLINE_CPD_POINTS} online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS} workshop</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                <div className="text-sm text-slate-300">AHPRA Aligned</div>
              </div>
            </div>

            <a
              href={CONFIG.SHOP_URL}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 mb-4"
            >
              View Course Details & Enrol
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-slate-300 text-sm mt-2">
              Already enrolled?{' '}
              <Link
                href={`/login?redirect=${encodeURIComponent(loginPath)}`}
                className="text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                Log in
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-slate-300 text-sm mb-4">
                Looking for free training?
              </p>
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

export function CourseModulePage({
  descriptor,
  initialModuleData,
}: {
  descriptor: CourseModuleDescriptor
  /**
   * Module content the SERVER already resolved for this request (same gating,
   * lib/module-access.ts). When supplied the page renders content on the FIRST
   * paint instead of shipping a spinner and chaining session → module fetches.
   * Omit it and the hook falls back to fetching, unchanged.
   */
  initialModuleData?: InitialModuleData
}) {
  const { backHref, loginPathFor, supportsDemoViewer } = descriptor
  const params = useParams()
  const router = useRouter()
  const moduleId = parseInt(params.id as string)
  const isValidModuleId = !isNaN(moduleId)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  // Demo / ESSA-review viewers share an ephemeral synthetic session — their quiz
  // answers must never persist or restore, so the review always sees blank quizzes.
  // (Only honoured for courses with supportsDemoViewer; stays false otherwise.)
  const [isDemoViewer, setIsDemoViewer] = useState(false)

  // Check authentication first
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            // Preview users trying to access paid modules (2-8): redirect to learning suite
            // Module 1 is allowed — API returns truncated content (first 2 sections) + ContentLockedBanner
            // CRM buyers ALSO carry accessLevel 'preview' (streams are isolated — a CRM
            // purchase never touches users.access_level), so ownership admits them here.
            // Without the ownsCrm check every paying CRM customer was bounced out of
            // modules 2-8 forever and could never earn their certificate (2026-08-05).
            if (data.user.accessLevel === 'preview' && !data.user.ownsCrm && moduleId >= 2 && moduleId <= 8) {
              router.push(backHref)
              return
            }
            setIsAuthenticated(true)
            if (data.user.email) setUserEmail(data.user.email)
            if (supportsDemoViewer) setIsDemoViewer(!!data.user.isDemo)
            setCheckingAuth(false)
            return
          }
        }
        // Not authenticated
        setIsAuthenticated(false)
        setCheckingAuth(false)
      } catch (error) {
        setIsAuthenticated(false)
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [moduleId, router])

  // NOTE: all early returns live BELOW every hook call (rules of hooks)
  if (!isValidModuleId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Module Not Found</h1>
          <Link href={backHref} className="text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  // If not authenticated and trying to access paid module (1-8), show upgrade offer
  if (!isAuthenticated && moduleId >= 1 && moduleId <= 8) {
    return <UpgradeOfferScreen moduleId={moduleId} router={router} loginPath={loginPathFor(moduleId)} />
  }

  // If not authenticated and trying to access SCAT module (101-104), redirect to signup.
  // DEV-ONLY: skip the gate on localhost so the free course renders for review.
  if (!isAuthenticated && moduleId >= 101 && moduleId <= 104 && process.env.NODE_ENV === 'production') {
    router.push('/scat-mastery')
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  // Authenticated - render module content
  return <ModulePageContent moduleId={moduleId} router={router} userEmail={userEmail} isDemoViewer={isDemoViewer} descriptor={descriptor} initialModuleData={initialModuleData} />
}

function ModulePageContent({ moduleId, router, userEmail, isDemoViewer, descriptor, initialModuleData }: { moduleId: number; router: AppRouterInstance; userEmail: string; isDemoViewer: boolean; descriptor: CourseModuleDescriptor; initialModuleData?: InitialModuleData }) {
  const {
    course,
    NavComponent,
    InteractiveComponent,
    progressIdFor,
    checkpointKeyFor,
    backHref,
    moduleBasePath,
    passMarkPercent,
    showResources,
    hasScatModules,
    showCertificateCta,
    headerModuleNumber,
    scatQuizFailUpsellSuffix,
  } = descriptor

  // moduleId is the DISPLAY id from the URL. ALL progress reads/writes use
  // progressId (see CourseModuleDescriptor.progressIdFor — EP namespaces to
  // 201-208, flagship is identity).
  const progressId = progressIdFor(moduleId)

  // Fetch module content from secure API
  const { module, loading: moduleLoading, error: moduleError, accessLevel, needsUpgrade, allSectionTitles } = useModuleData(moduleId, course, initialModuleData)
  const {
    updateQuizScore,
    saveQuizAnswers,
    markModuleComplete,
    markModuleStarted,
    trackActiveStudy,
    flushSave,
    getModuleProgress,
    canMarkModuleComplete,
    isModuleComplete,
    syncState,
    isInitialized,
  } = useProgress()

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  // In-progress answers hydrate from the server-synced ProgressContext AFTER
  // the server load completes (isInitialized). Hydrating in the useState
  // initializer read the pre-load default ({}), and the save effect then
  // pushed {} back over the saved answers — destroying cross-device resume.
  const [answersHydrated, setAnswersHydrated] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({})
  const [quizValidationError, setQuizValidationError] = useState<string | null>(null)
  const [showCompleteButton, setShowCompleteButton] = useState(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set([0]))
  const contentAreaRef = useRef<HTMLDivElement>(null)

  const moduleProgress = getModuleProgress(progressId)

  // Determine if user has full access based on API response
  const hasFullAccess = accessLevel === 'online-only' || accessLevel === 'full-course'

  const [isRetaking, setIsRetaking] = useState<Record<number, boolean>>({})

  // Free SCAT modules (101-104) — flagship only; other courses never host them.
  const isSCATModule = hasScatModules && moduleId >= 101 && moduleId <= 104

  // localStorage key for the section checkpoint (course-prefixed, never collides)
  const checkpointKey = checkpointKeyFor(moduleId)

  // Build virtual sections array: content sections + resources + apply-tomorrow + quiz
  // When module has parts, insert part-quiz and part-milestone virtual sections
  const virtualSections: VirtualSection[] = React.useMemo(() => {
    if (!module) return []

    if (module.parts && module.parts.length > 0) {
      // Parts-based layout
      const sections: VirtualSection[] = []
      module.parts.forEach((part, partIndex) => {
        // Add content sections for this part
        part.sectionIds.forEach(sectionId => {
          const sIdx = module.sections.findIndex(s => s.id === sectionId)
          if (sIdx >= 0) {
            sections.push({
              type: 'content' as const,
              label: module.sections[sIdx].title,
              index: sections.length,
            })
          }
        })
        // Add part quiz after this part's content
        sections.push({
          type: 'part-quiz' as const,
          label: `${part.title} — Quiz`,
          index: sections.length,
        })
        // Add milestone between parts (not after the last part)
        if (partIndex < module.parts!.length - 1) {
          sections.push({
            type: 'part-milestone' as const,
            label: `${part.title} Complete`,
            index: sections.length,
          })
        }
      })
      // Add resources, apply-tomorrow at end. Suppressed when !showResources
      // (EP: those components are moduleId-keyed → would leak flagship content
      // since EP shares ids 1-8).
      if (showResources && hasFullAccess) {
        sections.push(
          { type: 'resources', label: 'Downloadable Resources', index: sections.length },
          { type: 'apply-tomorrow', label: 'Apply Tomorrow', index: sections.length + 1 },
        )
      }
      return sections
    }

    // Standard layout (no parts)
    const sections: VirtualSection[] = module.sections.map((s, i) => ({
      type: 'content' as const,
      label: s.title,
      index: i,
    }))
    if (hasFullAccess) {
      // Downloadable Resources / Apply Tomorrow steps are descriptor-gated —
      // EP suppresses them (moduleId-keyed components + EP modules share ids
      // 1-8 with the flagship, so they'd leak flagship content: content
      // sections + the Knowledge Check only).
      if (showResources) {
        sections.push(
          { type: 'resources', label: 'Downloadable Resources', index: sections.length },
          { type: 'apply-tomorrow', label: 'Apply Tomorrow', index: sections.length + 1 },
        )
      }
      sections.push(
        { type: 'quiz', label: 'Knowledge Check', index: sections.length },
      )
    } else if (isSCATModule) {
      // Free SCAT course users get the quiz (needed to complete modules and earn CPD)
      sections.push(
        { type: 'quiz', label: 'Knowledge Check', index: sections.length },
      )
    }
    return sections
  }, [module, hasFullAccess, moduleId])

  // For free/preview users: lock paid modules after section 1, but SCAT modules are fully open
  const lockedAfterIndex = (hasFullAccess || isSCATModule) ? undefined : 1

  // Sync quizSubmitted with persisted progress (skip parts that user is retaking)
  useEffect(() => {
    if (moduleProgress.quizCompleted) {
      if (module?.parts && module.parts.length > 0) {
        // Parts-based: mark all parts as submitted unless user is retaking that part
        const submitted: Record<number, boolean> = {}
        module.parts.forEach((_, i) => {
          if (!isRetaking[i]) submitted[i] = true
        })
        setQuizSubmitted(prev => ({ ...prev, ...submitted }))
      } else if (!isRetaking[0]) {
        // Standard quiz: use key 0
        setQuizSubmitted(prev => ({ ...prev, 0: true }))
      }
    }
  }, [moduleProgress.quizCompleted, isRetaking, module])

  // Hydrate in-progress quiz answers once the server-synced progress is loaded
  // (never for demo/review viewers — their quizzes always start blank). Merge
  // under any selections the user already made on this device so a slow load
  // can never clobber fresh input.
  useEffect(() => {
    if (!isInitialized || answersHydrated) return
    if (!isDemoViewer) {
      const saved = getModuleProgress(progressId).quizAnswers
      if (saved && Object.keys(saved).length > 0) {
        setQuizAnswers(prev => ({ ...saved, ...prev }))
      }
    }
    setAnswersHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, answersHydrated, progressId, isDemoViewer])

  // Sync in-progress quiz answers via ProgressContext — never before hydration
  // (we'd push {} over the saved answers), and NEVER for demo/review viewers
  // (ephemeral shared session): their answers must not persist or restore.
  useEffect(() => {
    if (isDemoViewer || !answersHydrated) return
    saveQuizAnswers(progressId, quizAnswers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizAnswers, progressId, isDemoViewer, answersHydrated])

  // Once we know it's a demo/review session, clear any answers restored from this
  // browser's localStorage so every review starts with blank quizzes.
  useEffect(() => {
    if (isDemoViewer) setQuizAnswers({})
  }, [isDemoViewer])

  // Save current section to localStorage as checkpoint — course-prefixed key
  // (checkpointKeyFor) so the two courses' checkpoints can never collide.
  useEffect(() => {
    if (module) {
      localStorage.setItem(checkpointKey, currentSectionIndex.toString())
      setVisitedSections(prev => new Set(prev).add(currentSectionIndex))
    }
  }, [currentSectionIndex, checkpointKey, module])

  // Restore checkpoint on mount
  useEffect(() => {
    if (module) {
      const saved = localStorage.getItem(checkpointKey)
      if (saved) {
        const idx = parseInt(saved)
        if (idx >= 0 && idx < virtualSections.length) {
          // Respect lock for free users
          if (lockedAfterIndex !== undefined && idx > lockedAfterIndex) {
            setCurrentSectionIndex(0)
          } else {
            setCurrentSectionIndex(idx)
          }
        }
      }
      // Also check URL hash
      const hash = window.location.hash.replace('#', '')
      if (hash === 'quiz' && (hasFullAccess || isSCATModule)) {
        const quizIdx = virtualSections.findIndex(v => v.type === 'quiz')
        if (quizIdx >= 0) setCurrentSectionIndex(quizIdx)
      } else if (hash && module.sections) {
        // Find the virtualSection index for this section ID (accounts for part-quiz/milestone inserts)
        const vsIdx = virtualSections.findIndex((v, i) => {
          if (v.type !== 'content') return false
          const contentIdx = virtualSections.slice(0, i).filter(vs => vs.type === 'content').length
          return module.sections[contentIdx]?.id === hash
        })
        if (vsIdx >= 0 && (lockedAfterIndex === undefined || vsIdx <= lockedAfterIndex)) {
          setCurrentSectionIndex(vsIdx)
        }
      }
    }
  }, [moduleId, module, virtualSections.length])

  // Scroll to top of content area on section change
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentSectionIndex])

  const navigateSection = useCallback((index: number) => {
    if (lockedAfterIndex !== undefined && index > lockedAfterIndex) return
    if (index >= 0 && index < virtualSections.length) {
      setCurrentSectionIndex(index)
    }
  }, [lockedAfterIndex, virtualSections.length])

  // Mark module as started and track active study time
  useEffect(() => {
    if (module) {
      markModuleStarted(progressId)
      trackActiveStudy(progressId)

      // Track study time every 60 seconds while the user is on the page
      const interval = setInterval(() => {
        trackActiveStudy(progressId)
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [progressId, module])

  // FULL module-completion flow — the single path for BOTH the auto-complete
  // on quiz pass and the manual "Complete Module" button. Owns the celebration
  // screen, the SCAT $50-off reveal, free-course completion tracking (flagship
  // SCAT modules only), the progress flush and checkpoint cleanup. (A previous
  // regression had the auto-complete path call markModuleComplete directly,
  // silently skipping all of this.)
  // Analytics: module_start once per mount when content is loaded (real users
  // only — demo/review viewers are excluded). This event powers the
  // signup->start activation funnel; it was previously never fired anywhere.
  const startTrackedRef = useRef(false)
  useEffect(() => {
    if (!module || isDemoViewer || startTrackedRef.current) return
    startTrackedRef.current = true
    trackModuleProgress(String(moduleId), 'start', { course: descriptor.course })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, isDemoViewer])

  const completionRanRef = useRef(false)
  const runModuleCompletion = useCallback(async () => {
    if (!module) return
    if (!canMarkModuleComplete(progressId)) return
    if (completionRanRef.current) return
    completionRanRef.current = true

    markModuleComplete(progressId)
    if (!isDemoViewer) {
      trackModuleProgress(String(moduleId), 'complete', { course: descriptor.course })
    }

    // Check if all 3 SCAT modules (101-103) are now complete — flagship only
    if (hasScatModules && moduleId >= 101 && moduleId <= 103) {
      const scatModuleIds = [101, 102, 103]
      const allScatComplete = scatModuleIds.every(
        id => id === moduleId || isModuleComplete(id)
      )
      if (allScatComplete && userEmail) {
        trackFreeCourseCompletion(userEmail)
      }
    }

    try {
      await flushSave()
    } catch (error) {
      console.error('Failed to save progress:', error)
      // Still show completion — progress is saved locally and will sync on next load
    }
    // Clean up section checkpoint
    localStorage.removeItem(checkpointKey)
    // Show celebration before redirecting
    setShowCompletionCelebration(true)
  }, [module, moduleId, progressId, userEmail, hasScatModules, checkpointKey, canMarkModuleComplete, markModuleComplete, isModuleComplete, flushSave])

  useEffect(() => {
    if (module && moduleProgress) {
      const canComplete = canMarkModuleComplete(progressId)
      const alreadyComplete = isModuleComplete(progressId)
      // AUTO-COMPLETE on quiz pass — was requiring a manual button click
      // which most users miss. Result: paid users who finished content showed
      // as 'barely finished' in admin, and upgrade pitches gated on completion
      // count never fired (SCAT-free → paid upsell, almost-done nurture etc).
      // The button stays visible as a redundant affordance, but completion
      // now fires automatically — through the FULL completion flow — the
      // moment quiz pass criteria are met.
      if (canComplete && !alreadyComplete) {
        runModuleCompletion()
      }
      setShowCompleteButton(canComplete && !alreadyComplete)
    }
  }, [module, moduleProgress, progressId, canMarkModuleComplete, isModuleComplete, runModuleCompletion])

  // Show loading state while fetching module
  if (moduleLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <NavComponent />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading module content...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show upgrade offer if preview user tries to access paid module.
  // STREAM-CORRECT: the EP course must sell CRM (ESSA-accredited, 16 CPD,
  // /concussion-rehab-mastery), never the flagship CCM pitch — a blocked EP
  // prospect being offered "16 CPD hours" at the CCM checkout is the wrong
  // course for their profession.
  if (needsUpgrade) {
    const isEp = descriptor.course === 'ep'
    const offer = isEp
      ? {
          blurb: <>This module is part of <strong className="text-white">Concussion Rehab Mastery</strong> — the complete 8-module rehab course for exercise physiologists. Enrol for instant access to all modules and <strong className="text-white">{CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD points online</strong> ({CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} CPD hours with the practical day).</>,
          statHours: `Up to ${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS}`,
          statBreakdown: `${CONFIG.COURSE.ONLINE_CPD_POINTS} online + practical day`,
          badge: 'ESSA Accredited',
          href: '/concussion-rehab-mastery',
          cta: `Enrol Now — from $${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()}`,
          priceLine: `Online $${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()} · Complete with practical day from $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird`,
        }
      : {
          blurb: <>This module is part of the <strong className="text-white">complete 8-module course</strong>. Upgrade to get instant access to all modules, downloadable resources, and earn <strong className="text-white">up to {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours</strong>.</>,
          statHours: `Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS}`,
          statBreakdown: `${CONFIG.COURSE.ONLINE_CPD_POINTS} online + ${CONFIG.COURSE.TOTAL_CPD_POINTS - CONFIG.COURSE.ONLINE_CPD_POINTS} workshop`,
          badge: 'AHPRA Aligned',
          href: CONFIG.SHOP_URL,
          cta: `Upgrade Now — from $${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()}`,
          priceLine: `Online from $${CONFIG.COURSE.PRICE_ONLINE.toLocaleString()} · Full course with workshop from $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird`,
        }
    return (
      <div className="flex min-h-screen bg-slate-50">
        <NavComponent />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border-2 border-slate-700 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">
                Unlock Full Course Access
              </h1>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                {offer.blurb}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <div className="text-3xl font-bold text-amber-400 mb-1">8</div>
                  <div className="text-sm text-slate-300">Complete Modules</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <div className="text-3xl font-bold text-amber-400 mb-1">{offer.statHours}</div>
                  <div className="text-sm text-slate-300">{offer.statBreakdown}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                  <div className="text-sm text-slate-300">{offer.badge}</div>
                </div>
              </div>

              <a
                href={offer.href}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {offer.cta}
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-slate-400 text-sm mt-6">
                {offer.priceLine}
              </p>

              <button
                onClick={() => router.push(backHref)}
                className="mt-6 text-slate-400 hover:text-white underline text-sm"
              >
                ← Back to My Course
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error state if module fetch failed
  if (moduleError) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <NavComponent />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Module</h1>
            <p className="text-slate-600 mb-4">{moduleError}</p>
            <button
              onClick={() => router.push(backHref)}
              className="btn-primary px-6 py-3 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Show not found if module doesn't exist
  if (!module) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <NavComponent />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Module not found</h1>
          </div>
        </main>
      </div>
    )
  }

  const handleQuizSubmit = () => {
    if (!module) return

    const unansweredQ = module.quiz.find((q: QuizQuestion) => quizAnswers[q.id] === undefined)
    if (unansweredQ) {
      const answeredCount = module.quiz.filter((q: QuizQuestion) => quizAnswers[q.id] !== undefined).length
      setQuizValidationError(
        `Please answer all ${module.quiz.length} questions before submitting. You've answered ${answeredCount} of ${module.quiz.length}.`
      )
      // Scroll to first unanswered question
      const el = document.getElementById(`quiz-q-${unansweredQ.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // If the unanswered question is in a different part, find which part it's in
        // and navigate to that part's quiz section
        if (module.parts) {
          const partIndex = module.parts.findIndex(p => p.quizIds.includes(unansweredQ.id))
          if (partIndex >= 0) {
            const partQuizIndices = virtualSections
              .map((vs, i) => vs.type === 'part-quiz' ? i : -1)
              .filter(i => i >= 0)
            if (partQuizIndices[partIndex] !== undefined) {
              navigateSection(partQuizIndices[partIndex])
              // After navigating, scroll to the question after a short delay
              setTimeout(() => {
                const elRetry = document.getElementById(`quiz-q-${unansweredQ.id}`)
                if (elRetry) elRetry.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 300)
            }
          }
        }
      }
      return
    }

    setQuizValidationError(null)
    let correctCount = 0
    module.quiz.forEach((question: QuizQuestion) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })

    updateQuizScore(progressId, correctCount, module.quiz.length, quizAnswers)

    // Fire analytics event with quiz details (progress-namespaced id — keeps
    // EP quiz submits distinguishable from flagship modules 1-8 in analytics)
    trackEvent(ANALYTICS_EVENTS.QUIZ_SUBMIT, {
      moduleId: progressId,
      score: correctCount,
      totalQuestions: module.quiz.length,
      passed: correctCount / module.quiz.length >= passMarkPercent / 100,
    })

    // Mark all parts (or standard quiz key 0) as submitted
    if (module.parts && module.parts.length > 0) {
      const allSubmitted: Record<number, boolean> = {}
      module.parts.forEach((_, i) => { allSubmitted[i] = true })
      setIsRetaking({})
      setQuizSubmitted(allSubmitted)
    } else {
      setIsRetaking({})
      setQuizSubmitted({ 0: true })
    }
  }

  // Manual button path — same full completion flow as the auto-complete.
  const handleCompleteModule = runModuleCompletion

  // Check if any part has been submitted (for overall quiz result display)
  const anyQuizSubmitted = Object.values(quizSubmitted).some(Boolean)

  const getQuizResult = () => {
    if (!anyQuizSubmitted || moduleProgress.quizScore === null) return null
    // Use saved total questions if available, otherwise use current module quiz length
    const totalQuestions = moduleProgress.quizTotalQuestions || module.quiz.length
    const percentage = (moduleProgress.quizScore / totalQuestions) * 100
    // Pass mark is per-course (flagship 75%, EP 80%) — must stay in lockstep
    // with the on-screen copy, the quiz intro, the completion-requirements
    // check, the QUIZ_SUBMIT analytics flag AND ProgressContext's
    // canMarkModuleComplete gate (quizPassThreshold).
    const passed = percentage >= passMarkPercent
    return { percentage, passed, score: moduleProgress.quizScore }
  }

  const quizResult = getQuizResult()

  // "Module N" header label (EP data ids are namespaced 201-208 → use URL id)
  const headerModuleNo = headerModuleNumber === 'data' ? module.id : moduleId

  // Check if ALL SCAT modules are complete (for special completion screen)
  const allScatComplete = isSCATModule && [101, 102, 103].every(
    id => id === moduleId || isModuleComplete(id)
  )

  // Completion celebration overlay
  if (showCompletionCelebration && module) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="max-w-lg mx-auto p-8 text-center animate-fadeInUp">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Award className="w-10 h-10 text-white" strokeWidth={2} />
          </div>

          {allScatComplete ? (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">SCAT6 Mastery Complete!</h1>
              <p className="text-lg text-slate-600 mb-6">
                You&apos;ve completed all 3 modules of the free SCAT6 Mastery course. Ready to go deeper?
              </p>

              {/* Promo offer */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 mb-6 text-left">
                <p className="text-sm font-bold text-emerald-800 mb-2">You&apos;ve earned $50 off the full course</p>
                <p className="text-sm text-slate-600 mb-3">
                  SCAT6 is one assessment tool — but confident concussion management requires more. The full course teaches you to administer VOMS vestibular screening, score BESS accurately, identify concussion phenotypes, and make evidence-based return-to-play decisions. Online ({CONFIG.COURSE.ONLINE_CPD_POINTS} CPD) or complete with hands-on workshop ({CONFIG.COURSE.TOTAL_CPD_POINTS} CPD).
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-100 rounded-lg px-3 py-2 w-fit">
                  Code: {CONFIG.COURSE.PROMO_CODE} · $50 off · applied automatically
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Link
                  href={`/pricing?promo=${CONFIG.COURSE.PROMO_CODE}`}
                  className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                >
                  Claim $50 Off — View Full Course
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => router.push(backHref)}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Back to dashboard
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Module Complete!</h1>
              <p className="text-lg text-slate-600 mb-8">
                You&apos;ve completed <strong>{module.title}</strong>{module.points > 0 ? <> and earned <strong>{module.points} CPD {module.points === 1 ? 'point' : 'points'}</strong></> : ''}.
              </p>
              {quizResult && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 mb-8 inline-block">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Quiz Score</div>
                  <div className="text-2xl font-bold text-teal-600">
                    {quizResult.score} / {moduleProgress.quizTotalQuestions || module.quiz.length}
                    <span className="text-base text-slate-400 ml-2">({quizResult.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              )}

              {/* Prominent upgrade CTA after SCAT module 102 (mid-course peak engagement) */}
              {isSCATModule && moduleId === 102 && (
                <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-xl p-6 border-2 border-teal-200 mb-6 text-left max-w-md mx-auto">
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    SCAT6 is just one assessment tool
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    Confident concussion management requires VOMS vestibular screening, BESS balance testing, and evidence-based return-to-play decisions. The full course covers all of this — {CONFIG.COURSE.TOTAL_MODULES} modules, up to {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours.
                  </p>
                  <Link
                    href={`/pricing?promo=${CONFIG.COURSE.PROMO_CODE}`}
                    onClick={() => trackEvent('upgrade_cta_click', { source: `module_${moduleId}_completion`, from: 'preview' })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                  >
                    View Full Course — from ${CONFIG.COURSE.PRICE_ONLINE}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-teal-700 font-medium mt-2">
                    Use code {CONFIG.COURSE.PROMO_CODE} for $50 off
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                {(() => {
                  const lastModuleId = isSCATModule ? 103 : 8
                  const hasNext = moduleId < lastModuleId
                  // Module 104 — the free standalone "Concussion Care Has Changed"
                  // awareness course. It promises a certificate of completion, so
                  // its completion screen surfaces the claim CTA (not "View All
                  // Modules"). Cert issued via /api/certificate?type=recognition-referral.
                  if (moduleId === 104) {
                    // PEAK conversion moment — lead with the upgrade, gap-framed
                    // (you can recognise & refer; assessing/managing is the paid
                    // skill), certificate secondary. Design-for-conversion.
                    return (
                      <>
                        <p className="text-sm text-slate-600 max-w-md text-center mb-1 leading-relaxed">
                          You can now recognise a concussion and refer safely. <strong className="text-slate-800">Assessing, diagnosing and managing it</strong> is the clinical skill — and that&rsquo;s the full course.
                        </p>
                        <button
                          onClick={() => router.push('/pricing')}
                          className="px-8 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                        >
                          Become clinically competent — Concussion Clinical Mastery
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-slate-500">8 CPD hours online · A${CONFIG.COURSE.PRICE_ONLINE} · lifetime access</p>
                        <button
                          onClick={() => router.push('/settings#certificate')}
                          className="mt-1 text-sm font-semibold text-accent hover:underline"
                        >
                          Claim your free certificate
                        </button>
                        <button
                          onClick={() => router.push(backHref)}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                        >
                          Back to all modules
                        </button>
                      </>
                    )
                  }
                  // Course finished (paid 8/8): the certificate is the payoff —
                  // surface it HERE, not buried in Settings (2026-07-05 audit).
                  // Flagship only (showCertificateCta).
                  if (!hasNext && !isSCATModule && showCertificateCta) {
                    return (
                      <>
                        <button
                          onClick={() => router.push('/settings#certificate')}
                          className="px-8 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                        >
                          Claim your 8-CPD certificate
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(backHref)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                          Back to all modules
                        </button>
                      </>
                    )
                  }
                  return (
                    <button
                      onClick={() => router.push(hasNext ? `${moduleBasePath}/${moduleId + 1}` : backHref)}
                      className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                    >
                      {hasNext ? `Start Module ${isSCATModule ? moduleId - 99 : moduleId + 1}` : 'View All Modules'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )
                })()}
                {isSCATModule && moduleId !== 102 && moduleId !== 104 && (
                  <div className="flex flex-col items-center gap-2">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-accent border-2 border-accent rounded-xl hover:bg-accent/5 transition-colors"
                    >
                      Unlock all 8 modules · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                      Learn VOMS screening, BESS scoring, return-to-play protocols &amp; phenotype-based rehabilitation
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // The FREE courses (SCAT 101-103 + the 104 awareness course) live INSIDE the
  // portal architecture — the dashboard Sidebar — for EVERYONE, not just preview
  // users (a paid tester must see it too). Free users get every paid feature
  // (Clinical Testing, Toolkit, References, CCM/CRM via Learning Suite) shown
  // LOCKED with an upgrade carrot; paid users see the same portal nav unlocked.
  // Paid modules 1-8 keep the course-player nav for paid students. (Owner: the
  // free course must live in the portal with the paid items locked + a carrot.)
  const usePortalSidebar = isSCATModule || accessLevel === 'preview'
  return (
    <div className="flex min-h-screen bg-slate-50">
      {usePortalSidebar ? (
        <Sidebar />
      ) : (
        <NavComponent
          sectionTitles={virtualSections.map(v => v.label)}
          currentSectionIndex={currentSectionIndex}
          onSectionNavigate={navigateSection}
          lockedAfterIndex={lockedAfterIndex}
          visitedSections={visitedSections}
        />
      )}
      <main className={cn("flex-1 w-full overflow-y-auto", usePortalSidebar ? "md:ml-64" : "md:ml-0")} ref={contentAreaRef}>
        <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Module Header — full on section 0, compact on subsequent sections */}
          {currentSectionIndex === 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Module {headerModuleNo}
                    </span>
                    {isModuleComplete(progressId) && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Completed
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight leading-tight">
                    {module.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 font-medium mb-3">{module.subtitle}</p>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Module Meta */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-700">{module.points} CPD Hours</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">{module.duration}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => navigateSection(0)}
                className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-teal-600 transition-colors"
              >
                Module {headerModuleNo}
              </button>
              <span className="text-slate-300">/</span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                {module.title}
              </h1>
              {isModuleComplete(progressId) && (
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" strokeWidth={2.5} />
              )}
              {/* Sync status indicator */}
              <div className="ml-auto flex-shrink-0">
                {syncState === 'syncing' && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {syncState === 'synced' && (
                  <span className="text-xs text-teal-500">Saved</span>
                )}
                {syncState === 'error' && (
                  <span className="text-xs text-red-500">Save failed</span>
                )}
                {syncState === 'offline' && (
                  <span className="text-xs text-amber-500">Offline</span>
                )}
              </div>
            </div>
          )}

          {/* Section Stepper */}
          <SectionStepper
            virtualSections={virtualSections}
            currentIndex={currentSectionIndex}
            visitedIndices={visitedSections}
            lockedAfterIndex={lockedAfterIndex}
            onNavigate={navigateSection}
          />

          {/* Single Section Rendering */}
          {(() => {
            const currentVS = virtualSections[currentSectionIndex]
            if (!currentVS) return null

            // Locked section — show banner
            if (lockedAfterIndex !== undefined && currentSectionIndex > lockedAfterIndex) {
              const lockedTitles = allSectionTitles
                ? allSectionTitles.slice(lockedAfterIndex + 1)
                : module.sections.slice(lockedAfterIndex + 1).map(s => s.title)
              return (
                <ContentLockedBanner
                  remainingSections={lockedTitles}
                />
              )
            }

            // Content section
            if (currentVS.type === 'content') {
              // Map virtual section index to actual module section
              // Count how many content sections appear before this index
              const contentIndex = virtualSections.slice(0, currentSectionIndex).filter(v => v.type === 'content').length
              const section = module.sections[contentIndex]
              if (!section) return null
              const readTime = estimateReadingTime(section.content)

              return (
                <div key={currentSectionIndex} className="animate-fadeInUp">
                  <div
                    id={section.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6"
                  >
                    {/* Section header — inline, full width */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">
                          {(contentIndex + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight flex-1">
                        {section.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 mb-6 ml-0 sm:ml-12">
                      <SectionTypeBadge sectionId={section.id} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readTime} min read
                      </span>
                    </div>

                    {/* Content — full width, no flex constraint */}
                    <DynamicContentRenderer content={section.content} sectionIndex={currentSectionIndex} />
                    <InteractiveComponent
                      moduleId={moduleId}
                      section={section}
                      sectionIndex={currentSectionIndex}
                    />
                  </div>

                  {/* Show lock banner with remaining titles after last free section */}
                  {!hasFullAccess && lockedAfterIndex !== undefined && currentSectionIndex === lockedAfterIndex && (
                    <ContentLockedBanner
                      remainingSections={
                        allSectionTitles
                          ? allSectionTitles.slice(lockedAfterIndex + 1)
                          : module.sections.slice(lockedAfterIndex + 1).map(s => s.title)
                      }
                    />
                  )}
                </div>
              )
            }

            // Resources section (paid only)
            if (currentVS.type === 'resources') {
              return (
                <div key="resources" className="animate-fadeInUp">
                  <DownloadableResources moduleId={moduleId} />
                </div>
              )
            }

            // Apply Tomorrow section (paid only)
            if (currentVS.type === 'apply-tomorrow') {
              return (
                <div key="apply-tomorrow" className="animate-fadeInUp">
                  <ApplyTomorrow moduleId={moduleId} />
                </div>
              )
            }

            // Part Quiz section (parts-based modules)
            if (currentVS.type === 'part-quiz' && module.parts) {
              // Determine which part this quiz belongs to
              const partQuizIndices = virtualSections
                .map((vs, i) => vs.type === 'part-quiz' ? i : -1)
                .filter(i => i >= 0)
              const partNumber = partQuizIndices.indexOf(currentSectionIndex)
              const part = module.parts[partNumber]
              if (!part) return null

              const partQuizQuestions = module.quiz.filter(q => part.quizIds.includes(q.id))
              const partLabel = part.title

              return (
                <div key={`part-quiz-${partNumber}`} className="animate-fadeInUp">
                  <div id={`part-quiz-${partNumber}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                    <div className="flex items-start gap-6 mb-8">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 border border-teal-200 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-teal-600" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{partLabel} — Knowledge Check</h2>
                        <p className="text-[15px] text-slate-600 leading-relaxed">
                          Test your understanding of the content covered in {partLabel.toLowerCase()}.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {partQuizQuestions.map((question, qIndex) => {
                        const partIsSubmitted = !!quizSubmitted[partNumber]
                        return (
                        <div key={question.id} className="space-y-4" id={`quiz-q-${question.id}`}>
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{qIndex + 1}</span>
                              </div>
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Question {qIndex + 1} of {partQuizQuestions.length}
                              </span>
                            </div>
                          </div>
                          <p className="font-semibold text-slate-900 text-base leading-relaxed ml-0 sm:ml-11">
                            {question.question}
                          </p>
                          <div className="space-y-3 ml-0 sm:ml-12">
                            {question.options?.map((option: string, oIndex: number) => {
                              const isSelected = quizAnswers[question.id] === oIndex
                              const isCorrect = question.correctAnswer === oIndex
                              const showResult = partIsSubmitted

                              return (
                                <label
                                  key={oIndex}
                                  className={cn(
                                    'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2',
                                    !showResult && 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                                    isSelected && !showResult && 'border-teal-500 bg-teal-50/50',
                                    showResult && isCorrect && 'border-teal-500 bg-teal-50',
                                    showResult && isSelected && !isCorrect && 'border-red-400 bg-red-50'
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={question.id}
                                    checked={isSelected}
                                    onChange={() =>
                                      !partIsSubmitted &&
                                      setQuizAnswers((prev) => ({
                                        ...prev,
                                        [question.id]: oIndex,
                                      }))
                                    }
                                    disabled={partIsSubmitted}
                                    className="mt-0.5 w-4 h-4 text-teal-600 flex-shrink-0"
                                  />
                                  <span className="text-[15px] text-slate-700 leading-relaxed">{option}</span>
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto flex-shrink-0" strokeWidth={2.5} />
                                  )}
                                </label>
                              )
                            })}
                          </div>
                          {partIsSubmitted && (
                            <div className="ml-0 sm:ml-12 mt-4 p-5 rounded-xl bg-blue-50 border border-blue-200">
                              <p className="text-sm font-semibold text-slate-900 mb-2">Explanation</p>
                              <p className="text-[15px] text-slate-700 leading-relaxed">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>

                    {/* Show submit on last part-quiz, continue button on earlier parts */}
                    {partNumber === (module.parts?.length ?? 1) - 1 ? (
                      <>
                        <div className="border-t border-slate-200 my-8" />
                        {!quizSubmitted[partNumber] ? (
                          <div>
                            {quizValidationError && (
                              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm text-amber-800 font-medium">{quizValidationError}</p>
                              </div>
                            )}
                            <button
                              onClick={handleQuizSubmit}
                              className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                              Submit All Answers
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className={cn(
                            "p-6 rounded-xl border-2",
                            quizResult?.passed ? "bg-teal-50 border-teal-500" : "bg-amber-50 border-amber-500"
                          )}>
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                quizResult?.passed ? "bg-teal-100" : "bg-amber-100"
                              )}>
                                {quizResult?.passed ? (
                                  <CheckCircle2 className="w-5 h-5 text-teal-700" strokeWidth={2.5} />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-amber-700" strokeWidth={2.5} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-slate-900 mb-1">
                                  {quizResult?.passed ? 'Knowledge Check Passed!' : 'Review Required'}
                                </p>
                                <p className="text-[15px] text-slate-700 mb-4">
                                  You scored {quizResult?.score} out of {module.quiz.length} ({quizResult?.percentage.toFixed(0)}%)
                                  {!quizResult?.passed && '. Please review the content and try again.'}
                                </p>
                                {!quizResult?.passed && (
                                  <button
                                    onClick={() => {
                                      // Clear ALL part answers and submitted states for a full retake
                                      const retakingAll: Record<number, boolean> = {}
                                      module.parts?.forEach((_, i) => { retakingAll[i] = true })
                                      setIsRetaking(retakingAll)
                                      setQuizSubmitted({})
                                      setQuizAnswers({})
                                    }}
                                    className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                  >
                                    Retake Quiz
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="border-t border-slate-200 my-8" />
                        {(() => {
                          const allPartQuestionsAnswered = partQuizQuestions.every(q => quizAnswers[q.id] !== undefined)
                          const nextPartName = module.parts?.[partNumber + 1]?.title || 'Next Part'
                          return (
                            <div>
                              {allPartQuestionsAnswered ? (
                                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-5 mb-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
                                    <p className="text-sm font-bold text-teal-900">{partLabel} questions answered</p>
                                  </div>
                                  <p className="text-sm text-slate-600 ml-8">
                                    Your answers are saved. Continue to the next part — all answers will be submitted together at the end.
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 mb-4">
                                  Answer all {partQuizQuestions.length} questions above before continuing. Your answers will be submitted with the final part.
                                </p>
                              )}
                              <button
                                onClick={() => navigateSection(currentSectionIndex + 1)}
                                disabled={!allPartQuestionsAnswered}
                                className={cn(
                                  "px-8 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2",
                                  allPartQuestionsAnswered
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                )}
                              >
                                Continue to {nextPartName}
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </div>

                  {/* Complete Module Section — show after last part quiz */}
                  {partNumber === (module.parts?.length ?? 1) - 1 && showCompleteButton && (
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl shadow-sm border-2 border-teal-200 p-8 mb-6">
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Complete</h3>
                          <p className="text-[15px] text-slate-700 mb-6 leading-relaxed">
                            Congratulations! You&apos;ve met all the requirements for this module. Mark it as complete to earn your {module.points} CPD hours.
                          </p>
                          <button
                            onClick={handleCompleteModule}
                            className="px-8 py-3.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                            Complete Module & Earn CPD Hours
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            // Part Milestone section (between parts)
            if (currentVS.type === 'part-milestone' && module.parts) {
              const milestoneIndices = virtualSections
                .map((vs, i) => vs.type === 'part-milestone' ? i : -1)
                .filter(i => i >= 0)
              const milestoneNumber = milestoneIndices.indexOf(currentSectionIndex)
              const completedPart = module.parts[milestoneNumber]
              const nextPart = module.parts[milestoneNumber + 1]

              return (
                <div key={`milestone-${milestoneNumber}`} className="animate-fadeInUp">
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl shadow-sm border-2 border-teal-200 p-8 mb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{completedPart?.title} Complete!</h2>
                    <p className="text-[15px] text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
                      Great progress! You&apos;ve completed {completedPart?.title || 'this part of the module'}.
                    </p>
                    {nextPart && (
                      <div className="bg-white rounded-xl p-5 border border-slate-200 max-w-md mx-auto">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">Up Next</p>
                        <h3 className="text-base font-bold text-slate-900 mb-1">{nextPart.title}</h3>
                        <p className="text-sm text-slate-600">{nextPart.subtitle}</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigateSection(currentSectionIndex + 1)}
                      className="mt-6 px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                    >
                      Continue to {nextPart?.title || 'Next Section'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            }

            // Quiz section (paid only)
            if (currentVS.type === 'quiz') {
              return (
                <div key="quiz" className="animate-fadeInUp">

          {/* Quiz Section */}
          <div id="quiz" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 border border-teal-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Knowledge Check</h2>
                <p className="text-[15px] text-slate-600 leading-relaxed">
                  Test your understanding of the clinical content. You need at least {Math.ceil(module.quiz.length * (passMarkPercent / 100))} out of {module.quiz.length} questions correct to pass and earn your CPD hours.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {module.quiz?.map((question, qIndex) => {
                const stdQuizSubmitted = !!quizSubmitted[0]
                return (
                <div key={question.id} className="space-y-4" id={`quiz-q-${question.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {qIndex + 1}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Question {qIndex + 1} of {module.quiz?.length || 0}
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 text-base leading-relaxed ml-0 sm:ml-11">
                    {question.question}
                  </p>
                  <div className="space-y-3 ml-0 sm:ml-12">
                    {question.options?.map((option, oIndex) => {
                      const isSelected = quizAnswers[question.id] === oIndex
                      const isCorrect = question.correctAnswer === oIndex
                      const showResult = stdQuizSubmitted

                      return (
                        <label
                          key={oIndex}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2',
                            !showResult && 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            isSelected && !showResult && 'border-teal-500 bg-teal-50/50',
                            showResult && isCorrect && 'border-teal-500 bg-teal-50',
                            showResult && isSelected && !isCorrect && 'border-red-400 bg-red-50'
                          )}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            checked={isSelected}
                            onChange={() =>
                              !stdQuizSubmitted &&
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [question.id]: oIndex,
                              }))
                            }
                            disabled={stdQuizSubmitted}
                            className="mt-0.5 w-4 h-4 text-teal-600 flex-shrink-0"
                          />
                          <span className="text-[15px] text-slate-700 leading-relaxed">{option}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto flex-shrink-0" strokeWidth={2.5} />
                          )}
                        </label>
                      )
                    })}
                  </div>
                  {stdQuizSubmitted && (
                    <div className="ml-0 sm:ml-12 mt-4 p-5 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Explanation</p>
                      <p className="text-[15px] text-slate-700 leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
                )
              })}
            </div>

            <div className="border-t border-slate-200 my-8" />

            {!quizSubmitted[0] ? (
              <div>
                {quizValidationError && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 font-medium">
                      {quizValidationError}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleQuizSubmit}
                  className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Submit Knowledge Check
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className={cn(
                "p-6 rounded-xl border-2",
                quizResult?.passed
                  ? "bg-teal-50 border-teal-500"
                  : "bg-amber-50 border-amber-500"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    quizResult?.passed ? "bg-teal-100" : "bg-amber-100"
                  )}>
                    {quizResult?.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-700" strokeWidth={2.5} />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-700" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 mb-1">
                      {quizResult?.passed ? 'Knowledge Check Passed!' : 'Review Required'}
                    </p>
                    <p className="text-[15px] text-slate-700 mb-4">
                      You scored {quizResult?.score} out of {module.quiz.length} ({quizResult?.percentage.toFixed(0)}%)
                      {!quizResult?.passed && '. Please review the content and try again.'}
                    </p>
                    {quizResult?.passed && isSCATModule && (
                      <div className="mb-4 p-4 rounded-xl bg-white border border-teal-200">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          <strong>Want to go deeper?</strong> The full course covers VOMS vestibular screening, BESS balance scoring, return-to-play protocols, and phenotype-based rehabilitation — the clinical skills that set concussion experts apart.
                        </p>
                        <Link href="/pricing" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                          See full course <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                    {!quizResult?.passed && isSCATModule && (
                      <p className="text-sm text-amber-700 mb-4">
                        These clinical scenarios are covered in depth in the <Link href="/pricing" className="font-semibold underline hover:no-underline">full concussion management course</Link> — {scatQuizFailUpsellSuffix}.
                      </p>
                    )}
                    {!quizResult?.passed && (
                      <button
                        onClick={() => {
                          setIsRetaking({ 0: true })
                          setQuizSubmitted({})
                          setQuizAnswers({})
                          // Scroll to quiz section
                          const quizSection = document.getElementById('quiz')
                          if (quizSection) {
                            quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Complete Module Section */}
          {showCompleteButton && (
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl shadow-sm border-2 border-teal-200 p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Complete</h3>
                  <p className="text-[15px] text-slate-700 mb-6 leading-relaxed">
                    Congratulations! You&apos;ve met all the requirements for this module.{module.points > 0 ? ` Mark it as complete to earn your ${module.points} CPD hours.` : ''}
                  </p>
                  <button
                    onClick={handleCompleteModule}
                    className="px-8 py-3.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                    {module.points > 0 ? 'Complete Module & Earn CPD Hours' : 'Complete Module'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showCompleteButton && !isModuleComplete(progressId) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">
                Completion Requirements
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 mt-0.5">
                    {moduleProgress.quizCompleted &&
                     moduleProgress.quizScore !== null &&
                     moduleProgress.quizTotalQuestions !== null &&
                     (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= passMarkPercent / 100 ? (
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-slate-900 mb-1">
                      Pass Final Knowledge Check
                    </p>
                    <p className="text-sm text-slate-600">
                      Score at least {passMarkPercent}% to demonstrate mastery
                      {moduleProgress.quizCompleted &&
                       moduleProgress.quizScore !== null &&
                       moduleProgress.quizTotalQuestions !== null &&
                       (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= passMarkPercent / 100 && ' — Completed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical References */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Clinical References</h3>
            <div className="space-y-4">
              {module.clinicalReferences?.map((ref, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">
                    {ref}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 rounded-xl p-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">AHPRA Aligned:</span> All clinical content is evidence-based and regularly updated to reflect current best practices in concussion management. These references support AHPRA Continuing Professional Development (CPD) requirements for Australian health practitioners.
                </p>
              </div>
            </div>
          </div>
                </div>
              )
            }

            return null
          })()}

          {/* Offline reading for modules already visited (shared SW). */}
          <CoursePwaRegister />

          {/* Section Navigation Buttons */}
          <SectionNavButtons
            virtualSections={virtualSections}
            currentIndex={currentSectionIndex}
            lockedAfterIndex={lockedAfterIndex}
            onNavigate={navigateSection}
          />

          {/* Notes + CPD reflection. Entitled learners only — a free-tier user
              looking at a truncated Module 1 is being sold to, not studying,
              and the notes API is session-scoped anyway. */}
          {!needsUpgrade && accessLevel !== 'preview' && (
            <ModuleNotes moduleId={progressId} moduleTitle={module?.title} />
          )}
        </div>
      </main>
    </div>
  )
}
