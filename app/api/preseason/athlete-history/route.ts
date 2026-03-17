import { NextResponse } from 'next/server'
import { get as getBlob, list as listBlobs } from '@vercel/blob'

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
    let baselines: BaselineEntry[] = []
    try {
      let blob = await getBlob('preseason-baselines.json', { access: 'private' })
      if (!blob) {
        const { blobs } = await listBlobs({ prefix: 'preseason-baselines' })
        const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        if (sorted.length > 0) {
          blob = await getBlob(sorted[0].url, { access: 'private' })
        }
      }
      if (blob && blob.statusCode === 200 && blob.stream) {
        const text = await new Response(blob.stream).text()
        baselines = JSON.parse(text)
      }
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
