# Target venues and publication strategy for the SST Trainer package

> ## ⛔ CORRECTION 2026-07-08 — Paper 1 does NOT go to medRxiv
> medRxiv's submission scope **explicitly excludes "Narrative reviews"** ("declined
> immediately; all decisions are final"). Paper 1 (the clinical review) is a
> narrative review → **submit it DIRECTLY to _Journal of Concussion_** (SAGE, OA;
> accepts narrative reviews), fallback _Frontiers_. For a fast citable preprint
> DOI use **OSF Preprints or Preprints.org** (they accept narrative reviews) —
> never medRxiv/bioRxiv. The "medRxiv first" step below is superseded for Paper 1.
> Papers 2 (JMIR mHealth) and 3 (protocols.io → JMIR Res Protoc) are unaffected.

Concussion Education Australia (CEA)
Draft v1.0 · 2026

This document recommends a target venue for each of the three papers, explains the rationale and submission requirements for each, and sets out a sequencing strategy. The strategy is deliberately **publish-around-HREC, authority-over-revenue**: none of the three papers requires an ethics-gated prospective trial, so all three can ship on the strength of the existing literature plus the described build/framework. Any outcome/effectiveness study on routine-care data is **explicitly out of scope for this package** — it is gated on primary data and ethics, and per the CEA publications strategy it stays off the target list until it is real (see §5.4). The venue choices below are reordered around **fastest credible public output first** (an OSF Preprints / Preprints.org preprint and a protocols.io deposit go live in days), with indexed-journal acceptance following.

---

> ## ⚠️ CRITICAL — read before building the data capture
>
> **This does NOT gate the three-paper package (those papers use no patient data). It is a build/consent-design caution that governs `06-data-consent-copy.md` and any future outcome study — treat it as a build gate, not a footnote.**
>
> The "publish-around-HREC / negligible-risk" route is valid **only for genuinely RETROSPECTIVE analysis**: data that *arose from routine clinical care* and is analysed after the fact. That is the lawful basis for the low/negligible-risk review any future (out-of-scope) outcome study would rely on.
>
> **The moment the app is built to collect data FOR THE PURPOSE OF research** — i.e. *prospectively, by design*, with research consent gathered up front via clinic or in-app terms — a reviewer or an HREC may classify it as **PROSPECTIVE research requiring FULL HREC review and prospective consent**. If that happens, you have walked straight into the ethics gate the entire publish-around-HREC strategy was built to avoid. The `06-data-consent-copy.md` in-app research opt-in and the clinic data-contribution agreement are exactly the design features that could trip this classification.
>
> **ACTION — gate the build on this.** *Before* building the in-app research-data capture, put this exact question to a research-ethics advisor (an HREC officer or a university ethics contact):
>
> > *"Is purpose-built in-app data collection, consented via clinic terms, classified as RETROSPECTIVE or PROSPECTIVE for HREC purposes?"*
>
> The answer gates the build. Do not write the research-capture flow until you have it.
>
> **Practical mitigation if it comes back "prospective"** — do not pretend the risk away. Either:
> - **(a)** keep collection strictly for *clinical care* (no research-purpose design, no up-front research consent baked into the build) and analyse it retrospectively later; or
> - **(b)** accept HREC review for a prospective registry and build to that standard from the start.
>
> Any future outcome study (out of scope for this package — see §5.4) would qualify for low/negligible-risk review **only if the data capture is not itself designed as prospective research.** Resolve this question before building the in-app capture — independently of the three papers, which do not touch patient data at all.

---

## 1. Paper 1 — Clinical review (`01-clinical-review.md`)

**"Sub-symptom-threshold aerobic exercise for concussion: from the Buffalo test to digital, clinician-supervised delivery."**

**Speed strategy: preprint NOW, journal in parallel.**

### Step 1 (do immediately): post a preprint on *OSF Preprints* / *Preprints.org*

