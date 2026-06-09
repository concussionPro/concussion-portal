/**
 * HMAC-signed unsubscribe tokens for cold prospect outreach.
 *
 * Old format (`<slug>-<base36 timestamp>`) was forgeable: parseToken just
 * stripped the suffix, so anyone could mass-unsubscribe (suppress) every
 * clinic by guessing slugs. New tokens bind the slug with an HMAC so only
 * links we generated verify.
 *
 *   New format:    `<slug>.<hmac-base64url-24>`   (slugs never contain '.')
 *   Legacy format: `<slug>-<base36>`              (no '.' present)
 *
 * Legacy tokens are still PARSED (links already live in sent emails — the
 * Spam Act unsubscribe promise must keep working) but the route only
 * honours them for clinics that have actually been contacted
 * (>=1 prospect_outreach_log row). Secret mirrors lib/survey-token.ts.
 */
import crypto from 'crypto'

function getSecret(): string {
  const s = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!s) throw new Error('SESSION_SECRET or MAGIC_LINK_SECRET must be set for unsubscribe tokens')
  return s
}

function sign(slug: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`prospect-unsub.${slug}`)
    .digest('base64url')
    .slice(0, 24) // truncated — plenty of entropy, short enough for a mail header
}

/** Token embedded in List-Unsubscribe headers + footer links. */
export function generateUnsubscribeToken(slug: string): string {
  return `${slug}.${sign(slug)}`
}

export interface ParsedUnsubscribeToken {
  slug: string
  /** 'hmac' = signature verified. 'legacy' = old forgeable format — caller
   *  must additionally require the clinic to have been contacted. */
  format: 'hmac' | 'legacy'
}

/**
 * Parse + verify a token. Returns null for malformed tokens and for
 * new-format tokens whose signature doesn't verify.
 */
export function parseUnsubscribeToken(token: string): ParsedUnsubscribeToken | null {
  if (!token) return null

  const dot = token.lastIndexOf('.')
  if (dot > 0) {
    // New HMAC format — verify timing-safe.
    const slug = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = sign(slug)
    if (sig.length !== expected.length) return null
    try {
      if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return { slug, format: 'hmac' }
      }
    } catch {
      return null
    }
    return null
  }

  // Legacy format: strip the final hyphen-delimited segment (slugs may
  // themselves contain hyphens, e.g. `burleigh-heads-physio`).
  const lastHyphen = token.lastIndexOf('-')
  if (lastHyphen <= 0) return null
  return { slug: token.slice(0, lastHyphen), format: 'legacy' }
}
