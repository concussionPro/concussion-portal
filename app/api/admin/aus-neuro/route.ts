import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { sql } from '@/lib/db'

/** GET /api/admin/aus-neuro — the 'aus neuro' outreach stream (owner
 *  2026-07-28): SST-specific AU neuro/vestibular/concussion clinics, tagged
 *  stream='aus-neuro' in prospect_clinics. Feeds the analytics panel.
 *  SEPARATE stream from the generic clinic lanes — its own cadence + copy
 *  (/clinics pitch, no ACC angle). */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { rows } = await sql`
    SELECT name, city, state, contact_first_name, contact_full_name, contact_role,
           contact_email, status, verification_status, replied_at, clinic_website_url
    FROM prospect_clinics
    WHERE stream = 'aus-neuro'
    ORDER BY (status = 'approved') DESC, name ASC
  `
  return NextResponse.json({ clinics: rows })
}
