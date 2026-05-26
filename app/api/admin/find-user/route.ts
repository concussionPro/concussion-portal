import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/find-user?email=foo@bar.com
 *
 * Returns the full user record (incl. accessLevel, workshopLocation,
 * createdAt, signupSource) for the email, or { user: null } if not
 * found. Used to diagnose state when a student needs to be moved
 * between online-only / full-course / Melbourne without guessing.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }
  try {
    const user = await findUserByEmail(email)
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lookup failed' }, { status: 500 })
  }
}
