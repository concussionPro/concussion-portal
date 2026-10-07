import { NextRequest, NextResponse } from 'next/server'
import { backfillAcquisition } from '@/lib/acquisition'

/**
 * Nightly attribution repair.
 *
 * recordAcquisition is called from exactly one place in the product — the
 * Stripe webhook — so only BUYERS ever got a source. Measured 2026-10-07:
 * 95% of users created after the one-off 2026-09-30 backfill carried no
 * acquisition_source at all, which makes "where do customers come from"
 * unanswerable for everyone who has not yet paid, i.e. the whole top of the
 * funnel we are trying to optimise.
 *
 * The data was never lost: getVisitorContext() stamps `firstReferrer` onto
 * every client event. This promotes it onto the user row.
 *
 * recordAcquisition is WRITE-ONCE (it only updates rows where
 * acquisition_source IS NULL), so this is idempotent and can never rewrite an
 * origin that is already recorded.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { scanned, filled } = await backfillAcquisition()
    if (filled > 0) console.log(`[acquisition] nightly repair filled ${filled} of ${scanned} unattributed users`)
    return NextResponse.json({ ok: true, scanned, filled })
  } catch (err) {
    console.error('[acquisition] nightly repair failed:', err)
    return NextResponse.json({ error: 'backfill failed' }, { status: 500 })
  }
}
