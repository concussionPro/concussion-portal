# Naturopathy Prompts

Prompts for naturopathic practice. CRITICAL — Australian TGA rules apply: educational content only, no therapeutic claims, no statements that a product treats, prevents, or cures a condition unless that claim is on the ARTG entry for the specific product. AI must not generate prescriptive supplement advice.

---

---
title: Supplement Education Sheet
specialty: naturopath
useCase: education
riskTier: high
toolTier: A
---

**When to use:** Producing an educational sheet for a patient about a nutrient or herb you've discussed in clinic.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft an EDUCATIONAL information sheet about [nutrient or herb name] for an Australian naturopathy patient. Strict constraints:

- This is educational only. Do not state that the substance treats, prevents, or cures any condition.
- Use language like "is involved in", "is required for", "is studied for its role in" — not "treats" or "is effective for".
- Do not recommend a specific dose, brand, or product. Use phrases like "doses are individualised by your practitioner".
- Include a clear note that this is general information, not medical advice.
- Reference the TGA framework: substances may only be sold in Australia with claims aligned to the ARTG entry.
- Cover: what the substance is, its physiological role in the body, food sources, signs of insufficiency (factual, not diagnostic), how a naturopath approaches it (consultation, individualisation, monitoring), and when to consult a healthcare professional.
- Australian English. Year-9 reading level. One page.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- No therapeutic claim that the substance treats, prevents, or cures a condition
- No specific dose or brand recommendation in writing
- Educational framing throughout
- ARTG reference present
- "General information, not medical advice" disclaimer present
- TGA compliance reviewed (when in doubt, simplify)

**Medicolegal note:** The TGA actively monitors therapeutic claims. A written supplement sheet with a therapeutic claim is grounds for regulatory action. If you can't say "this product treats X" on the bottle, don't say it in your handout.

---

---
title: Diet Plan Template
specialty: naturopath
useCase: education
riskTier: medium
toolTier: A
---

**When to use:** Drafting a general dietary guidance template for a patient (not a prescriptive medical nutrition therapy plan, which requires a dietitian).

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a general dietary guidance template for an Australian naturopathy patient. Theme: [whole-foods anti-inflammatory / gut-supportive / blood-sugar-friendly / etc.]. Constraints:

- Educational and supportive, not prescriptive.
- Frame as "a guide to consider with your practitioner", not "follow this plan".
- Include: principles of the dietary pattern, foods to emphasise (with examples), foods to reduce (with reasoning), example meals (breakfast, lunch, dinner, snack), shopping list starter.
- Do not promise weight loss, disease reversal, or specific clinical outcomes.
- Note that nutritional needs are individual and should be reviewed with the practitioner.
- Acknowledge any patient with significant medical conditions or on medications should also consult their GP or a dietitian.
- Australian English, Australian food examples (e.g. kangaroo, barramundi, native greens where relevant). Year-8 reading level.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- No claims of disease treatment, prevention, or cure
- Food examples are realistic and locally available
- GP/dietitian referral note present for complex patients
- Allergies and intolerances considered in customisation
- Cultural appropriateness reviewed for the patient
- Document customised, not generic, before issuing

**Medicolegal note:** Naturopaths providing dietary advice must stay clear of medical nutrition therapy claims, which are within dietitian scope. Frame as wellness guidance, not treatment.

---

---
title: Lifestyle Intervention Plan
specialty: naturopath
useCase: education
riskTier: medium
toolTier: A
---

**When to use:** Drafting a lifestyle plan covering sleep, stress, movement, and environment for a patient.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a lifestyle intervention plan for an Australian naturopathy patient. Cover four domains:
- Sleep (routine, environment, screen habits)
- Stress (breathing, mindfulness, nature exposure, social connection)
- Movement (gentle daily, structured weekly)
- Environment (toxin reduction in plain language — household chemicals, plastics, indoor air)

Constraints:
- Educational and motivational, not prescriptive.
- Each recommendation is a "consider trying", not "you must".
- No claims that any single intervention treats a condition.
- No fear-based language about toxins, chemicals, or modern lifestyle — keep it factual.
- Practical for an Australian context (UV considerations for outdoor time, etc.).
- One page. Year-9 reading level.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- No therapeutic claims
- Tone is encouraging, not alarmist
- Recommendations are practical for the patient's life
- UV and Australian-context advice present
- Mental health support pathway noted if relevant
- Document personalised

**Medicolegal note:** Lifestyle advice is broadly safe to give, but avoid fear-based framing (especially around modern medicine, vaccines, or pharmaceuticals). It can breach AHPRA advertising and professional conduct expectations.

---

---
title: Herb Interaction Lookup
specialty: naturopath
useCase: clinical-reasoning
riskTier: high
toolTier: A
---

**When to use:** Checking potential interactions between herbs, nutrients, and pharmaceuticals a patient is taking. AI is a brainstorming aid here — primary source verification is mandatory.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

I am an Australian naturopath. List potential pharmacological interactions between the following:
- Pharmaceuticals: [list]
- Herbs being considered: [list]
- Nutrients being considered: [list]

For each potential interaction, provide:
- The mechanism (CYP enzyme, transporter, receptor, additive effect, etc.)
- Severity (theoretical / documented case / significant clinical risk)
- The primary source or guideline you're drawing from

CRITICAL: Flag anything you are uncertain about. If a combination has been associated with adverse outcomes, name the outcome. If the evidence is theoretical only, say so explicitly. Do not invent citations — if you cannot name a source, say "source not confirmed".

I will verify each flagged interaction in primary literature before clinical action.
```

**Required de-identification:** Do not include patient name or identifiers — use generic terms.

**Clinician review checklist:**
- Every flagged interaction verified in TGA guidance, MIMS, NHMRC, or peer-reviewed primary source
- "Source not confirmed" outputs treated as unverified
- High-severity interactions discussed with patient's GP if appropriate
- Patient warned to disclose all supplements to their pharmacist
- Decision and reasoning documented in patient record

**Medicolegal note:** AI hallucination of drug-herb interactions is a known problem. Use AI only as a starting point. Primary source verification is non-negotiable for clinically significant interactions.

---

---
title: Compliance Script
specialty: naturopath
useCase: patient-comms
riskTier: medium
toolTier: A,B
---

**When to use:** Helping a patient stick with a lifestyle or supplement protocol — drafting a written or SMS reminder framework.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a compliance support script for an Australian naturopathy patient working on a lifestyle and nutrition plan. Output:

- Three weekly check-in SMS message templates (under 320 chars each), warm and encouraging, no therapeutic claims, no specific product names.
- One mid-program email check-in (150 words) acknowledging that change is hard, inviting honest feedback, offering a re-set conversation if needed.
- Three motivational reframes for common stuck points: "I forgot a few days", "I felt worse before I felt better", "I don't think it's working".

Australian English. Friendly, not preachy.
```

**Required de-identification:** No patient identifiers.

**Clinician review checklist:**
- No therapeutic claims in any message
- Tone supportive, not coercive
- No medication or supplement names in SMS
- Easy opt-out language present
- Patient consented to messaging frequency and channel
- Compliance with privacy expectations for SMS confirmed

**Medicolegal note:** Compliance messaging that sounds like pressure to keep buying supplements can fall foul of AHPRA advertising rules. Frame around wellbeing, not product use.
