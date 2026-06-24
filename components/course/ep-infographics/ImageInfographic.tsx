'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * Image-backed EP-course infographics. Each `[INFOGRAPHIC: <id>]` marker resolves
 * to a real illustration the owner generates and drops into `public/infographics/`
 * as `<id>.png` (with `<id>.svg` as an accepted fallback format). The config map
 * below supplies the framing chrome (eyebrow / title / caption) for every id —
 * adding a new infographic is just an entry here plus the image file.
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
      'The cortical, limbic and brainstem structures most disrupted by concussive forces, and the symptoms each region drives.',
  },
  'neurometabolic-cascade': {
    eyebrow: 'Module 1 · Pathophysiology',
    title: 'The neurometabolic cascade',
    caption:
      'From mechanoporation and ionic flux through pump overdrive, hyperglycolysis and the energy crisis to metabolic recovery.',
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
    title: 'Concussion symptom clusters',
    caption:
      'The physical, cognitive, emotional and sleep symptom groups and the neurophysiology behind each one.',
  },
  'phenotype-map': {
    eyebrow: 'Phenotypes',
    title: 'The six concussion phenotypes',
    caption:
      'Vestibular, oculomotor, cervicogenic, physiological, cognitive and mood presentations mapped to their targeted treatment.',
  },
  'bctt-protocol': {
    eyebrow: 'Assessment',
    title: 'Buffalo Concussion Treadmill Test',
    caption:
      'The Balke-based incline ramp, per-minute monitoring and the ≥3-point symptom-threshold termination criterion.',
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
      'Rotational, linear, coup-contrecoup and diffuse axonal injury mechanisms and why rotational shear is the most damaging.',
  },
  'recovery-timeline': {
    eyebrow: 'Module 1 · Recovery',
    title: 'The concussion recovery timeline',
    caption:
      'The typical 7–28 day metabolic recovery course, why symptoms resolve before the brain does, and the prolonged-recovery tail.',
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
      'SCAT6, SCOAT6 and Child SCAT6 — what each tool covers, who it is for, and the limits of EP use.',
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
      'The five impairments SSTAE reverses — autonomic, autoregulatory, CO₂ reactivity, neuroplastic and inflammatory.',
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
      'How each dominant phenotype maps to a targeted EP progression and when to layer in a secondary phenotype.',
  },
  'return-to-learn-work': {
    eyebrow: 'Module 6 · Return',
    title: 'Return-to-learn and return-to-work',
    caption:
      'The staged cognitive-load progression that shares one metabolic budget with the physical reconditioning program.',
  },
  'load-monitoring': {
    eyebrow: 'Module 6 · Monitoring',
    title: 'Training-load monitoring',
    caption:
      'Session RPE, heart rate trends, acute:chronic workload ratio and the symptom diary that governs every progression.',
  },
  'ppcs-risk-factors': {
    eyebrow: 'Module 7 · Prognosis',
    title: 'Predictors of prolonged recovery',
    caption:
      'The injury, pre-existing, behavioural and demographic factors that predict who is most likely to develop PPCS.',
  },
  'stalled-rehab-framework': {
    eyebrow: 'Module 7 · Decisions',
    title: 'When rehabilitation stalls',
    caption:
      'A four-step decision framework for the plateaued program: re-test, screen non-aerobic drivers, route and review.',
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          loading="lazy"
          onError={() => setStage((s) => (s === 0 ? 1 : 2))}
          className="mx-auto block w-full max-w-[640px] rounded-xl border border-[#e2ebec]"
        />
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
