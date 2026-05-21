# Module 4 — Patient Communication & Documents

**Author:** Zac Lewis — Osteopath, AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22

**Reading time:** ~20 minutes
**Prerequisites:** Modules 1 (legal framework), 2 (tool selection), and 3 (documentation workflows)

---

## Overview

Module 4 covers the eight most common patient-facing outputs you can draft with an LLM in Australian clinical practice. Every example below assumes you have already classified your tool tier (Module 2) and applied a de-identification preamble (Module 3). The recurring rule: the LLM produces a *draft*. You produce the *clinical communication*. Nothing leaves your clinic without your name on it and your eyes across it.

Patient-facing documents are the most visible output of any practice. They are also the documents most often subpoenaed, audited, or shared without your knowledge. A discharge instruction that omits a red flag, a referral letter with a fabricated investigation, a supplement sheet with a therapeutic claim — each carries professional, legal, and reputational consequences. AI accelerates the drafting of these documents tenfold; it also accelerates the propagation of errors at the same rate. This module's job is to make the speed safe.

The de-identification preamble used throughout this module is:

> "You are assisting an Australian registered health practitioner. The information below has been de-identified. Do not invent clinical details, medications, dosages, or guidelines. If information is missing, leave a clearly bracketed placeholder such as [CLINICIAN TO INSERT] rather than guessing. Use Australian English spelling and Australian clinical conventions."

Paste this preamble before every prompt in this module. Combined with the tool-tier framework from Module 2, this is your first line of defence.

### How to read the worked examples

Each of the eight use cases below follows the same structure:

1. **Goal** — what the output is for.
2. **Risk tier** — Low, Medium, or High medicolegal exposure.
3. **Prompt example** — a clinician-ready prompt you can copy, paste, and adapt.
4. **Illustrative output** — an excerpt showing what the LLM produces (not authoritative).
5. **Review checklist** — what you must verify before the document leaves your clinic.

The risk tier is not academic. It governs how much of your own time the document deserves on review, whether a second clinician should sight it, and whether it can be sent at all without face-to-face confirmation with the patient.

---

## 1. Personalised patient information sheets

**Goal:** A plain-English explainer for a specific condition, pitched at a defined literacy level, with optional translation.

**Risk tier:** Low to Medium (rises if condition is high-acuity or rare).

**Prompt example:**

> [De-id preamble]
> Draft a one-page patient information sheet about post-concussion symptoms for an adult patient. Target reading age: Year 8 (approx. 13–14 years). Tone: warm, factual, non-alarming. Include: what concussion is, expected recovery timeline (most resolve within 2–4 weeks), common symptoms, when to seek urgent review, and three self-management strategies. Do not include medication recommendations. End with "Reviewed by: [CLINICIAN NAME], [DATE]".

**Illustrative output (excerpt):**

> *Understanding Concussion*
> *A concussion is a mild brain injury, usually from a knock to the head or a sudden jolt. Most people feel better within 2 to 4 weeks. You may notice headaches, feeling tired, trouble concentrating, or feeling more emotional than usual. These are normal and usually settle with time…*
> *Seek urgent care if you have: worsening headache, vomiting more than once, weakness in an arm or leg, slurred speech, or seizures…*

**Review checklist:**
- Reading level matches patient (run through a Flesch-Kincaid checker if unsure).
- All clinical statements are accurate for *this* patient's presentation.
- Red-flag list is complete and matches current Australian guidelines (e.g. AFL Concussion Guidelines, RACGP).
- No medication, dosage, or supplement claims unless you intend them.
- Your name and review date are filled in.

**Translation:** If translating, generate the English version first, review it, *then* translate. Never translate an unreviewed draft. See section 7.

**Common failure mode:** the LLM defaults to a US reading style with US-spelt words (color, mom, fall through the cracks) and US escalation patterns ("call 911"). Always specify Australian English and Australian emergency numbers (000) in the prompt, and check the output explicitly for residual American phrasing before sending.

---

## 2. Exercise programs (introduction)

**Goal:** A structured home program with named exercises, sets/reps/dosage, progression criteria, and cues.

**Risk tier:** Medium. Exercise prescription is within scope for physios, osteopaths, exercise physiologists, and many GPs — but the LLM cannot assess the patient. You are prescribing; it is formatting.

**Prompt example:**

> [De-id preamble]
> Draft a 4-week home exercise program for a 45-year-old office worker recovering from non-specific low back pain (no red flags, no radiculopathy). Functional baseline: can walk 30 min, struggles with prolonged sitting. Goals: pain reduction, lumbar mobility, deep core activation. Format as Week 1–4 with exercise name, sets x reps, frequency, and one cue per exercise. Add a "Stop and call the clinic if…" red-flag section.

