# Module 5c — GP & Primary Care

**Reading time:** ~7 minutes
**Prerequisites:** Modules 1–4

---

## Scope

General practice generates more clinical documentation per FTE than any other discipline. AI assistance has the largest time-recovery potential here — and the largest medicolegal exposure if misused. This sub-module covers six high-volume documentation tasks. Refer to Module 1 for the AHPRA, Privacy Act, and Medicare Benefits Schedule context, and Module 2 for tool-tier classification.

**Critical tool-tier reminder:** Mental Health Care Plans and Chronic Disease Management plans contain extensive Personally Identifiable Information and sensitive health data. **Tier A tools only** (Australian-data-residency, enterprise contracts, no training on inputs). See Module 2.

The de-identification preamble from Module 3 is assumed in every prompt.

---

## 1. Referral letters

GPs generate more referral letters than any other clinician type. The prompt structure in Module 4, section 4 applies. GP-specific notes:

**Prompt:**

> [De-id preamble]
> Draft a referral letter from a GP to a [SPECIALTY] specialist. Patient: [age/sex]. Presenting concern: [concern]. Relevant history: [history]. Examination findings: [findings]. Investigations to date: [results]. Working diagnosis: [diagnosis]. Specific question for the specialist: [question]. Include current medications and allergies. Australian referral format (e.g. "Dear Dr [SPECIALIST]"). Include the AI-attestation line: "Drafted with AI assistance and reviewed by the treating clinician."

**Review checklist:**
- All clinical claims match the notes.
- Investigations cited are actually completed (date, result, source).
- Medication list is current and accurate.
- Specific question is sharp — vague referrals produce vague replies.
- Specialist's name, address, and provider details correct.

---

## 2. Mental Health Care Plans (GP MHCP — MBS items 2715/2717)

**Tool tier:** A only. MHCPs are dense with sensitive health information.

**Prompt:**

> [De-id preamble]
> Draft a GP Mental Health Care Plan narrative for an adult patient with [diagnosis, e.g. mild-to-moderate generalised anxiety disorder]. Patient consent obtained for plan and for sharing with allied health. Sections to draft:
> – Presenting concerns and history (brief).
> – Mental state examination summary.
> – Risk assessment (suicide/self-harm/harm to others) — leave bracketed placeholders for me to complete in my own words.
> – Outcome measurement tool used and score (e.g. K10 = [SCORE]).
> – Goals (patient-centred, 2–3, measurable).
> – Treatment plan: psychological strategies, referral to [psychologist / mental health social worker], review timeframe.
> – Crisis plan: leave a bracketed placeholder.
> Do not invent risk or crisis content. Do not invent scores.

**Critical review points:**
- **Risk assessment must be written by you, in your own words.** Do not let the LLM draft suicide/self-harm content.
- Crisis plan must be specific to the patient (Lifeline 13 11 14, local CATT, ED, support person).
- Goals must be patient-stated, not LLM-invented.
- Patient consent for the plan and any sharing is documented.
- MBS item criteria are met (time, content, patient eligibility).

**Why this is high-stakes:** MHCPs are reviewed by Services Australia, allied health providers, and (in adverse events) coroners. Generic LLM-generated risk language is a liability.

---

## 3. Chronic Disease Management Plans (GPMP and TCA — items 721/723)

**Tool tier:** A only.

**Prompt:**

> [De-id preamble]
> Draft a GP Management Plan (MBS item 721) for an adult patient with [conditions, e.g. Type 2 Diabetes and Hypertension]. Sections:
> – Patient's needs and problems (use de-identified summary).
> – Goals (3–5, patient-centred, measurable, with timeframes).
> – Treatments and services (medications, lifestyle, allied health referrals).
> – Required actions by the patient.
> – Required actions by the GP.
> – Review date (3-monthly typical for active management).
> Leave bracketed placeholders for any data I have not provided (HbA1c, BP readings, lipid panel).

**Review checklist:**
- Goals are patient-centred, not LLM-default ("reduce HbA1c to X" is a clinical target — confirm with patient).
- All bracketed placeholders filled with verified data.
- TCA (item 723) is generated as a separate document if allied health is referred.
- MBS item criteria met.
- Review date set.

---

## 4. Polypharmacy review support

