'use client'

import { useParams, useRouter } from 'next/navigation'
import { CourseNavigation } from '@/components/course/CourseNavigation'
import { useProgress } from '@/contexts/ProgressContext'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Award, AlertCircle, ArrowRight, BookOpen, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DynamicContentRenderer } from '@/components/course/DynamicContentRenderer'
import { DownloadableResources } from '@/components/course/DownloadableResources'
import { ApplyTomorrow } from '@/components/course/ApplyTomorrow'
import { ContentLockedBanner } from '@/components/course/ContentLockedBanner'
import { SectionInteractiveElements } from '@/components/course/SectionInteractiveElements'
import { SectionStepper, type VirtualSection } from '@/components/course/SectionStepper'
import { SectionNavButtons } from '@/components/course/SectionNavButtons'
import { SectionTypeBadge, estimateReadingTime } from '@/components/course/SectionTypeBadge'
import { useModuleData } from '@/hooks/useModuleData'
import { CONFIG } from '@/lib/config'

// Upgrade offer screen for unauthenticated users
function UpgradeOfferScreen({ moduleId, router }: { moduleId: number; router: any }) {
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
              Module {moduleId} is part of our <strong className="text-white">complete 8-module professional course</strong>. Get instant access to all modules, downloadable resources, and earn <strong className="text-white">14 AHPRA CPD points</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">8</div>
                <div className="text-sm text-slate-300">Complete Modules</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="text-3xl font-bold text-amber-400 mb-1">14</div>
                <div className="text-sm text-slate-300">CPD Points</div>
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
              View Course Details & Enroll
              <ArrowRight className="w-5 h-5" />
            </a>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-slate-300 text-sm mb-4">
                Looking for free training?
              </p>
              <button
                onClick={() => router.push('/scat-mastery')}
                className="text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                Try Our Free SCAT6 Course (2 CPD Points) →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = parseInt(params.id as string)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check authentication first
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setIsAuthenticated(true)
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
  }, [])

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
    return <UpgradeOfferScreen moduleId={moduleId} router={router} />
  }

  // If not authenticated and trying to access SCAT module (101-105), redirect to signup
  if (!isAuthenticated && moduleId >= 101 && moduleId <= 105) {
    router.push('/scat-mastery')
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  // Authenticated - render module content
  return <ModulePageContent moduleId={moduleId} router={router} />
}

