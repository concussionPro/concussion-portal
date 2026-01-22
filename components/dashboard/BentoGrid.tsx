'use client'

import { motion } from 'framer-motion'
import { BookOpen, Brain, Activity, Award, Clock, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProgress } from '@/contexts/ProgressContext'
import { useRouter } from 'next/navigation'

interface BentoCardProps {
  title: string
  subtitle?: string
  description?: string
  icon: React.ReactNode
  className?: string
  onClick?: () => void
  metric?: {
    value: string | number
    label: string
    trend?: 'up' | 'down' | 'neutral'
  }
  badge?: string
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall'
}

function BentoCard({
  title,
  subtitle,
  description,
  icon,
  className,
  onClick,
  metric,
  badge,
  size = 'medium',
}: BentoCardProps) {
  const sizeClasses = {
    small: '',
    medium: '',
    large: 'bento-large',
    wide: 'bento-wide',
    tall: 'bento-tall',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={cn(
        'glass glass-hover rounded-2xl p-6 relative overflow-hidden group cursor-pointer',
        sizeClasses[size],
        className
      )}
    >
      {/* Background Gradient Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-accent group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
              {subtitle && (
                <p className="text-xs text-accent font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {badge && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              {badge}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-end">
          {metric && (
            <div className="mb-4">
              <div className="flex items-end gap-2 mb-1">
                <span className="metric-value">{metric.value}</span>
                {metric.trend && metric.trend !== 'neutral' && (
                  <span className={cn(
                    'text-xs font-semibold px-1.5 py-0.5 rounded mb-1',
                    metric.trend === 'up' ? 'text-accent bg-accent/10' : 'text-red-400 bg-red-400/10'
                  )}>
                    {metric.trend === 'up' ? '+' : '-'}
                  </span>
                )}
              </div>
              <p className="metric-label">{metric.label}</p>
            </div>
          )}

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        {/* Click Indicator */}
        {onClick && (
          <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
        )}
      </div>
    </motion.div>
  )
}

export function BentoGrid() {
  const router = useRouter()
  const { getTotalCompletedModules, getTotalCPDPoints, getTotalStudyTime, progress } = useProgress()

  const completedModules = getTotalCompletedModules()
  const cpdPoints = getTotalCPDPoints()
  const studyTime = getTotalStudyTime()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[240px]">
      {/* CPD Points */}
      <BentoCard
        title="Online CPD"
        icon={<Award className="w-6 h-6" strokeWidth={1.5} />}
        metric={{
          value: `${cpdPoints}/8`,
          label: 'Online Points Earned',
          trend: cpdPoints > 0 ? 'up' : 'neutral',
        }}
        onClick={() => router.push('/learning')}
      />

      {/* Study Time */}
      <BentoCard
        title="Study Time"
        icon={<Clock className="w-6 h-6" strokeWidth={1.5} />}
        metric={{
          value: `${studyTime.toFixed(1)}h`,
          label: 'Total Learning Hours',
          trend: studyTime > 0 ? 'up' : 'neutral',
        }}
      />

      {/* Your Progress */}
      <BentoCard
        title="Your Progress"
        icon={<TrendingUp className="w-6 h-6" strokeWidth={1.5} />}
        description={
          completedModules === 0
            ? "Start your first module to begin earning CPD points!"
            : completedModules === 8
            ? "Outstanding! You've completed all modules. Keep up the excellence!"
            : `Excellent work! ${completedModules} of 8 online modules completed. You're ${Math.round((completedModules / 8) * 100)}% of the way there!`
        }
      />
    </div>
  )
}
