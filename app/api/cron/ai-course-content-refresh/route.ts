import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { CONTENT_SOURCES } from '@/lib/ai-course/content-sources'
import crypto from 'crypto'

/**
 * GET /api/cron/ai-course-content-refresh
 *
 * Monthly cron job. For each source in lib/ai-course/content-sources.ts:
 *   1. Fetch the URL
 *   2. Extract the main content text (rough — title + body via regex)
 *   3. Hash the content and compare against last-stored snapshot
 *   4. If changed: record new snapshot + flag in digest
 *   5. Email digest to Zac with what changed and which modules are affected
 *
 * Triggered by Vercel Cron. Vercel hits this with a CRON_SECRET header for
 * auth. The endpoint also accepts an admin x-admin-key header for manual
 * runs from a script.
 */

export const maxDuration = 300 // 5 min — fetching many URLs

interface ChangeReport {
  sourceId: string
  name: string
  url: string
  category: string
  affectsModules: string[]
  changeKind: 'new' | 'changed' | 'unchanged' | 'unreachable'
  hash: string
  previousHash: string | null
  excerpt: string
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16)
}

function extractText(html: string): string {
  // Drop script/style/nav/footer chrome, then strip remaining tags. This is
  // intentionally rough — we only need a stable text representation for
  // hashing, not perfect rendering.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000) // cap to keep snapshots small
}

async function ensureSnapshotTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS ai_course_source_snapshots (
      source_id TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      excerpt TEXT,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function GET(request: NextRequest) {
  // Auth: Vercel cron secret OR admin key
  const cronSecret = request.headers.get('authorization')
  const adminKey = request.headers.get('x-admin-key')
  const expectedCron = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  const expectedAdmin = process.env.ADMIN_API_KEY
  const authed =
    (expectedCron && cronSecret === expectedCron) ||
    (expectedAdmin && adminKey === expectedAdmin)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSnapshotTable()

  const reports: ChangeReport[] = []

  // Load previous snapshots once
  const { rows: snapshots } = await sql`SELECT source_id, hash, excerpt FROM ai_course_source_snapshots`
  const prevMap = new Map<string, { hash: string; excerpt: string }>()
  for (const r of snapshots) prevMap.set(r.source_id, { hash: r.hash, excerpt: r.excerpt })

  for (const source of CONTENT_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'ConcussionEducationAU-ContentMonitor/1.0' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        reports.push({
          sourceId: source.id,
          name: source.name,
          url: source.url,
          category: source.category,
          affectsModules: source.affectsModules,
          changeKind: 'unreachable',
          hash: '',
          previousHash: prevMap.get(source.id)?.hash || null,
          excerpt: `HTTP ${res.status}`,
        })
        continue
      }
      const html = await res.text()
      const text = extractText(html)
      const hash = sha256(text)
      const prev = prevMap.get(source.id)

      let changeKind: ChangeReport['changeKind']
      if (!prev) changeKind = 'new'
      else if (prev.hash === hash) changeKind = 'unchanged'
      else changeKind = 'changed'

      reports.push({
        sourceId: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        affectsModules: source.affectsModules,
        changeKind,
        hash,
        previousHash: prev?.hash || null,
        excerpt: text.slice(0, 280),
      })

      // Always persist the latest hash + excerpt + checked_at
      await sql`
        INSERT INTO ai_course_source_snapshots (source_id, hash, excerpt, checked_at)
        VALUES (${source.id}, ${hash}, ${text.slice(0, 1000)}, NOW())
        ON CONFLICT (source_id) DO UPDATE SET
          hash = EXCLUDED.hash,
          excerpt = EXCLUDED.excerpt,
          checked_at = NOW()
      `
    } catch (err) {
      reports.push({
        sourceId: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        affectsModules: source.affectsModules,
        changeKind: 'unreachable',
        hash: '',
        previousHash: prevMap.get(source.id)?.hash || null,
        excerpt: err instanceof Error ? err.message.slice(0, 280) : 'fetch error',
      })
    }
  }

  const changed = reports.filter((r) => r.changeKind === 'changed' || r.changeKind === 'new')
  const unreachable = reports.filter((r) => r.changeKind === 'unreachable')

  // Only email if there's something to report (changes or unreachables)
  if (changed.length > 0 || unreachable.length > 0) {
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `AI course content refresh — ${changed.length} change(s), ${unreachable.length} unreachable`,
        html: buildDigestEmail(changed, unreachable),
        tags: [{ name: 'type', value: 'ai-course-content-digest' }],
      })
    } catch (err) {
      console.error('[ai-course-content-refresh] Digest email failed:', err)
    }
  }

  return NextResponse.json({
    success: true,
    totalChecked: reports.length,
    changed: changed.length,
    unchanged: reports.length - changed.length - unreachable.length,
    unreachable: unreachable.length,
    reports,
  })
}

function buildDigestEmail(changed: ChangeReport[], unreachable: ChangeReport[]): string {
  const changeRows = changed.map((r) => `
    <tr>
      <td style="padding: 8px; vertical-align: top;">
        <strong>${escapeHtml(r.name)}</strong><br>
        <span style="font-size: 11px; color: #94a3b8;">${escapeHtml(r.category)}</span>
      </td>
      <td style="padding: 8px; vertical-align: top; font-size: 12px;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: ${r.changeKind === 'new' ? '#dbeafe' : '#fef3c7'}; color: ${r.changeKind === 'new' ? '#1e40af' : '#92400e'}; font-weight: 600;">${r.changeKind.toUpperCase()}</span>
      </td>
      <td style="padding: 8px; vertical-align: top; font-size: 12px; color: #475569;">
        ${r.affectsModules.map((m) => escapeHtml(m)).join(', ') || '—'}
      </td>
      <td style="padding: 8px; vertical-align: top; font-size: 11px;">
        <a href="${escapeHtml(r.url)}" style="color: #0d7377;">Open →</a>
      </td>
    </tr>
  `).join('')

  const unreachRows = unreachable.map((r) => `
    <tr>
      <td style="padding: 8px;"><strong>${escapeHtml(r.name)}</strong></td>
      <td style="padding: 8px; font-size: 12px; color: #991b1b;">${escapeHtml(r.excerpt)}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f172a;">AI course content refresh digest</h2>
      <p style="font-size: 13px; color: #475569; margin: 0 0 16px;">
        Sources changed since the last run. Update the affected modules in <code>content/ai-course/</code> if relevant.
      </p>

      ${changed.length > 0 ? `
        <h3 style="margin: 24px 0 8px; font-size: 14px;">Changes (${changed.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Source</th>
              <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Status</th>
              <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Affects modules</th>
              <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Link</th>
            </tr>
          </thead>
          <tbody>${changeRows}</tbody>
        </table>
      ` : ''}

      ${unreachable.length > 0 ? `
        <h3 style="margin: 24px 0 8px; font-size: 14px; color: #991b1b;">Unreachable (${unreachable.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0;">
          <tbody>${unreachRows}</tbody>
        </table>
      ` : ''}

      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">
        Automated digest from /api/cron/ai-course-content-refresh. Sources defined in lib/ai-course/content-sources.ts.
      </p>
    </div>
  `
}
