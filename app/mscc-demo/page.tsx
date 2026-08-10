import type { Metadata } from 'next'

/**
 * MSCC LIVE-DEMO NAVIGATOR — the surface used during the call.
 *
 * Built for one job: a URL that can be shared on a screenshare, navigated in
 * one click per section, and browsed by the other side afterwards without
 * anyone needing a login.
 *
 * Every case below is SYNTHETIC and non-identifying — initials, age band, sex,
 * and enough context to explain the presentation. They read as records because
 * that is what makes a demo land, and they belong to nobody.
 *
 * Ordered to the beat sheet rather than to the product's own architecture: what
 * the room needs to see, in the order the argument runs. The adherence case is
 * first and largest because prescribed-is-not-performed is the beat this room
 * (clinicians, not doctors) is here for, and the one nothing else in this
 * market can show.
 *
 * noindex — internal, and it names a prospect.
 */

export const metadata: Metadata = {
  title: 'SST — live demo',
  robots: { index: false, follow: false },
}

const BEATS = [
  {
    n: 1,
    beat: 'Prescribed is not performed',
    who: 'Ben · Joseph',
    title: 'R.K. — 31F, recreational netball',
    line: 'Adherent on paper. Four of thirteen sessions above band, two entered by hand rather than measured, two next-day flares — and the threshold moves 124 → 131 in four weeks.',
    punch: 'Without the delivered-dose record, the notes read “adherent”.',
    href: '/api/sst/report?code=DEMO00&patient=demo&case=adherence',
    primary: true,
  },
  {
    n: 2,
    beat: 'The report is the product',
    who: 'Joseph — club-side',
    title: 'M.T. — 24M, community football',
    line: 'Textbook response. Threshold 128 → 142 → 155, cleared on re-test, every session verified against the band.',
    punch: 'The rehab clinician signs this, it attaches to the file, and clearance is made on evidence rather than a message thread.',
    href: '/api/sst/report?code=DEMO00&patient=demo&case=recovery',
  },
  {
    n: 3,
    beat: 'The plateau you cannot see without a threshold',
    who: 'Tim · Jess',
    title: 'D.P. — 17M, school rugby',
    line: 'Delivered exactly as prescribed — in band, verified, no flares — and flat from week three.',
    punch: 'The argument for re-assessment rather than more of the same dose.',
    href: '/api/sst/report?code=DEMO00&patient=demo&case=stalled',
  },
]

const SURFACES = [
  { label: 'Clinician hub — the roster', href: '/clinical-hub?clinic=DEMO00', note: 'Every patient on the code, their measured threshold, band and trajectory.' },
  { label: 'The platform itself', href: '/clinical-suite', note: 'What a clinic licences, and what it costs.' },
  { label: 'Published protocol (CC BY)', href: 'https://doi.org/10.5281/zenodo.21482633', note: 'The method is open. The instrumentation is what you licence.', external: true },
]

export default function MsccDemoPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <header className="flex flex-col gap-2">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            Prepared for MSCC · Melbourne Sports Concussion Clinic
          </p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            SST — live demo
          </h1>
          <p className="m-0 max-w-[62ch] text-[14px] leading-relaxed text-muted-foreground">
            A standardised delivery, verification and documentation platform for sub-symptom
            threshold exercise rehabilitation. Every session is prescribed against an objective
            threshold and verified against heart-rate data — so the by-product of routine care is
            registry-grade outcome data.
          </p>
          <p className="m-0 max-w-[62ch] rounded-lg border border-accent/25 bg-accent/[0.05] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Every case below is a synthetic record built to show what a completed episode looks
            like in the system. No patient data.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          {BEATS.map((b) => (
            <a
              key={b.n}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'group flex flex-col gap-1.5 rounded-2xl bg-white p-5 no-underline shadow-sm transition-shadow hover:shadow-md',
                b.primary ? 'ring-2 ring-accent' : 'ring-1 ring-[#dcebeb]',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-[11px] font-bold tabular-nums text-[#a5b8b9]">
                  {String(b.n).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-accent">
                  {b.beat}
                </span>
                <span className="ml-auto text-[11.5px] text-[#7d9598]">{b.who}</span>
              </div>
              <p className="m-0 text-[16px] font-bold leading-tight text-foreground">{b.title}</p>
              <p className="m-0 text-[13.5px] leading-relaxed text-muted-foreground">{b.line}</p>
              <p className="m-0 mt-0.5 text-[13.5px] font-semibold leading-relaxed text-foreground">
                {b.punch}
              </p>
              <span className="mt-1 text-[12.5px] font-bold text-accent group-hover:underline">
                Open the report →
              </span>
            </a>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7d9598]">
            Everything else
          </p>
          {SURFACES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex items-baseline justify-between gap-4 rounded-xl bg-white px-4 py-3 no-underline ring-1 ring-[#dcebeb] transition-shadow hover:shadow-sm"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-foreground">{s.label}</span>
                <span className="text-[12.5px] text-muted-foreground">{s.note}</span>
              </span>
              <span className="flex-none text-[13px] font-bold text-accent">→</span>
            </a>
          ))}
        </section>

        <footer className="rounded-xl border border-[#dcebeb] bg-white p-4">
          <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">What we would put to Zee, Omer and Paul:</strong> a
            founding-site registry — zero cost either direction, co-authorship, your patients&rsquo;
            data validated across both entities alongside the sites we are adding. Session-level
            delivered dose against next-day symptoms is a gap in the literature, and you would be
            generating it as a by-product of care.
          </p>
        </footer>
      </div>
    </main>
  )
}
