/**
 * POST /api/admin/send-outreach
 *
 * One-off admin endpoint: sends Melbourne June 13 workshop outreach
 * to all preview users, excluding specified contacts.
 *
 * Auth: x-admin-key header
 * Use ?dry=1 to preview recipients without sending.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 120

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
        <li>6 CPD hours on top of the full online course <strong>(14 CPD hours total)</strong></li>
        <li>Small group &mdash; capped at 20 per session</li>
      </ul>

      <p>Early bird pricing is <strong>$1,190 all-in</strong> (course + workshop) until June 30, then $1,400. If you're bringing a colleague, ask me about group pricing.</p>

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

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry') === '1'

  // Get all preview users
  const { rows: users } = await sql`
    SELECT id, email, name, access_level, nurture_unsubscribed, is_test
    FROM users
    WHERE access_level = 'preview'
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
        console.log(`[outreach] ✓ ${sent}. ${firstName} <${email}>`)
      } else {
        failed++
        failures.push({ email, error: 'sendEmail returned false' })
        console.log(`[outreach] ✗ ${email} — sendEmail returned false`)
      }

      // Rate limit: 100ms between sends
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ email, error: msg })
      console.log(`[outreach] ✗ ${email} — ${msg}`)
    }
  }

  console.log(`[outreach] Done: ${sent} sent, ${failed} failed`)

  return NextResponse.json({ sent, failed, failures, total: eligible.length })
}
