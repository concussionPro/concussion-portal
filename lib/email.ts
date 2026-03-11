// Email service integration using Resend
// Handles magic link emails and welcome emails

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend API
 * In production, this will be called from a serverless function
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('Email would be sent:', {
      to: options.to,
      subject: options.subject,
    })
    console.log('Email body:', options.html)
    return true
  }

  // In production, call Resend API directly
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 'YOUR_RESEND_API_KEY_HERE') {
      console.error('RESEND_API_KEY not configured')
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ConcussionPro <noreply@concussion-education-australia.com>',
        reply_to: 'zac@concussion-education-australia.com',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send magic link login email
 */
export async function sendMagicLinkEmail(email: string, token: string, origin?: string): Promise<boolean> {
  // Use provided origin or try to get from window (client-side) or use production URL
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com')
  const loginUrl = `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

  return sendEmail({
    to: email,
    subject: 'Your ConcussionPro Login Link',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ConcussionPro Login</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 32px 24px;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              color: white;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              margin: 24px 0;
              text-align: center;
            }
            .code {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 4px;
              text-align: center;
              color: #5b9aa6;
              margin: 16px 0;
            }
            .footer {
              padding: 24px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              border-radius: 4px;
              margin: 16px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ConcussionPro</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Login to Your Course</h2>
              <p>Click the button below to access your ConcussionPro dashboard:</p>

              <center>
                <a href="${loginUrl}&utm_source=email&utm_medium=email&utm_campaign=magic_link" class="button">
                  Access Your Course →
                </a>
              </center>

              <div class="warning" style="margin-top: 24px;">
                This link expires in <strong>24 hours</strong> for security.
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                If you didn't request this login link, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>Concussion Education Australia</p>
              <p>Questions? Reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

/**
 * Send abandoned checkout recovery email
 */
export async function sendAbandonedCheckoutEmail(email: string, baseUrl: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'You left something behind — your course is still waiting',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 24px; font-weight: 700; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ConcussionPro</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Still thinking it over?</h2>
              <p>We noticed you started enrolling but didn't finish. No worries — your spot is still available.</p>
              <p>Here's what's waiting for you:</p>
              <ul style="padding-left: 20px; color: #475569;">
                <li>8 evidence-based online modules (8 AHPRA CPD points)</li>
                <li>Lifetime access — learn at your own pace</li>
                <li>Clinical Toolkit, Reference Repository &amp; certificate</li>
              </ul>
              <center>
                <a href="${baseUrl}/pricing" class="button">Complete Your Enrolment &rarr;</a>
              </center>
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                Have questions? Just reply to this email — Zac reads every message.
              </p>
              <p style="color: #64748b;">
                — Zac Lewis<br>
                <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) · Founder, Concussion Education Australia</em>
              </p>
            </div>
            <div class="footer">
              <p>Concussion Education Australia</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Send welcome email after successful enrollment
 */
export async function sendWelcomeEmail(email: string, name: string, origin?: string): Promise<boolean> {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com')

  return sendEmail({
    to: email,
    subject: 'Welcome to ConcussionPro — your course is ready',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ConcussionPro</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              padding: 40px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 32px 24px;
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%);
              color: white;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              margin: 24px 0;
            }
            .checklist {
              background: #f1f5f9;
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            .checklist-item {
              display: flex;
              align-items: start;
              margin: 12px 0;
            }
            .checklist-item .number {
              background: #5b9aa6;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              margin-right: 12px;
              flex-shrink: 0;
            }
            .footer {
              padding: 24px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .highlight {
              background: #dbeafe;
              padding: 16px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ConcussionPro</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${escapeHtml(name.split(' ')[0])},</h2>
              <p>Your course is ready. Here's how to get started.</p>

              <h3>Start earning CPD points today:</h3>
              <div class="checklist">
                <div class="checklist-item">
                  <div class="number">1</div>
                  <div>
                    <strong>Click below to log in</strong><br>
                    <span style="color: #64748b; font-size: 14px;">No password — just click the secure link</span>
                  </div>
                </div>
                <div class="checklist-item">
                  <div class="number">2</div>
                  <div>
                    <strong>Start Module 1: What is a Concussion?</strong><br>
                    <span style="color: #64748b; font-size: 14px;">Concussion pathophysiology and the neurometabolic cascade (~45 min)</span>
                  </div>
                </div>
                <div class="checklist-item">
                  <div class="number">3</div>
                  <div>
                    <strong>Download the Clinical Toolkit</strong><br>
                    <span style="color: #64748b; font-size: 14px;">Referral templates, RTP protocols, and clearance letters</span>
                  </div>
                </div>
              </div>

              <center>
                <a href="${baseUrl}/login?utm_source=email&utm_medium=email&utm_campaign=welcome" class="button">
                  Open Your Course →
                </a>
              </center>

              <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #475569;">
                If you have questions as you work through the modules, reply to this email.
              </p>

              <p style="color: #64748b;">
                — Zac Lewis<br>
                <em style="font-size: 14px;">Osteopath (B.Clin.Sci., M.Ost.Med) · Founder, Concussion Education Australia</em>
              </p>
            </div>
            <div class="footer">
              <p><strong>Concussion Education Australia</strong></p>
              <p>zac@concussion-education-australia.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
