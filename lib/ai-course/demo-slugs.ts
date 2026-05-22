/**
 * Short-URL slug → demo metadata map.
 *
 * Each slug maps to:
 *   keyEnvVar — the env var that holds the actual demo key. Lets you
 *               rotate one partner's access without affecting others.
 *   suggestedOrg — pre-fills the organisation field on the NDA page,
 *                  so the recipient doesn't type their own employer name.
 *
 * Add new partners here as you pitch. Each gets a /d/<slug> short URL.
 */

export interface DemoSlugMeta {
  keyEnvVar: string
  suggestedOrg: string
  suggestedDisplayName?: string
}

export const DEMO_SLUGS: Record<string, DemoSlugMeta> = {
  heidi: {
    keyEnvVar: 'HEIDI_DEMO_KEY',
    suggestedOrg: 'Heidi Health',
    suggestedDisplayName: 'Paul Williamson',
  },
  // Future partners — add an env var per partner and a slug entry here.
  // guild:   { keyEnvVar: 'GUILD_DEMO_KEY', suggestedOrg: 'Guild Insurance' },
  // medcast: { keyEnvVar: 'MEDCAST_DEMO_KEY', suggestedOrg: 'Medcast' },
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
