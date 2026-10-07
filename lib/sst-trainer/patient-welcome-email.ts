import { escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

/**
 * The ONE email a patient receives from the platform.
 *
 * Zac 2026-10-06, mid-clinic: "auto email them everything from the platform…
 * they can scan qr codes or click links from the email… they'll also need
 * bluetooth broadcasting instructions if they don't have an apple watch."
 *
 * It carries everything they need and asks for nothing back:
 *  - the per-patient join link (/j/CLINIC?p=PATIENT), which is device-smart:
 *    iPhone → the App Store listing, everything else → straight into the web
 *    app. Because it carries ?p=, the app links to their record and never asks
 *    them to type a code or fill in a form.
 *  - the same link as a QR, so a patient reading this on a laptop can scan it
 *    with the phone they will actually train on.
 *  - a prompt to switch heart-rate broadcasting on. The per-brand steps are
 *    NOT duplicated here: SstConnectWizard already holds them and is the
 *    single source of truth, so the email points at it rather than drifting
 *    out of date (Zac 2026-10-06: "its probably wired into the app/browser
 *    page"). This is the step that silently breaks a session — a watch that
 *    records internally and broadcasts nothing gives a working screen with no
 *    live heart rate.
 *  - their prescribed band and the stop rule, when a threshold has been set.
 *
 * ONE email per event (see feedback_one_email_per_event): nothing else is sent
 * to a patient, ever. No marketing, no sequence, no follow-ups.
 *
 * The QR is rendered by a Google Charts-style image endpoint rather than an
 * inline SVG because Gmail and Outlook both strip inline SVG; a hosted PNG is
 * the only QR that survives every client.
 */
export interface PatientWelcomeArgs {
  clinicName: string
  patientName?: string | null
  joinUrl: string
  /** Prescribed training band, when a graded test has already set it. */
  bandLow?: number | null
  bandHigh?: number | null
  hrt?: number | null
  /** Clinician's reply-to name, shown so the patient knows who sent it. */
  practitioner?: string | null
  appStoreUrl?: string
}

export function patientWelcomeSubject(clinicName: string): string {
  return `Your recovery training — ${clinicName}`
}

export function buildPatientWelcomeEmail(a: PatientWelcomeArgs): string {
  const name = a.patientName?.trim().split(' ')[0] || null
  const qrSrc = `${CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'}/api/qr?d=${encodeURIComponent(a.joinUrl)}&s=240`
  const appUrl = a.appStoreUrl || CONFIG.SST_APP_STORE_URL
  const hasBand = typeof a.bandLow === 'number' && typeof a.bandHigh === 'number'

  return `<!doctype html><html><body style="margin:0;background:#f6f9f9;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px 22px;color:#16243f;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0d7377;">SST Trainer · recovery training</p>
    <h1 style="margin:6px 0 14px;font-size:22px;line-height:1.25;color:#0a0f14;">${name ? `${escapeHtml(name)}, your training is ready` : 'Your training is ready'}</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#36454d;">
      ${escapeHtml(a.clinicName)} has set up your guided exercise programme. Open the link below on the phone you'll train with — there is nothing to fill in and no code to type. You're already linked to your record.
    </p>

    <p style="margin:0 0 10px;text-align:center;">
      <a href="${a.joinUrl}" style="display:inline-block;padding:14px 28px;background:#0d7377;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Open my training</a>
    </p>
    <p style="margin:0 0 22px;text-align:center;font-size:12.5px;color:#6b7a82;">On a computer? Scan this with your phone instead:</p>
    <p style="margin:0 0 22px;text-align:center;">
      <img src="${qrSrc}" alt="Scan to open your training" width="170" height="170" style="display:inline-block;border:1px solid #d3dedc;border-radius:12px;background:#fff;padding:8px;">
    </p>

    ${hasBand ? `
    <div style="margin:0 0 22px;padding:16px 18px;border:1px solid #99f6e4;border-radius:12px;background:#f0fdfa;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;">Your prescription</p>
      <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0a0f14;">Train at ${a.bandLow}–${a.bandHigh} bpm${a.hrt ? ` <span style="font-size:13px;font-weight:500;color:#4a5568;">(from your measured threshold of ${a.hrt} bpm)</span>` : ''}</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#134e4a;">About 20 minutes, most days. <strong>Stop the session if your symptoms rise 2 points or more</strong> above how you felt before you started. The app watches this for you and will stop it automatically.</p>
    </div>` : ''}

    <div style="margin:0 0 22px;padding:16px 18px;border:1px solid #d3dedc;border-radius:12px;background:#fff;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0d7377;">Your heart-rate monitor</p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#36454d;">
        The app needs to see your heart rate <strong>live</strong>. Most watches record it internally and broadcast nothing until you switch broadcasting on — so do that before your first session, or the app will show a working screen with no heart rate.
      </p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#36454d;">
        The app walks you through it for your exact device — Garmin, Polar, WHOOP, Coros, Suunto, Amazfit and chest straps all have their own step. Tap <strong>Connect a monitor</strong> when you open it.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#6b7a82;">Apple Watch: use the SST Trainer watch app, nothing to switch on. Fitbit and Samsung don't broadcast to other apps — bring any chest strap, or type your readings in. No monitor at all? Everything still works; you type each reading when the app asks.</p>
    </div>

    <div style="margin:0 0 22px;padding:16px 18px;border:1px solid #fed7aa;border-radius:12px;background:#fff7ed;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#c2410c;">If you have an iPhone</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#7c2d12;">
        iPhones can't connect to a heart-rate monitor through a web browser — that's an Apple limitation, not ours. Install the free app first and your monitor will pair normally:
        <a href="${appUrl}" style="color:#0d7377;font-weight:600;">get SST Trainer</a>. Android phones work straight from the link above.
      </p>
    </div>

    <p style="margin:0 0 6px;font-size:14px;line-height:1.55;color:#36454d;">Each session is sent back to ${escapeHtml(a.clinicName)} automatically, so your clinician can see how you're going between appointments.</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#36454d;">If anything hurts, feels wrong, or you're unsure — stop, and contact your clinician.</p>

    <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#6b7a82;">
      ${a.practitioner ? `${escapeHtml(a.practitioner)}<br>` : ''}${escapeHtml(a.clinicName)}
    </div>
    <p style="margin:14px 0 0;font-size:11.5px;line-height:1.5;color:#9aa3ad;">
      You're receiving this once because your clinician set up your training. It isn't a mailing list and there's nothing to unsubscribe from.
    </p>
  </div>
</body></html>`
}
