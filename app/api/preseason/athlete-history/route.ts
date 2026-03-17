import { NextResponse } from 'next/server'
import { list as listBlobs } from '@vercel/blob'

interface BaselineEntry {
  clinicCode: string
  clinicName: string
  athleteName: string
  dob?: string
  submittedAt: string
  symptomCount: number
  symptomSeverity: number
  cognitiveScore: number
}

export async function POST(request: Request) {
  try {
    const { clinicCode, name, dob } = await request.json()

    if (!clinicCode || !name) {
      return NextResponse.json({ previousTests: 0, dates: [] })
    }

    const normName = name.trim().toLowerCase()
    const normCode = clinicCode.trim().toUpperCase()

    // Load baselines from blob
    const { blobs } = await listBlobs()
    const existing = blobs
      .filter(b => b.pathname === 'preseason-baselines.json')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (existing.length === 0) {
      return NextResponse.json({ previousTests: 0, dates: [] })
    }

    let baselines: BaselineEntry[] = []
    try {
      const res = await fetch(`${existing[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      baselines = await res.json()
    } catch {
      return NextResponse.json({ previousTests: 0, dates: [] })
    }

    // Match by clinic code + normalized name (+ DOB if available)
    const matches = baselines.filter(b => {
      if (b.clinicCode !== normCode) return false
      if (b.athleteName.trim().toLowerCase() !== normName) return false
      // If both have DOB, use it as extra confirmation
      if (dob && b.dob && b.dob !== dob) return false
      return true
    })

    return NextResponse.json({
      previousTests: matches.length,
      dates: matches.map(m => m.submittedAt).sort(),
    })
  } catch (error) {
    console.error('Athlete history lookup error:', error)
    return NextResponse.json({ previousTests: 0, dates: [] })
  }
}