**Review checklist:**
- Exercises match the patient's actual baseline (not a generic template).
- Dosage is appropriate (no overloading, no under-dosing).
- Progression criteria are explicit.
- Red-flag section is present.
- Cues are accurate (not LLM-invented biomechanical claims).

Specialty deep-dive lives in Module 5a (Physio) and Module 5d (Osteo).

---

## 3. Supplement information sheets

**Goal:** Educational handout describing what a supplement is, common uses described in the literature, and known interactions.

**Risk tier:** High — TGA territory.

**Critical framing:** Supplement sheets generated under this workflow are **educational only**. They do not constitute prescription, recommendation, or therapeutic advice unless you, the clinician, sign off and that is within your scope. Avoid the words "treats," "cures," "prevents," or "fixes." Use "has been studied for," "is traditionally used for," or "patients sometimes ask about."

**Prompt example:**

> [De-id preamble]
> Draft an educational information sheet about magnesium glycinate for a patient who has asked about it. Australian context. Do not make therapeutic claims (no "treats", "cures", "prevents"). Use neutral framing such as "has been studied in the context of…". Include: what it is, food sources, common dosage ranges seen in research, who should speak with a clinician before taking it (pregnancy, kidney disease, on medications), and a clear statement that this sheet is educational and not a prescription. End with "Reviewed by: [CLINICIAN NAME], [DATE]".

**Review checklist:**
- Zero therapeutic claims.
- Pregnancy / kidney / drug-interaction warnings present.
- Educational framing is unambiguous.
- TGA-compliant language (no "treats," "cures," "boosts immunity," etc.).
- You are the clinician of record.

Specialty deep-dive lives in Module 5b (Naturopathy).

---

## 4. Referral letters

**Goal:** A structured letter to a specialist summarising history, exam findings, and the question being asked.

**Risk tier:** Medium.

**Prompt example:**

> [De-id preamble]
> Draft a referral letter from [REFERRING CLINICIAN] to a neurologist. Patient: 38-year-old female. Presenting concern: persistent post-concussion symptoms 8 weeks post-MVA, including vestibular dysfunction and cognitive fog. Findings: positive VOMS, normal cervical screen, no red flags. Question: would the specialist consider further imaging or vestibular rehab referral? Format: Australian specialist letter format with "Dear Dr [SPECIALIST]" salutation. Include the line "This letter was drafted with AI assistance and has been reviewed and approved by the treating clinician."

**Illustrative output (excerpt):**

> *Dear Dr [Specialist],*
> *Thank you for seeing [Patient], a 38-year-old who presents with persistent post-concussion symptoms 8 weeks following a motor vehicle accident…*
> *I would value your assessment regarding…*
> *This letter was drafted with AI assistance and has been reviewed and approved by the treating clinician.*
> *Yours sincerely, [CLINICIAN]*

**Review checklist:**
- All clinical claims are accurate and match your notes.
- No fabricated findings or test results.
- AI-attestation line is present.
- Specialist's name and address are correct.
- Patient identifiers are complete *after* you re-identify the letter.

---

## 5. Work and school certificates

**Goal:** Return-to-work, return-to-learn, or modified-duties documentation.

**Risk tier:** High. These are legal documents. Insurers, schools, and employers rely on them.

**Special considerations:**
- Certificates must be issued by a clinician within their scope (e.g. GPs and some allied health for specific schemes).
- Workers compensation has prescribed forms in every state — the LLM can draft the narrative, but the prescribed form is non-negotiable.
- Never date a certificate before the consultation date.

**Prompt example:**

> [De-id preamble]
> Draft a return-to-learn plan for a 14-year-old student recovering from a sports-related concussion (Day 10 post-injury, symptoms improving). Australian school context. Phased approach over 2 weeks: cognitive rest, partial days, full days with accommodations, full return. Include accommodations (reduced screen time, breaks every 30 min, no contact sport). Note that this plan is to be reviewed at the next appointment in [DATE].

**Review checklist:**
- Dates are correct (consultation date, review date).
- Phases match the patient's actual symptom trajectory.
- No promises about a return date you cannot keep.
- Scope: are you the right clinician to issue this?
- Signed and dated.

---

## 6. Discharge instructions

**Goal:** Post-treatment instructions with clear red-flag escalation criteria.

**Risk tier:** High. The biggest failure mode is omitting a safety net.

**Prompt example:**

> [De-id preamble]
> Draft post-treatment discharge instructions for an adult patient who has had a first-time manual therapy session for thoracic spine pain. Include: what to expect over the next 24–72 hours (possible mild soreness), self-management (heat, gentle movement, hydration), what NOT to do (heavy lifting for 48 hours), and a clear "Contact us or seek care if…" section covering severe pain, neurological symptoms, fainting, or new symptoms.

**Review checklist:**
- The red-flag list is complete for *this* intervention.
- Contact details are correct (clinic number, after-hours options).
- The patient has been told to attend ED if specific symptoms appear.
- "What to expect" matches your actual clinical experience, not LLM defaults.

