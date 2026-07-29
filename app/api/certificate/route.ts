import { NextRequest, NextResponse } from 'next/server'
import { verifyModuleQuiz } from '@/lib/quiz-verify'
import { verifySessionToken } from '@/lib/jwt-session'
import { findUserById } from '@/lib/users'
import {
  generateCertificatePDF,
  getSCATCertificateData,
  getOnlineCourseCertificateData,
  getFullCourseCertificateData,
  getRecognitionReferralCertificateData,
  getCrmCertificateData,
} from '@/lib/certificate'
import { userOwnsCrm } from '@/lib/crm-course'
import { getResend, sendEmail, sendEmailWithAttachment, escapeHtml as sharedEscapeHtml } from '@/lib/resend-client'
import { sql } from '@/lib/db'
import { SCAT_COMPLETION_UPSELL } from '@/lib/email-sequences'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { rateLimit } from '@/lib/rate-limit'
import { CONFIG } from '@/lib/config'

const SCAT_MODULE_IDS = [101, 102, 103]
const PAID_MODULE_IDS = [1, 2, 3, 4, 5, 6, 7, 8]
// Module 104 — free standalone "Concussion Care Has Changed" awareness course.
// Its completion certificate (recognition-referral) is gated on module 104 alone.
const RECOGNITION_REFERRAL_MODULE_IDS = [104]
// CRM (EP stream) progress lives at the NAMESPACED ids 201-208 (epProgressId)
// — never 1-8, which are the flagship's.
const CRM_MODULE_IDS = [201, 202, 203, 204, 205, 206, 207, 208]

/** Which module ids gate a given certificate type. */
function moduleIdsForCertType(courseType: string): number[] {
  if (courseType === 'scat-mastery') return SCAT_MODULE_IDS
  if (courseType === 'recognition-referral') return RECOGNITION_REFERRAL_MODULE_IDS
  if (courseType === 'crm') return CRM_MODULE_IDS
  return PAID_MODULE_IDS
}

