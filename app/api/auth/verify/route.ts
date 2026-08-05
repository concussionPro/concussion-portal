import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { verifyMagicTokenJWT } from '@/lib/magic-link-jwt'
import { updateLastLogin, findUserById, findUserByEmail } from '@/lib/users'
import { createJWTSession, verifySessionToken, type SessionData } from '@/lib/jwt-session'
import { logAuthFailure, logCriticalError } from '@/lib/monitoring'
import { sql } from '@/lib/db'
import { userOwnsCrm } from '@/lib/crm-course'
import { hasSstEntitlement } from '@/lib/users'
import { isSafeRelativePath } from '@/lib/safe-redirect'
import { isAuthDoc } from '@/lib/gated-docs'
import { isUserEnrolled } from '@/lib/ai-course/access'

/** Ensure the used_magic_tokens table exists (runs once per cold start) */
let tableEnsured = false
async function ensureTokenTable() {
  if (tableEnsured) return
  await sql`CREATE TABLE IF NOT EXISTS used_magic_tokens (
    token_hash TEXT PRIMARY KEY,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`
  tableEnsured = true
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Only allow same-origin relative redirect paths (no open redirect).
 * Shared helper — control chars (tab/CR/etc.) are STRIPPED by the WHATWG URL
 * parser, so '/\t/evil.com' resolves to https://evil.com (2026-08-05 round-G
 * #1: open redirect).
 */
const isValidRedirect = isSafeRelativePath

/**
 * A dead magic link (expired / already used) must NOT dead-end a browser
 * that already holds a valid session — the classic case is a second click
 * on the same email link. Returns the session data if the `session` cookie
 * verifies, otherwise null.
 */
function existingValidSession(request: NextRequest): SessionData | null {
  const cookie = request.cookies.get('session')?.value
  if (!cookie) return null
  return verifySessionToken(cookie)
}

/**
 * Surfaces EVERY preview user owns — free course content and free
 * lead-magnet deliverables. A preview magic link may deep-link into any of
 * these without an extra entitlement lookup.
 */
const PREVIEW_FREE_PREFIXES = [
  '/modules/',          // free SCAT + awareness module content
  '/scat-course',       // the free SCAT course hub (session-gated page)
  '/ai-safety-checklist', // lead-magnet deliverable (the thing they signed up for)
]

/** Surfaces unlocked by AI-course/RTP enrolment (users.ai_course_enrolled). */
const ENROLLED_PREFIXES = [
  '/courses/ai-in-clinical-practice',
  '/concussion-rehab-mastery',
  '/rtp',
]

/**
 * Where a user should land after auth — the SINGLE resolver for every login
 * surface (the interstitial form post, the /auth/verify client page via
 * `redirectTo` in the JSON, and the already-logged-in paths).
 *
 * CRM (EP stream) buyers carry access_level 'preview' because the streams are
 * isolated (lib/crm-course.ts) — so the plain preview rule dropped a PAYING EP
 * customer onto /modules/101, the free SCAT course, every time they used their
 * magic link. Resolve ownership first and send them to their own course.
 */
export async function resolveLandingTarget(
  accessLevel: string,
  email: string,
  redirect: string | null,
): Promise<string> {
  // Preview-level ownership doors, resolved independently:
  //  - CRM (EP stream) buyers → their paid course.
  //  - SST-entitled clinics (trial signups, seated members) → the Clinical
  //    Testing workspace their welcome/invite emails deep-link to. Without
  //    this door the self-serve funnel's first login dropped every trial
  //    clinician onto the free SCAT course.
  const isPreview = accessLevel === 'preview'
  const ownsCrm = isPreview && (await userOwnsCrm(email))
  const isSstClinic = isPreview && (await hasSstEntitlement(email))
  let target = !isPreview
    ? '/dashboard'
    : ownsCrm ? '/ep-course'
    : isSstClinic ? '/clinical-testing'
    : '/modules/101'

  if (!redirect || !isValidRedirect(redirect)) return target

  // Non-preview (paid) users may deep-link anywhere same-origin.
  if (!isPreview) return redirect

  // Preview users may deep-link only into surfaces they actually own:
  // free content/lead-magnets (everyone), their own course (CRM buyers), the
  // clinical workspace (SST clinics), the enrolled-only course + RTP
  // surfaces (users.ai_course_enrolled — the page gate admits exactly these).
  const allowed =
    PREVIEW_FREE_PREFIXES.some(p => redirect.startsWith(p)) ||
    // The SCAT/SCOAT forms: free to any authenticated account, and the exact
    // target the middleware bounces an anonymous clinician from. Without this
    // the login round-trip dropped them on /modules/101 instead of the form
    // they tapped mid-assessment. The middleware still enforces the gate — this
    // only decides where an authenticated user lands.
    isAuthDoc(redirect) ||
    (ownsCrm && redirect.startsWith('/ep-course')) ||
    (isSstClinic && redirect.startsWith('/clinical-testing')) ||
    // Entitlement lookup runs ONLY when the target needs it — normal logins
    // pay no extra query.
    (ENROLLED_PREFIXES.some(p => redirect.startsWith(p)) &&
      (await isUserEnrolled(email).catch(() => false)))

  if (allowed) target = redirect
  return target
}

/** Where an already-logged-in user should land (same rules as fresh login). */
function sessionRedirectTarget(session: SessionData, redirect: string | null): Promise<string> {
  return resolveLandingTarget(session.accessLevel, session.email, redirect)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Minimal self-contained confirm interstitial. Auto-submits a POST on load
 * (JS), with a visible "Continue to your course" button as the no-JS
 * fallback. Email link scanners (M365 Safe Links, Mimecast) issue bare GETs
 * and don't submit forms, so prefetch can no longer burn the one-time token.
 */
function interstitialHtml(token: string, redirect: string | null): string {
  const redirectField = redirect && isValidRedirect(redirect)
    ? `<input type="hidden" name="redirect" value="${escapeHtml(redirect)}">`
    : ''
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Signing you in… | Concussion Education Australia</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.08);padding:40px 32px;max-width:420px;width:100%;text-align:center}
  h1{font-size:22px;margin:0 0 8px}
  p{font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px}
  button{display:inline-block;padding:14px 28px;background:#5b9aa6;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer}
</style>
</head><body>
<div class="card">
  <h1>Almost there</h1>
  <p>Confirming your login to Concussion Education Australia&hellip;</p>
  <form method="POST" action="/api/auth/verify" id="verify-form">
    <input type="hidden" name="token" value="${escapeHtml(token)}">
    ${redirectField}
    <button type="submit">Continue to your course</button>
  </form>
</div>
<script>document.getElementById('verify-form').submit()</script>
</body></html>`
}

function errorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} | Concussion Education Australia</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.08);padding:40px 32px;max-width:420px;width:100%;text-align:center}
  h1{font-size:22px;margin:0 0 8px}
  p{font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px}
  a{display:inline-block;padding:14px 28px;background:#5b9aa6;color:#fff;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none}
</style>
</head><body>
<div class="card">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  <a href="/login">Request a New Login Link</a>
</div>
</body></html>`
}

const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }

