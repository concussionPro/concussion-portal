'use client'

import { useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { getAllModules } from '@/data/modules'
import { ArrowRight, Clock, Award, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function NextActionCard() {
  const router = useRouter()
  const { getTotalCompletedModules, isModuleComplete } = useProgress()
  const modules = getAllModules()
  const completedModules = getTotalCompletedModules()

  const nextModule = modules.find((m) => !isModuleComplete(m.id))
  const progressPercentage = Math.round((completedModules / 8) * 100)

  /* ── All Complete ───────────────────────────── */
  if (!nextModule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-accent/20 relative overflow-hidden"
      >
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                All Complete
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              You&apos;ve Mastered All 8 Online Modules
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Outstanding achievement — you&apos;ve earned all 40 online AHPRA CPD points. Complete the 6-hour in-person practical to earn your full 14 CPD certificate.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/learning')}
                className="action-pill"
              >
                <TrendingUp className="w-4 h-4 text-accent" />
                Review Modules
              </button>
              <button
                onClick={() => router.push('/in-person')}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 transition-all"
              >
                Book Workshop
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  /* ── Next Module ────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-accent/10 relative overflow-hidden group hover:border-accent/20 transition-colors"
    >
      {/* Subtle accent gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4 sm:gap-5">
        {/* Module number badge */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/15">
          <span className="text-xl sm:text-2xl font-bold text-white">{nextModule.id}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Your Next Step
            </span>
          </div>

          {/* Title & description */}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight">
            {nextModule.title}
          </h2>
          <p className="text-sm text-accent font-semibold mb-1.5">{nextModule.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {nextModule.description}
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="action-pill text-xs py-1 px-3">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {nextModule.duration}
            </span>
            <span className="action-pill text-xs py-1 px-3">
              <Award className="w-3.5 h-3.5 text-accent" />
              5 CPD Points
            </span>
            <span className="action-pill text-xs py-1 px-3">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              {progressPercentage}% Complete
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/modules/${nextModule.id}`)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 hover:bg-accent-dark transition-all flex items-center gap-2 group/btn"
          >
            {completedModules === 0 ? 'Begin Module 1' : `Continue Module ${nextModule.id}`}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-border/30">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="font-medium text-muted-foreground">Course Progress</span>
          <span className="font-semibold text-accent">
            {completedModules} / 8 modules ({progressPercentage}%)
          </span>
        </div>
      </div>
    </motion.div>
  )
}
