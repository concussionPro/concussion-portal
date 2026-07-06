import { CONFIG } from '@/lib/config'
import { escapeHtml } from '@/lib/resend-client'

// ─────────────────────────────────────────────────────────────────────────────
// SST-branded clinic welcome — the self-serve provisioning email. Honest
// claims only: describes what the tool actually does (measured graded test →
// training band → sessions sync to the hub, live in-session view). No outcome
// claims.
// ─────────────────────────────────────────────────────────────────────────────
export function buildWelcomeEmail(args: {
  contactName: string
  clinicName: string
  code: string
  viewKey: string
  /** Magic-link login into the CEA portal (Clinical Testing unlocked). When
   *  present, this is the PRIMARY CTA — the clinic works inside the portal,
   *  not a standalone keyed hub. */
  loginUrl?: string | null
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
  const firstName = escapeHtml(args.contactName.split(' ')[0])
  const clinicName = escapeHtml(args.clinicName)
  const code = escapeHtml(args.code)
  const loginUrl = args.loginUrl ? escapeHtml(args.loginUrl) : null
  const patientUrl = `${baseUrl}/sst-trainer?clinic=${encodeURIComponent(args.code)}`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SST Trainer — clinic setup</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f7fafa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .header { background: #16243f; padding: 32px 24px; text-align: center; }
      .header p.kicker { margin: 0 0 4px; color: #7fd4c8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; }
      .header h1 { margin: 0; color: white; font-size: 22px; font-weight: 700; }
      .content { padding: 32px 24px; }
      .code-box { background: #f0fdfa; border: 2px solid #0d9488; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
      .code-display { font-family: 'Courier New', monospace; font-size: 30px; font-weight: 800; color: #0d9488; letter-spacing: 6px; margin: 4px 0; }
      .link-block { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 14px 0; }
      .link-block p.label { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; }
      .link-block a { color: #0d9488; font-size: 14px; font-weight: 600; word-break: break-all; }
      .link-block p.note { margin: 6px 0 0; font-size: 12.5px; color: #64748b; }
      .private { background: #fff7ed; border-color: #fed7aa; }
      .private p.note { color: #9a3412; font-weight: 600; }
      .steps { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; }
      .step { display: flex; align-items: flex-start; margin: 12px 0; }
      .step-num { background: #16243f; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0; font-size: 14px; }
      .founding { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 18px; font-size: 13.5px; color: #475569; }
      .footer { padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="kicker">SST Trainer</p>
        <h1>${clinicName} is set up</h1>
      </div>
      <div class="content">
        <p>Hi ${firstName},</p>
        <p><strong>${clinicName}</strong> is now registered on the SST Trainer — sub-symptom-threshold exercise rehab your patients run on their own phone, with every session syncing back to you.</p>

        <div class="code-box">
          <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">Your clinic code</p>
          <p class="code-display">${code}</p>
          <p style="margin: 4px 0 0; font-size: 12.5px; color: #64748b;">Patients enter this code in the app — it links their sessions to your clinic.</p>
        </div>

        ${loginUrl ? `<div style="text-align:center;margin:24px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;font-size:15px;padding:14px 30px;border-radius:12px;text-decoration:none">Log in to your portal</a>
          <p style="margin:10px 0 0;font-size:12.5px;color:#64748b">Your Clinical Testing suite — patient list, live sessions, and one-click reports — lives in your CEA portal. This link signs you in (valid 7 days). Everything else in the portal stays locked unless you enrol in the course.</p>
        </div>` : ''}

        <div class="link-block">
          <p class="label">Patient app link</p>
          <a href="${patientUrl}">${patientUrl}</a>
          <p class="note">This is the link you give patients — text or email it, or have them type it in the clinic. It carries your clinic code, so their graded test and training sessions flow straight to your hub.</p>
        </div>

        <div class="steps">
          <p style="font-weight: 700; margin-top: 0;">Getting started:</p>
          <div class="step">
            <div class="step-num">1</div>
            <div><strong>Open your Clinical Hub</strong> using the private link above and bookmark it — it's where every patient's threshold, training band and session history lives.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div><strong>Give a patient the app link</strong> — they open it on their phone, add it to their home screen, enter your clinic code and their name, and pair a heart-rate source (Bluetooth monitor or phone camera).</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div><strong>Watch their first session live</strong> — the graded test measures their heart-rate threshold, sets their sub-symptom training band, and appears in your hub in real time while they're on the bike or treadmill.</div>
          </div>
        </div>

        <p style="font-size: 14px; color: #475569;">The graded test is clinician-distributed — patients can only reach it through a registered clinic code like yours, so you stay in control of who runs it and when.</p>

        <div class="founding">
          <p style="margin: 0;"><strong>Founding clinic terms:</strong> Free during the founding period. When paid plans launch, founding clinics lock A$99/month for life.</p>
        </div>

        <p style="font-size: 14px; color: #475569; margin-top: 20px;">Questions, or want a hand onboarding your first patient? Just hit reply — I read every message.</p>

        <p style="margin-top: 24px;">Zac Lewis<br><span style="color: #64748b; font-size: 13.5px;">Osteopath · Concussion Education Australia</span></p>
      </div>
      <div class="footer">
        <p>Concussion Education Australia</p>
        <p>${CONFIG.CONTACT_EMAIL}</p>
      </div>
    </div>
  </body>
</html>`
}
