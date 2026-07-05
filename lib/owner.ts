/**
 * Pre-release owner gate (2026-07-05): the Clinical Testing suite is
 * subscription-bound and NOT launched — it renders only in the owner's test
 * dashboard until the founding release. Widen deliberately, never casually.
 */
const OWNER_EMAILS = new Set(['z.lew87@gmail.com'])

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && OWNER_EMAILS.has(email.trim().toLowerCase())
}
