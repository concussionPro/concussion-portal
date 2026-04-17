import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge-compatible constant-time string comparison
// Pads shorter string to prevent leaking length via timing
function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  const aPadded = a.padEnd(maxLen, '\0')
  const bPadded = b.padEnd(maxLen, '\0')
  let result = a.length ^ b.length // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) {
    result |= aPadded.charCodeAt(i) ^ bPadded.charCodeAt(i)
  }
  return result === 0
}

// No public docs — all require at least an email capture
const PUBLIC_DOCS = new Set<string>([])

// Docs accessible to any authenticated user (including preview/free accounts)
const AUTH_DOCS = new Set([
  '/docs/SCAT6_Fillable.pdf',
  '/docs/SCOAT6_Fillable.pdf',
])

// Files that paid users can access directly (served via CDN, not serverless)
// Large files MUST be served via CDN to bypass Vercel's 4.5 MB serverless body limit
const PAID_DOCS = new Set([
  '/docs/CCM_Complete_Reference_2026.pdf',
  '/docs/SCAT-SCOAT_FillablePDFs.zip',
  '/docs/ClinicalToolkit_Complete.zip',
  '/docs/SCAT6_Flat.pdf',
  '/docs/SCOAT6_Flat.pdf',
  '/docs/Child_SCAT6_Flat.pdf',
])

// Edge-compatible HMAC-SHA256 signature verification (base64url)
async function verifyHmacSig(payloadStr: string, signature: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadStr))
  const sigBytes = new Uint8Array(sigBuffer)
  let binary = ''
  for (let i = 0; i < sigBytes.length; i++) binary += String.fromCharCode(sigBytes[i])
  const expectedSig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return constantTimeEqual(signature, expectedSig)
}

// Edge-compatible admin cookie verification
async function verifyAdminCookieEdge(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const [payloadStr, signature] = token.split('.')
    if (!payloadStr || !signature) return false
    if (!(await verifyHmacSig(payloadStr, signature))) return false

    const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    if (payload.type !== 'admin') return false
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

// Edge-compatible session verification using Web Crypto API
async function verifySessionEdge(token: string): Promise<{ accessLevel: string; exp: number } | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payloadStr, signature] = parts
    if (!payloadStr || !signature) return null

    const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
    if (!secret) return null

    // Import key for HMAC-SHA256 (Web Crypto API — Edge-compatible)
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Compute expected signature
    const sigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payloadStr)
    )

    // Convert to base64url
    const sigBytes = new Uint8Array(sigBuffer)
    let binary = ''
    for (let i = 0; i < sigBytes.length; i++) {
      binary += String.fromCharCode(sigBytes[i])
    }
    const expectedSig = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Constant-time comparison
    if (!constantTimeEqual(signature, expectedSig)) return null

    // Decode payload (base64url → JSON)
    const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    const payload = JSON.parse(decoded)

    // Check expiration
    if (payload.exp < Date.now()) return null

    // Reject non-session tokens (e.g. magic link tokens)
    if (payload.type !== 'session') return null

    return payload
  } catch {
    return null
  }
}

// Bot user-agent patterns — don't geo-redirect crawlers
const BOT_UA_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|twitterbot|whatsapp|googlebot|gptbot|claude|chatgpt|perplexity/i

