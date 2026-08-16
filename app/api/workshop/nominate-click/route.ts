import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { isPrefetchRequest } from '@/lib/prefetch-guard'

/**
 * CITY-NOMINATION LINK FROM AN EMAIL — REDIRECT ONLY, NEVER A WRITE.
 *
 * GET /api/workshop/nominate-click?e=<email>&t=<token>&city=<slug>
 *   → redirects to /pricing with a signed pending-nomination payload; the
 *     nomination is recorded ONLY when the person taps Confirm on the page
 *     (POST /api/workshop/nominate-confirm).
 *
 * WHY THE GET NO LONGER WRITES (2026-08-16, the Q4 blast post-mortem). The
 * first version recorded the nomination on this GET, guarded by a scanner
 * user-agent list and a prefetch check. That guard FAILED in production:
 * Microsoft Defender / SafeLinks detonates every link in an inbound email
 * from Azure egress IPs using a real headless Chromium with a PLAIN Chrome
 * user-agent — nothing in the UA says scanner, it executes JS, and it follows
 * multiple links per email within seconds. Every one of the 8 "Byron Bay
 * nominations" the blast produced came from a corporate/gov/school Microsoft
 * 365 domain, 6 of the 8 source IPs also hit the /upgrade link within 90
 * seconds of the "nomination" (no human clicks upgrade AND register-Byron
 * simultaneously), and ZERO of the ~55 personal-mailbox recipients
 * "nominated". The run/no-run number the campaign existed to produce was
 * 100% scanner noise that looked exactly like success.
 *
 * The only guard that holds against a full-browser detonation is a HUMAN
 * ACTION ON THE LANDING PAGE: the click lands on /pricing, a banner offers
 * one-tap confirmation, and only that in-page POST writes. A sandbox that
 * follows the redirect sees a normal page and records nothing.
 *
 * The UA/prefetch check is kept only to keep known scanners out of the
 * analytics trail — it is no longer load-bearing for data integrity.
 */

export const dynamic = 'force-dynamic'

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
  const valid = !!email && !!city && token === generateUnsubscribeToken(email)

  // The pending-nomination payload rides the redirect. Same HMAC the link
  // itself carried, so the confirm POST can be verified server-side and a
  // nomination cannot be stuffed for someone else's address.
  const dest = new URL(
    valid
      // No #pricing-cards hash: the confirm banner is at the top, and the
      // hash's auto-scroll was also firing pricing_cards_in_view with no
      // human involved — it polluted the behavioral evidence last round.
      ? `/pricing?location=${slug}&utm_source=email&utm_medium=email&utm_campaign=quarterly_blast_v1&utm_content=nominate_${slug}&email=${encodeURIComponent(email)}&nominate=${slug}&ne=${encodeURIComponent(email)}&nt=${token}`
      : '/pricing',
    CONFIG.APP_URL,
  )

  const ua = request.headers.get('user-agent') || ''
  if (SCANNER_UA.test(ua) || isPrefetchRequest(request)) {
    console.log(`[nominate-click] scanner/prefetch (${slug || 'no city'})`)
    return NextResponse.redirect(new URL('/pricing', CONFIG.APP_URL), { status: 302 })
  }

  if (!valid) console.warn('[nominate-click] rejected', { hasEmail: !!email, city: slug })
  return NextResponse.redirect(dest, { status: 302 })
}

/** Build a signed nomination link for an email template. */
export function nominateClickUrl(email: string, citySlug: string): string {
  const t = generateUnsubscribeToken(email)
  return `${CONFIG.APP_URL}/api/workshop/nominate-click?e=${encodeURIComponent(email)}&t=${t}&city=${citySlug}`
}
