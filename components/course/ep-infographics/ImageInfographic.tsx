'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * Image-backed EP-course infographics. Each `[INFOGRAPHIC: <id>]` marker resolves
 * to a real illustration the owner generates and drops into `public/infographics/`
 * as `<id>.png` (with `<id>.svg` as an accepted fallback format). The config map
 * below supplies the framing chrome (eyebrow / title / caption) for every id —
 * adding a new infographic is just an entry here plus the image file.
 *
 * CAPTIONS MUST DESCRIBE THE IMAGE. `title` is also the <img> alt and the
 * dialog aria-label, and `caption` is visible page copy under the figure, so a
 * caption naming items the artwork does not contain is both an accessibility
 * defect and a truthfulness one. Every caption here was re-checked against the
 * rendered PNG on 2026-08-06; ten were rewritten because they named the wrong
 * items or the wrong count (e.g. sstae-mechanism promised "five impairments …
 * CO₂ reactivity" over a four-card image with no CO₂ card; stalled-rehab said
 * "four-step" over five steps; concussion-symptom-clusters described the
 * SCAT-style physical/cognitive/emotional/sleep domains over an image of the
 * six clinical phenotypes). If you re-generate an image, re-read its caption.
 *
 * OPEN, OWNER'S CALL — phenotype count: data/ep-modules/module-5.ts teaches
 * SEVEN phenotypes ("One Injury, Seven Expressions": vestibular, oculomotor,
 * cervicogenic, autonomic/physiologic, cognitive/fatigue, affective,
 * headache/migraine), but phenotype-map.png is the UPMC/Collins-Kontos SIX
 * clinical-profile table (its own source line cites that model) and omits the
 * autonomic/physiologic row. The image is internally correct and correctly
 * sourced, so the caption above now matches it — but the module it renders in
 * asks for seven. Resolve by either re-drawing the diagram with the seventh
 * row or reframing module 5; do not silently change one side.
 */
export const INFOGRAPHIC_CONFIG: Record<
  string,
  { eyebrow: string; title: string; caption: string }
