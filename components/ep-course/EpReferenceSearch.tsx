'use client'

import { useMemo, useState } from 'react'
import { Search, X, ExternalLink, Library } from 'lucide-react'
import type { EpReference } from '@/lib/ep-references'

/**
 * Searchable CRM Reference Repository — the EP course's equivalent of the
 * flagship ReferenceRepository.
 *
 * The dataset arrives as a prop from the SERVER component that already passed
 * the CRM gate (app/ep-course/references), so the citations only ever ship in
 * the RSC payload of an entitled request — the same rule lib/toolkit-access.ts
 * documents. This component never fetches and never holds the corpus itself.
 *
 * Every row renders the citation EXACTLY as authored in the module; the parsed
 * author/year/title fields only drive search and sort.
 */
export function EpReferenceSearch({
  references,
  moduleTitles,
}: {
  references: EpReference[]
  /** DISPLAY module id → title, for the filter labels. */
  moduleTitles: { id: number; title: string }[]
}) {
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState<number | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return references.filter((r) => {
      if (moduleFilter !== 'all' && !r.modules.includes(moduleFilter)) return false
      if (!q) return true
      // Match the raw citation too, so a search still works for any row whose
      // APA parse came back empty.
      return r.citation.toLowerCase().includes(q)
    })
  }, [references, query, moduleFilter])

  const countFor = (id: number) => references.filter((r) => r.modules.includes(id)).length

  return (
    <div>
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search authors, title, journal or year — e.g. Leddy, Buffalo, 2019"
          aria-label="Search the reference repository"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={moduleFilter === 'all'} onClick={() => setModuleFilter('all')}>
          All modules <span className="opacity-60">({references.length})</span>
        </FilterChip>
        {/* Per-module counts are of DISTINCT papers cited by that module. */}
        {moduleTitles.map((m) => (
          <FilterChip key={m.id} active={moduleFilter === m.id} onClick={() => setModuleFilter(m.id)} title={m.title}>
            Module {m.id} <span className="opacity-60">({countFor(m.id)})</span>
          </FilterChip>
        ))}
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {filtered.length} {filtered.length === 1 ? 'reference' : 'references'}
        {moduleFilter !== 'all' && ` in Module ${moduleFilter}`}
        {query && ` matching “${query}”`}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Nothing matches that search. Try an author surname, a journal, or a year.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-relaxed text-slate-700">
                {r.url ? (
                  <>
                    {r.citation.replace(r.url, '').replace(/\s+$/, '')}{' '}
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-teal-700 underline hover:text-teal-900"
                    >
                      {r.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </>
                ) : (
                  r.citation
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Library className="h-3 w-3 text-slate-300" />
                {r.modules.map((id) => (
                  <span
                    key={id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                  >
                    Module {id}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-teal-600 bg-teal-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
      }`}
    >
      {children}
    </button>
  )
}
