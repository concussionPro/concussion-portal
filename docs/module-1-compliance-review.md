# Module 1 — Compliance Review

**File reviewed:** `/Users/zaclewis/ConcussionPro/portal/content/ai-course/module-1-compliance.md`
**Course:** AI in Clinical Practice (Concussion Education Australia)
**Reviewer:** `cea-compliance-review` (TGA / AHPRA / APP / s 133 / OAIC)
**Date:** 2026-05-22
**Verdict:** **MERGE-AT-OWN-RISK**

The module is substantively strong — content is accurate, conservative in framing, and pitched correctly as education rather than legal advice. It must NOT ship in its current form because of three fixable issues (no clinician byline, no AHPRA reg number, and one wording carryover that retains the exact "AHPRA-aligned" trademark-risk phrase in the certificate descriptor referenced by the course landing page — see Finding 1). Three further low-priority items are flagged.

---

## 1. Trademark Risk — AHPRA Brand

### Finding 1.1 — Module body: PASS

The module itself handles AHPRA branding correctly:

- Line 33 heading: *"Aligned with AHPRA's 2025 guidance"* — correct.
- Line 35 explicitly warns vendors against "AHPRA-certified" / "AHPRA-approved" framing.
- Common Misconceptions §5 (line 370) reinforces it.
- "Key Takeaways" and "Citation index" do not misuse AHPRA's name.

No instance of "AHPRA-certified" or "AHPRA-approved" appears as a self-claim. **Cleared.**

### Finding 1.2 — Course-level descriptor: VERIFY EXTERNALLY

The task brief states the certificate is described as *"aligned with AHPRA's 2025 AI Code of Conduct"*. The module refers to AHPRA's document as *"Meeting your professional obligations when using Artificial Intelligence in healthcare"* — note this is "guidance", not a "Code of Conduct".

**Action:** Audit the course landing page, checkout page, and certificate template to confirm the phrase used is *"aligned with AHPRA's 2025 AI guidance"* — not *"AHPRA's 2025 AI Code of Conduct"*. AHPRA has not published a document titled "AI Code of Conduct"; using that phrase could be construed as misrepresenting the nature of AHPRA's document and would attract the same brand risk the module otherwise avoids.

---

## 2. TGA Compliance — Therapeutic Claims

### Finding 2.1 — Module body: PASS

The module is education about a regulatory framework. It makes no therapeutic claims about AI itself. No statements of the form "AI improves patient outcomes by X%", "AI scribes reduce diagnostic error by Y%", or similar appear anywhere in the file.

Section 3 (lines 97–123) is itself a discussion of TGA risk for AI-generated patient material — appropriately conservative.

**Cleared.**

### Finding 2.2 — Reference accuracy

Line 99 cites the *Therapeutic Goods Advertising Code 2021*. This is the correct short title and was in force when last verifiable; if a 2025 or 2026 revision has issued since drafting, update the citation. The TGA legislation portal page timed out during verification — recommend a manual check at https://www.tga.gov.au/products/advertising-therapeutic-goods before publish.

---

## 3. AHPRA s 133 — Advertising of Regulated Health Services

### Finding 3.1 — Module body: PASS

s 133 of the National Law prohibits advertising of regulated health services that:
- is false, misleading or deceptive,
- offers a gift or discount without specifying T&Cs,
- uses testimonials,
- creates an unreasonable expectation of beneficial treatment, or
- encourages indiscriminate or unnecessary use of regulated health services.

The module does not advertise a regulated health service — it is CPD education about AI compliance. None of the s 133 triggers fire. The module repeatedly counsels VERIFY-BEFORE-USE (lines 27, 117, 263, 270) which is the opposite of "encouraging indiscriminate use".

**Cleared.**

---

## 4. APP Accuracy

### Finding 4.1 — APP 6 (Use/Disclosure): PASS

Lines 60–62 correctly characterise APP 6 as a secondary-use restriction with consent / reasonably-expected secondary use exceptions. The "pasting transcripts into a public chatbot" example is a defensible application. **Cleared.**

### Finding 4.2 — APP 8 (Cross-border): PASS with caveat

Lines 64–74 correctly characterise APP 8 and the s 16C accountability mechanism. The Privacy Act 1988 legislation TOC confirms s 16C exists with the title "Acts and practices of overseas recipients of personal information" — supports the module's claim.

Minor stylistic caveat: line 68 says the entity "may be" accountable as if they had done the act themselves. Under s 16C the rule is closer to *"is taken to have done the act"* (subject to the exceptions in s 16C(2)). The "may be" softens this slightly. Consider tightening to *"will be"* or *"is treated as having done"* to match the statutory language (the table on line 87 actually gets this right — fix the prose to match).

### Finding 4.3 — APP 11 (Security): PASS

Line 76–78 is accurate and operationally useful. SOC 2 Type II / ISO 27001 are not legally required but are reasonable benchmarks. **Cleared.**

### Finding 4.4 — APP 1 and APP 5

Lines 52–58 — accurate. APP 5.2 reference is correct. **Cleared.**

### Finding 4.5 — Small-business exemption / s 6D(4)(b): PASS

Line 46 cites s 6D(4)(b) as the source of the "health-service provider" carve-out from the small-business exemption. The Privacy Act TOC confirms s 6D exists with the title "Small business and small business operators". The carve-out is correctly characterised.

### Finding 4.6 — De-identification (OAIC guidance): PASS

Lines 130–145 correctly distinguish pseudonymisation from de-identification. The OAIC de-identification page confirms the test: *"Information will be de-identified where the risk of an individual being re-identified in the data is very low in the relevant release context"* — exactly the framing the module uses (line 133). The quasi-identifier examples (rare diagnosis + region + age) align with OAIC re-identification risk guidance. **Cleared.**

