import type { SectionInteractive } from '@/data/modules'

/**
 * The CRM (Concussion Rehab Mastery, for Exercise Physiologists) course's
 * interactive elements, as DATA.
 *
 * WHY THIS FILE EXISTS. CRM shipped with essentially no interactivity — eight
 * modules of prose against the flagship course's 152 widgets. The content that
 * should have been testable was already written: every module opens with a list
 * of MYTH statements it goes on to disprove, and the teaching sections carry
 * worked sequences, phenotype tables and scope boundaries. This file RETAGS
 * that existing material as interactive specs. It does not author new clinical
 * content: every explanation is built from sentences copied verbatim out of
 * data/ep-modules/module-N.ts, and every distractor is a misconception the
 * course itself already names.
 *
 * Attached to Section.interactives in data/ep-modules/index.ts — the same
 * mechanism data/modules.ts uses for CCM — so the specs travel inside the
 * ENTITLEMENT-GATED module payload (/api/ep-course/modules/[id]) and render
 * through the SHARED components/course/SectionDataInteractives.tsx. Same
 * widgets, same design, same alignment as the flagship course; no CRM variant
 * of anything.
 *
 * SERVER ONLY. Nothing in a client component may import this file, directly or
 * transitively — that would put the answer keys in a public chunk.
 * tests/course-answer-key-exposure.test.ts enforces that for this file, for the
 * EP module barrel, and for every data/ep-modules/module-N.ts.
 *
 * NOT IN THE PUBLIC TRIAL. Every EP module's first section is its myths intro,
 * and lib/preview-content.ts serves first sections publicly. The CRM trial is
 * prose-only and stays that way — getPreviewContent() withholds EP interactives
 * so the 31 myth answer keys are never served to an unentitled visitor.
 *
 * ORDERING IS CONTENT. Specs render in array order, immediately after the
 * section's prose.
 */
