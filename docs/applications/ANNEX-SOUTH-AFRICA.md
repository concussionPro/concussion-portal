# Annex — South Africa Jurisdiction Context

## Concussion Rehab Mastery (CRM) · accompanies the HPCSA per-activity CPD accreditation submission

**Provider:** Concussion Education Australia Pty Ltd, trading as Concussion Education Australia (CEA) — ACN 688 155 508 · **ABN 74 688 155 508** · D-U-N-S 889691346 (incorporated 18 June 2025)
**Author:** Zac Lewis — Registered Osteopath (AHPRA **OST0001852866**) · B.Clin.Sci, M.Ost.Med · Director and founder
**Correspondence:** 2 Wordsworth St, Byron Bay NSW 2481, Australia · zac@concussion-education-australia.com · +61 449 186 579
**Date:** **ACTION: insert submission date on send.**

**Parent submission:** `SOUTH-AFRICA-HPCSA-SUBMISSION-PACK.md` (this annex is the South African annex offered to the accreditor in §9 and §11 of that pack). Audience: HPCSA-registered **biokineticists** (primary), physiotherapists, and any HPCSA-registered practitioner with exercise-based rehabilitation in scope.
**Landing page:** `/hpcsa` · **Reviewer view:** `https://portal.concussion-education-australia.com/demo/review-hpcsa` → `/ep-course/dashboard`
**Product:** CRM — 8 online modules, 480 minutes assessed content, **8 CPD/CE hours**, 87 questions delivered per module, 80% pass mark, 136 peer-reviewed references. Stand-alone; lifetime access + platform (SST Trainer + Baseline tools). **Price R6,400** (single source `lib/international-pricing.ts`; **optional PPP adjustment** by lowering the ZAR row if the founder chooses; otherwise ship R6,400). Renewal US$99/yr.

---

## 1. Purpose of this annex

The delivered CRM content teaches an international clinical protocol against a single worked jurisdictional example (Australia). This annex sets the corresponding South African instruments alongside that content so a South African learner exercises the identical competency under the rules that bind them. Nothing in the physiological content of Modules 1, 3, 4, 5 or 7 is Australia-specific; the protocol applies identically in Cape Town and in Melbourne.

---

## 2. South African professional context — biokinetics scope

Biokineticist scope, in its statutory formulation, is **individualised assessment and exercise prescription for clinical pathology.** Concussion Rehab Mastery sits dead centre of that: symptom-limited graded exercise testing (Module 3), derivation of an individual heart-rate threshold and prescription against it (Module 4), phenotype-specific prescription (Module 5), and staged progression to full activity against objective criteria (Module 6). CRM is not adjacent to biokinetics — it is a condition-specific application of the exact competence that defines the profession.

