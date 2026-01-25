// Temporary diagnostic endpoint to debug user loading
import { NextResponse } from 'next/server'
import { head } from '@vercel/blob'

export async function GET() {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is set
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN

    // Try to check if users.json exists
    let blobCheck = null
    let blobError = null
    try {
      blobCheck = await head('users.json')
    } catch (error: any) {
      blobError = error.message
    }

    return NextResponse.json({
      hasToken,
      blobExists: !!blobCheck,
      blobUrl: blobCheck?.url || null,
      blobError,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
