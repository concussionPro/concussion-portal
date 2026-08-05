import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

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
    // Same registry (`clinic:{code}`) as the SST tools, so an unlimited lookup
    // here is a clinic-code ORACLE: the code is the patient-side write key, and
    // this endpoint was the only reader of it with no limit at all. Mirrors the
    // per-IP + global ceiling on /api/sst/validate-code (the per-IP limit alone
    // is defeatable by spoofing the client-IP header).
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `preseason-clinic:${ip}`, limit: 30, windowSec: 60 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const globalRl = await rateLimit({ key: 'preseason-clinic:global', limit: 2000, windowSec: 60 })
    if (!globalRl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { code } = await params

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid clinic code' }, { status: 400 })
    }

    // Demo mode — lets clinicians try the test without registering
    if (code.toUpperCase() === 'DEMO00') {
      return NextResponse.json({ clinicName: 'Demo — Try It Yourself' })
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
