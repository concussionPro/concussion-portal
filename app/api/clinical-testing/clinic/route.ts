import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { verifySessionToken } from '@/lib/jwt-session'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'
import { sendEmail } from '@/lib/resend-client'
import {
  createSstClinic,
  getSstClinicByEmail,
  adoptExistingClinicForEmail,
  getClinicUsage,
  getClinicProfile,
  setClinicProfile,
  type SstClinic,
  type ClinicDocProfile,
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

/** The synthetic DEMO00 workspace — fully populated, keyless, nothing real
 *  behind it. Only ever the FALLBACK: demo is a floor, never a downgrade. */
function demoWorkspaceResponse() {
  return NextResponse.json({
    clinic: { code: 'DEMO00', clinicName: 'Demo Clinic', viewKey: '' },
    usage: { plan: 'active', patientCount: 4, cap: null, window: '30d', canAddPatient: true },
  })
}

function hasDemoCookie(req: NextRequest): boolean {
  return (
    req.cookies.get('demo_key')?.value === DEMO_KEY ||
    req.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY
  )
}

export async function GET(req: NextRequest) {
  // ORDER MATTERS — a REAL entitlement must win over a lingering demo cookie.
  // The /demo/clinic cookie lives 30 days, so an entitled clinician who once
  // took the tour was served the DEMO00 workspace instead of their own clinic
  // (demo patients in their hub, their real code + viewKey unreachable) for a
  // month. Same rule the access route already applies.
  const session = await clinicalSession(req)
  if (!session) {
    if (hasDemoCookie(req)) return demoWorkspaceResponse()
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: 'Clinic service not configured' }, { status: 503 })
  }
  const clinic =
    (await getSstClinicByEmail(session.email)) ?? (await adoptExistingClinicForEmail(session.email))
  if (!clinic) return NextResponse.json({ clinic: null })
  const usage = await getClinicUsage(clinic.code)
  const profile = await getClinicProfile(clinic.code)
  return NextResponse.json({ clinic: serialise(clinic), usage, profile })
}

/** PUT — save the clinic's document profile (letterhead / provider block /
 *  sign-off). SERVER-side so all seats and all devices share ONE master
 *  input (2026-08-05: localStorage was per-device — 15 clinicians meant 15
 *  inconsistent letterheads). Any seated member may update it. */
export async function PUT(req: NextRequest) {
  const session = await clinicalSession(req)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const clinic = await getSstClinicByEmail(session.email)
  if (!clinic) return NextResponse.json({ error: 'No clinic found.' }, { status: 400 })
  const body = (await req.json().catch(() => ({}))) as { profile?: ClinicDocProfile }
  if (!body.profile || typeof body.profile !== 'object') {
    return NextResponse.json({ error: 'profile required' }, { status: 400 })
  }
  const ok = await setClinicProfile(clinic.code, body.profile)
  if (!ok) return NextResponse.json({ error: 'Could not save profile.' }, { status: 500 })
  return NextResponse.json({ ok: true, profile: await getClinicProfile(clinic.code) })
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
  // Check the SST mirror first, then adopt a PRESEASON clinic if this clinician
  // registered for baseline testing before ever opening the portal — otherwise
  // they'd be minted a second code and their patients would split across the
  // two (and the preseason code would keep accepting SST writes nobody could
  // read, for want of a viewKey).
  let clinic = (await getSstClinicByEmail(session.email)) ?? (await adoptExistingClinicForEmail(session.email))
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
