import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

/**
 * ONE-CLICK CITY NOMINATION FROM AN EMAIL.
 *
 * GET /api/workshop/nominate-click?e=<email>&t=<token>&city=<slug>
 *   → records the nomination, then redirects to /pricing for that city.
 *
 * WHY A GET. /api/workshop/nominate is POST and expects a JSON body with the
 * name — fine from a signed-in dashboard, impossible from an email button. The
 * whole point of this campaign is to turn "I'll wait for the Sydney one" into a
 * countable action, and an action that requires filling in a form is one most
 * people will not take.
 *
 * SIGNED, because a GET that writes must not be forgeable. The token is the
 * same HMAC used for one-click unsubscribe, so a link can only be minted by us
 * and a nomination cannot be stuffed for someone else's address.
 *
 * SAFE TO PREFETCH. Recording a city preference is idempotent
 * (ON CONFLICT DO NOTHING) and carries no cost or side effect beyond a row, so
 * unlike the entitlement-grant routes this one does not need a prefetch guard.
 *
 * It redirects rather than returning JSON: the click should land the person on
 * the page where they can buy, not on a blank success message.
 */

export const dynamic = 'force-dynamic'

const CITIES: Record<string, string> = {
  sydney: 'Sydney',
  'byron-bay': 'Byron Bay',
  melbourne: 'Melbourne',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const email = (sp.get('e') || '').trim().toLowerCase()
  const token = sp.get('t') || ''
  const slug = (sp.get('city') || '').trim().toLowerCase()
  const city = CITIES[slug]

  const dest = new URL(
    city ? `/pricing?location=${slug}#pricing-cards` : '/pricing',
    CONFIG.APP_URL,
  )

  if (!email || !city || token !== generateUnsubscribeToken(email)) {
    // Never explain WHY to the browser — a signed-link failure that describes
    // itself is a probing aid. Send them to the page they were going to anyway.
    console.warn('[nominate-click] rejected', { hasEmail: !!email, city: slug })
    return NextResponse.redirect(dest, { status: 302 })
  }

  try {
    await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${email}, ${''}, ${city}, 'q4-blast-click')
      ON CONFLICT (email, city) DO NOTHING
    `
    console.log(`[nominate-click] ${city} recorded`)
  } catch (err) {
    // A failed write must not cost the click — they still reach the page.
    console.error('[nominate-click] write failed:', err)
  }

  return NextResponse.redirect(dest, { status: 302 })
}

/** Build a signed nomination link for an email template. */
export function nominateClickUrl(email: string, citySlug: string): string {
  const t = generateUnsubscribeToken(email)
  return `${CONFIG.APP_URL}/api/workshop/nominate-click?e=${encodeURIComponent(email)}&t=${t}&city=${citySlug}`
}
