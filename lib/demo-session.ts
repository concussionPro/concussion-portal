/**
 * Demo-session identity — the ONE place that knows what a demo viewer is.
 *
 * Two demo audiences share the `demo-viewer` id prefix:
 *  - `demo-viewer-<org>`  — reviewer/partner preview (demo_key cookie, full-course)
 *  - `demo-viewer-clinic` — clinic-prospect demo (/demo/clinic, PREVIEW-level
 *    real JWT so every session-authed READ works portal-wide)
 *
 * RULE: demo identities READ like their tier but never WRITE. Every
 * session-authed mutation route must call one of these guards — a demo
 * viewer's id has no users row, and "writes" would otherwise either crash
 * on the missing row or persist state shared between every prospect.
 */
export const CLINIC_DEMO_USER_ID = 'demo-viewer-clinic'
export const CLINIC_DEMO_EMAIL = 'demo@clinic-preview.local'

export function isDemoUserId(userId: string | null | undefined): boolean {
  return typeof userId === 'string' && userId.startsWith('demo-viewer')
}

export function isDemoEmail(email: string | null | undefined): boolean {
  return (
    typeof email === 'string' &&
    (email.endsWith('@clinic-preview.local') || email.endsWith('@partner-preview.local'))
  )
}
