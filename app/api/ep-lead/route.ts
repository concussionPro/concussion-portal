/**
 * EP lead-capture API — the free "EP's Concussion Rehab Starter" magnet.
 *
 * The Concussion Rehab Mastery (EP-scoped) landing runs top-spot in the ESSA
 * member newsletter (~7,500 Accredited Exercise Physiologists). Most visitors
 * won't buy a $497–$1,400 course on the first click, so this endpoint captures
 * the not-ready-to-buy majority: it creates (or re-captures) a user with
 * signupSource='ep-course' — the CONTRACT the EP nurture cron keys on, do NOT
 * change the tag — and fires a Day-0 email delivering the promised resource.
 *
 * Mirrors app/api/signup-free/route.ts (createUser + analytics INSERT +
 * email_audit_log dedupe + Resend send) but:
 *   • source tag 'ep-course' (not 'free-course'),
 *   • lead magnet + link to the landing page instead of a Module-1 deep link,
 *   • no session cookie (this is a lead capture, not an enrolment),
 *   • existing email is treated as re-capture, never an error, and the
 *     audit-log guard means a repeat capture doesn't re-send the Day-0 email.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { getClientIp } from '@/lib/get-client-ip'

// Rate limiting (per-process, best-effort — same shape as signup-free)
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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email, name } = body as { email?: string; name?: string }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Rate limit by IP and email
    if (!checkRateLimit(`ip:${ip}`, 10) || !checkRateLimit(`email:${email.toLowerCase()}`, 3)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const userName = (name || email.split('@')[0]).slice(0, 100)

    // Create OR re-capture — existing email is never an error. createUser
    // upserts; signup_source stays 'ep-course' (COALESCE keeps the first
    // non-null source, and records converted_from if they arrived another way).
    const existingUser = await findUserByEmail(email)
    const userId = await createUser({
      email,
      name: userName,
      accessLevel: 'preview',
      signupSource: 'ep-course',
    })
    console.log(
      `[ep-lead] ${existingUser ? 're-captured' : 'new'} EP lead: ${email.slice(0, 3)}***`
    )

    // Log analytics event (server-side — mirrors signup-free)
    try {
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
        VALUES (
          'ep_lead_capture',
          ${JSON.stringify({ name: userName, isExisting: !!existingUser })}::jsonb,
          ${'server_' + Date.now()},
          ${Date.now()},
          ${request.headers.get('user-agent') || 'unknown'},
          ${request.headers.get('referer') || null},
          '/api/ep-lead',
          ${null},
          ${ip},
          ${request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null}
        )
      `
    } catch (err) {
      console.error('[ep-lead] Failed to log analytics:', err)
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const coursePageUrl = `${baseUrl}/concussion-rehab-mastery`

    // Unsubscribe URL (one-click header + footer link — bulk-sender compliant)
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    // Record Day-0 audit BEFORE sending so a crash + re-run won't double-send,
    // AND so a re-capture (existing lead) doesn't re-send. RETURNING tells us
    // whether THIS request is the one that inserted the row — only then send.
    const auditKey = `ep_lead_day0_${userId}`
    const { rows: auditRows } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
      RETURNING audit_key
    `
    const isFirstDay0 = auditRows.length > 0

    if (isFirstDay0) {
      const emailSent = await sendEmail({
        to: email,
        subject: 'Your EP Concussion Rehab Starter — the measured-threshold workflow',
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
                .container { max-width: 580px; margin: 0 auto; background: white; }
                .header-bar { height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); }
                .content { padding: 32px 28px; }
                .content p { margin: 0 0 16px; font-size: 15px; }
                .cta-btn { display: inline-block; padding: 14px 28px; background: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
                .callout { background: #f0fdfa; padding: 16px 20px; border-radius: 8px; border-left: 3px solid #0d9488; margin: 20px 0; font-size: 14px; }
                .sig { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
                .footer { padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header-bar"></div>
                <div class="content">
                  <p>Hi ${escapeHtml(userName.split(' ')[0])},</p>

                  <p>Here&rsquo;s your <strong>EP&rsquo;s Concussion Rehab Starter</strong> — the piece most clinicians never get handed: how to turn a Buffalo test into a measured, in-scope exercise prescription.</p>

                  <div class="callout">
                    <strong>Inside the Starter:</strong><br><br>
                    &#8226; The measured-threshold workflow &mdash; Buffalo test &rarr; heart-rate threshold (HRt) &rarr; the 80&ndash;90% sub-symptom-threshold training band<br>
                    &#8226; The plain-English scope guide &mdash; exactly where the exercise-physiology lane starts and stops (you implement and progress; you don&rsquo;t diagnose or clear)<br>
                    &#8226; Why sub-symptom-threshold aerobic exercise is now first-line under the Amsterdam 2023 consensus &mdash; and why that makes concussion rehab exercise medicine
                  </div>

                  <center>
                    <a href="${coursePageUrl}" class="cta-btn">Read the Starter &amp; see the full course</a>
                  </center>

                  <p style="font-size: 14px; color: #475569;">The course itself &mdash; 8 EP-scoped modules, the working clinical tools, and the optional practical day &mdash; is here: <a href="${coursePageUrl}" style="color: #0d9488;">Concussion Rehab Mastery</a>.</p>

                  <p>Questions? Just reply &mdash; I read every message.</p>

                  <div class="sig">
                    Zac Lewis<br>
                    Osteopath &middot; Founder, Concussion Education Australia
                  </div>
                </div>
                <div class="footer">
                  Concussion Education Australia<br>
                  <a href="${unsubscribeUrl}" style="color: #94a3b8; font-size: 11px;">Unsubscribe</a>
                </div>
              </div>
            </body>
          </html>
        `,
        tags: [
          { name: 'sequence', value: 'ep-course' },
          { name: 'day', value: '0' },
        ],
      })

      if (!emailSent) {
        console.warn(`[ep-lead] Day-0 email failed for ${email.slice(0, 3)}***`)
      }
    }

    // Always succeed for a valid capture (new or repeat) so the form UX is
    // identical whether or not this was the first Day-0 send.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ep-lead] capture error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
