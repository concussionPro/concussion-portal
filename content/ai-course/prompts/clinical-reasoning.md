# Clinical Reasoning Prompts

Prompts to support clinical reasoning — differential diagnosis brainstorming, treatment option scanning, red-flag checking. AI here is a thinking partner, NEVER the clinical decision-maker.

---

---
title: Differential Diagnosis Brainstorm
specialty: gp,physio,osteo
useCase: clinical-reasoning
riskTier: high
toolTier: A
---

**When to use:** A patient's presentation isn't fitting a clean diagnostic pattern and you want a structured second opinion to broaden your differential.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

I am an Australian [specialty] clinician. Based on the following presentation, generate a structured differential diagnosis list ranked by:
1. Most likely given the clinical picture
2. Less likely but worth considering
3. Cannot-miss diagnoses I should actively rule out

For each, include:
- Brief reasoning (1-2 sentences)
- One or two examination findings or investigations that would support or refute it

Presentation:
[paste de-identified clinical summary including history, examination findings, red and yellow flags considered, current investigations]

Do not invent findings. If the data is insufficient, say what additional information would help. Flag anything urgent.
```

**Required de-identification:** Strip patient name, DOB, third-party identifiers. Keep age band, sex, occupation, and full clinical detail.

**Clinician review checklist:**
- Cannot-miss diagnoses are actively considered, not dismissed
- Reasoning for each differential makes clinical sense
- Suggested examination/investigation steps are within your scope
- Any urgent flag triggers immediate clinical action
- The list informs your thinking — does not replace it
- Final clinical decision is documented in your reasoning, not "the AI said"

**Medicolegal note:** Documenting that AI generated a differential list does not transfer the diagnostic responsibility. Your clinical decision is yours alone. Never record "AI did not flag X" as your defence — the duty is yours.

---

---
title: Treatment Options Scan
specialty: physio,osteo,naturopath,gp
useCase: clinical-reasoning
riskTier: medium
toolTier: A
---

**When to use:** You have a diagnosis and want a structured scan of treatment options to discuss with the patient.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

I am an Australian [specialty] clinician treating a patient with [diagnosis]. List the current evidence-aligned treatment options across:
- Conservative/non-invasive options
- Active rehabilitation options
- Pharmacological options (note if outside my scope)
- Procedural/invasive options (note if outside my scope)
- Lifestyle and self-management

For each option, briefly summarise:
- Evidence base (strong / moderate / limited / mixed)
- Typical timeline
- Common contraindications
- Where in the patient journey it tends to sit

Australian context where relevant (Medicare items, PBS, common AU clinical guidelines). Cite the guideline name if you are confident — flag "guideline not confirmed" if not.
```

**Required de-identification:** No patient-specific data required.

**Clinician review checklist:**
- Evidence ratings cross-checked against a current guideline
- "Guideline not confirmed" outputs treated as unverified
- Out-of-scope options clearly flagged
- Options match what's available in Australia (not US-only treatments)
- Patient-specific contraindications considered
- Options presented to patient as a shared-decision discussion

**Medicolegal note:** AI may cite guidelines that don't exist or misstate their content. Always verify the actual guideline before quoting evidence to a patient.

---

---
title: Red-Flag Checker
specialty: all
useCase: clinical-reasoning
riskTier: high
toolTier: A
---

**When to use:** Sanity-checking a clinical presentation against established red flags before discharging a patient or recommending watchful waiting.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

I am an Australian [specialty] clinician. Given the following presentation, list the established red flags for serious pathology relevant to this clinical area. For each red flag, state:
- The condition it would suggest
- Whether it is present, absent, or uncertain in this case
- What action would be triggered by a positive finding

Presentation:
[paste de-identified clinical summary]

Do not reassure me. List every standard red flag for this presentation, even if it seems unlikely. If any red flag is present or uncertain, recommend the appropriate escalation (GP review, ED referral, urgent imaging).
```

**Required de-identification:** Strip identifiers. Keep full clinical detail.

**Clinician review checklist:**
- Every flagged red flag actively addressed in clinical reasoning
- "Uncertain" findings clarified through further history or examination
- Escalation thresholds match your local guidelines
- Final decision documented in patient record
- Patient given written red-flag advice as safety net

**Medicolegal note:** Failure to act on red flags is among the most common malpractice triggers in primary care. AI is useful as a checklist — it is not a safety net. Your assessment and action plan is.

---

---
title: Polypharmacy Review Aid
specialty: gp,naturopath,nursing
useCase: clinical-reasoning
riskTier: high
toolTier: A
---

**When to use:** A patient is on multiple medications and/or supplements and you want a structured review of interactions, duplication, and rationalisation opportunities.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

I am an Australian [specialty] clinician reviewing the following medication and supplement list for a patient. List:

- Pharmaceuticals: [list with doses and indications if known]
- Supplements: [list with doses]
- Known conditions: [list]
- Age band, sex, renal function, hepatic function (if known)

Provide:
1. Any clinically significant interactions between items on this list
2. Any duplicated therapeutic effects
3. Any prescriptions that appear unindicated given the listed conditions
4. Any conditions on the list that appear under-treated
5. Anti-cholinergic and sedative burden considerations if elderly

CRITICAL: Flag any uncertain interactions explicitly. If you cannot cite a source, say "source not confirmed". I will verify in MIMS or AMH before any clinical action.
```

**Required de-identification:** Strip patient identifiers. Keep clinical detail.

**Clinician review checklist:**
- Every flagged interaction verified in MIMS, AMH, or AustralianPrescriber
- Source-not-confirmed outputs treated as unverified
- Recommendations to deprescribe discussed with patient's regular GP
- Patient consulted in any deprescribing decision
- Decision and reasoning documented

**Medicolegal note:** Deprescribing decisions carry clinical risk. Use AI to surface candidates for review, not to make the call. Coordinate with the prescribing doctor.

---

---
title: Evidence Summary
specialty: all
useCase: clinical-reasoning
riskTier: medium
toolTier: A
---

**When to use:** You want a fast structured summary of the current evidence base for an intervention, to inform a clinical discussion or your own CPD.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Provide an evidence summary of [intervention] for [condition] in adult patients. Structure:

- What the intervention is (one paragraph)
- Mechanism of action
- Best evidence to date (study type, sample size, outcome size if known)
- Current Australian guideline position (if any)
- Common contraindications and adverse effects
- Where uncertainty remains

CRITICAL: Cite real studies with author, year, and journal. If you are not confident a citation is real, write "citation not confirmed". Do not invent guideline positions — if you don't know what an Australian guideline says, say so.
```

**Required de-identification:** No patient data.

**Clinician review checklist:**
- Every citation verified in PubMed or the actual guideline document
- "Citation not confirmed" outputs treated as a starting point only
- Guideline positions checked at the source
- Adverse-effect profile cross-checked against TGA PI or AMH
- Evidence summary informs your discussion with patient — not the patient directly

**Medicolegal note:** AI fabrication of academic citations is well-documented. Never reproduce an AI-generated citation in a clinical document, referral, or patient handout without verifying it exists.
