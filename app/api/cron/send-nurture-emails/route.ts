/**
 * Cron Job: Send All Automated Email Sequences
 *
 * Vercel Cron: Runs daily at 9am AEDT (UTC 22:00)
 * Configured in vercel.json
 *
 * Handles:
 * 1. SCAT Mastery nurture sequence (preview/free users)
 * 2. Post-purchase onboarding sequence (paid users)
 * 3. Abandoned checkout recovery emails
 * 4. Pre-workshop prep emails (full-course users)
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { list as listBlobs, put } from '@vercel/blob'
import { CONFIG } from '@/lib/config'

interface AbandonedCheckout {
  email: string
  name: string
  courseType: string
  amount: number
  abandonedAt: string
  emailsSent: number
  recovered: boolean
}

export async function GET(request: Request) {
  try {
    // Guard: CRON_SECRET must be set
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured — refusing to run')
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    // Verify cron secret (timing-safe)
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (!authHeader || authHeader.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await loadUsers()
    const now = new Date()
    let emailsSent = 0
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // ── 1. SCAT Mastery Nurture Sequence (preview users) ──
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Skip Day 0 — welcome email is already sent by the signup-free API
      if (daysSinceSignup === 0) continue
      const email = SCAT_MASTERY_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (!email) continue

      const loginLink = `${baseUrl}/login?email=${encodeURIComponent(user.email)}`
      const upgradeLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const html = email.template(user.name, daysSinceSignup <= 2 ? loginLink : upgradeLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
        to: user.email,
        subject: email.subject,
        html,
        tags: [
          { name: 'sequence', value: 'scat-mastery' },
          { name: 'day', value: String(daysSinceSignup) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      emailsSent++
      console.log(`[Nurture] Day ${daysSinceSignup} → ${user.email}`)
    }

    // ── 2. Post-Purchase Onboarding Sequence (paid users) ──
    for (const user of users) {
      if (user.accessLevel === 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const email = POST_PURCHASE_SEQUENCE.find(
        e => e.day === daysSinceSignup && e.accessLevels.includes(user.accessLevel as 'online-only' | 'full-course')
      )
      if (!email) continue

      const loginLink = `${baseUrl}/login?email=${encodeURIComponent(user.email)}`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const html = email.template(user.name, loginLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
        to: user.email,
        subject: email.subject,
        html,
        tags: [
          { name: 'sequence', value: 'post-purchase' },
          { name: 'day', value: String(daysSinceSignup) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      emailsSent++
      console.log(`[Onboarding] Day ${daysSinceSignup} → ${user.email}`)
    }

    // ── 3. Pre-Workshop Prep Emails (full-course with confirmed dates) ──
    for (const user of users) {
      if (user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue
      if (!user.workshopLocation) continue

      // Find matching location config with a confirmed date
      const locationEntry = Object.values(CONFIG.LOCATIONS).find(
        loc => loc.slug === user.workshopLocation && loc.status === 'confirmed' && loc.dateObj
      )
      if (!locationEntry || !locationEntry.dateObj) continue

      const daysUntilWorkshop = Math.floor(
        (locationEntry.dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const prepEmail = PRE_WORKSHOP_SEQUENCE.find(e => e.daysBefore === daysUntilWorkshop)
      if (!prepEmail) continue

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const html = prepEmail.template(user.name, locationEntry.city, locationEntry.date)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
        to: user.email,
        subject: prepEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'pre-workshop' },
          { name: 'days-before', value: String(daysUntilWorkshop) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      emailsSent++
      console.log(`[Workshop Prep] ${daysUntilWorkshop}d before → ${user.email}`)
    }

    // ── 4. Abandoned Checkout Recovery Emails ──
    try {
      const abandonedEmailsSent = await processAbandonedCheckouts(baseUrl)
      emailsSent += abandonedEmailsSent
    } catch (err) {
      console.error('Abandoned checkout processing error:', err)
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

/**
 * Process abandoned checkout recovery emails
 */
async function processAbandonedCheckouts(baseUrl: string): Promise<number> {
  const blobPath = 'abandoned-checkouts.json'
  let abandonedList: AbandonedCheckout[] = []
  let emailsSent = 0

  const { blobs } = await listBlobs()
  const existing = blobs
    .filter(b => b.pathname === blobPath)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  if (existing.length === 0) return 0

  const res = await fetch(`${existing[0].url}?t=${Date.now()}`, { cache: 'no-store' })
  abandonedList = await res.json()

  const now = Date.now()
  let updated = false

  for (const checkout of abandonedList) {
    if (checkout.recovered) continue
    if (checkout.emailsSent >= ABANDONED_CHECKOUT_SEQUENCE.length) continue

    const hoursSinceAbandoned = (now - new Date(checkout.abandonedAt).getTime()) / (1000 * 60 * 60)
    const nextEmail = ABANDONED_CHECKOUT_SEQUENCE[checkout.emailsSent]

    if (hoursSinceAbandoned >= nextEmail.hoursAfter) {
      const html = nextEmail.template(checkout.name)
        .replace('{{unsubscribe_url}}', '#')

      await sendEmail({
        to: checkout.email,
        subject: nextEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'abandoned-checkout' },
          { name: 'email-number', value: String(checkout.emailsSent + 1) },
        ],
      })

      checkout.emailsSent++
      updated = true
      emailsSent++
      console.log(`[Abandoned] Email ${checkout.emailsSent} → ${checkout.email}`)
    }
  }

  // Clean up old entries (> 7 days and fully sent)
  const cleaned = abandonedList.filter(c => {
    const age = now - new Date(c.abandonedAt).getTime()
    return age < 7 * 24 * 60 * 60 * 1000 || c.emailsSent < ABANDONED_CHECKOUT_SEQUENCE.length
  })

  if (updated || cleaned.length !== abandonedList.length) {
    await put(blobPath, JSON.stringify(cleaned, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
  }

  return emailsSent
}
