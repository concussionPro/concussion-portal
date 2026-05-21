# Module 2 — Tool Selection and Data Sovereignty

**Author:** Zac Lewis — Osteopath, AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22

*AI in Clinical Practice — Concussion Education Australia*

**Reading time:** ~20 minutes
**Prerequisite:** Module 1 (AHPRA, Privacy Act, the Australian Privacy Principles, and the TGA's position on clinical AI)

Module 1 set out the legal framework you operate under. This module is about applying it to a practical question every clinician now faces: *which AI tool should I use, for which task, and where does the data go?*

The decisions you make here are not abstract. Choosing the wrong tool for a clinical task can amount to a notifiable data breach under the Privacy Act, an APP 8 violation if data leaves Australia inappropriately, or an AHPRA-relevant conduct issue if patient information is handled carelessly. The good news: once you understand the three tiers below, most tool decisions become routine.

---

## 1. The Three Tiers of LLM Tools for Clinical Use

Not all large language model (LLM) tools are equivalent. They differ in where data is stored, who can see it, whether the vendor will sign a data-handling agreement, and whether the product was designed for healthcare in the first place. The cleanest way to think about this is a three-tier model.

### Tier A — Healthcare-purpose-built, Australian data residency

Tier A tools are built specifically for clinical use. They typically offer:

- Australian data residency (data stored and processed in Australian regions)
- A data processing agreement (DPA) or equivalent contract that names the clinician or practice as the data controller
- Audit logging suitable for AHPRA-relevant record-keeping
- Built-in workflows for consent capture and patient-facing disclosures
- Vendor accountability under Australian law (an Australian entity you can sue, complain about to the OAIC, or report to AHPRA)

Tier A tools are the only tier where you can routinely process identifiable patient information (PII) without de-identifying it first.

Representative tools as of May 2026:

| Tool | Focus | Australian entity |
|------|-------|-------------------|
| Heidi Health | AI scribe, clinical note generation | Yes (AU-headquartered) |
| Lyrebird Health | AI scribe, allied-health focused | Yes (AU-headquartered) |
| Halo Health | AI scribe, GP-focused | Yes (AU) |
| Microsoft Dragon Copilot | Speech-to-note, clinical workflows | Global vendor with AU enterprise contracts |

A tool being "Australian" in marketing copy is not enough. Tier A requires both Australian data residency *and* an agreement that puts the vendor on the hook for how they handle the data. See section 7 for how to verify this.

### Tier B — General-purpose enterprise LLMs in Australian regions

Tier B is enterprise-grade general AI infrastructure deployed in an Australian region, under a contract that gives you data-handling commitments roughly equivalent to a US Business Associate Agreement (BAA) under HIPAA. Australia has no direct HIPAA equivalent, but the contractual posture is comparable: the vendor agrees not to train on your data, to keep it in-region, and to give you breach notification.

Representative Tier B options as of May 2026:

| Service | Region | Underlying model |
|---------|--------|------------------|
| Azure OpenAI Service (Sydney) | australiaeast | GPT-4 family, GPT-5 |
| AWS Bedrock (Sydney) | ap-southeast-2 | Claude, Llama, Titan, Mistral |
| Anthropic Claude via Bedrock | ap-southeast-2 (AU residency) | Claude family |
| Google Vertex AI (Sydney) | australia-southeast1 | Gemini family |

Tier B is appropriate when you have an in-house developer, a vendor, or a practice-management system that has done the integration work for you. It is rarely something a solo clinician sets up alone. If your practice-management software offers "AI features powered by Azure Sydney" or similar, you are using Tier B under the hood.

Tier B can handle PII *if* the contract is in place and the data flow has been reviewed. Treat it as conditional, not default.

### Tier C — Consumer LLMs (de-identified inputs only — never PII)

Tier C is the consumer-facing chatbots most clinicians have used personally. They are powerful, cheap, fast, and absolutely not appropriate for identifiable patient data.

Representative Tier C tools:

- ChatGPT Free and ChatGPT Plus (chat.openai.com)
- Claude Free and Claude Pro (claude.ai)
- Gemini and Gemini Advanced (gemini.google.com)
- Perplexity (free and Pro)
- Microsoft Copilot consumer (the free public version, not enterprise)

These tools have several characteristics that disqualify them for PII:

- Data may be used to improve the model (opt-out exists in some, but is rarely default)
- Data residency is typically US-based; APP 8 cross-border disclosure issues apply
- There is no clinician-vendor contract — only a consumer terms-of-service you clicked through
- No audit trail meeting AHPRA record-keeping expectations

> **The refrain:** de-identification first. If a patient could be re-identified from what you are about to paste into Tier C, it does not belong there. This includes obvious identifiers (name, Medicare, DOB) and the less obvious ones — an unusual presentation, a small-town clinic, a date plus a postcode.

Tier C is genuinely useful — for generic drafting, learning, ideation, and patient-facing handouts written from a generic prompt. The rest of this module assumes you will use it that way.

> **Self-check (Tiers):**
> A colleague suggests pasting "the last six referral letters, with names removed" into ChatGPT Plus to generate a template. Which tier is this and what is the problem?
> *Answer at the end of this module.*

---

## 2. Decision Tree — Which Tier for Which Task

The following decision tree resolves about 90% of day-to-day questions.

**Start: Does the input or output contain identifiable patient information?**

- **No, and it never will** (generic handout, generic education content, drafting a clinic policy, generating a study aid, summarising a public paper) → **Tier C is fine.**
- **No, because the input is de-identified** (a case vignette stripped of name, DOB, Medicare, location, employer, unique presentation features) → **Tier C is acceptable for low-stakes tasks; Tier B if your practice has it; Tier A preferred for anything that will become part of a patient record.**
- **Yes** (specific named patient, a scribe transcript, a real clinical note, a workers compensation report, a mental health care plan, a discharge summary tied to a person) → **Tier A only.**

A few worked examples:

| Task | Tier |
|------|------|
| Drafting a patient handout on post-concussion sleep hygiene from a generic prompt | C |
| Polishing a SOAP note after manually de-identifying the input | C (acceptable) / A (preferred) |
| Live in-consult voice-to-note for an identified patient | A |
| Generating a discharge summary from the actual record | A |
| Drafting a workers compensation report tied to a named claim | A |
| Asking an LLM to explain a research paper on vestibular rehab | C |
| Drafting an email to a referrer about a specific patient | A |
| Building a reusable intake form template (no patient data) | C |
| Mental health care plan for an identified patient | A (with double-verification — see Module 3) |

> **Self-check (Decision tree):**
> You want to use an AI tool to summarise a 40-page workers compensation file for your own review before writing a report. The file contains the patient's name, employer, claim number, and clinical history. Which tier?
> *Tier A. The presence of name, employer, and claim number makes this PII, and the workers compensation context raises the medicolegal stakes (Module 3 covers this in detail).*

---

## 3. Australian Data Residency — What It Means and What It Doesn't

"Data residency" is one of the most misused terms in healthcare AI marketing. Understanding it precisely is part of professional competence now.

**What Australian data residency does mean:**

- Your data is stored at rest in Australian data centres
- Routine processing occurs in Australian regions
- The vendor commits contractually to keeping data in-region

**What it does not automatically mean:**

- That no human outside Australia will ever see the data (support staff, model developers, and security operations may have access from other jurisdictions — read the DPA)
- That training is not occurring on your data (separate question — must be contractually excluded)
- That the vendor's parent company isn't subject to foreign disclosure laws (e.g. US CLOUD Act applies to US-parented companies regardless of where data is stored)
- That metadata stays in-region (logs, telemetry, error reports may route elsewhere)
- That backups and disaster-recovery copies are also in-region

For APP 8 purposes (cross-border disclosure), what matters is whether personal information *is disclosed* to an overseas recipient, not just where the bytes happen to sit. A US-parented vendor with Sydney data centres may still constitute a cross-border disclosure if their support staff in California can read your data.

**How to verify residency claims:**

1. Ask the vendor in writing: "Where is data stored at rest, where is it processed, and which staff in which jurisdictions can access it?"
2. Request the data processing agreement (DPA) — read sections on sub-processors and international transfers
3. Check whether the vendor publishes a trust centre or compliance page (most reputable Tier A vendors do)
4. For Tier B, the cloud provider documents region behaviour explicitly — verify that the *specific service* you are using respects the region (not all features do)

---

## 4. Red-flag Tools to Avoid

Some tools should not enter a clinical environment at all, regardless of the de-identification of inputs.

**Hard avoid:**

- **ByteDance-owned products** (Doubao, certain TikTok-adjacent AI features) — data routing and Chinese-jurisdiction concerns make these inappropriate for any clinical context
- **Tools that route to or through Chinese mainland infrastructure** — this includes some "free" wrappers around DeepSeek, Qwen, and others when accessed via non-self-hosted endpoints. Self-hosting an open-weights Chinese model on Australian infrastructure is a separate question; the issue is the network path.
- **"Free unlimited" consumer products with opaque processing** — if there is no clear business model, the business model is your data
- **Browser extensions that "read your screen"** — these often exfiltrate clinical interface content to vendor servers without your awareness
- **AI features bolted onto consumer note-taking apps** (consumer Notion AI, consumer Evernote AI, etc.) when not on enterprise plans with explicit DPAs

**Caution:**

- Any tool whose privacy policy you cannot find in under one minute on their website
- Tools that require you to upload PII before showing you a DPA
- "Beta" or "research preview" clinical tools without an Australian regulatory pathway

---

## 5. Pricing Snapshot

> **As of May 2026 — verify current pricing before purchase. AI tool pricing changes frequently; all figures below are indicative.**

| Tool | Plan | Approximate cost (AUD) |
|------|------|------------------------|
| Heidi Health | Per-clinician monthly | ~$50–100/mo |
| Lyrebird Health | Per-clinician monthly | ~$50–100/mo |
| Halo Health | Per-clinician monthly | ~$60–120/mo |
| Microsoft Dragon Copilot | Enterprise, per-seat | Contact vendor; typically $100+/mo |
| ChatGPT Team | Per user, billed annually | ~$30/user/mo |
| ChatGPT Plus | Individual | ~$30/mo |
| Claude Pro | Individual | ~$20/mo (USD; AUD slightly higher) |
| Claude Team | Per user | ~$30/user/mo |
| Gemini Advanced | Individual | ~$30/mo |
| Azure OpenAI (Sydney) | Consumption-based | Per-token; budget $50–500/mo for typical solo use |
| AWS Bedrock (Sydney) | Consumption-based | Per-token; similar profile |

Tier A tools are more expensive per seat than Tier C consumer tools, but the comparison is misleading. You are paying for the contract, the data handling, and the workflow integration — not just the model.

---

## 6. Subscription Budgeting Framework

**Solo clinician (typical):**

- One Tier A scribe subscription (~$60–100/mo) — your workhorse for clinical documentation
- One Tier C consumer subscription (~$20–30/mo) — for generic drafting, learning, patient handouts (de-identified inputs only)
- Total: ~$80–130/mo

**Small clinic (3–10 clinicians):**

- Tier A scribe seats per clinician (~$60–100/mo each)
- One or two Tier C Team plans for non-clinical drafting (admin, marketing copy, policy drafts)
- Optional: a Tier B integration via your practice-management software (often bundled)

**Larger group / hospital department:**

- Enterprise Tier A contract (volume pricing)
- Enterprise Tier C (ChatGPT Enterprise or Claude for Enterprise) with DPAs
- Tier B infrastructure for any in-house tooling
- A named privacy officer who owns the DPAs and the APP 8 register

A common mistake is paying for three overlapping Tier C subscriptions personally while having no Tier A coverage for clinical work. Invert that: Tier A first, then a single Tier C.

> **Self-check (Budgeting):**
> A clinic of four allied-health practitioners is paying for four personal ChatGPT Plus accounts (~$120/mo total) but has no AI scribe. What's the simplest re-allocation?
> *Move to one Tier A scribe per clinician (~$240–400/mo) and one shared ChatGPT Team workspace (~$120/mo). Yes, this is more expensive — but the four personal Plus accounts are not covering the actual clinical risk. The current arrangement is paying for the wrong thing.*

---

## 7. How to Read a Data Processing Agreement — Three Questions

Most clinicians have never read a DPA. You don't need to read every clause. You need to find the answers to three specific questions.

### Question 1: Where is the data, and who can touch it?

Look for sections titled "Data storage," "Sub-processors," "International transfers," or "Hosting." You are looking for:

- Named data centres or regions (e.g. "Sydney, Australia (AWS ap-southeast-2)")
- A sub-processor list — and ideally a commitment to notify you of changes
- An explicit statement on cross-border access by support and engineering staff

If the DPA says only "we use industry-standard cloud infrastructure," that is not an answer. Push back or walk away.

### Question 2: Is my data used to train models?

Look for "Training," "Model improvement," "Customer data use," or similar. You want an explicit "we do not train on customer data" or, at minimum, an opt-out that is on by default for healthcare customers.

For Tier C tools, this clause typically does not exist or is buried in consumer settings. That's why Tier C is de-identified-only.

### Question 3: What happens when something goes wrong?

Look for "Breach notification," "Incident response," and "Liability." You want:

- Breach notification within a defined timeframe (24–72 hours is reasonable)
- The vendor's commitment to assist with your own notifiable-data-breach obligations under the Privacy Act (Module 1)
- A liability cap that isn't laughable relative to the harm a breach could cause

If a vendor will not tell you within 72 hours that your patients' data has been exposed, they are not a clinical vendor.

> **Self-check (DPA reading):**
> You're evaluating a new Australian-marketed AI scribe. Their website says "secure, private, Australian." Their DPA says: "Data may be processed by sub-processors in the United States and India for support purposes." What do you do?
> *Either negotiate sub-processor access restrictions for healthcare customers, or treat the tool as Tier B/C rather than Tier A. The marketing claim is not aligned with the contract. Document the discrepancy.*

---

## Answer to Tier self-check

A colleague pasting "the last six referral letters, with names removed" into ChatGPT Plus is using Tier C for what is almost certainly still PII. Removing the name is not de-identification — letters typically contain DOB, referral provider, specific clinical findings, sometimes addresses or workplaces, and combinations of attributes that re-identify trivially in a local catchment. This is a Tier A task. If the goal is a reusable template, the correct workflow is to write a fully fabricated example letter and use that as the Tier C input.

---

## Key takeaways

> - **Three tiers, one rule:** Tier A for PII, Tier B for contracted enterprise infrastructure, Tier C for de-identified or generic work only.
> - **De-identification first** is the refrain for any Tier C use. If a patient could be re-identified, it doesn't belong there.
> - **Australian data residency** is necessary but not sufficient — check who can access the data, not just where the bytes live.
> - **Red-flag vendors** (ByteDance, China-routed, opaque "free unlimited" products, screen-reading extensions) do not belong in clinical workflows.
> - **Pricing as of May 2026** is indicative only — verify before purchase. Budget Tier A first, Tier C second.
> - **Three DPA questions** every clinician should ask: where is the data, is it used for training, and what happens in a breach?
> - **The contract is the product.** A Tier A tool without a real DPA is a Tier C tool with better marketing.

Module 3 takes these tier decisions and applies them to specific documentation workflows — scribes, SOAP notes, discharge summaries, workers compensation reports, mental health care plans, and the review-and-sign workflow that every AI-generated clinical document must pass through.
