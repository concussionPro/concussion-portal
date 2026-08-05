/**
 * The static-asset gate lists, shared between the edge middleware (which
 * ENFORCES them) and /api/auth/verify (which decides where a magic link may
 * land). Kept import-free so it is safe in the Edge bundle and in tests.
 *
 * PUBLIC_DOCS — no gate at all. Deliberately empty: every downloadable asset
 *               costs at least an email capture.
 * AUTH_DOCS   — any authenticated user, including free/preview accounts. The
 *               SCAT/SCOAT fillable + flat templates are the lead magnet; the
 *               email gate mints a PREVIEW session for exactly this.
 * PAID_DOCS   — paid course access (online-only / full-course) or the
 *               Reference+Toolkit bundle. Served straight off the CDN, so the
 *               middleware is the ONLY gate in front of them.
 */
export const PUBLIC_DOCS: ReadonlySet<string> = new Set<string>([])

export const AUTH_DOCS: ReadonlySet<string> = new Set([
  '/docs/SCAT6_Fillable.pdf',
  '/docs/SCOAT6_Fillable.pdf',
  // Flat templates feed the SCAT form tools' PDF export — the email gate
  // mints a PREVIEW session for exactly this, so paid-gating them 401'd the
  // lead magnet at its conversion moment (2026-08-05 round-C #1).
  '/docs/SCAT6_Flat.pdf',
  '/docs/SCOAT6_Flat.pdf',
  '/docs/Child_SCAT6_Flat.pdf',
])

export const PAID_DOCS: ReadonlySet<string> = new Set([
  '/docs/CCM_Complete_Reference_2026.pdf',
  '/docs/SCAT-SCOAT_FillablePDFs.zip',
  '/docs/ClinicalToolkit_Complete.zip',
  // Paid Word/image templates (2026-07-05 audit: these were world-readable —
  // the matcher only covered .pdf/.zip, so raw /docs/ URLs bypassed the gate)
  '/docs/Email Template Pack.docx',
  '/docs/Employer _ School Letter Template.docx',
  '/docs/Return-to-School Plan Template (DOCX).docx',
  '/docs/RehabFlow.png',
])

/** Membership test tolerant of a percent-encoded pathname (the sets hold the
 *  decoded form; a browser sends `/docs/Email%20Template%20Pack.docx`). */
function inSet(set: ReadonlySet<string>, pathname: string): boolean {
  if (set.has(pathname)) return true
  try {
    return set.has(decodeURIComponent(pathname))
  } catch {
    return false
  }
}

export const isPublicDoc = (p: string) => inSet(PUBLIC_DOCS, p)
export const isAuthDoc = (p: string) => inSet(AUTH_DOCS, p)
export const isPaidDoc = (p: string) => inSet(PAID_DOCS, p)
