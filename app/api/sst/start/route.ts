import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { getClientIp } from '@/lib/get-client-ip'
import { rateLimit } from '@/lib/rate-limit'
import {
  createSstClinic,
  getSstClinicByEmail,
  type SstClinic,
} from '@/lib/sst-trainer/clinic-registry'
import { buildWelcomeEmail } from '@/lib/sst-trainer/clinic-welcome-email'
import { grantSstEntitlement } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sst/start — SELF-SERVE clinic trial signup (the public front door).
//
// Built for cold inbound (Cliniko connected-apps listing, PMS directories):
// a practitioner we have never spoken to lands on /clinical-suite/start and
// leaves with a working clinic on the 3-patient free trial. Same rails as the
// retired founding form (this route supersedes /api/platform/founding):
//   1. Lead persists FIRST (founding_clinic_interest — the SST lead table).
//   2. Clinic provisioned idempotently (existing clinic wins; resubmission
//      re-sends the welcome email, doubling as code recovery).
//   3. Portal account with the SST entitlement + 7-day magic login link.
//   4. Welcome email (code + hub link + patient links) to them; note to Zac.
// The 3-patient trial cap and the paid upgrade (/api/sst/subscribe) are
// already enforced downstream — this route only opens the door.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  if (rateLimitMap.size > 1000) rateLimitMap.clear()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS founding_clinic_interest (
      id SERIAL PRIMARY KEY,
      clinician_name TEXT NOT NULL,
      clinic_name TEXT NOT NULL,
      email TEXT NOT NULL,
      state TEXT NOT NULL,
      patient_volume TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email)
    )
  `
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // KV-backed limit (2026-08-04 audit: the in-memory Map is per-instance and
    // resets on cold start — near-no limiting under distributed influx). The
    // Map stays as a same-instance fast path; KV is the real gate.
    const kvLimit = await rateLimit({ key: `sst-start:${ip}`, limit: 10, windowSec: 900 })
    if (!kvLimit.ok) {
      return NextResponse.json({ error: 'Too many requests — please try again shortly.' }, { status: 429 })
    }
    if (!checkRateLimit(`ip:${ip}`, 10)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { clinicianName, clinicName, email, source } = body

    // Honeypot: real users never see or fill this field. Pretend success so
    // bots learn nothing; no side effects fire.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ success: true, message: 'Thanks — check your email.' })
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!clinicianName || clinicianName.trim().length < 2 || clinicianName.trim().length > 100) {
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
    }
    if (!clinicName || clinicName.trim().length < 2 || clinicName.trim().length > 120) {
      return NextResponse.json({ error: 'Clinic name is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanClinician = clinicianName.trim().slice(0, 100)
    const cleanClinic = clinicName.trim().slice(0, 120)
    const cleanSource =
      typeof source === 'string' && source.trim().length > 0
        ? source.trim().slice(0, 40).replace(/[^\w.-]/g, '')
        : null
    const leadNote = `Self-serve trial signup${cleanSource ? ` via ${cleanSource}` : ''}`

    // Lead lands FIRST — nothing downstream may lose it.
    await ensureTable()
    await sql`
      INSERT INTO founding_clinic_interest
        (clinician_name, clinic_name, email, state, patient_volume, message)
      VALUES
        (${cleanClinician}, ${cleanClinic}, ${cleanEmail}, ${''}, ${''}, ${leadNote})
      ON CONFLICT (email) DO UPDATE SET
        clinician_name = EXCLUDED.clinician_name,
        clinic_name = EXCLUDED.clinic_name,
        message = COALESCE(founding_clinic_interest.message, EXCLUDED.message)
    `

    // Provision (idempotent per email). Failure falls through to the manual
    // path — the lead is saved and the notification tells Zac to provision.
    let clinic: SstClinic | null = null
    let loginUrl: string | null = null
    if (process.env.KV_REST_API_URL) {
      try {
        clinic =
          (await getSstClinicByEmail(cleanEmail)) ??
          (await createSstClinic({
            clinicName: cleanClinic,
            contactName: cleanClinician,
            email: cleanEmail,
          }))
        const userId = await grantSstEntitlement(cleanEmail, cleanClinician)
        const token = createMagicToken(userId, cleanEmail, cleanClinician, 'preview', 7 * 24 * 60 * 60 * 1000)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
        loginUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent('/clinical-testing')}`
      } catch (provisionErr) {
        console.error('SST trial provisioning failed (lead is saved):', provisionErr)
      }
    }

    // Note to Zac (best effort — lead already persisted).
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `New SST trial clinic: ${cleanClinic} — ${cleanClinician}${cleanSource ? ` (via ${cleanSource})` : ''}`,
        html: buildTrialNotification({
          clinician: cleanClinician,
          clinic: cleanClinic,
          email: cleanEmail,
          source: cleanSource,
          clinicCode: clinic?.code ?? null,
        }),
        tags: [
          { name: 'type', value: 'sst-trial-notification' },
          { name: 'sequence', value: 'sst-trial' },
        ],
      })
    } catch (emailErr) {
      console.error('Failed to send SST trial notification email:', emailErr)
    }

    // Welcome email — code, private hub link, patient app links, login link.
    let welcomeSent = false
    if (clinic) {
      try {
        welcomeSent = await sendEmail({
          to: cleanEmail,
          subject: `${cleanClinic} is set up — your SST Trainer trial`,
          html: buildWelcomeEmail({
            contactName: cleanClinician,
            clinicName: cleanClinic,
            code: clinic.code,
            viewKey: clinic.viewKey,
            loginUrl,
          }),
          tags: [
            { name: 'type', value: 'sst-clinic-welcome' },
            { name: 'sequence', value: 'sst-trial-welcome' },
          ],
        })
      } catch (welcomeErr) {
        console.error('Failed to send SST trial welcome email:', welcomeErr)
      }
    }

    console.log(
      `SST trial signup: ${cleanEmail.slice(0, 3)}*** — ${cleanClinic}${cleanSource ? ` (via ${cleanSource})` : ''}${clinic ? ` — provisioned ${clinic.code}` : ' — provisioning deferred'}`
    )

    const firstName = cleanClinician.split(' ')[0]
    return NextResponse.json({
      success: true,
      ...(clinic ? { code: clinic.code } : {}),
      message:
        clinic && welcomeSent
          ? `Thanks ${firstName} — ${cleanClinic} is set up. Your clinic code and login link are on their way to ${cleanEmail}.`
          : `Thanks ${firstName} — we've got your details. Your clinic setup will be confirmed by email shortly.`,
    })
  } catch (error) {
    console.error('SST trial signup error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

function buildTrialNotification(args: {
  clinician: string
  clinic: string
  email: string
  source: string | null
  clinicCode: string | null
}): string {
  const { clinician, clinic, email, source, clinicCode } = args
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 18px; color: #16243f; margin-bottom: 4px;">New SST trial clinic</h2>
      <p style="font-size: 13px; color: #0d9488; font-weight: 600; margin: 0 0 16px;">Self-serve signup${source ? ` — via ${escapeHtml(source)}` : ''}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b; width: 150px;">Clinician</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(clinician)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Clinic</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(clinic)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;"><a href="mailto:${escapeHtml(email)}" style="color: #0d9488;">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Provisioning</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${clinicCode ? `Auto-provisioned — clinic code <span style="font-family: monospace;">${escapeHtml(clinicCode)}</span> (welcome email sent)` : '<span style="color: #b45309;">NOT auto-provisioned — set up manually</span>'}</td></tr>
      </table>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">Automated notification from the SST trial signup form (/clinical-suite/start).</p>
    </div>
  `
}
