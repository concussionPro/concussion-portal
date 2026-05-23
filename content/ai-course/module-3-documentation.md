# Module 3 — Documentation Workflows (Compliant by Design)

**Author:** Zac Lewis — Osteopath, AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22

*AI in Clinical Practice — Concussion Education Australia*

**Reading time:** ~20 minutes
**Prerequisites:** Module 1 (legal framework — AHPRA, Privacy Act, APPs, TGA) and Module 2 (the three-tier tool model)

Documentation is where most clinicians will first feel the productivity lift of AI. It is also where the legal, ethical, and clinical risks concentrate.

[DEFINITION: AI scribe | A clinical tool that listens to a consultation (in-person or telehealth), transcribes the audio, and produces a structured clinical note — typically a SOAP, problem-oriented, or specialty-specific template. Modern scribes also extract referral letters, billing codes, and patient-facing summaries.]

This module walks through seven concrete documentation workflows, each paired with a tier recommendation (Module 2), a medicolegal note, a risk flag, and a before/after example.

The unifying principle: **every AI-generated clinical document is a draft until a human clinician has reviewed, edited, and explicitly attested to its accuracy.** AHPRA's expectations on record-keeping (Module 1) do not soften because the first draft came from a model. If anything, they tighten.

[KEYPOINT: Review-and-sign is non-negotiable. Every AI-generated clinical document is a draft until a clinician has read it line-by-line, edited for accuracy, and attested to it with their signature.]

A second refrain runs through this module: **de-identification first** for any workflow that touches a Tier C tool. Module 2 made the case; here you'll see it applied.

[INFOGRAPHIC: ahpra-doc-flow]

---

## 1. AI Scribes — In-consult Voice-to-note

**Tier:** A only
**Risk flag:** Medium-High (PII at the point of capture)
**Examples:** Heidi Health, Lyrebird Health, Halo Health, Microsoft Dragon Copilot

### How they work

AI scribes listen to a consultation (in-person or telehealth), transcribe it locally or in a secure cloud, and produce a structured clinical note — typically a SOAP, problem-oriented, or specialty-specific template. Modern scribes also extract referral letters, billing codes, and patient-facing summaries.

### What they store

This is the question that determines whether you can use a given scribe. Read the DPA for:

- Raw audio (retained, deleted after processing, or never stored)
- Transcript (retained for how long, where)
- Generated note (typically retained until you push it to your practice-management system, then deleted)
- Metadata (session length, model versions, error logs)

A well-designed Tier A scribe deletes raw audio shortly after transcription and retains only the generated note, in Australia, accessible only to your clinic.

### The consent workflow

Both clinician and patient consent matter here.

**Patient consent:**

- Verbal consent at the start of the consult is the minimum
- Written or click-through consent at the appointment-booking stage is better
- The patient should be told: (1) AI is recording and transcribing the consult, (2) raw audio is or is not retained, (3) the generated note becomes part of their record, (4) they can decline at any time without consequence

[REDFLAG: Running an AI scribe without explicit patient consent is the consent gap most likely to surface in a complaint. Verbal consent at the start of the consult is the minimum; silent assumption of consent is not consent.]

**Clinician obligations under AHPRA** (see Module 1): the record remains the clinician's responsibility. The scribe is a tool, not the author. You sign the note; you own its accuracy.

### Before / After

> **Before (manual workflow):**
> 45-minute concussion follow-up. Clinician scribbles bullet points during the consult, then spends 12–15 minutes after the patient leaves typing a SOAP note from memory and notes.

> **After (Tier A scribe):**
> Same consult. Scribe runs in background after verbal consent. Clinician makes eye contact throughout, no typing during the consult. After the patient leaves, the scribe presents a structured note within 30–60 seconds. Clinician reviews for accuracy (typically 2–4 minutes of edits), signs, and pushes to the practice-management system.

Net lift: 8–12 minutes per consult, and — clinically more important — undivided attention during the consult itself.

### Medicolegal note

