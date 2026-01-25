// Fetch actual users.json content
import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export async function GET() {
  try {
    // Get all users.json versions, sorted by upload date
    const { blobs } = await list({ prefix: 'users.json' })

    if (blobs.length === 0) {
      return NextResponse.json({ error: 'No users.json found' })
    }

    // Get the most recent one
    const latestBlob = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]

    // Fetch its content
    const response = await fetch(latestBlob.url)
    const users = await response.json()

    return NextResponse.json({
      latestUpload: latestBlob.uploadedAt,
      userCount: users.length,
      users: users.map((u: any) => ({
        email: u.email,
        name: u.name,
        accessLevel: u.accessLevel,
        createdAt: u.createdAt,
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
