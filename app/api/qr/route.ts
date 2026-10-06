import { NextRequest } from 'next/server'
import QRCode from 'qrcode'

/**
 * GET /api/qr?d=<url>&s=240 — a QR as a PNG.
 *
 * Exists for EMAIL. Gmail and Outlook both strip inline SVG, so the scannable
 * code in the patient's onboarding email has to be a hosted raster image; the
 * in-app QR stays an SVG component (qrcode.react) where that is fine.
 *
 * Only our own origin is encodable. An open QR generator on a clinical domain
 * is a phishing gadget: someone could mint `portal…/api/qr?d=evil.example` and
 * the code would carry our domain's credibility to their site.
 */
export const runtime = 'nodejs'

const ALLOWED_HOSTS = new Set([
  'portal.concussion-education-australia.com',
  'concussion-education-australia.com',
  'localhost',
])

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('d') || ''
  const size = Math.min(Math.max(Number(request.nextUrl.searchParams.get('s')) || 240, 80), 600)

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response('bad target', { status: 400 })
  }
  if (!['http:', 'https:'].includes(target.protocol) || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('target not allowed', { status: 400 })
  }

  try {
    const png = await QRCode.toBuffer(target.toString(), {
      type: 'png',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0f14ff', light: '#ffffffff' },
    })
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        // Immutable per target: the same link always yields the same code.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('could not render', { status: 500 })
  }
}
