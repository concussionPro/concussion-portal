/**
 * Rate limiter — fixed-window counter backed by Vercel KV.
 *
 * Shared across serverless instances (unlike an in-memory Map).
 * Fails open: if KV is unreachable we allow the request rather than
 * 500 — availability of checkout/signup flows trumps strict limiting.
 *
 * Usage in a route handler:
 *
 *   const rl = await rateLimit({ key: `signup:${ip}`, limit: 5, windowSec: 60 })
 *   if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { kv } from '@vercel/kv'

export interface RateLimitOptions {
  key: string
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetIn: number
}

export async function rateLimit({ key, limit, windowSec }: RateLimitOptions): Promise<RateLimitResult> {
  try {
    const bucketKey = `rl:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`
    const count = await kv.incr(bucketKey)
    if (count === 1) {
      await kv.expire(bucketKey, windowSec)
    }
    const remaining = Math.max(0, limit - count)
    const resetIn = windowSec - Math.floor((Date.now() / 1000) % windowSec)
    return { ok: count <= limit, remaining, resetIn }
  } catch (err) {
    console.warn('[rate-limit] KV unreachable — allowing request:', err)
    return { ok: true, remaining: limit, resetIn: windowSec }
  }
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetIn),
  }
}
