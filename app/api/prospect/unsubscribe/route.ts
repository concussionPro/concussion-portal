/**
 * Cold-outreach unsubscribe endpoint.
 *
 * Referenced from the `List-Unsubscribe` and `List-Unsubscribe-Post` headers
 * set in `app/api/admin/prospect-send/route.ts` and
 * `app/api/admin/send-sample-pitch/route.ts`. Before this route existed Gmail
 * + Apple Mail one-click unsubscribe returned 404 — recipients had no working
 * unsubscribe and rolled to "Spam" instead, which is almost certainly what
 * pushed the domain to a 0.28% complaint rate against Google's 0.30% red
 * line.
 *
 * Token format (current): `<clinic.slug>.<hmac>` — HMAC-SHA256-signed via
 *   lib/prospect/unsubscribe-token.ts. The old `<slug>-<base36 timestamp>`
 *   format was forgeable (anyone could suppress any clinic by guessing
 *   slugs — a mass-unsubscribe attack surface).
 * Legacy tokens are still honoured, but ONLY for clinics that have actually
 *   been contacted (>=1 prospect_outreach_log row) — links already sent in
 *   live emails must keep working (Spam Act unsubscribe promise) while the
 *   enumeration attack on never-contacted clinics is closed.
 * Token format from sample-pitch:   literal `sample`
 *
 * - GET  shows a confirmation page (avoids unintentional unsubscribes when
 *        corporate security gateways like Mimecast / Barracuda prefetch
 *        every link in the email).
 * - POST is the actual one-click handler called by RFC 8058 clients.
 *        Suppresses the matched clinic.contactEmail, marks the clinic
 *        status='lost' with a unsubscribed-by-recipient note.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getClinicBySlug, suppress } from '@/lib/prospect/repo'
import { parseUnsubscribeToken } from '@/lib/prospect/unsubscribe-token'

export const runtime = 'nodejs'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Resolve a token to a clinic, enforcing the legacy-format restriction:
 * legacy (unsigned) tokens only resolve for clinics we have actually
 * emailed. Returns null when the token shouldn't unsubscribe anyone.
 */
async function resolveClinicFromToken(token: string) {
  const parsed = parseUnsubscribeToken(token)
  if (!parsed) return null

  const clinic = await getClinicBySlug(parsed.slug)
  if (!clinic) return null

  if (parsed.format === 'legacy') {
    const { rows } = await sql`
      SELECT 1 FROM prospect_outreach_log WHERE clinic_id = ${clinic.id} LIMIT 1
    `
    if (rows.length === 0) return null // never contacted — forged/guessed link
  }
  return clinic
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  if (token === 'sample') {
    return NextResponse.json({ success: true, note: 'sample-pitch token — nothing to suppress' })
  }

  const clinic = await resolveClinicFromToken(token)
  if (!clinic) {
    // Idempotent — covers deleted clinics AND rejected (forged / legacy
    // never-contacted) tokens. Respond 200 so the email client doesn't
    // show an error, but suppress nothing.
    return NextResponse.json({ success: true, note: 'no-match' })
  }

  await suppress(clinic.contactEmail, 'manual-unsubscribe', `prospect-unsubscribe:${clinic.slug}`)
  await sql`
    UPDATE prospect_clinics
    SET status = 'lost',
        notes = COALESCE(notes, '') || ${'\n[auto] ' + new Date().toISOString() + ' recipient clicked List-Unsubscribe — suppressed'},
        updated_at = NOW()
    WHERE id = ${clinic.id}
  `

  // If the form was submitted from the GET confirmation page render the
  // success HTML; one-click clients want plain JSON.
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('form')) {
    return new NextResponse(successPage(clinic.contactEmail), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token) {
    return new NextResponse(errorPage('Invalid unsubscribe link.'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  if (token === 'sample') {
    return new NextResponse(successPage('your address'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  const clinic = await resolveClinicFromToken(token)
  if (!clinic) {
    // Deleted clinic OR rejected (forged / never-contacted legacy) token —
    // show the generic success page; never confirm or leak an address.
    return new NextResponse(successPage('your address'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  return new NextResponse(confirmPage(clinic.contactEmail, token), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function confirmPage(email: string, token: string): string {
  const safeEmail = escapeHtml(email)
  const safeToken = escapeHtml(token)
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — Concussion Education Australia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 28px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 16px; }
    .btn:hover { background: #b91c1c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9993;</div>
    <h1>Remove from outreach list?</h1>
    <p><strong>${safeEmail}</strong> will be permanently removed from any future cold outreach about clinic concussion training. You won't receive any more emails from this list.</p>
    <form method="POST" action="/api/prospect/unsubscribe?t=${safeToken}">
      <button type="submit" class="btn">Confirm Unsubscribe</button>
    </form>
    <p style="margin-top: 20px; font-size: 13px;">Changed your mind? Close this page.</p>
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Concussion Education Australia · partnerships@concussion-education-australia.com</p>
  </div>
</body>
</html>`
}

function successPage(email: string): string {
  const safeEmail = escapeHtml(email)
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed — Concussion Education Australia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .icon { font-size: 48px; margin-bottom: 16px; color: #059669; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>You've been unsubscribed</h1>
    <p><strong>${safeEmail}</strong> has been removed from our cold outreach list.</p>
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Concussion Education Australia</p>
  </div>
</body>
</html>`
}

function errorPage(message: string): string {
  const safe = escapeHtml(message)
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error — Concussion Education Australia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong</h1>
    <p>${safe}</p>
    <p style="margin-top: 20px; font-size: 13px;">To unsubscribe manually, email <a href="mailto:unsubscribe@concussion-education-australia.com" style="color: #0d9488;">unsubscribe@concussion-education-australia.com</a> and we'll remove you.</p>
  </div>
</body>
</html>`
}
