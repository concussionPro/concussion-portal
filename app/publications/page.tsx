// HIDDEN / INTERNAL — Research & Publications.
// Kept hidden until the first real DOIs land: robots noindex+nofollow, NOT in
// SiteNav, NOT in sitemap.ts. To reveal: remove the robots block + add to nav/sitemap.
// QUALITY OVER QUANTITY: lists only genuinely achievable outputs (peer-reviewed
// journals + real-DOI reports). Data + statuses live in lib/publications.ts.
// Compliance: research/education framing — methods/provenance & comfort, never
// efficacy/diagnosis claims (TGA/AHPRA).
import { SiteNav } from '@/components/SiteNav'
import { publications, programOrder, type Publication, type PubStatus, type VenueType } from '@/lib/publications'

export const metadata = {
  title: 'Research & Publications — Concussion Education Australia',
  description:
    'Peer-reviewed and open research on concussion exercise rehabilitation, webcam oculomotor measurement, and visual comfort. Internal preview.',
  robots: { index: false, follow: false },
}

const STATUS: Record<PubStatus, { label: string; cls: string }> = {
  'in-preparation': { label: 'In preparation', cls: 'border-slate-300 bg-slate-100 text-slate-600' },
  preprint: { label: 'Preprint', cls: 'border-amber-300 bg-amber-50 text-amber-800' },
  'under-review': { label: 'Under review', cls: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  published: { label: 'Published', cls: 'border-teal-400 bg-teal-50 text-teal-800' },
}

const VENUE: Record<VenueType, string> = {
  'Peer-reviewed journal': 'text-teal-700',
  Preprint: 'text-amber-700',
  'Research report': 'text-slate-500',
}

function PubCard({ p }: { p: Publication }) {
  const s = STATUS[p.status]
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}>
          {s.label}
        </span>
        {p.primary && (
          <span className="inline-flex items-center rounded-full border border-slate-900/15 bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
            Primary
          </span>
        )}
        <span className={`text-[12px] font-medium ${VENUE[p.venueType]}`}>{p.venueType}</span>
      </div>
      <h3 className="mt-3 text-[16.5px] font-semibold leading-snug text-slate-900">
        {p.url ? (
          <a href={p.url} target="_blank" rel="noopener" className="hover:text-teal-700">
            {p.title}
          </a>
        ) : (
          p.title
        )}
      </h3>
      <p className="mt-2 text-[13px] text-slate-500">
        {p.authors} · <span className="italic">{p.venue}</span> · {p.year}
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{p.summary}</p>
    </li>
  )
}

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Internal preview — goes public as DOIs land
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Research &amp; Publications
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          A focused, methods-first research programme behind Concussion Education Australia&apos;s clinical tools —
          spanning concussion exercise rehabilitation, webcam-based oculomotor measurement, and visual comfort.
          The discipline throughout is deliberate: we describe what our tools <em>do</em> and verify <em>how</em>,
          and reserve efficacy and diagnostic claims for the regulated clinical-evidence track. Quality over quantity —
          only genuinely achievable, peer-reviewed or openly-citable outputs are listed.
        </p>

        {programOrder.map((prog) => {
          const items = publications.filter((p) => p.program === prog)
          if (!items.length) return null
          return (
            <section key={prog} className="mt-10">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">{prog}</h2>
              <ul className="mt-4 space-y-4">
                {items.map((p) => (
                  <PubCard key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )
        })}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Research in progress</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
            Beyond the work above, further analyses are underway — including secondary-data feasibility studies and,
            subject to ethics review, retrospective observational outcome work on de-identified routine clinical care.
            These are listed here only once they reach preprint or submission, never before.
          </p>
        </section>

        <p className="mt-8 text-center text-[12px] text-slate-400">
          Z. Lewis — Osteopath &amp; clinician-researcher · ORCID 0009-0002-4267-0451 · Concussion Education Australia
        </p>
      </main>
    </div>
  )
}
