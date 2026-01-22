'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, Play, Target, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const user = getCurrentUser()

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')

    if (!hasSeenWelcome && user) {
      // Delay showing modal slightly for better UX
      setTimeout(() => setIsOpen(true), 500)
    }
  }, [user])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  const handleStartModule = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
    router.push('/modules/1')
  }

  const handleViewModules = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
    router.push('/learning')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome, {user?.name?.split(' ')[0] || 'Doctor'}! 🎉
            </h2>
            <p className="text-base text-slate-600">
              Let's get you clinically confident in concussion management
            </p>
          </div>

          {/* Quick Start Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">
              Your 3-Step Quick Start
            </h3>
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-teal-200">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">Watch 2-Minute Orientation</p>
                  <p className="text-sm text-slate-600">Understand the course structure and CPD requirements</p>
                </div>
                <div className="flex-shrink-0">
                  <Play className="w-5 h-5 text-teal-600" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-slate-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">Start Module 1</p>
                  <p className="text-sm text-slate-600">Master concussion biomechanics and pathophysiology</p>
                </div>
                <div className="flex-shrink-0">
                  <Target className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-slate-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">Earn Your First CPD Points</p>
                  <p className="text-sm text-slate-600">Complete Module 1 quiz and earn 5 AHPRA CPD points</p>
                </div>
                <div className="flex-shrink-0">
                  <Award className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <div className="text-2xl font-bold text-teal-600 mb-1">8</div>
              <div className="text-xs text-slate-600 font-medium">Modules</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <div className="text-2xl font-bold text-teal-600 mb-1">40</div>
              <div className="text-xs text-slate-600 font-medium">CPD Points</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <div className="text-2xl font-bold text-teal-600 mb-1">~6</div>
              <div className="text-xs text-slate-600 font-medium">Hours Total</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartModule}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl text-base font-semibold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Module 1
            </button>
            <button
              onClick={handleViewModules}
              className="flex-1 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-base font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              View All Modules
            </button>
          </div>

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip introduction
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 rounded-full blur-3xl -z-10"></div>
      </div>
    </div>
  )
}
