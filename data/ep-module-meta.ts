/**
 * EP course (CRM) module metadata for client-side components.
 *
 * SECURITY: mirrors data/module-meta.ts — this file contains ONLY literal
 * metadata (titles, durations, etc.). Full content (sections, quiz answers,
 * clinical references) lives in data/ep-modules/* which must ONLY be imported
 * in server components or API routes — never in 'use client' components:
 * importing the ep-modules barrel compiles the entire paid course into a
 * public client chunk. Keep these literals in sync with each module file's
 * meta fields; ids here are DISPLAY ids (1-8).
 */
import type { ModuleMeta } from './module-meta'

/**
 * EP module ids are NAMESPACED to 201-208 in the data files (and in the shared
 * ProgressContext store) so they can never collide with the flagship modules
 * 1-8 — the two courses share one progress store, and identical ids caused
 * cross-course completion corruption.
 *
 * Everything user-visible stays 1-8: URLs (/ep-course/modules/1-8), the module
 * numbers rendered in the nav/dashboard, and epModulesMeta all use the DISPLAY
 * id. Convert with epProgressId()/epDisplayId() at the boundary.
 */
export const EP_MODULE_ID_OFFSET = 200

export function epProgressId(displayId: number): number {
  return displayId > EP_MODULE_ID_OFFSET ? displayId : displayId + EP_MODULE_ID_OFFSET
}

export function epDisplayId(id: number): number {
  return id > EP_MODULE_ID_OFFSET ? id - EP_MODULE_ID_OFFSET : id
}

