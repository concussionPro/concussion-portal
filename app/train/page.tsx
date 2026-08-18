import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { verifySessionToken } from '@/lib/jwt-session'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { userOwnsCrm, userOwnsCrmPractical } from '@/lib/crm-course'
import { TrainCtas } from './train-ctas'

/**
 * /train — the single destination for Q4 warm practical-day outreach
 * (owner 2026-08-18: one link per email; the page routes the reader).
 *
 * Three states, decided server-side:
 *  - owns an online course, no practical seat → upgrade is the headline
 *  - owns the full course / a seat           → interest register only
 *  - everyone else                           → enrol Melbourne, or register
 *                                              interest for Sydney / Byron Bay
 *
 * Identity comes from the signed (e, t) pair the email links carry — the same
 * HMAC as one-click unsubscribe and nominate-confirm, so personalisation and
 * the interest buttons only work on links we minted. A logged-in session takes
 * precedence over the URL identity. No unconfirmed dates are named here —
 * /melbourne-nov7 carries its own compliant framing.
 */

export const metadata: Metadata = {
  title: 'Practical Training — Concussion Education Australia',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Audience = 'upgrade' | 'enrolled' | 'new'

export default async function TrainPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>
}) {
  const params = await searchParams
  const linkEmail = (params.e || '').trim().toLowerCase()
  const linkToken = params.t || ''
  const linkValid = !!linkEmail && linkToken === generateUnsubscribeToken(linkEmail)

  // Session beats URL identity.
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  const session = sessionToken ? verifySessionToken(sessionToken) : null

  const email = session?.email?.toLowerCase() || (linkValid ? linkEmail : '')

  let firstName = ''
  let audience: Audience = 'new'

  if (email) {
    let accessLevel = session?.accessLevel as string | undefined
    let name = session?.name as string | undefined
    if (!accessLevel) {
      try {
        const { rows } = await sql`
          SELECT name, access_level FROM users WHERE LOWER(email) = ${email} LIMIT 1
        `
        if (rows[0]) {
          name = rows[0].name
          accessLevel = rows[0].access_level
        }
      } catch {
        // Lookup failure degrades to the generic page — never blocks render.
      }
    }
    firstName = (name || '').split(' ')[0] || ''

    if (accessLevel === 'full-course') {
      audience = 'enrolled'
    } else if (accessLevel === 'online-only') {
      audience = 'upgrade'
    } else if (accessLevel === 'preview') {
      // Entitlement dualism: CRM buyers keep access_level 'preview'. A CRM
      // online owner without a practical seat belongs in the upgrade state.
      try {
        const [ownsCrmOnline, ownsSeat] = await Promise.all([
          userOwnsCrm(email),
          userOwnsCrmPractical(email),
        ])
        if (ownsSeat) audience = 'enrolled'
        else if (ownsCrmOnline) audience = 'upgrade'
      } catch {
        // Degrade to 'new' — worst case a paid user sees the full-course CTA
        // and /upgrade (linked from /melbourne-nov7) still recognises them.
      }
    }
  }

  const earlyBird = CONFIG.COURSE.PRICE_EARLY_BIRD
  const cadence = `A practical day runs every quarter — ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} paid registrations confirm a city's date, with ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks' notice.`

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal-600 to-sky-500" />
        <div className="p-8">
          <p className="text-xs font-bold tracking-widest uppercase text-teal-700 mb-2">
            Concussion Education Australia
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {firstName ? `${firstName}, the` : 'The'} hands-on day — Q4 rounds
          </h1>

          {audience === 'upgrade' && (
            <>
              <p className="text-slate-600 mt-3">
                You&rsquo;ve done the online half. The in-person day completes your{' '}
                {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours — SCAT6, VOMS and BESS hands-on,
                exercise-test practicals, and case work with the group.
              </p>
              <p className="text-slate-900 font-semibold mt-4">
                Upgrade price: the difference to the Complete Course — nothing you&rsquo;ve paid is lost.
              </p>
            </>
          )}

          {audience === 'enrolled' && (
            <p className="text-slate-600 mt-3">
              You&rsquo;re enrolled with a practical seat. If a different city suits your next
              round better, register below and we&rsquo;ll count you toward its date.
            </p>
          )}

          {audience === 'new' && (
            <>
              <p className="text-slate-600 mt-3">
                The Complete Course — online modules plus the hands-on practical day
                ({CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours, ESSA and Osteopathy Australia recognised).
              </p>
              <p className="text-slate-900 font-semibold mt-4">
                A${earlyBird.toLocaleString()} early-bird, locked when you enrol.
              </p>
            </>
          )}

          <p className="text-sm text-slate-500 mt-3">{cadence}</p>

          <TrainCtas
            audience={audience}
            e={linkValid ? linkEmail : ''}
            t={linkValid ? linkToken : ''}
          />

          <p className="text-xs text-slate-400 mt-8">
            Secure Stripe checkout · tax invoice with payment · questions, just reply to Zac&rsquo;s email.
          </p>
        </div>
      </div>
    </main>
  )
}