- **Why:** OSF Preprints / Preprints.org make the review **public and citable within days** (a screening pass, not peer review), with a permanent DOI. This is the fastest possible authority signal — it stakes the claim, is indexable, and can be cited in the other two papers and in clinic-facing material *now*, before any journal decision lands. It does not preclude subsequent journal publication. **NOT medRxiv/bioRxiv — their scope explicitly excludes narrative reviews (Paper 1 is a narrative review), so they will decline it at screening.**
- **Requirements:** Health-sciences preprint; author + affiliation + ORCID; declared conflict of interest (the author built the tool — disclose prominently); no ethics approval needed (no human data). Free.

### Step 2 (in parallel): submit to *Journal of Concussion* (SAGE, open access)

- **Why:** Of the credible indexed venues, this is the **fastest** path to a peer-reviewed, indexed home for a single-author narrative review with a product disclosure: open access (maximises clinician reach, the authority goal), remit explicitly spans clinical management and translational commentary, **no code gating**, and a lower barrier than a top-tier sports-medicine journal. Preprint makes it public immediately; journal acceptance follows and upgrades the citation.
- **Requirements:** Narrative review format, ~2,500–4,000 words, structured abstract, full reference list (Vancouver), declared conflict of interest, no ethics approval needed. Article processing charge applies (budget for open-access fee).

### Fallback: *Frontiers in Neurology* (Neurotrauma section) or *Frontiers in Sports and Active Living*

- **Why:** Reputable, indexed, open access, receptive to review + perspective articles bridging evidence and digital-health implementation. Hold as the fallback if *Journal of Concussion* declines.
- **Requirements:** Review or Perspective article type; structured; APC applies; clear novelty statement (here: the implementation thesis, not new physiology).

### Skip BJSM unless a pre-submission enquiry comes back hot

- **Why:** BJSM is the field-defining venue (it published the Amsterdam consensus) and would carry maximum authority, but it is highly selective, prefers commissioned or systematic reviews over single-author narrative reviews, and a strong product disclosure raises the bar — all of which is *slow*. Speed is the priority here. **Send a one-week pre-submission enquiry to an editor; only pursue BJSM if it comes back genuinely enthusiastic, and only with a systematic reframing.** Otherwise do not spend time on it.
- **Requirements:** Pre-submission enquiry first; tight word/reference limits; PRISMA expected if framed as systematic.

**Verdict:** Preprint on **OSF Preprints / Preprints.org now** (public in days; NOT medRxiv — excludes narrative reviews) + submit to **Journal of Concussion** in parallel (fastest credible indexed venue, no code gating). Hold *Frontiers* as fallback. Skip BJSM unless a one-week pre-submission enquiry comes back hot.

---

## 2. Paper 2 — Tools/methods paper (`02-tools-paper.md`)

**"SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised SSTAE."**

### Primary recommendation: *JMIR mHealth and uHealth* — **NOT JOSS**

- **Why:** *JMIR mHealth and uHealth* is the leading indexed venue for mobile-health tool descriptions and "development and implementation" papers, with a clinical-informatics readership that reaches the intended adopters. It accepts a software/methods description **without requiring efficacy data** (framed as a development paper), and — decisively for both **speed** and **IP** — it is a **write-and-submit** paper. The design rationale, the BLE Heart Rate Service conformance, and the no-fabricated-signal safety property are exactly its selling points, and none of them requires releasing source.
- **Why not JOSS (state this plainly):** JOSS would require **open-sourcing the code, full documentation, and surviving an open-ended GitHub peer review by community engineers** — a multi-week engineering project *before you can even submit*, on top of the commercial/COI tension of open-sourcing a product the business depends on. For a solo founder optimising for speed and IP, that cost is not justified by the marginal authority gain. **JMIR wins decisively here.**
- **Requirements:** Development/implementation paper type; structured abstract; emphasis on design rationale, safety, and standards-conformance; APC applies; no human-subjects data needed for a development paper, but any pilot usage data would need ethics cover (see the CRITICAL HREC warning above).

