import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import {
  createCourseCheckoutSession,
  CheckoutUnavailableError,
  redactStripeSecrets,
  VALID_COURSE_TYPES,
  VALID_LOCATIONS,
  type CourseType,
} from '@/lib/stripe'
import { findUserByEmail } from '@/lib/users'
import { hubAddonContact, HUB_ADDON_CAL_URL, HUB_ADDON_EMAIL } from '@/lib/hub-addon-contact'

/**
 * GET /pay/[code]
 *
 * Just-in-time short link for admin-generated upgrade checkouts.
 *
 * Stripe checkout sessions cap at expires_at = 24h max. To make
 * admin-emailed links effectively permanent, we DON'T pre-create the
 * Stripe session — we store only the intent (email + location). When
 * the recipient clicks, we create a fresh session and 302 to it. Each
 * click gets its own 24h window; from the recipient's perspective the
 * short link never expires.
 */
// Personalised checkout links must never be indexed. This is a route handler
// (no page component), so noindex is set via the X-Robots-Tag header rather
// than a metadata export.
const NOINDEX_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow' }

function isBrowserNavigation(request: NextRequest): boolean {
  const mode = request.headers.get('sec-fetch-mode')
  if (mode) return mode === 'navigate'
  return (request.headers.get('accept') || '').includes('text/html')
}

function hubAddonHtml(courseType: 'clinic-hub-extra-seat' | 'clinic-workshop-upgrade'): string {
  const c = hubAddonContact(courseType)
  const title = courseType === 'clinic-hub-extra-seat' ? 'Add Hub Pack seats' : 'Add workshop places'
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} | Concussion Education Australia</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.08);padding:40px 32px;max-width:440px;width:100%;text-align:center}
  h1{font-size:22px;margin:0 0 8px}
  p{font-size:15px;color:#475569;line-height:1.6;margin:0 0 20px}
  .actions{display:flex;flex-direction:column;gap:10px}
  a{display:inline-block;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none}
  a.primary{background:#5b9aa6;color:#fff}
  a.secondary{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
</style>
</head><body>
<div class="card">
  <h1>${esc(title)}</h1>
  <p>${esc(c.message)}</p>
  <div class="actions">
    <a class="primary" href="${esc(c.mailto)}">Email ${esc(HUB_ADDON_EMAIL)}</a>
    <a class="secondary" href="${esc(HUB_ADDON_CAL_URL)}" target="_blank" rel="noopener">Book a 30-min call</a>
  </div>
</div>
</body></html>`
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  if (!code || !/^[A-Za-z0-9_-]{4,32}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400, headers: NOINDEX_HEADERS })
  }
  try {
    const { rows } = await sql<{ email: string; location: string | null; course_type: string | null }>`
      SELECT email, location, course_type FROM pay_links WHERE code = ${code} LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404, headers: NOINDEX_HEADERS })
    }
    const { email, location, course_type } = rows[0]
    const courseType = (course_type ?? 'workshop-upgrade') as CourseType

    // The row is admin-authored free text. An unrecognised course_type used to
    // fall through to createCourseCheckoutSession's final `else`, which prices
    // the COMPLETE COURSE — so a typo billed a recipient $1,190 for a product
    // nobody chose. And the two Hub Pack add-ons have no webhook fulfilment at
    // all (same refusal as /api/create-checkout), so a charge would deliver
    // nothing. Refuse both rather than take the money.
    if (!VALID_COURSE_TYPES.includes(courseType)) {
      return NextResponse.json(
        { error: 'This payment link is misconfigured. Please contact zac@concussion-education-australia.com.' },
        { status: 409, headers: NOINDEX_HEADERS },
      )
    }
    if (courseType === 'clinic-hub-extra-seat' || courseType === 'clinic-workshop-upgrade') {
      // Browser navigations (admin-emailed /pay links) get a readable page with
      // mailto + Cal; programmatic callers keep the structured JSON.
      if (isBrowserNavigation(request)) {
        return new NextResponse(hubAddonHtml(courseType), {
          status: 200,
          headers: { ...NOINDEX_HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      }
      return NextResponse.json(hubAddonContact(courseType), { status: 409, headers: NOINDEX_HEADERS })
    }
    // A city that isn't a real workshop location silently becomes a nomination
    // for a place that has no Ready-to-Train pipeline — the buyer pays and
    // never appears in any city's count.
    const needsLocation = courseType === 'full-course' || courseType === 'workshop-upgrade'
    if (needsLocation && !VALID_LOCATIONS.includes(location as (typeof VALID_LOCATIONS)[number])) {
      return NextResponse.json(
        { error: 'This payment link is missing a valid workshop city. Please contact zac@concussion-education-australia.com.' },
        { status: 409, headers: NOINDEX_HEADERS },
      )
    }

    // Validate the user is still in a state where this upgrade makes sense.
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Recipient account no longer exists.' }, { status: 410, headers: NOINDEX_HEADERS })
    }
    if (courseType === 'workshop-upgrade' && user.accessLevel !== 'online-only') {
      // Already upgraded — send them to the dashboard rather than charging again.
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      return NextResponse.redirect(`${baseUrl}/dashboard`, { status: 302, headers: NOINDEX_HEADERS })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const session = await createCourseCheckoutSession({
      courseType,
      location: location ?? undefined,
      customerEmail: user.email,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/upgrade?canceled=true`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500, headers: NOINDEX_HEADERS })
    }
    return NextResponse.redirect(session.url, { status: 302, headers: NOINDEX_HEADERS })
  } catch (err) {
    // Business-rule rejections (workshop already ran / sold out / plan not
    // configured) carry a buyer-readable message — surface those, same as
    // /api/create-checkout does.
    if (err instanceof CheckoutUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 409, headers: NOINDEX_HEADERS })
    }
    // NEVER echo the raw error. This route is UNAUTHENTICATED (any 4-32 char
    // code reaches it) and the guarded block spans both a raw Postgres query
    // and createCourseCheckoutSession. Returning err.message therefore served
    // anonymous callers verbatim Postgres text (table/column names, and the
    // Neon endpoint on a connection failure — measured 2026-08-06: a bogus
    // POSTGRES_URL produced a 500 body containing the full VercelPostgresError)
    // AND verbatim Stripe text, which echoes a misconfigured id back inside
    // the message ("No such price: …", "Invalid API Key provided: sk_live_…").
    // That is exactly the leak redactStripeSecrets exists to stop, on the one
    // public route that could emit it. Log server-side, return a generic 500.
    console.error(`[pay/${code}] checkout link failed:`, redactStripeSecrets(String(err)))
    return NextResponse.json(
      { error: 'Something went wrong opening this payment link. Please try again, or contact zac@concussion-education-australia.com.' },
      { status: 500, headers: NOINDEX_HEADERS },
    )
  }
}
