/**
 * Team Training Inquiry — capture leads from clinic owners / large teams.
 *
 * POST { email, name?, orgName?, teamSize?, format?, location?, notes? }
 *   → stores row in team_training_inquiries
 *   → sends notification email to Zac (zac@concussion-education-australia.com)
 *   → sends confirmation email to inquirer
 *
 * Pricing intentionally not stated on the landing page; Zac discusses
 * privately. Internal reference (not for public): A$950pp at 8 minimum,
 * A$900pp at 10+.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { getClientIp } from '@/lib/get-client-ip'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email, name, orgName, teamSize, format, location, notes } = body as {
      email?: string
      name?: string
      orgName?: string
      teamSize?: string
      format?: string
      location?: string
      notes?: string
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const ipLimit = await rateLimit({ key: `team_training:ip:${ip}`, limit: 5, windowSec: 15 * 60 })
    if (!ipLimit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const normalizedEmail = email.toLowerCase().trim()
    const safeName = (name || '').slice(0, 100).trim() || null
    const safeOrg = (orgName || '').slice(0, 200).trim() || null
    const safeTeamSize = (teamSize || '').slice(0, 50).trim() || null
    const safeFormat = (format || '').slice(0, 50).trim() || null
    const safeLocation = (location || '').slice(0, 200).trim() || null
    const safeNotes = (notes || '').slice(0, 2000).trim() || null

    await sql`
      CREATE TABLE IF NOT EXISTS team_training_inquiries (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        org_name TEXT,
        team_size TEXT,
        format TEXT,
        location TEXT,
        notes TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    const { rows: inserted } = await sql<{ id: number }>`
      INSERT INTO team_training_inquiries
        (email, name, org_name, team_size, format, location, notes, ip)
      VALUES
        (${normalizedEmail}, ${safeName}, ${safeOrg}, ${safeTeamSize},
         ${safeFormat}, ${safeLocation}, ${safeNotes}, ${ip})
      RETURNING id
    `

    // Notification to Zac — high priority lead, hand-engaged
    const adminHtml = `
      <p><strong>New team training inquiry (id #${inserted[0].id})</strong></p>
      <ul>
        <li><strong>Email:</strong> ${escapeHtml(normalizedEmail)}</li>
        <li><strong>Name:</strong> ${safeName ? escapeHtml(safeName) : '<em>(not provided)</em>'}</li>
        <li><strong>Org / clinic:</strong> ${safeOrg ? escapeHtml(safeOrg) : '<em>(not provided)</em>'}</li>
        <li><strong>Team size:</strong> ${safeTeamSize ? escapeHtml(safeTeamSize) : '<em>(not provided)</em>'}</li>
        <li><strong>Format:</strong> ${safeFormat ? escapeHtml(safeFormat) : '<em>(not provided)</em>'}</li>
        <li><strong>Location:</strong> ${safeLocation ? escapeHtml(safeLocation) : '<em>(not provided)</em>'}</li>
        <li><strong>Notes:</strong><br>${safeNotes ? escapeHtml(safeNotes).replace(/\n/g, '<br>') : '<em>(none)</em>'}</li>
      </ul>
      <p style="font-size:12px;color:#888">Captured from /team-training. IP: ${escapeHtml(ip)}</p>
    `
    try {
      await sendEmail({
        to: 'zac@concussion-education-australia.com',
        subject: `🎯 Team training inquiry: ${safeOrg || safeName || normalizedEmail}`,
        html: adminHtml,
      })
    } catch (err) {
      console.error('team-training admin notification failed:', err)
      // Don't fail the request — row is saved
    }

    // Confirmation to inquirer
    const inquirerHtml = `
      <p>Hi ${escapeHtml((safeName || normalizedEmail.split('@')[0]).split(' ')[0])},</p>
      <p>Thanks for reaching out about in-house team training. I&rsquo;ve got your details and will be in touch personally within 1-2 business days to discuss what you&rsquo;re looking for.</p>
      <p>A few things I&rsquo;ll typically want to understand first:</p>
      <ul>
        <li>Approximate team size and clinician mix (osteo, physio, GP, sports med, etc.)</li>
        <li>Preferred topics &mdash; concussion clinical mastery, AI in clinical practice, or a custom blend</li>
        <li>Preferred format &mdash; full-day in-person workshop, multi-session online, or hybrid</li>
        <li>Timeline you&rsquo;re working to</li>
      </ul>
      <p>If you have any of that detail handy ahead of our call, feel free to reply with it. Otherwise we&rsquo;ll cover everything when we speak.</p>
      <p>&mdash; Zac<br>
      Concussion Education Australia<br>
      AHPRA-registered Osteopath</p>
      <p style="font-size:12px;color:#888">If this email landed in the wrong inbox, just delete it &mdash; no further messages will be sent.</p>
    `
    // MASTER BLACKLIST — this is Day 0 of a sequence on a PUBLIC unauthenticated
    // endpoint, the same shape as the other two routes in app/api/lead-magnet/.
    // Those two were gated in 89f206c6 and this one was missed, so anyone who
    // hard-bounced, complained or replied STOP re-entered marketing simply by
    // filling in the team-training form. Fails closed. The internal
    // notification to CONFIG.CONTACT_EMAIL above is unaffected — the inquiry
    // still reaches Zac, who can reply personally.
    try {
      if (await isEmailSuppressed(normalizedEmail)) {
        console.log('[team-training-inquiry] recipient suppressed — confirmation skipped')
      } else {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Team training inquiry received — I\'ll be in touch',
          html: inquirerHtml,
          tags: [
            { name: 'sequence', value: 'team-training-inquiry' },
            { name: 'day', value: '0' },
          ],
        })
      }
    } catch (err) {
      console.error('team-training confirmation failed:', err)
    }

    return NextResponse.json({ success: true, id: inserted[0].id })
  } catch (error) {
    console.error('Team training inquiry error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
