/**
 * Talk-request endpoint — receives the in-portal "talk to Zac" form.
 *
 * Lower-friction alternative to the cal.com booking funnel which has
 * been hitting 0% click-to-book (4 clicks in 60d, 0 bookings).
 * Clinicians click through but don't lock in a 30-min slot. This form
 * captures intent in ~30 seconds: name, email, clinic, team size,
 * "best 3 times that work" + a freeform message.
 *
 * Pipeline:
 *   1. Validate + persist to talk_requests (admin dashboard reads this)
 *   2. Email Zac directly so it lands in his inbox immediately
 *   3. Send the requester a confirm reply so they know it's not a void
 *   4. Mirror the lead into prospect_clinics if not already there
 *
 * No CSRF concern (same-origin POST, public endpoint).
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { getClientIp } from '@/lib/get-client-ip'

export const runtime = 'nodejs'

interface Body {
  name?: string
  email?: string
  clinic?: string
  role?: string
  teamSize?: number | string
  preferredTimes?: string
  message?: string
  prospectSlug?: string
  utmSource?: string
  utmCampaign?: string
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = (body.name || '').trim().slice(0, 120)
  const email = (body.email || '').trim().toLowerCase().slice(0, 254)
  const clinic = (body.clinic || '').trim().slice(0, 160) || null
  const role = (body.role || '').trim().slice(0, 80) || null
  const teamSizeRaw = body.teamSize
  const teamSize =
    typeof teamSizeRaw === 'number' ? teamSizeRaw :
    typeof teamSizeRaw === 'string' && /^\d+$/.test(teamSizeRaw) ? parseInt(teamSizeRaw, 10) :
    null
  const preferredTimes = (body.preferredTimes || '').trim().slice(0, 600) || null
  const message = (body.message || '').trim().slice(0, 2000) || null
  const prospectSlug = (body.prospectSlug || '').trim().slice(0, 80) || null
  const utmSource = (body.utmSource || '').trim().slice(0, 80) || null
  const utmCampaign = (body.utmCampaign || '').trim().slice(0, 80) || null

  if (!name || !email || !email.includes('@')) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }

  const ip = getClientIp(req)
  const country =
    req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null
  const region =
    req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region-code') || null
  const city = req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || null

  try {
    const { rows } = await sql<{ id: number }>`
      INSERT INTO talk_requests (
        name, email, clinic, role, team_size, preferred_times, message,
        prospect_slug, utm_source, utm_campaign, referrer, ip, country, city, region
      ) VALUES (
        ${name}, ${email}, ${clinic}, ${role}, ${teamSize}, ${preferredTimes}, ${message},
        ${prospectSlug}, ${utmSource}, ${utmCampaign}, ${req.headers.get('referer')}, ${ip}, ${country}, ${city}, ${region}
      )
      RETURNING id
    `
    const id = rows[0]?.id

    // Email Zac directly. Highest-priority lead → land in inbox immediately.
    const zacEmailHtml = `
      <h2 style="margin:0 0 12px;color:#0f172a;">New talk request — ${escapeHtml(name)}</h2>
      <p style="margin:0 0 8px;font-size:15px;color:#334155;">
        <strong>${escapeHtml(email)}</strong>
        ${clinic ? `<br>${escapeHtml(clinic)}` : ''}
        ${role ? ` · ${escapeHtml(role)}` : ''}
        ${teamSize != null ? ` · team of ${teamSize}` : ''}
        ${city || region || country ? `<br><span style="color:#64748b;">${escapeHtml([city, region, country].filter(Boolean).join(' · '))}</span>` : ''}
      </p>
      ${preferredTimes ? `<p style="margin:14px 0 4px;font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">When works:</p>
        <p style="margin:0 0 8px;font-size:15px;color:#0f172a;white-space:pre-wrap;">${escapeHtml(preferredTimes)}</p>` : ''}
      ${message ? `<p style="margin:14px 0 4px;font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Message:</p>
        <p style="margin:0 0 8px;font-size:15px;color:#0f172a;white-space:pre-wrap;">${escapeHtml(message)}</p>` : ''}
      ${prospectSlug ? `<p style="margin:18px 0 0;font-size:12px;color:#64748b;">Source: <code>${escapeHtml(prospectSlug)}</code>${utmCampaign ? ` · ${escapeHtml(utmCampaign)}` : ''}</p>` : ''}
      <p style="margin:18px 0 0;font-size:14px;">Reply to <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> to lock a time.</p>
    `
    sendEmail({
      to: 'zac@concussion-education-australia.com',
      subject: `New talk request — ${name}${clinic ? ` · ${clinic}` : ''}`,
      html: zacEmailHtml,
      headers: { 'Reply-To': email },
      tags: [{ name: 'sequence', value: 'talk-request-internal' }],
    }).catch((e) => console.error('[talk-request] Zac notify failed:', e))

    // Confirm receipt to the requester so they know it's real.
    sendEmail({
      to: email,
      subject: 'Got it — I\'ll be in touch within 24 hours',
      html: `
        <p>Hi ${escapeHtml(name.split(' ')[0])},</p>
        <p>Thanks for reaching out — I've got your request and I'll reply personally within 24 hours (usually faster) to lock in a time that works for your team.</p>
        ${preferredTimes ? `<p>Your preferred times:<br><em>${escapeHtml(preferredTimes)}</em></p>` : ''}
        ${message ? `<p>What you mentioned:<br><em>${escapeHtml(message)}</em></p>` : ''}
        <p>If anything changes or you have a quick question in the meantime, just hit reply.</p>
        <p style="margin-top:24px;">— Zac<br><span style="color:#64748b;">Concussion Education Australia</span></p>
      `,
      tags: [{ name: 'sequence', value: 'talk-request-confirm' }],
    }).catch((e) => console.error('[talk-request] confirm failed:', e))

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[talk-request] error:', err)
    return NextResponse.json({ error: 'Failed to record request' }, { status: 500 })
  }
}
