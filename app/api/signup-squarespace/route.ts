/**
 * POST /api/signup-squarespace
 *
 * Lightweight endpoint called by Squarespace footer JS when a form is submitted.
 * Creates a preview portal account and sends Day 0 welcome email.
 *
 * No auth required — damage potential is minimal (creates free accounts only).
 * Protected by: email dedup, audit log dedup, rate limiting by IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.concussion-education-australia.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting: max 10 signups per IP per hour
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { rows: recentFromIp } = await sql`
      SELECT COUNT(*) as cnt FROM email_audit_log
      WHERE audit_key LIKE ${'ss_form_' + ip + '_%'}
      AND sent_at > NOW() - INTERVAL '1 hour'
    `
    if (recentFromIp[0]?.cnt > 10) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: CORS_HEADERS })
    }

    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()
    const name = (body.name || '').trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: CORS_HEADERS })
    }

    // Honeypot field — if filled, it's a bot
    if (body.website) {
      return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
    }

    // Skip if user already exists
    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already registered' }, { headers: CORS_HEADERS })
    }

    // Dedup via audit log
    const auditKey = `ss_form_signup_${email}`
    const { rowCount: inserted } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (inserted === 0) {
      return NextResponse.json({ success: true, message: 'Already processed' }, { headers: CORS_HEADERS })
    }

    // Rate limit audit (for IP tracking)
    await sql`
      INSERT INTO email_audit_log (audit_key, sent_at)
      VALUES (${`ss_form_${ip}_${Date.now()}`}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `

    const userName = name || email.split('@')[0]

    const userId = await createUser({
      email,
      name: userName,
      accessLevel: 'preview',
      signupSource: 'squarespace',
    })

    // Send Day 0 welcome email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const loginLink = generateMagicLinkJWT(userId, email, userName, 'preview', baseUrl)
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`
    const preseasonLink = `${baseUrl}/preseason`

    await sendEmail({
      to: email,
      subject: 'Your concussion education portal account is ready',
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: buildWelcomeEmail(escapeHtml(userName), loginLink, preseasonLink, unsubscribeUrl),
      tags: [
        { name: 'sequence', value: 'scat-mastery' },
        { name: 'day', value: '0' },
        { name: 'source', value: 'squarespace-form' },
      ],
    })

    // Record Day 0 audit so cron won't re-send
    await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`

    console.log(`[SS Form] Created + emailed: ${email}`)

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('[SS Form] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500, headers: CORS_HEADERS })
  }
}

function buildWelcomeEmail(userName: string, loginLink: string, preseasonLink: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      .header { background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); padding: 40px 24px; text-align: center; }
      .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
      .header p { margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; }
      .content { padding: 32px 24px; }
      .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
      .button-secondary { display: inline-block; padding: 14px 28px; background: white; color: #3b82f6; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 12px 0; border: 2px solid #3b82f6; }
      .highlight { background: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; }
      .tool-card { background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 16px 0; }
      .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>We've built you something new</h1>
        <p>Concussion Education Australia now has a dedicated learning portal</p>
      </div>
      <div class="content">
        <h2 style="margin-top: 0;">Hi ${userName},</h2>
        <p>You signed up for SCAT resources through our website. We've since built a dedicated learning portal with free clinical tools and courses &mdash; and your account is already set up.</p>

        <div class="highlight">
          <strong>Free SCAT6/SCOAT6 Mastery Course (~3 hours, 2 CPD points):</strong><br><br>
          &bull; Step-by-step SCAT6 &amp; SCOAT6 administration<br>
          &bull; Red flag recognition and escalation criteria<br>
          &bull; When to use SCAT6 vs SCOAT6<br>
          &bull; Clinical toolkit: referral templates, RTP forms<br>
          &bull; Certificate + 2 AHPRA-aligned CPD points on completion
        </div>

        <center>
          <a href="${loginLink}" class="button">
            Access the Free Course &rarr;
          </a>
        </center>

        <div class="tool-card">
          <strong>New: Pre-Season Baseline Testing Tool</strong><br><br>
          Run digital cognitive baselines on your athletes &mdash; immediate recall, delayed recall, concentration, balance (BESS). Results are stored and exported as a professional PDF report you can file in their clinical record.<br><br>
          <center><a href="${preseasonLink}" class="button-secondary">Try the Baseline Tool &rarr;</a></center>
        </div>

        <p>The portal is now the home for all our courses, tools, and clinical resources. You'll find everything there going forward.</p>

        <p style="color: #64748b;">
          - Zac Lewis<br>
          <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) &middot; Founder, Concussion Education Australia</em>
        </p>
      </div>
      <div class="footer">
        <p><strong>Concussion Education Australia</strong></p>
        <p>zac@concussion-education-australia.com</p>
        <p style="margin-top: 12px; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe from course emails</a></p>
      </div>
    </div>
  </body>
</html>`
}
