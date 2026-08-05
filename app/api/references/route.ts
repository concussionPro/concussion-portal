import { NextResponse } from 'next/server'
import { references } from '@/data/references'
import { resolveToolkitPageAccess } from '@/lib/toolkit-access'

/**
 * GET /api/references — the full Reference Repository dataset for the entitled
 * client component (ReferenceRepository keeps its search/filter interactivity,
 * so it fetches the data instead of bundling it into a public chunk).
 *
 * Entitlement matches the /references page gate: accessLevel online-only /
 * full-course, bundle (Reference + Toolkit) buyer, or the partner-preview
 * demo_key cookie (which /api/auth/session treats as full-course).
 */
export async function GET() {
  const access = await resolveToolkitPageAccess()
  if (access !== 'entitled') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ references })
}
