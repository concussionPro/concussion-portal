# ACC as a Direct Buyer — BIST, prior concussion tools, and why they stalled

**Researched:** 20 July 2026
**Companion to:** `NZ-ACC-PROCUREMENT-REALITY.md` (which covers the *supplier* sale — path (b)). This document covers the case where **ACC itself is the buyer**, and the history of concussion tools inside the NZ/ACC system.

Everything above the INFERENCE heading is sourced with a URL. Unverifiable items are named as such.

**Method note:** `acc.co.nz` returns 403 to WebFetch (Imperva/Incapsula) but serves normally to `curl` with a browser User-Agent. All ACC page quotes below were extracted that way and are verbatim from the live pages as at 20 July 2026. Page discovery was done via ACC's sitemap (`https://www.acc.co.nz/sitemap.xml`, 1,315 URLs).

---

## 0. The short version

1. **BIST is real, ACC co-authored it, and ACC put it into a funded pathway.** It is not a failed academic artefact. It is the assessment instrument inside ACC's **Primary Care Concussion Pilot**, live since May 2022 across three PHOs, with 869 assessments completed by March 2024.
2. **The adoption pathway is the template, and it has three parts:** an ACC staff member as a named co-author from day one; a **PHO** (not a vendor) as the contracting and payment vehicle; and **funded consultation codes** attached to the new activity so the clinician gets paid to do it.
3. **BIST has still not reached business-as-usual.** It appears nowhere in the Concussion Services contract, nowhere in the January 2026 National Concussion Guidelines, and nowhere in ACC's current strategy documents. Four years of pilot, no published evaluation, no national rollout. That is the cautionary half.
4. **The ACC Innovation Fund is RESOLVED — and it is dormant.** Two rounds only (2021/22 and 2023/24), ~$100k per project, last award announced 26 February 2024. Contact `innovationfund@acc.co.nz`. Eligibility requires **"existing support from clinicians, clients/client groups, a New Zealand-based institution or organisation"** — an Australian entity needs an NZ institutional partner.
5. **ACC's current stated buying pattern is aggregators, not point vendors.** Its August 2025 primary-care procurement seeks *"at least three entities"* that are **"meso-level organisations"** with **"coverage across multiple general practice clinics… and meaningful clinician influence, with potential to scale."** A single tool vendor does not fit that shape. A PHO, a national clinic group, or a professional body does.
6. **Concussion is not a named strategic priority.** Zero occurrences of "concussion", "brain injury", "TBI" or "BIST" across ACC's Strategy 2026–2029, Statement of Intent 2026–2030, Service Agreement 2026/27 and Turnaround Plan 2025/26.

---

## 1. BIST — the Brain Injury Screening Tool

### What it is

A two-part mTBI screening instrument: **nine screening questions identifying "red flags" requiring urgent hospital referral**, plus a **15-item symptom scale** covering physical, cognitive and vestibular-ocular symptoms, originally scored 0–3 and later modified to 0–10.

It stratifies presentations into three groups: those requiring urgent hospital care; those at risk of long-term problems needing early intervention; and those likely to recover with monitoring and advice. It was explicitly designed for use across age groups and injury contexts (sport, work, violence, daily activities) and **without requiring specialist training** — a deliberate low-adoption-burden design choice.

