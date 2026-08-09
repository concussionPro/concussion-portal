/**
 * International syllabus capture — the /uk & /pricing-international middle step.
 *
 * WHY (2026-07-30 UK-lane audit): every CSP-referred session was a one-page
 * visit — including readers spending 2–13 MINUTES on the page — because the
 * page offered exactly two options: pay £275 now, or leave. This endpoint is
 * the low-commitment step: "email me the full syllabus" turns those engaged
 * readers into nurturable leads instead of ghosts.
 *
 * Mirrors app/api/ep-lead/route.ts (createUser + analytics + audit-keyed
 * Day-0 send) but with signupSource='intl-syllabus' — deliberately NOT
 * 'ep-course' (that tag is the EP-nurture cron's contract) and NOT
 * 'free-course' (that cohort's automations assume the free SCAT course).
 * The Day-0 email delivers the real CCM syllabus (titles from data/modules.ts)
 * plus the live tool demos and an enrol CTA.
 */

import { PROTOCOL_DOI, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { getClientIp } from '@/lib/get-client-ip'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** The real CCM curriculum — titles must match data/modules.ts exactly. */
const CCM_MODULES = [
  'What is a Concussion?',
  'Concussion Diagnosis & Initial Assessment',
  'Practical Assessment & Acute Concussion Management',
  'Persistent Post-Concussive Symptoms & Long-Term Management',
  'Multidisciplinary Approach to Concussion Management',
  'Return to Play, Work, and School Protocols',
  'Rehabilitation Pathways by Phenotype',
  'Legal, Ethical, Communication & Documentation',
]

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email, location, priceDisplay } = body as {
      email?: string
      location?: string
      priceDisplay?: string
    }

    const captureLocation =
      typeof location === 'string'
        ? location.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'international'
        : 'international'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!checkRateLimit(`ip:${ip}`, 10) || !checkRateLimit(`email:${email.toLowerCase()}`, 3)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Display-only price echo, whitelisted to the shapes intlPriceForCountry
    // emits (e.g. "£275", "USD $347", "CA$475") — never trusted for billing.
    const safePrice =
      typeof priceDisplay === 'string' && /^[A-Z$£€\d\s.,]{2,14}$/.test(priceDisplay)
        ? priceDisplay
        : null

    const existingUser = await findUserByEmail(email)
    const userId = await createUser({
      email,
      name: email.split('@')[0].slice(0, 100),
      accessLevel: 'preview',
      signupSource: 'intl-syllabus',
    })

    try {
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
        VALUES (
          'intl_syllabus_capture',
          ${JSON.stringify({ isExisting: !!existingUser, location: captureLocation })}::jsonb,
          ${'server_' + Date.now()},
          ${Date.now()},
          ${request.headers.get('user-agent') || 'unknown'},
          ${request.headers.get('referer') || null},
          '/api/intl-syllabus',
          ${null},
          ${ip},
          ${request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null}
        )
      `
    } catch (err) {
      console.error('[intl-syllabus] analytics log failed:', err)
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const pageUrl = captureLocation === 'uk' ? `${baseUrl}/uk` : `${baseUrl}/pricing-international`
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    const auditKey = `intl_syllabus_day0_${userId}`
    const { rows: auditRows } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
      RETURNING audit_key
    `

    // MASTER BLACKLIST — Day-0 lead magnet on a PUBLIC endpoint. Fails closed.
    if (auditRows.length > 0 && !(await isEmailSuppressed(email))) {
      const moduleRows = CCM_MODULES.map(
        (t, i) =>
          `<tr><td style="padding:7px 12px 7px 0;font-size:13px;color:#0d9488;font-weight:700;white-space:nowrap;vertical-align:top;">Module ${i + 1}</td><td style="padding:7px 0;font-size:14px;color:#1e293b;">${escapeHtml(t)}</td></tr>`
      ).join('')
      const emailSent = await sendEmail({
        to: email,
        subject: 'Concussion Clinical Mastery — the full syllabus',
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.7;color:#1e293b;background:#f8fafc;margin:0;padding:0;">
              <div style="max-width:580px;margin:0 auto;background:white;">
                <div style="height:4px;background:linear-gradient(90deg,#0d9488,#0ea5e9);"></div>
                <div style="padding:32px 28px;">
                  <p style="margin:0 0 16px;font-size:15px;">Hi,</p>
                  <p style="margin:0 0 16px;font-size:15px;">Here's the full syllabus for <strong>Concussion Clinical Mastery</strong> — 8 assessed modules, 8 CPD hours, self-paced online.</p>
                  <table style="border-collapse:collapse;margin:8px 0 20px;">${moduleRows}</table>
                  <p style="margin:0 0 16px;font-size:15px;">Every enrolment also includes the working clinical platform — SCAT6 baseline &amp; serial testing, the SST Trainer app and the BCTT calculator. You can try both exactly as a patient or clinician would, no login:</p>
                  <p style="margin:0 0 6px;font-size:14px;">&bull; <a href="${baseUrl}/sst-trainer?clinic=DEMO00" style="color:#0d9488;font-weight:600;">SST Trainer — live demo</a></p>
                  <p style="margin:0 0 20px;font-size:14px;">&bull; <a href="${baseUrl}/preseason/b/DEMO00" style="color:#0d9488;font-weight:600;">Baseline testing — live demo</a></p>
                  <p style="margin:0 0 16px;font-size:15px;">The clinical protocol the course teaches is published open-access: <a href="${PROTOCOL_DOI_URL}" style="color:#0d9488;">${PROTOCOL_DOI}</a></p>
                  <div style="background:#f0fdfa;padding:16px 20px;border-radius:8px;border-left:3px solid #0d9488;margin:20px 0;font-size:14px;">
                    Certificate and CPD-hours statement provided on completion for your portfolio${safePrice ? ` &middot; enrolment is ${escapeHtml(safePrice)}` : ''} &middot; 7-day money-back guarantee.
                  </div>
                  <p style="margin:20px 0;"><a href="${pageUrl}" style="display:inline-block;padding:14px 28px;background:#0d9488;color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View the course &amp; enrol</a></p>
                  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:14px;color:#64748b;">
                    Zac Lewis<br/>Osteopath &middot; Founder, Concussion Education Australia
                  </div>
                </div>
                <div style="padding:16px 28px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;">
                  <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
                </div>
              </div>
            </body>
          </html>`,
        tags: [
          { name: 'type', value: 'intl-syllabus' },
          { name: 'sequence', value: 'intl-syllabus-day0' },
        ],
      })
      if (!emailSent) {
        // Roll the audit claim back so a retry can re-send.
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
        return NextResponse.json({ error: 'Send failed — please try again.' }, { status: 502 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[intl-syllabus] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
