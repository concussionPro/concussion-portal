import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdminSessionToken, verifyAdminSessionToken } from '@/lib/admin-session'

const originalSecret = process.env.SESSION_SECRET

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-admin-session-tests'
})

afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

describe('admin session token', () => {
  it('round-trips a valid token', () => {
    const token = createAdminSessionToken()
    const payload = verifyAdminSessionToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.type).toBe('admin')
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it('rejects a tampered payload', () => {
    const token = createAdminSessionToken()
    const [, sig] = token.split('.')
    const tampered = Buffer.from(JSON.stringify({ type: 'admin', iat: 0, exp: Date.now() + 60000 })).toString('base64url') + '.' + sig
    expect(verifyAdminSessionToken(tampered)).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const token = createAdminSessionToken()
    const [payload] = token.split('.')
    const tampered = `${payload}.${'a'.repeat(43)}`
    expect(verifyAdminSessionToken(tampered)).toBeNull()
  })

  it('rejects an expired token', () => {
    const token = createAdminSessionToken(-1000)
    expect(verifyAdminSessionToken(token)).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(verifyAdminSessionToken(null)).toBeNull()
    expect(verifyAdminSessionToken('')).toBeNull()
    expect(verifyAdminSessionToken('no-dot')).toBeNull()
  })
})
