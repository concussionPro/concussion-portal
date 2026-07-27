import { NextRequest, NextResponse } from 'next/server'
import { verifyViewKey } from '@/lib/sst-trainer/clinic-registry'
import {
  getPmsConnection,
  setPmsConnection,
  removePmsConnection,
  markPmsOk,
  resolveTenantAdapter,
  isPmsKind,
} from '@/lib/sst-trainer/pms/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * PMS connection management — per clinic, authorised by code + viewKey (the
 * same credential pair the clinical hub and clinic card already hold, so the
 * plugin works wherever the clinic surfaces do — no separate login).
 *
 * GET    ?code&k          → { connected, kind?, lastOkAt? }
 * POST   {code,k,kind,apiKey,creds?} → connects; VALIDATES with a live
 *        read-only patient search before storing marks lastOk on success.
 * DELETE {code,k}         → disconnect.
 */

async function authed(req: NextRequest, code: string, k: string | null): Promise<boolean> {
  if (!code || !k) return false
  try {
    return await verifyViewKey(code, k)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const code = (p.get('code') || '').trim().toUpperCase()
  const k = p.get('k')
  if (!(await authed(request, code, k))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const conn = await getPmsConnection(code)
  return NextResponse.json({
    connected: !!conn,
    kind: conn?.kind ?? null,
    lastOkAt: conn?.lastOkAt ?? null,
  })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `pms-connect:${ip}`, limit: 10, windowSec: 300 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts — wait a few minutes.' }, { status: 429 })

  let body: { code?: string; k?: string; kind?: string; apiKey?: string; creds?: Record<string, string> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const code = (body.code || '').trim().toUpperCase()
  if (!(await authed(request, code, body.k ?? null))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isPmsKind(body.kind)) return NextResponse.json({ error: 'Unknown PMS' }, { status: 400 })
  const apiKey = (body.apiKey || '').trim()
  if (!apiKey || apiKey.length < 8) return NextResponse.json({ error: 'API key required' }, { status: 400 })

  // Store, then prove the connection with a harmless read-only search. A key
  // that can't search is a key that can't file reports — reject it now, not at
  // report time.
  await setPmsConnection({ clinicCode: code, kind: body.kind, apiKey, creds: body.creds })
  const resolved = await resolveTenantAdapter(code)
  if (!resolved) {
    await removePmsConnection(code)
    return NextResponse.json({ error: 'Connection could not be created' }, { status: 500 })
  }
  try {
    await resolved.adapter.findPatient('a')
    await markPmsOk(code)
    return NextResponse.json({ ok: true, kind: resolved.kind })
  } catch (err) {
    await removePmsConnection(code)
    const msg = err instanceof Error ? err.message : 'connection test failed'
    return NextResponse.json({ error: `The ${body.kind} API rejected the key: ${msg.slice(0, 140)}` }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const code = (p.get('code') || '').trim().toUpperCase()
  const k = p.get('k')
  if (!(await authed(request, code, k))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await removePmsConnection(code)
  return NextResponse.json({ ok: true })
}
