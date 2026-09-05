import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { progressSchema } from '@/lib/schemas'
import { isDemoUserId } from '@/lib/demo-session'
import { DEMO_KEY } from '@/lib/demo-key'
import { userOwnsCrm } from '@/lib/crm-course'
import { getCurrentAccessLevel } from '@/lib/users'
import { hasRealProgress, retainStoredProgress } from '@/lib/progress-merge'

// Entitlement geography of the module id space (mirrors lib/module-access):
// flagship 2-8 need a paid CCM level; CRM 201-208 need CRM ownership; SCAT
// 101-104 + the truncated Module 1 preview are free-tier writable.
const isPaidGatedId = (id: number) => id >= 2 && id <= 8
const isCrmGatedId = (id: number) => id >= 201 && id <= 208

// GET - Load user progress
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const { rows } = await sql`
      SELECT progress FROM user_progress WHERE user_id = ${sessionData.userId}
    `

    let progress = rows.length > 0 ? rows[0].progress : null

    // Downgrade hygiene (2026-08-05 sweep #12): stored history can contain
    // paid/CRM module entries the account is no longer entitled to (refund
    // downgrade retains the rows). Filter those entries OUT of the response
    // so the client never round-trips them back into POST — which is what
    // bricked every future save for downgraded accounts. The DB re-check
    // runs only when the stored map actually contains paid ids AND the
    // session claims a paid level; demo/free-only maps stay DB-free.
    if (progress && typeof progress === 'object' && !isDemoUserId(sessionData.userId)) {
      const entries = Object.entries(progress as Record<string, unknown>)
      const hasPaidIds = entries.some(([k]) => isPaidGatedId(Number(k)))
      const hasCrmIds = entries.some(([k]) => isCrmGatedId(Number(k)))
      let paidOk =
        sessionData.accessLevel === 'online-only' || sessionData.accessLevel === 'full-course'
      if (hasPaidIds) {
        // DB is the truth in BOTH directions (round-L #3): a stale preview
        // JWT after a re-purchase must not strip legitimately-owned history.
        const dbLevel = await getCurrentAccessLevel(sessionData.userId)
        if (dbLevel) paidOk = dbLevel === 'online-only' || dbLevel === 'full-course'
      }
      const crmOk = hasCrmIds ? await userOwnsCrm(sessionData.email) : true
      if ((hasPaidIds && !paidOk) || (hasCrmIds && !crmOk)) {
        progress = Object.fromEntries(
          entries.filter(([k]) => {
            const id = Number(k)
            if (!paidOk && isPaidGatedId(id)) return false
            if (!crmOk && isCrmGatedId(id)) return false
            return true
          })
        )
      }
    }

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Error loading progress:', error)
    return NextResponse.json(
      { error: 'Failed to load progress' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user progress
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    if (isDemoUserId(sessionData.userId)) {
      return NextResponse.json({ success: true, demo: true })
    }

    await sql`DELETE FROM user_progress WHERE user_id = ${sessionData.userId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete progress:', error)
    return NextResponse.json(
      { error: 'Failed to delete progress' },
      { status: 500 }
    )
  }
}

// POST - Save user progress
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Demo viewers read like their tier but never write: acknowledge the
    // save (in-page progress works for the visit) without persisting —
    // demo ids have no users row and rows would be shared across every
    // prospect. Also what keeps the sidebar sync line clean.
    const demoKey =
      request.cookies.get('demo_key')?.value ||
      request.headers.get('x-demo-key') ||
      ''
    if (isDemoUserId(sessionData.userId) || demoKey === DEMO_KEY) {
      return NextResponse.json({ success: true, demo: true })
    }

    const rl = await rateLimit({ key: `progress:${sessionData.userId}`, limit: 60, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many progress updates. Please wait.' }, { status: 429 })
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = progressSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid progress payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { progress } = parsed.data

    // Entitlement gate: only accept writes for module ids this session may
    // actually study — mirrors lib/module-access resolution. Free tier keeps
    // SCAT 101-104 and the truncated Module 1 preview (both stay writable);
    // flagship 2-8 need a paid access level; CRM 201-208 need CRM ownership
    // (stream-isolated in course_purchases, NOT access_level). Without this,
    // any preview session could mark paid modules complete.
    // CRITICAL: the client always round-trips the FULL map including the
    // seeded zero-progress defaults for EVERY module (ProgressContext
    // getDefaultProgress) — gate only entries carrying ACTUAL progress, or
    // every legitimate save 403s (2026-08-05 regression check).
    // hasRealProgress is shared with the retention merge below — one definition,
    // so the entitlement gate and the merge can never disagree about what
    // counts as work worth keeping.
    const progressMap = progress as Record<string, Record<string, unknown>>
    const moduleIds = Object.entries(progressMap)
      .filter(([, v]) => v && hasRealProgress(v))
      .map(([k]) => Number(k))
    const needsPaid = moduleIds.some(isPaidGatedId)
    // Revocation re-check (2026-08-05 sweep #5): a 365-day session JWT
    // outlives a refund downgrade — when paid ids carry real progress AND the
    // session claims a paid level, prefer the DB's current access_level over
    // the JWT claim. Free/demo payloads never trigger the extra select.
    let effectiveLevel: string = sessionData.accessLevel
    if (needsPaid) {
      // BIDIRECTIONAL (round-M): a stale free JWT after a re-purchase must
      // not strip legitimately-earned new paid progress either.
      const dbLevel = await getCurrentAccessLevel(sessionData.userId)
      if (dbLevel) effectiveLevel = dbLevel
    }
    const hasPaidAccess = effectiveLevel === 'online-only' || effectiveLevel === 'full-course'
    // CRM matches its content gate (/api/ep-course/modules): ownership only —
    // a paid CCM level does NOT open the EP stream.
    const needsCrm = moduleIds.some(isCrmGatedId)
    const ownsCrm = needsCrm ? await userOwnsCrm(sessionData.email) : false

    // Unentitled ids carrying REAL progress are STRIPPED, not 403'd
    // (2026-08-05 sweep #12): a downgraded account round-trips its retained
    // history on every save, so a hard 403 bricked ALL future saves — even of
    // free-tier progress. Persist the entitled subset; the anti-fraud
    // property holds because unentitled real progress never reaches the DB.
    const dropPaid = needsPaid && !hasPaidAccess
    const dropCrm = needsCrm && !ownsCrm
    let toPersist = progressMap
    if (dropPaid || dropCrm) {
      toPersist = Object.fromEntries(
        Object.entries(progressMap).filter(([k, v]) => {
          const id = Number(k)
          const unentitled = (dropPaid && isPaidGatedId(id)) || (dropCrm && isCrmGatedId(id))
          return !(unentitled && v && hasRealProgress(v))
        })
      )
      const strippedCount = Object.keys(progressMap).length - Object.keys(toPersist).length
      console.log(
        `[progress] Stripped ${strippedCount} unentitled module entr${strippedCount === 1 ? 'y' : 'ies'} from save for user ${sessionData.userId}`
      )
      // Nothing entitled with real progress remains → no-op success. Never
      // overwrite the stored row with a stripped-empty map, and never 403 —
      // the client treats the save as done and moves on.
      const entitledRealRemains = Object.entries(toPersist).some(
        ([, v]) => v && hasRealProgress(v)
      )
      if (!entitledRealRemains) {
        return NextResponse.json({ success: true, message: 'No entitled progress to save' })
      }
    }

    // RETENTION (round-L #3): the POST is a full overwrite and the GET
    // strips unentitled entries — without this merge, a downgraded account's
    // first save durably erased the retained paid history. Stored entries
    // for ids the CLIENT can no longer see are carried over server-side.
    //
    // FIELD-LEVEL, not entry-level (2026-08-05 adversarial round). Choosing
    // whole entries only ever protected the stale tab that had never OPENED the
    // module. You have to open a module to complete it and markModuleStarted
    // stamps startedAt on mount, so a second tab sitting on the SAME module
    // holds a "real" entry, sailed through the old !incomingReal guard, and
    // replaced the completion the first tab had just recorded — the exact loss
    // the retention pass was added to stop. lib/progress-merge keeps the more
    // advanced value per field, so a save can never move a module backwards.
    try {
      const { rows: existingRows } = await sql<{ progress: Record<string, unknown> | null }>`
        SELECT progress FROM user_progress WHERE user_id = ${sessionData.userId} LIMIT 1
      `
      toPersist = retainStoredProgress(
        { ...toPersist },
        existingRows[0]?.progress,
      ) as Record<string, Record<string, unknown>>
    } catch { /* retention is best-effort — never block the save */ }

    // Prevent abuse: size cap even after schema validation
    const progressJson = JSON.stringify(toPersist)
    if (progressJson.length > 100_000) {
      return NextResponse.json(
        { error: 'Progress data too large' },
        { status: 413 }
      )
    }

    await sql`
      INSERT INTO user_progress (user_id, progress, updated_at)
      VALUES (${sessionData.userId}, ${progressJson}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET progress = ${progressJson}::jsonb, updated_at = now()
    `

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
    })
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}
