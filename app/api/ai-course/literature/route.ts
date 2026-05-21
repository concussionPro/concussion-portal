import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAiCourseAccess } from '@/lib/ai-course/access'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import {
  searchPubMed,
  searchSemanticScholar,
  combinedSearch,
  type Article,
} from '@/lib/ai-course/literature'

/**
 * GET /api/ai-course/literature?q=<query>&source=<pubmed|semantic-scholar|both>
 *
 * Gated by checkAiCourseAccess (admin-only until launch). Rate limited
 * to 30 requests / hour / IP via the shared Vercel-KV-backed limiter
 * (fails open if KV is unreachable — see lib/rate-limit.ts).
 *
 * Returns: { articles, totalFound, sources, cached }
 *
 * The `cached` flag is best-effort — set true when the underlying
 * service returns sub-100ms (cache hit signal). We don't reach back into
 * the cache directly to keep the route handler thin.
 */

const querySchema = z.object({
  q: z.string().min(1, 'query required').max(200, 'query must be 200 chars or fewer'),
  source: z.enum(['pubmed', 'semantic-scholar', 'both']).optional().default('both'),
})

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function GET(request: NextRequest) {
  const access = await checkAiCourseAccess(request)
  if (!access.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q') ?? '',
    source: url.searchParams.get('source') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { q, source } = parsed.data

  // Rate limit: 30 / hour / IP
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `literature:${ip}`, limit: 30, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — try again in an hour.' },
      { status: 429, headers: rateLimitHeaders(rl, 30) }
    )
  }

  const startedAt = Date.now()
  let articles: Article[] = []
  let sources: string[] = []
  try {
    if (source === 'pubmed') {
      articles = await searchPubMed(q)
      sources = ['pubmed']
    } else if (source === 'semantic-scholar') {
      articles = await searchSemanticScholar(q)
      sources = ['semantic-scholar']
    } else {
      articles = await combinedSearch(q)
      sources = ['pubmed', 'semantic-scholar']
    }
  } catch (err) {
    console.error('[api/ai-course/literature] unexpected error:', err)
    return NextResponse.json(
      { error: 'Search service unavailable. Try again shortly.' },
      { status: 502, headers: rateLimitHeaders(rl, 30) }
    )
  }

  const elapsedMs = Date.now() - startedAt
  const cached = elapsedMs < 100

  return NextResponse.json(
    {
      articles,
      totalFound: articles.length,
      sources,
      cached,
    },
    { headers: rateLimitHeaders(rl, 30) }
  )
}