### Fallback (only if a code-release venue is ever wanted): *SoftwareX* (Elsevier) or *JOSS*

- **Why:** Both are reputable original-software venues that confer a DOI but **require code availability** (JOSS the most demanding: open-source licence, public repo + issue tracker, documented test suite, open GitHub review). Reserve either only if the open-source decision is ever reversed; neither is the speed/IP-optimal path today.

**Verdict:** Target **JMIR mHealth and uHealth** as a closed-source development/implementation paper — fastest, no code gating, protects the IP. **Do not target JOSS**: the open-sourcing, documentation, and open-review burden is a multi-week project at odds with both speed and the commercial position.

---

## 3. Paper 3 — Protocol/framework paper (`03-protocol-framework.md`)

**"A standardised clinician-supervised digital workflow for SSTAE after concussion."**

**Speed strategy: deposit the protocol NOW, journal in parallel.** This is the highest-leverage output in the whole package — the step-by-step protocol is what clinics actually adopt, and adoption (authority + reach) is the payoff in its own right.

### Step 1 (do immediately): deposit on *protocols.io*

- **Why:** protocols.io gives the standardised workflow a **living, versioned, citable (DOI) home within days**, with minimal gatekeeping. It is the **fastest real-world output of any of the three papers** and the highest-leverage one: it is the operational, step-by-step protocol clinics follow, and it drives clinical adoption directly. Free-to-low-cost and updatable as the workflow evolves.
- **Requirements:** Structured steps; versioning; DOI on publication; minimal gatekeeping. No ethics approval to *describe* a workflow built on existing evidence.

### Step 2 (in parallel): submit to *JMIR Research Protocols* (JMIR Res Protoc)

- **Why:** Purpose-built for protocols and described workflows/frameworks, including digital-health delivery models, *without* requiring completed outcomes. The active-rehab-vs-pacing framing and the five-stage workflow fit its remit; indexed, open access, reaches the digital-health + clinical-informatics audience. The protocols.io deposit makes the protocol usable and citable immediately; the JMIR paper adds the peer-reviewed narrative authority.
- **Requirements:** Protocol/framework article type; structured; clear methods/workflow specification; conflict-of-interest disclosure; APC applies. No ethics approval required to *describe* a clinical workflow built on existing evidence (as opposed to running a trial of it).

### Reserve: *BMJ Open* or *Frontiers* (Methods/Protocol article)

- **Why:** *BMJ Open* carries strong general-medical authority and publishes protocols, but leans toward protocols for *planned studies* and may expect a trial design — so it is a weaker fit for this framework paper. *Frontiers* Methods articles are a viable home if JMIR declines. (Neither is held for any outcome study — that is out of scope; see §5.4.)

**Verdict:** Deposit the executable step-by-step on **protocols.io immediately** (fastest, highest-leverage, drives adoption) + submit the narrative framework to **JMIR Research Protocols** in parallel; hold **BMJ Open / Frontiers** only as a fallback if JMIR declines. No outcome-study venue is part of this package (§5.4).

---

## 4. Supporting artefacts (not standalone papers)

- **`05-evidence-backtest.md`** — best published as a **supplementary table** to Paper 1 (clinical review) and reused as the evidence appendix in Paper 3. Not a standalone submission. (If a citable standalone artefact is ever wanted, deposit it on **Zenodo** as a versioned report for a real DOI — a genuine output, unlike a trial gated on primary data.)
- **`06-data-consent-copy.md`** — operational copy, not a publication; governs the clinical-care data flow and consent. Should be referenced (not reproduced) in Papers 2 and 3 as the consent/governance basis. (It is *not* a research-capture design — keeping it clinical-care-only is what avoids tripping the prospective-research classification; see the ⚠️ CRITICAL note.)

---

## 5. Sequencing and strategy

