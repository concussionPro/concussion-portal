/**
 * /api/clinical-testing/team — named practitioner seats per clinic.
 *
 * WHY (owner, 2026-08-04): tier enforcement by caseload was the wrong proxy —
 * "a single clinician could do 200 cases a month and a team of 15 could do
 * 10." The reliable unit is clinician IDENTITY. Seats are counted where they
 * are CREATED: adding practitioner N+1 beyond the tier's seat allowance is
 * refused with the upgrade path. Seat-adds are administrative, so hard
 * enforcement here can never block patient care (the clinical-safety rule
 * stays absolute on all data paths).
 *
 * Seat allowances mirror the sold tiers (lib/stripe SST_PLANS):
 *   trial/single = 1 · clinic = 5 · enterprise = 15.
 * The clinic OWNER (sst_clinics row) occupies seat 1.
 *
 * GET    → roster
 * POST   {name, email} → add practitioner (seat-enforced)
 * DELETE {id}          → deactivate practitioner (frees the seat)
 *
 * Auth: the portal session of the clinic owner (same gate as /invite).
 * Each member gets a personal key so future report-filing can attribute the
 * acting clinician; access remains via the clinic workspace for now.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { verifySessionToken } from '@/lib/jwt-session'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'
import { getSstClinicByEmail, getClinicUsage } from '@/lib/sst-trainer/clinic-registry'
import { grantSstEntitlement } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendEmail, escapeHtml } from '@/lib/resend-client'

// 2026-08-05 pricing redesign: paid tiers meter ACTIVE CASELOAD (registry
// TIER_ACTIVE_PATIENT_CAP), and clinicians are UNLIMITED — named seats are
// the attribution carrot, not the paywall. Trial stays 1 seat (solo eval).
const TRIAL_SEATS = 1

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS sst_clinic_members (
      id TEXT PRIMARY KEY,
      clinic_code TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      member_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_sst_clinic_members_code ON sst_clinic_members (clinic_code) WHERE revoked_at IS NULL`
}

async function authedClinic(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session || !(await hasClinicalAccess({ email: session.email, accessLevel: session.accessLevel }))) return null
  const clinic = await getSstClinicByEmail(session.email.toLowerCase())
  if (!clinic) return null
  // Seat ADMINISTRATION is owner-only — a seated member resolves to the
  // clinic (member fallback) for workspace access, but must not add/revoke
  // colleagues or consume seats (2026-08-05 sweep #6).
  return { clinic, isOwner: clinic.email.toLowerCase() === session.email.toLowerCase() }
}

export async function GET(req: NextRequest) {
  const auth = await authedClinic(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { clinic } = auth
  await ensureTable()
  const { rows } = await sql`
    SELECT id, name, email, created_at FROM sst_clinic_members
    WHERE clinic_code = ${clinic.code} AND revoked_at IS NULL
    ORDER BY created_at ASC
  `
  const usage = await getClinicUsage(clinic.code)
  return NextResponse.json({
    members: rows,
    // owner occupies seat 1
    seatsUsed: rows.length + 1,
    seatAllowance: usage.plan === 'active' ? null : TRIAL_SEATS,
    // null tier on an active plan = alumni comp / legacy grant (unlimited) —
    // NOT the 'single' tier; report null so the UI names no plan for it.
    tier: usage.plan === 'active' ? (clinic.tier ?? null) : 'trial',
    isOwner: auth.isOwner,
  })
}

export async function POST(req: NextRequest) {
  const auth = await authedClinic(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!auth.isOwner) return NextResponse.json({ error: 'Only the clinic owner can manage seats.' }, { status: 403 })
  const { clinic } = auth
  let name = '', email = ''
  try {
    const body = await req.json()
    name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : ''
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : ''
  } catch { /* fall through */ }
  if (!name) return NextResponse.json({ error: 'Practitioner name required.' }, { status: 400 })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email (or leave it blank).' }, { status: 400 })
  }

  await ensureTable()
  const { rows: existing } = await sql`
    SELECT COUNT(*)::int AS n FROM sst_clinic_members
    WHERE clinic_code = ${clinic.code} AND revoked_at IS NULL
  `
  const seatsUsed = (existing[0]?.n ?? 0) + 1 // + owner

  const usage = await getClinicUsage(clinic.code)
  if (usage.plan !== 'active' && seatsUsed >= TRIAL_SEATS) {
    return NextResponse.json(
      {
        error: 'seat-limit',
        message: 'The free trial covers one practitioner. Subscribe at /clinical-testing/subscribe — every paid plan includes unlimited practitioners.',
      },
      { status: 402 },
    )
  }

  const id = crypto.randomUUID()
  const memberKey = crypto.randomBytes(18).toString('base64url')
  await sql`
    INSERT INTO sst_clinic_members (id, clinic_code, name, email, member_key)
    VALUES (${id}, ${clinic.code}, ${name}, ${email || null}, ${memberKey})
  `

  // Seated member with an email → their own portal login (SST entitlement +
  // 7-day magic link). getSstClinicByEmail resolves members to this clinic,
  // so their session opens the same workspace under their own identity —
  // which is what report attribution stamps.
  // Did the invite actually go out? null = no address supplied, so nothing was
  // owed. false = the seat and the entitlement exist but no email left the
  // building, and the owner MUST be told — otherwise they walk away believing
  // a colleague has been notified when nobody ever will be (2026-08-06 state
  // audit: the route returned a flat ok:true for every one of these paths).
  let inviteSent: boolean | null = email ? false : null
  let inviteNote: string | null = null
  if (email) {
    try {
      // ENTITLEMENT FIRST, SUPPRESSION ONLY ON THE SEND (2026-08-05 adversarial
      // round). grantSstEntitlement used to sit INSIDE the suppression branch,
      // so a colleague whose address is on the marketing blacklist — which
      // holds cold-outreach unsubscribes, not just bounces — had their
      // sst_clinic_members row inserted (unconditionally, above) but NO SST
      // entitlement and no way to log in. The owner saw "member added" and the
      // colleague was silently locked out of a workspace their clinic pays for.
      // Access is not marketing; only the invite email is.
      const userId = await grantSstEntitlement(email, name)

      // suppression fail-closed on the SEND lane
      const { rows: sup } = await sql`
        SELECT 1 FROM email_suppression WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
      if (sup.length > 0) {
        inviteNote = `${email} has opted out of our emails, so no invite was sent. Their access is already active — ask them to log in at /login with this address.`
      } else {
        const token = createMagicToken(userId, email, name, 'preview', 7 * 24 * 60 * 60 * 1000)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
        const loginUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent('/clinical-testing')}`
        inviteSent = await sendEmail({
          to: email,
          subject: `You've been added to ${clinic.clinicName} on SST Trainer`,
          html: `<p style="margin:0 0 1em 0;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 1em 0;">${escapeHtml(clinic.contactName)} added you as a practitioner at ${escapeHtml(clinic.clinicName)} on SST Trainer. Your clinic workspace — patients, live sessions and reports — is here:</p><p style="margin:0 0 1em 0;"><a href="${loginUrl}">Open your clinic workspace</a> (link valid 7 days; after that, log in at ${baseUrl}/login with this email)</p><p style="margin:0;">Zac Lewis<br/>Concussion Education Australia</p>`,
          tags: [{ name: 'type', value: 'sst-member-invite' }],
        })
        if (!inviteSent) {
          inviteNote = `The seat is active but the invite email to ${email} did not send. Ask them to log in at /login with this address.`
        }
      }
    } catch (err) {
      console.error('[team] member invite failed (seat still created):', err)
      inviteNote = `The seat is active but the invite email to ${email} did not send. Ask them to log in at /login with this address.`
    }
  }

  return NextResponse.json({ ok: true, id, name, inviteSent, inviteNote })
}

export async function DELETE(req: NextRequest) {
  const auth = await authedClinic(req)
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!auth.isOwner) return NextResponse.json({ error: 'Only the clinic owner can manage seats.' }, { status: 403 })
  const { clinic } = auth
  let id = ''
  try {
    const body = await req.json()
    id = typeof body?.id === 'string' ? body.id : ''
  } catch { /* fall through */ }
  if (!id) return NextResponse.json({ error: 'Member id required.' }, { status: 400 })
  await ensureTable()
  await sql`
    UPDATE sst_clinic_members SET revoked_at = NOW()
    WHERE id = ${id} AND clinic_code = ${clinic.code} AND revoked_at IS NULL
  `
  return NextResponse.json({ ok: true })
}
