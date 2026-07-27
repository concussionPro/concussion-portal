import { COMPETENCY_FINDINGS, COMPETENCY_HEADLINE, competencyCitations } from '@/lib/competency-evidence'

/**
 * The competency-gap evidence block — the published basis for why a scheme
 * supplier needs BOTH layers.
 *
 * Built for the ACC Concussion Services pitch (/acc, /clinical-suite/acc) and
 * reusable on Guild / clinic-group surfaces. It answers the buyer's real
 * question — "why isn't our existing team enough?" — with citations rather than
 * assertion, which is the only way to raise a competency argument about someone
 * else's clinicians without insulting them.
 *
 * DESIGN RULE for /acc (owner, repeatedly: "text mess"): structure, not prose.
 * This is a table of findings, each with its source, and one legend row. It is
 * deliberately not paragraphs.
 */
export function CompetencyGapEvidence({
  heading = 'The competency gap is documented, not asserted',
  className = '',
}: {
  heading?: string
  className?: string
}) {
  // CONTRAST RULE (owner 2026-07-27: table was gray-on-gray): dark header
  // band, slate-900 finding text, solid badges — nothing lighter than
  // slate-600 carries meaning.
  const answers: Record<string, { label: string; cls: string }> = {
    education: { label: 'Training layer', cls: 'bg-teal-700 text-white' },
    tooling: { label: 'Measured data', cls: 'bg-amber-600 text-white' },
    both: { label: 'Both layers', cls: 'bg-slate-800 text-white' },
  }

  return (
    <section className={className} aria-labelledby="competency-gap">
      <h2 id="competency-gap" className="text-xl font-extrabold tracking-tight text-slate-900">
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{COMPETENCY_HEADLINE}</p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_16px_36px_-24px_rgba(15,23,42,0.35)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200">
              <th scope="col" className="px-5 py-3">Published finding</th>
              <th scope="col" className="hidden px-5 py-3 sm:table-cell">What it means for a supplier</th>
              <th scope="col" className="px-5 py-3 whitespace-nowrap text-right sm:text-left">Closed by</th>
            </tr>
          </thead>
          <tbody>
            {COMPETENCY_FINDINGS.map((f, i) => {
              const a = answers[f.answeredBy]
              return (
                <tr key={i} className={`border-t border-slate-200 align-top ${i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}>
                  <td className="px-5 py-4">
                    <p className="m-0 text-[13.5px] font-bold leading-snug text-slate-900">{f.stat}</p>
                    <p className="m-0 mt-1.5 text-[11.5px] font-medium text-slate-500">
                      {f.citation.authors} ({f.citation.year}){' '}
                      <span className="italic">{f.citation.journal}</span> {f.citation.detail}
                    </p>
                    <p className="m-0 mt-2 text-[13px] leading-relaxed text-slate-700 sm:hidden">{f.framing}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-[13px] leading-relaxed text-slate-700 sm:table-cell">
                    {f.framing}
                  </td>
                  <td className="px-5 py-4 text-right sm:text-left">
                    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide ${a.cls}`}>
                      {a.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-900">Sources</p>
        <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
          {competencyCitations().map((c) => (
            <li key={c.doi} className="text-[12px] leading-snug text-slate-700">
              {c.authors} ({c.year}). {c.title}. <span className="italic">{c.journal}</span>, {c.detail}.{' '}
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-teal-700 underline underline-offset-2"
              >
                doi:{c.doi}
              </a>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-2.5 border-t border-slate-100 pt-2.5 text-[12px] leading-snug text-slate-600">
          These surveys describe a workforce whose training predates the current evidence — not a
          failure of diligence. That is precisely why competency has to be evidenced at the
          organisation level rather than assumed.
        </p>
      </div>
    </section>
  )
}
