/**
 * GET /api/prospect/og-image?slug=<slug>&name=&city=&state=&region=&breakdown=&clinical=
 *
 * 1200x630 landscape PNG — hero image for cold outreach emails.
 *
 * Resolution: DB lookup by slug, query-param fallback for samples/previews.
 *
 * Edge runtime + next/og (satori). Satori is fussy — every container with
 * children must have `display: 'flex'`. Avoid emoji, complex shadows,
 * unsupported CSS. Keep nesting shallow.
 */
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getClinicBySlug } from '@/lib/prospect/repo'
import { teamBreakdownString, clinicalCount } from '@/lib/prospect/pricing'

export const runtime = 'edge'

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
      // fall through
    }
  }

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
    return new Response('Missing clinic data', { status: 400 })
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
          background: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* App header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '24px 40px',
            background: '#0a5a5e',
            color: 'white',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#0d7377',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 22,
              color: 'white',
            }}
          >
            C
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, display: 'flex' }}>Concussion Education Australia</div>
            <div style={{ fontSize: 11, color: '#a7c5c7', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2, display: 'flex' }}>
              Hub Program · Private Dashboard
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 10, color: '#a7c5c7', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'flex' }}>
              Prepared for
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, display: 'flex' }}>{shortName}</div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: '#f8fafc',
            padding: '40px 48px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 13, color: '#0a5a5e', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            Concussion Hub Program · {region}
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#0f172a', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {shortName}
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: '#475569', fontWeight: 500, marginBottom: 32 }}>
            {clinical} clinical · {city}, {state}
          </div>

          {/* 3 KPI tiles */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            <Tile label="Your team" value={`${clinical} clinical`} sub={breakdown} />
            <Tile label="CPD" value="14 hrs · OA" sub="Osteopathy Australia endorsed" />
            <Tile label="Format" value="1 day on-site" sub="Whole team trained together" />
          </div>

          {/* CTA strip */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px 24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                Next
              </div>
              <div style={{ display: 'flex', fontSize: 18, color: '#0f172a', fontWeight: 700, marginTop: 4 }}>
                Open Module 1 · Templates · Pricing
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0d7377',
                color: 'white',
                padding: '14px 26px',
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Open dashboard
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', fontSize: 11, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#0a5a5e', marginTop: 8, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ display: 'flex', fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  )
}
