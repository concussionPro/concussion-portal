import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * COMPLETION EVIDENCE DOES NOT EXPIRE (owner decision 2026-08-06).
 *
 * Certificates carried a 12-month `expires_at`, so /verify/:id rendered
 * "✗ Expired — re-certification required" on a genuine certificate 12 months
 * and a day after issue — while lib/certificate.ts prints NO expiry on the PDF
 * and its footer tells the holder to retain it for at least 5 years for audit,
 * with the /verify URL printed right there. An AHPRA auditor following our own
 * printed link at 18 months saw a red cross on a real document.
 *
 * The invariants pinned here:
 *   - REVOCATION still invalidates (refund / chargeback) and still reads as
 *     "revoked", never "expired" and never a silent 404;
 *   - AGE never invalidates, in EITHER certificate store;
 *   - no surface tells a holder their certificate has expired or needs
 *     re-certification.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('course_certificates store (lib/course-certificates.ts)', () => {
  const src = read('lib/course-certificates.ts')

  it('has no validity window constant left', () => {
    expect(src).not.toMatch(/CERT_VALIDITY_MS/)
    expect(src).not.toMatch(/365 \* 24 \* 60 \* 60 \* 1000/)
  })

  it('invalidReason can only ever be revocation', () => {
    expect(src).toContain("invalidReason: 'revoked' | null")
    // The old ternary compared Date.now() against the expiry to decide validity.
    expect(src).not.toMatch(/Date\.now\(\)\s*>=\s*expires/)
  })

  it('derives isValid solely from revocation', () => {
    const line = src.match(/const invalidReason: [^\n]+\n/)?.[0] ?? ''
    expect(line).toContain('revokedAt ?')
    expect(line).not.toContain('expires')
  })

  it('no longer writes an expiry, and clears any legacy one on re-issue', () => {
    // INSERT column list must not carry expires_at any more.
    const insert = src.match(/INSERT INTO course_certificates\s*\n\s*\(([^)]*)\)/)?.[1] ?? ''
    expect(insert).not.toContain('expires_at')
    expect(src).toContain('expires_at = NULL')
  })

  it('still revokes on refund/chargeback and never deletes the row', () => {
    expect(src).toContain('export async function revokeCourseCertificates')
    expect(src).toMatch(/UPDATE course_certificates\s*\n\s*SET revoked_at = COALESCE\(revoked_at, NOW\(\)\)/)
    expect(src).not.toMatch(/DELETE FROM course_certificates/)
  })
})

describe('ai-course certificate store (lib/ai-course/certificate.ts)', () => {
  const src = read('lib/ai-course/certificate.ts')

  it('no longer computes validity from an expiry timestamp', () => {
    expect(src).not.toMatch(/CERT_VALIDITY_MS/)
    expect(src).not.toMatch(/Date\.now\(\) < expiresAt/)
  })

  it('does not expose expiresAt on the record any more', () => {
    const iface = src.match(/export interface CertificateRecord \{[^}]*\}/)?.[0] ?? ''
    expect(iface).not.toContain('expiresAt')
    expect(iface).toContain('isValid')
  })
})

describe('public verification surfaces', () => {
  it('/verify/:id never renders an expiry or a re-certification demand', () => {
    const src = read('app/verify/[id]/page.tsx')
    expect(src).not.toContain('re-certification required')
    expect(src).not.toContain('Expires')
    expect(src).not.toContain('expiresDate')
    // Revocation must still be reported honestly.
    expect(src).toContain('Revoked')
    expect(src).toContain('refunded or charged back')
  })

  it('/verify/:id surfaces offering accreditation as CONTEXT, not invalidity', () => {
    const src = read('app/verify/[id]/page.tsx')
    expect(src).toMatch(/as at the date of issue/)
  })

  it('the ai-course verify page drops its expiry row too', () => {
    const src = read('app/courses/ai-in-clinical-practice/verify/[id]/page.tsx')
    expect(src).not.toContain('re-certification required')
    expect(src).not.toContain('expiresDate')
  })
})

describe('holder-facing certificate pages', () => {
  const pages = [
    'app/courses/vagus-nerve/certificate/page.tsx',
    'app/courses/ai-in-clinical-practice/certificate/page.tsx',
  ]

  for (const page of pages) {
    it(`${page} does not print a "Valid until" date or a renewal demand`, () => {
      const src = read(page)
      expect(src).not.toContain('Valid until')
      expect(src).not.toContain('expiresDate')
      expect(src).not.toMatch(/has expired/)
      expect(src).not.toMatch(/renew for another 12 months/)
    })
  }

  it('the CPD record reports withdrawal, not expiry', () => {
    const src = read('app/courses/cpd-record/page.tsx')
    expect(src).not.toMatch(/Expired — re-take the quiz/)
    expect(src).toMatch(/Withdrawn/)
  })

  it('the ai-course certificate PDF prints no expiry date', () => {
    const src = read('app/api/ai-course/certificate/pdf/[id]/route.ts')
    expect(src).not.toContain("'Valid until'")
    expect(src).not.toContain('expiresDate')
  })
})

describe('the printed PDF and the verify page still agree', () => {
  it('lib/certificate.ts prints the retention guidance and no expiry', () => {
    const src = read('lib/certificate.ts')
    // The claim that made the 12-month expiry a contradiction. If this line
    // ever changes, /verify must be revisited in the same commit.
    expect(src).toMatch(/minimum of 5 years for audit purposes/)
    expect(src).not.toMatch(/Valid until/)
    expect(src).toContain('/verify/')
  })
})
