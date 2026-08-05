/**
 * POST /api/admin/squarespace-suppress
 *
 * Takes a list of Squarespace-engaged emails (self-submitted form
 * signups outside our portal) and suppresses any matching cold-prospect
 * rows so we stop emailing people who've already engaged with us
 * elsewhere.
 *
 * For each input email:
 *   - Direct match (LOWER(contact_email) = LOWER(input)):
 *     - prospect_clinics.status → 'engaged-elsewhere'
 *     - email_suppression entry added (reason='self-engaged-squarespace')
 *   - Domain match (same @domain.com but different local-part):
 *     - prospect_clinics row stays active BUT gets a notes flag
 *       indicating a named contact at the domain is already engaged.
 *       Useful for re-queuing the same clinic with the named contact.
 *
 * Also stores every input email in external_engaged_contacts table
 * (lazy-migrated) so we can target a separate re-engagement sequence
 * later.
 *
 * Body: { emails: string[], source?: string (default 'squarespace') }
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { recordAdminAction } from '@/lib/admin-audit'

export const maxDuration = 60

interface Body {
  emails?: string[]
  source?: string
  dryRun?: boolean
}

interface SuppressResult {
  email: string
  decision: 'direct-suppressed' | 'domain-flagged' | 'no-match' | 'already-suppressed' | 'dry-direct' | 'dry-domain' | 'invalid'
  clinicId?: number
  clinicShortName?: string
  matchedDomain?: string
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const emails = Array.isArray(body.emails) ? body.emails : []
  const source = (body.source ?? 'squarespace').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'squarespace'
  const dryRun = body.dryRun === true

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No emails supplied' }, { status: 400 })
  }
  if (emails.length > 1000) {
    return NextResponse.json({ error: 'Max 1000 emails per call' }, { status: 400 })
  }

  // Lazy migration — idempotent table for tracking external engaged contacts.
  if (!dryRun) {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS external_engaged_contacts (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          source TEXT NOT NULL,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          notes TEXT
        )
      `
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS external_engaged_contacts_email_source_idx ON external_engaged_contacts (LOWER(email), source)`
    } catch (err) {
      console.error('[squarespace-suppress] migration failed:', err)
    }
  }

  const results: SuppressResult[] = []
  const directHits: number[] = []
  const domainHits: number[] = []

  for (const raw of emails) {
    const email = (raw || '').trim().toLowerCase()
    if (!email.includes('@') || email.length > 254) {
      results.push({ email: raw, decision: 'invalid' })
      continue
    }
    const domain = email.split('@')[1]

    // Direct match check
    const { rows: directRows } = await sql<{ id: number; short_name: string; status: string }>`
      SELECT id, short_name, status
      FROM prospect_clinics
      WHERE LOWER(contact_email) = ${email}
      LIMIT 1
    `

    if (directRows.length > 0) {
      const row = directRows[0]
      if (row.status === 'engaged-elsewhere' || row.status === 'won' || row.status === 'lost' || row.status === 'archived') {
        results.push({ email, decision: 'already-suppressed', clinicId: row.id, clinicShortName: row.short_name })
      } else if (dryRun) {
        results.push({ email, decision: 'dry-direct', clinicId: row.id, clinicShortName: row.short_name })
      } else {
        await sql`
          UPDATE prospect_clinics
          SET status = 'engaged-elsewhere',
              notes = COALESCE(notes, '') || E'\n[suppressed=' || ${source} || '/' || ${new Date().toISOString().slice(0, 10)} || '] self-engaged via ' || ${source} || ' — pulled from cold sequence',
              updated_at = NOW()
          WHERE id = ${row.id}
        `
        try {
          await sql`
            INSERT INTO email_suppression (email, reason, source, created_at)
            VALUES (${email}, ${`self-engaged-${source}`}, ${source}, NOW())
            ON CONFLICT (email) DO NOTHING
          `
        } catch {
          // Table or constraint may differ — non-fatal
        }
        directHits.push(row.id)
        results.push({ email, decision: 'direct-suppressed', clinicId: row.id, clinicShortName: row.short_name })
      }
    } else {
      // Domain match — useful for re-queue with named contact
      const { rows: domainRows } = await sql<{ id: number; short_name: string; contact_email: string }>`
        SELECT id, short_name, contact_email
        FROM prospect_clinics
        WHERE LOWER(SPLIT_PART(contact_email, '@', 2)) = ${domain}
          AND status NOT IN ('engaged-elsewhere', 'won', 'lost', 'archived', 'bounced')
        LIMIT 5
      `
      if (domainRows.length > 0) {
        if (!dryRun) {
          for (const dr of domainRows) {
            await sql`
              UPDATE prospect_clinics
              SET notes = COALESCE(notes, '') || E'\n[domain-engaged-elsewhere=' || ${source} || '/' || ${new Date().toISOString().slice(0, 10)} || '] named contact ' || ${email} || ' self-engaged via ' || ${source} || ' — consider re-queue with this contact'
              WHERE id = ${dr.id}
            `
            domainHits.push(dr.id)
          }
        }
        results.push({
          email,
          decision: dryRun ? 'dry-domain' : 'domain-flagged',
          clinicId: domainRows[0].id,
          clinicShortName: domainRows[0].short_name,
          matchedDomain: domain,
        })
      } else {
        results.push({ email, decision: 'no-match' })
      }
    }

    // Always log to external_engaged_contacts
    if (!dryRun) {
      try {
        await sql`
          INSERT INTO external_engaged_contacts (email, source, first_seen_at, last_seen_at)
          VALUES (${email}, ${source}, NOW(), NOW())
          ON CONFLICT (LOWER(email), source) DO UPDATE SET last_seen_at = NOW()
        `
      } catch {
        // Non-fatal
      }
    }
  }

  // Dry runs mutate nothing, so they are not audited.
  if (!dryRun) {
    await recordAdminAction(req, {
      route: '/api/admin/squarespace-suppress',
      target: `${results.length} addresses`,
      detail: {
        directSuppressed: results.filter(r => r.decision === 'direct-suppressed').length,
        domainFlagged: results.filter(r => r.decision === 'domain-flagged').length,
        uniqueClinicsAffected: new Set([...directHits, ...domainHits]).size,
      },
    })
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      total: results.length,
      directSuppressed: results.filter(r => r.decision === 'direct-suppressed' || r.decision === 'dry-direct').length,
      domainFlagged: results.filter(r => r.decision === 'domain-flagged' || r.decision === 'dry-domain').length,
      alreadySuppressed: results.filter(r => r.decision === 'already-suppressed').length,
      noMatch: results.filter(r => r.decision === 'no-match').length,
      invalid: results.filter(r => r.decision === 'invalid').length,
      uniqueClinicsAffected: new Set([...directHits, ...domainHits]).size,
    },
    results: results.slice(0, 200),
    truncated: results.length > 200,
  })
}
