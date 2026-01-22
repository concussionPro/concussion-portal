'use client'

import { useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { getAllModules } from '@/data/modules'
import { ArrowRight, Clock, Award, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { ModuleProgress } from '@/components/progress/BrainProgress'

export function NextActionCard() {
  const router = useRouter()
  const { getTotalCompletedModules, isModuleComplete } = useProgress()
  const modules = getAllModules()
  const completedModules = getTotalCompletedModules()

  // Determine next module
  const nextModule = modules.find(m => !isModuleComplete(m.id))

  // All modules complete
  if (!nextModule) {
    return (
      <div className="glass rounded-2xl border-2 border-accent/30 p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-md">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                All Complete!
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              You've Mastered All 8 Online Modules
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Outstanding achievement! You've earned all 8 online AHPRA CPD points. Complete the 6-hour in-person practical training to earn your full 14 CPD certificate.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/learning')}
                className="px-4 py-2 glass border border-accent/30 text-accent rounded-lg text-sm font-semibold hover:bg-accent/10 transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4" />
                Review Modules
              </button>
              <button
                onClick={() => router.push('/in-person')}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent/90 transition-all shadow-md flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                Book Workshop
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate progress percentage
  const progressPercentage = Math.round((completedModules / 8) * 100)

  return (
    <div className="glass rounded-2xl border-2 border-accent/20 p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden hover:border-accent/30 transition-all group">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Module Number Badge */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-xl sm:text-2xl font-bold text-white">
            {nextModule.id}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Your Next Step
            </span>
          </div>

          {/* Module Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight">
            {nextModule.title}
          </h2>
          <p className="text-sm text-accent font-semibold mb-2">
            {nextModule.subtitle}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {nextModule.description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">{nextModule.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">5 CPD Points</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">{progressPercentage}% Course Complete</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push(`/modules/${nextModule.id}`)}
            className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 group/btn"
          >
            Start Module {nextModule.id}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <ModuleProgress completed={completedModules} total={8} />
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="font-medium text-muted-foreground">Course Progress</span>
          <span className="font-bold text-accent">{completedModules} / 8 Online Modules ({progressPercentage}%)</span>
        </div>
      </div>
    </div>
  )
}