The AHPRA expectation is that the record reflects what occurred. If the scribe hallucinates a finding (e.g. invents a negative neurological exam that you did not perform), and you sign the note, *you* have falsified the record. Scribes are reliable but not infallible. The review step is not optional.

[KEYPOINT: A hallucinated finding signed without review is a falsified record — and you, not the scribe vendor, are the falsifier. AHPRA expectations and the legal position are unchanged by the tool.]

For workers compensation, mental health, and high-stakes documentation, treat the scribe output as a first draft that needs more, not less, scrutiny.

[QUICK-CHECK: A patient asks whether the recording is stored. You don't know. What's your immediate response? | 1 | Reassure them it's fine and continue the consult — the vendor handles all storage compliance. | "I don't know off the top of my head — let me confirm with our system and come back to you before we proceed." Pause the scribe and check the DPA. | Refer them to your privacy policy and proceed. | rationale: Under APP 1 (open and transparent management of personal information), patients are entitled to know how their information is handled. If you can't answer, pause — never proceed with the scribe running until you can.]

---


[BREAK]

## 2. SOAP Note Refinement — Clinician Drafts, LLM Polishes

**Tier:** C acceptable (de-identified inputs only) or A preferred
**Risk flag:** Low-Medium

### Workflow

The clinician writes raw, fast notes during or immediately after the consult — fragments, abbreviations, shorthand. An LLM then expands and clarifies them into a structured SOAP note.

If you use Tier C for this: **de-identify before pasting.** Strip name, DOB, Medicare, address, employer, and any unique re-identifying detail. The output is also de-identified — you then add the identifiers back in your practice-management system.

If you use a Tier A scribe or a Tier A note-refinement tool, the de-identification step is unnecessary.

### Before / After

> **Before:**
> Raw note: "37F, MVA 3/52 ago, ongoing HA, photophobia, VOMS smooth pursuit + sx, BCTT today 8mins sx onset HR 142, plan: graded RTL, r/v 2/52"

> **After (Tier C, de-identified — note that age has been generalised and MVA date kept relative):**
> Subjective: 37-year-old patient presenting three weeks post motor-vehicle accident with ongoing headache and photophobia.
> Objective: VOMS smooth pursuit provoked symptoms. Buffalo Concussion Treadmill Test ceased at 8 minutes with symptom onset at HR 142.
> Assessment: Persisting concussion symptoms with sub-symptom-threshold exercise tolerance.
> Plan: Graded return-to-learn protocol initiated. Review in two weeks.

### Medicolegal note

LLMs sometimes add detail that wasn't in your input — a phenomenon often called confabulation. Read every refined note line-by-line against your raw notes before signing. If the LLM invented a finding, delete it.

[KEYPOINT: If the polished output contains a finding that wasn't in your raw notes, delete it or only retain it if you separately confirm you actually did the thing. LLMs interpolate from context; the record must reflect what you actually did.]

For Tier C usage specifically: keep a copy of the de-identified input you pasted, in case a question arises later about what the model was actually asked to do.

[QUICK-CHECK: You paste raw notes into Tier C. The polished output includes "no red flags identified on history" — you DID ask, but didn't note it. Keep that sentence? | 1 | Yes — it's accurate, and the LLM just made the documentation cleaner. | No — not as-is. Either delete it, or only keep it if you separately confirm you screened. The LLM is interpolating; the record must reflect what you actually did. | Yes — under standard clinical practice, "no red flags" can be assumed when not documented. | rationale: LLM-polished notes often add plausible-sounding clinical claims that weren't in your raw input. Every sentence in the final record must be something you actually did or observed.]

---


[BREAK]

## 3. Treatment Plan Documents — Generated from a De-identified Case Summary

**Tier:** C acceptable (de-identified) or A preferred
**Risk flag:** Low-Medium

### Workflow

After assessment, you write a structured but de-identified case summary (presentation, key findings, working diagnosis, patient goals). The LLM generates a treatment plan with sections for clinical interventions, home program, return-to-activity progression, and review schedule. You then edit for accuracy and patient-specific factors.

This works well in Tier C precisely because the input doesn't need PII — the clinical content drives the plan, not the patient's name.

### Before / After

> **Before:**
> Clinician spends 20–25 minutes drafting a six-week vestibular rehabilitation plan, copying and adapting from previous similar plans, easy to miss components, easy to leave outdated dosages.

> **After (Tier C, de-identified):**
> Input: a 6-line case summary with no PII. Output: a structured plan covering vestibular ocular reflex retraining, gaze stabilisation, dynamic balance, cervical contribution, return-to-work staging, and red-flag review criteria. Clinician edits to patient specifics in 5–8 minutes.

### Medicolegal note

A generic plan that isn't tailored to the actual patient is not a treatment plan — it is a template. The edit step has to convert the LLM output into something specific to the person in front of you. Standing recommendations the LLM invents (specific exercise dosages, specific medication doses, specific return-to-sport timelines) must be cross-checked against your own clinical judgement and current Australian guidelines.

---


[BREAK]

## 4. Workers Compensation Documentation

**Tier:** A only (and even then, with elevated review)
**Risk flag:** High

### Why workers compensation is different

Workers compensation documentation has elevated medicolegal exposure for three reasons:

1. The document will likely be read by an insurer, a rehabilitation provider, possibly a lawyer, and potentially used in a tribunal or court
2. Statements about capacity, restrictions, and causation have direct financial consequences for the patient and their employer
3. The clinician is often required by state legislation (varies by jurisdiction — SIRA in NSW, WorkSafe in Victoria, etc.) to provide opinions in specific formats

For these reasons:

- Never use a Tier C tool for workers compensation drafting, even with "de-identification" — the combination of injury date, employer, and clinical history is highly re-identifying within a claim ecosystem
- Use Tier A only, and prefer scribes or note-refinement tools with explicit workers-compensation workflows
- Apply double-review: the LLM draft is reviewed by you, and the final document should ideally be re-read by you after a gap (e.g. the next day) before signing

[REDFLAG: Never draft workers compensation documents in Tier C, even after "de-identification". Injury date + employer + clinical history is uniquely identifying within a single claim ecosystem.]

### Before / After

> **Before:**
> 45–60 minutes drafting a Certificate of Capacity or progress report, often after-hours, often rushed.

> **After (Tier A workflow):**
> Scribe generates a structured progress report from the consult. Clinician edits for accuracy of capacity statements, restrictions, and prognosis (15–20 minutes). Clinician re-reads next morning before submission. Net lift: 20–30 minutes, with — importantly — a more legible and structured document than a tired clinician would produce at 7pm.

### Medicolegal note

A statement of capacity or restriction that the LLM generated and you signed without careful review can land you in front of a tribunal explaining why the document says something different from what you intended. Every capacity statement, every restriction, every prognostic estimate has to be your considered clinical opinion — not the model's interpolation from training data.

If your jurisdiction requires a specific certificate format (e.g. NSW Certificate of Capacity), the AI tool's output is not the certificate. The certificate is the official form you sign.

[QUICK-CHECK: Your scribe generates a workers-comp progress report stating the patient has "full capacity for pre-injury duties within four weeks." You hadn't formed that opinion. Sign? | 1 | Yes — the scribe is trained on clinical patterns and the prognosis is plausible. | No — delete or rephrase. A prognosis the LLM volunteered is not your prognosis until you have actively endorsed it. | Yes, but add a caveat that the AI generated it. | rationale: Workers comp documents shape compensation eligibility and return-to-work timelines. Every prognostic statement must reflect your actual considered clinical opinion. Tribunals will not accept "the AI suggested it."]

---


[BREAK]

## 5. Discharge Summaries

**Tier:** A (within practice-management) or B (via integrated infrastructure)
**Risk flag:** Medium-High

### Context the LLM needs vs PII risk

A discharge summary requires significant context — initial presentation, course of treatment, response, current status, and ongoing recommendations. This context inherently includes PII. Tier C is not appropriate even with attempted de-identification, because the level of clinical detail required makes re-identification trivial.

Use:

- A Tier A scribe with discharge-summary templates
- A Tier B-integrated practice-management feature that respects Australian data residency
- A manual draft polished by the same Tier A tool you use for scribing

### Before / After

> **Before:**
> 15–20 minutes per discharge summary, often delayed until the end of the week, sometimes never completed for patients who simply stop attending.

> **After (Tier A integrated):**
> Discharge summary template auto-populates from the patient's recent notes within the practice-management system. Clinician reviews, adds a paragraph of clinical reasoning and ongoing recommendations, signs. 4–6 minutes.

### Medicolegal note

A discharge summary is often the only document the next clinician (GP, specialist, allied health provider) will read. Accuracy matters disproportionately. The summary should reflect the actual clinical course — if the LLM has compressed a 12-session episode of care into a generic narrative, you need to correct it.

The receiving clinician will make decisions based on this document. Treat it accordingly.

---


[BREAK]

## 6. Pre-appointment Intake Forms — LLM Drafts, Clinician Verifies

**Tier:** C acceptable (template generation, no patient data)
**Risk flag:** Low (when used for template generation only)

### Workflow

Intake form *templates* — the questions you ask new patients — can be drafted in Tier C with no PII at all. You describe the patient population, the conditions you treat, and what you need to know clinically; the LLM produces a structured intake form. You then customise, add your branding, and deploy via your practice-management system.

What is *not* a Tier C task: ingesting completed intake forms from real patients and asking the LLM to summarise them. That is PII and belongs in Tier A.

### Before / After

> **Before:**
> Clinic uses a generic intake form inherited from a previous practitioner, missing concussion-relevant items (PCSS, sport, mechanism of injury, prior concussions, current academic/work load).

> **After (Tier C template generation):**
> 30-minute session with a Tier C tool produces a tailored intake form for a concussion clinic, covering mechanism, PCSS items, prior concussions, current symptoms, medication, sleep, mood screen, work/academic context, return-to-play timeline. Clinician edits, branding added, deployed via online booking system.

### Medicolegal note

Intake forms collect personal information, including potentially sensitive health information under APP 3. The form itself isn't PII, but what patients submit through it is. Ensure the storage and access controls on the *completed* forms meet APP standards (Module 1) — not the template-generation step.

---


[BREAK]

## 7. Mental Health Care Plans — Highest-risk PII

**Tier:** A only — with double-verification
**Risk flag:** High

### Why mental health is the highest tier of caution

Mental health information has elevated sensitivity under the Privacy Act and APP 3 (sensitive information). The combination of psychiatric history, medication, risk assessment, and identifying details creates documents whose inappropriate disclosure can cause concrete harm — employment, insurance, family, and stigma consequences.

For mental health care plans (MHCPs) and any documentation containing risk assessment, suicidality screening, psychiatric diagnosis, or trauma history:

- Tier A only, with an explicit DPA covering sensitive health information
- Double-verification recommended: the AI-generated document is reviewed once at generation, then re-read after a gap before being signed and shared
- Risk-assessment content should ideally not be drafted by the LLM at all — it is your clinical judgement, recorded in your words

[REDFLAG: Never let an LLM draft the risk-assessment section of a mental health care plan. Risk content must be written in your own words from your own clinical impression — not the model's plausible-sounding default.]

[TRYTHIS: Write your standard AI-use attestation line and paste it into your practice-management system as a snippet. One keystroke, every consult — no more "I'll add it later".]

### Before / After

> **Before:**
> 25–35 minutes per MHCP, often after the patient has left, easy to omit components in a busy clinic.

> **After (Tier A workflow, with limits):**
> Scribe captures the consult. The administrative structure of the MHCP (presenting issues, goals, plan, review) is auto-populated. The clinician personally writes the risk-assessment section in their own words, edits the rest, and re-reads the next day before submission. Net lift: 10–15 minutes on administrative structure; the clinical content remains the clinician's.

### Medicolegal note

If a mental health plan contains an LLM-generated risk assessment that you signed without careful review, and the patient experiences harm, the document will be scrutinised. The risk-assessment section is not where you accept productivity lift at the expense of accuracy.

For complex presentations (suicidality, eating disorders, complex trauma, psychosis), consider drafting the entire document manually and using the LLM only for grammar and structure polish on the non-risk sections.

[QUICK-CHECK: Your scribe outputs a Mental Health Care Plan with a risk-assessment paragraph that reads plausibly but is MORE reassuring than your actual clinical impression. What do you do? | 1 | Sign as-is — it's a reasonable summary. | Rewrite the entire risk-assessment section in your own words. The LLM tone-matching a "standard" presentation is not appropriate when accuracy of clinical impression is the document's whole purpose. | Add a sentence saying "AI-generated; verified" and sign. | rationale: Mental Health Care Plans drive Medicare-funded sessions and inform downstream clinicians' risk decisions. A plausibly-worded but inaccurate risk statement is worse than no statement — it gives false reassurance.]

---


[BREAK]

## 8. The Review-and-Sign Workflow

[INFOGRAPHIC: review-and-sign]

Every AI-generated clinical document, regardless of tier or task, passes through the same final workflow:

1. **Generate** — the LLM produces a draft
2. **Read line-by-line** — not skim. Read every sentence as if you wrote it.
3. **Edit for accuracy** — remove invented detail, correct interpolations, add what's missing
4. **Edit for patient specificity** — convert generic recommendations to ones that fit this person
5. **Verify dates, dosages, numbers, names** — these are the highest-frequency error categories
6. **Attest explicitly** — your signature is your attestation that the document is accurate
7. **Retain audit trail** — keep enough record (e.g. tool name, date) that, if asked in five years, you can explain how the document was created

The attestation step is not metaphorical. AHPRA's documentation expectations (Module 1) make the clinician responsible for the record. The phrase "the AI generated it" is not a defence.

### A practical attestation line for your records

Some clinics now include a line in their note templates:

> *"This note was drafted with the assistance of [Tool name], reviewed and edited by the treating clinician, and reflects the treating clinician's clinical assessment and plan."*

Whether you include this line in the patient-facing document is a clinic-level decision. Whether you can describe your AI use clearly when asked is not optional.

> **Self-check (Review-and-sign):**
> You've used a scribe for 18 months. A complaint arrives about a note from six months ago — the patient says the note contains a detail that didn't happen. How do you respond?
> *(1) Pull the audit trail — your scribe should log when the note was generated and edited. (2) Compare against any contemporaneous evidence (appointment time, billing, related correspondence). (3) If the note is wrong, acknowledge it and correct the record per AHPRA expectations. (4) Review your review-and-sign workflow to understand how the error passed through. The scribe is a contributor, not the author — your signature owns the content.*

---


[BREAK]

## Key takeaways

> - **Every AI-generated clinical document is a draft until a human clinician reviews, edits, and attests to it.** AHPRA expectations do not soften because a model wrote the first version.
> - **De-identification first** for any Tier C use. If the input could re-identify the patient, it doesn't belong in Tier C.
> - **Scribes (Tier A) deliver the largest day-to-day lift** — typically 8–12 minutes per consult — but require both patient consent and careful review.
> - **SOAP refinement and treatment plans** can use Tier C with de-identified inputs; Tier A is preferred when integrated into your practice-management system.
> - **Workers compensation** documentation has elevated legal exposure — Tier A only, with double-review.
> - **Discharge summaries** require clinical context the LLM needs but PII risk excludes Tier C — use Tier A or integrated Tier B.
> - **Intake form templates** are fine in Tier C; completed intake forms (PII) are not.
> - **Mental health care plans** are the highest-risk PII category — Tier A only, with double-verification, and risk-assessment sections written in the clinician's own words.
> - **The review-and-sign workflow** is the universal final step: read line-by-line, edit, verify, attest, retain audit trail.
> - **The clinician owns the record.** The tool is a contributor.

Module 4 (forthcoming) covers patient communication, education content, and the consent conversations that make AI-supported documentation defensible and clinically appropriate.
