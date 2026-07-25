'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, RotateCcw, AlertTriangle, Target, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { PromptFormData } from '@/lib/ai-course/prompt-form-extract'

/**
 * Renders an auto-extracted prompt block (Inputs / Prompt / Review
 * checklist / does well / does poorly) as a fillable interactive form.
 *
 * For each input listed in "Inputs the model needs":
 *   - dropdown if the hint was a slash-separated option set
 *   - textarea if the label suggests free-form (baseline, constraints, goal, etc.)
 *   - text input otherwise
 *
 * The prompt template is rendered as a user-editable textarea so the
 * clinician can adapt it to their case. A "Patient context" block built
 * from the input fields is prepended to the prompt at copy-time so the
 * AI tool gets both the structured inputs and the template wording.
 */
export function InteractivePromptForm({ data }: { data: PromptFormData }) {
  const fieldKey = (label: string): string =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  const initialInputs = useMemo(
    () => Object.fromEntries(data.inputs.map((i) => [fieldKey(i.label), ''])),
    [data]
  )
  const [inputValues, setInputValues] = useState<Record<string, string>>(initialInputs)
  const [editedPrompt, setEditedPrompt] = useState<string>(data.promptTemplate)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)

  const contextBlock = data.inputs
    .map((inp) => {
      const v = inputValues[fieldKey(inp.label)]?.trim()
      if (!v) return null
      return `- ${inp.label}: ${v}`
    })
    .filter(Boolean)
    .join('\n')

  const fullPrompt = contextBlock
    ? `Patient context:\n${contextBlock}\n\n${editedPrompt}`
    : editedPrompt

  const filledCount = data.inputs.filter((i) => inputValues[fieldKey(i.label)]?.trim()).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — fail silently
    }
  }

  const handleReset = () => {
    setInputValues(initialInputs)
    setEditedPrompt(data.promptTemplate)
    setChecked(new Set())
  }

  // NOT a hook — a plain predicate. The `use` prefix made React (and the
  // rules-of-hooks lint) treat every call inside the field .map() as a
  // conditionally-called hook. Renamed rather than suppressed.
  const isTextareaField = (label: string): boolean => {
    const l = label.toLowerCase()
    return (
      l.includes('baseline') ||
      l.includes('constraint') ||
      l.includes('goal') ||
      l.includes('history') ||
      l.includes('description') ||
      l.includes('hypothesis') ||
      l.includes('symptoms') ||
      l.includes('findings')
    )
  }

  return (
    <div className="my-8 rounded-2xl border-2 border-accent/25 bg-white overflow-hidden not-prose shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-accent/15 bg-gradient-to-br from-accent/5 to-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-1.5">
          Interactive prompt · fillable
        </p>
        {data.goal && (
          <p className="text-sm font-semibold text-foreground leading-snug mb-2 flex items-start gap-2">
            <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>{data.goal}</span>
          </p>
        )}
        {data.riskTier && (
          <p className="text-xs text-amber-800 leading-snug flex items-start gap-2 mt-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span><strong>Risk tier:</strong> {data.riskTier}</span>
          </p>
        )}
      </div>

      {/* Input fields */}
      {data.inputs.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Patient context · inputs the model needs
            </p>
            <p className="text-[10px] font-semibold tabular-nums text-slate-500">
              {filledCount} / {data.inputs.length} filled
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.inputs.map((inp) => {
              const key = fieldKey(inp.label)
              return (
                <div key={key} className={isTextareaField(inp.label) || inp.options ? 'sm:col-span-2' : ''}>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {inp.label}
                    {inp.hint && !inp.options && (
                      <span className="font-normal text-slate-500 ml-1.5">— {inp.hint}</span>
                    )}
                  </label>
                  {inp.options ? (
                    <select
                      value={inputValues[key] || ''}
                      onChange={(e) => setInputValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                    >
                      <option value="">Select…</option>
                      {inp.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : isTextareaField(inp.label) ? (
                    <textarea
                      value={inputValues[key] || ''}
                      onChange={(e) => setInputValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={`e.g. ${inp.hint || 'enter detail'}`}
                      rows={2}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                    />
                  ) : (
                    <input
                      type="text"
                      value={inputValues[key] || ''}
                      onChange={(e) => setInputValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={`e.g. ${inp.hint || 'enter detail'}`}
                      className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Editable prompt + generated preview */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Prompt template — edit to fit your case
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Patient-context block is prepended automatically when you copy.
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
              {copied ? 'Copied' : 'Copy full prompt'}
            </button>
          </div>
        </div>
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          rows={Math.max(5, Math.min(14, editedPrompt.split('\n').length + 1))}
          className="w-full text-[12px] font-mono leading-relaxed px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-y"
        />
        {contextBlock && (
          <details className="mt-3">
            <summary className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 cursor-pointer hover:text-foreground">
              Preview · what gets copied
            </summary>
            <pre className="mt-2 text-[12px] whitespace-pre-wrap bg-slate-900 text-slate-100 p-4 rounded-lg font-mono leading-relaxed overflow-x-auto">
{fullPrompt}
            </pre>
          </details>
        )}
      </div>

      {/* Does well / poorly guidance */}
      {(data.doesWell || data.doesPoorly) && (
        <div className="px-5 py-3 border-b border-slate-100 grid sm:grid-cols-2 gap-3">
          {data.doesWell && (
            <div className="rounded-md bg-emerald-50/60 border border-emerald-200 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-1 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                Model does well
              </p>
              <p className="text-[11px] text-emerald-900 leading-snug">{data.doesWell}</p>
            </div>
          )}
          {data.doesPoorly && (
            <div className="rounded-md bg-amber-50/60 border border-amber-200 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1 flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                Model does poorly
              </p>
              <p className="text-[11px] text-amber-900 leading-snug">{data.doesPoorly}</p>
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      {data.checklist.length > 0 && (
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
                    onChange={() =>
                      setChecked((c) => {
                        const next = new Set(c)
                        if (next.has(idx)) next.delete(idx)
                        else next.add(idx)
                        return next
                      })
                    }
                    className="mt-0.5 w-3.5 h-3.5 accent-accent shrink-0 cursor-pointer"
                  />
                  <span
                    className={
                      checked.has(idx)
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground/85'
                    }
                  >
                    {item}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {checked.size === data.checklist.length && (
            <p className="mt-3 text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              All reviewed — ready to send.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
