'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, X, ChevronRight, ChevronLeft, Lightbulb, AlertCircle } from 'lucide-react'
import type { ParsedSection, SectionQuizCheck } from '@/lib/ai-course/module-sections'
import {
  InfographicRenderer,
  KeyPointCard,
  RedFlagCard,
  DefinitionCard,
  TryThisCard,
} from './Infographics'
import { PromptCard } from './PromptCard'
import { InteractivePromptForm } from './InteractivePromptForm'
import { findPromptCard } from '@/lib/ai-course/prompt-cards'
import type { PromptFormData } from '@/lib/ai-course/prompt-form-extract'

// Match all seven marker types in a single pass. The marker body runs until
// the closing `]` on the same paragraph (no nested brackets supported).
const MARKER_REGEX =
  /\[(INFOGRAPHIC|KEYPOINT|REDFLAG|DEFINITION|TRYTHIS|PROMPT-CARD|PROMPT-FORM-AUTO):\s*([^\]]+)\]/g

type MarkerKind =
  | 'INFOGRAPHIC'
  | 'KEYPOINT'
  | 'REDFLAG'
  | 'DEFINITION'
  | 'TRYTHIS'
  | 'PROMPT-CARD'
  | 'PROMPT-FORM-AUTO'
type Part =
  | { kind: 'md'; value: string }
  | { kind: 'marker'; type: MarkerKind; value: string }

/**
 * Splits markdown content on inline marker patterns and renders an
 * interleaved sequence of markdown chunks and styled React cards.
 * Supports:
 *   [INFOGRAPHIC: <slug>]
 *   [KEYPOINT: <text>]
 *   [REDFLAG: <text>]
 *   [DEFINITION: <term> | <definition>]
 *   [TRYTHIS: <text>]
 */
