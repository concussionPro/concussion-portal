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

    return NextResponse.json({ success: true, userId, checklistLink })
  } catch (error) {
    console.error('AI checklist signup error:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
