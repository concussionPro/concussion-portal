import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { userOwnsCrm, userOwnsCrmPractical } from '@/lib/crm-course'

/**
 * GET /train — the ONE link in the Q4 Mac Mail one-to-one round
 * (owner 2026-08-18: "why not just route to the normal checkout? what about
 * upgraders? what about other locations? use the portal's existing
 * architecture").
 *
 * A signed 302 router in the nominate-click mould — no bespoke landing UI.
 * The (e, t) pair is the same HMAC as one-click unsubscribe; a link we didn't
 * mint routes like an anonymous visitor and carries no identity.
 *
 *   - owns an online course, no practical seat → /upgrade (its page owns the
 *     price and checkout; CRM dualism honoured — a CRM buyer's access_level
 *     stays 'preview')
 *   - everyone else → /pricing with location=melbourne — the normal checkout
 *     entry, where every city is nominatable at purchase and the existing
 *     identity-stitch (email=) attributes the session
 *
 * Scanner-safe by construction: a redirect writes nothing anywhere.
 */

export const dynamic = 'force-dynamic'

const UTM = 'utm_source=email&utm_medium=email&utm_campaign=q4_mail_v1'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const email = (sp.get('e') || '').trim().toLowerCase()
  const token = sp.get('t') || ''
  const valid = !!email && token === generateUnsubscribeToken(email)

  // The specific date page, never generic /pricing (approved-template rule;
  // owner 2026-08-18: "the url just goes to the plain pricing page wtf").
  // Sydney/Byron interest is handled by REPLY in this campaign, not on-page.
  let dest = `/melbourne-nov7?${UTM}&utm_content=train`

  if (valid) {
    try {
      const { rows } = await sql`
        SELECT access_level FROM users WHERE LOWER(email) = ${email} LIMIT 1
      `
      const accessLevel = rows[0]?.access_level as string | undefined

      let upgrader = accessLevel === 'online-only'
      if (!upgrader && accessLevel === 'preview') {
        const [ownsCrmOnline, ownsSeat] = await Promise.all([
          userOwnsCrm(email),
          userOwnsCrmPractical(email),
        ])
        upgrader = ownsCrmOnline && !ownsSeat
      }

      if (upgrader) {
        dest = `/upgrade?${UTM}&utm_content=train_upgrade`
      } else {
        dest = `/melbourne-nov7?${UTM}&utm_content=train&email=${encodeURIComponent(email)}`
      }
    } catch {
      // DB hiccup → anonymous date-page route; never a broken link in an email.
    }
  }

  return NextResponse.redirect(new URL(dest, CONFIG.APP_URL), { status: 302 })
}