/** Quiz pass mark per cert type — CRM (EP) passes at 80%, everything else 75%. */
function passMarkPercentFor(courseType: string): number {
  return courseType === 'crm' ? 80 : 75
}

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

    // Certificate generation is CPU-heavy (PDF). Limit per-user to stop runaway loops.
    const rl = await rateLimit({ key: `certificate:${sessionData.userId}`, limit: 10, windowSec: 60 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many certificate requests. Please wait.' }, { status: 429 })
    }

    const courseType = request.nextUrl.searchParams.get('type') || 'scat-mastery'

    // The full-course (16 CPD) certificate is issued manually by the workshop instructor.
    // scat-mastery (1 CPD). online-course (8 CPD). Both are auto-generated.
    if (courseType === 'full-course') {
      return NextResponse.json({ error: 'Full course certificates are issued at your workshop' }, { status: 403 })
    }

    // Verify user has the required access level for this certificate type
    const user = await findUserById(sessionData.userId)
    if (courseType === 'online-course' && (!user || user.accessLevel === 'preview')) {
      return NextResponse.json({ error: 'Online course access required' }, { status: 403 })
    }
    // CRM entitlement lives in course_purchases, NOT access_level (streams are
    // isolated — CRM buyers carry 'preview').
    if (courseType === 'crm' && !(await userOwnsCrm(sessionData.email))) {
      return NextResponse.json({ error: 'Concussion Rehab Mastery enrolment required' }, { status: 403 })
    }

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = moduleIdsForCertType(courseType)
    const allCompleted = moduleIds.every(id => progress[String(id)]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed. Finish all modules and pass all quizzes first.' },
        { status: 403 }
      )
    }

    // SERVER-SIDE quiz verification (2026-07-05): the progress blob is
    // client-authored, so `completed`/`quizScore` are never trusted for a
    // CPD document. Each module's result is recomputed from the stored
    // per-question answers against the server answer key — fail closed.
    const failedModules = moduleIds.filter(id => {
      const v = verifyModuleQuiz(id, progress[String(id)]?.quizAnswers)
      // Modules without a quiz (no-quiz-data with total 0) don't gate.
      if (v.reason === 'no-quiz-data') return false
      return !v.ok
    })
    if (failedModules.length > 0) {
      // Report the DISPLAY module numbers (CRM ids are namespaced 201-208).
      const displayIds = failedModules.map(id => (courseType === 'crm' ? id - 200 : id))
      return NextResponse.json(
        { error: `You need at least ${passMarkPercentFor(courseType)}% on all quizzes, verified from your saved answers. Retake the quiz in module${failedModules.length > 1 ? 's' : ''} ${displayIds.join(', ')} (answers save automatically when you submit a quiz).` },
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
    } else if (courseType === 'recognition-referral') {
      certData = getRecognitionReferralCertificateData(participantName, sessionData.email, completionDate)
    } else if (courseType === 'crm') {
      certData = getCrmCertificateData(participantName, sessionData.email, completionDate)
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

    // The full-course (16 CPD) certificate is issued manually by the workshop instructor.
    if (courseType === 'full-course') {
      return NextResponse.json({ error: 'Full course certificates are issued at your workshop' }, { status: 403 })
    }

    // Verify user has the required access level for this certificate type
    const userCheck = await findUserById(sessionData.userId)
    if (courseType === 'online-course' && (!userCheck || userCheck.accessLevel === 'preview')) {
      return NextResponse.json({ error: 'Online course access required' }, { status: 403 })
    }
    // CRM entitlement lives in course_purchases, NOT access_level (streams are
    // isolated — CRM buyers carry 'preview').
    if (courseType === 'crm' && !(await userOwnsCrm(sessionData.email))) {
      return NextResponse.json({ error: 'Concussion Rehab Mastery enrolment required' }, { status: 403 })
    }

    // Load user progress to verify completion
    const progress = await loadUserProgress(sessionData.userId)
    if (!progress) {
      return NextResponse.json({ error: 'No progress found' }, { status: 404 })
    }

    const moduleIds = moduleIdsForCertType(courseType)
    const allCompleted = moduleIds.every(id => progress[String(id)]?.completed)

    if (!allCompleted) {
      return NextResponse.json(
        { error: 'Course not yet completed' },
        { status: 403 }
      )
    }

    // SERVER-SIDE quiz verification (2026-07-05): the progress blob is
    // client-authored, so `completed`/`quizScore` are never trusted for a
    // CPD document. Each module's result is recomputed from the stored
    // per-question answers against the server answer key — fail closed.
    const failedModules = moduleIds.filter(id => {
      const v = verifyModuleQuiz(id, progress[String(id)]?.quizAnswers)
      // Modules without a quiz (no-quiz-data with total 0) don't gate.
      if (v.reason === 'no-quiz-data') return false
      return !v.ok
    })
    if (failedModules.length > 0) {
      const displayIds = failedModules.map(id => (courseType === 'crm' ? id - 200 : id))
      return NextResponse.json(
        { error: `You need at least ${passMarkPercentFor(courseType)}% on all quizzes, verified from your saved answers. Retake the quiz in module${failedModules.length > 1 ? 's' : ''} ${displayIds.join(', ')} (answers save automatically when you submit a quiz).` },
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
    } else if (courseType === 'recognition-referral') {
      certData = getRecognitionReferralCertificateData(participantName, sessionData.email, completionDate)
    } else if (courseType === 'crm') {
      certData = getCrmCertificateData(participantName, sessionData.email, completionDate)
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
    const isDevMode = !getResend() || process.env.NODE_ENV === 'development'

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
      console.log(`[Certificate] Already emailed ${courseType} cert to ${sessionData.email.slice(0, 3)}*** — skipping duplicate`)
    } else {
      // Send email with certificate attached
      emailSent = await sendCertificateEmail({
        to: sessionData.email,
        participantName,
        courseTitle: certData.courseTitle,
        cpdPoints: certData.cpdPoints,
        certificateId,
        pdfBuffer,
        userAccessLevel: resolvedUser?.accessLevel,
        courseType,
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

/** The stored progress blob: module id (as a string key) -> its progress. */
type StoredProgress = Record<string, {
  completed?: boolean
  completedAt?: string
  quizScore?: number
  quizCompleted?: boolean
  quizAnswers?: Record<string, number> | null
}>

async function loadUserProgress(userId: string): Promise<StoredProgress | null> {
  try {
    const { rows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${userId}`
    if (rows.length > 0 && rows[0].progress) {
      return rows[0].progress as StoredProgress
    }
  } catch (error) {
    console.error('Failed to load user progress:', error)
  }
  return null
}

function getLatestCompletionDate(progress: StoredProgress, moduleIds: number[]): Date {
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

async function sendCertificateEmail(opts: {
  to: string
  participantName: string
  courseTitle: string
  cpdPoints: number
  certificateId: string
  pdfBuffer: Buffer
  /** access_level so we dont pitch the workshop to someone who already owns it */
  userAccessLevel?: 'preview' | 'online-only' | 'full-course'
  /**
   * Certificate type — CRM buyers carry access_level 'preview' (isolated
   * streams), so WITHOUT this the CRM cert email fell into the free-tier
   * branch and pitched the CCM flagship to a paying EP customer.
   */
  courseType?: string
}): Promise<boolean> {
  // 0-CPD activities (the free awareness module) are completion certificates,
  // not CPD certificates — keep the framing honest.
  const isCompletionOnly = opts.cpdPoints === 0
  return sendEmailWithAttachment({
    to: opts.to,
    subject: isCompletionOnly
      ? `Your Certificate of Completion — ${opts.courseTitle}`
      : `Your CPD Certificate — ${opts.courseTitle}`,
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
                <h2 style="margin-top: 0; color: #1e293b;">Hi ${sharedEscapeHtml(opts.participantName)},</h2>

                <p>You've successfully completed:</p>

                <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                  <div style="font-size: 18px; font-weight: 700; color: #166534; margin-bottom: 8px;">
                    ${sharedEscapeHtml(opts.courseTitle)}
                  </div>
                  ${isCompletionOnly ? `
                  <div style="font-size: 24px; font-weight: 800; color: #059669;">
                    Certificate of Completion
                  </div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                    Certificate ID: ${sharedEscapeHtml(opts.certificateId)}
                  </div>
                  ` : `
                  <div style="font-size: 32px; font-weight: 800; color: #059669;">
                    ${opts.cpdPoints} CPD ${opts.cpdPoints === 1 ? 'Point' : 'Points'}
                  </div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                    AHPRA-Aligned · Certificate ID: ${sharedEscapeHtml(opts.certificateId)}
                  </div>
                  `}
                </div>

                <p>Your certificate is attached to this email as a PDF. Save it for your records.</p>

                ${opts.cpdPoints > 0 ? `
                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>For AHPRA Audit:</strong> Retain this certificate in your CPD portfolio for at least 5 years. Log this activity as "Educational Activity — Reviewing & Reflecting" with ${opts.cpdPoints} CPD hours.
                  </p>
                </div>
                ` : ''}

                <!-- What's next — tailored to access level so we dont pitch
                     the workshop to someone who already owns full-course. -->
                ${opts.courseType === 'crm' ? `
                <!-- CRM (EP stream) graduate — pitch the CRM practical day, NEVER the CCM flagship. -->
                <div style="margin: 32px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
                    Whats next — the practical day
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
                    Youve completed the online course — 8 ESSA CPD points banked. Add the supervised practical day to take it to 16 CPD hours: hands-on graded exercise testing, threshold determination and progression decisions with real cases.
                  </p>
                  <a href="https://portal.concussion-education-australia.com/concussion-rehab-mastery?utm_source=email&utm_medium=email&utm_campaign=crm-certificate-upsell&utm_content=practical-day" style="display: inline-block; padding: 9px 18px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                    Add the practical day →
                  </a>
                </div>
                ` : opts.userAccessLevel === 'full-course' ? `
                <!-- Full-course buyer — they already own online + workshop. No upsell. -->
                <div style="margin: 32px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
                    Whats next
                  </p>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">
                    Youve already got the full Concussion Clinical Mastery course — your in-person workshop seat is included. Your nominated city's date locks in once it reaches its Ready-to-Train threshold, and the logistics email goes out 1 week prior.
                  </p>
                  <p style="margin: 0 0 0 0; font-size: 13px; color: #475569;">
                    Questions about the workshop, your modules, or CPD logging? Reply to this email.
                  </p>
                </div>
                ` : opts.userAccessLevel === 'online-only' ? `
                <!-- Online-only buyer — pitch the workshop UPGRADE, not the full course. -->
                <div style="margin: 32px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
                    Whats next — workshop upgrade
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
                    Youve completed the online modules. Add the in-person workshop to bank the full 16 CPD hours + hands-on practice.
                  </p>
                  <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 12px; padding: 18px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #a16207; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
                      In-person workshop · your nominated city
                    </div>
                    <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 17px;">Concussion Clinical Mastery — workshop add-on</h3>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                      Full-day hands-on practice: VOMS, oculomotor, BESS, cervical, return-to-play decision pathways. Runs city-by-city as each hits its threshold — nominate yours at upgrade. Brings your total to 16 CPD hours.
                    </p>
                    <a href="https://portal.concussion-education-australia.com/pricing?utm_source=email&utm_medium=email&utm_campaign=certificate-upsell&utm_content=workshop-add-on" style="display: inline-block; padding: 9px 18px; background: #a16207; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                      Add the workshop →
                    </a>
                  </div>
                </div>
                ` : `
                <!-- Preview / SCAT-only / free-course graduate — pitch the full course -->
                <div style="margin: 32px 0 24px 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">
                    What's next on your CPD plan
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
                    You've earned ${opts.cpdPoints} CPD ${opts.cpdPoints === 1 ? 'hour' : 'hours'}. Most AHPRA boards need 20–50 hours per registration cycle. Here's the next step.
                  </p>

                  <!-- Flagship -->
                  <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 12px; padding: 18px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #a16207; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
                      Flagship · 16 CPD hours · workshop included
                    </div>
                    <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 17px;">Concussion Clinical Mastery</h3>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                      The full clinical course — 8 online modules + a full-day in-person workshop in your nominated city. Osteopathy Australia–endorsed. Goes deep on assessment, persistent symptoms, return-to-play, rehabilitation by phenotype.
                    </p>
                    <a href="https://portal.concussion-education-australia.com/pricing?utm_source=email&utm_medium=email&utm_campaign=certificate-upsell&utm_content=ccm-flagship" style="display: inline-block; padding: 9px 18px; background: #a16207; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                      View pricing →
                    </a>
                    <span style="margin-left: 6px; font-size: 11px; color: #64748b;">A$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  </div>

                  <!-- Poll — capture intent for upcoming short courses -->
                  <p style="margin: 16px 0 0 0; font-size: 13px; color: #475569;">
                    Short specialty courses launching from June — <a href="https://portal.concussion-education-australia.com/courses/poll?utm_source=email&utm_medium=email&utm_campaign=certificate-upsell&utm_content=poll" style="color: #0d9488; font-weight: 600;">vote on what gets built first</a>. Voters get 40% off the winner at launch.
                  </p>
                </div>
                `}

                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                  Questions about your certificate or CPD logging? Just reply to this email — comes straight to me.
                </p>

                <p style="color: #64748b;">
                  Nice work on the SCAT mastery.<br><br>
                  Zac<br>
                  <em style="font-size: 14px;">AHPRA-registered Osteopath · Founder, Concussion Education Australia</em>
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
}

/**
 * Send the post-completion upsell email after scat-mastery certificate.
 * Deduped via audit log — safe to call multiple times.
 */
async function sendCompletionUpsell(userId: string, email: string, name: string) {
  // Respect unsubscribe preference
  try {
    const { rows } = await sql`SELECT nurture_unsubscribed FROM users WHERE id = ${userId} LIMIT 1`
    if (rows.length > 0 && rows[0].nurture_unsubscribed) {
      console.log(`[Completion Upsell] Skipped ${email.slice(0, 3)}*** — unsubscribed`)
      return
    }
  } catch { /* proceed if check fails */ }

  const auditKey = `scat_completion_upsell_${userId}`
  const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
  if (inserted === 0) {
    console.log(`[Completion Upsell] Already sent to ${email.slice(0, 3)}*** — skipping`)
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
    console.log(`[Completion Upsell] Sent to ${email.slice(0, 3)}***`)
  } catch (err) {
    console.error(`[Completion Upsell] Failed to send to ${email.slice(0, 3)}***:`, err)
  }
}
