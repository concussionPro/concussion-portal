'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { NotebookPen, Check, Loader2, Trash2 } from 'lucide-react'

interface Note {
  id: number
  moduleId: number
  sectionId: string | null
  kind: 'note' | 'reflection'
  body: string
  updatedAt: string
}

/**
 * Per-module notes + the CPD reflection.
 *
 * Two jobs in one panel because they're the same gesture for the learner:
 *  - NOTES: "come back to this" / "how this applies to my caseload".
 *  - REFLECTION: the one-per-module note the learner's CPD framework wants
 *    recorded against an activity — AHPRA for the registered professions,
 *    ESSA for AEPs (see the `regulator` prop). It flows into the CPD record
 *    export, so the certificate ships audit-ready instead of telling the
 *    clinician to write one themselves.
 *
 * Autosaves on a debounce and on blur; everything is scoped server-side to the
 * session user.
 */
export function ModuleNotes({
  moduleId,
  moduleTitle,
  regulator = 'AHPRA',
  isDemo = false,
}: {
  moduleId: number
  moduleTitle?: string
  /** Whose CPD framework this learner records against — AHPRA for the
   *  registered professions, ESSA for Accredited Exercise Physiologists (who
   *  are not AHPRA-registered at all). */
  regulator?: 'AHPRA' | 'ESSA'
  /** Demo / ESSA-review sessions never persist — never flash a green Saved. */
  isDemo?: boolean
}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [reflection, setReflection] = useState('')
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'demo'>('idle')
  const [loaded, setLoaded] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reflectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/course-notes?moduleId=${moduleId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.success) return
        const all: Note[] = d.notes ?? []
        setNotes(all.filter((n) => n.kind === 'note'))
        setReflection(all.find((n) => n.kind === 'reflection')?.body ?? '')
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    return () => {
      alive = false
    }
  }, [moduleId])

  const flash = useCallback(() => {
    setState('saved')
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setState('idle'), 1800)
  }, [])

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setState('saving')
      try {
        const res = await fetch('/api/course-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ moduleId, ...payload }),
        })
        const data = await res.json().catch(() => null)
        // API echoes { demo: true } for synthetic viewers and does not persist.
        if (isDemo || data?.demo) {
          setState('demo')
          if (savedTimer.current) clearTimeout(savedTimer.current)
          savedTimer.current = setTimeout(() => setState('idle'), 2200)
        } else {
          flash()
        }
        return data?.note as Note | null
      } catch {
        setState('idle')
        return null
      }
    },
    [moduleId, flash, isDemo],
  )

  const addNote = async () => {
    const body = draft.trim()
    if (!body) return
    const note = await post({ kind: 'note', body })
    if (note) setNotes((prev) => [note, ...prev])
    setDraft('')
  }

  const removeNote = async (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await fetch(`/api/course-notes?id=${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
  }

  // Reflection autosaves — it's a single field the learner edits in place.
  const onReflectionChange = (v: string) => {
    setReflection(v)
    if (reflectionTimer.current) clearTimeout(reflectionTimer.current)
    reflectionTimer.current = setTimeout(() => void post({ kind: 'reflection', body: v }), 900)
  }

  if (!loaded) return null

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby={`notes-${moduleId}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-accent" strokeWidth={2} />
          <h3 id={`notes-${moduleId}`} className="m-0 text-sm font-bold text-slate-800">
            Your notes{moduleTitle ? ` — ${moduleTitle}` : ''}
          </h3>
        </div>
        {state === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {state === 'saved' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {(state === 'demo' || isDemo) && state !== 'saving' && (
          <span className="text-[11px] font-semibold text-amber-700">
            Demo — not saved
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void addNote()
          }}
          rows={2}
          placeholder="Note to self — how this applies to your caseload…"
          className="flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={!draft.trim()}
          className="self-start rounded-lg bg-accent px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="group flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <p className="m-0 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{n.body}</p>
              <button
                type="button"
                onClick={() => removeNote(n.id)}
                aria-label="Delete note"
                className="shrink-0 rounded p-1 text-slate-300 transition-colors hover:text-red-500 group-hover:text-slate-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <label htmlFor={`reflection-${moduleId}`} className="mb-1 block text-[13px] font-bold text-slate-800">
          CPD reflection
        </label>
        <p className="mb-2 text-[11.5px] leading-snug text-slate-500">
          {isDemo ? (
            <>Demo session — reflections stay on this visit only and are not written to a CPD record.</>
          ) : (
            <>
              {regulator}
              {' '}asks for a reflection against each CPD activity. Write it here and it&apos;s included
              in your CPD record export — you won&apos;t have to reconstruct it at audit time.
            </>
          )}
        </p>
        <textarea
          id={`reflection-${moduleId}`}
          value={reflection}
          onChange={(e) => onReflectionChange(e.target.value)}
          onBlur={() => void post({ kind: 'reflection', body: reflection })}
          rows={3}
          placeholder="What will you do differently after this module?"
          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </section>
  )
}
