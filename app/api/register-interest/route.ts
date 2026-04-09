import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  if (rateLimitMap.size > 1000) rateLimitMap.clear()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Derive valid cities from a single source of truth
const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const
type ValidCity = (typeof VALID_CITIES)[number]

const CITY_LABELS: Record<ValidCity, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

/**
 * POST /api/register-interest
 *
 * Registers interest for a workshop location (especially TBA dates).
 * Stores in Postgres workshop_interest table, sends confirmation + notification.
 *
 * Body: { email, name, city }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown'

    const body = await request.json()
    const { email, name, city } = body

    // Rate limit by IP
    if (!checkRateLimit(`ip:${ip}`, 10)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name is required (max 100 characters).' }, { status: 400 })
    }
    if (!city || !(VALID_CITIES as readonly string[]).includes(city)) {
      return NextResponse.json({ error: 'Invalid city.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()
    const cityLabel = CITY_LABELS[city as ValidCity]

    // Insert into Postgres (ON CONFLICT = duplicate)
    const { rowCount } = await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${cleanEmail}, ${cleanName}, ${city}, 'pricing_page')
      ON CONFLICT (email, city) DO NOTHING
    `

    if (rowCount === 0) {
      return NextResponse.json({
        success: true,
        message: "You're already registered. We'll notify you when the date is confirmed.",
        duplicate: true,
      })
    }

    // Get total count for this city
    const { rows: countRows } = await sql`
      SELECT COUNT(*)::int AS count FROM workshop_interest WHERE city = ${city}
    `
    const totalCount = countRows[0]?.count || 1

    // Send confirmation email to registrant (best effort)
    try {
      await sendEmail({
        to: cleanEmail,
        subject: `You're on the list — ${cityLabel} Workshop`,
        html: buildConfirmationEmail(cleanName, cityLabel),
        tags: [
          { name: 'type', value: 'interest-confirmation' },
          { name: 'city', value: city },
        ],
      })
    } catch (emailErr) {
      console.error('Failed to send interest confirmation email:', emailErr)
    }

    // Notify Zac (best effort)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `New Interest: ${cityLabel} Workshop — ${cleanName}`,
        html: buildNotificationEmail(cleanName, cleanEmail, cityLabel, totalCount),
        tags: [
          { name: 'type', value: 'interest-notification' },
          { name: 'city', value: city },
        ],
      })
    } catch (emailErr) {
      console.error('Failed to send interest notification email:', emailErr)
    }

    console.log(`Interest registered: ${cleanEmail.slice(0, 3)}*** for ${cityLabel} (total: ${totalCount})`)

    return NextResponse.json({
      success: true,
      message: `Thanks ${cleanName.split(' ')[0]}! We'll email you as soon as the ${cityLabel} date is confirmed.`,
    })
  } catch (error) {
    console.error('Register interest error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function buildConfirmationEmail(name: string, city: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
          Concussion<span style="color: #5b9aa6;">Pro</span>
        </h1>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
        You're on the ${city} waitlist
      </h2>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Hi ${escapeHtml(name.split(' ')[0])},
      </p>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Thanks for registering your interest in our <strong>${city} hands-on workshop</strong>. We're finalising the date and venue — you'll be the first to know when it's confirmed.
      </p>

      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="font-size: 14px; color: #0f766e; margin: 0; font-weight: 600;">
          Can't wait? Start with the online course ($${CONFIG.COURSE.PRICE_ONLINE}) and add the workshop later for the difference.
        </p>
      </div>

      <a href="https://portal.concussion-education-australia.com/pricing"
         style="display: inline-block; background: #5b9aa6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
        View Course Options →
      </a>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 32px; line-height: 1.5;">
        Questions? Reply to this email or contact
        <a href="mailto:zac@concussion-education-australia.com" style="color: #5b9aa6;">zac@concussion-education-australia.com</a>
      </p>
    </div>
  `
}

function buildNotificationEmail(name: string, email: string, city: string, totalCount: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 16px;">
        New Workshop Interest Registration
      </h2>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">Name</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
            <a href="mailto:${escapeHtml(email)}" style="color: #5b9aa6;">${escapeHtml(email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">City</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${city}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Total Interested</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${totalCount} people</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        This is an automated notification from ConcussionPro portal.
      </p>
    </div>
  `
}
