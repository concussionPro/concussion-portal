/**
 * Demo / private-review access key.
 *
 * Used by the ESSA PDO reviewer links (/demo/essa, /demo/essa-ai) and the
 * private "review copy" gates on the EP / AI / RTP courses. Reads
 * HEIDI_DEMO_KEY from the environment.
 *
 * Zero-setup by design (2026-07-22): the reviewer / accreditor links work in
 * production WITHOUT any Vercel env var. The committed fallback below is a long,
 * non-guessable random token (not the old guessable 'cea-pdo-review-2026'
 * literal), so the exposure model is genuine link-obscurity, not a weak
 * shared password. HEIDI_DEMO_KEY, if set, overrides it (use to rotate).
 *
 * Hardening still in force: the key travels ONLY via an httpOnly cookie (set by
 * the /demo/* routes) or the x-demo-key header — the ?demo= query param is no
 * longer accepted anywhere, so the token can't leak into server/access logs or
 * Referer headers. The /demo/* routes are noindex + robots-disallowed + unlinked.
 *
 * To lock the courses down after a review window: rotate this constant (or set
 * HEIDI_DEMO_KEY) — every previously shared link stops working immediately.
 */
export const DEMO_KEY =
  process.env.HEIDI_DEMO_KEY || 'cea-rev-9f3a7c2e8b1d40566a9e7f2c1b8d3e6a'
