import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { sql } from '@/lib/db'

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

    const { progress } = await request.json()

    if (!progress) {
      return NextResponse.json(
        { error: 'Progress data required' },
        { status: 400 }
      )
    }

    // Prevent abuse: limit progress data size
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
