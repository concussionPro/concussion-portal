'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GraduationCap, HeartPulse, ArrowRight, Check } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import CcmPricingContent from '@/components/pricing/CcmPricingContent'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { CONFIG, upgradePriceFor } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * /pricing — TABBED BY STREAM.
 *
 * WHY (owner, 2026-08-07: "a pricing page should clearly show pricing for each
 * stream… why isn't the page tabbed for each stream?").
 *
 * This page sold ONE course. Measured on the live page the same day: the words
 * "Concussion Rehab", "Exercise Physiolog" and "ESSA" appeared NOWHERE on it.
 * An exercise physiologist landing on the page people arrive at to buy saw a
 * physio/osteo course, no sign the ESSA-accredited stream existed, and left.
 *
 * My first two attempts bolted a CRM signpost onto the CCM page — first below
 * the value bento (~60% down, so an EP read the entire CCM pitch before finding
 * out they were on the wrong page), then as a one-line fork. Both were patches
 * on the wrong shape. The page needed to present TWO STREAMS, not one course
 * with a footnote.
 *
 * Both stream bodies already existed and already work — CcmPricingContent and
 * CrmPricingContent each run their own live Stripe checkout on their own pages,
 * and both already accept `hideNav` for exactly this kind of embedding. So this
 * is a chooser over two working components, not a rebuild of a payment flow.
 * The homepage uses the same two-stream pattern; this brings /pricing in line.
 *
 * ?stream=crm deep-links the EP tab, so outreach and the ESSA listing can point
 * straight at it. The tab is reflected in the URL without a navigation, so the
 * back button and a shared link both behave.
 */

type Stream = 'ccm' | 'crm'

const STREAMS: Array<{
  id: Stream
  code: string
  name: string
  audience: string
  icon: typeof GraduationCap
  endorse: string
  blurb: string
  credential: string
  chips: string[]
}> = [
  {
    id: 'ccm',
    code: 'CCM',
    name: 'Concussion Clinical Mastery',
    audience: 'Physios, osteos, chiros & GPs',
    icon: GraduationCap,
    endorse: 'Osteopathy Australia endorsed',
    blurb: 'Assess, diagnose and manage concussion — SCAT6, VOMS and BESS, return-to-play and phenotype rehab.',
    credential: 'Curriculum aligned to the Amsterdam International Consensus on Concussion in Sport (2023) and the SCAT6/SCOAT6 standard · taught by Zac Lewis, Osteopath',
    chips: ['Phenotype rehab', 'Cranial nerve', 'Cervical exam', 'VOMS', 'Persistent PCS', 'Return-to-play'],
  },
  {
    id: 'crm',
    code: 'CRM',
    name: 'Concussion Rehab Mastery',
    audience: 'Exercise physiologists',
    icon: HeartPulse,
    endorse: CONFIG.FEATURES.ESSA_ACCREDITED ? 'ESSA accredited' : 'Built to ESSA CPD standards',
    blurb: 'Prescribe the exercise rehab that moves recovery — measured-threshold aerobic training, in EP scope.',
    credential: 'First-line treatment per the Amsterdam 2023 consensus · protocol published open-access · delivered and documented by SST Trainer',
    chips: ['BCTT & HRt', 'Sub-threshold Rx', 'Graded return-to-activity', 'Phenotype reconditioning', 'Symptom-titrated dosing', 'Red-flag triage'],
  },
]

function PricingTabs() {
  const params = useSearchParams()
  const router = useRouter()
  const [stream, setStream] = useState<Stream>('ccm')

  // Deep link support. Read once on mount rather than deriving on every render
  // so switching tabs does not fight the URL.
  useEffect(() => {
    if (params.get('stream') === 'crm') setStream('crm')
  }, [params])

  function choose(next: Stream) {
    if (next === stream) return
    setStream(next)
    trackEvent('pricing_stream_switch', { stream: next })
    // replace, not push — the tab is a view of one page, and pushing would
    // make the back button walk through tab states instead of leaving.
    router.replace(next === 'crm' ? '/pricing?stream=crm' : '/pricing', { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[120px] pb-2">
        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Course pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Two streams. Choose the one that matches your registration.
          </p>
        </div>

        {/* The chooser — same visual language as the homepage stream cards
            (white card, teal-tinted icon chip, CODE eyebrow, generous radius),
            because that pattern already reads well and users meet it first.

            SELECTED STATE, rebuilt 2026-08-07. The first version tinted the
            active card with bg-accent/[0.07] — 7% opacity — and greyed the
            inactive icon. Owner: "these are not obvious enough or are too
            washed out." Correct: at 7% the two cards were near-identical, so
            the control did not look like a control. Now the active tab carries
            a 2px accent ring, a filled accent icon chip, a lifted shadow and an
            explicit "Viewing" flag; the inactive one stays white with a plain
            border and a tinted-not-grey icon, so it reads as available rather
            than disabled. */}
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] mb-4">
          Two CPD streams — choose yours
        </p>
        <div role="tablist" aria-label="Course stream" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {STREAMS.map((s) => {
            const active = s.id === stream
            const Icon = s.icon
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={active}
                onClick={() => choose(s.id)}
                className={[
                  'w-full flex items-center gap-4 rounded-[26px] px-5 py-4 text-left transition-all bg-white',
                  active
                    ? 'border-2 border-[var(--accent)] shadow-lg'
                    : 'border border-[rgba(13,115,119,0.14)] shadow-sm hover:shadow-md hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex-none w-12 h-12 rounded-full grid place-items-center transition-colors',
                    active ? 'bg-[var(--accent)]' : 'bg-[rgba(13,115,119,0.08)]',
                  ].join(' ')}
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-[var(--accent)]'}`} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[var(--accent)]">{s.code}</span>
                    {active && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white bg-[var(--accent)] rounded-full px-2 py-[3px]">
                        Viewing
                      </span>
                    )}
                  </span>
                  <span className="block text-[16px] font-bold leading-tight text-[var(--foreground)]">{s.name}</span>
                  <span className="block text-[12.5px] leading-tight mt-0.5 text-[var(--muted-foreground)]">
                    {s.audience} · {s.endorse}
                  </span>
                </span>
                {!active && <ArrowRight className="w-4 h-4 flex-none text-[var(--accent)]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* TITLE / DESCRIPTION — rendered HERE, not taken from the stream body.
          The body's own heading lives inside a .text-center.mb-8 wrapper that
          is 1,882px tall and holds twelve children including the workshop
          photo, so it is not a title block at all. Every attempt to reorder or
          hide "the hero" hit that: ordering it first pushed the price to
          2,289px, and hiding it once removed the pricing cards outright.
          Rendering the title at page level sidesteps the whole problem and
          keeps the required order exact. */}
      {(() => {
        const st = STREAMS.find((x) => x.id === stream)!
        return (
          <div className="max-w-3xl mx-auto px-6 text-center mt-6 mb-6">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">{st.name}</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">{st.blurb}</p>
            {/* Credential line + skill chips + the upgrade note live HERE, with
                the title, as ONE section (owner 2026-08-07: "put this info UNDER
                THE TITLE. ITS ONE SECTION"). They used to render from inside the
                body's hero wrapper, which — with the title now drawn at page
                level — left them floating mid-page between the trust icons and
                the price, attached to nothing. */}
            <p className="text-[12px] text-muted-foreground max-w-2xl mx-auto mt-3">{st.credential}</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3">
              {st.chips.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-accent/[0.08] border border-accent/20 px-2.5 py-1 text-[12px] font-semibold text-accent">
                  <Check className="w-3 h-3" strokeWidth={3} />{c}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ORDER: streams -> title/description (above) -> PRICING -> LOCATIONS ->
          everything else. Flex `order` on the stream body; the only JSX change
          in the components is a `stream-body` class on their container.
          The body's own duplicate h1 and its lead paragraph are hidden, since
          the title above replaces them. */}
      <style>{`
        /* ORDER, and it is the whole layout of this page:
             1 title (drawn at page level, above)
             2 workshop photo — the single strongest proof the day is real
             3 price cards
             4 locations
             5 everything else
           Owner 2026-08-10: photo under the title and above the cards, then
           locations. The photo used to inherit order 5 from its wrapper and
           landed BELOW the locations, buried under a team-inquiry panel. */
        .pricing-embed .stream-body { display: flex; flex-direction: column; }
        .pricing-embed .stream-body > * { order: 5; }
        .pricing-embed .stream-body > #workshop-photo { order: 2; }
        .pricing-embed .stream-body > #pricing-cards { order: 3; }
        .pricing-embed .stream-body > #workshop-locations { order: 4; }
        /* The hero wrapper still holds the h1, subtitle, credential, chips and
           upgrade note that the page-level title now replaces. */
        .pricing-embed .stream-body > .text-center.mb-8 > :nth-child(-n+5) { display: none; }
        /* Give the white cards something to sit on — the page was white boxes
           on a white background. */
        .pricing-embed .stream-body > #pricing-cards {
          background: linear-gradient(180deg, rgba(13,115,119,0.05), rgba(13,115,119,0.02));
          border: 1px solid rgba(13,115,119,0.10);
          border-radius: 28px; padding: 26px 20px 30px;
        }
      `}</style>
      <div className="pricing-embed">
        {stream === 'ccm' ? <CcmPricingContent hideNav /> : <CrmPricingContent hideNav />}
      </div>

      {/* THE PRACTICAL PROMISE.
          It answers "will I ever actually get the practical day?" — the
          objection that makes a browser register instead of buy — and it sits
          BELOW the location cards because putting it under the title pushed
          the price below the fold, which is the one rule this page has.

          It states the CADENCE, never a date. The version pulled on 2026-08-10
          named "Melbourne on 31 October, then Sydney and Byron Bay in November"
          when no venue was booked for any of them, and it was a hardcoded
          literal contradicting CONFIG.LOCATIONS besides.

          A day runs every quarter — that is a standing commitment and it holds
          without a venue, so it is what the page promises. Specific dates
          belong to the location cards, which derive them from CONFIG.LOCATIONS
          and show them only once a round is confirmed. Do not put a date here. */}
      <div className="max-w-3xl mx-auto px-6 pb-10 -mt-2">
        <div className="rounded-xl border border-accent/30 bg-accent/[0.06] px-4 py-3 text-center">
          <p className="m-0 text-[13.5px] sm:text-sm text-foreground leading-relaxed">
            <strong className="font-bold">A practical day runs every quarter.</strong>{' '}
            <span className="text-muted-foreground">
              Dates are announced city by city as venues are confirmed — you are not waiting for a
              city to reach a number before one is scheduled.
            </span>
          </p>
          <p className="m-0 mt-1.5 text-[13.5px] sm:text-sm text-foreground leading-relaxed">
            <strong className="font-bold">Start online, add the day whenever suits.</strong>{' '}
            <span className="text-muted-foreground">
              Upgrade later for the difference (${upgradePriceFor(null)}) at the early-bird rate — it
              never expires, and it works at whichever day you go to.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingTabs />
    </Suspense>
  )
}
