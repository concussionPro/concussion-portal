'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Lightbulb, TrendingUp, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

// Quick Knowledge Check Component
export function QuickCheck({ question, options, correctAnswer, explanation }: {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (index: number) => {
    setSelected(index)
    setRevealed(true)
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200 p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-1">Quick Knowledge Check</h4>
          <p className="text-sm font-semibold text-slate-900">{question}</p>
        </div>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => {
          const isCorrect = index === correctAnswer
          const isSelected = index === selected
          const showFeedback = revealed && isSelected

          return (
            <button
              key={index}
              onClick={() => !revealed && handleSelect(index)}
              disabled={revealed}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all border-2 flex items-center gap-3",
                !revealed && "hover:bg-white hover:border-purple-300 cursor-pointer",
                !revealed && !isSelected && "bg-white/50 border-purple-200",
                revealed && isCorrect && "bg-teal-100 border-teal-500",
                revealed && isSelected && !isCorrect && "bg-red-100 border-red-400",
                revealed && !isSelected && "opacity-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                !revealed && "border-purple-300",
                showFeedback && isCorrect && "bg-teal-500 border-teal-500",
                showFeedback && !isCorrect && "bg-red-400 border-red-400"
              )}>
                {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                {showFeedback && !isCorrect && <XCircle className="w-4 h-4 text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                "text-sm",
                !revealed && "text-slate-700",
                revealed && isCorrect && "text-teal-900 font-semibold",
                revealed && isSelected && !isCorrect && "text-red-900"
              )}>
                {option}
              </span>
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Explanation</p>
          <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  )
}

// Clinical Insight Callout
export function ClinicalInsight({ title, content, type = "insight" }: {
  title: string
  content: string
  type?: "insight" | "warning" | "tip" | "success" | "info"
}) {
  const config = {
    insight: {
      bg: "from-blue-50 to-indigo-50",
      border: "border-blue-300",
      icon: Lightbulb,
      iconBg: "bg-blue-500",
      titleColor: "text-blue-900"
    },
    warning: {
      bg: "from-amber-50 to-orange-50",
      border: "border-amber-300",
      icon: AlertTriangle,
      iconBg: "bg-amber-500",
      titleColor: "text-amber-900"
    },
    tip: {
      bg: "from-teal-50 to-emerald-50",
      border: "border-teal-300",
      icon: TrendingUp,
      iconBg: "bg-teal-500",
      titleColor: "text-teal-900"
    },
    success: {
      bg: "from-green-50 to-emerald-50",
      border: "border-green-300",
      icon: CheckCircle2,
      iconBg: "bg-green-500",
      titleColor: "text-green-900"
    },
    info: {
      bg: "from-cyan-50 to-blue-50",
      border: "border-cyan-300",
      icon: Lightbulb,
      iconBg: "bg-cyan-500",
      titleColor: "text-cyan-900"
    }
  }

  const Icon = config[type].icon

  return (
    <div className={cn("bg-gradient-to-br rounded-xl border-2 p-5 my-6", config[type].bg, config[type].border)}>
      <div className="flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config[type].iconBg)}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h4 className={cn("text-sm font-bold uppercase tracking-wide mb-2", config[type].titleColor)}>
            {title}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  )
}

// Key Concept Highlight
export function KeyConcept({ title, points, content }: {
  title: string
  points?: string[]
  content?: string
}) {
  // Support both points array and content string
  const displayPoints = points || (content ? [content] : [])

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 my-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <h4 className="text-base font-bold text-slate-900">{title}</h4>
      </div>
      <div className="space-y-3">
        {displayPoints.map((point, index) => (
          <div key={index} className="flex items-start gap-3">
            {displayPoints.length > 1 && (
              <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-teal-700">{index + 1}</span>
              </div>
            )}
            <p className="text-sm text-slate-700 leading-relaxed flex-1">{point}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Clinical Decision Flowchart
export function Flowchart({ title, steps }: {
  title: string
  steps: { label: string; description: string }[]
}) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-300 p-6 my-6">
      <h4 className="text-base font-bold text-slate-900 mb-6">{title}</h4>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg z-10">
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gradient-to-b from-teal-400 to-blue-400 my-2"></div>
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
                  <p className="text-sm font-bold text-slate-900 mb-1">{step.label}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats Infographic
export function StatsInfographic({ title, stats }: {
  title: string
  stats: { value: string; label: string; color: string }[]
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 my-6">
      <h4 className="text-base font-bold text-slate-900 mb-6">{title}</h4>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={cn("rounded-xl p-4 text-center", `bg-${stat.color}-50 border-2 border-${stat.color}-200`)}>
            <div className={cn("text-3xl font-bold mb-1", `text-${stat.color}-600`)}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