**Failure mode to watch:** LLMs sometimes drop critical safety info when asked to "make it shorter" or "more friendly." Always review the full version before any rewrite. A useful safeguard is to keep a master list of red flags for each intervention type and physically check each item against the generated discharge instruction before approval.

**Specific risk for high-velocity manual therapy, injection procedures, and invasive interventions:** the LLM has no awareness of post-procedure complication patterns specific to your technique. It will produce plausible-sounding but generic discharge advice. Augment every prompt with the specific complication signs you want listed (e.g. for a cervical HVLA: vertebrobasilar symptoms — vertigo, visual disturbance, drop attacks, ataxia — present until proven otherwise as red flags).

---

## 7. Multilingual patient communication

**Goal:** Translate clinician-approved content into another language for a patient.

**Risk tier:** Medium to High depending on content.

**Workflow:**
1. Draft the English version with the LLM.
2. Review and approve the English version.
3. Translate the approved English version.
4. Have the translation back-translated to English (by the same LLM or, better, a different one) and compare.
5. For high-stakes documents (consent, discharge instructions, work certificates), use an accredited NAATI translator. The LLM is a drafting aid, not a translation service of record.

**Prompt example:**

> [De-id preamble]
> Translate the following clinician-approved patient information sheet into Mandarin (Simplified, Mainland China conventions). Preserve clinical accuracy. Flag any phrases where the English meaning may not translate cleanly with [TRANSLATOR NOTE: …]. After the translation, provide a back-translation to English in a separate section.

**Review checklist:**
- Back-translation matches the original meaning.
- Cultural conventions are appropriate.
- Drug names, units, and dosages are unchanged.
- Patient confirms they can read the chosen language and script.

---

## 8. Patient compliance scripts

**Goal:** Appointment reminders, medication adherence prompts, exercise check-ins.

**Risk tier:** Low.

**Prompt example:**

> [De-id preamble]
> Draft three short SMS messages (under 160 characters each) for a patient who has been prescribed a daily home exercise program. Message 1: gentle reminder on Day 3. Message 2: encouragement on Day 7. Message 3: nudge to book the follow-up on Day 14. Tone: warm, brief, no medical claims. Sign-off as [CLINIC NAME].

**Review checklist:**
- Character count is within SMS limits.
- No clinical claims.
- Opt-out / STOP language is included if required by Spam Act / Privacy Act for marketing-adjacent messages.
- Tone matches the clinic voice.

**A note on the line between compliance and marketing:** the Spam Act 2003 (Cth) requires consent and an unsubscribe mechanism for commercial electronic messages. Pure clinical appointment reminders typically sit outside this — but the moment a message includes a promotion, a referral nudge, or a service upsell, it becomes commercial. The LLM will happily blend the two if you don't separate them in the prompt.

---

## A working pattern across all eight use cases

If you take one structural lesson from this module, take this: every patient-facing document benefits from a three-step workflow.

1. **Brief the LLM tightly.** Specify the audience, the reading level, the tone, the constraints, the forbidden phrases, and the required elements. Vague prompts produce generic, often unsafe output.
2. **Review against a fixed checklist.** Each use case above has one. The checklist exists to catch what your eye misses when you're reading at speed.
3. **Sign and date.** Your name on the document is the signal that clinical judgement has been applied. It is also the basis on which AHPRA, the Office of the Australian Information Commissioner, the TGA, or a court will hold you to account.

This pattern is slow on the first document of any new type and fast on the hundredth. The investment is in the template, the checklist, and the prompt library — not in the individual document.

---

## Key takeaways

- Every patient-facing document is your clinical communication. The LLM drafts; you sign.
- The de-identification preamble is non-negotiable for any prompt containing patient information.
- Risk tier scales with consequences: a compliance SMS is Low; a return-to-work certificate is High.
- AI-attestation belongs on referral letters and any document that may be relied upon by a third party.
- Translation requires a verification loop (back-translation or NAATI).

## Common mistakes to avoid

- Pasting raw clinical notes into the prompt without de-identification.
- Asking the LLM to "shorten" a discharge instruction and losing the red-flag list.
- Letting the LLM invent statistics ("80% of patients recover within 6 weeks") and leaving them in.
- Issuing a work certificate without checking it's within your scope.
- Translating an unreviewed English draft.
- Using therapeutic claim language on supplement sheets (covered in depth in Module 5b).
- Accepting US English defaults (color, mom, "call 911") without an Australianisation pass.
- Forgetting to attach the AI-attestation line on documents that will be relied upon by third parties (referrers, insurers, employers, schools).
- Storing the prompt and the output but not the patient version that was actually sent — the latter is the document of record.
- Treating an LLM-generated draft as a finished document because it "looks right." Looking right is exactly the failure mode the model is best at.