/**
 * GET /api/auth/verify?token=...
 *
 * Validates signature + expiry + replay table WITHOUT consuming the token,
 * then serves the confirm interstitial. NO bare GET may consume a one-time
 * token — email security scanners prefetch links and were burning them
 * before the clinician clicked ("link already used" lockouts).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const redirect = searchParams.get('redirect')

    if (!token) {
      return new NextResponse(errorHtml('Invalid Link', 'No login token was provided.'), {
        status: 400,
        headers: HTML_HEADERS,
      })
    }

    // Validate signature + expiry only — does NOT mark the token used
    const tokenData = verifyMagicTokenJWT(token)
    if (!tokenData) {
      // Dead link but the browser is already logged in? Send them through.
      const session = existingValidSession(request)
      if (session) {
        return NextResponse.redirect(new URL(await sessionRedirectTarget(session, redirect), request.url), 303)
      }
      await logAuthFailure({
        endpoint: '/api/auth/verify',
        reason: 'Invalid or expired magic link token (GET preview)',
      })
      return new NextResponse(
        errorHtml('Link Expired', 'This login link is invalid or has expired. Please request a new one.'),
        { status: 401, headers: HTML_HEADERS }
      )
    }

    // Read-only replay check — friendlier message, still no consumption
    await ensureTokenTable()
    const tokenHash = hashToken(token)
    const { rows: existing } = await sql`SELECT 1 FROM used_magic_tokens WHERE token_hash = ${tokenHash} LIMIT 1`
    if (existing.length > 0) {
      // Second click on an already-used link — if the first click set a
      // still-valid session, just take them where they were headed.
      const session = existingValidSession(request)
      if (session) {
        return NextResponse.redirect(new URL(await sessionRedirectTarget(session, redirect), request.url), 303)
      }
      return new NextResponse(
        errorHtml('Link Already Used', 'This login link has already been used. Please request a new one.'),
        { status: 401, headers: HTML_HEADERS }
      )
    }

    return new NextResponse(interstitialHtml(token, redirect), { status: 200, headers: HTML_HEADERS })
  } catch (error) {
    console.error('Verification error:', error)
    if (error instanceof Error) {
      await logCriticalError(error, { endpoint: '/api/auth/verify' })
    }
    return new NextResponse(errorHtml('Verification Failed', 'Something went wrong. Please try again.'), {
      status: 500,
      headers: HTML_HEADERS,
    })
  }
}

/**
 * POST /api/auth/verify
 *
 * Consumes the one-time token (replay table) and sets the session cookie.
 * Two callers:
 *   - /auth/verify client page → POST with ?token= query param, expects JSON
 *   - GET interstitial form (no-JS path / direct API links) → form-encoded
 *     body, expects a redirect
 */
