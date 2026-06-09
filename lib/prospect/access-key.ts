/**
 * Prospect portal access keys (?k=... on /p/[slug]).
 *
 * History: keys used to be DERIVED from the public slug
 * (alphabet[(slug.charCodeAt(i) + i*37) % 33] over 6 chars) — anyone who
 * knew a clinic's slug could compute its key and open the personalised
 * pitch portal. New keys are random (crypto.randomBytes), stored in
 * prospect_clinics.access_key.
 *
 * Backward compat: links already sent embed the legacy derived key, and
 * the cron bootstrap backfills access_key with the legacy value for any
 * row where it's missing — so old links keep working while new prospects
 * get unguessable keys.
 */
import crypto from 'crypto'

const LEGACY_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789' // unambiguous, no 1/l/0/o

/** Random, unguessable access key for newly created prospects. */
export function generateAccessKey(): string {
  return crypto.randomBytes(8).toString('base64url')
}

/**
 * Legacy slug-derived key. Only used to (a) backfill access_key for rows
 * created before keys were stored randomly and (b) verify rows whose
 * access_key is somehow still NULL. Never use for new prospects.
 */
export function legacyAccessKey(slug: string, length = 6): string {
  let key = ''
  for (let i = 0; i < length; i++) {
    const charCode = (slug.charCodeAt(i % slug.length) + i * 37) % LEGACY_ALPHABET.length
    key += LEGACY_ALPHABET[charCode]
  }
  return key
}

/**
 * The key a visitor must present for this clinic: the STORED access_key,
 * falling back to the legacy derivation only when the column/row value is
 * missing (pre-backfill rows).
 */
export function expectedAccessKey(clinic: { slug: string; accessKey?: string | null }): string {
  return clinic.accessKey && clinic.accessKey.length > 0
    ? clinic.accessKey
    : legacyAccessKey(clinic.slug)
}

/** Timing-safe comparison of a presented key against the expected one. */
export function accessKeyMatches(
  provided: string | undefined | null,
  clinic: { slug: string; accessKey?: string | null },
): boolean {
  if (!provided) return false
  const expected = expectedAccessKey(clinic)
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
