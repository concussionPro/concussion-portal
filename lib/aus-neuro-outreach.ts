import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'

/**
 * Aus-Neuro outreach lane — Resend-based (owner 2026-07-30: "you should be
 * using Resend for that, not Mac Mail"). Sends the bespoke SST pitch to
 * stream='aus-neuro' clinics from prospect_clinics.
 *
 * RULES (inherited from the engine, non-negotiable):
 *  - email_suppression checked per address, FAIL CLOSED (zero-tolerance unsubs)
 *  - never sends to placeholder addresses (*.pending.local)
 *  - only status='approved' rows send; success flips status→'sent' so a row
 *    can never double-send
 *  - copy = owner's locked structure: intro line verbatim → per-clinic
 *    bespoke_hook → frame-specific core → /clinics link → Founder sign-off
 *
 * TWO FRAMES:
 *  - 'concussion' (dedicated concussion/vestibular clinics): today's locked core
 *  - 'neuro-wide' (general neuro practices): the aerobic-dose framing across
 *    stroke/PD/MS caseloads with the concussion protocol included — claims are
 *    dose-fidelity/verification only, never outcomes (SPARX/AHA anchor the
 *    prescriptions, not the software)
 */

export interface AusNeuroClinic {
  slug: string
  name: string
  contact_first_name: string | null
  contact_email: string
  bespoke_hook: string | null
  frame: string | null
}

const SUBJECT = 'Measured sub-threshold concussion rehab'
const SUBJECT_WIDE = 'Measured graded return-to-activity — on the patient’s own watch'

const INTRO =
  'I run Concussion Education Australia — our goals are to help clinicians deliver the best concussion care to their patients possible.'

const CORE_CONCUSSION = `SST Trainer is a patient app plus a clinician dashboard for measured sub-threshold rehab.

Prescribing takes one clinic code: your patient runs the guided threshold test on their phone, then trains to their prescribed band on the watch they already own — Garmin, Polar, or any heart-rate strap.

You get every home session verified as it happens, the live recovery trajectory on your dashboard, and the GP report and RTP data summary rendering straight from the episode — filed into the patient's Cliniko file.`

const CORE_WIDE = `SST Trainer is a patient app plus a clinician dashboard for heart-rate-dosed rehab.

Across a neuro caseload the aerobic dose is the therapy — post-stroke conditioning, Parkinson's intensity programs, MS pacing — and at home it runs unverified. SST puts the prescription on the patient's own watch — Garmin, Polar, or any heart-rate strap: you set the band, every session verifies live, and the trajectory and reports build themselves.

The concussion protocol — guided symptom-threshold testing, sub-threshold training, RTP documentation — ships with it.`

const CLOSE = `See it exactly as your patient would — the trainer, the workspace and sample reports, no login:

portal.concussion-education-australia.com/clinics

Zac Lewis · Osteopath · Member, Sports Medicine Australia
Founder, Concussion Education Australia`

export function buildAusNeuroEmail(c: AusNeuroClinic): { subject: string; text: string } {
  const wide = c.frame === 'neuro-wide'
  const greet = c.contact_first_name && c.contact_first_name !== 'there' ? `Hi ${c.contact_first_name},` : 'Hi team,'
  const parts = [greet, '', INTRO]
  if (c.bespoke_hook) parts.push('', c.bespoke_hook)
  parts.push('', wide ? CORE_WIDE : CORE_CONCUSSION, '', CLOSE)
  return { subject: wide ? SUBJECT_WIDE : SUBJECT, text: parts.join('\n') }
}

/** Plain-text-styled HTML (cold notes must not look designed). */
function toHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = esc.replace(
    /portal\.concussion-education-australia\.com\/clinics/g,
    '<a href="https://portal.concussion-education-australia.com/clinics">portal.concussion-education-australia.com/clinics</a>',
  )
  return linked
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 1em 0;font-family:inherit;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT EXISTS(SELECT 1 FROM email_suppression WHERE LOWER(email) = ${email.toLowerCase()}) AS exists
    `
    return rows[0]?.exists === true
  } catch (err) {
    console.error('[aus-neuro] suppression check failed — FAIL CLOSED:', err)
    return true
  }
}

export async function sendDueAusNeuro(limit = 10): Promise<{ sent: string[]; skipped: string[] }> {
  const { rows } = await sql`
    SELECT slug, name, contact_first_name, contact_email, bespoke_hook, frame
    FROM prospect_clinics
    WHERE stream = 'aus-neuro' AND status = 'approved'
      AND contact_email NOT LIKE '%pending.local%'
    ORDER BY name LIMIT ${limit}
  `
  const sent: string[] = []
  const skipped: string[] = []
  for (const c of rows as unknown as AusNeuroClinic[]) {
    if (await isSuppressed(c.contact_email)) {
      skipped.push(`${c.contact_email} (suppressed)`)
      continue
    }
    if (!c.bespoke_hook) {
      skipped.push(`${c.contact_email} (no bespoke hook — refuse generic send)`)
      continue
    }
    const { subject, text } = buildAusNeuroEmail(c)
    const ok = await sendEmail({
      to: c.contact_email,
      subject,
      html: toHtml(text),
      tags: [
        { name: 'type', value: 'aus-neuro-outreach' },
        { name: 'sequence', value: 'aus-neuro-r1' },
      ],
    })
    if (ok) {
      await sql`UPDATE prospect_clinics SET status = 'sent', scheduled_send_at = NOW() WHERE slug = ${c.slug}`
      sent.push(c.contact_email)
    } else {
      skipped.push(`${c.contact_email} (send failed)`)
    }
    // Gentle spacing inside the batch
    await new Promise((r) => setTimeout(r, 1500))
  }
  return { sent, skipped }
}
