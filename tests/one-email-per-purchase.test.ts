import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

/**
 * Zac 2026-10-06: "4 emails is insane. it is spam" → "one email. login and
 * invoice and any other immediately pertinent info a new purchase needs", and
 * later: "make sure you cleaned the resend email into one email otherwise they
 * all go to spam".
 *
 * Volume is a deliverability problem, not just an annoyance: two system emails
 * to the same address in the same second is the pattern bulk filters score
 * hardest. A CRM buyer on 2026-10-06 09:04 AEDT received two, 4 seconds apart
 * — 70 minutes before be5194e9 landed. These tests exist so that cannot
 * silently come back.
 */
const webhook = readFileSync('app/api/webhooks/stripe/route.ts', 'utf8')
const bundle = readFileSync('lib/sst-trainer/bundle.ts', 'utf8')

describe('a purchase sends the buyer exactly one email', () => {
  it('neither course path asks the platform provisioner to send its own welcome', () => {
    const calls = webhook
      .split('\n')
      .filter((l) => l.includes('provisionPlatformBestEffort(') && !l.includes('async function'))
    // one CCM, one CRM (the 4th positional arg block ends `, true, false)`)
    expect(calls.length).toBeGreaterThanOrEqual(2)
    for (const c of calls) {
      expect(c, `provisioning call still sends a second email: ${c.trim()}`).toContain('false)')
    }
  })

  it('the provisioner honours that flag and returns before sending', () => {
    expect(bundle).toContain('if (!sendWelcome) {')
    expect(bundle).toContain('welcome email suppressed')
    // the suppression must come BEFORE the send, not after
    expect(bundle.indexOf('if (!sendWelcome) {')).toBeLessThan(bundle.indexOf('Your clinical platform is ready'))
  })

  it('the one email carries the clinic code, so nothing else has to', () => {
    // CRM welcome body
    expect(webhook).toContain('Your clinic code: <strong')
    // CCM welcome is sent through the shared template with the code folded in
    expect(webhook).toContain('sendPostPurchaseLoginEmail({')
  })

  it('the invoice is an ATTACHMENT on that email, never a second send', () => {
    for (const marker of ['...(invoiceAttachment ? { attachments: [invoiceAttachment] } : {})',
                          '...(crmInvoice ? { attachments: [crmInvoice] } : {})']) {
      expect(webhook, `invoice not attached: ${marker}`).toContain(marker)
    }
  })

  it('the extra sends on a purchase go to the OWNER, not the buyer', () => {
    // Failure alerts and sale notifications are owner-facing by subject.
    expect(webhook).toContain('ACTION REQUIRED: CRM welcome email failed')
    expect(webhook).toContain('New sale: Concussion Rehab Mastery')
  })
})
