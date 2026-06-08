'use client'

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import { Printer, RotateCcw } from 'lucide-react'

interface FillableContextValue {
  get: (name: string) => string
  set: (name: string, value: string) => void
  clearAll: () => void
}

const FillableContext = createContext<FillableContextValue | null>(null)

export function FillableDoc({
  storageKey,
  defaultValues,
  previewMode = false,
  children,
}: {
  storageKey: string
  /** Pre-populated values used on first load (before user edits).
   *  Used by prospect portals to brand the templates with the prospect's
   *  clinic name etc., so the preview reads as if already branded for them. */
  defaultValues?: Record<string, string>
  /** When true: no Save-as-PDF / Clear toolbar, and a global @media print
   *  rule suppresses the content. Prospect prospect previews must enable
   *  this so the prospect can't print-to-PDF the locked content. */
  previewMode?: boolean
  children: React.ReactNode
}) {
  const [values, setValues] = useState<Record<string, string>>(defaultValues ?? {})
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount. setState inside the effect is the
  // canonical pattern for client-only init — no SSR mismatch because
  // FillableField inputs render empty until hydration completes.
  //
  // IMPORTANT — previewMode: NEVER read or write localStorage on prospect
  // demo surfaces. Otherwise the first prospect's clinic name (e.g.
  // "Advanced Health Pain & Injury Clinic" when Zac toured Lauren's
  // portal) caches under the global `hubfill:outreach-kit` key and bleeds
  // into every other prospect's portal Zac visits next. Defaults from
  // page props (clinic.name) are the only valid source of truth in
  // previewMode.
  useEffect(() => {
    if (previewMode) {
      // Defaults already in state from useState init — just mark hydrated.
      setHydrated(true)
      return
    }
    try {
      const raw = localStorage.getItem(`hubfill:${storageKey}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          // localStorage takes precedence over defaults (user edits persist),
          // but defaults fill gaps for keys the user hasn't touched.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setValues({ ...(defaultValues ?? {}), ...parsed })
        }
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [storageKey, defaultValues, previewMode])

  // Re-sync values when defaultValues change (e.g. navigation between
  // prospect portals in the same SPA session). Only applies in preview
  // mode — buyer mode uses localStorage as the source of truth.
  useEffect(() => {
    if (!previewMode || !hydrated) return
    setValues(defaultValues ?? {})
  }, [defaultValues, previewMode, hydrated])

  // Persist to localStorage whenever values change (post-hydration).
  // Disabled in preview mode — no cross-prospect cache pollution.
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
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])
  const clearAll = useCallback(() => {
    if (confirm('Clear all entered fields in this document?')) {
      setValues({})
      try { localStorage.removeItem(`hubfill:${storageKey}`) } catch {}
    }
  }, [storageKey])

  const ctx = useMemo<FillableContextValue>(() => ({ get, set, clearAll }), [get, set, clearAll])

  return (
    <FillableContext.Provider value={ctx}>
      {previewMode && <PreviewPrintBlock />}
      <div data-preview-mode={previewMode ? 'true' : 'false'}>{children}</div>
      {!previewMode && <Toolbar />}
    </FillableContext.Provider>
  )
}

/**
 * Suppresses the prospect preview content when printed. Replaces the page
 * with a single line directing the prospect to the live portal — no part
 * of the locked content goes to PDF/printer.
 */
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

function Toolbar() {
  const ctx = useContext(FillableContext)!
  return (
    <div className="print:hidden fixed bottom-6 right-6 z-50 flex gap-2">
      <button
        onClick={ctx.clearAll}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-md hover:bg-slate-50 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Clear fields
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-bold shadow-md hover:bg-accent/90 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        Save as PDF
      </button>
    </div>
  )
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
