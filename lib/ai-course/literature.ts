/**
 * Literature search service for the AI Practice Hub.
 *
 * Queries free public APIs only — PubMed E-utilities and Semantic Scholar
 * Graph API. No API keys committed. Tier B/C tool: do NOT submit PII or
 * identifying patient detail in queries.
 *
 * Exports:
 *   - searchPubMed
 *   - searchSemanticScholar
 *   - combinedSearch (deduplicates by DOI, sorts by year desc)
 *
 * All fetches are guarded with an 8s timeout, a descriptive User-Agent,
 * and try/catch that returns [] on failure — never throws to the caller.
 *
 * Results are cached in-memory per query string for 1 hour. The cache is
 * keyed by the combined query+source signature.
 */

export type ArticleSource = 'pubmed' | 'semantic-scholar'

export interface Article {
  id: string
  source: ArticleSource
  title: string
  authors: string[]
  journal: string
  year: number | null
  abstract: string
  doi: string | null
  url: string
  pmid?: string
}

export interface SearchOptions {
  maxResults?: number
}

const USER_AGENT =
  'ConcussionEducationAU-LiteratureSearch/1.0 (research@concussion-education-australia.com)'

const FETCH_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  ts: number
  articles: Article[]
}

const cache: Map<string, CacheEntry> = new Map()

function cacheKey(source: string, query: string, max: number): string {
  return `${source}::${query.trim().toLowerCase()}::${max}`
}

function readCache(key: string): Article[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.articles
}

function writeCache(key: string, articles: Article[]): void {
  cache.set(key, { ts: Date.now(), articles })
}

/** For tests / admin: clear in-memory cache. */
export function _clearLiteratureCache(): void {
  cache.clear()
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error(`[literature] fetch non-ok ${res.status} for ${url}`)
      return null
    }
    return res
  } catch (err) {
    console.error(`[literature] fetch failed for ${url}:`, err)
    return null
  }
}

// ---------------------------------------------------------------------------
// PubMed
// ---------------------------------------------------------------------------

interface ESearchResponse {
  esearchresult?: {
    idlist?: string[]
    count?: string
  }
}

interface ESummaryAuthor {
  name?: string
  authtype?: string
}

interface ESummaryArticleId {
  idtype?: string
  value?: string
}

interface ESummaryDoc {
  uid?: string
  title?: string
  authors?: ESummaryAuthor[]
  fulljournalname?: string
  source?: string
  pubdate?: string
  articleids?: ESummaryArticleId[]
  elocationid?: string
}

interface ESummaryResponse {
  result?: Record<string, ESummaryDoc | string[] | undefined> & {
    uids?: string[]
  }
}

function parseYear(pubdate: string | undefined): number | null {
  if (!pubdate) return null
  const m = pubdate.match(/(19|20)\d{2}/)
  return m ? parseInt(m[0], 10) : null
}

function extractDoiFromArticleIds(ids: ESummaryArticleId[] | undefined, elocationid?: string): string | null {
  if (Array.isArray(ids)) {
    for (const id of ids) {
      if (id?.idtype?.toLowerCase() === 'doi' && id.value) return id.value
    }
  }
  if (elocationid) {
    const m = elocationid.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)
    if (m) return m[0]
  }
  return null
}

export async function searchPubMed(
  query: string,
  opts: SearchOptions = {}
): Promise<Article[]> {
  const q = query.trim()
  if (!q) return []
  const maxResults = Math.min(Math.max(opts.maxResults ?? 10, 1), 25)
  const key = cacheKey('pubmed', q, maxResults)
  const hit = readCache(key)
  if (hit) return hit

  const esearchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
    `?db=pubmed&retmode=json&retmax=${maxResults}` +
    `&term=${encodeURIComponent(q)}`

  const esearchRes = await safeFetch(esearchUrl)
  if (!esearchRes) return []
  let esearchData: ESearchResponse
  try {
    esearchData = (await esearchRes.json()) as ESearchResponse
  } catch (err) {
    console.error('[literature] PubMed esearch JSON parse failed:', err)
    return []
  }

  const pmids = esearchData.esearchresult?.idlist ?? []
  if (pmids.length === 0) {
    writeCache(key, [])
    return []
  }

  const esummaryUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
    `?db=pubmed&retmode=json&id=${pmids.join(',')}`

  const esummaryRes = await safeFetch(esummaryUrl)
  if (!esummaryRes) return []
  let esummaryData: ESummaryResponse
  try {
    esummaryData = (await esummaryRes.json()) as ESummaryResponse
  } catch (err) {
    console.error('[literature] PubMed esummary JSON parse failed:', err)
    return []
  }

  const result = esummaryData.result
  if (!result) {
    writeCache(key, [])
    return []
  }

  const articles: Article[] = []
  for (const pmid of pmids) {
    const doc = result[pmid] as ESummaryDoc | undefined
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) continue
    const authors = Array.isArray(doc.authors)
      ? doc.authors.map((a) => a.name || '').filter(Boolean)
      : []
    const doi = extractDoiFromArticleIds(doc.articleids, doc.elocationid)
    articles.push({
      id: `pubmed:${pmid}`,
      source: 'pubmed',
      title: doc.title ?? '(no title)',
      authors,
      journal: doc.fulljournalname || doc.source || '',
      year: parseYear(doc.pubdate),
      abstract: '', // esummary does not return abstracts; UI will indicate
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      pmid,
    })
  }

  writeCache(key, articles)
  return articles
}

