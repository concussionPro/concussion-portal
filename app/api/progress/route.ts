import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { progressSchema } from '@/lib/schemas'

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
