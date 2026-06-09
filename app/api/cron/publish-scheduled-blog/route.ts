/**
 * Cron: Friday-morning blog drop reminder.
 *
 * Runs Thursday 23:00 UTC (Friday 09:00 AEST). Checks the BLOG_SCHEDULE
 * for posts whose publishAt has passed but draftStatus != 'live'.
 * Sends an admin email reminder with the slug to publish + the 30-second
 * ritual checklist.
 *
 * Does NOT auto-modify blog/page.tsx or sitemap.ts — those edits are
 * fragile in Next.js builds. The Friday-morning ritual is the manual
 * step: pull the draft file, add to indexes, commit, push. Cron is the
 * memory aid that prevents "we forgot Friday".
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendEmail } from '@/lib/resend-client'
import { getOverduePosts, getNextScheduledPost, BLOG_SCHEDULE } from '@/lib/blog-schedule'
import { CONFIG } from '@/lib/config'

export const maxDuration = 30

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
    return NextResponse.json({ skipped: true, reason: 'Not primary project' })
  }

  const now = new Date()
  const overdue = getOverduePosts(now)
  const next = getNextScheduledPost(now)

  // Schedule-runway check: when the pipeline runs dry the cron has nothing
  // to remind about and the weekly drop dies silently. Warn loudly while
  // there's still time to add entries to lib/blog-schedule.ts.
  const upcoming = BLOG_SCHEDULE.filter((p) => new Date(p.publishAt) > now)
  const scheduleWarning =
    upcoming.length <= 2
      ? `BLOG SCHEDULE RUNNING DRY: only ${upcoming.length} scheduled post${upcoming.length === 1 ? '' : 's'} remaining after today. Add new entries to lib/blog-schedule.ts or the Friday drop stops without notice.`
      : null

  if (overdue.length === 0) {
    return NextResponse.json({
      ok: true,
      ranAt: now.toISOString(),
      overdueCount: 0,
      next: next ? { slug: next.slug, title: next.title, publishAt: next.publishAt } : null,
      message: 'No overdue posts. Nothing to remind.',
      ...(scheduleWarning ? { warning: scheduleWarning } : {}),
    })
  }

  // Email Zac the reminder
  const html = `
    <p>Hi Zac,</p>
    ${
      scheduleWarning
        ? `<p style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:4px;color:#991b1b;font-weight:bold">&#9888; ${scheduleWarning}</p>`
        : ''
    }
    <p>Friday blog-drop reminder. <strong>${overdue.length} post${overdue.length === 1 ? ' is' : 's are'} due to publish.</strong></p>
    <h3>Overdue posts</h3>
    <ul>
      ${overdue
        .map(
          (p) => `
        <li>
          <strong>${p.title}</strong><br>
          slug: <code>${p.slug}</code><br>
          publishAt: ${p.publishAt}<br>
          draftStatus: <em>${p.draftStatus}</em>${p.notes ? `<br>notes: ${p.notes}` : ''}
        </li>
      `
        )
        .join('')}
    </ul>
    <h3>Friday-morning ritual (15 min)</h3>
    <ol>
      <li>Open the draft file: <code>app/blog/${overdue[0].slug}/page.tsx</code> (if not yet written, draft now — 1500-2000 words, schema, AIO-optimized first 100 words)</li>
      <li>Update datePublished + dateModified to today</li>
      <li>Add entry to <code>app/blog/page.tsx</code> at top</li>
      <li>Add entry to <code>app/sitemap.ts</code> (priority 0.85)</li>
      <li>Update <code>public/llms.txt</code> blog list</li>
      <li>Mark <code>draftStatus: 'live'</code> in <code>lib/blog-schedule.ts</code></li>
      <li>Commit + push</li>
      <li>Send Tuesday email newsletter referencing the post</li>
      <li>LinkedIn organic post (native, link in first comment)</li>
    </ol>
    ${
      next
        ? `<h3>Next up</h3><p><strong>${next.title}</strong> (publishAt ${next.publishAt}) — draft this if you haven't.</p>`
        : ''
    }
    <p style="color:#888;font-size:12px">— Sent by the publish-scheduled-blog cron</p>
  `

  // sendEmail returns false on failure (it never throws) — surface both
  // paths as HTTP 500 so the Vercel cron run shows failed instead of a
  // silent ok:false 200.
  try {
    const sent = await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `📝 Friday blog drop reminder: ${overdue[0].title}`,
      html,
    })
    if (!sent) {
      return NextResponse.json(
        { ok: false, error: 'Email send failed', ...(scheduleWarning ? { warning: scheduleWarning } : {}) },
        { status: 500 }
      )
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Email send failed',
        details: err instanceof Error ? err.message : String(err),
        ...(scheduleWarning ? { warning: scheduleWarning } : {}),
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    overdueCount: overdue.length,
    overdue: overdue.map((p) => p.slug),
    scheduleCount: BLOG_SCHEDULE.length,
    next: next ? { slug: next.slug, title: next.title, publishAt: next.publishAt } : null,
    ...(scheduleWarning ? { warning: scheduleWarning } : {}),
  })
}
