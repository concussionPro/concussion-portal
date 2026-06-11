/**
 * Pure helpers for the Concussion Care PARTNERSHIP arm.
 *
 * Deliberately framework-free and DB-free so they can be unit-tested in
 * isolation (no Postgres, no server-only). Kept fully separate from the
 * cold-clinic outreach engine (lib/prospect/*) — this arm must never be
 * able to break the clinic funnel.
 */
import crypto from 'crypto'

export type PartnerType = 'academy' | 'school' | 'club'
export type PartnerStatus = 'lead' | 'contacted' | 'active' | 'declined'

/**
 * kebab-case a free-text institution name into a URL-safe slug.
 * Strips apostrophes/punctuation, collapses whitespace to single hyphens.
 *   "St Joseph's College Hunters Hill" → "st-josephs-college-hunters-hill"
 *   "Brisbane Boys' College"           → "brisbane-boys-college"
 */
export function kebabCase(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/['’`]/g, '') // drop apostrophes so "boys'" → "boys"
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics → single hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

/** Random, unguessable access key (8 bytes → ~11 base64url chars). */
export function generateAccessKey(): string {
  return crypto.randomBytes(8).toString('base64url')
}

/** Canonical tier for an institution type: 1 academy / 2 school / 3 club. */
export function tierForType(type: PartnerType): number {
  switch (type) {
    case 'academy':
      return 1
    case 'school':
      return 2
    case 'club':
      return 3
  }
}
