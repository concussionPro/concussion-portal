import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { put, head } from '@vercel/blob'

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

    // Check if progress file exists
    const blobUrl = `https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[1]}.public.blob.vercel-storage.com/user-progress/${sessionData.userId}.json`

    try {
      const response = await fetch(blobUrl)
      if (response.ok) {
        const progress = await response.json()
        return NextResponse.json({ success: true, progress })
      }
    } catch (e) {
      // File doesn't exist, return empty progress
    }

    // No progress found, return null
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

    // Save progress to Blob storage
    const filename = `user-progress/${sessionData.userId}.json`
    const blob = await put(filename, JSON.stringify(progress), {
      access: 'public',
      contentType: 'application/json',
    })

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
      url: blob.url
    })
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}
