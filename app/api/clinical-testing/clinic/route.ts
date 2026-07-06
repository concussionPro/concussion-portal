import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'
import { sendEmail } from '@/lib/resend-client'
import {
  createSstClinic,
  getSstClinicByEmail,
  getClinicUsage,
  type SstClinic,
} from '@/lib/sst-trainer/clinic-registry'
import { buildWelcomeEmail } from '@/lib/sst-trainer/clinic-welcome-email'

/**
 * /api/clinical-testing/clinic — the PAID PORTAL's own clinic provisioning.
 *
 * The founding form is a marketing surface; a paid clinician inside the portal
 * gets their code here, tied to their signed-in email (sweep finding: there
 * was NO in-product path to provision, retrieve or recover a clinic code —
 * the whole clinician→patient handoff hung off one welcome email).
 *
 *  GET  → the caller's clinic (code + viewKey + links) or null.
 *  POST → idempotent provision for the caller's email (existing clinic wins);
 *         sends the same SST welcome email as founding (recovery path).
 *
 * Auth: paid session only (online-only / full-course) — same tier as the
 * toolkit downloads. The viewKey is returned to its owner: this endpoint is
 * authed by their login, which is strictly stronger than the emailed link.
 */

type SessionInfo = { email: string; name: string }

/** A logged-in session with Clinical Testing access (course buyer, SST-
 *  entitled clinic, or owner). Async — entitlement is a DB check. */
async function clinicalSession(req: NextRequest): Promise<SessionInfo | null> {
  const token = req.cookies.get('session')?.value
  const data = token ? verifySessionToken(token) : null
  if (!data) return null
  if (!(await hasClinicalAccess({ email: data.email, accessLevel: data.accessLevel }))) return null
  return { email: data.email.toLowerCase(), name: data.name }
}

function serialise(clinic: SstClinic) {
  return {
    code: clinic.code,
    clinicName: clinic.clinicName,
    viewKey: clinic.viewKey,
  }
}

export async function GET(req: NextRequest) {
  const session = await clinicalSession(req)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: 'Clinic service not configured' }, { status: 503 })
  }
  const clinic = await getSstClinicByEmail(session.email)
  if (!clinic) return NextResponse.json({ clinic: null })
  const usage = await getClinicUsage(clinic.code)
  return NextResponse.json({ clinic: serialise(clinic), usage })
}

export async function POST(req: NextRequest) {
  const session = await clinicalSession(req)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: 'Clinic service not configured' }, { status: 503 })
  }

  let clinicName = ''
  try {
    const body = await req.json()
    clinicName = typeof body?.clinicName === 'string' ? body.clinicName.trim().slice(0, 120) : ''
  } catch {
    /* empty body is fine — we fall back below */
  }

  // Idempotent: an existing clinic for this email always wins (no second code).
  let clinic = await getSstClinicByEmail(session.email)
  let created = false
  if (!clinic) {
    if (clinicName.length < 2) {
      return NextResponse.json({ error: 'Enter your clinic or practice name.' }, { status: 400 })
    }
    clinic = await createSstClinic({
      clinicName,
      contactName: session.name || session.email.split('@')[0],
      email: session.email,
    })
    created = true

    // Same welcome email as founding — doubles as the durable record of the
    // hub link + patient link outside the portal. Best effort.
    try {
      await sendEmail({
        to: session.email,
        subject: `Your SST Trainer clinic code: ${clinic.code} — ${clinic.clinicName} is set up`,
        html: buildWelcomeEmail({
          contactName: clinic.contactName,
          clinicName: clinic.clinicName,
          code: clinic.code,
          viewKey: clinic.viewKey,
        }),
        tags: [
          { name: 'type', value: 'sst-clinic-welcome' },
          { name: 'sequence', value: 'sst-portal-provision' },
        ],
      })
    } catch (err) {
      console.error('[clinical-testing] welcome email failed:', err)
    }
  }

  return NextResponse.json({ clinic: serialise(clinic), created })
}
