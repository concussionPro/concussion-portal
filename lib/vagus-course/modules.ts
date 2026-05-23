/**
 * Vagus Nerve in Clinical Practice — module metadata.
 *
 * Short-form course (~75 min total, 1.25 CPD hours, A$97).
 * Mirrors the structure of lib/ai-course/modules.ts so the same
 * client-side components (CourseSidebar, ModuleViewer, etc.) work
 * unchanged.
 *
 * Status: scaffolded · launching July 2026.
 */

export interface VagusModuleMeta {
  slug: string
  title: string
  number: number
  durationMin: number
  description: string
  loadBearing?: boolean
}

export const VAGUS_MODULES: VagusModuleMeta[] = [
  {
    slug: 'module-1-anatomy',
    number: 1,
    title: 'Anatomy & Evidence Essentials',
    durationMin: 12,
    description: 'Afferent vs efferent fibres, dorsal vs ventral motor nuclei. What the literature actually supports vs polyvagal-marketing claims. The defensible foundation everything else builds on.',
    loadBearing: true,
  },
  {
    slug: 'module-2-red-flags',
    number: 2,
    title: 'Red Flags & Differentials',
    durationMin: 10,
    description: 'When "vagal symptoms" mask cardiac arrhythmia, endocrine pathology, or neurological causes you must refer. The medicolegal scaffolding that protects the rest of the course.',
    loadBearing: true,
  },
  {
    slug: 'module-3-assessment',
    number: 3,
    title: 'Clinical Assessment',
    durationMin: 15,
    description: 'Bedside signs of autonomic dysfunction, HRV proxies, when objective measurement is justified, and when it is not. Practical for a 20-minute consult.',
  },
  {
    slug: 'module-4-phenotypes',
    number: 4,
    title: 'Phenotypes Worth Knowing',
    durationMin: 15,
    description: 'POTS, post-concussion autonomic dysfunction, long-COVID, IST, neurally-mediated syncope. How to triage, when to treat in-house, when to refer.',
  },
  {
    slug: 'module-5-interventions',
    number: 5,
    title: 'Defensible Interventions',
    durationMin: 15,
    description: 'Slow-paced breathing, vagal manoeuvres, manual therapy techniques — with honest evidence ranking. The interventions that have RCT support and the ones that do not.',
  },
  {
    slug: 'module-6-hub-certification',
    number: 6,
    title: 'Hub & Certification',
    durationMin: 8,
    description: 'Toolkit walkthrough, reference repository, 10-question certification quiz. Pass mark 8/10 for the 12-month certificate.',
  },
]

export function findVagusModule(slug: string): VagusModuleMeta | undefined {
  return VAGUS_MODULES.find((m) => m.slug === slug)
}