// ---------------------------------------------------------------------------
// Semantic Scholar
// ---------------------------------------------------------------------------

interface S2Paper {
  paperId?: string
  title?: string
  abstract?: string | null
  year?: number | null
  authors?: Array<{ name?: string }>
  venue?: string
  journal?: { name?: string }
  externalIds?: { DOI?: string; PubMed?: string } | null
  url?: string
}

interface S2Response {
  total?: number
  data?: S2Paper[]
}

export async function searchSemanticScholar(
  query: string,
  opts: SearchOptions = {}
): Promise<Article[]> {
  const q = query.trim()
  if (!q) return []
  const maxResults = Math.min(Math.max(opts.maxResults ?? 10, 1), 25)
  const key = cacheKey('s2', q, maxResults)
  const hit = readCache(key)
  if (hit) return hit

  const fields =
    'title,abstract,year,authors,venue,journal,externalIds,url'
  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search` +
    `?query=${encodeURIComponent(q)}` +
    `&limit=${maxResults}` +
    `&fields=${encodeURIComponent(fields)}`

  const res = await safeFetch(url)
  if (!res) return []
  let data: S2Response
  try {
    data = (await res.json()) as S2Response
  } catch (err) {
    console.error('[literature] Semantic Scholar JSON parse failed:', err)
    return []
  }

  const articles: Article[] = []
  for (const paper of data.data ?? []) {
    if (!paper.paperId) continue
    const authors = Array.isArray(paper.authors)
      ? paper.authors.map((a) => a.name || '').filter(Boolean)
      : []
    const doi = paper.externalIds?.DOI ?? null
    const pmid = paper.externalIds?.PubMed ?? undefined
    articles.push({
      id: `s2:${paper.paperId}`,
      source: 'semantic-scholar',
      title: paper.title ?? '(no title)',
      authors,
      journal: paper.journal?.name || paper.venue || '',
      year: typeof paper.year === 'number' ? paper.year : null,
      abstract: paper.abstract ?? '',
      doi,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pmid,
    })
  }

  writeCache(key, articles)
  return articles
}

// ---------------------------------------------------------------------------
// Combined search
// ---------------------------------------------------------------------------

/**
 * Run PubMed + Semantic Scholar in parallel, merge results, deduplicate by
 * DOI (case-insensitive). When duplicates are found, prefer the entry with
 * a non-empty abstract (Semantic Scholar usually has one; PubMed esummary
 * does not). Final list is sorted by year desc, then title asc.
 */
export async function combinedSearch(query: string): Promise<Article[]> {
  const q = query.trim()
  if (!q) return []

  const [pm, s2] = await Promise.all([
    searchPubMed(q),
    searchSemanticScholar(q),
  ])

  const byDoi: Map<string, Article> = new Map()
  const noDoi: Article[] = []

  function ingest(a: Article) {
    if (a.doi) {
      const key = a.doi.toLowerCase()
      const existing = byDoi.get(key)
      if (!existing) {
        byDoi.set(key, a)
        return
      }
      // Merge — keep the one with more useful data (abstract preferred)
      const merged: Article = {
        ...existing,
        abstract: existing.abstract || a.abstract,
        authors: existing.authors.length >= a.authors.length ? existing.authors : a.authors,
        journal: existing.journal || a.journal,
        year: existing.year ?? a.year,
        pmid: existing.pmid || a.pmid,
      }
      byDoi.set(key, merged)
      return
    }
    noDoi.push(a)
  }

  for (const a of pm) ingest(a)
  for (const a of s2) ingest(a)

  const merged: Article[] = [...byDoi.values(), ...noDoi]
  merged.sort((a, b) => {
    const ay = a.year ?? -Infinity
    const by = b.year ?? -Infinity
    if (by !== ay) return by - ay
    return a.title.localeCompare(b.title)
  })
  return merged
}
