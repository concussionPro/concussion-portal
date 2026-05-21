# De-identification Prompts

Prompts that strip identifying information from clinical text before further AI processing. Critical safety step before any clinical content touches a Tier B or Tier C tool.

---

---
title: Clinical Case De-identifier
specialty: all
useCase: workflow
riskTier: medium
toolTier: A
---

**When to use:** You have a clinical case write-up that contains identifiable details and you want to produce a de-identified version safe for use in further prompts, CPD discussion, or peer review.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

You are assisting an Australian clinician with de-identification. Take the clinical text below and return a version with the following stripped or replaced:

- Patient name → "the patient"
- Date of birth → age band only (e.g. "40s")
- Specific dates → relative time (e.g. "3 weeks ago")
- Address → suburb-level descriptor only if clinically relevant, else removed
- Phone, email, Medicare, IHI, claim numbers → removed
- Names of family members, employers, schools, sports clubs → generic descriptors ("partner", "employer", "school", "sports club")
- Names of other treating practitioners → role only ("the GP", "the specialist")
- Any uncommon condition combined with rare demographic that could re-identify → flag for the clinician to review

Preserve all clinical content exactly. At the end, list anything you flagged as potentially re-identifying.

Source text:
[paste original]
```

**Required de-identification:** This IS the de-identification step.

**Clinician review checklist:**
- All flagged items reviewed and resolved by the clinician
- No dates, names, or numbers remain in the output
- Clinical content unchanged
- Rare condition + rare demographic combinations handled
- Output saved as the working version; original remains in patient file only

**Medicolegal note:** De-identification is the foundational safety step for any AI use in clinical work. If you cannot de-identify reliably, do not use AI on that material. The OAIC has issued guidance that re-identifiable data is still personal information.

---

---
title: Patient Narrative Anonymiser
specialty: all
useCase: workflow
riskTier: medium
toolTier: A
---

**When to use:** You want to use a patient case in teaching, CPD presentation, or content marketing. Stronger de-identification needed than for internal AI processing.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

You are anonymising a patient case for educational use. Apply the strictest de-identification standard:

- All names removed or replaced with neutral pseudonyms
- Age replaced with broad band (under 18, 18-30, 30-50, 50-70, over 70)
- Geographic location removed or generalised to state level only
- Specific dates removed entirely; relative time only ("recently", "over six months")
- Occupation generalised ("manual labourer", "professional", "student", "retiree")
- Any unusual condition combined with any unusual demographic detail flagged for review
- Treating practitioners and facilities anonymised
- Any quoted patient speech rephrased so it is no longer verbatim

Preserve clinical learning value. Note at the end any feature you removed that affected the clinical narrative.

Source case:
[paste original]
```

**Required de-identification:** This IS the de-identification step.

**Clinician review checklist:**
- Output cannot be linked back to a real patient even by someone who knows them
- Clinical learning value preserved
- Patient consent obtained for case use, even after anonymisation
- Storage of anonymised case complies with practice policy
- Use case documented (CPD, teaching, marketing) and approved against AHPRA rules
- For marketing: ALSO check AHPRA advertising rules around case-based content

**Medicolegal note:** Anonymisation for public use (teaching, content marketing) requires a higher bar than internal use. Even with consent, AHPRA may treat a published case as testimonial-like if specific to one patient. Aim for true composite or fully generalised cases for any public-facing use.

---

---
title: Document Scrubber
specialty: all
useCase: workflow
riskTier: medium
toolTier: A
---

**When to use:** You have a document (PDF text, letter, referral) and want every identifiable element flagged or stripped, especially metadata-style content (claim numbers, Medicare, IHI).

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Scan the following document text and produce two outputs:

1. A scrubbed version with the following replaced with [REDACTED]:
   - All proper nouns (people, places, organisations) unless generic
   - All dates
   - All numeric identifiers (Medicare, IHI, claim, file, phone, postcode)
   - All email addresses and URLs
   - All physical addresses
   - All ages stated as a specific number (replace with age band)

2. A list of every replacement made, with line number, original value type (e.g. "person name", "date", "Medicare number"), and replacement marker.

Do not preserve the original document text in the output — only the scrubbed version and the replacement log.

Source text:
[paste document text]
```

**Required de-identification:** This IS the de-identification step.

**Clinician review checklist:**
- Spot-check the replacement log against the original
- Confirm no identifiers slipped through (especially in unusual formats)
- Confirm clinical content preserved
- Use the scrubbed version, not the original, in any onward AI prompt
- Store the original separately under normal patient-file controls
- Delete any AI-tool-held copy of the original after the scrubbing session

**Medicolegal note:** Document scrubbing is a useful interim step but not a substitute for a Tier A tool with proper data residency. Never paste an unscrubbed document into a Tier C tool. When in doubt, scrub twice — once with AI, once with your own eyes.