// CSRF: same-origin check for state-changing API calls.
// Stripe webhooks (verified by signature) and Vercel cron (verified by CRON_SECRET
// or admin key) are exempt because they're server-to-server, not browser-CSRF-susceptible.
const CSRF_EXEMPT_PREFIXES = [
  '/api/webhooks/',
  '/api/cron/',
]
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  if (!host) return false

  // Derive candidate origins from Origin or Referer headers
  const candidate = origin || (referer ? (() => { try { return new URL(referer).origin } catch { return null } })() : null)

  // No Origin/Referer at all → block (modern browsers send Origin on cross-origin POSTs;
  // absence is suspicious for state-changing calls)
  if (!candidate) return false
  if (candidate === 'null') return false

  let candidateUrl: URL
  try {
    candidateUrl = new URL(candidate)
  } catch {
    return false
  }

  // Match against the request host (Vercel terminates TLS, so request sees http/https correctly)
  if (candidateUrl.host === host) return true

  // Allow the configured app URL (handles Cloudflare/proxy host mismatch)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      if (candidateUrl.host === new URL(appUrl).host) return true
    } catch { /* bad env value */ }
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── CSRF: reject cross-origin state-changing requests to /api/* ───────────
  if (
    pathname.startsWith('/api/') &&
    UNSAFE_METHODS.has(request.method) &&
    !CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { error: 'Forbidden — cross-origin request rejected' },
        { status: 403 }
      )
    }
  }

  // ─── Geo-routing: /pricing → /pricing-international for non-AU/NZ ─────────
  if (pathname === '/pricing') {
    // Cloudflare proxies requests, so Vercel sees Cloudflare's IP, not the user's.
    // cf-ipcountry has the real user's country; x-vercel-ip-country is the fallback.
    const country = request.headers.get('cf-ipcountry')
      || request.headers.get('x-vercel-ip-country')
    const ua = request.headers.get('user-agent') || ''

    // Don't redirect bots (preserve SEO for /pricing)
    if (!BOT_UA_PATTERN.test(ua)) {
      // Redirect non-AU/NZ visitors to international pricing
      if (country && country !== 'AU' && country !== 'NZ') {
        const intlUrl = request.nextUrl.clone()
        intlUrl.pathname = '/pricing-international'
        // Preserve query params (e.g. ?canceled=true, ?location=sydney)
        return NextResponse.redirect(intlUrl, 302)
      }
    }
  }

  // Block direct access to CourseContent brochure — paid content only
  if (pathname === '/CourseContent_2026.pdf') {
    const sessionToken = request.cookies.get('session')?.value
    if (sessionToken) {
      const session = await verifySessionEdge(sessionToken)
      if (session && (session.accessLevel === 'online-only' || session.accessLevel === 'full-course')) {
        return NextResponse.next()
      }
    }
    return NextResponse.json(
      { error: 'Please log in to access this resource.' },
      { status: 401 }
    )
  }

  // Handle /docs/ file access (PDFs and ZIPs)
  if (pathname.startsWith('/docs/') && (pathname.endsWith('.pdf') || pathname.endsWith('.zip'))) {
    // Public docs — always allow
    if (PUBLIC_DOCS.has(pathname)) {
      return NextResponse.next()
    }

    // Auth docs — any logged-in user can access (including preview/free accounts)
    if (AUTH_DOCS.has(pathname)) {
      const sessionToken = request.cookies.get('session')?.value
      if (sessionToken) {
        const session = await verifySessionEdge(sessionToken)
        if (session) {
          return NextResponse.next()
        }
      }
      return NextResponse.json(
        { error: 'Please log in to download this file.' },
        { status: 401 }
      )
    }

    // Paid docs — verify session and access level (served via CDN, bypasses serverless body limit)
    if (PAID_DOCS.has(pathname) || PAID_DOCS.has(decodeURIComponent(pathname))) {
      const sessionToken = request.cookies.get('session')?.value
      if (sessionToken) {
        const session = await verifySessionEdge(sessionToken)
        if (session && (session.accessLevel === 'online-only' || session.accessLevel === 'full-course')) {
          return NextResponse.next()
        }
      }
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    // All other docs — block direct access
    return NextResponse.json(
      { error: 'Direct access not allowed. Please download via the Clinical Toolkit.' },
      { status: 403 }
    )
  }

  // Block direct PDF access in /resources/ directory
  if (pathname.startsWith('/resources/') && pathname.endsWith('.pdf')) {
    return NextResponse.json(
      { error: 'Direct access not allowed. Access via /resources page.' },
      { status: 403 }
    )
  }

  // Protected frontend routes — require valid session, redirect to /login if missing
  const protectedPrefixes = ['/learning', '/dashboard', '/settings', '/clinical-toolkit', '/complete-reference', '/assessment', '/scat-course', '/references']
  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const session = await verifySessionEdge(sessionToken)
    if (!session) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin UI pages — require valid admin_session cookie, redirect to /admin/login if missing.
  // Login endpoints themselves are public.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookie = request.cookies.get('admin_session')?.value
    const ok = await verifyAdminCookieEdge(cookie)
    if (!ok) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      if (pathname !== '/admin') loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin API routes: accept (1) admin_session cookie, (2) x-admin-key header,
  // or (3) Bearer <ADMIN_API_KEY> for machine-to-machine clients (cron, curl).
  // Exempt: /api/admin/login (must be callable to get a session).
  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login') {
    const cookie = request.cookies.get('admin_session')?.value
    const cookieOk = await verifyAdminCookieEdge(cookie)

    if (!cookieOk) {
      const adminKey = request.headers.get('x-admin-key')
      const authHeader = request.headers.get('authorization')
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      const envKey = process.env.ADMIN_API_KEY
      if (!envKey) {
        return NextResponse.json({ error: 'Admin API not configured' }, { status: 503 })
      }
      const keyMatch = adminKey ? constantTimeEqual(adminKey, envKey) : false
      const bearerMatch = bearerToken ? constantTimeEqual(bearerToken, envKey) : false
      if (!keyMatch && !bearerMatch) {
        return NextResponse.json(
          { error: 'Unauthorized \u2014 admin API key required' },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/pricing',
    '/CourseContent_2026.pdf',
    '/docs/:path*.pdf',
    '/docs/:path*.zip',
    '/resources/:path*.pdf',
    '/api/:path*',
    '/admin/:path*',
    '/learning/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/clinical-toolkit/:path*',
    '/complete-reference/:path*',
    '/assessment/:path*',
    '/scat-course/:path*',
    '/references/:path*',
  ]
}
