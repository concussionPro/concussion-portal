# Module 5d — Osteopathy

**Reading time:** ~6 minutes
**Prerequisites:** Modules 1–4

---

## Scope

Osteopathic practice combines manual therapy, exercise prescription, and patient education. This sub-module covers the four highest-volume AI-assisted documentation tasks. Refer to Module 5a (Physio) for deeper exercise-prescription detail — most of the principles transfer directly. The de-identification preamble from Module 3 is assumed throughout.

---

## 1. Treatment notes templates

Most osteopaths already have a note structure they use (often SOAP or a regional variant). The LLM is useful for transforming a brief consultation summary into a structured note, or for building consistent templates across the practice.

**Prompt — template generation:**

> [De-id preamble]
> Draft a structured osteopathic treatment note template suitable for a 30-minute follow-up consultation. Use a SOAP format with osteopathic-specific fields. Include:
> – Subjective: symptom change since last visit, function, sleep, work demands.
> – Objective: posture, active ROM, passive ROM, palpation findings (regions), special tests.
> – Assessment: working hypothesis, stage, irritability.
> – Plan: techniques delivered, dosage, home program update, review interval.
> – Consent: technique-specific consent noted.
> – Red flags: explicit "no red flags identified today" or specific flag with action.
> Leave each section with brief placeholder text so I can fill in the specifics during or after the consult.

**Prompt — notes from a dictation:**

> [De-id preamble]
> Convert the following clinician dictation into a structured SOAP note. Use Australian English. Do not invent findings or techniques not mentioned. If something is unclear, leave a [CLARIFY] tag rather than guessing.
> Dictation: [paste de-identified dictation]

**Review checklist:**
- Findings match what you actually did and observed.
- No invented techniques, special tests, or measurements.
- Consent documented (especially for high-velocity techniques).
- Red-flag screen explicitly stated.
- Plan is actionable.

---

## 2. Exercise and posture sheets

Osteopathic patients frequently leave with a short, focused home program — typically 3–6 exercises plus postural cues. The deeper exercise-prescription methodology from Module 5a applies.

**Prompt:**

> [De-id preamble]
> Draft a one-page home exercise and postural advice sheet for an adult patient with [diagnosis, e.g. non-specific neck pain with upper trapezius tension] following an osteopathic treatment. Include:
> – 4–6 exercises with name, sets x reps, frequency, and one cue per exercise.
> – 2–3 postural advice points (workstation, phone use, sleeping position).
> – When to expect improvement and what to do if symptoms worsen.
> – A note: "These are general suggestions for [diagnosis]. If symptoms change or worsen, please contact the clinic."
> Tone: clear, encouraging, no jargon.

**Review checklist:**
- Exercises and dosage match what you actually demonstrated.
- Postural advice is specific to the patient's life context.
- Red-flag escalation present.
- No fabricated biomechanical claims (e.g. "this will realign your spine" — neither true nor TGA-friendly).

---

## 3. Patient progress reports

For insurers (CTP, workers comp), GPs, third-party funders, or end-of-episode summaries.

**Prompt:**

> [De-id preamble]
> Draft a patient progress report from the treating osteopath to [recipient, e.g. referring GP / insurer]. Patient: [age, presenting concern]. Sessions to date: [number]. Treatment summary: [brief: techniques used, key milestones]. Outcome measures: [measure and scores at baseline and current]. Functional change: [what they can now do that they could not at baseline]. Plan going forward: [continue / discharge / refer].
> Australian letter format. Include the AI-attestation line: "Drafted with AI assistance and reviewed by the treating clinician."

**Review checklist:**
- All numbers (session count, outcome scores) match the patient record.
- Functional improvements are factual, not aspirational.
- The plan matches your clinical reasoning.
- AI-attestation line present.
- No over-claiming about treatment effects.

---

## 4. Return-to-work documentation

Osteopaths are not authorised to issue medical certificates under all schemes — check your jurisdiction and the specific insurer's requirements. Where you *can* contribute (e.g. supporting letters, allied health input forms), the LLM can structure the narrative.

**Prompt:**

> [De-id preamble]
> Draft a supporting letter from the treating osteopath to the patient's employer (with patient consent), summarising current functional capacity and recommended workplace modifications. Patient: [summary]. Current functional capacity: [what they can / cannot do]. Recommended modifications: [list]. Expected timeframe for review: [date].
> Frame as advisory, not prescriptive. Do not use language that implies a medical certificate is being issued unless within scope. Include the AI-attestation line.

**Review checklist:**
- Scope: is a supporting letter appropriate, or does this require a GP-issued certificate?
- Patient consent for sharing with employer is documented.
- Modifications are specific and reviewable.
- No over-reach into medical certification.
- AI-attestation line present.
- Signed and dated.

---

## Three-prompt starter kit

**Prompt 1 — Structured note from dictation:**

> [De-id preamble]
> Convert the following clinician dictation into a SOAP-structured osteopathic note. Australian English. Do not invent findings. Use [CLARIFY] tags where information is missing.
> Dictation: [paste de-identified dictation]

**Prompt 2 — Home program sheet:**

> [De-id preamble]
> Draft a one-page home program for [diagnosis] following today's osteopathic treatment. 4–6 exercises with dosage and cues, 2–3 postural advice points, expected improvement timeframe, and a red-flag escalation note.

**Prompt 3 — Progress report:**

> [De-id preamble]
> Draft a progress report from the treating osteopath to [recipient]. Patient: [summary]. Sessions: [n]. Treatment: [summary]. Outcome measures: [baseline → current]. Functional change: [list]. Plan: [continue/discharge/refer]. Include the AI-attestation line.

---

## Key takeaways

- The LLM structures notes; you provide the findings.
- Home program sheets follow the same dosage and progression principles as physio (Module 5a).
- Progress reports must use only verified numbers and factual functional changes.
- Return-to-work documentation has scope limits — know what your jurisdiction allows before signing.
- Every patient-facing document carries the same review obligations as any other clinical communication (Module 4).

## Common mistakes to avoid in osteopathy

- Letting the LLM fabricate palpation findings or special-test results.
- Using mechanistic claim language ("realigns the spine," "removes blockages") that doesn't survive AHPRA or TGA scrutiny.
- Issuing return-to-work documents that look like medical certificates when they are not.
- Inconsistent consent documentation, especially for high-velocity techniques.
- Reusing a generic template across patients without customising to the individual.
- Forgetting the red-flag screen — the LLM will omit it unless you specify.
- Accepting LLM-default exercise dosage without checking it matches what you demonstrated.
