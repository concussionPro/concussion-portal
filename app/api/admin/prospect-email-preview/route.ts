/**
 * GET /api/admin/prospect-email-preview?slug=<slug>&template=initial&variant=metro
 *
 * Renders the email HTML for a prospect without sending. Lets us verify
 * the actual <img src> URL, link targets, and visual layout before firing
 * a real Resend send. Returns the full HTML body — open it in a browser
 * to see exactly what Gmail will render.
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import { getClinicBySlug } from '@/lib/prospect/repo'
import type { EmailTemplateSlug, ProspectClinic, Discipline } from '@/lib/prospect/types'

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug') ?? 'pogo-physio'
  const templateSlug = (url.searchParams.get('template') ?? 'initial') as EmailTemplateSlug
  const variant = (url.searchParams.get('variant') ?? 'metro') as 'metro' | 'regional' | 'network'
  const networkSize = url.searchParams.get('networkSize') ? parseInt(url.searchParams.get('networkSize')!, 10) : undefined
  const nearestMetro = url.searchParams.get('nearestMetro') ?? undefined
  const renderMode = url.searchParams.get('render') ?? 'html' // html | json

  const template = EMAIL_TEMPLATES.find((t) => t.slug === templateSlug)
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const clinic = await getClinicBySlug(slug)
  if (!clinic) return NextResponse.json({ error: `No prospect with slug "${slug}"` }, { status: 404 })

  // Discipline override via query — keep tests honest
  const disciplineOverride = url.searchParams.get('discipline') as Discipline | null
  const c: ProspectClinic = disciplineOverride
    ? { ...clinic, contactDiscipline: disciplineOverride }
    : clinic

  try {
    const rendered = mergeTemplate(template, c, BASE_URL, 'preview-' + Date.now().toString(36), {
      regionalVariant: variant === 'regional',
      networkVariant: variant === 'network' && networkSize ? { networkSize, nearestMetro } : undefined,
      nearestMetro,
    })

    if (renderMode === 'json') {
      return NextResponse.json({ ok: true, subject: rendered.subject, html: rendered.html, text: rendered.text })
    }

    return new NextResponse(rendered.html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-email-subject': rendered.subject,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    console.error('[prospect-email-preview] FAILED:', message, stack)
    return NextResponse.json({ error: 'mergeTemplate failed', message, stack: stack?.split('\n').slice(0, 8) }, { status: 500 })
  }
}
