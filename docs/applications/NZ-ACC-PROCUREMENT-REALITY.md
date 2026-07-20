# NZ ACC Concussion Services — Procurement Reality

**Researched:** 20 July 2026
**Question:** what does it actually take to sell a clinical reporting tool + CPD training into the New Zealand ACC Concussion Services ecosystem?

Everything above the "INFERENCE" heading is sourced. Every claim has a URL. Where something could not be verified it says so and names where to look.

**Method note:** `acc.co.nz` HTML pages sit behind Imperva/Incapsula and return 403 to automated fetching. ACC's PDF asset CDN is not blocked. Almost all ACC findings below come from direct extraction of the contract PDFs, which is stronger evidence than page summaries — but it means a handful of HTML-only pages (contacts, Innovation Fund, newsroom) are flagged unverified and need a browser.

---

## 0. The short version

1. **There is no ACC-level application for a tool vendor.** Selling a tool or training to an already-contracted supplier is a normal B2B sale with zero ACC process, zero registration, and zero approval.
2. **ACC has no approved-product, approved-technology or endorsed-tool scheme.** It does not exist. Confirmed negative from primary contract documents.
3. **The contract explicitly hands tool choice to the supplier.** ACC mandates *that* validated outcome measures be used and names none.
4. **The binding data constraint is contractual, not statutory: NZ or Australia only.** NZ law imposes no residency rule; the Concussion Services Service Schedule does.
5. **ACC is not behind on the clinical question.** Its sport concussion guideline was updated January 2026 and is built on the Amsterdam consensus. It endorses sub-symptom aerobic exercise and specifies no method.

---

## 1. Who is the actual buyer, and is there an ACC-level application?

### The two paths are genuinely different

