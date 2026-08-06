'use client'

import { useState, useEffect } from 'react'
import { X, Play, Award, BookOpen, Clock, GraduationCap, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import { useProgress } from '@/contexts/ProgressContext'
import { useCourseTier } from './useCourseTier'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user } = useSession()
  const { isInitialized, progress } = useProgress()
  const { ownsCrm, isFreeTier } = useCourseTier()
  // Values, not getters — a getter is re-created every render, which would
  // re-arm the open timer forever and the modal would never appear.
  // "Under way" = anything the server knows about: completed OR merely opened.
  const hasStarted = isInitialized
    ? Object.values(progress).some((p) => p.completed || p.startedAt)
    : false

  useEffect(() => {
    // "hasSeenWelcome" lives in localStorage, so it is EMPTY on any new device,
    // new browser, private window or after a cache clear. Gating solely on it
    // meant a returning student — whose progress the server restores correctly
    // seconds later — was met by a full-screen overlay telling them to "Start
    // Module 1" and "earn your FIRST CPD hour", on top of (and covering) their
    // Download Certificate button. Progress is the real signal: this is a
    // getting-STARTED card, so it only belongs in front of someone who has not
    // started. Wait for the progress store to settle (server restore included)
    // before deciding, so a genuinely new user still gets it.
    if (!user || !isInitialized) return
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (hasSeenWelcome) return
    if (hasStarted) {
      // Already underway on another device — never show the intro again.
      localStorage.setItem('hasSeenWelcome', 'true')
      return
    }
    const id = setTimeout(() => setIsOpen(true), 500)
    return () => clearTimeout(id)
  }, [user, isInitialized, hasStarted])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  const handleStartModule = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
    // A CRM buyer is 'preview' on the CCM ladder — sending them to /modules/101
    // dropped a paying EP customer into the free SCAT course.
    router.push(ownsCrm ? '/ep-course' : isFreeTier ? '/modules/101' : '/modules/1')
  }

  const handleViewModules = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
    router.push('/learning')
  }

  if (!isOpen) return null

  const firstName = user?.name?.split(' ')[0] || 'there'
  // Only the genuinely-free tier gets the SCAT framing — a CRM buyer is
  // 'preview' on the CCM ladder but a paying customer of the EP stream.
  const isPreviewUser = isFreeTier
  const isFullCourse = user?.accessLevel === 'full-course'
  // Free SCAT6 Mastery course awards 1 CPD hour on completion; either paid
  // 8-module stream (CCM online or CRM) = 8.
  const cpdPoints = isFreeTier ? '1' : '8'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.92) 50%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 0 0 1px rgba(13,115,119,0.08), 0 8px 40px -8px rgba(13,115,119,0.18), 0 32px 80px -16px rgba(0,0,0,0.12)',
        }}
      >
        {/* Ambient glow effects */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(13,115,119,0.15) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(13,115,119,0.1) 0%, transparent 70%)' }} />

        {/* Top accent stripe */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d7377, #0a9396, #0d7377)' }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close welcome dialog"
          className="absolute top-5 right-5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        {/* Content */}
        <div className="px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 md:px-10 md:pt-10 md:pb-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #0d7377 0%, #0a9396 100%)',
                boxShadow: '0 8px 24px -4px rgba(13,115,119,0.35)',
              }}
            >
              <GraduationCap className="h-8 w-8 text-white" strokeWidth={1.8} />
            </div>
            <h2 id="welcome-modal-title" className="mb-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              You&apos;re all set, {firstName}
            </h2>
            <p className="text-sm text-slate-500 md:text-base">
              {isPreviewUser
                ? 'Your free SCAT6 Mastery course is ready — 3 modules, ~1 hour.'
                : isFullCourse
                ? 'Your online modules are ready — complete them before your hands-on workshop.'
                : 'Your 8 clinical modules are unlocked and ready to go.'}
            </p>
          </div>

          {/* Quick Start Steps */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Getting started
              </h3>
            </div>
            <div className="space-y-2.5">
              {/* Step 1 — Start Module 1 */}
              <button
                onClick={handleStartModule}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,115,119,0.06) 0%, rgba(10,147,150,0.04) 100%)',
                  border: '1px solid rgba(13,115,119,0.12)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0d7377 0%, #0a9396 100%)',
                    boxShadow: '0 2px 8px -2px rgba(13,115,119,0.4)',
                  }}
                >
                  <span className="text-sm font-bold text-white">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{isPreviewUser ? 'Start Module 1: SCAT6 Essentials' : 'Start Module 1: What is a Concussion?'}</p>
                  <p className="text-xs text-slate-500">{isPreviewUser ? 'SCAT6 vs SCOAT6 — which tool, when, and why' : 'Concussion pathophysiology and the neurometabolic cascade'}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-teal-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>

              {/* Step 2 — Pass the quiz */}
              <button
                onClick={handleStartModule}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(13,115,119,0.1)' }}
                >
                  <span className="text-sm font-bold" style={{ color: '#0d7377' }}>2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Pass the Module 1 Quiz</p>
                  <p className="text-xs text-slate-500">{isPreviewUser ? 'Complete your first module — takes about 25 minutes' : 'Earn your first AHPRA CPD hour — takes about 75 minutes'}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-teal-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>

              {/* Step 3 — Clinical Toolkit */}
              <button
                onClick={handleViewModules}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(13,115,119,0.1)' }}
                >
                  <span className="text-sm font-bold" style={{ color: '#0d7377' }}>3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Browse All Modules</p>
                  <p className="text-xs text-slate-500">See the full curriculum and track your progress across all modules</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-teal-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Stats row — glass cards */}
          <div className="mb-8 grid grid-cols-3 gap-2.5">
            <div
              className="rounded-xl p-3.5 text-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(13,115,119,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-xl font-bold" style={{ color: '#0d7377' }}>{isPreviewUser ? '3' : '8'}</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Modules</div>
            </div>
            <div
              className="rounded-xl p-3.5 text-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(13,115,119,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Award className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-xl font-bold" style={{ color: '#0d7377' }}>{cpdPoints}</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">CPD Hours</div>
            </div>
            <div
              className="rounded-xl p-3.5 text-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(13,115,119,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-xl font-bold" style={{ color: '#0d7377' }}>{isPreviewUser ? '~1' : '~8'}</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Hours Total</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={handleStartModule}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0d7377 0%, #0a9396 100%)',
                boxShadow: '0 4px 16px -4px rgba(13,115,119,0.4)',
              }}
            >
              <Play className="h-4 w-4" />
              Start Module 1
            </button>
            <button
              onClick={handleViewModules}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              Browse All Modules
            </button>
          </div>

          {/* Skip link */}
          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 transition-colors hover:text-slate-600"
            >
              Skip — take me to my dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
