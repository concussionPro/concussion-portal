/**
 * Demo / private-review access key.
 *
 * Used by the ESSA PDO reviewer links (/demo/essa, /demo/essa-ai) and the
 * private "review copy" gates on the EP / AI courses. Reads HEIDI_DEMO_KEY from
 * the environment if set; otherwise falls back to a committed constant so the
 * reviewer links work WITHOUT any Vercel env var.
 *
 * The protection model here is deliberately link-obscurity, not a secret key:
 * the /demo/* routes are noindex + unlinked, so only someone with the exact URL
 * can trigger access. This is the founder's call for the pre-launch ESSA review
 * period. To lock the courses down again before public launch, either set
 * HEIDI_DEMO_KEY in the env (it overrides this fallback) or remove the reviewer
 * routes / re-gate the course.
 */
export const DEMO_KEY = process.env.HEIDI_DEMO_KEY || 'cea-pdo-review-2026'
