'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, BookOpen, Library, X } from 'lucide-react'

interface SearchHit {
  course: string
  courseLabel: string
  moduleId: number
  moduleTitle: string
  sectionTitle: string | null
  kind: 'section' | 'reference'
  snippet: string
  href: string
}

/**
 * Cross-course search over everything the signed-in user owns.
 *
 * Results are entitlement-scoped SERVER-side (/api/course-search builds the
 * corpus from what the user actually bought), so this component never has to
 * filter and can't leak paid prose.
 */
export function CourseSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      try {
        const res = await fetch(`/api/course-search?q=${encodeURIComponent(q)}`, {
          credentials: 'include',
          signal: ac.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
          setSearched(true)
        }
      } catch {
        /* aborted or offline — leave the previous results visible */
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your courses — e.g. BESS scoring, HRt, return to play"
          aria-label="Search course content and references"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />}
        {!loading && q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="mt-4 text-sm text-slate-500">
          Nothing found for <strong>{q}</strong> in the courses you have access to.
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={`${r.href}-${i}`}>
                <Link
                  href={r.href}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-accent/40 hover:bg-accent/[0.02]"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {r.kind === 'reference' ? (
                      <Library className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
                    )}
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {r.courseLabel} · Module {r.moduleId}
                    </span>
                  </div>
                  <p className="m-0 text-sm font-bold text-slate-800">
                    {r.sectionTitle || r.moduleTitle}
                  </p>
                  <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-600">{r.snippet}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