### Finding 4.7 — NDB 30-day window / s 26WH: PASS

Line 175 cites s 26WH and the 30-calendar-day assessment window. The Privacy Act TOC confirms s 26WH exists with title "Assessment of suspected eligible data breach". The 30-day rule is correctly attributed; the module correctly identifies that the clock starts at *suspicion* (line 177), which matches s 26WH(2) in the Act. **Cleared.**

---

## 5. Disclaimers

### Finding 5.1 — Opening disclaimer: PASS

Line 10 contains an explicit *"this module is education, not legal advice"* disclaimer, with a recommendation to contact the indemnity carrier / MDO. Strong opening. **Cleared.**

### Finding 5.2 — Closing reinforcement: PASS

Line 399 reinforces the disclaimer ("log into your indemnity carrier's member portal and pull their current AI position statement"). Section 6 (lines 186–211) is dedicated to indemnity-carrier guidance. **Cleared.**

---

## 6. Citations

### Finding 6.1 — Coverage: PASS

Every legal claim has a citation. The Citation Index (lines 386–395) is complete and links to:
- AHPRA AI guidance
- OAIC APP guidelines
- OAIC AI products guidance
- OAIC de-identification guidance
- OAIC NDB scheme
- TGA advertising
- Privacy Act 1988 (legislation.gov.au)
- Therapeutic Goods Act 1989 (legislation.gov.au)

No placeholder URLs, no `example.com`, no missing citations.

### Finding 6.2 — Link reachability: VERIFY ON PUBLISH

The AHPRA page (`/Resources/Artificial-Intelligence-in-healthcare.aspx`) returned 403 to automated WebFetch. This is consistent with bot-blocking rather than a dead link. **Action:** manually open all eight citation URLs from a browser before publish; rotate any that return 404/redirect. AHPRA frequently restructures its Resources subtree.

### Finding 6.3 — State surveillance legislation: PASS

Line 297 cites *Surveillance Devices Act 1999* (Vic) and *Surveillance Devices Act 2007* (NSW) for recording-consent law. Both are correct short titles. Other states (QLD, WA, SA, TAS, ACT, NT) have their own recording laws — consider expanding the parenthetical to "(varies by state — confirm your jurisdiction's surveillance devices legislation)" so non-Vic/NSW practitioners aren't left guessing.

---

## 7. Byline — BLOCKING

### Finding 7.1 — No named author: FAIL

The file has no byline. The course is healthcare CPD; under E-E-A-T (especially YMYL healthcare content) and under CEA's own `CLAUDE.md` direction ("bylines on every clinical post (Zac's name + osteopath credential + AHPRA reg if used)"), this is a publish blocker.

**Recommended fix** — insert below line 6 (`Module weight:` line):

```
**Author:** Zac Lewis, Osteopath (AHPRA reg. OSTxxxxxxxxxx)
**Last reviewed:** 2026-05-22
```

Replace `OSTxxxxxxxxxx` with Zac's actual AHPRA registration number, or omit if he prefers not to publish it (in which case `Osteopath` alone is the minimum acceptable byline). The "Last reviewed" field signals currency to AI Overviews and AHPRA notification reviewers alike.

### Finding 7.2 — No "reviewed by" reference

For load-bearing legal content, consider adding a separate "Reviewed by" line naming a solicitor or MDO contact (where available). Not strictly required for an education product, but it materially strengthens the file's defensibility if the content is ever cited in an AHPRA notification or coronial inquiry.

---

## 8. Other Observations (Non-blocking)

- **Line 5** ("Estimated reading time: 40 minutes") — accurate for a ~5,500-word module. No change.
- **Line 12** mentions "AHPRA has issued formal guidance" — consistent with the 2025 publication. No change.
- **Line 257** ("the clinician owns the clinical decision; the LLM is a tool") — load-bearing sentence; recommend bolding survives any future export/PDF rendering.
- **Section 10 (lines 321–349) "High-Risk Populations"** correctly identifies sensitive information categories under s 6 of the Privacy Act. Consider adding a sentence noting that Aboriginal and Torres Strait Islander health data also engages the AIATSIS *Code of Ethics for Aboriginal and Torres Strait Islander Research* and the National Agreement on Closing the Gap Priority Reform 4 (data sovereignty) — not strictly required, but elevates cultural-safety treatment beyond a single bullet.
- **Self-check questions** are appropriately Socratic and do not invite the learner to commit to a position that would itself be misleading.

---

## Top Issues Summary (for the verdict)

| # | Finding | Severity | Action |
|---|---|---|---|
| 1 | No clinician byline (Finding 7.1) | BLOCKING | Add Zac's name + osteopath credential + (optional) AHPRA reg below line 6 |
| 2 | Certificate descriptor uses *"AI Code of Conduct"* not *"AI guidance"* (Finding 1.2) | BLOCKING | Audit landing page / certificate template — replace "Code of Conduct" with "guidance" wherever it appears |
| 3 | APP 8 prose softens s 16C from *"is taken to have done"* to *"may be accountable"* (Finding 4.2) | MEDIUM | Tighten line 68 to match the statutory language and the table on line 87 |
| 4 | State surveillance legislation only covers Vic/NSW (Finding 6.3) | LOW | Expand parenthetical on line 297 to flag jurisdictional variation |
| 5 | All citation URLs need manual reachability check before publish (Finding 6.2) | LOW | Open each of the 8 citation URLs from a browser; replace any that 404 |

---

## Verdict

**MERGE-AT-OWN-RISK** — content is accurate and legally defensible; structural gaps (byline, certificate descriptor wording) must be fixed before this is published as the load-bearing legal module of a paid CPD product. Once Findings 1 and 2 are addressed and Finding 3 tightened, this becomes **MERGE-OK**.
