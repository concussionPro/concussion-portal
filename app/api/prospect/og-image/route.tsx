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

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  const clinic = await getClinicBySlug(slug)
  if (!clinic) {
    return new Response('Not found', { status: 404 })
  }

  const breakdown = teamBreakdownString(clinic.team)
  const clinical = clinicalCount(clinic.team)

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
              {clinic.shortName}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {clinic.city}, {clinic.state}
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <div style={{ fontSize: 12, color: '#0a5a5e', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, display: 'flex' }}>
          Concussion Hub Program · {clinic.city}, {clinic.state}
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
          {clinic.shortName} Dashboard
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
          Become the first call for concussion on the {clinic.region}.
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
