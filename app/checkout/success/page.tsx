import { redirect } from 'next/navigation'
import { retrieveCheckoutSession } from '@/lib/stripe'
import SuccessClient from './SuccessClient'

// Force server render every time — never serve a cached HTML to someone
// hitting a stale URL. (Next would still cache on the edge otherwise.)
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * /checkout/success — gate the render on a real, paid Stripe session.
 *
 * Previously this was purely a client component, so any hit (bot, stale
 * bookmark, refresh, direct visit) rendered and counted as a pageview —
 * success-page views were running ~6× the actual purchase count, breaking
 * conversion analytics.
 *
 * Now: validate the session_id against Stripe server-side BEFORE any HTML
 * is emitted. If missing/invalid/unpaid/old → redirect to /pricing.
 * GA therefore only records success pageviews for verified buyers.
 *
 * Window: 4 hours matches the /api/checkout-session retrieval window
 * (accommodates Afterpay/Klarna delayed "paid" transitions).
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId || !sessionId.startsWith('cs_')) {
    redirect('/pricing')
  }

  try {
    const session = await retrieveCheckoutSession(sessionId)
    if (!session) {
      redirect('/pricing')
    }

    // Accept 'paid' (card) and 'unpaid' (BNPL — Afterpay/Klarna redirect here
    // before capture). Reject 'no_payment_required' and anything else.
    const paymentOk = session.payment_status === 'paid' || session.payment_status === 'unpaid'
    if (!paymentOk) {
      redirect('/pricing')
    }

    // Session must also have completed the checkout flow — 'open' means the
    // visitor landed here without actually finishing payment
    if (session.status !== 'complete') {
      redirect('/pricing')
    }

    // Reject stale links (>4h) so refreshes after a day don't re-count.
    // This is a SERVER component: it runs once per request, and freshness is
    // exactly what we're measuring — reading the clock here is correct, not an
    // impure render. (The lint rule can't distinguish server from client.)
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now()
    const createdAtMs = (session.created || 0) * 1000
    if (nowMs - createdAtMs > 4 * 60 * 60 * 1000) {
      redirect('/pricing')
    }
  } catch (err) {
    // retrieveCheckoutSession throws on bad IDs / Stripe errors — next/navigation
    // redirects ALSO throw, so re-throw those. Only redirect on real errors.
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }
    console.error('[checkout/success] Stripe validation failed:', err)
    redirect('/pricing')
  }

  return <SuccessClient />
}
