import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 60

// Import sequence templates
import {
  POST_PURCHASE_SEQUENCE,
  ABANDONED_CHECKOUT_SEQUENCE,
  PRE_WORKSHOP_SEQUENCE,
  SCAT_MASTERY_SEQUENCE,
} from '@/lib/email-sequences'
import { CONFIG } from '@/lib/config'

// Registration confirmation email HTML (from register route)
function preseasonRegisterEmail(baseUrl: string): string {
  const code = 'TEST01'
  const athleteLink = `${baseUrl}/preseason/b/${code}`
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 22px; font-weight: 700; }
          .content { padding: 32px 24px; }
          .link-box { background: #f0f9ff; border: 2px solid #5b9aa6; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
          .link-box a { color: #5b9aa6; font-size: 16px; font-weight: 700; word-break: break-all; }
          .code-display { font-size: 28px; font-weight: 800; color: #5b9aa6; letter-spacing: 4px; margin: 8px 0; }
          .steps { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .step { display: flex; align-items: flex-start; margin: 12px 0; }
          .step-num { background: #5b9aa6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0; font-size: 14px; }
          .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pre-Season Baseline Testing</h1>
          </div>
          <div class="content">
            <p>Hi Test Clinician,</p>
            <p><strong>Test Clinic</strong> is now registered for pre-season baseline testing. Share the link below with your sports clubs — athletes can self-administer the SCAT6 baseline remotely.</p>
            <div class="link-box">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Your unique athlete link:</p>
              <a href="${athleteLink}">${athleteLink}</a>
              <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">Clinic code: <span class="code-display">${code}</span></p>
            </div>
            <div class="steps">
              <p style="font-weight: 700; margin-top: 0;">How it works:</p>
              <div class="step"><div class="step-num">1</div><div><strong>Share the link</strong> with sports clubs, teams, and athletes</div></div>
              <div class="step"><div class="step-num">2</div><div><strong>Athletes complete</strong> the self-administered SCAT6 baseline (symptoms, memory, concentration)</div></div>
              <div class="step"><div class="step-num">3</div><div><strong>You receive a PDF report</strong> by email — no data stored on our servers</div></div>
            </div>
            <p style="font-size: 14px; color: #475569;">Each completed baseline gives you pre-injury data for comparison if a concussion occurs. The athlete's report is emailed directly to <strong>test@example.com</strong>.</p>
            <p style="font-size: 14px; color: #475569; margin: 20px 0 8px;">You've captured one dimension of baseline data. The SCAT6 protocol covers symptom evaluation, cognitive screening, neurological exam, balance testing, and more. Are you confident interpreting all 7 domains?</p>
            <div style="background: #f0f9ff; border: 2px solid #5b9aa6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-weight: 700; font-size: 16px; color: #1e293b;">Free: Master the Full SCAT6 Protocol</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">Learn how to properly administer and interpret every SCAT6 &amp; SCOAT6 section. Includes fillable forms, clinical toolkit, and certificate. <strong>Completely free.</strong></p>
              <a href="${baseUrl}/scat-mastery" style="display: inline-block; padding: 14px 32px; background-color: #5b9aa6; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Get Free Course &rarr;</a>
              <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">Want deeper training? Our <a href="${baseUrl}/pricing" style="color: #1e6b73; font-weight: 600; text-decoration: underline; display: inline; background: none; padding: 0; border-radius: 0; border: none;">full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hour course</a> covers VOMS, BESS, return-to-play &amp; more.</p>
            </div>
          </div>
          <div class="footer">
            <p>ConcussionPro — Concussion Education Australia</p>
            <p>${CONFIG.CONTACT_EMAIL}</p>
          </div>
        </div>
      </body>
    </html>`
}

// Baseline submission email HTML (from submit route)
function preseasonSubmitEmail(baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 20px; font-weight: 700; }
          .content { padding: 28px 24px; }
          .footer { padding: 20px 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Baseline Report: Test Athlete</h1>
          </div>
          <div class="content">
            <p>Hi Test Clinician,</p>
            <p>A new pre-season baseline has been completed. The full report is attached as a PDF.</p>
            <p style="font-weight: 700; margin-bottom: 8px;">Quick Summary:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
              <tr>
                <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                  <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">3/22</div>
                  <div style="font-size: 12px; color: #64748b;">Symptom Number</div>
                </td>
                <td style="width: 12px;"></td>
                <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                  <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">8/132</div>
                  <div style="font-size: 12px; color: #64748b;">Severity Score</div>
                </td>
              </tr>
              <tr><td colspan="3" style="height: 12px;"></td></tr>
              <tr>
                <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center;" colspan="3">
                  <div style="font-size: 28px; font-weight: 800; color: #5b9aa6;">42/50</div>
                  <div style="font-size: 12px; color: #64748b;">Total Cognitive Score</div>
                </td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #475569;"><strong>Athlete:</strong> Test Athlete &middot; <strong>Sport:</strong> Rugby &middot; <strong>Team:</strong> Test FC</p>
            <p style="font-size: 13px; color: #475569; margin: 20px 0 8px;">You've captured one dimension of baseline data. The SCAT6 protocol covers symptom evaluation, cognitive screening, neurological exam, balance testing, and more. Are you confident interpreting all 7 domains?</p>
            <div style="background: #f0f9ff; border: 2px solid #5b9aa6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-weight: 700; font-size: 16px; color: #1e293b;">Free: Master the Full SCAT6 Protocol</p>
              <p style="margin: 0 0 20px; font-size: 13px; color: #475569; line-height: 1.5;">Learn how to properly administer and interpret every SCAT6 section. Fillable forms, clinical toolkit &amp; certificate included. <strong>Completely free.</strong></p>
              <a href="${baseUrl}/scat-mastery" style="display: inline-block; padding: 14px 32px; background-color: #5b9aa6; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Get Free Course &rarr;</a>
              <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">Want deeper training? Our <a href="${baseUrl}/pricing" style="color: #1e6b73; font-weight: 600; text-decoration: underline; display: inline; background: none; padding: 0; border-radius: 0; border: none;">full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hour course</a> covers VOMS, BESS, return-to-play &amp; more.</p>
            </div>
          </div>
          <div class="footer">
            <p>ConcussionPro — Concussion Education Australia</p>
          </div>
        </div>
      </body>
    </html>`
}

// Magic link email HTML (from lib/email.ts)
function magicLinkEmail(baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 24px; font-weight: 700; }
          .content { padding: 32px 24px; }
          .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>ConcussionPro</h1></div>
          <div class="content">
            <h2 style="margin-top: 0;">Login to Your Course</h2>
            <p>Click the button below to access your ConcussionPro dashboard:</p>
            <center>
              <a href="${baseUrl}/login" style="display: inline-block; padding: 16px 32px; background-color: #5b9aa6; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0;">Access Your Course &rarr;</a>
            </center>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
              This link expires in <strong>24 hours</strong> for security.
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">If you didn't request this login link, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>Concussion Education Australia</p><p>Questions? Reply to this email</p></div>
        </div>
      </body>
    </html>`
}

// Welcome email HTML (from lib/email.ts)
function welcomeEmail(baseUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 40px 24px; text-align: center; }
          .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
          .content { padding: 32px 24px; }
          .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to ConcussionPro</h1></div>
          <div class="content">
            <h2 style="margin-top: 0;">Hi Zac,</h2>
            <p>Your course is ready. Here's how to get started.</p>
            <h3>Start earning CPD hours today:</h3>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; align-items: start; margin: 12px 0;"><div style="background: #5b9aa6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0;">1</div><div><strong>Click below to log in</strong><br><span style="color: #64748b; font-size: 14px;">No password — just click the secure link</span></div></div>
              <div style="display: flex; align-items: start; margin: 12px 0;"><div style="background: #5b9aa6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0;">2</div><div><strong>Start Module 1: What is a Concussion?</strong><br><span style="color: #64748b; font-size: 14px;">Concussion pathophysiology (~45 min)</span></div></div>
              <div style="display: flex; align-items: start; margin: 12px 0;"><div style="background: #5b9aa6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0;">3</div><div><strong>Download the Clinical Toolkit</strong><br><span style="color: #64748b; font-size: 14px;">Referral templates, RTP protocols, clearance letters</span></div></div>
            </div>
            <center><a href="${baseUrl}/login" style="display: inline-block; padding: 16px 32px; background-color: #5b9aa6; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0;">Open Your Course &rarr;</a></center>
            <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #475569;">If you have questions, reply to this email.</p>
            <p style="color: #64748b;">— Zac Lewis<br><em style="font-size: 14px;">Osteopath · Founder, Concussion Education Australia</em></p>
          </div>
          <div class="footer"><p><strong>Concussion Education Australia</strong></p><p>zac@concussion-education-australia.com</p></div>
        </div>
      </body>
    </html>`
}

/**
 * POST /api/admin/test-emails
 * Sends every email template to a test address for visual inspection.
 * Body: { to: "email@example.com" }
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const { to } = await request.json()
  if (!to) {
    return NextResponse.json({ error: 'Missing "to" email address' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const loginLink = `${baseUrl}/login`
  const upgradeLink = `${baseUrl}/pricing`
  const name = 'Zac'

  // Build all emails
  const emails: Array<{ subject: string; html: string }> = [
    // 1. Magic Link
    { subject: '[TEST 1/18] Magic Link Login', html: magicLinkEmail(baseUrl) },
    // 2. Welcome (post-purchase)
    { subject: '[TEST 2/18] Welcome — Post Purchase', html: welcomeEmail(baseUrl) },
    // 3-5. Post Purchase Sequence (3 emails)
    ...POST_PURCHASE_SEQUENCE.map((e, i) => ({
      subject: `[TEST ${3 + i}/18] Post-Purchase Day ${e.day}: ${e.subject}`,
      html: e.template(name, loginLink),
    })),
    // 6-8. Abandoned Checkout (3 emails)
    ...ABANDONED_CHECKOUT_SEQUENCE.map((e, i) => ({
      subject: `[TEST ${6 + i}/18] Abandoned ${e.hoursAfter}h: ${e.subject}`,
      html: e.template(name),
    })),
    // 9-10. Pre-Workshop (2 emails)
    ...PRE_WORKSHOP_SEQUENCE.map((e, i) => ({
      subject: `[TEST ${9 + i}/18] Workshop -${e.daysBefore}d: ${e.subject}`,
      html: e.template(name, 'Byron Bay', 'March 28, 2026', loginLink),
    })),
    // 11-16. SCAT6 Mastery Sequence (6 emails)
    ...SCAT_MASTERY_SEQUENCE.map((e, i) => ({
      subject: `[TEST ${11 + i}/18] SCAT Day ${e.day}: ${e.subject}`,
      html: e.template(name, i < 3 ? loginLink : upgradeLink),
    })),
    // 17. Preseason Registration Confirmation
    { subject: '[TEST 17/18] Preseason Clinic Registration', html: preseasonRegisterEmail(baseUrl) },
    // 18. Preseason Baseline Submission
    { subject: '[TEST 18/18] Preseason Baseline Report', html: preseasonSubmitEmail(baseUrl) },
  ]

  const results: Array<{ subject: string; success: boolean; error?: string }> = []

  // Send with 500ms delay between each to avoid rate limits
  for (const email of emails) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ConcussionPro <noreply@concussion-education-australia.com>',
          to: [to],
          subject: email.subject,
          html: email.html,
        }),
      })

      if (res.ok) {
        results.push({ subject: email.subject, success: true })
      } else {
        const err = await res.text()
        results.push({ subject: email.subject, success: false, error: err })
      }
    } catch (err) {
      results.push({ subject: email.subject, success: false, error: String(err) })
    }

    await new Promise(r => setTimeout(r, 100))
  }

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success)

  return NextResponse.json({
    success: true,
    message: `Sent ${sent}/${emails.length} emails to ${to}`,
    results,
    failed: failed.length > 0 ? failed : undefined,
  })
}
