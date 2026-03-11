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
import { SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE, ONLINE_UPGRADE_SEQUENCE, REENGAGEMENT_EMAIL } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'

export const maxDuration = 120

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

      const html = email.template(user.name, daysSinceSignup <= 7 ? loginLink : upgradeLink)
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

    // ── Online-only user sequences (upgrade nudge + re-engagement) ──
    for (const user of users) {
      if (user.accessLevel !== 'online-only') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const upgradeLink = `${baseUrl}/pricing`
      const loginLink = `${baseUrl}/login?email=${encodeURIComponent(user.email)}`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Upgrade nudge sequence
      const upgradeEmail = ONLINE_UPGRADE_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (upgradeEmail) {
        const html = upgradeEmail.template(user.name, upgradeLink)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)
        await sendEmail({
          to: user.email,
          subject: upgradeEmail.subject,
          html,
          tags: [
            { name: 'sequence', value: 'online-upgrade' },
            { name: 'day', value: String(daysSinceSignup) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        emailsSent++
        console.log(`Sent upgrade nudge (Day ${daysSinceSignup}) to ${user.email}`)
      }

      // Re-engagement: 14 days since signup, hasn't logged in for 7+ days
      if (daysSinceSignup === 14) {
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null
        const daysSinceLogin = lastLogin
          ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : daysSinceSignup
        if (daysSinceLogin >= 7) {
          const html = REENGAGEMENT_EMAIL.template(user.name, loginLink)
            .replace('{{unsubscribe_url}}', unsubscribeUrl)
          await sendEmail({
            to: user.email,
            subject: REENGAGEMENT_EMAIL.subject,
            html,
            tags: [
              { name: 'sequence', value: 'reengagement' },
              { name: 'day', value: String(daysSinceSignup) },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          emailsSent++
          console.log(`Sent re-engagement to ${user.email} (${daysSinceLogin} days since login)`)
        }
      }
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
 * Process abandoned checkout recovery emails via Postgres
 */
async function processAbandonedCheckouts(baseUrl: string): Promise<number> {
  let emailsSent = 0

  const { rows } = await sql`
    SELECT * FROM abandoned_checkouts
    WHERE recovered = false AND emails_sent < ${ABANDONED_CHECKOUT_SEQUENCE.length}
    ORDER BY abandoned_at ASC
  `

  if (rows.length === 0) return 0

  const now = Date.now()

  for (const checkout of rows) {
    const hoursSinceAbandoned = (now - new Date(checkout.abandoned_at).getTime()) / (1000 * 60 * 60)
    const nextEmail = ABANDONED_CHECKOUT_SEQUENCE[checkout.emails_sent]

    if (hoursSinceAbandoned >= nextEmail.hoursAfter) {
      const unsubToken = generateUnsubscribeToken(checkout.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(checkout.email)}&token=${unsubToken}`
      const html = nextEmail.template(checkout.name)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
        to: checkout.email,
        subject: nextEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'abandoned-checkout' },
          { name: 'email-number', value: String(checkout.emails_sent + 1) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      await sql`
        UPDATE abandoned_checkouts SET emails_sent = emails_sent + 1 WHERE id = ${checkout.id}
      `

      emailsSent++
      console.log(`[Abandoned] Email ${checkout.emails_sent + 1} → ${checkout.email}`)
    }
  }

  // Clean up old entries (> 7 days and fully sent)
  await sql`
    DELETE FROM abandoned_checkouts
    WHERE abandoned_at < now() - interval '7 days'
      AND emails_sent >= ${ABANDONED_CHECKOUT_SEQUENCE.length}
  `

  return emailsSent
}
