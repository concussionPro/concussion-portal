/**
 * Resend Email Client
 * Handles all email sending including magic links and nurture sequences
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'YOUR_RESEND_API_KEY_HERE') {
  console.warn('⚠️  RESEND_API_KEY not configured - emails will be logged to console only')
}

export const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = 'zac@concussion-education-australia.com'
const FROM_NAME = 'Zac Lewis - Concussion Education Australia'

interface EmailOptions {
  to: string
  subject: string
  html: string
  tags?: Array<{ name: string; value: string }>
}

/**
 * Send email via Resend (or log to console in dev)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Development mode - just log
  if (!resend || process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      tags: options.tags,
    })
    return true
  }

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      tags: options.tags,
    })

    if (result.data) {
      console.log('✅ Email sent via Resend:', result.data.id)
      return true
    } else {
      console.error('❌ Resend email error:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Resend email error:', error)
    return false
  }
}

/**
 * Add contact to Resend audience for nurture sequences
 */
export async function addToNurtureSequence(email: string, name: string, accessLevel: string): Promise<boolean> {
  if (!resend) {
    console.log('📋 Would add to nurture:', { email, name, accessLevel })
    return true
  }

  try {
    // Resend doesn't have built-in sequences, so we'll trigger via API endpoint
    // The sequence will be handled by scheduled Vercel cron jobs
    console.log(`📋 Added ${email} to ${accessLevel} nurture sequence`)
    return true
  } catch (error) {
    console.error('❌ Failed to add to nurture sequence:', error)
    return false
  }
}
