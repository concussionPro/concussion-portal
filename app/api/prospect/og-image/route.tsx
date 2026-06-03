/**
 * GET /api/prospect/og-image?slug=<slug>&name=&city=&state=&region=&breakdown=&clinical=
 *
 * 1200x630 landscape PNG designed to look like a screenshot of the prospect's
 * private dashboard. Used as the hero image in cold outreach emails.
 *
 * Resolution order:
 *  1. DB lookup by slug (production sends — real prospect_clinics row)
 *  2. Query-param fallback (samples + previews without DB rows)
 *
 * Cached via standard CDN headers. Email clients (Gmail proxy etc.) cache
 * by URL — mergeTemplate appends a unique `v=` param per send to defeat
 * stale-error caching.
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
      // DB unreachable or schema missing — fall through to query-param path
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
    return new Response('Missing clinic data — pass ?slug=<db-slug> or all of ?name&city&state&region&breakdown&clinical', { status: 400 })
  }

  const { shortName, city, state, region, breakdown, clinical } = data
  const slugForUrl = slug ?? shortName.toLowerCase().replace(/\s+/g, '-')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f1f5f9',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* ── Browser chrome ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#10b981' }} />
          </div>
          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#64748b', display: 'flex' }}>
            🔒 portal.concussion-education-australia.com/p/{slugForUrl}
          </div>
        </div>

        {/* ── App header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 28px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0d7377, #0a5a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>C</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2332' }}>Concussion <span style={{ color: '#0d7377' }}>Education Australia</span></div>
              <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>Hub Program · Private Preview</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Prepared for</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2332', marginTop: 2 }}>{shortName}</div>
          </div>
        </div>

        {/* ── Body: sidebar + content ──────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, background: '#ffffff' }}>
          {/* Sidebar */}
          <div style={{ width: 180, background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Overview', active: true },
              { label: 'Modules', active: false },
              { label: 'Toolkit', active: false },
              { label: 'References', active: false },
              { label: 'Pricing', active: false },
              { label: 'Activate', active: false },
            ].map((item) => (
              <div key={item.label} style={{
                fontSize: 13,
                padding: '8px 12px',
                borderRadius: 8,
                background: item.active ? '#0d7377' : 'transparent',
                color: item.active ? 'white' : '#475569',
                fontWeight: item.active ? 700 : 500,
                display: 'flex',
              }}>{item.label}</div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, color: '#0a5a5e', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, display: 'flex' }}>
              Dashboard
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1a2332', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 4, display: 'flex' }}>
              {shortName}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 18, display: 'flex' }}>
              {clinical} clinical · {city}, {state} · {region}
            </div>

            {/* 3-tile KPI row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Your team</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a5a5e', marginTop: 4 }}>{clinical} clinical</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex' }}>{breakdown}</div>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>CPD</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a5a5e', marginTop: 4 }}>14 hrs · OA</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Osteopathy Australia endorsed</div>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Format</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a5a5e', marginTop: 4 }}>1 day on-site</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Whole team trained together</div>
              </div>
            </div>

            {/* Mini section cards */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Module 1 trial</div>
                <div style={{ fontSize: 12, color: '#1a2332', marginTop: 2 }}>Free interactive sample</div>
              </div>
              <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Clinical templates</div>
                <div style={{ fontSize: 12, color: '#1a2332', marginTop: 2 }}>GP letter · SCAT6 · RTP</div>
              </div>
              <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>References</div>
                <div style={{ fontSize: 12, color: '#1a2332', marginTop: 2 }}>140+ peer-reviewed</div>
              </div>
            </div>

            {/* CTA pill */}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>AHPRA-aligned · GST inclusive · valid 60 days</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d7377', color: 'white', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
                Open dashboard <span style={{ fontSize: 16 }}>↗</span>
              </div>
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
