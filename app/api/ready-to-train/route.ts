import { NextRequest, NextResponse } from 'next/server'
import { put, list as listBlobs } from '@vercel/blob'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { verifySessionToken } from '@/lib/jwt-session'

interface ReadyToTrainRegistration {
  email: string
  name: string
  city: string
  registeredAt: string
  completedAt: string
}

const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const
type ValidCity = (typeof VALID_CITIES)[number]

const CITY_LABELS: Record<ValidCity, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxAttempts) return false
  entry.count++
  return true
}

/**
 * POST /api/ready-to-train
 *
 * Registers a user who has completed all online modules into the
 * "ready to train" pool for a specific city.
 * Body: { city }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const session = verifySessionToken(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 })
    }

    // Must be online-only (full-course users already have workshop access)
    if (session.accessLevel !== 'online-only') {
      return NextResponse.json(
        { error: 'This feature is for online-only users who have completed all modules.' },
        { status: 403 }
      )
    }

    // Rate limit: 5 attempts per 15 minutes per email
    if (!checkRateLimit(`rtt:${session.email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { city } = body

    if (!city || !(VALID_CITIES as readonly string[]).includes(city)) {
      return NextResponse.json({ error: 'Invalid city.' }, { status: 400 })
    }

    const cityLabel = CITY_LABELS[city as ValidCity]

    // Load existing registrations for this city
    const blobPath = `ready-to-train-${city}.json`
    let registrations: ReadyToTrainRegistration[] = []

    try {
      const { blobs } = await listBlobs()
      const existing = blobs
        .filter(b => b.pathname === blobPath)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

      if (existing.length > 0) {
        const res = await fetch(`${existing[0].url}?t=${Date.now()}`, { cache: 'no-store' })
        registrations = await res.json()
      }
    } catch (err) {
      console.warn('Could not load existing ready-to-train registrations:', err)
    }

    // Check for duplicate
    if (registrations.some(r => r.email === session.email)) {
      return NextResponse.json({
        success: true,
        message: `You're already in the ${cityLabel} pool. We'll notify you when 8+ clinicians are ready.`,
        duplicate: true,
      })
    }

    // Add new registration
    const newRegistration: ReadyToTrainRegistration = {
      email: session.email,
      name: session.name,
      city,
      registeredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
    registrations.push(newRegistration)

    // Save to Vercel Blob
    try {
      await put(blobPath, JSON.stringify(registrations, null, 2), {
        access: 'public',
        contentType: 'application/json',
      })
    } catch (err) {
      console.error('Failed to save ready-to-train registration to Blob:', err)
    }

    // Send confirmation email to user
    await sendEmail({
      to: session.email,
      subject: `You're in the ${cityLabel} Training Pool`,
      html: buildConfirmationEmail(session.name, cityLabel),
      tags: [
        { name: 'type', value: 'ready-to-train-confirmation' },
        { name: 'city', value: city },
      ],
    })

    // Notify Zac
    await sendEmail({
      to: 'zac@concussion-education-australia.com',
      subject: `🏋️ Ready to Train: ${cityLabel} — ${session.name} (${registrations.length} total)`,
      html: buildNotificationEmail(session.name, session.email, cityLabel, registrations.length),
      tags: [
        { name: 'type', value: 'ready-to-train-notification' },
        { name: 'city', value: city },
      ],
    })

    console.log(`✅ Ready-to-train: ${session.email} for ${cityLabel} (total: ${registrations.length})`)

    return NextResponse.json({
      success: true,
      message: `You're in the ${cityLabel} pool! We'll notify you when 8+ clinicians are ready.`,
      totalInPool: registrations.length,
    })
  } catch (error) {
    console.error('Ready-to-train error:', error)
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
        You're in the ${city} Training Pool
      </h2>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Hi ${escapeHtml(name.split(' ')[0])},
      </p>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Great work completing all 8 online modules! You've been added to the <strong>${city} hands-on training pool</strong>.
      </p>

      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="font-size: 14px; color: #0f766e; margin: 0; font-weight: 600;">
          Once 8+ clinicians are ready in ${city}, we'll lock in a date and send you booking details.
        </p>
      </div>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        In the meantime, keep reviewing your modules to stay sharp for the practical day.
      </p>

      <a href="https://portal.concussion-education-australia.com/dashboard"
         style="display: inline-block; background: #5b9aa6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
        Back to Dashboard →
      </a>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 32px; line-height: 1.5;">
        Questions? Reply to this email or contact
        <a href="mailto:zac@concussion-education-australia.com" style="color: #5b9aa6;">zac@concussion-education-australia.com</a>
      </p>
    </div>
  `
}

function buildNotificationEmail(name: string, email: string, city: string, totalCount: number): string {
  const threshold = totalCount >= 8
    ? `<div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin-top: 16px;">
        <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">
          🎉 ${city} has reached ${totalCount} people — ready to schedule a workshop!
        </p>
      </div>`
    : `<p style="font-size: 13px; color: #64748b; margin-top: 16px;">
        ${8 - totalCount} more needed to reach the 8-person threshold for ${city}.
      </p>`

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 16px;">
        New Ready-to-Train Registration
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
          <td style="padding: 8px 0; color: #64748b;">Pool Size</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${totalCount} / 8</td>
        </tr>
      </table>

      ${threshold}

      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        This is an automated notification from ConcussionPro portal.
      </p>
    </div>
  `
}
