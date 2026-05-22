# Module 1 — Compliance and Medicolegal Framework

**Course:** AI in Clinical Practice
**Provider:** Concussion Education Australia (CEA)
**Author:** Zac Lewis — Osteopath (B.Clin.Sci., M.Ost.Med), AHPRA-registered (OST), Founder, Concussion Education Australia
**Last reviewed:** 2026-05-22
**Estimated reading time:** 40 minutes
**Module weight:** Load-bearing — every later module assumes you have read this one

---

> **Important — this module is education, not legal advice.** It summarises the publicly available regulatory position on AI use by Australian registered health practitioners as of 2026. It does not replace case-specific guidance from your indemnity carrier, professional association, or solicitor. Where a question turns on the specifics of your patient, practice, or jurisdiction, contact your medical defence organisation (MDO) before acting. If in doubt, the safer interpretation is the one this module recommends.

The use of large language models (LLMs), AI scribes, and AI-assisted decision-support tools in Australian healthcare has moved from novelty to baseline expectation in the space of roughly twenty-four months. Patients now reasonably assume that clinicians have access to these tools; medical defence organisations have published position statements; and the Australian Health Practitioner Regulation Agency (AHPRA) has issued formal guidance for registered practitioners.

[DEFINITION: AHPRA | The Australian Health Practitioner Regulation Agency — the national body that, with the fifteen National Boards, registers and regulates health practitioners in Australia. AHPRA does not certify, accredit, or endorse individual AI products.]

What has not changed is the underlying legal and ethical scaffolding: the clinician remains professionally responsible for every clinical decision, every patient record, and every disclosure of identifiable health information, regardless of whether an AI tool was involved.

[KEYPOINT: The clinician owns every clinical decision; the AI tool is an input to that decision, never the decision-maker.]

This module sets out that scaffolding. Read it carefully — every subsequent module of this course (clinical use cases, prompt design, documentation, scribe selection) assumes you are operating inside the framework described here.

---

## 1. AHPRA's 2025 AI Guidance for Registered Health Practitioners

In 2025, AHPRA and the National Boards published guidance titled *Meeting your professional obligations when using Artificial Intelligence in healthcare*. The guidance applies to all registered health practitioners across the fifteen National Boards, including medical practitioners, nurses, physiotherapists, osteopaths, psychologists, and Chinese medicine practitioners. The full guidance is available on the AHPRA website: <https://www.ahpra.gov.au/Resources/Artificial-Intelligence-in-healthcare.aspx>.

### What the guidance requires

The guidance does not prohibit AI use. It instead clarifies that existing professional obligations under each Board's Code of Conduct continue to apply when AI tools are used. In summary, registered practitioners are expected to:

- **Understand the tool.** You must understand, in general terms, how the AI tool works, its limitations, and the conditions under which it is reliable. "I didn't know it could do that" is not a defence.
- **Verify outputs.** AI outputs (clinical summaries, suggested diagnoses, draft letters, patient education material) must be reviewed and verified by the practitioner before they are acted on or released.
- **Maintain clinical responsibility.** The practitioner — not the vendor, not the model — is accountable for the clinical decision.
- **Protect patient privacy.** AI tools must be used in a manner consistent with the *Privacy Act 1988* (Cth) and the Australian Privacy Principles (see Section 2).
- **Be transparent with patients.** Where appropriate (and particularly for AI scribes that record consultations), patients should be informed that AI is being used.
- **Document AI use.** Use of AI in clinical decision-making or record-keeping should be documented in the patient's record.

[REDFLAG: "The AI said so" is never a defence. Signing an AI-generated note without reading it makes you — not the vendor — the falsifier of the record.]

### "Aligned with AHPRA's 2025 guidance" — wording matters

AHPRA does not certify, accredit, or endorse individual AI products. Any vendor or course (including this one) that describes itself as "AHPRA-certified" or "AHPRA-approved" is misusing AHPRA's name.

