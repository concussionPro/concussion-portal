# Target venues and publication strategy for the SST Trainer package

Concussion Education Australia (CEA)
Draft v1.0 · 2026

This document recommends a target venue for each of the three papers, explains the rationale and submission requirements for each, and sets out a sequencing strategy. The strategy is deliberately **publish-around-HREC, authority-over-revenue**: none of the three papers requires an ethics-gated prospective trial, so all three can ship on the strength of the existing literature plus the described build/framework. A future *retrospective observational study* on de-identified routine-care data is flagged as the (low-burden) path to genuine outcome evidence and the only piece that needs an ethics pathway.

---

## 1. Paper 1 — Clinical review (`01-clinical-review.md`)

**"Sub-symptom-threshold aerobic exercise for concussion: from the Buffalo test to digital, clinician-supervised delivery."**

### Primary recommendation: *Journal of Concussion* (SAGE, open access)

- **Why:** A narrative/clinical review that synthesises the rest→active paradigm shift and argues a delivery thesis is squarely in scope for a dedicated, open-access concussion journal. Open access maximises clinician reach (the authority goal), and the journal's remit explicitly spans clinical management and translational commentary. Lower barrier than a top-tier sports-medicine journal for a single-author narrative review with a product disclosure.
- **Requirements:** Narrative review format, ~2,500–4,000 words, structured abstract, full reference list (Vancouver), declared conflict of interest (the author built the tool — disclose prominently), no ethics approval needed (no human data). Article processing charge applies (budget for open-access fee).

### Strong alternative: *Frontiers in Neurology* (Neurotrauma section) or *Frontiers in Sports and Active Living*

- **Why:** Reputable, indexed, open access, receptive to review + perspective articles bridging evidence and digital-health implementation. The "Sports Neurology" / "Neurotrauma" sections fit. Rigorous but predictable review process.
- **Requirements:** Review or Perspective article type; structured; APC applies; clear novelty statement (here: the implementation thesis, not new physiology).

### Reach option (higher risk/reward): *British Journal of Sports Medicine* (BJSM)

- **Why:** The field-defining venue (it published the Amsterdam consensus). A BJSM review or "Consensus/clinical" piece would carry maximum authority. But BJSM is highly selective, prefers commissioned or systematic reviews over single-author narrative reviews, and a strong product disclosure raises the bar. Consider only if the review is reframed as a rigorous systematic-style synthesis, or pitched first to an editor.
- **Requirements:** Pre-submission enquiry advisable; tight word/reference limits; PRISMA expected if framed as systematic.

**Verdict:** Submit to *Journal of Concussion* first (best fit + open access + reach for clinicians); hold *Frontiers* as the fallback; treat BJSM as aspirational and only with a systematic reframing.

---

## 2. Paper 2 — Tools/methods paper (`02-tools-paper.md`)

**"SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised SSTAE."**

### Primary recommendation: *Journal of Open Source Software* (JOSS)

- **Why:** JOSS publishes short papers about research software with a clear *Statement of Need* — exactly the shape of this paper. The clinical engine (`lib/sst-trainer/protocol.ts`) is a pure-function **core library** with deterministic, unit-testable logic, which matters because JOSS treats many web-only tools as out of scope *unless they are built around and expose a core library* (which this is) and demonstrate rigorous domain modelling and testing. JOSS confers a citable DOI, is free (no APC), and rewards exactly the verification-by-design rigour this paper claims.
- **Requirements / how to qualify:**
  - Open-source the repository (or at minimum the `lib/sst-trainer/` engine + tests) under an OSI licence, in a public version-controlled repo with an issue tracker.
  - A `paper.md` with a **Statement of Need**, plus author/affiliation/ORCID and a BibTeX `paper.bib`.
  - **Substantial scholarly effort** and a **test suite** with documented invocation, automated where feasible, plus contribution/community guidelines and clear installation/usage docs.
  - Review is open, on GitHub, against published criteria (functionality, tests, documentation).
  - **Caveat to manage:** JOSS editors may question the scope of a clinically-framed web app. Mitigate by submitting the *engine library* as the unit of publication (HRt detection, prescription, progression, the BLE parser, the PPG estimator) with the web app as the demonstration front-end — i.e. lead with the core library, exactly as the paper is written.

### Strong alternative: *JMIR mHealth and uHealth*

- **Why:** If open-sourcing the engine is undesirable, *JMIR mHealth and uHealth* is the leading venue for mobile-health tool descriptions and "development and design" papers, with a clinical-informatics readership that reaches the intended adopters. It accepts a software/methods description without requiring efficacy data (framed as a development paper), and is indexed and well-regarded in digital health.
- **Requirements:** Development/formative paper type; structured abstract; emphasis on design rationale, safety, and standards-conformance (the BLE Heart Rate Service conformance and the no-fabricated-signal property are selling points); APC applies; no human-subjects data needed for a development paper, but any pilot usage data would need ethics cover.

### Secondary alternative: *SoftwareX* (Elsevier)

- **Why:** Another reputable original-software venue with a DOI and a code-availability requirement; less domain-specific than JMIR but accepts cross-disciplinary research software. A reasonable third option if JOSS scope is contested and open-sourcing is acceptable.

**Verdict:** Target **JOSS** if willing to open-source the engine (best authority-per-effort, free, rigour-rewarding); otherwise **JMIR mHealth and uHealth** as a closed-source development paper. These are mutually exclusive primary choices — pick based on the open-source decision.

