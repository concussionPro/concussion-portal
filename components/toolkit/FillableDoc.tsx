'use client'

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import { Printer, RotateCcw, ShieldCheck, PenLine, Lock, X } from 'lucide-react'

interface SignOff {
  name: string
  date: string
}

interface FillableContextValue {
  get: (name: string) => string
  set: (name: string, value: string) => void
  clearAll: () => void
  /** Compliance sign-off gate. When `requireSignoff`, export is locked until
   *  the clinician reviews + signs; `signoff` holds who/when once signed. */
  requireSignoff: boolean
  signoff: SignOff | null
  sign: (s: SignOff) => void
  unsign: () => void
}

const FillableContext = createContext<FillableContextValue | null>(null)

export function FillableDoc({
  storageKey,
  defaultValues,
  previewMode = false,
  requireSignoff = false,
  children,
}: {
  storageKey: string
  /** Pre-populated values used on first load (before user edits). */
  defaultValues?: Record<string, string>
  previewMode?: boolean
  /** When true, "Save as PDF" is GATED behind a clinician review + sign-off
   *  (compliance). The document cannot be exported until the clinician confirms
   *  the pre-issue checklist and signs. */
  requireSignoff?: boolean
  children: React.ReactNode
}) {
  const [values, setValues] = useState<Record<string, string>>(defaultValues ?? {})
  const [hydrated, setHydrated] = useState(false)
  // Sign-off is DELIBERATELY not persisted: a re-opened document must be
  // re-reviewed before it can be exported again (compliance — no stale sign-off).
  const [signoff, setSignoff] = useState<SignOff | null>(null)

  useEffect(() => {
    if (previewMode) {
      setHydrated(true)
      return
    }
    try {
      const raw = localStorage.getItem(`hubfill:${storageKey}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const cleaned = Object.fromEntries(
            Object.entries(parsed as Record<string, string>).filter(
              ([, v]) => typeof v !== 'string' || !/advanced health/i.test(v),
            ),
          )
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setValues({ ...(defaultValues ?? {}), ...cleaned })
        }
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [storageKey, defaultValues, previewMode])

  useEffect(() => {
    if (!previewMode || !hydrated) return
    setValues(defaultValues ?? {})
  }, [defaultValues, previewMode, hydrated])

  useEffect(() => {
    if (!hydrated || previewMode) return
    try {
      localStorage.setItem(`hubfill:${storageKey}`, JSON.stringify(values))
    } catch {
      // quota errors etc — silent
    }
  }, [values, storageKey, hydrated, previewMode])

  const get = useCallback((name: string) => values[name] ?? '', [values])
  const set = useCallback((name: string, value: string) => {
    // Any edit invalidates a prior sign-off — the signed content must match
    // what was reviewed.
    setSignoff(null)
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])
  const clearAll = useCallback(() => {
    if (confirm('Clear all entered fields in this document?')) {
      setSignoff(null)
      setValues({})
      try { localStorage.removeItem(`hubfill:${storageKey}`) } catch {}
    }
  }, [storageKey])
  const sign = useCallback((s: SignOff) => setSignoff(s), [])
  const unsign = useCallback(() => setSignoff(null), [])

  const ctx = useMemo<FillableContextValue>(
    () => ({ get, set, clearAll, requireSignoff, signoff, sign, unsign }),
    [get, set, clearAll, requireSignoff, signoff, sign, unsign],
  )

  return (
    <FillableContext.Provider value={ctx}>
      {previewMode && <PreviewPrintBlock />}
      {/* Compliance: an unsigned require-signoff doc cannot be printed at all —
          Cmd/Ctrl+P is suppressed too, not just the toolbar button. */}
      {!previewMode && requireSignoff && !signoff && <UnsignedPrintBlock />}
      <div
        data-preview-mode={previewMode ? 'true' : 'false'}
        className={previewMode ? 'select-none' : undefined}
      >
        {children}
      </div>
      {!previewMode && <Toolbar />}
    </FillableContext.Provider>
  )
}

const UNSIGNED_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    body::before {
      content: "This document must be reviewed and signed by the treating clinician before export. Use ‘Review & sign to export’.";
      visibility: visible !important; display: block !important; padding: 24px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important; line-height: 1.6 !important; color: #16243f !important;
    }
  }
`

function UnsignedPrintBlock() {
  return <style dangerouslySetInnerHTML={{ __html: UNSIGNED_PRINT_CSS }} />
}

const PREVIEW_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    body::before {
      content: "Preview content only. The full template, course modules and clinical documentation activate with the Hub Program. portal.concussion-education-australia.com";
      visibility: visible !important;
      display: block !important;
      padding: 24px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
      color: #1a2332 !important;
    }
  }
`

function PreviewPrintBlock() {
  return <style dangerouslySetInnerHTML={{ __html: PREVIEW_PRINT_CSS }} />
}

/** The compliance checklist a clinician must confirm before a document exports. */
const SIGNOFF_CHECKLIST = [
  'Every field is completed — no blanks or {braces} remain in the document.',
  'I have reviewed the content and confirm it is clinically accurate.',
  'Patient / guardian consent has been obtained to share it with the named recipient.',
  'A signed copy will be retained in the patient record.',
]

function Toolbar() {
  const ctx = useContext(FillableContext)!
  const [reviewing, setReviewing] = useState(false)

  const doExport = () => window.print()

  return (
    <>
      <div className="print:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={ctx.clearAll}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-md hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear fields
        </button>

        {!ctx.requireSignoff ? (
          <button
            onClick={doExport}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-bold shadow-md hover:bg-accent/90 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Save as PDF
          </button>
        ) : ctx.signoff ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Signed · {ctx.signoff.name}
            </span>
            <button
              onClick={ctx.unsign}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-sm hover:bg-slate-50"
              title="Unlock to edit — this clears the sign-off"
            >
              <PenLine className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={doExport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-bold shadow-md hover:bg-accent/90 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Export signed PDF
            </button>
          </>
        ) : (
          <button
            onClick={() => setReviewing(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#16243f] text-white text-xs font-bold shadow-md hover:bg-[#16243f]/90 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Review &amp; sign to export
          </button>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          defaultName={ctx.get('clinician_name')}
          onClose={() => setReviewing(false)}
          onSign={(s) => {
            ctx.sign(s)
            setReviewing(false)
          }}
        />
      )}
    </>
  )
}

function ReviewModal({
  defaultName,
  onClose,
  onSign,
}: {
  defaultName: string
  onClose: () => void
  onSign: (s: SignOff) => void
}) {
  const [checked, setChecked] = useState<boolean[]>(SIGNOFF_CHECKLIST.map(() => false))
  const [name, setName] = useState(defaultName)
  const today = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }, [])
  const allChecked = checked.every(Boolean)
  const canSign = allChecked && name.trim().length > 1

  return (
    <div className="print:hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16243f] text-white">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="m-0 text-[15px] font-bold text-slate-900">Review &amp; sign to export</h2>
              <p className="m-0 text-[12px] text-slate-500">Documents export only after clinician sign-off.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-2">
          {SIGNOFF_CHECKLIST.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setChecked((prev) => prev.map((c, j) => (j === i ? !c : c)))}
                className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                  checked[i] ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] font-bold text-white ${
                    checked[i] ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked[i] ? '✓' : ''}
                </span>
                <span className="text-[12.5px] leading-snug text-slate-700">{item}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Signing clinician (name &amp; you attest to the above)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clinician full name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
          />
          <p className="text-[11px] text-slate-400">Electronically confirmed on {today}. Your signature line still prints for a handwritten signature.</p>
        </div>

        <button
          disabled={!canSign}
          onClick={() => onSign({ name: name.trim(), date: today })}
          className={`mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold transition ${
            canSign ? 'bg-[#16243f] text-white hover:bg-[#16243f]/90' : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          {allChecked ? (canSign ? 'Confirm review & sign' : 'Enter the signing clinician’s name') : 'Confirm all items to continue'}
        </button>
      </div>
    </div>
  )
}

/**
 * The electronic sign-off stamp — rendered inside a document's sign-off block
 * once the clinician has signed (via the Review & sign gate). Shows nothing when
 * unsigned. Consumers place it above/below their handwritten signature line.
 */
export function SignOffStamp() {
  const ctx = useContext(FillableContext)
  if (!ctx?.signoff) return null
  return (
    <div className="mt-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[11.5px] text-teal-900 print:border-slate-300 print:bg-transparent">
      Reviewed and electronically confirmed by <strong>{ctx.signoff.name}</strong> on {ctx.signoff.date}.
    </div>
  )
}

/** True when the doc is in a require-signoff context and not yet signed. */
export function useUnsignedGate(): boolean {
  const ctx = useContext(FillableContext)
  return !!ctx?.requireSignoff && !ctx?.signoff
}

export function Fld({ name, placeholder }: { name: string; placeholder: string }) {
  const ctx = useContext(FillableContext)!
  const value = ctx.get(name)
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => ctx.set(name, e.target.value)}
      placeholder={placeholder}
      size={Math.max(placeholder.length, value.length + 2, 8)}
      className="inline-block px-1.5 py-0 mx-0.5 align-baseline font-semibold text-accent border-b border-dotted border-accent bg-accent/[0.06] rounded-sm focus:outline-none focus:bg-accent/10 focus:border-accent placeholder:text-accent/40 placeholder:italic placeholder:font-normal print:bg-transparent print:border-b-slate-400"
    />
  )
}

export function FldArea({ name, placeholder, rows = 3 }: { name: string; placeholder: string; rows?: number }) {
  const ctx = useContext(FillableContext)!
  return (
    <textarea
      value={ctx.get(name)}
      onChange={(e) => ctx.set(name, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="block w-full px-3 py-2 my-1 border border-slate-200 bg-accent/[0.03] rounded-md text-sm text-slate-900 focus:outline-none focus:border-accent focus:bg-accent/[0.06] placeholder:text-accent/40 placeholder:italic resize-y print:bg-transparent print:border-slate-300"
    />
  )
}
