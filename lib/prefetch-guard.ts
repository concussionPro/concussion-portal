import type { NextRequest } from 'next/server'

/**
 * Is this request a speculative prefetch rather than a deliberate navigation?
 *
 * WHY THIS EXISTS (2026-08-06, master clean register D + verification).
 *
 * Next prefetches a `<Link>` as soon as it enters the viewport. Several routes
 * in this app are GET handlers that GRANT ACCESS by setting a cookie —
 * /demo/essa, /demo/review-acsm and friends set `demo_key`, which unlocks the
 * private, gated CRM course. So merely SCROLLING to the bottom of a public
 * accreditation page (/acsm, /cases, /csep, /cep-uk, /hpcsa) handed the visitor
 * a reviewer key, and /ep-course/modules/1 then served thousands of characters
 * of paid module content. No click required.
 *
 * The same mechanism signed every visitor to /sst-trainer — the public patient
 * entry and PWA install target — in as "Clinic Demo", and fired
 * `demo_tour_start` once per pageview. That is THE conversion signal for the
 * ACC outreach, so the metric was counting scroll depth.
 *
 * TWO LAYERS, DELIBERATELY. The links carry `prefetch={false}`; this is the
 * belt-and-braces so a link added later, a crawler, or a browser preloader
 * cannot reintroduce it. Layer one lives at every call site and rots; layer two
 * lives at the single place that does the granting and cannot.
 *
 * This module exists because the first fix put the guard on ONE of ten
 * cookie-granting demo routes and treated the class as closed. A shared helper
 * means there is one implementation to reason about, and
 * `tests/prefetch-grant-guard.test.ts` fails if any route under app/demo/ ever
 * sets a cookie without calling it.
 *
 * A real click is a top-level navigation and carries none of these headers.
 */
export function isPrefetchRequest(req: NextRequest): boolean {
  const h = req.headers
  return (
    // Next's own App Router prefetch
    h.get('next-router-prefetch') === '1' ||
    // Chrome/Safari link prefetch and prerender
    (h.get('purpose') || '').toLowerCase() === 'prefetch' ||
    (h.get('x-purpose') || '').toLowerCase() === 'preview' ||
    // Speculation Rules API / Fetch Metadata (`prefetch`, `prefetch;prerender`)
    (h.get('sec-purpose') || '').toLowerCase().includes('prefetch')
  )
}
