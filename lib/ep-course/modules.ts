/**
 * Concussion Rehabilitation for Exercise Physiologists — module metadata.
 *
 * Mirrors lib/vagus-course/modules.ts so the same client components
 * (sidebar, ModuleViewer, section stepper) render it unchanged. Content is
 * the existing concussion material reorganised for the AEP scope (the active-
 * rehab half) — markdown in content/ep-course/.
 *
 * PRIVATE: served only via /courses/concussion-ep-rehab/* (gated + noindex,
 * unlisted). Built for ESSA accreditation review.
 */

export interface EpModuleMeta {
  slug: string
  number: number
  title: string
  durationMin: number
  description: string
  loadBearing?: boolean
}

export const EP_MODULES: EpModuleMeta[] = [
  {
    slug: 'module-1',
    number: 1,
    title: 'Concussion for the Exercise Physiologist',
    durationMin: 60,
    description: 'Functional injury, the neurometabolic cascade, autonomic dysfunction and exercise intolerance — and why sub-symptom exercise is now first-line, not rest.',
  },
  {
    slug: 'module-2',
    number: 2,
    title: 'Recognition, Red Flags & Scope of Practice',
    durationMin: 60,
    description: 'Recognise, don\'t diagnose. Red flags and escalation, the EP\'s lane in the care team, and referral in and out.',
    loadBearing: true,
  },
  {
    slug: 'module-3',
    number: 3,
    title: 'Assessment That Is the Treatment',
    durationMin: 90,
    description: 'The Buffalo Concussion Treadmill Test — establishing the symptom threshold (HRt) that becomes the exercise prescription.',
    loadBearing: true,
  },
  {
    slug: 'module-4',
    number: 4,
    title: 'Sub-Symptom-Threshold Aerobic Rehabilitation',
    durationMin: 90,
    description: 'Prescribing, monitoring and progressing active recovery from the BCTT threshold — FITT, the symptom rule, and the progression algorithm.',
  },
  {
    slug: 'module-5',
    number: 5,
    title: 'Phenotype-Specific Exercise Rehabilitation',
    durationMin: 90,
    description: 'Vestibular, cervical and oculomotor exercise within EP scope — the exercise library, symptom-titrated dosing, and the deliver-vs-refer boundary.',
  },
  {
    slug: 'module-6',
    number: 6,
    title: 'Graded Return to Activity, Sport & Performance',
    durationMin: 60,
    description: 'Staged return-to-sport, the AIS/SMA 21-day stand-down, and sport-specific reconditioning the EP designs up to medical clearance.',
  },
  {
    slug: 'module-7',
    number: 7,
    title: 'Documentation, Communication & Referral',
    durationMin: 30,
    description: 'The records an EP produces, communicating with the referrer, and recording within scope — recommend, don\'t clear.',
  },
]

export function findEpModule(slug: string): EpModuleMeta | undefined {
  return EP_MODULES.find((m) => m.slug === slug)
}
