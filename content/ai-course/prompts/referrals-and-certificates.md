# Referrals & Certificates Prompts

Prompts for drafting referrals, return-to-work documents, and clinical certificates. All output requires clinician review and signature.

---

---
title: Specialist Referral Letter
specialty: gp,physio,osteo
useCase: referral
riskTier: medium
toolTier: A
---

**When to use:** Drafting a letter to a specialist for a patient who needs further assessment or management beyond your scope.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a specialist referral letter from an Australian [referring specialty] clinician to a [target specialist type]. Structure:
- Salutation
- Reason for referral (one sentence)
- Presenting complaint and history
- Relevant examination findings
- Investigations to date and results
- Working diagnosis or differential
- Specific question for the specialist
- What you've already trialled
- Patient consent confirmed
- Sign-off with clinician details placeholder

Length: approximately 250 words. Tone: collegial and concise. Australian English.

Patient summary:
[paste de-identified clinical summary]
```

**Required de-identification:** Strip patient name, DOB, contact details, specialist name, Medicare. Re-add on finalisation.

**Clinician review checklist:**
- Specific question for the specialist is clear (not "please assess")
- Working diagnosis matches your actual reasoning
- All examination findings are accurate
- Investigations listed are real and results correct
- Patient has consented to the referral
- All identifiers re-added before sending

**Medicolegal note:** Referral letters carry diagnostic weight. A working diagnosis in writing is a clinical opinion — make sure it's defensible.

---

---
title: GP-to-Allied-Health Referral
specialty: gp
useCase: referral
riskTier: medium
toolTier: A
---

**When to use:** Generating a referral from GP to physio, osteo, psych, or other allied health, including any required Medicare items (e.g. CDM plan, MHTP).

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a referral from an Australian GP to a [target allied health discipline]. Include:
- Relevant Medicare item context (e.g. CDM, MHTP, EPC — specify which)
- Reason for referral
- Brief clinical summary
- Specific goals for the allied health intervention
- Number of sessions recommended within the Medicare item
- GP review timing
- Sign-off placeholder

Australian English. 150-200 words. Note: GP must verify Medicare eligibility separately — do not state eligibility as confirmed.

Clinical summary:
[paste de-identified summary]
```

**Required de-identification:** Strip name, Medicare, contact details, allied health provider's name.

**Clinician review checklist:**
- Medicare item type is correct for the clinical situation
- Eligibility for the item verified separately
- Number of sessions matches item allowance
- Specific goals stated, not generic "assess and treat"
- GP review timing matches Medicare item requirements

**Medicolegal note:** Medicare referrals create billing implications. Confirm item eligibility through PRODA or your practice management system — not the AI.

---

---
title: Return-to-Work Certificate
specialty: gp,physio,osteo
useCase: certificate
riskTier: high
toolTier: A
---

**When to use:** Drafting a return-to-work certificate for a patient recovering from injury or illness.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a return-to-work certificate for an Australian patient. Format:

- Date of certificate
- Patient details placeholder
- Date of injury or illness onset
- Diagnosis (in lay terms acceptable to employer/insurer)
- Capacity for work statement — specific (e.g. "fit for modified duties from [date] for [duration]: no lifting >5kg, no overhead reaching, max 6-hour shifts")
- Review date
- Treating clinician details placeholder

Capacity statement must be precise about restrictions, hours, and duration. Do not write "unfit for work" without a specific timeframe. Do not write "fit for normal duties" without confirming this matches the clinical picture.

Clinical context:
[paste de-identified clinical summary]
```

**Required de-identification:** Strip patient name, employer name, claim number. Keep injury, current function, and clinical trajectory.

**Clinician review checklist:**
- Capacity statement reflects your actual clinical judgement
- Restrictions are specific, not generic
- Duration is realistic — short enough to mandate review
- Diagnosis terminology is appropriate for employer audience
- Review date booked in your system
- Original signed copy retained on file

**Medicolegal note:** Capacity-for-work statements are evidentiary. Insurers, employers, and lawyers will scrutinise them. Never let AI write a capacity statement — let it draft the structure, then write the capacity statement yourself.

---

---
title: Return-to-School Plan
specialty: gp,physio,osteo,mental-health
useCase: certificate
riskTier: medium
toolTier: A
---

**When to use:** Drafting a return-to-school plan for a paediatric patient after injury, illness, or concussion.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a graded return-to-school plan for an Australian student aged [age band]. Structure as a 4-stage plan: rest, gradual return (half-days, modified academic load), full school days (modified physical activity), full return (no restrictions).

For each stage include:
- Duration (with review trigger)
- What the student CAN do
- What the student should AVOID
- Symptom monitoring guidance
- Criteria to progress to the next stage

Address the plan to the school (principal, year-level coordinator, PE teacher). Australian English. Family-friendly tone.

Clinical context:
[paste de-identified clinical summary]
```

**Required de-identification:** Strip student name, school name, year level (keep age band), parent details.

**Clinician review checklist:**
- Stages match current evidence (concussion guidelines if applicable)
- Symptom monitoring guidance is appropriate to the condition
- Progression criteria are measurable
- Parent and school both have a contact pathway for questions
- Plan dated and clinician-signed
- Review appointment booked

**Medicolegal note:** Return-to-school is a duty-of-care document for the school. Be specific about what they're being asked to monitor and what triggers an early call back to you.

---

---
title: Work Modification Recommendation
specialty: physio,osteo,gp
useCase: certificate
riskTier: high
toolTier: A
---

**When to use:** Recommending workplace modifications for a patient with chronic pain, post-surgical recovery, or musculoskeletal condition.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft workplace modification recommendations for an Australian patient. Address the document to the employer and the patient. Cover:
- Brief clinical rationale (one paragraph)
- Specific modifications recommended (workstation, task, hours, breaks)
- Duration of recommendations
- Review date
- What is expected to change at review

Modifications should be specific and actionable (e.g. "sit-stand desk with monitor at eye level, hourly micro-breaks of 2 minutes, no continuous keyboard work over 45 minutes") not vague ("ergonomic improvements recommended").

Clinical context:
[paste de-identified clinical summary]
```

**Required de-identification:** Strip patient and employer names, claim numbers. Keep job type and clinical findings.

**Clinician review checklist:**
- Modifications are within your scope to recommend
- Each modification has a clear clinical rationale
- Duration is bounded with a review date
- Language is recommendation, not directive (employer makes final call)
- Employer contact pathway provided
- Document signed and dated

**Medicolegal note:** Workplace modifications can become the subject of disputes. Frame recommendations as clinical advice to inform the employer's decision — not as orders. Keep the rationale paragraph factual.
