/**
 * Hub Program asset library — discharge templates, outreach templates,
 * admin micro-course content.
 *
 * RESTRICTED: This content is B2B-exclusive to the Hub Program and is
 * ONLY rendered inside token-gated prospect portals (`/proposals/*` and
 * eventually `/p/[token]/*`). It must NEVER appear in:
 *   - public sitemap.ts
 *   - llms.txt
 *   - the /courses public catalogue
 *   - public SiteNav
 *
 * Robots.txt disallows /proposals/ and every renderer route applies
 * `robots: noindex, nofollow` metadata.
 */

export interface ClinicContext {
  shortName: string
  fullName: string
  city: string
  state: string
  contactFirstName: string
  region: string
}

export interface TemplateSection {
  heading?: string
  body: string[]
}

export interface DischargeTemplate {
  slug: string
  title: string
  audience: string
  purpose: string
  estimatedReadMinutes: number
  /** Fields the clinic merges per patient at delivery. */
  mergeFields: string[]
  sections: TemplateSection[]
  /** Compliance + medicolegal footer rendered on every issued document. */
  complianceFooter: string[]
  /** Optional supplementary notes (designer/clinician guidance, not patient-facing). */
  footnotes?: string[]
}

/**
 * Global documentation principles — render on the back/last page of every
 * compiled template document or in the clinic's standard operating procedure.
 * Reviewed against AHPRA record-keeping standards, the 2023 Amsterdam Consensus
 * Statement, Australian Privacy Principles, and indemnity-insurer expectations
 * (Avant, Guild, MIPS — generic to AHPRA-registered allied health practice).
 *
 * NOT a substitute for the clinic's own indemnity insurer review. Recommend the
 * clinic's PI insurer signs off on the local-letterhead version before issue.
 */
export const DOCUMENTATION_PRINCIPLES = {
  title: 'Documentation principles',
  body: [
    'Every issued document is prepared with reasonable clinical care and skill, consistent with the 2023 Amsterdam Consensus Statement on Concussion in Sport, AHPRA record-keeping standards, and the registered clinician\'s scope of practice.',
    'The treating clinician retains professional responsibility for clinical decisions, findings and recommendations recorded herein. The treating clinician\'s name, AHPRA registration number, qualification and contact details appear on every issued document.',
    'Patient (or parent/guardian for minors) consent is obtained before preparation and disclosure of any document to a named recipient (GP, school, club, insurer, NDIA). Consent is documented in the clinical record.',
    'Findings reflect the clinical presentation on the date of assessment. Subsequent presentation may differ; updated documents are issued at each clinical review.',
    'Where activity or duty resumption requires medical clearance under sport governing-body, employer, insurer, or regulatory requirements that extend beyond the treating clinician\'s scope, that clearance is to be arranged separately. The treating clinician will facilitate referral where appropriate.',
    'AI tools used to assist drafting are restricted to AU-data-residency, healthcare-purpose-built scribes (Tier A) with explicit patient consent. All AI-assisted drafting is reviewed and edited by the named clinician before issue. Patient-identifiable information is not disclosed to overseas-hosted general-purpose AI tools without specific consent and APP 8 compliance.',
  ],
}

export interface OutreachTemplate {
  slug: string
  title: string
  audience: string
  purpose: string
  channel: 'email' | 'letter' | 'phone-script' | 'one-pager'
  subject?: string
  sections: TemplateSection[]
  followUpSchedule?: { day: number; action: string }[]
}

