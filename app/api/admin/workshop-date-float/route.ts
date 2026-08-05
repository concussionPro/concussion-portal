/**
 * Workshop date-float / date-announce sends — via Resend, NEVER Mac Mail.
 *
 * WHY THIS EXISTS (2026-07-30): the July 8 Sydney date float went out through
 * Mac Mail (zac@ via Gmail SMTP) to 6 warm contacts and landed in junk —
 * discovered only when a recipient replied 3 weeks later "sorry, this had
 * gone to my junk mail". Auth on that path is clean (DKIM/SPF/DMARC all
 * pass); the junking is engagement/reputation-based: the same zac@ identity
 * has sent months of cold outreach, so recipient filters junk anything
 * unengaged from it. The Resend lane rides different sending IPs (SES),
 * carries List-Unsubscribe, and is the lane whose delivery we can observe.
 * RULE: any send to more than ~3 recipients goes through here, not Mail.
 *
 * Targets: workshop_interest rows for the given city (deduped by email),
 * plus optional extraEmails, minus excludeEmails. Suppression checked per
 * address, FAIL CLOSED. Audit-keyed per (city, dateSlug, email) with
 * rollback-on-failure, so re-POSTs retry failures but never double-send.
 *
 * GET  ?city=sydney&dateLabel=Saturday August 22   → dry-run preview
 * POST { city, dateLabel, venueLine?, extraEmails?, excludeEmails? } → send
 *
 * Auth: isAdminRequest (cookie or header).
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { CONFIG } from '@/lib/config'

export const maxDuration = 120

const CITY_LABELS: Record<string, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Perth',
}

interface FloatParams {
  city: string
  dateLabel: string
  venueLine: string
  extraEmails: string[]
  excludeEmails: string[]
}

/** Greeting only when the register's name field starts with something that
 *  reads as a real first name — otherwise "Hi," (register names include
 *  handles like "micahperry03" and annotated strings). */
function greetingFor(rawName: string | null): string {
  const first = (rawName || '').trim().split(/\s+/)[0] || ''
  if (/^[A-Za-z]{2,14}$/.test(first)) {
    const fixed = first[0].toUpperCase() + first.slice(1).toLowerCase()
    return `Hi ${fixed},`
  }
  return 'Hi,'
}

/** Owner's July 8 note, parameterized — his voice, plain, no design. */
function buildText(params: FloatParams, greeting: string): string {
  const cityLabel = CITY_LABELS[params.city] || params.city
  return `${greeting}

Just reaching out as you're on the register for the next available course.

We're looking at potentially running a ${cityLabel} date on ${params.dateLabel}.

${params.venueLine}

Early bird pricing is $${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-AU')} with immediate access to all online modules and clinical toolkit docs:
https://portal.concussion-education-australia.com/pricing

If you have a colleague that might want to come along, ask about our group pricing.

Let me know if that might work for you!

Zac
Founder, Concussion Education Australia`
}

