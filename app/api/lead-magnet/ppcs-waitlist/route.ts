/**
 * PPCS Course Waitlist signup.
 *
 * POST { email, name? } -> records intent on the course_early_access
 * table with course_slug='persistent-post-concussion-symptoms',
 * source='waitlist'. Sends a one-shot confirmation email — NO
 * downstream nurture sequence, NO PDF. The full course launches
 * August 2026; waitlist members get a 50%-off launch email.
 *
 * This is the new validation pattern (waitlist not free-PDF). If
 * <100 signups in 4 weeks, the PPCS course is killed before build.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { getClientIp } from '@/lib/get-client-ip'
import { rateLimit } from '@/lib/rate-limit'

const COURSE_SLUG = 'persistent-post-concussion-symptoms'

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

    const ipLimit = await rateLimit({ key: `ppcs_waitlist:ip:${ip}`, limit: 10, windowSec: 15 * 60 })
    if (!ipLimit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const emailLimit = await rateLimit({ key: `ppcs_waitlist:email:${email.toLowerCase()}`, limit: 3, windowSec: 15 * 60 })
    if (!emailLimit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const normalizedEmail = email.toLowerCase().trim()
    const userName = (name || email.split('@')[0]).slice(0, 100)

    // Ensure table exists (matches existing schema in /lib/early-access.ts)
    await sql`
      CREATE TABLE IF NOT EXISTS course_early_access (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        course_slug TEXT NOT NULL,
        signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT,
        UNIQUE (email, course_slug)
      )
    `

    // Idempotent insert — ON CONFLICT returns success without duplicating
    const { rowCount } = await sql`
      INSERT INTO course_early_access (email, course_slug, source)
      VALUES (${normalizedEmail}, ${COURSE_SLUG}, 'waitlist')
      ON CONFLICT (email, course_slug) DO NOTHING
    `
    const isNewSignup = (rowCount ?? 0) > 0

    // One-shot confirmation email (no nurture sequence)
    if (isNewSignup) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const unsubToken = generateUnsubscribeToken(normalizedEmail)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&token=${unsubToken}`

      const html = `
        <p>Hi ${escapeHtml(userName.split(' ')[0])},</p>
        <p>You&rsquo;re on the waitlist for <strong>Persistent Post-Concussion Symptoms (PPCS) &mdash; The Chronic 5-20%</strong>.</p>
        <p>The course is targeted to launch <strong>August 2026</strong> and covers:</p>
        <ul>
          <li>The chronic 5-20% of concussion cases that fail to resolve in standard timeframes</li>
          <li>Vestibulo-ocular workup (the ~70% of PPCS cases that need it)</li>
          <li>Cervical contribution to persistent symptoms (~54% of cases)</li>
          <li>Escalation criteria and multi-disciplinary referral pathways</li>
          <li>Active rehabilitation protocols beyond &ldquo;wait until symptom-free&rdquo;</li>
        </ul>
        <p>You&rsquo;ll get a launch email with a <strong>50% off discount code</strong> the day the course goes live. No spam, no other emails between now and then.</p>
        <p>If PPCS isn&rsquo;t the right fit, you can unsubscribe any time: <a href="${unsubscribeUrl}">unsubscribe</a>.</p>
        <p>&mdash; Zac<br>Concussion Education Australia</p>
      `

      await sendEmail({
        to: normalizedEmail,
        subject: "You're on the PPCS course waitlist — launch August 2026",
        html,
        tags: [
          { name: 'sequence', value: 'ppcs-waitlist' },
          { name: 'day', value: '0' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    }

    return NextResponse.json({ success: true, isNewSignup })
  } catch (error) {
    console.error('PPCS waitlist signup error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