LLMs can help structure a medication review but they are **not** a drug interaction database. Use the LLM to format the review and prompt clinical questions; verify everything against authoritative sources (AMH, eTG, Stockley's, NPS MedicineWise).

**Prompt:**

> [De-id preamble]
> Help me structure a polypharmacy review for an elderly patient (de-identified) on the following medications: [medication list with doses and indications].
> Provide:
> – A structured review table (medication, indication, dose appropriateness for age/renal function, evidence base, anticholinergic burden if applicable).
> – Potential interactions flagged AS QUESTIONS for me to verify (not as conclusions).
> – Beers/STOPP criteria flags worth checking.
> – Suggested deprescribing candidates AS QUESTIONS for me to consider.
> Do NOT make definitive interaction or deprescribing recommendations. Frame everything as "consider verifying" or "consider reviewing."

**Review checklist:**
- Every flag verified against AMH/eTG before any action.
- Renal function and frailty considered.
- Patient preference and quality of life weighted.
- Deprescribing follows a structured approach (e.g. NPS MedicineWise tools).
- Documented review and rationale in the notes.

---

## 5. Patient education library

Repeatable, high-quality patient handouts on common conditions. Refer to Module 4, section 1 for the general approach.

**Prompt:**

> [De-id preamble]
> Draft a one-page patient information sheet on [condition, e.g. Type 2 Diabetes — newly diagnosed]. Reading age: Year 8. Australian context. Sections:
> – What is [condition]?
> – Why it matters (general health framing, no scare tactics).
> – What you can do (lifestyle, monitoring, medications generally).
> – When to call the clinic or seek urgent care.
> – Your next steps.
> Do not include specific medication doses or brand-name recommendations. Cite at least one reputable Australian source (RACGP, NPS MedicineWise, Diabetes Australia) — and only cite sources you have verified exist.

**Review checklist:**
- Tone is informative, not alarming.
- No invented statistics.
- Cited sources verified.
- Red-flag/escalation section is present.
- Reading level matches the patient.

---

## 6. Workers compensation documentation

Each state has prescribed forms (e.g. WorkSafe Victoria Certificate of Capacity, SafeWork NSW). The form itself is non-negotiable — but the narrative sections benefit from LLM drafting.

**Prompt:**

> [De-id preamble]
> Draft the narrative content for a Certificate of Capacity (Victoria) for an adult patient with [diagnosis, mechanism: work-related]. Capacity: [fit for modified duties / unfit / fit for pre-injury duties]. Modified duties recommended: [list]. Duration of certificate: [start–end dates]. Review date: [date].
> Sections to draft:
> – Diagnosis (use ICD-10 framing where applicable, but match my notes).
> – Mechanism (one sentence).
> – Capacity statement.
> – Recommended modified duties (specific, time-bound).
> – Review plan.
> Do not invent dates, diagnoses, or duties. Leave brackets where I have not provided data.

**Review checklist:**
- Dates correct (incident, certificate start/end, review).
- Modified duties specific and achievable.
- Diagnosis matches notes.
- Form is the current prescribed version for your state.
- Signed and dated.
- A copy retained in the patient record.

---

## Three-prompt starter kit

**Prompt 1 — Specialist referral:**

> [De-id preamble]
> Draft a GP referral to [specialty]. Patient: [summary]. Concern: [concern]. History: [history]. Findings: [findings]. Investigations: [results]. Working diagnosis: [diagnosis]. Specific question: [question]. Australian format. Include the AI-attestation line.

**Prompt 2 — GPMP narrative:**

> [De-id preamble]
> Draft a GP Management Plan (MBS 721) narrative for a patient with [conditions]. Include needs/problems, goals (3–5 measurable), treatments/services, patient actions, GP actions, review date. Leave bracketed placeholders for unverified data.

**Prompt 3 — Patient handout:**

> [De-id preamble]
> Draft a Year-8 reading-level one-page handout on [condition]. Australian context. Cover: what it is, why it matters, what the patient can do, when to seek help, next steps. Cite verified Australian sources only.

---

## Key takeaways

- Tool tier A for MHCPs, GPMPs, TCAs, and anything containing sensitive health information.
- Risk assessments and crisis plans are written by the clinician, never the LLM.
- LLMs structure polypharmacy reviews; AMH/eTG provide the answers.
- Workers compensation forms are state-prescribed — the LLM drafts the narrative, not the form.
- Specific questions in referral letters produce specific answers from specialists.

## Common mistakes to avoid in GP practice

- Pasting a full clinical note into a consumer-tier LLM. Use Tier A only for identifiable content.
- Letting the LLM draft suicide/self-harm risk language.
- Accepting LLM-generated drug interaction conclusions without verifying.
- Generic, copy-paste goals on GPMPs. Goals must be patient-stated.
- Forgetting the AI-attestation line on letters that will be relied upon by third parties.
- Using an outdated prescribed form for workers comp.
- Citing fabricated guideline references in patient handouts.
- Missing MBS item criteria because the LLM filled in plausible-sounding but non-compliant content.
