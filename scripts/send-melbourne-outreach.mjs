// HISTORICAL SEND — BRICKED 2026-08-05. This script mass-sends immediately
// with June-2026 workshop dates/pricing (now false) and NEVER checked
// email_suppression. Do not resurrect without: --live gating, suppression
// fail-closed, per-recipient audit log, and CONFIG-derived copy.
throw new Error('send-melbourne-outreach is a historical one-shot (June 2026) — bricked. See header.')

/**
 * One-off outreach: Melbourne June 13 workshop email to all preview users.
 * Run: node scripts/send-melbourne-outreach.mjs
 */

import { Resend } from 'resend'
import crypto from 'crypto'
import { readFileSync } from 'fs'

// Load env
const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const RESEND_API_KEY = env.RESEND_API_KEY
const ADMIN_API_KEY = env.ADMIN_API_KEY
const SESSION_SECRET = env.SESSION_SECRET || env.MAGIC_LINK_SECRET || env.JWT_SECRET
const BASE_URL = 'https://portal.concussion-education-australia.com'
const FROM = 'Concussion Education Australia <zac@concussion-education-australia.com>'

if (!RESEND_API_KEY || !ADMIN_API_KEY || !SESSION_SECRET) {
  console.error('Missing env vars'); process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

function generateUnsubscribeToken(email) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(email.toLowerCase()).digest('hex')
}

// Exclusions
const EXCLUDE = new Set([
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

function getFirstName(name, email) {
  let first = name ? name.split(' ')[0] : email.split('@')[0]
  // Clean up usernames that are clearly not names
  if (first.includes('.') || first.includes('_') || first.length > 15 || /\d{3,}/.test(first)) {
    // Try to extract something usable
    first = first.split(/[._]/)[0]
  }
  // Capitalise
  if (first === first.toLowerCase() && first.length > 1) {
    first = first.charAt(0).toUpperCase() + first.slice(1)
  }
  return first
}

function buildEmail(firstName) {
  const portalLink = `${BASE_URL}/`
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
    .footer { padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar"></div>
    <div class="content">
      <p>Hi ${firstName},</p>

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

async function main() {
  // Fetch users
  const res = await fetch(`${BASE_URL}/api/admin/emails`, {
    headers: { 'x-admin-key': ADMIN_API_KEY },
  })
  const data = await res.json()
  const users = data.emails || []

  const eligible = users.filter(u => {
    if (u.accessLevel !== 'preview') return false
    if (u.isTest) return false
    if (u.nurtureUnsubscribed) return false
    const email = (u.email || '').toLowerCase().trim()
    if (EXCLUDE.has(email)) return false
    return true
  })

  console.log(`Sending to ${eligible.length} recipients...\n`)

  let sent = 0
  let failed = 0
  const failures = []

  for (const user of eligible) {
    const email = user.email.toLowerCase().trim()
    const firstName = getFirstName(user.name, email)
    const unsubToken = generateUnsubscribeToken(email)
    const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    try {
      await resend.emails.send({
        from: FROM,
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
      sent++
      console.log(`  ✓ ${sent}. ${firstName} <${email}>`)

      // Rate limit: 100ms between sends
      await new Promise(r => setTimeout(r, 100))
    } catch (err) {
      failed++
      failures.push({ email, error: err.message || String(err) })
      console.log(`  ✗ FAILED: ${email} — ${err.message}`)
    }
  }

  console.log(`\n--- DONE ---`)
  console.log(`Sent: ${sent}`)
  console.log(`Failed: ${failed}`)
  if (failures.length > 0) {
    console.log('Failures:', JSON.stringify(failures, null, 2))
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
