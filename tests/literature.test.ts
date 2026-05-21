import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  searchPubMed,
  searchSemanticScholar,
  combinedSearch,
  _clearLiteratureCache,
} from '@/lib/ai-course/literature'

// Helper to build a mock Response
function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response
}

const ESEARCH_FIXTURE = {
  esearchresult: {
    idlist: ['12345', '67890'],
    count: '2',
  },
}

const ESUMMARY_FIXTURE = {
  result: {
    uids: ['12345', '67890'],
    '12345': {
      uid: '12345',
      title: 'Sub-symptom threshold exercise after sport-related concussion.',
      authors: [
        { name: 'Leddy J', authtype: 'Author' },
        { name: 'Willer B', authtype: 'Author' },
      ],
      fulljournalname: 'JAMA Pediatrics',
      source: 'JAMA Pediatr',
      pubdate: '2019 Apr',
      articleids: [
        { idtype: 'pubmed', value: '12345' },
        { idtype: 'doi', value: '10.1001/jamapediatrics.2018.4397' },
      ],
    },
    '67890': {
      uid: '67890',
      title: 'Rest versus active recovery in concussion.',
      authors: [{ name: 'Smith A', authtype: 'Author' }],
      fulljournalname: 'British Journal of Sports Medicine',
      pubdate: '2021',
      articleids: [
        { idtype: 'pubmed', value: '67890' },
        { idtype: 'doi', value: '10.1136/BJSPORTS-2021-000111' },
      ],
    },
  },
}

const S2_FIXTURE = {
  total: 2,
  data: [
    {
      paperId: 'abc123',
      title: 'Active rehabilitation after concussion: a randomised trial.',
      abstract: 'Background: Active rehabilitation may improve outcomes after concussion...',
      year: 2022,
      authors: [{ name: 'Doe J' }, { name: 'Roe K' }],
      venue: 'BMJ',
      journal: { name: 'BMJ' },
      externalIds: { DOI: '10.1136/bmj.2022.000999' },
      url: 'https://www.semanticscholar.org/paper/abc123',
    },
    {
      paperId: 'def456',
      // Duplicate by DOI with PubMed result (different case + leading text)
      title: 'Rest versus active recovery in concussion (S2 copy).',
      abstract: 'We compared rest with active recovery...',
      year: 2021,
      authors: [{ name: 'Smith A' }, { name: 'Jones B' }],
      venue: 'British Journal of Sports Medicine',
      journal: { name: 'British Journal of Sports Medicine' },
      externalIds: { DOI: '10.1136/bjsports-2021-000111', PubMed: '67890' },
      url: 'https://www.semanticscholar.org/paper/def456',
    },
  ],
}

describe('literature search service', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    _clearLiteratureCache()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('searchPubMed', () => {
    it('returns parsed articles from esearch + esummary', async () => {
      fetchSpy
        .mockResolvedValueOnce(jsonResponse(ESEARCH_FIXTURE))
        .mockResolvedValueOnce(jsonResponse(ESUMMARY_FIXTURE))

      const results = await searchPubMed('concussion exercise')

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        source: 'pubmed',
        pmid: '12345',
        title: expect.stringContaining('Sub-symptom threshold'),
        journal: 'JAMA Pediatrics',
        year: 2019,
        doi: '10.1001/jamapediatrics.2018.4397',
      })
      expect(results[0].authors).toContain('Leddy J')
      expect(results[0].url).toBe('https://pubmed.ncbi.nlm.nih.gov/12345/')
    })

    it('rejects empty query without making any fetch', async () => {
      const results = await searchPubMed('   ')
      expect(results).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('returns [] when fetch throws and logs to console.error', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchSpy.mockRejectedValueOnce(new Error('network down'))

      const results = await searchPubMed('concussion')
      expect(results).toEqual([])
      expect(errSpy).toHaveBeenCalled()
      errSpy.mockRestore()
    })

    it('returns [] when esearch responds non-ok', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchSpy.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 503 }))

      const results = await searchPubMed('concussion')
      expect(results).toEqual([])
      errSpy.mockRestore()
    })

    it('caches results on second call within TTL', async () => {
      fetchSpy
        .mockResolvedValueOnce(jsonResponse(ESEARCH_FIXTURE))
        .mockResolvedValueOnce(jsonResponse(ESUMMARY_FIXTURE))

      const first = await searchPubMed('concussion exercise')
      const second = await searchPubMed('concussion exercise')

      expect(first).toEqual(second)
      // Two fetches for the first call; zero for the second (cache hit).
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('searchSemanticScholar', () => {
    it('returns parsed articles from Semantic Scholar response', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(S2_FIXTURE))

      const results = await searchSemanticScholar('concussion exercise')

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        source: 'semantic-scholar',
        title: expect.stringContaining('Active rehabilitation'),
        journal: 'BMJ',
        year: 2022,
        doi: '10.1136/bmj.2022.000999',
      })
      expect(results[0].abstract).toContain('Background:')
      expect(results[0].authors).toEqual(['Doe J', 'Roe K'])
    })

    it('rejects empty query without making any fetch', async () => {
      const results = await searchSemanticScholar('')
      expect(results).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('returns [] when fetch throws', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchSpy.mockRejectedValueOnce(new Error('timeout'))

      const results = await searchSemanticScholar('concussion')
      expect(results).toEqual([])
      errSpy.mockRestore()
    })
  })

  describe('combinedSearch', () => {
    it('runs both sources in parallel and deduplicates by DOI (case-insensitive)', async () => {
      // combinedSearch dispatches PubMed and Semantic Scholar in parallel,
      // so order of fetch() calls is not deterministic. Route by URL.
      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('esearch.fcgi')) return jsonResponse(ESEARCH_FIXTURE)
        if (url.includes('esummary.fcgi')) return jsonResponse(ESUMMARY_FIXTURE)
        if (url.includes('api.semanticscholar.org')) return jsonResponse(S2_FIXTURE)
        throw new Error(`unexpected URL ${url}`)
      })

      const results = await combinedSearch('concussion exercise')

      // PubMed has 2 records, S2 has 2 records, one DOI overlaps (case-different) -> 3 unique
      expect(results).toHaveLength(3)

      // Verify the duplicated DOI was merged — S2 abstract should be present
      const dois = results.map((r) => r.doi?.toLowerCase())
      const dupDoi = '10.1136/bjsports-2021-000111'
      expect(dois.filter((d) => d === dupDoi)).toHaveLength(1)
      const merged = results.find((r) => r.doi?.toLowerCase() === dupDoi)
      expect(merged?.abstract).toContain('rest with active recovery')

      // Sorted by year desc
      const years = results.map((r) => r.year)
      const sorted = [...years].sort((a, b) => (b ?? 0) - (a ?? 0))
      expect(years).toEqual(sorted)
    })

    it('rejects empty query', async () => {
      const results = await combinedSearch('   ')
      expect(results).toEqual([])
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('still returns S2 results when PubMed fails', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('eutils.ncbi.nlm.nih.gov')) {
          throw new Error('pubmed down')
        }
        if (url.includes('api.semanticscholar.org')) return jsonResponse(S2_FIXTURE)
        throw new Error(`unexpected URL ${url}`)
      })

      const results = await combinedSearch('concussion')
      expect(results.length).toBeGreaterThan(0)
      expect(results.every((r) => r.source === 'semantic-scholar')).toBe(true)
      errSpy.mockRestore()
    })
  })
})
