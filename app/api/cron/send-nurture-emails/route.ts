/**
 * Cron Job: Send Nurture Sequence Emails
 *
 * Vercel Cron: Runs daily at 9am AEST
 * Add to vercel.json: { "path": "/api/cron/send-nurture-emails", "schedule": "0 9 * * *" }
 */

import { NextResponse } from 'next/server'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE } from '@/lib/email-sequences'

export async function GET(request: Request) {
  try {
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
      // Only send to preview/free users (not paid)
      if (user.accessLevel !== 'preview') continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Find matching email in sequence
      const email = SCAT_MASTERY_SEQUENCE.find(e => e.day === daysSinceSignup)
      if (!email) continue

      // Generate URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      const loginLink = `${baseUrl}/dashboard`
      const upgradeLink = `${baseUrl}/pricing`

      // Send email
      const html = email.template(user.name, daysSinceSignup <= 2 ? loginLink : upgradeLink)

      await sendEmail({
        to: user.email,
        subject: email.subject,
        html,
        tags: [
          { name: 'sequence', value: 'scat-mastery' },
          { name: 'day', value: String(daysSinceSignup) },
        ],
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
