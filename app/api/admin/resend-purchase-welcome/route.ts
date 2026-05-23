/**
 * Admin tool: re-send the post-purchase welcome email (the rich "You're in"
 * template) to a user. If they're still 'preview', upgrade their access
 * level to match the provided courseType. Useful when:
 *   - A customer paid under a different email and we need to manually
 *     route the welcome to their actual working address.
 *   - The original welcome send failed and we're re-issuing.
 *
 * Auth: admin cookie / x-admin-key / Bearer.
 * POST body: {
 *   email: string            (required — recipient)
 *   courseType?: 'online-only' | 'full-course' | 'workshop-upgrade' | 'international-online'
 *                            (default: 'online-only')
 *   workshopCity?: string    ('melbourne' | 'sydney' | 'byron-bay')
 *   amount?: number          (default: PRICE_ONLINE or PRICE_EARLY_BIRD based on courseType)
 *   currency?: string        (default: 'AUD')
 *   upgradeAccess?: boolean  (default: true — upgrade preview users to match courseType)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, createUser } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendPostPurchaseLoginEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { CONFIG } from '@/lib/config'

const COURSE_TYPES = ['online-only', 'full-course', 'workshop-upgrade', 'international-online'] as const
type CourseType = typeof COURSE_TYPES[number]

function labelForCourse(courseType: CourseType, accessLevel: string): string {
  switch (courseType) {
    case 'full-course': return 'Complete Concussion Course (online + workshop) — 14 CPD hours'
    case 'online-only': return 'Online Concussion Course — 8 CPD hours'
    case 'workshop-upgrade': return 'Workshop Upgrade — hands-on training + 6 additional CPD hours'
    case 'international-online': return 'Online Concussion Course (International) — 8 CPD hours'
    default: return accessLevel === 'full-course' ? 'Complete Concussion Course' : 'Online Concussion Course'
  }
}

function defaultAmount(courseType: CourseType): number {
  if (courseType === 'full-course' || courseType === 'workshop-upgrade') return CONFIG.COURSE.PRICE_EARLY_BIRD
  if (courseType === 'international-online') return CONFIG.COURSE.PRICE_INTERNATIONAL
  return CONFIG.COURSE.PRICE_ONLINE
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(request.url)
  return handleSend(request, {
    email: url.searchParams.get('email') || undefined,
    courseType: url.searchParams.get('courseType') || undefined,
    workshopCity: url.searchParams.get('workshopCity') || undefined,
    amount: url.searchParams.get('amount') ? Number(url.searchParams.get('amount')) : undefined,
    currency: url.searchParams.get('currency') || undefined,
    upgradeAccess: url.searchParams.get('upgradeAccess') !== 'false',
  })
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email?: string
    courseType?: string
    workshopCity?: string
    amount?: number
    currency?: string
    upgradeAccess?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  return handleSend(request, body)
}

async function handleSend(_request: NextRequest, body: {
  email?: string
  courseType?: string
  workshopCity?: string
  amount?: number
  currency?: string
  upgradeAccess?: boolean
}) {
  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const courseType: CourseType = (COURSE_TYPES as readonly string[]).includes(body.courseType || '')
    ? (body.courseType as CourseType)
    : 'online-only'
  const upgradeAccess = body.upgradeAccess !== false
  const workshopCity = body.workshopCity?.trim().toLowerCase() || undefined
  const amount = typeof body.amount === 'number' ? body.amount : defaultAmount(courseType)
  const currency = (body.currency || 'AUD').toUpperCase()

  const accessLevel: 'online-only' | 'full-course' = (courseType === 'full-course' || courseType === 'workshop-upgrade')
    ? 'full-course'
    : 'online-only'

  // Find or create / upgrade user
  const existing = await findUserByEmail(email)
  let userId: string
  let userName: string
  let finalAccess: 'preview' | 'online-only' | 'full-course'

  if (existing) {
    userId = existing.id
    userName = existing.name || 'there'
    const shouldUpgrade = upgradeAccess && (
      (existing.accessLevel === 'preview' && (accessLevel === 'online-only' || accessLevel === 'full-course')) ||
      (existing.accessLevel === 'online-only' && accessLevel === 'full-course')
    )
    if (shouldUpgrade) {
      await createUser({
        email,
        name: userName,
        accessLevel,
        workshopLocation: workshopCity || undefined,
        signupSource: 'admin',
      })
      finalAccess = accessLevel
    } else {
      finalAccess = existing.accessLevel as 'preview' | 'online-only' | 'full-course'
    }
  } else {
    // Create fresh user at the target access level
    userName = 'there'
    userId = await createUser({
      email,
      name: userName,
      accessLevel,
      workshopLocation: workshopCity || undefined,
      signupSource: 'admin',
    })
    finalAccess = accessLevel
  }

  const token = createMagicToken(userId, email, userName, finalAccess)
  const melConfirmed = workshopCity === 'melbourne' && CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed'

  const emailSent = await sendPostPurchaseLoginEmail({
    email,
    token,
    firstName: userName,
    courseLabel: labelForCourse(courseType, finalAccess),
    accessLevel: finalAccess,
    amount,
    currency,
    workshopCity,
    workshopDate: melConfirmed ? CONFIG.LOCATIONS.MELBOURNE.date : undefined,
    workshopVenue: melConfirmed ? 'Rydges Melbourne, Exhibition St' : undefined,
    accommodationPerkLine: melConfirmed ? `${CONFIG.VENUE_BENEFITS.MELBOURNE.accommodationDiscountPct}% off ${CONFIG.VENUE_BENEFITS.MELBOURNE.hotelName} accommodation — booking link and code in your follow-up email` : undefined,
  })

  return NextResponse.json({
    success: emailSent,
    email,
    userId,
    accessLevel: finalAccess,
    upgraded: existing ? (existing.accessLevel !== finalAccess) : true,
    courseType,
    workshopCity: workshopCity || null,
    amount,
    currency,
  })
}