---

## 3. Paper 3 — Protocol/framework paper (`03-protocol-framework.md`)

**"A standardised clinician-supervised digital workflow for SSTAE after concussion."**

### Primary recommendation: *JMIR Research Protocols* (JMIR Res Protoc)

- **Why:** Purpose-built for protocols and described workflows/frameworks, including digital-health delivery models, *without* requiring completed outcomes. The active-rehab-vs-pacing framing and the five-stage workflow fit its remit, and it reaches a digital-health + clinical-informatics audience. Indexed, open access.
- **Requirements:** Protocol/framework article type; structured; clear methods/workflow specification; conflict-of-interest disclosure; APC applies. No ethics approval required to *describe* a clinical workflow built on existing evidence (as opposed to running a trial of it).

### Strong, low-friction alternative: *protocols.io*

- **Why:** A living, versioned, citable (DOI) home for the standardised workflow itself — ideal for the operational, step-by-step protocol that clinics actually follow. Fast, free-to-low-cost, and updatable as the workflow evolves. Best used *alongside* a journal paper: publish the narrative framework in JMIR Res Protoc and deposit the executable step-by-step on protocols.io, cross-referenced.
- **Requirements:** Structured steps; versioning; optional DOI on publication; minimal gatekeeping.

### Secondary alternative: *BMJ Open* (study-protocol/framework) or *Frontiers* (Methods/Protocol article)

- **Why:** *BMJ Open* carries strong general-medical authority and publishes protocols, but leans toward protocols for *planned studies* and may expect a trial design; better suited later, to register the retrospective study. *Frontiers* Methods articles are a viable home if JMIR is declined.

**Verdict:** Submit the framework to **JMIR Research Protocols**; deposit the executable step-by-step on **protocols.io** for clinic adoption and citability; reserve **BMJ Open** for the future retrospective-study protocol.

---

## 4. Supporting artefacts (not standalone papers)

- **`05-evidence-backtest.md`** — best published as a **supplementary table** to Paper 1 (clinical review) and reused as the evidence appendix in Paper 3. Not a standalone submission.
- **`06-data-consent-copy.md`** — operational copy, not a publication; governs the data flow that feeds the future retrospective study. Should be referenced (not reproduced) in Papers 2 and 3 as the consent/governance basis.

---

## 5. Sequencing and strategy

**Principle: publish-around-HREC, authority-over-revenue.** All three papers ship without an ethics-gated trial. They establish CEA as the authority on *delivering* SSTAE, drive clinic adoption, and seed the dataset — and only the eventual outcome study touches an ethics committee.

**Recommended order:**

1. **Paper 1 (clinical review) first.** It is the authority anchor and is fastest to ship (no code release, no product gating). It frames the problem and earns the citation base the other two lean on. → *Journal of Concussion*.
2. **Paper 3 (protocol/framework) second**, immediately after or in parallel. It converts the review's thesis into an adoptable workflow and is what clinics actually use. Pairing it with a protocols.io deposit accelerates real-world uptake (which feeds the dataset). → *JMIR Research Protocols* + protocols.io.
3. **Paper 2 (tools paper) third.** It is the most effort (open-sourcing the engine or preparing a JMIR development paper) and benefits from citing Papers 1 and 3 as the clinical/workflow context. Decide the open-source question first; that single decision selects JOSS vs JMIR mHealth. → *JOSS* (preferred) or *JMIR mHealth*.
4. **Future: retrospective observational study.** Once routine clinical use has accumulated de-identified data (serial HRt trajectories, adherence, time-to-clearance, flare rates), design a retrospective observational analysis. This is the *only* component needing an ethics pathway — typically a **low/negligible-risk review** for de-identified, already-collected data (governed by the consent and clinic-contribution terms in `06-data-consent-copy.md` and consistent with the Australian Privacy Principles). Register/protocolise it (BMJ Open or JMIR Res Protoc) and report it (BJSM, *Journal of Concussion*, or JMIR). This is the path to a genuine effectiveness claim — *not* something any of the first three papers assert.

**Cross-cutting requirements to prepare once:**

- A consistent **conflict-of-interest statement** (author developed and has a commercial interest in the tool) for all three.
- An **ORCID** and a stable author affiliation block.
- A public repository + OSI licence decision (gates JOSS).
- A reusable **reference library** (the shared citation set across all three — Leddy 2010/2011/2013/2018/2019/2021, Patricios 2023, Haider 2019, Willer 2019).
- Honest, uniform **scope language**: "delivery and verification, not efficacy" appears in every paper's limitations.

---

## 6. Summary table

| Paper | Primary venue | Strong alternative | Ethics needed? | APC? |
|---|---|---|---|---|
| 1 — Clinical review | Journal of Concussion (OA) | Frontiers in Neurology; (reach: BJSM) | No | Yes |
| 2 — Tools/methods | JOSS (if open-source) | JMIR mHealth and uHealth; SoftwareX | No | JOSS: no · JMIR: yes |
| 3 — Protocol/framework | JMIR Research Protocols + protocols.io | BMJ Open; Frontiers Methods | No | Yes (protocols.io minimal) |
| Future — Retrospective study | BJSM / Journal of Concussion / JMIR | — | Yes (low/neg-risk, de-identified) | Varies |
