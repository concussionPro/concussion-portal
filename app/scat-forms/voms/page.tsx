import type { Metadata } from 'next'
import { PROTOCOL_DOI_LABEL, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import { createFAQSchema, createMedicalWebPageSchema } from '@/lib/schema-markup'

const PAGE_URL = 'https://portal.concussion-education-australia.com/scat-forms/voms'

export const metadata: Metadata = {
  title: 'VOMS Scoring Sheet — Vestibular/Ocular Motor Screening Guide',
  description:
    'Printable VOMS scoring sheet and administration guide: all 7 items, 0–10 symptom ratings, near point of convergence measurement, and what counts as a positive screen. For trained healthcare professionals (Mucha et al. 2014).',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'VOMS Scoring Sheet — Vestibular/Ocular Motor Screening Guide',
    description:
      'Administer and score the VOMS: smooth pursuits, saccades, convergence, VOR and visual motion sensitivity, with the printable scoring table.',
    url: PAGE_URL,
    type: 'website',
    images: ['/og-image.jpg'],
  },
}

/**
 * VOMS — administration guide + printable scoring sheet.
 *
 * WHY THIS PAGE. "VOMS scoring sheet" is a recurring, tool-shaped clinical
 * query with no good AU destination; the SCAT6/SCOAT6 pages prove the pattern
 * (the artifact ranks, the ladder converts). This page is a GUIDE + printable
 * table, not a fillable engine — an honest static reference, clinically
 * conservative, fully cited to the primary source.
 *
 * CLINICAL GROUND TRUTH — Mucha A, Collins MW, Elbin RJ, et al. A brief
 * Vestibular/Ocular Motor Screening (VOMS) assessment to evaluate concussions.
 * Am J Sports Med. 2014;42(10):2479-86. doi:10.1177/0363546514543775.
 * Never assert a threshold this page can't cite.
 */

// Visible Q&A — mirrored 1:1 in the FAQPage JSON-LD (schema/page parity).
const faqs = [
  {
    question: 'What is the VOMS?',
    answer:
      'The Vestibular/Ocular Motor Screening (VOMS) is a brief clinical screen of the vestibular and ocular motor systems after concussion. It provokes each system in turn — smooth pursuits, horizontal and vertical saccades, near point of convergence, horizontal and vertical vestibulo-ocular reflex, and visual motion sensitivity — and records whether symptoms increase. It was developed and validated by Mucha and colleagues (American Journal of Sports Medicine, 2014).',
  },
  {
    question: 'How is the VOMS scored?',
    answer:
      'Before testing, the patient rates headache, dizziness, nausea and fogginess from 0–10 as a baseline. The same four symptoms are re-rated after each of the seven items. Near point of convergence is also measured in centimetres across three trials. An item is commonly interpreted as positive when it provokes an increase of 2 or more points above the pre-test baseline, or when the average near point of convergence is 5 cm or greater — the thresholds reported in the original validation study.',
  },
  {
    question: 'Who can administer the VOMS?',
    answer:
      'The VOMS is designed for licensed healthcare professionals trained in concussion assessment — doctors, physiotherapists, osteopaths, chiropractors and other clinicians. It is a screening tool that supports clinical judgement; a positive screen directs further vestibular or oculomotor assessment and phenotype-targeted rehabilitation, not a diagnosis on its own.',
  },
  {
    question: 'How do I measure near point of convergence (NPC)?',
    answer:
      'Hold a small target (a 14-point letter target or the tip of a pen) at arm’s length in the midline and bring it slowly toward the bridge of the patient’s nose. The patient reports when the target splits into two, or the clinician observes an outward eye drift — that distance, measured in centimetres from the tip of the nose, is the NPC. Repeat three times and average. An average of 5 cm or greater is considered abnormal.',
  },
  {
    question: 'How does the VOMS relate to the SCAT6?',
    answer:
      'They are complementary. The SCAT6 and SCOAT6 cover symptoms, cognition, balance and neurological screening, but only briefly touch the vestibular-ocular domain. The VOMS examines that domain directly, and a positive VOMS is one of the strongest pointers toward a vestibular or ocular motor phenotype — the presentations that benefit from targeted rehabilitation rather than rest alone.',
  },
  {
    question: 'What happens after a positive VOMS?',
    answer:
      'A positive screen directs the clinical pathway: vestibular findings toward vestibular rehabilitation, ocular motor findings toward oculomotor work, and both alongside graded sub-symptom-threshold aerobic exercise, which is first-line in current consensus care. Concussion Education Australia trains the full assess-to-rehab pathway, and the rehabilitation delivery method is published open access.',
  },
]

