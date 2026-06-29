# Evidence backtest: the SST Trainer protocol against the published literature

Concussion Education Australia (CEA)
Draft v1.0 · 2026

This is the "backtest" of the build against the evidence: for each design decision the SST Trainer encodes, the strongest real, published study that supports it, with population, intervention, key result/effect size, and citation. The final column flags where the evidence is **strong** vs **thin**. All citations are real and were verified against the published literature; none are fabricated.

> **How to read this.** The tool does not invent physiology — it delivers a published prescription. Each row maps a *coded constant or behaviour* in `lib/sst-trainer/protocol.ts` / `hr-live.ts` to the evidence behind it. Where the evidence is thin, the corresponding feature is framed conservatively in the product (e.g. wider safety margins for non-concussion presets, camera-PPG as a gated fallback).

---

## 1. Core evidence table

| # | Design decision (in code) | Study | n / population | Intervention | Key result / effect size | Strength |
|---|---|---|---|---|---|---|
| 1 | **SSTAE accelerates recovery** (the whole premise) | Leddy JJ, Haider MN, Ellis MJ, et al. *Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial.* JAMA Pediatr. 2019;173(4):319–325. | 103 adolescents (13–18), acute SRC | Sub-symptom-threshold aerobic exercise vs placebo-like stretching | Median recovery **13 vs 17 days** (statistically significant; faster recovery with exercise) | **Strong** (RCT) |
| 2 | **SSTAE prevents persistence** (the costly outcome) | Leddy JJ, Master CL, Mannix R, et al. *Early targeted heart rate aerobic exercise versus placebo stretching for SRC in adolescents: a randomised controlled trial.* Lancet Child Adolesc Health. 2021;5(11):792–799. | 118 adolescents (13–18), ≤10 days post-injury, 3 sites | Targeted-HR SSTAE vs placebo stretching | Reduced median recovery; higher likelihood of recovery ≤4 weeks; **~48% reduction in persistent post-concussive symptoms**; good adherence; no adverse events | **Strong** (independent multi-site RCT replication) |
| 3 | **Active over rest; consensus endorsement** | Patricios JS, Schneider KJ, Dvorak J, et al. *Consensus statement on concussion in sport: 6th International Conference–Amsterdam, October 2022.* Br J Sports Med. 2023;57(11):695–711. | Consensus synthesis | Relative rest 24–48 h, then early prescribed SSTAE within ~2–10 days | Recommends early aerobic exercise; **≤2-point** transient symptom worsening tolerated if settling <1 h | **Strong** (field consensus) |
| 4 | **Graded test → HRt; Balke ramp; per-minute logging** (`detectThreshold`, the test design) | Leddy JJ, Willer B. *Use of graded exercise testing in concussion and return-to-activity management.* Curr Sports Med Rep. 2013;12(6):370–376. | Methods / clinical | BCTT on the Balke protocol; HR/RPE/symptoms each minute | Establishes the standardised graded test and the HRt construct; Balke ramp safe even in cardiac patients | **Strong** (foundational method) |
| 5 | **HRt + slope are prognostic** (why serial HRt = recovery curve) | Haider MN, Leddy JJ, et al. *The Predictive Capacity of the BCTT After SRC in Adolescents.* Front Neurol. 2019;10:395. | Adolescents, SRC | BCTT at presentation | Absolute **HRt <135 bpm** → prolonged (>30-day) recovery; **ΔHR ≤50 bpm → 73% sensitivity, 78% specificity** for prolonged recovery | **Strong** (prognostic) |
| 6 | **Train at ~80% of symptom-threshold HR** (band floor) | Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. *A preliminary study of subsymptom threshold exercise training for refractory post-concussion syndrome.* Clin J Sport Med. 2010;20(1):21–27. | Small preliminary cohort, refractory PCS | Exercise most days at ~80% of HRt | Feasible; symptom improvement — proof of concept for the dose | **Moderate** (small, preliminary) |
| 7 | **Serial graded testing is reliable** (licences re-test as a recovery measure) | Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. *Reliability of a graded exercise test for assessing recovery from concussion.* Clin J Sport Med. 2011;21(2):89–94. | Concussion patients | Repeated graded exercise testing | Test is reliable as a repeated measure → supports serial-HRt trajectory | **Strong** (reliability) |
| 8 | **80–90% HRt band, ~20 min, most days; portable prescription** (`computePrescription`) | Leddy JJ, Haider MN, Hinds AL, Willer B. *Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for SRC in the Outpatient Setting.* Clin J Sport Med. 2021;31(2):e89–e94. | Clinical guidance | Prescribe band from HRt; in-session symptom-stop; progress | Specifies the operational dose and progression the engine encodes | **Strong** (practice guidance) |
| 9 | **Prescribe when no graded test available** (conservative seeding) | Leddy JJ, et al. *Practical Management: A Standardized Aerobic Exercise Program for Adolescents With Concussion in the Absence of Graded Exercise Testing.* Clin J Sport Med. 2023. | Adolescents, concussion | Standardised HR-stepped program without a treadmill test | Provides a standardised fallback prescription | **Moderate** (guidance; growing use) |
| 10 | **Active management beats rest, both sexes** | Willer BS, Haider MN, Bezherano I, et al. *Comparison of Rest to Aerobic Exercise and Placebo-like Treatment of Acute SRC in Male and Female Adolescents.* Arch Phys Med Rehabil. 2019;100(12):2267–2275. | Male & female adolescents, acute SRC | Rest vs aerobic exercise vs placebo-like | Supports active over rest across sexes | **Strong** (comparative) |
| 11 | **Mechanism: exercise intolerance = autonomic/cerebrovascular dysfunction** (why HR is the right anchor) | *Autonomic Dysfunction and Exercise Intolerance in Concussion — A Scoping Review.* 2024 (PMC10812884). | Scoping review | — | Synthesises ANS/cerebrovascular dysregulation as the substrate of exercise intolerance | **Moderate** (mechanistic synthesis) |
| 12 | **Exercise intolerance is common and symptom-linked** (justifies the screen) | *Exploring Exercise Intolerance in Adult Patients with Persistent Post-Concussion Symptoms* (PMC12604302). | Adults, persistent PCS | BCTT | **~81%** tested positive for exercise intolerance; higher symptom burden → higher odds | **Moderate** (observational, adults) |
| 13 | **"Exercise is medicine" reframing** (paradigm anchor) | Leddy JJ, Haider MN, Ellis M, Willer BS. *Exercise is Medicine for Concussion.* Curr Sports Med Rep. 2018;17(8):262–270. | Review | — | Frames active rehab as treatment, not risk | **Strong** (influential review) |
| 14 | **Camera-PPG is an accepted HR/HRV modality** (fallback source in `connectCameraPpg`) | Public/clinical use of smartphone photoplethysmography (e.g. the Visible pacing platform estimates HR/HRV via phone-camera PPG; Visible, makevisible.com / TechCrunch 2022). | Consumer health | Camera-PPG HR/HRV | Establishes camera-PPG as a deployed HR-estimation method (note: precision lower than a strap) | **Thin** for clinical precision → used only as a *gated fallback* |

