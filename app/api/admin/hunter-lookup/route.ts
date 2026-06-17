/**
 * GET /api/admin/hunter-lookup?domain=<domain>[&role=<regex>]
 *
 * Generic Hunter domain-search helper — returns the named people Hunter has for
 * a domain (name, position, email, confidence), so we can find the right human
 * to pitch instead of guessing an inbox. Optional `role` filter (case-insensitive
 * substring) surfaces e.g. partnerships/marketing/growth contacts first.
 *
 * Runs in PROD where Vercel injects HUNTER_API_KEY. Read-only. Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.HUNTER_API_KEY
  if (!key) return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 })

  const url = new URL(req.url)
  const domain = url.searchParams.get('domain')
  const role = url.searchParams.get('role')
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}&limit=100`, {
    signal: AbortSignal.timeout(15000),
  })
  const json = await res.json()
  type HE = { value?: string; first_name?: string; last_name?: string; position?: string; confidence?: number; type?: string }
  let people = (json?.data?.emails ?? []).map((e: HE) => ({
    name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
    position: e.position ?? '',
    email: e.value ?? '',
    confidence: e.confidence ?? 0,
    type: e.type ?? '',
  }))
  if (role) {
    const re = new RegExp(role, 'i')
    const matched = people.filter((p: { position: string }) => re.test(p.position))
    people = [...matched, ...people.filter((p: { position: string }) => !re.test(p.position))]
  }
  return NextResponse.json({
    domain,
    organization: json?.data?.organization ?? null,
    pattern: json?.data?.pattern ?? null,
    total: people.length,
    people: people.slice(0, 40),
  })
}
