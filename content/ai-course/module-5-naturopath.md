# Module 5b — Naturopathy & Integrative Medicine

**Author:** Zac Lewis — Osteopath, AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22

**Reading time:** ~7 minutes
**Prerequisites:** Modules 1–4

---

## Scope and special warning

Of all the specialties in this course, naturopathy carries the sharpest TGA exposure when using AI. LLMs are trained on global content that includes therapeutic claims that are *illegal* in Australia. Anything the model produces about a supplement, herb, or nutrient must be reviewed against the TGA's prohibited/restricted representation rules before it goes to a patient.

[REDFLAG: LLMs default to therapeutic claim language ("treats", "cures", "boosts immunity") that breaches the TGA Advertising Code. Every supplement-related output must be reviewed sentence-by-sentence for claim language before it leaves the clinic.]

[KEYPOINT: Educational, not prescriptive. Every supplement, herb, and nutrient output is framed as "has been studied in the context of" — never as a treatment recommendation.]

The rule of this sub-module: **educational, not prescriptive.** Every prompt below enforces this framing.

The de-identification preamble from Module 3 is assumed throughout.

---

## 1. Supplement information sheets (educational only)

**Hard rule:** No therapeutic claims. The forbidden verbs are *treats, cures, prevents, heals, fixes, eliminates, boosts (immunity / metabolism / energy)*. The allowed framings are *"has been studied in the context of," "is traditionally used for," "patients sometimes ask about," "the research literature has examined."*

**Prompt:**

> [De-id preamble]
> Draft a one-page educational information sheet about [SUPPLEMENT NAME] for a patient who has asked about it.
> CRITICAL CONSTRAINTS:
> – Australian context. TGA-compliant language only.
> – No therapeutic claims. Do NOT use the words: treats, cures, prevents, heals, fixes, eliminates, boosts.
> – Use neutral framing: "has been studied for," "is traditionally used in [tradition]," "the research literature has examined."
> – Include: what it is (food sources, chemistry in plain English), where it shows up in the research literature (neutrally described), typical dosage ranges seen in studies, who should speak with a doctor first (pregnancy, breastfeeding, kidney/liver disease, anticoagulants, other relevant interactions).
> – End with a clear statement: "This sheet is for educational purposes only. It is not a prescription or treatment recommendation. Please discuss with your treating clinician before starting any new supplement."
> – Sign-off: "Reviewed by: [CLINICIAN NAME], [DATE]."

**Review checklist:**
- Zero therapeutic claims. Re-read every sentence with the question "is this a claim?"
- Pregnancy / breastfeeding / paediatric warnings present where relevant.
- Drug-interaction warnings present where relevant.
- The educational-only framing is unambiguous.
- No invented studies or citations. LLMs hallucinate references — strip anything you cannot verify on PubMed.

---

## 2. Diet plan templates

Diet plans are lower-risk than supplements but still attract TGA and AHPRA scrutiny if they make therapeutic claims.

**Prompt:**

> [De-id preamble]
> Draft a 7-day Mediterranean-style eating plan template for a 48-year-old adult interested in general dietary patterns. Australian food context (use Australian product names and seasonal produce). Format: breakfast, lunch, dinner, two snacks per day. Include a shopping list grouped by category.
> CONSTRAINTS:
> – No therapeutic claims (no "lowers cholesterol," "prevents diabetes," "fights inflammation").
> – Neutral framing only ("the Mediterranean pattern is one well-studied eating pattern").
> – Note any common allergens clearly.
> – Add a line: "This is a general template and may need adjustment based on individual health needs. Please discuss with your clinician or an Accredited Practising Dietitian for individualised advice."

**Review checklist:**
- Foods are realistic and available in Australia.
- No therapeutic claims.
- Allergens flagged.
- Referral to APD for individualised advice is present (important scope-of-practice signal).

---

## 3. Herb-drug interaction lookups

**Highest-risk use case in this sub-module.** LLMs are confident-sounding but unreliable on interaction data. Use them as a starting point, never as a source of truth.