> = {
  // ── Existing keys (kept) ────────────────────────────────────────────────
  'brain-regions': {
    eyebrow: 'Module 1 · Neuroanatomy',
    title: 'Brain regions relevant to concussion',
    caption:
      'The frontal, parietal, temporal and occipital lobes plus the cerebellum and brainstem, and the symptoms each region drives.',
  },
  'neurometabolic-cascade': {
    eyebrow: 'Module 1 · Pathophysiology',
    title: 'The neurometabolic cascade',
    caption:
      'Four stages — ionic imbalance, calcium influx and mitochondrial dysfunction, sodium dysregulation and oedema, and transient cerebral hypoperfusion — converging on the energy crisis.',
  },
  'cbf-autoregulation': {
    eyebrow: 'Pathophysiology',
    title: 'Cerebral blood-flow autoregulation',
    caption:
      'How the healthy brain holds cerebral perfusion steady across blood-pressure swings — and where concussion breaks that control.',
  },
  'autonomic-dysfunction': {
    eyebrow: 'Pathophysiology',
    title: 'Autonomic dysfunction after concussion',
    caption:
      'The sympathovagal shift, blunted baroreflex and reduced HRV that underlie post-concussion exercise intolerance.',
  },
  'concussion-symptom-clusters': {
    eyebrow: 'Recognition',
    title: 'The six symptom clusters',
    caption:
      'Vestibular, oculomotor, cognitive/fatigue, migraine, anxiety/mood and cervical — the six overlapping clusters, and why naming the dominant one drives targeted rehab.',
  },
  'phenotype-map': {
    eyebrow: 'Phenotypes',
    title: 'The six concussion phenotypes',
    caption:
      'Vestibular, oculomotor, cognitive/fatigue, migraine, anxiety/mood and cervical, each mapped to its hallmark assessment finding and targeted intervention.',
  },
  'bctt-protocol': {
    eyebrow: 'Assessment',
    title: 'Buffalo Concussion Treadmill Test',
    caption:
      'The Balke-based ramp — incline rises 1° per minute at a fixed speed — with HR, RPE and symptom score recorded every minute until symptom exacerbation sets the HR threshold.',
  },
  'hrt-to-prescription': {
    eyebrow: 'Prescription',
    title: 'From HR threshold to prescription',
    caption:
      'Converting the heart rate at symptom threshold into an individualised 80–90% sub-symptom-threshold training band.',
  },
  'graded-return-to-sport': {
    eyebrow: 'Return to sport',
    title: 'The six-stage graded return-to-sport',
    caption:
      'The staged progression from symptom-limited activity to full contact, gated by 24-hour symptom tolerance and medical clearance.',
  },

  // ── New keys ────────────────────────────────────────────────────────────
  'injury-biomechanics': {
    eyebrow: 'Module 1 · Biomechanics',
    title: 'Forces that cause concussion',
    caption:
      'Three force patterns — linear, rotational and coup-contrecoup — and why rotational shear, which drives diffuse axonal injury, does the most damage.',
  },
  'recovery-timeline': {
    eyebrow: 'Module 1 · Recovery',
    title: 'The concussion recovery timeline',
    caption:
      'Symptom burden peaks at 24–72 hours and most recover in 2–4 weeks; the 10–30% who do not are the PPCS tail that needs active rehab.',
  },
  'red-flag-decision': {
    eyebrow: 'Module 2 · Red flags',
    title: 'Red-flag escalation decision path',
    caption:
      'A stop-and-escalate decision path: which signs trigger a 000 call, same-day review, or safe-to-proceed.',
  },
  'intracranial-bleeds': {
    eyebrow: 'Module 2 · Red flags',
    title: 'Intracranial haemorrhage types',
    caption:
      'Epidural, subdural and subarachnoid bleeds — their vessel source, speed of deterioration and classic presentation.',
  },
  'scat6-family': {
    eyebrow: 'Module 2 · Tools',
    title: 'The SCAT6 assessment family',
    caption:
      'SCAT6, SCOAT6, Child SCAT6 and Child SCOAT6 — when each applies, which ages it covers, and the limits of EP use.',
  },
  'ep-scope-boundary': {
    eyebrow: 'Module 2 · Scope',
    title: 'The EP scope boundary',
    caption:
      'What the AEP can and cannot do in concussion care — recognise and escalate, never diagnose or clear.',
  },
  'voms-battery': {
    eyebrow: 'Module 3 · Assessment',
    title: 'The VOMS test battery',
    caption:
      'The five vestibular/ocular-motor screening components and the symptom-provocation thresholds that flag a positive finding.',
  },
  'assess-prescribe-loop': {
    eyebrow: 'Module 3 · Method',
    title: 'Assessment-to-prescription loop',
    caption:
      'The closed loop of testing, prescribing at 80–90% of HRt, monitoring tolerance, and re-testing to progress the ceiling.',
  },
  'sstae-mechanism': {
    eyebrow: 'Module 4 · Mechanism',
    title: 'How sub-symptom-threshold exercise works',
    caption:
      'Four proposed, converging mechanisms — restored CBF autoregulation, rebalanced autonomic tone, raised BDNF and neuroplasticity, and dampened neuroinflammation.',
  },
  'fitt-framework': {
    eyebrow: 'Module 4 · Prescription',
    title: 'The FITT prescription framework',
    caption:
      'Frequency, intensity, time and type applied to sub-symptom-threshold aerobic exercise, with the rationale for each.',
  },
  'phenotype-rehab-progressions': {
    eyebrow: 'Module 5 · Rehab',
    title: 'Phenotype-specific rehab progressions',
    caption:
      'Four-rung EP ladders for the vestibular, oculomotor and autonomic/aerobic phenotypes — advance a rung only when the current level is tolerated.',
  },
  'return-to-learn-work': {
    eyebrow: 'Module 6 · Return',
    title: 'Return-to-learn and return-to-work',
    caption:
      'Parallel four-step cognitive-load ladders for school and for work, both advancing only on tolerance and generally preceding full return to sport.',
  },
  'load-monitoring': {
    eyebrow: 'Module 6 · Monitoring',
    title: 'Training-load monitoring',
    caption:
      'Three checks that keep progression honest — session RPE, the acute:chronic workload ratio, and the 24-hour symptom rule.',
  },
  'ppcs-risk-factors': {
    eyebrow: 'Module 7 · Prognosis',
    title: 'Predictors of prolonged recovery',
    caption:
      'Risk clusters in three windows — pre-existing factors before injury, the injury characteristics themselves, and what happens in the early course.',
  },
  'stalled-rehab-framework': {
    eyebrow: 'Module 7 · Decisions',
    title: 'When rehabilitation stalls',
    caption:
      'A five-step checklist for the plateaued program: re-confirm the picture, check dose and adherence, re-test the thresholds, treat the modifiers, escalate and share care.',
  },
  'referral-pathway': {
    eyebrow: 'Module 8 · Communication',
    title: 'The referral pathway',
    caption:
      'How a concussion case reaches the EP, flows through reconditioning, and is handed back for medical clearance.',
  },
  'documentation-standards': {
    eyebrow: 'Module 8 · Records',
    title: 'The defensible EP record',
    caption:
      'The contemporaneous, scope-correct, objective and attributable record that holds up to clinical and medico-legal review.',
  },
}

/**
 * Renders an image-backed infographic for the given id. Degrades gracefully: a
 * missing `.png` retries the `.svg`, and if neither resolves it shows a tasteful
 * "coming soon" placeholder so a missing asset never breaks the page or leaks a
 * broken-image icon.
 */
export function ImageInfographic({ id }: { id: string }) {
  const config = INFOGRAPHIC_CONFIG[id]
  // 0 = try png, 1 = try svg, 2 = give up and show placeholder
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  // Both hooks must run before ANY early return — `useState(zoomed)` used to sit
  // below the `if (!config)` guard, so the hook count varied with the prop and
  // React would throw "rendered more hooks than during the previous render".
  const [zoomed, setZoomed] = useState(false)

  if (!config) return null

  const { eyebrow, title, caption } = config
  const src = stage === 0 ? `/infographics/${id}.png` : `/infographics/${id}.svg`

  return (
    <InfographicFrame
      eyebrow={eyebrow}
      title={title}
      ariaLabel={title}
      caption={caption}
    >
      {stage < 2 ? (
        <>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={`Enlarge: ${title}`}
            className="group relative mx-auto block w-full max-w-[640px] cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={title}
              loading="lazy"
              onError={() => setStage((s) => (s === 0 ? 1 : 2))}
              className="block w-full rounded-xl border border-[#e2ebec] transition group-hover:border-[#9cc3c6]"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-slate-900/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
              Click to enlarge
            </span>
          </button>
          {zoomed && (
            <div
              onClick={() => setZoomed(false)}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-slate-950/85 p-4 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setZoomed(false)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={title}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[92vh] max-w-[95vw] cursor-default rounded-lg object-contain shadow-2xl"
              />
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-[640px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#bcd2d4] bg-[#f3f8f8] px-6 py-12 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7c9598]">
            Illustration coming soon
          </span>
          <span className="text-sm font-medium text-[#4a6a6e]">{title}</span>
        </div>
      )}
    </InfographicFrame>
  )
}
