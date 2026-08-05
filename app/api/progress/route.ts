import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { progressSchema } from '@/lib/schemas'
import { isDemoUserId } from '@/lib/demo-session'
import { userOwnsCrm } from '@/lib/crm-course'

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

    const progress = rows.length > 0 ? rows[0].progress : null

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
    if (isDemoUserId(sessionData.userId)) {
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
    const hasRealProgress = (p: Record<string, unknown>) =>
      p.completed === true ||
      p.quizCompleted === true ||
      Boolean(p.startedAt) ||
      (p.quizAnswers != null && typeof p.quizAnswers === 'object' && Object.keys(p.quizAnswers).length > 0) ||
      (typeof p.activeStudyMinutes === 'number' && p.activeStudyMinutes > 0)
    const moduleIds = Object.entries(progress as Record<string, Record<string, unknown>>)
      .filter(([, v]) => v && hasRealProgress(v))
      .map(([k]) => Number(k))
    const hasPaidAccess =
      sessionData.accessLevel === 'online-only' || sessionData.accessLevel === 'full-course'
    const needsPaid = moduleIds.some((id) => id >= 2 && id <= 8)
    if (needsPaid && !hasPaidAccess) {
      return NextResponse.json(
        { error: 'This module requires full course access' },
        { status: 403 }
      )
    }
    // CRM matches its content gate (/api/ep-course/modules): ownership only —
    // a paid CCM level does NOT open the EP stream.
    const needsCrm = moduleIds.some((id) => id >= 201 && id <= 208)
    if (needsCrm && !(await userOwnsCrm(sessionData.email))) {
      return NextResponse.json(
        { error: 'This module requires the Concussion Rehab Mastery course' },
        { status: 403 }
      )
    }

    // Prevent abuse: size cap even after schema validation
    const progressJson = JSON.stringify(progress)
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
