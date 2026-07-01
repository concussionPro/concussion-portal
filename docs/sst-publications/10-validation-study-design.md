# SST Trainer — validation study design (to validate the measurement wedge)

**Prepared:** 2026-06-29. **Purpose:** the measurement wedge ("we *measure* the individualised HRt, others *estimate* it") rests on one untested assumption: that a **home, self-administered digital graded test produces a valid HRt**. If home-HRt ≠ clinic-HRt, the advantage over Rhea's estimate shrinks — you'd be measuring, but measuring something with its own error. This document designs the study that converts the claim from *construct-plausible* to *validated*, and is honest about which regulatory gate it triggers.

> **Scope discipline:** this validates **measurement validity** (does the home test recover the same HRt as the clinic gold standard?), NOT **efficacy** (do patients recover faster?). Those are different studies; this is the one that backs the wedge.

---

## 1. The claim under test

> "A self-administered, home-based digital graded exertion test (SST Trainer `GuidedTest`) recovers a symptom-limited heart-rate threshold (HRt) in agreement with the clinician-supervised, in-clinic Buffalo Concussion Treadmill/Bike Test (the reference standard)."

This is a **concurrent-validity / method-comparison** study. The comparator is correct and named (clinic BCTT/BCBT; Leddy/Haider validation, PMC6492460). The closest remote prior work — the **MOVE protocol** (Teel 2023) — is *clinician-supervised* and targets *binary clearance*, so it does not pre-empt a *self-administered HRt-measurement* validation. That gap is the contribution.

---

## 2. Design

- **Type:** prospective method-comparison (concurrent validity) + test-retest reliability. Cross-over within-subject.
- **Population:** subacute sport-related concussion, exercise-intolerant, cleared by a clinician for graded exertion testing. Apply the existing red-flag / exclusion screen. **Exclude** anyone for whom provocative graded testing is contraindicated (the readiness screen already gates this).
- **Reference standard:** clinician-supervised in-clinic BCTT (treadmill) or BCBT (bike), HRt by the standard symptom-limited rule (≥3-pt VAS rise).
- **Index test:** SST Trainer home `GuidedTest`, self-administered, on the patient's own hardware (BLE strap preferred; wrist/camera recorded as lower-tier provenance — see §5).
- **Order:** counter-balanced, ≥48 h washout to avoid exertion carry-over. Same modality where possible (bike-vs-bike) to isolate administration setting from modality.

### Endpoints
- **Primary:** agreement in HRt (bpm) — **Bland-Altman** (bias + 95% limits of agreement) and **ICC(2,1)**. Pre-register an *a priori* acceptable LoA (e.g. ±10 bpm — tighter than Rhea's ±10–12 bpm age-estimate error, or the wedge doesn't clear).
- **Secondary:** concordance of termination classification (symptom-limited vs exhaustion-limited vs red-flag) — Cohen's κ; test-retest reliability of the home test (two home tests, ICC); usability (SUS); completion rate.
- **Safety (co-primary in spirit):** adverse-event capture during home graded testing — symptom spikes, falls, syncope, failure to self-terminate. This is the higher-risk action in the whole system (see §4).

### Sample size
For ICC with H0 = 0.5, H1 = 0.8, α 0.05, 80% power, 2 raters → ~35 evaluable; inflate for ~20% dropout → **target n ≈ 45**. Confirm with a statistician at protocol stage.

---

## 3. What gets published, and where

- **Venue:** JMIR mHealth and uHealth (or JMIR Formative Research for a first feasibility cut) — same family that published Rhea (PMC12007725) and the telehealth-concussion literature; the natural home for a digital-measurement validation. **Not** JOSS — JOSS is for the *software*, this is a *clinical validation*.
- **Sequencing:** the **tools paper** (doc 02) can publish *now* as a verification-by-design/methods paper that explicitly scopes home-test validity as future work and *cites this protocol as registered/ongoing*. The **validation paper** follows when data are in. This lets you publish the architecture without waiting on the trial, while being honest that validity is pending.
- **Registration:** prospectively register (ANZCTR) before enrolment — required for credible method-comparison and expected by JMIR.

---

## 4. The safety reality (do not gloss this)

Exerting a concussion patient **to symptom threshold, unsupervised, at home** is a materially higher-risk action than delivering a sub-threshold prescription. The fail-closed engine guarantees *signal integrity*, **not patient safety during provocative testing** — different problem. The literature precedent (MOVE) kept a **clinician live on video** precisely for this reason; telehealth consensus says exertion testing "cannot be performed remotely."

**Design implication — clinician-gate the graded test specifically:**
- The **first / threshold-finding** graded test should be **clinician-administered or clinician-supervised** (in-clinic, or live telehealth à la MOVE), **not** patient-initiated in the wild.
- Home `GuidedTest` re-tests should be **gated** to patients a clinician has reviewed and explicitly enabled, with a hard red-flag stop and a "stop and contact your clinician" rule on any red-flag termination.
- This is a **product change**, not just a paper caveat: the home graded test needs a clinician-enable flag, distinct from the sub-threshold *training* sessions (which are genuinely safe to self-run). Surface this in onboarding: *training = self-run; threshold testing = clinician-enabled.*

---

## 5. Provenance tiers feed the validation too

Each HRt point should record its source (electrical chest strap > optical wrist > camera-PPG) and signal-quality. The validation should **stratify** agreement by source tier — it is likely that strap-sourced home-HRt agrees with clinic BCTT far better than camera-PPG-sourced. That stratification is itself a finding (it tells clinicians which home sources are trustworthy for HRt) and is consistent with the integrity-not-accuracy philosophy.

---

## 6. HREC posture — honest, not the QA cover

**This study does NOT get the QA / service-evaluation cover.** The retrospective routine-care analysis (doc 06) can sit under QA because data arise from ordinary care analysed afterward. **This is different:** it is *prospective, purpose-built data collection for research* — graded exertion administered specifically to generate comparison data. That is research by the NHMRC definition and **triggers a full HREC review** (likely Bellberry or a university HREC). Do not attempt to QA-frame a prospective validation; the cover dies the moment collection is purpose-built. Budget the HREC timeline into the publication plan.

---

## 7. One-line summary

Publish the **tools/architecture paper now** (verification-by-design, validity scoped as future work, this protocol cited as registered); run the **HREC-gated concurrent-validity study** (home `GuidedTest` vs clinic BCTT, Bland-Altman/ICC, stratified by provenance tier, with the threshold test clinician-gated for safety); publish the **validation paper** in JMIR when data are in. That sequence makes "we measure, they estimate" a *validated* claim instead of a *plausible* one — which is the only version of the wedge that survives a reviewer who knows the field.