function SectionBody({ body, promptForms }: { body: string; promptForms?: PromptFormData[] }) {
  const parts: Part[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  MARKER_REGEX.lastIndex = 0
  while ((match = MARKER_REGEX.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: 'md', value: body.slice(lastIndex, match.index) })
    }
    parts.push({ kind: 'marker', type: match[1] as MarkerKind, value: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < body.length) {
    parts.push({ kind: 'md', value: body.slice(lastIndex) })
  }
  if (parts.length === 0) {
    parts.push({ kind: 'md', value: body })
  }

  const renderMarker = (i: number, type: MarkerKind, value: string) => {
    switch (type) {
      case 'INFOGRAPHIC':
        return <InfographicRenderer key={i} slug={value} />
      case 'KEYPOINT':
        return <KeyPointCard key={i} text={value} />
      case 'REDFLAG':
        return <RedFlagCard key={i} text={value} />
      case 'TRYTHIS':
        return <TryThisCard key={i} text={value} />
      case 'DEFINITION': {
        // Definition uses `term | text` split
        const pipe = value.indexOf('|')
        if (pipe === -1) {
          return <DefinitionCard key={i} term="" definition={value} />
        }
        const term = value.slice(0, pipe).trim()
        const def = value.slice(pipe + 1).trim()
        return <DefinitionCard key={i} term={term} definition={def} />
      }
      case 'PROMPT-CARD': {
        const data = findPromptCard(value)
        if (!data) {
          return (
            <p key={i} className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 my-4 not-prose">
              Prompt card not found: <code className="font-mono">{value}</code>
            </p>
          )
        }
        return <PromptCard key={i} data={data} />
      }
      case 'PROMPT-FORM-AUTO': {
        const idx = parseInt(value, 10)
        const formData = promptForms?.[idx]
        if (!formData) {
          return (
            <p key={i} className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 my-4 not-prose">
              Prompt form not available
            </p>
          )
        }
        return <InteractivePromptForm key={i} data={formData} />
      }
    }
  }

  return (
    <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-base prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px] prose-li:leading-relaxed prose-strong:text-foreground prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-md prose-blockquote:not-italic prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:hidden prose-code:after:hidden [&_table]:w-full [&_table]:my-6 [&_table]:border [&_table]:border-slate-200 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border-separate [&_table]:border-spacing-0 [&_thead]:bg-slate-50 [&_th]:text-left [&_th]:font-bold [&_th]:text-[12px] [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-600 [&_th]:px-3 [&_th]:py-2.5 [&_th]:border-b [&_th]:border-slate-200 [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:align-top [&_td]:border-b [&_td]:border-slate-100 [&_tr:last-child_td]:border-b-0">
      {parts.map((p, i) =>
        p.kind === 'md' ? (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {p.value}
          </ReactMarkdown>
        ) : (
          renderMarker(i, p.type, p.value)
        )
      )}
    </article>
  )
}

interface ModuleViewerProps {
  /** Optional module header (rendered above the section stepper) */
  header: string
  /** Parsed sections to render */
  sections: ParsedSection[]
}

/**
 * Renders an AI course module as a sequence of sections with a top
 * stepper, per-section reading-time pills, and optional mid-section
 * knowledge-check quizzes. Mirrors the concussion course's chunked
 * pattern without sharing concussion's renderer code.
 */
export function ModuleViewer({ header, sections }: ModuleViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  // Track which sections have been "completed" — for the stepper visual
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const active = sections[activeIdx]

  const markCompleteAndAdvance = () => {
    setCompleted((c) => new Set([...c, activeIdx]))
    if (activeIdx + 1 < sections.length) setActiveIdx(activeIdx + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (sections.length === 0) {
    return <p className="text-muted-foreground">No section content available.</p>
  }

  // header is intentionally NOT rendered as body content — the parent
  // page header already shows module number, title, duration, and
  // load-bearing flag. Rendering the markdown header block here
  // duplicated all that metadata as an unstyled prose dump.
  // The `header` prop is preserved on the interface for future use
  // (e.g. an "About this module" footer with last-reviewed date), but
  // not displayed here.
  void header

  return (
    <div>
      <SectionStepper
        sections={sections}
        activeIdx={activeIdx}
        completed={completed}
        onSelect={setActiveIdx}
      />

      <div className="card rounded-xl p-6 md:p-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">
              Section {activeIdx + 1} of {sections.length}
            </p>
            <h2 className="text-2xl font-bold text-foreground">{active.title}</h2>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ~{active.readingMin} min
          </span>
        </div>

        <SectionBody body={active.body} promptForms={active.promptForms} />

        {active.quizCheck && (
          <QuizCheck key={active.id} check={active.quizCheck} />
        )}

        {active.applyTomorrow && <ApplyTomorrow text={active.applyTomorrow} />}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
          <button
            onClick={() => {
              if (activeIdx > 0) {
                setActiveIdx(activeIdx - 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={activeIdx === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          {activeIdx + 1 < sections.length ? (
            <button
              onClick={markCompleteAndAdvance}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90"
            >
              Next section
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCompleted((c) => new Set([...c, activeIdx]))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
            >
              <Check className="w-4 h-4" />
              Mark module complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionStepper({
  sections,
  activeIdx,
  completed,
  onSelect,
}: {
  sections: ParsedSection[]
  activeIdx: number
  completed: Set<number>
  onSelect: (idx: number) => void
}) {
  return (
    <nav aria-label="Section navigation" className="overflow-x-auto -mx-2 px-2">
      <ol className="flex items-center gap-2 min-w-max">
        {sections.map((s, i) => {
          const isActive = i === activeIdx
          const isDone = completed.has(i)
          return (
            <li key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => onSelect(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-white border-accent'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-foreground border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-accent' :
                  isDone ? 'bg-emerald-600 text-white' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="max-w-[180px] truncate">{s.title}</span>
              </button>
              {i < sections.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function QuizCheck({ check }: { check: SectionQuizCheck }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = selected === check.correctIndex

  return (
    <div className="mt-10 rounded-xl bg-amber-50 border-2 border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-700" />
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
          Knowledge check
        </p>
      </div>
      <p className="text-sm font-semibold text-foreground mb-4">{check.question}</p>
      <div className="space-y-2">
        {check.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = submitted && i === check.correctIndex
          const isWrong = submitted && isSelected && i !== check.correctIndex
          return (
            <label
              key={i}
              className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-300'
                  : isWrong
                    ? 'bg-red-50 border-red-300'
                    : isSelected
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={check.question}
                checked={isSelected}
                onChange={() => { if (!submitted) setSelected(i) }}
                disabled={submitted}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground flex-1">{opt}</span>
              {isCorrect && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
              {isWrong && <X className="w-4 h-4 text-red-700 shrink-0" />}
            </label>
          )
        })}
      </div>
      {!submitted ? (
        <button
          onClick={() => selected !== null && setSubmitted(true)}
          disabled={selected === null}
          className="mt-4 px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90"
        >
          Check answer
        </button>
      ) : (
        <div className={`mt-4 p-3 rounded-lg text-sm ${correct ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
          <p className="font-semibold mb-1">{correct ? 'Correct.' : 'Not quite.'}</p>
          <p className="text-xs leading-relaxed">{check.rationale}</p>
        </div>
      )}
    </div>
  )
}

function ApplyTomorrow({ text }: { text: string }) {
  return (
    <div className="mt-8 rounded-xl bg-teal-50 border border-teal-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-teal-700" />
        <p className="text-xs font-bold uppercase tracking-wide text-teal-900">
          Apply tomorrow
        </p>
      </div>
      <p className="text-sm text-teal-900 leading-relaxed">{text}</p>
    </div>
  )
}

