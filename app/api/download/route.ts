import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('file')

    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 })
    }

    // Security: Only allow specific files from Clinical Toolkit
    const allowedFiles = [
      'SCAT6_Fillable.pdf',
      'SCOAT6_Fillable.pdf',
      'Concussion Clinical Cheat Sheet.pdf',
      'Concussion Myth-Buster Sheet .pdf',
      'Post-Concussion Syndrome (PCS) Clinical Flowchart.pdf',
      'Referral Flowchart.pdf',
      'Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder.pdf',
      'Return-to-School Plan Template (DOCX).docx',
      'Employer _ School Letter Template.docx',
      'Email Template Pack.docx',
      '"What to Expect After a Concussion" .pdf',
      'RehabFlow.png',
      'SCAT:SCOAT_FIllablePDFs.zip',
    ]

    if (!allowedFiles.includes(fileName)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Authentication check - ALL files now require authentication
    // Check session JWT token
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to download resources.' },
        { status: 401 }
      )
    }

    // Verify JWT session token
    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    // Verify user has paid access (online-only or full-course)
    if (!sessionData.accessLevel || (sessionData.accessLevel !== 'online-only' && sessionData.accessLevel !== 'full-course')) {
      return NextResponse.json(
        { error: 'Premium access required to download resources.' },
        { status: 403 }
      )
    }

    // Try multiple possible file paths
    const possiblePaths = [
      join(process.cwd(), 'public', 'docs', fileName),
      join(process.cwd(), 'docs', fileName),
      join(process.cwd(), '..', 'docs', fileName),
    ]

    let filePath: string | null = null
    for (const path of possiblePaths) {
      try {
        await access(path)
        filePath = path
        break
      } catch {
        continue
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'File not found on server. Please contact support.' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)

    // Determine content type
    const contentType = fileName.endsWith('.pdf')
      ? 'application/pdf'
      : fileName.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : fileName.endsWith('.png')
      ? 'image/png'
      : fileName.endsWith('.zip')
      ? 'application/zip'
      : 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'File download failed' },
      { status: 500 }
    )
  }
}
