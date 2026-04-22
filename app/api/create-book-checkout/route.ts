import { NextRequest, NextResponse } from 'next/server'
import { createBookCheckoutSession } from '@/lib/book'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `book-checkout:${ip}`, limit: 10, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please wait.' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const { email, currency, utm } = body as { email?: string; currency?: 'aud' | 'usd'; utm?: Record<string, string> }

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : undefined
    if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const session = await createBookCheckoutSession({
      customerEmail: emailStr,
      successUrl: `${baseUrl}/reference/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/reference?canceled=true`,
      currency: currency === 'usd' ? 'usd' : 'aud',
      utm: utm && typeof utm === 'object' ? utm : undefined,
    })

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Book checkout session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
