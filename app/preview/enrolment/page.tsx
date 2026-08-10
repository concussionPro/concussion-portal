import type { Metadata } from 'next'
import { CONFIG, upgradePriceFor } from '@/lib/config'

/**
 * REVIEW PAGE for the proposed enrolment-structure changes.
 *
 * Same contract as /preview/animations: nothing is implemented until it has
 * been seen here and approved. The difference is that these changes touch
 * SELLING surfaces on a live site, so each card states what exists today —
 * read from CONFIG, not from memory — beside what is proposed.
 *
 * Reading current state from CONFIG matters: the last review of this material
 * described "three announced dates" that do not exist. Every "today" column
 * below is the real value the site is serving right now.
 */

export const metadata: Metadata = {
  title: 'Enrolment structure — review',
  robots: { index: false, follow: false },
}

type Change = {
  id: string
  title: string
  today: string
  proposed: string
  why: string
  work: string
  risk?: string
}

const locations = Object.values(CONFIG.LOCATIONS)
const collecting = locations.filter((l) => l.status === 'collecting')
const confirmed = locations.filter((l) => l.status === 'confirmed')

const CHANGES: Change[] = [
  {
    id: 'dates',
    title: 'Set Melbourne 31 October',
    today: `${confirmed.length} confirmed date${confirmed.length === 1 ? '' : 's'} exist. ${collecting.length} cities are 'collecting' with empty date fields; Melbourne is 'completed' (ran 13 June).`,
    proposed:
      "Melbourne → status 'confirmed', 31 Oct 2026, and ROUND_START bumped so the seat counter scopes to this round rather than counting June's alumni.",
    why:
      'Every other change and the whole email campaign point at this date. Until it is set, the first click from the blast lands on a page that does not know the date exists.',
    work: 'CONFIG only. No new code.',
    risk:
      'BLOCKING. Nothing else should ship before this, and no email should send before it.',
  },
  {
    id: 'earlybird',
    title: 'State the early-bird cutoff in the campaign',
    today: `Early bird ($${CONFIG.COURSE.PRICE_EARLY_BIRD}) closes ${CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a confirmed date. For 31 Oct that is 17 October, after which checkout charges $${CONFIG.COURSE.PRICE_REGULAR}.`,
    proposed:
      `Campaign copy reads "$${CONFIG.COURSE.PRICE_EARLY_BIRD} until 17 October, $${CONFIG.COURSE.PRICE_REGULAR} after" — or the campaign closes before mid-October and price is never restated in follow-ups.`,
    why:
      'A flat "$1,190" in an email that is still being read on 20 October promises a price the checkout will not honour. That is an Australian Consumer Law problem, not a typo — and the deadline is free urgency currently going unused.',
    work: 'Copy only.',
    risk: 'Legal. Fix before send, not after.',
  },
  {
    id: 'cpd',
    title: 'State CPD once, unambiguously',
    today: `Online ${CONFIG.COURSE.ONLINE_CPD_POINTS} · practical ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} · total ${CONFIG.COURSE.TOTAL_CPD_POINTS}. The draft email says "8 CPD points" in one place and "16 CPD" in another.`,
    proposed:
      `One line, derived from CONFIG, never hardcoded: "${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online · ${CONFIG.COURSE.TOTAL_CPD_POINTS} with the practical day."`,
    why:
      'Both numbers are correct, but side by side in one email they read as an error and invite a query you do not want from an accredited-PD buyer.',
    work: 'Copy only.',
  },
  {
    id: 'interest',
    title: 'Retire the free interest form',
    today:
      'A free "register your interest" form is the primary capture on the workshop surfaces. Free interest converts to a seat at roughly 5–15%.',
    proposed:
      'Two paid ways in (book the date, or start online and upgrade later) plus an honestly-labelled free tier — the newsletter and the free SCAT course. No "waitlist" framing anywhere.',
    why:
      'A form row is not a warm lead. Someone unwilling to buy the $497 online course was never going to fly to a practical day — better to find that out now than in March.',
    work: 'Copy + one route retired. The nomination pipeline stays; it is fed by purchases instead of forms.',
  },
  {
    id: 'quarterly',
    title: 'Quarterly and guaranteed, rotating nationally',
    today:
      `${collecting.length} city cards, each 'collecting' with no date, each implying a local day that will happen when numbers appear. Threshold to confirm is ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}.`,
    proposed:
      'One promise: a practical day runs every quarter, guaranteed, rotating between Sydney, Melbourne, Brisbane/GC and Byron. City announced ~10 weeks out, placed where the paid cohort clusters.',
    why:
      'Guaranteeing the QUARTER rather than the city is the only version that is honestly guaranteeable — you choose the city with the most committed buyers, so there is nothing to cancel. It also removes the trust ask: nobody is buying a future in a city that may never run.',
    work: 'Locations UI + copy. The upgrade credit already exists and never expires, so no new SKU and no deposit mechanic.',
    risk:
      'Say plainly that rotation means each city gets a day roughly once a year, and travel is expected. Implying local access is what generates refund requests.',
  },
  {
    id: 'states',
    title: 'Fill states, never raw counts',
    today: `Cap is ${CONFIG.WORKSHOP.CAPACITY_PER_COURSE}. Surfaces can show a live registrant count.`,
    proposed:
      'Under 50% — say nothing. 50–75% — "filling". 9–11 of 12 — "final seats" / "3 seats left". 12 — "full, waitlist for the next quarter".',
    why:
      'Never publish a number that argues against buying. "2 registered" is an anti-advertisement, and a count only becomes persuasive once it is nearly full.',
    work: 'Small component change wherever the counter renders.',
    risk:
      'At realistic volume a quarter yields roughly 8 against a cap of 12, so "full" may not display for a long time. "Filling" is the state you will actually live in — do not build the strategy around the full badge.',
  },
  {
    id: 'module8',
    title: 'Module-8 completion fires the upgrade offer',
    today:
      `The upgrade exists at $${upgradePriceFor(null)} with no deadline, but nothing prompts it. A completer has to go looking.`,
    proposed:
      'Completing module 8 triggers the practical upgrade offer with the next quarterly date, in the completer’s own inbox.',
    why:
      'This is the only real build in the list, and it is the one that converts. A student who has just finished eight modules is at their highest intent and currently receives nothing. Jayden is the proof case — completed all eight and had to chase it himself.',
    work: 'One trigger on the existing completion event, one template.',
  },
]

