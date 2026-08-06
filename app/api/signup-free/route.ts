/**
 * Free Signup API - No Stripe Required
 * For free course signups (SCAT6 Mastery)
 */

import { NextRequest, NextResponse } from 'next/server'
import { scatModules } from '@/data/scat-modules'
import { createUser, findUserByEmail, updateLastLogin } from '@/lib/users'
import { hasElevatedEntitlement } from '@/lib/account-escalation'
import { createJWTSession } from '@/lib/jwt-session'
import { generateMagicLinkJWT, createMagicToken } from '@/lib/magic-link-jwt'
import { sendEmail, sendMagicLinkEmail, escapeHtml } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { isAuthDoc } from '@/lib/gated-docs'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { getClientIp } from '@/lib/get-client-ip'

// Rate limiting
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
    const { email, name, prospectSlug, source, downloadPath } = body as { email?: string; name?: string; prospectSlug?: string; source?: string; downloadPath?: string }

    // Lead-magnet deep link. The caller (a download page) says which gated
    // asset the visitor actually asked for. Only ever honoured when it is an
    // AUTH_DOCS path — /api/auth/verify applies the same allowlist again, so
    // this can never widen access, it only aims the magic link at the file the
    // person clicked a button to get.
    const wantedDoc = typeof downloadPath === 'string' && isAuthDoc(downloadPath) ? downloadPath : null

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Rate limit by IP and email
    if (!checkRateLimit(`ip:${ip}`, 10) || !checkRateLimit(`email:${email.toLowerCase()}`, 3)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const rawName = (name || email.split('@')[0]).slice(0, 100)
    const userName = rawName

    // Check if user already exists
    const existingUser = await findUserByEmail(email)

    // SECURITY (account-takeover fix, 2026-07-12): email-only auto-login must
    // NEVER mint a session for an account that OWNS anything. The
    // /api/auth/session refresh upgrades any session to the account's real DB
    // access level, so a 'preview' session minted for a known paid user's email
    // would become full access with no magic link — anyone who knows a customer's
    // email could take over their account. For those accounts, send a login link
    // and set NO session. New leads + existing accounts that own nothing keep
    // instant access below.
    // The check is hasElevatedEntitlement, NOT access_level: CRM buyers, SST
    // clinics, bundle owners, AI-course enrollees and Hub owners all carry
    // access_level 'preview' by design (lib/account-escalation.ts).
    if (existingUser && (await hasElevatedEntitlement(existingUser))) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const magicToken = createMagicToken(existingUser.id, existingUser.email, existingUser.name, existingUser.accessLevel)
      // The asset they asked for rides the login link. Without this the whole
      // branch was a dead end for every EXISTING CUSTOMER: no session cookie is
      // minted here (by design — anti-takeover), but /docs/SCAT6_Fillable.pdf
      // and /docs/SCOAT6_Fillable.pdf are AUTH_DOCS, so the caller's
      // `<a download>` 401'd silently and the buyer got no file at all.
      // /api/auth/verify re-checks isAuthDoc before honouring the redirect.
      await sendMagicLinkEmail(existingUser.email, magicToken, baseUrl, wantedDoc)
      return NextResponse.json({ success: true, requiresEmailLogin: true, downloadRequiresLogin: !!wantedDoc })
    }

    let userId: string
    if (existingUser) {
      userId = existingUser.id
      console.log(`Existing user signed up for free course: ${email.slice(0, 3)}***`)
    } else {
      // Create new user with preview access
      // Capture prospectSlug if this came from a cold-email link (e.g.
      // /scat-mastery?prospect={slug}) so the b2b dashboard can credit
      // the free-course signup back to the right prospect_clinics row
      // as a HOT buying-intent signal.
      const sanitizedProspectSlug = typeof prospectSlug === 'string'
        ? prospectSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) || undefined
        : undefined
      // Attribution: when the Squarespace SCAT6 form points here (source carries
      // 'squarespace'), tag signupSource='squarespace' (an existing enum value)
      // so off-site capture is segmentable. signupSource is a strict enum —
      // anything else defaults to 'free-course' for direct portal signups.
      const fromSquarespace = typeof source === 'string' && source.toLowerCase().includes('squarespace')
      userId = await createUser({
        email,
        name: userName,
        accessLevel: 'preview',
        signupSource: fromSquarespace ? 'squarespace' : 'free-course',
        sourceProspectSlug: sanitizedProspectSlug,
      })
      console.log(`New user created for free course: ${email.slice(0, 3)}***`)
    }

    // Log analytics event (server-side — client can't track this)
    try {
      await sql`
        INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
        VALUES (
          'free_course_signup',
          ${JSON.stringify({ name: userName, isExisting: !!existingUser })}::jsonb,
          ${'server_' + Date.now()},
          ${Date.now()},
          ${request.headers.get('user-agent') || 'unknown'},
          ${request.headers.get('referer') || null},
          '/api/signup-free',
          ${null},
          ${ip},
          ${request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || null}
        )
      `
    } catch (err) {
      console.error('Failed to log free signup analytics:', err)
    }

    // Auto-login with preview access only.
    // SECURITY: Never grant paid access via free signup — even for existing paid users.
    // Paid users already have a session; this endpoint is for free course access only.
    // Granting existing accessLevel here would let anyone with a known email get full access.
    const sessionToken = createJWTSession(userId, email.toLowerCase(), existingUser?.name || userName, 'preview', true)

    // Update last_login so admin dashboard shows accurate data
    await updateLastLogin(userId)

    // Generate magic link for the email (backup login if they open on a different device)
    // Uses preview access — the /api/auth/session endpoint will upgrade the JWT
    // to the user's real access level on first use if they have paid access.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const loginLink = generateMagicLinkJWT(userId, email.toLowerCase(), existingUser?.name || userName, 'preview', baseUrl)
    // Day-0 activation deep link: the known funnel leak is signup→start, so
    // the primary CTA must land the user IN Module 1, one click, already
    // authenticated. /auth/verify honours ?redirect for preview users when
    // the target is a /modules/* path.
    const startModuleLink = `${loginLink}&redirect=${encodeURIComponent('/modules/101')}`

    // Generate unsubscribe URL
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    // Record Day 0 audit BEFORE sending so a crash + re-run won't double-send
    await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${`scat_day0_${userId}`}, NOW()) ON CONFLICT (audit_key) DO NOTHING`

    // MASTER BLACKLIST — Day-0 of the SCAT nurture sequence on a PUBLIC
    // endpoint. Without it, a clinician who hard-bounced, complained or replied
    // STOP re-enters marketing just by filling in the form. Fails closed.
    //
    // SUPPRESSES THE EMAIL, NOT THE ENROLMENT (2026-08-05 adversarial round).
    // This guard originally `return`ed here — which is BEFORE the session
    // cookie is set at the bottom of this handler. Every caller
    // (app/scat-mastery, app/concussion-update, app/scat6-download,
    // components/ExitIntentPopup, components/EmailCaptureInline) reads
    // `success` and navigates straight to /modules/101 assuming the cookie
    // exists, so a suppressed address got an account, no cookie, no email and a
    // bounce to /login — a dead end with no way out. email_suppression holds
    // cold-outreach unsubscribes as well as bounces, so that locked a clinician
    // who opted out of cold email out of the FREE course permanently.
    // app/api/email-gate/route.ts already had this ordering right.
    const suppressed = await isEmailSuppressed(email)

    // Send welcome email (Day 0 of nurture sequence)
    const emailSent = suppressed ? false : await sendEmail({
      to: email,
      subject: 'Module 1 is ready — 20 minutes to confident SCAT6 use',
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

                <p>Module 1 is ready. It takes about ${scatModules[0].duration} and covers the rule most clinicians get wrong: <strong>when to use SCAT6 vs SCOAT6</strong>.</p>

                <p>Using the wrong tool at the wrong time isn't just poor practice &mdash; it's a failure of standard of care with medicolegal consequences. Module 1 covers the distinction, red flag recognition, and when to refer.</p>

                <center>
                  <a href="${startModuleLink}" class="cta-btn">Start Module 1 &mdash; SCAT6 Essentials (${scatModules[0].duration})</a>
                  <p style="margin: 8px 0 0; font-size: 13px;">
                    <a href="${baseUrl}/dashboard" style="color: #64748b;">or go to your dashboard</a>
                  </p>
                </center>

                <div class="callout">
                  <strong>What you'll cover:</strong><br><br>
                  &#8226; SCAT6 vs SCOAT6 &mdash; which tool, when, and why<br>
                  &#8226; Red flags that trigger immediate referral<br>
                  &#8226; Medico-legal documentation that protects you
                </div>

                <p>Your fillable SCAT6 and SCOAT6 forms are also ready in the <a href="https://portal.concussion-education-australia.com/scat-forms" style="color: #0d9488;">downloads section</a>.</p>

                <p>Questions? Just reply &mdash; I read every message.</p>

                <div class="sig">
                  Zac Lewis<br>
                  Osteopath &middot; Founder, Concussion Education Australia
                </div>
              </div>
              <div class="footer">
                Concussion Education Australia &middot; Concussion Clinical Mastery is endorsed by Osteopathy Australia<br>
                <a href="${unsubscribeUrl}" style="color: #94a3b8; font-size: 11px;">Unsubscribe</a>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: [
        { name: 'sequence', value: 'scat-mastery' },
        { name: 'day', value: '0' },
      ],
    })

    if (!emailSent) {
      console.warn(
        `[signup-free] Day 0 email ${suppressed ? 'suppressed' : 'failed'} for ${email.slice(0, 3)}*** — user has session cookie, can access course`
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'You\'re signed up! Redirecting to your course...',
    })
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 year — stay logged in
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Free signup error:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
