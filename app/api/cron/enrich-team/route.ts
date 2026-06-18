/**
 * GET /api/cron/enrich-team
 *
 * Drains the unverified-team backlog. Each run crawls a batch of clinic
 * websites and writes REAL per-discipline counts + the [team-enriched] tag
 * (or [team-enrich-checked] when a site has no readable team page), so the
 * selection query stops re-examining the same rows. Over repeated runs the
 * whole pool flips from the Apollo placeholder to verified data — at which
 * point the engine quotes specific headcounts/tiers instead of the generic
 * Hub Pack fallback.
 *
 * Batch is intentionally small (web crawling is slow, ~3-5s/site over several
 * pages) so it fits inside the 300s budget. Runs frequently to drain ~2,300
 * rows over a day or two; idempotent — a fully-drained pool just returns
 * examined=0.
 *
 * Auth: CRON_SECRET bearer (Vercel injects it). Same pattern as the send cron.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { runEnrichBatch } from '@/app/api/admin/prospect-enrich-team-from-website/route'

export const maxDuration = 300

export async function GET(request: Request) {
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
    return NextResponse.json({ skipped: true, reason: 'Not primary project' })
  }
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET not configured — refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Live write, unverified rows only (reenrich:false). 40 sites/run keeps the
  // multi-page crawl inside the 300s budget with margin.
  const result = await runEnrichBatch({ dryRun: false, limit: 40, reenrich: false })
  const summary = (result.summary ?? {}) as Record<string, unknown>
  console.log(`[enrich-team cron] ${JSON.stringify(summary)}`)
  return NextResponse.json({ ok: true, ...summary })
}
