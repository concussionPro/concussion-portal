# Documentation Prompts

Prompts for drafting and polishing clinical documentation. All outputs require clinician review before entering the record.

---

---
title: SOAP Note Polish
specialty: all
useCase: documentation
riskTier: low
toolTier: A,B
---

**When to use:** You've typed rough SOAP notes during or after a session and want them cleaned into clear, professional clinical language without changing meaning.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

You are assisting a clinician with note polishing. Below is a rough SOAP note. Rewrite it in clear, professional Australian clinical English. Do not add findings, diagnoses, or recommendations that are not in the original text. Preserve the original clinical meaning exactly. Keep the SOAP structure (Subjective, Objective, Assessment, Plan).

Rough note:
[paste de-identified rough SOAP note here]

Output: a polished SOAP note. Flag anything ambiguous in the original with [CLINICIAN TO CONFIRM].
```

**Required de-identification:** Remove patient name, DOB, address, Medicare number, phone, email, third-party names. Keep age band (e.g. "40s"), sex, and presenting complaint.

**Clinician review checklist:**
- Confirm no new clinical findings were introduced
- Verify dosages, measurements, and ranges match the original
- Check the assessment section reflects your actual clinical reasoning
- Confirm the plan section matches what you discussed with the patient
- Sign off and date

**Medicolegal note:** AI-polished notes must read as your own clinical reasoning. If the polished version overstates certainty, edit it down before saving.

---

---
title: Treatment Plan Draft
specialty: physio,osteo,naturopath
useCase: documentation
riskTier: medium
toolTier: A
---

**When to use:** Drafting a multi-session treatment plan from your assessment findings.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

You are assisting a clinician with treatment plan drafting for an Australian allied health setting. Based on the assessment findings below, draft a 6-week treatment plan in three phases (acute, sub-acute, return-to-function). For each phase include: goals, treatment modalities, session frequency, home program elements, and review criteria.

Assessment findings:
[paste de-identified assessment summary]

Do not prescribe medications or invasive procedures. Use evidence-aligned language. Flag any element where evidence is weak or uncertain.
```

**Required de-identification:** Strip name, DOB, contact details, employer name, school name. Keep age band, occupation type (e.g. "manual labourer"), and clinical findings.

**Clinician review checklist:**
- Phases align with your clinical judgement of recovery timeline
- Frequency is realistic for the patient's circumstances
- Home program is appropriate to the patient's literacy and motivation
- No modality listed that you don't actually offer or that's outside scope
- Review criteria are measurable

**Medicolegal note:** A documented treatment plan creates an expectation. Don't include modalities you may not deliver. Make the plan a draft, not a contract.

---

---
title: Discharge Summary
specialty: all
useCase: documentation
riskTier: medium
toolTier: A
---

**When to use:** Closing an episode of care and writing a discharge summary for the patient, their GP, or both.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a discharge summary for an Australian allied health episode of care. Use clear headings: Reason for Referral, Assessment Summary, Interventions Provided, Outcomes, Recommendations, Follow-up. Use plain professional Australian English. Target audience: the referring GP.

Episode details:
[paste de-identified summary of presentation, interventions, and outcomes]

Length: approximately 250 words. Do not invent measurements or outcomes not stated in the input.
```

**Required de-identification:** Strip patient identifiers and GP name (will be re-added on finalisation). Keep age, sex, presenting condition.

**Clinician review checklist:**
- Outcomes reflect actual measured change, not inferred change
- Recommendations are within the GP's scope to action
- No modality or finding mentioned that wasn't in your notes
- Tone is professional and collegial
- Re-insert patient and GP identifiers before sending

**Medicolegal note:** Discharge summaries go on the patient's permanent record with the GP. Accuracy on outcomes and recommendations matters more here than anywhere else.

---

---
title: Workers Compensation Note
specialty: physio,osteo,gp
useCase: documentation
riskTier: high
toolTier: A
---

**When to use:** Drafting a progress note for an insurer in a workers compensation claim.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a workers compensation progress note for an Australian insurer. Structure: Date of Injury, Mechanism (as reported), Current Symptoms, Examination Findings, Functional Status, Treatment This Period, Response to Treatment, Capacity for Work, Plan, Estimated Time to Return.

Inputs:
[paste de-identified clinical summary]

Be factual. Do not editorialise on the claim's legitimacy. Capacity for work statements must be specific (e.g. "fit for modified duties — no lifting over 5kg, no overhead work, 4-hour shifts") not vague.
```

**Required de-identification:** Strip patient name, employer name, claim number, insurer case manager name. Keep injury mechanism, work type, and clinical findings.

**Clinician review checklist:**
- Capacity statement matches your actual assessment, not the patient's request or employer's pressure
- Mechanism is reported as "patient states" — not as established fact
- Treatment response is measured, not narrative
- Estimated return-to-work is realistic and conservative
- Tone is neutral throughout

**Medicolegal note:** Workers comp notes are evidentiary. Insurers and lawyers read them line by line. Never let AI generate a capacity-for-work statement — write that yourself.

---

---
title: Intake Form Draft
specialty: all
useCase: documentation
riskTier: low
toolTier: A,B,C
---

**When to use:** Building or refreshing a new-patient intake form for your practice.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a new-patient intake form for an Australian [specialty] practice. Include sections for: demographics, presenting concern, medical history, medication and supplement list, allergies, surgical history, family history, lifestyle (sleep, exercise, nutrition, alcohol, smoking), psychosocial context, goals for care, consent to share information with GP, and signature.

Use plain English at year-9 reading level. Australian spelling. Include a brief privacy statement referencing the Australian Privacy Principles. Keep to two pages.
```

**Required de-identification:** None — no patient data involved in this prompt.

**Clinician review checklist:**
- Privacy statement matches your actual privacy policy
- Questions are relevant to your specialty
- Reading level is appropriate for your patient demographic
- Consent language is unambiguous
- Form complies with any insurer or registration body requirements

**Medicolegal note:** Intake forms must reflect your real privacy practices. If you store data on overseas servers, the privacy statement must say so.

---

---
title: Progress Note
specialty: all
useCase: documentation
riskTier: low
toolTier: A,B
---

**When to use:** Standard between-session progress note after a follow-up appointment.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a brief progress note for a follow-up session in an Australian allied health practice. Cover: subjective report since last visit, today's objective findings, change from baseline, today's treatment, response, plan for next session. Keep it under 150 words. Use Australian clinical English.

Session details:
[paste de-identified session summary]

Do not infer findings not stated in the input.
```

**Required de-identification:** Strip name and any third-party identifiers. Keep clinical detail.

**Clinician review checklist:**
- Change-from-baseline statement reflects measured change
- Treatment listed matches what you actually delivered
- Plan reflects discussion with patient
- No new findings invented
- Note signed and dated

**Medicolegal note:** Progress notes are the bulk of your defensible record. Quality and consistency over volume.
