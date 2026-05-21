'use client'

import { useState, useCallback } from 'react'
import type { Article } from '@/lib/ai-course/literature'

type SourceFilter = 'both' | 'pubmed' | 'semantic-scholar'

interface SearchResponse {
  articles: Article[]
  totalFound: number
  sources: string[]
  cached: boolean
}

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return '(no authors listed)'
  if (authors.length <= 3) return authors.join(', ')
  return `${authors.slice(0, 3).join(', ')}, et al.`
}

/**
 * Build a Vancouver-style citation.
 *
 * Vancouver pattern: Author AA, Author BB, Author CC, et al. Title. Journal.
 * Year;Volume(Issue):Pages. doi:... PMID:...
 *
 * Since esummary/Semantic Scholar don't reliably give us volume/issue/pages,
 * we degrade gracefully — the minimum is authors, title, journal, year, and a
 * DOI or PMID identifier so the citation is defensible and traceable.
 */
function buildVancouverCitation(article: Article): string {
  const authorsList =
    article.authors.length === 0
      ? '(no authors listed)'
      : article.authors.length <= 6
        ? article.authors.join(', ')
        : `${article.authors.slice(0, 6).join(', ')}, et al.`

  const title = article.title.replace(/\.$/, '')
  const journal = article.journal || '(journal not listed)'
  const year = article.year != null ? `${article.year}` : 'n.d.'

  let citation = `${authorsList}. ${title}. ${journal}. ${year}.`
  if (article.doi) citation += ` doi:${article.doi}.`
  if (article.pmid) citation += ` PMID:${article.pmid}.`
  return citation
}

function abstractExcerpt(abs: string): string {
  if (!abs) return ''
  if (abs.length <= 300) return abs
  return abs.slice(0, 297).trimEnd() + '...'
}

function sourceBadgeClasses(source: Article['source']): string {
  return source === 'pubmed'
    ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : 'bg-violet-50 text-violet-700 border border-violet-200'
}

function sourceLabel(source: Article['source']): string {
  return source === 'pubmed' ? 'PubMed' : 'Semantic Scholar'
}

export function LiteratureSearchClient() {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('both')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const runSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      const trimmed = query.trim()
      if (!trimmed) {
        setError('Enter a clinical question to search.')
        return
      }
      if (trimmed.length > 200) {
        setError('Query is too long (max 200 characters).')
        return
      }
      setLoading(true)
      setError(null)
      setSubmitted(true)
      try {
        const res = await fetch(
          `/api/ai-course/literature?q=${encodeURIComponent(trimmed)}&source=${source}`
        )
        if (!res.ok) {
          if (res.status === 429) {
            setError('Hourly search limit reached. Try again in an hour.')
          } else if (res.status === 401) {
            setError('Session expired. Sign in to continue.')
          } else {
            setError(`Search failed (status ${res.status}).`)
          }
          setResults(null)
          return
        }
        const data: SearchResponse = await res.json()
        setResults(data)
      } catch (err) {
        console.error(err)
        setError('Network error. Check your connection and try again.')
        setResults(null)
      } finally {
        setLoading(false)
      }
    },
    [query, source]
  )

  const copyCitation = useCallback(async (article: Article) => {
    const citation = buildVancouverCitation(article)
    try {
      await navigator.clipboard.writeText(citation)
      setCopiedId(article.id)
      setTimeout(() => setCopiedId((id) => (id === article.id ? null : id)), 1800)
    } catch {
      setError('Could not copy to clipboard. Select the citation manually.')
    }
  }, [])

  return (
    <div>
      <form onSubmit={runSearch} className="mb-6">
        <label htmlFor="lit-query" className="block text-xs font-semibold text-foreground mb-2">
          Clinical question
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="lit-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. sub-symptom threshold exercise concussion recovery"
            maxLength={200}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-accent text-white text-sm font-semibold px-4 py-2 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['both', 'pubmed', 'semantic-scholar'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                source === s
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-foreground border-slate-300 hover:border-slate-400'
              }`}
            >
              {s === 'both' ? 'Both sources' : s === 'pubmed' ? 'PubMed' : 'Semantic Scholar'}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Querying {source === 'both' ? 'PubMed and Semantic Scholar' : sourceLabel(source as Article['source'])}...
        </div>
      )}

      {!loading && submitted && results && results.articles.length === 0 && !error && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-muted-foreground">
          No results. Try broader terms or check spelling.
        </div>
      )}

      {!loading && results && results.articles.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {results.totalFound} result{results.totalFound === 1 ? '' : 's'} from {results.sources.join(' + ')}
              {results.cached && ' (cached)'}
            </p>
          </div>
          <ul className="space-y-4">
            {results.articles.map((article) => (
              <li key={article.id} className="card rounded-xl p-5">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <h3 className="text-base font-bold text-foreground flex-1 min-w-0">
                    {article.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sourceBadgeClasses(article.source)}`}>
                    {sourceLabel(article.source)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {formatAuthors(article.authors)}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {article.journal || '(journal not listed)'}
                  {article.year != null && ` - ${article.year}`}
                </p>
                {article.abstract && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    {abstractExcerpt(article.abstract)}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-xs">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-semibold"
                  >
                    Open in {sourceLabel(article.source)}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyCitation(article)}
                    className="text-accent hover:underline font-semibold"
                  >
                    {copiedId === article.id ? 'Copied' : 'Copy citation'}
                  </button>
                  {article.doi && (
                    <span className="text-muted-foreground">DOI: {article.doi}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
