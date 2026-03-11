import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import {
  generateCertificatePDF,
  getSCATCertificateData,
  getOnlineCourseCertificateData,
  getFullCourseCertificateData,
} from '@/lib/certificate'
import { resend } from '@/lib/resend-client'
import { sql } from '@/lib/db'

const SCAT_MODULE_IDS = [101, 102, 103, 104, 105]
const PAID_MODULE_IDS = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * GET /api/certificate?type=scat-mastery|online-course|full-course
 * Generate and return certificate PDF (download)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const courseType = request.nextUrl.searchParams.get('type') || 'scat-mastery'

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = courseType === 'scat-mastery' ? SCAT_MODULE_IDS : PAID_MODULE_IDS
    const allCompleted = moduleIds.every(id => progress[id]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed. Finish all modules and pass all quizzes first.' },
        { status: 403 }
      )
    }

    // Get the latest completion date across all modules
    const completionDate = getLatestCompletionDate(progress, moduleIds)

    // Get user details
    const user = await findUserById(sessionData.userId)
    const participantName = user?.name || sessionData.name || 'Participant'

    // Generate certificate
    const certData = courseType === 'full-course'
      ? getFullCourseCertificateData(participantName, sessionData.email, completionDate)
      : courseType === 'scat-mastery'
        ? getSCATCertificateData(participantName, sessionData.email, completionDate)
        : getOnlineCourseCertificateData(participantName, sessionData.email, completionDate)

    const { pdfBuffer, certificateId } = generateCertificatePDF(certData)

    // Return PDF (convert Buffer to Uint8Array for NextResponse compatibility)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CPD-Certificate-${certificateId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}

/**
 * POST /api/certificate
 * Generate certificate and email it to the user
 * Body: { type: 'scat-mastery' | 'online-course' }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const courseType = body.type || 'scat-mastery'

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = courseType === 'scat-mastery' ? SCAT_MODULE_IDS : PAID_MODULE_IDS
    const allCompleted = moduleIds.every(id => progress[id]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed' },
        { status: 403 }
      )
    }

    const completionDate = getLatestCompletionDate(progress, moduleIds)

    const user = await findUserById(sessionData.userId)
    const participantName = user?.name || sessionData.name || 'Participant'

    const certData = courseType === 'full-course'
      ? getFullCourseCertificateData(participantName, sessionData.email, completionDate)
      : courseType === 'scat-mastery'
        ? getSCATCertificateData(participantName, sessionData.email, completionDate)
        : getOnlineCourseCertificateData(participantName, sessionData.email, completionDate)

    const { pdfBuffer, certificateId } = generateCertificatePDF(certData)

    // Send email with certificate attached
    const emailSent = await sendCertificateEmail({
      to: sessionData.email,
      participantName,
      courseTitle: certData.courseTitle,
      cpdPoints: certData.cpdPoints,
      certificateId,
      pdfBuffer,
    })

    return NextResponse.json({
      success: true,
      certificateId,
      emailSent,
      message: emailSent
        ? 'Certificate generated and emailed successfully'
        : 'Certificate generated but email failed — you can download it from your dashboard',
    })
  } catch (error) {
    console.error('Certificate email error:', error)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────

async function loadUserProgress(userId: string): Promise<Record<string, any> | null> {
  try {
    const { rows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${userId}`
    if (rows.length > 0 && rows[0].progress) {
      return rows[0].progress as Record<string, any>
    }
  } catch (error) {
    console.error('Failed to load user progress:', error)
  }
  return null
}

function getLatestCompletionDate(progress: Record<string, any>, moduleIds: number[]): Date {
  let latest = new Date(0)
  for (const id of moduleIds) {
    const mod = progress[id]
    if (mod?.completedAt) {
      const d = new Date(mod.completedAt)
      if (d > latest) latest = d
    }
  }
  return latest.getTime() > 0 ? latest : new Date()
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function sendCertificateEmail(opts: {
  to: string
  participantName: string
  courseTitle: string
  cpdPoints: number
  certificateId: string
  pdfBuffer: Buffer
}): Promise<boolean> {
  // Dev mode — log only
  if (!resend || process.env.NODE_ENV === 'development') {
    console.log('Certificate email would be sent:', {
      to: opts.to,
      subject: `Your CPD Certificate — ${opts.courseTitle}`,
      certificateId: opts.certificateId,
      attachmentSize: `${(opts.pdfBuffer.length / 1024).toFixed(1)} KB`,
    })
    return true
  }

  try {
    const result = await resend.emails.send({
      from: 'Zac Lewis - Concussion Education Australia <zac@concussion-education-australia.com>',
      replyTo: 'zac@concussion-education-australia.com',
      to: opts.to,
      subject: `Your CPD Certificate — ${opts.courseTitle}`,
      attachments: [
        {
          filename: `CPD-Certificate-${opts.certificateId}.pdf`,
          content: opts.pdfBuffer,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

              <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                  Certificate of Completion
                </h1>
              </div>

              <div style="padding: 32px 24px;">
                <h2 style="margin-top: 0; color: #1e293b;">Hi ${escapeHtml(opts.participantName)},</h2>

                <p>You've successfully completed:</p>

                <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                  <div style="font-size: 18px; font-weight: 700; color: #166534; margin-bottom: 8px;">
                    ${opts.courseTitle}
                  </div>
                  <div style="font-size: 32px; font-weight: 800; color: #059669;">
                    ${opts.cpdPoints} CPD Points
                  </div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                    AHPRA-Aligned · Certificate ID: ${opts.certificateId}
                  </div>
                </div>

                <p>Your CPD certificate is attached to this email as a PDF. Save it for your records.</p>

                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>For AHPRA Audit:</strong> Retain this certificate in your CPD portfolio for at least 5 years. Log this activity as "Educational Activity — Reviewing & Reflecting" with ${opts.cpdPoints} CPD points.
                  </p>
                </div>

                ${opts.cpdPoints === 2 ? `
                <div style="background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin: 0 0 8px 0; color: #7c3aed; font-size: 16px;">Ready for the next level?</h3>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b21a8;">
                    Upgrade to the full ConcussionPro course for 14 total AHPRA-aligned CPD points — including advanced assessment protocols and a full-day practical workshop.
                  </p>
                  <a href="https://portal.concussion-education-australia.com/pricing" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    View Full Course →
                  </a>
                </div>
                ` : ''}

                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                  Questions about your certificate or CPD logging? Just reply to this email.
                </p>

                <p style="color: #64748b;">
                  Congratulations on investing in your professional development!<br><br>
                  - Zac<br>
                  <em style="font-size: 14px;">Founder, Concussion Education Australia</em>
                </p>
              </div>

              <div style="padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">
                <p><strong>Concussion Education Australia</strong></p>
                <p>zac@concussion-education-australia.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (result.data) {
      console.log('Certificate email sent:', result.data.id)
      return true
    }
    console.error('Certificate email error:', result.error)
    return false
  } catch (error) {
    console.error('Certificate email error:', error)
    return false
  }
}
