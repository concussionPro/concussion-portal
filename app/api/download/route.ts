import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { isBookOwner, getCurrentAccessLevel } from '@/lib/users'

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
      'Child_SCAT6_Flat.pdf',
      'Concussion Clinical Cheat Sheet.pdf',
      'Concussion Myth-Buster Sheet.pdf',
      'Post-Concussion Syndrome (PCS) Clinical Flowchart.pdf',
      'Referral Flowchart.pdf',
      'Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder.pdf',
      'Return-to-School Plan Template (DOCX).docx',
      'Employer _ School Letter Template.docx',
      'Email Template Pack.docx',
      'What to Expect After a Concussion.pdf',
      'RehabFlow.pdf',
      'RehabFlow.png',
      'CCM_Complete_Reference_2026.pdf',
      'SCAT-SCOAT_FillablePDFs.zip',
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

    // Access: paid course users OR bundle (reference + toolkit) buyers.
    // Bundle buyers are preview-level in the session cookie but flagged in the
    // DB via reference_book_purchased_at. DB lookup is fast; this route is
    // already protected by session verification above.
    // Revocation re-check, matching lib/toolkit-access.ts: the session JWT
    // lives 365 days and outlives a refund downgrade, so a PAID CLAIM is
    // confirmed against the users row before handing over the files. A DB blip
    // (no row returned) keeps the JWT claim — this must never lock out a
    // legitimate buyer — and the free/bundle paths below are unchanged.
    let paidAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'
    if (paidAccess) {
      const dbLevel = await getCurrentAccessLevel(sessionData.userId).catch(() => null)
      if (dbLevel && dbLevel !== 'online-only' && dbLevel !== 'full-course') paidAccess = false
    }
    const bundleOwner = !paidAccess ? await isBookOwner(sessionData.email) : false

    if (!paidAccess && !bundleOwner) {
      return NextResponse.json(
        { error: 'Reference + Toolkit bundle (A$97) or paid course required to download.' },
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