[REDFLAG: A vendor claiming "AHPRA-approved" or "AHPRA-certified" is a vendor red flag. AHPRA does not approve, certify, or endorse AI products — full stop.]

The accurate phrasing is *"aligned with AHPRA's 2025 AI guidance"* or *"designed to support compliance with AHPRA's AI guidance"*. If a vendor pitches their tool to you as AHPRA-approved, treat that as a red flag about the vendor's general claims-handling.

[KEYPOINT: AHPRA's guidance does not prohibit AI use. It requires you to understand the tool, verify outputs, retain clinical responsibility, protect privacy, be transparent with patients, and document AI use in the record.]

### Self-check

1. If your AI scribe produces a consultation note that contains an inaccurate medication dose, and you sign the note without reading it, who is professionally responsible — you, the vendor, or both?
2. Name three of the six expectations AHPRA places on practitioners who use AI tools.

---

## 2. Australian Privacy Principles Applied to LLM Workflows

[INFOGRAPHIC: data-flow]

The *Privacy Act 1988* (Cth) and its thirteen Australian Privacy Principles (APPs) apply to most healthcare providers in Australia regardless of size — the small-business exemption does not apply to organisations that provide a health service and hold health information (see s 6D(4)(b) of the Act).

[DEFINITION: APP | Australian Privacy Principles — the thirteen principles in Schedule 1 of the *Privacy Act 1988* (Cth) that govern how APP entities (including most health providers) handle personal information.]

[DEFINITION: OAIC | The Office of the Australian Information Commissioner — the federal regulator that enforces the *Privacy Act 1988*, publishes the APP Guidelines, and investigates privacy complaints and data breaches.]

The OAIC publishes the authoritative APP Guidelines: <https://www.oaic.gov.au/privacy/australian-privacy-principles>.

The OAIC has also published specific guidance on generative AI and privacy obligations: <https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/hands-on-guides/guidance-on-privacy-and-the-use-of-commercially-available-ai-products>.

Five APPs deserve particular attention when LLMs enter a clinical workflow.

### APP 1 — Open and transparent management of personal information

Your practice must have a current privacy policy that accurately describes how personal information is handled. Once an AI tool is introduced, the policy must reflect that fact: which AI tools are used, for what purposes, what categories of information they process, and whether information is disclosed overseas. A policy that predates your AI scribe is, by definition, out of date.

### APP 5 — Notification of collection

When you collect personal information from a patient, you must take reasonable steps to notify them of the matters listed in APP 5.2 — including the purposes of collection, the recipients of the information, and whether disclosure is likely to occur overseas. If an AI scribe will process the consultation audio in real time, that is a collection event the patient should be notified about. A consent form signed at registration that does not mention AI does not satisfy APP 5 once AI is introduced.

### APP 6 — Use or disclosure

APP 6 restricts how health information collected for one purpose may be used for another. Feeding identifiable consultation transcripts into a general-purpose LLM (for example, pasting them into a public chatbot to "summarise this") is a disclosure for a secondary purpose and almost certainly breaches APP 6 unless one of the narrow exceptions applies (consent, directly related secondary use the patient would reasonably expect, etc.).

### APP 8 — Cross-border disclosure of personal information

This is the principle that catches most clinicians using US-hosted LLMs.

Under APP 8, before disclosing personal information to an overseas recipient, the APP entity must take reasonable steps to ensure the overseas recipient does not breach the APPs in relation to that information. If you do not take those steps, you may be **accountable for the overseas recipient's acts as if you had done them yourself** (s 16C of the Act).

[DEFINITION: DPA | Data Processing Agreement (sometimes called a Data Processing Addendum) — a contract between you and an AI vendor that sets out how they handle your data, who their sub-processors are, where data is stored, and what happens in a breach. The DPA, not the marketing page, is the legal commitment.]

[KEYPOINT: APP 8 is the principle that catches US-hosted LLMs. Cross-border disclosure to overseas AI endpoints is regulated even where the vendor promises not to train on your inputs.]

Most major LLM providers — OpenAI, Anthropic, Google, Microsoft — host primary inference infrastructure in the United States. Even where an "Australian region" is offered, the contractual terms, sub-processors, or training-data flows may still involve US entities.

Before disclosing identifiable health information to any cloud AI service, you should:

- Confirm the data residency of the inference endpoint in the vendor's data processing addendum (DPA).
- Confirm that the vendor's terms exclude your inputs from being used to train models.
- Confirm whether the disclosure is captured by an APP 8.2 exception (for example, the patient has consented to the disclosure after being expressly informed of the consequences).

[INFOGRAPHIC: dpa-checklist]

### APP 11 — Security of personal information

You must take reasonable steps to protect personal information from misuse, interference, loss, unauthorised access, modification or disclosure. For AI workflows this includes: vendor security posture (SOC 2 Type II, ISO 27001), encryption in transit and at rest, access controls on the AI tool, audit logging, and a written incident response plan that explicitly contemplates AI-tool data breaches.

[TRYTHIS: This week, open your practice's current privacy policy and search it for the word "AI" or "artificial intelligence". If neither appears and you are using any AI tool, your APP 1 disclosure is out of date.]

### APP 6 vs APP 8 — at a glance

| | APP 6 — Use or Disclosure | APP 8 — Cross-Border Disclosure |
|---|---|---|
| **Trigger** | Using or disclosing health information for a secondary purpose | Disclosing personal information to an overseas recipient |
| **Default rule** | Prohibited unless one of the listed exceptions applies | Permitted only if reasonable steps are taken to ensure APP compliance by the overseas recipient |
| **Common exception** | Consent; directly related secondary use the patient would reasonably expect | Substantially similar overseas law; patient consent after express notification; required by law |
| **Liability if breached** | Direct breach by APP entity | The APP entity is treated as having done the act itself (s 16C) |
| **Relevance to LLMs** | Pasting transcripts into a chatbot for summarisation | Sending data to any US-hosted (or otherwise overseas) AI inference endpoint |

### Self-check

1. Your practice signs up to an AI scribe vendor whose inference servers are in Oregon, USA. The vendor's DPA says they will not train on your data. Under APP 8, have you discharged your obligation? What further steps would you take?
2. A locum at your clinic pastes a de-identified case summary into a free public LLM to draft a referral letter. Is APP 6 engaged? Is APP 8? Why or why not?

---

## 3. The TGA Therapeutic Goods Advertising Code

[DEFINITION: TGA | The Therapeutic Goods Administration — the federal regulator of medicines, medical devices, and biologicals in Australia under the *Therapeutic Goods Act 1989* (Cth). The TGA also enforces the Therapeutic Goods Advertising Code.]

The Therapeutic Goods Administration (TGA) regulates the advertising of therapeutic goods in Australia under the *Therapeutic Goods Act 1989* (Cth) and the *Therapeutic Goods Advertising Code 2021*. The Code is enforced strictly; the TGA publishes its compliance approach at <https://www.tga.gov.au/products/advertising-therapeutic-goods>.

### When AI-generated patient material becomes "therapeutic advertising"

The risk profile here is straightforward but easy to underestimate. If you use an LLM to draft patient-facing material — handouts, blog posts, social media captions, condition explainers, recovery protocols — and that material makes claims about specific therapeutic goods (medicines, medical devices, biologicals) or makes therapeutic claims about a service, the Code may apply.

Common LLM failure modes that can stray into Code breaches include:

- **Naming specific prescription medicines** in patient-facing content (advertising prescription-only medicines to the public is generally prohibited).
- **Generating testimonials** or "patient story" content (restrictions on testimonials in advertising of therapeutic goods).
- **Generating efficacy claims** that are not supported by evidence acceptable to the TGA.
- **Generating before/after style claims** that imply guaranteed therapeutic outcomes.
- **Comparative claims** between products or providers that the LLM has no basis to verify.

### The conservative interpretation

If you cannot personally verify and stand behind every therapeutic claim in a piece of AI-generated content, do not publish it. The fact that an LLM produced the wording does not transfer liability to the LLM vendor — the entity that publishes the content carries the regulatory risk.

[REDFLAG: Never publish an AI-generated patient-facing piece containing therapeutic claims without verifying each claim against an evidence source you would defend before the TGA. The LLM is not the publisher — you are.]

A practical rule: AI is acceptable as a *drafting assistant* for patient-facing material, but every clinical and therapeutic claim must be reviewed by a human clinician against an evidence source you would be willing to defend before the TGA.

[KEYPOINT: The publisher of a therapeutic claim — not the model that drafted it — carries the regulatory risk under the TGA Advertising Code.]

### Self-check

1. You ask an LLM to "write a 500-word blog post about migraine treatment options" and publish the output on your clinic site without edits. Which TGA risks have you accepted?
2. What is the difference between using an LLM to *draft* patient education material and using an LLM to *generate publishable* patient education material?

---

## 4. The OAIC De-identification Standard

[DEFINITION: PII | Personally Identifiable Information — any information, alone or in combination, that identifies or could reasonably identify an individual. Health information that retains contextual identifiers (rare diagnosis + small region + age) is still PII even after the name is removed.]

A common workaround clinicians reach for is: "I'll just strip the patient's name and date of birth, then it's fine to paste into a chatbot." This is usually wrong.

The OAIC's guidance on de-identification is published at <https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act>. The OAIC distinguishes between:

- **Pseudonymised data** — direct identifiers have been removed or replaced, but the data could be re-identified by reference to other information (including the rest of the patient record, or contextual knowledge).
- **De-identified data** — the risk of re-identification has been reduced to a level that is "very low" in the relevant context. Information is only de-identified when it is no longer about an identifiable individual or an individual who is reasonably identifiable.

Removing the name and date of birth is pseudonymisation, not de-identification.

[KEYPOINT: Stripping name and date of birth is pseudonymisation. True de-identification under OAIC guidance requires re-identification risk to be "very low" in context — which rare diagnoses, small regions, and free-text notes routinely defeat.]

[REDFLAG: Pasting "de-identified" PII into a consumer chatbot (Tier C) is the single most common AI compliance error. If the patient could be re-identified by anyone with access to the rest of the record, it is still PII.]

### The re-identification risk for rare diagnoses and small regions

Health data carries particularly high re-identification risk because:

- **Rare diagnoses act as quasi-identifiers.** A 34-year-old with a confirmed diagnosis of, say, a particular rare neurological condition presenting in a small regional town may be uniquely identifiable from those three data points alone, with no name required.
- **Postcode + age + sex + diagnosis** has been repeatedly shown in re-identification research to uniquely identify a high proportion of individuals in population-scale datasets.
- **Free-text clinical notes** often contain incidental identifiers (employer, occupation, "lives near the school", family relationships) that the clinician did not intend as identifiers.

For the purposes of LLM workflows, the conservative position is: **assume your data is pseudonymised, not de-identified, unless a formal de-identification process compliant with OAIC guidance has been applied.** Treat it as identifiable health information for APP purposes.

### Self-check

1. You remove a patient's name and date of birth from a case summary and paste it into a public LLM. Has the patient's information been de-identified under OAIC guidance? Why or why not?
2. A consultant pastes "32M, post-concussion syndrome, ex-AFL player, Geelong region, lawyer by profession" into a chatbot for differential diagnosis assistance. What is the re-identification risk?

---

## 5. The Notifiable Data Breaches (NDB) Scheme

[DEFINITION: NDB | The Notifiable Data Breaches scheme — Part IIIC of the *Privacy Act 1988* (introduced by the 2017 amendment), which requires APP entities to notify affected individuals and the OAIC of "eligible data breaches" likely to result in serious harm.]

The *Privacy Amendment (Notifiable Data Breaches) Act 2017* introduced Part IIIC of the *Privacy Act 1988*, which requires APP entities to notify affected individuals and the OAIC of "eligible data breaches". The OAIC's NDB guidance is at <https://www.oaic.gov.au/privacy/notifiable-data-breaches>.

### When LLM data leakage becomes notifiable

An "eligible data breach" occurs when:

1. There is unauthorised access to, unauthorised disclosure of, or loss of personal information held by the entity, **and**
2. A reasonable person would conclude that the access, disclosure or loss is likely to result in serious harm to one or more of the individuals to whom the information relates, **and**
3. The entity has not been able to prevent the likely risk of serious harm with remedial action.

LLM-related scenarios that may meet this threshold include:

- Identifiable health information pasted into a public LLM whose terms permit training on inputs.
- A misconfigured AI scribe that stores transcripts in an unsecured bucket.
- Credentials to an AI tool leaked via a phishing attack, allowing access to historical transcripts.
- A vendor breach where your AI tool provider notifies you their environment was compromised.

### The 30-day clock

Once an entity has reasonable grounds to *suspect* an eligible data breach has occurred, it must carry out a reasonable and expeditious assessment to decide whether the breach is in fact an eligible data breach. That assessment must be completed within **30 calendar days** (s 26WH of the Act). If the assessment confirms an eligible breach, notification to affected individuals and the OAIC must occur as soon as practicable.

[KEYPOINT: The 30-day NDB assessment clock starts at *suspicion*, not confirmation. Staff member tells you on Monday they think they pasted patient data into a chatbot — your assessment window starts Monday.]

The clock starts at *suspicion*, not at confirmation. If a staff member tells you on Monday they may have pasted patient information into a chatbot, your 30-day assessment window starts Monday.

[TRYTHIS: Write a one-page AI-incident response procedure for your practice. Include: who to notify internally, how to preserve evidence, how to assess whether the threshold is met, and when to notify the OAIC. Five minutes now saves you a panicked 30 days later.]

### Self-check

1. Your AI scribe vendor emails you on a Wednesday morning to say a sub-processor was compromised and they are investigating. When does the 30-day NDB assessment window start?
2. A clinician tells you they "think" they may have pasted a transcript into a public LLM but they are not sure. What is your obligation?

---

## 6. Indemnity Insurer Positions

Each of the major Australian medical defence organisations (MDOs) and indemnity insurers — including Avant, MIPS, MIGA, and Guild Insurance — has published guidance on AI use by their members. The positions evolve quickly. Rather than reproducing wording here (which may be out of date by the time you read it, and which we cannot quote verbatim with confidence), this module gives you the questions to put to your carrier directly.

### Questions to ask your indemnity carrier

- **Coverage.** Does my current policy cover claims arising from my use of AI tools in clinical practice? Are there exclusions for specific tool categories (e.g. autonomous diagnostic tools, AI scribes, generative AI)?
- **Vendor selection.** Do you publish or endorse a list of AI tools that are considered acceptable, or unacceptable, for use by members?
- **Disclosure to patients.** What is your published position on disclosing AI use to patients, and on consent for AI scribes?
- **Documentation.** What is your published expectation about how AI use should be documented in patient records?
- **Notification.** If I suspect AI-related data leakage or a clinical error attributable in part to an AI tool, when and how do you expect me to notify you?
- **Telehealth and AI together.** Are there additional requirements when AI tools are used in a telehealth context?

### Where to find current positions

- Avant: <https://www.avant.org.au> — search "artificial intelligence" in the Knowledge Centre.
- MIPS: <https://www.mips.com.au> — Member Resources.
- MIGA: <https://www.miga.com.au> — Risk Resources.
- Guild Insurance: <https://www.guildinsurance.com.au> — Risk Management resources for allied health.

Always pull the current version directly from your carrier; do not rely on second-hand summaries (including this one).

[KEYPOINT: Your indemnity carrier's current AI position is the document that matters in a claim. A course summary (including this one) is not a substitute — confirm the wording with your carrier directly.]

[TRYTHIS: Log into your MDO member portal today and search "artificial intelligence". Save the current position statement to your practice's policies folder, dated. Re-pull every six months.]

### Self-check

1. Why is it not safe to rely on a course or vendor's summary of your indemnity carrier's AI position?
2. Name three questions you should put to your indemnity carrier before introducing a new AI tool into your practice.

---

## 7. Documentation Requirement — Recording AI Use in the Clinical Record

[INFOGRAPHIC: documentation-do-dont]

AHPRA's 2025 guidance is clear that AI use should be transparent and traceable. In practice, this means the patient record itself must reflect when AI was used in producing or supporting the record.

### Recommended documentation patterns

Use one short, standard line in the consultation note. Three patterns cover most situations:

**AI scribe used to draft the consultation note:**

> *Consultation note drafted with the assistance of [Tool Name v.X], reviewed and verified by [Clinician Name] on [Date]. Patient notified of AI scribe use and verbal consent obtained at commencement of consultation.*

**AI used for clinical decision support (e.g. differential generation, guideline lookup):**

> *Differential diagnosis informed by [Tool Name] output on [Date]; output reviewed and clinical decision made by [Clinician Name] based on history, examination, and current clinical judgement.*

**AI used to draft a patient-facing letter or handout:**

> *Patient letter dated [Date] drafted with [Tool Name] and reviewed for clinical accuracy and appropriateness by [Clinician Name] prior to release.*

The discipline behind these lines is more important than the exact wording. The record must allow a future reviewer (peer, AHPRA notification, coronial inquiry) to see:

- That AI was used.
- Which tool was used.
- That a registered clinician reviewed the output.
- That consent was obtained where relevant.

### What not to do

- Do not allow AI-generated text into the record unattributed.
- Do not allow AI scribes to write directly into the medical record without a "draft" or "pending review" state — every note must be actively signed off.
- Do not document AI use only in a separate operational log; it should appear in the clinical record itself.

[KEYPOINT: AI use must appear in the clinical record itself, not only in a separate operations log. A future reviewer must be able to see which tool was used, by whom, and that the clinician verified the output.]

### Self-check

1. Your AI scribe writes a consultation note that you sign without alteration. What single line should appear in the note?
2. Why is it insufficient to log AI use only in a practice operations system, separate from the clinical record?

---

## 8. The Hierarchy of Responsibility

The most important sentence in this module is this: **the clinician owns the clinical decision; the LLM is a tool.**

This hierarchy is not aspirational. It is the legal and professional default position under every framework discussed in this module — AHPRA's guidance, the Privacy Act, the Therapeutic Goods Act, and every MDO position published to date.

### Practical consequences

- If an AI tool produces an inaccurate output and the clinician acts on it without verification, the clinician is the accountable party — not the vendor.
- "The AI said so" is not a clinical justification. The record should show *your* reasoning, with AI as an input to that reasoning where relevant.
- The clinician cannot delegate professional judgement to a tool, even a tool the regulator has not explicitly prohibited.
- Vendor disclaimers ("not a medical device", "for informational purposes only", "users should verify all outputs") shift very little legal risk to the user in practice; they are a vendor protection mechanism. The clinician's regulatory obligations are unchanged regardless of what the vendor's terms say.

### The inverse hierarchy is dangerous

Treating the LLM as the decision-maker and the clinician as the verifier is professionally unsafe. The cognitive bias here is well documented (automation bias): humans verifying machine output tend to under-detect errors compared to humans producing output from scratch. A clinician who treats the AI output as the default and themselves as the editor will, over time, miss errors that a clinician working in the reverse direction would catch.

[KEYPOINT: Automation bias is the failure mode to design against. You are the author with AI as an input — never the editor with AI as the author.]

### Self-check

1. An AI clinical decision support tool suggests a diagnosis your examination findings do not support. What governs your decision — the tool, your findings, or both?
2. Why is automation bias relevant to the clinician–AI relationship?

---

## 9. Patient Consent for AI Use

Consent in the AI context sits on a spectrum from *no specific consent required* through *general notification sufficient* to *express informed consent required*.

### The spectrum

**No specific consent reasonably required:**

- Using an LLM to look up a guideline summary unrelated to the specific patient in front of you.
- Using an LLM to draft an internal administrative document (rostering, a clinic policy) that contains no patient information.

**General notification typically sufficient (via privacy policy and APP 5 collection notice):**

- Using AI tools that process de-identified, aggregated, or operational data only.
- Using AI within your practice software where the vendor's tool is consistent with your published privacy policy.

**Express informed consent recommended or required:**

- **AI scribes that record the consultation** — recording the consultation is itself a separate consent issue under state recording laws, regardless of AI processing. Recording without consent may breach state surveillance devices legislation (e.g. *Surveillance Devices Act 1999* (Vic), *Surveillance Devices Act 2007* (NSW)).
- **Cross-border disclosure** under APP 8 where you are relying on the consent exception.
- **High-sensitivity contexts** — mental health, sexual health, child protection, family violence.
- **Where the patient is likely to object** if not asked — many patients have strong views on AI use in their healthcare and should be given the chance to express them.

[REDFLAG: Running an AI scribe without express patient consent may breach state surveillance devices legislation, irrespective of APP requirements. Recording is a separate consent issue from AI processing.]

[INFOGRAPHIC: consent-script]

### What counts as informed consent

For express informed consent to AI use, the patient should be told, in plain language:

- That an AI tool will be used, and what it does (e.g. "this device records and transcribes our conversation, and an AI tool drafts a summary that I review").
- Where the data is processed (in Australia, overseas).
- Who has access to the data.
- That the patient may decline AI use without affecting their care.
- That records remain available to them under standard health-record-access rights.

A signed form is not magic. A signed form that the patient has not understood is not informed consent. The conversation is the consent; the form is the evidence.

[KEYPOINT: The conversation is the consent; the signed form is the evidence. A form the patient hasn't understood is not informed consent, regardless of signature.]

### Self-check

1. A patient declines to have their consultation recorded by your AI scribe. What is your obligation?
2. What three specific matters should you cover in a verbal consent conversation before turning on an AI scribe?

---

## 10. High-Risk Populations — Stricter Rules Apply

Three categories of patient warrant a stricter approach to AI use. The conservative default for all three is: **do not use cloud-hosted, US-located, or training-on-input AI tools with these populations without specific carrier-confirmed approval.**

[REDFLAG: For minors, mental health, sexual health, and sensitive populations: no AI tool without contractual certainty about Australian data residency, no training on inputs, and end-to-end encryption. The default is stricter, not the same.]

### Minors

- Capacity to consent varies with age and maturity (Gillick competence).
- Parental consent does not automatically substitute for the child's view in adolescents.
- Special protections under state child protection legislation may apply if the consultation discusses abuse, neglect, or safety risks.
- AI scribes recording a paediatric consultation should be off by default and turned on only with positive consent.

### Mental health

- Therapeutic relationship and confidentiality are central to clinical effectiveness; perceived surveillance can be harmful.
- Disclosures during mental health consultations (suicidality, substance use, intimate-partner violence, self-harm) are particularly sensitive and may attract additional confidentiality obligations under state mental health legislation.
- The OAIC treats mental health information as "sensitive information" under the Privacy Act, attracting stricter handling requirements.
- A higher consent threshold and stricter vendor selection are warranted.

### Sensitive medical information

The Privacy Act defines "sensitive information" to include health information, but several sub-categories are treated with additional care:

- Sexual health and reproductive health information.
- Drug and alcohol information.
- Genetic and genomic information.
- Information relating to Aboriginal and Torres Strait Islander identity and health (which engages additional cultural safety obligations alongside privacy obligations).
- Information about communicable diseases that may attract notification obligations under state public health law.

For these categories, the default position should be: no AI tool that does not give you contractual certainty about Australian data residency, no training on inputs, and end-to-end encryption.

[TRYTHIS: List the high-risk populations you actually see. For each, write a one-line rule for AI use ("no scribe with paediatric consults under 16 without guardian + child consent", "no Tier C for any mental health content, ever"). Pin it next to your monitor.]

### Self-check

1. A 15-year-old patient comes in for a consultation regarding contraception. What additional considerations apply to AI scribe use in this consultation?
2. Why is mental health information treated more strictly than general health information under the APPs?

---

## Common Misconceptions

The following are the most common errors clinicians make when reasoning about AI compliance. Each one has appeared repeatedly in MDO advice lines and OAIC commentary.

1. **"If I remove the name and date of birth, the data is de-identified."** Wrong — that is pseudonymisation. De-identification requires the re-identification risk to be very low in context. Rare diagnoses, small regions, and free-text notes routinely defeat name-and-DOB removal.

2. **"The vendor's terms say they don't train on my data, so APP 8 is satisfied."** Wrong — APP 8 is about cross-border disclosure, not training. Disclosing identifiable information to a US-hosted endpoint engages APP 8 regardless of whether the vendor trains on it.

3. **"The AI tool is FDA-cleared in the US, so it must be fine to use here."** FDA clearance does not translate to TGA inclusion on the Australian Register of Therapeutic Goods (ARTG). It also tells you nothing about Australian privacy compliance.

4. **"My patient signed our general clinic consent form, so AI use is covered."** A general form that does not specifically describe AI use is unlikely to constitute informed consent for AI scribe recording, cross-border disclosure, or other AI-specific risks.

5. **"The vendor says the tool is AHPRA-approved."** AHPRA does not approve, certify, or endorse AI products. Any claim of AHPRA approval is a vendor red flag.

---

## Key Takeaways

- **Clinical responsibility does not transfer to the AI tool.** The clinician owns every clinical decision, regardless of which tool informed it.
- **Pseudonymisation is not de-identification.** Treat any data that retains contextual identifiers as identifiable health information for APP purposes.
- **APP 8 is the principle that catches US-hosted LLMs.** Cross-border disclosure to overseas AI endpoints is regulated even where the vendor promises not to train on inputs.
- **AI use must be documented in the clinical record.** A short, standard line per consultation, naming the tool and confirming clinician review, is the minimum.
- **Patient consent is context-dependent.** AI scribes that record the consultation require express informed consent; passive backend AI typically requires only updated privacy policy notification.
- **High-risk populations — minors, mental health, sensitive information — warrant stricter vendor selection and consent practices.**
- **Confirm your indemnity carrier's current position before deploying any AI tool.** Vendor and course summaries are not a substitute for direct carrier guidance.

---

## Citation index

- AHPRA — *Meeting your professional obligations when using Artificial Intelligence in healthcare* (2025): <https://www.ahpra.gov.au/Resources/Artificial-Intelligence-in-healthcare.aspx>
- OAIC — Australian Privacy Principles Guidelines: <https://www.oaic.gov.au/privacy/australian-privacy-principles>
- OAIC — Guidance on privacy and the use of commercially available AI products: <https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/hands-on-guides/guidance-on-privacy-and-the-use-of-commercially-available-ai-products>
- OAIC — De-identification and the Privacy Act: <https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/de-identification-and-the-privacy-act>
- OAIC — Notifiable Data Breaches scheme: <https://www.oaic.gov.au/privacy/notifiable-data-breaches>
- TGA — Advertising therapeutic goods: <https://www.tga.gov.au/products/advertising-therapeutic-goods>
- *Privacy Act 1988* (Cth): <https://www.legislation.gov.au/C2004A03712/latest>
- *Therapeutic Goods Act 1989* (Cth): <https://www.legislation.gov.au/C2004A03952/latest>

---

*End of Module 1. Module 2 (Clinical Use Cases) assumes everything in this module has been read and understood. Before continuing, complete the self-check questions and, if relevant to your practice, log into your indemnity carrier's member portal and pull their current AI position statement.*
