# Patient Communication Prompts

Prompts for patient-facing communication — education, instructions, reminders, translations. All output requires clinician review for accuracy and tone before reaching the patient.

---

---
title: Condition Explainer
specialty: all
useCase: patient-comms
riskTier: low
toolTier: A,B
---

**When to use:** A patient has just been diagnosed with a condition (or had one explained) and would benefit from a written, plain-English summary to take home.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Write a one-page patient education sheet on [condition name] for an Australian audience. Reading level: year 8. Use Australian spelling. Include:
- What it is (in plain words)
- Why it happens
- What the patient might feel
- What we'll do about it
- What the patient can do at home
- When to seek further help (red flags)

Tone: warm, clear, not alarming. Avoid jargon. Where a medical term is essential, define it in brackets.

Do not include specific dosages, supplement brands, or treatment protocols.
```

**Required de-identification:** No patient data needed.

**Clinician review checklist:**
- Plain-English explanation is medically accurate
- Red flags listed match standard clinical guidance
- No treatment protocol given that conflicts with your plan
- Reading level is appropriate
- Tone matches your practice voice

**Medicolegal note:** Education sheets create a paper trail of what the patient was told. Make sure the document reflects your actual advice.

---

---
title: Pre-operative or Pre-procedure Information
specialty: gp,nursing
useCase: patient-comms
riskTier: medium
toolTier: A
---

**When to use:** Patient is scheduled for a procedure and needs written pre-procedure preparation information.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft pre-procedure information for a patient scheduled for [procedure type] in an Australian healthcare setting. Cover:
- What the procedure is (plain language)
- Why it's being done
- Preparation in the 24 hours before
- What to bring on the day
- What to expect during
- What to expect after (recovery time, restrictions)
- When and how to follow up
- Red flags requiring urgent contact

Australian English. Year 8 reading level. Do not include specific medication dosages or fasting times — leave [SPECIFY] placeholders for the clinician to fill.
```

**Required de-identification:** No patient data needed.

**Clinician review checklist:**
- All [SPECIFY] placeholders filled in with procedure-specific values
- Fasting and medication instructions match your protocol exactly
- Red flags match the specific procedure
- Contact details for after-hours questions are present
- Document signed and dated by clinician

**Medicolegal note:** Pre-procedure instructions are high-stakes. Errors in fasting or medication instructions can cause procedure cancellation or harm. Triple-check every placeholder.

---

---
title: Post-treatment Instructions
specialty: physio,osteo,nursing
useCase: patient-comms
riskTier: low
toolTier: A,B
---

**When to use:** After hands-on treatment, you want to send the patient home with a clear written take-home for the next 24-72 hours.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft post-treatment instructions for a patient who has just received [treatment type]. Cover the next 24-72 hours. Include:
- What's normal to feel (mild soreness, fatigue, etc.)
- What's not normal (red flags)
- Activity guidance (what to do, what to avoid)
- Self-care suggestions (heat, ice, hydration, rest)
- When to contact us
- When to seek urgent care

Australian English. Plain language. Reassuring tone. One page maximum.
```

**Required de-identification:** No patient data needed unless personalising.

**Clinician review checklist:**
- "Normal" reactions match the specific treatment provided
- Activity guidance matches your verbal instructions to the patient
- Red flags appropriate to the treatment
- Contact pathway clear and current
- No new claims about treatment effects

**Medicolegal note:** Post-treatment instructions reduce after-hours calls and document your advice. Keep one signed copy on file.

---

---
title: Medication Reminder Script
specialty: gp,nursing
useCase: patient-comms
riskTier: medium
toolTier: A
---

**When to use:** Drafting a written reminder or SMS template for medication-related follow-ups (compliance, missed doses, scheduled reviews).

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a brief patient reminder message for an Australian primary care setting. Purpose: [remind to take a medication / remind of upcoming medication review / remind to collect a prescription / remind of side effect reporting].

Constraints:
- Under 320 characters (SMS-friendly)
- Plain English
- Friendly but professional
- Identify the practice but not the patient
- No medication name or dose in the message body (privacy)
- Include a callback number
- Comply with Australian privacy expectations for SMS

Output: 3 variants the clinician can choose from.
```

**Required de-identification:** No patient-specific data in the prompt.

**Clinician review checklist:**
- No medication name visible in message
- Practice identifier present
- Callback number correct
- Tone matches practice voice
- Patient has consented to SMS contact

**Medicolegal note:** SMS messages can be seen by others on the patient's phone. Never include a medication name, condition, or test result in an SMS.

---

---
title: Appointment Follow-up
specialty: all
useCase: patient-comms
riskTier: low
toolTier: A,B,C
---

**When to use:** Sending a follow-up email or letter after a missed appointment, a recent assessment, or a treatment milestone.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a follow-up message for an Australian allied health patient. Purpose: [missed appointment / 2-week post-assessment check-in / mid-program review prompt].

Tone: warm, not pushy. Plain Australian English. Under 150 words. Include:
- Acknowledgement of the situation
- Brief reminder of why follow-up matters (without scaring)
- Clear next-step option
- How to book or get in touch
- Easy opt-out if they no longer wish to continue care

Sign off as the practice, not as a named clinician.
```

**Required de-identification:** No patient data needed.

**Clinician review checklist:**
- Tone is supportive, not coercive
- Opt-out language is genuine
- Next-step is easy to action
- Practice details correct
- Complies with your appointment cancellation policy

**Medicolegal note:** Follow-up messages should never pressure a patient to continue care they don't want. Keep tone neutral and offer a graceful exit.

---

---
title: Multilingual Translation
specialty: all
useCase: patient-comms
riskTier: medium
toolTier: A
---

**When to use:** A patient has limited English and you have a written instruction sheet that needs translation. AI translation is a draft only — a NAATI-certified interpreter is required for legally significant communications.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Translate the following patient instruction sheet from Australian English into [target language]. Maintain a year-8 reading level. Preserve all medical terms accurately. Use formal-but-warm tone appropriate for healthcare communication in [target language] culture. Where a term has no direct equivalent, provide the closest plain-language explanation and flag with [TRANSLATOR NOTE].

Source text:
[paste de-identified English instruction sheet]

Output: translated version, plus a list of any terms you flagged or were uncertain about.
```

**Required de-identification:** Strip any patient identifiers from the source text.

**Clinician review checklist:**
- For routine education only — never for consent, refusal of care, or legally significant documents
- Flagged terms reviewed by a NAATI-certified translator before patient use
- A note added to the patient file recording AI translation was used
- Patient asked to confirm understanding via teach-back at next visit
- Translation date and version recorded

**Medicolegal note:** AI translation is acceptable for routine education sheets but not for consent forms, capacity assessments, or refusal-of-care documentation. Use a certified interpreter for anything legally significant.
