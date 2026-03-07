import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

interface ClinicData {
  clinicName: string
  contactName: string
  email: string
  createdAt: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid clinic code' }, { status: 400 })
    }

    const clinic = await kv.get<ClinicData>(`clinic:${code.toUpperCase()}`)

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    // Only return clinic name — never expose email
    return NextResponse.json({ clinicName: clinic.clinicName })
  } catch (error) {
    console.error('Clinic lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