[REDFLAG: Never act on an LLM-generated herb-drug interaction without verifying against AMH, eTG, Stockley's, or the Natural Medicines Database. The LLM will hallucinate plausible-sounding mechanisms and citations with full confidence.]

[KEYPOINT: If you would not stake your registration on the answer, do not act on it. Interaction lookups are starting points, never conclusions.]

**Mandatory verification sources (check at least one):**
- Australian Medicines Handbook (AMH)
- Therapeutic Guidelines (eTG)
- Natural Medicines Database (subscription)
- LiverTox (NIH, for hepatotoxicity)
- Memorial Sloan Kettering "About Herbs" database
- Stockley's Herbal Medicines Interactions (text)

**Prompt:**

> [De-id preamble]
> Generate an initial scan for potential interactions between [HERB] and the following medications: [MED LIST]. For each potential interaction, state:
> – The mechanism (CYP enzyme, P-glycoprotein, pharmacodynamic, additive effect).
> – The strength of evidence (case report / small study / well-established).
> – The clinical significance (theoretical / minor / clinically relevant / contraindicated).
> – At least one named source for me to verify against.
> Conclude with: "This output is a starting point only. Verify against an authoritative source (AMH, eTG, Natural Medicines Database, Stockley's) before clinical use."

**Review checklist (mandatory before any clinical action):**
- Every interaction has been verified against an authoritative source.
- Hallucinated sources are removed (LLMs invent plausible-sounding references — search for the citation before trusting it).
- The patient's actual medication list is correct (down to dose and formulation).
- You have documented the verification step in the patient record.

If you would not stake your registration on the answer, do not act on it.

[TRYTHIS: Bookmark AMH and eTG in your browser today. Set up a saved-search shortcut. When a patient asks "is this herb okay with my medication?", you should be in the authoritative source inside 30 seconds.]

---

## 4. Lifestyle intervention plans

Sleep, stress, movement, nature exposure — the bread-and-butter of integrative practice.

**Prompt:**

> [De-id preamble]
> Draft a 4-week lifestyle intervention plan for a 42-year-old patient reporting fatigue and poor sleep (no red flags, GP has cleared organic causes). Goals: improve sleep quality, reduce evening cortisol, support daytime energy.
> Include weekly focus areas:
> – Week 1: sleep hygiene foundations.
> – Week 2: morning light and movement.
> – Week 3: stress and nervous system regulation.
> – Week 4: integration and habit consolidation.
> For each week: 3 specific actions, expected time commitment, and one journaling prompt.
> CONSTRAINTS:
> – No therapeutic claims.
> – No supplement recommendations in this plan.
> – Frame as "lifestyle practices that have been studied in the context of sleep and stress."
> – Add: "If symptoms persist or worsen, please return for review or see your GP."

**Review checklist:**
- Actions are realistic for the patient's life context.
- No supplement creep (this is a lifestyle plan, supplements live in their own sheet).
- Safety-net language is present.
- No claims about specific health outcomes.

---

## 5. Patient compliance scripts

Naturopathy patients often have multi-component plans (diet, lifestyle, supplements). Adherence is the limiting factor.

**Prompt:**

> [De-id preamble]
> Draft four short check-in messages (SMS or email, under 200 words each) for a patient three weeks into a 12-week integrative health program. Tone: warm, non-judgmental, curiosity-driven. Each message should ask one open question and gently re-orient the patient to one element of the plan (sleep, diet, movement, mindset).
> CONSTRAINTS:
> – No therapeutic claims.
> – No mention of specific supplements by name.
> – Tone: supportive, never guilt-inducing.
> – Sign-off as [CLINIC NAME].

**Review checklist:**
- Tone matches your clinic voice.
- No claims.
- Opt-out language included if required.
- Open questions, not yes/no.

---

## Three-prompt starter kit

**Prompt 1 — Educational supplement sheet:**

> [De-id preamble]
> Draft an educational-only information sheet on [supplement]. TGA-compliant. No therapeutic claims (no treats/cures/prevents/heals/boosts). Use neutral "has been studied for" framing. Include food sources, dosage ranges from research, who should consult a clinician first. End with the educational-only disclaimer.

**Prompt 2 — Interaction scan (starting point only):**

> [De-id preamble]
> Generate an initial interaction scan for [herb/nutrient] with the following medications: [list]. Include mechanism, evidence strength, clinical significance, and named source. End with the "verify against authoritative source" disclaimer.

**Prompt 3 — Lifestyle plan:**

> [De-id preamble]
> Draft a [4 / 8 / 12]-week lifestyle plan for [patient summary]. Goals: [goals]. Weekly focus areas: [list]. Three actions per week, time commitment, journaling prompt. No supplement recommendations. No therapeutic claims. Safety-net language at the end.

---

## Key takeaways

- The TGA does not allow therapeutic claims on supplements without specific listings/registrations. Your information sheets are educational, not prescriptive.
- LLMs cheerfully produce non-compliant claim language by default. You must enforce TGA-compliant framing in every prompt and verify every output.
- Interaction lookups are a starting point, not a clinical answer. Always verify against AMH, eTG, or equivalent.
- Citations from LLMs are unreliable. Strip anything you cannot verify on PubMed or in a textbook.
- Lifestyle plans are lower risk than supplement sheets but still require neutral framing.

## Common mistakes to avoid in naturopathy

- Letting therapeutic verbs ("treats," "cures," "prevents," "boosts") slip into supplement sheets.
- Trusting LLM-generated drug interaction data without verification against an authoritative source.
- Accepting hallucinated references — LLMs invent plausible-looking PubMed IDs and author names.
- Crossing scope into prescribing for conditions you are not registered to manage.
- Bundling supplements into lifestyle plans without separate educational sheets.
- Forgetting the educational-only disclaimer.
- Using the LLM's default "evidence-based" framing without checking the actual evidence base.
