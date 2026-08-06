import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { PAID_DOCS } from '@/lib/gated-docs'

/**
 * Does the paid product still work? Checked every day, from outside.
 *
 * WHY THIS EXISTS (2026-08-06, item 4 of the approved plan).
 *
 * Nothing watched the thing customers actually pay for. Twenty cron jobs
 * monitored the funnel, the outreach engine, email delivery and ad spend, and
 * not one of them opened a module. In one sweep the course was found serving 81
 * characters on first paint in every identity state, and a dashboard link put
 * signed-in customers into a 102-navigation redirect loop that blanked the tab.
 * Both were found by a human looking. Mean time to detect was unbounded.
 *
 * STRICTLY READ-ONLY, AND THAT IS A DESIGN CONSTRAINT NOT AN OMISSION.
 * A synthetic journey that "completes a module" or "submits a quiz" writes to
 * user_progress and can issue certificates. An agent did exactly that against
 * production on 2026-08-06 and left fabricated activity on real accounts. A
 * monitor must never be the thing that corrupts the data it monitors. So this
 * asserts what is SERVED, never what is recorded:
 *
 *   - the public entry points render real content, not an empty shell
 *   - paid documents refuse anonymous requests (the paywall, from outside)
 *   - the course surfaces respond rather than erroring or redirect-looping
 *   - the free-course signup page still presents its form
 *
 * It calls the live site over HTTP exactly as a visitor does, so it exercises
 * middleware, routing, CDN and the deployed build — not the module graph this
 * process happens to have loaded.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Check = { name: string; ok: boolean; detail: string }

/** A page that renders a shell but no content reads as "up" to every other monitor. */
const MIN_CONTENT_CHARS = 800

function isAuthorised(request: NextRequest): boolean {
  // Vercel Cron sends this header; the admin key is the manual path.
  if (request.headers.get('x-vercel-cron')) return true
  const key = process.env.ADMIN_API_KEY
  if (!key) return false
  const supplied =
    request.headers.get('x-admin-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return !!supplied && supplied === key
}

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = CONFIG.SEO.SITE_URL.replace(/\/$/, '')
  const checks: Check[] = []
  const record = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail })

  async function fetchText(path: string): Promise<{ status: number; body: string }> {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { 'user-agent': 'CEA-synthetic-journey/1.0' },
        cache: 'no-store',
      })
      return { status: res.status, body: res.status === 200 ? await res.text() : '' }
    } catch (err) {
      return { status: 0, body: err instanceof Error ? err.message : String(err) }
    }
  }

  // ── 1. The pages that carry the funnel actually render ──────────────────
  for (const path of ['/', '/pricing', '/scat-mastery', '/concussion-rehab-mastery']) {
    const { status, body } = await fetchText(path)
    // Strip tags so a shell of markup with no words cannot pass as content.
    const words = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    record(`renders ${path}`, status === 200 && words.length > MIN_CONTENT_CHARS,
      status === 200 ? `${words.length} chars of text` : `HTTP ${status}`)
  }

  // ── 2. The paywall holds, checked as a stranger ─────────────────────────
  // Unit tests read source; this reads the live response, which is the only
  // thing that would have caught either of the two leaks found on 2026-08-06.
  for (const doc of [...PAID_DOCS].slice(0, 4)) {
    const res = await fetch(`${base}${encodeURI(doc)}`, { cache: 'no-store' }).catch(() => null)
    const status = res?.status ?? 0
    record(`paywall ${doc}`, status !== 200 && status !== 0, `HTTP ${status}`)
  }

  // ── 3. Course surfaces respond, and do not redirect-loop ────────────────
  for (const path of ['/modules/101', '/learning', '/dashboard']) {
    try {
      const res = await fetch(`${base}${path}`, { redirect: 'manual', cache: 'no-store' })
      // 200 (renders) or a single redirect to login are both correct for an
      // anonymous caller. A 5xx, or a redirect back to itself, is not.
      const loc = res.headers.get('location') || ''
      const looping = loc.includes(path)
      record(`responds ${path}`, res.status < 500 && !looping,
        `HTTP ${res.status}${loc ? ` → ${loc.replace(base, '')}` : ''}`)
    } catch (err) {
      record(`responds ${path}`, false, err instanceof Error ? err.message : String(err))
    }
  }

  // ── 4. The free-course entry still presents its form ────────────────────
  const scat = await fetchText('/scat-mastery')
  record('free signup form present', /Get free instant access/i.test(scat.body),
    scat.status === 200 ? 'form found' : `HTTP ${scat.status}`)

  // ── 5. The build being served is the one we think it is ─────────────────
  try {
    const h = await fetch(`${base}/api/health`, { cache: 'no-store' })
    const j = await h.json()
    record('health reports a build', !!j?.build?.sha, j?.build?.commit ?? 'no sha')
  } catch (err) {
    record('health reports a build', false, err instanceof Error ? err.message : String(err))
  }

  const failed = checks.filter((c) => !c.ok)

  // Alert once per day per failing signature, so a persistent outage does not
  // send an email every run and train the recipient to ignore it.
  if (failed.length > 0) {
    const signature = failed.map((f) => f.name).sort().join('|')
    const auditKey = `synthetic_journey_${Buffer.from(signature).toString('base64url').slice(0, 60)}_${new Date().toISOString().slice(0, 10)}`
    const { rowCount } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (rowCount && rowCount > 0) {
      await sendEmail({
        to: 'zac@concussion-education-australia.com',
        subject: `[CEA] Synthetic journey failed — ${failed.length} check${failed.length === 1 ? '' : 's'}`,
        html:
          `<p>The daily check of the paid product found ${failed.length} failing check${failed.length === 1 ? '' : 's'}.</p><ul>` +
          failed.map((f) => `<li><strong>${escapeHtml(f.name)}</strong> — ${escapeHtml(f.detail)}</li>`).join('') +
          `</ul><p>Passing: ${checks.length - failed.length} of ${checks.length}.</p>`,
      })
    }
  }

  return NextResponse.json({
    ok: failed.length === 0,
    passed: checks.length - failed.length,
    total: checks.length,
    checks,
  })
}