export interface AdminCourseModule {
  id: number
  slug: string
  title: string
  durationMinutes: number
  learningOutcomes: string[]
  sections: TemplateSection[]
  knowledgeCheck?: {
    question: string
    options: string[]
    correctIndex: number
    rationale: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 DISCHARGE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export const DISCHARGE_TEMPLATES: DischargeTemplate[] = [
  {
    slug: 'gp-handover-letter',
    title: 'GP Handover Letter — Post-Concussion Assessment',
    audience: 'Patient\'s general practitioner',
    purpose: 'Communicate the concussion assessment, working diagnosis, current management, and recommended follow-up to the patient\'s GP.',
    estimatedReadMinutes: 5,
    mergeFields: ['patient_name', 'patient_dob', 'gp_name', 'gp_practice', 'date_of_injury', 'mechanism', 'date_of_assessment', 'scat6_symptom_severity', 'voms_findings', 'bess_score', 'cervical_findings', 'current_stage', 'red_flags_present', 'clinician_name', 'ahpra_number', 'clinic_name', 'review_date', 'sst_initial_hrt', 'sst_latest_hrt', 'sst_band', 'sst_sessions', 'sst_duration', 'sst_recovery_statement'],
    sections: [
      {
        heading: 'Re: {patient_name}, DOB {patient_dob}',
        body: [
          'Dear Dr {gp_name},',
          'Thank you for entrusting {patient_name}\'s post-concussion care. {patient_name} was assessed at {clinic_name} on {date_of_assessment}, {time_since_injury} following a mechanism described as {mechanism}.',
        ],
      },
      {
        heading: 'Working diagnosis',
        body: [
          'Acute sport-related concussion (or mild traumatic brain injury, S06.0), consistent with the 2023 Amsterdam Consensus Statement definition. Standard neuroimaging not clinically indicated at this stage.',
        ],
      },
      {
        heading: 'Assessment findings',
        body: [
          'SCAT6 symptom severity score: {scat6_symptom_severity} / 132. Total number of symptoms: see attached.',
          'Vestibular/Ocular Motor Screening (VOMS): {voms_findings}',
          'Modified Balance Error Scoring System (BESS): {bess_score} errors.',
          'Cervical spine assessment: {cervical_findings}',
          'Red flag screen: {red_flags_present}',
        ],
      },
      {
        heading: 'Objective exercise-tolerance measures (SST Trainer)',
        body: [
          'Graded exertion testing (Buffalo Concussion Treadmill/Bike Test protocol) was used to measure the heart-rate threshold (HRt) at which symptoms are provoked, and to prescribe a sub-symptom aerobic training band per the 2023 Amsterdam consensus.',
          'Initial measured HRt: {sst_initial_hrt}. Most recent measured HRt: {sst_latest_hrt}. Prescribed sub-symptom training band: {sst_band}.',
          'Clinician-supervised training sessions completed: {sst_sessions}, over {sst_duration}.',
          '{sst_recovery_statement}',
        ],
      },
      {
        heading: 'Management plan',
        body: [
          'Stage in graduated return-to-activity protocol: {current_stage} (of 6, per Amsterdam 2023).',
          'Patient has been provided written instructions on symptom-limited activity, sleep hygiene, hydration, and red flag identification.',
          'Cervical contribution is being addressed in clinic with appropriate manual therapy and exercise.',
          'A graduated return-to-school/work/sport plan has been issued and provided to relevant parties.',
        ],
      },
      {
        heading: 'Recommended follow-up',
        body: [
          'Clinical review at {clinic_name} scheduled for {review_date}.',
          'GP review recommended if: symptoms persist beyond 14 days (adult) / 28 days (paediatric); any red flag develops; mental health concerns emerge; or patient requires medical clearance for full-contact return-to-play.',
          'Specialist referral pathway available if persistent post-concussion symptoms develop (>4 weeks).',
        ],
      },
      {
        heading: 'Yours sincerely',
        body: [
          '{clinician_name}',
          'AHPRA Registration: {ahpra_number}',
          '{clinic_name}',
        ],
      },
    ],
    complianceFooter: [
      'Prepared with reasonable clinical care and skill, consistent with the 2023 Amsterdam Consensus Statement on Concussion in Sport and aligned with RACGP concussion management guidance and AHPRA record-keeping standards.',
      'Findings reflect the clinical presentation on {date_of_assessment}. Subsequent presentation may differ; this letter will be updated at each clinical review.',
      'Patient consent obtained for preparation and disclosure of this report to the named GP recipient. Consent documented in the clinical record.',
      '{clinician_name} retains professional responsibility for the clinical findings and recommendations herein. AHPRA Registration: {ahpra_number}.',
    ],
    footnotes: [
      'Designer note: render compliance footer in small type at the foot of every page. Merge fields in {curly_braces} populated per patient at delivery — never leave an unfilled field.',
    ],
  },
  {
    slug: 'school-rtp-authorisation',
    title: 'School Return-to-Play / Return-to-Learn Authorisation',
    audience: 'School principal, PE department, year-level coordinator',
    purpose: 'Provide structured guidance to the school on a student\'s graduated return to learning and sport following concussion.',
    estimatedReadMinutes: 4,
    mergeFields: ['student_name', 'dob', 'school_name', 'year_level', 'date_of_injury', 'date_of_assessment', 'current_stage_learn', 'current_stage_sport', 'plan_start_date', 'review_date', 'clinician_name', 'ahpra_number', 'clinic_name', 'clinic_phone', 'parent_contact', 'date'],
    sections: [
      {
        heading: 'To: {school_name}',
        body: [
          'Attention: Principal / Year-Level Coordinator / Head of PE',
          'Re: {student_name}, Year {year_level}, DOB {dob}',
        ],
      },
      {
        heading: 'Clinical summary',
        body: [
          '{student_name} sustained a concussion on {date_of_injury} and was assessed at {clinic_name} on {date_of_assessment}.',
          'Current return-to-learn stage: {current_stage_learn} (of 4).',
          'Current return-to-sport stage: {current_stage_sport} (of 6, per Amsterdam 2023). No contact sport until written medical clearance.',
        ],
      },
      {
        heading: 'Return-to-learn — accommodations requested',
        body: [
          'Reduced screen time; permission to use printed materials where possible.',
          'Allowance for breaks during prolonged cognitive tasks.',
          'Extended time on assessments if symptoms present.',
          'Permission to leave class early or arrive late if symptoms warrant.',
          'No PE participation until cleared (see below).',
        ],
      },
      {
        heading: 'Return-to-sport — restrictions',
        body: [
          'Stages 1-3 (symptom-limited activity → light aerobic → sport-specific exercise without head impact): may participate in school PE only at the corresponding intensity. NO contact, NO heading, NO ball drills with head-impact risk.',
          'Stage 4 (non-contact training drills): may participate fully in non-contact PE.',
          'Stage 5 (full-contact practice) and Stage 6 (return to competition): only after written medical clearance from a treating clinician.',
        ],
      },
      {
        heading: 'If symptoms return',
        body: [
          'If {student_name} reports headache, dizziness, nausea, vision changes, difficulty concentrating, or unusual fatigue at school, please:',
          '1. Withdraw from current activity immediately.',
          '2. Allow rest in a quiet, low-stimulus environment.',
          '3. Contact parent/guardian: {parent_contact}.',
          '4. Contact treating clinic if concerned: {clinic_name}, {clinic_phone}.',
          'Red flags (worsening headache, vomiting, increasing confusion, seizure, weakness) require immediate medical review — call 000 or attend the nearest ED.',
        ],
      },
      {
        heading: 'Authorisation',
        body: [
          'Issued by: {clinician_name}, AHPRA Registration: {ahpra_number}',
          '{clinic_name} · {clinic_phone}',
          'Date issued: {date} · Plan start: {plan_start_date} · Review: {review_date}',
        ],
      },
    ],
    complianceFooter: [
      'Prepared in line with the 2023 Amsterdam Consensus Statement (graduated return-to-sport / return-to-learn protocols) and Australian school-sport governing-body requirements. AHPRA record-keeping standards apply.',
      'Parent/guardian consent obtained for preparation of this authorisation and disclosure to {school_name}. Consent documented in the clinical record.',
      'Medical clearance for full-contact return-to-play (Stage 5–6) is issued separately by a qualified medical practitioner where governing-body protocols require it (AFL, NRL, Rugby Australia, FA, school sport associations). The treating clinician will facilitate referral where appropriate.',
      '{clinician_name}, AHPRA Registration {ahpra_number} — retains professional responsibility for the clinical recommendations herein.',
    ],
    footnotes: [
      'Designer note: prominent display of red-flag protocol on page 1 is medicolegally important — do not bury it.',
    ],
  },
  {
    slug: 'parent-symptom-management-plan',
    title: 'Parent / Family Symptom Management Plan',
    audience: 'Patient\'s parent or family member',
    purpose: 'Plain-English plan for monitoring and supporting a child\'s recovery at home.',
    estimatedReadMinutes: 5,
    mergeFields: ['child_name', 'dob', 'date_of_injury', 'parent_name', 'review_date', 'clinic_name', 'clinic_phone'],
    sections: [
      {
        heading: 'Helping {child_name} recover',
        body: [
          'Dear {parent_name},',
          'This plan explains what to expect after {child_name}\'s concussion on {date_of_injury}, and what you can do at home to support recovery.',
        ],
      },
      {
        heading: 'What is a concussion?',
        body: [
          'A concussion is a temporary disturbance in brain function caused by a knock, bump, or jolt. Standard CT and MRI scans usually look normal — the injury is functional, not structural.',
          'Most concussions resolve within 7-28 days in children and adolescents. A small proportion (10-20%) take longer.',
        ],
      },
      {
        heading: 'The first 24-48 hours',
        body: [
          'Rest is helpful for the first 24-48 hours, but complete dark-room rest is no longer recommended beyond that.',
          'Reintroduce light activities (gentle walking, reading short passages, low screen use) as tolerated. Avoid anything that significantly worsens symptoms.',
          'Sleep is important. Wake them if you\'re concerned about red flags, but otherwise let them rest.',
        ],
      },
      {
        heading: 'Symptoms to expect (normal recovery)',
        body: [
          'Headache, dizziness, fatigue, feeling "in a fog", trouble concentrating, mild irritability, light or noise sensitivity, sleep disruption.',
          'These typically improve gradually over 1-4 weeks. Some children feel emotionally flat or anxious for a period — this is part of recovery.',
        ],
      },
      {
        heading: 'Red flags — call 000 or go to ED immediately',
        body: [
          '• Worsening headache that doesn\'t improve',
          '• Repeated vomiting',
          '• Increasing confusion or drowsiness, or difficulty waking',
          '• Seizure or fit',
          '• Vision changes — double vision, loss of vision in one eye',
          '• Weakness or numbness in arms or legs',
          '• Unusual behaviour or any symptom that worries you',
        ],
      },
      {
        heading: 'Return to learning and sport',
        body: [
          'A separate school plan has been issued — please give it to the school office or year-level coordinator.',
          'No contact sport until written medical clearance from us.',
          'Return-to-play follows a graduated 6-stage protocol. Rushing it raises the risk of a second concussion before full recovery (which can cause serious harm).',
        ],
      },
      {
        heading: 'Screens, devices and homework',
        body: [
          'Screens often worsen symptoms early on. Reduce screen time for the first week and increase only as tolerated.',
          'Homework can usually resume in short blocks (15-30 minutes) within the first week, with breaks.',
          'If symptoms return during screen use or homework, take a break and try again later.',
        ],
      },
      {
        heading: 'Next steps',
        body: [
          'Review appointment: {review_date}',
          'If you have questions before then, call {clinic_name} on {clinic_phone}.',
          'For red flags or emergency symptoms, do not wait — call 000 or attend the nearest ED.',
        ],
      },
    ],
    complianceFooter: [
      'This plan is information for parents/guardians supporting recovery at home. It does not replace clinical review. Red flags require immediate medical review at the nearest emergency department or call 000.',
      'Prepared by {clinician_name}, AHPRA Registration {ahpra_number}, in line with the 2023 Amsterdam Consensus Statement on Concussion in Sport.',
      'Parent/guardian consent obtained for preparation of this plan. The treating clinician retains professional responsibility for the clinical recommendations herein.',
    ],
    footnotes: [
      'Designer note: plain English readability — target a Year 8 reading level. Avoid medical jargon. Red flag list must be visually prominent.',
    ],
  },
  {
    slug: 'sports-club-rtp-certificate',
    title: 'Sports Club Return-to-Play Certificate',
    audience: 'Sports club, coach, team manager, parent-coach',
    purpose: 'Written certification that a player has completed a graduated return-to-play protocol and is cleared for full participation.',
    estimatedReadMinutes: 3,
    mergeFields: ['player_name', 'dob', 'club_name', 'sport', 'date_of_injury', 'date_of_clearance', 'stages_completed', 'medical_clearance_clinician', 'medical_clearance_date', 'clinician_name', 'ahpra_number', 'clinic_name', 'review_required'],
    sections: [
      {
        heading: 'Return-to-Play Clearance',
        body: [
          'Player: {player_name} (DOB {dob})',
          'Club: {club_name} · Sport: {sport}',
          'Date of original injury: {date_of_injury}',
          'Date of clearance: {date_of_clearance}',
        ],
      },
      {
        heading: 'Confirmation',
        body: [
          'I confirm that {player_name} has completed the graduated return-to-play protocol per the 2023 Amsterdam Consensus Statement on Concussion in Sport, supervised at {clinic_name}:',
          '✓ Stage 1: Symptom-limited activity',
          '✓ Stage 2: Light aerobic exercise',
          '✓ Stage 3: Sport-specific exercise without head impact',
          '✓ Stage 4: Non-contact training drills',
          '✓ Stage 5: Full-contact practice',
          'Each stage was tolerated for ≥24 hours without symptom recurrence before progression.',
          'Where sport governing-body protocols require medical clearance issued by a qualified medical practitioner (AFL, NRL, Rugby Australia, FA, school sport associations), that clearance was completed by {medical_clearance_clinician} on {medical_clearance_date}. (If issued by the same clinician, restate here; if by a separate doctor, identify them.)',
        ],
      },
      {
        heading: 'Clearance status',
        body: [
          '{player_name} has completed the supervised graduated return-to-play protocol within the scope of {clinician_name}\'s practice and, where required, medical clearance from a qualified medical practitioner. Full Stage 6 return-to-play, including full contact, is effective {date_of_clearance}.',
          'Sport-specific governing body protocols (AFL / NRL / Rugby Australia / FA / school sport) apply in addition to this clearance.',
        ],
      },
      {
        heading: 'If a further suspected concussion occurs',
        body: [
          'Any new head impact or suspected concussion event requires the player to be immediately withdrawn from play and assessed by a qualified clinician before any return to activity.',
          'This clearance does not extend to subsequent injury events.',
        ],
      },
      {
        heading: 'Certifying clinician',
        body: [
          '{clinician_name}',
          'AHPRA Registration: {ahpra_number}',
          '{clinic_name}',
          'Issued: {date_of_clearance}',
        ],
      },
    ],
    complianceFooter: [
      'Prepared with reasonable clinical care and skill, consistent with the 2023 Amsterdam Consensus Statement on Concussion in Sport. {clinician_name}, AHPRA Registration {ahpra_number}, retains professional responsibility for the supervision recorded herein.',
      'This certificate confirms completion of the graduated return-to-play protocol within the scope of the certifying clinician\'s practice. Where sport governing-body protocols require medical clearance issued by a qualified medical practitioner, that clearance is completed separately (and noted above).',
      'Parent/guardian consent obtained for preparation of this certificate (paediatric athletes). Patient consent obtained for adult athletes.',
      'Valid only for the injury event dated {date_of_injury}. New events require fresh assessment.',
    ],
    footnotes: [
      'Designer note: name fields for both the supervising clinician AND the medical clearance practitioner (if separate) — the certificate must show both clearly when scope requires both.',
    ],
  },
  {
    slug: 'workcover-concussion-report',
    title: 'WorkCover Concussion Report',
    audience: 'WorkCover / insurer / employer return-to-work coordinator',
    purpose: 'Structured report for workers\' compensation claims involving concussion, supporting return-to-work decisions.',
    estimatedReadMinutes: 6,
    mergeFields: ['patient_name', 'dob', 'employer_name', 'occupation', 'date_of_injury', 'mechanism', 'claim_number', 'date_of_assessment', 'scat6_total', 'voms_findings', 'bess_score', 'current_capacity', 'restrictions', 'review_date', 'clinician_name', 'ahpra_number', 'clinic_name', 'date', 'sst_initial_hrt', 'sst_latest_hrt', 'sst_band', 'sst_sessions', 'sst_duration', 'sst_recovery_statement'],
    sections: [
      {
        heading: 'WorkCover concussion report',
        body: [
          'Patient: {patient_name} (DOB {dob})',
          'Employer: {employer_name} · Occupation: {occupation}',
          'Claim number: {claim_number}',
          'Date of injury: {date_of_injury} · Date of assessment: {date_of_assessment}',
        ],
      },
      {
        heading: 'Incident summary',
        body: [
          'Mechanism: {mechanism}',
          'Loss of consciousness: per patient history (note: presence or absence of LOC does not determine concussion severity).',
          'Immediate care: as documented in incident report; assessed at our clinic on {date_of_assessment}.',
        ],
      },
      {
        heading: 'Clinical findings',
        body: [
          'SCAT6 symptom severity score: {scat6_total} / 132.',
          'Vestibular/Ocular Motor Screening (VOMS): {voms_findings}',
          'Modified BESS: {bess_score} errors.',
          'Cervical spine examination findings: documented in chart.',
          'Standard neuroimaging not clinically indicated. No red flags identified.',
        ],
      },
      {
        heading: 'Objective exercise-tolerance measures (SST Trainer)',
        body: [
          'Graded exertion testing on the Buffalo Concussion Treadmill/Bike Test protocol was used to measure the heart rate at which symptoms are provoked (the heart-rate threshold, HRt) and to prescribe a sub-symptom aerobic training band.',
          'Initial measured HRt: {sst_initial_hrt}. Most recent measured HRt: {sst_latest_hrt}. Prescribed sub-symptom training band: {sst_band}.',
          'Clinician-supervised training sessions completed: {sst_sessions}, over {sst_duration}.',
          '{sst_recovery_statement}',
        ],
      },
      {
        heading: 'Diagnosis',
        body: [
          'Acute concussion (mild traumatic brain injury, S06.0), per 2023 Amsterdam Consensus Statement.',
        ],
      },
      {
        heading: 'Current functional capacity',
        body: [
          'Current work capacity: {current_capacity}',
          'Restrictions: {restrictions}',
          'Anticipated progression: most adult concussions resolve within 14 days. A small proportion experience persistent symptoms beyond 4 weeks.',
        ],
      },
      {
        heading: 'Suitable duties and return-to-work plan',
        body: [
          'Stage 1 (current): Symptom-limited duties only. Light cognitive load tolerated.',
          'Stage 2: Half-day duties at base level. No safety-critical tasks. No driving if vision/balance affected.',
          'Stage 3: Full days at base duties. Continued cognitive-load monitoring.',
          'Stage 4: Progressive return to full role responsibilities.',
          'Each stage requires symptom tolerance for ≥24-48 hours before progression. Safety-critical roles (driving heavy vehicles, operating machinery, working at heights) require formal medical clearance before resumption.',
        ],
      },
      {
        heading: 'Review and follow-up',
        body: [
          'Clinical review scheduled: {review_date}',
          'Updated report will be provided to WorkCover at each review point or significant change in capacity.',
          'Specialist referral pathway available if persistent post-concussion symptoms develop (>4 weeks post-injury).',
        ],
      },
      {
        heading: 'Reporting clinician',
        body: [
          '{clinician_name}',
          'AHPRA Registration: {ahpra_number}',
          '{clinic_name}',
          'Date: {date}',
        ],
      },
    ],
    complianceFooter: [
      'Prepared with reasonable clinical care and skill, consistent with the 2023 Amsterdam Consensus Statement on Concussion in Sport and AHPRA record-keeping standards.',
      'Findings reflect the clinical presentation on {date_of_assessment}. Capacity and restrictions may change with recovery — an updated report will be issued at each clinical review.',
      'Patient consent obtained for preparation and disclosure of this report to WorkCover / the named insurer and to the employer return-to-work coordinator. Consent documented in the clinical record.',
      'Safety-critical roles (driving heavy vehicles, operating machinery, working at heights) require formal medical clearance issued by a qualified medical practitioner before resumption. The treating clinician will facilitate referral where appropriate.',
      '{clinician_name}, AHPRA Registration {ahpra_number} — retains professional responsibility for the clinical findings and recommendations herein.',
    ],
    footnotes: [
      'Designer note: WorkCover bodies expect a structured, objective report. Avoid templated phrasing — populate the {current_capacity} and {restrictions} fields with specific clinical detail per patient.',
    ],
  },
  {
    slug: 'ndis-allied-health-report',
    title: 'NDIS Allied Health Concussion Report',
    audience: 'NDIS planner / Local Area Coordinator / Support Coordinator',
    purpose: 'Structured allied health report for NDIS participants where concussion is a contributing factor to functional capacity.',
    estimatedReadMinutes: 7,
    mergeFields: ['participant_name', 'ndis_number', 'dob', 'plan_review_date', 'date_of_injury', 'date_of_assessment', 'presenting_concerns', 'functional_impact', 'goals', 'recommended_supports', 'clinician_name', 'ahpra_number', 'clinic_name', 'date', 'sst_initial_hrt', 'sst_latest_hrt', 'sst_band', 'sst_sessions', 'sst_duration', 'sst_recovery_statement'],
    sections: [
      {
        heading: 'NDIS Allied Health Report — Concussion / Acquired Brain Injury Contribution',
        body: [
          'Participant: {participant_name} (DOB {dob})',
          'NDIS number: {ndis_number}',
          'Plan review date: {plan_review_date}',
          'Reporting clinician: {clinician_name} ({clinic_name})',
          'Date of report: {date}',
        ],
      },
      {
        heading: 'Reason for report',
        body: [
          'This report documents the functional impact of a concussion sustained on {date_of_injury} and the recommended allied health supports under the participant\'s NDIS plan.',
          'Concussion is recognised as a mild traumatic brain injury and may meaningfully affect daily function, particularly when persistent post-concussion symptoms (PPCS) emerge beyond 4 weeks.',
        ],
      },
      {
        heading: 'Presenting concerns',
        body: [
          '{presenting_concerns}',
        ],
      },
      {
        heading: 'Assessment',
        body: [
          'Comprehensive concussion assessment conducted at {clinic_name} on {date_of_assessment}, including symptom severity, vestibular/ocular motor function, balance, cervical contribution, and functional impact screening.',
          'Specific findings are documented in the clinical record and available to the NDIS on request.',
        ],
      },
      {
        heading: 'Objective exercise-tolerance measures (SST Trainer)',
        body: [
          'Graded exertion testing (Buffalo Concussion Treadmill/Bike Test protocol) measures the heart rate at which symptoms are provoked (the heart-rate threshold, HRt) — an objective marker of exercise tolerance that is tracked over the rehabilitation episode.',
          'Initial measured HRt: {sst_initial_hrt}. Most recent measured HRt: {sst_latest_hrt}. Prescribed sub-symptom training band: {sst_band}.',
          'Clinician-supervised training sessions completed: {sst_sessions}, over {sst_duration}.',
          '{sst_recovery_statement}',
        ],
      },
      {
        heading: 'Functional impact',
        body: [
          '{functional_impact}',
          'Impact domains may include: cognitive endurance, vestibular tolerance, headache burden, sleep regulation, mental health, occupational/educational participation, and social functioning.',
        ],
      },
      {
        heading: 'Participant goals',
        body: [
          '{goals}',
        ],
      },
      {
        heading: 'Recommended allied health supports',
        body: [
          '{recommended_supports}',
          'Supports are aligned to participant goals and structured against evidence-based concussion rehabilitation pathways (vestibular rehab, autonomic rehabilitation, sub-symptom-threshold aerobic exercise, cognitive endurance training, cervical management).',
        ],
      },
      {
        heading: 'Documentation integrity',
        body: [
          'This report has been prepared with the participant\'s consent and reflects clinical findings on the date of assessment.',
          'No portion of this report has been produced by an automated system without clinical review. Where AI tools have been used to assist drafting, content has been reviewed and adjusted by the named clinician.',
        ],
      },
      {
        heading: 'Reporting clinician',
        body: [
          '{clinician_name}, AHPRA Registration: {ahpra_number}',
          '{clinic_name}',
          'Date: {date}',
        ],
      },
    ],
    complianceFooter: [
      'Prepared in line with NDIS allied health reporting expectations, AHPRA record-keeping standards, and the 2023 Amsterdam Consensus Statement on Concussion in Sport.',
      'Participant (or nominee) consent obtained for preparation of this report and disclosure to the NDIA / Local Area Coordinator / Support Coordinator. Consent documented in the clinical record.',
      'This report has been prepared by the named clinician. Where AI tools have assisted drafting, content has been reviewed and edited by {clinician_name} before issue. No portion of this report is produced by an automated system without clinical review.',
      'Findings reflect the clinical presentation on {date_of_assessment}. The treating clinician retains professional responsibility for the clinical findings, functional impact statements, and recommended supports recorded herein. AHPRA Registration: {ahpra_number}.',
      'Specific clinical findings, participant-specific goals, and recommended supports are populated per participant at delivery — templated phrasing is intentionally avoided to satisfy NDIA fraud-and-assurance audit expectations.',
    ],
    footnotes: [
      'Designer note: NDIA audits are sensitive to AI-template phrasing. The {presenting_concerns}, {functional_impact}, {goals}, and {recommended_supports} fields MUST be populated with participant-specific clinical content — do not leave generic.',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 6 OUTREACH TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    slug: 'school-introduction-letter',
    title: 'School Introduction — "We\'re the local concussion clinic"',
    audience: 'School principal, head of PE, school sport coordinator',
    purpose: 'Introduce the clinic as a trained, AHPRA-aligned concussion management resource for the school\'s sport program and parent body.',
    channel: 'email',
    subject: 'Concussion management resource for {school_name}',
    sections: [
      {
        heading: 'Email body',
        body: [
          'Dear {principal_name} / {head_of_pe_name},',
          'I\'m writing to introduce {clinic_name} as a local concussion management resource for {school_name}.',
          'Our team has completed structured concussion training through Concussion Education Australia (Osteopathy Australia–endorsed, AHPRA-aligned). We deliver assessment using the 2023 Amsterdam Consensus protocols (SCAT6, VOMS, BESS) and provide graduated return-to-learn and return-to-sport plans for students.',
          'We\'re reaching out to schools in our catchment because concussion is one of the most undertaught conditions in primary care, and most clinics in this area aren\'t formally positioned to manage it. We\'d like to be the clinic you can refer parents and coaches to when a head impact happens.',
          'What we can offer the school:',
          '• Same-week assessment appointments for concussion cases (priority booking).',
          '• Written return-to-learn and return-to-sport authorisations issued directly to the school.',
          '• A free 30-minute information session for PE staff, year-level coordinators, or interested parents on concussion recognition and the school\'s role in recovery.',
          '• Pre-season baseline cognitive testing as an optional paid service for sports programs.',
          'Would a brief introductory call work in the next 2-3 weeks? I\'m happy to provide more detail or visit in person.',
          'Kind regards,',
          '{clinician_name} · {clinic_name} · {clinic_phone}',
        ],
      },
    ],
    followUpSchedule: [
      { day: 7, action: 'If no reply: short follow-up email referencing the school\'s upcoming sport season.' },
      { day: 21, action: 'If still no reply: phone call to school office to confirm correct contact and offer the information session.' },
      { day: 60, action: 'Soft re-engagement at start of new term.' },
    ],
  },
  {
    slug: 'sports-club-coach-briefing',
    title: 'Sports Club Coach Briefing',
    audience: 'Sports club coach, head trainer, club manager',
    purpose: 'Position the clinic as the trained concussion resource for the club; offer baseline testing and structured RTP support.',
    channel: 'email',
    subject: '{club_name} — concussion support from {clinic_name}',
    sections: [
      {
        heading: 'Email body',
        body: [
          'Hi {coach_name},',
          '{clinic_name} is now a concussion-trained clinic and we\'re building referral relationships with local clubs ahead of the {season_year} season.',
          'Concussion sits in an awkward place for club sport — most knocks recover quickly, but the ones that don\'t are the ones that go badly. Having a clinic the club can refer to gives parents and coaches a clear path that doesn\'t depend on a busy GP triage.',
          'What we offer the club:',
          '• Same-week assessment for any player after a suspected concussion.',
          '• Written return-to-play certification once full Amsterdam 2023 graduated return-to-play protocol is completed.',
          '• A 30-minute coach + trainer briefing pre-season — sideline assessment basics, when to pull a player, what good return-to-play looks like.',
          '• Pre-season baseline cognitive screening as a paid service for the squad.',
          '• Direct line to the treating clinician if a coach is uncertain about a presentation.',
          'Worth a 10-minute call to see if there\'s a fit? Happy to come down to training one evening.',
          'Cheers,',
          '{clinician_name} · {clinic_name} · {clinic_phone}',
        ],
      },
    ],
    followUpSchedule: [
      { day: 5, action: 'If no reply: short follow-up referencing pre-season timing.' },
      { day: 14, action: 'If still no reply: phone call to club office.' },
      { day: 45, action: 'Mid-season check-in if no engagement yet.' },
    ],
  },
  {
    slug: 'gp-practice-referral-letter',
    title: 'GP Practice — Concussion Referral Pathway',
    audience: 'GP practice principal / practice manager',
    purpose: 'Establish the clinic as the local concussion referral destination for GPs needing a clear path for their concussion presentations.',
    channel: 'letter',
    subject: 'Concussion referral pathway — {clinic_name}',
    sections: [
      {
        heading: 'Letter body',
        body: [
          'Dear Practice Principal,',
          'I\'m writing to introduce {clinic_name} as a structured concussion management clinic in this catchment.',
          'GPs presenting with mild traumatic brain injury / concussion often face a difficult workflow: most cases recover with conservative management, but the 10-20% who develop persistent post-concussion symptoms benefit from structured allied health input — vestibular rehab, autonomic-targeted aerobic exercise, cervical management, and graduated return-to-activity supervision.',
          'Our team is trained through Concussion Education Australia (Osteopathy Australia–endorsed). We deliver assessment per the 2023 Amsterdam Consensus Statement (SCAT6, VOMS, BESS, cervical examination) and provide written GP handover letters at each stage of care.',
          'A referral to {clinic_name} provides:',
          '• Same-week priority appointment for acute concussion presentations.',
          '• Comprehensive assessment using current consensus tools.',
          '• Graduated return-to-learn, return-to-work, and return-to-sport plans.',
          '• Direct GP communication via structured handover letters.',
          '• Referral back for medical clearance or specialist input where appropriate.',
          '• Documentation suitable for WorkCover and NDIS where relevant.',
          'I\'d welcome the opportunity to brief your team in person — we can drop off referral pads, a short concussion-referral one-pager for the practice, and clinical contact details for direct case discussion.',
          'Kind regards,',
          '{clinician_name}, {qualification}',
          '{clinic_name} · {clinic_phone} · {clinic_email}',
        ],
      },
    ],
    followUpSchedule: [
      { day: 10, action: 'If no response: phone call to practice manager.' },
      { day: 30, action: 'In-person visit to drop off referral pads.' },
      { day: 90, action: 'Quarterly check-in once referral relationship is active.' },
    ],
  },
  {
    slug: 'contact-sport-club-partnership',
    title: 'AFL / Rugby / Football Club Partnership',
    audience: 'Senior club president, head coach, or junior development officer',
    purpose: 'Offer concussion assessment + return-to-play partnership to local AFL, rugby league, rugby union or football (soccer) clubs — the highest-volume concussion sports in Australia.',
    channel: 'email',
    subject: 'Concussion support for {club_name}',
    sections: [
      {
        heading: 'Email body',
        body: [
          'Hi {coach_name},',
          'Contact-sport concussion is the highest-volume head injury in Australian community sport — head clashes, tackle impacts, marking contests, and accidental knees during play. The current 2023 Amsterdam Consensus + AFL / Rugby Australia / FA return-to-play guidelines all require a trained clinician to clear players.',
          '{clinic_name} is now a concussion-trained allied health clinic, and we\'re reaching out to {club_name} ahead of the {season_year} season.',
          'What we can offer:',
          '• Same-week assessment for any player after a suspected concussion (juniors through to seniors).',
          '• Written return-to-play certification per AFL / Rugby / FA protocol.',
          '• Brief in-person session for senior coaches and trainers on sideline recognition.',
          '• Direct clinician contact for borderline / repeat-impact presentations.',
          'A 10-minute call to walk through what a referral pathway looks like? Happy to drop into a training session.',
          'Cheers,',
          '{clinician_name} · {clinic_name} · {clinic_phone}',
        ],
      },
    ],
    followUpSchedule: [
      { day: 7, action: 'If no reply: short follow-up referencing season timing.' },
      { day: 30, action: 'Phone call to club office.' },
    ],
  },
  {
    slug: 'community-sport-club-outreach',
    title: 'Netball / Basketball / Cricket Club Outreach',
    audience: 'Club president, head coach, or junior coordinator',
    purpose: 'Position clinic as the concussion management resource for non-contact AU community sports where concussion is under-recognised (netball collisions, basketball undercutting, cricket helmet impact, hockey stick contact).',
    channel: 'email',
    subject: 'Concussion support for {club_name}',
    sections: [
      {
        heading: 'Email body',
        body: [
          'Hi {coach_name},',
          'Concussion in netball, basketball and cricket is significantly under-recognised — collisions during marking, undercutting on rebounds, fielding impacts, and helmet contact from short-pitched bowling all produce concussions that often get missed because there\'s no obvious external injury.',
          '{clinic_name} is now a concussion-trained allied health clinic, and we\'re building referral relationships with local clubs ahead of the {season_year} season.',
          'What we offer your members:',
          '• Same-week assessment for any player after a suspected concussion (juniors through to senior squads).',
          '• Written return-to-play certification per the 2023 Amsterdam Consensus framework.',
          '• Brief on common collision-sport concussion patterns for your coaching staff and trainers.',
          '• Direct clinician contact for symptom uncertainty.',
          'A 10-minute call to see if there\'s a fit? Happy to drop into a training session.',
          'Regards,',
          '{clinician_name} · {clinic_name} · {clinic_phone}',
        ],
      },
    ],
    followUpSchedule: [
      { day: 7, action: 'If no reply: short follow-up.' },
      { day: 30, action: 'Phone call.' },
    ],
  },
  {
    slug: 'generic-capability-one-pager',
    title: 'Generic Capability One-Pager (PDF leave-behind)',
    audience: 'Any local stakeholder — GP, club, school',
    purpose: 'Single-page printable summary of the clinic\'s concussion capability, suitable as a leave-behind during in-person visits.',
    channel: 'one-pager',
    sections: [
      {
        heading: '{clinic_name} — Concussion Management',
        body: [
          'A trained, AHPRA-aligned concussion management clinic for {region}.',
        ],
      },
      {
        heading: 'Our team',
        body: [
          '• Structured concussion training via Concussion Education Australia (Osteopathy Australia–endorsed).',
          '• 14 CPD hours per treating clinician.',
          '• Assessment delivered per the 2023 Amsterdam Consensus Statement.',
        ],
      },
      {
        heading: 'What we deliver',
        body: [
          '• Acute assessment: SCAT6, SCOAT6, VOMS, BESS, cervical examination.',
          '• Structured rehabilitation: vestibular rehab, sub-symptom-threshold aerobic exercise (BCTT), cervical management, autonomic-targeted protocols.',
          '• Graduated return-to-learn, return-to-work, return-to-sport plans.',
          '• Written documentation for GPs, schools, sports clubs, WorkCover, NDIS.',
          '• Same-week priority assessment for acute presentations.',
        ],
      },
      {
        heading: 'Referral pathways',
        body: [
          '• GP referral: phone or fax referral, same-week assessment.',
          '• School referral: parent-initiated with school context provided.',
          '• Sports club referral: coach or club doctor referral; baseline testing available pre-season.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          '{clinic_name}',
          '{clinic_address}',
          '{clinic_phone} · {clinic_email}',
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 1-HOUR ADMIN WORKFLOW MICRO-COURSE — 8 modules
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_COURSE_MODULES: AdminCourseModule[] = [
  {
    id: 1,
    slug: 'recognising-concussion-at-front-desk',
    title: 'Recognising concussion at the front desk',
    durationMinutes: 8,
    learningOutcomes: [
      'Understand what a concussion is in plain English.',
      'Recognise the most common presenting patterns at reception.',
      'Know why early recognition by admin matters.',
    ],
    sections: [
      {
        heading: 'What a concussion is',
        body: [
          'A concussion is a temporary disturbance in brain function caused by a knock, bump, or jolt to the head — or to the body, with the force transmitted to the head.',
          'It is a functional brain injury. CT and MRI scans usually look normal, which is why "the scan was clear" does not mean the patient is fine.',
          'Most concussions resolve within 7-28 days. About 10-20% take longer (persistent post-concussion symptoms).',
        ],
      },
      {
        heading: 'How patients present at the front desk',
        body: [
          'Patient phones the clinic saying: "I got hit at footy on the weekend and I\'ve had a headache since." This is a concussion until proven otherwise.',
          'Patient walks in for an unrelated appointment but mentions a recent fall, car accident, sport impact, or workplace incident. Always ask: "Have you had a knock to the head recently?"',
          'Parent calls about a child who is "just not themselves" after a sport injury — even days later. This is a concussion presentation.',
          'A WorkCover claim with a head impact mechanism. Always relevant.',
          'A patient who says "I think I might have had a concussion last week but it was minor" — that\'s the one that often needs the most careful workup.',
        ],
      },
      {
        heading: 'Why your role matters',
        body: [
          'Concussion is one of the most under-recognised conditions in clinical practice. Most patients with concussion never present asking for "concussion assessment" — they present with headache, dizziness, fatigue, "feeling off", or for an unrelated reason and mention the head impact in passing.',
          'You are the first line of recognition. Catching the concussion presentation at booking means: the right clinician sees them, the right timeframe, with the right preparation.',
          'You don\'t need to diagnose. You need to recognise the pattern and route them correctly.',
        ],
      },
    ],
    knowledgeCheck: {
      question: 'A patient calls to book a general appointment for back pain. While booking, they mention they had a fall last weekend and have had a "weird headache" since. What\'s the right action?',
      options: [
        'Book the back pain appointment as normal — they didn\'t ask about the head.',
        'Flag with a clinician that the patient mentioned a recent fall + ongoing headache, and ask whether to add concussion screening to the appointment.',
        'Tell the patient to go to ED.',
        'Reschedule the back pain appointment for after the headache resolves.',
      ],
      correctIndex: 1,
      rationale: 'Recognising the pattern matters. The patient may not realise the headache is concussion-related. Flagging it to a clinician means they can decide whether to add screening to the visit, schedule a dedicated concussion appointment, or escalate. Reception isn\'t expected to diagnose — but is expected to surface the signal.',
    },
  },
  {
    id: 2,
    slug: 'phone-triage-script',
    title: 'Phone triage script — the decision tree',
    durationMinutes: 10,
    learningOutcomes: [
      'Use a structured phone script for suspected concussion presentations.',
      'Distinguish "see today" vs "schedule this week" vs "go to ED" patterns.',
      'Capture the right intake information at booking.',
    ],
    sections: [
      {
        heading: 'Opening the call',
        body: [
          'When a caller mentions any head impact, recent injury, or symptoms suggesting concussion, run the following questions in order. Document the answers in the booking note.',
        ],
      },
      {
        heading: 'Step 1 — Mechanism',
        body: [
          '"Can you tell me what happened?"',
          'Capture: when (date/time), where (sport, workplace, fall, vehicle), mechanism (direct head impact, body impact with head transmission, whiplash-type).',
        ],
      },
      {
        heading: 'Step 2 — Time-course',
        body: [
          '"When did this happen?" "Have you been assessed by anyone yet?"',
          'Within last 24 hours: this is acute. Schedule today or tomorrow if possible.',
          '2-7 days ago: still considered acute concussion. Schedule this week.',
          '>4 weeks ago with ongoing symptoms: this is persistent post-concussion symptoms (PPCS). Schedule for a longer first appointment.',
        ],
      },
      {
        heading: 'Step 3 — Red flag screen',
        body: [
          '"Are you having any of these right now? Worsening headache that\'s not improving. Vomiting. Confusion that\'s getting worse. Difficulty staying awake. A seizure or fit. Vision changes or double vision. Weakness or numbness in arms or legs."',
          'If YES to any of these — direct to ED immediately. Do not book a clinic appointment. Verbal script:',
          '"Based on what you\'re describing, this needs urgent medical review. Please go to your nearest emergency department now, or call 000 if you don\'t feel safe driving. We\'ll be available to follow up once you\'ve been cleared from there."',
          'Document the call in the patient\'s file with date, time, and red flag triggered.',
        ],
      },
      {
        heading: 'Step 4 — Booking priority',
        body: [
          'No red flags + within last 14 days + ongoing symptoms → book this week (same-week priority slot).',
          'No red flags + >4 weeks ago + persistent symptoms → book a longer first appointment (60-90 minutes).',
          'No red flags + symptoms have fully resolved + needs clearance for return-to-play → standard appointment.',
        ],
      },
      {
        heading: 'Step 5 — Pre-appointment instructions',
        body: [
          '"Before your appointment, please: bring any incident report (if WorkCover or school), bring a list of medications, and have someone available who can drive you home if your symptoms are bad on the day. Don\'t drive yourself if you\'re feeling dizzy or unfocused."',
        ],
      },
    ],
    knowledgeCheck: {
      question: 'A parent calls about their 14-year-old who took a heavy knock at footy 3 days ago. The child has had a "really bad headache that\'s getting worse" since this morning and threw up at lunch. What do you do?',
      options: [
        'Book the next available concussion assessment appointment for this week.',
        'Direct to ED immediately — the parent is describing red flags (worsening headache + vomiting).',
        'Schedule a phone consult with the clinician first.',
        'Tell them to come in today during walk-in hours.',
      ],
      correctIndex: 1,
      rationale: 'Worsening headache and repeated vomiting are red flags requiring immediate medical review at ED, not a clinic appointment. Document the call and the script you used. The clinic can follow up once the patient has been cleared from ED.',
    },
  },
  {
    id: 3,
    slug: 'red-flags-when-to-ED',
    title: 'Red flags — when to send to ED immediately',
    durationMinutes: 8,
    learningOutcomes: [
      'Recognise the five non-negotiable red flags.',
      'Use a verbal script to direct patients to ED without alarming them or under-conveying urgency.',
      'Document red-flag-triggered calls correctly.',
    ],
    sections: [
      {
        heading: 'The five non-negotiable red flags',
        body: [
          '1. Worsening headache that doesn\'t improve with rest or simple analgesia.',
          '2. Repeated vomiting (more than once or twice).',
          '3. Increasing confusion, drowsiness, or difficulty staying awake.',
          '4. Seizure or fit.',
          '5. Vision changes, weakness or numbness in arms or legs, or any new neurological symptom.',
        ],
      },
      {
        heading: 'The verbal script',
        body: [
          '"Based on what you\'re describing, this needs urgent medical review. Please go to your nearest emergency department now. If you don\'t feel safe driving or if symptoms are worsening, call 000. We\'re here to follow up once you\'ve been seen at the hospital."',
          'Stay calm. Speak slowly. Confirm they understood by asking: "Do you have a way to get to the ED safely?"',
          'If the patient hesitates: "I know it might feel like overkill, but these symptoms can\'t be safely assessed by phone or in our clinic — the hospital has the imaging and observation we don\'t."',
        ],
      },
      {
        heading: 'Documenting the call',
        body: [
          'In the patient\'s file, record:',
          '• Date and time of call.',
          '• Symptoms reported by the patient (use their words).',
          '• Red flag(s) that triggered the ED redirect.',
          '• The script used.',
          '• Patient\'s confirmation that they understood and had a way to get to ED.',
          '• Flag for clinician follow-up the next day to check in.',
        ],
      },
      {
        heading: 'What is NOT a red flag for ED',
        body: [
          'Mild headache without worsening.',
          'Feeling tired or "in a fog".',
          'Mild dizziness when standing.',
          'Sleep disturbance.',
          'Mood changes.',
          'These are normal concussion symptoms that resolve over days to weeks. They warrant clinical assessment, not ED.',
        ],
      },
    ],
    knowledgeCheck: {
      question: 'Which of the following should be sent to ED immediately?',
      options: [
        'A patient with a mild headache that has been steady for 3 days.',
        'A patient feeling tired and "foggy" 5 days after a fall.',
        'A patient whose headache has progressively worsened over the last few hours and who has now thrown up twice.',
        'A patient with mild dizziness when standing up quickly.',
      ],
      correctIndex: 2,
      rationale: 'Progressively worsening headache plus repeated vomiting are red flags requiring urgent medical review at ED — these could indicate intracranial bleeding that needs imaging and observation. The other presentations are normal concussion symptoms warranting clinical assessment.',
    },
  },
  {
    id: 4,
    slug: 'intake-form-additions',
    title: 'Intake form additions for concussion',
    durationMinutes: 7,
    learningOutcomes: [
      'Add three high-value fields to existing intake forms.',
      'Understand why each field matters clinically.',
      'Capture the data without slowing down the booking workflow.',
    ],
    sections: [
      {
        heading: 'The three fields to add',
        body: [
          'Add these three fields to your existing intake form when a concussion is suspected or is the booking reason:',
          '1. Mechanism of injury (free text).',
          '2. Date and time the patient was last symptom-free.',
          '3. Any previous concussions (number, dates if known).',
        ],
      },
      {
        heading: 'Why mechanism matters',
        body: [
          'The mechanism determines what the clinician examines and how aggressively they intervene.',
          'A direct head impact (e.g. heading a soccer ball, head hitting the ground in rugby) is different from a body impact with whiplash-style force transmission.',
          'High-energy mechanisms (cycling crash at speed, motor vehicle accident, fall from height) warrant more careful evaluation and clearer documentation.',
        ],
      },
      {
        heading: 'Why "last symptom-free" matters',
        body: [
          'The graduated return-to-play protocol requires the patient to be symptom-free at each stage before progressing.',
          'Knowing when they were last symptom-free establishes the baseline for that protocol.',
          'Also relevant for medicolegal documentation, WorkCover claims, and timing of follow-up.',
        ],
      },
      {
        heading: 'Why previous concussion history matters',
        body: [
          'Multiple prior concussions changes the risk profile — recovery may be slower, threshold for a future concussion may be lower, and chronic management may be warranted.',
          'A history of two or more concussions in the prior 12 months warrants a more cautious return-to-sport pathway and potentially a longer break.',
          'Even uncertain history is valuable — patients may not recall every event.',
        ],
      },
      {
        heading: 'Practical implementation',
        body: [
          'Add as three short questions on the existing intake form or in your booking system.',
          'When phone triage flags a concussion presentation, populate these fields during the call to save the clinician time at the appointment.',
          'These three fields take 60-90 seconds to ask but save the clinician 5-10 minutes of history-taking — a substantial workflow win.',
        ],
      },
    ],
    knowledgeCheck: {
      question: 'A patient is booking in 5 days post-injury. Which is the single most useful piece of information you can capture at booking?',
      options: [
        'Their preferred treatment style.',
        'The mechanism of injury (what hit what, at roughly what speed/force).',
        'Their preferred appointment time of day.',
        'Whether they have private health insurance.',
      ],
      correctIndex: 1,
      rationale: 'Mechanism shapes the entire assessment plan and helps the clinician prepare. The other items are useful operationally but not clinically decisive.',
    },
  },
  {
    id: 5,
    slug: 'ai-safe-documentation',
    title: 'AI-assisted documentation — the safe basics',
    durationMinutes: 10,
    learningOutcomes: [
      'Distinguish between Tier A, Tier B, and Tier C AI tools.',
      'Know what reception can use AI for and what is off-limits.',
      'Understand Australian Privacy Principle 8 in plain English.',
    ],
    sections: [
      {
        heading: 'The three tiers',
        body: [
          'Tier A — Healthcare-purpose-built AI scribes with Australian data residency. Examples: Heidi, Lyrebird (when configured for AU data residency). Acceptable for clinical documentation when consented.',
          'Tier B — General-purpose AI tools with US/overseas data residency. Examples: ChatGPT, Claude. Acceptable for non-PII admin tasks (drafting generic emails, templates, marketing copy) but NOT for patient-identifiable clinical content unless specific consent is obtained for offshore disclosure.',
          'Tier C — Free tools without enterprise privacy controls. Examples: free-tier ChatGPT, browser-based generative AI. Not acceptable for any patient-identifiable content.',
        ],
      },
      {
        heading: 'What reception can use AI for',
        body: [
          'Drafting generic patient-education emails (no PII).',
          'Summarising a clinical handover sheet for clinic display.',
          'Drafting outreach to schools, clubs, or GPs (the marketing layer).',
          'Reformatting clinical content the clinician has approved.',
        ],
      },
      {
        heading: 'What reception cannot use AI for',
        body: [
          'Drafting a discharge letter or any document that goes to a third party (GP, school, WorkCover, NDIS) using patient-identifiable information without explicit consent for AI use AND offshore disclosure if a Tier B/C tool is involved.',
          'Pasting patient names or clinical findings into a free-tier AI tool.',
          'Generating clinical content that gets sent without clinician review.',
        ],
      },
      {
        heading: 'Australian Privacy Principle 8 in plain English',
        body: [
          'APP 8 says: before you disclose personal information overseas, you need to take reasonable steps to ensure the overseas recipient handles it in line with Australian privacy expectations.',
          'In practice: using a US-hosted AI tool with patient-identifiable information is an "overseas disclosure". It requires either contractual controls (which the patient must have consented to) OR specific consent from the patient.',
          'The safest default: keep patient-identifiable content in Tier A (AU-hosted, healthcare-purpose-built) tools with patient consent.',
        ],
      },
      {
        heading: 'When in doubt',
        body: [
          'Ask the clinician.',
          'Default to NOT pasting patient information into any AI tool unless you know which tier you\'re using and what consent has been obtained.',
        ],
      },
    ],
    knowledgeCheck: {
      question: 'Which of these is an example of acceptable AI use by reception?',
      options: [
        'Pasting a patient\'s SCAT6 form text into free ChatGPT to "rewrite it for the school".',
        'Asking Tier A scribe to clean up a generic handover email template that doesn\'t name a patient.',
        'Generating a discharge letter in ChatGPT and emailing it directly without clinician review.',
        'Pasting the patient\'s full medical history into a chatbot to "ask if anything stands out".',
      ],
      correctIndex: 1,
      rationale: 'Generic template cleanup with no patient information is fine. Pasting patient-identifiable information into Tier B/C tools breaches APP 8 obligations without specific consent. Sending AI-generated clinical content without clinician review breaches documentation-integrity expectations.',
    },
  },
  {
    id: 6,
    slug: 'template-library-walkthrough',
    title: 'Template library — what lives where and how to use it',
    durationMinutes: 8,
    learningOutcomes: [
      'Know which template applies to which situation.',
      'Understand how to merge in patient data correctly.',
      'Know when to escalate template use to the clinician.',
    ],
    sections: [
      {
        heading: 'The six discharge templates',
        body: [
          '1. GP Handover Letter — for clinical communication back to the patient\'s GP after assessment or significant change.',
          '2. School Return-to-Play / Return-to-Learn Authorisation — for any paediatric or school-aged patient returning to school or sport.',
          '3. Parent Symptom Management Plan — for any paediatric concussion patient, given to parents at the end of the first appointment.',
          '4. Sports Club Return-to-Play Certificate — issued at full clearance, addressed to the club.',
          '5. WorkCover Concussion Report — for work-related concussion presentations.',
          '6. NDIS Allied Health Report — for NDIS participants where concussion contributes to functional impact.',
        ],
      },
      {
        heading: 'The six outreach templates',
        body: [
          '1. School Introduction Letter.',
          '2. Sports Club Coach Briefing.',
          '3. GP Practice Referral Pathway Letter.',
          '4. AFL / Rugby / Football Club Partnership.',
          '5. Netball / Basketball / Cricket Club Outreach.',
          '6. Generic Capability One-Pager.',
        ],
      },
      {
        heading: 'How to merge patient data',
        body: [
          'Each template has merge fields in {curly_braces}. Replace each one with the actual patient or context value before sending.',
          'Never leave a {curly_brace} unfilled — it signals AI/templated content and looks unprofessional.',
          'Always run a final read-through before sending — the human eye catches missed fields and tonal issues that automated checks miss.',
        ],
      },
      {
        heading: 'What needs clinician sign-off',
        body: [
          'Every discharge template must be reviewed and signed by the treating clinician before being sent. No exceptions.',
          'Outreach templates can be sent under the clinician\'s name with their approval of the template text — once approved as a standing template, individual sends do not need per-send sign-off.',
        ],
      },
      {
        heading: 'Where the templates live',
        body: [
          'Templates are accessible inside the Hub Program portal under "Clinical Toolkit" (discharge) and "Outreach Kit" (outreach).',
          'Each clinician on the team has access. Reception can prepare drafts but cannot send discharge documents.',
        ],
      },
    ],
  },
  {
    id: 7,
    slug: 'booking-flow-for-concussion-priority',
    title: 'Booking flow — making concussion a priority pathway',
    durationMinutes: 6,
    learningOutcomes: [
      'Set up a same-week priority slot for acute concussion presentations.',
      'Schedule follow-up appointments at the right cadence.',
      'Use calendar templates to make this routine, not ad-hoc.',
    ],
    sections: [
      {
        heading: 'The priority booking principle',
        body: [
          'A concussion patient who presents within 7 days of injury should be seen within the same week. Ideally within 48 hours.',
          'Reasons: acute symptom assessment is clinically useful; cervical contribution is best addressed early; documentation is fresher; and the patient is more likely to follow advice when seen promptly.',
          'Hold one slot per clinical day for acute concussion presentations if your clinic volume supports it.',
        ],
      },
      {
        heading: 'Follow-up cadence',
        body: [
          'First follow-up: 7-10 days after first appointment (or sooner if symptoms aren\'t improving).',
          'Second follow-up: 2-3 weeks after first appointment, before considering progression beyond Stage 3 of return-to-play.',
          'Final review: 4-6 weeks after injury, or at full clearance.',
          'For paediatric: tighter cadence — first follow-up within 5-7 days.',
        ],
      },
      {
        heading: 'Appointment durations',
        body: [
          'Acute first appointment: 60 minutes (longer than a standard appointment — concussion assessment takes time).',
          'PPCS first appointment (>4 weeks post-injury): 90 minutes.',
          'Follow-ups: 30-45 minutes.',
          'Return-to-play clearance appointment: 45 minutes.',
        ],
      },
      {
        heading: 'Calendar template tags',
        body: [
          'Tag concussion appointments with a consistent label in your booking system (e.g. "Concussion-Acute", "Concussion-PPCS", "Concussion-Followup", "Concussion-Clearance").',
          'This enables: clinician preparation, reporting on volume, and identification of patients who need a missed-follow-up nudge.',
        ],
      },
    ],
  },
  {
    id: 8,
    slug: 'knowledge-check',
    title: 'Knowledge check + certificate',
    durationMinutes: 4,
    learningOutcomes: [
      'Demonstrate working knowledge of concussion recognition at reception.',
      'Pass the 10-question knowledge check.',
      'Receive a digital certificate for the HR file.',
    ],
    sections: [
      {
        heading: 'About the knowledge check',
        body: [
          'The full knowledge check has 10 questions covering: recognition, phone triage, red flags, intake fields, AI safety, and template use.',
          'Pass mark: 8/10.',
          'Two attempts allowed. If you don\'t pass on the second attempt, the course is reset and the modules can be revisited.',
          'On passing, a digital completion certificate is issued. The certificate names the staff member, the clinic, and the completion date. It goes in the HR file as evidence of role-relevant training.',
        ],
      },
      {
        heading: 'Sample questions',
        body: [
          'Q1: Which of the following requires immediate ED referral? (Worsening headache + vomiting / Mild fatigue 5 days post-injury / Sleep disturbance / Mood changes)',
          'Q2: Where should patient-identifiable clinical information be processed by AI tools? (Tier A AU-hosted scribes with consent / Free ChatGPT / Any chatbot / It doesn\'t matter)',
          'Q3: A patient calls 5 days after a sport-related concussion with mild ongoing headache, no red flags. What\'s the booking priority? (Same-week appointment / Standard 4-week wait / Tell them to wait until symptoms resolve / Send to ED)',
        ],
      },
      {
        heading: 'After completion',
        body: [
          'Recap the most useful templates and scripts you use most often.',
          'Add the priority booking slot rule to your scheduling defaults.',
          'Establish a regular touchpoint with the clinical lead to discuss any tricky concussion presentations from the week.',
        ],
      },
    ],
  },
]
