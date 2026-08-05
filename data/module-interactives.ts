import type { SectionInteractive } from './modules'

/**
 * The flagship (CCM) course's interactive elements, as DATA.
 *
 * WHY THIS FILE EXISTS. These 152 widgets used to be hardcoded JSX in
 * components/course/SectionInteractiveElements.tsx, which app/modules/[id]
 * imported statically. That shipped every answer key and every scenario's
 * clinical reasoning in a PUBLIC, unauthenticated client chunk — an anonymous
 * visitor could read the whole paid course's marking scheme. Authored here
 * instead, the specs are attached to Section.interactives in data/modules.ts
 * and travel inside the ENTITLEMENT-GATED module payload
 * (/api/modules/[id] -> lib/module-access.ts), rendering through
 * components/course/SectionDataInteractives.tsx. See the SectionInteractive
 * doc comment in data/modules.ts.
 *
 * SERVER ONLY. Nothing in a client component may import this file, directly or
 * transitively — that would put the answer keys straight back in a public
 * chunk. tests/course-answer-key-exposure.test.ts enforces that.
 *
 * ORDERING IS CONTENT. Specs render in array order, immediately after the
 * section's prose. This file is a byte-for-byte migration of the JSX that
 * preceded it: same widgets, same questions, same explanations, same order.
 */
