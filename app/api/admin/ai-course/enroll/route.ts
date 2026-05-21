import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { enrolUser, unenrolUser } from '@/lib/ai-course/access'
import { z } from 'zod'

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  action: z.enum(['enrol', 'unenrol']).default('enrol'),
})

/**
 * POST /api/admin/ai-course/enroll
 *
 * Admin endpoint to enrol (or unenrol) a user in the AI course preview.
 * Pairs with the access gate in lib/ai-course/access.ts.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const { email, action } = parsed.data
  const result = action === 'enrol' ? await enrolUser(email) : await unenrolUser(email)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 })
  }

  return NextResponse.json({ success: true, email, action })
}