export const epModulesMeta: ModuleMeta[] = [
  {
    id: 1,
    title: 'Concussion for the Exercise Physiologist',
    subtitle: 'Functional Injury, the Neurometabolic Cascade & Why Exercise Is Now First-Line',
    duration: '60 min',
    points: 1,
    description:
      'A clinically rigorous, science-degree-level foundation for the Accredited Exercise Physiologist implementing concussion rehabilitation. Covers injury biomechanics, the full neurometabolic cascade in biochemical detail (glutamate excitotoxicity → K⁺ efflux → Na⁺/K⁺-ATPase overdrive → hyperglycolysis → Ca²⁺-mediated mitochondrial failure → metabolic depression), cerebral blood-flow dysregulation and neurovascular uncoupling, autonomic dysfunction as the mechanism of exercise intolerance, the evidence base for the paradigm shift to active rehabilitation, and the AEP\'s defined role in the multidisciplinary concussion team.',
  },
  {
    id: 2,
    title: 'Recognition, Red Flags & Scope of Practice',
    subtitle:
      'Neurophysiology of Observable Signs, Red-Flag Pathophysiology and the Medico-Legal Scope Boundary',
    duration: '60 min',
    points: 0.5,
    description:
      'A science-degree-level treatment of concussion recognition and triage for the Accredited Exercise Physiologist. Covers the neurophysiological mechanisms underlying each symptom cluster, the pathophysiology of life-threatening red flags (intracranial haemorrhage, second-impact syndrome, cervical spine injury) and why each mandates immediate escalation, the structure and limits of SCAT6/SCOAT6 in EP hands, and the precise medico-legal rationale for the AEP\'s recognise-don\'t-diagnose boundary.',
  },
  {
    id: 3,
    title: 'Assessment That Is the Treatment',
    subtitle:
      'The Buffalo Concussion Treadmill/Bike Test — Exercise Physiology Rationale, Standardised Protocol, and the Symptom Threshold That Becomes the Prescription',
    duration: '60 min',
    points: 1.5,
    description:
      'The flagship Exercise Physiology module. Builds the physiological rationale for graded exertion testing — why a Balke-based ramp protocol can locate the autonomic and cerebrovascular ceiling — then walks through the complete Buffalo Concussion Treadmill Test (BCTT) and Buffalo Concussion Bike Test (BCBT) workflows: pre-screen and red-flag triage, baseline vitals and symptom scoring, the precise per-minute Balke protocol steps, the ≥3-point symptom-threshold criterion, and how the heart rate at symptom threshold (HRt) physiologically represents the point where impaired CBF regulation and autonomic function can no longer meet exertional demand. Covers test-retest reliability, converting HRt into an individualised sub-symptom-threshold prescription, structured re-testing to progress the ceiling, and VOMS, BESS and timed tandem gait as EP-scope serial outcome measures. 12-question quiz tests protocol detail, physiology and scope discipline.',
  },
  {
    id: 4,
    title: 'Sub-Symptom-Threshold Aerobic Rehabilitation',
    subtitle: 'The Biochemistry of Recovery, the FITT Prescription, and Progressing the Physiological Ceiling',
    duration: '60 min',
    points: 1.5,
    description:
      'The core exercise-physiology module. Begins with the full biochemical and physiological explanation of WHY sub-symptom-threshold aerobic exercise drives concussion recovery — autonomic restoration (vagal tone, baroreflex sensitivity, HRV), normalisation of cerebral autoregulation and cerebrovascular CO₂ reactivity, exercise-induced BDNF upregulation and neuroplasticity/angiogenesis, reduced neuroinflammation via microglial phenotype shift, and systemic deconditioning reversal — all achieved below the threshold that would re-trigger the neurometabolic energy crisis. The heart-rate threshold (HRt) is explained as the measurable physiological ceiling of the autonomic/cerebrovascular impairment. The module then covers the full EP prescription skill set: FITT programming from HRt (80–90% band), the real-time ≥2-point symptom-exacerbation stop rule, the re-test-driven progression algorithm, interval and cross-training considerations, and managing the deconditioned or anxious patient. EP scope throughout: you prescribe, monitor and progress; you do not diagnose concussion or grant medical clearance.',
  },
  {
    id: 5,
    title: 'Phenotype-Specific Exercise Rehabilitation',
    subtitle:
      'Neurophysiology, Recognition and Exercise Prescription Across the Seven Concussion Phenotypes',
    duration: '60 min',
    points: 1,
    description:
      'A science-degree-level deep dive into the seven concussion phenotypes for the Accredited Exercise Physiologist delivering targeted rehabilitation. Covers the neurophysiology underlying each phenotype — cerebellar VOR recalibration, cervico-ocular reflex disruption, trigeminocervical sensitisation, autonomic SSTAE mechanics, default-mode-network fatigue, limbic dysregulation and trigeminovascular headache — alongside the matching EP-scope exercise prescription: vestibular gaze-stabilisation and habituation, oculomotor convergence and saccade drills, deep-neck-flexor and sensorimotor cervical retraining, sub-symptom-threshold aerobic exercise, graded cognitive loading, exercise-as-mood-intervention and aerobic headache management. Develops the clinical skill of identifying the dominant phenotype driver, layering secondary phenotypes, and applying symptom-titrated three-phase progressions to every rehabilitation decision.',
  },
  {
    id: 6,
    title: 'Graded Return to Activity, Sport & Performance',
    subtitle: 'The Six-Stage Strategy, Australian Stand-Down Rules & Reconditioning Science',
    duration: '60 min',
    points: 1,
    description:
      'The operative module for AEP-delivered return-to-sport reconditioning. Covers the six-stage Amsterdam 2023 graded return-to-sport (GRTS) strategy as a staged, symptom-monitored progression the AEP operationalises — with particular depth on stages 3 and 4; the mandatory AIS/SMA Australian Concussion Guidelines for Youth and Community Sport stand-down minimums (≥21-day stand-down, ≥14 days symptom-free before contact); the physiology of reconditioning (why aerobic base must precede sport-specific, multidirectional and contact-preparation load, including the VOR challenge of running and the dual-task cognitive-physical demand of Stage 4); a concussion-specific return-to-running progression; team-sport conditioning across three phases; load monitoring and periodisation using sRPE, ACWR and the 24-hour symptom rule; and cognitive-load considerations for return-to-learn and return-to-work. The AEP\'s lane: implement and progress stages 1–4, support stages 5–6 after clearance, hand over a prepared athlete with documented evidence — never grant contact clearance.',
  },
  {
    id: 7,
    title: 'Persistent Symptoms & the Complex Case',
    subtitle: 'Pathophysiology of Persistence, Active Rehabilitation in PPCS, and Navigating the Limits of EP Scope',
    duration: '60 min',
    points: 1,
    description:
      'Most concussions resolve within the expected window. This module addresses the harder cases — patients where symptoms persist, rehabilitation stalls, or the clinical picture grows more complex than a simple sub-threshold aerobic program can resolve. Science-degree-level content covers the five pathophysiological mechanisms that drive persistence (sustained autonomic and cerebrovascular dysregulation, unresolved neuroinflammation, central sensitisation, the deconditioning spiral, and psychological maintaining factors), the evidence base for continuing aerobic exercise in PPCS, and a structured four-step decision framework for the program that will not progress. The module also trains the EP to manage the comorbid, deconditioned and anxious patient using pacing and behaviour-change skills, and to recognise — and correctly route — presentations that have moved outside the EP lane, including neurodegenerative concerns.',
  },
  {
    id: 8,
    title: 'Documentation, Communication & Referral',
    subtitle: 'Recording, Reporting and Closing the Loop With the Care Team',
    duration: '60 min',
    points: 0.5,
    description:
      'The shortest module in the program, and the one that protects everything you do in the other seven. Concussion rehabilitation is a shared-care activity: an Accredited Exercise Physiologist (AEP) almost never works alone, and the value of your reconditioning work is only realised when it is recorded clearly and communicated back to the referring clinician. This module covers the four EP-scope documents every concussion AEP produces — a BCTT/assessment record, a session and progression tracking sheet, an EP-to-referrer communication letter, and a return-to-activity progress note — each shown as a real, copyable artifact with the specific structure, framing language and scope boundary built in. It also covers the medico-legal three jobs of records, the record-within-scope principle, Australian Privacy Principles compliance, and a tool-neutral note on AI-assisted clinical documentation. The governing principle throughout: within your scope you recommend and report; you do not diagnose and you do not grant medical clearance for return to contact.',
  },
]

export function getEpModulesMeta(): ModuleMeta[] {
  return epModulesMeta
}