The evidence base is the international spine: Amsterdam 2022 (Patricios et al., *BJSM*, 2023, https://doi.org/10.1136/bjsports-2023-106898) made sub-symptom-threshold aerobic exercise, prescribed from an individually derived heart-rate threshold, first-line treatment; early prescribed exercise shortened median recovery from 17 to 13 days (Leddy et al., *JAMA Pediatrics*, 2019, https://doi.org/10.1001/jamapediatrics.2018.4397; n=103, P=.009) and reduces persisting symptoms (Leddy et al., *Lancet Child Adolesc Health*, 2021, https://doi.org/10.1016/S2352-4642(21)00267-4; Leddy et al., *BJSM* meta-analysis, 2023, https://doi.org/10.1136/bjsports-2022-106676). A single accreditation obtained through the biokinetics route is claimable by any HPCSA-registered practitioner for whom the activity is relevant to scope — physiotherapists in particular — so the annex names that multi-professional relevance explicitly.

The method the activity teaches is published open-access and citable, so the accreditor can inspect the standard directly: *A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise Rehabilitation after Concussion (mild Traumatic Brain Injury)* (Lewis, Z., 2026; Zenodo; open access, CC-BY-4.0; https://doi.org/10.5281/zenodo.21482634). The biokineticist owns the treatment; what was missing was a standardised, accredited method and a tool to run it consistently. The SST Trainer is that tool — running the graded exercise test, capturing the **measured** heart-rate threshold, issuing and monitoring the sub-symptom-threshold prescription, and producing a measured HR-threshold trajectory with standardised progress reporting (demo: `/sst-trainer?clinic=DEMO00`). This is presented inside the accreditation gate, not around it: accreditation must precede the activity and enrolment (§4).

---

## 3. CEU accreditation framing

Per the parent pack: **HPCSA does not accredit providers** — it maintains a register of approved accreditors, each of which assesses activities submitted to it and, on approval, issues an **accreditation number and letter** against which practitioners claim CEUs. Accreditation is **per activity**, **time-limited**, and (since 1 November 2024) **cannot be granted retrospectively**.

CRM requests **8 clinical CEUs** on the most conservative basis — one CEU per hour of assessed instructional content, 480 minutes = 8.0 hours, every hour assessed — **plus 1 ethics CEU** for the 60 minutes of ethics, human-rights and health-law content in Modules 2 and 8 (scope and its medico-legal rationale; record-keeping; privacy and consent; professional responsibility for AI-assisted documentation). **ACTION: the enquiry email asks whether the ethics CEU is added to or carved out of the 8.0 — accept the accreditor's convention; do not claim 9 CEUs if the accreditor's rule is that the ethics hour comes out of the total.**

**ACTION: confirm the biokinetics accreditor** — whether BASA holds HPCSA accreditor status or routes to another approved accreditor, and the exact board designation (the enquiry email requests this; UCT is the parallel fallback route). **ACTION: confirm the current service fee** — R1,380 (UCT short-course benchmark, capped R2,750) is a benchmark, not a quote, and is payable whether the application is approved, declined or withdrawn. **ACTION: confirm the accreditation validity period and diarise renewal.**

---

## 4. THE HARD COMPLIANCE GATE — accreditation precedes enrolment, and it is enforced in code

South African CPD accreditation is **statutory** and must **precede** the activity. There is no retrospective accreditation and no retrospective remedy: one South African enrolment before the accreditation number issues makes that practitioner's CEUs unclaimable and makes the accreditation itself materially harder to obtain. The service fee is non-refundable regardless of outcome.

**CEA has already enforced this at the checkout layer — presented here as evidence of compliance, not as an intention.** The international checkout is gated server-side: a buyer with `country === 'ZA'` attempting the CRM/international-online purchase is refused with an HTTP 403 while `CONFIG.FEATURES.HPCSA_ACCREDITED` is `false` (its current value), and is redirected to register interest at `/hpcsa`. The gate fails closed. Concretely:

- **`app/api/create-checkout/route.ts`** blocks the ZA international-online checkout and returns *"Not yet available in South Africa. This course is pending HPCSA CEU accreditation… Register your interest and we will notify you the day it opens."*
- **`lib/config.ts`** holds `CONFIG.FEATURES.HPCSA_ACCREDITED: false` — the single flag that gates it. It flips to `true` only when the accreditation number is in hand.
- **`/pricing-international`** is **interest-capture only** for South Africa — it does not transact a ZA sale; it collects a notify-me registration.

The operational consequence: **no South African practitioner can enrol in CRM until the CEU number issues.** This is the state the accreditor can rely on at the moment of submission. **ACTION (founder): confirm whether any South African practitioner enrolled before the gate went live; if any did, disclose honestly to the accreditor and be prepared for those individuals to be unable to claim CEUs for that completion.**

---

## 5. South African return-to-play governance

Module 6 teaches the transferable competency: identify the two governing minimums (a mandated calendar stand-down and a symptom-free period), determine which governs, and refuse to progress an athlete past the stage the applicable governance permits. South African learners exercise that competency against **World Rugby's graduated return-to-play framework as applied by SA Rugby**, and the return-to-play protocol of the athlete's relevant national sporting body. The Australian instrument in the delivered content is presented as the worked example, not the governing rule. **ACTION: confirm the current SA Rugby / relevant national-body return-to-play protocol titles on the body's own site before the formal submission goes out.**

---

## 6. Scope of practice, records and privacy

- **Scope.** In South Africa, as in Australia, **diagnosis of concussion and clearance for return to contact are medical acts.** Biokineticists, physiotherapists and other HPCSA-registered practitioners in this pathway work under a referral relationship and none clears an athlete for contact. Module 2 teaches recognise-and-escalate, not diagnose; Module 8 teaches recording findings as exercise-rehabilitation observations and recommendations, never as diagnosis or clearance. The material directs learners to their own board's scope definition.
- **Records and privacy.** Module 8 teaches the substantive principles (lawful collection, use/disclosure limits, consent, security of health information, cross-border transfer, and the obligations triggered by AI scribe tools). For South African learners the corresponding instruments are the **Protection of Personal Information Act (POPIA)** and the **HPCSA guidance on the keeping of patient records**. **ACTION: confirm the exact HPCSA record-keeping booklet reference before submission.**
- **Data residency.** CEA hosts in Australia (Sydney region — Vercel `syd1` + Neon ap-southeast-2). South African learner personal data is processed outside South Africa; this cross-border transfer is handled under the terms published at `/terms`.
- **Refund, complaints and quality policy.** Published at `/terms`, identical across AU/NZ/international: 7-day refund if less than 25% accessed; complaints to zac@concussion-education-australia.com; Australian Consumer Law rights preserved; privacy under the Australian Privacy Principles (Privacy Act 1988).

---

## 7. Recognition and endorsement discipline (stated honestly)

- **Independent review.** CRM has been independently reviewed by two reviewers appointed by Exercise & Sports Science Australia (ESSA) through its professional-development endorsement process.
- **ESSA endorsement is PENDING** — the review has been undertaken; the endorsement decision has not been issued. CEA does not claim the credential in the interim and will notify the accreditor on determination.
- **Not endorsed elsewhere for this product.** CRM is **not** Osteopathy Australia-endorsed (that applies only to CEA's separate in-person clinical programme); CEA holds **no** ACSM Continuing Education Credits and **no** existing HPCSA accreditation.
- **Authorship, stated plainly.** CRM was authored solely by a registered osteopath. No exercise physiologist authored or clinically validated it; CEA makes no such claim. Its external check is the ESSA-appointed independent review above.
- **Commercial disclosure.** No commercial sponsorship, no pharmaceutical or device-industry funding, no product promotion within the activity; the BCTT/BCBT are taught as published validated protocols with no CEA commercial interest. **ACTION (founder): confirm no affiliate or equipment relationship exists; if any does, it must be disclosed.**

---

## ACTION lines in this annex
- Insert submission date on send (header).
- Confirm whether the ethics CEU is added to or carved out of the 8.0 (§3).
- Confirm the biokinetics accreditor and exact board designation (§3).
- Confirm the current service fee with the chosen accreditor (§3).
- Confirm the accreditation validity period and diarise renewal (§3).
- (Founder) Confirm whether any ZA practitioner enrolled before the gate went live; disclose if so (§4).
- Confirm the current SA Rugby / national-body return-to-play protocol titles (§5).
- Confirm the exact HPCSA record-keeping booklet reference (§6).
- (Founder) Confirm no affiliate/equipment commercial relationship exists (§7).
