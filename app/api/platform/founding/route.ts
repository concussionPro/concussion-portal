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

// ─────────────────────────────────────────────────────────────────────────────
// SST-branded clinic welcome — the self-serve provisioning email. Honest
// claims only: describes what the tool actually does (measured graded test →
// training band → sessions sync to the hub, live in-session view). No outcome
// claims.
// ─────────────────────────────────────────────────────────────────────────────
function buildWelcomeEmail(args: {
  contactName: string
  clinicName: string
  code: string
  viewKey: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
  const firstName = escapeHtml(args.contactName.split(' ')[0])
  const clinicName = escapeHtml(args.clinicName)
  const code = escapeHtml(args.code)
  const hubUrl = `${baseUrl}/clinical-hub?clinic=${encodeURIComponent(args.code)}&k=${encodeURIComponent(args.viewKey)}`
  const patientUrl = `${baseUrl}/sst-trainer?clinic=${encodeURIComponent(args.code)}`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SST Trainer — clinic setup</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f7fafa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .header { background: #16243f; padding: 32px 24px; text-align: center; }
      .header p.kicker { margin: 0 0 4px; color: #7fd4c8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; }
      .header h1 { margin: 0; color: white; font-size: 22px; font-weight: 700; }
      .content { padding: 32px 24px; }
      .code-box { background: #f0fdfa; border: 2px solid #0d9488; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
      .code-display { font-family: 'Courier New', monospace; font-size: 30px; font-weight: 800; color: #0d9488; letter-spacing: 6px; margin: 4px 0; }
      .link-block { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 14px 0; }
      .link-block p.label { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; }
      .link-block a { color: #0d9488; font-size: 14px; font-weight: 600; word-break: break-all; }
      .link-block p.note { margin: 6px 0 0; font-size: 12.5px; color: #64748b; }
      .private { background: #fff7ed; border-color: #fed7aa; }
      .private p.note { color: #9a3412; font-weight: 600; }
      .steps { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; }
      .step { display: flex; align-items: flex-start; margin: 12px 0; }
      .step-num { background: #16243f; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0; font-size: 14px; }
      .founding { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 18px; font-size: 13.5px; color: #475569; }
      .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="kicker">SST Trainer</p>
        <h1>${clinicName} is set up</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>
        <p><strong>${clinicName}</strong> is now registered on the SST Trainer — sub-symptom-threshold exercise rehab your patients run on their own phone, with every session syncing back to you.</p>

        <div class="code-box">
          <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">Your clinic code</p>
          <p class="code-display">${code}</p>
          <p style="margin: 4px 0 0; font-size: 12.5px; color: #64748b;">Patients enter this code in the app — it links their sessions to your clinic.</p>
        </div>

        <div class="link-block private">
          <p class="label">Your Clinical Hub</p>
          <a href="${hubUrl}">${hubUrl}</a>
          <p class="note">Keep this link private — it's your clinic's key. Anyone with it can view your patients' session data. Bookmark it; don't hand it to patients.</p>
        </div>

        <div class="link-block">
          <p class="label">Patient app link</p>
          <a href="${patientUrl}">${patientUrl}</a>
          <p class="note">This is the link you give patients — text or email it, or have them type it in the clinic. It carries your clinic code, so their graded test and training sessions flow straight to your hub.</p>
        </div>

        <div class="steps">
          <p style="font-weight: 700; margin-top: 0;">Getting started:</p>
          <div class="step">
            <div class="step-num">1</div>
            <div><strong>Open your Clinical Hub</strong> using the private link above and bookmark it — it's where every patient's threshold, training band and session history lives.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div><strong>Give a patient the app link</strong> — they open it on their phone, add it to their home screen, enter your clinic code and their name, and pair a heart-rate source (Bluetooth monitor or phone camera).</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div><strong>Watch their first session live</strong> — the graded test measures their heart-rate threshold, sets their sub-symptom training band, and appears in your hub in real time while they're on the bike or treadmill.</div>
          </div>
        </div>

        <p style="font-size: 14px; color: #475569;">The graded test is clinician-distributed — patients can only reach it through a registered clinic code like yours, so you stay in control of who runs it and when.</p>

        <div class="founding">
          <p style="margin: 0;"><strong>Founding clinic terms:</strong> Free during the founding period. When paid plans launch, founding clinics lock A$99/month for life.</p>
        </div>

        <p style="font-size: 14px; color: #475569; margin-top: 20px;">Questions, or want a hand onboarding your first patient? Just hit reply — I read every message.</p>

        <p style="margin-top: 24px;">Zac Lewis<br><span style="color: #64748b; font-size: 13.5px;">Osteopath · Concussion Education Australia</span></p>
      </div>
      <div class="footer">
        <p>Concussion Education Australia</p>
        <p>${CONFIG.CONTACT_EMAIL}</p>
      </div>
    </div>
  </body>
</html>`
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