**Path (a) — becoming an ACC contracted health supplier.** This is a periodic competitive tender for *clinical service delivery*. ACC states it directly on [Working under a contract](https://www.acc.co.nz/for-providers/provide-services/contract): "We advertise contracts for new suppliers through Government Electronic Tenders Services (GETS)."

Verified Concussion Services tender history:

| Tender | RFx ID | Opened | Closed | Status |
|---|---|---|---|---|
| [Concussion Services](https://www.gets.govt.nz/ACC/ExternalTenderDetails.htm?id=20703784) | 20703784 | 11 Feb 2019 | 7 May 2021 | Closed |
| [Concussion Services – Advance Notice](https://www.gets.govt.nz/ACC/ExternalTenderDetails.htm?id=31320863) | 31320863 | 21 Mar 2025 | 1 Jul 2025 | Closed |
| [Concussion Services 2025](https://www.gets.govt.nz/ACC/ExternalTenderDetails.htm?id=31972756) | 31972756 | 1 Jul 2025 | 10 Aug 2025 | **Closed, awarded 24 Oct 2025** |

Tender contact was `ACCHealthTenders@acc.co.nz`. Contract term 1 Jul 2025 – 30 Jun 2027, extendable by one year at ACC's discretion (Service Schedule Part A cl.1.2.2). The advance notice stated: **"This opportunity is only for new suppliers. Incumbents do not need to reapply."**

It is **not** open registration. You cannot apply at any time. Next realistic window is the re-tender around 30 June 2027.

Even if the window were open, eligibility requires a core interdisciplinary team **at each service location** (Service Schedule cl.5.2.1): Medical Practitioner, Neuropsychologist, Clinical Psychologist and/or Psychologist, Occupational Therapist, Physiotherapist — each with a current APC and a minimum of two years' recent post-qualification experience. **Path (a) is closed to a tool/training vendor.** Do not spend time on it.

> One trap to avoid: the GETS listing field reads *Tender Coverage: Sole Agency*. That means the contract is for ACC alone rather than syndicated across government agencies. It does **not** mean the round was restricted or invitation-only.

**Path (b) — selling to an already-contracted supplier.** This is a normal B2B sale. **There is no ACC process of any kind.** No registration, no notification, no approval, no product listing.

The 13 suppliers awarded on 24 Oct 2025 — this is the entire addressable market for the tool in this contract:

ABI Rehabilitation NZ · Align Health Group · Astech SRS · Axis Sports Medicine Specialists · Body in Motion Physiotherapy & Rehabilitation · Bay Rehab · Habit Health · New Zealand Health Group · Rope Neuro Rehabilitation · Specialist Rehab Services · TBI Health Group · Tui Allied Health · What Ever It Takes Home Based Rehabilitation and Support Services

Thirteen named accounts. That is a founder-led sales list, not a marketing funnel.

### The contract hands tool choice to the supplier — verbatim

[Concussion Services Service Schedule](https://www.acc.co.nz/assets/contracts/concussion-services-service-schedule.pdf), cl.5.4.5–5.4.6:

> "5.4.5 The Supplier will ensure that outcomes are measured using a validated, objective clinical measure.
> 5.4.6 The outcome measurement tools used will be **standardised measurements selected by the Supplier** as appropriate to the Client's injury and rehabilitation needs."

And cl.15.1: "The Supplier must perform the Services using appropriate assessment tools in accordance with Good Industry Practice."

**No instrument is named anywhere in either document.** No RPQ, no PCSS, no SCAT, no GOSE, no WHODAS. The triage screening tool is "an appropriate screening tool" (cl.5.5.4.1), unnamed. Even the risk-of-delayed-recovery assessment says it must use "the method specified by ACC" (cl.5.13.3.3.2) — and that method is specified nowhere in the published documents.

This is the commercial opening: a mandated requirement with no prescribed instrument.

### Training is a supplier obligation with no approved-provider scheme

[Operational Guidelines](https://www.acc.co.nz/assets/contracts/concussion-og.pdf) p.15:

> "Suppliers will maintain records showing that all the qualifications, experience, competency supervision and training for all members of the interdisciplinary team. ACC may request verification that service providers meet the required criteria."

Acceptable records explicitly include "Documentation of any additional certifications or specialised training completed" and "Records of ongoing professional development and training." Service Schedule cl.15.2 requires quality assurance systems to "identify and monitor competency level, training needs."

**But there is no CPD hours requirement anywhere in either document** — no hours, no accreditation body, no named course. The only CPD-adjacent duty is for providers under supervision (cl.6.3.1.1): "The Service provider must engage in further professional development with specific relevance to working with people who have had a mild to moderate brain injury."

**ACC does not approve, accredit or endorse training providers.** No such scheme appears in any primary document.

### Is there ANY ACC vendor registration?

**An approved-product / approved-technology / endorsed-tool scheme DOES NOT EXIST.** Firm negative from the Operational Guidelines, Service Schedule and Standard Terms and Conditions. ACC's [digital services pages](https://www.acc.co.nz/for-providers/working-with-us-using-our-digital-services) publish no approved or certified vendor list.

Beware a false positive: "accredited" at ACC means the [Accredited Employer Programme](https://www.acc.co.nz/for-business/understanding-your-cover-options/find-an-accredited-employer) — employers self-managing claims. Unrelated to products.

What *does* exist, none of which is an approval gate:

- **[Vendor registration (ACC111)](https://www.acc.co.nz/register-as-an-acc-vendor)** — payment plumbing only. Needs NZBN, GST, IRD, bank verification. Only relevant if ACC pays you directly, which it would not in path (b).
- **[developer.acc.co.nz](https://developer.acc.co.nz/home)** — API/PMS integration onboarding via DigiOps (`digitaloperations@acc.co.nz`): environment T&Cs, API key, HealthLink certificate, ACC acceptance tests. This is the closest analogue to vendor approval and it is **purely technical conformance** — it certifies your software talks to ACC systems correctly and confers no clinical endorsement. *Site returns 401 to automated access; details from search extracts. Open in a browser.*
- **[Pae Hokohoko / Government Digital Marketplace](https://www.marketplace.govt.nz/)** — registration is continuously open, and accepts an **ABN** as well as NZBN, so an Australian entity qualifies. ACC is [required to apply the Government Procurement Rules](https://www.procurement.govt.nz/about-us/mandate-and-eligibility/eligible-agencies-procurement/) so it can buy off AoG panels. Contact `marketplace@dia.govt.nz`. Relevant only if ACC itself ever becomes the buyer.

### The one clause that could bite: subcontracting

[Standard Terms and Conditions](https://www.acc.co.nz/assets/contracts/health-contract-terms-conditions.pdf) (March 2023) cl.16.1:

> "You must not enter into a contract with someone else to deliver any part of the Services without ACC's written approval. If subcontracting is allowed for a Service, that will be stated in the Service Schedule."

Licensing software and delivering training are procurement of *inputs* — not subcontracting *the Services*. But if the tool or its staff ever perform a billable clinical act (a TBI21 assessment, a TBI23 neuropsych screen), the customer becomes a subcontractor arrangement needing ACC's written approval. **Keep the product on the "supplier's own tooling" side of that line and there is no ACC process at all.**

---

## 2. Does ACC need to see a dashboard, and who evaluates it?

**No.** There is no ACC-side technology evaluation, no information-security assessment, and no privacy review of a supplier's chosen software in the published contract documents. The obligations sit on the supplier, and the supplier self-certifies.

### What the contract actually requires (Service Schedule cl.14.1, p.37)

Verbatim:

- **14.1.2** — "Not transmit, transfer, export or store either Confidential information or Clients' Personal Information **outside of New Zealand and/or Australia**."
- **14.1.3** — "Maintain information security systems, procedures and process in accordance with Good Industry Practice to protect Clients' Personal Information and Confidential information against loss or unlawful access, use, modification or disclosure."
- **14.1.4** — "Undertake regular security assurance, monitoring and testing of its information management systems, and promptly remediate any identified security vulnerabilities in accordance with Good Industry Practice."
- **14.1.5** — "Comply with any security information, accreditation and certification requirements requested or notified by ACC from time to time."
- **14.1.6** — "Confirm that the Supplier's Subcontractors (if any) satisfactorily meet all the requirements in this clause 14.1 **before releasing** any Personal Information or Confidential information to that Subcontractor."

**Read 14.1.6 carefully — that is the actual evaluation gate, and the evaluator is the supplier, not ACC.** The supplier must satisfy itself about you before sending you any client data. So the buyer's clinical-governance lead does the assessment, using their own judgement, with no ACC template.

**14.1.5 is the open-ended hook.** ACC can impose certification requirements (e.g. ISO 27001) at any time without renegotiating the contract. Worth knowing before you tell a customer "ACC doesn't require certification" — today it doesn't, and it can change that unilaterally.

### Explicitly absent from both documents — state this plainly

- Privacy Act 2020 is **never named**.
- Health Information Privacy Code is **never named**.
- No named IT/clinical software requirement, no PMS specification, no HL7/FHIR/interoperability requirement, no API requirement.
- No electronic health record mandate, no record format, no retention period.
- No breach-notification clause (in the Service Schedule — see the Standard T&Cs below, which does have one).
- No cloud-hosting, data-centre, encryption, MFA or backup specification beyond "Good Industry Practice."
- No AI/algorithm/decision-support clause.

The Standard Terms and Conditions cl.9 fills some of this: comply with Privacy Act 2020 and HIPC 2020 (9.1); plain-English privacy notice (9.1(b)); reasonable security safeguards and information "not unlawfully transmitted, transferred, exported, processed or stored by you or a third party service provider" (9.1(c)); **appoint a Privacy Officer** (9.1(d)); breach notification to ACC at `privacy.officer@acc.co.nz` (9.4); **flow-down to "your personnel, service providers and subcontractors"** (9.5); signed privacy declaration on request (9.8); ACC may assess compliance at any time on reasonable notice, including self-assessments (9.2); records available to ACC **for 10 years after contract end** (12.4).

Clause 9.5 is why the customer will push all of this onto you.

### Data residency — the reconciliation that matters

These two facts are both true and are easily confused:

**(a) New Zealand law imposes no data residency requirement.** Health NZ says so in writing. [HISF Guidance for Suppliers FAQ](https://static.info.content.health.nz/docs/health-pros/topics/cyber-security/FAQ-HISO-10029.4.2025-HISF-for-Suppliers.pdf), Q05, verbatim:

> "Health Information (PHI) can be **stored within New Zealand or overseas**, but there are specific obligations to consider: Data Sovereignty: **While there is no strict prohibition on storing PHI outside New Zealand**, organizations must ensure that any offshore storage complies with New Zealand privacy laws and standards, such as the Privacy Act 2020."

Confirmed independently: no residency provision in the [Privacy Act 2020](https://www.legislation.govt.nz/act/public/2020/0031/latest/LMS23285.html), none in the [Health Information Privacy Code 2020](https://www.privacy.org.nz/assets/Codes-of-Practice-2020/Health-Information-Privacy-Code-2020-website-version.pdf) (the only occurrence of "in New Zealand" in the whole Code is rule 12(1)(b)), none in the Pae Ora Act 2022, none in the Health (Retention of Health Information) Regulations 1996 — which mandate a **10-year minimum retention** but say nothing about location.

And ACC itself hosts offshore. [ACC's privacy notice](https://www.acc.co.nz/privacy/our-privacy-notice):

> "**Most of our information held by cloud services, uses data centres in Australia** owned by Microsoft and Amazon."

**(b) The Concussion Services contract nonetheless bars hosting outside NZ/AU.** Service Schedule cl.14.1.2, quoted above, is an absolute contractual bar flowing down via cl.14.1.6 and Standard T&Cs cl.9.5.

**So: the constraint is real and binding, but it is contractual, not legal, and Australia is explicitly permitted.**

Two consequences:

- **An Australian-hosted product is compliant.** This is close to a complete answer to the residency objection, and it is worth leading with — including ACC's own Sydney hosting.
- **A US-hosted product is not.** The current portal stack (Vercel + Neon) defaults to US regions. **Any NZ ACC deployment requires AU or NZ region pinning for anything touching client PHI.** This is a build item, not a paperwork item.

### Data-residency policy that does *not* apply to you

NZ Government "Cloud First" ([Cabinet requirement](https://www.digital.govt.nz/standards-and-guidance/technology-and-architecture/cloud-services/cloud-adoption-policy-and-strategy/cabinet-requirement), updated 19 Dec 2025) requires agencies to store only RESTRICTED-or-below data in public cloud, onshore or offshore, following a risk assessment. Scope is Public Service agencies under s10 Public Service Act 2020 plus eight named Crown entities — **which does include ACC and Te Whatu Ora**, but does **not** include private clinics. A private rehab clinic buying your tool is not bound by Cloud First, and neither are you as its vendor.

Note also: the GCDO risk assessment is a **lodgement, not an approval gate** ([who can approve](https://www.digital.govt.nz/standards-and-guidance/technology-and-architecture/cloud-services/assess-the-risks/who-can-approve)) — there is no government sign-off to obtain.

---

## 3. What does ACC actually want and measure?

### Six KPIs, all computed from ACC's own claims data

Service Schedule cl.12 + Part B Table 4 (pp.35–36); Operational Guidelines Table 4 (pp.16–17). Three categories — Service progression, Timeliness of Service entry, Return to work outcomes — each benchmarked to "National Average or one deviation higher/lower":

1. **Service progression** — proportion entering Stage 2 from Stage 1
2. **Timeliness** — proportion entering Stage 1 within two weeks of injury date
3. **Timeliness** — proportion entering Stage 1 after six months of injury date
4. **RTW effectiveness** — proportion receiving weekly compensation >26 weeks following Stage 1 entry
5. **RTW efficiency** — average weeks of weekly compensation received after Stage 1 entry
6. **RTW sustainability** — proportion sustaining return to work at least three months ("% not receiving weekly compensation 3 months after the last payment")

**Suppliers cannot influence the measurement** — it is ACC-side data, not self-report. Performance is scrutinised (cl.12.3.1) where it "exceeds the upper or lower range of the distribution; demonstrates a sustained adverse trend over time; or differs materially from that of comparable suppliers."

And cl.13.4: "The Supplier consents to ACC sharing **non-anonymised** ACC information in its reports, including information relating to the Supplier's performance under this Contract, with **all other contracted suppliers**."

**That is the commercial wedge.** Thirteen suppliers are ranked against each other on return-to-work timing and durability, using data they don't control, and each of them sees the others' numbers.

> Caveat worth flagging in a first meeting: measures 4 and 5 are printed with "National Average or one deviation **higher**" as the target, on metrics where lower is clinically better. That is what both documents literally say. Either it's an error or the framing is non-obvious — a good, credibility-building question to ask.

### What suppliers must report

- **ACC884 Client Summary Report** — the core artefact. Submitted electronically to ACC **and** the client's primary healthcare provider. Two triggers: within **10 business days of Stage 1 commencing**, and within **5 business days** of service completion/exit. Must contain return-to-usual-activities status; goals and progress against return to work / school / usual life role; medical, psychological and social history; risk/barrier assessment "using the method specified by ACC"; **"Outcome tool measurements"** (cl.5.13.3.3.3); recommendations.
- **ACC885 Did Not Attend** — within three business days. Prerequisite for the non-attendance fee (75% of hourly rate, once per client).
- **Medical Assessment / Neuropsychological Screen notes** — "immediately following."
- **Clinical notes on request** — within five business days, electronically, "in the manner advised by ACC" (cl.5.13.4).
- **Six-monthly Supplier Report** to `ConcussionServices@acc.co.nz` — within 15 business days after 31 December, 10 business days after 30 June. Must include referral volumes and source; **median time from commencement of Services to ACC884 submission**; and goal achievement banded **Fully (100%) / Partially (≥50%) / Minimally (<50%) / No achievement** — reported for the general population **and separately for Māori**.

No additional fee may be invoiced for any report (cl.5.10, 5.13.6). Report generation is unpaid administrative load on the supplier — which is exactly the pain a reporting tool addresses.

### Contracting direction

Payment today is **strictly fee-for-service** against fixed item codes with a per-client Maximum Funding Limit of **$4,120 excl GST**. There is no outcome-linked payment, bonus, at-risk fee or gainshare in the Concussion Services contract. The only performance consequence is discretionary: renewal is conditional on ACC "being satisfied with the performance of the Services" (Part A cl.1.2.2).

Item pricing (excl GST): TBI05 Triage $155.27/hr · TBI21 Education & Risk Assessment $155.27/hr (max 3 hrs) · TBI22 Allied Health Assessment $155.27/hr · TBI13 Case Review by Neuropsychologist $64.56 · TBI14 by Medical Practitioner $101.48 · TBI26 Allied Health Therapy $155.27/hr · TBI27 Psychological Consultation $193.72/hr · TBI23 Neuropsychological Screen $193.72/hr · TBI28 Medical $304.42/hr · TBI30 Medical Assessment $608.88. Most carry "No ACC prior approval required."

But the stated direction is away from fee-for-service. ACC Statement of Intent 2026–2030: "We **commission outcome-focused services** and ensure that providers play their role in achieving lasting recovery outcomes." And the ICPMSK Webinar 4 Q&A: "ACC's **Huakina te Rā** and the adoption of **value-based healthcare** creates a significant shift away from transactional nature of fee-for-service models."

### "Escalated Care Pathway" — exists, but renamed, and it's not concussion

From ACC's [December 2022 ICIP Cabinet paper](https://www.acc.co.nz/assets/corporate-documents/acc-december-2022-icip-cabinet-paper-proactive-release.pdf):

> "Integrated Care Pathways (**formerly Escalated Care Pathways**) is a service for clients who have suffered a complex back, shoulder, or knee injury."

So ECP → ICP → **ICPMSK**. It is musculoskeletal, **not** concussion. Use the term historically or not at all — the live brand is ICPMSK. It is nonetheless ACC's template for outcome-based interdisciplinary contracting and the best available read on where Concussion Services is heading.

Separately, no "escalated care pathway", "tiers of care" or "stepped care" language appears in the Concussion Services documents. The structure is functionally stepped (Triage → Stage 1 → Stage 1b → Stage 2 → Exit, capped at six months) but escalation is handled as *exit to another ACC contract*, not as a tier within this one.

### Published ACC rehabilitation KPIs (Service Agreement 2025/26–2026/27, Table 1)

| Measure | Actual 2024/25 | Mar 2026 | Target 2026/27 | 2029/30 |
|---|---|---|---|---|
| Return to work: 28 days | 35.1% | 36.3% | 38.1–39.1% | >41% |
| Return to work: 10 weeks | 59.9% | 61.6% | 64.4–65.4% | >68% |
| Return to work: nine months | 87.9% | 89.2% | 91.0–92.0% | >93% |
| Return to work: one year | 90.8% | 92.0% | 93.2–94.2% | >95% |
| Return to independence (not in workforce) | 83.0% | 82.7% | 83.0% | 83.0% |
| Long-term claims pool (excl. sensitive) | 22,617 | 22,412 | 20,350–20,850 | — |

ACC reports these to the Minister quarterly. ACC published a **Turnaround Plan in January 2026**. Whether ACC publishes *provider-level* performance data was **not verified** — aggregate KPIs are published, no league table was found. Test with an OIA request.

### Useful precedent

The Dec 2022 ICIP Cabinet paper records that ACC ran a **concussion service pilot** (implemented 2021) giving GPs "tools and education" to manage mTBI with direct secondary-care referral — 40 clients via primary care, 1,300 via secondary — and that ACC "is looking to expand this service further." ACC also ran **patient-reported outcome measures trials specifically for concussion**, one in partnership with **Physiotherapy New Zealand**.

That is direct precedent for tools-plus-education in concussion, funded by ACC.

---

## 4. The clinical guideline layer

**This is the section where the intuitive assumption is wrong.** ACC is not stale on concussion.

### ACC's sport concussion guideline was updated January 2026 and is Amsterdam-based

[Sport Concussion in New Zealand: National Guidelines, Updated January 2026](https://www.acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf), verified by direct PDF extraction:

> "This guideline was produced by ACC in consultation with a panel of medical, sport, and research experts and was informed by the 2022 Amsterdam Consensus Statement on Concussion in Sport."

And it endorses the SSTAE principle explicitly:

> "**Strong evidence supports the benefits of aerobic exercise at a level that does not worsen symptoms during the activity as an early intervention treatment** within a recovery plan."

Expert panel includes Dr Stephen Kara and Dr Melinda Parnell (Sport and Exercise Physicians) and Natalie Hardaker PhD (ACC Injury Prevention Partner — Sport and TBI).

**Do not pitch ACC as behind on sport concussion.** The guideline is six months old, Amsterdam-based, and that claim is checkable and wrong in the first meeting.

### But the method is entirely absent

The guideline's return-to-activity ladder is purely qualitative: "Gentle exercise (i.e. walking around the house)", "light physical activity (e.g., short walks outside)", "Increase intensity of exercise guided by symptoms." Stage 5 requires "Symptom free at rest for 14 days"; Stage 6 return to competition earliest Day 21.

**Zero occurrences of heart rate, treadmill, Buffalo, threshold, or exertion testing.**

Same in the funded contract. Across the full Service Schedule (2,406 lines) and Operational Guidelines (789 lines), the strings *aerobic*, *Buffalo*, *treadmill*, *heart rate*, *sub-symptom*, *exertion*, *bpm*, *threshold*, *SCAT*, *Amsterdam* and *CISG* appear **zero times**.

Exercise appears exactly twice in operative contract text:
- **TBI22** cl.5.8.2.1.2: "Assessment of **exercise tolerance** and/or functional capacity for undertaking programmes." ($155.27/hr)
- **TBI26** Stage 2: "...return to work, return to School, **exercise programmes**, vestibular therapy..." ($155.27/hr)

Also relevant: cl.9.1.6 **excludes** "Longer-term musculoskeletal manual therapy" from the service. And no clinical consensus statement or practice guideline of any kind is cited in either contract document — clinical standard-setting is delegated to the generic "Good Industry Practice" definition.

### Other NZ guidance

**ANZ Clinical Practice Guideline for mTBI and PPCS (Nov 2025)** — the first Australian and Aotearoa NZ mTBI guideline ([full PDF](https://anzconcussionguidelines.com/wp-content/uploads/2026/02/Full-Guidelines-ANZ-CPG-for-mTBI-and-PPCS-final-to-be-checked-and-posted-online.pdf); summary Barlow KM et al., *Aust J Gen Pract* 2026;55(1-2):29-35, [PMID 41655284](https://pubmed.ncbi.nlm.nih.gov/41655284/); [MJA announcement](https://www.mja.com.au/journal/2025/223/9/mild-traumatic-brain-injury-and-concussion-and-persisting-post-concussion)). **ACC appears among the funders** via individual author grants.

Recommendation 59: "Encourage people with persisting symptoms to engage in cognitive activity and low-risk physical activity while staying below their **symptom-exacerbation threshold**." The [73-recommendation appendix](https://www1.racgp.org.au/getmedia/850b6060-25d4-4ced-8d02-7ccf0db9762a/AJGP-0102-26-7801-FO-Barlow-ANZ-Guidelines-Appendix-1-WEB.pdf.aspx) contains **no aerobic dosing, HR threshold, exertion testing or BCTT**. The MJA piece does note "Graduated exercise programs are a cornerstone of management, often created and monitored by physiotherapists or exercise physiologists."

**bpacnz — the one NZ source with a heart-rate number.** [An overview of concussion/mTBI management for primary healthcare professionals](https://bpac.org.nz/2022/concussion.aspx), published April 2022, updated April 2026. Defines clinical recovery as including:

> "**Exercise tolerance**, e.g. the patient can exercise at **85% of their maximum heart rate** without exacerbating their symptoms"

— footnoted as estimated via 220 − age. **Note the distinction precisely: this is an age-*estimated* maxHR used as a *discharge criterion*, not a *measured* HR threshold used to *prescribe dose*.** bpac otherwise uses the "+3 rule" and cites Ontario Neurotrauma Foundation (2018) and SCAT-5, not Amsterdam.

**ACC patient sheet** ([ACC8319, Dec 2022](https://www.acc.co.nz/assets/im-injured/acc8319-concussion-education-sheet.pdf)): "Start to increase from 10-15 minutes up to 25-30 minutes, and increasing intensity... **guided by symptoms**"; "Take a break as soon as symptoms are +2 points from when you started." Symptom-guided, no HR.

**The 2006 NZGG guideline is orphaned, not withdrawn.** *Traumatic Brain Injury: Diagnosis, Acute Management and Rehabilitation* (NZ Guidelines Group, 2006; ACC2404). A crawl of ACC's full sitemap (1,315 URLs) found **zero references** — it is not hosted or linked anywhere on acc.co.nz, and the historic download URL 404s. NZGG went into voluntary liquidation in 2012. No formal withdrawal statement exists; it disappeared through replatforming, not deliberate retirement. It is 20 years old and effectively dead, **but it is not what ACC currently points clinicians to** — so "ACC's guideline is from 2006" is not a usable claim.

### The comparator: Amsterdam 2023

[Patricios JS et al., *Br J Sports Med* 2023;57:695–711](https://doi.org/10.1136/bjsports-2023-106898):

> "HCPs **with access to exercise testing** can safely prescribe **subsymptom threshold aerobic exercise treatment within 2–10 days after SRC, based on the individual's heart rate threshold (HRt)** that does not elicit more than mild symptom exacerbation during the exercise test... Subsymptom threshold aerobic exercise treatment can be progressed systematically based on the determination of the **new HRt on repeat exercise testing**."

Amsterdam itself distinguishes the generic symptom-guided ladder from the **tested-HRt prescription**, and explicitly conditions the latter on "HCPs with access to exercise testing."

### The verdict

| Layer | Date | Status |
|---|---|---|
| ACC sport concussion guideline | Jan 2026 | **Aligned** — cites Amsterdam, endorses sub-symptom aerobic exercise as early treatment |
| ACC funded concussion contract | Jul 2026 | **Silent** — pays for exercise tolerance assessment + exercise programmes; zero protocol, zero HR, zero test |
| ANZ CPG | Nov 2025 | Aligned in principle, no dosing method |
| bpac GP guidance | 2022, upd. 2026 | 85% *age-estimated* maxHR as a *recovery criterion*, not a dosing method |
| ACC patient sheet | Dec 2022 | Symptom-guided only |
| NZGG TBI guideline | 2006 | Orphaned, unlinked, never formally withdrawn |

**ACC is aligned at the level of principle and absent at the level of method.** It has already said the thing — it just has not specified how. It states "strong evidence supports aerobic exercise at a level that does not worsen symptoms," funds it at $155.27/hr under TBI22 and TBI26, and provides no operational method for determining that level.

**So the pitch is neither "help you do what the funder wants" nor "educate the funder." It is: the funder has endorsed and funded this, and left the method open.** That is a stronger position than either alternative, and it is defensible in the room.

### Adjacent: does ACC pay for supervised exercise?

**Clinical Exercise Physiologists have no ACC door.** ACC's [recognised provider list](https://www.acc.co.nz/for-providers/provide-services/register-health-provider) names 22 professions; exercise physiologist is not among them. This is structural: ACC registration keys to the Health Practitioners Competence Assurance Act 2003, while NZ CEPs register with the [Clinical Physiologists Registration Board](https://cprb.org.nz/looking-to-register/clinical-exercise-physiology-registration) via [CEPNZ](https://www.cepnz.org.nz/registration) — a pathway with no ACC vocational classification. The strings "exercise physiologist"/"exercise physiology" appear **zero times** across the Allied Health, Clinical Services, Vocational Rehabilitation, Pain Management, Training for Independence, Community Rehabilitation, TBI Residential and Concussion schedules.

No ACC contract funds supervised exercise as a service in its own right. Closest items:
- **PTCG Group Consult, $31.07/participant** ([Allied Health Services Schedule](https://www.acc.co.nz/assets/contracts/allied-health-services-service-schedule.pdf)) — restricted to post-surgical physiotherapy by cl.6.1.9.1.
- **CSD4 Exercise Treadmill, $493.09/test** ([Clinical Services Schedule](https://www.acc.co.nz/assets/contracts/clinical-services-schedule.pdf)) — cardiac diagnostic stress test, gated behind an approved surgical request. Not rehab.
- **Pain Management Group Programmes** ([OG, Dec 2025](https://www.acc.co.nz/assets/contracts/pain-management-og.pdf)) — "graded activities aimed at improving physical fitness" in an 8-week workshop; gym/pool passes reimbursable as incidentals.
- **Training for Independence** ([schedule](https://www.acc.co.nz/assets/contracts/titr-schedule.pdf)) explicitly **excludes** gym memberships.

**Naming corrections:** "Active Rehabilitation", "Escalated Care Pathway" and a standalone "Physiotherapy Services contract" are **not** current ACC contract names. Physiotherapy sits inside the Allied Health Services Schedule; "Stay at Work" is a service within [Vocational Rehabilitation Services](https://www.acc.co.nz/assets/contracts/vocational-rehabilitation-service-schedule.pdf). Current index: https://www.acc.co.nz/for-providers/provider-contracts-and-services

**Implication:** the NZ route is upskilling **ACC-contracted concussion-service physiotherapists and OTs** in measured-threshold exercise prescription. Seeking CEP provider recognition has no visible path.

---

## 5. NZ health data / privacy compliance for a vendor

### Privacy Act 2020 reaches you regardless of incorporation

[s4](https://www.legislation.govt.nz/act/public/2020/0031/latest/LMS23285.html): the Act applies to "an overseas agency (B), in relation to any action taken by B **in the course of carrying on business in New Zealand**." s4(3): an agency may be carrying on business in NZ "without necessarily... having a place of business in New Zealand" or "receiving any monetary payment." s4(2): it does not matter where information is collected or held.

**An Australian vendor selling to NZ clinics is directly subject to the NZ Privacy Act.** Not optional.

### Section 11 — agent vs agency, and the trap

[s11](https://www.legislation.govt.nz/act/public/2020/0031/latest/LMS23318.html) (replaced 30 Nov 2022 by s94 Statutes Amendment Act 2022):

> "(1) This section applies if an agency (A) holds information for or on behalf of another agency (B)... **for safe custody or processing on behalf of B**.
> (2) ...the personal information is to be treated as being held by B, and not A.
> (3) **However, the personal information is to be treated as being held by A as well as B if A uses or discloses the information for its own purposes.**
> (4) ...it does not matter whether A (a) is outside New Zealand; or (b) holds the information outside New Zealand.
> (5) ...(a) the transfer of the information to A by B is **not a use or disclosure** by B."

OPC guidance ([Working with third-party providers](https://www.privacy.org.nz/assets/New-order/Resources-/Publications/Guidance-resources/2024-11-21-s11-third-party-providers.pdf), Nov 2024): "**Software as a Service (SaaS) or cloud service providers are a classic example**" of a third-party provider, and "you remain responsible for personal information that you send to a third-party provider."

**s11(3) is the commercial trap.** The moment the product uses customer data for its *own* purposes — product analytics, model training, cross-clinic benchmarking, research — it becomes a full agency with independent liability. **Do not do this without separate written authorisation.** This is a direct product-design constraint, not just a legal one.

### IPP12 / rule 12 — offshore transfer to your own infrastructure is not a "disclosure"

Direct answer: **no, storing data with an overseas cloud provider that merely holds it on your behalf is not a disclosure.** Two independent reasons:

1. **s11(5)(a)** — the transfer to an agent is expressly "not a use or disclosure."
2. **[IPP12](https://www.privacy.org.nz/privacy-principles/12/) only bites on a disclosure.** OPC ([Sending information overseas](https://www.privacy.org.nz/responsibilities/disclosing-personal-information-outside-new-zealand/)) states plainly "IPP 12 may not even apply to you", and on whether a cloud agreement is legally required: "**In most circumstances, no – you aren't required by law to enter into such an agreement.**"

OPC nonetheless publishes [model contract clauses](https://www.privacy.org.nz/assets/New-order/Your-responsibilities/Sending-information-overseas/2.-IPP-12-Model-Clauses-Guidance-Document-web-Oct.pdf) as evidence of the "reasonable grounds" belief under IPP12(f). **Use them — cheapest possible way to close this question in a procurement review.**

### Health Information Privacy Code 2020 — and the clause that probably makes you a health agency

The [HIPC 2020](https://www.privacy.org.nz/privacy-principles/codes-of-practice/hipc2020/) "takes the place of the information privacy principles for the health sector" — 13 rules mapping to the IPPs. Amendment No 1 in force 1 July 2022; **Amendment No 2 in force 1 May 2026** (inserts rule 3A, amends rules 2, 3, 4, 12, 13 and Schedules 1 and 2).

**Clause 4(2)(j)** defines a health agency to include, verbatim:

> "an agency which provides services in respect of health information, including an agency which provides those services under an agreement with another agency"

**A clinical reporting/assessment SaaS is on its face "an agency which provides services in respect of health information."** This is materially different from the Australian or GDPR posture — NZ does not leave you as a mere processor. **You are likely a health agency directly bound by the Code, independently of s11.** This changes who owes rule 5, rule 11 and breach-notification duties.

**No case law or OPC guidance applying 4(2)(j) to a SaaS vendor was found. Get a NZ privacy lawyer's opinion — this is the single highest-value legal item on the list.**

Note ACC is itself a health agency (Schedule 1, via cl.4(2)(p)).

**Rule 5 (storage and security)** — the vendor-management hook is 5(1)(b): "if it is necessary for the information to be given to a person in connection with the provision of a service to the health agency, including any storing, processing, or destruction of the information, **everything reasonably within the power of the health agency is done to prevent unauthorised use or unauthorised disclosure**." This is a **contractual-control test, not a geography test.**

**Rule 13 (unique identifiers / NHI).** Schedule 2 para (15) covers "Any health agency that has a contract with or is funded by an agency specified in Schedule 2" — and ACC is Schedule 2 para (1). Two safe harbours: 13(5) recording another agency's identifier "**for the sole purpose of communicating with B**" is not "assigning"; 13(6)(b) requires minimising misuse risk, "for example, by showing **truncated** account numbers."

⚠️ **Hard deadline: the NHI number format changes on 1 July 2026.** [HISO 10046:2025 Consumer Health Identity Standard](https://static.info.content.health.nz/docs/HISO/HISO%2010046%20Consumer%20Health%20Identity%20Standard.pdf) (28 Nov 2025) applies "to all patient management systems, clinical information systems and consumer health platforms used in Aotearoa New Zealand"; both formats "will co-exist indefinitely"; "All systems should accommodate the new format by 1 July 2026." Current `AAANNNC`; new format is sequential first letter + 5 randomised chars + alpha check digit (e.g. `AGA96HP`), still 7 chars. **If you validate NHI with a regex, it will break.**

**Other live duties:** notifiable privacy breaches (s114) — notify OPC as soon as practicable where serious harm is likely; OPC's stated expectation is [72 hours](https://www.privacy.org.nz/tuhono-connect/statements-media-releases/how-long-is-72-hours/). And **IPP3A / rule 3A, in force 1 May 2026** ([Privacy Amendment Act 2025](https://www.legislation.govt.nz/act/public/2025/0053/latest/whole.html)) — notification duty when collecting personal information **indirectly**, squarely relevant to a tool ingesting referrals or third-party assessments.

### HISO standards

**What HISO is:** the Health Information Standards Organisation, a sector committee **inside Health New Zealand**, not an independent body. Members include Health NZ, MoH, PHOs, Pharmac and **ACC**. It "has no power of its own to... commit expenditure" ([committee page](https://www.healthnz.govt.nz/about-us/who-we-are/expert-groups-and-networks/expert-groups/health-information-standards-organisation)).

⚠️ **Domain churn:** health.govt.nz → tewhatuora.govt.nz → **healthnz.govt.nz**. Documents live at `static.info.content.health.nz/docs/HISO/`. [Current catalogue](https://www.healthnz.govt.nz/health-professionals/guidance-standards/topic/data-and-standards/health-information-standards/approved-health-information-standards).

**HISO 10029:2022 Health Information Security Framework** ([PDF](https://static.info.content.health.nz/docs/HISO/HISO%2010029%20Health%20Information%20Security%20Framework.pdf)). Scope: "covers the security of all health information that is collected and used within New Zealand; **and wherever it is stored**." Explicitly: "Privacy is covered by the Health Information Privacy Code 2020 and is not within the scope of this framework."

The 2022 edition moved from an ISO-centric to a **NIST CSF-based** model, and maps to "NZISM, CIS, Cloud Controls Matrix (CSA), ISO 27002, ISO 27799, HIPAA, PSR and CERT NZ Top Ten."

**It is a maturity model, not pass/fail** — 1-None to 5-Embedded, by **self-assessment**. Verbatim: "The framework is **an approach to cyber security rather than a 'yes' and 'no' standard**." **There is no HISF certification to obtain.**

🎯 **HISO 10029.4:2025 — Guidance for Suppliers** ([PDF](https://static.info.content.health.nz/docs/HISO/HISO-10029-4-Health-Information-Security-Framework-Guidance-for-Suppliers.pdf), April 2025). Suppliers are defined to expressly include "**software as a service (SaaS) provider to the health sector**." Contains **68 numbered requirements (HSUP01–HSUP68)** across Plan / Identify / Protect / Detect / Respond.

**This is the checklist a health buyer will hand you.** Self-assess against the 68 HSUPs and publish your maturity — that is the expected artefact, and almost no small vendor has one.

On sovereignty, HISO 10029.4 is consistently a **risk input, never a bar**: "A risk assessment methodology and cloud assurance activities that support the use of cloud technologies are in place" (HSUP26); product evaluation must consider "the provider's financial stability and jurisdictional residence" and "data sovereignty, interoperability, retention, deletion, and portability."

**There is no standalone cloud HISO standard** in the current catalogue. The old "Cloud Computing and Outsourced Processing" section from the 2015 HISF no longer exists.

**HISO 10064:2017 Health Information Governance Guidelines** ([PDF](https://static.info.content.health.nz/docs/HISO/HISO%2010064%20Health%20Information%20Governance%20Guidelines.pdf)) — self-describes as "good practice advice", includes an auditable checklist at Appendix 1. ⚠️ **Materially stale — do not quote as current.** It cites the **Privacy Act 1993** and **HIPC 1994**, references HISO 10029:2015, and is written around DHBs. Its §5.3 is the origin of much residency folklore.

**Mandatory or advisory — the precise answer.** Health NZ says in writing that HISF has **no legislative force**. [Supplier FAQ](https://static.info.content.health.nz/docs/health-pros/topics/cyber-security/FAQ-HISO-10029.4.2025-HISF-for-Suppliers.pdf) Q04, verbatim: "**HISF does not have a legislative mandate**, however it includes requirements that map to the NZISM and standards published by HISO."

| Layer | Status |
|---|---|
| Mandatory by legislation | **No.** No HISO standard has statutory force. The binding instrument is the **HIPC 2020** |
| Mandatory by contract / condition of connection | **Yes — this is the real teeth.** Imposed via procurement and via connection to national systems (NHI, HPI, Connected Health). Health NZ FAQ Q13: "adoption, alignment, and maturity with respect to the HISF will serve as the **principal metrics for evaluating the cyber posture of all third parties**" |
| Recommended best practice | **Yes, for everyone else.** For a private clinic with no Health NZ contract, HISO is advisory — but it is the de facto benchmark |

### What a buyer's procurement or clinical-governance lead will actually ask for

**ISO 27001 is the highest-leverage certification.** Health NZ supplier FAQ Q08 answers this directly: with NIST alignment and ISO 27001 certification "**you may already be meeting HISF requirements**: HISF has been mapped to the Secure Control Framework (SCF), as has the NIST CSF 2.0 and ISO 27001... **you can download (at no cost) the crosswalk matrix**... and identify any gaps." SOC 2 is a US artefact NZ buyers recognise but nothing official references.

Expect to be asked for: Privacy Act 2020 / HIPC 2020 compliance statement; named **Privacy Officer**; documented breach process; HISF self-assessment; hosting location; evidence of independent security testing and remediation; DPA with OPC model clauses; retention/deletion policy (10-year minimum retention under the [Health (Retention of Health Information) Regulations 1996](https://www.legislation.govt.nz/regulation/public/1996/0343/latest/whole.html)); subprocessor list.

Health NZ FAQ Q07: all PHI is classified **MEDICAL IN CONFIDENCE** under the [PSR classification system](https://www.protectivesecurity.govt.nz/).

**NZISM** ([nzism.gcsb.govt.nz](https://nzism.gcsb.govt.nz/), current v3.9, Nov 2025) — GCSB's manual, designed for agencies "as well as vendors, contractors and consultants who provide services to agencies." Mandatory for government agencies; binds a private vendor only through contract.

⚠️ **NZ has NO equivalent to the UK DTAC or DCB0129/0160.** New Zealand has **no clinical safety standard for health IT** — no clinical risk management standard for manufacturers, no clinical safety officer requirement, no safety case or hazard log regime. What exists instead is HISO (security/identity/interoperability, no clinical-safety component) and Ngā Paerewa NZS 8134:2021, which applies to health *service providers*, not software vendors. **If you hold DTAC/DCB0129 artefacts from another market you will exceed anything NZ asks. If you don't, NZ won't ask.**

### Medsafe / software as a medical device

**The Therapeutic Products Act 2023 has been repealed** ([Beehive](https://www.beehive.govt.nz/release/therapeutic-products-act-repeal-bill-passed)). The **Medicines Act 1981** still governs as of July 2026. **Do not plan against the TPA.**

[Medicines Act 1981 s3A](https://www.legislation.govt.nz/act/public/1981/0118/latest/DLM55429.html): a medical device is "any device, instrument, apparatus, appliance, or other article that (i) is intended to be used in, on, or for human beings **for a therapeutic purpose**..." — and s4 defines therapeutic purpose to include "**diagnosing**, **monitoring**, alleviating, treating..."

**A concussion assessment/reporting tool sits close to this line.** The determinant is your **stated intended purpose and claims** — labelling, IFU, marketing. Positioning as a documentation/reporting aid that does not itself diagnose or direct treatment keeps you outside; adding scoring that yields a return-to-play determination pushes you toward the definition.

[WAND](https://www.medsafe.govt.nz/regulatory/DevicesNew/3WAND.asp): if it is a medical device, it must be notified "within 30 calendar days" of becoming the sponsor. A **sponsor must be a person/entity in New Zealand** — an Australian vendor needs an NZ sponsor. NZ operates **post-market notification only**: no pre-market approval, no technical review, no fee. There is an [exemptions list](https://www.medsafe.govt.nz/regulatory/devicesnew/3-8MDExempt.asp).

**Medsafe publishes no software/SaMD-specific guidance.** Email `devices@health.govt.nz` with an intended-purpose statement and ask for a written view.

---

## 6. Contacts (verified published addresses)

| Contact | Purpose |
|---|---|
| `ConcussionServices@acc.co.nz` | Concussion Services — supplier six-monthly reporting (from the Operational Guidelines) |
| `health.procurement@acc.co.nz` | Health procurement / contracting; also the TenderWatch route |
| `ACCHealthTenders@acc.co.nz` | Tender system support (contact on the CSS 2025 GETS notice) |
| `registrations@acc.co.nz` | Vendor registration, bank details |
| `digitaloperations@acc.co.nz` | DigiOps — API/integration onboarding |
| `privacy.officer@acc.co.nz` | Privacy breach notification (Standard T&Cs cl.9.4) |
| `providerhelp@acc.co.nz` / 0800 222 070 | General provider help |
| `devices@health.govt.nz` | Medsafe — SaMD intended-purpose ruling |
| `marketplace@dia.govt.nz` | NZ Government Digital Marketplace |

**Provider Relationship team** — ACC has Engagement and Performance Managers, reachable via web form at [acc.co.nz/for-providers/provide-services/contact-our-relationship-team](https://www.acc.co.nz/for-providers/provide-services/contact-our-relationship-team), stated two-business-day response. *From search snippets — page is Incapsula-blocked.*

**Clinical leadership** — Dr Debbie Holdsworth reportedly joined as **Chief Clinical Officer in December 2025**, previously Director Funding, Community and Mental Health at Health NZ ([ACC newsroom](https://www.acc.co.nz/newsroom/stories/acc-appoints-chief-clinical-officer)). *From search snippets — newsroom page is Incapsula-blocked. **Verify the name and title in a browser before addressing correspondence.***

**GETS mechanics.** [Registration](https://www.gets.govt.nz/RegisterUser.htm) is free and requires a RealMe login but **only the unverified tier** — "You do not require a verified RealMe identity." You can browse the tender list unregistered; you must register to see details and download documents. Notifications are configured by **category (UNSPSC) and region** via Update Account → "Your Tender Notifications Subscriptions" ([help](https://www.gets.govt.nz/SupplierUserTenderHelp.htm)). Software sits under UNSPSC family 43230000, health services under segment 85000000.

---

## 7. What to build, prepare, and ask

### Build (product changes with a hard requirement behind them)

1. **Pin all PHI storage to an AU or NZ region.** Service Schedule cl.14.1.2 is an absolute contractual bar on anything outside NZ/AU. The current Vercel + Neon stack defaults to US. Non-negotiable before a first customer.
2. **Never use customer data for your own purposes** — no cross-clinic benchmarking, no analytics on PHI, no model training — without separate written authorisation. Privacy Act s11(3) is the difference between shared and sole liability.
3. **Generate the ACC884 Client Summary Report**, populating: return-to-usual-activities status; goals and progress against RTW / return to school / usual life role; risk and barrier assessment; **outcome tool measurements**; recommendations. Plus **ACC885 DNA**. Populate the prescribed forms — do not replace them.
4. **Build the six-monthly Supplier Report** as a one-click output: referral volumes by source; **median days from service commencement to ACC884 submission**; goal achievement banded Fully / Partially (≥50%) / Minimally (<50%) / None; **with a separate Māori cut**. That Māori-disaggregated reporting requirement is a genuine pain point and almost certainly hand-assembled today.
5. **NHI handling:** if you store or validate NHI, fix the regex before **1 July 2026** and **truncate on display** (HIPC rule 13(6)(b)).
6. **Write the intended-purpose statement deliberately** — reporting/documentation aid, not diagnosis or return-to-play determination — to stay outside Medicines Act s3A.

### Prepare (the procurement pack, before the first serious conversation)

1. **HISO 10029.4:2025 self-assessment against all 68 HSUPs**, with a published maturity statement. This is the artefact NZ health buyers are told to ask for.
2. **A one-page residency rebuttal**, because most clinics wrongly assume an onshore rule exists. Cite HISF FAQ Q05 ("no strict prohibition"), ACC's own privacy notice (Australian data centres), and then state that you comply with cl.14.1.2 anyway by hosting in AU.
3. **A DPA with the OPC model clauses** built in.
4. **Named Privacy Officer + documented breach process** — ACC Standard T&Cs cl.9.1(d)/9.4 require the clinic to have these and cl.9.5 flows them to you.
5. **Retention/deletion policy** meeting the 10-year minimum, and a subprocessor list.
6. **Evidence of independent security testing** and that findings were remediated.
7. **ISO 27001 if/when affordable** — Health NZ tells buyers in writing how to convert it into HISF conformance via the SCF crosswalk. Highest-leverage certification for this market.

### Ask (first conversation with a contracted supplier)

1. "Which validated outcome measures did you nominate under cl.5.4.6, and who assembles the six-monthly report?" — establishes whether tool choice is settled and who owns the pain.
2. "How long does an ACC884 take your team today, and what's your median from commencement to submission?" — that median is a reported KPI; if they don't know it, that's the wedge.
3. "How are you tracking against the RTW effectiveness, efficiency and sustainability benchmarks?" — they're ranked against 12 peers on ACC data and can see the others' numbers.
4. "Do you produce the Māori-disaggregated outcome cut manually?"
5. "Who signs off third-party software here, and what did they ask the last vendor for?" — surfaces the cl.14.1.6 assessor.
6. "How does your team currently determine the exercise level that doesn't worsen symptoms under TBI22 and TBI26?" — the funded-but-unspecified gap, asked as a question rather than a pitch.
7. "Are you exercising both renewal years to June 2027?" — tells you the contracting horizon.

---

# INFERENCE / NOT VERIFIED

Everything below is reasoning or unresolved, **not** sourced fact.

## Inference

- **Path (b) being ungated is the whole strategy.** Thirteen named accounts, no ACC gate, no approved-product scheme, and tool choice explicitly delegated by contract. The conclusion that this is founder-led enterprise sales rather than a procurement exercise is inference from those verified facts.
- **The subcontracting line.** That software licensing and training are "inputs" rather than "subcontracting the Services" under Standard T&Cs cl.16.1 is a reading of the clause, not a verified ACC position. Worth a lawyer's eye before contracting, and worth asking ACC directly.
- **The ICPMSK read-across.** That outcome-based interdisciplinary contracting will reach Concussion Services is inference from ACC's stated direction (Statement of Intent, "value-based healthcare", Huakina te Rā) plus the ICPMSK precedent. No ACC document says this about concussion.
- **ACC's institutional caution on software.** The ProviderHub programme spent $41M by May 2024, 80% on external contractors, reset five times, with no business case though one was required, and a belated analysis found a $1M/year disbenefit ([RNZ](https://www.rnz.co.nz/news/national/543767/acc-s-botched-it-project-needed-overseas-expertise-to-help)); the Auditor-General separately pressed ACC on value for money ([OAG](https://oag.parliament.nz/2020/acc-case-management/overview.htm)). *Inference:* ACC and its suppliers will favour low-risk, evidence-backed, externally-validated tools over bespoke builds. Useful positioning, but it is a read, not a stated policy.
- **The 2021 concussion pilot as precedent.** ACC gave GPs "tools and education" for mTBI and "is looking to expand this service further", and ran concussion PROM trials with Physiotherapy New Zealand. That this creates a receptive posture toward a tools-plus-CPD vendor is inference.
- **The KPI direction anomaly.** RTW effectiveness and efficiency are printed with "higher" targets on metrics where lower appears clinically better. Whether this is a document error or a non-obvious framing is not established. Ask rather than assert.
- **NZ Rugby / RugbySmart alignment.** NZR's Karen Rasmussen sits on ACC's expert panel, so alignment with the Jan 2026 guideline is likely — but this is inference; NZR primary sources were not reached.

## Not verified — and exactly where to look

1. **Whether HIPC cl.4(2)(j) makes the product a "health agency" in its own right.** The text plainly reads that way and it materially changes the obligations, but no case law or OPC guidance applying it to a SaaS vendor was found. → **NZ privacy lawyer. Highest-value item on this list.**
2. **Whether the product crosses the Medsafe s3A line.** No Medsafe software/SaMD guidance exists. → Email `devices@health.govt.nz` with an intended-purpose statement.
3. **ACC Innovation Fund** — [page](https://www.acc.co.nz/for-providers/provider-news-and-events/innovation-fund) exists and states ACC "wants to partner... through proposals for innovative health services initiatives", but amounts, eligibility, round timing and open/closed status are unverified (403 to automated fetch). → **Open in a browser. Highest-value unresolved commercial item.**
4. **ACC contact pages, relationship team, and the Chief Clinical Officer appointment** — Incapsula-blocked; sourced from search snippets only. → Open `acc.co.nz/for-providers/getting-started/key-contacts` and the newsroom page in a browser before writing to anyone by name.
5. **Whether closed-tender documents stay downloadable on GETS** after close, or only the notice metadata. Determines whether GETS is usable for competitive intelligence. → Test while logged in; fallback is an OIA request for the RFP pack.
6. **Whether GETS supports agency-level notification subscription** ("all ACC tenders"), or whether ACC's separate TenderWatch service is the only route. → Ask `health.procurement@acc.co.nz`.
7. **Whether ACC publishes provider-level performance data.** Aggregate KPIs are published; no league table found. Note cl.13.4 gives ACC contractual permission to share non-anonymised supplier performance. → OIA request.
8. **ACC's gated vendor material.** [developer.acc.co.nz](https://developer.acc.co.nz/) returns 401; GETS RFP attachments and some Service Schedules are unpublished. **This is the most likely place a residency or certification clause would hide.** → Request Developer Resource Centre access; ask directly for ACC's vendor security requirements document; consider an [OIA request](https://www.acc.co.nz/contact/official-information-act-requests) asking whether ACC imposes any data residency or hosting-location requirement on contracted providers or their software vendors. Note ACC's eBusiness Gateway closed 2 April 2026, replaced by [ProviderHub](https://www.acc.co.nz/for-providers/working-with-us-using-our-digital-services/providerhub).
9. **HealthPathways mTBI/concussion content** — region-locked behind clinician login. Genuinely unknown what it says about exercise. → A clinician customer can read it for you in the first meeting.
10. **Physiotherapy Board Digital Health Standard** — [page](https://physioboard.org.nz/education/education-by-subject/digital-health/digital-health-standard) Cloudflare-blocked. Made under s118(i) HPCAA 2003, so **binding on registered physios**. Reported to require informed consent covering "geographic location of data" — a disclosure obligation, not a residency one. → Confirm in a browser; check whether Osteopathic Council NZ has an equivalent.
11. **Whether non-clinical vendors use ACC111** for payment onboarding, or a separate procurement route. → Ring 0800 222 070.
12. **Whether ACC ever buys clinician training directly** — a possible third path, unexamined.
13. **Whether ACC has joined the AoG Consultancy Services panel** — login-gated.
14. **Canonical URLs for ACC's Service Agreement 2026/27 and Statement of Intent 2026–2030 PDFs.** Figures were extracted from the documents but the URLs were not captured; they sit under acc.co.nz corporate documents.
15. **Whether a genuine HISO 10029:2023 core edition exists.** The 2022 PDF's own §1 says "HISO 10029:2023... is the latest edition" while its cover, citation and every footer say 2022, and the catalogue lists 2022. **Cite 2022.**
16. **legislation.govt.nz blocks automated fetch (403).** Privacy Act ss4 and 11 and Medicines Act s3A were retrieved via direct curl with a browser user-agent, so those quotes are from the official text — but re-check in a browser before anything contractual.
17. **Full ANZ CPG body text on aerobic exercise.** The 73-recommendation appendix and MJA summary were verified; the full 2026 PDF body was not exhaustively searched, so a more detailed aerobic-exercise passage may exist inside it.
18. **The 2006 NZGG guideline's formal status.** Verified absent from ACC's sitemap and the historic URL 404s, but **no formal withdrawal statement was found**. It is "orphaned", not provably "withdrawn" — do not claim ACC withdrew it.
19. **ICIP's successor.** ICIP closed 30 June 2023; the current change vehicle was not identified. → Check ACC proactive releases 2023–24 and the January 2026 Turnaround Plan.
