# Exercise & Rehabilitation Prompts

Prompts for generating exercise programs, return-to-sport documentation, and ergonomic guidance. All outputs require clinician review and adaptation to the specific patient.

---

---
title: Exercise Program Generator
specialty: physio,osteo
useCase: education
riskTier: medium
toolTier: A
---

**When to use:** Generating a tailored home exercise program for a patient based on your assessment findings.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Generate a home exercise program for an Australian patient with [condition / impairment]. Constraints:
- Patient context: [age band, fitness level, equipment available, any contraindications]
- Number of exercises: 5-7
- Session duration: under 20 minutes
- Frequency: 3-5 sessions per week
- Progression criteria after 2 weeks

For each exercise provide: name, plain-English description, sets and reps, rest interval, technique cues (3-4 short cues), and 1 common error to avoid.

Avoid: high-risk loading positions, exercises requiring supervision the patient won't have, exercises requiring equipment not stated.

Format as a printable one-page sheet.
```

**Required de-identification:** No patient identifiers required.

**Clinician review checklist:**
- Every exercise is appropriate to the assessment findings
- Loads and ranges of motion respect known contraindications
- Cues match what you'd say in clinic
- Progression criteria are measurable
- Program achievable in the stated time and equipment context
- Sheet customised with patient initials and date before issuing

**Medicolegal note:** A home exercise program is a clinical prescription. Don't issue a generic AI output — adapt each exercise to the patient in front of you.

---

---
title: Progression Planner
specialty: physio,osteo
useCase: clinical-reasoning
riskTier: medium
toolTier: A
---

**When to use:** Planning the next progression step for a patient who has mastered the current stage of their rehab program.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

The patient has completed [current stage / week X] of rehabilitation for [condition]. They have met the following criteria: [list]. Suggest the next progression stage covering:
- Updated exercise selection (new exercises to add, existing to modify or retire)
- Load progression (specifics: weight, reps, time under tension)
- Functional task introduction
- Criteria to progress to the next stage after this one
- Red flags that would mean stepping back

Constraints: progression should be conservative, in line with tissue-healing timelines for the condition. Cite the principle behind each progression (mechanical, neural, metabolic, motor control). Australian English.
```

**Required de-identification:** No patient identifiers required.

**Clinician review checklist:**
- Progression respects tissue-healing timelines for the specific injury
- Loads are realistic for the patient's strength baseline
- Functional task introduction is sport- or job-specific
- Red flags are appropriate to the condition
- Clinical reasoning behind each step makes sense to you
- Patient buy-in confirmed before issuing

**Medicolegal note:** Progressing too fast is the most common rehab error and a common malpractice trigger. Use AI to brainstorm, but make the final call yourself.

---

---
title: Return-to-Sport Letter
specialty: physio,osteo,gp
useCase: certificate
riskTier: high
toolTier: A
---

**When to use:** Drafting a return-to-sport clearance letter for an athlete cleared to resume competition.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a return-to-sport letter for an Australian athlete. Address to: athlete, parent (if minor), coach, and club. Include:
- Date of injury and brief mechanism
- Rehabilitation summary
- Functional testing completed and outcomes
- Sport-specific testing completed and outcomes
- Clearance status (cleared / cleared with restrictions / not cleared)
- Any ongoing precautions or monitoring
- Re-injury red flags
- Follow-up plan

If the sport is contact or collision (rugby, AFL, soccer header play), and the patient has had a concussion, explicitly reference the SCAT or relevant return-to-play protocol stage completed.

Clinical context:
[paste de-identified summary including testing data]

Do not write "fully cleared" without specific evidence of functional testing.
```

**Required de-identification:** Strip athlete name, club name, coach name. Keep sport, age band, injury, and testing data.

**Clinician review checklist:**
- Functional testing actually completed and documented
- Sport-specific testing is appropriate to the sport
- For concussion: full graduated return-to-play protocol completed
- Clearance language is specific (not "back to normal")
- Re-injury red flags clear to non-clinicians
- Follow-up appointment booked

**Medicolegal note:** Return-to-sport letters in contact sports — especially after concussion — are high-litigation-risk documents. Document every functional testing result that supports your clearance decision.

---

---
title: Home Exercise Sheet
specialty: physio,osteo
useCase: education
riskTier: low
toolTier: A,B
---

**When to use:** Producing a clean, printable handout for a patient to take home after you've prescribed an exercise.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Format the following exercise into a printable patient handout for an Australian allied health practice. Include:
- Exercise name
- One-sentence purpose
- Numbered step-by-step instructions (year-8 reading level)
- Sets, reps, frequency
- Technique cues (3 max)
- "Stop if you feel..." red flags
- Space for clinician notes and patient initials

Exercise details:
[paste exercise specifics]

Make it easy to read at arm's length. Use plain Australian English. Do not include marketing language.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- Instructions match how you demonstrated the exercise
- Cues match your verbal cues
- Red flags are appropriate to the exercise
- Reading level suits the patient
- One exercise per sheet (not bundled)
- Personalised with patient initials before issuing

**Medicolegal note:** Patient handouts become evidence of what you prescribed. Keep a master copy and a signed-issued copy.

---

---
title: Ergonomic Assessment Template
specialty: physio,osteo
useCase: education
riskTier: low
toolTier: A,B
---

**When to use:** Drafting a template for a workplace or home-office ergonomic assessment.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Create a workplace ergonomic assessment template for an Australian allied health clinician to complete with a patient. Cover:
- Workstation type (desk, standing, mobile)
- Chair adjustment (height, lumbar, armrest)
- Monitor (height, distance, glare)
- Keyboard and mouse position
- Lighting
- Phone and document use
- Breaks and movement patterns
- Symptom mapping (what hurts, when, after how long)
- Top three recommendations
- Review timing

Format as a structured form. Australian English. Year-9 reading level. Include checkboxes and short-answer fields.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- All assessment areas relevant to the patient's work
- Recommendations are within scope (no equipment prescription unless qualified)
- Symptom mapping captures laterality and timing
- Review timing realistic
- Customised for your practice branding

**Medicolegal note:** Ergonomic recommendations sit between clinical advice and workplace consulting. Stay within scope — refer to a certified ergonomist for complex workstation overhauls.