export const MODULE_INTERACTIVES: Record<number, Record<string, SectionInteractive[]>> = {
  "1": {
    "myths-intro": [
      {
        "kind": "quick-check",
        "question": "What percentage of concussions involve loss of consciousness?",
        "options": [
          "About 50%",
          "About 30%",
          "About 10%",
          "Nearly all"
        ],
        "correctAnswer": 2,
        "explanation": "Only about 10% of concussions involve loss of consciousness. LOC does not correlate with injury severity or recovery time — a concussion without LOC can be just as serious as one with LOC."
      },
      {
        "kind": "quick-check",
        "question": "A rugby player has a normal CT scan after a head impact. What can you conclude?",
        "options": [
          "No concussion occurred",
          "Structural damage has been ruled out, but concussion is still possible",
          "An MRI is needed to confirm",
          "The player can return to the field"
        ],
        "correctAnswer": 1,
        "explanation": "A normal CT scan rules out structural damage (bleeding, fractures) but does NOT rule out concussion. Concussion is a functional disturbance — diagnosis relies on clinical assessment, not imaging."
      },
      {
        "kind": "quick-check",
        "question": "A 14-year-old and a 30-year-old sustain identical concussions. Who typically recovers faster?",
        "options": [
          "The 14-year-old (younger brain heals faster)",
          "The 30-year-old (adult brains are more resilient)",
          "Recovery time is identical regardless of age",
          "It depends entirely on fitness level"
        ],
        "correctAnswer": 1,
        "explanation": "Adults typically recover faster (10-14 days) than children (4+ weeks). The developing brain has higher metabolic demands and a longer period of vulnerability to neurometabolic disruption."
      },
      {
        "kind": "quick-check",
        "question": "Which of these populations has the HIGHEST rate of concussion-related emergency visits?",
        "options": [
          "Professional athletes",
          "Children in contact sports",
          "Older adults (falls)",
          "Military personnel"
        ],
        "correctAnswer": 2,
        "explanation": "Falls account for over 60% of TBIs requiring hospitalisation in older adults. Motor vehicle accidents, workplace injuries, and recreational activities also cause significant concussions outside of sport."
      },
      {
        "kind": "quick-check",
        "question": "Current evidence recommends which post-concussion rest protocol?",
        "options": [
          "Complete bed rest for 2 weeks",
          "24-48 hours relative rest, then gradual return to activity",
          "No rest — return to normal immediately",
          "Complete rest until all symptoms resolve"
        ],
        "correctAnswer": 1,
        "explanation": "Current evidence (Amsterdam 2022 Consensus) recommends 24-48 hours of relative rest followed by gradual return to activity. Prolonged strict rest beyond 72 hours is associated with increased symptom burden and delayed recovery."
      },
      {
        "kind": "quick-check",
        "question": "How do helmets reduce concussion risk?",
        "options": [
          "They prevent rotational forces that cause concussion",
          "They absorb all impact energy before it reaches the brain",
          "They reduce skull fracture risk but cannot prevent concussion",
          "They are equally effective against all concussion mechanisms"
        ],
        "correctAnswer": 2,
        "explanation": "Helmets reduce skull fracture and focal impact injuries but cannot prevent concussion. Concussion primarily results from rotational/shearing forces on the brain, which protective equipment cannot eliminate."
      },
      {
        "kind": "quick-check",
        "question": "A patient's concussion symptoms have fully resolved after 10 days. What is the safest next step?",
        "options": [
          "Clear them for full return to sport immediately",
          "Begin a graduated return-to-activity protocol with medical oversight",
          "Wait another 2 weeks of rest before any activity",
          "Order an MRI to confirm recovery"
        ],
        "correctAnswer": 1,
        "explanation": "Even when symptoms resolve, the brain may still be in a vulnerable metabolic state. Medical clearance through graduated return-to-activity protocols (minimum 24 hours per stage) is essential to prevent re-injury."
      },
      {
        "kind": "quick-check",
        "question": "Which symptom domains does concussion typically affect?",
        "options": [
          "Only cognitive (memory, concentration)",
          "Cognitive and physical only",
          "Cognitive, emotional, physical, and sleep",
          "Only physical (headache, dizziness)"
        ],
        "correctAnswer": 2,
        "explanation": "Concussion affects multiple domains: cognitive (memory, concentration), emotional (mood changes, irritability), physical (headaches, dizziness, nausea), and sleep patterns. The neurometabolic cascade impacts the entire brain."
      },
      {
        "kind": "quick-check",
        "question": "A footballer heads the ball and feels dizzy but doesn't hit another player. Can this cause a concussion?",
        "options": [
          "No — concussion requires direct head-to-head contact",
          "No — heading is too low-force to cause concussion",
          "Yes — rotational forces from heading can cause concussion without direct contact",
          "Only if they have a history of prior concussions"
        ],
        "correctAnswer": 2,
        "explanation": "Direct contact is NOT required for concussion. Whiplash-type mechanisms, headers, and blast injuries can transmit rotational forces to the brain through acceleration/deceleration. Any mechanism that moves the brain within the skull can cause concussion."
      },
      {
        "kind": "quick-check",
        "question": "What is the PRIMARY reason standard imaging appears normal after a concussion?",
        "options": [
          "The injury is too small to detect",
          "Concussion is a functional (metabolic) disturbance, not a structural one",
          "CT and MRI technology is outdated",
          "The scan was done too early after injury"
        ],
        "correctAnswer": 1,
        "explanation": "Concussion is fundamentally a functional/metabolic brain injury — the neurometabolic cascade disrupts cellular function without causing visible structural damage. Advanced research imaging (fMRI, DTI) can detect these functional changes, but they are not used in routine clinical practice."
      }
    ],
    "introduction": [
      {
        "kind": "insight",
        "type": "tip",
        "title": "Clinical Pearl",
        "content": "Rotational forces are MORE damaging than linear forces. This is why some 'minor' impacts can cause significant symptoms while major linear impacts may not."
      },
      {
        "kind": "scenario",
        "title": "Is This a Concussion?",
        "patientSummary": "A 22-year-old rugby union player takes a legal shoulder-to-chest tackle. He doesn't hit the ground but stumbles, looks confused for 10 seconds, then says he's fine and wants to continue playing. No loss of consciousness. No visible head contact.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "Based on what you know, could this be a concussion?",
            "clinicalData": [
              "Mechanism: shoulder-to-chest tackle (no visible head contact)",
              "Observed: stumbled, looked confused for ~10 seconds",
              "No loss of consciousness",
              "Player self-reports feeling fine"
            ],
            "choices": [
              {
                "label": "Yes — concussion is possible",
                "nextStepId": "step-2"
              },
              {
                "label": "No — there was no head contact",
                "nextStepId": "outcome-no-contact"
              },
              {
                "label": "Need more information",
                "nextStepId": "outcome-more-info"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "What should happen next?",
            "clinicalData": [
              "Suspected concussion based on observed confusion after forceful tackle",
              "No red flags (no LOC, no seizure, no focal deficit)",
              "Player wants to continue playing"
            ],
            "choices": [
              {
                "label": "Remove from play and assess with SCAT6",
                "nextStepId": "step-3"
              },
              {
                "label": "Let him continue if symptoms resolve in 5 minutes",
                "nextStepId": "outcome-continue"
              },
              {
                "label": "Send directly to emergency department",
                "nextStepId": "outcome-ed"
              }
            ]
          },
          {
            "id": "step-3",
            "narrative": "If the SCAT6 is normal 20 minutes later, can the athlete return to play today?",
            "clinicalData": [
              "SCAT6 assessment completed — results within normal limits",
              "20 minutes since removal from play",
              "Player asymptomatic and eager to return"
            ],
            "choices": [
              {
                "label": "Yes — normal SCAT6 clears the athlete",
                "nextStepId": "outcome-cleared"
              },
              {
                "label": "No — same-day return is never permitted after suspected concussion",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Only if a doctor approves",
                "nextStepId": "outcome-doctor"
              }
            ]
          },
          {
            "id": "outcome-no-contact",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Incorrect — Head Contact Not Required",
              "explanation": "Direct head contact is NOT required for concussion. Rotational and acceleration-deceleration forces transmitted through the body can cause concussion — this is a key mechanism in tackles and whiplash injuries.",
              "clinicalReasoning": "The shoulder-to-chest tackle transmits rapid deceleration forces through the cervical spine to the head, producing rotational acceleration of the brain within the skull. The observed confusion is a clear sign of neurological dysfunction consistent with concussion."
            }
          },
          {
            "id": "outcome-more-info",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Caution Is Reasonable — But Action Is Needed Now",
              "explanation": "While gathering more information is understandable, the observed confusion after a forceful tackle already meets the threshold for suspected concussion. Direct head contact is NOT required — rotational and acceleration-deceleration forces transmitted through the body can cause concussion.",
              "clinicalReasoning": "The Amsterdam 2022 Consensus is clear: \"If in doubt, sit them out.\" Visible confusion after a forceful mechanism is sufficient to trigger the concussion protocol. Waiting for more information delays removal from play."
            }
          },
          {
            "id": "outcome-continue",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Against Guidelines",
              "explanation": "Any athlete with suspected concussion must be immediately and permanently removed from play on that day. A structured assessment like the SCAT6 should follow.",
              "clinicalReasoning": "Allowing continued play with suspected concussion risks second impact syndrome and prolonged recovery. Symptoms can fluctuate — a 5-minute window of symptom resolution does not indicate recovery."
            }
          },
          {
            "id": "outcome-ed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Overly Cautious",
              "explanation": "Any athlete with suspected concussion must be immediately and permanently removed from play on that day. A structured assessment like the SCAT6 should follow. Emergency department referral is indicated for red flags (prolonged LOC, seizure, worsening symptoms, focal deficits) — not for uncomplicated suspected concussion.",
              "clinicalReasoning": "Remove and assess first. Emergency referral is reserved for cases with red flag features such as LOC >1 minute, seizures, worsening headache/vomiting, focal neurological signs, or GCS <15."
            }
          },
          {
            "id": "outcome-cleared",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Normal SCAT6 Does Not Clear for Same-Day Return",
              "explanation": "Current consensus (Amsterdam 2022) states that an athlete with suspected concussion must NOT return to play on the same day, regardless of assessment results. Symptoms can evolve over hours.",
              "clinicalReasoning": "SCAT6 is a screening tool, not a diagnostic clearance instrument. A normal SCAT6 result does not rule out concussion — symptoms and cognitive deficits may emerge or worsen hours after the initial injury."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Best Practice — No Same-Day Return",
              "explanation": "Correct. Current consensus (Amsterdam 2022) states that an athlete with suspected concussion must NOT return to play on the same day, regardless of assessment results. Symptoms can evolve over hours.",
              "clinicalReasoning": "The \"no same-day return\" rule is non-negotiable when concussion is suspected. The neurometabolic cascade is already underway and the brain is vulnerable. A normal SCAT6 at 20 minutes does not indicate full recovery — serial monitoring and a graduated return-to-play protocol are required."
            }
          },
          {
            "id": "outcome-doctor",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Doctor Approval Is Not Sufficient for Same-Day Return",
              "explanation": "Current consensus (Amsterdam 2022) states that an athlete with suspected concussion must NOT return to play on the same day, regardless of assessment results. Symptoms can evolve over hours.",
              "clinicalReasoning": "Even with a doctor present, same-day return to play after suspected concussion is not permitted under current international guidelines. The only narrow exception exists in some professional sport protocols with immediate specialist assessment — but this does not apply to standard community or amateur sport settings."
            }
          }
        ]
      }
    ],
    "mechanism-rotational": [
      {
        "kind": "key-concept",
        "title": "Rotational vs Linear Forces",
        "points": [
          "Rotational forces are the most damaging — they shear axons at grey-white matter junctions",
          "Linear forces alone rarely cause concussion; most injuries combine both force types",
          "Direct head contact is NOT required — whiplash and body impacts can transmit rotational force to the brain",
          "Threshold varies by individual: rotational >4500 rad/s², linear >60-100g"
        ]
      },
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: Direct head contact is required for concussion to occur",
        "options": [
          "True - concussion requires direct impact",
          "False - rotational forces alone can cause concussion without contact"
        ],
        "correctAnswer": 1,
        "explanation": "Rotational acceleration can cause concussion even without direct head contact. Whiplash injuries, rapid rotation from tackles, or acceleration-deceleration in MVAs can all produce concussion through rotational forces alone."
      }
    ],
    "neuroanatomy-overview": [
      {
        "kind": "insight",
        "type": "insight",
        "title": "Free Brain Anatomy Resource",
        "content": "Interactive 3D brain anatomy resource: https://www.innerbody.com/image/nerv02.html - Use this to visualize the structures discussed in this section."
      },
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: The frontal lobe controls only motor functions",
        "options": [
          "True - frontal lobe is purely motor",
          "False - frontal lobe also controls executive function, personality, and decision-making"
        ],
        "correctAnswer": 1,
        "explanation": "The frontal lobe includes both the prefrontal cortex (executive function, personality, emotional regulation) and the motor cortex (voluntary movement control). Concussion affecting the frontal lobe can cause cognitive and behavioral changes, not just motor deficits."
      }
    ],
    "mechanism-coup-contrecoup": [
      {
        "kind": "quick-check",
        "question": "In a coup-contrecoup injury, which side typically sustains MORE severe damage?",
        "options": [
          "The coup (impact) site — direct force is always worse",
          "The contrecoup (opposite) site — rebound forces can be more damaging",
          "Both sides are always equally damaged",
          "Neither — coup-contrecoup only affects the skull, not the brain"
        ],
        "correctAnswer": 1,
        "explanation": "Contrecoup injuries can be more severe than coup injuries. When the brain rebounds to strike the opposite skull wall, the negative-to-positive pressure change creates cavitation and tissue damage. The frontal and temporal lobes are particularly vulnerable to contrecoup damage from occipital impacts."
      },
      {
        "kind": "scenario",
        "title": "Sideline Mechanism Assessment",
        "patientSummary": "17-year-old rugby player struck on the right side of the head by an opponent's knee during a tackle. Did not lose consciousness but appeared dazed.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "You witness the collision from the sideline. The player gets up slowly, holds their head, and starts walking toward the bench. How do you proceed?",
            "choices": [
              {
                "label": "Wait to see if symptoms develop before intervening",
                "nextStepId": "outcome-delayed"
              },
              {
                "label": "Immediately remove from play and begin structured sideline assessment",
                "nextStepId": "step-2"
              },
              {
                "label": "Ask the coach if the player seems okay to continue",
                "nextStepId": "outcome-deferred"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You begin your sideline assessment. The player says \"I'm fine, I just got my bell rung.\" What is your primary concern regarding the mechanism?",
            "clinicalData": [
              "Mechanism: Lateral head impact (knee to right temporal region)",
              "Observed: Dazed appearance, slow to rise",
              "LOC: None observed"
            ],
            "choices": [
              {
                "label": "Focus only on the coup (right temporal) injury site",
                "nextStepId": "outcome-partial"
              },
              {
                "label": "Assess both coup (right) and contrecoup (left) regions plus rotational injury signs",
                "nextStepId": "outcome-optimal"
              }
            ]
          },
          {
            "id": "outcome-delayed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Delayed Assessment",
              "explanation": "Waiting for symptoms to develop risks further injury. Any observed mechanism with head impact warrants immediate removal and assessment.",
              "clinicalReasoning": "The Amsterdam 2022 consensus emphasises immediate removal from play for any suspected concussion. Symptoms may not be immediately apparent — delayed onset is common."
            }
          },
          {
            "id": "outcome-deferred",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Deferred Clinical Decision",
              "explanation": "Concussion assessment is a clinical decision that should not be delegated to coaching staff.",
              "clinicalReasoning": "Healthcare professionals have the training and duty to make assessment decisions. Coaches may prioritise game outcomes over player safety."
            }
          },
          {
            "id": "outcome-partial",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Partial Assessment",
              "explanation": "Assessing only the coup site misses potential contrecoup injury. Lateral impacts commonly cause contrecoup damage to the opposite hemisphere.",
              "clinicalReasoning": "A knee strike to the right temporal region creates coup injury at impact site AND contrecoup injury to the left hemisphere. Rotational forces from lateral impact also affect deep structures (corpus callosum, brainstem)."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Comprehensive Mechanism-Based Assessment",
              "explanation": "Excellent. Assessing both coup and contrecoup regions, along with signs of rotational injury, reflects a thorough understanding of concussion biomechanics.",
              "clinicalReasoning": "Lateral impacts produce: (1) coup injury at impact site, (2) contrecoup injury opposite, (3) rotational shearing forces affecting deep white matter. A complete assessment addresses all three mechanisms."
            }
          }
        ]
      }
    ],
    "injury-classification": [
      {
        "kind": "quick-check",
        "question": "A patient has a concussion from a rugby tackle with no skull fracture. How is this classified by mechanism?",
        "options": [
          "Open (penetrating) head injury",
          "Closed head injury",
          "Structural brain injury",
          "Severe TBI"
        ],
        "correctAnswer": 1,
        "explanation": "A concussion without skull fracture is a closed head injury — the brain is injured without a break in the skull. The brain moves within the skull due to acceleration-deceleration forces. Open (penetrating) injuries involve skull fracture with foreign object or bone fragment penetration."
      },
      {
        "kind": "ordering",
        "title": "TBI Severity Classification",
        "instruction": "Arrange these TBI severity levels from least to most severe based on Glasgow Coma Scale scores.",
        "items": [
          {
            "id": "mild",
            "label": "Mild TBI (GCS 13-15)",
            "rationale": "Includes concussion. Brief or no LOC, confusion < 30 min."
          },
          {
            "id": "moderate",
            "label": "Moderate TBI (GCS 9-12)",
            "rationale": "LOC 30 min-6 hours. Prolonged confusion and memory loss."
          },
          {
            "id": "severe",
            "label": "Severe TBI (GCS 3-8)",
            "rationale": "LOC > 6 hours. Extensive damage, possible coma."
          }
        ],
        "correctOrder": [
          "mild",
          "moderate",
          "severe"
        ],
        "explanation": "TBI severity is classified using the Glasgow Coma Scale: Mild (GCS 13-15) includes concussion, Moderate (GCS 9-12) involves prolonged symptoms, and Severe (GCS 3-8) carries significant morbidity and mortality risk."
      }
    ],
    "biochemistry-overview": [
      {
        "kind": "key-concept",
        "title": "The Neurometabolic Cascade",
        "points": [
          "Ionic flux (K+ out, Ca²+ in) disrupts cellular balance",
          "Increased glucose metabolism + decreased blood flow = energy crisis",
          "Typical resolution: 7-10 days (but varies significantly)",
          "Brain is vulnerable to repeat injury during this period"
        ]
      },
      {
        "kind": "quick-check",
        "question": "What creates the 'energy crisis' in concussion?",
        "options": [
          "Decreased glucose metabolism",
          "Increased blood flow with normal metabolism",
          "Increased energy demand with decreased energy supply",
          "Complete cessation of cellular activity"
        ],
        "correctAnswer": 2,
        "explanation": "The energy crisis occurs because neurons increase glucose metabolism to restore ionic balance, but simultaneously cerebral blood flow decreases, creating a mismatch between supply and demand."
      },
      {
        "kind": "quick-check",
        "question": "The neurometabolic cascade typically resolves within:",
        "options": [
          "24-48 hours",
          "7-10 days",
          "4-6 weeks",
          "3-6 months"
        ],
        "correctAnswer": 1,
        "explanation": "The acute neurometabolic cascade typically resolves in 7-10 days for uncomplicated concussions. However, this varies significantly by individual, and the brain remains vulnerable to repeat injury during this period."
      },
      {
        "kind": "ordering",
        "title": "Neurometabolic Cascade Sequence",
        "instruction": "Place these phases of the neurometabolic cascade in correct temporal order.",
        "items": [
          {
            "id": "mech",
            "label": "1. Mechanical disruption of neuronal membranes",
            "rationale": "Immediate — biomechanical forces deform cell membranes and open mechanosensitive ion channels."
          },
          {
            "id": "ionic",
            "label": "2. Ionic flux (K+ out, Ca²+ in)",
            "rationale": "Seconds to minutes — potassium efflux and calcium influx disrupt membrane potential."
          },
          {
            "id": "energy",
            "label": "3. Energy crisis (ATP depletion)",
            "rationale": "Minutes to days — Na+/K+ pumps work overtime while cerebral blood flow decreases."
          },
          {
            "id": "neuro",
            "label": "4. Impaired neurotransmission",
            "rationale": "Hours to weeks — disrupted axonal transport and synaptic dysfunction."
          },
          {
            "id": "calcium",
            "label": "5. Calcium-mediated damage",
            "rationale": "Hours to days — excessive intracellular calcium triggers destructive enzyme pathways."
          },
          {
            "id": "inflam",
            "label": "6. Neuroinflammation",
            "rationale": "Hours to months — microglia activation and cytokine release."
          },
          {
            "id": "recovery",
            "label": "7. Recovery phase",
            "rationale": "Days to months — gradual restoration of ionic balance and metabolic function."
          }
        ],
        "correctOrder": [
          "mech",
          "ionic",
          "energy",
          "neuro",
          "calcium",
          "inflam",
          "recovery"
        ],
        "explanation": "The neurometabolic cascade follows a predictable temporal sequence from immediate mechanical disruption through to eventual recovery. Understanding this sequence explains why premature return to activity during the energy crisis phase (Phase 3) is dangerous."
      }
    ],
    "imaging-clinical": [
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: A normal CT scan rules out concussion",
        "options": [
          "True - normal imaging means no concussion",
          "False - concussion is a functional injury; imaging is typically normal"
        ],
        "correctAnswer": 1,
        "explanation": "CT and MRI scans detect structural damage. Concussion is a functional disturbance of cellular activity, so standard imaging appears normal. Imaging is used to rule out structural complications (bleeds, fractures), not to diagnose concussion."
      }
    ],
    "physiology-symptoms": [
      {
        "kind": "matching",
        "title": "Symptom-Physiology Connections",
        "instruction": "Match each concussion symptom domain to its primary physiological mechanism.",
        "pairs": [
          {
            "id": "cognitive",
            "left": "Cognitive dysfunction (memory, concentration)",
            "right": "Reduced cerebral blood flow + neuroinflammation",
            "explanation": "Decreased CBF and inflammatory mediators impair neural processing, particularly in frontal and temporal regions."
          },
          {
            "id": "oculomotor",
            "left": "Oculomotor distress (visual tracking)",
            "right": "Autonomic nervous system impairment",
            "explanation": "ANS dysfunction affects pupillary control, accommodation, and smooth pursuit eye movements."
          },
          {
            "id": "sleep",
            "left": "Sleep disturbance",
            "right": "Circadian rhythm + orexinergic disruption",
            "explanation": "Brainstem injury disrupts sleep-wake regulation, melatonin pathways, and GABA-mediated inhibition."
          },
          {
            "id": "mood",
            "left": "Mood dysregulation (anxiety, irritability)",
            "right": "Limbic system + frontal lobe dysfunction",
            "explanation": "Disruption to the amygdala, hippocampus, and prefrontal cortex impairs emotional regulation and stress response."
          }
        ],
        "leftLabel": "Symptom Domain",
        "rightLabel": "Physiological Mechanism"
      }
    ],
    "secondary-injury": [
      {
        "kind": "quick-check",
        "question": "A concussion patient's symptoms worsen 6 hours after injury. What is the MOST likely explanation?",
        "options": [
          "The primary injury is getting worse",
          "Secondary injury processes (swelling, metabolic disruption) are evolving",
          "The initial assessment was incorrect",
          "This is normal — concussion symptoms always worsen before improving"
        ],
        "correctAnswer": 1,
        "explanation": "Primary injury occurs at the moment of impact and cannot worsen after the fact. Delayed deterioration reflects secondary injury processes — cerebral edema, neuroinflammation, and metabolic disruption — which are potentially preventable with proper management."
      },
      {
        "kind": "quick-check",
        "question": "A patient with a GCS of 14 and brief confusion but no LOC would be classified as:",
        "options": [
          "Moderate TBI",
          "Severe TBI",
          "Mild TBI (concussion)",
          "Not a brain injury — GCS is too high"
        ],
        "correctAnswer": 2,
        "explanation": "A GCS of 13-15 with brief confusion and no or brief LOC (<30 minutes) classifies as mild TBI (concussion). GCS 9-12 is moderate TBI, and GCS 3-8 is severe TBI. Most concussions present with GCS 15."
      }
    ],
    "imaging-research": [
      {
        "kind": "multi-select",
        "question": "Which imaging modalities are used in ROUTINE clinical practice for concussion? (Select all that apply)",
        "options": [
          "CT scan",
          "Standard MRI",
          "fMRI",
          "Diffusion Tensor Imaging (DTI)",
          "Magnetic Resonance Spectroscopy (MRS)",
          "SPECT"
        ],
        "correctAnswers": [
          0,
          1
        ],
        "explanation": "Only CT and standard MRI are used in routine clinical practice for concussion evaluation. Research modalities such as fMRI, DTI, MRS, SPECT, PET, and NIRS show promise in detecting functional and microstructural changes, but they are NOT validated for routine clinical use. They remain research tools — expensive, not widely available, and lacking standardised diagnostic thresholds for concussion."
      }
    ],
    "biomarkers-overview": [
      {
        "kind": "quick-check",
        "question": "Which biomarker received FDA clearance in 2018 as the first blood test to aid concussion evaluation?",
        "options": [
          "S100B",
          "GFAP and UCH-L1 (Banyan BTI)",
          "Tau protein",
          "Neurofilament light (NfL)"
        ],
        "correctAnswer": 1,
        "explanation": "GFAP (glial fibrillary acidic protein) and UCH-L1 (ubiquitin C-terminal hydrolase L1) received FDA clearance in 2018 as the Banyan Brain Trauma Indicator — the first blood test to aid concussion evaluation. It was cleared to help reduce unnecessary CT scans by identifying patients with low likelihood of intracranial lesions, not to diagnose concussion itself."
      }
    ],
    "identifiable-pathology": [
      {
        "kind": "quick-check",
        "question": "Diffuse axonal injury (DAI) is BEST detected by which imaging modality?",
        "options": [
          "Standard CT scan",
          "Plain X-ray",
          "Diffusion Tensor Imaging (DTI)",
          "Standard MRI"
        ],
        "correctAnswer": 2,
        "explanation": "Diffusion Tensor Imaging (DTI) is the most sensitive modality for detecting diffuse axonal injury. DTI maps white matter tract integrity by measuring water diffusion along axonal pathways. It can reveal disruption of white matter tracts that standard CT and MRI miss entirely. CT detects haemorrhage and fractures; standard MRI detects structural lesions — but neither can visualise the microstructural axonal shearing characteristic of DAI."
      }
    ]
  },
  "2": {
    "acute-assessment-protocol": [
      {
        "kind": "flowchart",
        "title": "On-Field Assessment Protocol",
        "steps": [
          {
            "label": "ABCs First",
            "description": "Ensure airway, breathing, circulation before concussion assessment"
          },
          {
            "label": "Red Flag Screen",
            "description": "LOC >1 min, seizures, worsening symptoms, neurological deficits → Emergency referral"
          },
          {
            "label": "GCS Assessment",
            "description": "Score 13-15 = mild TBI; Score ≤12 requires immediate medical referral"
          },
          {
            "label": "Maddocks Questions",
            "description": "Rapid cognitive screening for orientation and memory"
          },
          {
            "label": "Remove from Play",
            "description": "Any positive findings = immediate removal and comprehensive SCAT6"
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "An athlete is dazed but passes the on-field assessment. Can they return to play?",
        "options": [
          "Yes - they passed the assessment",
          "No - 'When in doubt, sit them out' - comprehensive SCAT6 required",
          "Yes, but monitor closely",
          "Only if no headache reported"
        ],
        "correctAnswer": 1,
        "explanation": "'When in doubt, sit them out' is the gold standard. On-field screening is NOT diagnostic. Any suspicion of concussion requires immediate removal from play and comprehensive assessment with SCAT6. Symptoms may be delayed."
      }
    ],
    "maddocks-questions": [
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: SCAT6 can be used as a standalone diagnostic tool",
        "options": [
          "True - SCAT6 definitively diagnoses concussion",
          "False - SCAT6 is a screening tool, not a standalone diagnostic"
        ],
        "correctAnswer": 1,
        "explanation": "SCAT6 is a standardized assessment tool, NOT a diagnostic instrument. Concussion diagnosis requires clinical judgment integrating SCAT6 results with history, examination, and monitoring. SCAT6 helps quantify deficits but doesn't replace medical evaluation."
      }
    ],
    "glasgow-coma-scale": [
      {
        "kind": "quick-check",
        "question": "A patient opens their eyes to voice, speaks in confused sentences, and localises to pain. What is their GCS score?",
        "options": [
          "GCS 11 (E3, V3, M5)",
          "GCS 12 (E3, V4, M5)",
          "GCS 13 (E3, V5, M5)",
          "GCS 9 (E2, V3, M4)"
        ],
        "correctAnswer": 1,
        "explanation": "Eyes to voice = E3, confused speech = V4, localises pain = M5. Total = 3 + 4 + 5 = 12. GCS 13-15 is classified as mild TBI (concussion). A score of 12 falls into moderate TBI territory and warrants closer monitoring, possible imaging, and specialist referral."
      },
      {
        "kind": "matching",
        "title": "GCS Component Scoring",
        "instruction": "Match each GCS component to its scoring range and what it assesses.",
        "pairs": [
          {
            "id": "eye",
            "left": "Eye Opening (E)",
            "right": "1-4 points: Spontaneous, to voice, to pain, none",
            "explanation": "Eye opening reflects brainstem arousal function. Score ranges from 4 (spontaneous) to 1 (none)."
          },
          {
            "id": "verbal",
            "left": "Verbal Response (V)",
            "right": "1-5 points: Oriented, confused, words, sounds, none",
            "explanation": "Verbal response assesses cortical function and language processing. Score ranges from 5 (oriented) to 1 (none)."
          },
          {
            "id": "motor",
            "left": "Motor Response (M)",
            "right": "1-6 points: Obeys, localises, withdraws, flexion, extension, none",
            "explanation": "Motor response is the most reliable GCS component. Score ranges from 6 (obeys commands) to 1 (none)."
          }
        ],
        "leftLabel": "GCS Component",
        "rightLabel": "Score Range & Assessment"
      }
    ],
    "severity-classification": [
      {
        "kind": "key-concept",
        "title": "Modern vs Outdated Severity Grading",
        "content": "The Cantu and Colorado grading systems (Grades 1-3 based on LOC and amnesia) are now considered outdated. Modern practice uses symptom burden, recovery trajectory, and clinical phenotyping rather than rigid grading. The 6th International Consensus on Concussion in Sport (Amsterdam 2022) emphasises individualised assessment over categorical grading."
      }
    ],
    "cranial-nerve-overview": [
      {
        "kind": "quick-check",
        "question": "Which cranial nerves are most commonly affected in concussion?",
        "options": [
          "CN I (Olfactory) and CN V (Trigeminal)",
          "CN III, IV, VI (Oculomotor group) and CN VIII (Vestibulocochlear)",
          "CN IX (Glossopharyngeal) and CN X (Vagus)",
          "CN XI (Accessory) and CN XII (Hypoglossal)"
        ],
        "correctAnswer": 1,
        "explanation": "CN III, IV, VI (controlling eye movements) and CN VIII (vestibular/hearing) are most frequently affected in concussion due to the vulnerability of brainstem nuclei and the long intracranial course of these nerves. This explains why oculomotor and vestibular symptoms are the most common post-concussion complaints."
      },
      {
        "kind": "insight",
        "type": "tip",
        "title": "CN Exam Efficiency",
        "content": "In a busy clinical setting, you can screen the most concussion-relevant cranial nerves in under 3 minutes: pupil reactivity (CN II, III), H-pattern eye tracking (CN III, IV, VI), facial symmetry on smile (CN VII), and finger-rub hearing screen (CN VIII). A full 12-nerve exam is indicated when screening is abnormal or red flags are present."
      }
    ],
    "voms-overview": [
      {
        "kind": "key-concept",
        "title": "VOMS Components & Scoring",
        "content": "The VOMS assesses 5 domains: smooth pursuit, saccades, near point convergence (NPC), vestibulo-ocular reflex (VOR), and visual motion sensitivity (VMS). Scoring uses a 0-10 scale for headache, dizziness, nausea, and fogginess. A ≥2 point increase from baseline on ANY symptom during ANY subtest is clinically significant. NPC distance of 6 cm or greater is abnormal (a positive screen); less than 6 cm is normal. Even one abnormal subtest indicates vestibular-ocular dysfunction requiring targeted rehabilitation."
      }
    ],
    "bess-sensory-integration": [
      {
        "kind": "quick-check",
        "question": "During BESS testing, a patient lifts their hands off their hips, opens their eyes, and takes a step during the tandem stance on foam. How many errors is this?",
        "options": [
          "1 error (it's all one sequence)",
          "2 errors (hands off hips + eyes open)",
          "3 errors (hands off hips, eyes open, step)",
          "Only the step counts as an error"
        ],
        "correctAnswer": 2,
        "explanation": "Each deviation is counted as a separate error: (1) hands off iliac crests, (2) opening eyes, and (3) stepping or stumbling. BESS allows a maximum of 10 errors per 20-second condition. If a patient cannot maintain the stance for ≥5 seconds, the maximum error count of 10 is assigned for that condition."
      }
    ],
    "loss-of-consciousness": [
      {
        "kind": "scenario",
        "title": "Sideline LOC Assessment",
        "patientSummary": "22-year-old female soccer player collides head-to-head with an opponent. She falls to the ground and lies motionless for approximately 5 seconds before opening her eyes.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "You reach the player as she opens her eyes. She looks confused and asks \"What happened?\" How do you proceed?",
            "clinicalData": [
              "Brief LOC (~5 seconds)",
              "GCS on arrival: E4 V4 M6 = 14",
              "No cervical spine tenderness on palpation"
            ],
            "choices": [
              {
                "label": "She recovered quickly — allow her to sit up and reassess in a few minutes",
                "nextStepId": "outcome-premature"
              },
              {
                "label": "Maintain cervical precautions, remove from play, complete full SCAT6 assessment",
                "nextStepId": "step-2"
              },
              {
                "label": "Immediately call an ambulance due to the LOC",
                "nextStepId": "outcome-overreact"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You begin Maddocks Questions. She answers 3 of 5 correctly but gets the score and the last play wrong. What does this indicate?",
            "clinicalData": [
              "Maddocks: 3/5 correct",
              "Missed: current score, last play",
              "Alert and oriented to person and place"
            ],
            "choices": [
              {
                "label": "Failing Maddocks questions confirms concussion — no further testing needed",
                "nextStepId": "outcome-incomplete"
              },
              {
                "label": "This is suggestive of concussion — continue with full symptom evaluation and cognitive assessment",
                "nextStepId": "outcome-optimal"
              }
            ]
          },
          {
            "id": "outcome-premature",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Premature Decision",
              "explanation": "Any observed LOC mandates removal from play and comprehensive assessment, regardless of how quickly the player recovers.",
              "clinicalReasoning": "LOC is a significant concussion sign. Brief LOC does not indicate mild injury — the full neurometabolic cascade has been triggered regardless of LOC duration."
            }
          },
          {
            "id": "outcome-overreact",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Cautious but Potentially Excessive",
              "explanation": "Brief LOC (<1 minute) with rapid GCS recovery typically does not require emergency transport. However, erring on the side of caution is always defensible.",
              "clinicalReasoning": "Ambulance is indicated for prolonged LOC (>1 min), declining GCS, focal neurological signs, or seizure. Brief LOC with rapid recovery warrants removal and full assessment but not necessarily emergency transport."
            }
          },
          {
            "id": "outcome-incomplete",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Incomplete Assessment",
              "explanation": "While Maddocks failure is highly suspicious for concussion, a complete assessment provides baseline data, documents severity, and guides management.",
              "clinicalReasoning": "Maddocks Questions are a rapid screening tool, not diagnostic on their own. Full SCAT6 includes symptom checklist, SAC (cognitive), modified BESS (balance), and neurological examination."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Comprehensive Assessment",
              "explanation": "Continuing with full evaluation after suspicious Maddocks results is best practice — it documents the full clinical picture.",
              "clinicalReasoning": "Failed Maddocks Questions indicate post-traumatic amnesia (PTA) which is strongly suggestive of concussion. The complete SCAT6 provides a severity baseline and guides management decisions."
            }
          }
        ]
      }
    ],
    "symptom-assessment": [
      {
        "kind": "multi-select",
        "question": "Which of the following are domains assessed in the SCAT6 symptom evaluation? (Select all that apply)",
        "options": [
          "Physical symptoms (headache, nausea, dizziness)",
          "Cognitive symptoms (feeling foggy, difficulty concentrating)",
          "Emotional symptoms (irritability, sadness)",
          "Sleep symptoms (drowsiness, trouble falling asleep)",
          "Appetite and dietary changes",
          "Fatigue and energy levels"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3,
          5
        ],
        "explanation": "The SCAT6 symptom checklist covers physical, cognitive, emotional, sleep, and fatigue domains — 22 symptoms total. Appetite is not a specific SCAT6 symptom item, though it may be relevant in clinical history."
      }
    ],
    "nystagmus-detailed": [
      {
        "kind": "quick-check",
        "question": "During a vestibular assessment, you observe nystagmus that changes direction when the patient looks in different directions. This pattern is MOST consistent with:",
        "options": [
          "Peripheral vestibular dysfunction (e.g., BPPV)",
          "Central vestibular pathology (brainstem/cerebellum)",
          "Normal physiological end-point nystagmus",
          "Medication side effects"
        ],
        "correctAnswer": 1,
        "explanation": "Direction-changing nystagmus (changing direction with gaze direction) is a hallmark of central vestibular pathology and warrants urgent referral. Peripheral vestibular nystagmus beats in one direction regardless of gaze, is suppressed by visual fixation, and fatigues with repeated testing."
      }
    ],
    "grading-systems": [
      {
        "kind": "quick-check",
        "question": "Why are the traditional Grade 1/2/3 concussion classification systems no longer recommended?",
        "options": [
          "They were too complicated for sideline use",
          "Loss of consciousness is a poor predictor of severity and recovery, and categorical grading oversimplifies a heterogeneous injury",
          "They were only validated in professional athletes",
          "Modern imaging has replaced the need for clinical grading"
        ],
        "correctAnswer": 1,
        "explanation": "The Berlin (2016) and Amsterdam (2022) consensus statements recommend against categorical grading. LOC poorly predicts severity, and concussion is now managed individually using a multi-dimensional assessment (symptoms, cognition, balance, oculomotor function) rather than arbitrary severity levels."
      }
    ],
    "severity-timeline": [
      {
        "kind": "quick-check",
        "question": "What percentage of adult concussions typically resolve within 7-14 days?",
        "options": [
          "40-50%",
          "60-70%",
          "80-90%",
          "95-100%"
        ],
        "correctAnswer": 2,
        "explanation": "80-90% of adult concussions resolve within 7-14 days with appropriate management. Adolescents may take up to 4 weeks. Symptoms persisting beyond these timeframes warrant further investigation for post-concussion syndrome and targeted treatment of specific symptom domains."
      }
    ],
    "cervical-assessment": [
      {
        "kind": "quick-check",
        "question": "During the Cervical Flexion-Rotation Test, reduced rotation below what threshold suggests cervicogenic origin of symptoms?",
        "options": [
          "45 degrees",
          "32 degrees",
          "20 degrees",
          "60 degrees"
        ],
        "correctAnswer": 1,
        "explanation": "Reduced rotation below 32° during the Cervical Flexion-Rotation Test, especially when combined with headache or dizziness, suggests a cervicogenic origin (C1-C2 dysfunction). This helps clinicians differentiate cervical from vestibular causes of post-concussion symptoms."
      }
    ],
    "upper-cervical-syndrome": [
      {
        "kind": "quick-check",
        "question": "Upper Cervical Syndrome involves dysfunction at which spinal level?",
        "options": [
          "C4-C5",
          "C6-C7",
          "C1-C2 (atlantoaxial joint)",
          "T1-T2"
        ],
        "correctAnswer": 2,
        "explanation": "Upper Cervical Syndrome arises from dysfunction of the atlantoaxial joint (C1-C2), causing proprioceptive dysfunction, suboccipital muscle spasm, and potentially vertebrobasilar artery compression. Symptoms include vertigo, cervicogenic headache, visual disturbances, and tinnitus — often overlapping with concussion symptoms."
      }
    ]
  },
  "3": {
    "voms-practical-procedure": [
      {
        "kind": "insight",
        "type": "warning",
        "title": "Common VOMS Error",
        "content": "Many clinicians test eye movements too quickly or with excessive range. Move the target smoothly at moderate speed, and keep movements within comfortable range to avoid false positives."
      },
      {
        "kind": "quick-check",
        "question": "A patient has +3 dizziness with smooth pursuit but negative VOR. What does this indicate?",
        "options": [
          "Vestibular-only dysfunction",
          "Cervicogenic dizziness only",
          "Oculomotor dysfunction (central processing issue)",
          "Normal finding"
        ],
        "correctAnswer": 2,
        "explanation": "Positive smooth pursuit with negative VOR suggests oculomotor/central processing dysfunction rather than vestibular pathology. Smooth pursuit requires intact frontal-parietal circuits and cerebellar function. This phenotype requires oculomotor rehabilitation, not vestibular therapy."
      }
    ],
    "bess-practical-procedure": [
      {
        "kind": "quick-check",
        "question": "BESS testing assesses:",
        "options": [
          "Visual acuity only",
          "Static balance and postural stability",
          "Dynamic balance during movement",
          "Cognitive function"
        ],
        "correctAnswer": 1,
        "explanation": "BESS (Balance Error Scoring System) assesses static balance across 6 conditions. It tests postural stability by challenging proprioception, vestibular, and visual systems. Errors indicate impaired sensorimotor integration common in concussion."
      }
    ],
    "cervical-assessment-flowchart": [
      {
        "kind": "flowchart",
        "title": "Cervical Clearance Decision Pathway",
        "steps": [
          {
            "label": "Red Flag Screen",
            "description": "Severe neck pain, neurological deficit, midline tenderness → Imaging before proceeding"
          },
          {
            "label": "Canadian C-Spine Rule",
            "description": "Age >65, dangerous mechanism, or paraesthesias → CT indicated"
          },
          {
            "label": "Range of Motion",
            "description": "Can patient actively rotate neck 45° left and right? If no → further investigation"
          },
          {
            "label": "Cervicogenic Assessment",
            "description": "Flexion-rotation test, joint position error, smooth pursuit neck torsion"
          },
          {
            "label": "Clinical Decision",
            "description": "Cleared for physiotherapy management vs. referral for imaging/specialist review"
          }
        ]
      }
    ],
    "cranial-nerve-practical": [
      {
        "kind": "quick-check",
        "question": "A patient's tongue deviates to the left on protrusion. Which cranial nerve is affected and on which side?",
        "options": [
          "CN XII (Hypoglossal) — right side lesion",
          "CN XII (Hypoglossal) — left side lesion",
          "CN X (Vagus) — left side lesion",
          "CN VII (Facial) — left side lesion"
        ],
        "correctAnswer": 1,
        "explanation": "The tongue deviates TOWARD the side of the lesion. Left deviation = left CN XII (Hypoglossal) dysfunction. The weak genioglossus on the affected side cannot push the tongue to the opposite side, so it deviates ipsilaterally. This is an important lower motor neuron sign to document."
      }
    ],
    "oculomotor-dysfunction": [
      {
        "kind": "insight",
        "type": "warning",
        "title": "When to Refer for Neuro-Ophthalmology",
        "content": "Refer urgently if: persistent diplopia beyond 2 weeks, pupil asymmetry >1mm (anisocoria) especially with new onset, papilloedema on fundoscopy (raised ICP), visual field deficits on confrontation testing, or NPC consistently >10cm despite 4+ weeks of convergence therapy. These findings may indicate structural pathology requiring specialist imaging and management beyond concussion rehabilitation."
      }
    ],
    "acute-management-protocols": [
      {
        "kind": "key-concept",
        "title": "The 72-Hour Acute Phase",
        "content": "The first 72 hours post-concussion are characterised by a neurometabolic cascade: ionic flux, energy crisis, and impaired neurotransmission. Management priorities: (1) Relative cognitive and physical rest (not complete bed rest), (2) Symptom-limited activity below exacerbation threshold, (3) Sleep hygiene optimisation, (4) Hydration and regular meals. After 24-48 hours, light aerobic activity (walking) below symptom threshold is now recommended — prolonged strict rest worsens outcomes."
      }
    ],
    "clinical-checkpoints": [
      {
        "kind": "quick-check",
        "question": "At a 2-week follow-up, a concussion patient reports persistent headaches and dizziness with no improvement. What is the most appropriate next step?",
        "options": [
          "Reassure and continue current management for another 2 weeks",
          "Conduct targeted assessment (cervical, vestibular, oculomotor) to identify treatable phenotypes",
          "Order an MRI immediately",
          "Advise complete bed rest until symptoms resolve"
        ],
        "correctAnswer": 1,
        "explanation": "At 2 weeks without improvement, passive management alone is insufficient. Targeted clinical assessment should identify specific phenotypes (cervicogenic, vestibular, oculomotor, mood/anxiety) driving persistent symptoms. This allows phenotype-specific treatment rather than generic 'rest and wait.' MRI is only indicated if red flags or atypical features are present."
      }
    ],
    "cervical-special-tests-detail": [
      {
        "kind": "scenario",
        "title": "Post-Concussion Cervical Assessment",
        "patientSummary": "35-year-old male cyclist who fell and hit his head on the pavement 5 days ago. Cleared of structural brain injury by ED. Presenting with persistent headache and neck stiffness.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The patient describes constant headache that worsens with neck movement and looking at screens. He has limited cervical rotation. What is your primary differential?",
            "clinicalData": [
              "Headache: occipital, constant, 6/10 intensity",
              "Neck ROM: Limited rotation bilaterally",
              "No neurological deficits on screening"
            ],
            "choices": [
              {
                "label": "This is a primary concussion headache — prescribe cognitive rest",
                "nextStepId": "outcome-missed"
              },
              {
                "label": "Consider cervicogenic component — assess upper cervical spine (C0-C3)",
                "nextStepId": "step-2"
              },
              {
                "label": "Order cervical spine MRI before proceeding",
                "nextStepId": "outcome-premature-imaging"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "On upper cervical examination, you find: restricted C1-C2 rotation, tenderness over C2-C3 facet joints, positive cervical flexion-rotation test. What do you conclude?",
            "clinicalData": [
              "Positive flexion-rotation test (limited to 28° bilaterally)",
              "C2-C3 facet tenderness",
              "Reproduced headache with sustained C1-C2 pressure"
            ],
            "choices": [
              {
                "label": "Cervicogenic headache confirmed — treat with cervical manual therapy alongside concussion management",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Cervicogenic headache confirmed — treat neck only and discharge from concussion care",
                "nextStepId": "outcome-incomplete"
              }
            ]
          },
          {
            "id": "outcome-missed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Missed Cervicogenic Component",
              "explanation": "Headaches worsening with neck movement and limited cervical ROM strongly suggest a cervicogenic contribution. Pure concussion headaches are less affected by neck position.",
              "clinicalReasoning": "Up to 75% of concussion patients have concurrent cervical spine involvement. The upper cervical spine (C0-C3) shares innervation with the trigeminal nerve, making cervicogenic headache a common mimicker."
            }
          },
          {
            "id": "outcome-premature-imaging",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Premature Imaging",
              "explanation": "While not wrong, clinical examination should precede imaging for post-concussion neck complaints without red flags. MRI is indicated if clinical findings suggest structural pathology.",
              "clinicalReasoning": "Clinical examination (flexion-rotation test, segmental assessment) is the gold standard for diagnosing cervicogenic headache and is more cost-effective than immediate imaging."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Integrated Management",
              "explanation": "Excellent. Cervicogenic headache commonly co-exists with concussion and responds well to targeted cervical manual therapy as part of a comprehensive management plan.",
              "clinicalReasoning": "Schneider et al. (2017) demonstrated that cervicovestibular rehabilitation significantly improves concussion recovery times. Treating the cervical component often resolves \"persistent\" concussion symptoms."
            }
          },
          {
            "id": "outcome-incomplete",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Siloed Management",
              "explanation": "While cervical treatment is appropriate, discharging from concussion care is premature. Concussion and cervicogenic symptoms often co-exist and should be managed together.",
              "clinicalReasoning": "Concurrent concussion management (graduated return to activity, symptom monitoring) should continue alongside cervical treatment. Both conditions share common mechanisms from the initial injury."
            }
          }
        ]
      }
    ],
    "musculoskeletal-involvement": [
      {
        "kind": "ordering",
        "title": "Cervical Assessment Protocol",
        "instruction": "Arrange these cervical assessment steps in the recommended clinical order.",
        "items": [
          {
            "id": "history",
            "label": "Take focused cervical history (mechanism, symptom pattern)",
            "rationale": "History guides the examination and identifies red flags requiring urgent referral."
          },
          {
            "id": "rom",
            "label": "Assess active cervical range of motion",
            "rationale": "Active ROM identifies gross movement limitations and painful arcs before hands-on assessment."
          },
          {
            "id": "flexrot",
            "label": "Perform cervical flexion-rotation test",
            "rationale": "Flexion-rotation test specifically assesses C1-C2 and has high sensitivity for cervicogenic headache."
          },
          {
            "id": "segmental",
            "label": "Segmental palpation and joint assessment (C0-C3)",
            "rationale": "Identifies specific segmental dysfunction for targeted treatment."
          },
          {
            "id": "neuro",
            "label": "Neurological screening (dermatomes, myotomes, reflexes)",
            "rationale": "Rules out neural compromise before proceeding with treatment."
          }
        ],
        "correctOrder": [
          "history",
          "rom",
          "flexrot",
          "segmental",
          "neuro"
        ],
        "explanation": "A systematic cervical assessment starts with history (to identify red flags), progresses through movement assessment, specific tests, segmental examination, and concludes with neurological screening to rule out neural compromise."
      }
    ],
    "case-scenario-integration": [
      {
        "kind": "multi-select",
        "question": "Which assessment findings would indicate an athlete should NOT return to play on the same day? (Select all that apply)",
        "options": [
          "Any suspected concussion sign or symptom",
          "Abnormal SCAT6 score",
          "Failed Maddocks Questions",
          "Normal assessment but observed head impact",
          "Brief dizziness that resolves in 30 seconds",
          "Positive VOMS findings"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          4,
          5
        ],
        "explanation": "Any suspected concussion sign or symptom — including brief, transient dizziness that resolves within seconds — mandates removal from play with no same-day return. 'If in doubt, sit them out': symptoms can fluctuate and evolve over hours, so momentary resolution does not indicate recovery. Abnormal SCAT6, failed Maddocks, and positive VOMS findings likewise mandate removal. A genuinely normal assessment with NO signs or symptoms after an observed mechanism is the only scenario here that may allow continued play, with close sideline monitoring."
      }
    ]
  },
  "4": {
    "pcs-definition": [
      {
        "kind": "key-concept",
        "title": "PCS Definition & Timeframe",
        "content": "Persistent Post-Concussive Symptoms (PPCS) = symptoms persisting beyond 4 weeks post-injury in adults. Affects 10-20% of cases. NOT a single disorder - it's a heterogeneous collection requiring phenotype-specific treatment."
      },
      {
        "kind": "quick-check",
        "question": "Persistent post-concussive symptoms (PPCS) is defined as symptoms lasting beyond:",
        "options": [
          "7 days",
          "4 weeks",
          "3 months",
          "6 months"
        ],
        "correctAnswer": 1,
        "explanation": "PPCS is defined as symptoms persisting beyond 4 weeks (28 days) post-injury. However, symptom duration alone doesn't determine prognosis - phenotype identification and targeted treatment are key."
      }
    ],
    "risk-factors": [
      {
        "kind": "insight",
        "type": "warning",
        "title": "Strongest PCS Predictors",
        "content": "Pre-existing MIGRAINE is the strongest predictor (3-5x increased risk). Psychosocial factors (stress, poor social support, litigation) and treatment factors (delayed diagnosis, prolonged strict rest) are MODIFIABLE - focus intervention here."
      },
      {
        "kind": "quick-check",
        "question": "Which pre-existing condition is the STRONGEST predictor of post-concussion syndrome?",
        "options": [
          "ADHD",
          "Anxiety/Depression",
          "Migraine headaches",
          "Previous concussion"
        ],
        "correctAnswer": 2,
        "explanation": "Pre-existing MIGRAINE is the strongest predictor of PCS, increasing risk 3-5x. Migraine mechanisms (sensitization, photophobia, dizziness) overlap with concussion symptoms. History of migraine should trigger aggressive early intervention."
      },
      {
        "kind": "multi-select",
        "question": "Which of the following are established risk factors for prolonged concussion recovery? (Select all that apply)",
        "options": [
          "Female sex",
          "History of previous concussion",
          "History of migraine",
          "Pre-existing anxiety or depression",
          "High initial symptom burden",
          "Blood type O negative",
          "Age under 18 years"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3,
          4,
          6
        ],
        "explanation": "Female sex, concussion history, migraine history, pre-existing mental health conditions, high initial symptom burden, and younger age are all established risk factors for prolonged recovery. Blood type has no association with concussion outcomes."
      }
    ],
    "symptom-domains": [
      {
        "kind": "key-concept",
        "title": "6 Clinical Phenotypes (Ellis Classification)",
        "content": "1) Physiological (autonomic), 2) Vestibulo-ocular, 3) Cervicogenic, 4) Cognitive-fatigue, 5) Post-traumatic migraine, 6) Anxiety/mood. Most patients have MIXED phenotypes requiring multimodal treatment."
      },
      {
        "kind": "quick-check",
        "question": "A patient reports headache, dizziness with head movement, and neck pain. This suggests:",
        "options": [
          "Single vestibular phenotype only",
          "Mixed phenotype (vestibular + cervicogenic + migraine)",
          "Purely psychological symptoms",
          "Malingering"
        ],
        "correctAnswer": 1,
        "explanation": "Headache + dizziness + neck pain = MIXED phenotype requiring combined treatment (vestibular rehab + cervical physio + headache management). Single-approach treatment will fail. Address all contributors simultaneously."
      }
    ],
    "diagnostic-approach": [
      {
        "kind": "flowchart",
        "title": "PCS Diagnostic Workflow",
        "steps": [
          {
            "label": "Comprehensive History",
            "description": "Injury mechanism, symptom evolution, treatment history, red flag screen"
          },
          {
            "label": "Symptom Inventory",
            "description": "SCAT6 Post-Concussion Scale, quantify severity/triggers"
          },
          {
            "label": "Phenotype Assessment",
            "description": "VOMS (vestibular), cervical exam, Buffalo Treadmill (autonomic), mood screening"
          },
          {
            "label": "Differential Diagnosis",
            "description": "Rule out structural injury, cervical pathology, primary headache, mood disorders"
          },
          {
            "label": "Targeted Treatment Plan",
            "description": "Phenotype-directed multimodal rehabilitation"
          }
        ]
      }
    ],
    "treatment-strategies": [
      {
        "kind": "insight",
        "type": "success",
        "title": "Evidence-Based PCS Treatment",
        "content": "Aerobic exercise therapy (Buffalo Protocol) has STRONG evidence for persistent symptoms. Target 80% of symptom threshold HR, 20-30 min daily. Improves autonomic function, CBF, mood, and sleep. Combine with phenotype-specific rehab."
      },
      {
        "kind": "quick-check",
        "question": "Buffalo Concussion Treadmill Test prescribes exercise at:",
        "options": [
          "50% maximum heart rate",
          "80% of symptom exacerbation threshold",
          "100% effort - push through symptoms",
          "Resting heart rate only"
        ],
        "correctAnswer": 1,
        "explanation": "Buffalo Protocol: Exercise at 80% of the heart rate that triggered symptoms during testing. This sub-threshold training improves autonomic regulation and cerebral blood flow WITHOUT worsening symptoms. Daily 20-30 minute sessions."
      },
      {
        "kind": "matching",
        "title": "Symptom Domain Treatment Matching",
        "instruction": "Match each persistent symptom domain to its primary evidence-based treatment approach.",
        "pairs": [
          {
            "id": "headache",
            "left": "Cervicogenic headache",
            "right": "Cervical manual therapy + exercise",
            "explanation": "Schneider et al. demonstrated superior outcomes with cervicovestibular rehabilitation for cervicogenic headache post-concussion."
          },
          {
            "id": "vestibular",
            "left": "Vestibular dysfunction (dizziness, imbalance)",
            "right": "Vestibular rehabilitation therapy",
            "explanation": "Canalith repositioning for BPPV; gaze stabilisation, habituation, and balance training for central vestibular dysfunction."
          },
          {
            "id": "mood",
            "left": "Persistent mood disturbance",
            "right": "CBT + graduated activity exposure",
            "explanation": "Cognitive behavioural therapy addresses catastrophising and avoidance behaviours that maintain symptoms."
          },
          {
            "id": "exercise",
            "left": "Exercise intolerance (autonomic dysfunction)",
            "right": "Subsymptom-threshold aerobic training (Buffalo Protocol)",
            "explanation": "Graduated aerobic exercise improves cerebrovascular autoregulation and autonomic function."
          },
          {
            "id": "cognitive",
            "left": "Cognitive fatigue and processing speed",
            "right": "Graduated cognitive loading + compensatory strategies",
            "explanation": "Structured cognitive activity with pacing and breaks, combined with external memory aids and scheduling tools."
          }
        ],
        "leftLabel": "Symptom Domain",
        "rightLabel": "Treatment Approach"
      }
    ],
    "cte-overview": [
      {
        "kind": "key-concept",
        "title": "CTE: Key Facts",
        "content": "Chronic Traumatic Encephalopathy = progressive neurodegenerative disease from repetitive head impacts. Can ONLY be diagnosed at autopsy (tau protein deposits). NO validated biomarkers or imaging for living patients. Risk factors: boxing, football, repeated subconcussive hits."
      },
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: CTE can be definitively diagnosed with advanced MRI imaging",
        "options": [
          "True - DTI and tau PET scans diagnose CTE",
          "False - CTE can only be diagnosed post-mortem at autopsy"
        ],
        "correctAnswer": 1,
        "explanation": "CTE can ONLY be diagnosed at autopsy through identification of pathognomonic tau protein deposits. No validated biomarkers, imaging, or clinical criteria exist for living patients. Claims of clinical CTE diagnosis are premature and not evidence-based."
      }
    ],
    "pcs-pathophysiology": [
      {
        "kind": "scenario",
        "title": "Persistent Post-Concussion Symptoms",
        "patientSummary": "28-year-old female teacher, concussion from a car accident 8 weeks ago. Initial symptoms (headache, dizziness, brain fog) have not improved despite 'resting' at home.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The patient reports she has been on strict rest for 8 weeks — no exercise, no screens, no work. Her symptoms have worsened over this period. What is your assessment?",
            "clinicalData": [
              "Symptoms: Daily headache (7/10), brain fog, fatigue, anxiety, poor sleep",
              "Activity level: Minimal — stays home, avoids all stimulation",
              "Mood: PHQ-9 score 14 (moderate depression)"
            ],
            "choices": [
              {
                "label": "Continue strict rest — 8 weeks is still early for some concussions",
                "nextStepId": "outcome-prolonged-rest"
              },
              {
                "label": "Prolonged rest is likely contributing to symptoms — initiate graduated return to activity",
                "nextStepId": "step-2"
              },
              {
                "label": "This must be post-concussion syndrome — refer to neurology only",
                "nextStepId": "outcome-delayed-referral"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You identify that prolonged inactivity, social isolation, and disrupted routine are maintaining her symptoms. What is your management priority?",
            "choices": [
              {
                "label": "Subsymptom-threshold aerobic exercise, sleep hygiene, graduated cognitive activity, and psychology referral",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Start with high-intensity exercise to \"push through\" the symptoms",
                "nextStepId": "outcome-aggressive"
              }
            ]
          },
          {
            "id": "outcome-prolonged-rest",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Prolonged Rest",
              "explanation": "Strict rest beyond 48-72 hours is associated with worse outcomes. After 8 weeks, inactivity itself is likely a major symptom driver.",
              "clinicalReasoning": "Leddy et al. (2018) demonstrated that early subsymptom-threshold aerobic exercise accelerates recovery. Prolonged rest causes physical deconditioning, mood disturbance, and disrupted sleep — all of which mimic and amplify concussion symptoms."
            }
          },
          {
            "id": "outcome-delayed-referral",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Incomplete Approach",
              "explanation": "Neurology referral may be appropriate, but primary management should address the modifiable factors maintaining symptoms.",
              "clinicalReasoning": "The biopsychosocial model of persistent symptoms recognises that biological injury, psychological factors (anxiety, depression, catastrophising), and social factors (isolation, role disruption) all contribute. Addressing modifiable factors should not wait for specialist review."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Comprehensive Biopsychosocial Approach",
              "explanation": "Excellent. Addressing exercise tolerance, sleep, cognitive reactivation, and mood together targets the multifactorial nature of persistent symptoms.",
              "clinicalReasoning": "This approach addresses the energy crisis (graduated exercise improves cerebrovascular function), deconditioning (physical activity), mood (psychology, social reintegration), and sleep disruption simultaneously."
            }
          },
          {
            "id": "outcome-aggressive",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Overly Aggressive",
              "explanation": "High-intensity exercise in a symptomatic patient risks symptom exacerbation. Exercise should be subsymptom-threshold initially.",
              "clinicalReasoning": "The Buffalo Concussion Treadmill Test establishes symptom exacerbation threshold. Exercise prescription should start at 80% of this threshold and gradually progress."
            }
          }
        ]
      }
    ],
    "dmn-dysfunction": [
      {
        "kind": "quick-check",
        "question": "The Default Mode Network (DMN) is MOST active during which state?",
        "options": [
          "Intense physical exercise",
          "Focused attention on an external task",
          "Mind-wandering, daydreaming, and self-referential thought",
          "Deep non-REM sleep"
        ],
        "correctAnswer": 2,
        "explanation": "The DMN activates during internally directed cognition — mind-wandering, autobiographical memory retrieval, future planning, and self-referential thought. It normally deactivates during externally focused tasks. After concussion, failure to properly deactivate the DMN during tasks contributes to cognitive fatigue and difficulty concentrating."
      }
    ],
    "cte-pathophysiology": [
      {
        "kind": "quick-check",
        "question": "CTE can be definitively diagnosed in a living patient using current clinical tools.",
        "options": [
          "True — tau PET imaging provides definitive diagnosis",
          "True — clinical criteria have been validated for in-vivo diagnosis",
          "False — definitive diagnosis requires post-mortem neuropathological examination",
          "True — blood biomarkers can confirm CTE"
        ],
        "correctAnswer": 2,
        "explanation": "CTE can ONLY be definitively diagnosed post-mortem through neuropathological examination showing characteristic hyperphosphorylated tau distribution. No validated in-vivo test exists. Tau PET shows promise but cannot yet distinguish CTE from other tauopathies. Clinicians should NEVER diagnose 'CTE' in living patients."
      }
    ],
    "cte-current-state": [
      {
        "kind": "quick-check",
        "question": "When a patient presents with persistent mood and cognitive symptoms after concussion, the clinician should:",
        "options": [
          "Diagnose probable CTE and counsel on neurodegenerative progression",
          "Manage symptoms as post-concussion syndrome with evidence-based treatments",
          "Recommend immediate retirement from all contact sports",
          "Order a tau PET scan to confirm or rule out CTE"
        ],
        "correctAnswer": 1,
        "explanation": "Persistent symptoms should be managed as PPCS with evidence-based, phenotype-specific treatments — NOT labelled as CTE. Nihilistic prognosis is harmful and inaccurate. Most former contact sport athletes do not develop dementia. Tau PET cannot yet diagnose CTE in living individuals."
      }
    ],
    "long-term-outcomes": [
      {
        "kind": "quick-check",
        "question": "Which factor is MOST associated with poor long-term outcomes after concussion?",
        "options": [
          "Playing a contact sport",
          "Having a single uncomplicated concussion",
          "Prolonged work absence greater than 6 months",
          "Male sex"
        ],
        "correctAnswer": 2,
        "explanation": "Prolonged work absence (>6 months) is strongly associated with poor functional outcomes and disability. Early partial return to work — even with significant accommodations — predicts better long-term outcomes. A single uncomplicated concussion carries no evidence of long-term cognitive impairment."
      }
    ]
  },
  "5": {
    "multidisciplinary-rationale": [
      {
        "kind": "key-concept",
        "title": "Why Multidisciplinary Care?",
        "content": "Phenotype-directed treatment REQUIRES specialists. Vestibular dysfunction → vestibular physio. Vision problems → optometry. Mood issues → psychology. Cervical dysfunction → manual therapy. NO single provider has all expertise. Early appropriate referrals prevent prolonged disability."
      },
      {
        "kind": "quick-check",
        "question": "Evidence shows multidisciplinary care leads to:",
        "options": [
          "No difference vs single provider",
          "Faster recovery and better outcomes, especially for PCS >4 weeks",
          "Higher costs with no benefit",
          "Worse outcomes due to conflicting advice"
        ],
        "correctAnswer": 1,
        "explanation": "Studies show FASTER recovery, better functional outcomes, and higher patient satisfaction with coordinated multidisciplinary care vs single-provider management, particularly for persistent symptoms >4 weeks. Early appropriate specialist referrals are cost-effective."
      }
    ],
    "primary-care-role": [
      {
        "kind": "insight",
        "type": "info",
        "title": "Primary Care as Hub",
        "content": "GP/Sports Medicine is the COORDINATOR: initial diagnosis, gatekeeper for specialist referrals, communication hub, synthesis of specialist recommendations, liaison with schools/employers, FINAL clearance authority. Don't delay referrals - persistent symptoms >2-4 weeks trigger specialist involvement."
      },
      {
        "kind": "flowchart",
        "title": "When to Refer from Primary Care",
        "steps": [
          {
            "label": "Week 2-4: Symptoms Persist",
            "description": "Evaluate for specific phenotypes needing specialist input"
          },
          {
            "label": "Positive VOMS/BESS",
            "description": "→ Vestibular physiotherapy"
          },
          {
            "label": "NPC ≥6cm or Visual Symptoms",
            "description": "→ Optometry/neuro-ophthalmology"
          },
          {
            "label": "Neck Pain or Cervicogenic Headache",
            "description": "→ Cervical physiotherapy"
          },
          {
            "label": "PHQ-9 ≥10 or GAD-7 ≥10",
            "description": "→ Psychology/psychiatry"
          },
          {
            "label": "Complex/Atypical Case",
            "description": "→ Neurology or concussion specialist"
          }
        ]
      }
    ],
    "physiotherapy-role": [
      {
        "kind": "key-concept",
        "title": "Physiotherapy Scope",
        "content": "Vestibular Assessment & Rehab: VOR exercises, gaze stabilization, habituation, balance training. Cervical Treatment: C1-C2 mobilization, proprioceptive retraining, deep neck flexor strengthening. Exercise Prescription: Buffalo Protocol, graduated RTP progressions."
      },
      {
        "kind": "quick-check",
        "question": "A patient has positive VOMS (≥2 point symptom increase), elevated BESS score, and neck stiffness. Which specialist?",
        "options": [
          "Optometry for vision therapy",
          "Psychology for anxiety",
          "Physiotherapy for combined vestibular + cervical dysfunction",
          "Neurology for medication"
        ],
        "correctAnswer": 2,
        "explanation": "Positive VOMS + elevated BESS + neck symptoms = combined VESTIBULAR and CERVICAL dysfunction. Refer to physiotherapy with expertise in BOTH domains. Many patients have mixed phenotypes requiring integrated vestibular-cervical treatment."
      }
    ],
    "optometry-vision-therapy": [
      {
        "kind": "insight",
        "type": "warning",
        "title": "Vision Dysfunction is Common & Overlooked",
        "content": "40-50% of concussions involve convergence insufficiency. NPC ≥6cm, difficulty reading, headache with visual tasks, photophobia = OPTOMETRY REFERRAL. Vision therapy typically 6-12 weeks, dramatically improves function. Don't miss this!"
      },
      {
        "kind": "quick-check",
        "question": "Near point of convergence (NPC) of 9cm indicates:",
        "options": [
          "Normal - no referral needed",
          "Convergence insufficiency - refer to optometry",
          "Vestibular dysfunction - refer to physio",
          "Cervical problem - refer to manual therapy"
        ],
        "correctAnswer": 1,
        "explanation": "NPC ≥6cm = convergence insufficiency requiring OPTOMETRY/vision therapy referral. Less than 6cm is normal; 6cm or greater is a positive screen. Convergence insufficiency causes difficulty reading, headache with near work, words jumping on page. Responds well to vision therapy (pencil push-ups, convergence exercises)."
      }
    ],
    "psychology-role": [
      {
        "kind": "key-concept",
        "title": "Psychology Indications",
        "content": "PHQ-9 ≥10 (depression), GAD-7 ≥10 (anxiety), PTSD symptoms, catastrophic thinking, fear-avoidance, adjustment difficulties. CBT has STRONG evidence for PCS outcomes. Also: neuropsych testing for cognitive symptoms affecting work/school, medico-legal documentation needs."
      },
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: Neuropsychological testing should be routine for all concussions",
        "options": [
          "True - all concussions need baseline + post-injury testing",
          "False - only when cognitive symptoms affect function or documentation needed"
        ],
        "correctAnswer": 1,
        "explanation": "Neuropsych testing is NOT routine. Only indicated when: (1) Cognitive symptoms interfere with work/school, (2) Need objective data for accommodations, (3) Medico-legal context, (4) Suspected learning disability, (5) No improvement with treatment. Overuse wastes resources."
      }
    ],
    "team-communication": [
      {
        "kind": "flowchart",
        "title": "Effective Team Communication Model",
        "steps": [
          {
            "label": "Centralized Records",
            "description": "Shared electronic platform or primary care as information hub"
          },
          {
            "label": "Regular Team Huddles",
            "description": "Weekly case review for complex patients (can be virtual)"
          },
          {
            "label": "Structured Referral",
            "description": "Clear clinical question, relevant findings, specific ask"
          },
          {
            "label": "Timely Reporting Back",
            "description": "Specialist reports back to referring clinician within 48-72h"
          },
          {
            "label": "Patient as Partner",
            "description": "Patient receives copy of all reports, understands plan"
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "Best practice for specialist-to-primary care communication:",
        "options": [
          "Wait until treatment is complete before reporting back",
          "Only communicate if findings are abnormal",
          "Report back to referring clinician within 48-72 hours with findings and plan",
          "Communicate directly with patient only, skip referring clinician"
        ],
        "correctAnswer": 2,
        "explanation": "Best practice: Specialist reports back to REFERRING CLINICIAN within 48-72 hours with assessment findings, treatment plan, and recommendations. Keeps primary care as central coordinator, ensures continuity, allows synthesis of multidisciplinary input. Patient also receives copy."
      }
    ],
    "referral-pathways": [
      {
        "kind": "scenario",
        "title": "Multidisciplinary Referral Decision",
        "patientSummary": "45-year-old construction worker, 3 weeks post-concussion from a workplace fall. Symptoms: persistent headache, dizziness when looking up, difficulty reading plans, anxiety about returning to heights.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "You have completed your initial assessment. The patient has vestibular symptoms (dizziness on position change), visual symptoms (difficulty with near work), cervical symptoms (headache worse with neck extension), and psychological symptoms (anxiety about heights). Which referral pattern is most appropriate?",
            "choices": [
              {
                "label": "Refer to neurology and wait for specialist opinion before other referrals",
                "nextStepId": "outcome-sequential"
              },
              {
                "label": "Refer simultaneously to vestibular physiotherapy, optometry, and psychology",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Manage everything yourself — you can treat all of these symptoms",
                "nextStepId": "outcome-solo"
              }
            ]
          },
          {
            "id": "outcome-sequential",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Sequential Referral",
              "explanation": "While neurology input may be valuable, waiting for specialist opinion before addressing vestibular, visual, and psychological symptoms delays recovery.",
              "clinicalReasoning": "Concurrent multidisciplinary management is more efficient. At 3 weeks post-injury, early intervention in modifiable symptom domains improves outcomes."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Parallel Multidisciplinary Referral",
              "explanation": "Excellent. Simultaneous referral to relevant specialists addresses all symptom domains concurrently, reducing total recovery time.",
              "clinicalReasoning": "Each symptom domain requires domain-specific expertise: vestibular physiotherapy for positional dizziness, optometry for accommodative/convergence dysfunction, psychology for occupational anxiety. These treatments do not conflict and can proceed in parallel."
            }
          },
          {
            "id": "outcome-solo",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Scope of Practice Concerns",
              "explanation": "Managing all symptom domains alone exceeds most practitioners' scope of practice and delays access to specialist interventions.",
              "clinicalReasoning": "Effective concussion management requires recognising the limits of individual scope and making timely referrals. The primary care role is coordination — not treating every domain independently."
            }
          }
        ]
      }
    ],
    "phased-management-framework": [
      {
        "kind": "ordering",
        "title": "Return-to-Activity Progression",
        "instruction": "Arrange these graduated return-to-sport stages in the correct order.",
        "items": [
          {
            "id": "rest",
            "label": "Symptom-limited activity (relative rest, 24-48h)",
            "rationale": "Brief rest followed by subsymptom-threshold activity."
          },
          {
            "id": "light",
            "label": "Light aerobic exercise (walking, swimming)",
            "rationale": "Increases heart rate without head impact risk."
          },
          {
            "id": "sport",
            "label": "Sport-specific exercise (running, skating)",
            "rationale": "Adds complexity and sport-specific movement patterns."
          },
          {
            "id": "non-contact",
            "label": "Non-contact training drills",
            "rationale": "Increases cognitive load and coordination demands."
          },
          {
            "id": "contact",
            "label": "Full-contact practice (after medical clearance)",
            "rationale": "Requires medical clearance before any contact."
          },
          {
            "id": "return",
            "label": "Return to competition",
            "rationale": "Final stage — normal game play."
          }
        ],
        "correctOrder": [
          "rest",
          "light",
          "sport",
          "non-contact",
          "contact",
          "return"
        ],
        "explanation": "The 6-stage graduated return-to-sport protocol (Amsterdam 2022) progresses from rest → light aerobic → sport-specific → non-contact drills → full-contact practice → competition. Each stage requires 24 hours minimum before advancing, and medical clearance is required before contact."
      }
    ],
    "cultural-safety": [
      {
        "kind": "multi-select",
        "question": "Which considerations are essential for culturally safe concussion management in Aboriginal and Torres Strait Islander communities? (Select all that apply)",
        "options": [
          "Understanding that health decisions may involve family and community elders",
          "Using plain language and avoiding medical jargon",
          "Recognising that \"concussion\" may not have a direct translation in all languages",
          "Providing written instructions only (standard care)",
          "Being aware that some symptoms may be described differently across cultures",
          "Ensuring assessment tools are culturally validated where possible"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          4,
          5
        ],
        "explanation": "Culturally safe practice involves community-inclusive decision-making, accessible language, awareness of linguistic differences, understanding varied symptom descriptions, and using culturally validated tools. Written-only instructions may not be appropriate for all patients — verbal and visual methods should also be used."
      }
    ],
    "neurology-role": [
      {
        "kind": "quick-check",
        "question": "When should a concussion patient be referred to a neurologist?",
        "options": [
          "All concussions require neurology referral",
          "Only if loss of consciousness occurred",
          "Persistent symptoms beyond 4 weeks, seizure activity, or focal neurological signs",
          "Only for medico-legal documentation"
        ],
        "correctAnswer": 2,
        "explanation": "Neurology referral is indicated for persistent symptoms beyond 4 weeks (suggesting prolonged post-concussion syndrome), any seizure activity post-injury, focal neurological signs on examination, worsening or atypical symptom trajectory, or diagnostic uncertainty. Not all concussions require neurology involvement — most resolve with primary care management within 2-4 weeks."
      }
    ],
    "case-example-multidisciplinary": [
      {
        "kind": "scenario",
        "title": "MDT Referral Decision",
        "patientSummary": "A 16-year-old hockey player, 3 weeks post-concussion. Persistent dizziness with head turns, NPC 9cm, cervical flexion-rotation test 28° (positive), PHQ-9 score of 13. Currently missing school.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "This patient presents with multiple concurrent issues. Based on the clinical findings, which specialist referral should you prioritise FIRST?",
            "clinicalData": [
              "Dizziness with head turns — vestibular involvement",
              "NPC 9cm (abnormal ≥6cm) — oculomotor dysfunction",
              "Cervical FRT 28° (positive <32°) — cervicogenic component",
              "PHQ-9 = 13 — moderate depression",
              "Missing school — academic impact"
            ],
            "choices": [
              {
                "label": "Psychology first — the PHQ-9 score of 13 indicates moderate depression requiring immediate attention",
                "nextStepId": "step-2-psych"
              },
              {
                "label": "Vestibular physiotherapy first — dizziness and oculomotor dysfunction are driving functional limitation",
                "nextStepId": "step-2-vestib"
              },
              {
                "label": "Neurology first — 3 weeks of persistent symptoms warrants specialist investigation",
                "nextStepId": "step-2-neuro"
              }
            ]
          },
          {
            "id": "step-2-psych",
            "narrative": "You have referred to psychology first. The psychologist reports that much of the low mood appears reactive to functional limitation and school absence. How do you prioritise the remaining referrals?",
            "clinicalData": [
              "PHQ-9 likely reactive rather than primary",
              "Vestibular and cervicogenic symptoms continue to limit daily function",
              "Patient increasingly frustrated with missing school"
            ],
            "choices": [
              {
                "label": "Refer to vestibular physio AND initiate return-to-learn accommodations simultaneously",
                "nextStepId": "outcome-acceptable"
              },
              {
                "label": "Wait for psychology treatment to progress before adding more appointments",
                "nextStepId": "outcome-suboptimal-wait"
              },
              {
                "label": "Refer to all remaining specialists at once — neurology, vestibular physio, optometry",
                "nextStepId": "outcome-suboptimal-flood"
              }
            ]
          },
          {
            "id": "step-2-vestib",
            "narrative": "You have prioritised vestibular physiotherapy. The physio confirms BPPV and oculomotor dysfunction. After two sessions, dizziness has improved but the patient reports worsening mood and neck pain. What is your next step?",
            "clinicalData": [
              "Dizziness improving with vestibular rehab",
              "Neck pain persisting — cervicogenic component untreated",
              "PHQ-9 now 15 — mood worsening",
              "Still missing school"
            ],
            "choices": [
              {
                "label": "Add cervicogenic physiotherapy, psychology referral, AND initiate return-to-learn plan — coordinate all providers",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Continue vestibular rehab only — address one issue at a time",
                "nextStepId": "outcome-suboptimal-serial"
              },
              {
                "label": "Refer to neurology for comprehensive workup before adding more therapists",
                "nextStepId": "outcome-acceptable-neuro"
              }
            ]
          },
          {
            "id": "step-2-neuro",
            "narrative": "The neurologist confirms post-concussion syndrome with vestibular, cervicogenic, and mood components. They recommend multidisciplinary management. How do you coordinate care?",
            "clinicalData": [
              "Neurology confirms PPCS — no additional pathology",
              "Recommends vestibular rehab, cervicogenic physio, psychology",
              "Patient has been waiting 2 weeks for neurology appointment — now 5 weeks post-injury"
            ],
            "choices": [
              {
                "label": "Refer to vestibular physio, cervicogenic physio, and psychology simultaneously with shared care plan",
                "nextStepId": "outcome-acceptable-delayed"
              },
              {
                "label": "Start with vestibular physio only and add specialists sequentially",
                "nextStepId": "outcome-suboptimal-serial"
              },
              {
                "label": "Begin all referrals AND establish return-to-learn accommodations with the school",
                "nextStepId": "outcome-optimal-delayed"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Best Practice MDT Coordination",
              "explanation": "Excellent. You prioritised the most functionally limiting symptoms first (vestibular/oculomotor), then expanded care to address emerging needs. Coordinating all providers with a shared care plan ensures consistent messaging and avoids conflicting advice.",
              "clinicalReasoning": "MDT management requires a lead clinician to coordinate referrals based on clinical priority, monitor progress across domains, and ensure return-to-learn is initiated early. Addressing physical symptoms often improves mood reactively — but mood should still be monitored and treated if it does not improve with functional gains."
            }
          },
          {
            "id": "outcome-optimal-delayed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Good Coordination — Delayed Start",
              "explanation": "Good MDT coordination with return-to-learn accommodations. However, waiting for the neurology appointment delayed treatment by 2 weeks. In this case, the clinical picture was clear enough to begin vestibular rehab and return-to-learn accommodations while awaiting the neurology review.",
              "clinicalReasoning": "Neurology referral was reasonable but not the highest priority given clear vestibular/oculomotor findings. Initiating treatment for identifiable phenotypes should not be delayed while awaiting specialist review, unless red flags are present."
            }
          },
          {
            "id": "outcome-acceptable",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Good Recovery — Reordered Priorities",
              "explanation": "Reasonable approach. You recognised that mood was reactive and pivoted to address physical symptoms and school return. Simultaneous vestibular rehab and return-to-learn is appropriate.",
              "clinicalReasoning": "When mood symptoms appear reactive to functional limitation, addressing the underlying physical barriers often improves mood. However, starting with psychology first delayed treatment of the more functionally limiting vestibular and oculomotor dysfunction."
            }
          },
          {
            "id": "outcome-acceptable-delayed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Appropriate but Delayed",
              "explanation": "The referral plan is appropriate, but waiting for neurology confirmation before starting any treatment added unnecessary delay. Clear clinical findings (positive BPPV, abnormal NPC, positive FRT) were sufficient to initiate treatment.",
              "clinicalReasoning": "Neurology referral is appropriate for persistent symptoms, but should not gate-keep access to physiotherapy and psychology when clinical findings clearly indicate treatable phenotypes."
            }
          },
          {
            "id": "outcome-acceptable-neuro",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Reasonable but Adds Delay",
              "explanation": "Neurology referral is reasonable for persistent symptoms, but the vestibular improvement demonstrates that treatment should continue while awaiting specialist review. Adding neurology at this stage should supplement — not replace — ongoing rehabilitation.",
              "clinicalReasoning": "Avoid \"serial referral\" patterns where each specialist visit must complete before the next begins. Concurrent management of multiple phenotypes is more efficient and prevents prolonged disability."
            }
          },
          {
            "id": "outcome-suboptimal-wait",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Unnecessary Delay",
              "explanation": "Waiting for psychology treatment to progress before addressing vestibular and cervicogenic symptoms prolongs disability. These physical symptoms are likely contributing to the low mood — treating them concurrently is more effective.",
              "clinicalReasoning": "Reactive mood symptoms often improve when the underlying functional limitations are addressed. Delaying physical rehabilitation while waiting for psychological treatment to take effect is a common coordination error in concussion management."
            }
          },
          {
            "id": "outcome-suboptimal-flood",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Referral Overload",
              "explanation": "Referring to all specialists simultaneously without prioritisation can overwhelm the patient (especially an adolescent), create scheduling conflicts, and lead to conflicting advice without a coordinated care plan.",
              "clinicalReasoning": "MDT management requires strategic prioritisation, not blanket referral. A lead clinician should sequence referrals based on clinical urgency, patient capacity, and functional impact — then coordinate communication between providers."
            }
          },
          {
            "id": "outcome-suboptimal-serial",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Serial Treatment — Too Slow",
              "explanation": "Addressing one issue at a time in sequence unnecessarily prolongs recovery. This patient has multiple concurrent treatable conditions — vestibular, cervicogenic, and mood — that can and should be managed in parallel.",
              "clinicalReasoning": "Serial referral patterns (completing one treatment before starting the next) are a common source of prolonged disability in concussion. Concurrent management with coordinated communication between providers is the evidence-based approach."
            }
          }
        ]
      }
    ]
  },
  "6": {
    "rtp-overview": [
      {
        "kind": "key-concept",
        "title": "6-Stage RTS Protocol - Key Rules",
        "content": "1) Minimum 24h between stages, 2) Must be symptom-free at REST before Stage 2, 3) If symptoms return → drop back to previous stage, 4) Pediatric: may need 48-72h per stage, 5) Medical clearance required before Stage 5."
      },
      {
        "kind": "insight",
        "type": "warning",
        "title": "Never Same-Day Return",
        "content": "SAME-DAY RETURN TO PLAY is NEVER permitted (except professional sports with immediate specialist assessment). Standard practice: immediate removal, evaluation, staged return over days-weeks. Risk of re-injury is 3-5x higher in first 10 days."
      },
      {
        "kind": "scenario",
        "title": "Return-to-Play Decision",
        "patientSummary": "16-year-old male AFL player, 12 days post-concussion. All symptoms resolved for 48 hours. Has completed stages 1-4 of the graduated return-to-sport protocol without symptom recurrence. Parents asking when he can play.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The player is symptom-free and has tolerated non-contact training (Stage 4). His parents want him to play in the grand final this weekend. What is your recommendation?",
            "clinicalData": [
              "Symptom-free for 48 hours",
              "Completed Stages 1-4 without issues",
              "Age: 16 (under 18)",
              "Previous concussions: 0"
            ],
            "choices": [
              {
                "label": "He is symptom-free and has progressed through stages — clear for the grand final",
                "nextStepId": "outcome-premature"
              },
              {
                "label": "He needs to complete Stage 5 (full-contact practice) and medical clearance before return to competition",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Under-18 athletes should wait a minimum of 4 weeks regardless of symptoms",
                "nextStepId": "outcome-over-cautious"
              }
            ]
          },
          {
            "id": "outcome-premature",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Skipped Protocol Stage",
              "explanation": "Skipping Stage 5 (full-contact practice) means the athlete has not been tested under game-like conditions. Each protocol stage must be completed before advancing.",
              "clinicalReasoning": "Stage 5 (full-contact practice) exists specifically to test symptom response under contact conditions before competition exposure. Medical clearance is also required before any contact. The grand final timing does not change clinical requirements."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Protocol-Compliant Decision",
              "explanation": "Correct. Full-contact practice (Stage 5) and formal medical clearance are required before return to competition, regardless of symptom resolution.",
              "clinicalReasoning": "The Amsterdam 2022 protocol mandates minimum 24 hours at each stage. For under-18 athletes, some guidelines recommend longer intervals. Medical clearance (not just self-report) is required before contact. Game importance does not influence clinical decisions."
            }
          },
          {
            "id": "outcome-over-cautious",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Overly Conservative",
              "explanation": "While some organisations recommend extended timelines for youth, current guidelines do not mandate a fixed 4-week minimum. The protocol is symptom-guided, not time-based.",
              "clinicalReasoning": "The graduated protocol is individualised. Youth athletes may take longer at each stage, but there is no evidence-based mandate for a minimum 4-week wait if the protocol is completed without symptoms. However, conservative approaches are always defensible for youth athletes."
            }
          }
        ]
      }
    ],
    "rtp-progression-rules": [
      {
        "kind": "flowchart",
        "title": "6-Stage Return-to-Sport Protocol",
        "steps": [
          {
            "label": "Stage 1: Symptom-Limited Activity",
            "description": "Daily activities that don't provoke symptoms. Gradual reintroduction of work/school."
          },
          {
            "label": "Stage 2: Light Aerobic Exercise",
            "description": "Walking, swimming, stationary cycling at <70% max HR. NO resistance training."
          },
          {
            "label": "Stage 3: Sport-Specific Exercise",
            "description": "Running drills, skating drills. NO head impact activities."
          },
          {
            "label": "Stage 4: Non-Contact Training Drills",
            "description": "Harder training drills (passing, shooting). May start progressive resistance training."
          },
          {
            "label": "Stage 5: Full Contact Practice",
            "description": "Full participation in normal training after medical clearance."
          },
          {
            "label": "Stage 6: Return to Sport",
            "description": "Normal game play with full medical clearance."
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "An athlete develops mild headache during Stage 3 (sport-specific drills). Proper response:",
        "options": [
          "Push through - mild symptoms are acceptable",
          "Continue Stage 3 with lower intensity",
          "Drop back to Stage 2, rest 24h, then retry Stage 3",
          "Skip to Stage 5 after 24h rest"
        ],
        "correctAnswer": 2,
        "explanation": "ANY symptom return during a stage → DROP BACK to previous stage, rest 24 hours, then retry the symptomatic stage. Document triggers. Never push through symptoms - this delays recovery and increases re-injury risk."
      },
      {
        "kind": "ordering",
        "title": "Graduated Return-to-Sport Protocol",
        "instruction": "Arrange the return-to-sport stages in the correct Amsterdam 2022 consensus order.",
        "items": [
          {
            "id": "stage1",
            "label": "Stage 1: Symptom-limited activity (daily activities that do not provoke symptoms)",
            "rationale": "Gradual reintroduction of daily cognitive and physical activity."
          },
          {
            "id": "stage2",
            "label": "Stage 2: Light aerobic exercise (walking, swimming, cycling <70% max HR)",
            "rationale": "No resistance training. Increases heart rate without impact or complex movements."
          },
          {
            "id": "stage3",
            "label": "Stage 3: Sport-specific exercise (running drills, skating — no head impact)",
            "rationale": "Adds movement complexity. No contact or head impact risk activities."
          },
          {
            "id": "stage4",
            "label": "Stage 4: Non-contact training drills (may start progressive resistance training)",
            "rationale": "Increases exercise intensity, adds coordination and cognitive load."
          },
          {
            "id": "stage5",
            "label": "Stage 5: Full-contact practice (requires medical clearance)",
            "rationale": "Normal training activities — this is the first stage with contact."
          },
          {
            "id": "stage6",
            "label": "Stage 6: Return to sport/competition",
            "rationale": "Normal game play. Player is fully cleared."
          }
        ],
        "correctOrder": [
          "stage1",
          "stage2",
          "stage3",
          "stage4",
          "stage5",
          "stage6"
        ],
        "explanation": "The Amsterdam 2022 consensus recommends a minimum 24 hours at each stage before progressing. If symptoms recur, drop back to the previous asymptomatic stage. Medical clearance is required before Stage 5 (contact). For children/adolescents, longer at each stage may be appropriate."
      }
    ],
    "rtp-medical-clearance": [
      {
        "kind": "key-concept",
        "title": "Clearance Criteria (All Must Be Met)",
        "content": "1) Symptom-free at rest AND with exertion, 2) Normal clinical exam (VOMS, BESS, cognitive), 3) Completed full 6-stage protocol without symptoms, 4) Return to academic baseline (if student), 5) Medical provider documentation. A residual NPC ≥6cm is a positive oculomotor screen — a flag warranting vestibulo-ocular assessment (and treatment of any confirmed convergence insufficiency) before progressing to final clearance."
      },
      {
        "kind": "quick-check",
        "question": "An athlete progresses through Stages 1-5 but has residual near-point convergence (NPC) of 10cm. Your decision:",
        "options": [
          "Clear for full return - protocol complete",
          "Withhold clearance - refer vision therapy first",
          "Clear with restrictions - no contact initially",
          "Repeat BESS testing only"
        ],
        "correctAnswer": 1,
        "explanation": "An NPC of 10cm is well beyond the ≥6cm positive-screen cutoff and indicates unresolved convergence insufficiency. The Amsterdam consensus does not list NPC as an absolute contraindication, but a positive oculomotor screen is a flag warranting vestibulo-ocular assessment before progression — withhold final clearance, refer to optometry/vision therapy, and reassess. Clearing with unaddressed visual dysfunction risks symptom recurrence and impaired on-field visual performance."
      }
    ],
    "rtl-overview": [
      {
        "kind": "insight",
        "type": "info",
        "title": "Return-to-Learn Takes Priority",
        "content": "RTL must begin BEFORE and progress ALONGSIDE RTS. Academic success and cognitive recovery are primary concerns for student-athletes. Don't progress to RTS Stage 5 (full contact) until RTL is complete or near-complete."
      },
      {
        "kind": "flowchart",
        "title": "4-Stage Return-to-Learn Strategy (Amsterdam 2022)",
        "steps": [
          {
            "label": "Stage 1: Daily Activities at Home That Do Not Worsen Symptoms",
            "description": "Typical daily activities in short bursts (5-15 min of reading or screen time), gradually building up"
          },
          {
            "label": "Stage 2: School Activities Outside the Classroom",
            "description": "Homework, reading and other cognitive activities at home, in longer sessions with rest breaks"
          },
          {
            "label": "Stage 3: Return to School Part-Time",
            "description": "Gradual reintroduction — half-days or selected classes with accommodations (breaks, reduced workload)"
          },
          {
            "label": "Stage 4: Return to School Full-Time",
            "description": "Full attendance, gradually increasing until a full day is tolerated; phase out remaining accommodations"
          }
        ]
      },
      {
        "kind": "matching",
        "title": "Return-to-Learn Accommodations",
        "instruction": "Match each return-to-learn stage to the appropriate academic accommodations.",
        "pairs": [
          {
            "id": "stage1",
            "left": "Stage 1: Daily activities at home that do not worsen symptoms",
            "right": "Limit screen time, short reading periods (5-15 min), no homework",
            "explanation": "Brief cognitive activity that does not provoke symptoms, avoiding prolonged inactivity."
          },
          {
            "id": "stage2",
            "left": "Stage 2: School activities outside the classroom",
            "right": "Homework and reading at home in longer sessions, with scheduled rest breaks",
            "explanation": "Cognitive load increases at home (homework, reading) before returning to the school environment."
          },
          {
            "id": "stage3",
            "left": "Stage 3: Return to school part-time",
            "right": "Half-days or selected classes, reduced workload, extra time, quiet environment",
            "explanation": "Gradual return to the classroom with significant accommodations to manage cognitive fatigue."
          },
          {
            "id": "stage4",
            "left": "Stage 4: Return to school full-time",
            "right": "Full attendance, phasing out remaining supports until full participation including exams",
            "explanation": "Complete return to normal academic functioning as tolerance allows."
          }
        ],
        "leftLabel": "Return-to-Learn Stage",
        "rightLabel": "Accommodations"
      }
    ],
    "academic-accommodations": [
      {
        "kind": "key-concept",
        "title": "Common Academic Accommodations",
        "content": "Extended time (50-100% extra), reduced course load, quiet testing room, permission to leave if symptomatic, excused absences, no PE, reduced screen time, note-taking assistance, preferential seating, elevator access. Formalize via Section 504 Plan (USA) or equivalent."
      },
      {
        "kind": "quick-check",
        "question": "A student reports increased headache and fatigue after 3 hours of class. Best accommodation:",
        "options": [
          "No accommodations - push through symptoms",
          "Reduce to part-time (half-day) with rest breaks",
          "Home tutoring only",
          "Complete school suspension until asymptomatic"
        ],
        "correctAnswer": 1,
        "explanation": "Cognitive fatigue after 3h → reduce to PART-TIME school day (half-day) with strategic rest breaks. Allows gradual cognitive retraining without prolonged symptom exacerbation. Complete isolation delays recovery; pushing through worsens symptoms."
      }
    ],
    "rtw-overview": [
      {
        "kind": "flowchart",
        "title": "Graduated Return-to-Work Protocol",
        "steps": [
          {
            "label": "Step 1: Work Tasks at Home",
            "description": "Light work activities at home in short sessions (30-60 min)"
          },
          {
            "label": "Step 2: Part-Time Work from Home",
            "description": "Increased hours (2-4h/day) from home with breaks"
          },
          {
            "label": "Step 3: Part-Time On-Site Work",
            "description": "Gradual workplace reintegration, modified duties"
          },
          {
            "label": "Step 4: Full-Time with Modifications",
            "description": "Full hours with workplace accommodations"
          },
          {
            "label": "Step 5: Full Duties",
            "description": "Unrestricted return to pre-injury role"
          }
        ]
      },
      {
        "kind": "insight",
        "type": "success",
        "title": "Workplace Accommodations",
        "content": "Flexible hours, frequent breaks, reduced screen time, quiet workspace, modified lighting, permission to work from home, temporary reassignment from high-risk duties (driving, heights, machinery). Medical documentation supports accommodations under disability laws."
      }
    ],
    "neurocognitive-testing": [
      {
        "kind": "quick-check",
        "question": "When is formal neuropsychological testing MOST appropriate in concussion management?",
        "options": [
          "Within the first 24 hours to establish injury severity",
          "Routinely for all concussions to guide return-to-play",
          "When cognitive symptoms persist beyond expected recovery or accommodations are needed",
          "Only in medico-legal contexts"
        ],
        "correctAnswer": 2,
        "explanation": "Formal neuropsychological testing is NOT routine for all concussions. It is indicated when cognitive symptoms persist beyond expected recovery, objective documentation is needed for academic/workplace accommodations, or pre-existing learning difficulties complicate the picture. Early testing (<72 hours) has poor specificity and is not recommended."
      }
    ],
    "workplace-accommodations": [
      {
        "kind": "quick-check",
        "question": "Prolonged complete work absence (>3 months) after concussion is associated with:",
        "options": [
          "Better long-term recovery outcomes",
          "No effect on prognosis",
          "Increased risk of disability and poor functional outcomes",
          "Faster return to pre-injury function"
        ],
        "correctAnswer": 2,
        "explanation": "Prolonged complete work absence after concussion is associated with increased risk of chronic disability, deconditioning, social isolation, and poor functional outcomes. Evidence consistently shows that early partial return to work — even with significant accommodations such as reduced hours, modified duties, and environmental adjustments — predicts better long-term recovery than extended complete absence."
      }
    ],
    "case-studies-return": [
      {
        "kind": "scenario",
        "title": "Return to Play Decision",
        "patientSummary": "16-year-old rugby player, Day 10 post-concussion. Symptom-free at rest for 48 hours. Completed light aerobic exercise (Stage 2) without symptom recurrence. Coach says: 'Finals are next week.'",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The patient is symptom-free at rest and has tolerated Stage 2 (light aerobic exercise). The coach is pressuring for rapid clearance because finals are next week. What is your decision?",
            "clinicalData": [
              "Day 10 post-concussion",
              "Symptom-free at rest for 48 hours",
              "Completed Stage 2 (light aerobic exercise) without symptoms",
              "Coach requesting expedited clearance for finals",
              "16-year-old — paediatric RTP protocol applies"
            ],
            "choices": [
              {
                "label": "Clear for full contact practice — symptom-free and tolerating exercise",
                "nextStepId": "outcome-premature-clear"
              },
              {
                "label": "Continue graduated RTP protocol — minimum 24 hours per stage, no stages can be skipped",
                "nextStepId": "step-2"
              },
              {
                "label": "Hold all activity for another week to be safe, then reassess",
                "nextStepId": "outcome-overcautious"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You have correctly decided to continue the graduated RTP protocol. The patient progresses through Stage 3 (sport-specific exercise) and Stage 4 (non-contact training drills) over the next 2 days without symptom recurrence. What is the next step before full contact?",
            "clinicalData": [
              "Stage 3 completed — sport-specific drills, no symptoms",
              "Stage 4 completed — non-contact training, no symptoms",
              "Now Day 12 post-concussion",
              "Finals in 5 days"
            ],
            "choices": [
              {
                "label": "Proceed to Stage 5 (full contact practice) and clear for finals if tolerated",
                "nextStepId": "outcome-skip-medical"
              },
              {
                "label": "Medical clearance assessment required before Stage 5 — then full contact practice, then match play (Stage 6)",
                "nextStepId": "step-3"
              },
              {
                "label": "Clear directly to match play — patient has shown progression through all stages",
                "nextStepId": "outcome-premature-clear"
              }
            ]
          },
          {
            "id": "step-3",
            "narrative": "Medical clearance has been obtained. The patient completes Stage 5 (full contact practice) without symptom recurrence. What documentation is required before return to match play?",
            "clinicalData": [
              "Stage 5 (full contact practice) completed without symptoms",
              "Medical clearance obtained",
              "Day 14 post-concussion",
              "Finals in 3 days"
            ],
            "choices": [
              {
                "label": "Verbal clearance to coach is sufficient — the player is ready",
                "nextStepId": "outcome-poor-documentation"
              },
              {
                "label": "Written medical clearance documenting: all RTP stages completed, dates/duration per stage, clinical assessment findings, and informed consent discussion with player and parents",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Email the coach confirming clearance — no formal documentation needed for return to sport",
                "nextStepId": "outcome-poor-documentation"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Best Practice RTP Management",
              "explanation": "Excellent. You followed the graduated RTP protocol (minimum 24 hours per stage), obtained medical clearance before full contact, and ensured comprehensive documentation. Written clearance protects the clinician, the athlete, and the organisation.",
              "clinicalReasoning": "The 6-stage graduated RTP protocol requires minimum 24 hours per stage (paediatric protocols may require 48 hours per stage). Medical clearance is mandatory before Stage 5 (full contact). Documentation must include dates, symptom status at each stage, clinical assessment findings, and evidence of informed consent with both the player and parent/guardian for minors."
            }
          },
          {
            "id": "outcome-premature-clear",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Premature Clearance — Unsafe",
              "explanation": "Clearing directly to full contact or match play without completing all graduated stages is unsafe and violates consensus guidelines. Even symptom-free patients must complete every stage sequentially with minimum 24-hour intervals.",
              "clinicalReasoning": "The graduated RTP protocol exists because symptom freedom at rest does not guarantee tolerance of increasing cognitive and physical demands. Each stage progressively increases load to detect latent symptom provocation. Skipping stages risks re-injury during the vulnerable neurometabolic window."
            }
          },
          {
            "id": "outcome-overcautious",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Overly Conservative",
              "explanation": "While caution is understandable, holding all activity for an additional week when the patient is symptom-free and tolerating Stage 2 is not evidence-based. Unnecessary delays prolong recovery, increase deconditioning, and can worsen psychological wellbeing.",
              "clinicalReasoning": "Current evidence supports graduated progression as tolerated. Prolonged rest beyond 48 hours is associated with increased symptom burden and delayed recovery. If the patient is tolerating stages without symptom recurrence, progression should continue at minimum 24-hour intervals."
            }
          },
          {
            "id": "outcome-skip-medical",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Missing Medical Clearance",
              "explanation": "Medical clearance is mandatory before proceeding to Stage 5 (full contact practice). Progressing to contact without formal medical assessment and clearance puts the patient at risk and exposes the clinician to medico-legal liability.",
              "clinicalReasoning": "The Amsterdam 2022 Consensus requires medical clearance before return to full contact. This must include clinical assessment (not just self-reported symptom freedom), and for minors, involvement of a parent or guardian in the consent process."
            }
          },
          {
            "id": "outcome-poor-documentation",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Inadequate Documentation",
              "explanation": "Verbal or informal clearance is insufficient. Written medical clearance is essential for medico-legal protection and continuity of care. Documentation must include all RTP stages completed with dates, clinical assessment findings, and informed consent.",
              "clinicalReasoning": "In the event of re-injury, inadequate documentation exposes the clinician to significant medico-legal risk. Written clearance should be provided to the player, parent/guardian (for minors), and the sporting organisation. \"If it isn't documented, it didn't happen.\""
            }
          }
        ]
      }
    ]
  },
  "7": {
    "phenotype-framework": [
      {
        "kind": "key-concept",
        "title": "6 Clinical Phenotypes (Ellis Classification)",
        "content": "1) Physiological/Autonomic (Buffalo Test), 2) Vestibular-Ocular (VOMS+), 3) Cervicogenic (neck pain), 4) Cognitive-Fatigue (concentration), 5) Post-traumatic Migraine (headache), 6) Anxiety/Mood (PHQ-9/GAD-7). MOST patients have MIXED phenotypes - treat all contributors."
      },
      {
        "kind": "insight",
        "type": "info",
        "title": "Mixed Phenotypes Are the Norm",
        "content": "Most patients have 2-3 dominant phenotypes. Single-approach treatment FAILS. Example: headache + dizziness + neck pain = migraine + vestibular + cervicogenic → requires combined pharmacotherapy + vestibular rehab + cervical physio."
      },
      {
        "kind": "quick-check",
        "question": "Patient has positive VOMS, neck stiffness, and PHQ-9 score of 12. This represents:",
        "options": [
          "Single vestibular phenotype",
          "Mixed phenotype: vestibular + cervicogenic + mood",
          "Malingering",
          "Normal post-concussion recovery"
        ],
        "correctAnswer": 1,
        "explanation": "Positive VOMS (vestibular) + neck stiffness (cervicogenic) + PHQ-9≥10 (depression) = MIXED PHENOTYPE requiring: vestibular physio + cervical treatment + psychology referral. Address all three simultaneously for optimal outcomes."
      }
    ],
    "vestibular-rehab-detailed": [
      {
        "kind": "flowchart",
        "title": "Vestibular Rehabilitation Protocol",
        "steps": [
          {
            "label": "Week 1-2: VOR x1 Exercises",
            "description": "Gaze stabilization: hold target, rotate head. 30 sec × 3 sets, 2-3x/day"
          },
          {
            "label": "Week 2-3: Add Habituation",
            "description": "Controlled exposure to symptom triggers (head rolls, bending)"
          },
          {
            "label": "Week 3-4: Progress to VOR x2",
            "description": "Head and target move opposite directions. More challenging."
          },
          {
            "label": "Week 4-6: Dynamic Balance",
            "description": "Standing on foam, walking with head turns, sport-specific drills"
          },
          {
            "label": "Week 6-8: Visual Motion Desensitization",
            "description": "Exposure to busy environments, scrolling screens"
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "VOR x1 exercises involve:",
        "options": [
          "Patient closes eyes and rotates head",
          "Patient holds target steady, rotates head while maintaining focus",
          "Patient rotates entire body, not head",
          "Patient tracks moving target with eyes only"
        ],
        "correctAnswer": 1,
        "explanation": "VOR x1 = hold target at arm's length, rotate head side-to-side while maintaining focus on target. Goal: visual stability during head movement. Start sitting, 30 sec × 3 sets, progress to faster movements and standing."
      },
      {
        "kind": "ordering",
        "title": "Vestibular Rehabilitation Progression",
        "instruction": "Arrange these vestibular rehabilitation exercises from simplest to most challenging.",
        "items": [
          {
            "id": "gaze",
            "label": "Gaze stabilisation (VOR x1) — stationary, head turns only",
            "rationale": "Foundational exercise targeting vestibulo-ocular reflex with minimal balance demand."
          },
          {
            "id": "standing",
            "label": "Static balance exercises (feet together, eyes open)",
            "rationale": "Adds balance challenge while visual input is available."
          },
          {
            "id": "foam",
            "label": "Balance on foam surface (altered somatosensory input)",
            "rationale": "Challenges balance by reducing somatosensory reliability."
          },
          {
            "id": "dynamic",
            "label": "Dynamic balance with head turns (walking + VOR)",
            "rationale": "Combines locomotion with vestibular exercise — dual-task demand."
          },
          {
            "id": "sport",
            "label": "Sport-specific balance challenges (uneven surfaces, reactive movements)",
            "rationale": "Highest level — prepares for return to sport demands."
          }
        ],
        "correctOrder": [
          "gaze",
          "standing",
          "foam",
          "dynamic",
          "sport"
        ],
        "explanation": "Vestibular rehabilitation follows a progression from simple (isolated VOR exercises) to complex (sport-specific dynamic balance). Each level should be mastered before advancing. Exercise difficulty is modulated by surface (firm → foam → unstable), vision (eyes open → closed), and task complexity (static → dynamic → dual-task)."
      }
    ],
    "vision-therapy-detailed": [
      {
        "kind": "key-concept",
        "title": "Vision Therapy Exercises",
        "content": "Convergence: Pencil push-ups (15x, 2x/day), Brock string. Accommodation: Near-far focus, Hart charts. Saccades: Rapid target jumps. Smooth Pursuit: Track moving objects. Goal: restore NPC from ≥6cm (positive screen) to less than 6cm (normal) in 6-12 weeks."
      },
      {
        "kind": "insight",
        "type": "success",
        "title": "Convergence Insufficiency Treatment",
        "content": "Pencil push-ups: Slowly bring pencil toward nose until diplopia (double vision) occurs, then back away slightly. Hold 15 seconds. Repeat 15x, 2x/day. 70-80% success rate in 6-12 weeks. Combine with Brock string and computer-based training."
      },
      {
        "kind": "quick-check",
        "question": "Goal of convergence exercises (pencil push-ups):",
        "options": [
          "Improve distance vision",
          "Restore NPC from ≥6cm to less than 6cm (normal)",
          "Treat vestibular dysfunction",
          "Eliminate all headaches"
        ],
        "correctAnswer": 1,
        "explanation": "Convergence exercises aim to improve NPC from ≥6cm (convergence insufficiency — a positive screen) back to less than 6cm (normal). Treats difficulty reading, headache with near work, words jumping on page. Typically 6-12 weeks of daily exercises."
      }
    ],
    "cervicogenic-rehab-detailed": [
      {
        "kind": "flowchart",
        "title": "Cervicogenic Treatment Protocol",
        "steps": [
          {
            "label": "Week 1-2: Manual Therapy",
            "description": "C1-C2 mobilization, soft tissue release. 1-2x/week"
          },
          {
            "label": "Week 2-4: Proprioceptive Retraining",
            "description": "Joint position sense, laser pointer exercises"
          },
          {
            "label": "Week 3-6: Deep Neck Flexor Strengthening",
            "description": "Chin tucks with pressure biofeedback. 10 sec × 10 reps daily"
          },
          {
            "label": "Week 4-8: Postural Correction",
            "description": "Scapular retraction, thoracic extension, ergonomics"
          },
          {
            "label": "Ongoing: Home Exercise Program",
            "description": "Daily DNF exercises, ROM, posture awareness"
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "C1-C2 flexion-rotation test shows 25° right, 42° left. This indicates:",
        "options": [
          "Normal - within expected asymmetry",
          "Right-sided C1-C2 dysfunction",
          "Left-sided pathology",
          "Non-specific finding"
        ],
        "correctAnswer": 1,
        "explanation": ">10° asymmetry indicates C1-C2 dysfunction on the RESTRICTED side. The right side shows reduced rotation (25° vs 42°), indicating right C1-C2 dysfunction. This strongly correlates with cervicogenic headache and requires targeted cervical treatment."
      },
      {
        "kind": "insight",
        "type": "warning",
        "title": "Deep Neck Flexor Weakness",
        "content": "Forward head posture weakens deep neck flexors, increases suboccipital tension. Chin tuck exercises with pressure biofeedback (target 22-30 mmHg) restores proper activation. Essential for cervicogenic headache resolution. Daily compliance required."
      }
    ],
    "cognitive-rehab-detailed": [
      {
        "kind": "key-concept",
        "title": "Graduated Cognitive Activation",
        "content": "Start 15-20 min cognitive work, gradually increase. Use Pomodoro (25 min work, 5 min break). Avoid 'boom-bust' cycles. Environmental mods: quiet space, dim lights, blue-light filters. Compensatory strategies: planners, reminders, task breakdown."
      },
      {
        "kind": "quick-check",
        "question": "'Boom-bust cycle' in cognitive rehabilitation refers to:",
        "options": [
          "Gradually increasing cognitive load over time",
          "Overdoing on good days, then crashing → worsens symptoms",
          "Taking frequent breaks during work",
          "Complete cognitive rest for 4 weeks"
        ],
        "correctAnswer": 1,
        "explanation": "Boom-bust = overdoing activity on good days (boom), leading to symptom flare and extended rest (bust). This pattern DELAYS recovery. Solution: PACING - consistent daily structure with work-rest ratios (e.g., 25 min work, 5 min break) regardless of how you feel."
      }
    ],
    "migraine-rehab-detailed": [
      {
        "kind": "insight",
        "type": "info",
        "title": "Post-Traumatic Migraine vs Tension Headache",
        "content": "PTM: Pulsating, photophobia, phonophobia, nausea, worse with activity. Tension: Band-like pressure, no nausea, not worse with activity. PTM requires migraine-specific treatment (triptans, preventatives). History of migraine increases PTM risk 3-5x."
      },
      {
        "kind": "quick-check",
        "question": "First-line abortive treatment for post-traumatic migraine:",
        "options": [
          "Opioids",
          "Paracetamol/acetaminophen only",
          "Triptans (sumatriptan, rizatriptan)",
          "Caffeine only"
        ],
        "correctAnswer": 2,
        "explanation": "Triptans (e.g., sumatriptan 50-100mg, rizatriptan 10mg) are FIRST-LINE for post-traumatic migraine with severe attacks. Contraindicated in uncontrolled HTN, cardiovascular disease. Avoid opioids. Limit triptan use to <10 days/month to prevent medication overuse headache."
      }
    ],
    "exercise-prescription": [
      {
        "kind": "scenario",
        "title": "Exercise Prescription for Concussion Recovery",
        "patientSummary": "30-year-old recreational runner, 2 weeks post-concussion. Symptoms include headache (3/10 at rest, 6/10 with exertion), exercise intolerance, and fatigue. Buffalo Treadmill Test shows symptom exacerbation at 75% max HR.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The Buffalo Treadmill Test has identified the symptom exacerbation threshold at 75% of age-predicted max HR. How do you prescribe exercise?",
            "clinicalData": [
              "Symptom exacerbation threshold: 75% max HR (143 bpm)",
              "Resting symptoms: Headache 3/10",
              "Exercise history: Regular runner pre-injury"
            ],
            "choices": [
              {
                "label": "Prescribe exercise at exactly 75% max HR — the threshold",
                "nextStepId": "outcome-at-threshold"
              },
              {
                "label": "Prescribe exercise at 80% of the threshold (60% max HR / ~114 bpm)",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "No exercise until completely symptom-free",
                "nextStepId": "outcome-delayed"
              }
            ]
          },
          {
            "id": "outcome-at-threshold",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Exercise at Threshold",
              "explanation": "Exercising at the exact symptom exacerbation point will consistently provoke symptoms and is counterproductive.",
              "clinicalReasoning": "The prescription should be at 80% of the threshold (subsymptom level) to allow cardiovascular benefit without symptom provocation. This means ~60% max HR in this case."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Subsymptom-Threshold Prescription",
              "explanation": "Excellent. 80% of the symptom exacerbation threshold provides cardiovascular stimulus while staying below the symptom provocation point.",
              "clinicalReasoning": "Leddy et al. prescribe 80% of the Buffalo Treadmill Test threshold, 20-30 minutes, 5-6 days per week. Retest every 1-2 weeks and progress the threshold as it improves. Walking, stationary cycling, or swimming are preferred modalities."
            }
          },
          {
            "id": "outcome-delayed",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Unnecessary Delay",
              "explanation": "Current evidence strongly supports early subsymptom-threshold aerobic exercise. Waiting for full symptom resolution delays the therapeutic benefit of controlled exercise.",
              "clinicalReasoning": "Randomised controlled trials demonstrate that early aerobic exercise (within 2 weeks of injury) accelerates recovery compared to stretching-only or rest controls. Exercise improves cerebrovascular autoregulation and autonomic function."
            }
          }
        ]
      }
    ],
    "ans-dysfunction": [
      {
        "kind": "multi-select",
        "question": "Which of the following are signs of autonomic nervous system (ANS) dysfunction following concussion? (Select all that apply)",
        "options": [
          "Exercise intolerance (symptom exacerbation with physical exertion)",
          "Resting tachycardia or altered heart rate variability",
          "Orthostatic intolerance (dizziness on standing)",
          "Pupil dilation asymmetry",
          "Excessive sweating or temperature dysregulation",
          "Reduced baroreceptor sensitivity"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          4,
          5
        ],
        "explanation": "Exercise intolerance, altered HRV, orthostatic intolerance, temperature dysregulation, and reduced baroreceptor sensitivity are all recognised features of post-concussion ANS dysfunction. Pupil asymmetry may indicate cranial nerve III involvement rather than ANS dysfunction specifically."
      }
    ],
    "ans-clinical-case": [
      {
        "kind": "quick-check",
        "question": "A concussion patient reports exercise intolerance — heart rate spikes to 160 bpm during light jogging with headache onset. What does this MOST likely indicate?",
        "options": [
          "Poor cardiovascular fitness unrelated to the concussion",
          "Autonomic nervous system dysfunction with impaired cerebrovascular autoregulation",
          "A cardiac condition requiring cardiology referral",
          "The patient is malingering to avoid returning to sport"
        ],
        "correctAnswer": 1,
        "explanation": "Exercise intolerance with exaggerated heart rate response is a hallmark of post-concussion autonomic dysfunction. The Buffalo Concussion Treadmill Test can identify the symptom exacerbation threshold. Sub-threshold aerobic exercise prescription (at 80% of threshold heart rate) is a first-line treatment for this phenotype."
      }
    ],
    "mood-rehab-detailed": [
      {
        "kind": "quick-check",
        "question": "CBT for post-concussion mood disorders primarily targets:",
        "options": [
          "Physical rehabilitation exercises",
          "Catastrophic thinking patterns and avoidance behaviours",
          "Medication management",
          "Vestibular compensation"
        ],
        "correctAnswer": 1,
        "explanation": "Cognitive Behavioural Therapy (CBT) for post-concussion mood disorders primarily targets catastrophic thinking patterns (e.g., 'my brain is permanently damaged'), avoidance behaviours (withdrawing from activities due to fear of symptom worsening), and maladaptive coping strategies. CBT uses cognitive restructuring, gradual exposure to avoided activities, and behavioural activation to improve function. It does not address physical rehabilitation, medication, or vestibular compensation — those are managed by other members of the multidisciplinary team."
      }
    ]
  },
  "8": {
    "duty-of-care": [
      {
        "kind": "key-concept",
        "title": "Duty of Care Fundamentals",
        "content": "Legal obligation to provide care meeting professional standards. Failure = negligence if harm results. REMOVE from play when suspected. TIMELY specialist referral. PREMATURE clearance = potential liability. Document objective findings supporting all decisions."
      },
      {
        "kind": "insight",
        "type": "warning",
        "title": "'When in Doubt, Sit Them Out'",
        "content": "Legal AND ethical obligation to remove athlete when concussion suspected. Returning athlete with suspected concussion = BREACH OF DUTY. Even if athlete/coach/parent pressures return, YOU are legally responsible. Document removal decision and reasoning."
      },
      {
        "kind": "quick-check",
        "question": "An athlete is dazed after collision but wants to continue. Coach says 'he's fine.' Your obligation:",
        "options": [
          "Allow return if athlete feels okay",
          "Defer to coach's judgment - they know the athlete",
          "Remove from play immediately - 'when in doubt, sit them out'",
          "Allow return but monitor closely"
        ],
        "correctAnswer": 2,
        "explanation": "REMOVE FROM PLAY immediately. Legal and ethical obligation trumps athlete/coach preferences. 'When in doubt, sit them out' is the medicolegal standard. Comprehensive SCAT6 evaluation required before any consideration of return (typically not same-day). Document decision."
      },
      {
        "kind": "scenario",
        "title": "Duty of Care Under Pressure",
        "patientSummary": "A professional rugby league player sustains a significant head impact during a semi-final match. The team doctor is under pressure from coaching staff to clear the player to return.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The coach approaches you during your sideline assessment and says: \"He looks fine to me, we need him back out there. Can you just clear him?\" The player reports mild dizziness and a headache but says he wants to play.",
            "clinicalData": [
              "Observed: Significant head impact (shoulder to jaw)",
              "Player reports: Mild dizziness, headache 3/10",
              "Maddocks: 4/5 (missed one question)",
              "Balance: Mild postural sway on tandem stance"
            ],
            "choices": [
              {
                "label": "Clear the player — symptoms are mild and he wants to play",
                "nextStepId": "outcome-cleared"
              },
              {
                "label": "Remove from play — clinical findings are consistent with concussion, regardless of external pressure",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Allow the player to decide for himself whether to continue",
                "nextStepId": "outcome-deferred"
              }
            ]
          },
          {
            "id": "outcome-cleared",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Duty of Care Breach",
              "explanation": "Clearing a player with active concussion symptoms and abnormal examination findings breaches your duty of care, regardless of symptom severity or player willingness.",
              "clinicalReasoning": "Clinical findings (failed Maddocks, postural sway, dizziness, headache) indicate concussion. Your legal and ethical obligation is to the patient, not the team. Returning a concussed athlete to play risks second impact syndrome and prolonged recovery."
            }
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Duty of Care Upheld",
              "explanation": "Correct. Your duty of care is to the patient. Clinical findings consistent with concussion mandate removal from play regardless of external pressure.",
              "clinicalReasoning": "The Amsterdam 2022 consensus is clear: any suspected concussion = remove from play. The doctor-patient relationship takes precedence over the team-doctor contract. Document findings, communicate the decision clearly, and ensure appropriate follow-up."
            }
          },
          {
            "id": "outcome-deferred",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Abrogated Clinical Responsibility",
              "explanation": "A concussed athlete cannot make an informed decision about return to play. Concussion itself impairs judgment and decision-making.",
              "clinicalReasoning": "The medical practitioner is responsible for the clearance decision, not the patient. Cognitive impairment from concussion means the athlete cannot fully appreciate the risks. This is analogous to a patient under the influence of medication — their autonomy does not override clinical safety."
            }
          }
        ]
      }
    ],
    "informed-consent": [
      {
        "kind": "flowchart",
        "title": "Informed Consent Elements",
        "steps": [
          {
            "label": "1. Diagnosis & Condition",
            "description": "Explain concussion, expected recovery, potential complications"
          },
          {
            "label": "2. Treatment Options",
            "description": "Proposed plan with risks/benefits of each option"
          },
          {
            "label": "3. Alternatives",
            "description": "Include option of no treatment and its implications"
          },
          {
            "label": "4. Material Risks",
            "description": "What reasonable person would want to know (re-injury risk, prolonged symptoms)"
          },
          {
            "label": "5. Opportunity to Ask",
            "description": "Answer questions, ensure understanding (teach-back)"
          },
          {
            "label": "6. Voluntary Agreement",
            "description": "No coercion. Patient free to decline or withdraw consent"
          }
        ]
      },
      {
        "kind": "quick-check",
        "question": "TRUE or FALSE: Parental consent is sufficient for treating a 16-year-old athlete",
        "options": [
          "True - parent consent covers all minors",
          "False - mature minor doctrine may apply; adolescents should provide assent"
        ],
        "correctAnswer": 1,
        "explanation": "While parental consent is legally required for minors, best practice includes obtaining the adolescent's assent (agreement). The mature minor doctrine recognizes that teenagers can participate in healthcare decisions. Document both parent consent and athlete assent."
      },
      {
        "kind": "insight",
        "type": "info",
        "title": "Shared Decision-Making for RTS",
        "content": "Return-to-sport decisions in youth involve athlete, parents, healthcare team. Balance benefits (return to valued activity) vs risks (re-injury). Particularly important when athlete eager to return but medical team cautious. DOCUMENT discussions thoroughly."
      },
      {
        "kind": "multi-select",
        "question": "Which elements must be included in informed consent for concussion management? (Select all that apply)",
        "options": [
          "Nature of the condition (what concussion is)",
          "Expected recovery timeline and prognosis",
          "Risks of returning to activity too early",
          "Alternative treatment options available",
          "The practitioner's personal concussion history",
          "Risks of the proposed management plan"
        ],
        "correctAnswers": [
          0,
          1,
          2,
          3,
          5
        ],
        "explanation": "Informed consent requires disclosure of the condition, prognosis, risks of premature return, available alternatives, and risks of the proposed management. The practitioner's personal history is not relevant to informed consent."
      }
    ],
    "medico-legal-contexts": [
      {
        "kind": "key-concept",
        "title": "Medico-Legal Contexts",
        "content": "Workers Comp: Timely reporting (<48h), detailed functional restrictions, objective documentation. Litigation (MVA): Assume records will be scrutinized, avoid speculation about causation early. IME: No treatment relationship, objective assessment only."
      },
      {
        "kind": "quick-check",
        "question": "Documentation in litigation contexts should be:",
        "options": [
          "Brief and minimal to avoid legal scrutiny",
          "Detailed, objective, as if will be read in court",
          "Include speculation about long-term prognosis",
          "Omit subjective patient complaints"
        ],
        "correctAnswer": 1,
        "explanation": "Write as if it WILL be read in court. Detailed, objective, contemporaneous. Objective findings > subjective impressions. Avoid speculation (especially early about causation/permanence). No alterations. Explain jargon. Include patient reports (subjective) AND your findings (objective)."
      }
    ],
    "documentation-standards": [
      {
        "kind": "flowchart",
        "title": "Initial Concussion Assessment Documentation",
        "steps": [
          {
            "label": "Injury Details",
            "description": "Date/time/location, mechanism, forces involved"
          },
          {
            "label": "Immediate Symptoms",
            "description": "LOC duration, PTA duration, initial symptom severity"
          },
          {
            "label": "Red Flag Screen",
            "description": "Worsening headache, seizures, focal deficits, altered consciousness"
          },
          {
            "label": "Physical Examination",
            "description": "VOMS (scores), BESS (errors), cervical exam, cranial nerves"
          },
          {
            "label": "Cognitive Screening",
            "description": "Orientation, memory, Maddocks questions"
          },
          {
            "label": "Diagnosis & Plan",
            "description": "Diagnosis, initial management, return precautions, follow-up date"
          }
        ]
      },
      {
        "kind": "insight",
        "type": "success",
        "title": "Clearance Documentation Essentials",
        "content": "Must include: (1) Date symptom-free, (2) Completion of graduated protocol without recurrence, (3) Normal exam (VOMS, BESS, cognitive), (4) Clearance for unrestricted activities with effective date, (5) Any ongoing recommendations. Keep copy for your records."
      },
      {
        "kind": "quick-check",
        "question": "Best practice for clinical documentation:",
        "options": [
          "Document when convenient, can be days later",
          "Use abbreviations without explanation to save time",
          "Contemporaneous (documented when occurred), objective, legible",
          "Alter notes if you remember additional details later"
        ],
        "correctAnswer": 2,
        "explanation": "CONTEMPORANEOUS (document when occurred, not retrospectively), OBJECTIVE findings prioritized, LEGIBLE (typed preferred), NO alterations (if error: single line through, date/initial, write correction). Explain abbreviations. Write as if will be read in court years later."
      },
      {
        "kind": "ordering",
        "title": "Clinical Documentation Sequence",
        "instruction": "Arrange these documentation elements in the recommended order for a concussion consultation note.",
        "items": [
          {
            "id": "history",
            "label": "Mechanism of injury and presenting complaint",
            "rationale": "Establish context — what happened, when, how, and what symptoms are present."
          },
          {
            "id": "exam",
            "label": "Clinical examination findings (neurological, cervical, VOMS, BESS)",
            "rationale": "Document objective assessment findings using standardised tools."
          },
          {
            "id": "diagnosis",
            "label": "Clinical impression / diagnosis",
            "rationale": "State your clinical conclusion based on history and examination."
          },
          {
            "id": "plan",
            "label": "Management plan (treatment, activity modification, referrals)",
            "rationale": "Document agreed management, including restrictions and referral rationale."
          },
          {
            "id": "education",
            "label": "Patient education provided and consent obtained",
            "rationale": "Record what information was given, that it was understood, and consent obtained."
          },
          {
            "id": "followup",
            "label": "Follow-up plan and safety-netting advice",
            "rationale": "Document when to return, red flag symptoms to watch for, and emergency contact details."
          }
        ],
        "correctOrder": [
          "history",
          "exam",
          "diagnosis",
          "plan",
          "education",
          "followup"
        ],
        "explanation": "Concussion documentation should follow a logical clinical sequence: history → examination → diagnosis → management → education → follow-up. This structure is medico-legally defensible and ensures comprehensive care is documented."
      }
    ],
    "communication-strategies": [
      {
        "kind": "key-concept",
        "title": "Stakeholder Communication Strategies",
        "content": "Patients: Plain language, teach-back method, written info, realistic expectations. Schools: Medical letter with SPECIFIC accommodations (50-100% extended time). Employers: Functional capacity, specific restrictions, timeline. Athletes: United front with coaches/trainers."
      },
      {
        "kind": "insight",
        "type": "warning",
        "title": "Be Specific in Accommodation Letters",
        "content": "VAGUE: 'Student needs accommodations.' SPECIFIC: 'Extended time 50-100% on tests, reduced course load (4 instead of 6 classes), quiet testing room, permission to leave if symptoms worsen, no PE/sports, rest breaks every 60 minutes.' Specificity ensures implementation."
      },
      {
        "kind": "quick-check",
        "question": "School accommodation letter should include:",
        "options": [
          "Diagnosis only",
          "Specific accommodations (extended time %), restrictions, timeline, review date",
          "Vague recommendation to 'take it easy'",
          "No mention of restrictions to avoid stigma"
        ],
        "correctAnswer": 1,
        "explanation": "Must be SPECIFIC: exact accommodations needed (50-100% extended time, reduced load, quiet room, breaks), explicit restrictions (no PE/sports), expected timeline, review/update plan, contact person. Vague letters lead to poor implementation and unmet student needs."
      }
    ],
    "ethical-considerations": [
      {
        "kind": "insight",
        "type": "info",
        "title": "Ethical Principles in Concussion Care",
        "content": "BENEFICENCE: Act in patient's best interest (sometimes means withholding clearance despite pressure). NON-MALEFICENCE: Do no harm (premature clearance = harm). AUTONOMY: Respect patient decisions while providing guidance. JUSTICE: Equitable access to care regardless of ability to pay."
      },
      {
        "kind": "quick-check",
        "question": "An athlete's parent offers payment to expedite return-to-play clearance. Ethical response:",
        "options": [
          "Accept if it doesn't affect clinical judgment",
          "Decline - clearance based on clinical criteria only, not payment",
          "Provide faster appointments but maintain clinical standards",
          "Refer to colleague who can make decision"
        ],
        "correctAnswer": 1,
        "explanation": "DECLINE. Clearance decisions must be based SOLELY on clinical criteria (symptom resolution, normal exam, completed protocol). Financial incentives create conflict of interest. Maintain professional boundaries. Ethical principles (beneficence, non-maleficence) trump financial gain."
      }
    ],
    "case-documentation-legal": [
      {
        "kind": "scenario",
        "title": "Documentation Dilemma",
        "patientSummary": "You've been managing a 28-year-old office worker for 8 weeks post-concussion. Their employer's insurer requests 'all clinical records'. The patient has disclosed significant anxiety and relationship stress during sessions.",
        "steps": [
          {
            "id": "step-1",
            "narrative": "The insurer has sent a formal request for \"all clinical records\" related to the patient's concussion management. What is your immediate response?",
            "clinicalData": [
              "Request from employer's insurer for \"all clinical records\"",
              "Patient has disclosed anxiety and relationship stress in sessions",
              "Clinical notes contain both concussion-related and personal disclosures",
              "8 weeks of treatment records"
            ],
            "choices": [
              {
                "label": "Release all clinical records as requested — the insurer has a right to medical information for the claim",
                "nextStepId": "outcome-breach"
              },
              {
                "label": "Discuss the request with the patient, explain what records exist, and obtain informed consent before releasing anything",
                "nextStepId": "step-2"
              },
              {
                "label": "Refuse the request entirely — clinical records are always confidential",
                "nextStepId": "outcome-obstructive"
              }
            ]
          },
          {
            "id": "step-2",
            "narrative": "You discuss the request with the patient. They consent to releasing concussion-related information but are distressed about their personal disclosures being shared with their employer's insurer. How do you handle the consent process?",
            "clinicalData": [
              "Patient consents to concussion-related information being shared",
              "Patient does NOT consent to personal/relationship disclosures being shared",
              "Insurer request was broad — \"all clinical records\""
            ],
            "choices": [
              {
                "label": "Release only concussion-related records and note that the patient has limited consent to concussion-related information only",
                "nextStepId": "step-3"
              },
              {
                "label": "Tell the patient they must consent to full release or the claim may be affected",
                "nextStepId": "outcome-coercive"
              },
              {
                "label": "Redact the personal information from the records and send everything else",
                "nextStepId": "outcome-acceptable-redact"
              }
            ]
          },
          {
            "id": "step-3",
            "narrative": "The patient has provided limited consent for concussion-related information only. How do you structure the report to the insurer?",
            "clinicalData": [
              "Limited consent obtained — concussion-related information only",
              "Need to provide meaningful clinical information for the claim",
              "Must protect patient confidentiality for non-consented disclosures"
            ],
            "choices": [
              {
                "label": "Send a copy of the clinical notes with personal sections blacked out",
                "nextStepId": "outcome-acceptable-redact"
              },
              {
                "label": "Prepare a structured medicolegal report: injury details, diagnosis, treatment provided, functional status, prognosis, and return-to-work recommendations — without personal disclosures",
                "nextStepId": "outcome-optimal"
              },
              {
                "label": "Write a brief letter stating the patient had a concussion and is recovering — minimal detail to protect privacy",
                "nextStepId": "outcome-insufficient"
              }
            ]
          },
          {
            "id": "outcome-optimal",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "optimal",
              "title": "Best Practice Documentation",
              "explanation": "Excellent. A structured medicolegal report provides the insurer with the clinical information they need — diagnosis, treatment, functional status, prognosis — without exposing personal disclosures the patient has not consented to share. This approach respects patient autonomy, fulfils the clinician's obligations, and provides a professional document appropriate for the medicolegal context.",
              "clinicalReasoning": "The gold standard is a purpose-written report (not raw clinical notes) that addresses the specific questions relevant to the claim. Raw clinical notes often contain shorthand, personal context, and information beyond the scope of the request. A structured report demonstrates clinical professionalism and protects against misinterpretation of clinical notes by non-clinical readers."
            }
          },
          {
            "id": "outcome-breach",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Confidentiality Breach",
              "explanation": "Releasing all clinical records without patient consent is a serious breach of patient confidentiality and professional ethics. The insurer's request does not override the patient's right to privacy. Informed consent must be obtained before any records are released, and the patient has the right to limit what information is shared.",
              "clinicalReasoning": "Patient confidentiality is a fundamental ethical and legal obligation. Third-party requests for clinical information always require patient consent. The patient has the right to know what records exist, what the request covers, and to limit consent to specific information."
            }
          },
          {
            "id": "outcome-obstructive",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Obstructive Response",
              "explanation": "While protecting confidentiality is important, outright refusal without engaging the patient is obstructive and may harm their claim. The appropriate response is to involve the patient in the decision — they may want relevant clinical information shared to support their claim.",
              "clinicalReasoning": "Clinicians have obligations both to protect patient confidentiality AND to assist patients in accessing entitlements (insurance, workers' compensation). The solution is informed consent — not blanket refusal."
            }
          },
          {
            "id": "outcome-coercive",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Coercive Consent",
              "explanation": "Pressuring a patient to consent to full record release by implying their claim will be affected is coercive and unethical. The patient has the right to limit consent. A well-structured report can provide the insurer with the information they need without exposing non-consented personal disclosures.",
              "clinicalReasoning": "Informed consent must be freely given, not coerced. The clinician's role is to explain the options and potential consequences, then respect the patient's decision. In most jurisdictions, an insurer cannot compel release of all records — they can request, but the patient controls consent."
            }
          },
          {
            "id": "outcome-acceptable-redact",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "acceptable",
              "title": "Adequate but Not Ideal",
              "explanation": "Redacting personal information from clinical notes is better than releasing everything, but sending redacted clinical notes is not ideal. Raw clinical notes may contain shorthand, context, or phrasing that can be misinterpreted by non-clinical readers. A purpose-written structured report is the professional standard for medicolegal communication.",
              "clinicalReasoning": "Redacted notes may raise suspicion about what was removed, and the remaining clinical shorthand may be misinterpreted. A structured medicolegal report written specifically for the purpose is cleaner, more professional, and provides the insurer with exactly the information they need in a format they can use."
            }
          },
          {
            "id": "outcome-insufficient",
            "isOutcome": true,
            "narrative": "",
            "choices": [],
            "outcome": {
              "type": "suboptimal",
              "title": "Insufficient Information",
              "explanation": "While protecting privacy is important, providing too little information may disadvantage the patient's claim. The insurer needs sufficient clinical detail to process the claim — diagnosis, treatment, functional impact, and prognosis. A one-line summary does not meet this threshold.",
              "clinicalReasoning": "The goal is to provide the insurer with meaningful clinical information relevant to the claim while protecting information the patient has not consented to share. A structured report achieves both objectives — brevity protects neither the patient's claim nor the clinician's professional obligations."
            }
          }
        ]
      }
    ]
  }
}
