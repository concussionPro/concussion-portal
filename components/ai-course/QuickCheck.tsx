'use client'

import { useState } from 'react'
import { Check, X, Brain } from 'lucide-react'

interface QuickCheckProps {
  question: string
  /** 0-indexed correct option */
  correctIndex: number
  options: string[]
  rationale?: string
}

/**
 * Inline knowledge check — drops into the middle of a section's prose
 * to break up dense reading and reinforce a key claim. Differs from
 * the per-section `quizCheck` (which renders at the END of a section)
 * by being placed wherever the author drops `[QUICK-CHECK: ...]`.
 *
 * Marker syntax: [QUICK-CHECK: <question> | <correctIdx> | <a> | <b> | <c> | rationale: <text>]
 *   - question: the prompt
 *   - correctIdx: 0-based index of correct option
 *   - options: 2+ pipe-separated options
 *   - rationale: optional, prefixed with "rationale:"
 */
export function QuickCheck({ question, correctIndex, options, rationale }: QuickCheckProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const isCorrect = selected === correctIndex

  return (
    <div className="my-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-white overflow-hidden not-prose">
      <div className="px-5 py-3 border-b border-blue-100 flex items-center gap-2 bg-blue-50/40">
        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-blue-700" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
          Quick check
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-foreground leading-snug mb-4">{question}</p>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isThis = selected === i
            const isRight = submitted && i === correctIndex
            const isWrongPick = submitted && isThis && i !== correctIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (submitted) return
                  setSelected(i)
                  setSubmitted(true)
                }}
                className={`w-full text-left text-sm px-3.5 py-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                  isRight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : isWrongPick
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : isThis
                        ? 'bg-slate-100 border-slate-300'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                } ${submitted && !isThis && !isRight ? 'opacity-60' : ''}`}
                disabled={submitted && !isThis && !isRight}
              >
                <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  isRight ? 'bg-emerald-200 text-emerald-900' :
                  isWrongPick ? 'bg-red-200 text-red-900' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {isRight ? <Check className="w-3 h-3" /> : isWrongPick ? <X className="w-3 h-3" /> : String.fromCharCode(65 + i)}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            )
          })}
        </div>
        {submitted && (
          <div className={`mt-4 rounded-lg px-3.5 py-3 text-xs leading-relaxed ${
            isCorrect ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border border-amber-200 text-amber-900'
          }`}>
            <p className="font-semibold mb-1">
              {isCorrect ? '✓ Correct' : 'Not quite — the correct answer is highlighted.'}
            </p>
            {rationale && <p className="leading-relaxed">{rationale}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
