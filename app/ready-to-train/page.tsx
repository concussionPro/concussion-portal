import type { Metadata } from 'next'
import Link from 'next/link'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import ReadyToTrainInterest from './ReadyToTrainInterest'

/**
 * /ready-to-train — where a city's practical day is up to.
 *
 * WHY THIS EXISTS (2026-08-06). `POST /api/ready-to-train` and
 * `POST /api/register-interest` both existed and both worked; the PAGE did not.
 * `/ready-to-train` returned 404, and no surface anywhere showed a visitor what
 * a city was collecting toward. Measured consequence: 32 people had registered
 * interest in a city (Sydney 7, Melbourne 13 for a next round, WA 6, Byron 3,
 * Adelaide 3) and the `workshop_ready_to_train` pool was EMPTY — because the
 * only route into it required already owning the course.
 *
 * So the answer to "why is nobody registering for upcoming dates" was: there
 * was nowhere to do it, and nothing told them how close a city was.
 *
 * HONESTY RULES THIS PAGE MUST KEEP (CLAUDE.md):
 *  - Never state or imply a date that is not in CONFIG.LOCATIONS. Every city
 *    here is `collecting` with no date, and the copy says exactly that.
 *  - Counts must be literally true. They are read live, and a city is only
 *    given a number once it reaches SHOW_COUNT_FROM — below that the number
 *    reads as emptiness rather than momentum (feedback_ladder_first_momentum),
 *    so the city is shown without one rather than with a fake floor.
 *  - No fake scarcity. There is no "seats left" here, because there are no
 *    seats until a date exists.
 */

export const metadata: Metadata = {
  title: 'Practical day — where each city is up to',
  description:
    'Which Australian cities are closest to a confirmed Concussion Clinical Mastery practical day, and how to put your name down for yours.',
  alternates: { canonical: `${CONFIG.SEO.SITE_URL}/ready-to-train` },
}

/** Below this, a raw number reads as "nobody wants this" rather than momentum. */
const SHOW_COUNT_FROM = 5

// The page reads live counts, so it must not be statically frozen at build.
export const dynamic = 'force-dynamic'

type CityRow = {
  slug: string
  city: string
  paid: number
  interested: number
  total: number
}

async function loadCities(): Promise<CityRow[]> {
  const collecting = Object.values(CONFIG.LOCATIONS).filter(
    (l) => l.status === 'collecting' || l.status === 'completed',
  )

  let paidRows: Array<{ city: string; n: number }> = []
  let interestRows: Array<{ city: string; n: number }> = []
  try {
    const paid = await sql<{ city: string; n: number }>`
      SELECT workshop_location AS city, COUNT(*)::int AS n
      FROM users
      WHERE access_level = 'full-course'
        AND workshop_location IS NOT NULL
        AND COALESCE(is_test, false) = false
      GROUP BY 1
    `
    paidRows = paid.rows
    const interest = await sql<{ city: string; n: number }>`
      SELECT city, COUNT(DISTINCT LOWER(email))::int AS n
      FROM workshop_interest
      GROUP BY 1
    `
    interestRows = interest.rows
  } catch {
    // A reporting page must never 500 the visitor out of the form below it.
    // Zero counts simply render as "collecting names" — which is still true.
  }

  const paidBy = new Map(paidRows.map((r) => [r.city, r.n]))
  const interestBy = new Map(interestRows.map((r) => [r.city, r.n]))

  return collecting
    .map((loc) => {
      const paid = paidBy.get(loc.slug) ?? 0
      const interested = interestBy.get(loc.slug) ?? 0
      return { slug: loc.slug, city: loc.city, paid, interested, total: paid + interested }
    })
    .sort((a, b) => b.total - a.total)
}

export default async function ReadyToTrainPage() {
  const cities = await loadCities()
  const threshold = CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-16">
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          The practical day — where each city is up to
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          The hands-on day runs when a city has enough people to fill it —{' '}
          <strong className="text-foreground">{threshold} confirmed places</strong>. No city below has a
          date yet, and we don&apos;t schedule one until it does, because a half-full room is a worse
          day for everyone in it. Put your name down and you&apos;ll be told the moment yours is set,
          with at least {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&apos; notice.
        </p>

        <div className="space-y-3 mb-10">
          {cities.map((c) => {
            const showCount = c.total >= SHOW_COUNT_FROM
            const pct = Math.min(100, Math.round((c.paid / threshold) * 100))
            return (
              <div key={c.slug} className="rounded-xl border border-border p-5">
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <h2 className="text-lg font-bold text-foreground">{c.city}</h2>
                  <span className="text-xs text-muted-foreground">
                    {showCount
                      ? `${c.paid} of ${threshold} places confirmed`
                      : 'Collecting names'}
                  </span>
                </div>
                {showCount && (
                  <>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden mb-2">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      {c.interested > 0 && (
                        <>
                          {c.interested} more {c.interested === 1 ? 'clinician has' : 'clinicians have'} asked
                          to be told when {c.city} is scheduled.{' '}
                        </>
                      )}
                      {c.paid >= threshold
                        ? 'This city has the numbers — a date is being set.'
                        : `${threshold - c.paid} more confirmed ${threshold - c.paid === 1 ? 'place' : 'places'} and it runs.`}
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <ReadyToTrainInterest cities={cities.map((c) => ({ slug: c.slug, city: c.city }))} />

        <div className="mt-10 rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground mb-1">
            Want to start now rather than wait?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            The {CONFIG.COURSE.ONLINE_CPD_POINTS} online CPD hours don&apos;t depend on a date — you can
            begin today and add the practical day whenever your city runs.
          </p>
          <Link href="/pricing" className="text-sm font-semibold text-accent hover:underline">
            See enrolment options →
          </Link>
        </div>
      </div>
    </div>
  )
}
