import { NextRequest, NextResponse } from 'next/server'
import { detectCountry, readMarketOverride, shouldTreatAsInternational } from '@/lib/geo'

/**
 * GET /api/geo — geo-detection diagnostic.
 *
 * WHY: international visitors weren't being routed to USD pricing. Behind
 * Cloudflare, Vercel sees CF's edge IP, so the ONLY reliable visitor-country
 * signal is the `cf-ipcountry` header — which is present only when Cloudflare's
 * IP Geolocation is enabled (and forwarded). Hit this on a US VPN: if
 * `cf-ipcountry` is absent or wrong, that's the root cause (a Cloudflare setting,
 * not a code bug). Echoes every geo header so the source is unambiguous.
 */
export async function GET(request: NextRequest) {
  const h = request.headers
  const country = detectCountry(h)
  // The nav (components/SiteNav.tsx) reads routedAsInternational to decide
  // whether Pricing/Enrol point at the AUD page. It must apply the SAME
  // cea_market override middleware and checkout use — otherwise an AU clinician
  // abroad or on a VPN who has chosen ?market=au keeps /pricing (middleware
  // honours the cookie) while the nav still sends them to /cata or
  // /pricing-international and drops Courses (found 2026-09-20).
  const market = readMarketOverride(request.cookies)
  return NextResponse.json({
    detectedCountry: country,
    marketOverride: market,
    routedAsInternational: shouldTreatAsInternational(market, country),
    headers: {
      'cf-ipcountry': h.get('cf-ipcountry'),
      'x-vercel-ip-country': h.get('x-vercel-ip-country'),
      'x-vercel-ip-country-region': h.get('x-vercel-ip-country-region'),
      'cf-ray': h.get('cf-ray'),
      'x-forwarded-for': h.get('x-forwarded-for'),
    },
    note:
      country == null
        ? 'No country header present. Behind Cloudflare, enable IP Geolocation (Cloudflare → Rules → add cf-ipcountry / or Network → IP Geolocation ON) so cf-ipcountry is set. Until then international visitors cannot be detected.'
        : 'Country detected. If this is wrong on a VPN, the VPN exit IP may be mis-geolocated by the provider.',
  })
}
