# ⚠️ OPEN ITEM (highest consequence): self-guided tier & SaMD line

**Status:** DEFERRED, NOT SOLVED. This is the item that decides *what the product is allowed to be* — above the trajectory build, above the patent, above the HREC. It is parked here on purpose so it does not disappear into a "we settled everything" glow. **Requires a formal TGA classification opinion before any general-public launch.**

**Prepared:** 2026-06-29, from verified TGA + competitive searches (see below).

---

## The product-architecture commitment already made

The validation design (doc 10 §4) committed: **the provocative graded test is clinician-gated.** That is now a *binding architecture line that must hold everywhere* — paper, app, trajectory view, and any future self-guided tier. If any surface ever lets an ungated user trigger a graded test, it (a) contradicts the safety design and (b) walks into the SaMD problem. The regulatory line and the safety line are the **same line**, and it maps onto the existing `self-guided` vs `clinic-code` modes in `WelcomeMode.tsx`.

## Two tiers, split at the risk line

### Tier B — free, self-guided, general public (the App Store funnel)
**Allowed (verified to sit in the TGA consumer health/wellness + health-management exclusions):**
- Concussion education (generic, published).
- **Raw** symptom *logging* — record-keeping, NOT interpretation.
- Generic sub-threshold activity guidance using **published population defaults**, never a measured personal threshold.
- **Static** signposting: "if you have these signs, see a clinician" — not personalised triage.
- Route-to-clinician / find-a-CEA-clinician (closes the funnel).

**Forbidden in Tier B (any one tips it into regulated diagnostic/therapeutic SaMD):**
- ❌ The graded exertion test (provocative; the fenced feature).
- ❌ A measured personal HRt.
- ❌ Individualised exercise *prescription*.
- ❌ **Interpreted red-flag screening** that outputs a concussion-likelihood / severity / urgency determination. **THIS IS THE SINGLE MOST DANGEROUS FEATURE** — it converts education into diagnostic SaMD. Keep red-flags as static education, never an interpreted output.

### Tier A — clinic-code, clinician-gated (the core product)
The full thing: graded test → measured HRt → progression → trajectory.
**Framing that matters — rehab DELIVERY, not prescribing.** SST Trainer was always a tool that *delivers an established, clinician-selected protocol* (Leddy SSTAE: train at 80–90% of measured HRt), not one that independently prescribes a dose. It executes a published, consensus-endorsed formula on a measured input; the clinician selects the protocol, oversees it, and can override the band. That materially helps the CDSS criterion (c) — it does **not** replace clinical judgement — and it is the accurate description of the product, not a regulatory dress-up. (Earlier internal note characterised this as "auto-prescribes"; that overstated it and is corrected here.)

**The genuine residual exposure is the PROVOCATIVE GRADED TEST, not the band formula.** Measuring HRt by exercising a possibly-concussed patient toward symptom threshold is the consequential, SaMD-relevant, safety-relevant action — and it is independent of how the band is computed. So:
- The band-delivery framing (delivery, not prescribing) addresses the *"replaces clinical judgement"* criterion.
- It does **not** dissolve the *graded-test* question — that stays clinician-gated for safety regardless, and is the thing the TGA opinion most needs to classify.

**Mitigations to design in (and put to the TGA opinion):**
- Keep the clinician the **decision-maker**: software *presents* the established-protocol band; the clinician *approves/overrides* it. Frame as delivery of a selected protocol, never "the app decided the dose."
- Argue the HR source (consumer chest strap) may not be "another medical device" under the Act (criterion b) — but do not rely on this; let counsel test it.
- Conservative Intended Use statement (already in doc 02 §8); no treat/diagnose/clear claims.

### The EP-scope reframe (the cleanest framing — adopt this)

The intended primary user is a **registered Exercise Physiologist (ESSA-accredited)** operating within scope, working from a diagnosis already made by a GP/sports physician and a clearance for exercise rehabilitation. In that context the graded test is **not a diagnostic provocative test** ("does this person have a concussion?" — already answered) but a **rehabilitation baseline measure** ("at what intensity can this already-diagnosed, exercise-cleared patient safely train *now*?"). Same physical procedure; different clinical meaning and scope context — and the regulatory/scope question follows the context, not the procedure.

This makes CDSS criterion (c) — *does not replace clinical judgement* — genuinely true rather than asserted:
- The **EP** holds the judgement: (a) is this patient appropriate for graded exercise rehab, and (b) interpret the HRt trajectory and adjust the program. The **software** does neither — it executes the published Leddy protocol's arithmetic on a measured input and logs the curve.
- The clinician gate stops being a liability workaround and becomes the **natural EP workflow**: the EP enables the graded test for a patient they have assessed as appropriate. **ESSA endorsement makes the EP the intended, licensed, scoped user** — which is the framing that makes the TGA question cleanest.

**Honest bound that survives the reframe:** the physical provocation (exercising to symptom threshold) is identical regardless of who supervises and why; the *safety* consideration does not disappear. What the EP frame settles is **who is responsible for the clinical judgement** about appropriateness — clearly the EP, not the software. Consistency note: keep "BCTT-derived HRt" as the *method/provenance* in the papers, but frame its *use* as an EP rehab-baseline functional assessment, not a diagnostic/return-to-play clearance test.

## Verified evidence base

