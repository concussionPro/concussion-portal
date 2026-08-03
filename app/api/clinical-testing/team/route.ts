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

const SEAT_ALLOWANCE: Record<string, number> = { single: 1, clinic: 5, enterprise: 15 }

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
  return getSstClinicByEmail(session.email.toLowerCase())
}

export async function GET(req: NextRequest) {
  const clinic = await authedClinic(req)
  if (!clinic) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await ensureTable()
  const { rows } = await sql`
    SELECT id, name, email, created_at FROM sst_clinic_members
    WHERE clinic_code = ${clinic.code} AND revoked_at IS NULL
    ORDER BY created_at ASC
  `
  const usage = await getClinicUsage(clinic.code)
  const tier = (clinic as unknown as { tier?: string }).tier || (usage.plan === 'active' ? 'single' : 'trial')
  const allowance = usage.plan === 'active' ? (SEAT_ALLOWANCE[tier] ?? 1) : 1
  return NextResponse.json({
    members: rows,
    // owner occupies seat 1
    seatsUsed: rows.length + 1,
    seatAllowance: allowance,
    tier: usage.plan === 'active' ? tier : 'trial',
  })
}

export async function POST(req: NextRequest) {
  const clinic = await authedClinic(req)
  if (!clinic) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  const tier = (clinic as unknown as { tier?: string }).tier || 'single'
  const allowance = usage.plan === 'active' ? (SEAT_ALLOWANCE[tier] ?? 1) : 1
  if (seatsUsed >= allowance) {
    return NextResponse.json(
      {
        error: 'seat-limit',
        message:
          usage.plan === 'active'
            ? `Your ${tier} plan covers ${allowance} practitioner${allowance === 1 ? '' : 's'}. Upgrade at /clinical-testing/subscribe to add more.`
            : 'The free trial covers one practitioner. Subscribe at /clinical-testing/subscribe to add your team.',
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
  return NextResponse.json({ ok: true, id, name })
}

export async function DELETE(req: NextRequest) {
  const clinic = await authedClinic(req)
  if (!clinic) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
