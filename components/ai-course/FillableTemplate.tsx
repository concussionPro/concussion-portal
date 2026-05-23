'use client'

import { useState, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, RotateCcw, Printer, FileDown, Eye, Pencil } from 'lucide-react'

interface FillableTemplateProps {
  /** Template title shown above the form */
  title: string
  /** Raw markdown body with `{field_name}` placeholders */
  body: string
  /** Ordered, de-duplicated list of placeholder keys */
  fields: string[]
}

/**
 * Smart label + input-type heuristic from a field key. Keys are
 * snake_case_lowercase — we infer the type so the user gets the
 * right input variant (date picker for dob/date, textarea for
 * multi-line content like "data_residency" / "ai_tools_used").
 */
function deriveFieldMeta(key: string): {
  label: string
  type: 'text' | 'date' | 'tel' | 'textarea' | 'email'
  placeholder: string
} {
  const label = key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bDob\b/g, 'DOB')
    .replace(/\bAhpra\b/gi, 'AHPRA')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bId\b/g, 'ID')
    .replace(/\bGp\b/g, 'GP')

  if (key === 'date' || key.endsWith('_date'))
    return { label, type: 'date', placeholder: '' }
  if (key === 'dob') return { label, type: 'date', placeholder: '' }
  if (key.endsWith('_phone') || key.endsWith('_fax'))
    return { label, type: 'tel', placeholder: '' }
  if (key.endsWith('_email'))
    return { label, type: 'email', placeholder: '' }

  // Heuristic for textarea: longer content fields
  const textareaKeys = [
    'data_residency',
    'ai_tools_used',
    'symptoms',
    'history',
    'findings',
    'recommendations',
    'plan',
    'baseline',
    'constraints',
    'rationale',
    'description',
    'instructions',
    'progression',
    'exercises',
    'medications',
    'allergies',
    'goals',
    'precautions',
    'red_flags',
    'follow_up',
    'discharge_advice',
  ]
  if (textareaKeys.some((k) => key.includes(k)))
    return { label, type: 'textarea', placeholder: '' }

  return { label, type: 'text', placeholder: '' }
}

export function FillableTemplate({ title, body, fields }: FillableTemplateProps) {
  const todayISO = new Date().toISOString().slice(0, 10)

  const initialValues = useMemo(() => {
    const v: Record<string, string> = {}
    for (const k of fields) {
      // Sensible defaults: date fields default to today
      v[k] = k === 'date' ? todayISO : ''
    }
    return v
  }, [fields, todayISO])

  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const rendered = useMemo(() => {
    return body.replace(/\{([a-z][a-z0-9_]*)\}/g, (_match, key) => {
      const v = values[key]?.trim()
      if (v) {
        // If date, format DD Month YYYY for human readability
        if ((key === 'date' || key.endsWith('_date') || key === 'dob') && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const d = new Date(v + 'T00:00:00')
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
          }
        }
        return v
      }
      return `[${deriveFieldMeta(key).label}]`
    })
  }, [body, values])

  const filledCount = fields.filter((k) => values[k]?.trim()).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked
    }
  }

  const handleReset = () => {
    setValues(initialValues)
  }

  const handlePrint = () => {
    // Switch to preview mode first so the print render is clean
    setMode('preview')
    // Wait a tick for re-render before triggering print
    setTimeout(() => window.print(), 100)
  }

  return (
    <div className="my-4 not-prose">
      {/* Mode + action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setMode('edit')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors ${
              mode === 'edit' ? 'bg-foreground text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Fill in
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors ${
              mode === 'preview' ? 'bg-foreground text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-slate-500">
            {filledCount} / {fields.length} fields filled
          </span>
          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-slate-500 hover:text-foreground inline-flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={handleCopy}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-slate-300 text-foreground hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handlePrint}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent/90 inline-flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form (left, 2/5 width on lg) */}
        {mode === 'edit' && (
          <div className="lg:col-span-2 print:hidden">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">
                Form · {fields.length} fields
              </p>
              <div className="space-y-3">
                {fields.map((key) => {
                  const { label, type } = deriveFieldMeta(key)
                  const value = values[key] ?? ''
                  return (
                    <div key={key}>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {label}
                      </label>
                      {type === 'textarea' ? (
                        <textarea
                          value={value}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [key]: e.target.value }))
                          }
                          rows={2}
                          className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                        />
                      ) : (
                        <input
                          type={type}
                          value={value}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [key]: e.target.value }))
                          }
                          className="w-full text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors placeholder:text-slate-400"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rendered document (right, 3/5 on lg; full width in preview mode) */}
        <div className={mode === 'edit' ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <div
            ref={previewRef}
            className="rounded-xl border border-slate-200 bg-white px-7 py-8 print:border-0 print:p-0 print:rounded-none"
          >
            <div className="mb-4 print:mb-2 print:text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1 print:hidden">
                Document preview
              </p>
              <h2 className="text-xl font-bold text-foreground leading-tight">{title}</h2>
            </div>
            <article
              className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1.5 prose-p:text-[13.5px] prose-p:leading-relaxed prose-p:my-2 prose-li:text-[13.5px] prose-li:my-0.5 prose-strong:text-foreground prose-hr:my-4 print:prose-p:text-[11pt]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
            </article>
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 print:text-[9pt]">
              Drafted with AI assistance. Reviewed and approved by the signing clinician before issue.
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground print:hidden">
            Empty fields render as <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">[Field Label]</code> placeholders until completed. Print/PDF uses browser print — set margins to Default and choose &ldquo;Save as PDF.&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
