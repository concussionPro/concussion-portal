# SST Trainer — prior-art memo for patent counsel (pre-conversion)

**Audience:** the patent attorney handling the SST Trainer provisional, ahead of any complete/PCT conversion.
**Prepared by:** Zac Lewis (founder, Concussion Education Australia), 2026-06-29.

> **This is a flag for counsel, not legal advice.** It is a founder's good-faith collation of public prior art and a lay read of claim exposure, prepared so counsel can scope a formal search and narrow the claims before the provisional converts. None of the conclusions here substitute for a professional opinion. Do not rely on this as a freedom-to-operate or patentability determination.

---

## 1. Why this memo exists

The SST Trainer provisional should not convert with broad "digital/wearable heart-rate-threshold exercise prescription for concussion" claims. There is **dated, public, citable prior art** — academic and commercial — that in our lay assessment defeats those broad claims. There is, separately, a **narrow** band of subject matter (the fail-closed / no-fabricated-signal verification architecture and the gated camera-PPG fallback) that *may* survive. This memo lays out the prior art so counsel can (a) commission a formal search, and (b) narrow the claims deliberately rather than discover the problem during examination.

---

## 2. Dated public prior-art table

All items below were publicly available before any conversion date. Dates are publication/announcement dates as found.

| # | Item | Date | URL | One-line relevance to a broad claim |
|---|---|---|---|---|
| P1 | **Rhea concussion rehabilitation app** — usability study (JMIR Formative Research); app delivers HR-based aerobic prescription guiding users to a % of **age-predicted maximal HR** | **2025-04-11** | [PMC12007725](https://pmc.ncbi.nlm.nih.gov/articles/PMC12007725/) | Direct: a digital/mobile app that *delivers heart-rate-targeted aerobic exercise prescription for concussion*. Anticipates "a digital tool that prescribes HR-threshold concussion exercise." |
| P2 | **Remote patient monitoring of concussed adolescents via mHealth** — observational study, daily symptom reporting (PCSI 3×/day, 28 days) between visits | **2024** (JMIR-family) | [PMC11089889](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11089889/) | Direct: *between-visit digital symptom monitoring with return of patient data to clinicians* for concussion. Anticipates the "report structured data back to the prescriber" element. |
| P3 | **NCT02710123** — Sub-Threshold Exercise Treatment for Adolescents with SRC (basis of Leddy et al., *JAMA Pediatr.* 2019). Home daily exercise at **80% of HRt**, intensity tracked with a **Polar HR monitor** (+ Actigraph) | reg. **2016**; results **2019** | [ClinicalTrials.gov NCT02710123](https://clinicaltrials.gov/study/NCT02710123) | Direct: *individualised HRt-based prescription executed at home with a wearable HR monitor*. Anticipates "wearable-HR-monitored sub-threshold prescription." |
| P4 | **NCT02959216** — Aerobic Exercise for Concussion (basis of Leddy et al., *Lancet Child Adolesc Health* 2021). Daily ≥20-min sub-threshold exercise, intensity by **HR monitor**, with **weekly BCTT recheck** issuing a new target HR (commonly up to ~90% of HRt) | reg. **2016**; results **2021** | [ClinicalTrials.gov NCT02959216](https://clinicaltrials.gov/study/NCT02959216) | Direct: *serial-HRt-updated, wearable-monitored prescription* — anticipates the "re-test to update the band / serial HRt recovery curve" element. |
| P5 | **CCMI + Wibbi concussion module** — commercial concussion exercise-prescription module inside a home-exercise-program platform with care-pathway builder + outcome tracking; marketed to CCMI clinics incl. Australia. Delivery is **RPE/exercise-video-guided**; the HRt and prescription are set from an **in-clinic BCTT (on paper)**, and the app is not described as streaming a live wearable HR feed or gating a training band against the measured HRt | **2025-12-04** | [wibbi.com](https://wibbi.com/resource/complete-concussions-wibbi-partnership/) | Direct commercial prior art / competitor for the **broad** claim: *digital concussion exercise-prescription delivery with clinician workflow and outcome tracking.* On its public description it does **not** disclose live-HR-monitored home delivery or a fail-closed HR-verification gate — so it does not obviously anticipate the narrow verification-architecture claims in §3.2. |
| P6 | **PLOS One RCT** — early aerobic exercise after SRC using **progressive % of age-predicted maximal HR** vs usual care | **2022** | [PMC9778585](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9778585/) | Supporting: confirms age-predicted-max-HR delivery of concussion aerobic exercise is published — narrows our differentiator to *BCTT-derived* HRt, not the concept of HR-targeted delivery. |

Supporting/foundational (not blocking on their own, but establish the protocol as public domain): Leddy & Willer, *Curr Sports Med Rep.* 2013 (BCTT); Leddy et al. Practical Management, *Clin J Sport Med.* 2021/2023 (the 80–90%-of-HRt outpatient prescription). These confirm the *clinical method* is fully public and unpatentable by us.

---

## 3. Claim-exposure analysis (lay assessment)

### 3.1 Broad claims — likely DEFEATED, do not pursue

A claim of the general shape:

> "A system/method for delivering heart-rate-threshold-based exercise prescription for concussion via a digital and/or wearable device, monitoring heart rate during home exercise, and returning data to a clinician."

is, on the prior art above, in our lay view **not novel and likely obvious**:

- **Digital delivery of HR-targeted concussion exercise:** anticipated by P1 (Rhea) and P5 (CCMI+Wibbi).
- **Wearable HR monitoring of home sub-threshold exercise:** anticipated by P3/P4 (Polar/HR-monitor-tracked Buffalo trials).
- **Between-visit data return to clinician / remote monitoring:** anticipated by P2.
- **Serial re-test to update the target / recovery curve:** anticipated by P4 (weekly BCTT recheck).
- **The clinical prescription itself (80–90% of HRt, 20 min, most days, ≤2-pt stop):** public domain (Leddy practical-management papers; Amsterdam 2023 consensus). Not ours to claim.

Combining these known elements to their known purposes is the kind of aggregation an examiner is likely to reject as obvious. **Recommendation: do not file broad platform/method claims of this shape.**

### 3.2 Narrow claims — MAY survive, scope tightly

The subject matter not clearly anticipated by the items found is the **verification architecture**, i.e. *how the heart-rate signal's integrity is enforced*, not *that HR is used*:

- **Fail-closed / no-fabricated-signal engine.** A system that emits a heart-rate value **only** when it originates from a validated real measurement (a range/length-validated BLE Heart Rate Measurement packet, or a PPG estimate that passes a periodicity-confidence gate) and otherwise presents an explicit "no reading" state that **pauses** the threshold-dependent logic — specifically because the prescription is a *do-not-exceed ceiling* and a fabricated value is a safety hazard. The prior art delivers HR-targeted exercise but, on what we found, does not claim a **signal-integrity gate that refuses to display an unverified reading and halts the dependent clinical logic.**
- **Gated camera-PPG fallback as a safety-bounded source, tiered by provenance.** A camera-photoplethysmography heart-rate source constrained to **fail closed** — normalised-autocorrelation periodicity detection with a variance gate and a minimum-confidence threshold below which it returns *no value* — offered within a hardware-agnostic abstraction (BLE / camera-PPG / manual). Note that in the implementation the sources are **not** interchangeable: camera-PPG is bounded to a **resting spot-check** and, together with manual entry, can never mark a training session "verified" or advance the training band — **only a live BLE wearable stream satisfies the verified-progression gate.** The potentially-novel angle is therefore the *fail-closed gating and the source-provenance tiering tied to a clinical do-not-exceed ceiling*, not camera-PPG per se (camera-PPG for resting HR/HRV is widely known, e.g. consumer pacing apps). Counsel should weigh this carefully.
- **The staleness/liveness watchdog** binding signal freshness to whether the clinician's live view shows an active session — again a *signal-integrity* property, not a *use-of-HR* property.

These read on *architecture and safety-state behaviour*, which the located prior art does not obviously disclose. Whether they clear the bar — particularly **non-obviousness** over the combination of (known HR delivery) + (known camera-PPG) + (ordinary defensive engineering) — is exactly the question for a professional search and counsel's judgement. The framing should be the *specific verification mechanism and its halting behaviour tied to the clinical ceiling*, not "a system that uses heart rate."

### 3.3 Practical risk note

A live commercial competitor (P5, CCMI+Wibbi) in the same indication raises both **patentability** exposure (it is prior art against broad claims) and a **freedom-to-operate** question counsel may wish to consider separately — we have not assessed whether CCMI/Wibbi or others hold filings that read on SST Trainer.

---

## 4. Recommended actions (for counsel's decision)

1. **Commission a formal professional prior-art / patentability search** before conversion, seeded with items P1–P6 and the foundational Leddy/Amsterdam references. The founder search above is non-exhaustive and US-centric.
2. **Narrow the claims to the verification architecture** — the fail-closed, no-fabricated-signal engine; the confidence-gated camera-PPG fallback within the hardware-agnostic abstraction; and the liveness/staleness watchdog tied to the clinical ceiling. Draft these as the *mechanism and halting behaviour*, not as use-of-HR.
3. **Do NOT file broad platform/method claims** of the form "a system for delivering HR-threshold exercise prescription for concussion via a digital/wearable device" — treat them as defeated and a liability to the application's credibility.
4. **Differentiate on BCTT-derived HRt vs age-predicted-max HR** in the specification (P1/P6 use age-predicted-max), but recognise this is a *clinical-method* distinction that is mostly public domain and weak as a standalone patentable feature — useful for positioning, not for a claim.
5. **Consider FTO separately** given the live CCMI+Wibbi product (P5).
6. **Preserve trade-secret material.** Keep tuned constants/thresholds (PPG confidence cutoff, autocorrelation lag bounds, TTL values) out of any published claim where possible; claim the *architecture*, keep the tuned numbers confidential — consistent with the approach taken on the related NeuroVision and MellowVision filings.

---

## 5. Top three prior-art items that most threaten broad claims

1. **P5 — CCMI+Wibbi concussion module (2025-12-04):** a *commercial, clinician-facing, digitally-delivered* concussion exercise-prescription product with outcome tracking, reaching Australia. The single most damaging item for any broad "digital delivery" claim, and a possible FTO concern.
2. **P1 — Rhea app (2025-04-11, JMIR Formative Research):** a published, named mobile app that *delivers heart-rate-targeted aerobic exercise prescription for concussion*. Squarely anticipates a broad digital-HR-prescription claim.
3. **P3/P4 — the Buffalo trials (NCT02710123 / NCT02959216):** individualised HRt-based home prescription, **wearable-HR-monitored**, with serial re-testing — anticipates the "wearable HR + serial HRt update" elements and is the most authoritative (RCT, registered) prior art.