**Principle: publish-around-HREC, authority-over-revenue — fastest public output first.** All three papers ship without an ethics-gated trial and make **no** effectiveness claim. They establish CEA as the authority on *delivering* SSTAE and drive clinic adoption. **No outcome/dataset study is part of this package** (see §5.4 — it is excluded as primary-data/ethics-gated vapor). The only ethics question that bites at build time is not to accidentally design the in-app data capture *as prospective research* (see the ⚠️ CRITICAL HREC note at the top — that is a build/consent-design caution, not a dependency of these three papers).

**Recommended order, reordered around getting something public in *days* rather than months:**

1. **Get two outputs public immediately (days, not months).** In parallel:
   - **Paper 1 → OSF Preprints / Preprints.org preprint** (NOT medRxiv — narrative reviews excluded). Public and citable within days; stakes the authority claim and supplies the citation base the other two lean on.
   - **Paper 3 → protocols.io deposit.** The fastest *real-world* output and the highest-leverage one: it is what clinics actually adopt, and adoption is the goal in its own right. Deposit the executable step-by-step first.
2. **Submit the indexed-journal versions in parallel.** Paper 1 → *Journal of Concussion* (fastest credible indexed venue, no code gating); Paper 3 → *JMIR Research Protocols*. These upgrade the preprint/deposit to peer-reviewed authority without holding up the public output.
3. **Paper 2 (tools paper) → *JMIR mHealth and uHealth*.** A write-and-submit development paper; it benefits from citing Papers 1 and 3 as the clinical/workflow context. **Do not route this to JOSS** — the open-sourcing + open-review burden is a multi-week project at odds with speed and the IP position.
4. **Out of scope for this package: any outcome/effectiveness study.** A retrospective (or prospective) observational analysis of accumulated routine-care data is **explicitly excluded from this publication package** — it is gated on primary data *and* an ethics pathway, i.e. exactly the "vapor" the CEA publications strategy keeps off the list until it is real. Do **not** carry it as a target, a deliverable, or a promised output in any paper, pitch, or the summary table. It is noted here only so the boundary is explicit: the three papers above make **no** effectiveness claim and do **not** depend on such a study existing. If and when de-identified routine-care data has genuinely accumulated *and* an ethics classification has been obtained, it can be scoped as its own separate effort — but nothing in this package is contingent on it.

**Cross-cutting requirements to prepare once:**

- A consistent **conflict-of-interest statement** (author developed and has a commercial interest in the tool) for all three.
- An **ORCID** and a stable author affiliation block.
- The **research-ethics classification answer** (retrospective vs prospective — see the ⚠️ CRITICAL warning) *before* building the in-app research capture.
- A consistent **non-device regulatory positioning**: the tool is a clinician-directed rehab-assistance + monitoring/data instrument under the clinical-decision-support carve-out (FDA 21st Century Cures §3060; TGA CDS exclusion) — *not* a diagnostic/treatment medical device. Carried through Papers 1–3 and the consent copy; a SaMD scoping opinion to be obtained before launch.
- A reusable **reference library** (the shared citation set across all three — Leddy 2010/2011/2013/2018/2019/2021, Patricios 2023, Haider 2019, Willer 2019).
- Honest, uniform **scope language**: "delivery and verification, not efficacy" appears in every paper's limitations.

---

## 6. Summary table

| Paper | Fastest public output | Indexed journal (parallel) | Ethics needed? | APC? |
|---|---|---|---|---|
| 1 — Clinical review | **OSF Preprints / Preprints.org** (days; NOT medRxiv) | Journal of Concussion (OA); fallback Frontiers; skip BJSM unless enquiry hot | No | Preprint: no · Journal: yes |
| 2 — Tools/methods | (none — write-and-submit) | **JMIR mHealth and uHealth** (NOT JOSS) | No | Yes |
| 3 — Protocol/framework | **protocols.io deposit** (days) | JMIR Research Protocols | No | Protocols.io minimal · JMIR: yes |
| ~~Future — outcome/retrospective study~~ | **OUT OF SCOPE for this package** — excluded as gated on primary data + ethics (see §5.4); not a target, deliverable, or promised output | — | Yes (if ever pursued) | — |
