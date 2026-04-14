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
    duration: '75 min',
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
    subtitle: 'Clinical Reasoning & Acute Protocols',
    duration: '90 min',
    points: 1,
    description: 'Clinical reasoning for cervical assessment, cranial nerve examination, VOMS, BESS interpretation, clinical decision-making, and acute management protocols. Hands-on skills practised at the workshop.',
  },
  {
    id: 4,
    title: 'Persistent Post-Concussive Symptoms & Long-Term Management',
    subtitle: 'Persistent Symptoms & CTE',
    duration: '75 min',
    points: 1,
    description: 'Understanding persistent post-concussive symptoms, chronic traumatic encephalopathy, long-term outcomes, and management of complex cases beyond 4 weeks.',
  },
  {
    id: 5,
    title: 'Multidisciplinary Approach to Concussion Management',
    subtitle: 'Team-Based Care',
    duration: '60 min',
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
    duration: '75 min',
    points: 1,
    description: 'Apply phenotype-specific rehabilitation protocols for vestibular, oculomotor, cervicogenic, cognitive-fatigue, post-traumatic migraine, and anxiety/mood presentations. Practical techniques demonstrated at the workshop.',
  },
  {
    id: 8,
    title: 'Legal, Ethical, Communication & Documentation',
    subtitle: 'Professional Practice Standards',
    duration: '45 min',
    points: 1,
    description: 'Navigate legal responsibilities, ethical obligations, effective communication strategies, and comprehensive documentation requirements in concussion management.',
  },
]

const scatModules: SCATModuleMeta[] = [
  {
    id: 101,
    title: 'SCAT6 Essentials',
    subtitle: 'Which Tool, When, and the Complete Sideline Battery',
    duration: '25 min',
    points: 0,
    description: 'Master the SCAT6 vs SCOAT6 distinction, red flag recognition, on-field assessment including Maddocks questions, and the complete off-field battery.',
    isFree: true,
  },
  {
    id: 102,
    title: 'SCOAT6 & Recovery Pathways',
    subtitle: 'Office Assessment, Return-to-Play & Paediatric Rules',
    duration: '20 min',
    points: 0,
    description: 'Master SCOAT6 for clinic-based assessment including serial monitoring, modified VOMS interpretation, graduated return-to-play protocol, and paediatric-specific management.',
    isFree: true,
  },
  {
    id: 103,
    title: 'Clinical Scenarios & Final Quiz',
    subtitle: 'Apply Your Knowledge to Real-World Cases',
    duration: '15 min',
    points: 1,
    description: 'Two clinical case studies and a comprehensive scenario-based quiz. Tests applied clinical reasoning with questions that extend beyond this course.',
    isFree: true,
  },
]

export function getModulesMeta(): ModuleMeta[] {
  return paidModules
}

export function getSCATModulesMeta(): SCATModuleMeta[] {
  return scatModules
}