**TGA (sources):** [software exclusions](https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence-ai/overview/software-based-medical-device-exclusions); [excluded-software interpretation PDF](https://www.tga.gov.au/sites/default/files/2024-07/excluded-software.pdf); [exempt SaMD](https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence-ai/overview/exempt-software-medical-device); [CDSS regulation](https://www.tga.gov.au/resources/guidance/understanding-clinical-decision-support-system-software-regulation); [CDSS exemption PDF](https://www.tga.gov.au/sites/default/files/2022-08/exemption-for-certain-clinical-decision-support-software.pdf).

**Competitive (sources):** ungated self-guided concussion *rehab* ships ([VOR Eye Rehab](https://eyerehab.app/), [CU Anschutz NMT app](https://news.cuanschutz.edu/news-stories/can-an-app-help-improve-recovery-from-a-concussion)); self-administered graded *exertion testing* is fenced off — every instance keeps a clinician in the loop ([Sway](https://www.swaymedical.com/articles/buffalo-concussion-treadmill-test), [MOVE](https://pubmed.ncbi.nlm.nih.gov/37212272/), R2Play). DTC graded exertion exists in *adjacent* domains (POTS Levine, Elite HRV, Visible long-COVID) — so the concussion fence is deliberate, not technical.

## The leverage (why free is correct)

Free = **funnel, not revenue.** The App Store app is customer-acquisition for the clinician network and the paid referral directory: distribution + triage/routing into CEA clinicians + brand authority + a consented *non-provocative* dataset + the patient-facing companion that unlocks Tier A via a clinic code. Revenue stays in the clinician engagements and the directory, not the app.

## The question to put to the TGA classifier (EP-scope framing)

Don't ask the broad "is a concussion app a medical device?" — ask the narrow, scoped questions below. The EP frame makes them far more defensible than the original "auto-prescribes provocative testing" shape.

**Background to state up front:** SST Trainer is a between-visit exercise-rehabilitation *delivery* tool. Its primary intended user is a **registered, ESSA-accredited Exercise Physiologist** working within scope, from a diagnosis and exercise-clearance already made by a GP/sports physician. The software **does not diagnose, does not determine medical clearance, and does not make return-to-play decisions.** It (i) administers a standardised graded exercise-tolerance assessment that *measures* an individual heart-rate threshold, and (ii) executes a published, consensus-endorsed protocol (Leddy 80–90%-of-HRt) on that measured value to present a training band the EP approves, overrides, and progresses. All clinical judgement — patient appropriateness, trajectory interpretation, progression, clearance — rests with the EP.

**The supervision model is clinician-*directed*, not clinician-*present*.** As in all between-visit rehabilitation, the EP exercises clinical judgement at the point of **direction** — assessing the patient as appropriate and instructing them on the program — after which the patient **implements it at home, unsupervised**, between visits, and the EP reviews at the next contact. The clinician's decision and direction are the control point; real-time presence during execution is not, and never has been, the requirement. The software's built-in stop rules (symptom-provocation threshold, in-session symptom-rise stop, red-flag halt-and-refer) are the guardrails that operate in the clinician's absence, standing in for real-time observation — they do not replace the clinician's appropriateness decision, they execute the limits the clinician directed.

**Q1 (the core tool — EP-directed, clinic-code).** Where does an EP-*directed*, between-visit exercise-rehabilitation tool sit under the software-based-medical-device framework, given that it (a) is used under the direction of a registered clinician within scope, (b) measures exercise tolerance as a *rehabilitation baseline* (not a diagnostic or return-to-play determination), (c) executes a published protocol the clinician approves and can override rather than generating an independent recommendation, (d) makes no diagnosis/treatment/clearance claim, and (e) is **clinician-directed but patient-implemented** — the clinician assesses appropriateness and directs the program; the patient implements it at home unsupervised, as in routine between-visit rehabilitation, with software-enforced stop rules as the guardrails? Specifically: does it fall within an **exclusion**, the **CDSS exemption**, or full regulation — does the **clinician-as-decision-maker** structure satisfy the "does not replace clinical judgement" criterion, and does **clinician-directed-but-not-present** home implementation remain within that structure (as routine prescribed home rehab does)?
> **Criterion (b) — the load-bearing sub-question, with our position stated, not left to inference.** The software is **hardware-agnostic**: it accepts heart rate from *any* BLE source the patient already owns — a consumer fitness tracker, a chest strap, or camera-PPG — and does **not** require, assume, or rely on a specific device. None of these are TGA-listed medical devices; they are consumer wellness products. The tool therefore does **not** process a signal from a *listed medical device* — it processes consumer-grade HR input and applies its fail-closed signal-quality verification to assess trustworthiness before clinical use. We note this is fact-specific (a Polar H10 is CE-marked as a medical device in the EU but is not TGA-listed in Australia; an Apple Watch has a TGA-listed ECG feature while its HR function sits differently), so we ask the classifier to confirm that **consumer-wearable HR input with no listed-device dependency keeps criterion (b) satisfied.** If criterion (b) is read to fail on a particular device, the hardware-agnostic design means the tool never depends on that device.

**Q2 (the free patient-facing companion — Tier B).** Separately: a free, patient-facing companion that provides concussion *education*, *raw* symptom logging, generic published-default activity information, and *static* signposting to a clinician — with **no** graded test, **no** measured personal threshold, **no** individualised prescription, and **no** interpreted red-flag/triage output — does this sit within the consumer-health/wellness and health-management exclusions, and which single function would tip it into regulation?

**Honest framing to retain in the request:** the physical provocation in the graded test is a clinical-safety matter the EP owns; we are asking about the *software's* classification, not seeking to offload the clinical-judgement responsibility onto the tool.

## Action owner

**Zac:** obtain the formal TGA classification opinion above (Q1 + Q2) **before any general-public / Tier B launch.** Q1 (EP-directed core) is the lighter, more defensible question and gates clinician-network rollout; Q2 gates the public funnel. Until the opinion lands, Tier B ships only the "allowed" list, and the graded test never leaves clinic-code (EP-directed) mode — where "directed" means a clinician has assessed the patient and enabled the test, not that a clinician is present during it.
