/**
 * POST /api/admin/prospect-approve
 *
 * Bulk review actions from the "Outreach categories — review & approve"
 * panel on /admin/analytics. Two actions:
 *
 *   approve : status 'researching' → 'approved'. Never resurrects
 *             archived/terminal rows — the WHERE guard means an id whose
 *             status moved on since the dashboard loaded is silently
 *             skipped (counted in `skipped`).
 *   archive : status 'researching' | 'approved' → 'archived', with an
 *             audit note appended so we know the row was killed from the
 *             review queue (vs preflight quarantine / STOP reply).
 *
 * Body: { ids: number[], action: 'approve' | 'archive' }  (max 500 ids)
 * Returns: { updated, skipped }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

const MAX_IDS_PER_CALL = 500

export interface ProspectApproveRequest {
  ids: number[]
  action: 'approve' | 'archive'
}

/**
 * Pure body validator — exported for unit tests. Accepts only positive
 * integer ids (deduped), capped at MAX_IDS_PER_CALL, and a known action.
 */
export function validateApproveRequest(
  body: unknown,
): { ok: true; value: ProspectApproveRequest } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Body must be a JSON object' }
  }
  const { ids, action } = body as { ids?: unknown; action?: unknown }
  if (action !== 'approve' && action !== 'archive') {
    return { ok: false, error: "action must be 'approve' or 'archive'" }
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: 'ids must be a non-empty array of numbers' }
  }
  if (ids.length > MAX_IDS_PER_CALL) {
    return { ok: false, error: `ids capped at ${MAX_IDS_PER_CALL} per call` }
  }
  if (!ids.every((id) => typeof id === 'number' && Number.isInteger(id) && id > 0)) {
    return { ok: false, error: 'every id must be a positive integer' }
  }
  return { ok: true, value: { ids: [...new Set(ids as number[])], action } }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = null
  }
  const parsed = validateApproveRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { ids, action } = parsed.value

  try {
    // Same jsonb_array_elements_text pattern as prospect-fire-now — the
    // tagged-template sql client can't bind a TS array directly to ANY().
    const idsJson = JSON.stringify(ids)
    let updated = 0

    if (action === 'approve') {
      // Only researching rows can be approved — never resurrect
      // archived/lost/bounced/won/replied rows from a stale dashboard.
      const { rowCount } = await sql`
        UPDATE prospect_clinics
        SET status = 'approved',
            updated_at = NOW()
        WHERE id::text = ANY(SELECT jsonb_array_elements_text(${idsJson}::jsonb))
          AND status = 'researching'
      `
      updated = rowCount ?? 0
    } else {
      const note = `[archived via review queue ${new Date().toISOString().slice(0, 10)}]`
      const { rowCount } = await sql`
        UPDATE prospect_clinics
        SET status = 'archived',
            notes = COALESCE(notes || E'\n', '') || ${note},
            updated_at = NOW()
        WHERE id::text = ANY(SELECT jsonb_array_elements_text(${idsJson}::jsonb))
          AND status IN ('researching', 'approved')
      `
      updated = rowCount ?? 0
    }

    return NextResponse.json({
      ok: true,
      action,
      updated,
      skipped: ids.length - updated,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Update failed', detail: message }, { status: 500 })
  }
}
