import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

/**
 * Zac 2026-10-06: "4 emails is insane. it is spam… one email. login and
 * invoice and any other immediately pertinent info a new purchase needs."
 *
 * A course purchase sends ONE email. It carries the login link, the tax
 * invoice and the clinic code. The platform-provisioning helper must not fire
 * its own welcome on a purchase path.
 */
describe('one email per purchase', () => {
  const route = readFileSync('app/api/webhooks/stripe/route.ts', 'utf8')
  const bundle = readFileSync('lib/sst-trainer/bundle.ts', 'utf8')
  const client = readFileSync('lib/resend-client.ts', 'utf8')

  it('bundle provisioning can be told not to send its own welcome', () => {
    expect(bundle).toContain('sendWelcome = true')
    expect(bundle.indexOf('if (!sendWelcome)')).toBeLessThan(bundle.indexOf('subject: `Your clinical platform is ready'))
  })

  it('both purchase paths suppress the second email', () => {
    for (const call of [/provisionPlatformBestEffort\(customerEmail, customerName, `CCM [^)]*\)/, /provisionPlatformBestEffort\(customerEmail, customerName, `CRM [^)]*\)/]) {
      const m = route.match(call)
      expect(m, String(call)).toBeTruthy()
      expect(m![0].trimEnd().endsWith('false)')).toBe(true)
    }
  })

  it('the one welcome carries login, invoice and clinic code', () => {
    expect(client).toContain('clinicCode?: string | null')
    expect(client).toContain('opts.clinicCode ?')
    expect(client).toContain('Your clinic code:')
    expect(client).toContain('attachments')
    expect(route).toContain('clinicCode: ccmClinicCode')
  })

  it('a standalone SST signup still gets its welcome (default true)', () => {
    expect(bundle).toMatch(/sendWelcome = true/)
  })
})
