/**
 * Short-URL slug → demo metadata map.
 *
 * Each slug is non-identifying — recipient can't see partner identity
 * from the URL. Internal env var name maps the slug to a per-partner
 * key. Rotate by replacing slug + emailing a new one.
 *
 *   keyEnvVar — the env var that holds the actual demo cookie value.
 *   suggestedOrg — pre-fills the organisation field on the NDA page.
 */

export interface DemoSlugMeta {
  keyEnvVar: string
  suggestedOrg: string
  suggestedDisplayName?: string
}

export const DEMO_SLUGS: Record<string, DemoSlugMeta> = {
  // Partner code PW-001 — rotate by replacing this slug + emailing a new link.
  // Slug deliberately non-identifying — URL does not reveal recipient org.
  'pw-x9k3m7q8n4': {
    keyEnvVar: 'HEIDI_DEMO_KEY',
    suggestedOrg: 'Heidi Health',
    suggestedDisplayName: 'Paul Williamson',
  },
  // Future partners — give each a non-identifying slug code:
  // 'gi-r4k1jn8p2': { keyEnvVar: 'GUILD_DEMO_KEY', suggestedOrg: 'Guild Insurance' },
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
