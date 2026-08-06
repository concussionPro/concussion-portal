import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { detectCountry, isInternational, isHomeCountry } from '@/lib/geo'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

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

// The gate lists live in lib/gated-docs.ts so /api/auth/verify can honour a
// post-login redirect back to an AUTH_DOC without re-declaring the list.
import { isPublicDoc, isAuthDoc, isPaidDoc } from '@/lib/gated-docs'

/**
 * Is this a browser NAVIGATION (someone tapped a link) rather than a
 * programmatic fetch/XHR/`download` request?
 *
 * A gated asset denied to a navigation must NOT answer with a raw JSON body —
 * that renders `{"error":"Please log in…"}` in a tab. Two public pages link
 * gated assets by design (/course → the brochure PDF, /scat-forms/scat6 → the
 * official SCAT6 fillable, offered mid-assessment), so this was a clinician
 * hitting a JSON blob with a patient in front of them (2026-08-05 live crawl).
 * Programmatic callers keep the JSON shape they already parse.
 */
function isBrowserNavigation(request: NextRequest): boolean {
  const mode = request.headers.get('sec-fetch-mode')
  if (mode) return mode === 'navigate'
  return (request.headers.get('accept') || '').includes('text/html')
}

function docDenialHtml(title: string, message: string, ctaHref: string, ctaLabel: string): string {
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
  p{font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px}
  a{display:inline-block;padding:14px 28px;background:#5b9aa6;color:#fff;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none}
</style>
</head><body>
<div class="card">
  <h1>${esc(title)}</h1>
  <p>${esc(message)}</p>
  <a href="${esc(ctaHref)}">${esc(ctaLabel)}</a>
</div>
</body></html>`
}

const DENIAL_HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }

/**
 * Deny a gated asset. Same status and same JSON body as before for
 * programmatic callers; a human-readable page for browser navigations.
 *
 * `loginRedirect` is only ever set when the request has NO valid session —
 * bouncing an authenticated-but-unentitled visitor to /login would loop
 * (/login redirects a signed-in user straight back to ?redirect).
 *
 * "No valid session" is NOT the same as "no identity". /login redirects on
 * whatever /api/auth/session resolves, and that route falls back to the demo
 * cookies (and, off production, to a synthetic dev preview user) when the
 * session cookie is missing or stale. Such a browser bounces asset → /login →
 * asset → … until the browser gives up with ERR_TOO_MANY_REDIRECTS, and no
 * amount of logging in helps because a demo identity can never satisfy these
 * gates. Those callers get the readable page instead.
 */
function hasNonSessionIdentity(request: NextRequest): boolean {
  return (
    request.cookies.get('demo_key')?.value === DEMO_KEY ||
    request.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY ||
    // Dev server only (not `test`, which must exercise the production path):
    // /api/auth/session hands localhost a synthetic preview user with no
    // cookie at all, so every gated asset would bounce forever.
    process.env.NODE_ENV === 'development'
  )
}

function denyDoc(
  request: NextRequest,
  opts: {
    status: 401 | 403
    error: string
    title: string
    message: string
    ctaHref: string
    ctaLabel: string
    loginRedirect?: boolean
  },
): NextResponse {
  if (isBrowserNavigation(request)) {
    if (opts.loginRedirect && !hasNonSessionIdentity(request)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = ''
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return new NextResponse(
      docDenialHtml(opts.title, opts.message, opts.ctaHref, opts.ctaLabel),
      { status: opts.status, headers: DENIAL_HTML_HEADERS },
    )
  }
  return NextResponse.json({ error: opts.error }, { status: opts.status })
}

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
async function verifySessionEdge(token: string): Promise<{ accessLevel: string; email?: string; exp: number } | null> {
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
//
// Unsubscribe endpoints are exempt because RFC 8058 one-click unsubscribe
// (Gmail / Apple Mail / Microsoft "Unsubscribe" header button) POSTs without
// an Origin header — blocking them returns 403 and the recipient marks the
// email as spam instead, pushing complaint rate toward Gmail's 0.30% red
// line. Token-based verification inside the endpoint prevents abuse.
const CSRF_EXEMPT_PREFIXES = [
  '/api/webhooks/',
  '/api/cron/',
  '/api/prospect/unsubscribe',
  '/api/unsubscribe',
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

  // STATIC-ASSET GATES MATCH ON THE DECODED PATH (2026-08-06 server-surface
  // audit — P0, proven live). The gates below tested the RAW pathname against
  // an EXTENSION (`/\.(pdf|zip|docx|png)$/`, `endsWith('.pdf')`,
  // `=== '/CourseContent_2026.pdf'`), and the route matcher was likewise keyed
  // on `.pdf`/`.zip`/`.docx`/`.png` suffixes. A percent-encoded dot therefore
  // missed BOTH: middleware never ran, and Vercel's static handler decoded the
  // path and served the file. Every paid asset was downloadable anonymously —
  // verified in production: `/docs/CCM_Complete_Reference_2026%2Epdf` returned
  // 200 application/pdf (6 MB, the A$97 Clinical Reference Text), as did the
  // Clinical Toolkit ZIP, the fillable-PDF pack and `/CourseContent_2026%2Epdf`.
  // Decode ONCE here and gate on the DIRECTORY, never the extension, so the
  // default-deny at the tail of each block is the thing that actually binds.
  // A malformed sequence keeps the raw value, which matches no allowlist entry
  // and so falls through to that same default-deny.
  let assetPath = pathname
  try {
    assetPath = decodeURIComponent(pathname)
  } catch {
    /* malformed encoding → keep raw; it will fail every allowlist and be denied */
  }

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

  // ─── /international — explicit geo-router entry (restored 2026-07-20) ──────
  // This path 404'd (never a route); overseas visitors and ad links pointing at
  // it dead-ended. It's now a smart router: AU/NZ → the normal AUD pricing page,
  // everyone else (incl. unknown geo — /international IMPLIES overseas intent) →
  // the international (USD) pricing page. Bots pass through to /pricing-international
  // so the intl page is the crawlable canonical.
  if (pathname === '/international') {
    const country = detectCountry(request.headers)
    const dest = request.nextUrl.clone()
    // AU/NZ → normal AUD pricing; everyone else INCLUDING unknown geo →
    // international (the /international URL is explicit overseas intent).
    dest.pathname = isHomeCountry(country) ? '/pricing' : '/pricing-international'
    return NextResponse.redirect(dest, 302)
  }

  // ─── Geo-routing: homepage → intl surface for overseas HUMANS ─────────────
  // (owner 2026-07-30: CSP visitors clicking Home from /uk were scrolling AU
  // workshop locations — international is online-only; they must never see AU
  // cities/pricing.) Bots stay for SEO; logged-in users stay (they chose AU);
  // GB gets the CSP-aware /uk, other known-intl gets /pricing-international.
  if (pathname === '/') {
    const country = detectCountry(request.headers)
    const ua = request.headers.get('user-agent') || ''
    const hasSession = !!request.cookies.get('session')?.value
    if (!hasSession && !BOT_UA_PATTERN.test(ua) && isInternational(country)) {
      const intlUrl = request.nextUrl.clone()
      intlUrl.pathname = country === 'GB' ? '/uk' : '/pricing-international'
      return NextResponse.redirect(intlUrl, 302)
    }
  }

  // ─── Geo-routing: /pricing → /pricing-international for non-AU/NZ ─────────
  if (pathname === '/pricing') {
    // Country from the shared detector (cf-ipcountry first — Cloudflare proxies
    // to Vercel, so Vercel's own geo sees CF's edge IP, not the visitor).
    const country = detectCountry(request.headers)
    const ua = request.headers.get('user-agent') || ''
    // Don't redirect bots (preserve SEO for /pricing). Only redirect a KNOWN
    // overseas country — unknown geo stays on /pricing (AU default) so a missing
    // cf-ipcountry header never traps AU buyers on USD pricing.
    if (!BOT_UA_PATTERN.test(ua) && isInternational(country)) {
      const intlUrl = request.nextUrl.clone()
      intlUrl.pathname = '/pricing-international'
      return NextResponse.redirect(intlUrl, 302)
    }
  }

  // Block direct access to CourseContent brochure — paid content only.
  // It is linked as a prominent download card from the PUBLIC /course page,
  // so the anonymous case is the COMMON one and must land somewhere useful.
  if (assetPath === '/CourseContent_2026.pdf') {
    const sessionToken = request.cookies.get('session')?.value
    const session = sessionToken ? await verifySessionEdge(sessionToken) : null
    if (session && (session.accessLevel === 'online-only' || session.accessLevel === 'full-course')) {
      return NextResponse.next()
    }
    return denyDoc(request, {
      status: 401,
      error: 'Please log in to access this resource.',
      loginRedirect: !session,
      title: session ? 'Part of the course' : 'Sign in to open this',
      message: session
        ? 'The full course outline is included with enrolment. Enrol and it opens straight away.'
        : 'The full course outline is for enrolled clinicians. Sign in and it will open automatically.',
      ctaHref: session ? '/pricing' : '/login',
      ctaLabel: session ? 'See enrolment options' : 'Sign in',
    })
  }

  // Handle /docs/ file access (PDFs and ZIPs)
  if (assetPath.startsWith('/docs/')) {
    // Public docs — always allow
    if (isPublicDoc(assetPath)) {
      return NextResponse.next()
    }

    // Auth docs — any logged-in user can access (including preview/free accounts).
    // These are the SCAT/SCOAT forms linked from the PUBLIC /scat-forms pages,
    // offered to a clinician mid-assessment: the denial has to be a page they
    // can act on, and the login round-trip has to come back to the file
    // (/api/auth/verify allows AUTH_DOCS as a preview landing target).
    if (isAuthDoc(assetPath)) {
      const sessionToken = request.cookies.get('session')?.value
      if (sessionToken) {
        const session = await verifySessionEdge(sessionToken)
        if (session) {
          return NextResponse.next()
        }
      }
      return denyDoc(request, {
        status: 401,
        error: 'Please log in to download this file.',
        loginRedirect: true,
        title: 'Sign in to download',
        message:
          'The official SCAT6 and SCOAT6 forms are free — a login just keeps them tied to your account. Sign in and the download starts automatically.',
        ctaHref: '/login',
        ctaLabel: 'Sign in',
      })
    }

    // Paid docs — verify session and access level (served via CDN, bypasses serverless body limit)
    if (isPaidDoc(assetPath)) {
      const sessionToken = request.cookies.get('session')?.value
      const session = sessionToken ? await verifySessionEdge(sessionToken) : null
      if (session && (session.accessLevel === 'online-only' || session.accessLevel === 'full-course')) {
        return NextResponse.next()
      }
      // Reference+Toolkit (A$97) bundle owners are accessLevel 'preview' with
      // a DB flag — every /api/* download grants them, but this CDN gate
      // didn't (2026-07-05 audit: paying tier got 401 on Download-All).
      // Rare path, one indexed lookup, @vercel/postgres is edge-safe.
      if (session?.email) {
        try {
          const { rows } = await sql`
            SELECT 1 FROM users
            WHERE LOWER(email) = LOWER(${session.email})
              AND reference_book_purchased_at IS NOT NULL
            LIMIT 1
          `
          if (rows.length > 0) return NextResponse.next()
        } catch {
          /* fall through to 401 — never fail open on a paid asset */
        }
      }
      return denyDoc(request, {
        status: 401,
        error: 'Authentication required. Please log in to access this resource.',
        loginRedirect: !session,
        title: session ? 'Included with the course' : 'Sign in to access this',
        message: session
          ? 'This download is part of the Clinical Toolkit that comes with enrolment. Open the toolkit to see what your account includes.'
          : 'This download is part of the paid course. Sign in and it will open automatically.',
        ctaHref: session ? '/clinical-toolkit' : '/login',
        ctaLabel: session ? 'Open the Clinical Toolkit' : 'Sign in',
      })
    }

    // All other docs — block direct access
    return denyDoc(request, {
      status: 403,
      error: 'Direct access not allowed. Please download via the Clinical Toolkit.',
      title: 'Download from the toolkit',
      message: 'This file is delivered through the Clinical Toolkit rather than a direct link.',
      ctaHref: '/clinical-toolkit',
      ctaLabel: 'Open the Clinical Toolkit',
    })
  }

  // Block direct PDF access in /resources/ directory
  if (assetPath.startsWith('/resources/')) {
    return denyDoc(request, {
      status: 403,
      error: 'Direct access not allowed. Access via /resources page.',
      title: 'Download from the resources page',
      message: 'This file is delivered from the resources page rather than a direct link.',
      ctaHref: '/resources',
      ctaLabel: 'Go to resources',
    })
  }

  // Protected frontend routes — require valid session, redirect to /login if missing.
  // DEV-ONLY: skip on localhost so the dashboard/courses can be reviewed without login.
  // NOTE: /assessment is NOT here and must not be. It is the "Free Knowledge
  // Test" linked from the site footer on every public page and from
  // /not-found, and its own schema calls it a "Free Skills Assessment" — so
  // login-walling it 307'd both lead-magnet visitors and crawlers to /login.
  // It is a self-contained client-side quiz that saves nothing, so it is
  // genuinely public; anything that persists a result must gate itself.
  const protectedPrefixes = ['/learning', '/dashboard', '/settings', '/clinical-toolkit', '/complete-reference', '/scat-course', '/references']
  if (process.env.NODE_ENV !== 'production' && protectedPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    // Demo viewers browse the portal WITHOUT a session: the reviewer demo
    // (demo_key) and the clinic-prospect demo (clinic_demo → synthetic
    // preview session from /api/auth/session) both pass this gate. Content
    // gating stays with the pages/APIs — a prospect sees the free-tier sell
    // (CCM/CRM locked, Module 1 trial + free courses open), and every
    // session-authed API still 401s without a real session cookie.
    if (
      request.cookies.get('demo_key')?.value === DEMO_KEY ||
      request.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY
    ) {
      return NextResponse.next()
    }
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
    '/',
    '/pricing',
    '/international',
    // Whole DIRECTORY, no extension suffix: a matcher keyed on `.pdf`/`.zip`
    // did not match a percent-encoded dot, so middleware never ran and the
    // paid asset was served straight off the CDN (2026-08-06 audit, P0).
    '/(CourseContent_2026.*)',
    '/docs/:path*',
    // Any docs-LIKE directory, not just /docs. A backup copy of the entire paid
    // toolkit sat at /docs_backup_2026-01/ and served 200 to anonymous requests
    // — md5-identical to /docs/RehabFlow.png, which is in PAID_DOCS and returns
    // 401. The gate was keyed on the exact `/docs/` prefix, so a sibling
    // directory walked straight past it (2026-08-06 master clean, register B).
    // The directory is deleted; this makes the CLASS unreachable rather than
    // just that instance. Uses the SAME regex form as the CourseContent entry
    // above — a two-parameter path-to-regexp pattern ('/docs:suffix(-|_)?:rest*')
    // is rejected at BUILD time with 'Must have text between two parameters',
    // which failed the deploy and left the bypass open for 11 minutes.
    '/(docs.*)',
    '/resources/:path*',
    '/api/:path*',
    '/admin/:path*',
    '/learning/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/clinical-toolkit/:path*',
    '/complete-reference/:path*',
    '/scat-course/:path*',
    '/references/:path*',
  ]
}
