import { NextRequest, NextResponse } from 'next/server'
import { put, list as listBlobs } from '@vercel/blob'
import { sendEmail } from '@/lib/resend-client'

interface InterestRegistration {
  email: string
  name: string
  city: string
  registeredAt: string
}

// Derive valid cities from a single source of truth
const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay'] as const
type ValidCity = (typeof VALID_CITIES)[number]

const CITY_LABELS: Record<ValidCity, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
}

/**
 * POST /api/register-interest
 *
 * Registers interest for a workshop location (especially TBA dates).
 * Stores in Vercel Blob, sends confirmation to registrant, notifies Zac.
 *
 * Body: { email, name, city }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, city } = body

    // Validate inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!city || !(VALID_CITIES as readonly string[]).includes(city)) {
      return NextResponse.json({ error: 'Invalid city.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()
    const cityLabel = CITY_LABELS[city as ValidCity]

    // Load existing registrations for this city
    const blobPath = `interest-${city}.json`
    let registrations: InterestRegistration[] = []

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
      console.warn('Could not load existing registrations:', err)
    }

    // Check for duplicate
    const alreadyRegistered = registrations.some(r => r.email === cleanEmail)
    if (alreadyRegistered) {
      return NextResponse.json({
        success: true,
        message: "You're already registered. We'll notify you when the date is confirmed.",
        duplicate: true,
      })
    }

    // Add new registration
    const newRegistration: InterestRegistration = {
      email: cleanEmail,
      name: cleanName,
      city,
      registeredAt: new Date().toISOString(),
    }
    registrations.push(newRegistration)

    // Save to Vercel Blob
    try {
      await put(blobPath, JSON.stringify(registrations, null, 2), {
        access: 'public',
        contentType: 'application/json',
      })
    } catch (err) {
      console.error('Failed to save registration to Blob:', err)
      // Don't fail the request — emails can still go out
    }

    // Send confirmation email to registrant
    await sendEmail({
      to: cleanEmail,
      subject: `You're on the list — ${cityLabel} Workshop`,
      html: buildConfirmationEmail(cleanName, cityLabel),
      tags: [
        { name: 'type', value: 'interest-confirmation' },
        { name: 'city', value: city },
      ],
    })

    // Notify Zac
    await sendEmail({
      to: 'zac@concussion-education-australia.com',
      subject: `📋 New Interest: ${cityLabel} Workshop — ${cleanName}`,
      html: buildNotificationEmail(cleanName, cleanEmail, cityLabel, registrations.length),
      tags: [
        { name: 'type', value: 'interest-notification' },
        { name: 'city', value: city },
      ],
    })

    console.log(`✅ Interest registered: ${cleanEmail} for ${cityLabel} (total: ${registrations.length})`)

    return NextResponse.json({
      success: true,
      message: `Thanks ${cleanName.split(' ')[0]}! We'll email you as soon as the ${cityLabel} date is confirmed.`,
      totalInterested: registrations.length,
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
        Hi ${name.split(' ')[0]},
      </p>

      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Thanks for registering your interest in our <strong>${city} hands-on workshop</strong>. We're finalising the date and venue — you'll be the first to know when it's confirmed.
      </p>

      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="font-size: 14px; color: #0f766e; margin: 0; font-weight: 600;">
          💡 Can't wait? Start with the online course ($497) and add the workshop later for the difference.
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
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
            <a href="mailto:${email}" style="color: #5b9aa6;">${email}</a>
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
