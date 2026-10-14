'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * OA National Conference band — the QR landing surface.
 *
 * The QR codes on the SUBMITTED deck point at /courses/byron-bay and
 * /courses/sydney. OA holds the late-September .pptx, so those destinations
 * cannot be changed; the only lever left is what the page says when someone
 * scans. Without this, a scanner in the room lands on exactly the page Google
 * shows a stranger, with nothing to say they are in the right place.
 *
 * ATTRIBUTION. /oa2026 tags its own traffic; these two pages were bare URLs,
 * so every Byron and Sydney signup the conference produced would have been
 * indistinguishable from organic search — for the two cities the conference
 * most needs to move. The CTA here carries src=oa2026-<city>, so a click from
 * this band is separable. It deliberately does NOT tag the whole page: an
 * organic visitor in the same week is not conference traffic, and pretending
 * otherwise would make the measurement worthless.
 *
 * WINDOW. Renders 14–31 October 2026 only — conference is the 16th, early
 * bird closes the 24th. Outside it the component returns null, so it cannot
 * be left stale on a public page after the event.
 *
 * Mounted client-side after hydration: the window is evaluated in the
 * browser's own clock, and a server/client date mismatch would otherwise
 * produce a hydration error on a page that must not break.
 */
const FROM = Date.UTC(2026, 9, 13, 13, 0, 0)  // 14 Oct 2026, 00:00 AEDT
const TO = Date.UTC(2026, 9, 31, 13, 0, 0)    // 1 Nov 2026, 00:00 AEDT

export function OaConferenceBand({ city, slug }: { city: string; slug: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const now = Date.now()
    const live = now >= FROM && now < TO
    setShow(live)
    if (live) trackEvent('oa_conference_band_view', { city: slug })
  }, [slug])

  if (!show) return null

  return (
    <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 px-5 py-4 text-left max-w-xl mx-auto">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">
        Osteopathy Australia National Conference
      </p>
      <p className="mt-1.5 mb-3 text-[14.5px] leading-relaxed text-slate-700">
        Scanned the code at the workshop? The next practical day is{' '}
        <strong className="text-slate-900">Melbourne, Saturday 7 November</strong>, and the
        conference discount is on it until 24 October. A refundable A$100 holds a {city} place
        instead, and counts in full toward whatever you enrol in.
      </p>
      {/* Melbourne leads, and it goes STRAIGHT to /oa2026 — the conference page
          that pushes 7 Nov and auto-applies the OA2026 discount at checkout.
          It used to point at /courses/melbourne, which then pointed at
          /melbourne-nov7, which then opened Stripe: three clicks to pay, and
          no discount at the end of them (owner 2026-10-13: "just click and
          pay"). /oa2026 is one click from here to the payment page.

          The $100 deposit for THIS city stays below, unchanged — Nov 7 is
          commit-or-don't, other cities and future dates are the deposit's job. */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Link
          href={`/oa2026?src=oa2026-${slug}`}
          onClick={() => void trackEvent('oa_conference_band_click', { city: slug, cta: 'melbourne' })}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center justify-center"
        >
          Melbourne 7 Nov — reserve a seat
        </Link>
        <Link
          href={`/pricing?src=oa2026-${slug}`}
          onClick={() => void trackEvent('oa_conference_band_click', { city: slug, cta: 'enrol' })}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center border border-teal-300 text-teal-800 hover:bg-teal-100/60 transition-colors"
        >
          See the course
        </Link>
      </div>
    </div>
  )
}
