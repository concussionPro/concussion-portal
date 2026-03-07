/**
 * Module metadata for client-side components.
 *
 * SECURITY: This file contains ONLY metadata (titles, durations, etc.).
 * Full content (sections, quiz answers, clinical references) lives in
 * modules.ts / scat-modules.ts which must ONLY be imported in server
 * components or API routes — never in 'use client' components.
 */

export interface ModuleMeta {
  id: number
  title: string
  subtitle: string
  duration: string
  points: number
  description: string
}

export interface SCATModuleMeta extends ModuleMeta {
  isFree: boolean
}

const paidModules: ModuleMeta[] = [
  {
    id: 1,
    title: 'What is a Concussion?',
    subtitle: 'The Science & Mechanisms',
    duration: '90 min',
    points: 1,
    description: 'Comprehensive understanding of concussion biomechanics, pathophysiology, neuroanatomy, biochemistry, imaging, biomarkers, and clinical implications.',
  },
  {
    id: 2,
    title: 'Concussion Diagnosis & Initial Assessment',
    subtitle: 'Theory & Clinical Tools',
    duration: '90 min',
    points: 1,
    description: 'Master diagnostic criteria and assessment tools: SCAT6, VOMS, BESS, cranial nerve screening, and cervical evaluation across age groups.',
  },
  {
    id: 3,
    title: 'Practical Assessment & Acute Concussion Management',
    subtitle: 'Hands-On Clinical Skills',
    duration: '120 min',
    points: 1,
    description: 'Master practical procedures for cervical assessment, cranial nerve examination, VOMS, BESS, clinical decision-making, and acute management protocols.',
  },
  {
    id: 4,
    title: 'Persistent Post-Concussive Symptoms & Long-Term Management',
    subtitle: 'Persistent Symptoms & CTE',
    duration: '90 min',
    points: 1,
    description: 'Understanding persistent post-concussive symptoms, chronic traumatic encephalopathy, long-term outcomes, and management of complex cases beyond 4 weeks.',
  },
  {
    id: 5,
    title: 'Multidisciplinary Approach to Concussion Management',
    subtitle: 'Team-Based Care',
    duration: '75 min',
    points: 1,
    description: 'Understand the roles of healthcare professionals in comprehensive concussion care, referral pathways, team communication, and coordinated management strategies.',
  },
  {
    id: 6,
    title: 'Return to Play, Work, and School Protocols',
    subtitle: 'Staged Progression & Clearance',
    duration: '60 min',
    points: 1,
    description: 'Master graduated return-to-activity protocols for sport, work, and school, including clearance criteria, accommodations, and preventing premature return.',
  },
  {
    id: 7,
    title: 'Rehabilitation Pathways by Phenotype',
    subtitle: 'Targeted Treatment Strategies',
    duration: '90 min',
    points: 1,
    description: 'Apply phenotype-specific rehabilitation protocols for vestibular, oculomotor, cervicogenic, cognitive-fatigue, post-traumatic migraine, and anxiety/mood presentations.',
  },
  {
    id: 8,
    title: 'Legal, Ethical, Communication & Documentation',
    subtitle: 'Professional Practice Standards',
    duration: '60 min',
    points: 1,
    description: 'Navigate legal responsibilities, ethical obligations, effective communication strategies, and comprehensive documentation requirements in concussion management.',
  },
]

const scatModules: SCATModuleMeta[] = [
  {
    id: 101,
    title: 'Quick Guide & Medico-Legal',
    subtitle: 'SCAT6 vs SCOAT6 – Which Tool, When, and Why',
    duration: '30 min',
    points: 0.5,
    description: 'Master when to use SCAT6 vs SCOAT6, understand medicolegal implications, Australian regulatory requirements, and standard-of-care documentation.',
    isFree: true,
  },
  {
    id: 102,
    title: 'Immediate/On-Field Assessment (SCAT6)',
    subtitle: 'Sideline Concussion Recognition & Management',
    duration: '40 min',
    points: 0.5,
    description: 'Master immediate on-field concussion recognition, red flag identification, the complete SCAT6 off-field battery, and sideline decision-making.',
    isFree: true,
  },
  {
    id: 103,
    title: 'Clinical Use of SCOAT6',
    subtitle: 'Office Assessment & Serial Monitoring',
    duration: '40 min',
    points: 0.5,
    description: 'Master SCOAT6 administration for clinic-based concussion assessment including the modified VOMS, timed tandem gait, and return-to-play decision-making.',
    isFree: true,
  },
  {
    id: 104,
    title: 'Paediatric Concussion & Red Flags',
    subtitle: 'Child SCAT6, AIS 2024 Under-19 Requirements & School Return',
    duration: '30 min',
    points: 0.5,
    description: 'Master paediatric-specific concussion management including Child SCAT6, AIS 2024 under-19 requirements, return-to-learn protocols, and the multiple concussion protocol.',
    isFree: true,
  },
  {
    id: 105,
    title: 'Knowledge Quiz: From SCAT to Synapses',
    subtitle: 'Test Your Concussion Assessment Mastery',
    duration: '20 min',
    points: 0,
    description: 'Comprehensive scenario-based knowledge assessment covering all modules. These questions require clinical reasoning, not just recall.',
    isFree: true,
  },
]

export function getModulesMeta(): ModuleMeta[] {
  return paidModules
}

export function getSCATModulesMeta(): SCATModuleMeta[] {
  return scatModules
}
