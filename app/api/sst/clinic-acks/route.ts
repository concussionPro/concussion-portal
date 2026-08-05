import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { isRegisteredClinic, resolveActingClinician, verifyViewKey } from '@/lib/sst-trainer/clinic-registry'
import { listClinicAcks, recordClinicAck } from '@/lib/sst-trainer/clinic-acks'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * Clinic-wide acknowledgement of the hub's escalation banners.
 *
 * GET  ?code&k                              → { acks: [...] }
 * POST { code, k, patientKey, dateKey, by? } → { ok, ack }
 *
 * AUTH mirrors /api/sst/clinic-sessions exactly: a registered clinic code PLUS
 * the clinic's private viewKey (the patient-held code alone must never read or
 * write clinician state).
 *
 * DEMO00 is the public keyless demo. It READS as an empty ack set and its
 * writes are a no-op success — the demo never touches the database, and its
 * banners keep behaving exactly as they did (client-side only).
 *
 * WHO reviewed it: an authenticated portal session always wins (resolved to the
 * clinic's owner/member name); the client-supplied name is only a fallback for
 * the keyed-hub-link case where there is no session to resolve. Same precedence
 * as the PMS filing route — a shared clinic tablet must not stamp the last
 * person who typed their name onto everyone else's review.
 */

const DEMO = 'DEMO00'

async function authed(code: string, k: string | null): Promise<boolean> {
  if (!code || code.length < 3) return false
  if (code === DEMO) return true
  if (!(await isRegisteredClinic(code).catch(() => false))) return false
  return await verifyViewKey(code, k).catch(() => false)
}

/** Session identity first, typed name second, nothing third. */
async function actingClinician(
  request: NextRequest,
  code: string,
  supplied: unknown,
): Promise<string | null> {
  try {
    const tok = request.cookies.get('session')?.value
    const sess = tok ? verifySessionToken(tok) : null
    if (sess?.email) {
      const name = await resolveActingClinician(sess.email, code)
      if (name) return name
    }
  } catch {
    /* fall through to the typed name */
  }
  const typed = typeof supplied === 'string' ? supplied.trim() : ''
  return typed ? typed.slice(0, 120) : null
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const code = (p.get('code') || '').trim().toUpperCase()
  const k = p.get('k')
  if (!(await authed(code, k))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (code === DEMO) return NextResponse.json({ acks: [] })
  return NextResponse.json({ acks: await listClinicAcks(code) })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `sst-ack:${ip}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: { code?: string; k?: string; patientKey?: string; dateKey?: string; by?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const code = (body.code || '').trim().toUpperCase()
  if (!(await authed(code, body.k ?? null))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // DEMO00 never writes (shared public demo code — one POST would otherwise
  // silence a banner for every prospect looking at the pitch surface).
  if (code === DEMO) return NextResponse.json({ ok: true, demo: true, ack: null })

  const patientKey = (body.patientKey || '').trim()
  const dateKey = (body.dateKey || '').trim()
  if (!patientKey || !dateKey) {
    return NextResponse.json({ error: 'patientKey and dateKey required' }, { status: 400 })
  }

  try {
    const ack = await recordClinicAck({
      clinicCode: code,
      patientKey,
      dateKey,
      acknowledgedBy: await actingClinician(request, code, body.by),
    })
    if (!ack) return NextResponse.json({ error: 'Could not record acknowledgement' }, { status: 400 })
    return NextResponse.json({ ok: true, ack })
  } catch (err) {
    console.error('[clinic-acks] record failed:', err)
    return NextResponse.json({ error: 'Could not record acknowledgement' }, { status: 500 })
  }
}
