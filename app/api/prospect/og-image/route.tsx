/**
 * GET /api/prospect/og-image?slug=<slug>
 *
 * Generates a 1200x630 PNG showing the prospect's personalised dashboard
 * preview. Embedded as the hero image in cold outreach emails — drives
 * click-through because the prospect's clinic name is visibly in the image.
 *
 * No auth required: the slug itself is the gate. The image only contains
 * clinic data already in the cold email body, no sensitive info.
 *
 * Cached at the Vercel edge by default (no-cache header omitted).
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getClinicBySlug } from '@/lib/prospect/repo'
import { teamBreakdownString, clinicalCount } from '@/lib/prospect/pricing'

export const runtime = 'edge' // ImageResponse needs edge runtime

interface RenderData {
  shortName: string
  city: string
  state: string
  region: string
  breakdown: string
  clinical: number
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  let data: RenderData | null = null

  // Path 1 — DB-backed prospect (production sends)
  if (slug) {
    try {
      const clinic = await getClinicBySlug(slug)
      if (clinic) {
        data = {
          shortName: clinic.shortName,
          city: clinic.city,
          state: clinic.state,
          region: clinic.region,
          breakdown: teamBreakdownString(clinic.team),
          clinical: clinicalCount(clinic.team),
        }
      }
    } catch {
      // DB unreachable or schema missing — fall through to query-param path
    }
  }

  // Path 2 — Query-param fallback (samples + previews, no DB dependency)
  if (!data) {
    const name = url.searchParams.get('name')
    const city = url.searchParams.get('city')
    const state = url.searchParams.get('state')
    const region = url.searchParams.get('region')
    const breakdown = url.searchParams.get('breakdown') ?? url.searchParams.get('team')
    const clinicalStr = url.searchParams.get('clinical')
    if (name && city && state && region && breakdown && clinicalStr) {
      data = {
        shortName: name,
        city,
        state,
        region,
        breakdown,
        clinical: parseInt(clinicalStr, 10) || 0,
      }
    }
  }

  if (!data) {
    return new Response('Missing clinic data — pass ?slug=<db-slug> or all of ?name&city&state&region&breakdown&clinical', { status: 400 })
  }

  const { shortName, city, state, region, breakdown, clinical } = data

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: 48,
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0d7377, #0a5a5e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: 'white',
            }}
          >
            C
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', lineHeight: 1.1 }}>
              Concussion<span style={{ color: '#0d7377' }}>Pro</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>
              Hub Program Preview
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Prepared for
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2332', marginTop: 4 }}>
              {shortName}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {city}, {state}
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <div style={{ fontSize: 12, color: '#0a5a5e', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, display: 'flex' }}>
          Concussion Hub Program · {city}, {state}
        </div>

        {/* Big headline — clinic name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#1a2332',
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          {shortName} Dashboard
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#475569',
            lineHeight: 1.3,
            fontWeight: 600,
            marginBottom: 40,
            display: 'flex',
          }}
        >
          Become the first call for concussion on the {region}.
        </div>

        {/* Team stat */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#e6f3f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#0a5a5e',
            }}
          >
            {clinical}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              Your team
            </div>
            <div style={{ fontSize: 15, color: '#1a2332', marginTop: 4, fontWeight: 500 }}>
              {breakdown}
            </div>
          </div>
        </div>

        {/* CTA + footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>AHPRA-aligned · OA endorsed · 14 CPD hrs</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              portal.concussion-education-australia.com
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#0d7377',
              color: 'white',
              padding: '16px 28px',
              borderRadius: 14,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Open dashboard
            <span style={{ fontSize: 20 }}>↗</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