export const EP_MODULE_INTERACTIVES: Record<number, Record<string, SectionInteractive[]>> = {
  "201": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1: \"Complete physical and cognitive rest until fully symptom-free is the current evidence-based standard of care.\" Why is this false?",
        "options": [
          "It is not false — strict physical and cognitive rest until symptom-free remains the standard of care",
          "Prolonged rest beyond the first 24–48 hours drives deconditioning, removes the adaptive stimulus for autonomic and cerebrovascular recovery, and is associated with slower clinical recovery",
          "Rest is unhelpful only because it amplifies mood disturbance and anxiety — the physiological effects of rest are neutral",
          "No rest of any kind is indicated after concussion; normal activity should resume immediately"
        ],
        "correctAnswer": 1,
        "explanation": "Prolonged rest beyond the first 24–48 hours is now understood to be counterproductive. It drives physical deconditioning — which WORSENS the autonomic dysfunction already present, since cardiovascular deconditioning independently reduces baroreflex sensitivity and HRV. It removes the adaptive stimulus needed for autonomic and cerebrovascular recovery — the trained response that gradually raises the symptom threshold is never triggered. It is associated with SLOWER, not faster, clinical recovery in controlled trials (Schneider et al., 2017). The current model is RELATIVE (not strict) rest in the first 24–48 hours — not complete shutdown, but reduction of load to below symptomatic levels."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2: \"A clear MRI confirms the brain has recovered from concussion.\" Why is this false?",
        "options": [
          "It is not false — a normal MRI confirms the brain has recovered",
          "Routine CT and MRI image structure, not function; they are ordered to rule OUT a bleed or fracture, not to rule concussion in or out",
          "MRI is the wrong test — diffusion tensor imaging is the routine clinical scan that confirms recovery",
          "Imaging is irrelevant after a head injury and should not be ordered at all"
        ],
        "correctAnswer": 1,
        "explanation": "\"My scan was clear\" does NOT mean \"I have recovered.\" Routine CT and MRI image structure, not function. They are ordered to rule OUT a bleed or fracture — a structural emergency — not to rule IN or OUT a concussion. A patient can have a completely normal scan and a profoundly dysfunctional, energy-starved brain. Advanced imaging (diffusion tensor imaging / DTI) can detect reduced fractional anisotropy as a marker of white matter integrity disruption, but is a research tool rather than a routine clinical one."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3: \"Exercise intolerance after concussion is primarily a deconditioning problem.\" Why is this false?",
        "options": [
          "It is not false — the patient has simply lost fitness during their rest period",
          "Exercise intolerance is the convergence of three physiological impairments: the energy crisis, cerebral blood-flow dysregulation, and autonomic dysfunction",
          "It is caused solely by reduced heart rate variability",
          "It is a fear-avoidance response to activity rather than a physiological limitation"
        ],
        "correctAnswer": 1,
        "explanation": "Exercise intolerance — the reproducible provocation of concussion symptoms at a heart rate or workload well below normal capacity — is the convergence of three physiological impairments: the energy crisis (depleted ATP, metabolic depression), cerebral blood-flow dysregulation (impaired autoregulation, neurovascular uncoupling, blunted CO₂ reactivity), and autonomic dysfunction. Deconditioning compounds the picture rather than creating it: prolonged rest drives physical deconditioning — which WORSENS the autonomic dysfunction already present, since cardiovascular deconditioning independently reduces baroreflex sensitivity and HRV."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4: \"Loss of consciousness is required for a concussion diagnosis.\" Why is this false?",
        "options": [
          "It is not false — without loss of consciousness there is no concussion",
          "Only 5–10% of concussions involve any loss of consciousness; an athlete who keeps playing and has a normal CT may still have a fully significant concussion",
          "Loss of consciousness is not required, but its absence means the injury is mild and structural damage can be assumed excluded",
          "Loss of consciousness is not required, but a normal CT scan is required before the diagnosis can be made"
        ],
        "correctAnswer": 1,
        "explanation": "Only 5–10% of concussions involve any loss of consciousness. An athlete who continues playing, has a normal CT and can walk and talk coherently may still have a fully significant concussion. Concussion is classified as a mild traumatic brain injury (mTBI). The word \"mild\" describes the absence of structural damage and the initial presentation — it does NOT describe the symptom burden, the functional limitation, or the recovery trajectory, all of which can be significant."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 5: \"The neurometabolic cascade is simply brain inflammation — rest and time fix it.\" Why is this false?",
        "options": [
          "It is not false — the cascade is an inflammatory process that resolves with rest and time",
          "Neuroinflammation is only one phase of a multi-phase cascade of ionic, metabolic and neurochemical changes whose defining feature is an energy crisis",
          "The cascade is purely a blood-flow problem and has no inflammatory component at all",
          "Inflammation after concussion is always harmful and should be suppressed"
        ],
        "correctAnswer": 1,
        "explanation": "At the cellular level, the biomechanical forces of concussion trigger a cascade of ionic, metabolic and neurochemical changes known as the neurometabolic cascade (Giza & Hovda, 2014). For the EP, the most useful single framing of this cascade is that it produces an ENERGY CRISIS: a brain that suddenly needs far more metabolic fuel while simultaneously losing the ability to deliver it. Neuroinflammation is one phase within that cascade, and it has a DUAL ROLE: early activation clears cellular debris and supports repair; excessive or prolonged inflammation causes secondary damage and is thought to contribute to persistent post-concussion symptoms in a subset of patients."
      }
    ],
    "functional-not-structural": [
      {
        "kind": "quick-check",
        "question": "A client tells you their scan was clear, so \"nothing is wrong.\" What does a normal CT or MRI after a head injury actually establish?",
        "options": [
          "That the concussion has resolved and rehabilitation is no longer indicated",
          "That structural damage has been ruled out — imaging does not rule concussion in or out, because concussion is a functional disturbance",
          "That the injury was linear rather than rotational in mechanism",
          "That the client did not lose consciousness at the time of injury"
        ],
        "correctAnswer": 1,
        "explanation": "A concussion is a complex pathophysiological process affecting the brain, induced by biomechanical forces (Patricios et al., 2023). The defining feature for clinical practice is that it is a FUNCTIONAL disturbance of brain physiology rather than a STRUCTURAL lesion. This is why standard CT and MRI scans are typically normal in concussion. They are ordered to rule OUT a bleed or fracture — a structural emergency — not to rule IN or OUT a concussion."
      }
    ],
    "injury-biomechanics": [
      {
        "kind": "matching",
        "title": "Injury Biomechanics: Mechanism and Consequence",
        "instruction": "Match each concussion mechanism to what the module says it does.",
        "pairs": [
          {
            "id": "rotational",
            "left": "Rotational (angular) acceleration",
            "right": "Generates shearing stresses; the grey-white matter junction is the zone of maximum mechanical strain",
            "explanation": "Grey matter and white matter have different mechanical properties and respond to shearing forces at different rates."
          },
          {
            "id": "linear",
            "left": "Linear (translational) acceleration",
            "right": "The skull accelerates rapidly; the brain lags behind due to inertia, then catches up and may compress against the inner skull",
            "explanation": "Linear forces alone rarely cause concussion — real-world concussions almost always involve combined linear and rotational acceleration."
          },
          {
            "id": "coup",
            "left": "Coup-contrecoup",
            "right": "The brain recoils after impact and strikes the opposite inner skull surface",
            "explanation": "A fall onto the occiput classically produces greater frontal lobe contrecoup damage than at the occipital impact site."
          },
          {
            "id": "dai",
            "left": "Diffuse axonal injury (DAI)",
            "right": "Axons at the grey-white junction are stretched, twisted and torn; axoplasmic transport is blocked",
            "explanation": "In mild concussion, axonal damage is microscopic, widespread and largely reversible — invisible on standard CT and MRI."
          }
        ],
        "leftLabel": "Mechanism",
        "rightLabel": "What it does"
      },
      {
        "kind": "quick-check",
        "question": "A client sustained a whiplash-type injury in a car accident with no direct head contact. Can this mechanism produce a concussion?",
        "options": [
          "No — concussion requires a direct blow to the head",
          "Yes — rotational forces can cause concussion without direct head contact, because a whiplash mechanism generates sufficient angular momentum through cervical kinematics alone",
          "Yes, but only if the client also lost consciousness",
          "Only if imaging confirms diffuse axonal injury"
        ],
        "correctAnswer": 1,
        "explanation": "Rotational forces can cause concussion WITHOUT direct head contact — a whiplash mechanism generates sufficient angular momentum through cervical kinematics alone. Rotational acceleration is the most clinically significant concussion mechanism: when the head rotates around its centre of mass, it generates angular momentum and shearing stresses throughout brain tissue."
      }
    ],
    "neurometabolic-cascade": [
      {
        "kind": "ordering",
        "title": "The Neurometabolic Cascade",
        "instruction": "Arrange the six phases of the neurometabolic cascade in the order the module describes them.",
        "items": [
          {
            "id": "p1",
            "label": "Mechanoporation and Immediate Ionic Chaos",
            "rationale": "Milliseconds to seconds: mechanosensitive ion channels open, K⁺ floods out, Na⁺ floods in, glutamate is released indiscriminately."
          },
          {
            "id": "p2",
            "label": "Na⁺/K⁺-ATPase Pump Overdrive and Hyperglycolysis",
            "rationale": "Minutes to hours: glucose consumption rises 2–3× above baseline within minutes."
          },
          {
            "id": "p3",
            "label": "The Energy Crisis — Demand Meets Reduced Supply",
            "rationale": "Minutes to days: cerebral blood flow is reduced by 20–40% in the acute phase (Len & Neary, 2011)."
          },
          {
            "id": "p4",
            "label": "Calcium-Mediated Mitochondrial Dysfunction",
            "rationale": "Hours to days: mitochondrial Ca²⁺ disrupts the electron transport chain — the molecular machinery of oxidative phosphorylation."
          },
          {
            "id": "p5",
            "label": "Neuroinflammation",
            "rationale": "Hours to months: activated microglia release pro-inflammatory cytokines including IL-1β, IL-6 and TNF-α."
          },
          {
            "id": "p6",
            "label": "Metabolic Depression and Recovery",
            "rationale": "Days to weeks: CBF and CMRglc progressively normalise over 7–28 days in most uncomplicated concussions."
          }
        ],
        "correctOrder": [
          "p1",
          "p2",
          "p3",
          "p4",
          "p5",
          "p6"
        ],
        "explanation": "The cascade runs from mechanoporation and ionic flux, through Na⁺/K⁺-ATPase overdrive and hyperglycolysis, into the energy crisis where demand meets reduced supply, then calcium-mediated mitochondrial dysfunction, neuroinflammation, and finally metabolic depression and recovery. CBF and CMRglc progressively normalise over 7–28 days in most uncomplicated concussions."
      },
      {
        "kind": "quick-check",
        "question": "What makes the post-concussion energy crisis a MISMATCH rather than simply high demand?",
        "options": [
          "Demand rises but supply is unchanged, so the brain simply works harder",
          "Hyperglycolysis requires approximately 2–3× normal glucose and oxygen delivery at the same time as cerebral blood flow is reduced by 20–40%",
          "Supply falls but demand also falls, so the two remain matched",
          "The mismatch is between cognitive and physical demand, not between supply and demand"
        ],
        "correctAnswer": 1,
        "explanation": "At the exact moment glucose demand spikes, CEREBRAL BLOOD FLOW (CBF) drops. DEMAND: hyperglycolysis requires approximately 2–3× the normal glucose and oxygen delivery. SUPPLY: cerebral blood flow is reduced by 20–40% in the acute phase (Len & Neary, 2011). MISMATCH: the brain is running its most metabolically expensive emergency response on a fuel supply that has been cut by a third to a half."
      },
      {
        "kind": "quick-check",
        "question": "A patient reports feeling completely symptom-free 12 days after their concussion. What does the module say this tells you about their metabolic recovery?",
        "options": [
          "Metabolic recovery is complete once symptoms resolve",
          "Symptoms typically resolve BEFORE complete metabolic recovery — the cascade can persist for weeks after a patient reports feeling symptom-free",
          "Symptom resolution proves the mitochondrial permeability transition pore has closed",
          "Symptom resolution has no relationship to metabolic state in either direction"
        ],
        "correctAnswer": 1,
        "explanation": "CRITICAL: symptoms typically resolve BEFORE complete metabolic recovery. The neurometabolic cascade can persist for weeks after a patient reports feeling symptom-free. \"Symptom resolution ≠ brain recovered\" is one of the most important concepts in concussion management. SECOND-IMPACT SYNDROME: if a second concussion occurs during the metabolic depression phase, the pre-existing ionic and metabolic vulnerability means the second injury triggers a far larger and more dangerous dysregulation — the physiological basis for strict return-to-activity protocols."
      }
    ],
    "cbf-dysregulation": [
      {
        "kind": "quick-check",
        "question": "Which form of cerebral autoregulation does the module identify as consistently and measurably impaired after concussion, and why does that matter for exertion?",
        "options": [
          "Static autoregulation — because sustained blood-pressure changes are what exercise produces",
          "Dynamic autoregulation — because exercise produces rapid beat-to-beat blood pressure fluctuations that a healthy brain smoothly buffers and a post-concussion brain cannot",
          "Neither — autoregulation is unaffected by concussion",
          "Both are equally and severely impaired, which is why any blood-pressure change is dangerous"
        ],
        "correctAnswer": 1,
        "explanation": "STATIC autoregulation is intact or mildly impaired after most uncomplicated concussions. DYNAMIC autoregulation — the speed and completeness of the CBF response to a transient blood-pressure change — is consistently and measurably impaired after concussion; the response is delayed and attenuated, meaning CBF swings more widely in response to rapid blood-pressure fluctuations than in a healthy brain. Dynamic autoregulation impairment is directly relevant to exertion: exercise produces rapid beat-to-beat blood pressure fluctuations that a healthy brain smoothly buffers. A post-concussion brain cannot, producing unstable cerebral perfusion."
      },
      {
        "kind": "quick-check",
        "question": "Reduced cerebrovascular CO₂ reactivity (CVR) is the vascular explanation for which clinical finding?",
        "options": [
          "The absence of structural damage on imaging",
          "The symptom-limited heart-rate threshold (HRt) — at some workload the impaired CBF regulatory system cannot keep pace with exercise-induced demand",
          "The presence of benign paroxysmal positional vertigo",
          "The requirement for a 21-day stand-down before contact"
        ],
        "correctAnswer": 1,
        "explanation": "Post-concussion, cerebrovascular CO₂ reactivity is consistently reduced by approximately 20–35% (Len & Neary, 2011). During exercise, PaCO₂ rises as metabolic rate increases; in a concussed brain with reduced CVR, this CO₂-driven vasodilation is blunted and CBF cannot increase adequately to meet exertional demand. The result: as workload rises, cerebral perfusion progressively undershoots demand — until a threshold is crossed where symptoms are provoked. This is the physiological explanation for the SYMPTOM-LIMITED HEART-RATE THRESHOLD (HRt): at some workload, the impaired CBF regulatory system simply cannot keep pace with the exercise-induced demand. That threshold is measurable — and it is the foundation of the Buffalo Concussion Treadmill Test (Clausen et al., 2016)."
      }
    ],
    "autonomic-exercise-intolerance": [
      {
        "kind": "flowchart",
        "title": "The Exercise Intolerance Mechanism: Step by Step",
        "steps": [
          {
            "label": "Exertion begins",
            "description": "The patient begins exertion. Metabolic demand rises and the autonomic system is called upon to increase cardiac output."
          },
          {
            "label": "Imprecise sympathetic matching",
            "description": "Sympathetic activation is imprecisely matched to workload (blunted BRS) → heart rate response is not as well-calibrated as normal."
          },
          {
            "label": "Unbuffered pressure swings",
            "description": "The rising cardiac output drives blood pressure fluctuations that the impaired baroreflex cannot efficiently buffer → cerebral perfusion swings."
          },
          {
            "label": "Blunted CO₂ response",
            "description": "CO₂ rises with increasing exertion, but the blunted cerebrovascular CO₂ reactivity means CBF does not increase commensurately → CBF begins to undershoot rising demand."
          },
          {
            "label": "Local supply cannot follow local demand",
            "description": "Neurovascular uncoupling means local demand cannot reliably up-regulate local blood supply."
          },
          {
            "label": "Threshold reached",
            "description": "At some workload — the SYMPTOM-LIMITED HEART-RATE THRESHOLD (HRt) — the combination of insufficient CBF, impaired autoregulation and the pre-existing energy deficit produces symptom provocation: headache, dizziness, fogginess, visual disturbance."
          },
          {
            "label": "Recovery on stopping",
            "description": "Stopping exercise removes the demand spike; autonomic balance is partly restored; symptoms resolve within minutes."
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "Why is the symptom-limited threshold described as something to stay BELOW rather than push through?",
        "options": [
          "Because exceeding it causes permanent structural damage to the brain",
          "Because staying just below it allows adaptive remodelling of the autonomic and cerebrovascular systems, which raises the threshold over successive sessions",
          "Because the threshold is a measurement artefact and has no physiological meaning",
          "Because any symptom provocation means rehabilitation must be abandoned"
        ],
        "correctAnswer": 1,
        "explanation": "The symptom-limited threshold is not a ceiling to push through — it is the measurable expression of a dysregulated physiological system reaching its limit. Staying just BELOW that threshold during exercise is what allows adaptive remodelling of the autonomic and cerebrovascular systems. Repeated, controlled loading just under the threshold drives progressive adaptation, raising the threshold over successive sessions. This is the mechanism of benefit of sub-threshold exercise."
      }
    ],
    "phenotype-intro": [
      {
        "kind": "matching",
        "title": "Concussion Phenotypes",
        "instruction": "Match each concussion phenotype to the dominant driver or presentation the module attributes to it.",
        "pairs": [
          {
            "id": "physiological",
            "left": "Physiological (Exercise Intolerance)",
            "right": "Autonomic dysfunction and CBF dysregulation, defined by a reproducible symptom-limited heart-rate threshold",
            "explanation": "This is the primary target of sub-threshold aerobic rehabilitation — and the core of the AEP's clinical work."
          },
          {
            "id": "vestibular",
            "left": "Vestibular",
            "right": "Dizziness, balance disruption and vertigo from brainstem and cerebellar involvement",
            "explanation": "Responds to vestibular rehabilitation (physiotherapy ± EP vestibular exercises)."
          },
          {
            "id": "oculomotor",
            "left": "Oculomotor",
            "right": "Convergence insufficiency, saccadic dysfunction and smooth-pursuit impairment",
            "explanation": "Responds to oculomotor exercises and, where needed, behavioural optometry."
          },
          {
            "id": "cervicogenic",
            "left": "Cervicogenic",
            "right": "Headache and neck pain from cervical whiplash-type injury co-occurring with the concussion",
            "explanation": "Responds to cervical physiotherapy."
          },
          {
            "id": "cognitive",
            "left": "Cognitive",
            "right": "Working memory, processing-speed and attention deficits from widespread axonal injury and neurotransmitter disruption",
            "explanation": "The cognitive phenotype reflects the same energy crisis extended to sustained mental work."
          },
          {
            "id": "mood",
            "left": "Mood / Affective",
            "right": "Anxiety, depression and emotional lability from limbic system disruption",
            "explanation": "Requires psychology input."
          }
        ],
        "leftLabel": "Phenotype",
        "rightLabel": "Dominant driver / presentation"
      }
    ],
    "paradigm-shift": [
      {
        "kind": "multi-select",
        "question": "According to the module, why is prolonged rest beyond the first 24–48 hours counterproductive? Select ALL that apply.",
        "options": [
          "It drives physical deconditioning, which worsens the autonomic dysfunction already present",
          "It removes the adaptive stimulus needed for autonomic and cerebrovascular recovery",
          "It amplifies mood disturbance and anxiety, which independently worsen autonomic regulation and pain sensitivity",
          "It fosters fear-avoidance and illness behaviour",
          "It causes permanent structural damage visible on MRI"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3
        ],
        "explanation": "Prolonged rest beyond the first 24–48 hours is now understood to be counterproductive: it drives physical deconditioning — which WORSENS the autonomic dysfunction already present, since cardiovascular deconditioning independently reduces baroreflex sensitivity and HRV; it removes the adaptive stimulus needed for autonomic and cerebrovascular recovery; it amplifies mood disturbance and anxiety, which independently worsen autonomic regulation and pain sensitivity; it fosters fear-avoidance and illness behaviour; and it is associated with SLOWER, not faster, clinical recovery in controlled trials (Schneider et al., 2017). Concussion is a FUNCTIONAL disturbance of brain physiology rather than a STRUCTURAL lesion, so structural damage on MRI is not the mechanism at issue."
      },
      {
        "kind": "quick-check",
        "question": "What did Leddy et al. (2019, JAMA Pediatrics) randomise, and what did they find?",
        "options": [
          "Strict rest versus usual care; strict rest produced faster recovery",
          "Individualised sub-symptom-threshold aerobic exercise versus a placebo-like stretching program; the aerobic-exercise group recovered significantly faster with no increase in adverse events",
          "Maximal graded exercise testing versus no testing; testing shortened recovery",
          "Helmet design versus mouthguard use; neither reduced concussion incidence"
        ],
        "correctAnswer": 1,
        "explanation": "Leddy and colleagues (2019, JAMA Pediatrics) randomised adolescents with sport-related concussion to either individualised sub-symptom-threshold aerobic exercise (prescribed at 80% of the symptom-limited HR from a graded treadmill test) or a placebo-like stretching program, with treatment initiated within days of injury. The aerobic-exercise group recovered significantly FASTER, and the intervention did not worsen symptoms or cause harm. This single study did more to move exercise from \"contraindicated\" to \"first-line\" than any other piece of evidence."
      }
    ],
    "ep-in-the-team": [
      {
        "kind": "multi-select",
        "question": "Which of the following fall INSIDE the EP's scope in concussion care? Select ALL that apply.",
        "options": [
          "Assessing exercise tolerance and identifying the symptom-limited threshold using validated graded-exertion protocols",
          "Prescribing individualised sub-symptom-threshold aerobic exercise and progressing it safely",
          "Recognising red flags and deterioration, stopping the session, and escalating to the medical team",
          "Making or changing the concussion diagnosis",
          "Signing off return-to-play clearance",
          "Ordering or interpreting neuroimaging or blood biomarkers"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "Inside EP scope: assessing exercise tolerance and identifying the symptom-limited threshold using validated graded-exertion protocols (Buffalo Concussion Treadmill Test — Module 3); prescribing individualised sub-symptom-threshold aerobic exercise and progressing it safely; monitoring heart rate, workload, perceived exertion and symptom response, and adjusting dose accordingly; recognising red flags and deterioration, stopping the session, and escalating to the medical team. Outside EP scope: making or changing the concussion diagnosis; determining medical readiness to commence exercise rehabilitation, or signing off return-to-play clearance; independently managing red-flag or deteriorating presentations beyond stop-and-refer; ordering or interpreting neuroimaging or blood biomarkers."
      },
      {
        "kind": "quick-check",
        "question": "A coach asks you to confirm that a recovered player is cleared for return to sport. What is the correct position?",
        "options": [
          "Provide the clearance — you have the most session data on the athlete",
          "The EP does NOT clear an athlete for return to sport; you deliver and progress the exertion stimulus, document the response, and feed it back to the referring clinician",
          "Provide the clearance verbally but never in writing",
          "Refer the coach to the physiotherapist, who holds the clearance decision"
        ],
        "correctAnswer": 1,
        "explanation": "The EP does NOT diagnose concussion and does NOT clear an athlete for return to sport. You receive a diagnosed patient, deliver and progress the exertion stimulus, document the response, and feed it back to the referring clinician. Clearance decisions belong to medical practitioners. The GP / Sports Physician diagnoses concussion, manages red flags and comorbidities, oversees medical care, and holds ultimate responsibility for return-to-sport clearance."
      }
    ]
  },
  "202": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1: \"Loss of consciousness is required to suspect concussion — if the client was never knocked out, the mechanism probably did not cause a significant injury.\" Why is this false?",
        "options": [
          "It is not false — without loss of consciousness the mechanism was not significant",
          "Only 5–10% of concussions involve any LOC; LOC neither confirms nor excludes concussion, and its absence does not lower clinical suspicion",
          "LOC is not required, but a client who orientates correctly immediately after the knock can be excluded",
          "LOC is not required, but the absence of a direct blow to the head does exclude concussion"
        ],
        "correctAnswer": 1,
        "explanation": "LOSS OF CONSCIOUSNESS IS NOT REQUIRED: only 5–10% of concussions involve any LOC. An athlete who continues playing after a head knock, was never \"knocked out,\" and orientates correctly immediately after can still have a fully significant concussion. LOC neither confirms nor excludes concussion, and its absence does not lower clinical suspicion (Patricios et al., 2023). Nor is a direct blow required — an impulsive force transmitted to the head from a blow elsewhere on the body, or a whiplash-type mechanism, is enough."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2: \"Red flags are a sideline problem. If a client with a head injury has made it to my clinic and appears reasonably alert, the dangerous window has passed.\" Why is this false?",
        "options": [
          "It is not false — a client who is alert on arrival has passed the dangerous window",
          "An expanding epidural haematoma has a compensated \"lucid interval\" before deterioration, and subacute/chronic subdural haematoma may develop over days to weeks",
          "It is false only because clients sometimes minimise their symptoms",
          "Red flags only matter in children, so an alert adult can be treated as safe"
        ],
        "correctAnswer": 1,
        "explanation": "The classic \"lucid interval\" — where the patient recovers briefly after initial concussive LOC, then deteriorates — is the compensated phase before ICP rises critically. In epidural haematoma, arterial pressure drives haematoma expansion and the compensatory CSF displacement space is exhausted in 1–4 hours; time from deterioration to death can be under 60 minutes. Subacute/chronic SDH may develop over days to weeks — gradually worsening headache and confusion that can mimic dementia in older adults. Red flags indicate a potentially life-threatening or permanently disabling condition. They are NOT managed by the EP. They are ESCALATED."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3: \"A normal CT at the emergency department clears a client for exercise rehabilitation. If the ED sent them home, I can start rehab.\" Why is this false?",
        "options": [
          "It is not false — an ED discharge with a normal CT is sufficient to begin concussion rehabilitation",
          "Imaging excludes structural emergency, not concussion; the EP begins rehabilitation on a diagnosis and a referral for graded aerobic rehabilitation, not on a scan result",
          "It is false because a CT cannot exclude an intracranial bleed at all",
          "It is false because only an MRI can authorise the start of exercise rehabilitation"
        ],
        "correctAnswer": 1,
        "explanation": "The first task of any concussion assessment is to exclude life-threatening structural injury (intracranial haemorrhage, skull fracture, cervical spine injury) — that is what imaging is for. The EP usually receives the client AFTER a GP or sports medicine physician has assessed and diagnosed the concussion, excluded structural injury and red flags, and referred for graded aerobic rehabilitation. If a client self-presents to an EP for \"concussion rehab\" WITHOUT prior medical assessment, the correct response is: DO NOT begin concussion rehabilitation. Facilitate medical assessment first. An unassessed head injury may have unexcluded structural pathology or evolving red flags."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4: \"My client's symptoms resolved two weeks ago and their SCOAT6 symptom score is now zero. I can confirm them as ready for return to contact training.\" Why is this false?",
        "options": [
          "It is not false — a zero symptom score confirms readiness for contact",
          "A zero symptom score means reported symptoms have resolved; it does not mean the neurometabolic cascade has resolved, and the clearance decision is medical, not EP",
          "It is false only because the SCOAT6 has not been validated for adults",
          "It is false because the AEP must first repeat the full SCAT6 including GCS"
        ],
        "correctAnswer": 1,
        "explanation": "SYMPTOM RESOLUTION PRECEDES PHYSIOLOGICAL RECOVERY. The SCOAT6 symptom score reaching zero means reported symptoms have resolved — it does NOT mean the neurometabolic cascade has resolved, autoregulation has been restored, or that SIS vulnerability has passed. A \"normal SCAT6\" does not mean \"cleared for contact.\" A zero symptom score does not mean \"brain recovered.\" The EP uses these tools to MONITOR trajectory, not to DECIDE clearance. The clearance decision requires medical judgment integrating the full clinical picture — not a screening score from any tool within EP scope."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 5: \"Second-impact syndrome is extremely rare in adults. The AIS stand-down periods are conservative — if my client feels ready, the risk is minimal.\" Why is this false?",
        "options": [
          "It is not false — the stand-down periods are precautionary and can be shortened when the client feels ready",
          "The stand-down requirement exists specifically because it covers the full duration of neurometabolic vulnerability and CBF dysregulatory risk — the mechanism is the defence against that pressure",
          "It is false because second-impact syndrome occurs only in adults, not adolescents",
          "It is false because second-impact syndrome develops gradually over hours, so there is time to intervene"
        ],
        "correctAnswer": 1,
        "explanation": "The AIS/SMA stand-down requirement (≥21 days from injury in youth sport, ≥14 days completely symptom-free before contact training, plus medical clearance) exists specifically because it covers the full duration of neurometabolic vulnerability and CBF dysregulatory risk. An EP who does not understand the SIS mechanism may be persuaded by a \"recovered-feeling\" client to progress toward contact early. The mechanism is the defence against that pressure. In SIS the engorgement drives massive diffuse cerebral oedema developing within 2–5 MINUTES — not gradually over hours as in EDH, but ACUTELY. PREDOMINANTLY ADOLESCENTS: the adolescent neurometabolic cascade is more prolonged."
      }
    ],
    "symptom-neurophysiology": [
      {
        "kind": "matching",
        "title": "Symptom Clusters and Their Neurophysiological Origin",
        "instruction": "Match each post-concussion symptom to the mechanism the module attributes to it.",
        "pairs": [
          {
            "id": "headache",
            "left": "Migrainous post-traumatic headache with photophobia and nausea",
            "right": "Trigeminovascular activation via cortical spreading depression",
            "explanation": "CSD activates perivascular trigeminal C-fibres around cortical blood vessels, generating nociceptive input processed as headache — the same pathway as migraine with aura."
          },
          {
            "id": "bppv",
            "left": "Brief, intense, positional vertigo",
            "right": "Otolithic crystals dislodged from the utricular macula into the semicircular canals",
            "explanation": "BPPV requires canalith repositioning manoeuvres (Epley) — a physiotherapy technique, not an exercise prescription."
          },
          {
            "id": "cervicogenic",
            "left": "Headache and dizziness that worsen with neck movement",
            "right": "Upper cervical nociception and proprioceptive disruption referred via the trigeminal nucleus caudalis and brainstem vestibular nuclei",
            "explanation": "Cervicogenic headache responds to cervical physiotherapy, not aerobic exercise."
          },
          {
            "id": "fog",
            "left": "Cognitive fog and slowed processing",
            "right": "ATP depletion, neuromodulator disruption, diffuse axonal injury and neurovascular uncoupling",
            "explanation": "Cognitive fog is NOT psychological weakness."
          },
          {
            "id": "mood",
            "left": "Irritability, anxiety or low mood in the first days to weeks",
            "right": "Metabolic disruption of limbic structures and impaired serotonergic, dopaminergic and noradrenergic modulation",
            "explanation": "These are direct neurochemical effects of the injury — not secondary psychological reactions to being injured."
          }
        ],
        "leftLabel": "Symptom",
        "rightLabel": "Mechanism"
      },
      {
        "kind": "quick-check",
        "question": "A client reports one episode of vomiting on the evening of their injury. Later that week they report repeated, progressively worsening vomiting. How do these differ?",
        "options": [
          "Both are expected and neither requires action",
          "One to two episodes early after injury is common and not itself alarming; repeated or progressively worsening vomiting is a red flag that may reflect rising intracranial pressure",
          "Both are red flags requiring an immediate 000 call",
          "Vomiting is never related to concussion and always indicates a gastrointestinal cause"
        ],
        "correctAnswer": 1,
        "explanation": "One to two episodes early after injury is common and not itself alarming. REPEATED or PROGRESSIVELY WORSENING vomiting — especially in the hours after injury — is a red flag: it may reflect rising intracranial pressure (ICP) directly stimulating the area postrema."
      }
    ],
    "recognising-concussion": [
      {
        "kind": "multi-select",
        "question": "Which of the following are OBSERVABLE SIGNS — things you may SEE without the client reporting them? Select ALL that apply.",
        "options": [
          "Lying motionless or slow to get up; unsteadiness on standing or walking",
          "A blank, vacant or glazed look; appearing dazed, stunned or confused",
          "Slowed or slurred speech; unusually slow verbal responses",
          "Headache or a feeling of pressure in the head",
          "Sensitivity to noise",
          "Feeling \"not quite right\" or more emotional than usual"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "Observable signs are visible to the observer — the client does not need to report them: lying motionless or slow to get up; unsteadiness on standing or walking; a blank, vacant or glazed look; appearing dazed, stunned or confused; disorientation; clutching the head; slowed or slurred speech. Headache, noise sensitivity and feeling \"not quite right\" are REPORTED SYMPTOMS — what the client may TELL you. The observable-signs list is critical during physical rehabilitation: a client who fatigues cognitively mid-session may develop a blank look and slowed responses."
      },
      {
        "kind": "quick-check",
        "question": "You are not certain whether a client's presentation is a concussion. What threshold do you need before acting, and what do you say?",
        "options": [
          "Diagnostic certainty — say \"You have a concussion\" once you are sure",
          "\"Consistent with a possible concussion\" is enough to act — say that this presentation needs medical assessment, without stating a diagnosis",
          "Wait until the next session to see whether symptoms persist before saying anything",
          "Nothing — recognition is outside AEP scope entirely"
        ],
        "correctAnswer": 1,
        "explanation": "You do not need diagnostic certainty to act. Recognising a presentation as \"consistent with a possible concussion\" is the threshold for the EP's action — facilitating medical review. You say: \"This presentation is consistent with a possible concussion and needs medical assessment.\" You do not say: \"You have a concussion.\" Recognition is firmly within EP scope."
      }
    ],
    "red-flags-pathophysiology": [
      {
        "kind": "multi-select",
        "question": "Which of the following require IMMEDIATE emergency escalation (call 000)? Select ALL that apply.",
        "options": [
          "Deteriorating or reduced level of consciousness / increasing drowsiness",
          "Repeated or projectile vomiting",
          "Unequal, dilated or non-reactive pupils",
          "Midline cervical tenderness or restricted neck movement, especially with neurological signs",
          "Clear or blood-stained fluid from the nose or ears",
          "A mild headache that settles within an hour of a light training session"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3,
          4
        ],
        "explanation": "RED FLAGS requiring IMMEDIATE emergency escalation (call 000): deteriorating or reduced level of consciousness / increasing drowsiness; repeated or projectile vomiting; seizure or convulsion; increasing, severe or worsening headache; focal neurological signs — weakness, numbness or tingling in any limb, facial asymmetry, double vision; unequal, dilated or non-reactive pupils; slurred speech, increasing confusion or agitation; midline cervical tenderness or restricted neck movement, especially with neurological signs; any loss of consciousness; clear or blood-stained fluid from the nose or ears. The EP does not monitor, observe for an hour, or administer a clinical test to evaluate a red flag. The EP stops all activity and escalates."
      },
      {
        "kind": "flowchart",
        "title": "EP Response to Cervical Red Flags",
        "steps": [
          {
            "label": "Do not move the neck",
            "description": "Do NOT flex, extend or rotate the head or neck."
          },
          {
            "label": "Stabilise in neutral",
            "description": "Manually stabilise the head-neck in neutral alignment without applying traction."
          },
          {
            "label": "Leave the helmet on",
            "description": "Do NOT remove the helmet (unless trained and appropriate equipment is available)."
          },
          {
            "label": "Call 000",
            "description": "Call 000 immediately."
          },
          {
            "label": "Stay and monitor",
            "description": "Stay with the client; monitor airway and breathing; reassure until EMS arrives."
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "Why does second-impact syndrome develop so much faster than an expanding epidural haematoma?",
        "options": [
          "Because the second impact tears a larger artery than the first",
          "Because residual autoregulatory capacity is eliminated, cerebral vessels dilate and fail to constrict, and the resulting engorgement drives diffuse cerebral oedema within 2–5 minutes",
          "Because the skull becomes distensible after a first concussion",
          "Because the second impact is always more forceful than the first"
        ],
        "correctAnswer": 1,
        "explanation": "After the first concussion, cerebrovascular autoregulation is significantly impaired. Even a relatively minor second impact — one that would not cause concussion in an uninjured brain — eliminates the residual autoregulatory capacity. Instead of appropriate autoregulatory vasoconstriction, cerebral blood vessels dilate massively and fail to constrict. CBF rises uncontrollably within seconds — CEREBRAL HYPERAEMIA AND ENGORGEMENT. The engorgement drives massive diffuse cerebral oedema developing within 2–5 MINUTES — not gradually over hours as in EDH, but ACUTELY. The non-distensible skull cannot accommodate the swelling."
      }
    ],
    "scat6-ep-context": [
      {
        "kind": "multi-select",
        "question": "Which of the following can an AEP appropriately do with the SCAT6 / SCOAT6 tool family? Select ALL that apply.",
        "options": [
          "Use the 22-item symptom severity checklist as a serial outcome measure within rehabilitation",
          "Administer the BESS as an adjunct balance outcome measure to track recovery trajectory",
          "Administer the exertional provocation component (5 knee-bends + symptom monitoring) as a session pre-screening step",
          "Administer the SCAT6 acutely and use the result to determine whether a client has a concussion",
          "Use a \"normal\" SCOAT6 result as grounds to clear a client for return to contact",
          "Administer and interpret the full GCS to make management decisions"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "What the EP CAN appropriately do: use the SYMPTOM SEVERITY CHECKLIST (the 22-item scale) as a serial outcome measure within rehabilitation; administer the BESS as an adjunct balance outcome measure — within EP scope as a functional monitoring tool, not a diagnostic instrument; administer the EXERTIONAL PROVOCATION component (5 knee-bends + symptom monitoring) as a session pre-screening step; and reference and communicate SCAT6 or SCOAT6 results from the referring clinician's initial assessment. What the EP CANNOT do: administer the SCAT6 in an acute post-injury context and use the result to determine whether a client has a concussion; use a \"normal\" SCAT6 or SCOAT6 result as grounds to clear a client for return to contact or to dismiss the need for medical review; administer and interpret the full GCS to make management decisions."
      },
      {
        "kind": "insight",
        "type": "tip",
        "title": "Ask the referrer whether a pre-injury baseline exists",
        "content": "Scores reflect effort, awareness and reporting honesty: athletes who deny or minimise symptoms score normally, and athletes with pre-existing anxiety or low mood score abnormally on symptom checklists for non-concussion reasons. Without a documented pre-injury baseline, even \"changes\" are difficult to interpret definitively — which is what makes an athlete's own pre-season baseline genuinely useful comparator data when it exists. Pre-season baseline testing is arranged by the club, school or referring clinic rather than by the AEP, so the practical step is to ask the referrer whether one was recorded, and to reference and communicate SCAT6 or SCOAT6 results from the referring clinician's initial assessment as part of understanding the clinical baseline."
      }
    ],
    "ep-scope-boundary": [
      {
        "kind": "quick-check",
        "question": "Why does concussion DIAGNOSIS require medical authority rather than AEP judgement?",
        "options": [
          "Because AEPs are not trained to observe clinical signs",
          "Because diagnosis requires excluding life-threatening structural injury — which needs the ability to order emergency imaging, and ordering imaging requires a medical provider number",
          "Because ESSA prohibits AEPs from working with head-injured clients",
          "Because concussion can only be diagnosed on imaging"
        ],
        "correctAnswer": 1,
        "explanation": "EXCLUDING STRUCTURAL PATHOLOGY: the first task of any concussion assessment is to exclude life-threatening structural injury (intracranial haemorrhage, skull fracture, cervical spine injury). This requires clinical reasoning and — where indicated — the ability to order emergency imaging (CT head, cervical spine). Ordering imaging requires a medical provider number. An AEP cannot do this. Recognition, by contrast, is firmly within EP scope."
      }
    ],
    "ep-lane-and-referral": [
      {
        "kind": "matching",
        "title": "Referral Out: Routing the Problem That Is Not Yours",
        "instruction": "Match each presentation to the discipline the module routes it to.",
        "pairs": [
          {
            "id": "bppv",
            "left": "Brief intense positional vertigo triggered by lying down or head movement",
            "right": "Vestibular physiotherapy",
            "explanation": "Dix-Hallpike assessment and canalith repositioning are physiotherapy techniques, not EP techniques."
          },
          {
            "id": "visual",
            "left": "Persistent visual strain, difficulty reading or tracking, convergence insufficiency or diplopia limiting daily function",
            "right": "Optometry / neuro-optometry",
            "explanation": "Referred when the visual dysfunction limits daily function and is not resolving."
          },
          {
            "id": "mood",
            "left": "Mood symptoms, anxiety, fear-avoidance or catastrophising limiting participation in rehabilitation",
            "right": "Psychology",
            "explanation": "Any disclosure of suicidal ideation is an urgent escalation, not a routine referral."
          },
          {
            "id": "neuro",
            "left": "Refractory or atypical headache, or persistent complex symptoms beyond the expected recovery window",
            "right": "Neurology, via the referring doctor",
            "explanation": "The EP flags this to the coordinating clinician who arranges the specialist review."
          },
          {
            "id": "gp",
            "left": "Symptoms not improving, or worsening, despite appropriate graded rehabilitation",
            "right": "GP / Sports Medicine Physician",
            "explanation": "The GP or sports medicine physician also provides final return-to-contact clearance."
          }
        ],
        "leftLabel": "Presentation",
        "rightLabel": "Route to"
      },
      {
        "kind": "scenario",
        "title": "The Client Who Self-Presents for \"Concussion Rehab\"",
        "patientSummary": "A 24-year-old amateur footballer books in with you directly. She took a head knock at training eight days ago, did not see a doctor, and has found \"concussion exercise rehab\" online. She reports headache and fogginess that are worse after a busy work day, and wants to start the aerobic program today.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "She has had no medical assessment and no diagnosis. What do you do first?",
            "clinicalData": [
              "Head knock 8 days ago at training",
              "No medical assessment, no diagnosis, no referral",
              "Reports headache and fogginess, worse after cognitive load",
              "Wants to begin the aerobic program today"
            ],
            "choices": [
              {
                "label": "Begin the graded aerobic program — the injury is over a week old",
                "nextStepId": "outcome-began"
              },
              {
                "label": "Do not begin concussion rehabilitation; facilitate medical assessment first",
                "nextStepId": "step-2"
              },
              {
                "label": "Tell her she has a concussion and refer her to a physiotherapist",
                "nextStepId": "outcome-diagnosed"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "She asks what you will tell the doctor. How do you phrase it?",
            "clinicalData": [
              "You have observed the presentation but have made no diagnosis",
              "Recognition is within EP scope; diagnosis is not"
            ],
            "choices": [
              {
                "label": "\"This presentation is consistent with a possible concussion and needs medical assessment\"",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "\"You have a concussion — I have diagnosed it and I am referring you on\"",
                "nextStepId": "outcome-diagnosed"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Correct — recognise and escalate, do not diagnose and do not begin",
              "explanation": "If a client self-presents to an EP for \"concussion rehab\" WITHOUT prior medical assessment, the correct response is: DO NOT begin concussion rehabilitation. Facilitate medical assessment first. An unassessed head injury may have unexcluded structural pathology or evolving red flags.",
              "clinicalReasoning": "You do not need diagnostic certainty to act. Recognising a presentation as \"consistent with a possible concussion\" is the threshold for the EP's action — facilitating medical review. You say: \"This presentation is consistent with a possible concussion and needs medical assessment.\" You do not say: \"You have a concussion.\""
            }
          },
          {
            "id": "outcome-began",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Rehabilitation started on an unassessed injury",
              "explanation": "An unassessed head injury may have unexcluded structural pathology or evolving red flags. The AEP is NOT typically the first contact in a concussion pathway. Medical assessment and red-flag exclusion come first.",
              "clinicalReasoning": "The EP usually receives the client AFTER a GP or sports medicine physician has assessed and diagnosed the concussion, excluded structural injury and red flags, and referred for graded aerobic rehabilitation. \"When in doubt, sit them out\" applies in the clinic, the gym and the community sport setting — not just on the sideline."
            }
          },
          {
            "id": "outcome-diagnosed",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "That is a diagnosis, and it is outside AEP scope",
              "explanation": "The AEP CANNOT state that a client \"has a concussion\" (diagnosis). The central scope principle for the AEP in concussion care is: RECOGNISE and ESCALATE.",
              "clinicalReasoning": "A diagnosis carries medico-legal weight. If an AEP labels a presentation as \"concussion\" and manages it on that basis, they assume diagnostic liability — outside their training, their professional indemnity coverage and their ESSA registration authority."
            }
          }
        ]
      }
    ]
  },
  "203": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1 claims that a client who completes the BCTT symptom-free \"has been cleared for full sport — the EP can sign this off.\" Why is that false?",
        "options": [
          "A normal BCTT documents that physiological exercise tolerance has been restored — that is the EP's finding to record and report — but final clearance and any return-to-contact decision belong to the referring medical practitioner.",
          "The result confirms the physiological concussion phenotype, so the EP should instead prescribe sub-threshold aerobic exercise at 80–90% of the maximum heart rate reached.",
          "The test is inconclusive whenever no symptom threshold is reached, so it must be repeated in 48 hours at a higher walking speed before anything can be concluded.",
          "Medical clearance is only required for children under 18, not for adults, so the sign-off question does not arise in adult athletes."
        ],
        "correctAnswer": 0,
        "explanation": "A normal BCTT re-test is the EP's evidence to report to the referrer that physiological exercise tolerance has been restored. It is NOT, by itself, medical clearance for return to contact sport. Final clearance — and any return-to-contact decision — belongs to the referring medical practitioner, in accordance with the AIS/SMA Australian Concussion Guidelines (2024). The EP provides objective exercise-physiology evidence; the medical team makes the clearance decision."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2 claims that exercise intolerance after concussion is \"best measured by a maximal graded stress test — the harder you push, the better the data.\" Why is that false?",
        "options": [
          "Gradual ramp protocols are used because clients with concussion cannot tolerate rapid workload changes at any stage of recovery.",
          "A test that jumped immediately to high intensity would provoke symptoms from the step itself, not from the regulatory ceiling — the gradual ramp is slow enough that the cardiovascular system has time to partially adapt at each stage.",
          "The ramp protocol is designed to build to maximal effort at the end so the EP can determine VO₂ max before prescribing.",
          "A sudden high-intensity step would provoke cardiovascular fatigue before the concussion-specific symptom response, making it impossible to identify the threshold."
        ],
        "correctAnswer": 1,
        "explanation": "The rate of cardiovascular load increase matters. The Balke-based ramp — approximately 0.5–1 metabolic equivalent (MET) per minute — is slow enough that the cardiovascular system has time to partially adapt at each stage. A test that jumped immediately to high intensity would provoke symptoms from the step itself, not from the regulatory ceiling — giving you a confounded, imprecise result."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3 claims the BCTT and the Buffalo Concussion Bike Test \"measure different physiological things — you need both to get a complete picture.\" Why is that false?",
        "options": [
          "Both tests measure the same physiological phenomenon via different exertional modes; the EP selects the mode that gives the cleanest cardiovascular threshold for that client, then uses the same mode for all re-tests.",
          "The two modes load different systems, so a client must complete both a treadmill and a bike test before a prescription can be written.",
          "The 80–90% prescription conversion applies only to the treadmill test, so a different conversion is required after a bike test.",
          "When the bike produces a higher HRt than the treadmill in a vestibular-sensitive client, that discrepancy invalidates the bike result."
        ],
        "correctAnswer": 0,
        "explanation": "The BCBT and BCTT measure the same physiological phenomenon — the HR at which impaired post-concussion CBF regulation can no longer meet exertional demand — via different exertional modes. The physiological rationale and the 80–90% prescription conversion are identical across both modes. Where the bike yields a higher HRt in a vestibular-dominant client, this is not a discrepancy — it is the bike test giving a cleaner cardiovascular signal for that client. Once you have selected a mode for a client, use the same mode for all re-tests to ensure comparability."
      }
    ],
    "scope-note": [
      {
        "kind": "multi-select",
        "question": "Select every item that the AEP does NOT do in relation to the BCTT.",
        "options": [
          "Diagnose the concussion",
          "Derive the heart rate at symptom threshold (HRt)",
          "Determine whether the client is medically fit to begin exertion testing",
          "Prescribe and progress the sub-symptom-threshold aerobic program",
          "Sign off return to contact",
          "Document and communicate the result as exercise tolerance rather than as a concussion severity label"
        ],
        "correctAnswers": [
          0,
          2,
          4
        ],
        "explanation": "The AEP receives a referred client with a confirmed or medically-suspected concussion diagnosis, administers a graded exertion tolerance test, derives the heart rate at symptom threshold (HRt), and prescribes and progresses the sub-symptom-threshold aerobic program. The AEP does NOT diagnose the concussion, does NOT determine whether the client is medically fit to begin exertion testing (the referring clinician has already done that), and does NOT sign off return to contact. Every clinical product of the BCTT stays inside the implementer lane."
      }
    ],
    "why-graded-exertion": [
      {
        "kind": "matching",
        "title": "The Three Impaired Systems Under Increasing Load",
        "instruction": "Match each post-concussion physiological impairment to what it means as exertional demand rises.",
        "pairs": [
          {
            "id": "autoreg",
            "left": "Impaired dynamic cerebral autoregulation",
            "right": "The brain cannot rapidly buffer beat-to-beat blood-pressure fluctuations; cerebral perfusion swings more widely as cardiac output rises with exertion",
            "explanation": "At each minute of the BCTT the rising workload produces rising mean arterial pressure (MAP) fluctuations: a progressive challenge to the impaired baroreflex and dynamic autoregulation system."
          },
          {
            "id": "co2",
            "left": "Blunted cerebrovascular CO₂ reactivity",
            "right": "The CO₂-driven cerebrovascular vasodilation that normally matches cerebral blood flow (CBF) to rising exertional demand is reduced by approximately 20–35% post-concussion",
            "explanation": "As metabolic rate rises during exercise, PaCO₂ rises, but the vasodilatatory response that should increase CBF is attenuated — CBF progressively undershoots demand."
          },
          {
            "id": "uncoupling",
            "left": "Neurovascular uncoupling",
            "right": "Local neural metabolic demand cannot reliably up-regulate local blood supply",
            "explanation": "Brain regions working harder during exertion cannot direct more flow to themselves; each increment of rising cardiac output challenges neurovascular coupling to direct blood to active brain regions."
          }
        ],
        "leftLabel": "Impairment",
        "rightLabel": "What it means under load"
      },
      {
        "kind": "multi-select",
        "question": "Heart rate — not speed, incline or watts — is the primary output metric and the prescription variable. Select every reason the module gives for that.",
        "options": [
          "Two clients at the same incline and speed will have very different heart rates depending on fitness, age, medication and body composition; heart rate is the common physiological currency that normalises across individuals.",
          "A heart-rate threshold is directly transferable to any aerobic mode (bike, treadmill, walking) without knowing the exact workload.",
          "The protocol is designed to build to maximal effort at the end so the EP can determine VO₂ max before prescribing.",
          "The regulatory impairments underlying exercise intolerance are all demand-dependent systems whose challenge is better captured by the cardiovascular response than by external workload measures.",
          "Clients with concussion cannot tolerate rapid workload changes at any stage of recovery."
        ],
        "correctAnswers": [
          0,
          1,
          3
        ],
        "explanation": "INDIVIDUALISATION: two clients at the same incline and speed will have very different heart rates depending on fitness, age, medication and body composition. Heart rate is the common physiological currency that normalises across individuals. PRESCRIBABILITY: a heart-rate threshold is directly transferable to any aerobic mode (bike, treadmill, walking) without knowing the exact workload. The client can monitor it on any consumer device. PHYSIOLOGICAL RELEVANCE: the regulatory impairments underlying exercise intolerance — autoregulation, CO₂ reactivity, neurovascular coupling — are all demand-dependent systems whose challenge is better captured by the cardiovascular response (HR) than by external workload measures."
      }
    ],
    "pre-test-screening": [
      {
        "kind": "multi-select",
        "question": "Select every finding that is an ABSOLUTE red flag — stop, do not test, and refer back to the medical practitioner without proceeding.",
        "options": [
          "Repeated vomiting or new-onset seizure activity",
          "Focal neurological signs — limb weakness or numbness, slurred speech, diplopia that is new or worsening, facial droop",
          "Acute lower-limb musculoskeletal injury preventing safe treadmill walking",
          "Suspected cervical spine injury or significant midline neck tenderness not previously evaluated",
          "Beta-blocker therapy or other heart-rate-altering medication",
          "Acute unexplained resting tachycardia (>100 bpm) or severe resting hypertension not previously documented",
          "Active migraine attack or acute BPPV"
        ],
        "correctAnswers": [
          0,
          1,
          3,
          5
        ],
        "explanation": "Any of the following observed or reported on the day of testing means you stop and refer back to the medical practitioner without proceeding: deteriorating or escalating symptoms since the referral (progressively worsening headache, repeated vomiting, new-onset seizure activity); focal neurological signs (limb weakness or numbness, slurred speech, diplopia that is new or worsening, asymmetric or fixed pupils, facial droop, new incoordination); suspected cervical spine injury or significant midline neck tenderness not previously evaluated; acute unexplained resting tachycardia (>100 bpm) or severe resting hypertension not previously documented. The remaining options are relative contraindications — modify or defer, not stop. Acute lower-limb musculoskeletal injury preventing safe treadmill walking: switch to the Buffalo Concussion Bike Test (BCBT) — same protocol logic, seated ergometer. Active migraine attack or acute BPPV: these will dominate the symptom response and obscure the exertional threshold. Beta-blocker therapy or other heart-rate-altering medication: document clearly."
      },
      {
        "kind": "quick-check",
        "question": "Why does the pre-test briefing tell the client that stopping early is a successful test rather than a failure?",
        "options": [
          "Because a client who feels they are failing by stopping early may push through symptoms, distorting the result upward and generating an unsafe prescription.",
          "Because the EP is measuring the client's fitness, so a low threshold indicates deconditioning that the program will address.",
          "Because the client is expected to self-select and reduce the belt speed as soon as any symptom appears.",
          "Because a test that stops early is inconclusive and must be repeated in 48 hours at a higher walking speed."
        ],
        "correctAnswer": 0,
        "explanation": "The briefing message is: \"Stopping early is a successful test — not a failure. We are looking for the heart rate where your brain tells us it has reached its limit. That number is the prescription.\" This briefing is clinically significant: a client who feels they are \"failing\" by stopping early may push through symptoms, distorting the result upward and generating an unsafe prescription. The briefing also separates the test from fitness testing: I am not testing your fitness. A low threshold does not mean you are unfit."
      }
    ],
    "bctt-protocol": [
      {
        "kind": "ordering",
        "title": "The Standardised BCTT Sequence",
        "instruction": "Place the steps of the Balke-based BCTT in the order they are performed.",
        "items": [
          {
            "id": "baseline",
            "label": "Record baseline: resting HR after ≥2 minutes of rest, resting BP, baseline symptom score (0–10 VAS) and age-predicted maximum heart rate",
            "rationale": "Before the belt moves, document the baseline. The baseline symptom score is the reference point for the ≥3-point threshold criterion."
          },
          {
            "id": "setspeed",
            "label": "Set the belt to a brisk but comfortable walking speed of 3.2–3.6 mph (approximately 5.0–5.8 km/h) and begin at 0° incline",
            "rationale": "Minute 0 to 1: begin at 0° incline (flat). Hold speed constant at the selected walking pace."
          },
          {
            "id": "incline",
            "label": "Increase incline by exactly 1° (one degree) at the start of each subsequent minute, with speed held constant",
            "rationale": "SPEED REMAINS CONSTANT throughout the entire incline phase — this is a protocol requirement, not a suggestion."
          },
          {
            "id": "speedramp",
            "label": "Once incline reaches its ceiling, hold incline fixed and increase speed by 0.4 mph (≈0.6 km/h) per minute until test termination",
            "rationale": "Phase 2 runs only if the incline ceiling is reached without a symptom threshold."
          },
          {
            "id": "cooldown",
            "label": "On test termination, reduce the belt to 2.0 mph at 0° incline for a 2-minute cool-down",
            "rationale": "Then rest the client until symptoms settle toward their pre-test baseline."
          }
        ],
        "correctOrder": [
          "baseline",
          "setspeed",
          "incline",
          "speedramp",
          "cooldown"
        ],
        "explanation": "Standardisation is the point: using the same protocol every time means your serial re-test data reflects true physiological change, not protocol artefact. Set the belt to a brisk but comfortable walking speed. The published protocol specifies 3.2–3.6 mph (approximately 5.0–5.8 km/h). Continue increasing incline by exactly 1° (one degree) at the start of each subsequent minute. Once incline reaches its ceiling, hold incline fixed. Increase speed by 0.4 mph (≈0.6 km/h) per minute until test termination. On test termination, reduce the belt to 2.0 mph at 0° incline for a 2-minute cool-down, then rest the client until symptoms settle toward their pre-test baseline."
      },
      {
        "kind": "quick-check",
        "question": "A client rates their current overall symptom intensity at 3/10 before the belt moves. At what symptom score is the termination criterion met?",
        "options": [
          "3/10 — the criterion is counted from zero, so a resting score of 3 already meets it.",
          "4/10 — any rise above the pre-test baseline meets the criterion.",
          "5/10 — a 2-point rise from baseline terminates the test.",
          "6/10 — the threshold is defined relative to the baseline, not relative to zero."
        ],
        "correctAnswer": 3,
        "explanation": "This baseline score is the reference point for the ≥3-point threshold criterion — the threshold is defined relative to the baseline, not relative to zero. A client with a 3/10 resting score reaches threshold at 6/10, not at 3/10. Below that: a 1-point fluctuation may be within normal test variation. A 2-point rise from baseline is a caution signal — increase monitoring frequency. A ≥3-point rise from baseline terminates the test."
      }
    ],
    "hrt-identification": [
      {
        "kind": "matching",
        "title": "HRt as a Percentage of Age-Predicted HRmax",
        "instruction": "Match each HRt band to the interpretation the module gives it.",
        "pairs": [
          {
            "id": "severe",
            "left": "HRt at 50–65% of HRmax",
            "right": "Severe exercise intolerance",
            "explanation": "These clients often cannot tolerate brisk walking or light daily activity without symptom provocation. Begin prescription conservatively."
          },
          {
            "id": "moderate",
            "left": "HRt at 65–80% of HRmax",
            "right": "Moderate exercise intolerance",
            "explanation": "The most common presentation in active individuals referred within 2–4 weeks of injury."
          },
          {
            "id": "mild",
            "left": "HRt at 80–90% of HRmax",
            "right": "Mild exercise intolerance",
            "explanation": "Often seen in highly fit individuals or further into the recovery trajectory."
          },
          {
            "id": "normal",
            "left": "Above 90% of HRmax with no ≥3-point symptom rise",
            "right": "Normal test — Endpoint 2",
            "explanation": "Tracking the HRt as % of HRmax across re-tests is how you document that the physiological ceiling is rising — objective evidence the underlying regulatory impairments are resolving."
          }
        ],
        "leftLabel": "HRt band",
        "rightLabel": "Interpretation"
      },
      {
        "kind": "multi-select",
        "question": "Select every finding that requires an EMERGENCY STOP — stopping immediately regardless of symptom score or heart rate.",
        "options": [
          "Ataxia or marked pallor",
          "Syncope or near-syncope",
          "A 2-point symptom rise from the pre-test baseline",
          "Chest pain or pressure, or cardiac arrhythmia on the monitor",
          "Voluntary exhaustion at RPE > 17 with no ≥3-point symptom rise",
          "Acute worsening confusion, or a rapidly escalating thunderclap headache"
        ],
        "correctAnswers": [
          0,
          1,
          3,
          5
        ],
        "explanation": "Stop immediately for: ataxia, marked pallor, syncope or near-syncope, chest pain or pressure, cardiac arrhythmia on monitor, acute worsening confusion, or a rapidly escalating thunderclap headache. Do not leave the client alone. Manage as a medical event. The two non-emergency options are ordinary test events: a 2-point rise from baseline is a caution signal — increase monitoring frequency; and a client who reaches voluntary exhaustion (RPE > 17), or ≥90% of age-predicted maximum HR, without a ≥3-point symptom rise has produced Endpoint 2 — a normal, negative test."
      }
    ],
    "buffalo-bike-test": [
      {
        "kind": "quick-check",
        "question": "In the validated BCBT protocol (Haider et al., 2019), how is the workload progressed and monitored?",
        "options": [
          "Start at approximately 20 W and increase resistance by approximately 10–15 W every 2 minutes, holding cadence at approximately 60–80 rpm, capturing HR, RPE and symptom score at the end of every 2-minute stage.",
          "Start at the client's self-selected resistance and let the client increase the load whenever they feel ready.",
          "Increase resistance every minute and capture heart rate, RPE and symptom score only at test termination.",
          "Ramp to voluntary exhaustion in every case — the ≥3-point symptom criterion applies to the treadmill test only."
        ],
        "correctAnswer": 0,
        "explanation": "The Haider et al. (2019) protocol uses a watt-based ramp on a stationary cycle ergometer: start at approximately 20 watts (W) — a minimal warm-up load. Increase resistance by approximately 10–15 W every 2 minutes. Cadence: maintain approximately 60–80 rpm. Coach the client to hold cadence steady as resistance rises — the ergometer controls the load. At the end of every 2-minute stage, capture: heart rate (bpm), RPE (Borg 6–20), symptom score (0–10 VAS). Termination criteria are identical to the BCTT: ≥3-point symptom rise (Endpoint 1) or voluntary exhaustion / physical maximum (Endpoint 2)."
      }
    ],
    "threshold-to-prescription": [
      {
        "kind": "quick-check",
        "question": "A client reaches symptom threshold at an HRt of 150 bpm. What is the target heart-rate zone for their daily aerobic prescription?",
        "options": [
          "95% of HRt, to maximise training stimulus close to the threshold.",
          "120–135 bpm.",
          "50% of HRt — the client should train far below the threshold.",
          "90% of HRt only — the upper end of the zone is always prescribed regardless of baseline symptom severity."
        ],
        "correctAnswer": 1,
        "explanation": "Calculate the TARGET HEART RATE ZONE as 80–90% of HRt. Example: HRt = 150 bpm → target zone = 120–135 bpm. The 80% floor is deliberately below the symptom-limited threshold so the training session runs for its full duration without triggering a symptom episode (Leddy et al., 2010). The 90% ceiling keeps training load close enough to the threshold to provide a meaningful adaptive stimulus — loading the impaired regulatory systems in their remodelling zone without breaching their capacity."
      },
      {
        "kind": "matching",
        "title": "The Standard FITT Prescription",
        "instruction": "Match each element of the FITT prescription to what the module specifies for it.",
        "pairs": [
          {
            "id": "frequency",
            "left": "FREQUENCY",
            "right": "Most days of the week — typically 5–6 sessions per week for the first 1–2 weeks",
            "explanation": "Daily-load rationale: repeated, controlled sub-threshold loading drives progressive autonomic remodelling more effectively than low-frequency loading (Leddy et al., 2019)."
          },
          {
            "id": "intensity",
            "left": "INTENSITY",
            "right": "80–90% of HRt, self-monitored via heart-rate device and backed up with Borg RPE 11–14",
            "explanation": "Coach the client to treat any new or rising symptom as the true upper limit — if symptoms climb, ease off regardless of the HR number."
          },
          {
            "id": "time",
            "left": "TIME",
            "right": "Approximately 20 minutes of continuous aerobic exercise per session, excluding warm-up and cool-down",
            "explanation": "Warm-up and cool-down are each approximately 5 minutes at sub-target HR."
          },
          {
            "id": "type",
            "left": "TYPE",
            "right": "A sustainable, low-impact aerobic mode the client can hold at a steady state — stationary cycling, treadmill walking, or flat-ground walking",
            "explanation": "Avoid at this stage: high-impact activities (running, jumping), activities with sudden acceleration/deceleration demands, or head-position-challenging modes."
          }
        ],
        "leftLabel": "FITT element",
        "rightLabel": "Prescription"
      },
      {
        "kind": "insight",
        "type": "tip",
        "title": "Deriving the training band from HRt",
        "content": "The conversion is arithmetic you can do at the treadmill: calculate the TARGET HEART RATE ZONE as 80–90% of HRt. Example: HRt = 150 bpm → target zone = 120–135 bpm. The BCTT calculator in your Clinical Toolkit performs the same conversion from the stage data, and is the quickest way to go from a completed test to a written prescription. The module's own position on tooling still holds: the prescription calculation can be performed by hand in under 30 seconds — 80–90% of the recorded HRt is the arithmetic. Any software or app that performs the same calculation is an optional convenience, not a clinical requirement. The EP remains personally responsible for the accuracy of the prescription regardless of what tool generated it."
      }
    ],
    "retesting-and-progression": [
      {
        "kind": "quick-check",
        "question": "A re-test shows the symptom threshold has DROPPED since the previous test, even though the client reports completing daily sessions with only mild, transient symptoms. What is the correct EP response?",
        "options": [
          "Advance the prescription by 10 bpm — random test variation is expected and should not change the prescription direction.",
          "Reduce the prescription, investigate the cause, and communicate to the referrer before re-prescribing.",
          "Double the daily session frequency to drive faster autonomic remodelling.",
          "Conclude the physiological phenotype has resolved and reassess for non-physiological phenotypes."
        ],
        "correctAnswer": 1,
        "explanation": "If a re-test shows the symptom threshold has DROPPED since the previous test, this is a clinically significant finding requiring investigation before the prescription is changed. Possible causes: over-exertion, sleep deprivation, intercurrent illness, a psychosocial stressor increasing baseline symptom load, or an emerging non-aerobic phenotype driver. Reduce the prescription, investigate the cause, and communicate to the referrer. Do not simply re-prescribe at the lower threshold without understanding why it dropped."
      },
      {
        "kind": "multi-select",
        "question": "Select every across-session source of variability the module says the EP should document at every re-test session.",
        "options": [
          "Medication timing (especially beta-blockers, stimulants, antihistamines)",
          "Caffeine intake and timing",
          "Prior-day exercise load",
          "Placebo effects from the EP's interaction with the client",
          "Sleep quality the night before",
          "Resting baseline symptom score at test start"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          4,
          5
        ],
        "explanation": "Sources of across-session variability the EP should document at every session: medication timing (especially beta-blockers, stimulants, antihistamines); caffeine intake and timing; prior-day exercise load; sleep quality the night before; resting baseline symptom score at test start. Documenting these at every re-test session allows anomalous threshold changes to be attributed correctly to a confounder vs. genuine physiological change — a distinction that determines whether you advance, hold or reduce the prescription."
      }
    ],
    "adjunct-measures": [
      {
        "kind": "multi-select",
        "question": "Select every result that counts as a POSITIVE VOMS finding.",
        "options": [
          "A symptom increase of ≥2 points on any domain after any single component",
          "A +1 headache increase after horizontal saccades",
          "An NPC >5 cm",
          "An NPC of 4 cm averaged across three trials",
          "Inability to maintain stable fixation during VOR without symptom provocation"
        ],
        "correctAnswers": [
          0,
          2,
          4
        ],
        "explanation": "A POSITIVE VOMS FINDING is: a symptom increase of ≥2 points on any domain after any single component; an NPC >5 cm (convergence insufficiency); inability to maintain stable fixation during VOR without symptom provocation. For the near point of convergence, NORMAL: ≤5 cm. ABNORMAL: >5 cm — so 4 cm is a normal result. The +1 saccade headache does not meet the ≥2-point positive VOMS threshold."
      },
      {
        "kind": "quick-check",
        "question": "Why does adding a cognitive dual-task (counting backwards by 7s) to the timed tandem gait test increase its sensitivity as a serial recovery outcome measure?",
        "options": [
          "The arithmetic task increases cardiac output and thereby reveals the heart-rate threshold for gait impairment.",
          "A recovering post-concussion brain has reduced cognitive-motor reserve — it can dedicate sufficient resources to gait OR cognitive demands alone, but not both simultaneously at the same performance level as an uninjured brain.",
          "Counting backwards reduces vestibular input to the cerebellum, making balance deficits easier to detect.",
          "Dual-task gait tests are used only for return-to-sport medical clearance, not as serial outcome measures within EP scope."
        ],
        "correctAnswer": 1,
        "explanation": "DUAL-TASK INTERFERENCE: the degradation of gait performance (slower time, more errors) when the cognitive task is added is a sensitive marker of incomplete recovery. A recovering post-concussion brain has reduced cognitive-motor reserve — it can dedicate sufficient resources to gait OR cognitive demands alone, but not both simultaneously at the same performance level as an uninjured brain. Serial improvement in single- and dual-task times, and reduction in dual-task interference, are concrete objective findings to include in progress reports."
      }
    ],
    "worked-example": [
      {
        "kind": "scenario",
        "title": "Session 1: Calling the Endpoint and Writing the Prescription",
        "patientSummary": "A 23-year-old female AFL player is referred 18 days post-concussion (sustained in a match tackle). She is cleared of red flags by the sports physician and referred to the AEP for graded exertion testing and rehabilitation. No cardiac history, no medications, highly fit (trains 6 days/week pre-injury). She reports persistent headache (3/10 at rest) and exercise intolerance — she attempted a light jog on Day 14 and was headache-limited within 4 minutes.",
        "steps": [
          {
            "id": "step-endpoint",
            "narrative": "You are running the BCTT at 5.4 km/h with +1° incline per minute. At the end of Minute 6 she reports a symptom score of 7/10. What do you do?",
            "clinicalData": [
              "Baseline: resting HR 62 bpm, BP 112/72, baseline symptom score 3/10 (headache)",
              "Age-predicted HRmax (Tanaka): 192 bpm",
              "Minute 4 (4°): HR 118, RPE 11, symptom 4/10 — headache +1 (caution noted)",
              "Minute 5 (5°): HR 128, RPE 12, symptom 5/10 — headache +2 (monitoring intensified)",
              "Minute 6 (6°): HR 138, RPE 13, symptom 7/10 — headache +4 from baseline"
            ],
            "choices": [
              {
                "label": "Stop the belt immediately and record HRt = 138 bpm — Endpoint 1",
                "feedback": "Record the HRt: the heart rate AT THE MOMENT the ≥3-point increase was reported.",
                "nextStepId": "step-zone"
              },
              {
                "label": "Keep the belt moving to voluntary exhaustion so the maximum heart rate is also captured",
                "nextStepId": "outcome-push"
              },
              {
                "label": "Stop, but record the threshold back at Minute 4 when the headache first rose by 1 point",
                "nextStepId": "outcome-early"
              }
            ]
          },
          {
            "id": "step-zone",
            "narrative": "Test terminated at Minute 6. Now convert the threshold into her first prescription. Which target zone do you set?",
            "clinicalData": [
              "HRt = 138 bpm. Endpoint 1. HRt as % HRmax = 138/192 = 72%",
              "Dominant symptom: headache. Time to threshold: 6 minutes",
              "Resting symptom score at test start: 3/10"
            ],
            "choices": [
              {
                "label": "80–85% of 138 = 110–117 bpm",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "90% of 138 — the upper end of the zone",
                "nextStepId": "outcome-upper"
              },
              {
                "label": "95% of 138, to maximise training stimulus close to the threshold",
                "nextStepId": "outcome-95"
              }
            ]
          },
          {
            "id": "outcome-push",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The Test Was Already Over at Minute 6",
              "explanation": "The client reports an increase of ≥3 points on the 0–10 symptom VAS relative to their pre-test baseline. This is the concussion-specific, exercise-intolerance endpoint. Stop the belt immediately. Record the HRt: the heart rate AT THE MOMENT the ≥3-point increase was reported.",
              "clinicalReasoning": "Stopping early is a successful test — not a failure. We are looking for the heart rate where your brain tells us it has reached its limit. A client who feels they are failing by stopping early may push through symptoms, distorting the result upward and generating an unsafe prescription."
            }
          },
          {
            "id": "outcome-early",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "One Point Is Not the Threshold",
              "explanation": "A 1-point fluctuation may be within normal test variation. A 2-point rise from baseline is a caution signal — increase monitoring frequency. A ≥3-point rise from baseline terminates the test. Her baseline was 3/10, so the threshold is the 7/10 at Minute 6 — HRt = 138 bpm.",
              "clinicalReasoning": "Stopping for any symptom rather than specifically a ≥3-point rise produces a false prescription. It generates a target heart rate for a physiological phenotype that may not be the client's primary problem, and undersells the client's actual exercise capacity."
            }
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Conservative End of the 80–90% Zone",
              "explanation": "80% of 138 = 110 bpm; 85% = 117 bpm. Start at the conservative end (80–85%) given moderate symptom reactivity and early threshold. Intensity: 110–117 bpm (Borg RPE approximately 11).",
              "clinicalReasoning": "Start nearer 80% (lower end) for clients who reached threshold very early or at a low percentage of HRmax, and for a first prescription where reactivity is unknown. The 80% floor is deliberately below the symptom-limited threshold so the training session runs for its full duration without triggering a symptom episode (Leddy et al., 2010)."
            }
          },
          {
            "id": "outcome-upper",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "acceptable",
              "title": "Inside the Zone, But Not Where This Client Starts",
              "explanation": "90% is the ceiling of the prescribed band, and starting nearer 90% (upper end) is reserved for clients with low resting symptoms and a moderate-to-high HRt (65–80%+ of HRmax), and for highly fit individuals already tolerating light activity without lasting symptom exacerbation.",
              "clinicalReasoning": "For this client the worked example starts lower: 80% of 138 = 110 bpm; 85% = 117 bpm. Start at the conservative end (80–85%) given moderate symptom reactivity and early threshold."
            }
          },
          {
            "id": "outcome-95",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "95% Is Outside the Prescribed Band",
              "explanation": "Calculate the TARGET HEART RATE ZONE as 80–90% of HRt. The 90% ceiling keeps training load close enough to the threshold to provide a meaningful adaptive stimulus — loading the impaired regulatory systems in their remodelling zone without breaching their capacity.",
              "clinicalReasoning": "The 80% floor is deliberately below the symptom-limited threshold so the training session runs for its full duration without triggering a symptom episode (Leddy et al., 2010)."
            }
          }
        ]
      }
    ]
  },
  "204": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1 claims SSTAE works by improving cardiovascular fitness, which compensates for the impaired blood-flow regulation of the injured brain. Why is that wrong?",
        "options": [
          "Because no cardiovascular adaptation occurs at all below the symptom threshold — the intensity is too low to change anything systemic.",
          "Because SSTAE is not primarily a fitness intervention and it does not merely compensate — it repeatedly loads the specific physiological systems that concussion impaired (autonomic, cerebrovascular, neurotrophic, neuroinflammatory, systemic) and actively drives repair of them.",
          "Because the true driver is reduced anxiety and catastrophising, which are the primary drivers of persistent concussion symptoms.",
          "Because the true driver is improved peripheral oxygen extraction in skeletal muscle, reducing the cardiac output demand on the brain."
        ],
        "correctAnswer": 1,
        "explanation": "SSTAE is not primarily a fitness or psychological intervention. Its mechanism is the targeted, repeated loading of the specific physiological systems that concussion impaired: (1) the autonomic system (vagal tone, baroreflex — via cardiac baroreceptor and NTS retraining), (2) cerebral autoregulation and cerebrovascular CO₂ reactivity (via eNOS/NO upregulation and astrocyte normalisation), (3) BDNF-mediated neuroplasticity and angiogenesis, (4) neuroinflammation reduction (myokine pathway, microglial M1→M2 shift), and (5) reversal of systemic deconditioning (plasma volume expansion, mitochondrial biogenesis). The word \"compensates\" is the giveaway: It does not merely compensate for the concussive disruption; it actively drives molecular-level repair of the synaptic, axonal and vascular architecture that was compromised."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2 claims the heart-rate threshold from the BCTT is simply a safe exercise cap, and that the mechanism of benefit is just staying active. What does the module say the HRt actually is?",
        "options": [
          "A maximum heart rate above which cardiac risk rises during rehabilitation.",
          "An age-predicted percentage applied to the individual patient.",
          "The empirically observed, patient-specific physiological ceiling — the measurable workload at which the sum of all unresolved autonomic/cerebrovascular impairments causes symptom provocation.",
          "A conservative administrative limit, with the therapeutic benefit coming from the activity itself rather than the dose."
        ],
        "correctAnswer": 2,
        "explanation": "It is not a maximum heart rate. It is not an age-predicted percentage. It is the empirically observed, patient-specific physiological ceiling — the measurable workload at which the sum of all unresolved autonomic/cerebrovascular impairments causes symptom provocation. And the benefit is not simple activity: the question \"why does sub-symptom-threshold aerobic exercise drive concussion recovery?\" is not answered by \"it keeps the patient active.\" It is answered by a cascade of measurable, mechanistically understood biochemical and physiological adaptations — each directly reversing the specific impairments established in Module 1."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3 claims that exercising at the threshold (HRt) itself produces the fastest recovery because it delivers the maximum stimulus. Why is training AT or ABOVE the HRt counterproductive?",
        "options": [
          "It is not counterproductive — the maximum adaptive stimulus occurs at peak cardiovascular loading.",
          "Because it triggers the very symptom-provoking cerebrovascular failure the impaired system cannot handle; rather than driving adaptive remodelling, supra-threshold exercise reinforces the instability.",
          "Because heart rates at the HRt sit above the training zone for cardiovascular adaptation, so no autonomic training benefit occurs.",
          "Because exercising at HRt causes lactic acidosis that reduces brain pH, impairing synaptic function."
        ],
        "correctAnswer": 1,
        "explanation": "Exercising AT or ABOVE the symptom-limited HRt does not accelerate the autonomic recalibration — it triggers the very symptom-provoking cerebrovascular failure the impaired system cannot handle. The NTS receives conflicting, destabilising input when CBF becomes insufficient; rather than driving adaptive remodelling, supra-threshold exercise reinforces the instability. The 10–20% buffer below HRt ensures that every session provides a consistent, repeatable, sub-maximal autonomic stimulus the impaired regulatory network can process and adapt to."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4 claims that a 2-point symptom rise during exercise means the session should be abandoned for the day and the patient rested. What is the actual first response to a mid-session ≥2-point rise?",
        "options": [
          "Abandon the session and rest the patient for the remainder of the day.",
          "First reduce intensity by dropping the HR cap by approximately 10 bpm and allow 1–2 minutes for symptoms to settle; if they settle and stay down, the patient continues at the lower intensity.",
          "Increase intensity to push through the threshold and build tolerance — brief symptom spikes during exercise are productive.",
          "Continue unchanged, because a rise of this size is below the clinical concern threshold and the body will adapt."
        ],
        "correctAnswer": 1,
        "explanation": "Mid-session ≥2-point rise: first reduce intensity by dropping the HR cap by approximately 10 bpm and allow 1–2 minutes for symptoms to settle. If symptoms settle and stay down at the reduced load, the patient can continue for the remaining time at the lower intensity. Stopping is the second step, not the first: If symptoms do not settle or continue climbing — stop the session. The \"rest the patient\" half of the myth is also wrong in principle — Prolonged rest in a deconditioned post-concussion patient does not preserve a safe state — it actively worsens it."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 5 claims that once symptoms resolve, metabolic and autonomic recovery is complete and SSTAE can be stopped. What does the module give as the aerobic recovery endpoint?",
        "options": [
          "Resolution of symptoms at rest — at that point the physiological phenotype has resolved.",
          "The ability to exercise to approximately 85–90% of age-predicted maximum heart rate (or to volitional exhaustion on a graded test) WITHOUT symptom provocation.",
          "Two weeks of symptom-free sub-threshold sessions, at which point the patient can be discharged.",
          "A normal BCTT result, which the AEP can then use as a clearance instrument for return to contact."
        ],
        "correctAnswer": 1,
        "explanation": "The aerobic recovery endpoint is the ability to exercise to approximately 85–90% of age-predicted maximum heart rate (or to volitional exhaustion on a graded test) WITHOUT symptom provocation — i.e., a normal, essentially symptom-free maximal exertion test on BCTT. At that point, the physiological/autonomic phenotype has resolved. Symptom resolution is not that endpoint: Symptom resolution does not equal metabolic recovery — the neurometabolic cascade can persist weeks beyond symptom resolution. Note also that the endpoint is a marker of recovered exercise tolerance. It is NOT the same as medical clearance for return to contact sport — that decision rests with the diagnosing medical clinician."
      }
    ],
    "autonomic-restoration": [
      {
        "kind": "quick-check",
        "question": "Across an SSTAE program a patient's HF-HRV (0.15–0.4 Hz), tracked on a wearable HR monitor, is steadily rising. What does that signal mean?",
        "options": [
          "Improving cardiac muscle strength and increased stroke volume — a sign of improved cardiovascular fitness rather than concussion-specific recovery.",
          "An objective, measurable signal of autonomic recovery, occurring in parallel with the rising symptom threshold on serial BCTT.",
          "Resolution of the blood-brain barrier permeability that occurred in the acute phase.",
          "An artefact of restored activity levels — HRV returns to pre-injury values regardless of the autonomic recovery mechanism."
        ],
        "correctAnswer": 1,
        "explanation": "HF-HRV (0.15–0.4 Hz) reflects moment-to-moment vagal modulation of heart rate — a healthy rhythm is slightly irregular because the parasympathetic system continuously adjusts rate within each respiratory cycle. Post-concussion, HF-HRV is reduced. Progressive improvement in HF-HRV across the SSTAE program is an objective, measurable signal of autonomic recovery — and it occurs in parallel with the rising symptom threshold on serial BCTT."
      }
    ],
    "cbf-autoregulation-restoration": [
      {
        "kind": "quick-check",
        "question": "By what mechanism does repeated sub-threshold aerobic exercise improve the vasodilatory capacity of cerebral arterioles — and how does that improvement present clinically?",
        "options": [
          "It increases respiratory rate, raising baseline PaCO₂, which chronically vasodilates cerebral vessels and restores reactivity by exposure.",
          "Repeated exercise increases laminar shear stress on cerebral arteriolar endothelium, upregulating eNOS via PI3K/Akt and raising basal nitric oxide production; clinically it shows up as a rising HRt on serial BCTT.",
          "It reduces the PaCO₂ set-point in the medulla, replacing CO₂-dependent vasodilation with a more stable pressure-based mechanism.",
          "It does not — CVR resolves spontaneously over 6–12 months regardless of rehabilitation."
        ],
        "correctAnswer": 1,
        "explanation": "Repeated aerobic exercise increases laminar shear stress on endothelial cells of cerebral arterioles. Shear stress upregulates endothelial nitric oxide synthase (eNOS) via the PI3K/Akt signalling pathway — increasing basal nitric oxide (NO) production. NO is the primary endothelium-derived vasodilator; chronically elevated NO bioavailability directly improves the vasodilatory capacity of cerebral arterioles and partially restores the CO₂-driven dilation mechanism. The clinical manifestation of CVR and dCA recovery is a rising HRt on serial BCTT. Each re-test that shows a higher symptom-provoking workload is direct evidence that these cerebrovascular adaptations have occurred."
      }
    ],
    "bdnf-neuroplasticity": [
      {
        "kind": "ordering",
        "title": "The Exercise-to-BDNF Signalling Cascade",
        "instruction": "Put the steps of the primary exercise-BDNF pathway into the order the module describes.",
        "items": [
          {
            "id": "amp-ratio",
            "label": "Muscular contraction depletes ATP, raising the AMP:ATP ratio in muscle cells",
            "rationale": "The initiating metabolic signal — it is muscle contraction, not brain activity, that starts the cascade."
          },
          {
            "id": "ampk",
            "label": "AMPK is activated, enters the circulation and crosses the blood-brain barrier",
            "rationale": "AMPK in neurons and astrocytes activates the transcriptional co-activator PGC-1α."
          },
          {
            "id": "fndc5",
            "label": "PGC-1α drives expression of FNDC5, a transmembrane protein cleaved to produce irisin",
            "rationale": "The same PGC-1α pathway also drives skeletal muscle mitochondrial biogenesis."
          },
          {
            "id": "irisin",
            "label": "Circulating irisin crosses the blood-brain barrier and upregulates BDNF gene expression in hippocampal and cortical neurons",
            "rationale": "Particularly in the dentate gyrus of the hippocampus (the primary site of adult neurogenesis)."
          },
          {
            "id": "trkb",
            "label": "BDNF binds TrkB receptors at post-synaptic densities, activating PI3K/Akt and MAPK/ERK",
            "rationale": "PI3K/Akt promotes neuronal survival and protein synthesis; MAPK/ERK drives synaptic plasticity, LTP induction and AMPA receptor insertion."
          }
        ],
        "correctOrder": [
          "amp-ratio",
          "ampk",
          "fndc5",
          "irisin",
          "trkb"
        ],
        "explanation": "The primary exercise-BDNF pathway: muscle contraction → elevated AMP:ATP → AMPK activation → PGC-1α → FNDC5 expression → cleavage to circulating irisin → BBB crossing → BDNF gene expression in hippocampus and cortex. At the target end of the chain, BDNF binds TrkB (tropomyosin receptor kinase B) receptors at post-synaptic densities and activates two key intracellular pathways: PI3K/Akt (promoting neuronal survival and protein synthesis) and MAPK/ERK (driving synaptic plasticity, LTP induction and AMPA receptor insertion)."
      }
    ],
    "neuroinflammation-reduction": [
      {
        "kind": "quick-check",
        "question": "Why can exercise that exceeds the HRt invert the anti-inflammatory effect of aerobic exercise in the acute-to-subacute post-concussion window?",
        "options": [
          "Because higher intensities overheat the brain, and the heat-shock protein response that suppresses microglia is lost above the threshold.",
          "Because supra-threshold loading provokes symptom exacerbation and triggers a secondary cortisol stress response, and cortisol at high acute levels increases BBB permeability and amplifies neuroinflammatory signalling.",
          "Because above the HRt, exercise reduces cerebral glucose consumption, depriving activated microglia of their primary energy source.",
          "It cannot — the anti-inflammatory effect of exercise is intensity-independent, so the sub-threshold constraint is only a symptom-management measure."
        ],
        "correctAnswer": 1,
        "explanation": "Supra-threshold exercise — loading that exceeds the HRt and provokes symptom exacerbation — triggers a secondary cortisol stress response. Cortisol, at high acute levels, increases BBB permeability and amplifies neuroinflammatory signalling. Maximal or near-maximal intensity exercise in the acute-to-subacute post-concussion window can worsen neuroinflammation rather than reduce it. This is why the dose is not merely a precaution: The prescription target is not merely a safety measure — it is what determines whether the treatment is anti-inflammatory or pro-inflammatory."
      }
    ],
    "deconditioning-reversal": [
      {
        "kind": "quick-check",
        "question": "A patient has been largely inactive for six weeks since their concussion. Their family asks whether more rest would be the safer option before starting exercise. What does the module say about prolonged rest in this situation?",
        "options": [
          "Rest preserves a safe baseline — the real risk is that exercise re-provokes the neurometabolic cascade.",
          "Prolonged rest does not preserve a safe state — it actively worsens it: the autonomic dysregulation deepens, the HRt may fall further, and the fear-avoidance cycle becomes increasingly entrenched.",
          "Rest is neutral — deconditioning affects general fitness but not the autonomic impairments that concussion produced.",
          "Rest until symptoms fully resolve, since metabolic and autonomic recovery is complete at symptom resolution."
        ],
        "correctAnswer": 1,
        "explanation": "Prolonged rest in a deconditioned post-concussion patient does not preserve a safe state — it actively worsens it. The autonomic dysregulation deepens, the HRt may fall further, and the fear-avoidance cycle becomes increasingly entrenched. The deconditioning is not a separate, harmless problem: even 10 days of bed rest reduces VO₂max by approximately 7–10%, lowers plasma volume by 10–12%, and independently reduces baroreflex sensitivity and heart rate variability. Deconditioning thus worsens the exact physiological impairments that concussion produced — compounding both the exercise intolerance and the autonomic dysregulation. Early sub-threshold exercise addresses both the concussion-specific impairments and the deconditioning simultaneously — and both improve rapidly in the first 1–2 weeks of consistent SSTAE."
      }
    ],
    "threshold-to-prescription": [
      {
        "kind": "quick-check",
        "question": "A deconditioned patient records a symptom-limited BCTT with an HRt of 115 bpm. What is the initial daily training band, and what do you tell them it will feel like?",
        "options": [
          "104–115 bpm (90–100% of HRt) — train as close to the ceiling as possible to maximise the stimulus.",
          "92–104 bpm (80–90% of HRt). It may feel like a very low effort — and it should; in the first week the goal is consistency and confidence, not exertion.",
          "70–80% of HRt — to maximise the safety margin.",
          "Resting or near-resting heart rate — because the brain needs complete cardiovascular rest to recover."
        ],
        "correctAnswer": 1,
        "explanation": "Example B: HRt = 115 bpm (low — deconditioned and/or significantly impaired). 80% = 92 bpm; 90% = 104 bpm. Initial training band: 92–104 bpm. This may feel like a very low effort — and it should. In the first week, the goal is consistency and confidence, not exertion. Rapid gains are expected as deconditioning reverses. Dropping lower still is not safer in any useful sense: Below 80% of HRt (particularly in the first weeks), the stimulus is insufficient to produce meaningful autonomic retraining — the system is not challenged enough to adapt."
      },
      {
        "kind": "quick-check",
        "question": "A referred patient with persisting symptoms completes the BCTT to volitional exhaustion at 182 bpm with no ≥3-point symptom rise. What is the correct next step?",
        "options": [
          "Prescribe SSTAE using 80–90% of the peak heart rate reached on the test.",
          "Prescribe aerobic reconditioning as the primary intervention anyway, since the patient still has persisting symptoms.",
          "No HRt is identifiable — do not prescribe SSTAE as the primary intervention, and communicate back to the referrer that the physiological phenotype is not confirmed by graded exertion testing.",
          "Conclude the patient has recovered, because a maximal test without symptom provocation means all phenotypes have resolved."
        ],
        "correctAnswer": 2,
        "explanation": "The patient exercised to volitional fatigue or maximal RPE without a ≥3-point symptom rise. No symptom ceiling exists. This patient likely has normal exercise tolerance — their persisting symptoms are unlikely to be physiological in origin and may be driven by a different phenotype (vestibular, cervicogenic, cognitive, mood). Flag this back to the referrer rather than prescribing aerobic reconditioning as the primary intervention. As the worked example puts it: Do not prescribe SSTAE as the primary intervention. Communicate back to the referrer that the physiological phenotype is not confirmed by graded exertion testing."
      }
    ],
    "fitt-prescription": [
      {
        "kind": "quick-check",
        "question": "In an SSTAE prescription, how is the intensity — the defining variable — set?",
        "options": [
          "As a percentage of age-predicted maximum heart rate.",
          "As a percentage of heart rate reserve (%HRR, Karvonen).",
          "As 80–90% of the individually measured HRt from the BCTT.",
          "As a fixed RPE target on the Borg scale."
        ],
        "correctAnswer": 2,
        "explanation": "Intensity is set as 80–90% of the individually measured HRt from the BCTT (Leddy et al., 2019; Chapel & Valovich McLeod, 2026) — NOT as a percentage of age-predicted maximum heart rate, NOT as %HRR (heart rate reserve / Karvonen), NOT as a fixed RPE target. RPE still has a role, but a subordinate one: RPE (Borg 6–20 scale, or 0–10 modified Borg) is a useful secondary cross-check — the target band typically corresponds to approximately RPE 11–13 (\"fairly light\" to \"somewhat hard\") in most patients, but defer to the HR cap if RPE and HR diverge."
      },
      {
        "kind": "multi-select",
        "question": "Which of these modalities does the module say to AVOID early in an SSTAE program? (Select all that apply.)",
        "options": [
          "Running",
          "Recumbent stationary bike",
          "Rowing",
          "Treadmill walking",
          "Swimming",
          "Resistance circuits",
          "Outdoor walking"
        ],
        "correctAnswers": [
          0,
          2,
          4,
          5
        ],
        "explanation": "AVOID early on: running (impact and rapid head motion), rowing (trunk and head flexion/extension), swimming (position changes and breath-holding), resistance circuits (HR spikes and Valsalva), and any contact or collision exposure. The permitted set is the opposite of that list: First-line modalities: stationary upright or recumbent bike, treadmill walking or incline walking, outdoor walking. Selection criteria: the modality must allow precise sustained HR control, must NOT involve head impact, must NOT require significant head and neck motion or rapid positional changes, and must carry low fall risk."
      }
    ],
    "symptom-monitoring": [
      {
        "kind": "flowchart",
        "title": "Governing a Single SSTAE Session",
        "steps": [
          {
            "label": "Before the session — set the baseline",
            "description": "the patient rates their current resting symptom level across key domains (headache, dizziness, fogginess, nausea — a brief symptom list). The highest score becomes the baseline for that session. This step is non-negotiable — the rule is meaningless without it."
          },
          {
            "label": "During the session — check in at 5, 10 and 15 minutes",
            "description": "A clear verbal check-in at 5, 10 and 15 minutes during a 20-minute session is standard. Teach the patient to monitor the TRAJECTORY (\"Is it climbing and staying up, or did it blip and settle?\"), not the instantaneous number."
          },
          {
            "label": "A ≥2-point rise above baseline — reduce first",
            "description": "Mid-session ≥2-point rise: first reduce intensity by dropping the HR cap by approximately 10 bpm and allow 1–2 minutes for symptoms to settle. If symptoms settle and stay down at the reduced load, the patient can continue for the remaining time at the lower intensity."
          },
          {
            "label": "Symptoms do not settle — stop",
            "description": "Symptoms do not settle / continue to climb: stop the session entirely. Do not push through. Pushing through a triggered symptom escalation is the clinical failure mode — it deepens the supply-demand mismatch, reinforces the physiological instability, and usually results in delayed next-day exacerbation."
          },
          {
            "label": "After the session — re-rate twice",
            "description": "AFTER the session: re-rate symptoms immediately on stopping, and again 30–60 minutes later. Delayed exacerbation — symptoms worsening an hour after exercise or the following morning — is the key signal that the dose was too high even if the session felt tolerable."
          },
          {
            "label": "Next day — act on delayed exacerbation",
            "description": "Delayed/next-day exacerbation: the prescribed HR ceiling was too high for the current recovery stage. Drop the ceiling by 5–10 bpm for subsequent sessions and hold there until sessions are consistently asymptomatic before attempting to progress."
          }
        ]
      },
      {
        "kind": "multi-select",
        "question": "A patient reports each of the following during or just after a session. Which does the module classify as ACCEPTABLE rather than threshold-crossing? (Select all that apply.)",
        "options": [
          "A 1-point headache increase that resolves within 2 minutes of light adjustment.",
          "Mild transient light-headedness at session onset that resolves once the HR stabilises in the target band.",
          "Headache climbing from 2/10 to 4/10 and remaining at 4/10 for more than 2 minutes despite reducing intensity.",
          "Mild concentration fatigue at the end of the session that resolves within 10 minutes of cooling down.",
          "New dizziness, visual disturbance or worsening nausea during the session."
        ],
        "correctAnswers": [
          0,
          1,
          3
        ],
        "explanation": "The target is NOT zero symptoms before exercising — that would mean never starting. We exercise up to, but not across, the threshold: a small, transient, self-resolving bump is expected and acceptable; a sustained ≥2-point escalation is not (Leddy et al., 2018). So: NOT acceptable: headache climbing from 2/10 to 4/10 and remaining at 4/10 for more than 2 minutes despite reducing intensity. NOT acceptable: new dizziness, visual disturbance or worsening nausea during the session. Teach the patient this distinction explicitly. Frame it as: \"Small, settling blips are data. Climbing, staying-up symptoms mean we've gone too far today.\""
      },
      {
        "kind": "insight",
        "type": "tip",
        "title": "Delivering and recording the sessions you do not supervise",
        "content": "Most SSTAE sessions happen independently between clinic appointments. A structured daily symptom log (before and after each session) is the minimum tracking requirement. The log should capture: pre-session symptom baseline, target and achieved HR, session duration, highest symptom level reached during the session, and post-session symptom level at 30 minutes and next morning. SST Trainer is the delivery route we recommend for that record: it gives the patient their prescribed heart-rate band live on their own phone during the session and returns the session record to the clinician, so the ≥2-point stop rule and each progression decision rest on recorded sessions rather than recall. The clinical protocol it delivers is published open-access (DOI 10.5281/zenodo.21482634). This data is the basis of your review-cycle decisions and your referral communications."
      }
    ],
    "progression-algorithm": [
      {
        "kind": "scenario",
        "title": "Two Reviews, Two Different Decisions",
        "patientSummary": "A patient has completed 2 weeks of daily SSTAE at a ceiling of 130 bpm, tolerating the full 20 minutes with no ≥2-point flares and no next-day exacerbation.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "It is review day. Applying the decision logic, what is the correct call?",
            "clinicalData": [
              "2 weeks of daily SSTAE at a ceiling of 130 bpm",
              "Full 20 minutes tolerated in every session",
              "No ≥2-point flares during sessions",
              "No next-day exacerbation"
            ],
            "choices": [
              {
                "label": "Raise the ceiling 5–10 bpm, or re-test with the BCTT for a fresh HRt and a new 80–90% band",
                "feedback": "Asymptomatic through the period AND tolerating full 20+ minutes: PROGRESS.",
                "nextStepId": "step-2"
              },
              {
                "label": "Keep the prescription identical for another month to consolidate the current adaptation",
                "feedback": "This patient has had no flares at all — the HOLD branch is for occasional 1-point blips that settle quickly.",
                "nextStepId": "outcome-hold"
              },
              {
                "label": "Double the session duration to 40 minutes and simultaneously raise the ceiling by 20 bpm",
                "feedback": "Two variables at once, and both well beyond the described increments.",
                "nextStepId": "outcome-both"
              },
              {
                "label": "Discharge the patient — 2 weeks of symptom-free sessions means the concussion has fully resolved",
                "feedback": "Sub-threshold sessions are not the recovery endpoint.",
                "nextStepId": "outcome-discharge"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You step the ceiling to 138 bpm. Three weeks later the patient reports headache worsening to 6/10 the morning after each session, despite sessions that felt well tolerated at the prescribed intensity — and a BCTT re-test shows no HRt improvement. What now?",
            "clinicalData": [
              "Ceiling stepped from 130 to 138 bpm at the last review",
              "Repeated next-morning headache exacerbation (6/10) after sessions",
              "Sessions themselves felt well tolerated at the prescribed intensity",
              "Re-test shows no HRt improvement across the period"
            ],
            "choices": [
              {
                "label": "REGRESS — drop the ceiling 5–10 bpm, reduce duration if needed, hold for 1–2 weeks and reassess",
                "feedback": "This is the branch the decision logic specifies for repeated next-day exacerbation.",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Continue the current prescription — next-day exacerbation indicates adaptation is occurring",
                "feedback": "Check that assumption against what the module says next-day exacerbation signals.",
                "nextStepId": "outcome-continue"
              },
              {
                "label": "Raise the ceiling further — flaring means the current dose is insufficient to drive the adaptive change needed",
                "feedback": "Consider the direction of the supply-demand mismatch before adding load.",
                "nextStepId": "outcome-increase"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Correct — Progress, Then Regress on the Evidence",
              "explanation": "At the first review: Asymptomatic through the period AND tolerating full 20+ minutes: PROGRESS — raise the ceiling 5–10 bpm or re-test BCTT. At the second: Repeated ≥2-point flares or next-day exacerbation across the review period: REGRESS — drop the ceiling 5–10 bpm, reduce duration if needed, hold for 1–2 weeks and reassess.",
              "clinicalReasoning": "Repeated next-day symptom exacerbation is the clearest signal that the prescribed intensity is too high for the current recovery stage. The HRt is not static — it can drift downward with cumulative session fatigue, sleep disruption, or increased non-exercise cognitive/physical load. Consider whether a non-physiological phenotype (cervical, vestibular, mood, sleep disruption) is now the rate-limiter, and flag to the referrer. If the picture becomes a plateau for >2 weeks with no progression despite good adherence: ESCALATE — a genuine physiological plateau warrants re-referral and multidisciplinary review. The rate-limiter may not be aerobic."
            }
          },
          {
            "id": "outcome-continue",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Not Correct — Next-Day Flares Are Not Adaptation",
              "explanation": "Next-day exacerbation is not a normal expected response; it is a clear signal that the dose was too high for that day.",
              "clinicalReasoning": "The correct response is regression (drop 5–10 bpm) and review — not continuation (which would compound the cumulative overload). Delayed exacerbation — symptoms worsening an hour after exercise or the following morning — is the key signal that the dose was too high even if the session felt tolerable."
            }
          },
          {
            "id": "outcome-increase",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Not Correct — Adding Load Worsens the Mismatch",
              "explanation": "The correct response is regression (drop 5–10 bpm) and review — not continuation (which would compound the cumulative overload) and certainly not intensity increase (which would worsen the situation).",
              "clinicalReasoning": "The prescribed HR ceiling was too high for the current recovery stage. Drop the ceiling by 5–10 bpm for subsequent sessions and hold there until sessions are consistently asymptomatic before attempting to progress."
            }
          },
          {
            "id": "outcome-hold",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Too Cautious — This Is the PROGRESS Branch",
              "explanation": "Asymptomatic through the period AND tolerating full 20+ minutes: PROGRESS — raise the ceiling 5–10 bpm or re-test BCTT. HOLD is the branch for a patient tolerating well but with occasional 1-point blips that settle quickly.",
              "clinicalReasoning": "The existing ceiling is no longer providing sufficient adaptive stimulus — it has become too easy. Stepping it up re-establishes the optimal 80–90%-of-HRt loading range on the now-recovered physiological system. Progress too slowly and the patient plateaus."
            }
          },
          {
            "id": "outcome-both",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Not Correct — One Variable at a Time",
              "explanation": "DO NOT simultaneously increase duration AND intensity — advance one variable at a time.",
              "clinicalReasoning": "Attempting to simultaneously extend duration and raise the HR cap increases the risk of threshold-crossing and symptom exacerbation. The described increment is also smaller than proposed here: Once 20 minutes is tolerated symptom-free for 1–2 weeks, raise the HR ceiling by 5–10 bpm."
            }
          },
          {
            "id": "outcome-discharge",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Not Correct — Sub-Threshold Sessions Are Not the Endpoint",
              "explanation": "DO NOT discharge: symptom-free sessions at sub-threshold exercise are not the same as medical clearance or confirmed metabolic recovery. Continue until a near-maximal graded test is symptom-free and the referrer provides medical clearance.",
              "clinicalReasoning": "The aerobic recovery endpoint is the ability to exercise to approximately 85–90% of age-predicted maximum heart rate (or to volitional exhaustion on a graded test) WITHOUT symptom provocation — i.e., a normal, essentially symptom-free maximal exertion test on BCTT. It is NOT the same as medical clearance for return to contact sport — that decision rests with the diagnosing medical clinician."
            }
          }
        ]
      }
    ],
    "intervals-cross-training": [
      {
        "kind": "ordering",
        "title": "The Modality Progression Ladder",
        "instruction": "Order these modalities as the module sequences them, from the fewest added demands to the most.",
        "items": [
          {
            "id": "recumbent",
            "label": "Recumbent bike",
            "rationale": "Pure cardiovascular, no balance/head motion — it eliminates balance demand and head motion and is the safest option for orthostatic presentations."
          },
          {
            "id": "upright",
            "label": "Upright stationary bike"
          },
          {
            "id": "treadmill",
            "label": "Treadmill walking",
            "rationale": "Gives the cleanest carry-over from the BCTT and is weight-bearing, but adds visual flow and some head motion."
          },
          {
            "id": "outdoor",
            "label": "Outdoor walking",
            "rationale": "Adds environmental visual load and uneven terrain, which are useful graded challenges toward real-world tolerance."
          },
          {
            "id": "incline",
            "label": "Treadmill incline"
          },
          {
            "id": "jogging",
            "label": "Light jogging"
          }
        ],
        "correctOrder": [
          "recumbent",
          "upright",
          "treadmill",
          "outdoor",
          "incline",
          "jogging"
        ],
        "explanation": "The modality progression ladder: recumbent bike (pure cardiovascular, no balance/head motion) → upright stationary bike → treadmill walking → outdoor walking → treadmill incline → outdoor walking on varied terrain → light jogging. Each step adds a specific demand; each is governed by the symptom monitoring rule. The sequencing discipline is the same one that governs intensity: Add one modality challenge at a time, the same way you step the HR ceiling one increment at a time."
      }
    ],
    "deconditioned-anxious": [
      {
        "kind": "quick-check",
        "question": "A fear-avoidant patient tells you every previous attempt at exercise made them worse. How does the module frame the hard HR cap when you introduce SSTAE to this patient?",
        "options": [
          "As a safety limit only — its value is preventing harm, and it is best de-emphasised so the patient is not frightened by it.",
          "As therapeutic, not just safety — knowing there is a ceiling gives an anxious patient permission to exercise, and the cap creates safety structure.",
          "As unnecessary for anxious patients — an open-ended effort instruction avoids making them fixate on numbers.",
          "As a reason to describe the program simply as light walks, avoiding mechanism explanations that might worry the patient."
        ],
        "correctAnswer": 1,
        "explanation": "The hard HR cap is therapeutic, not just safety. Knowing there is a ceiling gives an anxious patient permission to exercise. \"Your whole job in this session is to stay under 133 and stop if your symptoms climb 2 points — that is the complete task\" is far more tractable than an open-ended effort instruction. The cap creates safety structure. Alongside it: Frame symptoms as information, not danger. A settling 1-point blip is data about the dose — it means the system is being loaded, not harmed."
      }
    ],
    "red-flags-regress-refer": [
      {
        "kind": "matching",
        "title": "Regress, Pause, or Refer Urgently",
        "instruction": "Match each presentation during a course of SSTAE to the response the module specifies.",
        "pairs": [
          {
            "id": "delayed",
            "left": "Delayed or next-morning symptom exacerbation appears after sessions",
            "right": "Reduce the dose — drop the HR ceiling 5–10 bpm for subsequent sessions",
            "explanation": "This is a regression decision inside the existing prescription, not an escalation."
          },
          {
            "id": "plateau",
            "left": "A clear plateau of >2 weeks with no HRt progression despite consistent adherence",
            "right": "Pause the program and seek review — the rate-limiter may not be aerobic physiology",
            "explanation": "A non-physiological phenotype (cervicogenic, vestibular, mood, sleep disruption) may have become dominant and requires targeted assessment."
          },
          {
            "id": "reinjury",
            "left": "The patient reports a new mechanism of injury or re-injury",
            "right": "Medical re-evaluation before SSTAE continues",
            "explanation": "Any new head impact during the rehabilitation course requires medical re-evaluation before SSTAE continues."
          },
          {
            "id": "focal",
            "left": "Focal neurological signs (limb weakness, facial droop, slurred speech, visual loss), seizure, or any deterioration in conscious state",
            "right": "Cease all exercise and seek immediate medical assessment",
            "explanation": "These sit in the urgent red-flag group suggesting more than uncomplicated concussion."
          },
          {
            "id": "cardiac",
            "left": "Chest pain, exertional syncope, or a grossly abnormal or arrhythmic heart-rate response",
            "right": "Stop and seek medical evaluation — do not assume these are concussion-related",
            "explanation": "Stop and seek medical evaluation. Do not assume these are concussion-related."
          }
        ],
        "leftLabel": "Presentation",
        "rightLabel": "Response"
      }
    ]
  },
  "205": {
    "phenotype-myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1 claims: \"Vestibular exercises will fix any post-concussion dizziness — it does not matter whether the cause is central or peripheral.\" Why is this wrong?",
        "options": [
          "It is not wrong — habituation drives adaptation whatever the origin of the dizziness.",
          "Brief, intense, positionally-triggered spinning vertigo is BPPV — displaced otoconia, which habituation does not fix and may aggravate. It needs Dix-Hallpike and canalith repositioning before vestibular exercise continues.",
          "It is wrong only because the AEP should perform the Dix-Hallpike test and the Epley manoeuvre themselves before starting habituation.",
          "It is wrong because spontaneous vertigo with new hearing loss or tinnitus calls for a heavier habituation dose rather than medical review."
        ],
        "correctAnswer": 1,
        "explanation": "The cause determines whether exercise is the right tool at all. Brief (5–10 second), intense, positionally-triggered spinning vertigo provoked by rolling in bed or looking up → BPPV → refer for Dix-Hallpike and canalith repositioning BEFORE continuing habituation exercises. Habituation does not fix displaced otoconia and may aggravate symptoms. The assessment and the manoeuvre are also not yours to perform. Outside scope: Dix-Hallpike assessment, canalith repositioning (Epley manoeuvre), and differential diagnosis of peripheral versus central vestibular pathology. Those belong with vestibular physiotherapy and medicine."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2 claims: \"Convergence exercises can replace an optometry referral for persistent diplopia after concussion.\" Why is this wrong?",
        "options": [
          "It is not wrong — once the near-point of convergence reaches ≤5 cm the referral becomes redundant.",
          "Persistent diplopia is a listed referral trigger, and the exercises complement, not replace, optometric management.",
          "It is wrong, but the correct first step is for the AEP to prescribe prism or tinted lenses and refer only if those fail.",
          "It is wrong because the AEP must discontinue the exercise program as soon as optometry becomes involved."
        ],
        "correctAnswer": 1,
        "explanation": "Persistent diplopia (double vision at any distance) is one of the named referral triggers for this phenotype, alongside manifest tropia (visible eye misalignment at rest, not just on near convergence) → neuro-optometry. The two roles run side by side, they do not substitute for each other: a behavioural optometrist diagnoses the oculomotor deficit and may prescribe prism or tinted lenses; you deliver the exercise program that builds endurance alongside that. The exercises complement, not replace, optometric management. Prescribing prism or lenses is outside AEP scope."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3 claims: \"Deep neck flexor training is a physiotherapy technique — it falls outside AEP scope in concussion rehabilitation.\" Why is this wrong?",
        "options": [
          "It is accurate — all cervical rehabilitation after concussion belongs to physiotherapy.",
          "DNF activation, postural endurance, proprioceptive retraining and graded cervical strengthening are named AEP scope; what sits outside is thrust manipulation, end-range cervical mobilisation and pharmacological management.",
          "It is wrong, but only the laser joint-position-error work is in AEP scope — cranio-cervical flexion is not.",
          "It is wrong because high-velocity thrust manipulation is the AEP's tool for restoring deep neck flexor activation."
        ],
        "correctAnswer": 1,
        "explanation": "The scope line falls in a different place than the myth assumes. AEP scope: DNF activation, postural endurance, proprioceptive retraining, graded cervical strengthening. Outside AEP scope: high-velocity thrust manipulation, cervical mobilisation in positions of end-range rotation/extension, and injection or pharmacological management. Those belong with physiotherapy and medicine. The reason DNF work belongs in concussion rehabilitation at all is mechanistic: after whiplash injury, a protective inhibitory response mediated by nociceptive afferents from the C1-C3 facet capsules (via segmental interneurons) suppresses DNF motor neuron output."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4 claims: \"Mood and anxiety problems after concussion are purely psychological and should be referred to psychology without any exercise component.\" Why is this wrong?",
        "options": [
          "It is accurate — the affective phenotype has no neurobiological mechanism after concussion.",
          "Post-concussion anxiety, depression and emotional lability have clear neurobiological underpinnings, and aerobic exercise has established mood effects — so the AEP prescribes and progresses it while referring clinical presentations to psychology or psychiatry.",
          "It is wrong, and the AEP should therefore manage the affective phenotype entirely in-session, including cognitive behavioural therapy and formal psychological assessment.",
          "It is wrong only in that medication management and suicide risk assessment sit outside AEP scope; exercise itself has no mood effect."
        ],
        "correctAnswer": 1,
        "explanation": "Post-concussion anxiety, depression and emotional lability have clear neurobiological underpinnings — they are not simply psychological reactions to injury, though psychological factors amplify them (Hutchison et al., 2009). That gives the AEP a real role without blurring the referral line. AEP scope in the affective phenotype: prescribe and progress aerobic exercise (which has evidence-based mood effects); recognise the clinical presentation of anxiety, depression, emotional dysregulation, or any safeguarding concern; and refer to psychology or psychiatry accordingly. Outside AEP scope: cognitive behavioural therapy, medication management, formal psychological assessment, suicide risk assessment."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 5 claims: \"When multiple phenotypes are present simultaneously, you should treat them all at full dose from session one.\" Why is this wrong?",
        "options": [
          "It is correct, provided a symptom diary is kept so that flares can still be attributed to the right exercise.",
          "Confounded symptom responses make it impossible to attribute flares to a specific exercise type, and the total load of multiple simultaneous provocations can exceed tolerance — so treat the dominant driver first, then layer.",
          "It is wrong because two or more co-presenting phenotypes exceed AEP scope and require referral back to the GP before any exercise begins.",
          "It is wrong because the phenotype with the most precisely measurable outcome should always be treated first, with all others deferred until it normalises."
        ],
        "correctAnswer": 1,
        "explanation": "The evidence does not support treating all phenotypes simultaneously at full dose from session one — both because confounded symptom responses make it impossible to attribute flares to a specific exercise type, and because the total symptom load of multiple simultaneous provocations can exceed the patient's tolerance and set back confidence in the program. The alternative is a sequence, not a smaller version of the same mistake. The clinical rule: IDENTIFY THE DOMINANT DRIVER — the phenotype that is most functionally limiting and has the clearest EP-appropriate intervention. Start treatment of the dominant phenotype first at Phase 1 dose."
      }
    ],
    "phenotype-framework": [
      {
        "kind": "matching",
        "title": "Phenotype → Mechanism",
        "instruction": "Match each of the seven concussion phenotypes to the mechanism named for it in this section.",
        "pairs": [
          {
            "id": "vestibular",
            "left": "VESTIBULAR",
            "right": "disrupted VOR, impaired central vestibular processing, loss of sensory integration",
            "explanation": "Primary EP tool: VOR gaze-stabilisation, habituation, dynamic balance progression."
          },
          {
            "id": "oculomotor",
            "left": "OCULOMOTOR",
            "right": "disruption of frontal eye fields, medial longitudinal fasciculus, and vergence centres",
            "explanation": "Primary EP tool: convergence, saccade, smooth-pursuit and accommodative facility exercises."
          },
          {
            "id": "cervicogenic",
            "left": "CERVICOGENIC",
            "right": "concurrent whiplash injury, cervico-ocular reflex disruption, deep neck flexor inhibition",
            "explanation": "Primary EP tool: DNF activation, joint-position-error retraining, postural endurance work."
          },
          {
            "id": "autonomic",
            "left": "AUTONOMIC/PHYSIOLOGIC",
            "right": "sympathovagal imbalance, reduced baroreflex sensitivity, blunted cerebrovascular CO₂ reactivity",
            "explanation": "Primary EP tool: SSTAE — sub-symptom-threshold aerobic exercise prescribed at 80% of the symptom-limited heart-rate threshold."
          },
          {
            "id": "cognitive",
            "left": "COGNITIVE/FATIGUE",
            "right": "default-mode-network disruption, metabolic depression reducing cerebral glucose utilisation, white-matter conduction slowing",
            "explanation": "Primary EP tool: graded cognitive load integration with aerobic exercise; BDNF stimulation via aerobic exercise supports neuroplasticity."
          },
          {
            "id": "affective",
            "left": "AFFECTIVE",
            "right": "amygdala hyperreactivity, serotonergic/dopaminergic disruption, HPA axis activation",
            "explanation": "Primary EP tool: aerobic exercise as evidence-based mood intervention; psychology referral for clinical presentations."
          },
          {
            "id": "headache",
            "left": "HEADACHE/MIGRAINE",
            "right": "trigeminovascular activation, trigeminocervical sensitisation, central sensitisation",
            "explanation": "Primary EP tool: properly dosed SSTAE (reduces headache frequency over weeks); medical referral for prophylaxis."
          }
        ],
        "leftLabel": "Phenotype",
        "rightLabel": "Mechanism"
      }
    ],
    "vestibular-phenotype": [
      {
        "kind": "ordering",
        "title": "How VOR×1 Recalibrates Gain",
        "instruction": "Place the steps of the cerebellar learning cascade in the order the section describes.",
        "items": [
          {
            "id": "slip",
            "label": "A retinal slip error signal is generated",
            "rationale": "During VOR×1 (patient moves head while eyes stay fixed on a stationary target), the brief moments when the target blurs or drifts generate a RETINAL SLIP ERROR SIGNAL."
          },
          {
            "id": "io",
            "label": "Retinal ganglion cells transmit the signal to the inferior olive",
            "rationale": "This error signal is detected by retinal ganglion cells and transmitted to the inferior olive (IO) in the brainstem."
          },
          {
            "id": "climb",
            "label": "Climbing fibres reach Purkinje cells in the flocculus and nodulus",
            "rationale": "The inferior olive sends climbing fibre signals to PURKINJE CELLS in the cerebellar flocculus and nodulus."
          },
          {
            "id": "ltd",
            "label": "Long-term depression of the parallel fibre→Purkinje cell synapses active at the time of the slip",
            "rationale": "These climbing fibre inputs drive LONG-TERM DEPRESSION (LTD) of the parallel fibre→Purkinje cell synapses that were active at the time of the slip — specifically the synapses responsible for the VOR gain error."
          },
          {
            "id": "recal",
            "label": "Purkinje inhibition of floccular-target neurons falls and VOR gain recalibrates toward 1.0",
            "rationale": "Over repeated sessions, LTD progressively reduces Purkinje cell inhibition of the floccular-target neurons in the vestibular nuclei — recalibrating VOR gain toward 1.0 and reducing retinal slip."
          }
        ],
        "correctOrder": [
          "slip",
          "io",
          "climb",
          "ltd",
          "recal"
        ],
        "explanation": "VOR gaze-stabilisation exercises exploit a well-established cerebellar learning mechanism to recalibrate gain. During VOR×1 (patient moves head while eyes stay fixed on a stationary target), the brief moments when the target blurs or drifts generate a RETINAL SLIP ERROR SIGNAL. This error signal is detected by retinal ganglion cells and transmitted to the inferior olive (IO) in the brainstem. The inferior olive sends climbing fibre signals to PURKINJE CELLS in the cerebellar flocculus and nodulus. These climbing fibre inputs drive LONG-TERM DEPRESSION (LTD) of the parallel fibre→Purkinje cell synapses that were active at the time of the slip — specifically the synapses responsible for the VOR gain error. Over repeated sessions, LTD progressively reduces Purkinje cell inhibition of the floccular-target neurons in the vestibular nuclei — recalibrating VOR gain toward 1.0 and reducing retinal slip. This is genuine NEUROPLASTICITY: a synaptically-encoded recalibration that persists between sessions and accumulates over weeks."
      },
      {
        "kind": "quick-check",
        "question": "A patient doing VOR×1 reports their dizziness rises by one point during the drill and is back to baseline about five minutes after finishing. What does this section say about that response?",
        "options": [
          "Stop the drill — any within-session symptom rise means the dose is unsafe.",
          "It is expected and appropriate: a transient 0–1 point rise (0–10 scale) that settles within 10 minutes.",
          "It shows the head is moving too slowly; the target should be kept continuously blurred to enlarge the error signal.",
          "It is a referral trigger for vestibular physiotherapy re-assessment."
        ],
        "correctAnswer": 1,
        "explanation": "Symptom rule: a transient 0–1 point rise in dizziness (0–10 scale) that settles within 10 minutes is expected and appropriate. A sustained 2-or-more-point rise that does not settle → slow the head speed, shorten the bout, or regress the progression level. The reason a mild disturbance is wanted rather than tolerated is mechanistic: an exercise that produces no error (head moving too slowly, easy background) provides no adaptation stimulus. An exercise that produces a large sustained error (too fast, too early) floods the system without driving useful learning. The therapeutic window is a mild, transient image disturbance — the same principle as symptom-titrated dosing."
      }
    ],
    "oculomotor-phenotype": [
      {
        "kind": "quick-check",
        "question": "A patient's near-point of convergence measures 9 cm at baseline. How should the AEP interpret and use that number?",
        "options": [
          "NPC above 6 cm is within normal limits, so no oculomotor exercise is indicated.",
          "Normal NPC is ≤5 cm and NPC >6 cm indicates convergence insufficiency; the NPC test is the primary EP outcome measure for this phenotype.",
          "The AEP uses the NPC test to diagnose convergence insufficiency and then prescribes prism as the first-line intervention.",
          "Measuring NPC is a diagnostic act and therefore outside AEP scope."
        ],
        "correctAnswer": 1,
        "explanation": "NEAR-POINT OF CONVERGENCE (NPC): the closest point at which the patient can maintain binocular fusion. Normal NPC ≤5 cm. NPC >6 cm indicates convergence insufficiency (Storey et al., 2017). The NPC test is the primary EP outcome measure for this phenotype. It is what the exercise program is tracked against: Goal: improve NPC from >6 cm toward ≤5 cm over 4–6 weeks. The diagnostic and optical decisions stay elsewhere — a behavioural optometrist diagnoses the oculomotor deficit and may prescribe prism or tinted lenses; you deliver the exercise program that builds endurance alongside that."
      },
      {
        "kind": "matching",
        "title": "Oculomotor Drill → What It Trains",
        "instruction": "Match each EP oculomotor drill to what this section says it trains or reveals.",
        "pairs": [
          {
            "id": "pencil",
            "left": "Pencil push-ups (near-point training)",
            "right": "Convergence — improving NPC from >6 cm toward ≤5 cm over 4–6 weeks",
            "explanation": "Stop the instant it doubles or one eye drifts out, then retreat until single again. Dose: 15 repetitions, 2 times per day."
          },
          {
            "id": "brock",
            "left": "Brock string",
            "right": "Binocular alignment on the target bead — an absent or asymmetric X means one eye is suppressing",
            "explanation": "The patient fixates each bead in sequence (near → mid → far). Dose: 5 minutes, 1–2 times per day."
          },
          {
            "id": "twotarget",
            "left": "Two-target saccades",
            "right": "Accurate eye jumps between two letters 25–30 cm apart at eye level, head still",
            "explanation": "Progress by increasing separation, speed, and adding vertical/diagonal pairs."
          },
          {
            "id": "pursuit",
            "left": "Smooth pursuit",
            "right": "Continuous tracking through horizontal, vertical, circular and figure-8 paths, head still",
            "explanation": "Dose: 30–60 seconds per pattern, building speed and complexity over weeks."
          },
          {
            "id": "hart",
            "left": "Accommodative facility (Hart chart)",
            "right": "Focusing speed and endurance — the blur-on-switching that fatigues screen users",
            "explanation": "Alternate focus rapidly between a near letter and a distant letter, holding clear focus at each. Dose: 1–2 minutes, 1–2 times per day."
          }
        ],
        "leftLabel": "Drill",
        "rightLabel": "Target"
      }
    ],
    "cervicogenic-phenotype": [
      {
        "kind": "quick-check",
        "question": "During cranio-cervical flexion with pressure biofeedback you can see and palpate the sternocleidomastoid firing as the patient holds the target pressure. What does the section call this, and what follows from it?",
        "options": [
          "The intended pattern — visible SCM activity confirms deep neck flexor recruitment.",
          "The classic substitution error — the nod must be held without firing the visible/palpable SCM, so work at the highest level achievable without SCM substitution.",
          "A vertebrobasilar red flag requiring immediate medical referral.",
          "Evidence that high-velocity thrust manipulation is needed before the exercise can proceed."
        ],
        "correctAnswer": 1,
        "explanation": "CRANIO-CERVICAL FLEXION (CCF) EXERCISE: patient supine, head neutral. Perform a gentle nodding movement without lifting the head and without firing the visible/palpable SCM — the classic substitution error. The pressure target is chosen against that constraint: the patient performs the nod to hit and hold a target pressure: progressively from 22 → 24 → 26 → 28 → 30 mmHg. Hold each target for ~10 seconds × 10 repetitions, aiming for the highest level achievable without SCM substitution. The substitution is the problem the exercise exists to undo: superficial neck flexors (sternocleidomastoid, anterior scalene) compensate, but generate different force vectors and further alter cervical proprioception."
      },
      {
        "kind": "multi-select",
        "question": "Which of these findings require you to STOP ALL CERVICAL LOADING and refer for medical assessment? (Select all that apply)",
        "options": [
          "Midline cervical tenderness (possible fracture)",
          "Neurological signs in the arms (radiculopathy, myelopathy)",
          "Joint-position error >4.5° return error on laser relocation testing",
          "Vertebrobasilar features — drop attacks, diplopia, dysarthria, dysphagia, ataxia, nystagmus",
          "Reduced deep neck flexor endurance and activation latency on the cranio-cervical flexion test",
          "Superficial neck flexors compensating during cranio-cervical flexion"
        ],
        "correctAnswers": [
          0,
          1,
          3
        ],
        "explanation": "STOP ALL CERVICAL LOADING and refer for medical assessment if any of: midline cervical tenderness (possible fracture), neurological signs in the arms (radiculopathy, myelopathy), or vertebrobasilar features — drop attacks, diplopia, dysarthria, dysphagia, ataxia, nystagmus. These are emergency referrals, not a reason to modify dosing. The other findings are the phenotype itself — the things the EP program targets. JOINT-POSITION ERROR (JPE) >4.5° return error (head unable to accurately relocate neutral after active rotation) is abnormal and correlates with both dizziness and balance impairment in cervicogenic presentations (Treleaven, 2008), and DNF endurance and activation latency are reduced (detectable clinically with the pressure biofeedback test of cranio-cervical flexion)."
      }
    ],
    "autonomic-phenotype": [
      {
        "kind": "quick-check",
        "question": "A patient completes the Buffalo Concussion Treadmill Test with no symptoms at all, so no HRt was identified. What starting intensity does this section specify?",
        "options": [
          "80% of HRt, estimated from the highest heart rate reached during the test",
          "60–70% of age-predicted maximum heart rate (220 − age), titrated upward",
          "Moderate-intensity intervals at 75–85% HRmax",
          "No aerobic prescription until a symptom-limited threshold can be identified"
        ],
        "correctAnswer": 1,
        "explanation": "The Buffalo Concussion Treadmill Test (BCTT) or Buffalo Concussion Bike Test (BCBT) determines the individual HRt — the heart rate at which symptoms reliably appear during graded exertion (Leddy et al., 2019). Prescription intensity is set at 80% of HRt for the first sessions. If no HRt was identified (test was fully symptom-free), start at 60–70% of age-predicted maximum heart rate (220 − age) and titrate upward. Note where the other figure belongs: moderate-intensity intervals (brief periods at 75–85% HRmax, increasing duration) are a Phase 3 inclusion, not a starting dose."
      },
      {
        "kind": "flowchart",
        "title": "SSTAE: Threshold to Discharge-Level Fitness",
        "steps": [
          {
            "label": "Determine the threshold",
            "description": "The BCTT or BCBT determines the individual HRt — the heart rate at which symptoms reliably appear during graded exertion. Prescription intensity is set at 80% of HRt for the first sessions."
          },
          {
            "label": "Phase 1 — tolerance establishment",
            "description": "20–30 min at 80% HRt (or 60–70% HRmax if no HRt), daily if tolerated. The within-session symptom score should rise no more than 2–3 points from baseline, and return to baseline within 30 minutes post-session."
          },
          {
            "label": "Phase 2 — building duration and intensity",
            "description": "Once the patient completes 4–5 consecutive Phase 1 sessions without symptom escalation, extend duration to 35–40 min; increase target HR by 5 bpm. Repeat the increment every 4–5 sessions as tolerated."
          },
          {
            "label": "Phase 3 — aerobic fitness restoration",
            "description": "Progressive overload toward population-appropriate aerobic fitness norms. Introduce moderate-intensity intervals and functional sport/work-specific exertional demands. Managed alongside the return-to-activity stages under medical oversight."
          },
          {
            "label": "Retest the threshold",
            "description": "The HRt RISES progressively as the underlying physiology recovers — this is the measurable sign of improvement. Retest every 2–3 weeks."
          }
        ]
      }
    ],
    "cognitive-fatigue-phenotype": [
      {
        "kind": "quick-check",
        "question": "A patient with the cognitive/fatigue phenotype asks when to fit their aerobic session in. What does this section advise about exercise timing relative to sleep?",
        "options": [
          "Vigorous aerobic exercise late in the evening deepens slow-wave sleep and should be encouraged.",
          "Avoid vigorous aerobic exercise within 3 hours of sleep; light stretching or low-intensity walking is acceptable in the evening.",
          "Timing is irrelevant — only the total daily aerobic dose affects sleep architecture.",
          "Withhold all exercise until sleep architecture has normalised."
        ],
        "correctAnswer": 1,
        "explanation": "EXERCISE TIMING: advise patients to avoid vigorous aerobic exercise within 3 hours of sleep — sympathetic activation and elevated core temperature from exercise will worsen sleep onset and sleep architecture. Light stretching or low-intensity walking is acceptable in the evening. Sleep is not a side issue in this phenotype: SWS is the primary period of memory consolidation and glymphatic waste clearance, and this creates a reciprocal cycle: poor sleep worsens cognitive symptoms, which worsen anxiety and hyperarousal, which worsen sleep."
      }
    ],
    "affective-headache-phenotypes": [
      {
        "kind": "quick-check",
        "question": "Mid-session, a patient with the affective phenotype says something suggesting suicidal ideation. What does the scope callout require?",
        "options": [
          "Finish the planned session, then note it in the next report to the referring clinician.",
          "Stop the session and escalate urgently to the referring clinician or present to emergency services — do not attempt to manage this within the exercise session.",
          "Carry out a suicide risk assessment yourself before deciding whether a referral is warranted.",
          "Continue with the aerobic session, since aerobic exercise has evidence-based mood effects, and review it next appointment."
        ],
        "correctAnswer": 1,
        "explanation": "Any suggestion of self-harm or suicidal ideation → stop the session, escalate urgently to the referring clinician or present to emergency services. Do not attempt to manage this within the exercise session. The boundary is explicit about the assessment itself, too. Outside AEP scope: cognitive behavioural therapy, medication management, formal psychological assessment, suicide risk assessment."
      },
      {
        "kind": "multi-select",
        "question": "In the headache/migraine phenotype, which of these sit INSIDE AEP scope as this section describes it? (Select all that apply)",
        "options": [
          "SSTAE titration",
          "Lifestyle education on modifiable triggers — hydration, meal timing, sleep consistency, caffeine and alcohol reduction",
          "Cervicogenic exercise for the cervical component",
          "Migraine prophylaxis medication (amitriptyline, beta-blockers, topiramate, CGRP antagonists)",
          "Exercising the patient through an active severe headache or migraine phase"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "AEP scope in the headache phenotype: SSTAE titration, lifestyle education on modifiable triggers, and cervicogenic exercise for the cervical component. Outside AEP scope: migraine prophylaxis medication (amitriptyline, beta-blockers, topiramate, CGRP antagonists) — refer to GP or neurologist. The lifestyle advice has a defined edge: advise on modifiable headache triggers within EP scope: hydration, meal timing, sleep consistency, caffeine and alcohol reduction. These are lifestyle factors, not medical advice. And the timing rule is absolute: during an active severe headache or migraine phase: do not exercise. Wait for it to subside, return to the SSTAE program at the previous tolerated level."
      }
    ],
    "overlapping-phenotypes": [
      {
        "kind": "matching",
        "title": "Common Phenotype Combinations → Strategy",
        "instruction": "Match each common combination to the strategy this section gives for it.",
        "pairs": [
          {
            "id": "vest-cerv",
            "left": "Vestibular + cervicogenic (most common combination)",
            "right": "Begin low-volume DNF activation and JPE retraining concurrently with VOR×1 in Phase 1",
            "explanation": "The cervical work directly supports the vestibular work by improving COR signal quality."
          },
          {
            "id": "ocul-cog",
            "left": "Oculomotor + cognitive/fatigue (work-limiting combination)",
            "right": "Short, structured oculomotor exercise bouts early in the session, integrated with aerobic SSTAE",
            "explanation": "Early in the session before cognitive fatigue accumulates; integrate with aerobic SSTAE to drive BDNF-mediated recovery of both systems."
          },
          {
            "id": "auto-affect",
            "left": "Autonomic + affective (exercise-avoidance pattern)",
            "right": "The SSTAE program is the treatment for both — explain the threshold as measurable and improvable before commencing",
            "explanation": "Clearly explain to the patient that the symptom-limited threshold is a measurable, improvable physiological parameter, not a sign of permanent damage, to reduce catastrophisation before commencing."
          },
          {
            "id": "cerv-head",
            "left": "Cervicogenic + headache (cervicotrigeminal)",
            "right": "Treat the cervicogenic component aggressively (within scope) before concluding that headache needs escalation to medical management",
            "explanation": "The cervicogenic contribution to post-traumatic headache through the trigeminocervical complex means that cervical rehabilitation is one of the most effective headache interventions available to the AEP."
          }
        ],
        "leftLabel": "Combination",
        "rightLabel": "Strategy"
      }
    ],
    "dosing-progression-case": [
      {
        "kind": "quick-check",
        "question": "A patient completes their current drill level with no symptom rise at all and no flares, session after session. What do the three universal rules indicate?",
        "options": [
          "Zero symptom response is always the target — hold the level unchanged.",
          "Dose to tolerance means finding the level at which the patient experiences only a mild, transient symptom rise (0–2 points on a 0–10 scale) that settles within 10–15 minutes; below that is under-stimulation and stalled recovery.",
          "Advance every progression variable at once to reach a symptomatic level quickly.",
          "A flare arriving hours later can be discounted, provided each individual drill was tolerated at the time."
        ],
        "correctAnswer": 1,
        "explanation": "RULE 1 — DOSE TO TOLERANCE: find the level (posture, surface, speed, duration, HR intensity, target distance) at which the patient experiences only a mild, transient symptom rise (0–2 points on a 0–10 scale) that settles within 10–15 minutes. Below this: under-stimulation and stalled recovery. Above this: flooding, confidence erosion and potential setback. How you advance is equally constrained: change a single variable per progression — speed, surface, posture, background, HR target, duration, target distance — so any symptom response can be attributed to that change. And when it goes the other way: when a session causes sustained escalation: REGRESS the dose, not the diagnosis."
      },
      {
        "kind": "scenario",
        "title": "Integrated Case: Three-Phenotype Presentation",
        "patientSummary": "A 32-year-old primary school teacher, 8 weeks post-concussion (bicycle fall). Referred by sports physician with a vestibular-dominant + oculomotor + cervicogenic presentation. Red flags and BPPV excluded by the referrer. Current symptoms: constant low-grade dizziness, worsening with head turns and busy environments; unable to read student work for more than 15 minutes without headache and visual fatigue; base-of-skull headache rated 3–5/10, worse by early afternoon. Cleared for light activity. No autonomic phenotype identified on BCTT (symptom-free test — starting aerobic prescription at 60% HRmax).",
        "steps": [
          {
            "id": "step-1",
            "narrative": "Three phenotypes are in play. How do you open the program?",
            "clinicalData": [
              "Referred with a vestibular-dominant + oculomotor + cervicogenic presentation",
              "Red flags and BPPV excluded by the referrer",
              "Constant low-grade dizziness, worsening with head turns and busy environments",
              "Base-of-skull headache rated 3–5/10, worse by early afternoon",
              "BCTT symptom-free — no HRt identified"
            ],
            "choices": [
              {
                "label": "Start all three programs at full Phase 1 dose in week 1 to compress total rehabilitation time",
                "feedback": "This is the pattern the module warns against.",
                "nextStepId": "outcome-all-three"
              },
              {
                "label": "Vestibular as the dominant driver, with low-volume cervical work alongside; hold oculomotor at low dose",
                "feedback": "This matches the dominant-driver rule.",
                "nextStepId": "step-2"
              },
              {
                "label": "Oculomotor first, because NPC is the most precisely measurable outcome variable",
                "feedback": "Measurability is not the selection criterion.",
                "nextStepId": "outcome-oculo-first"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "Weeks 1–2 ran as documented and the patient reports a mild within-session symptom rise that settles, with no next-morning flares. What is the week 3–4 step?",
            "clinicalData": [
              "VOR×1 seated, plain background, 30 s × 3 twice daily",
              "DNF CCF biofeedback to 24 mmHg, 10 s × 10 once daily",
              "Baseline convergence measured: NPC 9 cm; pencil push-ups 10 reps once daily",
              "SSTAE: 20 min cycling at 60% HRmax; two habituation movements at 3/10",
              "Symptom diary commenced"
            ],
            "choices": [
              {
                "label": "Advance VOR×1 to standing feet-together on firm surface, DNF target to 26 mmHg, add prone Y-T-W and the oculomotor drills, SSTAE to 25 min at 65% HRmax",
                "feedback": "This is the documented week 3–4 progression.",
                "nextStepId": "step-3"
              },
              {
                "label": "Hold every exercise unchanged for a further four weeks before any progression",
                "feedback": "Consider what Rule 1 says about staying below tolerance.",
                "nextStepId": "outcome-hold"
              },
              {
                "label": "Move straight to VOR×2 standing on foam with a busy background",
                "feedback": "Check the stated criteria for introducing VOR×2.",
                "nextStepId": "outcome-jump"
              }
            ]
          },
          {
            "id": "step-3",
            "narrative": "By weeks 5–8 the oculomotor picture has resolved. Which referral was NOT triggered here, and what would have triggered it?",
            "clinicalData": [
              "VOR×1 on foam, patterned background; VOR×2 introduced seated",
              "DNF 30 mmHg endurance; laser JPE retraining showing consistent error < 3.5°",
              "NPC normalised to 5 cm",
              "SSTAE 30 min at 70% HRmax; dual-task balance introduced",
              "Headache frequency: 2/week (down from daily)"
            ],
            "choices": [
              {
                "label": "No optometry referral was needed; NPC stalled at >6 cm with diplopia after 6 weeks would have prompted a neuro-optometry referral while exercises continued alongside",
                "feedback": "Correct — the trigger is defined, and exercise does not stop when it fires.",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Any NPC above 5 cm at week 4 should have triggered referral, and the oculomotor exercises should have stopped at that point",
                "feedback": "Both the timing and the stop-exercise assumption are wrong.",
                "nextStepId": "outcome-early-referral"
              },
              {
                "label": "Once an exercise program has begun, an optometry referral is no longer indicated",
                "feedback": "The referral triggers stay live throughout the program.",
                "nextStepId": "outcome-never-refer"
              }
            ]
          },
          {
            "id": "outcome-all-three",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Full dose on all three is the named error",
              "explanation": "The evidence does not support treating all phenotypes simultaneously at full dose from session one — both because confounded symptom responses make it impossible to attribute flares to a specific exercise type, and because the total symptom load of multiple simultaneous provocations can exceed the patient's tolerance and set back confidence in the program.",
              "clinicalReasoning": "In this case the documented plan names one driver: DOMINANT DRIVER: vestibular (most functionally limiting; COR contribution from cervicogenic component is clinically apparent). Start treatment of the dominant phenotype first at Phase 1 dose. Once the patient demonstrates tolerance (no sustained or next-morning flares over 3–4 sessions), introduce Phase 1 exercises for the secondary phenotype at minimal dose, monitoring for interactions."
            }
          },
          {
            "id": "outcome-oculo-first",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The driver is chosen on function, not on measurability",
              "explanation": "The clinical rule: IDENTIFY THE DOMINANT DRIVER — the phenotype that is most functionally limiting and has the clearest EP-appropriate intervention. Start treatment of the dominant phenotype first at Phase 1 dose.",
              "clinicalReasoning": "DOMINANT DRIVER: vestibular (most functionally limiting; COR contribution from cervicogenic component is clinically apparent). The cervical work is not deferred either, because of the mechanism linking the two: begin low-volume DNF activation and JPE retraining concurrently with VOR×1 in Phase 1 — the cervical work directly supports the vestibular work by improving COR signal quality."
            }
          },
          {
            "id": "outcome-hold",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Holding below tolerance stalls the recovery",
              "explanation": "RULE 1 — DOSE TO TOLERANCE: find the level (posture, surface, speed, duration, HR intensity, target distance) at which the patient experiences only a mild, transient symptom rise (0–2 points on a 0–10 scale) that settles within 10–15 minutes. Below this: under-stimulation and stalled recovery.",
              "clinicalReasoning": "The advancement criterion had already been met: RULE 3 — PROGRESS ONE VARIABLE AT A TIME: advance only when the patient has completed the current level without flare for several consecutive sessions."
            }
          },
          {
            "id": "outcome-jump",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "VOR×2 on foam skips the stated entry criteria",
              "explanation": "Introduce only once VOR×1 is tolerated standing on foam with a busy background and no sustained symptom rise. Begin seated, slow speed, 30 seconds × 3 sets, twice daily.",
              "clinicalReasoning": "It also breaks the progression rule: change a single variable per progression — speed, surface, posture, background, HR target, duration, target distance — so any symptom response can be attributed to that change. In the documented case, VOR×2 was introduced seated only at weeks 5–8, after VOR×1 had reached foam with a patterned background."
            }
          },
          {
            "id": "outcome-early-referral",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Too early, and exercise does not stop at referral",
              "explanation": "NPC not improving after 4–6 weeks of consistent, well-delivered exercise → behavioural / neuro-optometry for in-office orthoptic therapy and consideration of prism.",
              "clinicalReasoning": "Referral and exercise run together, not in sequence: the exercises complement, not replace, optometric management. In this case the trigger never fired — convergence normalised with exercise — no optometry referral needed."
            }
          },
          {
            "id": "outcome-never-refer",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The referral triggers stay live for the whole program",
              "explanation": "Persistent diplopia (double vision at any distance). Manifest tropia (visible eye misalignment at rest, not just on near convergence) → neuro-optometry. NPC not improving after 4–6 weeks of consistent, well-delivered exercise → behavioural / neuro-optometry for in-office orthoptic therapy and consideration of prism.",
              "clinicalReasoning": "Had NPC stalled at >6 cm with diplopia after 6 weeks, that would have prompted a neuro-optometry referral while exercises continued alongside."
            }
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Dominant driver first, layered second phenotype, referral on a defined trigger",
              "explanation": "REFERRAL TRIGGERED (and one that did not): convergence normalised with exercise — no optometry referral needed; had NPC stalled at >6 cm with diplopia after 6 weeks, that would have prompted a neuro-optometry referral while exercises continued alongside.",
              "clinicalReasoning": "OUTCOME WEEK 12: dizziness resolved at rest, tolerable during busy environments. Screen reading: 45-minute tolerance without headache. Cervical range full and pain-free. SSTAE progressed to 35 min at 75% HRmax. Referred back to sports physician for return-to-work medical confirmation. Discharged with maintenance home program."
            }
          }
        ]
      }
    ]
  },
  "206": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1 claims that once an athlete is symptom-free they are safe to return to contact training, and that the 21-day stand-down applies only if symptoms are still present. Why is this FALSE?",
        "options": [
          "It is not false — becoming symptom-free satisfies the guideline, and the calendar stand-down is only a fallback for athletes who remain symptomatic.",
          "Both minimums must be met: a MINIMUM 21-day stand-down from the time of the concussion before return to competitive contact or collision activity, AND at least 14 consecutive days symptom-free before returning to contact training. Both clocks run simultaneously, and the LATER of the two governs.",
          "Only the 14-day symptom-free minimum applies — the calendar stand-down was superseded by the 24-hour-per-stage international minimums.",
          "The stand-down is a no-ACTIVITY period, so a symptom-free athlete may resume all training, contact included."
        ],
        "correctAnswer": 1,
        "explanation": "Two non-negotiable minimums, and BOTH must be met: (1) a MINIMUM 21-day stand-down from the time of the concussion before return to competitive contact or collision activity; and (2) the athlete must be symptom-free for at least 14 consecutive days BEFORE returning to contact training. Both clocks run simultaneously, and the LATER of the two governs the earliest compliant return-to-contact date. Worked through: An athlete who is symptom-free from day 4 reaches their 14-day symptom-free threshold on day 18. But the calendar minimum is 21 days, so the earliest possible return to contact is day 21 — the calendar minimum falls later, and the later governs."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2 claims that if the athlete completes Stage 4 (non-contact training drills) without symptoms, the AEP can confirm they are cleared for contact and document it accordingly. Why is this FALSE?",
        "options": [
          "It is not false — completing Stage 4 symptom-free is the objective evidence clearance rests on, so the AEP may document it.",
          "The AEP does NOT provide medical clearance for return to contact training or competitive play. Reaching the reconditioning endpoint does NOT authorise contact — it qualifies the athlete to be assessed for clearance by the medical practitioner. The AEP RECOMMENDS; the medical practitioner CLEARS.",
          "Stage 4 is itself gated by medical clearance, so the AEP could not have delivered it — a medical review is required before commencing team training.",
          "The AEP may document clearance provided a final graded exertion test is symptom-free."
        ],
        "correctAnswer": 1,
        "explanation": "The AEP does NOT diagnose concussion. The AEP does NOT provide medical clearance for return to contact training or competitive play. The AEP implements, monitors, progresses and documents — and hands over a well-prepared athlete to the clinician who holds the clearance key. Stage 4 is squarely inside that lane: the AEP delivers the entire reconditioning ladder up to and including Stage 4, and the transition into Stage 5 is gated by medical clearance. Reaching this endpoint does NOT authorise contact. It qualifies the athlete to be assessed for clearance by the medical practitioner. The AEP RECOMMENDS; the medical practitioner CLEARS."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3 claims that return-to-sport and return-to-learn or return-to-work are entirely independent, and that a demanding school or work day has no bearing on exercise tolerance that session. Why is this FALSE?",
        "options": [
          "It is not false — physical and cognitive recovery are independent processes with separate metabolic demands.",
          "An athlete who has spent a cognitively demanding day at school or work arrives at an exercise session with a reduced effective capacity — their functional HRt that session may sit below the physiological ceiling measured at rest.",
          "Cognitive load matters only until the athlete reaches Stage 3 of the GRTS ladder, after which the neurometabolic cascade is fully resolved.",
          "The correct management is to eliminate all academic activity during the exercise rehabilitation phase so the metabolic budget is not shared."
        ],
        "correctAnswer": 1,
        "explanation": "The neurometabolic cascade depletes ATP reserves and impairs cerebral blood-flow regulation across all ATP-consuming neural processes — synaptic transmission, working memory, sustained attention and executive decision-making no less than autonomic cardiovascular regulation (Giza & Hovda, 2014). The operational consequence: An athlete who has spent a cognitively demanding day at school or work arrives at an exercise session with a reduced effective capacity — their functional HRt that session may sit below the physiological ceiling measured at rest. Schedule exercise sessions away from peak cognitive-load windows — not immediately after a full school day, a demanding exam or a high-cognitive-demand work period."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4 claims that an athlete who tolerates 30 minutes of stationary cycling at their sub-symptom-threshold heart rate is ready for running drills, because the physiological demand is equivalent in a different modality. Why is this FALSE?",
        "options": [
          "Running demands higher absolute cardiac output than cycling, causing the athlete to exceed their HRt even at slow jog pace.",
          "Running generates vertical head oscillation at approximately 2–4 Hz, which activates the vestibulo-ocular reflex (VOR) to stabilise the retinal image during locomotion; and foot-strike transmits a mechanical shock wave up the lower limb and spine to the head. Neither stimulus exists on a stationary bike.",
          "Running relies predominantly on anaerobic glycolysis, and the anaerobic system is not restored by an aerobic cycling program.",
          "Jogging recruits different lower-limb muscles than cycling, increasing proprioceptive demand and producing positional dizziness from lumbopelvic instability."
        ],
        "correctAnswer": 1,
        "explanation": "Stationary cycling is a non-impact, essentially head-still activity. Running generates vertical head oscillation at approximately 2–4 Hz (increasing with speed from slow jog to running pace), which activates the vestibulo-ocular reflex (VOR) to stabilise the retinal image during locomotion. This mechanism explains the specific clinical observation that an athlete may tolerate stationary cycling symptom-free but develop dizziness or headache within minutes of beginning to jog — even with heart rate well below their established HRt. Separately, Foot-strike during running transmits a mechanical shock wave up the lower limb and spine to the head. This repetitive low-amplitude mechanical impulse is absent in cycling and minimised even in brisk walking."
      }
    ],
    "scope-note": [
      {
        "kind": "quick-check",
        "question": "In the shared-care relay described in this section, which allocation of roles is correct?",
        "options": [
          "The AEP diagnoses the concussion and manages medical complications; the GP or sports physician delivers the reconditioning program.",
          "The diagnosing clinician (GP or sports physician) diagnoses the concussion, manages medical complications, and holds responsibility for the final return-to-contact clearance decision. The AEP owns the reconditioning — stages 1 through 4 of the GRTS ladder — and after medical clearance may support conditioning at stages 5 and 6.",
          "The AEP owns stages 1 through 6 outright, with the medical practitioner involved only if medical complications arise.",
          "The AEP waits until medical clearance has been granted, then delivers the reconditioning ladder from stage 1 through stage 6."
        ],
        "correctAnswer": 1,
        "explanation": "The diagnosing clinician (GP or sports physician) diagnoses the concussion, manages medical complications, and holds responsibility for the final return-to-contact clearance decision. The AEP owns the reconditioning — stages 1 through 4 of the GRTS ladder, the return-to-running progression, sport-specific and contact-preparation conditioning, load monitoring, and symptom-tracked progression. After medical clearance, the AEP may support conditioning at stages 5 and 6. Waiting is not the alternative: The clearing clinician makes a better decision about an athlete who arrives at that appointment fully conditioned, well-documented and sport-specific-training-ready — not about a deconditioned athlete who has been sitting out for three weeks with no structured rehabilitation."
      }
    ],
    "grts-strategy": [
      {
        "kind": "flowchart",
        "title": "The Six-Stage Graded Return-to-Sport Strategy",
        "steps": [
          {
            "label": "Stage 1 — Symptom-Limited Activity",
            "description": "Daily activities of routine living that do not provoke symptoms. Light walking, self-care and routine cognitive tasks at a pace the athlete can sustain without symptom exacerbation."
          },
          {
            "label": "Stage 2 — Light Aerobic Exercise",
            "description": "Walking or stationary cycling at light-to-moderate intensity, sub-symptom-threshold, to increase heart rate. No resistance training."
          },
          {
            "label": "Stage 3 — Sport-Specific Exercise",
            "description": "Running or sport-specific movement drills executed by the athlete individually or in structured solo practice. No head-impact activities."
          },
          {
            "label": "Stage 4 — Non-Contact Training Drills",
            "description": "The athlete joins or replicates full team training minus contact. This includes passing drills, progressive resistance training, reactive agility, complex movement sequences and the full cognitive-physical dual-task demand of team training."
          },
          {
            "label": "Stage 5 — Full-Contact Practice",
            "description": "Following medical clearance, the athlete returns to normal training including body contact. The AEP may support conditioning at this stage but does not own the clearance decision."
          },
          {
            "label": "Stage 6 — Return to Competition",
            "description": "Normal competitive game play. Unrestricted participation. The medical decision is complete."
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "What is the governing rule for every stage transition in the GRTS strategy?",
        "options": [
          "Symptom-free during the session is sufficient — symptoms appearing the next morning are a separate issue and do not affect stage progression.",
          "A minimum of 24 hours at the current stage, completed without new or worsening concussion symptoms during the stage AND in the 24 hours following it. If symptoms recur at any stage, the athlete drops back to the previous tolerated stage.",
          "If symptoms recur, repeat the same stage at a reduced percentage of the previous session load without allowing symptom resolution first.",
          "Load numbers decide progression once the athlete is past Stage 2; the symptom response becomes one input among several."
        ],
        "correctAnswer": 1,
        "explanation": "The governing rule for every stage transition: a minimum of 24 hours at the current stage, completed without new or worsening concussion symptoms during the stage AND in the 24 hours following it. If symptoms recur at any stage, the athlete drops back to the previous tolerated stage. Medical clearance is required before Stage 5 (full-contact practice). Return to normal academic or work activity should precede or accompany Stage 5 progression. When a session is not tolerated: Regress to the last fully tolerated step, allow recovery, and rebuild. Load numbers inform the plan; the symptom response decides it."
      }
    ],
    "au-standdown": [
      {
        "kind": "scenario",
        "title": "Working the Two Clocks: Earliest Compliant Return-to-Contact Date",
        "patientSummary": "You are the AEP delivering reconditioning for community-sport athletes under the AIS/SMA Australian Concussion Guidelines for Youth and Community Sport. For each athlete, identify the earliest possible return to contact. The stand-down clock starts at the time of injury. The symptom-free clock starts when the athlete reports complete symptom resolution.",
        "steps": [
          {
            "id": "case-a",
            "narrative": "Athlete A is symptom-free from day 4 after injury. What is the earliest possible return to contact?",
            "clinicalData": [
              "Injury = day 0",
              "Complete symptom resolution reported from day 4",
              "14-day symptom-free threshold therefore reached on day 18",
              "Calendar stand-down minimum = 21 days"
            ],
            "choices": [
              {
                "label": "Day 18 — the 14-day symptom-free threshold has been reached",
                "feedback": "But the calendar minimum is 21 days, so the earliest possible return to contact is day 21 — the calendar minimum falls later, and the later governs.",
                "nextStepId": "case-b"
              },
              {
                "label": "Day 21 — the calendar minimum falls later, and the later governs",
                "feedback": "Correct. An athlete who is symptom-free from day 4 reaches their 14-day symptom-free threshold on day 18. But the calendar minimum is 21 days, so the earliest possible return to contact is day 21.",
                "nextStepId": "case-b"
              },
              {
                "label": "Day 4 — contact can resume once the athlete is symptom-free",
                "feedback": "Both clocks run simultaneously, and the LATER of the two governs the earliest compliant return-to-contact date.",
                "nextStepId": "case-b"
              }
            ]
          },
          {
            "id": "case-b",
            "narrative": "Athlete B remains symptomatic until day 12, then reports complete symptom resolution. What is the earliest possible return to contact?",
            "clinicalData": [
              "Injury = day 0",
              "Symptomatic until day 12",
              "14-day symptom-free threshold therefore reached on day 26",
              "Calendar stand-down minimum = 21 days"
            ],
            "choices": [
              {
                "label": "Day 26 — the symptom-free threshold falls later, and the later governs",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Day 21 — the calendar stand-down has fully elapsed",
                "nextStepId": "outcome-early"
              },
              {
                "label": "Day 26, and you document contact clearance in your session notes on that date",
                "nextStepId": "outcome-scope"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Day 26 — the later clock governs",
              "explanation": "An athlete who remains symptomatic until day 12 reaches their 14-day symptom-free threshold on day 26. The calendar minimum is day 21, but the symptom-free threshold is day 26 — the later governs, so the earliest possible return to contact is day 26.",
              "clinicalReasoning": "Both clocks run simultaneously, and the LATER of the two governs the earliest compliant return-to-contact date. Note also what the date does and does not mean: Reaching this endpoint does NOT authorise contact. It qualifies the athlete to be assessed for clearance by the medical practitioner."
            }
          },
          {
            "id": "outcome-early",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Day 21 does not satisfy the symptom-free minimum",
              "explanation": "The guidelines address this case directly: An athlete who remains symptomatic until day 12 reaches their 14-day symptom-free threshold on day 26. The calendar minimum is day 21, but the symptom-free threshold is day 26 — the later governs, so the earliest possible return to contact is day 26.",
              "clinicalReasoning": "An athlete who reaches day 21 post-injury but has only been symptom-free for 6 days has NOT met the symptom-free requirement. Both clocks must fully elapse."
            }
          },
          {
            "id": "outcome-scope",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Right date, wrong signature",
              "explanation": "The date arithmetic is correct — the symptom-free threshold on day 26 falls later than the day-21 calendar minimum, and the later governs. The error is the documentation: The AEP does NOT provide medical clearance for return to contact training or competitive play.",
              "clinicalReasoning": "Reaching this endpoint does NOT authorise contact. It qualifies the athlete to be assessed for clearance by the medical practitioner. The AEP RECOMMENDS; the medical practitioner CLEARS."
            }
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "During the AIS/SMA stand-down window, what may the AEP deliver?",
        "options": [
          "Nothing structured — the stand-down is a no-ACTIVITY period, so reconditioning waits until both clocks expire and is then compressed into the final days before clearance.",
          "Sub-symptom-threshold aerobic rehabilitation (Stage 2), sport-specific reconditioning (Stage 3) and non-contact training drills (Stage 4), provided each stage is symptom-free — but not contact training.",
          "Everything up to and including contact training, provided the 21-day calendar minimum has elapsed, regardless of the symptom-free clock.",
          "All training including full-contact practice, provided the athlete is symptom-free on the day."
        ],
        "correctAnswer": 1,
        "explanation": "The stand-down is a no-CONTACT period, not a no-ACTIVITY period. You CAN and SHOULD begin sub-symptom-threshold aerobic rehabilitation (Stage 2) and progress through sport-specific reconditioning (Stage 3) and non-contact training drills (Stage 4) during the stand-down window, provided each stage is symptom-free. You CANNOT progress into contact training (Stage 5 territory) until both minimums are satisfied AND medical clearance is granted. The target is to arrive at full non-contact, sport-specific training capacity (top of Stage 4) at or before the point where both clocks have expired — not to wait idly and then compress a multi-week reconditioning program into the final few days before clearance."
      }
    ],
    "reconditioning-physiology": [
      {
        "kind": "quick-check",
        "question": "An athlete tolerates stationary cycling symptom-free, but develops dizziness and nausea within minutes of beginning to jog — with heart rate well below their established HRt. Which mechanism best explains this?",
        "options": [
          "Running demands higher absolute cardiac output than cycling, so the athlete has in fact exceeded their HRt at slow jog pace.",
          "With incompletely restored VOR gain, the continuous locomotion-generated head oscillation of running is not fully compensated, producing oscillopsia — visual instability during movement. This is a vestibulo-ocular symptom, not a cardiovascular one.",
          "Running relies predominantly on anaerobic glycolysis, and the anaerobic system was not restored by the aerobic cycling program.",
          "Jogging recruits different lower-limb muscles than cycling, producing a positional dizziness from lumbopelvic instability."
        ],
        "correctAnswer": 1,
        "explanation": "In a recovering athlete with incompletely restored VOR gain, this continuous locomotion-generated head oscillation is not fully compensated. The result is oscillopsia — visual instability during movement, perceived as the environment appearing to bounce or blur with each foot-strike. This is a vestibulo-ocular symptom, not a cardiovascular one, and it can provoke headache, dizziness and nausea at an exercise intensity that would be clearly sub-symptom-threshold on a stationary bike (Mucha et al., 2014). The stimulus itself: Running generates vertical head oscillation at approximately 2–4 Hz (increasing with speed from slow jog to running pace), which activates the vestibulo-ocular reflex (VOR) to stabilise the retinal image during locomotion."
      },
      {
        "kind": "matching",
        "title": "Each Rung Introduces a Qualitatively New Demand",
        "instruction": "Match each step up the reconditioning ladder to the qualitatively new physiological demand it introduces.",
        "pairs": [
          {
            "id": "running-vor",
            "left": "Running (compared with stationary cycling)",
            "right": "Vertical head oscillation at approximately 2–4 Hz, activating the vestibulo-ocular reflex (VOR)",
            "explanation": "Stationary cycling is a non-impact, essentially head-still activity. The VOR stabilises the retinal image during locomotion."
          },
          {
            "id": "footstrike",
            "left": "Foot-strike during running",
            "right": "A mechanical shock wave transmitted up the lower limb and spine to the head",
            "explanation": "This repetitive low-amplitude mechanical impulse is absent in cycling and minimised even in brisk walking."
          },
          {
            "id": "cod",
            "left": "Change-of-direction running",
            "right": "Substantially larger, multi-planar semicircular canal stimuli",
            "explanation": "Rapid head turns in the yaw and pitch planes during cuts and decelerations — which is why change-of-direction load is introduced after straight-line running is consolidated, not before."
          },
          {
            "id": "stage4",
            "left": "Stage 4 team training (compared with solo Stage 3 drills)",
            "right": "Frontal-prefrontal dual-task cognitive load layered on top of physical effort",
            "explanation": "Team passing drills, reactive agility and complex game-situation work require simultaneous skill execution, field scanning, tracking of teammates and opponents, verbal communication and rapid tactical decision-making — all under physical fatigue."
          }
        ],
        "leftLabel": "Progression step",
        "rightLabel": "Qualitatively new demand"
      }
    ],
    "return-to-running": [
      {
        "kind": "ordering",
        "title": "The Six-Step Return-to-Running Progression",
        "instruction": "Place the six steps of the concussion-specific return-to-running progression in the correct order.",
        "items": [
          {
            "id": "step-1",
            "label": "Walk/jog intervals",
            "rationale": "Alternating walk and easy jog blocks on a flat, predictable surface at a heart rate comfortably below HRt. Goal: reintroduce running impact loading and the VOR stimulus of locomotion at minimal dose."
          },
          {
            "id": "step-2",
            "label": "Continuous easy running",
            "rationale": "Continuous jogging at conversational pace within the heart-rate ceiling, building duration before pace. Goal: demonstrate that sustained linear locomotion — and the continuous VOR stimulus it produces — is tolerated symptom-free."
          },
          {
            "id": "step-3",
            "label": "Tempo effort",
            "rationale": "Lift intensity toward steady-state tempo running, increasing heart rate toward (but below) HRt while maintaining relative ease."
          },
          {
            "id": "step-4",
            "label": "Interval / repeated-effort running",
            "rationale": "Structured intervals reintroducing acceleration-deceleration cycles and transiently higher heart rates. Goal: tolerate intensity spikes and the autonomic swings that characterise sport-relevant repeated-sprint demands."
          },
          {
            "id": "step-5",
            "label": "Change-of-direction running",
            "rationale": "Curved running, pre-planned cuts, 45° and 90° direction changes, and head or gaze movements under running load. This is the most VOR-intensive step."
          },
          {
            "id": "step-6",
            "label": "Sport-specific running drills",
            "rationale": "Shuttle patterns, position-specific movement, reactive cues, sport-skill execution under movement and fatigue. This feeds directly into Stage 4 conditioning."
          }
        ],
        "correctOrder": [
          "step-1",
          "step-2",
          "step-3",
          "step-4",
          "step-5",
          "step-6"
        ],
        "explanation": "One variable at a time. Increase duration before pace, pace before intensity, and linear load before multidirectional load. Stacking volume, intensity and change-of-direction in the same progression step is the fastest way to provoke symptoms and lose diagnostic clarity about what caused them. This progression sits within GRTS Stage 3 and is its internal structure — Do not treat Stage 3 as a single training session."
      },
      {
        "kind": "quick-check",
        "question": "An athlete is symptom-free through Step 4 (interval running) but develops dizziness and headache when change-of-direction running is introduced at Step 5. What does this represent, and what is the correct action?",
        "options": [
          "A programming failure — repeat Step 5 at reduced volume until it is tolerated, without notifying anyone.",
          "Step 5 is the most VOR-intensive step; symptom onset here indicates residual VOR sensitivity that may warrant targeted cervicovestibular rehabilitation. Document this and communicate it to the referring clinician before continuing.",
          "Insufficient aerobic base — return to Stage 2 stationary cycling before re-attempting the running progression.",
          "Normal training adaptation — work through it with repeated progressive exposure."
        ],
        "correctAnswer": 1,
        "explanation": "This is the most VOR-intensive step — rapid head turns in the yaw plane during cutting generate high semicircular canal stimuli that substantially exceed those of straight-line running. An athlete who is symptom-free at Step 4 may develop dizziness, headache or nausea at Step 5, indicating residual VOR sensitivity that may warrant targeted cervicovestibular rehabilitation (Schneider et al., 2014). Document this and communicate it to the referring clinician before continuing. Framed correctly: This is clinically useful information to feed back to the referring clinician — not simply a programming failure."
      }
    ],
    "team-sport-conditioning": [
      {
        "kind": "multi-select",
        "question": "Which of the following count as contact-PREPARATION conditioning that the AEP can deliver within Stage 4? (Select all that apply)",
        "options": [
          "Tackle-bag work",
          "Shield work",
          "Controlled falling and recovery",
          "Pre-arranged, cooperative partner drills with no head impact",
          "Full-contact practice involving head impact",
          "Competitive or uncontrolled collision"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3
        ],
        "explanation": "Contact-PREPARATION (bag work, shields, controlled bracing, cooperative non-head-impact partner drills) is AEP-deliverable reconditioning within Stage 4. Full-contact PRACTICE (Stage 5) involves head impact or competitive or uncontrolled collision and is gated behind medical clearance and the AIS/SMA stand-down minimums. The line is head impact and competitive uncontrolled contact — stay on the preparation side until medical clearance is received. Delivered well, this conditions the neuromuscular and psychological systems for the demands of contact sport while staying on the AEP-deliverable, Stage 4 side of the line."
      }
    ],
    "load-monitoring": [
      {
        "kind": "quick-check",
        "question": "How should session RPE (sRPE) be calculated, and what value does a session rated 6/10 effort for 40 minutes produce?",
        "options": [
          "Heart rate at the end of the session divided by session duration, reported as a percentage of HRt.",
          "The athlete's global rating of perceived exertion (Borg 0–10 scale) multiplied by session duration in minutes — a single internal-load value in arbitrary units (AU). 6/10 for 40 minutes = 240 AU.",
          "The ratio of the last 7-day load sum to the rolling 28-day average, expressed in arbitrary units.",
          "A brief daily symptom rating on a 0–10 scale, recorded alongside training duration."
        ],
        "correctAnswer": 1,
        "explanation": "Session RPE (sRPE) is the athlete's global rating of perceived exertion (Borg 0–10 scale) multiplied by session duration in minutes — a single internal-load value in arbitrary units (AU). Simple, well-validated, and effective for tracking the week-to-week load build and identifying spikes. A session rated 6/10 effort for 40 minutes = 240 AU. The two distractor tools are real but different: the ratio of the last 7-day load sum to the rolling 28-day average is the ACWR, and the brief daily 0–10 rating is the symptom diary."
      },
      {
        "kind": "quick-check",
        "question": "Which statement correctly describes the acute:chronic workload ratio (ACWR) and how it should be used in concussion reconditioning?",
        "options": [
          "An ACWR above 1.5 is the adaptation sweet spot; the 0.8–1.3 range indicates an under-loaded athlete who will not adapt.",
          "An ACWR in the range 0.8–1.3 represents the adaptation sweet spot; an ACWR above 1.5 represents a load spike that substantially exceeds chronic conditioning.",
          "ACWR compares the last 28-day training load to the trailing 7-day average, and should be maximised in the final week before the clearance date.",
          "Once the athlete reaches Stage 3, ACWR replaces symptom monitoring as the progression signal."
        ],
        "correctAnswer": 1,
        "explanation": "The acute:chronic workload ratio (ACWR) compares the last 7-day training load to the trailing 28-day average. An ACWR in the range 0.8–1.3 represents the adaptation sweet spot — load is above chronic average, driving adaptation, but not excessively so. An ACWR above 1.5 represents a load spike that substantially exceeds chronic conditioning — in tissue-injury epidemiology this zone correlates with sharply elevated injury risk (Gabbett, 2016). In concussion rehabilitation the same logic applies: a sharp spike in training volume, intensity or movement complexity that substantially exceeds the athlete's chronic conditioning level risks provoking symptoms and prolonging recovery. It never displaces the symptom signal: Load numbers inform the plan; the symptom response decides it."
      },
      {
        "kind": "insight",
        "type": "tip",
        "title": "Capturing the sessions that happen away from you",
        "content": "The pairing of load data and symptom data is what allows you to determine whether the athlete is tolerating the build — which depends on both actually being captured for the sessions you do not supervise. SST Trainer is the delivery route we recommend for that: it gives the athlete their prescribed heart-rate band live on their own phone during the session and returns the session record to the clinician, so the 24-hour rule and each stage transition rest on recorded sessions rather than recollection. The clinical protocol it delivers is published open-access (DOI 10.5281/zenodo.21482634). The governing signal is unchanged: load numbers inform the plan; the symptom response decides it."
      }
    ],
    "rtl-rtw-pacing": [
      {
        "kind": "ordering",
        "title": "The Five-Stage Return-to-Learn Progression",
        "instruction": "Place the five stages of the return-to-learn cognitive-pacing ladder in the correct order.",
        "items": [
          {
            "id": "rtl-1",
            "label": "Activities of daily living that do not provoke symptoms",
            "rationale": "Brief periods of light reading or screen time, no academic demands."
          },
          {
            "id": "rtl-2",
            "label": "School activities at home",
            "rationale": "Homework in short bursts (15–20 minutes) increasing to 30–60 minutes with planned rest breaks, before returning to school."
          },
          {
            "id": "rtl-3",
            "label": "Return to school part-time",
            "rationale": "Reduced school day or selected classes; accommodations in place (extra time, quiet room, reduced screen exposure, priority seating)."
          },
          {
            "id": "rtl-4",
            "label": "Full attendance with accommodations",
            "rationale": "Gradual removal of accommodations as load is tolerated."
          },
          {
            "id": "rtl-5",
            "label": "Full academic load without accommodations",
            "rationale": "Return to full cognitive function confirmed."
          }
        ],
        "correctOrder": [
          "rtl-1",
          "rtl-2",
          "rtl-3",
          "rtl-4",
          "rtl-5"
        ],
        "explanation": "For student-athletes, the following cognitive-pacing ladder mirrors the physical GRTS structure. The governing rule is the same one: The symptom-limited threshold concept applies to cognitive work as reliably as to physical work. Gradual extension of cognitive task duration and complexity — mirroring the physical load build — is correct RTL and RTW management."
      },
      {
        "kind": "quick-check",
        "question": "How should return-to-learn and return-to-work relate to return-to-sport?",
        "options": [
          "Return-to-sport is completed first — physical clearance is the prerequisite for resuming meaningful cognitive load.",
          "The Amsterdam 2023 consensus endorses return to school or work — at a cognitively paced level — before and alongside return-to-sport, not after it. RTL, RTW and RTS are coordinated and concurrent, not sequential.",
          "They are entirely independent processes; a demanding school or work day has no bearing on the athlete's exercise tolerance that session.",
          "Academic and work activity should be eliminated during the exercise rehabilitation phase so the metabolic budget is not shared."
        ],
        "correctAnswer": 1,
        "explanation": "The Amsterdam 2023 consensus endorses return to school or work — at a cognitively paced level — before and alongside return-to-sport, not after it (Patricios et al., 2023). RTL, RTW and RTS are coordinated and concurrent, not sequential. The GRTS ladder carries the same instruction: Return to normal academic or work activity should precede or accompany Stage 5 progression."
      }
    ],
    "readiness-handover": [
      {
        "kind": "multi-select",
        "question": "Which of the following are REGRESS criteria — reasons to drop back to the last fully tolerated stage or step? (Select all that apply)",
        "options": [
          "New or worsening concussion symptoms during or after the session, including a delayed 24-hour flare",
          "A meaningful, unexplained rise in submaximal heart rate or fall in exercise tolerance at a load that was previously well-tolerated",
          "Loss of confidence, fear or avoidance behaviour around training tasks",
          "Any red flag warranting immediate pause and medical review: neurological signs, severe or unusual headache, vision changes, marked cognitive impairment or significant balance deterioration",
          "Objective load and heart-rate responses are stable or improving at the current stage",
          "The 21-day calendar stand-down has not yet elapsed, so non-contact reconditioning must pause"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3
        ],
        "explanation": "Regress criteria — drop back when any of these occur: New or worsening concussion symptoms during or after the session, including a delayed 24-hour flare. A meaningful, unexplained rise in submaximal heart rate or fall in exercise tolerance at a load that was previously well-tolerated. Loss of confidence, fear or avoidance behaviour around training tasks. Any red flag warranting immediate pause and medical review: neurological signs, severe or unusual headache, vision changes, marked cognitive impairment or significant balance deterioration. The two remaining options are not regress criteria. Objective load and heart-rate responses are stable or improving — no unexplained HR surge at the same workload is a PROGRESS criterion. And the stand-down is a no-CONTACT period, not a no-ACTIVITY period, so an unexpired calendar clock does not pause non-contact reconditioning. When regressing, return to the last fully tolerated stage or step. Allow symptoms to fully resolve. Rebuild."
      },
      {
        "kind": "quick-check",
        "question": "An athlete you have rehabilitated satisfies every AEP endpoint criterion, and both AIS/SMA minimums have been met. What is the scope-appropriate statement to make?",
        "options": [
          "Confirm verbally that they are cleared for contact — every objective criterion is satisfied — and document the clearance in your session notes.",
          "State what the athlete tolerates, confirm the AIS/SMA milestones, and recommend that from a reconditioning standpoint this athlete is prepared for the contact-clearance assessment — explicitly leaving the clearance decision and contact progression to the clinician.",
          "No statement is needed — meeting the endpoint criteria automatically progresses the athlete into Stage 5.",
          "Tell the athlete they are ready and advise them to call their GP to formalise the paperwork."
        ],
        "correctAnswer": 1,
        "explanation": "Reaching this endpoint does NOT authorise contact. It qualifies the athlete to be assessed for clearance by the medical practitioner. The AEP RECOMMENDS; the medical practitioner CLEARS. These are not the same act, and that distinction is not pedantic — it is the boundary between implementing graded exertion and granting medical clearance. So the handover has three parts: state plainly what the athlete now tolerates; state the AIS/SMA milestones — confirm the stand-down and symptom-free minimums are satisfied; and make a clear, scope-appropriate recommendation that from a reconditioning standpoint, this athlete is prepared for the contact-clearance assessment — and explicitly leave the clearance decision and contact progression to the clinician."
      }
    ]
  },
  "207": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "MYTH 1 states: \"When concussion symptoms persist beyond four weeks, the exercise physiologist should stop the aerobic program and revert to rest until the patient is symptom-free.\" Why is this false?",
        "options": [
          "It is not false — at four weeks the aerobic program should be paused until symptoms fully resolve.",
          "The presence of PPCS is not a reason to stop active rehabilitation — for the physiological/exercise-intolerant phenotype, graded exercise is the primary treatment, and ongoing rest in PPCS is actively harmful.",
          "The evidence is unclear — rest and exercise are equally effective at this stage, so the patient should choose based on preference.",
          "Rest is correct at four weeks, but only if combined with aggressive cognitive rehabilitation such as intensive reading or memory tasks."
        ],
        "correctAnswer": 1,
        "explanation": "The presence of PPCS is not a reason to stop active rehabilitation — for the physiological/exercise-intolerant phenotype, graded exercise is the primary treatment (Leddy et al., 2023; Valaas et al., 2026). The reverse move does active damage: ongoing rest in PPCS is ACTIVELY HARMFUL: it deepens the deconditioning spiral, maintains the fear-avoidance pattern, suppresses BDNF (reducing neuroplasticity), worsens mood, and is associated with slower — not faster — clinical recovery in all available data."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 2 states: \"Persistent post-concussion symptoms represent a single, unified brain condition — if symptoms are persisting, it simply means the concussion has not healed.\" Why is this false?",
        "options": [
          "PPCS is a clinical descriptor, not a single diagnosis or a unified neurological syndrome — it marks a recovery that has stalled, driven by one or more identifiable, treatable mechanisms, and does not identify the cause.",
          "It is not false — persisting symptoms do mean the concussion has not healed, and the label PPCS captures that single condition.",
          "PPCS indicates permanent structural brain damage — prognosis is poor and vigorous exercise is contraindicated indefinitely.",
          "PPCS is purely a psychiatric condition; all persistent symptoms are driven by anxiety or malingering rather than physiology."
        ],
        "correctAnswer": 0,
        "explanation": "PPCS is a CLINICAL DESCRIPTOR, not a single diagnosis or a unified neurological syndrome. It marks a recovery that has not followed the expected trajectory; it does not identify the cause (Silverberg & Iverson, 2020; Ellis et al., 2015). Nor does the label imply permanence: PPCS is NOT proof of permanent structural brain damage. It is a recovery that has stalled, driven by one or more identifiable, treatable mechanisms."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 3 states: \"Neuroinflammation and central sensitisation are acute-phase phenomena — they resolve with the initial neurometabolic cascade and are no longer relevant when managing a patient eight weeks post-injury.\" Why is this false?",
        "options": [
          "Neuroinflammation is only relevant in the first 72 hours; by week 4 it has fully resolved and cannot contribute to PPCS symptoms.",
          "Neuroinflammatory cytokines only affect peripheral nerve function; their effects on sleep and mood are not biologically mediated.",
          "In some patients, microglia remain in a pro-inflammatory M1 state weeks to months after injury, and central sensitisation is increasingly recognised as a contributor to PPCS.",
          "Neuroinflammation in PPCS causes visible brain swelling detectable on standard MRI, which is the mechanism driving fatigue and mood symptoms."
        ],
        "correctAnswer": 2,
        "explanation": "Both processes can run well past the acute phase. In some patients, microglia remain in a pro-inflammatory M1 state weeks to months after injury. Chronically activated microglia maintain elevated IL-1β, IL-6 and TNF-α — cytokines that directly impair synaptic plasticity and long-term potentiation (the cellular basis of memory consolidation and cognitive recovery). Central sensitisation follows the same pattern: it is well-established in chronic musculoskeletal pain and is increasingly recognised as a contributor to PPCS."
      },
      {
        "kind": "quick-check",
        "question": "MYTH 4 states: \"If a PPCS patient now completes the Buffalo test to exhaustion without any symptom provocation, this confirms the physiological phenotype has normalised — raise the heart-rate ceiling and continue progressive aerobic loading.\" Which half of that statement is wrong, and why?",
        "options": [
          "The first half — a symptom-free maximal test tells you nothing about the phenotype, so the test should simply be repeated next week before any decision is made.",
          "Neither half — the program was under-dosed, so the ceiling should be raised to 85% of maximum heart rate and aerobic loading continued.",
          "Neither half — the patient is fully recovered and can be discharged with no further referral required.",
          "The second half — exercise tolerance has recovered, so the persisting symptoms have a different driver; do NOT raise the aerobic ceiling, flag the finding back to the referrer."
        ],
        "correctAnswer": 3,
        "explanation": "The phenotype reading is right; the prescription response is wrong. If the patient completes a BCTT to maximal exertion without symptom provocation, exercise tolerance has recovered. Persisting symptoms at rest or from non-aerobic stimuli (cognitive load, posture, visual motion) are driven by a different mechanism — not the physiological/autonomic phenotype. Continuing to push aerobic load will not help. The framework is explicit about the action: Do NOT raise the aerobic ceiling: flag outcome (b) back to the referrer, because more aerobic load is not the answer."
      }
    ],
    "ppcs-definition": [
      {
        "kind": "quick-check",
        "question": "A patient is 5 weeks post-concussion. They report occasional symptoms below 2/10 that are not interfering with work, study or training. Using this section's differentiation features, does this meet the clinical threshold for PPCS?",
        "options": [
          "No — PPCS is a functionally significant persistence; minor residual symptoms below 2/10 that are not interfering with function do not meet the clinical threshold.",
          "Yes — the 4-week timeline is the only criterion, so any symptom still present at 5 weeks meets the threshold.",
          "Yes — if symptoms are persisting, it simply means the concussion has not healed.",
          "No — but only because a downward symptom trend rules out PPCS regardless of how limiting the symptoms are."
        ],
        "correctAnswer": 0,
        "explanation": "Function, not the calendar alone, carries the designation. FUNCTIONAL IMPACT: PPCS is a functionally significant persistence — the patient cannot return to their pre-injury work, study, training or social role. Minor residual symptoms below 2/10 that are not interfering with function do not meet the clinical threshold. The timeline criterion is worded the same way: Symptoms that are still significant and functionally limiting at 4 weeks in adults or 4–6 weeks in adolescents warrant a PPCS designation and a structured clinical response."
      },
      {
        "kind": "quick-check",
        "question": "A PPCS patient asks what is likely to happen over the coming months, and whether structured treatment is worth it. Which statement matches the epidemiology described in this section?",
        "options": [
          "Complete functional disability persisting beyond 12 months is the usual course of PPCS.",
          "Most patients improve over 3–12 months even without structured treatment, and structured, mechanism-targeted treatment accelerates this natural history — it does not merely ride it.",
          "Because most patients improve eventually, structured treatment adds nothing beyond the natural history.",
          "PPCS indicates permanent structural brain damage — prognosis is poor and vigorous exercise is contraindicated indefinitely."
        ],
        "correctAnswer": 1,
        "explanation": "The natural history of PPCS, even without structured treatment, is that most patients improve over 3–12 months. PPCS with complete functional disability persisting beyond 12 months is uncommon but occurs. That favourable baseline is not an argument against treating: Structured, mechanism-targeted treatment accelerates this natural history — it does not merely ride it."
      }
    ],
    "ppcs-pathophysiology": [
      {
        "kind": "matching",
        "title": "The Five Mechanisms of Persistence",
        "instruction": "Match each of the five mechanisms that drive persistence to the finding this section uses to characterise it.",
        "pairs": [
          {
            "id": "autonomic",
            "left": "Sustained autonomic and cerebrovascular dysregulation",
            "right": "Reduced HF-HRV and blunted BRS still measurably abnormal at 4–8 weeks",
            "explanation": "PERSISTING SYMPATHOVAGAL IMBALANCE: Reduced HF-HRV (high-frequency heart rate variability reflecting parasympathetic tone) and blunted BRS remain measurably abnormal at 4–8 weeks in PPCS patients who have not recovered."
          },
          {
            "id": "neuroinflammation",
            "left": "Unresolved neuroinflammation",
            "right": "Microglia remaining in a pro-inflammatory M1 state weeks to months after injury",
            "explanation": "In some patients, microglia remain in a pro-inflammatory M1 state weeks to months after injury. Chronically activated microglia maintain elevated IL-1β, IL-6 and TNF-α."
          },
          {
            "id": "sensitisation",
            "left": "Central sensitisation",
            "right": "Photophobia, phonophobia, vestibular hypersensitivity and skin allodynia",
            "explanation": "Photophobia (light sensitivity), phonophobia (noise sensitivity), vestibular hypersensitivity (motion provokes dizziness at intensities that would not affect a healthy person), headache from minor cognitive or physical loads, and skin allodynia are all consistent with a sensitised symptom-processing system."
          },
          {
            "id": "deconditioning",
            "left": "The deconditioning spiral",
            "right": "Reduced plasma volume, stroke volume and VO₂max from relative inactivity",
            "explanation": "Cardiovascular deconditioning — reduced plasma volume, stroke volume and VO₂max from relative inactivity — independently reduces BRS and HRV."
          },
          {
            "id": "psychological",
            "left": "Psychological maintaining factors",
            "right": "Operant-conditioned fear-avoidance, catastrophising, and depression suppressing BDNF",
            "explanation": "Fear-avoidance is operant conditioning. Catastrophising is a measurable cognitive pattern with neurological correlates. Depression suppresses BDNF."
          }
        ],
        "leftLabel": "Mechanism of persistence",
        "rightLabel": "Characteristic finding"
      },
      {
        "kind": "ordering",
        "title": "The Deconditioning Spiral",
        "instruction": "Arrange the stages of the deconditioning spiral in the sequence this section describes.",
        "items": [
          {
            "id": "fitness",
            "label": "Lower cardiovascular fitness",
            "rationale": "Reduced plasma volume, stroke volume and VO₂max from relative inactivity."
          },
          {
            "id": "threshold",
            "label": "Lower BCTT threshold"
          },
          {
            "id": "symptoms",
            "label": "Symptoms at lighter loads"
          },
          {
            "id": "avoidance",
            "label": "More avoidance"
          },
          {
            "id": "deeper",
            "label": "Deeper deconditioning"
          },
          {
            "id": "even-lower",
            "label": "Even lower threshold"
          }
        ],
        "correctOrder": [
          "fitness",
          "threshold",
          "symptoms",
          "avoidance",
          "deeper",
          "even-lower"
        ],
        "explanation": "THE SPIRAL: Lower cardiovascular fitness → lower BCTT threshold → symptoms at lighter loads → more avoidance → deeper deconditioning → even lower threshold. The patient experiences exertional symptoms driven substantially by deconditioning, but neither they nor their clinicians can easily separate this from the neurological injury contribution. This is the loop the EP is best placed to break: The deconditioning spiral is the most modifiable driver in PPCS, and the EP is the right clinician to address it."
      }
    ],
    "risk-factors": [
      {
        "kind": "multi-select",
        "question": "Which of the following does this section identify as predictors of higher PPCS risk and a slower recovery trajectory? (Select all that apply)",
        "options": [
          "High initial symptom burden — five or more moderate-to-severe symptoms in the first 48 hours",
          "Pre-existing migraine history",
          "Loss of consciousness at the time of injury",
          "Prior concussion history — particularly inadequately managed concussions, or a new injury before full recovery from the last",
          "Concussion occurring during a competitive match rather than in training",
          "Early excessive rest and activity avoidance"
        ],
        "correctAnswers": [
          0,
          1,
          3,
          5
        ],
        "explanation": "HIGH INITIAL SYMPTOM BURDEN: The most consistently replicated predictor. Patients presenting with five or more moderate-to-severe symptoms in the first 48 hours are at significantly higher risk (Iverson et al., 2017; Haider et al., 2018). MIGRAINE HISTORY: The single strongest pre-existing predictor of PPCS, conferring a 3–5× increased risk (Patricios et al., 2023; Iverson et al., 2017). PRIOR CONCUSSION HISTORY: Previous concussions — particularly inadequately managed ones, or a new injury before full recovery from the last — lower the threshold for persistent symptoms. And one predictor is created in the clinic rather than at impact: EARLY EXCESSIVE REST AND ACTIVITY AVOIDANCE: A modifiable, partly iatrogenic risk factor. By contrast, Loss of consciousness is NOT a reliable predictor of prolonged recovery."
      }
    ],
    "exercise-indicated-ppcs": [
      {
        "kind": "quick-check",
        "question": "What does the evidence cited in this section establish about sub-threshold aerobic exercise in the persistent phase specifically?",
        "options": [
          "Prescribed aerobic exercise produced faster recovery only in the acute phase; the mechanism does not carry over past four weeks.",
          "It continues to improve HRV, BRS and exercise tolerance in PPCS patients with demonstrable exercise intolerance, and is safe when delivered below the symptom-limited threshold.",
          "Prescribed aerobic exercise produced faster symptom recovery, but at the cost of an increase in adverse events.",
          "The evidence is unclear — rest and exercise are equally effective at this stage, so the patient should choose based on preference."
        ],
        "correctAnswer": 1,
        "explanation": "Leddy et al. (2016, PMRNA) specifically addressed active rehabilitation in the persistent phase: sub-threshold aerobic exercise continues to improve HRV, BRS and exercise tolerance in PPCS patients with demonstrable exercise intolerance, and is safe when delivered below the symptom-limited threshold. The safety and efficacy signal is consistent across the programme of work: The subsequent systematic review and meta-analysis (Leddy et al., 2023, BJSM) confirmed that prescribed aerobic exercise produced faster symptom recovery compared to rest or placebo controls, with no increase in adverse events (Willer et al., 2019). And the physiology travels: Critically, the mechanism carries over to the persistent phase."
      },
      {
        "kind": "quick-check",
        "question": "A PPCS patient at 8 weeks has an HRt of 115 bpm, confirmed on the BCTT. According to this section, what actually changes about the prescription in the persistent phase?",
        "options": [
          "The mechanism and the indication change — aerobic exercise is no longer the treatment for this phenotype.",
          "The lower threshold means smaller increments, more attention to next-day response, and a slower progression curve — and duration and frequency are built before intensity.",
          "The ceiling should be raised to 85% of maximum heart rate to compensate for the low threshold.",
          "The aerobic program should replace psychology, medical migraine management and physiotherapy so the patient has a single clinician."
        ],
        "correctAnswer": 1,
        "explanation": "The prescription band is often lower and more fragile. A PPCS patient at 8 weeks with HRt 115 bpm is not the same as an acute patient with HRt 140 bpm — the lower threshold means smaller increments, more attention to next-day response, and a slower progression curve. When the ceiling will not move, volume is still a stimulus: Build duration and frequency before intensity. More minutes of well-tolerated sub-threshold load is an effective autonomic stimulus even when the ceiling is stuck. The program also stays one part of a team: it operates alongside — not instead of — psychology for mood/anxiety, medical management for migraine, and physiotherapy for cervicogenic or vestibular drivers. What changes in the persistent phase is not the mechanism or the indication — it is the starting dose, the timeline, and the attention to psychological co-management."
      }
    ],
    "stalled-rehab-framework": [
      {
        "kind": "flowchart",
        "title": "The Stalled Program: Working the Framework in Order",
        "steps": [
          {
            "label": "Define the stall",
            "description": "A genuine stall is a clear plateau — no upward movement in the BCTT heart-rate ceiling, symptom threshold, or tolerated session duration — over approximately two weeks or more, despite documented good adherence."
          },
          {
            "label": "Rule out the mimics",
            "description": "Poor adherence, sleep disruption or intercurrent illness, and a significant active life stressor are the common mimics. If adherence, sleep and stress are all satisfactory and the threshold is genuinely flat, proceed through the framework."
          },
          {
            "label": "Step 1 — Reassess the threshold",
            "description": "Repeat the Buffalo Concussion Treadmill Test or Bike Test under the agreed referral arrangement."
          },
          {
            "label": "Step 2 — Screen for non-aerobic drivers",
            "description": "Systematically screen for drivers that aerobic loading alone will not resolve (Ellis et al., 2015): cervicogenic, vestibulo-ocular, mood/anxiety/sleep, and migraine."
          },
          {
            "label": "Step 3 — Re-refer with data",
            "description": "Route the patient back to the referring clinician with clear information — not merely a generic referral."
          },
          {
            "label": "Step 4 — Escalate red flags immediately",
            "description": "Independent of the stall framework, certain presentations require stopping exercise immediately and escalating for urgent medical assessment."
          }
        ]
      },
      {
        "kind": "matching",
        "title": "Step 2 — Driver to Destination",
        "instruction": "Match each provocation pattern to the response the framework specifies for it.",
        "pairs": [
          {
            "id": "cervicogenic",
            "left": "Headache, dizziness or neck pain reproduced or worsened by sustained neck postures, specific head positions or cervical palpation — rather than by heart rate",
            "right": "Cervical physiotherapy",
            "explanation": "The key clinical question: does the symptom track heart rate, or does it track head and neck position? Cervical physiotherapy is the appropriate treatment, not more aerobic load (Schneider et al., 2014; 2017)."
          },
          {
            "id": "vestibular",
            "left": "Dizziness provoked by gaze tasks, head-movement challenges or visually dense environments — rather than by aerobic workload",
            "right": "Specific vestibular rehabilitation delivered by a trained physiotherapist",
            "explanation": "These respond to specific vestibular rehabilitation delivered by a trained physiotherapist, not to aerobic prescription."
          },
          {
            "id": "mood",
            "left": "A dominant fear-avoidance pattern, persistent low mood, significant anxiety or severe sleep disruption that is clearly the rate-limiter",
            "right": "Flag for psychology and/or medical review",
            "explanation": "The aerobic program supports mood but does not substitute for indicated psychological or pharmacological treatment."
          },
          {
            "id": "migraine",
            "left": "A migrainous headache pattern — unilateral, pulsating, associated with nausea and photophobia, lasting hours",
            "right": "Flag to the sports physician or GP",
            "explanation": "You identify the pattern and route it; you do not prescribe pharmacotherapy."
          },
          {
            "id": "physiological",
            "left": "A low BCTT threshold — symptoms still reproduced by heart rate",
            "right": "Continue and progress sub-threshold aerobic exercise",
            "explanation": "The asymmetry is clinically important: a low BCTT threshold → evidence the physiological phenotype is still active → continue and progress sub-threshold aerobic exercise."
          }
        ],
        "leftLabel": "Provocation pattern",
        "rightLabel": "Correct response"
      },
      {
        "kind": "multi-select",
        "question": "Which of the following require stopping exercise immediately and escalating for urgent medical assessment? (Select all that apply)",
        "options": [
          "Progressively worsening headache, or headache of sudden maximal onset (thunderclap)",
          "A headache reproduced by sustained cervical flexion posture rather than by heart rate",
          "Repeated vomiting (two or more episodes)",
          "Focal neurological signs: unilateral weakness or numbness, slurred speech, visual loss or double vision, facial asymmetry",
          "A session symptom score of 2/10 that settles to 0/10 within 15 minutes",
          "Chest pain, exertional syncope or presyncope, or a grossly abnormal heart-rate response to exercise"
        ],
        "correctAnswers": [
          0,
          2,
          3,
          5
        ],
        "explanation": "Red flags are medical emergencies. Stop the session. Do not attempt to diagnose the cause. For acute, severe presentations (deteriorating GCS, repeated seizure) call emergency services. For less acute but clearly abnormal presentations, direct the patient to their GP or emergency department and contact the referring clinician immediately. Document the event thoroughly. The two non-red-flag options are recognisable patterns from elsewhere in the module: The hallmark of a cervicogenic driver is symptoms reproduced by neck posture, head position or cervical palpation rather than by heart rate or aerobic load — a Step 2 screening finding, not an emergency. And of a symptom that rises and settles within the session, the module is explicit: The headache that settles within 20 minutes after stopping is dose information, not evidence of damage."
      },
      {
        "kind": "scenario",
        "title": "The Ceiling That Will Not Rise",
        "patientSummary": "A PPCS patient you have been running on a sub-threshold aerobic program has stopped progressing. Their serial BCTT threshold has been flat at 118–122 bpm across four tests over six weeks despite good adherence. Sleep, intercurrent illness and active life stressors have all been screened and are satisfactory. Headache is reproduced by sustained cervical flexion posture rather than by heart rate.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The plateau meets the definition of a genuine stall and the common mimics have been ruled out. What is your first move?",
            "clinicalData": [
              "Serial BCTT threshold flat at 118–122 bpm across four tests over six weeks",
              "Documented good adherence in the session log",
              "Sleep, intercurrent illness and significant active life stressor all screened — satisfactory",
              "Headache reproduced by sustained cervical flexion posture rather than by heart rate"
            ],
            "choices": [
              {
                "label": "Repeat the Buffalo Concussion Treadmill Test or Bike Test under the agreed referral arrangement",
                "feedback": "Step 1 of the framework. Two informative outcomes: (a) The threshold HAS risen — the program was being under-dosed against a stale HRt. (b) The patient NOW reaches exhaustion or maximal RPE WITHOUT symptom provocation — exercise tolerance has recovered.",
                "nextStepId": "step-2"
              },
              {
                "label": "Push the ceiling harder to break through the plateau",
                "feedback": "Work through this framework systematically rather than pushing the ceiling harder or quietly giving up.",
                "nextStepId": "outcome-unsystematic"
              },
              {
                "label": "Discharge the patient — a stalled program confirms non-response to exercise rehabilitation",
                "feedback": "A rehabilitation program that has stopped progressing is not a failure — it is a signal demanding a structured clinical response.",
                "nextStepId": "outcome-unsystematic"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "On the repeat test the threshold has not risen and symptoms are still provoked below maximal exertion — persisting exercise intolerance is confirmed. The headache continues to track cervical position, not heart rate. What now?",
            "clinicalData": [
              "Repeat BCTT: threshold unchanged, persisting exercise intolerance confirmed",
              "Symptom tracks head and neck position, not heart rate",
              "Aerobic sessions at the current dose remain tolerated"
            ],
            "choices": [
              {
                "label": "Maintain the tolerated aerobic maintenance dose and re-refer with data, requesting a cervical physiotherapy assessment",
                "feedback": "This is Step 2 into Step 3 — screen for the non-aerobic driver, then route it with the data that makes the re-referral actionable.",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Treat the cervical spine yourself with manual and postural techniques",
                "feedback": "Treating the neck independently is outside EP scope unless it is explicitly within the agreed referral plan.",
                "nextStepId": "outcome-scope"
              },
              {
                "label": "Send the referrer a note stating that the patient is not progressing",
                "feedback": "The driver is routed, but without the data the referrer needs to act on it.",
                "nextStepId": "outcome-generic"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Screen, maintain, and re-refer with data",
              "explanation": "The model re-referral in the framework reads: \"Your patient's serial BCTT threshold has been flat at 118–122 bpm across four tests over six weeks despite good adherence. Headache is reproduced by sustained cervical flexion posture rather than by heart rate. I suspect a cervicogenic contributor is capping the apparent threshold. I am maintaining the tolerated aerobic maintenance dose and would appreciate a cervical physiotherapy assessment.\"",
              "clinicalReasoning": "The hallmark of a cervicogenic driver is symptoms reproduced by neck posture, head position or cervical palpation rather than by heart rate or aerobic load. The EP continues the tolerated aerobic maintenance dose (maintaining conditioning) and routes the cervicogenic driver clearly, with clinical detail, to the physiotherapist or referring clinician."
            }
          },
          {
            "id": "outcome-scope",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The driver is right — the lane is not",
              "explanation": "Treating the neck independently is outside EP scope unless it is explicitly within the agreed referral plan. Cervical physiotherapy is the appropriate treatment, not more aerobic load (Schneider et al., 2014; 2017).",
              "clinicalReasoning": "You do NOT treat cervical or vestibular contributions independently. Identifying the pattern and routing it is the in-scope move."
            }
          },
          {
            "id": "outcome-generic",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "acceptable",
              "title": "Routed, but not actionable",
              "explanation": "\"Your patient is not progressing\" is not useful. A concise summary of serial BCTT thresholds (with dates and HR values), symptom-log trends (overall trajectory), what exertion has and has not been tolerated, the specific symptom-provocation patterns you have identified, and your phenotype reasoning makes you an irreplaceable team member and makes the re-referral actionable.",
              "clinicalReasoning": "Route the patient back to the referring clinician with clear information — not merely a generic referral."
            }
          },
          {
            "id": "outcome-unsystematic",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The stall is a signal, not a verdict",
              "explanation": "A rehabilitation program that has stopped progressing is not a failure — it is a signal demanding a structured clinical response. Work through this framework systematically rather than pushing the ceiling harder or quietly giving up.",
              "clinicalReasoning": "The aim is to identify what is now rate-limiting recovery and route it correctly."
            }
          }
        ]
      }
    ],
    "comorbid-patient": [
      {
        "kind": "quick-check",
        "question": "A deconditioned, highly anxious PPCS patient is starting the aerobic program. Which starting prescription does this section describe?",
        "options": [
          "Begin at 70–75% of HRt rather than 80%, favour a recumbent stationary bike, and run short fixed-duration sessions of 10–15 minutes at target HR with a hard HR cap.",
          "Prescribe maximum-intensity interval training to rapidly extinguish the fear through rapid exposure flooding.",
          "Discontinue exercise entirely and refer for psychology only, as fear-avoidance is entirely outside EP scope.",
          "Set no session cap and let the patient judge when to stop, so they build their own sense of control."
        ],
        "correctAnswer": 0,
        "explanation": "Start MORE conservatively than the BCTT might suggest. A deconditioned, anxious patient in a PPCS fear-avoidance spiral will often be destabilised by a dose that looks low on paper but is experienced as overwhelming. Consider beginning at 70–75% of HRt rather than 80%, or lower if anxiety around exercise is very high. Favour low-anxiety modalities: a recumbent stationary bike eliminates the orthostatic challenge of upright posture and lets the patient focus without fear of falling. Short, fixed-duration sessions with a hard HR cap: 10–15 minutes at target HR, same time every session. The cap is doing psychological work as well as physiological work: The hard cap removes the need for the patient to judge when to stop — removing one source of anxiety and one opportunity for catastrophising."
      },
      {
        "kind": "quick-check",
        "question": "A fear-avoidant PPCS patient keeps stopping sessions early at sub-threshold heart rates and reports that every previous attempt at exercise \"made them worse.\" Which approach does this section support?",
        "options": [
          "Directly confront the avoidance behaviour by requiring the patient to complete the full session regardless, and explain that their symptoms are not real.",
          "Roll with resistance rather than confronting it, supervise early sessions, and use the symptom and HR log as exposure evidence of safety — flagging psychology in parallel if the burden exceeds what graded exposure can address.",
          "Leave the psychological side alone — that is not the EP's job — and continue the program unchanged.",
          "Address the severe mood and anxiety with reassurance and graded exposure alone, without involving psychology."
        ],
        "correctAnswer": 1,
        "explanation": "Motivational interviewing principles apply directly: explore ambivalence about exercise, affirm past adherence, roll with resistance rather than confronting it, and elicit the patient's own reasons for wanting to recover. Directive confrontation of avoidance behaviour reliably increases it. Supervision does what argument cannot: supervised sessions — where the EP is present, monitoring HR and symptoms, calmly narrating the exertion — provide live evidence that the feared catastrophe does not occur. And the patient's own record becomes the argument: Self-monitoring turned into evidence for safety is one of the most powerful de-catastrophising tools available. Where the psychological burden clearly exceeds what graded exposure can address, refer: The EP and the psychologist are complementary, not alternatives."
      }
    ],
    "outside-scope": [
      {
        "kind": "quick-check",
        "question": "Which statement about Chronic Traumatic Encephalopathy (CTE) matches what this section establishes?",
        "options": [
          "CTE is the same condition as PPCS and can follow a single concussion.",
          "Proposed clinical criteria for CTE are clinically validated, so an AEP can apply them to confirm the diagnosis.",
          "CTE is a neuropathological diagnosis — defined by specific post-mortem brain tissue findings — that can currently ONLY be confirmed at autopsy, and there is no validated in-vivo diagnostic test.",
          "CTE only affects boxers and American footballers, not rugby players."
        ],
        "correctAnswer": 2,
        "explanation": "WHAT CTE IS: A neuropathological diagnosis — defined by specific post-mortem brain tissue findings — that can currently ONLY be confirmed at autopsy. There is no validated in-vivo diagnostic test. Proposed clinical criteria exist for research purposes only and are not clinically validated (McKee & Daneshvar, 2015). WHAT CTE IS NOT: It is NOT the same as PPCS. It is NOT caused by a single concussion. It is associated with repetitive head impacts over years — professional contact sport careers, military blast exposure — not with isolated sports concussions in the general population."
      },
      {
        "kind": "quick-check",
        "question": "Mid-session, a patient asks you directly: \"Could I have CTE?\" What is the correct EP response?",
        "options": [
          "Reassure them that, based on their current symptom profile, they do not have CTE.",
          "Confirm the concern — given their history, note CTE in the referral as a likely diagnosis.",
          "Tell them the concern is not relevant because CTE only affects other sports.",
          "Direct them to their GP or sports physician for an appropriate clinical conversation about risk, and make sure the referrer knows they have raised it."
        ],
        "correctAnswer": 3,
        "explanation": "EP SCOPE: You DO NOT diagnose CTE. You DO NOT reassure a patient that they do not have CTE. You DO NOT tell a patient they do have CTE. Any patient who asks directly — \"could I have CTE?\" — should be directed to their GP or sports physician for an appropriate clinical conversation about risk, requiring a full history, neurological assessment, and an understanding of current evidence limitations. The module gives the words: \"That is a really important question — it deserves a proper conversation with your doctor who can review your full history and the current evidence. I will make sure the referrer knows you have raised it.\" Route it. Do not attempt to reassure, and do not attempt to diagnose."
      }
    ]
  },
  "208": {
    "intro-check": [
      {
        "kind": "quick-check",
        "question": "Which of these sits inside the AEP's own documentation scope?",
        "options": [
          "Recording the concussion diagnosis as your own once your assessment supports it",
          "Documenting what you assessed, prescribed, observed and recommended",
          "Issuing clearance for return to contact or collision sport once the patient is symptom-free",
          "Filing the AI scribe's note straight away, since the AI is responsible for what it writes"
        ],
        "correctAnswer": 1,
        "explanation": "You document what you assessed, prescribed, observed and recommended. You do NOT record a concussion diagnosis as your own, and you do NOT issue clearance for return to contact or collision sport — that is a medical decision. Every document you produce should make this boundary visible to every reader. The AI option fails for a separate reason: An AI-generated draft is a starting point, not a finished clinical record. You must read, check and approve every note before it enters the record."
      }
    ],
    "why-records-matter": [
      {
        "kind": "matching",
        "title": "The Three Jobs of a Clinical Record",
        "instruction": "Match each job the clinical record performs to what it does.",
        "pairs": [
          {
            "id": "continuity",
            "left": "Job 1: Clinical Continuity",
            "right": "Enables you, or a covering colleague, to pick up the program at the next session and know exactly where the patient is",
            "explanation": "A contemporaneous record means you never reconstruct this from memory."
          },
          {
            "id": "communication",
            "left": "Job 2: Inter-Professional Communication",
            "right": "Gives the referring clinician the only data they have for the decisions that are theirs to make: when to review the patient, when to consider clearance, when to refer to another discipline",
            "explanation": "A well-constructed referrer letter or progress note is not administrative overhead; it is clinical input that directly affects patient care."
          },
          {
            "id": "medicolegal",
            "left": "Job 3: Medico-Legal Accountability",
            "right": "If your clinical management is ever reviewed — by a complaint, an insurer, a regulator, or a coroner — the clinical record is the primary source of evidence",
            "explanation": "Vague, delayed or inaccurate records make defensible practice indefensible. Contemporaneous, specific, objective, attributable records do the opposite."
          }
        ],
        "leftLabel": "Job",
        "rightLabel": "What it does"
      },
      {
        "kind": "quick-check",
        "question": "An AEP manages a concussion patient well, but the notes are delayed and vague. The management is later reviewed. What follows?",
        "options": [
          "Nothing — the formal record can wait until there is more to report",
          "Vague, delayed or inaccurate records make defensible practice indefensible",
          "The program can be reconstructed from memory at the review",
          "Nothing clinical — documentation is a bureaucratic burden placed on top of clinical practice"
        ],
        "correctAnswer": 1,
        "explanation": "\"If it is not documented, for practical purposes it did not happen.\" This is the medico-legal reality. Your clinical skill and judgment are invisible to any reviewer who was not in the room — only the record speaks for what you did and why. Vague, delayed or inaccurate records make defensible practice indefensible. Contemporaneous, specific, objective, attributable records do the opposite. Nor is this an add-on to the work: Good documentation is not a bureaucratic burden placed on top of clinical practice."
      }
    ],
    "record-within-scope": [
      {
        "kind": "multi-select",
        "question": "Which of the following does the AEP record as their own conclusion? (Select all that apply)",
        "options": [
          "Exercise-tolerance findings from graded exertion testing: the HRt, the symptom response at each protocol stage, the modality used",
          "Session data: HR achieved, symptom score before and after, RPE, duration and adherence",
          "The concussion diagnosis",
          "The prescription and its rationale: the training band derived from HRt, the autonomic-reconditioning rationale in plain clinical language",
          "Medical clearance for return to contact or sport",
          "How long recovery will take and the likelihood of persistent symptoms"
        ],
        "correctAnswers": [
          0,
          1,
          3
        ],
        "explanation": "What you record: Exercise-tolerance findings from graded exertion testing: the HRt, the symptom response at each protocol stage, the modality used. Session data: HR achieved, symptom score before and after, RPE, duration and adherence. Your prescription and its rationale: the training band derived from HRt, the autonomic-reconditioning rationale in plain clinical language. What you do NOT record as your own: The concussion diagnosis — that conclusion belongs to the diagnosing clinician. Medical clearance for return to contact or sport — that decision sits with a medical practitioner. You recommend medical review; you do not grant clearance. Prognosis beyond your evidence — do not speculate about how long recovery will take or predict the likelihood of persistent symptoms."
      },
      {
        "kind": "quick-check",
        "question": "A draft recommendation line reads: \"Patient cleared for return to contact once training resumes.\" Applying the framing test, what should happen?",
        "options": [
          "File it — the patient has been symptom-free for two weeks and says they feel great",
          "Rewrite it — it could be read as clearance for contact",
          "File it with a disclaimer noting the EP is not responsible for any subsequent contact injury",
          "Swap \"cleared for\" to \"the patient has\", so it reads as a finding rather than a decision"
        ],
        "correctAnswer": 1,
        "explanation": "Before finalising any documentation, run this test on your interpretation and recommendation sentences: Could this sentence be read as a diagnosis? Could it be read as clearance for contact? If yes to either, rewrite it. An EP record should be readable by any clinician, insurer or regulator without creating ambiguity about who made the diagnosis and who holds the clearance decision. Note that \"the patient has\" is not the fix — the language markers of a scope-compliant record are \"findings consistent with\" (not \"the patient has\") and \"suitable for\" (not \"cleared for\"). These are not hedging phrases — they are accurate descriptions of what your role authorises you to conclude. And a disclaimer changes nothing: Granting clearance with or without a disclaimer is outside scope — a disclaimer does not transfer a scope boundary."
      }
    ],
    "doc-1-assessment-record": [
      {
        "kind": "quick-check",
        "question": "The assessment record establishes three anchors that every later document references. Which set is correct?",
        "options": [
          "The HRt, the baseline PCSS, and the referring clinician's working diagnosis",
          "The training band, the stop rule, and the escalation criteria",
          "The consent method, the modality used, and the RPE at threshold",
          "The referral date, the file number, and the date of birth"
        ],
        "correctAnswer": 0,
        "explanation": "The assessment record establishes three anchors every future document references: (1) the HRt — the prescription origin; (2) the baseline PCSS — the symptom yardstick; (3) the referring clinician's working diagnosis — the clinical authority on which the program rests. Scope-correct language (\"findings consistent with\", \"suitable for\") is non-negotiable from the first document. That is why the timing matters too: It is completed on the day of assessment — not summarised retrospectively. Every subsequent session note and progress letter measures against the baseline it establishes."
      },
      {
        "kind": "multi-select",
        "question": "The worked assessment record documents consent. Which elements belong in that consent entry? (Select all that apply)",
        "options": [
          "Consent to the assessment and to the exercise program",
          "Consent to communication of progress with the practitioners named by the patient",
          "The method of consent — verbal consent and signed consent form filed",
          "Consent to email a copy of the progress letter to the patient's employer so they can plan the return-to-work schedule",
          "The patient's agreement that the EP may issue return-to-contact clearance once symptoms settle"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "CONSENT: Jordan Taylor consented on 19 June 2026 to the assessment, to the exercise program, and to communication of progress with Dr Mitchell and Coastal Physiotherapy (both named by the patient). Method: verbal consent and signed consent form filed. Patient informed that exercise-tolerance findings do not constitute a concussion diagnosis. Note what consent cannot create: Medical clearance for return to contact or sport — that decision sits with a medical practitioner. And disclosure beyond the named practitioners is a separate question — Communicating with an employer, insurer or coach requires specific, separate consent (OAIC, n.d.)."
      }
    ],
    "doc-2-tracking-sheet": [
      {
        "kind": "multi-select",
        "question": "Which items must the tracking sheet capture for every session? (Select all that apply)",
        "options": [
          "HR achieved: average and peak, and whether the cap was respected",
          "Symptom score before and after the session, and any provoked symptoms during it",
          "Adherence for home sessions since the last contact",
          "A predicted return-to-sport date based on the current recovery trajectory",
          "The EP's own diagnosis for the episode"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "Date and session number; supervised (clinic) or home. Modality and prescribed target (HR band, duration). HR achieved: average and peak, and whether the cap was respected. Symptom score before and after the session, and any provoked symptoms during it. RPE (Borg 6–20 or 0–10). Duration completed versus prescribed. Adherence for home sessions since the last contact. A free-text note: tolerance, any regression or progression decision and the reason, relevant context (poor sleep, high cognitive load that day). What does not go in: Prognosis beyond your evidence — do not speculate about how long recovery will take or predict the likelihood of persistent symptoms. The concussion diagnosis — that conclusion belongs to the diagnosing clinician."
      },
      {
        "kind": "quick-check",
        "question": "Where is the completed tracking sheet stored, and how is an error in it corrected?",
        "options": [
          "In the clinic's secure, access-controlled record system; correct errors by a single dated, initialled amendment that leaves the original legible",
          "In a personal spreadsheet, provided only the treating AEP can open the file",
          "In an unencrypted cloud folder, so the referring practitioner can read it directly",
          "Anywhere convenient; correct errors by deleting and overwriting the original entry so the record reads cleanly"
        ],
        "correctAnswer": 0,
        "explanation": "The tracking sheet is health information under the Australian Privacy Principles (APP 11). Store it in your clinic's secure, access-controlled record system — not in an unsecured personal spreadsheet or unencrypted cloud folder. Entries are contemporaneous. Correct errors by a single dated, initialled amendment that leaves the original legible — never by deletion or overwriting."
      }
    ],
    "doc-3-referrer-letter": [
      {
        "kind": "ordering",
        "title": "The Five-Element Referrer Letter",
        "instruction": "Put the five elements of the EP-to-referrer communication letter into the order the module specifies.",
        "items": [
          {
            "id": "findings",
            "label": "FINDINGS",
            "rationale": "Thank you for referring Jordan Taylor. On treadmill testing on 19 June 2026, Jordan reached a symptom threshold at 148 bpm (PCSS rose from 2/10 to 5/10 at 10 min 08 sec)."
          },
          {
            "id": "prescription",
            "label": "PRESCRIPTION AND RATIONALE",
            "rationale": "I have commenced sub-symptom-threshold aerobic reconditioning: stationary bike, 20 minutes daily, target HR band 118–133 bpm (80–90% of HRt 148 bpm)."
          },
          {
            "id": "progress",
            "label": "PROGRESS",
            "rationale": "Four sessions completed to date (two supervised, two home)."
          },
          {
            "id": "recommendation",
            "label": "RECOMMENDATION AND HAND-BACK",
            "rationale": "I recommend medical review to consider clearance for return-to-contact, which sits outside my scope as an exercise physiologist."
          },
          {
            "id": "signoff",
            "label": "SIGN-OFF",
            "rationale": "Jordan Chen — Accredited Exercise Physiologist (ESSA) — Active Recovery Physiology."
          }
        ],
        "correctOrder": [
          "findings",
          "prescription",
          "progress",
          "recommendation",
          "signoff"
        ],
        "explanation": "Its structure is always: FINDINGS → PRESCRIPTION AND RATIONALE → PROGRESS → RECOMMENDATION AND HAND-BACK → SIGN-OFF. The final sentence must name the next medical decision and return it to the referring practitioner. That closing sentence does three things in sequence: (1) it signals the patient is improving; (2) it names the next clinical decision; (3) it explicitly hands that decision back to the medical practitioner. The five-element structure — FINDINGS, PRESCRIPTION AND RATIONALE, PROGRESS, RECOMMENDATION AND HAND-BACK, SIGN-OFF — is the template for every letter, initial or milestone."
      },
      {
        "kind": "matching",
        "title": "Which Letter, When",
        "instruction": "Match each letter in the referrer-communication sequence to the point at which it is sent.",
        "pairs": [
          {
            "id": "initial",
            "left": "Initial letter",
            "right": "After the first assessment (BCTT + baseline measures)"
          },
          {
            "id": "milestone",
            "left": "Milestone letters",
            "right": "At Week 2 re-test, when HRt changes substantially, when stage progressions occur, or on any regression"
          },
          {
            "id": "change",
            "left": "Change-in-status letters",
            "right": "Any time a red flag appears, the patient regresses unexpectedly, or you decide to pause the program"
          },
          {
            "id": "discharge",
            "left": "Discharge letter",
            "right": "When the patient completes EP-supervised reconditioning and is handed back for final clearance review"
          }
        ],
        "leftLabel": "Letter",
        "rightLabel": "When to send"
      },
      {
        "kind": "quick-check",
        "question": "A milestone letter is ready to go. Which sending practice is compliant?",
        "options": [
          "Send it to the named practitioners the patient has agreed to, with consent obtained and recorded beforehand",
          "Send it to the referring GP and email a copy to the patient's employer so they can plan the return-to-work schedule",
          "Send it to any registered health professional involved in the case — registration automatically authorises disclosure",
          "Send it to a third party after partially anonymising it, which reduces the privacy obligation"
        ],
        "correctAnswer": 0,
        "explanation": "Consent before sending. Send only to the named practitioners the patient has agreed to. Disclosing health information to third parties without consent breaches APP 6. Document the consent: \"Patient consented on [date] to communication with Dr Mitchell and Coastal Physiotherapy — consent record on file.\" Communicating with the named referrer is expected and consented. Communicating with an employer, insurer or coach requires specific, separate consent (OAIC, n.d.). APP 6 is the most commonly breached — sending a letter to a third party without documented patient consent."
      }
    ],
    "doc-4-progress-note-and-ai": [
      {
        "kind": "quick-check",
        "question": "How does the return-to-activity progress note differ from a clearance document?",
        "options": [
          "It certifies fitness for contact once the patient has been symptom-free long enough",
          "It documents what has been tolerated under your supervision and recommends the next step — it does not certify fitness for contact",
          "It grants clearance provided a disclaimer noting the EP is not responsible for any subsequent contact injury is attached",
          "It records the EP's own diagnosis alongside the reconditioning stages achieved"
        ],
        "correctAnswer": 1,
        "explanation": "The return-to-activity progress note is the EP-scope analogue of a clearance document — with one essential difference: it documents what has been tolerated under your supervision and recommends the next step. It does not certify fitness for contact. It documents supervised non-contact reconditioning stages achieved, with objective evidence for each. Issues a recommendation — never a clearance. SCOPE STATEMENT: This note documents supervised non-contact graded reconditioning within exercise-physiology scope. Clearance for return to full-contact participation is a medical decision and is recommended via the referring/treating medical practitioner. This note does not constitute clearance documentation."
      },
      {
        "kind": "multi-select",
        "question": "An AEP is adopting an AI clinical-scribe tool. Which statements match the module's tool-neutral principles? (Select all that apply)",
        "options": [
          "An AI-generated draft is a starting point, not a finished clinical record — you must read, check and approve every note before it enters the record",
          "If the tool records or transmits the consultation, the patient must explicitly consent before the session begins",
          "A tool that sends audio to an offshore server, or retains recordings after the consultation, may trigger APP 8 (cross-border disclosure) obligations",
          "Once the tool generates the note, accountability for its accuracy sits with the tool rather than the clinician",
          "The patient's presence at the session is consent to audio recording and data transmission"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "YOU REMAIN RESPONSIBLE: An AI-generated draft is a starting point, not a finished clinical record. You must read, check and approve every note before it enters the record. Filing an AI draft unreviewed is filing a note you have not authored. CONSENT IS MANDATORY: If the tool records or transmits the consultation, the patient must explicitly consent before the session begins. Presence at the session is not consent to audio recording or data transmission. CHECK WHERE DATA GOES: A tool that sends audio to an offshore server, or retains recordings after the consultation, may trigger APP 8 (cross-border disclosure) obligations. And the reason review is non-negotiable: Scribe tools can fabricate plausible numbers, mis-hear HRt values (a transposed heart rate changes the prescription), or replace the precise scope language that must stay accurate. Every note that enters the clinical record is yours — the AI drafted it, you authored it."
      },
      {
        "kind": "scenario",
        "title": "The Letter Jordan Asks For",
        "patientSummary": "Jordan Taylor has completed supervised non-contact graded reconditioning with you. Week 2 BCTT (23 June 2026): HRt 161 bpm — up from 148 bpm at assessment. PCSS total 7/22, down from 12/22 at assessment. Adherence 10/10 prescribed sessions (4 supervised, 6 home). Jordan is now tolerating Stage 4 (non-contact training drills) symptom-free and asks you for a letter confirming a return to full-contact football.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "Jordan asks you to write a letter confirming clearance to return to full-contact football. What do you produce?",
            "clinicalData": [
              "Week 2 BCTT (23 June 2026): HRt 161 bpm — up from 148 bpm at assessment",
              "PCSS total: 7/22 (down from 12/22 at assessment)",
              "Adherence: 10/10 prescribed sessions (4 supervised, 6 home)",
              "Tolerating Stage 4 (non-contact training drills) symptom-free"
            ],
            "choices": [
              {
                "label": "Write the clearance letter — the reconditioning data supports it",
                "feedback": "You recommend medical review; you do not grant clearance.",
                "nextStepId": "outcome-clearance"
              },
              {
                "label": "Write a progress note documenting the supervised non-contact stages achieved, and recommend medical review for consideration of return-to-contact clearance",
                "feedback": "Issues a recommendation — never a clearance.",
                "nextStepId": "step-2"
              },
              {
                "label": "Write the clearance letter with a disclaimer noting the EP is not responsible for any subsequent contact injury",
                "feedback": "A disclaimer does not transfer a scope boundary.",
                "nextStepId": "outcome-disclaimer"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You draft the progress note. Jordan then mentions that their coach wants a copy to plan training, and asks you to email it across. The consent on file names Dr Mitchell and Coastal Physiotherapy.",
            "clinicalData": [
              "Consent on file: communication of progress with Dr Mitchell and Coastal Physiotherapy (both named by the patient)",
              "The progress note is read by the patient, sometimes by a coach, employer or insurer (with explicit consent), and by the referring clinician"
            ],
            "choices": [
              {
                "label": "Email the coach a copy — it is a progress note, not a clearance document",
                "feedback": "Disclosing health information to third parties without consent breaches APP 6.",
                "nextStepId": "outcome-app6"
              },
              {
                "label": "Send only to the named practitioners on the consent record, and obtain specific, separate consent before any disclosure to the coach",
                "feedback": "Communicating with an employer, insurer or coach requires specific, separate consent.",
                "nextStepId": "outcome-optimal"
              }
            ]
          },
          {
            "id": "outcome-clearance",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "Clearance is not yours to give",
              "explanation": "Medical clearance for return to contact or sport — that decision sits with a medical practitioner. You recommend medical review; you do not grant clearance.",
              "clinicalReasoning": "Clearance for return to full-contact participation is a medical decision and is recommended via the referring/treating medical practitioner. This note does not constitute clearance documentation."
            }
          },
          {
            "id": "outcome-disclaimer",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "A disclaimer does not move the boundary",
              "explanation": "Return-to-contact clearance is a medical decision outside AEP scope. Granting clearance with or without a disclaimer is outside scope — a disclaimer does not transfer a scope boundary.",
              "clinicalReasoning": "The EP documents the exercise-tolerance and reconditioning evidence, then explicitly recommends medical review."
            }
          },
          {
            "id": "outcome-app6",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "suboptimal",
              "title": "The document was right; the disclosure was not",
              "explanation": "Send only to the named practitioners the patient has agreed to. Disclosing health information to third parties without consent breaches APP 6.",
              "clinicalReasoning": "Communicating with the named referrer is expected and consented. Communicating with an employer, insurer or coach requires specific, separate consent (OAIC, n.d.)."
            }
          },
          {
            "id": "outcome-optimal",
            "narrative": "",
            "choices": [],
            "isOutcome": true,
            "outcome": {
              "type": "optimal",
              "title": "Recommend, report, and disclose only where consented",
              "explanation": "When Stage 4 (non-contact training drills) tolerated symptom-free, recommend medical review for consideration of return-to-contact clearance. Send only to the named practitioners the patient has agreed to.",
              "clinicalReasoning": "SCOPE STATEMENT: This note documents supervised non-contact graded reconditioning within exercise-physiology scope. Clearance for return to full-contact participation is a medical decision and is recommended via the referring/treating medical practitioner. This note does not constitute clearance documentation."
            }
          }
        ]
      }
    ],
    "privacy-and-corrections": [
      {
        "kind": "matching",
        "title": "The Five APPs That Govern EP Documentation",
        "instruction": "Match each Australian Privacy Principle to the obligation it places on EP documentation practice.",
        "pairs": [
          {
            "id": "app3",
            "left": "APP 3 — Solicited collection",
            "right": "Collect only the health information you need to provide the exercise program, and only from the patient or their guardian"
          },
          {
            "id": "app5",
            "left": "APP 5 — Notification of collection",
            "right": "At first contact, tell the patient (or guardian for a minor) what health information you collect, why, how it is stored, and to whom it may be disclosed"
          },
          {
            "id": "app6",
            "left": "APP 6 — Use and disclosure",
            "right": "Use and disclose health information only for the primary purpose for which it was collected, a directly related secondary purpose the patient would reasonably expect, or with explicit consent",
            "explanation": "Communicating with the named referrer is expected and consented. Communicating with an employer, insurer or coach requires specific, separate consent (OAIC, n.d.)."
          },
          {
            "id": "app8",
            "left": "APP 8 — Cross-border disclosure",
            "right": "If you use cloud-based systems or AI tools with offshore servers, you remain responsible for ensuring the overseas recipient handles the information consistently with the APPs"
          },
          {
            "id": "app11",
            "left": "APP 11 — Security",
            "right": "Take reasonable steps to protect health information from misuse, interference, loss, unauthorised access, modification or disclosure",
            "explanation": "In practice: clinic-grade, access-controlled record system; no patient data on unsecured personal devices or unencrypted cloud folders (OAIC, n.d.)."
          }
        ],
        "leftLabel": "APP",
        "rightLabel": "Obligation"
      },
      {
        "kind": "quick-check",
        "question": "An AEP finds a session symptom score in a three-week-old note that looks wrong. Who decides whether a correction is made, and how is it made?",
        "options": [
          "The patient — ask them to confirm the correct score, then amend the record on their recollection",
          "The clinician — make a single, clearly dated, initialled amendment that describes the error and provides the correction, leaving the original entry legible",
          "No one — records cannot be altered once filed, regardless of the error",
          "Whoever files the replacement document, provided the original is removed so the record reads cleanly"
        ],
        "correctAnswer": 1,
        "explanation": "CORRECT APPROACH: Make a single, clearly dated, initialled amendment that describes the error and provides the correction — leaving the original entry legible. Example: \"Amendment 24/06/2026 JC: Session 3 symptom score incorrectly recorded as 4/10 — should read 2/10. Original entry legible above.\" WRONG APPROACH: Deleting the original entry, overwriting it, or creating a replacement document without disclosure. Doing so destroys the audit trail and breaches record-keeping standards — and may constitute falsification of a health record. Never ask the patient to decide whether a correction should be made — the record is a contemporaneous clinical account, and you are responsible for its accuracy at the time of entry. Correct errors that you discover; leave accurate entries intact; document every correction transparently."
      },
      {
        "kind": "multi-select",
        "question": "A 15-year-old is treated in 2026. Which retention statements match the module's guidance? (Select all that apply)",
        "options": [
          "Adults: retain health records for a minimum of 7 years from the date of the last entry under most Australian state and territory health-records legislation",
          "Children and adolescents: retain records until the patient turns 25 years of age, or for 7 years from the date of the last entry — whichever period is longer",
          "Records documenting multiple concussions may warrant retention even beyond the legal minimum",
          "For this 15-year-old, the standard 7-year adult period is the operative one",
          "Paediatric health records may not be destroyed under any circumstance"
        ],
        "correctAnswers": [
          0,
          1,
          2
        ],
        "explanation": "Adults: retain health records for a minimum of 7 years from the date of the last entry under most Australian state and territory health-records legislation. Children and adolescents: retain records until the patient turns 25 years of age, or for 7 years from the date of the last entry — whichever period is longer. A 15-year-old treated in 2026 means \"until age 25\" = 2036, which exceeds the standard 7-year adult period. Serial concussion history: even beyond the legal minimum, consider retaining records that document multiple concussions — these may be relevant to medicolegal proceedings years after the final clinical contact."
      }
    ]
  }
}
