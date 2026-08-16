import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { isPrefetchRequest } from '@/lib/prefetch-guard'

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
 * SCANNERS AND PREFETCHERS ARE THE MAIN THREAT HERE, and it is not a security
 * one — it is a data one. Corporate mail security (Mimecast, Proofpoint,
 * Barracuda, Microsoft SafeLinks) FETCHES EVERY LINK in an inbound email inside
 * its sandbox. This endpoint writes on GET, so without a guard every protected
 * recipient would register a Sydney AND a Byron Bay nomination the moment the
 * mail landed, before a human saw it.
 *
 * That would not merely add noise — it would destroy the only number this
 * campaign exists to produce, and it would look like success while doing it.
 *
 * So: known scanner user-agents and prefetch requests are redirected WITHOUT
 * writing. Both still reach /pricing, so a scanner that follows the redirect
 * sees a normal page and the link is not flagged.
 *
 * It redirects rather than returning JSON: the click should land the person on
 * the page where they can buy, not on a blank success message.
 */

export const dynamic = 'force-dynamic'

/**
 * Same list the demo-tour entry uses. These agents follow links automatically
 * from inside inbound mail; a hit from one is not a person expressing a
 * preference.
 */
const SCANNER_UA = /bot|crawler|spider|headless|safelinks|mimecast|proofpoint|barracuda|googleimageproxy|expanse|urlscan|preview|scan/i

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

  // Fetched by a mail-security sandbox or a link prefetcher, not a person.
  // Redirect normally so nothing looks broken, but record nothing.
  const ua = request.headers.get('user-agent') || ''
  if (SCANNER_UA.test(ua) || isPrefetchRequest(request)) {
    console.log(`[nominate-click] scanner/prefetch ignored (${slug || 'no city'})`)
    return NextResponse.redirect(dest, { status: 302 })
  }

  if (!email || !city || token !== generateUnsubscribeToken(email)) {
    // Never explain WHY to the browser — a signed-link failure that describes
    // itself is a probing aid. Send them to the page they were going to anyway.
    console.warn('[nominate-click] rejected', { hasEmail: !!email, city: slug })
    return NextResponse.redirect(dest, { status: 302 })
  }

  try {
    await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${email}, ${''}, ${slug}, 'q4-blast-click')
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
