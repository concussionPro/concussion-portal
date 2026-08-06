/**
 * POST /api/admin/send-outreach — BRICKED 2026-08-06 (Register C).
 *
 * One-off admin endpoint: mass-sent "Melbourne Saturday June 13th" workshop
 * outreach to every preview user.
 *
 * WHY IT IS BRICKED. Its sibling one-shot, scripts/send-melbourne-outreach.mjs,
 * was bricked on 2026-08-05 for shipping a dead June-2026 date — but the HTTP
 * twin that sends the SAME copy survived the sweep. Melbourne is
 * status 'completed' (ran 13 Jun 2026); this route would still email the whole
 * preview list "Would June 13 work for you? Reply yes and I'll hold your spot."
 * The body also claimed "6 CPD hours on top of the full online course
 * (16 CPD hours total)" — the practical day is
 * CONFIG.COURSE.IN_PERSON_CPD_POINTS (8) since the 2026-07-30 OA re-rate, so
 * the two numbers in one sentence did not even agree with each other.
 *
 * A future workshop-announce lane must derive its date/city/status from
 * CONFIG.LOCATIONS and its CPD figures from CONFIG.COURSE, never from literals.
 *
 * Auth: x-admin-key header
 * Use ?dry=1 to preview recipients without sending.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { CONFIG } from '@/lib/config'

export const maxDuration = 120

/** Typed `boolean` (not the literal `true`) so the fenced body below stays
 *  type-checked rather than being narrowed away as unreachable. */
const BRICKED: boolean = true

const EXCLUDE_EMAILS = new Set([
  'loladhunt@gmail.com',
  'john@zone34.com.au',
  'luke@ucphysio.physio',
  'stuart@ucphysio.physio',
  'admin@ucphysio.physio',
  'eddiehanna63@yahoo.com',
  'yeddiehanna63@yahoo.com',
  'info@evergreenosteopathy.com.au',
  'zac@thehealthlodge.com.au',
  'deborah.gilbert@live.com.au',
])

function getFirstName(name: string | null, email: string): string {
  let first = name ? name.split(' ')[0] : email.split('@')[0]
  if (first.includes('.') || first.includes('_') || first.length > 15 || /\d{3,}/.test(first)) {
    first = first.split(/[._]/)[0]
  }
  if (first === first.toLowerCase() && first.length > 1) {
    first = first.charAt(0).toUpperCase() + first.slice(1)
  }
  return first
}

function generateUnsubscribeToken(email: string): string {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET || ''
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex')
}

function buildEmail(firstName: string): string {
  const portalLink = 'https://portal.concussion-education-australia.com/'
  return `<!DOCTYPE html>
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
    .content ul { margin: 0 0 16px; padding-left: 20px; font-size: 15px; }
    .content li { margin-bottom: 6px; }
    .highlight { background: #f0fdfa; padding: 16px 20px; border-radius: 8px; border-left: 3px solid #0d9488; margin: 20px 0; font-size: 14px; }
    .cta { display: inline-block; padding: 14px 28px; background: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .sig { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar"></div>
    <div class="content">
      <p>Hi ${escapeHtml(firstName)},</p>

      <p>You signed up for our free SCAT6 course &mdash; so you get first access to this before we open it publicly.</p>

      <p>We're running a <strong>full-day Concussion Clinical Mastery workshop in Melbourne on Saturday June 13th</strong>. It's the hands-on training that the online course can't cover:</p>

      <ul>
        <li>SCAT6, VOMS &amp; BESS administration with expert coaching</li>
        <li>Practice on real subjects with immediate feedback</li>
        <li>${CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD hours on top of the full online course <strong>(${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours total)</strong></li>
        <li>Small group &mdash; capped at ${CONFIG.WORKSHOP.CAPACITY_PER_COURSE} per session</li>
      </ul>

      <p>The complete course is <strong>$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} all-in</strong> (online course + workshop). If you're bringing a colleague, ask me about group pricing.</p>

      <p>We're confirming numbers this week to lock in the venue &mdash; 8am to 4pm in the CBD.</p>

      <div class="highlight">
        <strong>Would June 13 work for you? Just reply &ldquo;yes&rdquo; and I'll hold your spot.</strong>
      </div>

      <p>You can start the online modules now:</p>

      <center><a href="${portalLink}" class="cta">Start the Online Course</a></center>

      <div class="sig">
        Zac Lewis<br>
        Osteopath &middot; Founder, Concussion Education Australia
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // BRICKED — see the file header. The payload names a workshop date that has
  // already run and a practical-day CPD figure that is two re-rates stale.
  // Deleting the route would lose the recipient-scoping SQL (suppression +
  // CRM-buyer exclusion) that a future lane should reuse, so it is fenced
  // instead. Remove this guard only alongside CONFIG-derived copy.
  if (BRICKED) {
    return NextResponse.json(
      {
        error: 'Gone — historical one-shot (Melbourne, 13 Jun 2026).',
        detail:
          'Copy names a completed workshop date and a stale practical-day CPD figure. Rebuild deriving from CONFIG.LOCATIONS + CONFIG.COURSE before re-enabling.',
      },
      { status: 410 },
    )
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry') === '1'

  // Get all preview users
  const { rows: users } = await sql`
    SELECT id, email, name, access_level, nurture_unsubscribed, is_test
    FROM users
    WHERE access_level = 'preview'
      -- CRM (EP stream) buyers carry access_level 'preview' (isolated streams,
      -- lib/crm-course.ts) — never treat a paying EP customer as a free lead.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(email) AND cp.course_slug = 'crm'
      )
      -- Master blacklist — nurture_unsubscribed alone misses bounces,
      -- complaints, STOP replies and cold-prospect unsubs.
      AND NOT EXISTS (
        SELECT 1 FROM email_suppression es WHERE LOWER(es.email) = LOWER(users.email)
      )
    ORDER BY created_at DESC
  `

  const eligible = users.filter(u => {
    if (u.is_test) return false
    if (u.nurture_unsubscribed) return false
    const email = (u.email || '').toLowerCase().trim()
    return !EXCLUDE_EMAILS.has(email)
  })

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: eligible.length,
      recipients: eligible.map(u => ({
        email: u.email,
        name: u.name,
        firstName: getFirstName(u.name, u.email),
      })),
    })
  }

  // Send emails
  const baseUrl = 'https://portal.concussion-education-australia.com'
  let sent = 0
  let failed = 0
  const failures: { email: string; error: string }[] = []

  for (const user of eligible) {
    const email = user.email.toLowerCase().trim()
    const firstName = getFirstName(user.name, email)
    const unsubToken = generateUnsubscribeToken(email)
    const unsubUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    try {
      const ok = await sendEmail({
        to: email,
        subject: 'Concussion Clinical Mastery Melbourne',
        html: buildEmail(firstName),
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          { name: 'type', value: 'melbourne-workshop-outreach' },
          { name: 'campaign', value: 'melb-june13' },
        ],
      })

      if (ok) {
        sent++
        console.log(`[outreach] ✓ ${sent}. ${firstName} <${email.slice(0, 3)}***>`)
      } else {
        failed++
        failures.push({ email, error: 'sendEmail returned false' })
        console.log(`[outreach] ✗ ${email.slice(0, 3)}*** — sendEmail returned false`)
      }

      // Rate limit: 100ms between sends
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ email, error: msg })
      console.log(`[outreach] ✗ ${email.slice(0, 3)}*** — ${msg}`)
    }
  }

  console.log(`[outreach] Done: ${sent} sent, ${failed} failed`)

  return NextResponse.json({ sent, failed, failures, total: eligible.length })
}