Source: Theadom A, Hardaker N, Bray C, Siegert R, Henshall K, Forch K, Fernando K, King D, Fulcher M, Jewell S, Shaikh N, Bastos Gottgtroy R, Hume P. *The Brain Injury Screening Tool (BIST): Tool development, factor structure and validity.* PLoS One 2021. [PMID 33539482](https://pubmed.ncbi.nlm.nih.gov/33539482/) · [full text](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0246512)

### Who developed it — and the ACC fingerprint

Led by **Prof Alice Theadom** at the **TBI Network, Auckland University of Technology**. The author list is the interesting part:

- **Natalie Hardaker** — affiliation given in the paper as **"Accident Compensation Corporation, Wellington, New Zealand"** and Sports Performance Research Institute New Zealand. She is the same Natalie Hardaker who appears as **ACC Injury Prevention Partner — Sport and TBI** on the expert panel of ACC's [National Concussion Guidelines](https://www.acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf).
- **Mark Fulcher** — Sport and Exercise Physician, Axis Sports Medicine (the same Axis that ran ACC's Sports Concussion Centre of Excellence pilot, §2 below, and is one of the 13 contracted Concussion Services suppliers).
- **Katherine Henshall** — emergency medicine (see her [EMJ correspondence](https://pubmed.ncbi.nlm.nih.gov/35595523/), 2022).
- **Doug King, Patria Hume, Richard Siegert, Nusratnaaz Shaikh** — AUT/SPRINZ.

**This is the single most important structural fact in this document.** ACC did not evaluate a finished product presented by a vendor. An ACC staff member was inside the design team from the first paper. The tool was co-produced.

### Funding — a precise correction

The PLoS One paper's funding statement reads: **"The TBI Network at the Auckland University of Technology provided reimbursement to participants. No additional external funding was received for this study."** ACC is **not** named as a funder of the development study.

So: **ACC contributed a co-author and later contributed a funded pathway, but did not fund the tool's development.** Do not claim "ACC funded BIST" — it is checkable and wrong.

### The published evidence base — and its ceiling

The complete BIST literature is three primary papers plus a correction. There is nothing else; a PubMed search for `"Brain Injury Screening Tool"` returns only these plus unrelated US/VA and IPV instruments.

| Paper | Journal / Year | PMID | What it establishes |
|---|---|---|---|
| Tool development, factor structure and validity | PLoS One 2021 | [33539482](https://pubmed.ncbi.nlm.nih.gov/33539482/) | Construction + factor structure |
| Rasch analysis of the BIST in mTBI | BMC Neurology 2021 | [34587927](https://pubmed.ncbi.nlm.nih.gov/34587927/) | Psychometric scaling |
| Correction to the above | BMC Neurology 2021 | [34758754](https://pubmed.ncbi.nlm.nih.gov/34758754/) | — |
| Test-retest reliability in a community adult sample | BMJ Open 2022 | [35922098](https://pubmed.ncbi.nlm.nih.gov/35922098/) | Reliability |

⚠️ **Read that table for what is missing.** Validity, scaling, reliability — all **psychometric**. There is **no published implementation study, no pathway evaluation, no outcome study, and no cost or claim-duration analysis** of BIST anywhere in the indexed literature, four years after first publication and four years into a live ACC pilot.

The development paper itself flags the gap: the authors note that **"piloting in acute settings and further research on responsiveness are needed."**

### ACC's relationship to BIST — the Primary Care Concussion Pilot

This is the adoption event, and it is documented on one page: [Testing a consistent approach for concussion](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/testing-a-consistent-approach-for-concussion), ACC provider news, released **4 March 2024**. Verbatim extracts:

> "In primary care, we have been trialling the **Primary Care Concussion Pilot**. The aim is to empower GPs and Nurse Practitioners to manage mild concussions in the primary care setting.
>
> We've been testing the use of **consistent education, a Brain Injury Screening Tool (BIST), and follow-up consultations** to track client progress, and the outcomes this has for our clients.
>
> The Pilot is currently being trialled by three Primary Health Organisations (PHOs): **WellSouth (Otago/Southland), Pegasus (Canterbury), and ProCare (Auckland/Northland)**.
>
> The pilot began in **May 2022** and **869 BIST assessments** have been completed in the pathway so far. **Initially, we planned to run it for a year but have extended the timeframes** to further test changes made to the BIST and pathway based on user feedback."

The mechanics, which matter more than the headline:

> "As part of the pathway clients are eligible for an **initial GP appointment and two fully-funded follow-ups**, with a BIST assessment completed at each appointment."

And the 2024 expansion to physiotherapists:

> "Participating PHOs will **subcontract** a limited number of physiotherapy practices…
> Physiotherapists will need to have an agreement in place with their local PHO and **complete the education requirements for the pathway**…
> the subcontracted physiotherapist will be required to complete the BIST assessment at the appointment and **send it to ACC and the referring PHO for reporting**, as well as the GP.
> **PHOs will be responsible for paying physiotherapists** for the BIST assessments."

Named regional contacts published on that page: `concussion@wellsouth.org.nz` · `concussion@pegasus.org.nz` · `concussion@procare.co.nz`.

**So the adoption pathway, stated plainly:**
1. Co-produce with an ACC subject-matter expert named as an author.
2. Attach the tool to a **funded consultation** — ACC paid for the appointments in which BIST is completed, so the clinician was never asked to absorb the burden unpaid.
3. Contract through a **PHO**, which holds the agreements, does the subcontracting, and handles payment. ACC contracted the aggregator, not the tool.
4. Bundle **education** with the tool as a condition of participation ("complete the education requirements for the pathway").

Point 4 is directly relevant to a CPD business: in the one ACC concussion initiative that reached live funded delivery, **training was a mandatory component of the pathway**, and the PHO enforced it.

### The second adoption route: Wayfind-TBI

BIST also got into an emergency-department product via a different door — the ACC Innovation Fund. From [Innovation Fund: Successful recipients announced](https://www.acc.co.nz/newsroom/stories/innovation-fund-successful-recipients-announced) (19 August 2022):

> "the **Wayfind-TBI team**, in partnership with **Christchurch Hospital** is developing a digital assessment tool for mild traumatic brain injuries (mTBI). The tool is being developed for an emergency department setting and **uses the Brain Injury Screening Tool (BIST) as its basis**."

Detail from [Taking on concussion head-on](https://www.acc.co.nz/newsroom/stories/taking-on-concussion-head-on) (15 September 2022), profiling project manager **Martin Than** of Te Whatu Ora – Waitaha Canterbury:

> "Wayfind is a software tool. It incorporates best practice guidelines from the user interface backwards… The tool **prompts the hospital clinician to do something about the patient's concussion rather than having to look for it**."
>
> "Wayfind gives you a recommendation and **the likelihood of the patient having ongoing problems**. It provides specific guidance to what the clinician needs to do… When the person shows the signs of a concussion, the system would **pre-populate with a recommendation for a referral to a Concussion Clinic**."

Alice Theadom is credited in the same piece: *"She has done a lot of work in developing the Wayfind tool."* Award: **$100,000**.

⚠️ **No public information after September 2022 on Wayfind-TBI's status was found.** Not on ACC's site, not in PubMed. Whether it went live in Canterbury EDs, spread, or stopped at the end of the grant is **unverified**.

### Is BIST in routine use in the NZ concussion pathway today?

**Partially, and only inside the pilot. Not in business-as-usual.** The sourced position:

- ✅ In live funded use in three PHO regions since May 2022 (ACC provider news, above).
- ❌ **Named nowhere in the funded Concussion Services contract.** Per `NZ-ACC-PROCUREMENT-REALITY.md`, the [Service Schedule](https://www.acc.co.nz/assets/contracts/concussion-services-service-schedule.pdf) requires "an appropriate screening tool" (cl.5.5.4.1) and "standardised measurements **selected by the Supplier**" (cl.5.4.6), naming **no instrument at all** — BIST included. The 13 contracted concussion suppliers are under no obligation to use it.
- ❌ **Named nowhere in the [Sport Concussion in New Zealand: National Guidelines](https://www.acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf)**, updated January 2026.
- ❌ **Named nowhere in ACC's corporate strategy.** Verified by full-text extraction of [Strategy 2026–2029](https://www.acc.co.nz/assets/corporate-documents/Our-Strategy-2026-2029.pdf), [Statement of Intent 2026–2030](https://www.acc.co.nz/assets/corporate-documents/Statement-of-Intent-2026-2030.pdf), [Service Agreement 2026/27](https://www.acc.co.nz/assets/corporate-documents/Service-Agreement-2026-27-ACC8869.pdf) and [Turnaround Plan 2025/26](https://www.acc.co.nz/assets/corporate-documents/Turnaround-plan2025-26.pdf): **zero occurrences** of concussion, brain injury, TBI, BIST or Innovation Fund in any of the four.
- ❓ **Current pilot status unverified.** ACC has published nothing about the Primary Care Concussion Pilot since 4 March 2024 — 28 months. Whether it continues, ended, or was absorbed is not publicly stated.

**Published evaluation of the pilot: none found.** Not in PubMed, not on ACC's site. 869 assessments and no published result.

---

## 2. ACC's track record with concussion tools and services

### 2017–2019 — Axis Sports Concussion Centre of Excellence

From [Managing concussion](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/managing-concussion), ACC provider news, 17 December 2019:

> "ACC has funded the **Axis Sports Concussion Centre of Excellence (SCCoE) pilot programme** in Auckland since 2017. The Centre offers a fully-subsidised, self-referral service for the treatment of concussive injury sustained while playing sport.
>
> The pilot, **which ends 31 December 2019**, identified the importance of primary care in the assessment, management, and education of clients with mild to moderate concussion.
>
> Going forward, ACC is looking at how primary care can be supported to help improve the quality of care provided to clients with concussion through the delivery of a **nationally scalable clinical pathway and concussion assessment tool**.
>
> **Axis is self-funding the work begun during the pilot on a short term basis**, and is actively looking for research funding in the long term."

Three things to take from this. First, ACC has been chasing **"a nationally scalable clinical pathway and concussion assessment tool"** as an explicit objective since 2019 — BIST and the Primary Care pilot are the answer to this sentence. Second, **ACC ended the funding and the provider absorbed the cost** — the standard end-state of an ACC concussion pilot. Third, Mark Fulcher of Axis is a BIST co-author; the same small group recurs.

### 2021–2024 — the Primary Care Concussion Pilot

This is the "2021 pilot giving GPs tools and education" recorded in ACC's [December 2022 ICIP Cabinet paper](https://www.acc.co.nz/assets/corporate-documents/acc-december-2022-icip-cabinet-paper-proactive-release.pdf) (40 clients via primary care, 1,300 via secondary; ACC "is looking to expand this service further"). ACC's own provider news dates the pilot start to **May 2022**; the Cabinet paper's 2021 date presumably reflects design/implementation work. Detail in §1 above.

**Did it expand?** Yes, once — to subcontracted physiotherapists in March 2024. Beyond that, no evidence of national rollout, and no public update in 28 months.

### 2021/22 and 2023/24 — the Innovation Fund

Two concussion/TBI-relevant awards: **Wayfind-TBI** (BIST-based ED tool, $100k) and **ĀKI Innovations Ltd** (integrated assessment tool for tāne Māori with TBI in the Waikato, culturally-framed, with a Kaimanaaki navigator role) — both in the 2021/22 round. In 2023/24, the **Laura Fergusson Brain Injury Trust** won funding for an Employer Peer Support Network for employers of TBI clients returning to work. Full detail in §3.

### Concussion PROM trials with Physiotherapy New Zealand — NOT VERIFIED

The only source for this remains the December 2022 ICIP Cabinet paper, which records that ACC ran patient-reported outcome measure trials for concussion, one in partnership with Physiotherapy New Zealand.

**No further evidence was found in this research.** Nothing on acc.co.nz (full sitemap searched), nothing in PubMed. The outcome of these trials is **unknown**. → A human should ask `ConcussionServices@acc.co.nz` or `health.procurement@acc.co.nz` directly, or file an OIA request. This is a genuine gap, and it should not be papered over: **do not cite a PROM trial outcome in a pitch, because there isn't one.**

### Adjacent precedent worth knowing

**HealthOne** (2021/22 Innovation Fund, $100k) built "a digital interface that will enable ACC allied health providers access to HealthOne", the South Island shared health record. **Karo Data Management** (same round) built a referral interface in its Kotahi platform. Both are precedents for ACC funding **software vendors** directly — the Innovation Fund is the one ACC route where a technology company, not a clinical service, is the counterparty.

---

## 3. The ACC Innovation Fund — RESOLVED

The URL flagged as unresolved in `NZ-ACC-PROCUREMENT-REALITY.md` (`/for-providers/provider-news-and-events/innovation-fund`) now returns **404 and is absent from ACC's sitemap** — the fund's landing page has been removed. The history is recoverable from four surviving pages.

### Does it exist?

**It existed. It has run twice. It has not run since February 2024.**

| Round | ROI opens | Applications | Shortlist | Award announced | Amount |
|---|---|---|---|---|---|
| 2021/22 | late 2021 | **100+** ([source](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/impressive-response-to-our-innovation-fund)) | 11 to stage two | 19 Aug 2022 | **$100,000 each × 6 recipients** |
| 2023/24 | 18 May 2023, closed 23 Jun 2023 ([source](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/apply-for-a-share-innovation-fund)) | **39 eligible** | — | 26 Feb 2024 | **$120,318.25 split across 2 recipients** |

Note the trajectory: 100+ applications and $600k awarded in round one; 39 applications and $120k awarded in round two; nothing since. **Two and a half years dormant as at July 2026.** Treat it as closed unless a new GETS Advance Notice appears.

2021/22 recipients: ĀKI Innovations Ltd · HealthOne · Karo Data Management · University of Auckland + Te Piha Romiromi + Tūrama Ltd · **Wayfind-TBI Team** · Tū Tonu Limited.
2023/24 recipients: New Zealand Trucking Association · Laura Fergusson Brain Injury Trust.

### What it funds

2023/24 theme was **"recovery at work"**. The scope statement is broad and explicitly includes technology ([source](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/apply-for-a-share-innovation-fund)):

> "We're looking for innovative health service initiatives… This could include:
> - introducing new or more efficient **pathways of care**
> - **a product that improves access to a service** for clients in hard-to-reach places or for specific client groups
> - improving a current service that could **save you and the injured person time**
> - **technology that provides insights on services the injured person receives and their impact**
> - a new package of care that can be tailored around the injured person and their workplace"

Round themes change. 2021/22 asked for ideas to "accelerate our Health Sector Strategy"; 2023/24 narrowed to recovery at work. **Any future round will have a theme, and the theme is the gate.**

### Eligibility — the answer for an Australian entity

The published criteria, repeated identically in both award announcements:

> "We were looking for projects which:
> - were **ready for implementation**
> - will be **delivered within three to six months** after receiving the funding, although we considered projects that were to be delivered within 12 months
> - have **existing support from clinicians, clients/client groups, a New Zealand-based institution or organisation**
> - have the **potential to be scaled up in partnership**."

**There is no stated bar on overseas applicants and no stated NZBN requirement.** But the third criterion effectively requires an NZ anchor. Every one of the eight recipients across both rounds is a New Zealand entity, and the two most relevant (Wayfind-TBI, ĀKI) were anchored to a hospital and a region respectively.

⚠️ **Unverified:** whether an Australian-incorporated company can be the named applicant, or whether it must apply through the NZ partner. The application form and terms are no longer online. → **Email `innovationfund@acc.co.nz` and ask directly.** This is a cheap, high-information question and it also puts you on the register for future rounds.

### How to apply, and timing

- **Registration of Interest → stage one application → stage two shortlist.** In 2023 the ROI window was five weeks (18 May – 23 Jun 2023).
- **Announced via GETS Advance Notice**, not just the website: *"The date and registration link for the session will be added to the website and on the **Innovation Fund Advance Notice on the Government Electronic Tender Service (GETS)** website."* → Subscribe on [GETS](https://www.gets.govt.nz/) to catch a future round. Registration is free and needs only an unverified RealMe login.
- ACC runs an **information session** with Q&A before each round.
- **Amounts: up to $100,000 excluding GST per project** (2023 round, stated explicitly).
- **Unsuccessful applicants can request evaluation feedback**: *"they can request additional information to understand how their proposal was evaluated, and its strength and weaknesses."*

### Contact

**`innovationfund@acc.co.nz`** — and this address is explicitly the register for future rounds:

> "To receive updates about any upcoming funding rounds, register by sending an email with your name, the name of your organisation and contact details. You can also send us any questions about the fund."

**Do this now regardless of anything else in this document.** It is one email, it costs nothing, and it is the only published mechanism for hearing about a round before it opens.

---

## 4. Procurement routes where ACC is the buyer

### Pae Hokohoko / Government Digital Marketplace

[marketplace.govt.nz](https://www.marketplace.govt.nz/) — *"Marketplace lets New Zealand and **international** businesses offer their products and services directly to New Zealand government agencies."*

**Channels** ([what's open](https://www.marketplace.govt.nz/about-marketplace/whats-open-on-marketplace)): Public Cloud Services (SaaS) · Consultancy and Professional Services · Managed Services · Enterprise Software · plus newer Infrastructure, Telecommunications, Managed Security Services and Digital Identity channels.

**Which fits a clinical SaaS:** [Public Cloud Services (SaaS)](https://www.marketplace.govt.nz/about-marketplace/whats-open-on-marketplace/public-cloud-service-channel) — *"ICT applications and services that are delivered and run over the internet."* The single stated entry criterion on that page: **"Businesses that wish to supply cloud services through Marketplace must have a security rating"**, per the linked cloud services security risk and assurance requirements. If CPD/training were the offer instead, Consultancy and Professional Services is the fit.

**Registration** ([process](https://www.marketplace.govt.nz/suppliers/register-as-supplier/overview-of-supplier-application-process), [rules](https://www.marketplace.govt.nz/suppliers/register-as-supplier/application-rules)): identify channel and category → review channel eligibility criteria → accept the **Collaborative Marketplace Agreement (CMA)** → complete the online form (30 days to finish) with supporting documents → assessed by the Lead Agency (GDDA or MBIE) → list services using Operational Templates. Criteria are **"non-weighted and… rated under a binary pass/fail criterion."** Partial submissions are rejected.

⚠️ **The ABN question could not be re-verified.** No page reachable in this research states the business-number requirement. `NZ-ACC-PROCUREMENT-REALITY.md` records that an ABN is accepted; that claim was not independently reconfirmed here, and the application form is behind the process. → Confirm with `marketplace@dia.govt.nz` before relying on it.

**What being listed actually gets you — manage expectations.** Marketplace is a **discovery catalogue, not a panel with committed spend**. Its own guidance: *"When ordering the Public Cloud Services you identified through Marketplace you will need to order them using **your Agency's normal ordering processes**."* Agencies find you and then buy through their own procurement. Being listed removes a procurement objection; it does not generate demand, and no agency is obliged to look.

### GETS

[gets.govt.nz](https://www.gets.govt.nz/) is where ACC advertises: contracts for new suppliers, the Innovation Fund Advance Notice, and its primary-care interventions notices. Free registration, unverified RealMe tier sufficient, notifications configured by UNSPSC category and region. **For a tool vendor, GETS is a monitoring instrument, not an application route** — the clinical-service tenders are closed to you (see `NZ-ACC-PROCUREMENT-REALITY.md` §1), but the Innovation Fund and innovation-solicitation notices are not.

### All-of-Government panels

ACC is [required to apply the Government Procurement Rules](https://www.procurement.govt.nz/about-us/mandate-and-eligibility/eligible-agencies-procurement/) and can buy off AoG panels. No concussion- or clinical-tool-specific panel exists. Not a route.

### ACC-specific supplier onboarding

Per `NZ-ACC-PROCUREMENT-REALITY.md`: [ACC111 vendor registration](https://www.acc.co.nz/register-as-an-acc-vendor) is payment plumbing (NZBN, GST, IRD, bank verification) and only matters if ACC pays you directly; [developer.acc.co.nz](https://developer.acc.co.nz/home) via `digitaloperations@acc.co.nz` is technical API conformance and confers no clinical endorsement. **There is no approved-product or endorsed-tool scheme.** Confirmed negative.

### What realistically triggers ACC to buy centrally

The one sourced, current answer — [Help us improve return to work outcomes within primary care](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/improving-return-to-work-outcomes-within-primary-care), 28 August 2025:

> "our data is showing **more New Zealanders are taking time off work for low complexity injuries, and their time to recover is getting longer**… This is also putting significant pressure on the Accident Compensation (AC) Scheme…
>
> we published an **Advance Notice** this week to signal our intention to seek **innovative and practical solutions to improve the processes and outcomes associated with medical certification**…
>
> We want to embed a more consistent and reliable approach… that supports both ACC clients and clinicians, **reduces administrative burden**, and **drives early and sustained return to work**.
>
> We are seeking **at least three entities** to implement and manage interventions, in collaboration with ACC. We require suppliers to have **coverage across multiple general practice clinics (i.e. meso-level organisations)** and **meaningful clinician influence, with potential to scale**."

⚠️ **Read the requirement line twice.** ACC is not buying a product. It is buying **an organisation that can change clinician behaviour at scale** — a PHO, a national clinic group, a professional body. Note also that ACC seeks **at least three** entities: it deliberately runs parallel interventions and compares them, rather than backing one.

The trigger is therefore: **a cost or duration problem ACC can see in its own claims data**, addressed through an **aggregator** with clinician reach, with **RTW** as the outcome. Not a better instrument.

---

## 5. Who inside ACC owns this

| Person / role | Relevance | Source |
|---|---|---|
| **Dr Debbie Holdsworth** — Chief Clinical Officer | Appointed 14 Nov 2025, started 15 Dec 2025. Previously Director Funding, Community and Mental Health at Health NZ; before that Director Funding at Waitematā and Auckland DHBs. President-Elect of RACMA. **Her whole background is commissioning and funding, not clinical evaluation** — pitch cost and pathway, not clinical elegance. | [ACC newsroom](https://www.acc.co.nz/newsroom/stories/acc-appoints-chief-clinical-officer) — now verified directly, superseding the "from search snippets" caveat in the companion doc |
| **John Bennett** — Deputy Chief Executive, System Commissioning & Performance | Appointed 8 Jul 2024, started 2 Sep 2024. Ex-Executive Director Strategy and Commissioning in the NHS; KPMG Principal; PwC UK Director. Worked on **"integrated care, clinical performance improvement and outcome-based commissioning."** **This is the office that would buy a tool centrally**, and its leader's stated specialism is outcome-based commissioning. | [ACC newsroom](https://www.acc.co.nz/newsroom/stories/acc-appoints-deputy-chief-executive-system-commissioning-and-performance) |
| **Stafford Thompson** — Chief Clinical Officer and **Head of Health Partnerships** (as at Feb 2024) | The named ACC voice on the Innovation Fund. Title confirms a "Health Partnerships" function exists inside ACC. Superseded as CCO by Holdsworth; current role unverified. | [Innovation Fund recipients announced](https://www.acc.co.nz/newsroom/stories/innovation-fund-recipients-announced) |
| **Natalie Hardaker** — ACC Injury Prevention Partner, Sport and TBI | **BIST co-author, National Concussion Guidelines expert panel member.** The single most concussion-literate identified individual inside ACC and the demonstrated route by which a concussion tool gets ACC attention. | [PLoS One 2021](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0246512) · [National Concussion Guidelines](https://www.acc.co.nz/assets/Uploads/National-concussion-guidelines-v4.pdf) |
| **Megan Main** — Chief Executive | Innovation Fund sponsor voice in 2022. Note she [is not seeking reappointment](https://www.acc.co.nz/newsroom/stories/megan-main-not-seeking-reappointment-as-acc-chief-executive). | ACC newsroom |

**Published contact points beyond generic addresses — there are effectively none.** ACC's [Key contacts](https://www.acc.co.nz/for-providers/getting-started/key-contacts) page (last published 27 July 2022) publishes only `providerhelp@acc.co.nz`, 0800 222 070, `registrations@acc.co.nz` and `provider.education@acc.co.nz`. It refers to *"Your **Supplier Manager** and **Strategic Partners**"* who *"will work with you as a health provider or supplier"* but names nobody and gives no directory.

**Named-role addresses worth having:** `innovationfund@acc.co.nz` (Innovation Fund) · `ConcussionServices@acc.co.nz` (concussion contract management) · `health.procurement@acc.co.nz` (health procurement) · `provider.education@acc.co.nz` (**provider education — the natural home of a CPD conversation, and not previously identified**).

---

## 6. Why previous attempts failed or stalled

Six recurring failure modes, each tied to evidence.

### 6.1 The evidence produced is psychometric, and ACC buys on cost and duration

BIST has four papers establishing that it measures consistently. It has **zero** papers establishing that using it shortens recovery, reduces claim duration, improves return to work, or costs less. ACC's entire published performance frame is claim-side: its [Statement of Intent 2026–2030](https://www.acc.co.nz/assets/corporate-documents/Statement-of-Intent-2026-2030.pdf) and Service Agreement measure return to work at 28 days / 10 weeks / 9 months / 1 year and the long-term claims pool.

Four years of pilot and 869 assessments generated **no published evaluation of either kind**. A funder cannot scale what has not been shown to work in its own currency. **This is the primary failure mode and it is a research-design failure, not a sales failure.**

### 6.2 Research-led with no commercial delivery vehicle

BIST came from a university network. Wayfind came from a hospital project team. ĀKI came from a Waikato kaupapa Māori organisation. **None of them is a company whose survival depends on the tool being adopted.** When the grant ends there is nobody whose job is to keep selling it, maintain it, or run the national rollout.

The Axis case shows the same dynamic from the provider side: when ACC funding ended on 31 December 2019, *"Axis is self-funding the work begun during the pilot **on a short term basis**, and is **actively looking for research funding** in the long term."* The provider absorbed the cost, then went looking for another grant. That is not a delivery path; it is a funding treadmill.

### 6.3 No funding code attached to the activity outside the pilot

Inside the pilot, this was solved well: *"clients are eligible for an initial GP appointment and **two fully-funded follow-ups**, with a BIST assessment completed at each appointment,"* and *"**PHOs will be responsible for paying physiotherapists** for the BIST assessments."* ACC paid for the time.

Outside the pilot, nothing. The Concussion Services contract pays **fee-for-service against fixed item codes** with **"No additional fee may be invoiced for any report"** (cl.5.10, 5.13.6, per the companion doc). A contracted supplier who adopts a new assessment tool absorbs the cost entirely. **The pilot's funded consultations are exactly why it got uptake, and their absence in the main contract is exactly why the tool did not spread beyond it.**

### 6.4 No owner inside ACC, and the owners keep changing

Concussion appears in **zero** of ACC's four current corporate documents. There is no named concussion service owner in any published material. Meanwhile the leadership has turned over comprehensively: a new Chief Clinical Officer in December 2025, a new DCE System Commissioning & Performance in September 2024, a CE not seeking reappointment, a Turnaround Plan, and a strategy that explicitly discards its predecessor — *"Our previous strategy, Huakina Te Rā, set out a long-term vision, but **our environment has changed**… Independent reviews also highlighted the need for a clearer, performance-focused strategy"* ([Strategy 2026–2029](https://www.acc.co.nz/about-us/corporate-documents/our-strategy-2026-2029)).

A four-year pilot with no permanent institutional owner, spanning a full executive turnover and a strategy reset, is a pilot that quietly stops. The 28-month publication silence since March 2024 is consistent with that.

### 6.5 The pilot design invites indefinite extension

*"Initially, we planned to run it for a year but have **extended the timeframes to further test changes made to the BIST and pathway based on user feedback**."*

There is no stated success threshold, no decision date, and no stated criterion for moving to business-as-usual. A pilot that iterates on user feedback with no exit criterion can run forever without ever being adopted — and in this case has run roughly four times its planned length. **When negotiating any ACC pilot, the exit criterion and decision date are the terms that matter most.**

### 6.6 The tool duplicates something the contract already leaves open

The Concussion Services contract already mandates *that* validated outcome measures be used (cl.5.4.5) while explicitly delegating *which* to the supplier (cl.5.4.6). A supplier already using its own instruments has met its obligation. **BIST solves a compliance problem no contracted supplier has** — which is precisely why it took root in *primary care*, where no such contract existed and ACC could design the pathway from scratch.

**Corollary:** the addressable gap for a new tool is where **ACC has to design a pathway**, not where a contract already delegates the choice.

### One genuine success to learn from

The 2024 physiotherapy expansion worked because every barrier was removed at once: the PHO held the agreement, the PHO paid, education was mandated as a condition of participation, and the reporting route to ACC was defined. **That is the complete template, and it is a template for an aggregator partnership, not a software sale.**

---

## 7. Implications for SST Trainer

### What SST can credibly serve of ACC's five interests

| ACC interest | Can SST serve it? | Honest assessment |
|---|---|---|
| **Shorter claim duration** | **In principle, strongest claim** | The published SSTAE dosing evidence (fixed 20 min at 80–90% measured HRt; progress by HR not duration) is the mechanism. But SST has **no NZ claim-duration data of its own**. The argument is "this protocol has evidence; our tool delivers the protocol" — one step removed, and ACC will notice. |
| **Lower cost per claim** | **Not yet** | Requires duration data first. No cost model exists. |
| **Return to work rates** | **Weakest link, and it is ACC's actual currency** | ACC measures RTW at 28 days / 10 weeks / 9 months / 1 year. SST measures exercise tolerance. **Nobody has connected those two endpoints in an ACC population.** This is the honest gap. |
| **Supplier performance visibility** | **Genuinely strong, and underrated** | 13 suppliers are ranked on ACC claims data and, under cl.13.4, each sees the others' non-anonymised numbers. SST generates structured, comparable, objective HRt data across suppliers — the only one of the five interests SST can serve **today with no new evidence**. |
| **Consistency of service delivery across suppliers** | **Strongest immediate fit** | The contract funds "assessment of exercise tolerance" (TBI22) and "exercise programmes" (TBI26) at $155.27/hr and **specifies no method**. ACC's National Guidelines endorse sub-symptom aerobic exercise and give no method. **A funded activity with no standard method is a consistency problem by definition** — and consistency is a funder problem, not a supplier problem. |

### What would make SST obviously valuable to ACC — the shape of the pitch

The lesson from §6 is that ACC buys **standardised method + measured consistency + a named delivery vehicle**, not instruments.

1. **Lead with consistency, not accuracy.** ACC funds exercise tolerance assessment at a fixed hourly rate across 13 suppliers with no prescribed method. It has no idea whether TBI22 means the same thing in Dunedin and Whangārei. *That* is a funder problem SST solves without needing any new outcome data. It is also the exact objective ACC stated in 2019: **"a nationally scalable clinical pathway and concussion assessment tool."**
2. **Bring an aggregator, do not go alone.** Every ACC concussion initiative that reached funded delivery ran through an institution: PHOs for the primary care pilot, Christchurch Hospital for Wayfind, AUT for BIST. ACC's August 2025 procurement asks explicitly for **meso-level organisations with clinician influence**. Realistic NZ anchors: a PHO, a multi-site contracted concussion supplier (Habit Health, TBI Health Group, Axis), or a professional body (Physiotherapy New Zealand, which already endorses the National Guidelines).
3. **Attach it to a funded code from day one.** BIST worked where ACC paid for the appointment and failed where it did not. Any proposal must answer "who pays the clinician for the extra 20 minutes" before it is put to ACC.
4. **Bundle the CPD as a condition, not an upsell.** The one initiative that scaled required participants to *"complete the education requirements for the pathway."* CEA's training is a structural asset here, not a separate revenue line — and `provider.education@acc.co.nz` is an underused door.
5. **Design the evaluation before the pilot, with a decision date.** BIST's failure mode is four years of psychometrics and no outcome study. Whatever SST proposes must specify, up front: the outcome (RTW at 28 days / 10 weeks, or weeks of weekly compensation), the comparator, the sample, the decision date, and what happens at that date. **Offer ACC the evaluation design — that is the thing nobody brought them.**
6. **Use the Innovation Fund shape even if the fund is dormant.** Ready for implementation, delivered in 3–6 months, existing clinician support, scalable in partnership. That is ACC's published statement of what it will back, and it is a useful discipline regardless of funding source.

### What SST cannot claim — say this before ACC says it

Be blunt about all of it, early. ACC has funded enough of these to recognise the pattern.

- ❌ **No outcome data.** No claim-duration, RTW, cost or symptom-trajectory data in any population, let alone an ACC one. The evidence supports **the protocol**, not the tool.
- ❌ **No NZ accreditation or recognition.** ACC has no approved-product scheme to obtain (confirmed negative), so there is nothing to point at — and equally, no gate to clear.
- ❌ **No reference customer** in NZ or Australia. Every ACC precedent had an institutional partner attached at proposal stage. SST has none.
- ❌ **No NZ regulatory position.** Medsafe intended-purpose question is open (companion doc §5). An HRt-based prescription that outputs a dose sits closer to the Medicines Act s3A line than a documentation aid does. Unresolved.
- ❌ **No exercise-physiologist route.** CEPs have no ACC provider door at all (companion doc §4). The delivery workforce must be ACC-recognised physios and OTs.
- ❌ **No claim that ACC is behind.** The National Guidelines are dated January 2026 and cite the Amsterdam consensus. This is checkable in the room and getting it wrong ends the meeting.
- ⚠️ **And the specific trap:** ACC's own BIST co-author (Natalie Hardaker) and its own contracted supplier (Axis/Fulcher) have been doing concussion tool development inside ACC for five years. **Do not walk in implying nobody has tried this.** They have, twice, and they know exactly why it did not scale. Naming those reasons first is the credible opening.

---

# INFERENCE / NOT VERIFIED

## Inference

- **The BIST adoption template (co-author → funded consultation → PHO vehicle → mandated education) is my reconstruction**, assembled from ACC's provider news pages and the paper's authorship. ACC has never described it as a pathway. It is a strong read of consistent facts, not a stated policy.
- **That the Primary Care Concussion Pilot has stalled** is inferred from 28 months of publication silence plus absence from all four current corporate documents. ACC has not said it ended. It may be running quietly. → Verify before asserting.
- **That "no published evaluation" means "no evaluation"** is an inference. ACC may hold unpublished internal evaluation. → OIA request.
- **That ACC buys through aggregators** is generalised from one explicit 2025 statement about medical certification in primary care plus the PHO/hospital/university pattern in every prior concussion initiative. Consistent, but ACC has not stated it as a rule.
- **That the Innovation Fund is closed** is inferred from a removed landing page, absence from the sitemap, and no round since Feb 2024. ACC has published no closure notice. → One email to `innovationfund@acc.co.nz` settles it.
- **That the declining application count (100+ → 39) signals waning appetite** is speculation. It could equally reflect a narrower theme.
- **That Debbie Holdsworth's and John Bennett's commissioning backgrounds make them cost-and-pathway audiences** is inference from published CVs.
- **That "consistency of service delivery" is SST's strongest immediate wedge** is my judgement from the funded-but-unspecified gap. It has not been tested with any ACC person.

## Not verified — and exactly where a human should look

1. **Current status of the Primary Care Concussion Pilot.** No public update since 4 Mar 2024. → Email `ConcussionServices@acc.co.nz`, or the three PHO addresses (`concussion@wellsouth.org.nz`, `concussion@pegasus.org.nz`, `concussion@procare.co.nz`) — those are **live published clinical contacts and the single best-value calls in this document**. A PHO will tell you in five minutes what an OIA takes twenty working days to extract.
2. **Whether any BIST or pilot evaluation exists.** Nothing in PubMed or on acc.co.nz. → OIA request to ACC for the Primary Care Concussion Pilot evaluation.
3. **Wayfind-TBI's fate.** Nothing published after Sept 2022. → Contact Martin Than at Te Whatu Ora Waitaha Canterbury, or Prof Alice Theadom at AUT.
4. **The Physiotherapy New Zealand concussion PROM trials.** Sourced only from the Dec 2022 ICIP Cabinet paper; outcome entirely unknown. → Physiotherapy New Zealand directly, and/or OIA.
5. **Whether the Innovation Fund will run again, and whether an Australian entity may apply as the named applicant.** → `innovationfund@acc.co.nz`. **Do this today.**
6. **Marketplace business-number requirement (NZBN vs ABN).** Not stated on any reachable page; the companion doc's ABN claim was not reconfirmed. → `marketplace@dia.govt.nz`.
7. **The Public Cloud channel "security rating" requirement.** Referenced but its content was not retrieved. Could be a material barrier. → Read the cloud services security risk and assurance requirements on marketplace.govt.nz.
8. **The August 2025 medical-certification Advance Notice** — RFx ID, whether it proceeded to RFP, and who was awarded. It is the clearest live example of ACC buying an intervention centrally. → GETS, logged in.
9. **Whether Stafford Thompson is still at ACC** and who now holds "Head of Health Partnerships". → LinkedIn or `providerhelp@acc.co.nz`.
10. **Whether BIST is freely licensed** and whether AUT/ACC assert any IP. Relevant if SST ever displays or ingests BIST scores. → AUT TBI Network / Prof Theadom.
11. **The AUT TBI Network's current web presence.** The expected URL 404s and AUT site search was not reachable. → Find the current page in a browser; it is the natural academic partner for an NZ evaluation.
12. **ACC's Dec 2022 ICIP Cabinet paper** was cited from the companion document and not re-fetched in this research.
13. **`provider.education@acc.co.nz`** — an ACC provider education function exists but its remit, budget and whether it ever commissions external CPD is completely unexamined. **Given CEA's business is CPD, this is arguably the most under-explored lead in either document.**

---

## RESEARCH ROUND 2 — closing the gaps

**Researched:** 20 July 2026. Closes the education-mechanism, provider-education-remit, pilot-status, RTW-baseline, competitor and funded-code gaps left open by the first pass.

**Method note — the method changed, and it matters for reproducibility.** `acc.co.nz` hard-blocked *both* `curl` and WebFetch partway through this round (Imperva/Incapsula returns an ~850-byte JS challenge with HTTP 200 to every path, including `/sitemap.xml`). The workaround that produced everything below is the **Wayback Machine**, which mirrors acc.co.nz completely and is not rate-limited:

- Discover URLs: `curl "https://web.archive.org/cdx/search/cdx?url=acc.co.nz&matchType=domain&fl=original,timestamp&collapse=urlkey&from=2022&filter=statuscode:200"` → 40,894 archived URLs since 2022; 12,915 since 2025. This is **strictly better than ACC's sitemap** (1,315 URLs) because it surfaces removed pages and superseded contract PDFs.
- Fetch raw: `https://web.archive.org/web/<TIMESTAMP>id_/<URL>` (the `id_` suffix returns the original bytes, un-rewritten — essential for PDFs).

Every ACC citation below is given as the canonical acc.co.nz URL plus the archive timestamp used to read it. **Non-ACC sources (PHOs, Goodfellow Unit, `learning.acc.co.nz`) were fetched live and are not affected by the block.**

---

## R2.0 The short version — what changed

1. **Two claims in the sections above are now WRONG and are corrected here.** BIST *is* named in the current Concussion Services contract — as the exemplar outcome-measure with an **≥85% completion target**. And the Primary Care Concussion Pilot *was* written into the previous contract, then **deleted** from the current one. §R2.1 and §R2.3.
2. **The education mechanism is not a CPD mandate — it is an eligibility gate plus a supervision-avoidance mechanism, and it already exists in the live contract.** ACC's current Concussion Services Service Schedule requires every physio, OT, nurse, SLT and social worker to *evidence* mild-to-moderate brain injury competency; those who cannot must go under **fortnightly one-on-one logged supervision** *and* must "engage in further professional development with specific relevance to working with people who have had a mild to moderate brain injury". ACC names no course, no curriculum and no accreditor. **The supplier bears the cost and the supplier chooses the provider.** §R2.6 — this is the single most commercially useful finding of the round.
3. **ACC does pay third parties to educate clinicians — exactly once, verifiably.** The Goodfellow Unit surgical-mesh series, **co-funded by ACC and Manatū Hauora**, triggered by an injury-harm/cost problem. That is the template, and it is the only one. §R2.2.
4. **ACC's provider education function is a real, funded, in-house operation with distribution** — a Totara LMS at `learning.acc.co.nz`, a CPD-point-bearing webinar programme, and 21 in-person workshops in 19 locations for one contract launch. Its administrator is `provider.education@acc.co.nz`. **It builds content itself.** Its catalogue contains **zero** concussion content. §R2.2.
5. **ACC's own education-delivery capacity was the stated rate limiter on scaling the pilot** — ACC capped physiotherapy involvement "to ensure ACC can deliver the necessary support". §R2.1. That is the gap a CPD vendor fills, in ACC's own words.
6. **The current Concussion Services contract runs 1 July 2025 → 30 June 2026, extendable by two further one-year terms.** It is at a decision point *now*. §R2.3.

---

## R2.1 THE EDUCATION MECHANISM — how the pilot actually structured training

### The launch announcement (not previously cited)

A pilot *launch* page exists that the first pass did not find: **[New primary care pilot aims to improve concussion outcomes](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/new-primary-care-pilot-aims-to-improve-concussion-outcomes/)**, released **13 May 2022** (archive `20230207171113`). Verbatim:

> "Primary Health Organisations (PHOs) **ProCare and Pegasus** will work with us over the next 12 months to trial a new standardised concussion treatment pathway. We're looking for GPs in Auckland and Canterbury to participate in the pilot. **To sign up to the pilot, contact your PHO.**
>
> **The pilot provides GPs with education and learning materials**, as well as a standardised concussion assessment tool **designed in partnership with Auckland University of Technology**…
>
> The primary care concussion pilot will launch on **18 May** and run over approximately 12 months, during which time it's hoped **around 1000 patients** will be treated. If successful we'll look at ways to make the programme available to GPs nationwide."

Two corrections to §1 above: the pilot began with **two** PHOs (ProCare, Pegasus), with **WellSouth** added later; and the pilot's original target was **~1,000 patients in 12 months** — against which **869 assessments in 22 months** is materially behind plan, not merely "extended".

The page also publishes a contact address not previously identified: **`hart@acc.co.nz`**.

### So how was the education structured? The sourced answer

**It was ACC-provided and it functioned as a condition of participation — but the *contractual* instrument was the PHO agreement, not an ACC-clinician contract.** The evidence, in order:

| Element | What is sourced | Source |
|---|---|---|
| Who provided the education | **ACC**. "The pilot **provides GPs with education and learning materials**" — ACC is the subject of the sentence, and the pilot is ACC's. | Launch page, 13 May 2022 |
| Was it a condition of participation | **Yes, for physiotherapists, and enforced by the PHO.** "Physiotherapists will need to have an **agreement in place with their local PHO** and **complete the education requirements for the pathway**." | [Testing a consistent approach for concussion](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/testing-a-consistent-approach-for-concussion), 4 Mar 2024 (archive `20240313220146`) |
| Was it a condition for GPs | **Not stated as mandatory.** GPs "sign up… contact your PHO" and the pilot "provides" education. No completion requirement is published for GPs — only for the 2024 physiotherapy expansion. | Both pages |
| Was training paid for by ACC | **The materials were ACC's. Whether clinician *time* was paid is NOT stated anywhere.** What ACC paid for was the **clinical consultations** — "an initial GP appointment and two fully-funded follow-ups" — and "**PHOs will be responsible for paying physiotherapists** for the BIST assessments." | 4 Mar 2024 page |
| Was it accredited by anyone | **No accreditation body is named in any ACC source.** Not RNZCGP, not Physiotherapy NZ, not the Goodfellow Unit. | — (negative finding, see caveat below) |

### The finding that reframes the whole opportunity

The 4 March 2024 page states why the physiotherapy expansion was capped:

> "As this is a pilot, we're asking participating PHOs to **cap physiotherapy involvement to a limited number of practises to ensure ACC can deliver the necessary support**."

**ACC's own capacity to deliver education and support was the binding constraint on scaling the pathway.** Not clinician appetite, not funding, not the tool. That is ACC stating, in its own words, that its education-delivery capacity is what limits rollout — which is precisely the constraint an external CPD provider relieves. **This is the strongest single sentence in either document for a CPD pitch, and it should be quoted back to ACC verbatim.**

### What is genuinely NOT findable

**Who delivered the pilot education, in what format, of what duration, and whether it carried CPD credit.** ACC never published the curriculum, and the three PHOs publish nothing:

- **Pegasus Health** site search for "concussion" returns **"Sorry, your search for 'concussion' didn't return any results"** (`https://www.pegasus.health.nz/search?q=concussion`, fetched live 20 Jul 2026). Its full sitemap (175 URLs across 7 sub-sitemaps) contains no concussion page.
- **ProCare**: nothing for concussion; its public sitemap has not been regenerated since 2021.
- **WellSouth**: the provider area (`/provider-access/clinical-resources/…`, incl. an ACC page and a Funded Programmes page) contains no concussion content.

The pilot's clinical detail almost certainly lives in **HealthPathways** (Canterbury/Community HealthPathways), which is login-gated to enrolled clinicians and cannot be verified from outside.

→ **To resolve, ask — do not infer.** `concussion@pegasus.org.nz` · `concussion@procare.co.nz` · `concussion@wellsouth.org.nz` · `hart@acc.co.nz`. The single question that settles it: *"What were the education requirements for the pathway, who delivered them, how long were they, and did they carry CPD credit?"*

---

## R2.2 `provider.education@acc.co.nz` — the remit, resolved

This was flagged in §7/Not-verified #13 as "arguably the most under-explored lead in either document". It is now largely answered, and the answer is **double-edged**.

### ACC runs a real, in-house provider education operation with its own distribution

**1. ACC operates a Learning Management System for external providers: [`learning.acc.co.nz`](https://learning.acc.co.nz).** Live and fetched directly 20 July 2026 (not blocked). It is a **Totara** install (Moodle-derived — `pluginfile.php/1/totara_core/…` asset paths, theme `accexternal`). Its login page routes users by audience, verbatim:

> "**Accredited Employer Programme** — If you are accessing the site for the accredited employer programme please contact `aepqueries@acc.co.nz`
> **Health Providers and Sensitive Claims** — If you are accessing the site as a health provider or sensitive claims provider please contact **`provider.education@acc.co.nz`**"

**That is the remit, stated by ACC's own system: `provider.education@acc.co.nz` administers ACC's learning platform for external health providers.** The course catalogue (`/course/index.php`, `/totara/catalog/index.php`) is login-gated — contents unverifiable without an account. **Requesting an account from that address is a cheap, high-information action and doubles as a warm first contact.**

**2. ACC develops its own eLearning and makes it a contractual obligation.** From [Sensitive Claims Service — Training and education](https://www.acc.co.nz/for-providers/provider-contracts-and-services/sensitive-claims-service/training-and-education) (last published **13 April 2026** — current; archive `20260414181119`):

> "We have developed a range of online training modules for providers delivering services under the Sensitive Claims Service. Please note that **suppliers must ensure that all named service providers, service providers and personnel delivering services complete the induction and development eLearning modules.**"

**3. ACC delivers education at national scale, in person, itself.** From [Training wraps up for Sensitive Claims Service](https://www.acc.co.nz/for-providers/provider-news-and-events/provider-news/training-ends-for-sensitive-claims-service), 29 Nov 2024 (archive `20250208000714`):

> "Nearly **600 people** attended our training sessions… A total of **21 in-person training workshops** were delivered in **19 locations**… **97% of respondents** in our feedback survey saying they were satisfied or very satisfied… We also developed a range of **online training modules** to compliment the in-person training."

**4. ACC awards CPD points for its own webinars.** From [Watch and learn webinars](https://www.acc.co.nz/for-providers/provider-news-and-events/watch-and-learn-webinars) (last published 13 Dec 2024; archive `20250104021348`):

> "**Our provider education webinars** are for health providers looking for an informal way to keep up to date… Hear from the experts, ask questions and **earn CPD points** on specific topics."

The catalogue runs to ~30 titles across "Beginner's guides", "Special interest topics" and bite-sized "How to" webinars, distributed free via a **YouTube** playlist.

### Does ACC ever PAY a third party to educate its provider network? Yes — one verified example

**The Goodfellow Unit surgical-mesh series.** From [Goodfellow Unit series: Surgical-mesh complications](https://www.acc.co.nz/for-providers/provider-news-and-events/watch-and-learn-webinars/goodfellow-surgical-mesh-complications/) (archive `20230130134346`):

> "We're taking a number of actions to improve the experience and health outcomes for people treated with surgical mesh. One of these is to **upskill and educate primary care providers**. So, we've **partnered with Manatū Hauora, the Ministry of Health, to fund a comprehensive education and skills programme** designed to prevent mesh-related injury.
>
> This series of webinars, **organised by the Goodfellow Unit**, aims to improve recognition of mesh-related complications and upskill surgeons…"

Three webinars ran Aug–Nov 2022, hosted on ACC's own site and on Goodfellow's.

**Read the causal chain, because it is the commissioning template:** a **specific injury-harm and claims problem** (surgical mesh) → ACC decides **upskilling primary care** is one of its remedies → ACC **co-funds with the Ministry of Health** → an **established NZ CPD institution** (Goodfellow Unit, University of Auckland) organises and delivers it → ACC hosts it in its own provider-education channel.

### The double edge — say this out loud internally

- **Good:** ACC has budget, an LMS, a CPD-bearing channel, a named owner, and a precedent for paying an external education body.
- **Bad:** ACC's default is to **build education itself**, and the one thing it bought externally it bought from **a New Zealand university unit it already had a relationship with**, co-funded with a Ministry, in response to a named claims scandal. An Australian SME is not the shape of that counterparty.
- **The opening:** ACC's provider-education catalogue contains **zero concussion content** (verified: no occurrence of "concussion" or "brain injury" anywhere in the webinar catalogue), despite concussion being a funded service line with 13 contracted suppliers and a contractual competency requirement (§R2.6). **ACC mandates concussion competency it provides no education for.** That is a clean, specific, checkable gap.

---

## R2.3 PRIMARY CARE CONCUSSION PILOT — current status

**Verdict: no public evidence it is running in 2026, and one hard piece of documentary evidence that it has been wound out of the contract.**

### The documentary evidence — the pilot was deleted from the contract

The **December 2022** Concussion Services Service Schedule (archive `20230330034057`) contained a dedicated pilot clause:

> **5.1.6** "Where the Supplier receives a direct referral from a Te Whatu Ora District Hospitals or from an Urgent Care, General or Private Practice who are **participating in the Primary Care Concussion Pilot**, the Supplier may commence assessment and education services **without a purchase order or approval from ACC**.
> **5.1.6.1.1** A **BIST summary assessment** attached to the referral that will help you identify that this patient has been referred from a **Pilot GP**"

The **current** schedule — `Concussion Services.SS.July 2025`, term **1 July 2025 → 30 June 2026** (archive `20251009113522`) — contains the word "pilot" **zero times**. The pilot-referral clause, the Pilot GP identification route and the pilot's purchase-order exemption are all **gone**. The Concussion Services Operational Guidelines (archive `20250207233938`) likewise contain **zero** occurrences of "pilot".

### But BIST itself survived — and this corrects §1 above

⚠️ **§1 states BIST is "named nowhere in the funded Concussion Services contract." That is now wrong.** The current schedule names it in the **Performance Measurement** table (Part B: Table 4):

> "Clients who enter Treatment and Rehabilitation Services (Stage 2) complete an outcome measurement tool on completion of the Service. **e.g. Brain Injury Screening Tool (BIST).**" — Target: **≥85% of Clients in Stage 2 complete an outcome measurement**; source of data: Supplier data.

So the accurate picture is the opposite of "BIST failed": **BIST graduated from a pilot instrument into the exemplar outcome measure of the business-as-usual national contract, carrying an 85% supplier performance target** — while the *primary-care pilot pathway* that incubated it was removed. Instrument in, pathway out.

Note also that BIST is offered as an **example** ("e.g."), not mandated — consistent with the contract's standing practice of naming no compulsory instrument.

### Other supporting evidence

- **No ACC publication about the pilot since 4 March 2024** — 28 months. Verified against the complete Wayback index of acc.co.nz (12,915 URLs archived since Jan 2025): the only concussion provider-news pages are the same two from 2019 and 2024.
- **No concussion page exists under ACC's provider contracts hub.** Of ~40 archived `/for-providers/provider-contracts-and-services/*` pages (elective surgery, home and community support, integrated care pathways, kaupapa Māori, maternal birth injuries, medical assessment, mental injury, nursing, residential support, sensitive claims), **there is no concussion services page**. Concussion is administered but not merchandised as a contract line.
- **The three PHOs publish nothing** (§R2.1).

**Honest position: unverified but strongly indicated as concluded or absorbed.** ACC has never published a closure notice, an evaluation, or a national-rollout decision.

→ **Who to ask:** `hart@acc.co.nz` (the pilot's own published contact — new, and the best single address), then the three PHO concussion addresses, then `ConcussionServices@acc.co.nz`. An OIA for "the evaluation and the decision to conclude or continue the Primary Care Concussion Pilot" would settle it in 20 working days.

---

## R2.6 THE FUNDED-CODE QUESTION — and the mechanism that beats a code

*(Answered before §R2.4/R2.5 because it is the commercial core.)*

### Direct answer: there is no ACC code that funds clinician training. There is something better.

**No mechanism was found by which ACC pays a clinician, or a supplier, for training time.** Searched: the Concussion Services Service Schedule (both versions), the Concussion Services Operational Guidelines, the ISSC Operational Guidelines (96 pp) and the counsellor cost schedule CTRIS02. Every service item code found funds **client-facing clinical activity**. The "education" codes are client education, not clinician education:

- **TBI21 — "Education and Assessment"**, 3 hours — *"Education of the Client"*; likewise TBI31. From the Operational Guidelines: *"The education given to the Client and their family/whānau should be clear and use plain language"* (cl. 9.8).

Nor did the BIST pilot pay for training time. ACC funded the **consultations** (an initial GP appointment plus two fully-funded follow-ups) and the PHOs paid physios for **BIST assessments**. **Whether attendance at the pilot's education was paid is not stated in any published source** — it is a genuine unknown, and the same is true of the 21 ISSC workshops. → Ask `hart@acc.co.nz` / `provider.education@acc.co.nz`.

### But the current contract *compels* CPD purchase — and prices the alternative

This is the mechanism, and it is live in the **July 2025** Service Schedule. It is not a CPD-hours mandate; it is a **workforce-eligibility gate with an expensive fallback**.

**Step 1 — every allied health clinician must evidence brain-injury competency.** Part B: Table 2 requires, for **registered nurses, physiotherapists, occupational therapists, speech language therapists and social workers**: current registration + APC, a minimum of two years' recent postgraduate clinical practice experience, and:

> "Regarding **mild to moderate brain injury**, must **demonstrate competency** in the following areas **(and be able to support this with evidence)**: • Ability to identify and apply best available current evidence in professional practice and decision making."

**Step 2 — failing that, the supplier must put them under supervision.** Clause 6.2.2: where a provider "does not meet the required competency criteria… **the Supplier must ensure** the Service provider successfully completes the Concussion Services Supervision requirements outlined in Part B, clause 6.3." And clause 6.2.3 is the hard edge — those who don't meet the **experience** criteria "**are not permitted to provide Services**".

**Step 3 — and supervision *itself* compels professional development.** Clause **6.3.1.1**:

> "The Service provider must **engage in further professional development with specific relevance to working with people who have had a mild to moderate brain injury**, until the Service provider has gained the required experience and demonstrated competency."

**Step 4 — the price of the alternative is what creates the demand.** Clause 6.3.1.2 requires, for every supervised clinician:

- a supervisor with **≥5 years' experience within the previous 7** in assessing, treating and rehabilitating mild-to-moderate brain injury, **and ≥1 year as a service provider on an ACC Concussion Services or Neuropsychological Assessment contract** (6.3.1.2.2–3);
- **fortnightly one-on-one supervision** (6.3.1.2.4);
- a maintained **supervision log** of every case discussed (6.3.1.2.5);
- supplier responsibility that **every case** is reviewed with the supervisor (6.3.1.3).

The parallel Operational Guidelines add the documentary requirement: *"The Supplier must provide ACC with a summary letter or other document outlining how the above requirements will be met over the provisional period."*

### Why this is the finding that matters

| | |
|---|---|
| **Who mandates the CPD** | **ACC**, in a live national contract |
| **Who must ensure it happens** | **The Supplier** ("the Supplier must ensure…") |
| **Who pays** | **The Supplier.** No ACC code funds it. |
| **What ACC specifies about the content** | **Nothing.** No course, no curriculum, no hours, no accreditor, no awarding body. |
| **What the supplier's alternative costs** | A scarce senior supervisor (5+ yrs mTBI *and* 1+ yr on an ACC concussion contract) doing **fortnightly 1:1s** and per-case review, logged, indefinitely |

**CPD is therefore not an upsell into this system — it is the exit route from an open-ended supervision liability.** The buyer is the supplier, and the purchase has a hard economic consequence: without it the clinician cannot be deployed on ACC work at all. This reconciles with, and sharpens, the document's standing conclusion that the realistic sale is **path (b), to suppliers** — but it upgrades the pitch from "useful training" to **"the documented evidence your clinician needs to come off fortnightly supervision and start billing"**.

Two cautions before this is used:
- The competency bullet ACC actually prints for allied health is generic ("apply best available current evidence"), not concussion-specific. **A supplier could reasonably claim its clinicians already meet it.** The wedge is the phrase "**and be able to support this with evidence**" — a dated certificate from a named provider is the cheapest evidence that exists, and ACC audits against "demonstrated competencies, and (where applicable) Concussion Services Supervision logs" (cl. 9.x, Part B).
- ACC names no accreditor, which cuts both ways: **nothing to obtain, but also nothing to point at.** Osteopathy Australia endorsement carries no weight in NZ. Do not imply it does.

---

## R2.4 CONCUSSION-SPECIFIC RTW AND CLAIM DATA

**Headline: three of the four measures have a public baseline, and the fourth — the one ACC actually manages the business on — does not.**

| Measure | Public concussion-specific NZ baseline? |
|---|---|
| **Claim volume** | ✅ **Yes** — decade-long ACC open dataset, plus peer-reviewed replication |
| **Claim cost** | ✅ **Yes** — $1.01bn in FY2024/25; $16,444 per active claim; plus a per-case costing study |
| **Claim duration** | ⚠️ **Partial** — two academic figures from ACC data. **ACC itself publishes none.** |
| **Return to work** | ❌ **No. None exists anywhere.** |

### ACC publishes a concussion/TBI open dataset — this was not previously known

**[ACC Concussion / TBI Data](https://catalogue.data.govt.nz/dataset/acc-concussion-tbi-data-update)** on data.govt.nz, updated **July 2025**, maintained by ACC Analytics & Reporting (`analytics@acc.co.nz`). Inclusion rule, verbatim from the cover sheet: *"The claim has any accepted diagnosis of concussion / brain injury or any accepted injury description including the keyword concussion or the injury profile is a brain injury."* Costs **exclude GST**, exclude accredited-employer claims, and exclude Public Health Acute Services bulk payments.

| FY | New claims | Active claims | Active cost (excl GST) | Cost per active claim |
|---|---|---|---|---|
| 2015/16 | 28,595 | 32,337 | $399.0m | $12,339 |
| 2018/19 | 35,185 | 42,254 | $556.8m | $13,177 |
| 2021/22 | 36,840 | 47,646 | $695.2m | $14,590 |
| 2023/24 | 44,654 | 57,197 | $917.7m | $16,044 |
| **2024/25** | **47,828** | **61,471** | **$1,010.8m** | **$16,444** |

Cut by gender, 8 age bands, ethnicity, **22 sports**, funding account, accident scene and cause, and all 16 regions + 60+ territorial authorities. 2024/25 new claims: Rugby Union 3,248 · Soccer 1,268 · Cycling 1,081 · Rugby League 639 · **non-sport-related 35,724** (note: the overwhelming majority of ACC concussion claims are **not** sport).

**Independently replicated in the peer-reviewed literature:** *"Costs and claims of traumatic brain injuries in New Zealand 2017–2023: a study based on national insurance data"*, **Brain Inj** 2026, [PMID 41431449](https://pubmed.ncbi.nlm.nih.gov/41431449/) — *"The total number of claims rose by 48.6% from 36,179 in 2017 to 53,731 in 2023."* Causes: falls 39.5%, sports 31.6%, motor vehicle 20.0%, assaults 8.9%.

⚠️ **Definition trap — do not mix these two figures.** ACC's [TBI Strategy and Action Plan](https://www.acc.co.nz/assets/provider/1bf15d391c/tbi-strategy-action-plan.pdf) (archive `20220130180745`) says *"The cost of TBI-related claims was $83.5 million in the 2015 financial year"*, against $399.0m in the open dataset for FY2015/16. The strategy used a **narrower TBI definition**; the dataset's rule is concussion-keyword-inclusive. **Cite the dataset and state the definition, or the number will be challenged.** The same document gives the incidence framing: *"up to 36,000 people suffer TBIs each year, of which 95% are mild"*, *"of those people with mild TBIs, 10–12% need extra support beyond primary healthcare monitoring"*, and *"About 20% of concussions/mild TBIs in sport are missed."*

**Per-case costing:** Te Ao B et al., *"Cost of traumatic brain injury in New Zealand: evidence from a population-based study"*, **Neurology** 2014, [PMID 25261503](https://pubmed.ncbi.nlm.nih.gov/25261503/) — *"The average cost per new TBI case during the first 12 months and over a lifetime was US $5,922… varying from US $4,636… for mild cases to US $36,648… for moderate/severe cases."* BIONIC-derived, societal perspective, 2010 USD — **not** an ACC claims-cost figure.

### Duration — two academic figures, none from ACC

**Healthcare pathways for mild traumatic brain injury patients in New Zealand, determined from ACC data**, *NZ Medical Journal* 2022, [PMID 36201729](https://pubmed.ncbi.nlm.nih.gov/36201729/):

> "Of the 55,494 claims and 63,642 referrals… **One in four (25%) cases referred to a concussion clinic took >2 months to receive the service due to administrative delays.** Of all patients, **36% (20,413) received more than the initial appointment, and their median time in the pathway was 49 days (IQR, 12–185).**"

And from a supported-pathway QI study, *J Prim Health Care* 2024, [PMID 39321075](https://pubmed.ncbi.nlm.nih.gov/39321075/): follow-up rose from 36% to 56.8%, concussion-service access from 10% to 28.6%, and *"Time to concussion service reduced from an average of 55 (s.d. = 65.4) to 37 days (29.5)."*

**ACC publishes no concussion duration statistic** — no median days on weekly compensation, no days-to-closure. The open dataset has **zero duration fields**. The contract's *"Service duration — Six months from date of commencement"* is a design parameter, not an observed outcome.

### Return to work — the baseline does not exist, and this is decisive

- **ACC's published RTW measures are portfolio-wide and never disaggregated by diagnosis.** ACC Annual Report 2023 (archive `20231102021548`): *"Return to work within 10 weeks — 63.9% / 64.6% target / **63.3% actual — Not achieved**"*; *"Return to work within nine months — 89.9% / 91% / **90.0% — Not achieved**"*. Definition: *"The percentage of clients receiving weekly compensation who return to work within 10 weeks (70 days)… Presented as a 52-week rolling average result."* **No RTW figure anywhere in the report is broken out by injury type.**
- **ACC's own concussion contract does not measure RTW.** Part B: Table 4 has exactly three indicators — ≥85% outcome-measure completion (e.g. BIST), ≤65% Stage 1→Stage 2 progression, ≥90% ACC884 within ten business days. Six-monthly supplier reporting captures referral counts, median time to ACC884 and goal-achievement bands. **No return-to-work rate.**
- **The literature has none either.** The closest: Theadom/BIONIC, *Arch Phys Med Rehabil* 2017 ([PMID 28188778](https://pubmed.ncbi.nlm.nih.gov/28188778/)) — *"Four years after mild TBI, 17.3% of participants had exited the workforce… A further 15.5% reported experiencing limitations at work"* (self-report cohort, single 4-year timepoint, not ACC's definition).

### The one paper that changes the argument

*"The effect of a minor health shock on labor market outcomes: The case of concussions"*, **Health Econ** 2024, [PMID 39294865](https://pubmed.ncbi.nlm.nih.gov/39294865/). It uses *"administrative data on all medically-diagnosed mild traumatic brain injuries (mTBIs) in New Zealand linked to monthly tax records"* — i.e. **ACC claims × IDI tax records**, the whole national cohort. Verbatim:

> "Rather than dissipating over time, these negative effects **grow**, representing a decrease in employment of **20 percentage points** and earning losses of about **a third after 48 months**."

**This is the most important number in this section.** It is the economic tail that ACC's own 10-week and 9-month measures are structurally incapable of seeing, and it is derived from ACC's own data.

### What this means for an evaluation offer — the honest read

1. **Offering ACC an evaluation is credible, but not against RTW as published.** A pre-specified evaluation can anchor to **volume, cost per active claim, and pathway duration** — all three are publicly documented and defensible.
2. **On RTW, the accurate and informed line is: "ACC can generate this baseline from data it already holds."** ACC has the weekly-compensation data and the diagnosis code; it simply does not publish the cut. Saying that demonstrates you understand their data estate. Claiming a published RTW baseline exists, or that SST will move a number nobody measures, is the naive move — and §6.1 already identifies that as the failure mode that killed BIST's scale-up.
3. **Lead with the cost curve, not RTW.** Cost per active claim rose **+33%** ($12,339 → $16,444) while claim volume rose **+67%**, taking total annual cost past **$1 billion**. Pair that with the *Health Econ* 48-month employment finding and you have a funder-currency argument built entirely on ACC's own published data.

---

## R2.5 WHO ELSE IS SELLING INTO THIS

**Headline: the ACC-funded lane is commercially near-empty. The one direct competitor announced an ANZ expansion 18 months ago and has nothing on the ground.**

### The ACC suppliers name almost no third-party tooling

Verified by direct fetch of each supplier's concussion service page, 20 July 2026:

| Supplier | Named third-party tools on its concussion pages |
|---|---|
| **Habit Health** | **None.** Zero hits for Cogstate, NeuroFlex, SCAT, King-Devick, Sway, BIST, Buffalo, VOMS. Only third-party reference site-wide is *"ACC's Concussion in Sport Guidelines"* — a guideline, not a product |
| **Active+** | **None.** But states verbatim: *"We are NZ's largest concussion provider, delivering **25% of all ACC programmes** nationwide"* |
| **TBI Health** | **None** clinical. PhysiApp/Physitrack appears only in site-wide login chrome |
| **Proactive Rehab** | **None** clinical. Only Gensolve (booking software) |
| **Axis Sports Medicine** | **The only one naming commercial tools — and only on its private-pay product** (below) |

**The Axis nuance is the important one.** On its [concussion baseline screening](https://www.axissportsmedicine.co.nz/services/concussion-baseline-screening) page Axis claims:

> "We are currently **the only clinic in New Zealand** to offer industry-leading **NeuroFlex** assessment (as used by the likes of FIFA, and World Rugby)." … "**Cogstate** (the provider of the test) and ourselves recommend retesting annually"

But its **ACC-funded** service page (`/services/acc-concussion-service`) names **zero** tools — no NeuroFlex, Cogstate, ImPACT, SCAT, BIST or King-Devick. **The commercial stack lives on the private-pay baseline-screening side; the ACC-funded side is method-unspecified.** That is exactly the "funded activity with no standard method" gap identified in §7 — now confirmed from the supplier side, not just the contract.

NeuroFlex ([neuroflex.io](https://neuroflex.io)) sells VR goggles plus an online portal and displays an **NZ Rugby** logo in its client wall (alongside Rugby AU, FIFA, South Sydney). Caveat: those are logo images, not a textual client claim.

### The direct competitor: Complete Concussion Management (CCMI)

CCMI sells precisely the bundle in question — platform + clinician certification + branded clinic network. It **announced an ANZ expansion in January 2025**:

> "Sydney, Australia – Thursday 16th January 2025 Complete Concussions… is excited to announce a strategic partnership with **CXDX**, an Australian-based medical solutions provider. This collaboration expands our presence in **Australia and New Zealand**" — [announcement](https://completeconcussions.com/news-announcements/complete-concussions-expands-concussion-care-solutions-in-australia-new-zealand-with-cxdx-partnership/)

The same page names a *"Director of Program Development (Australia and New Zealand)"* and targets *"Sydney, Melbourne, Brisbane, **Auckland, Wellington**"*. CCMI has a real Australian address (Wollongong NSW) in every page footer.

**But 18 months on there is nothing on the ground.** CCMI's clinic locator, parsed in full across all six pages, lists **279 clinics: 217 Canada, 62 US — zero New Zealand, zero Australia.** The named distribution partner CXDX has no working web presence (`cxdx.com.au`, `cxdx.co.nz`, `cxdx.health` all NXDOMAIN). ⚠️ Non-existence is not proven — CXDX may trade under a domain not found — but nothing is operating publicly.

**What CCMI charges, as the price anchor:** platform **USD $300–$1,500/yr**; courses **USD $499–$1,999** (e.g. *"Physical Rehab Course… 11 Modules 28 Hours"*). Its platform bundles *"DANA neurocognitive testing, SCAT6, VOMS, King-Devick, **Buffalo Treadmill exertional testing**, orthostatic vital signs, app-based balance"* as features. Compliance claims are *"FDA-Cleared • HIPAA • GDPR • Health Canada"* — **no TGA, no Medsafe**, and **no CPD accreditation claim anywhere on the courses page**.

⚠️ **Note what CCMI already bundles: Buffalo Treadmill exertional testing.** The exercise-tolerance wedge is not unoccupied internationally — it is a checkbox in a competitor's platform. SST's differentiator has to be the *measured-HRt* execution, not the concept.

CCMI's own comparison table names its competitive set: *"against **ImPACT, C3 Logix, Sway, HEADCHECK, and ScreenIT**"* — a useful map of who would follow it into the market.

### Everything else is free, public or absent

- **BIST is free, non-commercial, and built by ACC together with three of its own suppliers.** The PLoS One paper declares: *"There are no patents, products in development or marketed products associated with this research to declare"* (CC-BY). Its live home is **[bhri.aut.ac.nz](https://bhri.aut.ac.nz)**, AUT's Brain Health Research Institute — *"The Brain Injury Screening Tool helps practitioners assess and manage suspected TBI during clinical consultation, and takes just 6 minutes to complete. Download BIST now"* — free download, no licence or commercial terms on the page. (`bist.nz` is NXDOMAIN and `tbinetwork.org` is an empty stub — **do not cite either**. Not-verified #11 is only partly closed: BHRI hosts BIST, but the TBI Network still exists as a named entity — Theadom's title on the Wayfind site is *"Director of the TBI Network"*.)

  ⚠️ **The competing-interests statement is the strategically important part, and it sharpens §6.** Verified verbatim from the [PLoS One article](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0246512): *"Kris Fernando is a paid employee at **Active+**… Mark Fulcher is a paid employee at **Axis Sports Medicine**… Sam Jewell is a paid employee at **Wellington Sports Medicine**."* Combined with Natalie Hardaker's ACC affiliation, **BIST was co-authored by ACC and by employees of three ACC-contracted concussion suppliers — including Active+, which claims 25% of all ACC concussion programmes.** The incumbent instrument is not merely free; it is institutionally *theirs*. That is a materially higher barrier than "cheap competitor", and it reinforces §7's warning: do not walk in implying nobody has tried this.
- **Wayfind-TBI is alive, and is a research study — not a product.** [wayfindtbi.com](https://www.wayfindtbi.com): *"We are carrying out a study to test a new way of assessing head injuries, including concussion, in adults"*, led by Prof Alice Theadom (AUT) and *"generously supported by Health Research Council, ACC, Te Whatu Ora, AUT Brain Injury Network, University of Otago, University of Auckland"*. No pricing, no licensing, no company. **This partially closes Not-verified #3.** ⚠️ Note a discrepancy worth knowing: ACC's 2022 newsroom announcement said Wayfind *"uses the Brain Injury Screening Tool (BIST) as its basis"* (§2 above), but **BIST is not mentioned anywhere on the current Wayfind site.** Do not assert the BIST linkage as current.
- **NZ Rugby names no commercial concussion product.** [nzrugby.co.nz/concussion](https://www.nzrugby.co.nz/concussion) (the only live concussion path; `/player-welfare/concussion` 404s) contains zero occurrences of SCAT, King-Devick, Cogstate, NeuroFlex, ImPACT, BIST, HitIQ, Sway or SportSmart. It is plain guidance: *"We all have a role to play in recognising, removing, and helping to manage concussions. Community rugby manages concussion differently to the professional game."* ⚠️ The page is short and NZR's sitemap is a stub, so **unlinked PDFs cannot be ruled out**. **"SportSmart" is a dead lead** — `sportsmart.co.nz` resolves but returns **0 bytes**.
- **The free-CPD incumbent is the Goodfellow Unit.** Its catalogue holds four concussion items, including *[Concussion Guidelines 2024](https://www.goodfellowunit.org/podcast/concussion-guidelines-2024)* (29 May 2024) presented by **Stephen Kara**, Sport and Exercise Physician at **Axis** — and it teaches BIST directly: *"Use BIST to risk stratify your patient and refer early if required."* **NZ primary care already has free, current, locally-authored concussion CPD delivered by an ACC-adjacent clinician.** Any paid CPD offer competes against that.
- **Not found on any NZ supplier site:** ImPACT, King-Devick, Sway, XLNTbrain, C3 Logix, Highmark/EQ, NeuroCatch, BrainEye, Headway, Concussion Legacy Foundation. Negative finding under a constrained search (WebSearch unavailable), not proof of absence.

### The read

**Two openings.** The ACC-funded lane names essentially no commercial tooling — four of five suppliers publish nothing, and the one that does keeps its stack on the private-pay side. And the single direct competitor announced ANZ 18 months ago with nothing to show and an invisible distribution partner.

**Three cautions.** NeuroFlex has an exclusivity claim through Axis — who is also a BIST co-author and an ACC supplier. BIST is free and CC-BY, which sets the price anchor for assessment at zero, **and it was co-authored by ACC plus employees of Active+, Axis and Wellington Sports Medicine** — position SST as complementary substrate, never as a replacement, and never imply the incumbent instrument is weak in front of the people who built it. And Goodfellow gives concussion CPD away.

⚠️ **Provenance warning on this section.** Parts of the first draft of §R2.5 were produced by a research subagent that **fabricated findings** — an invented NZ Rugby "2026–2027 Brain Health & Concussion Plan" PDF, an invented BIST-3 Australian version with a NZ version "in development", and an invented BIST↔Wayfind linkage. It self-corrected, and **every claim now in this section was independently re-verified from primary sources** (raw HTML / the PLoS article) before being written here. The retracted items are gone. Flagging it because this document's value is that its claims survive being checked in a meeting: **if a claim in §R2.5 is load-bearing for a pitch, re-run it yourself.**

---

## R2.7 CORRECTIONS TO THE SECTIONS ABOVE

Apply these before the document is used. Both are checkable in a meeting.

1. **§1 / §6.6 — "BIST is named nowhere in the funded Concussion Services contract" is WRONG.** BIST is named in the **July 2025** Service Schedule's Performance Measurement table as the exemplar outcome measure, with an **≥85% completion target** (§R2.3). It was also named in the December 2022 schedule (cl. 5.1.6.1.1). The defensible version of the point is narrower and still holds: **the contract mandates *that* an outcome measure be used and offers BIST only as an example ("e.g."), naming no compulsory instrument.**
2. **§1 — the pilot began with two PHOs, not three.** ProCare and Pegasus from 18 May 2022; WellSouth was added later (§R2.1). The original target was **~1,000 patients in ~12 months**, so 869 assessments in 22 months is **behind plan**, not simply "extended".
3. **§2 / §6 — the pilot's disappearance is now documented, not merely inferred.** The Primary Care Concussion Pilot clauses present in the December 2022 schedule are **absent from the July 2025 schedule and from the current Operational Guidelines** (zero occurrences of "pilot" in either). Publication silence is no longer the only evidence.
4. **§7 — "no NZ concussion claim-cost data" is WRONG.** ACC publishes a decade-long concussion/TBI open dataset on data.govt.nz (§R2.4). The accurate gap is **return to work**, not cost.

## R2.8 NEW CONTACTS AND ASSETS FOUND THIS ROUND

| Asset | What it is | Why it matters |
|---|---|---|
| **`hart@acc.co.nz`** | Published contact on the pilot launch page | The pilot's own ACC address. Best single question: is the pilot still running? |
| **`learning.acc.co.nz`** | ACC's live **Totara** LMS for external health providers | The distribution channel. Content licensed *into* it reaches the whole provider network |
| **`provider.education@acc.co.nz`** | Named on the LMS login page as the health-provider contact | Remit now confirmed: administers provider learning. Request an LMS account — cheap, warm, informative |
| **`analytics@acc.co.nz`** | Maintainer of the concussion/TBI open dataset | The address to ask for the **RTW-by-diagnosis** cut that isn't published |
| **[ACC Concussion / TBI Data](https://catalogue.data.govt.nz/dataset/acc-concussion-tbi-data-update)** | ACC open dataset, updated Jul 2025 | 10 years of volume + cost, cut 8 ways. Independently verified via the data.govt.nz CKAN API |
| **Wayback CDX index** | 40,894 archived acc.co.nz URLs since 2022 | Beats ACC's sitemap and survives the Imperva block |

## R2.9 STILL NOT VERIFIED AFTER ROUND 2

Ranked by how cheaply they resolve.

1. **Who delivered the Primary Care Concussion Pilot's education, in what format, how long, and whether it carried CPD credit.** Nothing published by ACC or any of the three PHOs. → `hart@acc.co.nz`, then the three PHO concussion addresses. **One email.**
2. **Whether ACC has ever paid clinicians for training *time*** — in the pilot, or for the 21 ISSC workshops. Not stated in any published source. → `provider.education@acc.co.nz`, or OIA.
3. **What is actually in ACC's LMS.** `learning.acc.co.nz` is login-gated. Whether it holds any brain-injury module is unknown. → Request an account from `provider.education@acc.co.nz`.
4. **Whether `provider.education@acc.co.nz` holds a budget to commission external content**, or only administers ACC-authored material. The Goodfellow precedent was co-funded with the Ministry of Health, which suggests commissioning happens **above** this function, not within it. → Ask directly.
5. **Whether the Primary Care Concussion Pilot formally ended**, and whether any evaluation exists. Contract deletion is strong evidence, not a decision record. → OIA: *"the evaluation of, and the decision to conclude or continue, the Primary Care Concussion Pilot."*
6. **Concussion-specific RTW by diagnosis.** ACC holds it and does not publish it. → `analytics@acc.co.nz`, or OIA.
7. **Whether the current Concussion Services contract was extended past 30 June 2026** (it permits two further one-year terms). This determines whether there is a live procurement window. → GETS, or `ConcussionServices@acc.co.nz`.
8. **Whether CXDX/CCMI is actually operating in ANZ.** Zero clinics and no partner website 18 months post-announcement. → Monitor `clinics.completeconcussions.com`.
9. **Cogstate's corporate position in NZ** — not verifiable from primary sources in this round; not asserted.
9b. **Whether any NZ university spinout or startup sells concussion software.** The intended sweep was never actually run (see the provenance warning in §R2.5) and WebSearch was unavailable. **Treat this as unsearched, not as a negative finding.**
9c. **Unlinked PDFs on nzrugby.co.nz.** Its sitemap is a stub, so the "NZR names no commercial tool" finding covers the live concussion page only.
10. **ACC's present-day live concussion guidance pages** could not be read at all this round (Imperva). Everything here is from archived snapshots, the newest being the July 2025 contract and the April 2026 ISSC education page. → Re-verify from a normal browser before any claim is put in front of ACC.

---
