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
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
    })
    console.log('Email body:', options.html)
    return true
  }

  // In production, call your API endpoint
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    return response.ok
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
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com')
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
              <h1>🧠 ConcussionPro</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Login to Your Course</h2>
              <p>Click the button below to access your ConcussionPro dashboard:</p>

              <center>
                <a href="${loginUrl}" class="button">
                  Access Your Course →
                </a>
              </center>

              <p style="margin-top: 24px;">Or enter this code on the login page:</p>
              <div class="code">${token}</div>

              <div class="warning">
                ⏱️ This link expires in <strong>15 minutes</strong> for security.
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
 * Send welcome email after successful enrollment
 */
export async function sendWelcomeEmail(email: string, name: string, origin?: string): Promise<boolean> {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com')

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to ConcussionPro - Your Course is Ready!',
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
              <h1>🎉 Welcome to ConcussionPro!</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0;">Hi ${name},</h2>
              <p>Your enrollment is confirmed! You now have lifetime access to:</p>

              <div class="highlight">
                <strong>✓ 8 comprehensive online modules (8 CPD hours)</strong><br>
                <strong>✓ Full-day practical workshop (6 CPD hours)</strong><br>
                <strong>✓ 14 total AHPRA CPD hours</strong><br>
                <strong>✓ All downloadable resources and templates</strong>
              </div>

              <h3>Your Next Steps:</h3>
              <div class="checklist">
                <div class="checklist-item">
                  <div class="number">1</div>
                  <div>
                    <strong>Access your dashboard</strong><br>
                    <span style="color: #64748b; font-size: 14px;">Start with Module 1: What is a Concussion?</span>
                  </div>
                </div>
                <div class="checklist-item">
                  <div class="number">2</div>
                  <div>
                    <strong>Choose your workshop date</strong><br>
                    <span style="color: #64748b; font-size: 14px;">Melbourne (Feb 7) · Sydney (Mar 7) · Byron Bay (Mar 28)</span>
                  </div>
                </div>
                <div class="checklist-item">
                  <div class="number">3</div>
                  <div>
                    <strong>Complete all 8 modules before your workshop</strong><br>
                    <span style="color: #64748b; font-size: 14px;">The practical training builds on the online content</span>
                  </div>
                </div>
              </div>

              <center>
                <a href="${baseUrl}/login" class="button">
                  Access Your Course →
                </a>
              </center>

              <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <strong>Questions?</strong> Just reply to this email - I read every message personally.
              </p>

              <p style="color: #64748b;">
                Looking forward to seeing you at the workshop!<br>
                <br>
                - Zac<br>
                <em style="font-size: 14px;">Founder, Concussion Education Australia</em>
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
