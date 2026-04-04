import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { clinicCode, name, dob } = await request.json()

    if (!clinicCode || !name) {
      return NextResponse.json({ previousTests: 0, dates: [] })
    }

    const normName = name.trim().toLowerCase()
    const normCode = clinicCode.trim().toUpperCase()

    // Query baselines from Postgres
    const { rows } = dob
      ? await sql`
          SELECT submitted_at FROM preseason_baselines
          WHERE clinic_code = ${normCode}
            AND LOWER(TRIM(athlete_name)) = ${normName}
            AND (dob IS NULL OR dob = ${dob})
          ORDER BY submitted_at ASC
        `
      : await sql`
          SELECT submitted_at FROM preseason_baselines
          WHERE clinic_code = ${normCode}
            AND LOWER(TRIM(athlete_name)) = ${normName}
          ORDER BY submitted_at ASC
        `

    return NextResponse.json({
      previousTests: rows.length,
      dates: rows.map(r => r.submitted_at instanceof Date ? r.submitted_at.toISOString() : r.submitted_at),
    })
  } catch (error) {
    console.error('Athlete history lookup error:', error)
    return NextResponse.json({ previousTests: 0, dates: [] })
  }
}