export async function POST(request: NextRequest) {
  // Form posts (interstitial) get redirect/HTML responses; fetch calls get JSON
  const contentType = request.headers.get('content-type') ?? ''
  const isFormPost = contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')

  try {
    const { searchParams } = new URL(request.url)
    let token = searchParams.get('token')
    let redirect: string | null = searchParams.get('redirect')

    if (!token && isFormPost) {
      const form = await request.formData()
      const formToken = form.get('token')
      if (typeof formToken === 'string') token = formToken
      const formRedirect = form.get('redirect')
      if (typeof formRedirect === 'string' && !redirect) redirect = formRedirect
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the magic token (contains all user data - no database lookup needed!)
    const tokenData = verifyMagicTokenJWT(token)

    if (!tokenData) {
      // Dead link but the browser already holds a valid session — don't
      // dead-end, the user is logged in. Form posts navigate; fetch callers
      // get the same success JSON shape a fresh verify returns.
      const session = existingValidSession(request)
      if (session) {
        const redirectTo = await sessionRedirectTarget(session, redirect)
        if (isFormPost) {
          return NextResponse.redirect(new URL(redirectTo, request.url), 303)
        }
        return NextResponse.json({
          success: true,
          alreadyLoggedIn: true,
          redirectTo,
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
            accessLevel: session.accessLevel,
          },
        })
      }

      // Log failed verification attempts
      await logAuthFailure({
        endpoint: '/api/auth/verify',
        reason: 'Invalid or expired magic link token',
      })

      if (isFormPost) {
        return new NextResponse(
          errorHtml('Link Expired', 'This login link is invalid or has expired. Please request a new one.'),
          { status: 401, headers: HTML_HEADERS }
        )
      }
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Replay protection: hash token and check if already used
    await ensureTokenTable()
    const tokenHash = hashToken(token)
    const { rows: existing } = await sql`SELECT 1 FROM used_magic_tokens WHERE token_hash = ${tokenHash} LIMIT 1`
    if (existing.length > 0) {
      // Second click on an already-used link — if the first click set a
      // still-valid session, complete the journey instead of erroring.
      const session = existingValidSession(request)
      if (session) {
        const redirectTo = await sessionRedirectTarget(session, redirect)
        if (isFormPost) {
          return NextResponse.redirect(new URL(redirectTo, request.url), 303)
        }
        return NextResponse.json({
          success: true,
          alreadyLoggedIn: true,
          redirectTo,
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
            accessLevel: session.accessLevel,
          },
        })
      }

      await logAuthFailure({
        endpoint: '/api/auth/verify',
        reason: 'Magic link already used (replay attempt)',
      })
      if (isFormPost) {
        return new NextResponse(
          errorHtml('Link Already Used', 'This login link has already been used. Please request a new one.'),
          { status: 401, headers: HTML_HEADERS }
        )
      }
      return NextResponse.json(
        { error: 'This login link has already been used. Please request a new one.' },
        { status: 401 }
      )
    }

    // Update last login (non-critical, async fire-and-forget)
    updateLastLogin(tokenData.userId).catch(err =>
      console.error('Failed to update last login:', err)
    )

    // Always use long-lived sessions — magic links are ephemeral anyway
    const rememberMe = true

    // Revocation must reach the session (2026-08-05 sweep #5): a magic token
    // embeds the access level AT MINT TIME, so an unused pre-refund link
    // restored revoked paid access for a year. Mint from the CURRENT DB row;
    // the token's embedded level is only the fallback when no row exists
    // (or the DB blips — the paid gates re-check on read anyway).
    let accessLevel = tokenData.accessLevel
    try {
      const dbUser =
        (await findUserById(tokenData.userId)) ?? (await findUserByEmail(tokenData.email))
      if (dbUser) accessLevel = dbUser.accessLevel
    } catch (err) {
      console.error('[auth/verify] DB access-level re-read failed, using token level:', err)
    }

    // Create JWT session token (no Blob storage needed - instant!)
    const sessionToken = createJWTSession(
      tokenData.userId,
      tokenData.email,
      tokenData.name,
      accessLevel,
      rememberMe
    )

    // Mark token as used (replay protection)
    await sql`INSERT INTO used_magic_tokens (token_hash) VALUES (${tokenHash}) ON CONFLICT DO NOTHING`
    // Prune tokens older than 366 days (non-blocking best-effort)
    sql`DELETE FROM used_magic_tokens WHERE used_at < now() - interval '366 days'`.catch(() => {})

    // Build the response: form posts navigate, fetch callers get JSON.
    // BOTH branches resolve the landing target through the SAME function —
    // the /auth/verify client page used to re-implement the rule and got it
    // wrong for every preview-tier paying customer (CRM owners, SST clinics)
    // and for lead-magnet deep links. It now just obeys `redirectTo`.
    const target = await resolveLandingTarget(accessLevel, tokenData.email, redirect)
    let response: NextResponse
    if (isFormPost) {
      response = NextResponse.redirect(new URL(target, request.url), 303)
    } else {
      response = NextResponse.json({
        success: true,
        redirectTo: target,
        user: {
          id: tokenData.userId,
          email: tokenData.email,
          name: tokenData.name,
          accessLevel,
        },
      })
    }

    // Set httpOnly cookie for security — match session token TTL (1 year
    // for rememberMe). Once a user verifies, they stay signed in.
    const maxAge = rememberMe ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60 // 1 year or 30 days

    // SECURITY: Always use secure cookies (even in dev with warning)
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) {
      console.warn('Development mode: Session cookie secure flag disabled. Use HTTPS in production.')
    }

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // SECURITY: Use 'lax' for magic link compatibility while maintaining CSRF protection
      maxAge,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verification error:', error)

    // Log critical verification errors
    if (error instanceof Error) {
      await logCriticalError(error, {
        endpoint: '/api/auth/verify',
      })
    }

    if (isFormPost) {
      return new NextResponse(errorHtml('Verification Failed', 'Something went wrong. Please try again.'), {
        status: 500,
        headers: HTML_HEADERS,
      })
    }
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
