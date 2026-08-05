/**
 * resolveLandingTarget — the ONE resolver every login surface uses for "where
 * does this person land?" (app/api/auth/verify).
 *
 * It is simultaneously a UX rule and an entitlement allowlist: a preview-tier
 * account may only be deep-linked into surfaces it actually owns, so the
 * redirect param can never be used to walk someone into paid content.
 *
 * Added 2026-08-05: the free SCAT/SCOAT forms. The middleware now bounces an
 * anonymous clinician from /docs/SCAT6_Fillable.pdf to /login?redirect=<file>;
 * without allowing that target here the round trip dropped them on the free
 * SCAT course instead of the form they tapped mid-assessment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const owns = { crm: false, sst: false, ai: false }

vi.mock('@/lib/crm-course', () => ({ userOwnsCrm: vi.fn(async () => owns.crm) }))
vi.mock('@/lib/users', () => ({
  hasSstEntitlement: vi.fn(async () => owns.sst),
  updateLastLogin: vi.fn(async () => {}),
  findUserById: vi.fn(async () => null),
  findUserByEmail: vi.fn(async () => null),
}))
vi.mock('@/lib/ai-course/access', () => ({ isUserEnrolled: vi.fn(async () => owns.ai) }))
vi.mock('@/lib/db', () => ({ sql: vi.fn(async () => ({ rows: [] })) }))
vi.mock('@/lib/monitoring', () => ({
  logAuthFailure: vi.fn(async () => {}),
  logCriticalError: vi.fn(async () => {}),
}))

import { resolveLandingTarget } from '@/app/api/auth/verify/route'

beforeEach(() => {
  owns.crm = false
  owns.sst = false
  owns.ai = false
})

const EMAIL = 'user@clinic.com'

describe('resolveLandingTarget — default doors', () => {
  it('a paid account lands on the dashboard', async () => {
    expect(await resolveLandingTarget('online-only', EMAIL, null)).toBe('/dashboard')
    expect(await resolveLandingTarget('full-course', EMAIL, null)).toBe('/dashboard')
  })

  it('a plain preview lead lands on the free course', async () => {
    expect(await resolveLandingTarget('preview', EMAIL, null)).toBe('/modules/101')
  })

  it('a CRM buyer (preview by design) lands on their own course', async () => {
    owns.crm = true
    expect(await resolveLandingTarget('preview', EMAIL, null)).toBe('/ep-course')
  })

  it('an SST clinic (preview by design) lands on the clinical workspace', async () => {
    owns.sst = true
    expect(await resolveLandingTarget('preview', EMAIL, null)).toBe('/clinical-testing')
  })
})

describe('resolveLandingTarget — redirect allowlist', () => {
  it('honours the SCAT/SCOAT form a preview user was bounced from', async () => {
    expect(await resolveLandingTarget('preview', EMAIL, '/docs/SCAT6_Fillable.pdf')).toBe(
      '/docs/SCAT6_Fillable.pdf',
    )
    expect(await resolveLandingTarget('preview', EMAIL, '/docs/SCOAT6_Fillable.pdf')).toBe(
      '/docs/SCOAT6_Fillable.pdf',
    )
  })

  it('does NOT honour a PAID document for a preview user', async () => {
    expect(await resolveLandingTarget('preview', EMAIL, '/docs/ClinicalToolkit_Complete.zip')).toBe(
      '/modules/101',
    )
    expect(await resolveLandingTarget('preview', EMAIL, '/CourseContent_2026.pdf')).toBe('/modules/101')
  })

  it('does not walk a preview user into paid course content', async () => {
    expect(await resolveLandingTarget('preview', EMAIL, '/dashboard')).toBe('/modules/101')
    expect(await resolveLandingTarget('preview', EMAIL, '/clinical-toolkit')).toBe('/modules/101')
    expect(await resolveLandingTarget('preview', EMAIL, '/ep-course')).toBe('/modules/101')
  })

  it('free surfaces stay open to preview', async () => {
    expect(await resolveLandingTarget('preview', EMAIL, '/modules/104')).toBe('/modules/104')
    expect(await resolveLandingTarget('preview', EMAIL, '/scat-course')).toBe('/scat-course')
  })

  it('a paid account may deep-link anywhere same-origin', async () => {
    expect(await resolveLandingTarget('full-course', EMAIL, '/clinical-toolkit')).toBe('/clinical-toolkit')
    expect(await resolveLandingTarget('full-course', EMAIL, '/docs/ClinicalToolkit_Complete.zip')).toBe(
      '/docs/ClinicalToolkit_Complete.zip',
    )
  })

  it('OPEN REDIRECT: off-origin targets are never honoured', async () => {
    for (const evil of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/\tevil.com',
      '/\r\nevil.com',
    ]) {
      expect(await resolveLandingTarget('full-course', EMAIL, evil)).toBe('/dashboard')
      expect(await resolveLandingTarget('preview', EMAIL, evil)).toBe('/modules/101')
    }
  })
})
