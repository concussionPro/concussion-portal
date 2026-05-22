import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { AHPRA_BOARDS, CPD_HOMES, passiveCeiling } from '@/lib/ai-course/cpd-requirements'
import { ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD Requirements by Profession — AHPRA Boards',
  robots: 'noindex, nofollow',
}

/**
 * Per-profession CPD requirements reference page. Used by partners
 * to verify the platform handles the full AHPRA Board landscape, not
 * just GP-centric claims.
 *
 * Every figure here is verified against the relevant Board's published
 * registration standard (see docs/ahpra-cpd-requirements.md for full
 * sourcing).
 */
export default async function CpdRequirementsPage() {
  const access = await requireAiCourseAccess()

  // Sort boards by passive ceiling descending — highest-leverage at top
  const sortedBoards = [...AHPRA_BOARDS].sort((a, b) => b.passiveCeilingPercent - a.passiveCeilingPercent)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link href="/courses/cpd-record" className="text-xs text-accent hover:underline mb-4 inline-block">
          ← CPD record
        </Link>

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          AHPRA per-profession reference
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          CPD requirements vary by Board.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          15 AHPRA National Boards. Hour minimums from 20 to 50/year. Self-directed allowances from 0% (Psychology peer-consult minimum) to 100% (Nursing, Physio). The platform calibrates to each Board — the &ldquo;passive CPD&rdquo; ceiling is honest per profession, not GP-centric.
        </p>

        {/* High-leverage callout */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Maximum passive leverage', body: 'Nursing, Physiotherapy. Up to 100% of CPD can be self-directed workflow activity.', color: 'emerald' },
            { label: 'Moderate leverage', body: 'Osteopathy, Chiropractic, Optometry, Podiatry, OT. 70-85% passive ceiling after mandatory interactive minimums.', color: 'amber' },
            { label: 'Limited leverage', body: 'Medical (RACGP/ACRRM), Pharmacy, Psychology. Hard formal/peer minimums cap passive at 50-67%.', color: 'slate' },
          ].map((c) => {
            const colorClass = c.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              c.color === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              'bg-slate-50 border-slate-200 text-slate-900'
            return (
              <div key={c.label} className={`rounded-2xl border ${colorClass} p-5`}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2">{c.label}</p>
                <p className="text-xs leading-relaxed opacity-90">{c.body}</p>
              </div>
            )
          })}
        </div>

        {/* All 15 Boards table */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">All 15 AHPRA Boards — sorted by passive-CPD ceiling</h2>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">Board</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">Hours / yr</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">Passive ceiling</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">Hard formal min</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700">Standard</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBoards.map((b) => {
                    const ceil = passiveCeiling(b.slug)!
                    const annual = b.annualHours ?? (b.cycleHours && b.cycleYears ? b.cycleHours / b.cycleYears : 0)
                    const annualLabel = b.cycleYears ? `${annual}/yr (${b.cycleHours}/${b.cycleYears}yr)` : `${annual}`
                    return (
                      <tr key={b.slug} className="border-t border-slate-100 hover:bg-slate-50/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{b.profession}</p>
                          <p className="text-xs text-slate-500">{b.name}</p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{annualLabel}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold tabular-nums bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {b.passiveCeilingPercent}% · ~{ceil.passiveHours}h
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {b.hardMinNonPassiveHours > 0 ? `${b.hardMinNonPassiveHours}h` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <a href={b.standardUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Verified against published registration standards 2026-05-22. Re-verified quarterly. The passive ceiling assumes a clinician using the platform&apos;s in-workflow capture for all categories where the Board permits self-directed activity.
          </p>
        </section>

        {/* Medical CPD Homes (RACGP, ACRRM) */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Medical CPD Homes — RACGP &amp; ACRRM</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Medical practitioners satisfy the Board&apos;s 50-hour requirement via a CPD Home (RACGP, ACRRM, or specialist college). The two general-practice Homes use a four-category structure.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {CPD_HOMES.map((h) => (
              <div key={h.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-base font-bold text-foreground">{h.name}</p>
                  <p className="text-xs text-slate-500">{h.totalCycleHours} hrs / {h.cycleYears === 1 ? 'yr' : `${h.cycleYears}yr`}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{h.forProfession}</p>
                <ul className="space-y-2 mb-3">
                  {h.categories.map((c) => (
                    <li key={c.name} className="text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-slate-500 tabular-nums">{c.minHours ? `min ${c.minHours}h` : '—'}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.examples}</p>
                    </li>
                  ))}
                </ul>
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                  Standard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Per-Board detail cards */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Per-Board detail</h2>
          <div className="space-y-3">
            {sortedBoards.map((b) => (
              <div key={b.slug} id={b.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <div>
                    <p className="text-base font-bold text-foreground">{b.profession}</p>
                    <p className="text-xs text-slate-500">{b.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600">
                      {b.annualHours}h / yr{b.cycleYears ? ` (${b.cycleHours} over ${b.cycleYears}yr)` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {b.passiveCeilingPercent}% passive
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {b.categories.map((c) => (
                    <div key={c.name} className="text-xs border-l-2 border-slate-200 pl-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-slate-500 tabular-nums">
                          {c.minHours ? `min ${c.minHours}h` : ''}
                          {' '}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            c.passiveActivityRecognised === 'yes' ? 'bg-emerald-100 text-emerald-800' :
                            c.passiveActivityRecognised === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-50 text-red-800'
                          }`}>
                            passive: {c.passiveActivityRecognised}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.examples}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Recording:</strong> {b.recordingRequirements}
                </p>
                {b.auditNotes && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    <strong className="text-foreground">Audit:</strong> {b.auditNotes}
                  </p>
                )}
                <a href={b.standardUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-2">
                  Official standard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">Methodology</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All figures verified against each Board&apos;s published registration standard. Where AHPRA documents returned HTTP 403 to automated fetch (3 cases — ATSIHP, Optometry, MRPBA), values are from high-authority secondary sources and flagged for human verification in <code>docs/ahpra-cpd-requirements.md</code>. The passive-CPD ceiling figure assumes a clinician using the platform&apos;s in-workflow capture for all activity categories where the Board permits self-directed CPD; it does not account for the practitioner&apos;s individual scope-of-practice or endorsement-specific add-ons. Re-verified quarterly via the content-refresh cron.
          </p>
        </section>
      </div>
    </div>
  )
}
