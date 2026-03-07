import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendEmail } from '@/lib/email'
import { CONFIG } from '@/lib/config'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/1/O/0 confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { clinicName, contactName, email } = await request.json()

    // Validate
    if (!clinicName || !contactName || !email) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Rate limit: 3 registrations per email per day
    const today = new Date().toISOString().slice(0, 10)
    const rateKey = `rate:preseason:${email.toLowerCase()}:${today}`
    const count = await kv.get<number>(rateKey) || 0

    if (count >= 3) {
      return NextResponse.json(
        { error: 'Maximum registrations reached for today. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Generate unique code (check for collisions)
    let code = generateCode()
    let attempts = 0
    while (await kv.exists(`clinic:${code}`) && attempts < 10) {
      code = generateCode()
      attempts++
    }

    // Store clinic data
    await kv.set(`clinic:${code}`, {
      clinicName,
      contactName,
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    })

    // Increment rate limit counter (expires after 24h)
    await kv.set(rateKey, count + 1, { ex: 86400 })

    // Build athlete link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    const athleteLink = `${baseUrl}/preseason/b/${code}`

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Your Pre-Season Baseline Testing Link — ConcussionPro',
      html: `
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
              .cta-box { background: linear-gradient(135deg, #f0f9ff, #ecfdf5); border: 1px solid #5b9aa6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
              .cta-box a { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #64a8b0, #5b9aa6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; }
              .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pre-Season Baseline Testing</h1>
              </div>
              <div class="content">
                <p>Hi ${contactName},</p>
                <p><strong>${clinicName}</strong> is now registered for pre-season baseline testing. Share the link below with your sports clubs — athletes can self-administer the SCAT6 baseline remotely.</p>

                <div class="link-box">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Your unique athlete link:</p>
                  <a href="${athleteLink}">${athleteLink}</a>
                  <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">Clinic code: <span class="code-display">${code}</span></p>
                </div>

                <div class="steps">
                  <p style="font-weight: 700; margin-top: 0;">How it works:</p>
                  <div class="step">
                    <div class="step-num">1</div>
                    <div><strong>Share the link</strong> with sports clubs, teams, and athletes</div>
                  </div>
                  <div class="step">
                    <div class="step-num">2</div>
                    <div><strong>Athletes complete</strong> the self-administered SCAT6 baseline (symptoms, memory, concentration)</div>
                  </div>
                  <div class="step">
                    <div class="step-num">3</div>
                    <div><strong>You receive a PDF report</strong> by email — no data stored on our servers</div>
                  </div>
                </div>

                <p style="font-size: 14px; color: #475569;">Each completed baseline gives you pre-injury data for comparison if a concussion occurs. The athlete's report is emailed directly to <strong>${email}</strong>.</p>

                <div class="cta-box">
                  <p style="margin: 0 0 8px; font-weight: 700;">Free: SCAT6/SCOAT6 Mastery Course</p>
                  <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">Learn how to properly administer and interpret every SCAT6 &amp; SCOAT6 section. Includes fillable forms, clinical toolkit, and certificate. <strong>2 AHPRA CPD points — completely free.</strong></p>
                  <a href="${baseUrl}/scat-mastery">Get Free Course →</a>
                  <p style="margin: 12px 0 0; font-size: 12px; color: #64748b;">Want deeper training? Our <a href="${CONFIG.SHOP_URL}" style="color: #5b9aa6;">full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD point course</a> covers VOMS, BESS, return-to-play &amp; more.</p>
                </div>
              </div>
              <div class="footer">
                <p>ConcussionPro — Concussion Education Australia</p>
                <p>${CONFIG.CONTACT_EMAIL}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, code, athleteLink })
  } catch (error) {
    console.error('Preseason registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
