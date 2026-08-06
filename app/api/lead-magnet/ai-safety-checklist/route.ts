/**
 * AI Safety Checklist lead-magnet signup.
 *
 * POST { email, name? } → creates a preview user (or attaches to
 * existing), sends the Day-0 delivery email with the checklist link,
 * and queues the Day-3/7/14 nurture sequence via the existing nurture
 * cron (signupSource = 'ai-safety-checklist' triggers it).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { getClientIp } from '@/lib/get-client-ip'
import { rateLimit } from '@/lib/rate-limit'
import { AI_SAFETY_CHECKLIST_DAY0 } from '@/lib/email-sequences'

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const ipLimit = await rateLimit({ key: `ai_checklist:ip:${ip}`, limit: 10, windowSec: 15 * 60 })
    if (!ipLimit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const emailLimit = await rateLimit({ key: `ai_checklist:email:${email.toLowerCase()}`, limit: 3, windowSec: 15 * 60 })
    if (!emailLimit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const normalizedEmail = email.toLowerCase().trim()
    const userName = (name || email.split('@')[0]).slice(0, 100)

    const existing = await findUserByEmail(normalizedEmail)
    let userId: string
    if (existing) {
      userId = existing.id
    } else {
      userId = await createUser({
        email: normalizedEmail,
        name: userName,
        accessLevel: 'preview',
        signupSource: 'ai-safety-checklist',
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const checklistLink = generateMagicLinkJWT(userId, normalizedEmail, userName, 'preview', baseUrl).replace(
      '/auth/verify?',
      '/auth/verify?redirect=' + encodeURIComponent('/ai-safety-checklist/checklist') + '&'
    )
    const unsubToken = generateUnsubscribeToken(normalizedEmail)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&token=${unsubToken}`

    const html = AI_SAFETY_CHECKLIST_DAY0.template(userName, checklistLink).replace(
      '{{unsubscribe_url}}',
      unsubscribeUrl
    )

    // MASTER BLACKLIST — Day-0 of a marketing sequence on a PUBLIC endpoint
    // with no audit-key dedupe. Without this, anyone who hard-bounced,
    // complained or replied STOP is remailed simply by the form being filled
    // in with their address. Fails closed.
    //
    // The suppression check STAYS as-is — it must never be weakened. What was
    // wrong (2026-08-06 audit) is what happened next: the emailed link was the
    // ONLY carrier of the deliverable, and the route answered a flat
    // {success:true}, so someone who unsubscribed from cold outreach months
    // ago filled in the form, was told the checklist was on its way, and
    // received nothing, forever, with no fallback. The checklist page itself
    // carries no auth (only `robots: noindex`) — so hand back its PATH instead
    // of emailing. No magic-link JWT crosses the wire, nothing is sent to a
    // suppressed address, and the person still gets what they asked for.
    if (await isEmailSuppressed(normalizedEmail)) {
      return NextResponse.json({
        success: true,
        emailed: false,
        checklistPath: '/ai-safety-checklist/checklist',
        message:
          'That address has opted out of our emails, so we have not sent one — open the checklist directly instead.',
      })
    }

    await sendEmail({
      to: normalizedEmail,
      subject: AI_SAFETY_CHECKLIST_DAY0.subject,
      html,
      tags: [
        { name: 'sequence', value: 'ai-safety-checklist' },
        { name: 'day', value: '0' },
      ],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    // SECURITY — never return checklistLink (or userId) to the caller.
    //
    // checklistLink is a magic-link JWT: whoever holds it is logged in as the
    // account for that address. This is a PUBLIC, unauthenticated POST that
    // accepts an ARBITRARY email, so returning it handed anyone a login link
    // for anyone else's account — POST victim@clinic.com.au, read the link out
    // of the JSON. That is precisely the account takeover lib/account-escalation
    // exists to prevent, and unlike /api/signup-free and /api/email-gate this
    // route never consulted hasElevatedEntitlement(). The link must only ever
    // travel to the address that owns it, i.e. by email — which the send above
    // already does. No caller ever read this field.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI checklist signup error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
