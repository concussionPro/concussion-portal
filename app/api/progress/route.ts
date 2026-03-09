import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { put, list } from '@vercel/blob'

// GET - Load user progress from Blob storage
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

    // Find the user's progress blob using the SDK
    const prefix = `user-progress/${sessionData.userId}`
    const { blobs } = await list({ prefix })

    if (blobs.length === 0) {
      return NextResponse.json({ success: true, progress: null })
    }

    // Get the most recently uploaded blob
    const latestBlob = blobs.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]

    const response = await fetch(latestBlob.url, { cache: 'no-store' })
    if (response.ok) {
      const progress = await response.json()
      return NextResponse.json({ success: true, progress })
    }

    return NextResponse.json({ success: true, progress: null })
  } catch (error) {
    console.error('Error loading progress:', error)
    return NextResponse.json(
      { error: 'Failed to load progress' },
      { status: 500 }
    )
  }
}

// POST - Save user progress to Blob storage
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

    // Save progress to Blob storage with deterministic path per user.
    // addRandomSuffix: false avoids blob proliferation on every save.
    // Security: userId is 128-bit random (crypto.randomBytes), so paths are not guessable.
    // The API endpoint itself requires authentication — blob URLs are a storage detail.
    const filename = `user-progress/${sessionData.userId}.json`
    const blob = await put(filename, progressJson, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    })

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
