/**
 * Short-URL slug → demo metadata map.
 *
 * Each slug is itself non-guessable — `/d/heidi` won't work; only
 * `/d/<full-slug-with-token>` will. The slug embeds an outreach-specific
 * code so the URL you share is the wall: anyone without the exact URL
 * gets 404. Rotate by changing the slug + email Paul a new one.
 *
 *   keyEnvVar — the env var that holds the actual demo cookie value.
 *               Lets you rotate one partner's session without affecting
 *               the URL itself.
 *   suggestedOrg — pre-fills the organisation field on the NDA page.
 *
 * Add new partners with unique slug tokens — never reuse `<org>-<token>`.
 */

export interface DemoSlugMeta {
  keyEnvVar: string
  suggestedOrg: string
  suggestedDisplayName?: string
}

export const DEMO_SLUGS: Record<string, DemoSlugMeta> = {
  // Heidi outreach token — rotate by replacing this slug + emailing a new link.
  'heidi-h8k3q9p': {
    keyEnvVar: 'HEIDI_DEMO_KEY',
    suggestedOrg: 'Heidi Health',
    suggestedDisplayName: 'Paul Williamson',
  },
  // Future partners — give each a non-guessable slug:
  // 'guild-x7m2pq8':   { keyEnvVar: 'GUILD_DEMO_KEY', suggestedOrg: 'Guild Insurance' },
  // 'medcast-r4k1jn8': { keyEnvVar: 'MEDCAST_DEMO_KEY', suggestedOrg: 'Medcast' },
}

export function lookupSlug(slug: string): DemoSlugMeta | null {
  const lower = slug.toLowerCase()
  return DEMO_SLUGS[lower] ?? null
}

export function resolveKeyForSlug(slug: string): string | null {
  const meta = lookupSlug(slug)
  if (!meta) return null
  const key = process.env[meta.keyEnvVar]
  return key ?? null
}
