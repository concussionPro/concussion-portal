'use client'

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import { Printer, RotateCcw } from 'lucide-react'

interface FillableContextValue {
  get: (name: string) => string
  set: (name: string, value: string) => void
  clearAll: () => void
}

const FillableContext = createContext<FillableContextValue | null>(null)

export function FillableDoc({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`hubfill:${storageKey}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setValues(parsed)
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [storageKey])

  // Persist to localStorage whenever values change (post-hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(`hubfill:${storageKey}`, JSON.stringify(values))
    } catch {
      // quota errors etc — silent
    }
  }, [values, storageKey, hydrated])

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
      {children}
      <Toolbar />
    </FillableContext.Provider>
  )
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
