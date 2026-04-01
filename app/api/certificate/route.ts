import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import {
  generateCertificatePDF,
  getSCATCertificateData,
  getOnlineCourseCertificateData,
  getFullCourseCertificateData,
} from '@/lib/certificate'
import { resend, sendEmail } from '@/lib/resend-client'
import { sql } from '@/lib/db'
import { SCAT_COMPLETION_UPSELL } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

const SCAT_MODULE_IDS = [101, 102, 103, 104, 105, 106]
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

    // The full-course (14 CPD) certificate is issued manually by the workshop instructor.
    // Only scat-mastery (2 CPD) and online-course (8 CPD) are auto-generated.
    if (courseType === 'full-course') {
      return NextResponse.json({ error: 'Full course certificates are issued at your workshop' }, { status: 403 })
    }

    // Verify user has the required access level for this certificate type
    const user = await findUserById(sessionData.userId)
    if (courseType === 'online-course' && (!user || user.accessLevel === 'preview')) {
      return NextResponse.json({ error: 'Online course access required' }, { status: 403 })
    }

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = courseType === 'scat-mastery' ? SCAT_MODULE_IDS : PAID_MODULE_IDS
    const allCompleted = moduleIds.every(id => progress[String(id)]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed. Finish all modules and pass all quizzes first.' },
        { status: 403 }
      )
    }

    // Validate quiz scores — 75% required for each module with a quiz
    const failedModules = moduleIds.filter(id => {
      const mod = progress[String(id)]
      if (mod?.quizTotalQuestions && mod.quizTotalQuestions > 0) {
        const score = (mod.quizScore || 0) / mod.quizTotalQuestions
        return score < 0.75
      }
      return false
    })
    if (failedModules.length > 0) {
      return NextResponse.json(
        { error: `You need at least 75% on all quizzes. Retake the quiz in module${failedModules.length > 1 ? 's' : ''} ${failedModules.join(', ')}.` },
        { status: 403 }
      )
    }

    // Get the latest completion date across all modules
    const completionDate = getLatestCompletionDate(progress, moduleIds)

    // Use user already loaded from access check (or load if scat-mastery which skips it)
    const resolvedUser = user || await findUserById(sessionData.userId)
    const participantName = resolvedUser?.name || sessionData.name || 'Participant'

    // Generate certificate data based on course type
    let certData
    if (courseType === 'scat-mastery') {
      certData = getSCATCertificateData(participantName, sessionData.email, completionDate)
    } else if (courseType === 'full-course') {
      certData = getFullCourseCertificateData(participantName, sessionData.email, completionDate)
    } else {
      certData = getOnlineCourseCertificateData(participantName, sessionData.email, completionDate)
    }

    let pdfBuffer: Buffer
    let certificateId: string
    try {
      const result = generateCertificatePDF(certData)
      pdfBuffer = result.pdfBuffer
      certificateId = result.certificateId
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      return NextResponse.json(
        { error: 'Certificate PDF generation failed. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // Return PDF (convert Buffer to Uint8Array for NextResponse compatibility)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CPD-Certificate-${certificateId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate. Please try again or contact support.' },
      { status: 500 }
    )
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

    // The full-course (14 CPD) certificate is issued manually by the workshop instructor.
    if (courseType === 'full-course') {
      return NextResponse.json({ error: 'Full course certificates are issued at your workshop' }, { status: 403 })
    }

    // Verify user has the required access level for this certificate type
    const userCheck = await findUserById(sessionData.userId)
    if (courseType === 'online-course' && (!userCheck || userCheck.accessLevel === 'preview')) {
      return NextResponse.json({ error: 'Online course access required' }, { status: 403 })
    }

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = courseType === 'scat-mastery' ? SCAT_MODULE_IDS : PAID_MODULE_IDS
    const allCompleted = moduleIds.every(id => progress[String(id)]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed' },
        { status: 403 }
      )
    }

    // Validate quiz scores — 75% required for each module with a quiz
    const failedModules = moduleIds.filter(id => {
      const mod = progress[String(id)]
      if (mod?.quizTotalQuestions && mod.quizTotalQuestions > 0) {
        const score = (mod.quizScore || 0) / mod.quizTotalQuestions
        return score < 0.75
      }
      return false
    })
    if (failedModules.length > 0) {
      return NextResponse.json(
        { error: `You need at least 75% on all quizzes. Retake the quiz in module${failedModules.length > 1 ? 's' : ''} ${failedModules.join(', ')}.` },
        { status: 403 }
      )
    }

    const completionDate = getLatestCompletionDate(progress, moduleIds)

    const resolvedUser = userCheck || await findUserById(sessionData.userId)
    const participantName = resolvedUser?.name || sessionData.name || 'Participant'

    // Generate certificate data based on course type
    let certData
    if (courseType === 'scat-mastery') {
      certData = getSCATCertificateData(participantName, sessionData.email, completionDate)
    } else if (courseType === 'full-course') {
      certData = getFullCourseCertificateData(participantName, sessionData.email, completionDate)
    } else {
      certData = getOnlineCourseCertificateData(participantName, sessionData.email, completionDate)
    }

    let pdfBuffer: Buffer
    let certificateId: string
    try {
      const result = generateCertificatePDF(certData)
      pdfBuffer = result.pdfBuffer
      certificateId = result.certificateId
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      return NextResponse.json(
        { error: 'Certificate PDF generation failed. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // Check if we're in dev mode (no actual email will be sent)
    const isDevMode = !resend || process.env.NODE_ENV === 'development'

    if (isDevMode) {
      console.log('Certificate email would be sent:', {
        to: sessionData.email,
        subject: `Your CPD Certificate — ${certData.courseTitle}`,
        certificateId,
        attachmentSize: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
      })
      return NextResponse.json({
        success: true,
        certificateId,
        emailSent: false,
        message: 'Email skipped in development mode',
      })
    }

    // Deduplicate certificate emails — prevents double-send if user clicks twice
    const certAuditKey = `certificate_email_${courseType}_${sessionData.userId}`
    const { rowCount: certInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${certAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`

    let emailSent = false
    if (certInserted === 0) {
      // Already sent — skip email but still return success (user can download PDF)
      console.log(`[Certificate] Already emailed ${courseType} cert to ${sessionData.email} — skipping duplicate`)
    } else {
      // Send email with certificate attached
      emailSent = await sendCertificateEmail({
        to: sessionData.email,
        participantName,
        courseTitle: certData.courseTitle,
        cpdPoints: certData.cpdPoints,
        certificateId,
        pdfBuffer,
      })

      // After scat-mastery certificate: fire the completion upsell email
      // This is the highest-intent moment — they just earned their certificate
      if (emailSent && courseType === 'scat-mastery') {
        await sendCompletionUpsell(sessionData.userId, sessionData.email, participantName)
      }
    }

    return NextResponse.json({
      success: true,
      certificateId,
      emailSent,
      message: emailSent
        ? 'Certificate generated and emailed successfully'
        : certInserted === 0
          ? 'Certificate already emailed — download it from your dashboard'
          : 'Certificate generated but email failed — you can download it from your dashboard',
    })
  } catch (error) {
    console.error('Certificate email error:', error)
    return NextResponse.json(
      { error: 'Failed to generate and email certificate. Please try again or contact support.' },
      { status: 500 }
    )
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
  // Dev mode guard — should not be reached since POST handler checks this first,
  // but kept as a safety net
  if (!resend || process.env.NODE_ENV === 'development') {
    console.log('Certificate email skipped (dev mode):', {
      to: opts.to,
      subject: `Your CPD Certificate — ${opts.courseTitle}`,
      certificateId: opts.certificateId,
    })
    return false
  }

  try {
    const result = await resend.emails.send({
      from: 'Concussion Education Australia <zac@concussion-education-australia.com>',
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
                    ${escapeHtml(opts.courseTitle)}
                  </div>
                  <div style="font-size: 32px; font-weight: 800; color: #059669;">
                    ${opts.cpdPoints} CPD Points
                  </div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                    AHPRA-Aligned · Certificate ID: ${escapeHtml(opts.certificateId)}
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
                  <a href="https://portal.concussion-education-australia.com/pricing?utm_source=email&utm_medium=email&utm_campaign=scat-completion-upsell&utm_content=certificate" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
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

/**
 * Send the post-completion upsell email after scat-mastery certificate.
 * Deduped via audit log — safe to call multiple times.
 */
async function sendCompletionUpsell(userId: string, email: string, name: string) {
  const auditKey = `scat_completion_upsell_${userId}`
  const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
  if (inserted === 0) {
    console.log(`[Completion Upsell] Already sent to ${email} — skipping`)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const pricingLink = `${baseUrl}/pricing`
  const unsubToken = generateUnsubscribeToken(email)
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

  const html = SCAT_COMPLETION_UPSELL.template(name, pricingLink)
    .replace('{{unsubscribe_url}}', unsubscribeUrl)

  try {
    await sendEmail({
      to: email,
      subject: SCAT_COMPLETION_UPSELL.subject,
      html,
      tags: [
        { name: 'sequence', value: 'scat-completion-upsell' },
        { name: 'trigger', value: 'certificate' },
      ],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    console.log(`[Completion Upsell] Sent to ${email}`)
  } catch (err) {
    console.error(`[Completion Upsell] Failed to send to ${email}:`, err)
  }
}
