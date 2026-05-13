import { describe, it, expect } from 'vitest'
import {
  createCheckoutSchema,
  progressSchema,
  sendMagicLinkSchema,
  registerInterestSchema,
  importInterestSchema,
} from '@/lib/schemas'

describe('createCheckoutSchema', () => {
  it('accepts a minimal online-only payload', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'online-only' })
    expect(r.success).toBe(true)
  })

  it('rejects unknown course types', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'all-access' })
    expect(r.success).toBe(false)
  })

  it('normalizes email to lowercase', () => {
    const r = createCheckoutSchema.safeParse({
      courseType: 'online-only',
      email: 'ZAC@Example.COM',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('zac@example.com')
  })

  it('rejects bad locations', () => {
    const r = createCheckoutSchema.safeParse({
      courseType: 'full-course',
      location: 'perth',
    })
    expect(r.success).toBe(false)
  })

  it('rejects full-course without a location (the Chien bug)', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'full-course' })
    expect(r.success).toBe(false)
    if (!r.success) {
      const issues = r.error.flatten().fieldErrors
      expect(issues.location?.[0]).toMatch(/Workshop city is required/)
    }
  })

  it('rejects workshop-upgrade without a location', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'workshop-upgrade' })
    expect(r.success).toBe(false)
  })

  it('accepts full-course with a valid location', () => {
    const r = createCheckoutSchema.safeParse({
      courseType: 'full-course',
      location: 'melbourne',
    })
    expect(r.success).toBe(true)
  })

  it('accepts online-only with no location (workshop irrelevant)', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'online-only' })
    expect(r.success).toBe(true)
  })

  it('accepts international-online with no location', () => {
    const r = createCheckoutSchema.safeParse({ courseType: 'international-online' })
    expect(r.success).toBe(true)
  })
})

describe('progressSchema', () => {
  it('accepts a realistic payload', () => {
    const r = progressSchema.safeParse({
      progress: {
        '1': { completed: true, quizScore: 92, quizAttempts: 2, timeSpent: 1200 },
        '101': { completed: false, quizScore: null },
      },
    })
    expect(r.success).toBe(true)
  })

  it('rejects out-of-range quiz scores', () => {
    const r = progressSchema.safeParse({
      progress: { '1': { quizScore: 200 } },
    })
    expect(r.success).toBe(false)
  })

  it('rejects non-object module values', () => {
    const r = progressSchema.safeParse({ progress: { '1': 'completed' } })
    expect(r.success).toBe(false)
  })
})

describe('sendMagicLinkSchema', () => {
  it('accepts a well-formed email', () => {
    const r = sendMagicLinkSchema.safeParse({ email: 'clinic@example.com' })
    expect(r.success).toBe(true)
  })

  it('rejects missing email', () => {
    const r = sendMagicLinkSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('rejects malformed email', () => {
    const r = sendMagicLinkSchema.safeParse({ email: 'not-an-email' })
    expect(r.success).toBe(false)
  })
})

describe('registerInterestSchema', () => {
  it('accepts email-only payload', () => {
    const r = registerInterestSchema.safeParse({ email: 'zac@example.com' })
    expect(r.success).toBe(true)
  })

  it('caps locations array', () => {
    const r = registerInterestSchema.safeParse({
      email: 'zac@example.com',
      locations: ['sydney', 'sydney', 'sydney', 'sydney'],
    })
    expect(r.success).toBe(false)
  })
})

describe('importInterestSchema (admin manual insert)', () => {
  it('accepts a complete record for each of the 5 supported cities', () => {
    for (const city of ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa']) {
      const r = importInterestSchema.safeParse({
        email: 'test@example.com',
        name: 'Test User',
        city,
      })
      expect(r.success, `city ${city} should validate`).toBe(true)
    }
  })

  it('rejects cities outside the 5-city set', () => {
    const r = importInterestSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      city: 'hobart',
    })
    expect(r.success).toBe(false)
  })

  it('rejects missing name', () => {
    const r = importInterestSchema.safeParse({
      email: 'test@example.com',
      city: 'sydney',
    })
    expect(r.success).toBe(false)
  })

  it('rejects malformed email', () => {
    const r = importInterestSchema.safeParse({
      email: 'not-an-email',
      name: 'Test User',
      city: 'sydney',
    })
    expect(r.success).toBe(false)
  })

  it('normalises email to lowercase', () => {
    const r = importInterestSchema.safeParse({
      email: 'CAPS@Example.COM',
      name: 'Caps User',
      city: 'melbourne',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('caps@example.com')
  })
})
