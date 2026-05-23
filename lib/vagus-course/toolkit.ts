/**
 * Clinical toolkit for The Vagus Nerve in Clinical Practice.
 *
 * High-value clinical artefacts a clinician can adapt and ship into
 * practice the same day: assessment forms, patient handouts, referral
 * templates, treatment protocols. Same shape as the AI-course toolkit
 * — inline content rendered on the toolkit page (no PDF generation,
 * content stays current).
 */

import {
  ClipboardList,
  Stethoscope,
  FileText,
  Activity,
  Send,
  Heart,
  Wind,
  Droplet,
  AlertCircle,
  Brain,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type VagusToolkitCategory =
  | 'Assessment Forms'
  | 'Patient Handouts'
  | 'Referral Templates'
  | 'Treatment Protocols'
  | 'Clinical Reasoning Aids'

export interface VagusToolkitItem {
  id: string
  title: string
  category: VagusToolkitCategory
  oneLiner: string
  icon: LucideIcon
  /** Module slug that teaches the source material */
  taughtIn?: string
  /** Inline content — array of sections with optional headings */
  sections: Array<{ heading?: string; body: string[] }>
  /** External evidence sources for this artefact */
  sources?: string[]
}

export const VAGUS_TOOLKIT_CATEGORIES: VagusToolkitCategory[] = [
  'Assessment Forms',
  'Patient Handouts',
  'Referral Templates',
  'Treatment Protocols',
  'Clinical Reasoning Aids',
]

export const VAGUS_TOOLKIT_ITEMS: VagusToolkitItem[] = [
  // ============ ASSESSMENT FORMS ============
  {
    id: 'active-stand-test-form',
    title: 'Active stand test — recording form',
    category: 'Assessment Forms',
    oneLiner: 'Standardised in-clinic recording form for the 10-minute active stand test.',
    icon: ClipboardList,
    taughtIn: 'module-3-assessment',
    sections: [
      {
        heading: 'Patient details',
        body: [
          'Name: ______________________   DOB: ___/___/____   Date: ___/___/____',
          'Reason for test: ______________________________________________',
          'Caffeine in past 2 hours? Y / N    Exercise in past 2 hours? Y / N',
          'Current medications (esp. beta-blockers, midodrine, fludrocortisone): _______',
        ],
      },
      {
        heading: 'Supine baseline (after 5–10 min rest)',
        body: [
          'Time supine: _____ min',
          'HR: _____ bpm    BP: _____ / _____ mmHg',
          'Baseline symptoms (0–10 VAS): lightheaded ___ palpitations ___ visual changes ___',
        ],
      },
      {
        heading: 'Standing — vitals at each timepoint',
        body: [
          't = 0 min (immediately on standing): HR ___ BP ___/___',
          't = 1 min: HR ___ BP ___/___    Symptoms (free text): _________________',
          't = 3 min: HR ___ BP ___/___    Symptoms: _________________________',
          't = 5 min: HR ___ BP ___/___    Symptoms: _________________________',
          't = 10 min: HR ___ BP ___/___   Symptoms: _________________________',
        ],
      },
      {
        heading: 'Calculated changes',
        body: [
          'Maximum HR change from baseline: _____ bpm',
          'Maximum systolic BP drop: _____ mmHg    Maximum diastolic BP drop: _____ mmHg',
          'Time to maximum symptoms: _____ min',
          'Test terminated by: completed protocol / pre-syncope / patient request / supervisor decision',
        ],
      },
      {
        heading: 'Interpretation (tick one or more)',
        body: [
          '☐ Normal — HR rise < 30 bpm (40 in adolescents), BP drop < 20/10, no sustained symptoms',
          '☐ Meets POTS criterion — HR ≥ 30 bpm rise (≥40 in adolescents) sustained ≥ 5 min, no OH, symptomatic',
          '☐ Meets orthostatic hypotension criterion — systolic ↓ ≥ 20 mmHg or diastolic ↓ ≥ 10 mmHg within 3 min',
          '☐ Vasovagal-pattern response — pre-syncope with sudden HR/BP drop',
          '☐ Equivocal / inconclusive — needs cardiology / tilt-table referral',
        ],
      },
      {
        heading: 'Clinician signature',
        body: [
          'Clinician: _______________________   AHPRA reg: _______________   Date: ___/___/____',
        ],
      },
    ],
    sources: [
      'Sheldon et al. 2015 HRS expert consensus on POTS, IST, vasovagal syncope',
      'Brignole et al. 2018 ESC Guidelines on syncope diagnosis & management',
      'CSANZ 2024 position on POTS',
    ],
  },
  {
    id: 'autonomic-60sec-screen',
    title: '60-second in-clinic autonomic screen',
    category: 'Assessment Forms',
    oneLiner: 'Rapid screening battery — completes during a normal consult, triggers full active-stand-test or referral.',
    icon: Stethoscope,
    taughtIn: 'module-3-assessment',
    sections: [
      {
        heading: 'When to use',
        body: [
          'Use when a patient presents with possible autonomic symptoms (lightheadedness on standing, palpitations, exercise intolerance, post-concussion symptoms persisting > 2 weeks).',
          'Takes ~60 seconds during a routine consult. Positive findings → schedule full active stand test or refer.',
        ],
      },
      {
        heading: 'Question battery (yes / no)',
        body: [
          '1. Have you felt lightheaded, faint, or dizzy when standing up in the past 4 weeks?',
          '2. Do you notice your heart racing when you stand up or move quickly?',
          '3. Have you had any episodes of fainting or near-fainting in the past 6 months?',
          '4. Do you feel worse on hot days, in hot showers, or in stuffy rooms?',
          '5. Do you experience exercise intolerance — symptoms during or after exercise that prevent activity?',
          '6. Have your symptoms started or worsened after an illness, head injury, or COVID-19 infection?',
          '7. Do you find you need to drink more water or eat more salt than others to feel normal?',
        ],
      },
      {
        heading: 'In-clinic objective check (2 timepoints, ~60 seconds)',
        body: [
          'Sitting (after 2 min seated): HR _____ bpm   BP _____ / _____ mmHg',
          'Stand for 1 min: HR _____ bpm   BP _____ / _____ mmHg',
          'Symptoms on standing? ______________________________________________',
        ],
      },
      {
        heading: 'Action thresholds',
        body: [
          '≥3 yes responses OR HR rise ≥ 20 bpm in 1 min → schedule full 10-min active stand test (use Active Stand Test recording form)',
          'HR rise ≥ 40 bpm OR BP drop ≥ 20/10 OR syncope on test → defer further allied-health intervention, refer GP/cardiology for diagnostic workup',
          '≤2 yes responses + normal in-clinic check → autonomic cause unlikely. Document negative screen and continue with primary presenting complaint.',
        ],
      },
    ],
    sources: [
      'Adapted from items in the COMPASS-31 autonomic symptom inventory (Sletten et al. 2012)',
      'Sheldon et al. 2015 HRS expert consensus — clinical risk-stratification criteria',
    ],
  },
  {
    id: 'autonomic-symptom-diary',
    title: 'Daily autonomic symptom diary (14-day)',
    category: 'Assessment Forms',
    oneLiner: 'Two-week home tracking diary — patient self-completes, brings to follow-up. Reveals patterns invisible in single-consult data.',
    icon: FileText,
    taughtIn: 'module-3-assessment',
    sections: [
      {
        heading: 'Patient instructions',
        body: [
          'Complete this diary at the same time each day — ideally evening, looking back at the day. Takes 1–2 minutes.',
          'Bring the completed 14 days to your next appointment.',
          'Track symptoms 0–10 (0 = none, 10 = worst possible). Be honest — overreporting is as unhelpful as underreporting.',
        ],
      },
      {
        heading: 'Daily entries (14 rows)',
        body: [
          'Day __ / Date ___/___/____',
          'Morning HR (if home device, 1 min after standing): _____ bpm',
          'Lightheadedness today (0–10): ___    Palpitations (0–10): ___    Fatigue (0–10): ___',
          'Exercise intolerance episodes today: ___',
          'Worst symptom time of day: morning / midday / evening / nighttime / not today',
          'Trigger noted (heat, dehydration, missed meal, prolonged standing, stress)? _______',
          'Sleep last night (hours): ___   Fluids today (litres approx): ___   Caffeine: ___',
          '',
        ],
      },
      {
        heading: 'Clinician interpretation prompts',
        body: [
          'Pattern recognition — is symptom severity correlated with: dehydration days · missed-meals · poor sleep · menstrual phase · time of day · heat exposure?',
          'Day-to-day variability — high variability suggests autonomic instability (more typical of POTS/post-concussion) than fixed structural disease',
          'Morning HR drift — sustained morning standing HR > 100 bpm or rising over the 14 days warrants further workup',
        ],
      },
    ],
    sources: [
      'Pattern-tracking principle adapted from chronic-disease self-monitoring literature',
      'Vernino et al. 2021 NIH consensus — variability is part of the POTS phenotype',
    ],
  },

  // ============ PATIENT HANDOUTS ============
  {
    id: 'handout-understanding-autonomic',
    title: 'Patient handout — Understanding autonomic dysfunction',
    category: 'Patient Handouts',
    oneLiner: 'One-page plain-language explainer covering what the autonomic system does and what dysfunction means.',
    icon: Brain,
    taughtIn: 'module-1-anatomy',
    sections: [
      {
        heading: 'What is the autonomic nervous system?',
        body: [
          'Your autonomic nervous system runs the parts of your body you don\'t consciously control: heart rate, blood pressure, breathing rate, digestion, body temperature, sweating, and pupil size.',
          'It works through two main branches that balance each other:',
          '• The sympathetic branch — the "go" system. Speeds up heart rate, raises blood pressure, prepares you for action.',
          '• The parasympathetic branch — the "rest" system. Slows heart rate, supports digestion, conserves energy. The vagus nerve is the main highway of this branch.',
          'In a healthy person, these two branches shift smoothly depending on what you\'re doing — standing up, exercising, eating, sleeping. You don\'t notice them working because the transitions are seamless.',
        ],
      },
      {
        heading: 'What is autonomic dysfunction?',
        body: [
          'Autonomic dysfunction (sometimes called "dysautonomia") means the autonomic system isn\'t balancing well. The transitions aren\'t smooth.',
          'You might notice symptoms like:',
          '• Feeling lightheaded or faint when standing up',
          '• Heart racing for no obvious reason',
          '• Exercise feels much harder than it used to',
          '• Worsening symptoms in hot weather, hot showers, or stuffy rooms',
          '• Tiredness that doesn\'t match how much you\'ve done',
          '• Brain fog, difficulty concentrating',
          'These symptoms are real and measurable. They are not "in your head" — but they also don\'t usually show up on standard heart, lung, or brain scans, which is why diagnosis can take a long time.',
        ],
      },
      {
        heading: 'What can cause it?',
        body: [
          'Common causes include:',
          '• Following an illness (long COVID is the most common trigger right now)',
          '• Following a concussion or head injury',
          '• Genetic predispositions (it sometimes runs in families)',
          '• Certain medications',
          '• Conditions like POTS (postural orthostatic tachycardia syndrome) and inappropriate sinus tachycardia',
          'In many cases the exact cause isn\'t found — and treatment focuses on managing symptoms rather than waiting for a perfect diagnosis.',
        ],
      },
      {
        heading: 'What about the vagus nerve and "vagal tone"?',
        body: [
          'The vagus nerve is real and important — it carries about 80% of the information traveling from your organs to your brain, and provides parasympathetic ("rest") output back.',
          'You may have seen claims online about "boosting vagal tone" with humming, cold water, ear massage, etc. The honest answer:',
          '• Slow-paced breathing (around 6 breaths per minute) has good evidence for increasing heart-rate variability while you\'re doing it.',
          '• Most other "vagus toning" exercises have very limited evidence beyond short-term physiological effects.',
          '• The vagus nerve does not "store trauma" — that\'s metaphor, not physiology.',
          'Your clinician is working with the parts of this that have evidence behind them.',
        ],
      },
      {
        heading: 'What to do next',
        body: [
          'Track your symptoms — patterns matter more than single bad days. Your clinician will likely give you a diary.',
          'Try the lifestyle measures your clinician recommends (often: fluids, salt, gradual exercise, paced breathing). Give them 4 weeks before judging.',
          'Mention anything new — chest pain, fainting on exercise, family history of sudden cardiac death, focal weakness — to your clinician immediately. These need different investigations.',
        ],
      },
    ],
    sources: [
      'CSANZ 2024 POTS position statement (patient-facing material)',
      'Sheldon et al. 2015 HRS expert consensus',
      'Davis et al. 2023 Nature Reviews Microbiology — long COVID autonomic features',
    ],
  },
  {
    id: 'handout-pots-what-to-expect',
    title: 'Patient handout — POTS, what to expect',
    category: 'Patient Handouts',
    oneLiner: 'Plain-language handout for patients newly diagnosed with POTS — what it is, what helps, what doesn\'t.',
    icon: Heart,
    taughtIn: 'module-4-phenotypes',
    sections: [
      {
        heading: 'What POTS actually is',
        body: [
          'Postural Orthostatic Tachycardia Syndrome (POTS) is diagnosed when your heart rate rises by 30 beats per minute or more (40 for adolescents) within 10 minutes of standing up, your blood pressure stays roughly normal, and this causes symptoms for at least 3 months.',
          'Your heart is doing extra work to compensate for poor blood return to the brain when you stand. The compensation works — but at the cost of symptoms.',
        ],
      },
      {
        heading: 'What helps (in order of evidence)',
        body: [
          '1. Fluids and salt. Most adults with POTS aim for 2–3 litres of fluid and 8–10 grams of salt per day. This expands blood volume so your heart doesn\'t have to work as hard. Your clinician will screen first for blood pressure, kidney, and heart conditions before recommending salt.',
          '2. Compression garments. Abdominal binders and high-waisted compression tights (20–30 mmHg) reduce blood pooling in the legs and gut. Wear them when you\'ll be standing for prolonged periods.',
          '3. Graded exercise. Counter-intuitive but important. Start with recumbent exercise (recumbent bike, rower, swimming) for 3–4 weeks before introducing upright exercise. Pushing too hard too early makes symptoms worse.',
          '4. Sleep and stress management. POTS symptoms worsen with poor sleep and high stress. These aren\'t "the cure" but they reduce flare-up frequency.',
          '5. Medications (if needed). Some people benefit from beta-blockers, ivabradine, midodrine, or fludrocortisone. These are prescribed by your GP or cardiologist after lifestyle measures have been trialed.',
        ],
      },
      {
        heading: 'What does NOT help (or has weak evidence)',
        body: [
          'Restrictive diets (gluten-free, dairy-free, etc.) — only if you have a separately diagnosed food intolerance, not as POTS treatment.',
          'Most "vagus nerve toning" exercises beyond slow breathing — no strong evidence for cures.',
          'Supplements marketed for "adrenal fatigue" — adrenal fatigue isn\'t a recognised medical condition.',
          '"Resetting your nervous system" programmes that cost thousands — there is no nervous-system reset switch. Be cautious of high-cost programmes promising a cure.',
        ],
      },
      {
        heading: 'When to call your doctor',
        body: [
          'Chest pain that\'s new or different to your usual symptoms',
          'Fainting episodes (not just feeling faint — actual loss of consciousness)',
          'Worsening symptoms despite 4–6 weeks of following the plan',
          'Side effects from medications',
          'Symptoms during pregnancy (POTS often changes in pregnancy — needs specialist input)',
        ],
      },
      {
        heading: 'What to expect over time',
        body: [
          'Many people with POTS see significant symptom improvement within 6–12 months of starting structured management — especially younger adults and post-viral cases.',
          'A subset of people have longer-term symptoms that need ongoing management. POTS is rarely "cured" in the way an infection is cured — it\'s managed.',
          'Tracking your symptoms over months (not days) is the right scale to judge progress.',
        ],
      },
    ],
    sources: [
      'Vernino et al. 2021 (NIH consensus part 1) · Raj et al. 2022 (NIH consensus part 2)',
      'CSANZ 2024 POTS position statement',
      'Sheldon et al. 2015 HRS expert consensus',
    ],
  },
  {
    id: 'handout-breathing-protocol',
    title: 'Patient handout — Slow-paced breathing protocol',
    category: 'Patient Handouts',
    oneLiner: 'The single evidence-supported breathing practice — 5.5 breaths/min, 10–20 min/day. Mechanism explained.',
    icon: Wind,
    taughtIn: 'module-5-interventions',
    sections: [
      {
        heading: 'What this is',
        body: [
          'Slow-paced breathing at around 5.5–6 breaths per minute is the most evidence-supported breathing practice for autonomic regulation.',
          'It increases heart-rate variability (HRV) while you\'re doing it, by tuning your breathing to your body\'s natural blood-pressure rhythm. This is called baroreflex resonance.',
          'It is NOT a cure for POTS, anxiety, or any specific condition. It is a low-risk, low-cost daily practice with measurable physiological effects.',
        ],
      },
      {
        heading: 'How to do it',
        body: [
          'Sit comfortably or lie down. Loosen tight clothing around the chest and abdomen.',
          'Set a timer for 10 minutes (start here — work up to 20).',
          'Breathe in through your nose for 5.5 seconds. Breathe out through your nose or mouth for 5.5 seconds.',
          'No hold at the top or bottom. Smooth in, smooth out.',
          'If 5.5 seconds feels too slow, start at 4–4 (4 seconds in, 4 seconds out) and work towards 5.5.',
          'Repeat for 10 minutes. Aim for daily.',
        ],
      },
      {
        heading: 'What to expect',
        body: [
          'Within the practice: heart rate may slow slightly, you may feel calmer, hands may feel warmer.',
          'After the practice: brief sense of calm, usually fading within 30–60 minutes.',
          'Over weeks: the practice gets easier, you can do longer sessions, you may notice yourself reaching for the technique during stressful moments.',
          'What you should NOT expect: a cure for chronic symptoms, dramatic personality changes, or "rewiring" of your nervous system.',
        ],
      },
      {
        heading: 'Apps that can help',
        body: [
          'Free apps that pace breathing visually: Awesome Breathing (iOS/Android), Breathwrk, Calm, Insight Timer. Any free app with a 5–6 breath/min pacer works.',
          'You don\'t need a paid programme to do this. The visual pacer is the only feature that matters.',
        ],
      },
      {
        heading: 'When to stop or modify',
        body: [
          'Lightheadedness — slow down, breathe shallower, or stop for the day.',
          'Tingling in hands, fingers, or lips — you\'re over-breathing. Reduce depth, not rate.',
          'During acute panic or hyperventilation — this technique is not the best choice in those moments. Use box breathing (4–4–4–4) instead.',
        ],
      },
    ],
    sources: [
      'Laborde et al. 2022 — meta-analysis of slow breathing & HRV',
      'Gerritsen & Band 2018 — respiratory vagal stimulation mechanism review',
    ],
  },
  {
    id: 'handout-counter-pressure',
    title: 'Patient handout — Counter-pressure manoeuvres for fainting',
    category: 'Patient Handouts',
    oneLiner: 'Visual guide to four physical manoeuvres that prevent vasovagal syncope when prodrome starts.',
    icon: AlertCircle,
    taughtIn: 'module-5-interventions',
    sections: [
      {
        heading: 'What these are',
        body: [
          'Counter-pressure manoeuvres are simple physical actions that raise your blood pressure briefly, interrupting the chain of events that leads to fainting (vasovagal syncope).',
          'They have RCT evidence — they work for the majority of people when used at the first signs of the prodrome.',
          'Use them when you notice the early warning signs: lightheadedness, vision graying, sweating, nausea, ringing in ears, sudden tiredness.',
        ],
      },
      {
        heading: 'Four manoeuvres — pick what fits the moment',
        body: [
          '1. Hand grip — squeeze a stress ball, or grip one fist with the other hand, at maximum effort for 30 seconds. Best when seated or unable to move much.',
          '2. Leg crossing + tensing — cross one leg over the other at thigh height. Tense your calf, thigh, gluteal, and abdominal muscles together for 30 seconds. Best for prolonged-standing situations.',
          '3. Arm tensing — grip one hand with the other in front of your chest. Pull outward against your own resistance at maximum effort for 30 seconds. Best when seated.',
          '4. Squatting — drop into a deep squat. Hold 30–60 seconds. Stand up slowly when symptoms resolve. Use this for severe prodrome when you can\'t safely stay standing.',
        ],
      },
      {
        heading: 'When to use them',
        body: [
          'At the first sign of prodrome — don\'t wait to see if it passes',
          'Before a known trigger (blood draw, hot crowded room, prolonged standing)',
          'When you have to stand still for extended periods (queues, ceremonies, public transport)',
        ],
      },
      {
        heading: 'When NOT to rely on them alone',
        body: [
          'If you faint without any prodrome (no warning at all)',
          'If fainting happens during exercise',
          'If you have a family history of sudden cardiac death under 40',
          'In any of these cases, you need a cardiology assessment before relying on counter-pressure manoeuvres for safety.',
        ],
      },
    ],
    sources: [
      'Sheldon et al. 2015 HRS expert consensus on POTS, IST, vasovagal',
      'Shen et al. 2017 ACC/AHA/HRS syncope guideline',
    ],
  },

  // ============ REFERRAL TEMPLATES ============
  {
    id: 'referral-gp-autonomic',
    title: 'Referral letter — GP, suspected autonomic dysfunction',
    category: 'Referral Templates',
    oneLiner: 'Template letter from allied-health to GP requesting workup of suspected autonomic dysfunction.',
    icon: Send,
    taughtIn: 'module-2-red-flags',
    sections: [
      {
        heading: 'Letterhead (your practice)',
        body: [
          '[Your clinic name + address + phone + email]',
          '[Date]',
          '',
          'Dr [GP Name]',
          '[Practice Name]',
          '[Address]',
        ],
      },
      {
        heading: 'Subject line',
        body: [
          'Re: [Patient Name], DOB [Date], Medicare [Number] — request for autonomic workup',
        ],
      },
      {
        heading: 'Body',
        body: [
          'Dear Dr [Surname],',
          '',
          'I am writing regarding your patient [Patient Name], who has been attending my clinic for [presenting reason — e.g. post-concussion management / exercise intolerance / persistent fatigue].',
          '',
          'During assessment I have identified a pattern consistent with possible autonomic dysfunction. Specifically:',
          '',
          '• Symptoms: [list — e.g. orthostatic lightheadedness, palpitations on standing, exercise intolerance, heat sensitivity, post-viral onset]',
          '• Duration: [e.g. 12 weeks, since [trigger event/illness]]',
          '• Active stand test findings: HR rose [X] bpm from supine baseline to standing at [time], BP change [X]. Symptoms reproduced during the test.',
          '• Functional impairment: [e.g. reduced from full-time work to part-time, exercise capacity reduced by 60%]',
          '',
          'I am requesting:',
          '• Full medical workup to exclude structural cardiac, endocrine (thyroid, adrenal), and haematological (anaemia) causes',
          '• 12-lead ECG and consideration of 24-hour Holter monitor',
          '• Consideration of cardiology / autonomic specialist referral if structural causes excluded',
          '',
          'In the interim, I am continuing [your management approach — e.g. graded reconditioning, fluid/salt education, breathing protocol] within my scope.',
          '',
          'I am happy to discuss further. My contact details are above.',
          '',
          'Kind regards,',
          '[Your name]',
          '[Profession + AHPRA reg]',
        ],
      },
    ],
    sources: [
      'Standard inter-professional referral structure',
      'Brignole et al. 2018 ESC syncope guidelines — recommended workup',
      'CSANZ 2024 POTS position — referral pathway recommendations',
    ],
  },
  {
    id: 'referral-cardiology-ist',
    title: 'Referral letter — Cardiology, suspected IST',
    category: 'Referral Templates',
    oneLiner: 'For when active-stand findings + clinical picture suggest inappropriate sinus tachycardia (resting tachycardia without postural pattern).',
    icon: Send,
    taughtIn: 'module-4-phenotypes',
    sections: [
      {
        heading: 'Subject line',
        body: [
          'Re: [Patient Name], DOB [Date] — referral, ?inappropriate sinus tachycardia',
        ],
      },
      {
        heading: 'Body',
        body: [
          'Dear Dr [Cardiologist],',
          '',
          'Thank you for accepting [Patient Name] for assessment.',
          '',
          'I am referring this patient with a clinical picture suggestive of inappropriate sinus tachycardia (IST):',
          '',
          '• Resting heart rate consistently > 100 bpm over multiple seated measurements (specific readings: ___)',
          '• Symptoms: palpitations, exercise intolerance, fatigue. No syncope reported.',
          '• Active stand test: HR rose only [X] bpm on standing — does NOT meet POTS criteria of ≥30 bpm rise.',
          '• 24-hour ambulatory HR (patient-reported / Apple Watch): mean HR [X] bpm, range [X-X]',
          '• No identifiable secondary cause on history (no thyroid disease, anaemia, fever, deconditioning, no stimulant use)',
          '• Symptom duration: [X] months, impacting [function]',
          '',
          'I am requesting:',
          '• Cardiology assessment',
          '• 12-lead ECG and 24-hour Holter to confirm tachycardia is sinus in origin and to rule out alternative rhythms',
          '• Thyroid function + FBC if not already screened by GP',
          '• Consideration of pharmacological management (beta-blocker or ivabradine) if IST is confirmed',
          '',
          'Patient is currently [function status — work, exercise]. Symptoms are limiting daily activity.',
          '',
          'Kind regards,',
          '[Your name + profession + AHPRA reg]',
        ],
      },
    ],
    sources: [
      'Sheldon et al. 2015 HRS expert consensus — IST diagnostic criteria',
      'CSANZ 2024 POTS position — clarifies POTS-vs-IST distinction',
    ],
  },
  {
    id: 'referral-tilt-table',
    title: 'Referral letter — Tilt-table testing language',
    category: 'Referral Templates',
    oneLiner: 'Specific clinical question wording for tilt-table referrals so cardiology accepts the request.',
    icon: Send,
    taughtIn: 'module-3-assessment',
    sections: [
      {
        heading: 'When tilt-table is the right referral',
        body: [
          'Recurrent unexplained syncope where active stand test is inconclusive',
          'Suspected vasovagal syncope where trigger pattern is unclear',
          'Suspected POTS where active stand test is borderline (HR rise 25–35 bpm)',
          'Distinguishing syncope from non-syncopal episodes (seizure, drop attack)',
        ],
      },
      {
        heading: 'Wording that gets accepted',
        body: [
          'Subject: Re: [Patient] — referral for tilt-table testing, ?vasovagal syncope / ?POTS',
          '',
          'Dear Dr [Cardiologist],',
          '',
          'I am referring [Patient Name, DOB] for tilt-table testing.',
          '',
          'Clinical context: [brief one-paragraph history — onset, frequency, triggers, prior workup]',
          '',
          'Specific clinical question: Does this patient have a (vasovagal-pattern / POTS / orthostatic-hypotensive) response under tilt that explains their presenting symptoms?',
          '',
          'Why tilt over active stand alone: [pick one — recurrent syncope despite negative active stand · need for symptom provocation under controlled conditions · need to distinguish vasovagal from POTS subtype]',
          '',
          'Prior workup completed: ECG [date/result], Holter [date/result], echo [if done], bloods [results].',
          '',
          'Patient impact: [functional status, employment / school impact].',
          '',
          'Kind regards,',
          '[Your name]',
        ],
      },
      {
        heading: 'Common rejection reasons + how to avoid',
        body: [
          'Rejection: "Try active stand first." → Fix: document that active stand was inconclusive and state why tilt is needed.',
          'Rejection: "Insufficient history." → Fix: include episode count, triggers, prior workup with specific dates.',
          'Rejection: "Refer back to GP." → Fix: send the referral via the GP rather than directly, unless your scope permits direct cardiology referral.',
        ],
      },
    ],
    sources: [
      'Brignole et al. 2018 ESC syncope guidelines — tilt-table indications',
      'Shen et al. 2017 ACC/AHA/HRS syncope guideline',
      'Sheldon et al. 2015 HRS expert consensus',
    ],
  },

  // ============ TREATMENT PROTOCOLS ============
  {
    id: 'protocol-buffalo',
    title: 'Buffalo Concussion Treadmill Test workflow',
    category: 'Treatment Protocols',
    oneLiner: 'Step-by-step BCTT delivery + HR-threshold-based exercise prescription for post-concussion autonomic recovery.',
    icon: Activity,
    taughtIn: 'module-5-interventions',
    sections: [
      {
        heading: 'When to use',
        body: [
          'Post-concussion patients within 4 weeks of injury (RCT evidence is strongest in this window).',
          'Patients with persistent post-concussion symptoms (PPCS) > 4 weeks may also benefit but evidence is observational.',
          'NOT for use in patients with cardiac contraindications, uncontrolled hypertension, or active musculoskeletal injury preventing treadmill walking.',
        ],
      },
      {
        heading: 'Pre-test screen',
        body: [
          '☐ Confirm concussion / mTBI diagnosis with date and mechanism',
          '☐ Resting BP < 160/95 mmHg, resting HR < 100 bpm',
          '☐ No chest pain, recent surgery, uncontrolled cardiac/respiratory disease',
          '☐ Patient can walk on a treadmill safely (vestibular function adequate, no severe ataxia)',
          '☐ Baseline symptom-severity score recorded (0–10 VAS for headache, dizziness, fogginess)',
          '☐ Informed consent — explain the test will deliberately provoke symptoms to identify the threshold',
        ],
      },
      {
        heading: 'Protocol — Buffalo Concussion Treadmill Test',
        body: [
          'Setup: Treadmill, HR monitor (chest-strap or wrist), symptom rating scale, BP cuff.',
          '',
          'Stage 1 — Warm-up: 2 min at 5.5 km/h, 0% incline. Record HR + symptoms.',
          'Stage 2 — Progressive incline: every 1 min, increase incline by 1% (speed stays at 5.5 km/h).',
          'Record HR + symptom score every minute.',
          '',
          'STOP TEST AT THE FIRST OF:',
          '• Symptom score rises ≥ 3 points from baseline VAS',
          '• Heart rate ≥ 85% age-predicted maximum (220 – age × 0.85)',
          '• Patient request',
          '• Any safety concern (gait, BP)',
          '',
          'Record at termination: HR (this is symptom-threshold HR, "SThr-HR"), symptoms triggered, minutes completed, peak incline.',
        ],
      },
      {
        heading: 'Exercise prescription based on SThr-HR',
        body: [
          'Training HR zone: SThr-HR × 0.80 to 0.90',
          'Example: SThr-HR = 140 bpm → training zone 112–126 bpm',
          '',
          'Prescription:',
          '• 20 minutes per day, ideally 5–6 days per week',
          '• HR-controlled (chest strap recommended for accuracy)',
          '• Mode: treadmill walking, stationary cycle, or recumbent bike — match what the patient has access to',
          '• Symptom limit: stop if symptoms rise > 2 points above baseline during the session',
          '',
          'Progression:',
          '• Re-test BCTT at 1 week to determine new SThr-HR',
          '• Adjust training zone',
          '• Continue until BCTT to 90% age-predicted max HR with no symptom rise — endpoint reached',
        ],
      },
      {
        heading: 'Common pitfalls',
        body: [
          'Going too hard — patient pushes through symptoms thinking that\'s the goal. It\'s not. Sub-threshold means strictly under symptom-threshold HR.',
          'Inconsistent HR measurement — wrist HRs lag and underread. Chest-strap if possible.',
          'Skipping the BCTT and prescribing exercise by feel — this is not the protocol. The HR threshold is the active ingredient.',
          'Not re-testing weekly — without re-testing, the prescription drifts behind the patient\'s actual recovery.',
        ],
      },
    ],
    sources: [
      'Leddy et al. 2019 JAMA Pediatrics — RCT establishing the protocol',
      'Haider et al. 2019 — BCTT validation study',
      'Leddy et al. 2010 — original BCTT description',
    ],
  },
  {
    id: 'protocol-pots-reconditioning',
    title: 'POTS reconditioning programme — 12-week structured plan',
    category: 'Treatment Protocols',
    oneLiner: 'Modified-Levine protocol for graded exercise in POTS. Recumbent → upright over 3 months.',
    icon: Activity,
    taughtIn: 'module-5-interventions',
    sections: [
      {
        heading: 'Why upright exercise alone fails in POTS',
        body: [
          'POTS patients have orthostatic intolerance — upright posture itself is the stress. Starting on an upright bike or treadmill in week 1 frequently triggers post-exertional symptom flares and patients abandon the programme.',
          'The modified Levine / Dallas protocol uses 3+ weeks of recumbent (lying down) exercise before introducing upright work. This builds cardiovascular conditioning while the patient is in the easiest posture.',
        ],
      },
      {
        heading: 'Equipment + setup',
        body: [
          'Weeks 1–3: Recumbent bike, rowing machine, or swimming (if access). NOT upright bike, NOT treadmill yet.',
          'Week 4 onwards: Add upright bike sessions.',
          'Week 8 onwards: Add treadmill walking.',
          'Throughout: HR monitor (chest strap preferred), water bottle (target 500 mL during a session), compression garments worn during exercise.',
        ],
      },
      {
        heading: 'Week-by-week structure (training HR zone target: 70–80% age-predicted max)',
        body: [
          'Week 1: 3 sessions × 25 min recumbent. RPE 4/10. Slow build, no pushing.',
          'Week 2: 3 sessions × 30 min recumbent. Add 5 min low-effort warm-up + cool-down.',
          'Week 3: 4 sessions × 30 min recumbent. Add brief 1-min higher-effort intervals (RPE 6/10) every 5 min.',
          'Week 4: 3 recumbent + 1 upright bike session (15 min only). Watch for post-exercise symptoms — if severe, pull back.',
          'Week 5: 2 recumbent + 2 upright bike (20 min). Continue intervals.',
          'Week 6: 4 upright bike sessions (25 min).',
          'Week 7: 4 upright sessions, vary modality. Add resistance training 2× /week (large muscle groups, supine or seated).',
          'Week 8: Introduce treadmill walking (15 min). Continue cycle work.',
          'Week 9–12: Build treadmill duration. Add upright resistance training. Aim for 30 min upright aerobic + 2× resistance per week.',
        ],
      },
      {
        heading: 'Progression and setback rules',
        body: [
          'If post-exercise symptoms (next-day fatigue, lightheadedness) increase: drop back one week of the programme. Do not push through.',
          'A "good" week is one without post-exertional flare. Two consecutive good weeks → progress.',
          'Total expected timeline to baseline upright activity: 12 weeks. Some patients take 6 months. Both are normal.',
        ],
      },
      {
        heading: 'Adjunctive measures throughout',
        body: [
          '2–3 L fluids/day (ensure GP has cleared salt loading first — see Salt+Fluid handout)',
          'Compression garments during exercise sessions',
          'Slow-paced breathing (10 min daily) as recovery practice',
          'Sleep 7–9 hrs/night — POTS symptoms worsen with sleep debt',
          'Avoid scheduling intense sessions before menstruation, on hot days, or when fluid-loading has been disrupted',
        ],
      },
    ],
    sources: [
      'Fu et al. 2010 (original Levine "Dallas" protocol for POTS reconditioning)',
      'Raj et al. 2022 NIH consensus part 2 — graded reconditioning recommendation',
      'CSANZ 2024 POTS — graded exercise as first-line non-pharmacological',
    ],
  },
  {
    id: 'protocol-salt-fluid',
    title: 'Salt + fluid loading protocol — POTS first-line',
    category: 'Treatment Protocols',
    oneLiner: 'Two-week titration to therapeutic salt + fluid intake. Screening criteria + monitoring built in.',
    icon: Droplet,
    taughtIn: 'module-5-interventions',
    sections: [
      {
        heading: 'When to use',
        body: [
          'Confirmed or strongly suspected POTS or other orthostatic intolerance phenotype.',
          'Patient has been screened for hypertension, kidney disease, heart failure, and pregnancy (each contraindicates standard salt loading).',
          'Allied health: can recommend the protocol but should coordinate with GP for medical clearance before initiation, especially for the salt component.',
        ],
      },
      {
        heading: 'Pre-screen (must be cleared)',
        body: [
          '☐ Baseline seated BP < 140/90 mmHg',
          '☐ No CKD, CHF, or current pregnancy',
          '☐ No salt-restrictive diet for another medical reason',
          '☐ Patient understands they\'ll need to monitor BP weekly during titration',
          '☐ Home BP cuff available (or schedule weekly clinic checks for first 4 weeks)',
        ],
      },
      {
        heading: 'Two-week titration',
        body: [
          'Week 1 — Establish baseline + start mild loading',
          'Days 1–7:',
          '• Fluids: 2 L per day, distributed (target 250 mL every 2 waking hours)',
          '• Pre-load 500 mL of water within 30 min of waking',
          '• Salt: 6 g per day (about 1 teaspoon, easiest via salt tablets 1 g × 6, or generous salting of food)',
          '• Track: weekly home BP, daily symptom score (0–10 lightheadedness)',
          '',
          'Week 2 — Titrate up if tolerated',
          'Days 8–14:',
          '• Fluids: increase to 2.5–3 L per day',
          '• Salt: increase to 8–10 g per day',
          '• Continue tracking',
        ],
      },
      {
        heading: 'Maintenance + re-evaluation at 4 weeks',
        body: [
          'After 2 weeks at full dose, maintain for 2 more weeks (total 4 weeks).',
          '',
          'At 4 weeks, re-assess:',
          '• Symptom diary trend — is daily symptom score reducing?',
          '• Active stand test — repeat. Has HR rise reduced from baseline?',
          '• BP check — has seated BP risen above 140/90? (If yes, reduce salt.)',
          '• Functional status — can patient now do more without symptoms?',
          '',
          'Outcomes:',
          '• Symptoms reduced + BP stable → maintain',
          '• Symptoms unchanged + BP stable → consider adding compression garments + graded exercise; refer GP/cardiology for med consideration',
          '• BP rising → reduce salt to 6 g, monitor for 2 more weeks',
          '• BP > 140/90 sustained → stop salt loading, refer GP',
        ],
      },
      {
        heading: 'Patient education talking points',
        body: [
          '"This isn\'t a salty snack at lunchtime — it\'s a clinical dose. We need to track it accurately."',
          '"Adding salt doesn\'t mean you have low salt — it means we\'re using salt to expand your blood volume so your heart doesn\'t work as hard when you stand."',
          '"Give it 4 weeks before judging. The first week often feels no different."',
          '"If you get headache, swelling in legs, or feel your heart pounding more — call me. It usually means we need to adjust."',
        ],
      },
    ],
    sources: [
      'Vernino et al. 2021 NIH POTS consensus part 1',
      'Raj et al. 2022 NIH POTS consensus part 2',
      'Sheldon et al. 2015 HRS — salt + fluid as first-line in POTS',
      'CSANZ 2024 POTS — non-pharmacological treatment hierarchy',
    ],
  },

  // ============ CLINICAL REASONING AIDS ============
  {
    id: 'aid-phenotype-flowchart',
    title: 'Phenotype differentiation flowchart',
    category: 'Clinical Reasoning Aids',
    oneLiner: 'Decision-tree flowchart for distinguishing POTS / IST / vasovagal / OH / anxiety-driven tachycardia in clinic.',
    icon: Brain,
    taughtIn: 'module-4-phenotypes',
    sections: [
      {
        heading: 'Use this as a quick clinical reasoning prompt',
        body: [
          'Start with the active-stand-test result + symptom pattern. Each branch below leads to the most likely phenotype + first-line next step.',
        ],
      },
      {
        heading: 'Branch 1 — Standing HR rise',
        body: [
          'Q: On active stand, does HR rise ≥ 30 bpm (≥40 in adolescents) and sustain ≥ 5 min, with symptoms but no BP drop?',
          '→ YES: POTS criteria met. Proceed to Branch 1a.',
          '→ NO: Move to Branch 2.',
        ],
      },
      {
        heading: 'Branch 1a — POTS sub-phenotype',
        body: [
          'Q: Onset post-viral or post-concussion?',
          '→ YES post-viral/COVID: post-viral POTS phenotype. Davis 2023 & Vernino 2021 inform.',
          '→ YES post-concussion: consider also post-concussion autonomic dysfunction overlap (Goodman 2022). Apply Buffalo HR-threshold protocol alongside POTS first-line.',
          '→ NO obvious trigger: idiopathic POTS. Standard first-line (salt/fluid/exercise/compression). Consider autoimmune workup if other features (positive antibodies, mast-cell activation features).',
        ],
      },
      {
        heading: 'Branch 2 — BP drop on standing',
        body: [
          'Q: Systolic ↓ ≥ 20 mmHg OR diastolic ↓ ≥ 10 mmHg within 3 min?',
          '→ YES: Orthostatic hypotension (OH). Investigate cause — medications, dehydration, autonomic neuropathy, adrenal insufficiency. GP referral.',
          '→ NO: Move to Branch 3.',
        ],
      },
      {
        heading: 'Branch 3 — Pre-syncope or syncope on test',
        body: [
          'Q: Did patient have pre-syncope or actual syncope during the test with sudden HR + BP drop?',
          '→ YES: Vasovagal pattern. Sheldon 2015 first-line — trigger avoidance, counter-pressure manoeuvres, salt/fluid as adjunct.',
          '→ NO: Move to Branch 4.',
        ],
      },
      {
        heading: 'Branch 4 — Resting tachycardia',
        body: [
          'Q: Resting seated HR consistently > 100 bpm with no HR rise on standing (HR rise on standing < 20 bpm)?',
          '→ YES: ?Inappropriate sinus tachycardia (IST). Exclude secondary causes (thyroid, anaemia, fever, stimulants). Cardiology referral if persistent.',
          '→ NO: Move to Branch 5.',
        ],
      },
      {
        heading: 'Branch 5 — All tests normal but symptoms present',
        body: [
          'Q: Active stand normal, no resting tachycardia, but patient reports postural symptoms?',
          '→ Consider:',
          '• Anxiety-driven somatic symptoms — sympathetic over-activation from threat appraisal. Refer for CBT.',
          '• Cervical-spine or vestibular contribution to dizziness — different system. Vestibular assessment.',
          '• Functional disorder / functional movement disorder — refer for neurology if signs present.',
          '• Confounding from medications, caffeine, dehydration — review and reassess.',
        ],
      },
    ],
    sources: [
      'Sheldon et al. 2015 HRS expert consensus',
      'Vernino et al. 2021 + Raj et al. 2022 NIH POTS consensus',
      'Goodman 2022 — post-concussion POTS overlap',
      'CSANZ 2024 POTS position',
    ],
  },
  {
    id: 'aid-patient-script',
    title: 'Patient communication script — explaining the diagnosis',
    category: 'Clinical Reasoning Aids',
    oneLiner: 'Word-for-word language for explaining autonomic dysfunction without resorting to oversimplified or pseudoscientific framing.',
    icon: Users,
    taughtIn: 'module-1-anatomy',
    sections: [
      {
        heading: 'When to use',
        body: [
          'First consult after the diagnosis is made. The 5–10 minutes you spend on this conversation shape every subsequent session.',
          'Replace "low vagal tone" / "nervous system dysregulation" framing — those map onto wellness-marketing concepts and set you up for disagreement later when evidence diverges from claim.',
        ],
      },
      {
        heading: 'Opening — establishing what is real',
        body: [
          '"What you\'re experiencing is real and measurable. Your heart rate is doing [X] when you stand. That\'s a physiological finding, not something you\'re imagining."',
          '"There\'s a name for the pattern: [POTS / orthostatic intolerance / post-concussion autonomic dysfunction / etc.]. Having a name helps us choose treatments that have evidence behind them."',
        ],
      },
      {
        heading: 'Explaining the mechanism — without overclaiming',
        body: [
          '"Your autonomic nervous system manages the parts of your body you don\'t consciously control — heart rate, blood pressure, digestion, temperature. When you stand up, normally it tightens the blood vessels in your legs and adjusts heart rate so blood keeps getting to your brain."',
          '"In your case, that adjustment isn\'t happening smoothly. Your heart rate is compensating by going up a lot — which is why you feel your heart racing — but the underlying mechanism is that your body isn\'t holding blood up where it needs to be."',
          '"We don\'t need to know the exact upstream cause to treat the pattern. The pattern responds to a set of interventions we\'ll work through together."',
        ],
      },
      {
        heading: 'When patient asks about "vagal tone"',
        body: [
          '"You may have read about vagal tone and various exercises online. The honest answer is: the vagus nerve is real and important, and slow-paced breathing has evidence behind it. Most of the other \'vagus toning\' practices have very limited evidence beyond a brief effect during the practice itself."',
          '"What I\'m recommending isn\'t about \'toning your vagus\' — it\'s about: expanding your blood volume so your heart doesn\'t have to work as hard, gradually rebuilding your ability to tolerate upright activity, and using breathing as a regulation tool because we know it has measurable acute effects."',
        ],
      },
      {
        heading: 'Setting realistic expectations',
        body: [
          '"This isn\'t something that gets fixed in a week. The patients who do best follow the plan consistently for 3 months before judging the result."',
          '"Most people see meaningful improvement within 3 to 6 months. A smaller group take a year or longer. Almost no one has zero improvement when they follow the plan."',
          '"You\'ll have flare-up days. They\'re not failures — they\'re information. We\'ll track them and adjust."',
        ],
      },
      {
        heading: 'Avoid these phrases (and why)',
        body: [
          '"You just need to calm your nervous system down" — sets up the patient to feel that symptoms = personal failure of self-regulation.',
          '"Your vagal tone is low" — not a diagnosis, sets up an expectation that "toning" will be the treatment, which the evidence doesn\'t support.',
          '"This is stress / anxiety / in your head" — even if anxiety is contributing, framing it this way alienates patients with genuine physiology going on, and damages the therapeutic relationship.',
          '"There\'s no cure" said bluntly — true for some phenotypes but discouraging. Instead: "We don\'t cure this so much as manage it. Many people get to a place where it doesn\'t limit them."',
        ],
      },
    ],
    sources: [
      'CSANZ 2024 POTS patient education guidance',
      'Vernino et al. 2021 NIH POTS — patient communication recommendations',
      'Grossman 2023 — critique of polyvagal framing',
    ],
  },
]

export function getVagusToolkitByCategory(category: VagusToolkitCategory): VagusToolkitItem[] {
  return VAGUS_TOOLKIT_ITEMS.filter((i) => i.category === category)
}
