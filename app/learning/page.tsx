'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, Clock, Award, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { getAllModules } from '@/data/modules'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { isTrialUser } from '@/lib/trial'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function LearningSuite() {
  const router = useRouter()
  const { getTotalCompletedModules, getTotalCPDPoints, getTotalStudyTime, isModuleComplete, getModuleProgress } = useProgress()
  const modules = getAllModules()
  const [isTrial, setIsTrial] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  useAnalytics() // Track page views

  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  useEffect(() => {
    setIsTrial(isTrialUser())

    // Check session-based access
    async function checkAccess() {
      // Check localStorage first (backward compatibility)
      const isPaidUser = localStorage.getItem('isPaidUser')
      if (isPaidUser === 'true') {
        setHasAccess(true)
        return
      }

      // Check session-based authentication
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user && data.user.accessLevel) {
            // Both online-only and full-course users have full access
            setHasAccess(data.user.accessLevel === 'online-only' || data.user.accessLevel === 'full-course')
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      }
    }

    checkAccess()
  }, [])

  const handleModuleClick = (moduleId: number) => {
    router.push(`/modules/${moduleId}`)
  }

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
                  Clinical Mastery Training
                </h1>
                <p className="text-sm text-muted-foreground">
                  8 Online + 6 In-Person CPD Hours (14 Total) · Evidence-Based Concussion Management
                </p>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Modules Complete</div>
                  <div className="text-xl font-bold text-gradient">{completedModules} / 8</div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Online CPD Earned</div>
                  <div className="text-xl font-bold text-gradient">{cpdPoints} / 8</div>
                </div>
                <div className="glass rounded-lg p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Study Time</div>
                  <div className="text-xl font-bold text-gradient">{studyTime.toFixed(1)}h</div>
                </div>
              </div>
            </div>

            {/* Module Cards */}
            <div className="space-y-3 mt-5">
              {modules.map((module) => {
                const completed = isModuleComplete(module.id)
                const progress = getModuleProgress(module.id)
                const hasStarted = progress.startedAt !== null
                // Modules are locked if user is trial AND doesn't have paid access
                const isLocked = isTrial && !hasAccess

                return (
                  <div
                    key={module.id}
                    className={cn(
                      "glass glass-hover rounded-xl cursor-pointer group",
                      isLocked && "opacity-75"
                    )}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <div className="p-5 sm:p-6">{isLocked && (
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Lock className="w-4 h-4" />
                          <span>Upgrade to unlock</span>
                        </div>
                      )}
                      {/* Module Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-5 flex-1">
                          <div className="text-3xl font-bold text-slate-300 tracking-tight min-w-[50px]">
                            {module.id.toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight group-hover:text-gradient transition-colors">
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
                      </div>

                      {/* Module Meta */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium">{module.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground font-medium">{module.points} CPD</span>
                          </div>
                          {hasStarted && !completed && (
                            <div className="text-xs text-[#5b9aa6] bg-blue-50 px-2 py-1 rounded">
                              {progress.videoWatchedMinutes} min watched
                            </div>
                          )}
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
