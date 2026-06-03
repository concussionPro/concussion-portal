/**
 * Cold outreach send endpoint.
 *
 *  POST /api/admin/prospect-send
 *  Body: { clinicId: number, templateSlug: 'initial' | 'followup' | 'final', testMode?: boolean }
 *
 * Auth: admin (header or cookie via lib/require-admin).
 *
 * Production sends FAIL if:
 *  - the email template has no signed_off_at row
 *  - the recipient is on the suppression list
 *  - the daily volume cap (15/day default) is exceeded
 *  - testMode === false but the env is not production-configured
 *
 * Test mode redirects To: to ZAC_INBOX and bypasses suppression/volume checks.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminRequest } from '@/lib/require-admin'
import {
  getClinicById,
  getTemplateSignoff,
  isSuppressed,
  logOutreach,
  todaysSentCount,
  updateClinicStatus,
} from '@/lib/prospect/repo'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import type { EmailTemplateSlug } from '@/lib/prospect/types'

const ZAC_INBOX = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'
const COLD_FROM = 'Zac Lewis <partnerships@concussion-education-australia.com>'
const TRANSACTIONAL_REPLY_TO = 'zac@concussion-education-australia.com'
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'
const DAILY_CAP = parseInt(process.env.PROSPECT_DAILY_CAP ?? '15', 10)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    clinicId?: number
    templateSlug?: string
    testMode?: boolean
    variant?: 'metro' | 'regional' | 'network'
    networkSize?: number
    nearestMetro?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { clinicId, templateSlug, testMode = true, variant = 'metro', networkSize, nearestMetro } = body
  if (!clinicId || !templateSlug) {
    return NextResponse.json({ error: 'clinicId and templateSlug required' }, { status: 400 })
  }
  if (!['initial', 'followup', 'final'].includes(templateSlug)) {
    return NextResponse.json({ error: 'Invalid templateSlug' }, { status: 400 })
  }

  const slug = templateSlug as EmailTemplateSlug
  const template = EMAIL_TEMPLATES.find((t) => t.slug === slug)
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const clinic = await getClinicById(clinicId)
  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })

  // ── PRODUCTION GATES ──
  if (!testMode) {
    const signoff = await getTemplateSignoff(slug)
    if (!signoff.signedOffAt) {
      return NextResponse.json(
        { error: 'Template not signed off for production. Sign off first or use testMode.' },
        { status: 403 },
      )
    }
    // Belt-and-braces: refuse to send to any clinic already in an opt-out
    // status, independent of the email_suppression table. Catches the case
    // where a clinic was marked 'lost'/'bounced' but the suppression row
    // never got written (the /api/prospect/unsubscribe 404 era — before
    // 2026-06-04 the One-Click POST never reached our suppression writer).
    if (clinic.status === 'lost' || clinic.status === 'bounced') {
      return NextResponse.json(
        { error: 'Clinic is in opt-out status', status: clinic.status },
        { status: 409 },
      )
    }
    if (await isSuppressed(clinic.contactEmail)) {
      return NextResponse.json(
        { error: 'Recipient is on the suppression list', email: clinic.contactEmail },
        { status: 409 },
      )
    }
    const sentToday = await todaysSentCount()
    if (sentToday >= DAILY_CAP) {
      return NextResponse.json(
        { error: 'Daily volume cap reached', sentToday, cap: DAILY_CAP },
        { status: 429 },
      )
    }
  }

  // ── BUILD EMAIL ──
  const unsubscribeToken = `${clinic.slug}-${Date.now().toString(36)}`
  const { subject, html, text } = mergeTemplate(template, clinic, BASE_URL, unsubscribeToken, {
    regionalVariant: variant === 'regional',
    networkVariant:
      variant === 'network' && networkSize
        ? { networkSize, nearestMetro }
        : undefined,
    nearestMetro,
  })

  const to = testMode ? ZAC_INBOX : clinic.contactEmail
  const finalSubject = testMode ? `[TEST · ${clinic.shortName}] ${subject}` : subject

  // ── SEND VIA RESEND ──
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  let resendEmailId: string | null = null

  try {
    const result = await resend.emails.send({
      from: COLD_FROM,
      to,
      replyTo: TRANSACTIONAL_REPLY_TO,
      subject: finalSubject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${BASE_URL}/api/prospect/unsubscribe?t=${unsubscribeToken}>, <mailto:unsubscribe@concussion-education-australia.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-ID': 'prospect-outreach.concussion-education-australia.com',
        Precedence: 'bulk',
        'X-Mailer': 'ConcussionPro Outreach',
        'X-Prospect-Id': String(clinic.id),
        'X-Template-Slug': slug,
      },
      tags: [
        { name: 'prospect-id', value: String(clinic.id) },
        { name: 'template', value: slug },
        { name: 'mode', value: testMode ? 'test' : 'production' },
      ],
    })
    if (result.error) {
      return NextResponse.json({ error: 'Resend send failed', detail: result.error }, { status: 502 })
    }
    resendEmailId = result.data?.id ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Resend exception', detail: message }, { status: 502 })
  }

  // ── LOG ──
  const auditKey = `outreach:${clinic.slug}:${slug}:${testMode ? 'test' : 'prod'}:${Date.now()}`
  await logOutreach({
    clinicId: clinic.id,
    templateSlug: slug,
    emailSubject: finalSubject,
    emailBody: text,
    resendEmailId,
    auditKey,
  })

  if (!testMode && clinic.status === 'approved') {
    await updateClinicStatus(clinic.id, 'sent')
  }

  return NextResponse.json({
    ok: true,
    resendEmailId,
    sentTo: to,
    subject: finalSubject,
    testMode,
    clinic: { id: clinic.id, slug: clinic.slug, shortName: clinic.shortName },
  })
}
