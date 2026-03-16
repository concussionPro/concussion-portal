/**
 * Cron Job: Send All Automated Email Sequences
 *
 * Vercel Cron: Runs daily at 9am AEDT (UTC 22:00)
 * Configured in vercel.json
 *
 * Handles:
 * 1. SCAT6 Mastery nurture sequence (preview/free users)
 * 2. Post-purchase onboarding sequence (paid users)
 * 3. Abandoned checkout recovery emails
 * 4. Pre-workshop prep emails (full-course users)
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE, ONLINE_UPGRADE_SEQUENCE, REENGAGEMENT_EMAIL, WORKSHOP_RESERVATION_EMAIL, WORKSHOP_MOMENTUM_EMAILS, WORKSHOP_LOGISTICS_EMAIL, ALMOST_DONE_EMAIL } from '@/lib/email-sequences'
import { getEnrollmentCount } from '@/lib/users'
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

    // ── 1. SCAT6 Mastery Nurture Sequence (preview users) ──
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Skip Day 0 — welcome email is already sent by the signup-free API
      if (daysSinceSignup === 0) continue
      const email = SCAT_MASTERY_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (!email) continue

      const loginLink = `${baseUrl}/login?redirect=/learning`
      const upgradeLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Dedup via email_audit_log (INSERT-first to avoid TOCTOU race)
      const auditKey = `scat_day${email.day}_${user.id}`
      const { rowCount: scatInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (scatInserted === 0) continue // Already sent

      // Days 0-7: link to free course login. Days 14+: link to pricing/upgrade.
      const html = email.template(user.name, daysSinceSignup <= 7 ? loginLink : upgradeLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      try {
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
      } catch (err) {
        console.error(`[Nurture] Failed to send Day ${daysSinceSignup} to ${user.email}:`, err)
      }
    }

    // ── 2. Post-Purchase Onboarding Sequence (paid users) ──
    for (const user of users) {
      if (user.accessLevel === 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const loginLink = `${baseUrl}/login?redirect=/learning`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Day 1 for full-course users: send workshop reservation email instead of generic onboarding
      // Workshop logistics emails are NOT affected by progressEmailsOptedOut
      if (daysSinceSignup === 1 && user.accessLevel === 'full-course' && user.workshopLocation) {
        const locationConfig = Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === user.workshopLocation)
        if (locationConfig && locationConfig.status === 'collecting') {
          const workshopResAuditKey = `workshop_reservation_${user.id}`
          const { rowCount: wsResInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${workshopResAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (wsResInserted === 0) continue // Already sent

          const count = await getEnrollmentCount(user.workshopLocation)
          const html = WORKSHOP_RESERVATION_EMAIL.template(
            user.name, loginLink, locationConfig.city, count, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD
          ).replace('{{unsubscribe_url}}', unsubscribeUrl)

          try {
            await sendEmail({
              to: user.email,
              subject: WORKSHOP_RESERVATION_EMAIL.subject,
              html,
              tags: [
                { name: 'sequence', value: 'workshop-reservation' },
                { name: 'day', value: '1' },
              ],
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })

            emailsSent++
            console.log(`[Workshop Reservation] Day 1 → ${user.email} (${locationConfig.city})`)
          } catch (err) {
            console.error(`[Workshop Reservation] Failed to send to ${user.email}:`, err)
          }
          continue // Skip generic Day 1 onboarding for this user
        }
      }

      // Progress email opt-out only blocks onboarding nudges, not workshop logistics above
      if (user.progressEmailsOptedOut) continue

      // Generic post-purchase onboarding (online-only users, or confirmed city full-course)
      const email = POST_PURCHASE_SEQUENCE.find(
        e => e.day === daysSinceSignup && e.accessLevels.includes(user.accessLevel as 'online-only' | 'full-course')
      )
      if (!email) continue

      // Dedup via email_audit_log (INSERT-first to avoid TOCTOU race)
      const onboardAuditKey = `onboard_day${email.day}_${user.id}`
      const { rowCount: onboardInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${onboardAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (onboardInserted === 0) continue // Already sent

      const html = email.template(user.name, loginLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      try {
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
      } catch (err) {
        console.error(`[Onboarding] Failed to send Day ${daysSinceSignup} to ${user.email}:`, err)
      }
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

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Check for logistics email (6 weeks = 42 days before)
      if (daysUntilWorkshop === WORKSHOP_LOGISTICS_EMAIL.daysBefore) {
        const logisticsAuditKey = `workshop_logistics_${user.id}`
        const { rowCount: logisticsInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${logisticsAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (logisticsInserted === 0) continue // Already sent

        const html = WORKSHOP_LOGISTICS_EMAIL.template(user.name, locationEntry.city, locationEntry.date)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)

        try {
          await sendEmail({
            to: user.email,
            subject: WORKSHOP_LOGISTICS_EMAIL.subject,
            html,
            tags: [
              { name: 'sequence', value: 'workshop-logistics' },
              { name: 'days-before', value: String(daysUntilWorkshop) },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })

          emailsSent++
          console.log(`[Workshop Logistics] ${daysUntilWorkshop}d before → ${user.email}`)
        } catch (err) {
          console.error(`[Workshop Logistics] Failed to send to ${user.email}:`, err)
        }
        continue
      }

      // Existing pre-workshop prep emails (7 days, 1 day before)
      const prepEmail = PRE_WORKSHOP_SEQUENCE.find(e => e.daysBefore === daysUntilWorkshop)
      if (!prepEmail) continue

      const prepAuditKey = `pre_workshop_${prepEmail.daysBefore}_${user.id}`
      const { rowCount: prepInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${prepAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (prepInserted === 0) continue // Already sent

      const html = prepEmail.template(user.name, locationEntry.city, locationEntry.date)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      try {
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
      } catch (err) {
        console.error(`[Workshop Prep] Failed to send to ${user.email}:`, err)
      }
    }

    // ── 4. Workshop Momentum Emails (full-course users in collecting cities) ──
    for (const user of users) {
      if (user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue
      if (!user.workshopLocation) continue

      const locationConfig = Object.values(CONFIG.LOCATIONS).find(
        loc => loc.slug === user.workshopLocation
      )
      // Only send for collecting cities
      if (!locationConfig || locationConfig.status !== 'collecting') continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const momentumEmail = WORKSHOP_MOMENTUM_EMAILS.find(e => e.day === daysSinceSignup)
      if (!momentumEmail) continue

      // Dedup via email_audit_log (INSERT-first, using audit_key pattern)
      const auditKey = `workshop_momentum_d${daysSinceSignup}_${user.id}`
      const { rowCount: momentumInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (momentumInserted === 0) continue // Already sent

      const count = await getEnrollmentCount(user.workshopLocation)
      const remaining = Math.max(0, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD - count)

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const subject = momentumEmail.subject(locationConfig.city, count, remaining)
      const html = momentumEmail.template(user.name, locationConfig.city, count, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      try {
        await sendEmail({
          to: user.email,
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'workshop-momentum' },
            { name: 'day', value: String(daysSinceSignup) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        emailsSent++
        console.log(`[Workshop Momentum] Day ${daysSinceSignup} → ${user.email} (${locationConfig.city}: ${count}/${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD})`)
      } catch (err) {
        console.error(`[Workshop Momentum] Failed to send Day ${daysSinceSignup} to ${user.email}:`, err)
      }
    }

    // ── 5. Abandoned Checkout Recovery Emails ──
    try {
      const abandonedEmailsSent = await processAbandonedCheckouts(baseUrl)
      emailsSent += abandonedEmailsSent
    } catch (err) {
      console.error('Abandoned checkout processing error:', err)
    }

    // ── Online-only / full-course user sequences (upgrade nudge + re-engagement) ──
    for (const user of users) {
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      const upgradeLink = `${baseUrl}/pricing`
      const loginLink = `${baseUrl}/login?redirect=/learning`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Upgrade nudge sequence (marketing — not affected by progressEmailsOptedOut)
      // Only applicable to online-only users
      if (user.accessLevel === 'online-only') {
        const upgradeEmail = ONLINE_UPGRADE_SEQUENCE.find(e => e.day === daysSinceSignup)
        if (upgradeEmail) {
          const upgradeAuditKey = `upgrade_day${upgradeEmail.day}_${user.id}`
          const { rowCount: upgradeInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${upgradeAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (upgradeInserted === 0) continue // Already sent

          try {
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
          } catch (err) {
            console.error(`[Upgrade Nudge] Failed to send to ${user.email}:`, err)
          }
        }
      }

      // Re-engagement: 14-16 days since signup, hasn't logged in for 7+ days
      // Blocked by progressEmailsOptedOut (this is a progress nudge)
      if (user.progressEmailsOptedOut) continue
      if (daysSinceSignup >= 14 && daysSinceSignup <= 16) {
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null
        const daysSinceLogin = lastLogin
          ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : daysSinceSignup
        if (daysSinceLogin >= 7) {
          const reengagementAuditKey = `reengagement_${user.id}`
          const { rowCount: reengInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${reengagementAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (reengInserted === 0) continue // Already sent

          try {
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
          } catch (err) {
            console.error(`[Re-engagement] Failed to send to ${user.email}:`, err)
          }
        }
      }
    }

    // ── 7. "Almost Done" Email (users who completed 7 of 8 modules) ──
    for (const user of users) {
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Count completed modules (1-8)
        let completedCount = 0
        for (let i = 1; i <= 8; i++) {
          if (progress[String(i)]?.completed) {
            completedCount++
          }
        }

        if (completedCount === 7) {
          const auditKey = `almost_done_${user.id}`
          const { rowCount: almostDoneInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (almostDoneInserted === 0) continue // Already sent

          const almostDoneLoginLink = `${baseUrl}/login?redirect=/learning`
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          try {
            const almostDoneHtml = ALMOST_DONE_EMAIL.template(user.name || 'there', almostDoneLoginLink)
              .replace('{{unsubscribe_url}}', unsubscribeUrl)
            await sendEmail({
              to: user.email,
              subject: ALMOST_DONE_EMAIL.subject,
              html: almostDoneHtml,
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })
            emailsSent++
            console.log(`[Almost Done] Sent to ${user.email}`)
          } catch (err) {
            console.error(`[Almost Done] Failed to send to ${user.email}:`, err)
          }
        }
      } catch (err) {
        console.error(`[Almost Done] Failed to check progress for ${user.email}:`, err)
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

      try {
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
      } catch (err) {
        console.error(`[Abandoned Checkout] Failed to send to ${checkout.email}:`, err)
      }
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
