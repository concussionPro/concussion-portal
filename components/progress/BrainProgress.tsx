'use client'

// Subtle, professional brain-themed progress visualization

export function BrainProgressBar({ progress, total, label }: {
  progress: number
  total: number
  label?: string
}) {
  const percentage = Math.round((progress / total) * 100)

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="font-bold text-teal-600">{progress} / {total}</span>
        </div>
      )}
      <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        {/* Subtle gradient fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

export function NeuralPathway({ stages, currentStage }: {
  stages: string[]
  currentStage: number
}) {
  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isComplete = index < currentStage
        const isCurrent = index === currentStage
        const isLocked = index > currentStage

        return (
          <div key={index} className="flex items-center gap-4">
            {/* Node */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${isComplete ? 'bg-teal-500 text-white' : ''}
              ${isCurrent ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white animate-pulse' : ''}
              ${isLocked ? 'bg-slate-200 text-slate-400' : ''}
            `}>
              <span className="text-sm font-bold">{index + 1}</span>
            </div>

            {/* Connection Line */}
            {index < stages.length - 1 && (
              <div className="absolute left-5 top-12 w-px h-8 bg-slate-200">
                {isComplete && (
                  <div className="w-full bg-gradient-to-b from-teal-500 to-blue-500 h-full" />
                )}
              </div>
            )}

            {/* Label */}
            <div className="flex-1">
              <span className={`text-sm font-medium ${isComplete || isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                {stage}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ModuleProgress({ completed, total }: {
  completed: number
  total: number
}) {
  const segments = Array.from({ length: total }, (_, i) => i < completed)

  return (
    <div className="flex items-center gap-1.5">
      {segments.map((isComplete, index) => (
        <div
          key={index}
          className={`
            h-1.5 flex-1 rounded-full transition-all duration-500
            ${isComplete
              ? 'bg-gradient-to-r from-teal-500 to-blue-500'
              : 'bg-slate-200'
            }
          `}
          style={{
            transitionDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  )
}
