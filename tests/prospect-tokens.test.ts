/**
 * Tests for the cold-outreach security primitives:
 *  - HMAC unsubscribe tokens (lib/prospect/unsubscribe-token.ts)
 *  - portal access keys (lib/prospect/access-key.ts)
 */
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-for-prospect-tokens'
})

describe('unsubscribe tokens', () => {
  it('round-trips a signed token as hmac format', async () => {
    const { generateUnsubscribeToken, parseUnsubscribeToken } = await import(
      '@/lib/prospect/unsubscribe-token'
    )
    const token = generateUnsubscribeToken('burleigh-heads-physio')
    const parsed = parseUnsubscribeToken(token)
    expect(parsed).toEqual({ slug: 'burleigh-heads-physio', format: 'hmac' })
  })

  it('rejects a tampered signature', async () => {
    const { generateUnsubscribeToken, parseUnsubscribeToken } = await import(
      '@/lib/prospect/unsubscribe-token'
    )
    const token = generateUnsubscribeToken('some-clinic')
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa')
    expect(parseUnsubscribeToken(tampered)).toBeNull()
  })

  it('rejects a signature transplanted onto a different slug', async () => {
    const { generateUnsubscribeToken, parseUnsubscribeToken } = await import(
      '@/lib/prospect/unsubscribe-token'
    )
    const sig = generateUnsubscribeToken('clinic-a').split('.')[1]
    expect(parseUnsubscribeToken(`clinic-b.${sig}`)).toBeNull()
  })

  it('parses legacy <slug>-<base36> tokens as legacy format', async () => {
    const { parseUnsubscribeToken } = await import('@/lib/prospect/unsubscribe-token')
    // Slug with internal hyphens — only the final segment is stripped.
    const parsed = parseUnsubscribeToken('burleigh-heads-physio-mbkz3f')
    expect(parsed).toEqual({ slug: 'burleigh-heads-physio', format: 'legacy' })
  })

  it('rejects malformed tokens', async () => {
    const { parseUnsubscribeToken } = await import('@/lib/prospect/unsubscribe-token')
    expect(parseUnsubscribeToken('')).toBeNull()
    expect(parseUnsubscribeToken('noseparator')).toBeNull()
    expect(parseUnsubscribeToken('-leadinghyphen')).toBeNull()
  })
})

describe('access keys', () => {
  it('legacy derivation matches the historical algorithm', async () => {
    const { legacyAccessKey } = await import('@/lib/prospect/access-key')
    // Reference implementation (as previously inlined in the creation routes)
    const ab = 'abcdefghijkmnopqrstuvwxyz23456789'
    const reference = (slug: string) => {
      let key = ''
      for (let i = 0; i < 6; i++) key += ab[(slug.charCodeAt(i % slug.length) + i * 37) % ab.length]
      return key
    }
    for (const slug of ['burleigh-heads-physio', 'a', 'sports-med-melbourne']) {
      expect(legacyAccessKey(slug)).toBe(reference(slug))
    }
  })

  it('generates random, non-deterministic keys', async () => {
    const { generateAccessKey } = await import('@/lib/prospect/access-key')
    const a = generateAccessKey()
    const b = generateAccessKey()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(10) // 8 bytes base64url ≈ 11 chars
  })

  it('verifies against the stored key, falling back to legacy only when missing', async () => {
    const { accessKeyMatches, legacyAccessKey } = await import('@/lib/prospect/access-key')
    const stored = { slug: 'my-clinic', accessKey: 'RaNd0mKey123' }
    expect(accessKeyMatches('RaNd0mKey123', stored)).toBe(true)
    // Legacy derived key must NOT work once a stored key exists
    expect(accessKeyMatches(legacyAccessKey('my-clinic'), stored)).toBe(false)
    // NULL stored key → legacy derivation accepted (pre-backfill rows)
    const legacyRow = { slug: 'my-clinic', accessKey: null }
    expect(accessKeyMatches(legacyAccessKey('my-clinic'), legacyRow)).toBe(true)
    expect(accessKeyMatches('wrong', legacyRow)).toBe(false)
    expect(accessKeyMatches(undefined, stored)).toBe(false)
  })
})
