import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordEarlyAccess } from '@/lib/early-access'
import { COURSES } from '@/lib/ai-course/provider-catalogue'

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  courseSlug: z.string().min(1).max(80),
  source: z.string().max(40).optional(),
})

const COMING_SOON_SLUGS = new Set(
  COURSES.filter((c) => c.status === 'coming-soon' && c.earlyBirdDiscountPct).map((c) => c.id)
)

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { email, courseSlug, source } = parsed.data
  if (!COMING_SOON_SLUGS.has(courseSlug)) {
    return NextResponse.json({ error: 'Course is not accepting early-access signups' }, { status: 400 })
  }

  const result = await recordEarlyAccess({ email, courseSlug, source })
  return NextResponse.json({ ok: true, alreadySignedUp: result.alreadySignedUp })
}