const ITEMS: Array<{ n: number; name: string; how: string }> = [
  { n: 1, name: 'Smooth pursuits', how: 'Follow a fingertip moving smoothly side-to-side (~3 ft away, 2 reps) and up-and-down (2 reps), head still.' },
  { n: 2, name: 'Horizontal saccades', how: 'Two targets ~3 ft apart; eyes jump quickly between them, 10 repetitions, head still.' },
  { n: 3, name: 'Vertical saccades', how: 'Two targets ~3 ft apart vertically; 10 repetitions, head still.' },
  { n: 4, name: 'Near point of convergence (NPC)', how: 'Target moves from arm’s length toward the nose until diplopia or observed drift. Measure the distance (cm). Three trials, averaged.' },
  { n: 5, name: 'Horizontal VOR', how: 'Eyes fixed on a stationary target; head rotates side-to-side ~20° at ~180 beats/min, 10 repetitions.' },
  { n: 6, name: 'Vertical VOR', how: 'Eyes fixed on the target; head nods up-and-down ~20° at ~180 beats/min, 10 repetitions.' },
  { n: 7, name: 'Visual motion sensitivity (VMS)', how: 'Standing, arm outstretched, eyes on own thumb; rotate head, eyes and trunk together ~80° side-to-side, 5 repetitions.' },
]

const SYMPTOMS = ['Headache', 'Dizziness', 'Nausea', 'Fogginess'] as const

export default function VomsPage() {
  const faqSchema = createFAQSchema(faqs)
  const pageSchema = createMedicalWebPageSchema({
    url: PAGE_URL,
    title: 'VOMS Scoring Sheet — Vestibular/Ocular Motor Screening Guide',
    description: metadata.description as string,
    lastReviewed: '2026-08-11',
    about: 'Vestibular/Ocular Motor Screening (VOMS) for sport-related concussion',
    reviewedBy: 'Zac Lewis',
  })
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-0">
        <h1 className="text-2xl font-bold text-slate-900">
          VOMS — Vestibular/Ocular Motor Screening
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
          A brief post-concussion screen of the vestibular and ocular motor systems: seven items,
          each followed by a 0&ndash;10 re-rating of headache, dizziness, nausea and fogginess
          against a pre-test baseline. For trained healthcare professionals. Primary source:
          Mucha et&nbsp;al., <em>Am J Sports Med</em> 2014;42(10):2479&ndash;86 &middot;{' '}
          <a href="https://doi.org/10.1177/0363546514543775" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            doi:10.1177/0363546514543775
          </a>
          .
        </p>

        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <a href="/scat-forms/scat6" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">SCAT6 form →</a>
          <a href="/scat-forms/scoat6" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">SCOAT6 form →</a>
          <a href="/tools/bctt-calculator" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">BCTT calculator →</a>
        </div>

        {/* ── administration ── */}
        <h2 className="mt-6 text-lg font-bold text-slate-900">Administration</h2>
        <ol className="mt-3 space-y-2.5">
          {ITEMS.map((it) => (
            <li key={it.n} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
              <span className="flex-none w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{it.n}</span>
              <span><strong className="text-slate-900">{it.name}.</strong> {it.how}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-3xl">
          <strong className="text-slate-900">Interpretation.</strong> An item provoking a rise of{' '}
          <strong>&ge;2 points</strong> over the pre-test baseline on any symptom, or an average NPC of{' '}
          <strong>&ge;5&nbsp;cm</strong>, is commonly interpreted as a positive screen (Mucha et&nbsp;al. 2014).
          A positive screen supports — never replaces — clinical judgement.
        </p>

        {/* ── the printable scoring sheet ── */}
        <h2 className="mt-8 text-lg font-bold text-slate-900">Scoring sheet</h2>
        <p className="mt-1 mb-3 text-xs text-slate-500 print:hidden">Print this page for a paper scoring sheet — the table below is sized for A4.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">Item</th>
                {SYMPTOMS.map((s) => (
                  <th key={s} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-900 w-[86px]">{s}<span className="block text-[10px] font-medium text-slate-500">0–10</span></th>
                ))}
                <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-amber-50/60">
                <td className="border border-slate-300 px-3 py-2.5 font-semibold text-slate-900">Baseline (pre-test)</td>
                {SYMPTOMS.map((s) => <td key={s} className="border border-slate-300" />)}
                <td className="border border-slate-300" />
              </tr>
              {ITEMS.map((it) => (
                <tr key={it.n}>
                  <td className="border border-slate-300 px-3 py-2.5 text-slate-700">
                    {it.n}. {it.name}
                    {it.n === 4 && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        NPC (cm): trial 1 ____&ensp;trial 2 ____&ensp;trial 3 ____&ensp;avg ____
                      </span>
                    )}
                  </td>
                  {SYMPTOMS.map((s) => <td key={s} className="border border-slate-300" />)}
                  <td className="border border-slate-300" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated August 2026{' '}
          · Rehab method published open-access:{' '}
          <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">{PROTOCOL_DOI_LABEL}</a> (Zenodo, CC BY)
        </p>
      </section>

      {/* Crawlable Q&A — mirrored exactly in the FAQPage JSON-LD above */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6 print:hidden">
        <div className="space-y-6">
          {faqs.map((f) => (
            <div key={f.question}>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{f.question}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600">
          Want the full assess-to-rehab pathway — VOMS interpretation, phenotype-driven
          rehabilitation and graded return?{' '}
          <a href="/scat-mastery" className="text-blue-600 font-semibold hover:underline">
            Start with the free SCAT6 Mastery course
          </a>{' '}
          or see the{' '}
          <a href="/pricing" className="text-blue-600 font-semibold hover:underline">
            Concussion Clinical Mastery course
          </a>
          .
        </p>
      </section>
    </>
  )
}
