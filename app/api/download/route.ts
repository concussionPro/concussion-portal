import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/sessions'
import { findUserById } from '@/lib/users'

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
      'Persistent Post-Concussive Symptoms (PPCS) Clinical Flowchart.pdf',
      'Referral Flowchart.pdf',
      'Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder.pdf',
      'Return-to-School Plan Template (DOCX).docx',
      'Employer _ School Letter Template.docx',
      'Email Template Pack.docx',
      '"What to Expect After a Concussion" .pdf',
    ]

    if (!allowedFiles.includes(fileName)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // SECURITY: ALL toolkit resources now require full-course access
    // Verify session and access level server-side
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access clinical toolkit.' },
        { status: 401 }
      )
    }

    // Verify session is valid
    const session = await verifySession(sessionCookie.value)

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // Get user and verify access level
    const user = await findUserById(session.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    // ONLY full-course users can download toolkit resources
    if (user.accessLevel !== 'full-course') {
      return NextResponse.json(
        { error: 'Full course enrollment required to download clinical toolkit resources. Upgrade to full course access.' },
        { status: 403 }
      )
    }

    // Try multiple possible file paths
    const possiblePaths = [
      join(process.cwd(), 'public', 'docs', 'Clinical Toolkit', fileName),
      join(process.cwd(), 'docs', 'Clinical Toolkit', fileName),
      join(process.cwd(), '..', 'docs', 'Clinical Toolkit', fileName),
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
