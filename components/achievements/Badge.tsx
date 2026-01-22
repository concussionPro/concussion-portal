'use client'

import { Award, CheckCircle2, Brain, Target, Zap } from 'lucide-react'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: 'award' | 'check' | 'brain' | 'target' | 'zap'
  earned: boolean
  earnedDate?: Date
}

const iconMap = {
  award: Award,
  check: CheckCircle2,
  brain: Brain,
  target: Target,
  zap: Zap
}

export function Badge({ achievement }: { achievement: Achievement }) {
  const Icon = iconMap[achievement.icon]

  return (
    <div className={`
      relative rounded-xl border-2 p-4 transition-all
      ${achievement.earned
        ? 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200'
        : 'bg-slate-50 border-slate-200 opacity-60'
      }
    `}>
      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto
        ${achievement.earned
          ? 'bg-gradient-to-br from-teal-500 to-blue-600'
          : 'bg-slate-300'
        }
      `}>
        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="text-center">
        <h4 className={`text-sm font-bold mb-1 ${achievement.earned ? 'text-slate-900' : 'text-slate-500'}`}>
          {achievement.title}
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {achievement.description}
        </p>
        {achievement.earned && achievement.earnedDate && (
          <p className="text-xs text-teal-600 font-medium mt-2">
            Earned {achievement.earnedDate.toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {achievements.map(achievement => (
        <Badge key={achievement.id} achievement={achievement} />
      ))}
    </div>
  )
}

export function MilestoneNotification({ achievement }: { achievement: Achievement }) {
  const Icon = iconMap[achievement.icon]

  return (
    <div className="fixed top-24 right-6 z-50 bg-white rounded-xl shadow-2xl border-2 border-teal-200 p-6 max-w-sm animate-slide-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
            Achievement Unlocked
          </p>
          <h4 className="text-base font-bold text-slate-900 mb-1">
            {achievement.title}
          </h4>
          <p className="text-sm text-slate-600">
            {achievement.description}
          </p>
        </div>
      </div>
    </div>
  )
}
