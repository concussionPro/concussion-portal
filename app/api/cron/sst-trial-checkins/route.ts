/**
 * SST trial check-ins — the Wibbi onboarding pattern (2026-07-31 PMS review):
 * "personalised 1:1 guidance throughout onboarding and a proactive check-in
 * before the trial ends." A threshold-protocol tool does not self-serve; the
 * trial window is where we teach the protocol or lose the clinic. We were
 * letting trials expire silently.
 *
 * Our trial is patient-capped (3 free patients), not time-boxed, so the two
 * triggers are usage-shaped:
 *
 *  1. ACTIVATION nudge — clinic workspace ≥4 days old with ZERO sessions:
 *     offer the 15-minute walkthrough. Once per clinic.
 *  2. CAP check-in — trial clinic with ≥2 distinct patients (approaching the
 *     3-patient cap): check in on how the first episodes went + the upgrade
 *     path. Once per clinic. (= Wibbi's "few days before the trial ends".)
 *
 * Personal plain-text emails from Zac (no design — these read as founder
 * 1:1s, not campaigns). Suppression checked FAIL CLOSED. Audit-keyed.
 * Demo/owner workspaces excluded. Daily 22:45 UTC.
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { isOwnerEmail } from '@/lib/owner'

function redact(e: string) { return e.length > 3 ? e.slice(0, 3) + '***' : '***' }

export const maxDuration = 60

const EXCLUDED_CODES = new Set(['DEMO00'])

interface ClinicRow {
  code: string
  clinic_name: string
  contact_name: string
  email: string
  plan: string
  created_at: string
  patients: number
  sessions: number
}

function activationEmail(c: ClinicRow): { subject: string; text: string } {
  const first = (c.contact_name || '').trim().split(/\s+/)[0] || ''
  return {
    subject: 'Getting set up with SST?',
    text: `Hi${first ? ' ' + first : ''},

I saw the ${c.clinic_name} workspace is set up but no patient sessions have come through yet — if anything's in the way, happy to jump on a 15-minute walkthrough and get your first patient running on the protocol.

Just reply and I'll sort a time that suits.

Zac
Founder, Concussion Education Australia`,
  }
}

function capEmail(c: ClinicRow): { subject: string; text: string } {
  const first = (c.contact_name || '').trim().split(/\s+/)[0] || ''
  return {
    subject: 'Your SST trial — how are the first episodes going?',
    text: `Hi${first ? ' ' + first : ''},

You've got ${c.patients} patients running through SST at ${c.clinic_name} — keen to hear how the first episodes have gone, and whether the reports are landing the way your team needs.

Your trial includes 3 patients. When you're ready to open it up, clinic plans start at A$49/month flat (cancel anytime) — you can upgrade from your workspace, or just reply and I'll set it up with you.

If a walkthrough for the rest of the team would help, happy to do that too.

Zac
Founder, Concussion Education Australia`,
  }
}

function toHtml(text: string, unsubscribeUrl: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const body = esc
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
  return `${body}<p style="margin:2em 0 0 0;font-size:12px;color:#888;"><a href="${unsubscribeUrl}" style="color:#888;">Unsubscribe</a></p>`
}

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT EXISTS(SELECT 1 FROM email_suppression WHERE LOWER(email) = ${email.toLowerCase()}) AS exists
    `
    return rows[0]?.exists === true
  } catch (err) {
    console.error('[sst-checkins] suppression check failed — FAIL CLOSED:', err)
    return true
  }
}

export async function GET(request: Request) {
  try {
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured — refusing to run')
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (!authHeader || authHeader.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
    // plan column is added lazily by setSstClinicPlan — mirror the guard here
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'`

    const { rows } = await sql`
      SELECT c.code, c.clinic_name, c.contact_name, c.email, c.plan, c.created_at,
        (SELECT COUNT(DISTINCT s.patient_label) FROM sst_clinic_sessions s WHERE s.clinic_code = c.code) AS patients,
        (SELECT COUNT(*) FROM sst_clinic_sessions s WHERE s.clinic_code = c.code) AS sessions
      FROM sst_clinics c
      WHERE c.email IS NOT NULL AND c.email <> ''
    `

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const sent: string[] = []
    const skipped: string[] = []

    for (const raw of rows as unknown as ClinicRow[]) {
      const c = { ...raw, patients: Number(raw.patients), sessions: Number(raw.sessions) }
      if (EXCLUDED_CODES.has(c.code) || isOwnerEmail(c.email)) continue
      if (c.plan === 'active') continue

      const ageDays = (Date.now() - new Date(c.created_at).getTime()) / 86400000
      let kind: 'activation' | 'cap' | null = null
      if (c.sessions === 0 && ageDays >= 4) kind = 'activation'
      else if (c.patients >= 2) kind = 'cap'
      if (!kind) continue

      const auditKey = `sst_checkin_${kind}_${c.code}`
      const { rowCount: inserted } = await sql`
        INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
        ON CONFLICT (audit_key) DO NOTHING
      `
      if (!inserted) continue

      if (await isSuppressed(c.email)) {
        skipped.push(`${redact(c.email)} (suppressed)`)
        continue
      }

      const { subject, text } = kind === 'activation' ? activationEmail(c) : capEmail(c)
      const unsubToken = generateUnsubscribeToken(c.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(c.email)}&token=${unsubToken}`
      let ok = false
      try {
        ok = await sendEmail({
          to: c.email,
          subject,
          html: toHtml(text, unsubscribeUrl),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          tags: [
            { name: 'type', value: 'sst-trial-checkin' },
            { name: 'sequence', value: `sst-checkin-${kind}` },
          ],
        })
      } catch (err) {
        console.error('[sst-checkins] send threw:', err)
      }
      if (ok) {
        sent.push(`${redact(c.email)} (${kind})`)
      } else {
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
        skipped.push(`${redact(c.email)} (send failed — will retry)`)
      }
    }

    // ── Tier-fit watchdog (2026-08-04: tiers were honor-system — a
    // 15-clinician clinic could pay $49 forever). SOFT enforcement: active
    // patients in the last 30 days proxy the caseload a tier honestly covers
    // (single ≈ one practitioner ≈ ≤15 active; clinic ≤60; enterprise ∞).
    // NEVER blocks writes (clinical-safety rule) — reports to Zac monthly;
    // he decides who gets the tier conversation.
    try {
      const TIER_ACTIVE_ALLOWANCE: Record<string, number> = { single: 15, clinic: 60 }
      const { rows: activeClinics } = await sql`
        SELECT c.code, c.clinic_name, c.email, c.tier,
          (SELECT COUNT(DISTINCT COALESCE(
             NULLIF(trim(coalesce(s.payload->>'patientRef','')), ''),
             NULLIF(trim(coalesce(s.patient_label,'')), '')))
           FROM sst_clinic_sessions s
           WHERE s.clinic_code = c.code AND s.created_at > NOW() - INTERVAL '30 days') AS active_patients
        FROM sst_clinics c WHERE c.plan = 'active'
      `
      const over = (activeClinics as { code: string; clinic_name: string; tier: string | null; active_patients: number }[])
        .filter((c) => {
          const allowance = TIER_ACTIVE_ALLOWANCE[c.tier || 'single']
          return allowance !== undefined && Number(c.active_patients) > allowance
        })
      if (over.length > 0) {
        const monthKey = new Date().toISOString().slice(0, 7)
        const { rowCount: fresh } = await sql`
          INSERT INTO email_audit_log (audit_key, sent_at)
          VALUES (${'sst_tierfit_' + monthKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (fresh) {
          const lines = over.map((c) =>
            `- ${c.clinic_name} (${c.code}): tier=${c.tier || 'single'}, ${c.active_patients} active patients / 30d`).join('\n')
          await sendEmail({
            to: 'zac@concussion-education-australia.com',
            subject: `SST tier fit — ${over.length} clinic(s) above their plan's caseload`,
            html: toHtml(`Caseload anomaly signal (seats are the enforcement; this is the smell test — nothing was blocked):\n\n${lines}\n\nAllowances: single ≤15 active/30d · clinic ≤60 · enterprise unlimited.`, '#'),
            tags: [{ name: 'type', value: 'sst-tierfit' }],
          })
        }
      }
    } catch (err) {
      console.error('[sst-checkins] tier-fit watchdog failed (non-fatal):', err)
    }

    return NextResponse.json({ sent, skipped })
  } catch (err) {
    console.error('[sst-checkins] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
