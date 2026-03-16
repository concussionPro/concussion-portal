'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Lightbulb, TrendingUp, Target, Stethoscope, ListOrdered, Link2, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// Quick Knowledge Check Component
export function QuickCheck({ question, options, correctAnswer, explanation, hideTitle = false }: {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  hideTitle?: boolean
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
        {!hideTitle && (
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1">
          {!hideTitle && (
            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-1">Quick Knowledge Check</h4>
          )}
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
              {revealed && isCorrect && !isSelected && (
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Explanation</p>
          <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
          {selected !== correctAnswer && (
            <button
              onClick={() => { setRevealed(false); setSelected(null); }}
              className="mt-3 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Try Again
            </button>
          )}
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
const STAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
}

export function StatsInfographic({ title, stats }: {
  title: string
  stats: { value: string; label: string; color: string }[]
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 my-6">
      <h4 className="text-base font-bold text-slate-900 mb-6">{title}</h4>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const colors = STAT_COLORS[stat.color] || STAT_COLORS.teal
          return (
            <div key={index} className={cn("rounded-xl p-4 text-center border-2", colors.bg, colors.border)}>
              <div className={cn("text-3xl font-bold mb-1", colors.text)}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Clinical Scenario — Branching case study
interface ScenarioStep {
  id: string
  narrative: string
  clinicalData?: string[]
  choices: { label: string; feedback?: string; nextStepId: string }[]
  isOutcome?: boolean
  outcome?: {
    type: 'optimal' | 'acceptable' | 'suboptimal'
    title: string
    explanation: string
    clinicalReasoning: string
  }
}

export function ClinicalScenario({ title, patientSummary, steps }: {
  title: string
  patientSummary: string
  steps: ScenarioStep[]
}) {
  const [currentStepId, setCurrentStepId] = useState(steps[0]?.id || '')
  const [history, setHistory] = useState<string[]>([])
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)

  const currentStep = steps.find(s => s.id === currentStepId)
  if (!currentStep) return null

  const handleChoice = (choiceIndex: number) => {
    const choice = currentStep.choices[choiceIndex]
    if (!choice) return
    setSelectedChoice(choiceIndex)

    setTimeout(() => {
      const nextStep = steps.find(s => s.id === choice.nextStepId)
      setHistory(prev => [...prev, currentStepId])
      setCurrentStepId(choice.nextStepId)
      setSelectedChoice(null)
      if (nextStep?.isOutcome) setCompleted(true)
    }, 800)
  }

  const handleRestart = () => {
    setCurrentStepId(steps[0]?.id || '')
    setHistory([])
    setSelectedChoice(null)
    setCompleted(false)
  }

  const outcomeColors = {
    optimal: { bg: 'bg-teal-50', border: 'border-teal-500', badge: 'bg-teal-500', text: 'text-teal-900' },
    acceptable: { bg: 'bg-blue-50', border: 'border-blue-500', badge: 'bg-blue-500', text: 'text-blue-900' },
    suboptimal: { bg: 'bg-amber-50', border: 'border-amber-500', badge: 'bg-amber-500', text: 'text-amber-900' },
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-300 p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-0.5">Clinical Scenario</h4>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>

      {/* Patient summary bar */}
      <div className="bg-white rounded-lg p-3 border border-slate-200 mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Patient Summary</p>
        <p className="text-sm text-slate-700">{patientSummary}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {history.map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-teal-500" />
        ))}
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-2 ring-slate-400" />
      </div>

      {/* Current step */}
      {currentStep.isOutcome && currentStep.outcome ? (
        <div className={cn(
          "rounded-xl p-5 border-2",
          outcomeColors[currentStep.outcome.type].bg,
          outcomeColors[currentStep.outcome.type].border
        )}>
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-bold text-white",
              outcomeColors[currentStep.outcome.type].badge
            )}>
              {currentStep.outcome.type.toUpperCase()}
            </span>
            <h4 className={cn("text-base font-bold", outcomeColors[currentStep.outcome.type].text)}>
              {currentStep.outcome.title}
            </h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{currentStep.outcome.explanation}</p>
          <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Reasoning</p>
            <p className="text-sm text-slate-700 leading-relaxed">{currentStep.outcome.clinicalReasoning}</p>
          </div>
          <button
            onClick={handleRestart}
            className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[15px] text-slate-800 leading-relaxed mb-3">{currentStep.narrative}</p>
          {currentStep.clinicalData && (
            <div className="bg-white rounded-lg p-3 border border-slate-200 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Clinical Data</p>
              <ul className="space-y-1">
                {currentStep.clinicalData.map((d, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            {currentStep.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => selectedChoice === null && handleChoice(i)}
                disabled={selectedChoice !== null}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all border-2 flex items-center gap-3",
                  selectedChoice === null && "hover:bg-white hover:border-slate-400 cursor-pointer bg-white/50 border-slate-200",
                  selectedChoice === i && "bg-teal-100 border-teal-500",
                  selectedChoice !== null && selectedChoice !== i && "opacity-50"
                )}
              >
                <span className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-slate-700">{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Ordering Exercise — Click-to-swap reorder
export function OrderingExercise({ title, instruction, items, correctOrder, explanation }: {
  title: string
  instruction: string
  items: { id: string; label: string; rationale?: string }[]
  correctOrder: string[]
  explanation: string
}) {
  const [order, setOrder] = useState<typeof items>(() => {
    // Fisher-Yates shuffle
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const handleClick = (index: number) => {
    if (checked) return
    if (selectedIndex === null) {
      setSelectedIndex(index)
    } else if (selectedIndex === index) {
      setSelectedIndex(null)
    } else {
      // Swap
      setOrder(prev => {
        const next = [...prev]
        ;[next[selectedIndex], next[index]] = [next[index], next[selectedIndex]]
        return next
      })
      setSelectedIndex(null)
    }
  }

  const isCorrect = (index: number) => order[index].id === correctOrder[index]

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <ListOrdered className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-0.5">Ordering Exercise</h4>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-4">{instruction}</p>

      <div className="space-y-2">
        {order.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleClick(index)}
            className={cn(
              "w-full text-left p-4 rounded-xl transition-all border-2 flex items-center gap-3",
              !checked && selectedIndex === index && "bg-indigo-100 border-indigo-500 ring-2 ring-indigo-200",
              !checked && selectedIndex !== index && "bg-white border-slate-200 hover:border-indigo-300 cursor-pointer",
              checked && isCorrect(index) && "bg-teal-50 border-teal-500",
              checked && !isCorrect(index) && "bg-red-50 border-red-400"
            )}
          >
            <span className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
              !checked && "bg-indigo-100 text-indigo-700",
              checked && isCorrect(index) && "bg-teal-500 text-white",
              checked && !isCorrect(index) && "bg-red-400 text-white"
            )}>
              {index + 1}
            </span>
            <span className="text-sm text-slate-700 flex-1">{item.label}</span>
            {checked && isCorrect(index) && <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" strokeWidth={2.5} />}
            {checked && !isCorrect(index) && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" strokeWidth={2.5} />}
          </button>
        ))}
      </div>

      {!checked && (
        <button
          onClick={() => setChecked(true)}
          className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
        >
          Check Order
        </button>
      )}

      {checked && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Correct Order & Explanation</p>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{explanation}</p>
          {items.map((item, i) => {
            const correctItem = items.find(it => it.id === correctOrder[i])
            return correctItem?.rationale ? (
              <div key={i} className="flex items-start gap-2 mt-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-slate-600"><strong>{correctItem.label}:</strong> {correctItem.rationale}</p>
              </div>
            ) : null
          })}
          <button
            onClick={() => {
              const arr = [...items]
              for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]]
              }
              setOrder(arr)
              setSelectedIndex(null)
              setChecked(false)
            }}
            className="mt-3 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// Matching Exercise — Pair two columns
const PAIR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-400' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-400' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-400' },
]

export function MatchingExercise({ title, instruction, pairs, leftLabel = 'Term', rightLabel = 'Definition' }: {
  title: string
  instruction: string
  pairs: { id: string; left: string; right: string; explanation?: string }[]
  leftLabel?: string
  rightLabel?: string
}) {
  const [shuffledLeft] = useState<typeof pairs>(() => {
    const arr = [...pairs]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })
  const [shuffledRight] = useState<typeof pairs>(() => {
    const arr = [...pairs]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({}) // leftId -> rightId
  const [checked, setChecked] = useState(false)

  const handleLeftClick = (id: string) => {
    if (checked) return
    setSelectedLeft(id === selectedLeft ? null : id)
  }

  const handleRightClick = (id: string) => {
    if (checked || !selectedLeft) return
    // Make the match
    // Remove any existing match involving this left or this right
    const newMatches = { ...matches }
    // Remove if this right was already matched
    for (const [k, v] of Object.entries(newMatches)) {
      if (v === id) delete newMatches[k]
    }
    newMatches[selectedLeft] = id
    setMatches(newMatches)
    setSelectedLeft(null)
  }

  const getMatchColor = (id: string, side: 'left' | 'right') => {
    const matchEntries = Object.entries(matches)
    let matchIndex: number
    if (side === 'left') {
      matchIndex = matchEntries.findIndex(([k]) => k === id)
    } else {
      matchIndex = matchEntries.findIndex(([, v]) => v === id)
    }
    if (matchIndex === -1) return null
    return PAIR_COLORS[matchIndex % PAIR_COLORS.length]
  }

  const getMatchBadge = (id: string, side: 'left' | 'right') => {
    const matchEntries = Object.entries(matches)
    let matchIndex: number
    if (side === 'left') {
      matchIndex = matchEntries.findIndex(([k]) => k === id)
    } else {
      matchIndex = matchEntries.findIndex(([, v]) => v === id)
    }
    if (matchIndex === -1) return null
    return String.fromCharCode(65 + matchIndex)
  }

  const allMatched = Object.keys(matches).length === pairs.length
  const isCorrectMatch = (leftId: string) => matches[leftId] === leftId

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-0.5">Matching Exercise</h4>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-4">{instruction}</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Left column */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{leftLabel}</p>
          <div className="space-y-2">
            {shuffledLeft.map(item => {
              const color = getMatchColor(item.id, 'left')
              const badge = getMatchBadge(item.id, 'left')
              return (
                <button
                  key={item.id}
                  onClick={() => handleLeftClick(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all border-2 flex items-center gap-2",
                    !checked && selectedLeft === item.id && "bg-purple-100 border-purple-500 ring-2 ring-purple-200",
                    !checked && selectedLeft !== item.id && !color && "bg-white border-slate-200 hover:border-purple-300 cursor-pointer",
                    !checked && color && `${color.bg} ${color.border}`,
                    checked && isCorrectMatch(item.id) && "bg-teal-50 border-teal-500",
                    checked && !isCorrectMatch(item.id) && "bg-red-50 border-red-400"
                  )}
                >
                  {badge && (
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", color ? `${color.bg} ${color.text}` : '')}>
                      {badge}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm text-slate-700 flex-1">{item.left}</span>
                  {checked && isCorrectMatch(item.id) && <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" strokeWidth={2.5} />}
                  {checked && matches[item.id] && !isCorrectMatch(item.id) && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" strokeWidth={2.5} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{rightLabel}</p>
          <div className="space-y-2">
            {shuffledRight.map(item => {
              const color = getMatchColor(item.id, 'right')
              const badge = getMatchBadge(item.id, 'right')
              return (
                <button
                  key={item.id}
                  onClick={() => handleRightClick(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all border-2 flex items-center gap-2",
                    !checked && !color && selectedLeft && "bg-white border-slate-200 hover:border-purple-300 cursor-pointer",
                    !checked && !color && !selectedLeft && "bg-white border-slate-200",
                    !checked && color && `${color.bg} ${color.border}`,
                    checked && "bg-white border-slate-200"
                  )}
                >
                  {badge && (
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", color ? `${color.bg} ${color.text}` : '')}>
                      {badge}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm text-slate-700 flex-1">{item.right}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {allMatched && !checked && (
        <button
          onClick={() => setChecked(true)}
          className="mt-4 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all"
        >
          Check Matches
        </button>
      )}

      {checked && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-purple-200">
          <p className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-2">Results</p>
          <p className="text-sm text-slate-700 mb-3">
            You matched {Object.entries(matches).filter(([k, v]) => k === v).length} of {pairs.length} correctly.
          </p>
          {pairs.map(pair => pair.explanation ? (
            <div key={pair.id} className="flex items-start gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-slate-600"><strong>{pair.left} → {pair.right}:</strong> {pair.explanation}</p>
            </div>
          ) : null)}
          <button
            onClick={() => {
              setSelectedLeft(null)
              setMatches({})
              setChecked(false)
            }}
            className="mt-3 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// Multi-Select Quiz — Select all that apply
export function MultiSelectQuiz({ question, options, correctAnswers, explanation, hideTitle = false }: {
  question: string
  options: string[]
  correctAnswers: number[]
  explanation: string
  hideTitle?: boolean
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [checked, setChecked] = useState(false)

  const toggleOption = (index: number) => {
    if (checked) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const correctCount = checked
    ? options.filter((_, i) => {
        const shouldBeSelected = correctAnswers.includes(i)
        const wasSelected = selected.has(i)
        return shouldBeSelected === wasSelected
      }).length
    : 0

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200 p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        {!hideTitle && (
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1">
          {!hideTitle && (
            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-1">Select All That Apply</h4>
          )}
          <p className="text-sm font-semibold text-slate-900">{question}</p>
        </div>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = selected.has(index)
          const isCorrect = correctAnswers.includes(index)
          const wasMissed = checked && isCorrect && !isSelected
          const wasWrong = checked && !isCorrect && isSelected

          return (
            <button
              key={index}
              onClick={() => toggleOption(index)}
              disabled={checked}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all border-2 flex items-center gap-3",
                !checked && isSelected && "bg-purple-100 border-purple-400",
                !checked && !isSelected && "bg-white/50 border-purple-200 hover:bg-white hover:border-purple-300 cursor-pointer",
                checked && isCorrect && isSelected && "bg-teal-100 border-teal-500",
                checked && wasMissed && "bg-amber-50 border-amber-400",
                checked && wasWrong && "bg-red-50 border-red-400",
                checked && !isCorrect && !isSelected && "opacity-50"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                !checked && isSelected && "bg-purple-500 border-purple-500",
                !checked && !isSelected && "border-purple-300",
                checked && isCorrect && isSelected && "bg-teal-500 border-teal-500",
                checked && wasMissed && "border-amber-400",
                checked && wasWrong && "bg-red-400 border-red-400"
              )}>
                {(isSelected || wasMissed) && (
                  checked ? (
                    isCorrect && isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} /> :
                    wasWrong ? <XCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} /> :
                    null
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )
                )}
              </div>
              <span className={cn(
                "text-sm flex-1",
                checked && isCorrect && isSelected && "text-teal-900 font-semibold",
                checked && wasMissed && "text-amber-900",
                checked && wasWrong && "text-red-900"
              )}>
                {option}
              </span>
              {checked && wasMissed && (
                <span className="text-xs font-bold text-amber-600 px-2 py-0.5 bg-amber-100 rounded">Missed</span>
              )}
            </button>
          )
        })}
      </div>

      {!checked && (
        <button
          onClick={() => setChecked(true)}
          className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
        >
          Check Answer
        </button>
      )}

      {checked && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">
            You got {correctCount} of {options.length} correct
          </p>
          <div className="p-4 bg-white rounded-xl border border-blue-200">
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
