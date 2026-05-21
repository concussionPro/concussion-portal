# Module 5a — Physiotherapy & Musculoskeletal

**Author:** Zac Lewis — Osteopath, AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22

**Reading time:** ~7 minutes
**Prerequisites:** Modules 1–4

---

## Scope

This sub-module covers the highest-volume AI-assisted outputs in a physio or MSK-focused practice. Refer to Module 2 for tool-tier selection and Module 4 for the general patient-comms framework. The de-identification preamble from Module 3 is assumed in every prompt below.

---

## 1. Exercise prescription generation

The single highest-leverage use case in MSK practice. You assess; the LLM formats and progresses.

**Inputs the model needs:**
- Diagnosis or working hypothesis
- Stage (acute / subacute / chronic / return-to-sport)
- Functional baseline (what the patient can currently do)
- Constraints (equipment, time, comorbidities)
- Goal of the program

**Prompt:**

> [De-id preamble]
> Generate a 6-week progressive rehab program for a 32-year-old recreational runner with a Grade 1 hamstring strain (2 weeks post-injury). Pain-free walking. Pain on light jog at 60% effort. Goals: return to 5km recreational running. Equipment: home gym with dumbbells and a resistance band. Format as Weeks 1–2 (early loading), Weeks 3–4 (strength and capacity), Weeks 5–6 (return to running progression). For each exercise: name, sets x reps, tempo, frequency per week, and a single coaching cue. Include explicit progression criteria between phases (what the patient must be able to do to advance).

**What the model does well:** structure, progression logic, dosage scaffolding, formatting.

**What the model does poorly:** matching to the actual tissue irritability, knowing your patient's prior injury history, choosing exercises the patient will actually do. You fix this in review.

**Review checklist:**
- Dosage is appropriate to stage (not overcooked, not under-dosed).
- Progression criteria are objective and observable.
- No fabricated exercises or biomechanical claims.
- Equipment matches what the patient owns.
- Red-flag stop criteria are present.

---

## 2. Return-to-sport letters

For coaches, schools, sporting bodies, and insurers.

**Prompt:**

> [De-id preamble]
> Draft a return-to-sport clearance letter for a 17-year-old amateur rugby player, 4 weeks post-concussion, having completed a graded return-to-play protocol (AFL/World Rugby framework). Symptom-free at rest and on exertion. Successfully completed Stages 1–5. Recommend full return at Stage 6. Address to the head coach at [CLUB NAME]. Include a single line: "This clearance applies to the activity described and assumes no new symptoms develop." Add the AI-attestation line from Module 4.

**Review checklist:**
- Stage progression matches your clinical notes.
- The letter does not over-claim ("fully recovered" is risky language).
- AI-attestation line is present.
- Addressed to the correct recipient.

---

## 3. Treatment summary letters

For GPs, insurers, or referring clinicians at end-of-episode.

**Prompt:**

> [De-id preamble]
> Draft a treatment summary letter from the treating physiotherapist to the referring GP. Patient: 54-year-old with subacromial pain syndrome, referred 12 weeks ago. Sessions: 9. Outcome: pain reduced from 7/10 to 1/10, full ROM restored, returned to recreational tennis. Discharged today with a home maintenance program. Include a brief paragraph on what was done (manual therapy, progressive loading, education), the outcome measures used (NRS, SPADI), and the discharge plan. Australian letter format.

**Review checklist:**
- Outcome measures cited match what you actually used.
- No invented session counts or dates.
- Discharge plan is realistic.
- AI-attestation line is present.

---

## 4. Pain education handouts (biopsychosocial framing)

Patient education is one of the highest-impact interventions in persistent pain. The LLM is excellent at translating biopsychosocial concepts into plain English, *if* you give it a tight brief.

**Prompt:**

> [De-id preamble]
> Draft a 1-page patient handout titled "Understanding Persistent Pain" for an adult with chronic low back pain (no red flags, no surgical indication). Frame it through the biopsychosocial model. Cover: pain is real but not always a sign of damage; the nervous system's role in turning up sensitivity; the contribution of stress, sleep, and movement; what helps (gradual loading, sleep hygiene, pacing); what hurts (avoidance, catastrophising, deconditioning). Reading age: Year 8. Tone: validating, not dismissive. Do not use the phrase "pain is in your head" or any minimising language.

**Review checklist:**
- No minimising or dismissive language.
- The model has not invented neuroscience claims.
- Patient's specific presentation is reflected (not a generic template).
- Sources, if cited, are real (LLMs hallucinate citations — strip any you cannot verify).

---

## 5. Pre-screening forms

For new-patient intake, return-to-activity screening, or telehealth triage.

**Prompt:**

> [De-id preamble]
> Draft a 1-page new-patient pre-screening form for an adult MSK physiotherapy practice. Sections: demographics, presenting concern (location, onset, mechanism, severity), red-flag screen (night pain, unexplained weight loss, bowel/bladder changes, fever, recent trauma), past medical history, medications, allergies, goals, consent for treatment, and a privacy collection notice referencing the Privacy Act 1988 (Cth). End with a clinician sign-off section.

**Review checklist:**
- Red-flag screen is appropriate to your scope and patient mix.
- Consent language is current and accurate.
- Privacy collection notice meets APP 5 requirements (covered in Module 1).
- Form is logically ordered and easy to complete.

---

## Three-prompt starter kit

Copy, paste, replace the bracketed sections, and review the output before use.

**Prompt 1 — Acute injury rehab plan:**

> [De-id preamble]
> Draft a [4-week / 6-week / 8-week] progressive rehab program for [diagnosis] at [stage]. Functional baseline: [what they can do]. Goals: [patient goals]. Equipment available: [equipment]. Format as weekly phases with sets, reps, tempo, frequency, one cue per exercise, and explicit progression criteria. Include stop criteria.

**Prompt 2 — Return-to-activity letter:**

> [De-id preamble]
> Draft a return-to-[sport/work] clearance letter for [patient summary]. Protocol followed: [protocol]. Current status: [status]. Recommend [recommendation]. Address to [recipient]. Include the AI-attestation line.

**Prompt 3 — Patient education handout:**

> [De-id preamble]
> Draft a 1-page patient handout on [topic] for [patient demographic]. Reading age: Year 8. Tone: [tone]. Cover: [3–5 key points]. Frame through a [biomedical / biopsychosocial] lens. Do not use [language to avoid].

---

## Key takeaways

- The LLM is a formatting and structuring tool. Clinical judgement is yours.
- Specify dosage, equipment, and progression criteria — vague prompts produce vague programs.
- Outcome measures and session counts must match your actual notes.
- Pain education prompts must include explicit "avoid" language to prevent minimising tone.

## Common mistakes to avoid in physio

- Letting the LLM choose exercises without considering the patient's irritability or prior injuries.
- Accepting fabricated biomechanical or neuroscience claims in pain education handouts.
- Over-claiming in return-to-sport letters ("fully recovered" creates legal exposure).
- Forgetting to include explicit progression criteria — patients then progress on time rather than capacity.
- Citing outcome measures (SPADI, NRS, LEFS) you didn't actually administer.
- Re-using a template across patients without customising to the individual.
