'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, RotateCcw, AlertCircle } from 'lucide-react'
import type { PromptCardData } from '@/lib/ai-course/prompt-cards'

/**
 * Interactive prompt card. Renders the prompt as an editable form
 * (one input per placeholder field), a live-preview generated prompt
 * (placeholders replaced with values or [LABEL] fallback), copy-to-
 * clipboard, and a reviewable checklist with checkboxes.
 *
 * Drop into module markdown via `[PROMPT-CARD: <slug>]` where slug
 * matches an entry in PROMPT_CARDS.
 */
export function PromptCard({ data }: { data: PromptCardData }) {
  const initial = useMemo(
    () => Object.fromEntries(data.fields.map((f) => [f.key, ''])),
    [data]
  )
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)

  const renderedPrompt = data.promptTemplate.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = values[key]?.trim()
    if (value) return value
    const field = data.fields.find((f) => f.key === key)
    return field ? `[${field.label}]` : `{{${key}}}`
  })

  const allFieldsFilled = data.fields.every((f) => values[f.key]?.trim())
  const allChecklistDone = checked.size === data.checklist.length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be blocked — fail silently
    }
  }

  const handleReset = () => {
    setValues(initial)
    setChecked(new Set())
  }

  const toggleCheck = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="my-8 rounded-2xl border-2 border-accent/25 bg-white overflow-hidden not-prose shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-accent/15 bg-gradient-to-br from-accent/5 to-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-1.5">
          Interactive prompt · fillable
        </p>
        <h3 className="text-lg font-bold text-foreground leading-tight mb-1">{data.title}</h3>
        {data.audience && <p className="text-xs text-muted-foreground">{data.audience}</p>}
      </div>

      {/* Fields */}
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">
          Fill in the patient-specific details
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.fields.map((f) => (
            <div key={f.key}>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                {f.label}
              </label>
              {f.multiline ? (
                <textarea
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                />
              ) : (
                <input
                  type="text"
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generated prompt */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Generated prompt
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {allFieldsFilled
                ? 'Ready to copy → paste into your AI tool.'
                : 'Empty fields render as placeholders — fill them above for a complete prompt.'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="text-[11px] font-semibold text-slate-500 hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleCopy}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-md bg-foreground text-white hover:bg-foreground/90 inline-flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>
        </div>
        <pre className="text-[12px] whitespace-pre-wrap bg-slate-900 text-slate-100 p-4 rounded-lg font-mono leading-relaxed overflow-x-auto">{renderedPrompt}</pre>
      </div>

      {/* Notes (tool tier reminder etc.) */}
      {data.notes && (
        <div className="px-5 py-2.5 border-b border-slate-100 bg-amber-50/60 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed">{data.notes}</p>
        </div>
      )}

      {/* Checklist */}
      <div className="px-5 py-4 bg-slate-50/50">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Review before sending
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-500">
            {checked.size} / {data.checklist.length} checked
          </p>
        </div>
        <ul className="space-y-2">
          {data.checklist.map((item, idx) => (
            <li key={idx}>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-snug">
                <input
                  type="checkbox"
                  checked={checked.has(idx)}
                  onChange={() => toggleCheck(idx)}
                  className="mt-0.5 w-3.5 h-3.5 accent-accent shrink-0 cursor-pointer"
                />
                <span className={checked.has(idx) ? 'line-through text-muted-foreground' : 'text-foreground/85'}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {allChecklistDone && (
          <p className="mt-3 text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            All reviewed — letter ready to send.
          </p>
        )}
      </div>
    </div>
  )
}
