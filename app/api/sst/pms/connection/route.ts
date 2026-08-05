import { NextRequest, NextResponse } from 'next/server'
import { verifyViewKey } from '@/lib/sst-trainer/clinic-registry'
import {
  getPmsConnection,
  getPmsConnectionSnapshot,
  restorePmsConnection,
  setPmsConnection,
  removePmsConnection,
  markPmsOk,
  markPmsFailed,
  describePmsFailure,
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
 * GET    ?code&k          → { connected, kind?, lastOkAt?, health, needsAttention, message? }
 *        health: 'ok' (proved recently) | 'unknown' (probe rate-limited) |
 *        'error' (the PMS refused us, or the credential can't be decrypted).
 *        A stale connection is PROBED here so a dead one can't show green.
 * POST   {code,k,kind,apiKey,creds?} → connects; PROVES the key with the
 *        adapter's probe() (cheapest authenticated read) before keeping it —
 *        a failed probe restores the previous connection untouched.
 * DELETE {code,k}         → disconnect.
 */

async function authed(req: NextRequest, code: string, k: string | null): Promise<boolean> {
  if (!code || !k) return false
  // DEMO00 passes verifyViewKey keylessly BY DESIGN for read surfaces — but
  // the PMS credential store must never be writable/readable through the
  // shared public demo code (2026-08-05 round-F #1). The demo card fakes
  // its connected state client-side and never calls these routes.
  if (code.trim().toUpperCase() === 'DEMO00') return false
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
  if (!conn) return NextResponse.json({ connected: false, kind: null, lastOkAt: null, health: null })

  // A stored row is NOT proof the connection still works. When nothing has
  // successfully used it inside PMS_FRESH_MS we spend one cheap authenticated
  // read to find out, and record the answer — so a revoked key or a rotated
  // SESSION_SECRET surfaces as "needs attention" on the clinic card instead of
  // a green chip that only fails when a clinician tries to file a report.
  let health = conn.health
  let detail = conn.lastError
  if (health === 'unknown') {
    const rl = await rateLimit({ key: `pms-probe:${code}`, limit: 6, windowSec: 300 })
    if (rl.ok) {
      const resolved = await resolveTenantAdapter(code)
      if (!resolved) {
        // Credential can't be decrypted — SESSION_SECRET rotated, or the blob
        // is corrupt. The clinic must reconnect; nothing else will fix it.
        detail = 'stored credentials could not be read (server secret rotated)'
        await markPmsFailed(code, detail)
        health = 'error'
      } else {
        const probe = await resolved.adapter.probe()
        if (probe.ok) {
          await markPmsOk(code)
          health = 'ok'
          detail = null
        } else {
          detail = `${resolved.kind}: ${probe.status ? `HTTP ${probe.status}` : 'no response'}`
          await markPmsFailed(code, detail)
          health = 'error'
        }
      }
    }
  }

  const failure = health === 'error' ? describePmsFailure(conn.kind, detail) : null
  return NextResponse.json({
    connected: true,
    kind: conn.kind,
    lastOkAt: conn.lastOkAt,
    health,
    needsAttention: health === 'error',
    message: failure?.message ?? null,
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

  // Snapshot the EXISTING connection (if any), store the new one, then prove
  // it with the adapter's probe() — the cheapest authenticated read. A key
  // that can't read is a key that can't file reports — reject it now, not at
  // report time, and put the working connection back so a typo can never
  // destroy it. (findPatient was useless here: it maps every failure to [].)
  const previous = await getPmsConnectionSnapshot(code)
  await setPmsConnection({ clinicCode: code, kind: body.kind, apiKey, creds: body.creds })
  const resolved = await resolveTenantAdapter(code)
  if (!resolved) {
    if (previous) await restorePmsConnection(code, previous)
    else await removePmsConnection(code)
    return NextResponse.json({ error: 'Connection could not be created' }, { status: 500 })
  }
  const probe = await resolved.adapter.probe()
  if (!probe.ok) {
    if (previous) await restorePmsConnection(code, previous)
    else await removePmsConnection(code)
    return NextResponse.json(
      {
        error:
          `The ${body.kind} API rejected the key` +
          (probe.status ? ` (HTTP ${probe.status})` : ' (no response)') +
          (previous ? ' — your existing connection is unchanged.' : '.'),
        status: probe.status ?? null,
      },
      { status: 400 },
    )
  }
  await markPmsOk(code)
  return NextResponse.json({ ok: true, kind: resolved.kind })
}

export async function DELETE(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const code = (p.get('code') || '').trim().toUpperCase()
  const k = p.get('k')
  if (!(await authed(request, code, k))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await removePmsConnection(code)
  return NextResponse.json({ ok: true })
}
