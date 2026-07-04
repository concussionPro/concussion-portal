import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { getClientIp } from '@/lib/get-client-ip'
import {
  createSstClinic,
  getSstClinicByEmail,
  type SstClinic,
} from '@/lib/sst-trainer/clinic-registry'
import { buildWelcomeEmail } from '@/lib/sst-trainer/clinic-welcome-email'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/platform/founding
//
// Founding-clinic signup for the SST Trainer platform — now SELF-SERVE
// provisioning (launch architecture 2026-07-02). On submit we:
//   1. Persist the lead to Postgres (founding_clinic_interest) — committed
//      FIRST so a lead is never lost to any downstream failure.
//   2. Provision the clinic immediately via the shared clinic registry
//      (lib/sst-trainer/clinic-registry): 6-char clinic code + private viewKey
//      in KV `clinic:{code}` + a durable sst_clinics row. Idempotent per email
//      — a resubmission reuses the existing clinic instead of minting a second
//      code.
//   3. Email the clinic their code, private Clinical Hub link and patient app
//      link (SST-branded welcome, resent on resubmission — doubles as a
//      "recover my link" path).
//   4. Notify Zac (best effort).
// If provisioning fails (KV down / not configured) the lead still lands and
// Zac gets the notification — he provisions manually, nothing is lost.
// ─────────────────────────────────────────────────────────────────────────────

// Rate limiting (in-memory, per-instance — matches register-interest)
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

const VALID_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const
const VALID_VOLUMES = ['1-3', '4-10', '11-25', '25+', 'unsure'] as const

