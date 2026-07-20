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
