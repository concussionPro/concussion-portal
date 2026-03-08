/**
 * Cron Job: Send Nurture Sequence Emails
 *
 * Vercel Cron: Runs daily at 9am AEDT (UTC 22:00)
 * Configured in vercel.json
 */

import { NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

export async function GET(request: Request) {
  try {
    // Guard: CRON_SECRET must be set
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured — refusing to run')
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await loadUsers()
    const now = new Date()
    let emailsSent = 0

    // Process each user
    for (const user of users) {
      // Only send to preview/free users who haven't unsubscribed
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Find matching email in sequence
      // Skip Day 0 — welcome email is already sent by the signup-free API
      if (daysSinceSignup === 0) continue
      const email = SCAT_MASTERY_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (!email) continue

      // Generate URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const loginLink = `${baseUrl}/dashboard`
      const upgradeLink = `${baseUrl}/pricing`

      // Generate unsubscribe URL
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Send email (replace unsubscribe placeholder with real URL)
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
      console.log(`📧 Sent Day ${daysSinceSignup} email to ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
