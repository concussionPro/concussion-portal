import { describe, it, expect } from 'vitest'
import { isPaidDoc, isAuthDoc, isPublicDoc, PAID_DOCS, AUTH_DOCS } from '@/lib/gated-docs'

/**
 * PERCENT-ENCODED-DOT BYPASS (2026-08-06 server-surface audit — P0, proven
 * live in production before the fix).
 *
 * The middleware's asset gates keyed on a FILE EXTENSION — the block entry was
 * `/\.(pdf|zip|docx|png)$/.test(pathname)`, and the route matcher was
 * `/docs/:path*.pdf` etc. Neither matches `%2E`, so `/docs/X%2Epdf` skipped
 * the gate entirely (in fact middleware never ran) and Vercel's static handler
 * decoded the path and served the file. Every PAID_DOCS entry — the A$97
 * Clinical Reference Text, the Clinical Toolkit ZIP, the fillable-PDF pack,
 * the paid Word templates — was downloadable with no session at all.
 *
 * The fix decodes ONCE in the middleware and gates on the DIRECTORY, so the
 * default-deny tail is what binds. These tests lock the two halves that make
 * that safe: the membership helpers must recognise an encoded path, and the
 * gate lists must never be matched by an encoded string that slipped through
 * undecoded.
 */
describe('gated docs — percent-encoded path handling', () => {
  const encodeDot = (p: string) => p.replace(/\.(?=[^.]*$)/, '%2E')

  it('every PAID doc is still recognised when its dot is percent-encoded', () => {
    for (const doc of PAID_DOCS) {
      const encoded = encodeDot(doc)
      expect(encoded).not.toBe(doc) // the test is doing something
      expect(isPaidDoc(encoded)).toBe(true)
    }
  })

  it('every AUTH doc is still recognised when its dot is percent-encoded', () => {
    for (const doc of AUTH_DOCS) {
      expect(isAuthDoc(encodeDot(doc))).toBe(true)
    }
  })

  it('lower-case %2e is the same character', () => {
    expect(isPaidDoc('/docs/CCM_Complete_Reference_2026%2epdf')).toBe(true)
    expect(isPaidDoc('/docs/CCM_Complete_Reference_2026%2Epdf')).toBe(true)
  })

  it('a space-encoded paid template still matches (the original reason to decode)', () => {
    expect(isPaidDoc('/docs/Email%20Template%20Pack.docx')).toBe(true)
    expect(isPaidDoc('/docs/Email%20Template%20Pack%2Edocx')).toBe(true)
  })

  it('nothing is public — PUBLIC_DOCS is deliberately empty, so /docs/ default-denies', () => {
    expect(isPublicDoc('/docs/CCM_Complete_Reference_2026.pdf')).toBe(false)
    expect(isPublicDoc('/docs/anything-at-all.pdf')).toBe(false)
  })

  it('an unlisted or double-encoded path matches NO allowlist, so it falls to default-deny', () => {
    // Double-encoded: one decode yields '%2Epdf', which is not a real entry.
    // It must not accidentally satisfy a gate — the middleware denies it.
    expect(isPaidDoc('/docs/CCM_Complete_Reference_2026%252Epdf')).toBe(false)
    expect(isAuthDoc('/docs/CCM_Complete_Reference_2026%252Epdf')).toBe(false)
    expect(isPublicDoc('/docs/CCM_Complete_Reference_2026%252Epdf')).toBe(false)
    // Malformed encoding must not throw.
    expect(() => isPaidDoc('/docs/broken%ZZ.pdf')).not.toThrow()
    expect(isPaidDoc('/docs/broken%ZZ.pdf')).toBe(false)
  })

  it('the paid list still contains the assets that cost money', () => {
    expect(PAID_DOCS.has('/docs/CCM_Complete_Reference_2026.pdf')).toBe(true)
    expect(PAID_DOCS.has('/docs/ClinicalToolkit_Complete.zip')).toBe(true)
    expect(PAID_DOCS.has('/docs/SCAT-SCOAT_FillablePDFs.zip')).toBe(true)
  })
})