export default function EnrolmentReviewPage() {
  return (
    <main className="min-h-screen bg-[#f4f8f8] px-5 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <header className="flex flex-col gap-2">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d7377]">
            Internal review · nothing implemented
          </p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#16282b] sm:text-3xl">
            Enrolment structure — proposed changes
          </h1>
          <p className="m-0 max-w-[64ch] text-[14px] leading-relaxed text-[#4a6a6e]">
            Every &ldquo;today&rdquo; below is read from CONFIG at render time, not from memory — so
            this page cannot describe a state the site is not actually serving.
          </p>
          <p className="m-0 max-w-[64ch] rounded-lg border border-[#e0c3ad] bg-[#fbf0e8] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#6b3a1c]">
            <strong>Two are blocking and both are cheap:</strong> the Melbourne date is not in the
            system, and the campaign price becomes false on 17 October. Neither is a build.
          </p>
        </header>

        {CHANGES.map((c, i) => (
          <section
            key={c.id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#dcebeb]"
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-[11px] font-bold tabular-nums text-[#a5b8b9]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="m-0 text-[16px] font-bold text-[#16282b]">{c.title}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#e6dede] bg-[#faf7f6] px-3.5 py-3">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a7a6a]">
                  Today
                </p>
                <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#5c4a44]">{c.today}</p>
              </div>
              <div className="rounded-lg border border-[#cfe3e4] bg-[#f2f9f9] px-3.5 py-3">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em] text-[#0d7377]">
                  Proposed
                </p>
                <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#2c5457]">{c.proposed}</p>
              </div>
            </div>

            <p className="m-0 text-[13px] leading-relaxed text-[#4a6a6e]">
              <strong className="text-[#16282b]">Why:</strong> {c.why}
            </p>
            <p className="m-0 text-[12.5px] text-[#7d9598]">
              <strong className="text-[#4a6a6e]">Work:</strong> {c.work}
            </p>
            {c.risk && (
              <p className="m-0 rounded-lg border border-[#e0c3ad] bg-[#fbf0e8] px-3 py-2 text-[12.5px] leading-relaxed text-[#6b3a1c]">
                <strong>Watch:</strong> {c.risk}
              </p>
            )}
          </section>
        ))}

        <footer className="rounded-xl border border-[#dcebeb] bg-white p-4">
          <p className="m-0 text-[13px] leading-relaxed text-[#4a6a6e]">
            <strong className="text-[#16282b]">Not proposed, deliberately:</strong> a $150 refundable
            deposit, a per-city paid-pool counter, and a new Stripe SKU. The practical upgrade already
            exists at ${upgradePriceFor(null)} with no expiry — the &ldquo;credit&rdquo; is that
            upgrade with clearer words on it, so most of this is copy rather than code.
          </p>
        </footer>
      </div>
    </main>
  )
}
