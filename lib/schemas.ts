/**
 * Zod schemas for API request validation.
 * Keep these central so schema + route stay in sync.
 */

import { z } from 'zod'

// Shared primitives
export const emailSchema = z.string().trim().toLowerCase().email().max(254)
export const nameSchema = z.string().trim().min(1).max(100)
export const locationSchema = z.enum(['sydney', 'melbourne'])
export const courseTypeSchema = z.enum([
  'online-only',
  'full-course',
  'workshop-upgrade',
  'international-online',
])

// UTM payload — accept loose string map, cap size
export const utmSchema = z
  .record(z.string().max(64), z.string().max(256))
  .optional()

// /api/create-checkout
//
// `location` is required for course types that include a workshop seat
// (full-course, workshop-upgrade). Online-only and international-online
// don't have a workshop, so location is irrelevant — leaving it optional
// for those paths keeps the API simple.
//
// Without this refine, a buyer could click "Enrol Now" on the Complete
// Course before picking a city and reach Stripe with no location set, which
// previously caused a silent checkout-with-no-workshop-seat bug.
export const createCheckoutSchema = z
  .object({
    courseType: courseTypeSchema,
    location: locationSchema.optional(),
    email: emailSchema.optional(),
    preferredCity: locationSchema.optional(),
    promoCode: z.string().max(50).optional(),
    utm: utmSchema,
  })
  .superRefine((val, ctx) => {
    const needsLocation = val.courseType === 'full-course' || val.courseType === 'workshop-upgrade'
    if (needsLocation && !val.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: `Workshop city is required for ${val.courseType}.`,
      })
    }
  })

// /api/send-magic-link
export const sendMagicLinkSchema = z.object({
  email: emailSchema,
})

// /api/signup-free
export const signupFreeSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  consent: z.boolean().optional(),
  source: z.string().max(50).optional(),
})

// /api/register-interest
export const registerInterestSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
  locations: z.array(locationSchema).max(3).optional(),
  preferredCity: locationSchema.optional(),
  source: z.string().max(50).optional(),
})

// /api/admin/import-interest — workshop_interest table covers 5 cities, not 3
export const importInterestSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  city: z.enum(['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa']),
})

// /api/progress — user progress shape.
// We don't model every module key individually; we cap structure instead so
// the DB can't be stuffed with arbitrary objects.
const moduleProgressSchema = z.object({
  completed: z.boolean().optional(),
  quizScore: z.number().min(0).max(100).nullable().optional(),
  quizAttempts: z.number().int().min(0).max(1000).optional(),
  timeSpent: z.number().min(0).max(1_000_000).optional(),
  lastAccessedAt: z.string().max(40).optional(),
}).catchall(z.unknown())

export const progressSchema = z.object({
  progress: z.record(z.string().max(20), moduleProgressSchema),
})