const VOLUME_LABELS: Record<string, string> = {
  '1-3': '1–3 patients / month',
  '4-10': '4–10 patients / month',
  '11-25': '11–25 patients / month',
  '25+': '25+ patients / month',
  unsure: 'Not sure yet',
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

    if (!checkRateLimit(`ip:${ip}`, 10)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { clinicianName, clinicName, email, state, patientVolume, message } = body

    // Validate
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!clinicianName || clinicianName.trim().length < 2 || clinicianName.trim().length > 100) {
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 })
    }
    if (!clinicName || clinicName.trim().length < 2 || clinicName.trim().length > 120) {
      return NextResponse.json({ error: 'Clinic name is required.' }, { status: 400 })
    }
    if (!state || !(VALID_STATES as readonly string[]).includes(state)) {
      return NextResponse.json({ error: 'Please select your state.' }, { status: 400 })
    }
    if (!patientVolume || !(VALID_VOLUMES as readonly string[]).includes(patientVolume)) {
      return NextResponse.json({ error: 'Please select an approximate patient volume.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanClinician = clinicianName.trim().slice(0, 100)
    const cleanClinic = clinicName.trim().slice(0, 120)
    const cleanMessage =
      typeof message === 'string' && message.trim().length > 0 ? message.trim().slice(0, 1500) : null

    // Persist FIRST — the lead must land in the DB regardless of email outcome.
    await ensureTable()
    const { rowCount } = await sql`
      INSERT INTO founding_clinic_interest
        (clinician_name, clinic_name, email, state, patient_volume, message)
      VALUES
        (${cleanClinician}, ${cleanClinic}, ${cleanEmail}, ${state}, ${patientVolume}, ${cleanMessage})
      ON CONFLICT (email) DO UPDATE SET
        clinician_name = EXCLUDED.clinician_name,
        clinic_name = EXCLUDED.clinic_name,
        state = EXCLUDED.state,
        patient_volume = EXCLUDED.patient_volume,
        message = COALESCE(EXCLUDED.message, founding_clinic_interest.message)
    `

    // Provision the clinic (idempotent per email — resubmission reuses the
    // existing code rather than minting a second one). Best effort: a KV
    // outage must not lose the lead, so failures fall through to the manual
    // path (Zac gets the notification either way).
    let clinic: SstClinic | null = null
    if (process.env.KV_REST_API_URL) {
      try {
        clinic =
          (await getSstClinicByEmail(cleanEmail)) ??
          (await createSstClinic({
            clinicName: cleanClinic,
            contactName: cleanClinician,
            email: cleanEmail,
          }))
      } catch (provisionErr) {
        console.error('Founding clinic provisioning failed (lead is saved):', provisionErr)
      }
    }

    const volumeLabel = VOLUME_LABELS[patientVolume] || patientVolume

    // Notify Zac (best effort — lead already persisted above).
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `New founding clinic: ${cleanClinic} (${state}) — ${cleanClinician}`,
        html: buildNotificationEmail({
          clinician: cleanClinician,
          clinic: cleanClinic,
          email: cleanEmail,
          state,
          volumeLabel,
          message: cleanMessage,
          isUpdate: rowCount === 0,
          clinicCode: clinic?.code ?? null,
        }),
        tags: [
          { name: 'type', value: 'founding-clinic-notification' },
          { name: 'sequence', value: 'founding-clinic' },
          { name: 'state', value: state },
        ],
      })
    } catch (emailErr) {
      console.error('Failed to send founding-clinic notification email:', emailErr)
    }

    // Welcome email to the clinic with code + private hub link + patient link.
    let welcomeSent = false
    if (clinic) {
      try {
        welcomeSent = await sendEmail({
          to: cleanEmail,
          subject: `Your SST Trainer clinic code: ${clinic.code} — ${cleanClinic} is set up`,
          html: buildWelcomeEmail({
            contactName: cleanClinician,
            clinicName: cleanClinic,
            code: clinic.code,
            viewKey: clinic.viewKey,
          }),
          tags: [
            { name: 'type', value: 'sst-clinic-welcome' },
            { name: 'sequence', value: 'sst-founding-welcome' },
          ],
        })
      } catch (welcomeErr) {
        console.error('Failed to send SST clinic welcome email:', welcomeErr)
      }
    }

    console.log(
      `Founding clinic registered: ${cleanEmail.slice(0, 3)}*** — ${cleanClinic} (${state})${clinic ? ` — provisioned ${clinic.code}` : ' — provisioning deferred'}`
    )

    const firstName = cleanClinician.split(' ')[0]
    return NextResponse.json({
      success: true,
      ...(clinic ? { code: clinic.code } : {}),
      message: clinic && welcomeSent
        ? `Thanks ${firstName} — ${cleanClinic} is set up. Your clinic code and Clinical Hub link are on their way to ${cleanEmail}.`
        : `Thanks ${firstName} — you're on the founding list. Zac will be in touch shortly to set up ${cleanClinic}.`,
    })
  } catch (error) {
    console.error('Founding clinic signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}


function buildNotificationEmail(args: {
  clinician: string
  clinic: string
  email: string
  state: string
  volumeLabel: string
  message: string | null
  isUpdate: boolean
  clinicCode: string | null
}): string {
  const { clinician, clinic, email, state, volumeLabel, message, isUpdate, clinicCode } = args
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 18px; color: #16243f; margin-bottom: 4px;">
        New SST Trainer founding clinic${isUpdate ? ' (updated submission)' : ''}
      </h2>
      <p style="font-size: 13px; color: #3c7a1f; font-weight: 600; margin: 0 0 16px;">Founding program lead</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 150px;">Clinician</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(clinician)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Clinic</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(clinic)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
            <a href="mailto:${escapeHtml(email)}" style="color: #3c7a1f;">${escapeHtml(email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">State</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(state)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Approx. volume</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(volumeLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Provisioning</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
            ${clinicCode ? `Auto-provisioned — clinic code <span style="font-family: monospace;">${escapeHtml(clinicCode)}</span> (welcome email sent)` : '<span style="color: #b45309;">NOT auto-provisioned — set up manually</span>'}
          </td>
        </tr>
      </table>

      ${
        message
          ? `<div style="background: #f4f8f8; border: 1px solid #d8ecc4; border-radius: 10px; padding: 16px; margin: 18px 0;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #3c7a1f; text-transform: uppercase; letter-spacing: 0.04em;">Message</p>
              <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5;">${escapeHtml(message)}</p>
            </div>`
          : ''
      }

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        Automated notification from the SST Trainer founding signup form.
      </p>
    </div>
  `
}