---

## 2. Where the evidence is strong vs thin

**Strong (RCT / consensus / prognostic / reliability):**

- The central therapeutic claim — early SSTAE accelerates recovery (row 1) and reduces persistence by ~48% (row 2) — rests on **two independent randomised controlled trials in adolescents**, plus **field consensus** (row 3). This is as good as the evidence gets in concussion.
- The **HRt construct, the graded-test method, its reliability, and its prognostic value** (rows 4, 5, 7) are well established, which directly supports the engine's threshold detection and serial-HRt recovery curve.
- The **operational prescription** (80–90% HRt, ~20 min, most days, symptom-stop, progression) is published practice guidance (row 8) and the constants in code map to it one-to-one.

**Thin / to be framed conservatively:**

- **Adults and persistent-symptom populations.** Most RCT evidence is in **adolescents in the early window**. Adult and chronic-PCS evidence (rows 6, 12) is observational/preliminary; reviews explicitly call for better adult trials. → The product is honest that its strongest backing is adolescent SRC.
- **Non-concussion presets** (TBI, neuro-other, and the platform-expansion presets — cancer, long-COVID, cardiac). These are *not* supported by the concussion RCTs; they borrow only the general principle of symptom-limited graded aerobic dosing and are coded with **wider safety margins, lower/narrower bands, and shorter sessions**. They should be treated as *plausible extensions pending their own evidence*, not as validated by the concussion literature.
- **Camera-PPG precision** (row 14). Camera-PPG is a deployed modality but less precise than a chest strap; in the build it is a **confidence-gated fallback that fails closed** (returns no reading rather than a guess), with strap-based measurement preferred. The clinical *prescription* should be anchored on the most accurate available source.
- **The digital delivery itself has no outcome evidence yet.** No row above tests *the app*; every row tests the underlying physiology/prescription. The tool's own effectiveness is unproven and is deferred to a future retrospective observational study on de-identified routine-care data.

---

## 3. Net read

The protocol the SST Trainer encodes "backtests" cleanly against a strong, replicated, consensus-endorsed evidence base **for early adolescent sport-related concussion**. The further a use-case sits from that core — adults, chronic symptoms, non-concussion conditions, camera-PPG as the sole source — the thinner the evidence and the more conservative the build's framing must be. The single honest gap the literature cannot fill is whether *digital, between-visit delivery* improves outcomes over standard prescription; that is the question the planned retrospective study exists to answer.

---

## References (consolidated)

1. Leddy JJ, Haider MN, Ellis MJ, et al. *JAMA Pediatr.* 2019;173(4):319–325.
2. Leddy JJ, Master CL, Mannix R, et al. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
3. Patricios JS, Schneider KJ, Dvorak J, et al. *Br J Sports Med.* 2023;57(11):695–711.
4. Leddy JJ, Willer B. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Haider MN, Leddy JJ, et al. *Front Neurol.* 2019;10:395.
6. Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. *Clin J Sport Med.* 2010;20(1):21–27.
7. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. *Clin J Sport Med.* 2011;21(2):89–94.
8. Leddy JJ, Haider MN, Hinds AL, Willer B. *Clin J Sport Med.* 2021;31(2):e89–e94.
9. Leddy JJ, et al. *Clin J Sport Med.* 2023 (Standardized Aerobic Exercise Program without graded testing).
10. Willer BS, Haider MN, Bezherano I, et al. *Arch Phys Med Rehabil.* 2019;100(12):2267–2275.
11. Autonomic Dysfunction and Exercise Intolerance in Concussion — A Scoping Review. 2024 (PMC10812884).
12. Exploring Exercise Intolerance in Adult Patients with Persistent Post-Concussion Symptoms (PMC12604302).
13. Leddy JJ, Haider MN, Ellis M, Willer BS. *Curr Sports Med Rep.* 2018;17(8):262–270.
14. Visible (pacing platform) — camera-PPG HR/HRV estimation; makevisible.com; TechCrunch, 22 Nov 2022.
