import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserById } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { isAdminRequest } from '@/lib/require-admin'

// In-memory send dedup — prevents duplicate magic-link emails if the admin
// UI double-submits (Enter key re-fires even when button is disabled).
// Resets on cold start, which is fine — only protects against rapid retries.
const recentSends = new Map<string, number>()
const DEDUP_WINDOW_MS = 30_000

export async function POST(request: NextRequest) {
  // Require admin authentication
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name, amount, location } = await request.json()

    if (!email || !name || !amount) {
      return NextResponse.json(
        { error: 'Email, name, and amount are required' },
        { status: 400 }
      )
    }

    // Dedup by email+amount — same admin call repeated within 30s returns
    // the previous magic link instead of sending a duplicate email.
    const dedupKey = `${String(email).toLowerCase()}:${amount}`
    const now = Date.now()
    const lastSent = recentSends.get(dedupKey)
    if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
      console.log(`[admin/create-user] Skipping duplicate send for ${String(email).slice(0, 3)}*** (last send ${now - lastSent}ms ago)`)
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: `Duplicate suppressed — email already sent in the last ${Math.round(DEDUP_WINDOW_MS / 1000)}s`,
      })
    }

    const accessLevel = amount >= CONFIG.COURSE.PRICE_EARLY_BIRD ? 'full-course' : 'online-only'

    // workshopLocation only makes sense on a full-course sale, and must be a
    // known CONFIG.LOCATIONS slug — otherwise the seat board / enrollment
    // counts would silently miss (or mis-bucket) manual sales.
    const validLocations = new Set(Object.values(CONFIG.LOCATIONS).map((l) => l.slug))
    const workshopLocation =
      accessLevel === 'full-course' && typeof location === 'string' && validLocations.has(location)
        ? location
        : undefined

    const userId = await createUser({
      email,
      name,
      accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
      signupSource: 'admin',
      ...(workshopLocation ? { workshopLocation } : {}),
    })

    const user = await findUserById(userId)
    if (!user) {
      throw new Error('User creation failed')
    }

    const token = createMagicToken(userId, email, name, accessLevel as 'online-only' | 'full-course' | 'preview')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const magicLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

    const emailSent = await sendMagicLinkEmail(email, token, baseUrl)
    recentSends.set(dedupKey, now)
    // Sweep old entries so the map doesn't grow unbounded
    for (const [k, t] of recentSends) if (now - t > DEDUP_WINDOW_MS * 2) recentSends.delete(k)

    console.log(`\u2705 User created via admin: ${String(email).slice(0, 3)}*** (${accessLevel})`)

    return NextResponse.json({
      success: true,
      userId,
      accessLevel,
      emailSent,
      magicLink,
    })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
