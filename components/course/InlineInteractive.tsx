'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { QuickCheck } from './InteractiveElements'

// Inline "Think first — tap to reveal" card.
// Backs the [REVEAL: prompt | answer] content marker. Premium, subtle styling
// (bordered slate card, teal accent) — toggles the answer on click.
export function InlineReveal({ prompt, answer }: { prompt: string; answer: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setRevealed(v => !v)}
        aria-expanded={revealed}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-100 transition-colors"
      >
        <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-300 flex items-center justify-center">
          {revealed
            ? <EyeOff className="w-4 h-4 text-teal-600" strokeWidth={2} />
            : <Eye className="w-4 h-4 text-teal-600" strokeWidth={2} />}
        </span>
        <span className="flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-teal-700 mb-1">
            {revealed ? 'Answer' : 'Think first — tap to reveal'}
          </span>
          <span className="block text-[15px] font-medium text-slate-800 leading-relaxed">{prompt}</span>
        </span>
      </button>
      {revealed && (
        <div className="px-5 pb-4 sm:pl-[60px]">
          <div className="rounded-lg bg-white border-l-4 border-teal-500 px-4 py-3">
            <p className="text-[15px] text-slate-700 leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline single knowledge-check.
// Backs the [POLL: question | optA | optB | optC || correctIndex | explanation]
// content marker — renders through the shared QuickCheck component.
export function InlinePoll({ question, options, correctAnswer, explanation }: {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}) {
  return (
    <QuickCheck
      question={question}
      options={options}
      correctAnswer={correctAnswer}
      explanation={explanation}
    />
  )
}
