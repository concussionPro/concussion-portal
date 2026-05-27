/**
 * Pure module-metadata data file. Client-safe — no fs / path imports.
 *
 * Split out from content.ts so the CourseSidebar (a 'use client'
 * component) can import MODULES without pulling fs into the client
 * bundle. content.ts re-exports these for back-compat with existing
 * server-side imports.
 */

export interface ModuleMeta {
  slug: string
  title: string
  number: number
  durationMin: number
  description: string
  loadBearing?: boolean
}

export const MODULES: ModuleMeta[] = [
  {
    slug: 'module-1-compliance',
    number: 1,
    title: 'AHPRA AI Guidelines, Privacy Act & ChatGPT Clinical Notes Compliance',
    durationMin: 40,
    description: 'AHPRA AI guidelines explained, Australian Privacy Principles for clinicians using ChatGPT for clinical notes, TGA digital scribes boundaries, indemnity insurer positions (Avant, Guild, MIPS, MIGA). The legal scaffolding everything else relies on.',
    loadBearing: true,
  },
  {
    slug: 'module-2-tools',
    number: 2,
    title: 'AI Scribe Tool Selection — Heidi vs Lyrebird vs Halo vs Dragon',
    durationMin: 20,
    description: 'Heidi vs Lyrebird vs Halo vs Dragon vs ChatGPT. Three-tier framework for choosing an AI scribe: healthcare-purpose-built (Heidi, Lyrebird, Halo), enterprise AU-residency LLMs, consumer LLMs. AU data sovereignty, Privacy Act fit, and when each is the right tool.',
  },
  {
    slug: 'module-3-documentation',
    number: 3,
    title: 'Safe Documentation Workflows — NDIS Reports, AHPRA Audit-Safe',
    durationMin: 20,
    description: 'AI scribes, SOAP note refinement, NDIS allied health reports (audit-safe), treatment plans, workers comp, discharge summaries, mental health care plans. Workflows that survive AHPRA, NDIS, and indemnity scrutiny.',
  },
  {
    slug: 'module-4-patient-comms',
    number: 4,
    title: 'Patient Communication & Documents',
    durationMin: 15,
    description: 'Patient info sheets, exercise programs, referral letters, return-to-work/school certificates, multilingual translation, discharge instructions.',
  },
  {
    slug: 'module-5-physio',
    number: 5,
    title: 'Specialty Deep Dive — Physiotherapy',
    durationMin: 8,
    description: 'Exercise prescription, return-to-sport, treatment summaries, pain education. 3-prompt starter kit.',
  },
  {
    slug: 'module-5-naturopath',
    number: 6,
    title: 'Specialty Deep Dive — Naturopathy',
    durationMin: 8,
    description: 'Supplement education sheets, diet plans, herb-drug interactions. TGA-careful framing throughout.',
  },
  {
    slug: 'module-5-gp',
    number: 7,
    title: 'Specialty Deep Dive — General Practice',
    durationMin: 8,
    description: 'Referrals, mental health care plans, chronic disease management, polypharmacy support.',
  },
  {
    slug: 'module-5-osteopath',
    number: 8,
    title: 'Specialty Deep Dive — Osteopathy',
    durationMin: 7,
    description: 'Treatment notes, exercise/posture sheets, progress reports, return-to-work documentation.',
  },
  {
    slug: 'module-6-hub-and-certification',
    number: 9,
    title: 'Hub Onboarding & Certification',
    durationMin: 10,
    description: 'Tour of the AI Practice Hub, prompt library, tool comparison matrix, monthly update feed, certification quiz.',
  },
]

export function findModule(slug: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.slug === slug)
}
