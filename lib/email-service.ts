// Email service for sending login credentials
// Uses Resend.com (free tier: 3,000 emails/month, 100/day)

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - email not sent')
    console.log('📧 Would have sent email to:', options.to)
    console.log('Subject:', options.subject)
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ConcussionPro <noreply@concussion-education-australia.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send failed:', error)
      return false
    }

    const result = await response.json()
    console.log('✅ Email sent successfully:', result.id)
    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

// Send welcome email with magic link
export async function sendWelcomeEmail(data: {
  email: string
  name: string
  magicLink: string
  accessLevel: 'online-only' | 'full-course'
}) {
  const courseType = data.accessLevel === 'full-course'
    ? 'Complete Course (8 online modules + in-person workshop)'
    : 'Online Only (8 modules)'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ConcussionPro</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #5b9aa6 0%, #6b9da8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to ConcussionPro!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">

    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.name},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Thanks for enrolling in <strong>${courseType}</strong>! Your account is ready and you can start learning immediately.
    </p>

    <div style="background: white; border: 2px solid #5b9aa6; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">Click the button below to access your portal:</p>
      <a href="${data.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #5b9aa6 0%, #6b9da8 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Access Your Portal →
      </a>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #999;">This link expires in 24 hours</p>
    </div>

    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>What's Inside:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #1e3a8a;">
        <li>8 comprehensive online modules</li>
        <li>Clinical Toolkit with downloadable resources</li>
        <li>Reference Repository (145 research articles)</li>
        <li>Interactive quizzes and assessments</li>
        ${data.accessLevel === 'full-course' ? '<li>Full-day in-person workshop (choose your date)</li>' : '<li>Upgrade anytime for just $693 more</li>'}
      </ul>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 25px;">
      If you have any questions, reply to this email or contact us at
      <a href="mailto:zac@concussion-education-australia.com" style="color: #5b9aa6;">zac@concussion-education-australia.com</a>
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Cheers,<br>
      <strong>The ConcussionPro Team</strong>
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      ConcussionPro - AHPRA Accredited Concussion Management Training
    </p>
  </div>

</body>
</html>
  `

  return sendEmail({
    to: data.email,
    subject: '🎉 Welcome to ConcussionPro - Your Account is Ready!',
    html,
  })
}

// Strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