/** Plain-text-styled HTML — a personal note, not a designed campaign. */
function toHtml(text: string, unsubscribeUrl: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = esc.replace(
    /https:\/\/portal\.concussion-education-australia\.com\/pricing/g,
    '<a href="https://portal.concussion-education-australia.com/pricing">portal.concussion-education-australia.com/pricing</a>',
  )
  const body = linked
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
  return `${body}<p style="margin:2em 0 0 0;font-size:12px;color:#888;"><a href="${unsubscribeUrl}" style="color:#888;">Unsubscribe</a> from workshop updates</p>`
}

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT EXISTS(SELECT 1 FROM email_suppression WHERE LOWER(email) = ${email.toLowerCase()}) AS exists
    `
    return rows[0]?.exists === true
  } catch (err) {
    console.error('[date-float] suppression check failed — FAIL CLOSED:', err)
    return true
  }
}

interface Target {
  email: string
  name: string | null
}

async function collectTargets(params: FloatParams): Promise<Target[]> {
  const { rows } = await sql`
    SELECT LOWER(email) AS email, MAX(name) AS name
    FROM workshop_interest
    WHERE city = ${params.city}
    GROUP BY LOWER(email)
  `
  const seen = new Set<string>()
  const targets: Target[] = []
  for (const r of rows as { email: string; name: string | null }[]) {
    if (!seen.has(r.email)) {
      seen.add(r.email)
      targets.push({ email: r.email, name: r.name })
    }
  }
  for (const e of params.extraEmails) {
    const lower = e.toLowerCase().trim()
    if (lower && !seen.has(lower)) {
      seen.add(lower)
      targets.push({ email: lower, name: null })
    }
  }
  const excluded = new Set(params.excludeEmails.map((e) => e.toLowerCase().trim()))
  return targets.filter((t) => !excluded.has(t.email))
}

function dateSlug(dateLabel: string): string {
  return dateLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

async function run(params: FloatParams, dryRun: boolean) {
  if (!CITY_LABELS[params.city]) {
    return NextResponse.json({ error: `Unknown city '${params.city}'` }, { status: 400 })
  }
  if (!params.dateLabel.trim()) {
    return NextResponse.json({ error: 'dateLabel required' }, { status: 400 })
  }
  const targets = await collectTargets(params)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const subject = `Concussion training ${CITY_LABELS[params.city]} — proposed date`
  const slug = dateSlug(`${params.city}-${params.dateLabel}`)

  const sent: string[] = []
  const skipped: { email: string; reason: string }[] = []
  const preview: { email: string; greeting: string }[] = []

  for (const t of targets) {
    if (await isSuppressed(t.email)) {
      skipped.push({ email: t.email, reason: 'suppressed' })
      continue
    }
    const greeting = greetingFor(t.name)
    if (dryRun) {
      preview.push({ email: t.email, greeting })
      continue
    }
    const auditKey = `date_float_${slug}_${t.email}`
    const { rowCount: inserted } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (!inserted) {
      skipped.push({ email: t.email, reason: 'already sent this float' })
      continue
    }
    let ok = false
    try {
      const unsubToken = generateUnsubscribeToken(t.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(t.email)}&token=${unsubToken}`
      const text = buildText(params, greeting)
      ok = await sendEmail({
        to: t.email,
        subject,
        html: toHtml(text, unsubscribeUrl),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          { name: 'type', value: 'workshop-date-float' },
          { name: 'sequence', value: `date-float-${params.city}` },
        ],
      })
    } catch (err) {
      console.error('[date-float] send threw:', err)
    }
    if (ok) {
      sent.push(t.email)
    } else {
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      skipped.push({ email: t.email, reason: 'send failed (audit rolled back — re-POST retries)' })
    }
    await new Promise((r) => setTimeout(r, 1200))
  }

  const sampleText = targets.length
    ? buildText(params, greetingFor(targets[0].name))
    : buildText(params, 'Hi,')
  return NextResponse.json({ dryRun, subject, targets: targets.length, sent, skipped, preview, sampleText })
}

function parseParams(src: { get: (k: string) => string | null } | Record<string, unknown>): FloatParams {
  const get = (k: string): unknown =>
    typeof (src as { get?: unknown }).get === 'function'
      ? (src as { get: (k: string) => string | null }).get(k)
      : (src as Record<string, unknown>)[k]
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? v.split(',') : []
  return {
    city: String(get('city') || ''),
    dateLabel: String(get('dateLabel') || ''),
    venueLine: String(get('venueLine') || 'It will be in the CBD, run from 8am-4pm with a catered 1hr lunch.'),
    extraEmails: list(get('extraEmails')),
    excludeEmails: list(get('excludeEmails')),
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run(parseParams(request.nextUrl.searchParams), true)
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch { /* empty body → params validation will 400 */ }
  return run(parseParams(body), false)
}
