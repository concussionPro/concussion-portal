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
  const answers: Record<string, { label: string; cls: string }> = {
    education: { label: 'Training layer', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
    tooling: { label: 'Measured data', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    both: { label: 'Both layers', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  }

  return (
    <section className={className} aria-labelledby="competency-gap">
      <h2 id="competency-gap" className="text-xl font-extrabold tracking-tight text-slate-900">
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{COMPETENCY_HEADLINE}</p>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-2.5">Published finding</th>
              <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">What it means for a supplier</th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">Closed by</th>
            </tr>
          </thead>
          <tbody>
            {COMPETENCY_FINDINGS.map((f, i) => {
              const a = answers[f.answeredBy]
              return (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="m-0 text-[13px] font-semibold leading-snug text-slate-800">{f.stat}</p>
                    <p className="m-0 mt-1 text-[11px] text-slate-500">
                      {f.citation.authors} ({f.citation.year}){' '}
                      <span className="italic">{f.citation.journal}</span> {f.citation.detail}
                    </p>
                    <p className="m-0 mt-1 text-[12.5px] leading-snug text-slate-600 sm:hidden">{f.framing}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] leading-snug text-slate-600 sm:table-cell">
                    {f.framing}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${a.cls}`}>
                      {a.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Sources</p>
        <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
          {competencyCitations().map((c) => (
            <li key={c.doi} className="text-[11.5px] leading-snug text-slate-600">
              {c.authors} ({c.year}). {c.title}. <span className="italic">{c.journal}</span>, {c.detail}.{' '}
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-teal-700 underline underline-offset-2"
              >
                doi:{c.doi}
              </a>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-2 text-[11px] leading-snug text-slate-500">
          These surveys describe a workforce whose training predates the current evidence — not a
          failure of diligence. That is precisely why competency has to be evidenced at the
          organisation level rather than assumed.
        </p>
      </div>
    </section>
  )
}
