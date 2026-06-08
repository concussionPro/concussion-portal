/**
 * Admin: send Zac the prospect-portal preview email so he can see what
 * a real B2B prospect sees (tailored landing + inline Cal embed).
 *
 * Usage:
 *   curl -X POST /api/admin/send-portal-preview \
 *     -H 'Authorization: Bearer $ADMIN_API_KEY' \
 *     -H 'Origin: https://portal.concussion-education-australia.com'
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmail } from '@/lib/resend-client'

export const runtime = 'nodejs'

const TEST_SLUG = 'zac-preview-demo'
const TEST_KEY = 'zacdemo'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // Ensure the test prospect exists
    await sql`
      INSERT INTO prospect_clinics (
        slug, access_key, name, short_name, city, state, region,
        contact_first_name, contact_full_name, contact_email, contact_role, contact_discipline,
        clinic_website_url, team, local_targets,
        travel_band, travel_surcharge, cohort_recommendation,
        status, research_source, valid_until, notes
      ) VALUES (
        ${TEST_SLUG}, ${TEST_KEY},
        'Zac Preview Practice', 'Zac Preview', 'Gold Coast', 'QLD', 'Gold Coast',
        'Zac', 'Zac Lewis', 'zac@concussion-education-australia.com',
        'Founder / Osteopath', 'osteopaths',
        'https://concussion-education-australia.com',
        ${'{"osteopaths":1,"physiotherapists":4,"generalPractitioners":0,"sportsMedicineDoctors":1,"exercisePhys":1,"myotherapists":0,"remedialMassage":1,"practiceManager":1,"admin":1}'}::jsonb,
        '[]'::jsonb,
        'flight-domestic', 0, 'recommended',
        'archived', 'manual', NOW() + INTERVAL '60 days',
        'Self-preview portal — Zac uses this to see what a prospect sees. Status set to archived so cold cron skips it.'
      )
      ON CONFLICT (slug) DO UPDATE
        SET status = 'archived',
            access_key = EXCLUDED.access_key,
            updated_at = NOW()
    `

    const portalUrl = `https://portal.concussion-education-australia.com/p/${TEST_SLUG}?k=${TEST_KEY}`
    const ok = await sendEmail({
      to: 'zac@concussion-education-australia.com',
      subject: 'Your prospect portal preview — native Cal booking inline',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h2 style="margin: 0 0 8px;">Preview — Zac Preview Practice portal</h2>
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
            See what a real B2B prospect sees. Scroll to <strong>Next step → Pick a time</strong> at the bottom — the Cal.com calendar now renders <strong>INLINE</strong> on the page, so they pick a slot without bouncing off-site.
          </p>
          <p style="margin: 24px 0;">
            <a href="${portalUrl}" style="display:inline-block; padding:14px 26px; background:#0d9488; color:white; text-decoration:none; border-radius:10px; font-weight:600; font-size:15px;">
              Open prospect portal →
            </a>
          </p>
          <ul style="color: #475569; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 16px 0;">
            <li>Hero + tailored OG image with clinic name</li>
            <li>Credibility · team mix · multidisciplinary · training preview · references</li>
            <li>Bottom: <strong>inline Cal calendar</strong> · "Only free after 5pm?" → /talk · "Just email me" fallback</li>
          </ul>
          <p style="color: #94a3b8; font-size: 11px; margin: 28px 0 0; line-height: 1.5;">
            Real bookings on the embed land in your Cal.com calendar today.
            DB sync (auto-promote prospect to engaged) waits for the Cloudflare webhook unblock —
            once lifted, every booking auto-flags in B2B Outreach.
          </p>
        </div>
      `,
      tags: [{ name: 'sequence', value: 'admin-preview' }],
    })

    return NextResponse.json({
      ok,
      portalUrl,
      sentTo: 'zac@concussion-education-australia.com',
    })
  } catch (err) {
    console.error('[send-portal-preview] error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
