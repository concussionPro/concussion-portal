import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { kv } from '@vercel/kv'
import { verifySessionToken } from '@/lib/jwt-session'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { getSstClinicByEmail, getClinicUsage, isExistingPatient } from '@/lib/sst-trainer/clinic-registry'
import { hasClinicalAccess } from '@/lib/sst-trainer/access'

/**
 * POST /api/clinical-testing/invite — clinician sends a patient the app link.
 *
 * The smooth handoff: instead of copy-pasting the link into their own email,
 * the clinician types the patient's address in the portal and we deliver a
 * clean, SST-branded invite carrying /sst-trainer?clinic=CODE.
 *
 * Transactional and clinician-initiated — but the suppression blacklist is
 * still honoured fail-closed (unsubs are zero-tolerance on EVERY lane):
 * a suppressed address is refused, and a DB failure refuses the send.
 * Rate limit: 25 invites per clinic per day.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session || !(await hasClinicalAccess({ email: session.email, accessLevel: session.accessLevel }))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: 'Clinic service not configured' }, { status: 503 })
  }

  const clinic = await getSstClinicByEmail(session.email.toLowerCase())
  if (!clinic) {
    return NextResponse.json({ error: 'Create your clinic code first.' }, { status: 400 })
  }

  let patientEmail = ''
  let patientName = ''
  try {
    const body = await req.json()
    patientEmail = typeof body?.patientEmail === 'string' ? body.patientEmail.trim().toLowerCase() : ''
    patientName = typeof body?.patientName === 'string' ? body.patientName.trim().slice(0, 80) : ''
  } catch {
    /* handled below */
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    return NextResponse.json({ error: 'Enter a valid patient email.' }, { status: 400 })
  }

  // Trial gate (owner 2026-07-06): a trial clinic gets TRIAL_PATIENT_CAP free
  // patients. Inviting a NEW patient past the cap is refused with the
  // subscribe prompt; the clinician can still re-send to existing patients.
  // Enforcement is on admission only — patient data sync is never blocked.
  const usage = await getClinicUsage(clinic.code)
  // Re-sends to EXISTING patients are exempt from the cap (final sweep #16 —
  // the comment above always promised this; the 402 was unconditional).
  const existingResend =
    !usage.canAddPatient &&
    typeof patientName === 'string' &&
    patientName.trim() !== '' &&
    (await isExistingPatient(clinic.code, patientName))
  if (!usage.canAddPatient && !existingResend) {
    // Plan-aware refusal (round-4 #1: a PAYING clinic at its caseload cap was
    // told "your free trial is full — subscribe", then 409'd at checkout).
    return NextResponse.json(
      usage.plan === 'active'
        ? {
            error: `Your plan covers ${usage.cap} active patients (30 days) and you're at the limit. Manage billing → change plan to invite more — your existing patients keep working.`,
            code: 'plan-cap-reached',
            usage,
          }
        : {
            error: `Your free trial covers ${usage.cap} patients and you've used all of them. Subscribe to add more — your existing patients keep working.`,
            code: 'trial-cap-reached',
            usage,
          },
      { status: 402 },
    )
  }

  // Rate limit per clinic per day.
  const day = new Date().toISOString().slice(0, 10)
  const rateKey = `rate:sst-invite:${clinic.code}:${day}`
  const count = await kv.incr(rateKey)
  if (count === 1) await kv.expire(rateKey, 86_400)
  if (count > 25) {
    return NextResponse.json({ error: 'Daily invite limit reached — try again tomorrow.' }, { status: 429 })
  }

  // Suppression is checked on EVERY send lane, fail closed.
  // LOWER(TRIM(email)) on the STORED column, not a raw `email = ...` match:
  // email_suppression is plain TEXT with no lowercase constraint (see
  // lib/email-suppression.ts), so rows written by a manual insert, an import or
  // an inbound STOP can carry mixed case or a trailing space. The raw equality
  // this used missed every one of them and sent the invite anyway — a
  // zero-tolerance breach on a lane that mails a patient.
  try {
    const { rows } = await sql`
      SELECT 1 FROM email_suppression
      WHERE LOWER(TRIM(email)) = ${patientEmail} LIMIT 1`
    if (rows.length > 0) {
      return NextResponse.json(
        { error: 'That address has opted out of emails from us — give them the link directly instead.' },
        { status: 409 },
      )
    }
  } catch (err) {
    console.error('[sst-invite] suppression check failed — refusing send:', err)
    return NextResponse.json({ error: 'Could not verify the address — try again shortly.' }, { status: 503 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
  // /j/CODE — platform-smart join (iPhone → app chooser, else web app direct)
  const patientUrl = `${baseUrl}/j/${encodeURIComponent(clinic.code)}`
  const greeting = patientName ? `Hi ${escapeHtml(patientName)},` : 'Hi,'
  const clinicName = escapeHtml(clinic.clinicName)

  const sent = await sendEmail({
    to: patientEmail,
    subject: `${clinic.clinicName} — your exercise rehab app link`,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;background:#f7fafa;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,.1)">
    <div style="background:#16243f;padding:26px 24px;text-align:center">
      <p style="margin:0 0 4px;color:#7fd4c8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.18em">SST Trainer</p>
      <h1 style="margin:0;color:#fff;font-size:20px">${clinicName} set you up</h1>
    </div>
    <div style="padding:28px 24px">
      <p>${greeting}</p>
      <p>${clinicName} uses the SST Trainer for your exercise rehab — a guided program on your own phone, with every session going back to your clinician.</p>
      <p style="text-align:center;margin:26px 0">
        <a href="${patientUrl}" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">Open the app</a>
      </p>
      <ol style="font-size:14px;color:#475569;line-height:1.7;padding-left:20px">
        <li>Open the link on your phone and add it to your home screen.</li>
        <li>Your clinic is already linked — just enter your name.</li>
        <li>Have your watch or heart-rate monitor handy if you own one (Garmin, Polar, WHOOP or a chest strap). No watch? Everything still works.</li>
      </ol>
      <p style="font-size:12.5px;color:#64748b">If the button doesn't open, copy this link: <br><a href="${patientUrl}" style="color:#0d9488;word-break:break-all">${patientUrl}</a></p>
    </div>
    <div style="padding:18px 24px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0">
      Sent at your clinician's request · Concussion Education Australia
    </div>
  </div>
</body></html>`,
    tags: [
      { name: 'type', value: 'sst-patient-invite' },
      { name: 'sequence', value: 'sst-patient-invite' },
    ],
  })

  if (!sent) {
    return NextResponse.json({ error: 'Send failed — try again.' }, { status: 502 })
  }
  return NextResponse.json({ success: true, usage })
}
