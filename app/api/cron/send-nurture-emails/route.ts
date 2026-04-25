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
import { SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE, ONLINE_UPGRADE_SEQUENCE, REENGAGEMENT_EMAIL, WORKSHOP_RESERVATION_EMAIL, WORKSHOP_MOMENTUM_EMAILS, WORKSHOP_LOGISTICS_EMAIL, ALMOST_DONE_EMAIL, SCAT_COMPLETION_UPSELL, FREE_USER_REENGAGEMENT, SCAT_DAY10_ENGAGEMENT, FREE_ALMOST_DONE, REFERENCE_UPGRADE_SEQUENCE, PAID_NO_PROGRESS_NUDGE } from '@/lib/email-sequences'
import { getEnrollmentCount } from '@/lib/users'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'

function redact(e: string) { return e.length > 3 ? e.slice(0, 3) + '***' : '***' }

export const maxDuration = 120

export async function GET(request: Request) {
  try {
    // Guard: only run on the primary project (concussion-portal with custom domain)
    // Prevents duplicate cron runs from the second Vercel project
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }

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

    // Ensure audit table exists (prevents silent failures if table was dropped/never created)
    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

    const users = await loadUsers()
    const now = new Date()
    let emailsSent = 0
    const errors: string[] = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // ── 1. SCAT6 Mastery Nurture Sequence (preview users) ──
    // Routes Day 7 and Day 10 to variant emails based on user activity/progress
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Skip Day 0 — welcome email is sent by the signup-free API or sync endpoint
      if (daysSinceSignup === 0) continue

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      const upgradeLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Catch-up: if Day 0 welcome was never sent (e.g. Squarespace sync failure), send it now
      const day0AuditKey = `scat_day0_${user.id}`
      const { rows: day0Check } = await sql`SELECT 1 FROM email_audit_log WHERE audit_key = ${day0AuditKey}`
      if (day0Check.length === 0) {
        const day0Email = SCAT_MASTERY_SEQUENCE.find(e => e.day === 0)
        if (day0Email) {
          const { rowCount: day0Inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${day0AuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (day0Inserted && day0Inserted > 0) {
            try {
              const html = day0Email.template(user.name, loginLink).replace('{{unsubscribe_url}}', unsubscribeUrl)
              await sendEmail({
                to: user.email,
                subject: day0Email.subject,
                html,
                tags: [
                  { name: 'sequence', value: 'scat-mastery' },
                  { name: 'day', value: '0' },
                  { name: 'variant', value: 'catch-up' },
                ],
                headers: {
                  'List-Unsubscribe': `<${unsubscribeUrl}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
              })
              emailsSent++
              console.log(`[Nurture] Day 0 catch-up → ${redact(user.email)}`)
            } catch (err) {
              console.error(`[Nurture] Failed Day 0 catch-up for ${redact(user.email)}:`, err)
            }
          }
        }
        continue // They'll get their scheduled day email on the next cron run
      }

      const email = SCAT_MASTERY_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (!email) continue

      // Load user progress for routing decisions (Day 7+)
      let scatCompletedCount = 0
      if (daysSinceSignup >= 7) {
        try {
          const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
          if (progressRows.length > 0 && progressRows[0].progress) {
            const progress = progressRows[0].progress
            for (let i = 101; i <= 103; i++) {
              if (progress[String(i)]?.completed) scatCompletedCount++
            }
          }
        } catch (err) {
          console.error(`[Nurture] Failed to load progress for ${redact(user.email)}:`, err)
        }
      }

      // ── Day 7: Route based on login activity ──
      // Ghosters (never logged in) → FREE_USER_REENGAGEMENT
      // Active users → clinical case study + full-price CTA (default sequence)
      if (daysSinceSignup === 7 && !user.lastLoginAt) {
        const auditKey = `scat_day7_reengagement_${user.id}`
        const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (inserted === 0) continue

        const html = FREE_USER_REENGAGEMENT.template(user.name, loginLink)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)

        try {
          await sendEmail({
            to: user.email,
            subject: FREE_USER_REENGAGEMENT.subject,
            html,
            tags: [
              { name: 'sequence', value: 'scat-mastery' },
              { name: 'day', value: '7' },
              { name: 'variant', value: 'reengagement' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          emailsSent++
          console.log(`[Nurture] Day 7 (reengagement) → ${redact(user.email)}`)
        } catch (err) {
          console.error(`[Nurture] Failed to send Day 7 reengagement to ${redact(user.email)}:`, err)
        }
        continue
      }

      // ── Day 10: Route based on module completion ──
      // <3 modules → engagement push (SCAT_DAY10_ENGAGEMENT)
      // 3+ modules → promo code with 72h deadline (default sequence)
      if (daysSinceSignup === 10 && scatCompletedCount < 3) {
        const auditKey = `scat_day10_engagement_${user.id}`
        const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (inserted === 0) continue

        const html = SCAT_DAY10_ENGAGEMENT.template(user.name, loginLink, scatCompletedCount)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)

        try {
          await sendEmail({
            to: user.email,
            subject: SCAT_DAY10_ENGAGEMENT.subject,
            html,
            tags: [
              { name: 'sequence', value: 'scat-mastery' },
              { name: 'day', value: '10' },
              { name: 'variant', value: 'engagement' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })
          emailsSent++
          console.log(`[Nurture] Day 10 (engagement, ${scatCompletedCount} modules) → ${redact(user.email)}`)
        } catch (err) {
          console.error(`[Nurture] Failed to send Day 10 engagement to ${redact(user.email)}:`, err)
        }
        continue
      }

      // ── Default sequence (Days 3, 7 active, 10 with 3+ modules, 14, 28, 42) ──
      const auditKey = `scat_day${email.day}_${user.id}`
      const { rowCount: scatInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (scatInserted === 0) continue // Already sent

      // Calculate 72h expiry date for Day 10 and Day 28 promo emails
      let expiryDate: string | undefined
      if (daysSinceSignup === 10 || daysSinceSignup === 28) {
        const expiry = new Date(now.getTime() + 72 * 60 * 60 * 1000)
        expiryDate = expiry.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
      }

      // Days 0-7: link to free course login. Days 14+: link to pricing/upgrade.
      const ctaLink = daysSinceSignup <= 7 ? loginLink : upgradeLink
      const html = (daysSinceSignup === 10 || daysSinceSignup === 28)
        ? email.template(user.name, ctaLink, expiryDate).replace('{{unsubscribe_url}}', unsubscribeUrl)
        : email.template(user.name, ctaLink).replace('{{unsubscribe_url}}', unsubscribeUrl)

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
        console.log(`[Nurture] Day ${daysSinceSignup} → ${redact(user.email)}`)
      } catch (err) {
        console.error(`[Nurture] Failed to send Day ${daysSinceSignup} to ${redact(user.email)}:`, err)
      }
    }

    // ── 2. Post-Purchase Onboarding Sequence (paid users) ──
    for (const user of users) {
      if (user.accessLevel === 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
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
            console.log(`[Workshop Reservation] Day 1 → ${redact(user.email)} (${locationConfig.city})`)
          } catch (err) {
            console.error(`[Workshop Reservation] Failed to send to ${redact(user.email)}:`, err)
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

      // Activation override: Day 3 + Day 7 emails assume the user has started
      // the course ("Continue your course", "You're halfway"). For paid users
      // who have NOT opened Module 1 yet, swap in PAID_NO_PROGRESS_NUDGE so
      // we don't tell someone "keep going" when they haven't started. Every
      // paid user in the system is currently at 0/8 progress — this is the
      // single biggest engagement leak.
      let useEmail: { day: number; subject: string; template: (n: string, l: string) => string } = email
      if (email.day === 3 || email.day === 7) {
        try {
          const { rows: pr } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
          let mainModulesDone = 0
          if (pr.length > 0 && pr[0].progress) {
            for (let i = 1; i <= 8; i++) if (pr[0].progress[String(i)]?.completed) mainModulesDone++
          }
          if (mainModulesDone === 0) {
            useEmail = PAID_NO_PROGRESS_NUDGE as typeof useEmail
          }
        } catch (err) {
          console.error(`[Onboarding] Progress check failed for ${redact(user.email)}, defaulting to standard email:`, err)
        }
      }

      // Dedup via email_audit_log. Use a different audit key for the
      // activation variant so users who later progress can still get
      // the regular email if appropriate (avoids accidental dedup
      // collisions across variants).
      const variantSuffix = useEmail === email ? '' : '_activation'
      const onboardAuditKey = `onboard_day${email.day}${variantSuffix}_${user.id}`
      const { rowCount: onboardInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${onboardAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (onboardInserted === 0) continue // Already sent

      const html = useEmail.template(user.name, loginLink)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      try {
        await sendEmail({
          to: user.email,
          subject: useEmail.subject,
          html,
          tags: [
            { name: 'sequence', value: 'post-purchase' },
            { name: 'day', value: String(daysSinceSignup) },
            ...(useEmail !== email ? [{ name: 'variant', value: 'activation' }] : []),
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        emailsSent++
        console.log(`[Onboarding] Day ${daysSinceSignup}${useEmail !== email ? ' (activation)' : ''} → ${redact(user.email)}`)
      } catch (err) {
        console.error(`[Onboarding] Failed to send Day ${daysSinceSignup} to ${redact(user.email)}:`, err)
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
          console.log(`[Workshop Logistics] ${daysUntilWorkshop}d before → ${redact(user.email)}`)
        } catch (err) {
          console.error(`[Workshop Logistics] Failed to send to ${redact(user.email)}:`, err)
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
        console.log(`[Workshop Prep] ${daysUntilWorkshop}d before → ${redact(user.email)}`)
      } catch (err) {
        console.error(`[Workshop Prep] Failed to send to ${redact(user.email)}:`, err)
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
        console.log(`[Workshop Momentum] Day ${daysSinceSignup} → ${redact(user.email)} (${locationConfig.city}: ${count}/${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD})`)
      } catch (err) {
        console.error(`[Workshop Momentum] Failed to send Day ${daysSinceSignup} to ${redact(user.email)}:`, err)
      }
    }

    // ── 5. Abandoned Checkout Recovery Emails ──
    try {
      const abandonedEmailsSent = await processAbandonedCheckouts(baseUrl)
      emailsSent += abandonedEmailsSent
    } catch (err) {
      // Log but don't fail the entire cron — other sequences already sent
      console.error('Abandoned checkout processing error:', err)
      errors.push(`Abandoned checkout: ${err}`)
    }

    // ── Online-only / full-course user sequences (upgrade nudge + re-engagement) ──
    for (const user of users) {
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      const upgradeLink = user.accessLevel === 'online-only' ? `${baseUrl}/upgrade` : `${baseUrl}/pricing`
      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
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
            console.log(`Sent upgrade nudge (Day ${daysSinceSignup}) to ${redact(user.email)}`)
          } catch (err) {
            console.error(`[Upgrade Nudge] Failed to send to ${redact(user.email)}:`, err)
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
            console.log(`Sent re-engagement to ${redact(user.email)} (${daysSinceLogin} days since login)`)
          } catch (err) {
            console.error(`[Re-engagement] Failed to send to ${redact(user.email)}:`, err)
          }
        }
      }
    }

    // ── 7. "Almost Done" Email (users who completed 7 of 8 modules) ──
    for (const user of users) {
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue
      if (user.progressEmailsOptedOut) continue

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

          const almostDoneLoginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'there', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          try {
            const almostDoneHtml = ALMOST_DONE_EMAIL.template(user.name || 'there', almostDoneLoginLink)
              .replace('{{unsubscribe_url}}', unsubscribeUrl)
            await sendEmail({
              to: user.email,
              subject: ALMOST_DONE_EMAIL.subject,
              html: almostDoneHtml,
              tags: [
                { name: 'sequence', value: 'almost-done' },
                { name: 'trigger', value: 'progress-7of8' },
              ],
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })
            emailsSent++
            console.log(`[Almost Done] Sent to ${redact(user.email)}`)
          } catch (err) {
            console.error(`[Almost Done] Failed to send to ${redact(user.email)}:`, err)
          }
        }
      } catch (err) {
        console.error(`[Almost Done] Failed to check progress for ${redact(user.email)}:`, err)
      }
    }

    // ── 8. SCAT6 Mastery Completion Upsell (cron fallback) ──
    // Catches preview users who completed all 3 modules but didn't trigger upsell
    // via the certificate endpoint (e.g. downloaded PDF only, or never clicked certificate)
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Check if all 3 SCAT modules (101-103) are completed
        let allScatDone = true
        for (let i = 101; i <= 103; i++) {
          if (!progress[String(i)]?.completed) {
            allScatDone = false
            break
          }
        }
        if (!allScatDone) continue

        // Dedup — may have already been sent by the certificate endpoint
        const auditKey = `scat_completion_upsell_${user.id}`
        const { rowCount: upsellInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (upsellInserted === 0) continue // Already sent

        const pricingLink = `${baseUrl}/pricing`
        const unsubToken = generateUnsubscribeToken(user.email)
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

        const html = SCAT_COMPLETION_UPSELL.template(user.name || 'there', pricingLink)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)

        await sendEmail({
          to: user.email,
          subject: SCAT_COMPLETION_UPSELL.subject,
          html,
          tags: [
            { name: 'sequence', value: 'scat-completion-upsell' },
            { name: 'trigger', value: 'cron-fallback' },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        emailsSent++
        console.log(`[Completion Upsell] Cron fallback → ${redact(user.email)}`)
      } catch (err) {
        console.error(`[Completion Upsell] Failed for ${redact(user.email)}:`, err)
      }
    }

    // ── 9. Free "Almost Done" (preview users with 2/3 SCAT modules) ──
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Count completed SCAT modules (101-103)
        let scatDone = 0
        for (let i = 101; i <= 103; i++) {
          if (progress[String(i)]?.completed) scatDone++
        }

        if (scatDone === 2) {
          const auditKey = `free_almost_done_${user.id}`
          const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (inserted === 0) continue // Already sent

          const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          const html = FREE_ALMOST_DONE.template(user.name || 'there', loginLink)
            .replace('{{unsubscribe_url}}', unsubscribeUrl)

          await sendEmail({
            to: user.email,
            subject: FREE_ALMOST_DONE.subject,
            html,
            tags: [
              { name: 'sequence', value: 'free-almost-done' },
              { name: 'trigger', value: 'progress-2of3' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })

          emailsSent++
          console.log(`[Free Almost Done] 2/3 SCAT modules → ${redact(user.email)}`)
        }
      } catch (err) {
        console.error(`[Free Almost Done] Failed for ${redact(user.email)}:`, err)
      }
    }

    // ── 10. Reference+Toolkit → Course Upgrade Funnel ──
    // Users who bought the book but haven't bought the course. The A$100
    // bundle credit is already auto-applied server-side at checkout — these
    // emails just surface the offer. Stops automatically if they upgrade
    // (accessLevel changes) or unsubscribe.
    for (const user of users) {
      if (user.accessLevel !== 'preview') continue // upgraded → stop
      if (user.nurtureUnsubscribed) continue
      if (!user.referenceBookPurchasedAt) continue

      const purchaseDate = new Date(user.referenceBookPurchasedAt)
      const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

      const candidate = REFERENCE_UPGRADE_SEQUENCE.find((e) => e.day === daysSincePurchase)
      if (!candidate) continue

      const auditKey = `ref_upgrade_day${candidate.day}_${user.id}`
      const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (!inserted || inserted === 0) continue

      const pricingLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      try {
        const html = candidate.template(user.name || 'there', pricingLink)
          .replace('{{unsubscribe_url}}', unsubscribeUrl)
        await sendEmail({
          to: user.email,
          subject: candidate.subject,
          html,
          tags: [
            { name: 'sequence', value: 'reference-upgrade' },
            { name: 'day', value: String(candidate.day) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        emailsSent++
        console.log(`[Reference Upgrade] Day ${candidate.day} → ${redact(user.email)}`)
      } catch (err) {
        console.error(`[Reference Upgrade] Failed for ${redact(user.email)}:`, err)
        errors.push(`ref-upgrade day${candidate.day}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
      ...(errors.length > 0 ? { errors } : {}),
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
      // Check if user has unsubscribed
      try {
        const { rows: userRows } = await sql`
          SELECT nurture_unsubscribed FROM users WHERE email = ${checkout.email} LIMIT 1
        `
        if (userRows.length > 0 && userRows[0].nurture_unsubscribed) {
          // Mark as fully sent so we stop processing
          await sql`UPDATE abandoned_checkouts SET emails_sent = ${ABANDONED_CHECKOUT_SEQUENCE.length} WHERE id = ${checkout.id}`
          console.log(`[Abandoned] Skipped ${redact(checkout.email)} — unsubscribed`)
          continue
        }
      } catch (err) {
        console.error(`[Abandoned] Unsubscribe check failed for ${redact(checkout.email)}, skipping to be safe:`, err)
        continue
      }

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
        console.log(`[Abandoned] Email ${checkout.emails_sent + 1} → ${redact(checkout.email)}`)
      } catch (err) {
        console.error(`[Abandoned Checkout] Failed to send to ${redact(checkout.email)}:`, err)
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