function ModulePageContent({ moduleId, router }: { moduleId: number; router: any }) {
  // Fetch module content from secure API
  const { module, loading: moduleLoading, error: moduleError, accessLevel, needsUpgrade } = useModuleData(moduleId)
  const {
    updateQuizScore,
    markModuleComplete,
    markModuleStarted,
    trackActiveStudy,
    getModuleProgress,
    canMarkModuleComplete,
    isModuleComplete,
  } = useProgress()

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizValidationError, setQuizValidationError] = useState<string | null>(null)
  const [showCompleteButton, setShowCompleteButton] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set([0]))
  const contentAreaRef = useRef<HTMLDivElement>(null)

  const moduleProgress = getModuleProgress(moduleId)

  // Determine if user has full access based on API response
  const hasFullAccess = accessLevel === 'online-only' || accessLevel === 'full-course'

  const [isRetaking, setIsRetaking] = useState(false)

  // Build virtual sections array: content sections + resources + apply-tomorrow + quiz
  const virtualSections: VirtualSection[] = React.useMemo(() => {
    if (!module) return []
    const sections: VirtualSection[] = module.sections.map((s, i) => ({
      type: 'content' as const,
      label: s.title,
      index: i,
    }))
    if (hasFullAccess) {
      sections.push(
        { type: 'resources', label: 'Downloadable Resources', index: sections.length },
        { type: 'apply-tomorrow', label: 'Apply Tomorrow', index: sections.length + 1 },
        { type: 'quiz', label: 'Knowledge Check', index: sections.length + 2 },
      )
    }
    return sections
  }, [module, hasFullAccess])

  // For free/preview users: sections 0-1 are navigable, rest locked
  const lockedAfterIndex = hasFullAccess ? undefined : 1

  // Sync quizSubmitted with persisted progress (skip if user is retaking)
  useEffect(() => {
    if (moduleProgress.quizCompleted && !isRetaking) {
      setQuizSubmitted(true)
    }
  }, [moduleProgress.quizCompleted, isRetaking])

  // Save current section to localStorage as checkpoint
  useEffect(() => {
    if (module) {
      localStorage.setItem(`module-${moduleId}-checkpoint`, currentSectionIndex.toString())
      setVisitedSections(prev => new Set(prev).add(currentSectionIndex))
    }
  }, [currentSectionIndex, moduleId, module])

  // Restore checkpoint on mount
  useEffect(() => {
    if (module) {
      const saved = localStorage.getItem(`module-${moduleId}-checkpoint`)
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
      if (hash === 'quiz' && hasFullAccess) {
        const quizIdx = virtualSections.findIndex(v => v.type === 'quiz')
        if (quizIdx >= 0) setCurrentSectionIndex(quizIdx)
      } else if (hash && module.sections) {
        const sectionIdx = module.sections.findIndex(s => s.id === hash)
        if (sectionIdx >= 0 && (lockedAfterIndex === undefined || sectionIdx <= lockedAfterIndex)) {
          setCurrentSectionIndex(sectionIdx)
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
      markModuleStarted(moduleId)
      trackActiveStudy(moduleId)

      // Track study time every 60 seconds while the user is on the page
      const interval = setInterval(() => {
        trackActiveStudy(moduleId)
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [moduleId, module])

  useEffect(() => {
    if (module && moduleProgress) {
      const canComplete = canMarkModuleComplete(moduleId)
      setShowCompleteButton(canComplete && !isModuleComplete(moduleId))
    }
  }, [module, moduleProgress, moduleId, canMarkModuleComplete, isModuleComplete])

  // Show loading state while fetching module
  if (moduleLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <CourseNavigation />
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

  // Show upgrade offer if preview user tries to access paid module
  if (needsUpgrade) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <CourseNavigation />
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
                This module is part of the <strong className="text-white">complete 8-module course</strong>. Upgrade to get instant access to all modules, downloadable resources, and earn <strong className="text-white">14 CPD points</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <div className="text-3xl font-bold text-amber-400 mb-1">8</div>
                  <div className="text-sm text-slate-300">Complete Modules</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <div className="text-3xl font-bold text-amber-400 mb-1">14</div>
                  <div className="text-sm text-slate-300">CPD Points</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                  <div className="text-sm text-slate-300">AHPRA Aligned</div>
                </div>
              </div>

              <a
                href={CONFIG.SHOP_URL}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Upgrade Now - $1,190
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-slate-400 text-sm mt-6">
                Includes full-day practical workshop + 8 online modules
              </p>

              <button
                onClick={() => router.push('/scat-course')}
                className="mt-6 text-slate-400 hover:text-white underline text-sm"
              >
                ← Back to Free SCAT Course
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
        <CourseNavigation />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Module</h1>
            <p className="text-slate-600 mb-4">{moduleError}</p>
            <button
              onClick={() => router.push('/learning')}
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
        <CourseNavigation />
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

    const answeredCount = Object.keys(quizAnswers).length
    if (answeredCount !== module.quiz.length) {
      setQuizValidationError(
        `Please answer all ${module.quiz.length} questions before submitting. You've answered ${answeredCount} of ${module.quiz.length}.`
      )
      // Scroll to first unanswered question
      const unansweredId = module.quiz.find((q: any) => quizAnswers[q.id] === undefined)?.id
      if (unansweredId) {
        const el = document.getElementById(`quiz-q-${unansweredId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setQuizValidationError(null)
    let correctCount = 0
    module.quiz.forEach((question: any) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })

    updateQuizScore(moduleId, correctCount, module.quiz.length)
    setIsRetaking(false)
    setQuizSubmitted(true)
  }

  const handleCompleteModule = () => {
    if (!module) return

    if (canMarkModuleComplete(moduleId)) {
      markModuleComplete(moduleId)
      router.push('/learning')
    }
  }

  const getQuizResult = () => {
    if (!quizSubmitted || moduleProgress.quizScore === null) return null
    // Use saved total questions if available, otherwise use current module quiz length
    const totalQuestions = moduleProgress.quizTotalQuestions || module.quiz.length
    const percentage = (moduleProgress.quizScore / totalQuestions) * 100
    const passed = percentage >= 75
    return { percentage, passed, score: moduleProgress.quizScore }
  }

  const quizResult = getQuizResult()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CourseNavigation
        sectionTitles={virtualSections.map(v => v.label)}
        currentSectionIndex={currentSectionIndex}
        onSectionNavigate={navigateSection}
        lockedAfterIndex={lockedAfterIndex}
        visitedSections={visitedSections}
      />
      <main className="flex-1 w-full md:ml-0 overflow-y-auto" ref={contentAreaRef}>
        <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Module Header — full on section 0, compact on subsequent sections */}
          {currentSectionIndex === 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Module {module.id}
                    </span>
                    {isModuleComplete(moduleId) && (
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
                  <span className="font-semibold text-slate-700">{module.points} CPD Points</span>
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
                Module {module.id}
              </button>
              <span className="text-slate-300">/</span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                {module.title}
              </h1>
              {isModuleComplete(moduleId) && (
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" strokeWidth={2.5} />
              )}
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
              return (
                <ContentLockedBanner
                  remainingSections={module.sections.slice(lockedAfterIndex + 1).map(s => s.title)}
                />
              )
            }

            // Content section
            if (currentVS.type === 'content') {
              const section = module.sections[currentSectionIndex]
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
                          {(currentSectionIndex + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight flex-1">
                        {section.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 mb-6 ml-12">
                      <SectionTypeBadge sectionId={section.id} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readTime} min read
                      </span>
                    </div>

                    {/* Content — full width, no flex constraint */}
                    <DynamicContentRenderer content={section.content} sectionIndex={currentSectionIndex} />
                    <SectionInteractiveElements
                      moduleId={moduleId}
                      section={section}
                      sectionIndex={currentSectionIndex}
                    />
                  </div>

                  {/* Show lock banner with remaining titles after last free section */}
                  {!hasFullAccess && lockedAfterIndex !== undefined && currentSectionIndex === lockedAfterIndex && (
                    <ContentLockedBanner
                      remainingSections={module.sections.slice(lockedAfterIndex + 1).map(s => s.title)}
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
                  Test your understanding of the clinical content. You need at least {Math.ceil(module.quiz.length * 0.75)} out of {module.quiz.length} questions correct to pass and earn your CPD points.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {module.quiz?.map((question, qIndex) => (
                <div key={question.id} className="space-y-4">
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
                  <p className="font-semibold text-slate-900 text-base leading-relaxed ml-11">
                    {question.question}
                  </p>
                  <div className="space-y-3 ml-12">
                    {question.options?.map((option, oIndex) => {
                      const isSelected = quizAnswers[question.id] === oIndex
                      const isCorrect = question.correctAnswer === oIndex
                      const showResult = quizSubmitted

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
                              !quizSubmitted &&
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [question.id]: oIndex,
                              }))
                            }
                            disabled={quizSubmitted}
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
                  {quizSubmitted && (
                    <div className="ml-12 mt-4 p-5 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Explanation</p>
                      <p className="text-[15px] text-slate-700 leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 my-8" />

            {!quizSubmitted ? (
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
                    {!quizResult?.passed && (
                      <button
                        onClick={() => {
                          setIsRetaking(true)
                          setQuizSubmitted(false)
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
                    Congratulations! You've met all the requirements for this module. Mark it as complete to earn your {module.points} CPD points.
                  </p>
                  <button
                    onClick={handleCompleteModule}
                    className="px-8 py-3.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                    Complete Module & Earn CPD Points
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showCompleteButton && !isModuleComplete(moduleId) && (
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
                     (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75 ? (
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
                      Score at least 75% to demonstrate mastery
                      {moduleProgress.quizCompleted &&
                       moduleProgress.quizScore !== null &&
                       moduleProgress.quizTotalQuestions !== null &&
                       (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75 && ' ✓ Completed'}
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

          {/* Section Navigation Buttons */}
          <SectionNavButtons
            virtualSections={virtualSections}
            currentIndex={currentSectionIndex}
            lockedAfterIndex={lockedAfterIndex}
            onNavigate={navigateSection}
          />
        </div>
      </main>
    </div>
  )
}
