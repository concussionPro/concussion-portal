import { NextRequest, NextResponse } from 'next/server'
import { detectCountry, isInternational } from '@/lib/geo'

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
  return NextResponse.json({
    detectedCountry: country,
    routedAsInternational: isInternational(country),
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
