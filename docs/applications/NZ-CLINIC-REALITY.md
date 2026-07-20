# NZ Concussion Clinics — What They Actually Do

**Compiled:** 2026-07-20
**Purpose:** Ground truth on the real clinical and commercial flow inside an ACC Concussion Services episode, from primary sources, to replace reasoning-from-contract-clauses.
**Companion docs:** `NZ-ACC-TARGET-LIST.md` (the 25 suppliers), `ACC-AS-BUYER.md` §R2 (verified contract facts — not re-derived here).

---

## RIGOUR NOTE — READ FIRST

Every factual claim below carries the URL actually fetched and a quote from it. Where a fetch failed, that is recorded as UNVERIFIED rather than filled in. Nothing here is inferred from a URL slug or a search snippet.

**Two primary ACC documents were recovered via the Wayback Machine and are the backbone of §1, §2 and §4:**

| Doc | Wayback URL | Pages |
|---|---|---|
| **Concussion Services Operational Guidelines, July 2025** (current) | `https://web.archive.org/web/20251009113522id_/https://www.acc.co.nz/assets/contracts/concussion-og.pdf` | 18 |
| **Concussion Services Operational Guidelines, March 2025** (superseded, but far more operationally detailed) | `https://web.archive.org/web/20250423235351id_/https://www.acc.co.nz/assets/contracts/concussion-og.pdf` | 43 |

The July 2025 version is a **compression** of the March 2025 version. ACC cut the guidelines from 43 pages to 18 and **removed the funding cap, the per-item hour allocations, the invoicing rules and the end-to-end process map** from the guidelines document. Those numbers still bind (they sit in the Service Schedule) but they are no longer restated in the operational guide. **The March 2025 version is where the hard commercial numbers live** and is cited as such throughout.

---

## 1. THE FULL PATIENT FLOW

### Step 0 — Cover
The client must already have **an accepted ACC claim**. The Concussion Service does not create cover. ACC45 (the standard injury claim form) is referenced once in the March 2025 guidelines but the concussion service itself is not an ACC45 process — cover is a precondition, not a step the concussion clinician performs.

> "It is the Supplier's responsibility to ensure that the referred Client meets these eligibility criteria, regardless of the referral source."
> — July 2025 OG, *Client eligibility*

**Eligibility, all four required** (July 2025 OG):
> "They have been diagnosed, or are suspected of having, a mild or moderate traumatic brain injury, or persisting concussion symptoms by a Medical Practitioner or Nurse Practitioner. / The injury occurred within the last 12 months. / They have an accepted claim with ACC. / They are at risk of delayed recovery."

Note the last one. **"At risk of delayed recovery" is the gate.** A straightforward concussion that is recovering normally is not supposed to enter this service.

### Step 1 — Referral in. Three doors, two forms.

From the July 2025 OG, *Referral process*:

| Referral source | Form | Purchase order? |
|---|---|---|
| **ACC** itself | **ACC883** | Yes — "with an accompanying purchase order" |
| **Medical Practitioners or Nurse Practitioners** at Te Whatu Ora hospitals, GP/private practice, urgent care | **ACC883** ("or equivalent information") | **No PO required** |
| **Registered nurses and Allied Health professionals at Te Whatu Ora hospitals** | **ACC7988** (Direct Referral) | **No PO required** |

> "No prior approval from ACC is needed, but an accepted claim for cover should be confirmed."
> — July 2025 OG, *Introduction*

> "9.2. No purchase order is required for the Assessment and Triage Services … No purchase order is required for any direct referral received, provided the client meets the entry criteria for the service and has an accepted claim."
> — March 2025 OG

**The client cannot self-refer.** March 2025 OG: *"A Client can't self-refer."*

The supplier — not ACC — screens the referral:
> "Decline and return referrals if the client does not meet eligibility criteria or if information is inadequate. If unable to accept the referral, inform the client and forward the referral to another suitable supplier. (If the referral was from ACC, notify ACC within two business days)."

**Paediatric note:** Laura Fergusson Brain Injury Trust names a separate child/adolescent form —
> "Adult clients: ACC 883 concussion service referral form … Children and adolescents: ACC 7412 concussion service referral form"
> — https://lfbit.co.nz/our-services/concussion-service/

ACC7412 appears once in the March 2025 OG, confirming it is real.

### Step 2 — Triage (service item TBI05)

> "The Triage stage involves an initial assessment to determine if a client needs further Concussion Services. This assessment can be done by phone or in-person and **must start within five business days of accepting the referral**. The Triage includes reviewing the client's recovery progress, providing relevant education, and advising the referrer of the outcome. **It should be completed within one hour**, which can be spread over several sessions if needed."
> — July 2025 OG, *Service stages*

March 2025 OG is blunter about the money: TBI05 is *"only payable if the client doesn't progress into the concussion service assessment"* — i.e. triage is only separately billable when it screens someone **out**.

Active+ describes exactly this in consumer language:
> "The service begins with a phone call from an experienced clinician who will discuss your needs and determine whether the concussion service is the right path for your recovery."
> — https://www.activeplus.co.nz/services/body/concussion-service/

### Step 3 — Stage 1: Education and Assessment

> "In Stage 1, clients who continue to show signs of brain injury and are at risk of delayed recovery receive education and risk assessments. **This stage begins within ten business days of completing the Triage.** It includes providing education on recovery timeframes and symptom management and **conducting case reviews by a Neuropsychologist and a Medical Practitioner** to determine the need for in-person assessments and the soundness of the rehabilitation program. Group education sessions can be used where appropriate."
> — July 2025 OG

Service items: TBI21 (education/risk assessment, **3 hours**), TBI13 (Neuropsychologist case review, **fee only**), TBI14 (Medical Specialist case review, **fee only**).

**Two paper case reviews by the two most expensive disciplines are mandatory in Stage 1.** The neuropsychologist and medical practitioner review the file; they do not necessarily see the patient.

### Step 4 — The ACC884, which is the pivot point of the whole episode

Within **ten business days of Stage 1 commencing**, the supplier electronically submits the **ACC884 Client Summary Report** to ACC *and* to the client's primary healthcare provider (July 2025 OG, Table 2).

The ACC884 is **not just a report — it is the treatment plan and the funding request**:

> "9.12. Use of time – Number of hours required. The Supplier will outline a treatment plan on the ACC884. The plan will be based on current best practice and will **recommend the types of services and number of hours required up to a maximum of 8 hours**. The Supplier can determine how that time is to be used."
> — March 2025 OG

> "Section 8 of the ACC884 should record a brief description of the Client, their recovery needs and rehabilitation plan. Alternatively, a separate rehabilitation plan can be included. The plan should outline expected timeframes for reviews and outcomes such as return to work etc."
> — March 2025 OG

This is the single most important fact in this document for product design: **the clinician's clinical reasoning becomes a funding request on one form, and they get to decide how the hours are spent.**

### Step 5 — Stage 2: Treatment and Rehabilitation

> "Stage 2 is for clients who need ongoing rehabilitation beyond self-management. This stage involves assessing and treating the client's rehabilitation needs, encouraging effective recovery strategies, and planning for a return to work, school or life role. If necessary, clients may be referred to ACC's Stay at Work service for additional support. **The goal is to provide necessary services only where there is an ongoing clinical need.**"
> — July 2025 OG

Service items: TBI26 (Allied health therapy), TBI27 (Psychologist consultation), TBI28 (Medical Specialist consultation), TBI29 (Key worker/coordinator).

**Treatment is not sequential.** March 2025 OG:
> "Treatments do not need to be sequential. Instead Suppliers can choose to give treatment therapies when it best meets the needs of the Client. The rehabilitation time for each Client will vary and **only a small percentage of Clients are likely to need all the service items shown. Many will require just the investigation and planning**, whereas others may need a combination of services."

### Step 6 — Assessments available in either stage

> "Allied Health Assessments include evaluating and advising on managing persistent concussion symptoms, assessing return to work or school requirements, **exercise tolerance**, vestibular function, and differential diagnoses."
> — July 2025 OG, *Additional services within Stage 1 or Stage 2*

**This is the only occurrence of the word "exercise tolerance" in either version of the Operational Guidelines.** See §5.

Also available: Neuropsychological Screen (TBI23, **5 hours**), Medical Assessment (TBI30, fee), Other Discipline Assessment (TBI25, at cost).

### Step 7 — Discharge

> "A Client completes the service when they have achieved the identified outcomes that enable them to return to work or school, or life role. If outcomes have not been achieved, this should be noted on the ACC884 Client Summary Report with recommendations for alternative ACC or non-ACC services as relevant to the client's situation."
> — July 2025 OG, *Service completion*

**Discharge is triggered by the clinician**, on the same ACC884 form, with a five-business-day deadline. Exit routes onward (March 2025 OG §10.7): Vocational Rehabilitation, Home and Community Support, Neuropsychology Service, Psychology Services, Training for Independence, Pain Management.

### Explicitly out of scope
July 2025 OG, *Service exclusions* — inpatient TBI services, elective surgery, social rehabilitation assessments, pain management, Training for Independence, **"Longer-term musculoskeletal manual therapy"**, longer-term clinical psychological therapy, comprehensive neuropsychological assessment, **all imaging (CT, MRI, EEG)**, sleep studies, client transport.

Note "longer-term musculoskeletal manual therapy" is excluded. This is not a hands-on physio contract.

---

## 2. HOW MANY VISITS, AND HOW IS IT PAID

**All figures in this section are from the March 2025 OG.** They were removed from the July 2025 rewrite of the guidelines but the underlying Service Schedule caps still govern.

### The hard cap

> "**10.5. Maximum funding limit.** The Service has a maximum funding limit of **$3,914.49, excluding GST**, travel costs and the single payment for non-attendance by the Client (Did-Not-Attend fee)."
> "The Supplier is responsible for ensuring that the maximum funding limit is not exceeded. Should the Supplier exceed the maximum funding limit, **ACC may choose to recover the overpayment**."

### The hour allocations — March 2025 OG Table 8

| Service item | Hours | PO required |
|---|---|---|
| TBI21 – Education & Assessment | **3** | No |
| TBI22 – Allied Health Assessment | **2** | No |
| TBI23 – Neuropsychological Screen | **5** | No |
| TBI13 – Neuropsychological Case Review | Fee | No |
| TBI30 – Medical Assessment | Fee | No |
| TBI14 – Medical Specialist Case Review | Fee | No |
| TBI25 – Other Specialists | At cost | No |
| **TBI26 – Allied Health or Nursing therapy** | **8** | **Yes** |
| **TBI27 – Psychological Consultation** | **5** | **Yes** |
| **TBI28 – Medical Consultation** | **2** | **Yes** |
| TBI29/TBI32 – Key worker/coordinator | **4** | Yes |

Requirements attached to that table:
> "Multi-disciplinary services are required (single discipline needs are met under other contracts) / Rehabilitation plan fully explains the need for services, goals and expected outcomes and timeframes / Services do not exceed the maximum funding of $3,914.49 for the total service cost"

**So the answer to "how many visits":** the assessment/triage phase carries roughly **10 chargeable hours** before treatment begins (3 + 2 + 5) plus three fee-based reviews; the treatment phase is nominally **8 hours of allied health therapy, 5 of psychology, 2 of medical, 4 of coordination**. The ACC884 treatment plan recommends *"number of hours required up to a maximum of 8 hours."* Everything is bounded by the $3,914.49 total.

**The unit of account is HOURS, not visits.** No supplier or ACC document researched expresses this service in appointments. Suppliers invoice actual time in hours and minutes:
> "The invoice should present the time in hours and minutes." — March 2025 OG §11

### Duration

> "**10.2. Maximum duration for delivery of service.** The maximum duration for delivery of this Concussion Service is **six months** (from the date of the referral to the last treatment date). **It is expected that Suppliers will work to ensure the Client achieves the service objectives within 16 weeks.** Clients with more complex and longer-term service needs should have been triaged from the service."
> "ACC will monitor Client duration based on the length of time between the first date of service to the last date of services invoiced. Service duration will be discussed regularly as part of the dialogue between Supplier and Recovery Team Member."
> — March 2025 OG

The July 2025 OG restates this tersely in Table 2: *"Concussion Service duration — Supplier — Six months from service commencement."*

**16 weeks is the working target; 6 months is the wall.**

### ⚠️ CORRECTION — ACC32 IS NOT PART OF THIS SERVICE

**The brief asked what triggers an ACC32 extension. Verified answer: nothing, because ACC32 does not appear in the Concussion Services Operational Guidelines at all.**

Grep of both PDFs returns **zero** occurrences of "ACC32". The complete list of ACC form numbers appearing in the two documents is: **ACC884 (21×), ACC883 (10×), ACC7988 (4×), ACC885 (3×), ACC8331 (1×, telehealth guide), ACC7412 (1×), ACC45 (1×)**.

Extension in *this* service is not a form. It is a phone call to the ACC Recovery Team Member, handled as a purchase-order variation via the escalation process:

> "Suppliers should contact the Recovery Team Member in the first instance if there are any concerns or matters requiring clarification. Examples could include: … **You need a change to a purchase order (e.g. more time, more services, date change)** … Prior approval is required"
> — March 2025 OG §15, *Resolving issues (escalation process)*

**Do not put ACC32 in outreach copy for the concussion contract.** ACC32 is a real form in other ACC contexts, but naming it here would signal that the contract has not been read — the exact failure mode the target-list doc warns about.

### Non-attendance
> "ACC will pay **one** non-attendance (DNA) fee per Client, no matter how many times they failed to attend an appointment. The service item code for non-attendance is TBIDNA." — March 2025 OG §10.8

Reported on **ACC885**, within three business days (July 2025 OG, Table 2).

### Published average duration
**UNVERIFIED.** Neither Operational Guidelines version, nor any of the 12 supplier pages fetched, publishes an average or median episode duration. ACC's six-monthly report asks suppliers for *"Median time from referral acceptance to ACC884 submission to ACC"* — so ACC holds that data but does not publish it. An OIA request is the only route (consistent with `NZ-ACC-TARGET-LIST.md` §8.4).

---

## 3. WHAT THE CLINICS THEMSELVES SAY ⭐ MOST IMPORTANT SECTION

Twelve supplier concussion pages were fetched successfully. **The dominant finding is how little any of them says.**

### Active+ — the anchor (17/17 regions)
https://www.activeplus.co.nz/services/body/concussion-service/

> "Active+ delivers an ACC-funded, interdisciplinary concussion service to support people recovering from mild to moderate traumatic brain injury."
> "The service begins with a phone call from an experienced clinician who will discuss your needs and determine whether the concussion service is the right path for your recovery."
> "If appropriate, you'll then receive a thorough assessment, followed by a tailored rehabilitation programme designed around your goals and the demands of your everyday life."
> "Depending on your needs, your team may include a range of clinicians working together such as a physiotherapist, occupational therapist, and/or a psychologist."
> "Active+ helps you safely get back to what matters most, including work, school, sport and daily life, with guidance and education for you and your whānau."

Team list: *"Medical specialists (including neurologists), Occupational therapists, Psychologists / Neuropsychologists, Physiotherapists, Registered nurses, Speech and language therapists, Social workers."*

**Visits/duration: not stated. Assessment tools: none named. Software: none named. Exertion testing: no mention. Outcomes: qualitative only ("get back to what matters most").**

This is the largest concussion provider in New Zealand and its entire public clinical description is five sentences that restate the ACC contract.

### Habit Health — 125 locations, 2,500+ clinicians
https://www.habit.health/individuals/physiotherapy/concussion

**The most specific supplier page found**, and notably it is specific about the *private/acute* offering, not the ACC contract service.

*Acute Concussion Clinic:*
> "Habit Health's Acute Concussion Clinic provides early support for sports players who have recently experienced a concussion."
> "We can see you right away and will arrange for you to see a GP online so that we can begin treatment fast."
> "There's no need for a GP referral before we see you."

Programme components, verbatim:
> "Early concussion assessment and guidance / Clear stand-down advice following a concussion / A structured recovery and rehabilitation plan / Monitoring of symptoms during recovery / **A graduated return-to-sport progression** / Formal return-to-play clearance"

Funding:
> "Fully funded in Auckland, Queenstown and Christchurch. Partially funded across the rest of New Zealand."

*Standard Concussion Service* (the ACC contract one) gets two sentences:
> "coordinated support for people experiencing ongoing concussion symptoms following a GP referral"
> "Our team combines clinical expertise and multidisciplinary care to support you through each stage of recovery."

**Habit is the only supplier with a named "graduated return-to-sport progression" and "formal return-to-play clearance" — and it sits in the ACUTE SPORTS clinic, not the ACC concussion service.** No tools named, no exertion protocol described, no HR anything.

### Axis Sports Medicine — the sport-and-exercise-medicine house
https://www.axissportsmedicine.co.nz/injuries/concussion

Three distinct products: ACC Concussion Service, Acute Concussion Clinic, Concussion Baseline Screening.

> ACC Concussion Service: "Care for more complex concussions" — requires referral from GP or DHB health professional.
> Acute Concussion Clinic: "Free diagnosis and treatment for recent concussions" — referral required within 4 weeks of injury date.
> Concussion Baseline Screening: "Know your brain's 'normal' state."

Team: *"Sport and Exercise Physicians, Neurologists, Vestibular Physiotherapists, Musculoskeletal Physiotherapists, Occupational Therapists, Neuropsychologists, Clinical Psychologists, and Nurses."*

The only sentence touching activity:
> "recovery from concussion is straightforward if you follow a plan and manage your activity."

**This is the finding that should reset the pitch.** Axis employs ~16 sport and exercise physicians and runs a *baseline screening* product — they are the most exercise-literate organisation on the list — and their concussion page still says nothing about exertion testing, heart-rate thresholds, or graded aerobic exercise. Their public clinical vocabulary for activity is *"manage your activity."*

### Proactive Rehab — 16 regions, 50+ clinics, employs exercise physiologists
https://proactivehealthcare.co.nz/our-services/concussion/

The most **contract-literate** page found — it lifts ACC's eligibility criteria verbatim and adds a coding detail no one else publishes:

> "They have been diagnosed, or are suspected of having, a mild or moderate traumatic brain injury, or persisting concussion symptoms by a Medical Practitioner or Nurse Practitioner. The injury occurred within the last 12 months. They have an accepted claim with ACC."
> Clients require **"the appropriate read code of S60 Concussion or S646 Head injury loaded against their claim"** to progress from initial assessment.
> "early access and timely expert assessment for people who have sustained a mild (Concussion) or moderate head injury"

Components: *"Allied health assessment and input provided Occupational Therapy, Physiotherapy or other allied health disciplines" / "Psychological consultation sessions with a psychologist" / "Medical assessment with a Medical Specialist experienced in concussion" / "Neuropsychological screening assessment with a Neuropsychologist to assess cognitive function/deficits"*

Process: *"An experienced therapist triages needs, conducts an initial interview about the accident and symptoms, and develops a treatment and rehabilitation plan to support the recovery."*

**Proactive employs exercise physiologists (per `NZ-ACC-TARGET-LIST.md`) and still does not mention exercise anywhere on its concussion page.**

### ABI Rehabilitation — 5 regions, ~300 staff, CARF-accredited
https://www.abi-rehab.co.nz/concussion-service/

> "ABI Concussion Service specialises in assessment and rehabilitation following Concussion."
> "Concussion is a functional injury, which means the area of the brain affected does not manage the flow of information as it should."
> "The purpose of this assessment is to determine the impact of your injury on you, and to identify any factors that may interfere with your ability to return to work, study, and any other activities you normally do."
> Sites: "Whangarei, Auckland (North West, Epsom & Botany), Masterton and Wellington (Tawa). We can also see you at home, work or place of study, or via telehealth."
> Team: "Occupational Therapists, **Neuro-physiotherapists**, Rehabilitation Medicine Physicians, Paediatrician/Paediatric Rehabilitation Medicine Physician, Neuropsychologists, Psychologists, Speech and Language Therapists."

Note the discipline is framed as **neuro**-physiotherapy, not sports/exercise physiotherapy. No tools, no visit counts, no exertion.

### Body In Motion — 3 regions, ~11 sites
https://bodyinmotion.co.nz/community_programmes/concussion/

Quotes the contract almost word for word:
> "The ACC Concussion Service is an interdisciplinary service consisting of triage, assessments and therapy to support people to recover from a mild to moderate traumatic brain injury and return to everyday life."
> "The Concussion Service also aims to prevent long-term consequences by identifying people at risk of persisting symptoms and providing them with effective interventions and education. Education is also provided to people to reduce the incidence of re-injury."

No stages, no visits, no tools, no exertion.

### Laura Fergusson Brain Injury Trust — 220+ staff, dedicated brain-injury charity
https://lfbit.co.nz/our-services/concussion-service/

Most **referrer-oriented** page: names both forms (ACC883 adult, ACC7412 child/adolescent), names who may refer, gives the intake address `hello@lfbit.co.nz`.

Team: *"Medical Specialist, Clinical Psychologist/Neuropsychologist, Occupational Therapist, Physiotherapist, Speech Language Therapist."*

No visits, no duration, no tools, no exertion.

### The four contract-holders that publish nothing about concussion — CONFIRMED

The `NZ-ACC-TARGET-LIST.md` §5b claim was re-tested directly and **holds**:

| Supplier | Verified today | What their site actually sells |
|---|---|---|
| **Geneva Healthcare** — https://www.genevahealth.com/ | 18 services listed; **"No mention of concussion or traumatic brain injury"**. Only ACC items are *"ACC Injury Rehabilitation & Recovery"* and *"ACC Nursing Services"* | Home care, aged care, dementia, palliative, staffing |
| **Hemisphere Health** — https://hemispherehealth.co.nz/ | 12 services listed; **no concussion/head injury/TBI mention; no ACC contract named** | Workplace physiotherapy, pre-employment, hearing, lung, drug screening |
| **Tui Allied Health** — https://tuialliedhealth.co.nz/ | 7 services listed; **no concussion mention**. ACC appears exactly once: *"We welcome both ACC and private clients, with flexible weekday and Saturday appointments available."* | Physiotherapy, Rongoā Māori, psychology, cupping, massage, acupuncture, occupational health |
| **What Ever It Takes** | Not re-fetched this round — prior finding stands (UNVERIFIED today) | — |

**Hemisphere Health is the sharpest case and it is now double-verified:** they hold the Nelson concussion contract and their public site is a pure occupational-health business.

### TBI Health — STILL UNVERIFIED
`https://tbihealth.co.nz/services/acc-case-owner-hub/concussion-services/` returned an empty body to WebFetch, and the apex domain returned **169 bytes** to curl. The Wayback fallback was also refused (`Claude Code is unable to fetch from web.archive.org` via WebFetch). **No TBI Health content is recorded in this document.** Needs a real browser. Same for Bay Rehab (227 bytes to curl).

### The cross-supplier pattern

| What I looked for | Suppliers stating it (of 12 fetched) |
|---|---|
| Number of visits or sessions | **0** |
| Treatment duration in weeks/months | **0** |
| Any named assessment tool (SCAT6, BIST, ImPACT, VOMS, PCSS…) | **0** |
| Any named software/platform | **0** |
| Graded exertion / exercise-tolerance testing | **0** (see §5) |
| Quantified outcome claim | **0** |
| Graduated return-to-sport | **1** (Habit — in its *private acute* clinic) |

**Every supplier describes this service as: a phone triage, a multidisciplinary assessment, a "tailored plan", and getting back to work/school/life.** They differentiate on footprint, speed of access and team composition. **Not one differentiates on method.**

---

## 4. REPORTING IN PRACTICE — AND IT IS SMALLER THAN THE PITCH ASSUMES

### What actually gets produced

**Per episode**, from July 2025 OG Table 2:

| Report | Who to | Deadline |
|---|---|---|
| Referral decline notification | Referrer + ACC | Within **2 business days** of receipt |
| **ACC884 Client Summary Report** — post-Stage-1 (the treatment plan + funding request) | **ACC and the client's primary healthcare provider**, electronically | Within **10 business days** of Stage 1 commencing |
| Medical Assessment / Neuropsychological Screen notes, report, letter or summaries | ACC | **"Immediately following"** the assessment |
| **ACC884 Client Summary Report** — at exit | ACC | Within **5 business days** of service completion / exit / identifying non-concussion needs |
| **ACC885 Did Not Attend Report** | ACC | ASAP, no later than **3 business days** after the missed appointment |
| Clinical notes on request | ACC | Within **5 business days** of the request |

March 2025 OG §10.6 splits the ACC884 deadline by purpose:
> "Within two business days - when further treatment service needs are recommended. / Within five business days - when all services are complete, no further services are required and the Client is exiting the Concussion Service. The five-day requirement recognises that the Client is no longer in need of services and therefore, while a timely response is required, there is no urgency."

**Per six months**, per organisation (July 2025 OG):
> "For 1 July – 31 December; within 15 business days after the end of the reporting period. For 1 January – 30 June; within 10 business days after the end of the reporting period."

Contents: total referrals received and their source (primary care / Te Whatu Ora / ACC); **median time from referral acceptance to ACC884 submission**; outcome measurement results banded as *Fully achieved (100% of goals) / Partially achieved (≥50%) / Minimally achieved (<50%) / No achievement*; **"The above measures will be completed for the general population and specifically for Māori"**; and *"Detail on continuing Service improvement undertaken in the past 6 months."*

### ⚠️ HONEST ASSESSMENT: reporting is NOT the pain point

**Per episode there is essentially ONE form — the ACC884 — submitted at most twice, plus an ACC885 only if someone no-shows.** There is no progress report, no interim review form, no monthly return. The six-monthly report is once per organisation, not per clinician, and is a small aggregate table.

Compare this to the ACC reporting burden in other contracts. **This is light.** A pitch built on "we reduce your reporting burden" will not land, and a National Manager will know it immediately.

**What IS burdensome is not the paperwork — it is that the ACC884 forces a defensible clinical judgement about hours and goals, early (10 business days into Stage 1), and that judgement is then measured.** That is a *reasoning* burden, not an *administrative* one. It is the more interesting problem and it points at a different pitch. See §7.

### The performance targets — and a correction that matters

July 2025 OG, **Table 4 – Supplier performance measures**, verbatim:

| Measure | Description | **Target** | Frequency |
|---|---|---|---|
| Client Outcome Measurement | "Clients who enter Treatment and Rehabilitation Services (Stage 2) complete an outcome measure tool on completion of the service. This can be a measure such as the **Brain Injury Screening Tool (BIST)** or other suitable tools." | **85%** of Stage 2 clients complete an outcome measure | 6 monthly |
| Timeliness | "The ACC884 is submitted to ACC within ten business days commencing Stage 1 services" | **≥90%** | 6 monthly |
| Client Outcomes | "Proportion of clients who enter Treatment and Rehabilitation Service (Stage 2) from Assessment and Triage Services (Stage 1)." | **≤65%** | 6 monthly (ACC data) |

**Read that third row carefully. The Stage 1 → Stage 2 progression target is a CEILING, not a floor: ≤65%.**

`NZ-ACC-TARGET-LIST.md` §3 lists "Service progression" as a measure benchmarked at "National Average or one deviation higher" from the Service Schedule. The **Operational Guidelines put a hard directional target on it: no more than 65% of Stage 1 clients should progress into Stage 2.** ACC is paying suppliers to *not* escalate people into treatment. A supplier that treats more people looks worse, not better.

This is the single most commercially consequential correction in this document. **Any pitch phrased as "help more of your clients into Stage 2 treatment" is pitching against ACC's stated target.** The pitch has to be: get people OUT faster, and make the ≤65% triage decision defensible.

**BIST is the only clinical instrument named anywhere by ACC in either guidelines document.** (Brain Injury Screening Tool — a NZ-developed symptom screen. It is a symptom questionnaire, not a physiological test.)

---

## 5. DOES ANYONE DO EXERCISE-TOLERANCE TESTING NOW? ⭐

**Verified answer: no evidence that anyone does, anywhere in the public material.**

### Method
Twelve supplier concussion/homepage URLs were fetched with curl and the raw HTML grepped case-insensitively for: `exertion`, `graded exercise`, `exercise tolerance`, `treadmill`, `heart rate`, `buffalo`, `sub-symptom`, `aerobic`, `return to sport`, `exercise physiolog`.

| Supplier page | Hits |
|---|---|
| activeplus.co.nz /services/body/concussion-service/ | **NONE** |
| axissportsmedicine.co.nz /injuries/concussion | 1 × "treadmill" — **FALSE POSITIVE**, see below |
| habit.health /individuals/physiotherapy/concussion | 2 × "return to sport" (the acute sports clinic) |
| proactivehealthcare.co.nz /our-services/concussion/ | **NONE** |
| abi-rehab.co.nz /concussion-service/ | **NONE** |
| bodyinmotion.co.nz /community_programmes/concussion/ | **NONE** |
| lfbit.co.nz /our-services/concussion-service/ | **NONE** |
| ropeneurorehab.co.nz /concussion-service/ | **NONE** |
| bayrehab.co.nz | **NONE** (thin body — low confidence) |
| alignhealth.co.nz /acc--concussion-service/ | **NONE** |
| rehabtaranaki.co.nz | **NONE** |
| apm-nz.co.nz /home/individuals/community-rehab/concussion-service | **NONE** |

**The Axis "treadmill" hit resolved to an image alt attribute on a navigation icon:**
> `alt="Person running on treadmill icon on red background" class="mm-icons"` — linking to `axis-exercise-medicine.jpeg`, i.e. the site's *Exercise Medicine* service tile. It has nothing to do with concussion assessment.

**Zero of twelve suppliers mention exertion testing, exercise tolerance testing, heart-rate-guided exercise, the Buffalo protocol, treadmill testing, or sub-symptom-threshold aerobic exercise on their concussion pages.**

Habit's two "return to sport" hits are the graduated return-to-sport progression in the **private acute sports clinic**, not the ACC service, and are described as a symptom-monitored progression with no physiological testing named.

### And ACC barely asks for it either

The word **"exercise tolerance" appears exactly ONCE in the July 2025 Operational Guidelines**, in a list inside the Allied Health Assessment description:

> "Allied Health Assessments include evaluating and advising on managing persistent concussion symptoms, assessing return to work or school requirements, **exercise tolerance**, vestibular function, and differential diagnoses."

Grep of both PDFs for `exertion`, `treadmill`, `heart rate`, `aerobic`, `physical activity`: **zero hits in either document.** The only other "exercise" occurrences are the vocational scope *"Sport and Exercise Medicine"* / *"Sports and Exercise Physician"* in the medical practitioner qualification tables.

### What this means — read carefully, it cuts both ways

**The upside:** the `NZ-ACC-TARGET-LIST.md` §4 structural-gap argument is **confirmed on both sides**. The obligation exists in the contract (Allied Health Assessment includes exercise tolerance), and nobody — not even the sport-and-exercise-medicine house with 16 SEM physicians, not even the group that employs exercise physiologists — publicly claims the capability. It is genuinely open ground.

**The downside, and it is the important half:** an obligation mentioned once, in a sub-clause of an optional assessment item, with a two-hour allocation (TBI22), is **not a live problem a National Manager is losing sleep over.** ACC does not measure it. ACC does not name a protocol. No competitor is using it as a differentiator, which also means no supplier is being beaten by it. There is no burning platform here.

**The gap is real. The pain is not — yet.** A pitch that says "you have an unmet contractual obligation" invites the honest reply: *nobody has ever pulled us up on it.* The pitch has to connect exertion testing to something ACC **does** measure — the ≤65% Stage 1→Stage 2 ceiling, the 16-week target, and the return-to-work duration measures in the Service Schedule. That connection is the whole argument, and it now has to be made explicitly rather than assumed.

---

## 6. GENSOLVE — THE PRACTICAL INTEGRATION PICTURE

### What it is
https://www.gensolve.com/ — *"Cloud-based practice management software designed by practice managers for healthcare practices."*
Products: **Gensolve Practice Manager**, **Gensolve Telehealth**, **Gensolve AI**. Markets: **Australia, New Zealand and the UK**.

Integration mentions on the homepage — all Australian billing rails, none NZ or clinical:
> "Native HICAPS & Easyclaim integrations available with Gensolve"
> "Free Medicare Online"
> "Medicare online with automatic reconciliation"
> Reference to "integration of accounting systems"

### Is there a public API, partner programme, or marketplace? **NO.**

The full page sitemap (`https://www.gensolve.com/page-sitemap.xml`, 14 URLs) is:
```
/ · /sample-page/ · /lp-checkout/ · /lp-profile/ · /courses/ · /instructors/
/instructor/ · /lp-become-a-teacher/ · /lp-term-conditions/ · /dashboard/
/student-registration/ · /instructor-registration/ · /cart/ · /checkout/
```

**There is no `/api`, no `/developers`, no `/partners`, no `/integrations` page.** (`/integrations` was requested directly and returned **HTTP 404**.) The site is a WordPress install whose only non-marketing content is an LMS for *training Gensolve users* — the "instructor/student/course" pages are Gensolve's own customer-education product, not a developer ecosystem.

Subdomain probe results:

| Host | Result |
|---|---|
| api.gensolve.com | no DNS/connection |
| developer(s).gensolve.com | no DNS/connection |
| partners.gensolve.com | no DNS/connection |
| help.gensolve.com | no DNS/connection |
| **support.gensolve.com** | **403** → redirects to `/hc/en-gb` (a Zendesk help centre, **access-controlled — customers only**) |
| **docs.gensolve.com** | **200** → `/help/gpm_nz/` — an **NZ-specific product documentation site**, but it is a 961-byte JavaScript shell: *"Enable JavaScript support in the browser to view this page."* **Content not retrievable — UNVERIFIED.** |

**Plainly stated: Gensolve publishes no public API documentation, no partner programme, and no marketplace.** Two NZ-relevant documentation properties exist (`docs.gensolve.com/help/gpm_nz/` and a Zendesk help centre) but both are gated — one behind JavaScript, one behind authentication. Whether an API exists *for customers* cannot be determined from public material.

**What a third party would actually have to do:** there is no self-serve path. Integration would require a direct commercial conversation with Gensolve, almost certainly initiated or sponsored by a mutual customer. **Do not plan on an integration; plan on a workflow that sits alongside the PMS and produces something the clinician pastes or attaches to the ACC884.**

### ⭐ Which suppliers actually run Gensolve — HARD EVIDENCE

This was verified from the suppliers' own booking links in page HTML, not from claims:

**Active+ (17/17 regions, the anchor target) runs Gensolve across its network.** Its clinic-selector dropdown carries per-branch Gensolve booking URLs on `nzappts.gensolve.com` and `bookingsnz.gensolve.com`. Extracted verbatim from `https://www.activeplus.co.nz/`:

```
http://nzappts.gensolve.com/active_oaks            → Airport Oaks
http://nzappts.gensolve.com/active_plus_bay_roskill → Bay Roskill
https://nzappts.gensolve.com/active_highbrook       → Highbrook East
https://nzappts.gensolve.com/active_plus_northland  → Whangarei / Dargaville
https://nzappts.gensolve.com/active_orewa           → Silverdale
https://nzappts.gensolve.com/active_pukekohe        → Pukekohe
https://bookingsnz.gensolve.com/active_plus_np      → New Plymouth / Hāwera / Ōpunake
http://nzappts.gensolve.com/active_dominion_rd      → Mt Eden
http://nzappts.gensolve.com/active_ellerslie        → Ellerslie
http://nzappts.gensolve.com/active_physio_central   → Feilding / Palmerston Nth / Whanganui / Marton
http://nzappts.gensolve.com/active_counties         → Papakura
http://nzappts.gensolve.com/active_waikato          → Hamilton Te Rapa / Turangi / Rotorua
http://nzappts.gensolve.com/active_warkworth        → Warkworth
```

**Align Health also runs Gensolve** — `https://bookingsnz.gensolve.com/alignhealth`, on multiple "BOOK ONLINE" buttons at `https://alignhealth.co.nz/`.

Checked and **no** Gensolve/Cliniko/Nookal/Halaxy/Physitrack/Medtech/indici string found: `habit.health` (158 KB fetched — clean). `tbihealth.co.nz` and `bayrehab.co.nz` returned near-empty bodies (169 and 227 bytes) so **UNVERIFIED** for those two.

**Bottom line for §6:** Gensolve is confirmed as the practice-management/booking layer for the largest supplier on the target list and at least one other, which makes it strategically real. But it is a closed system with no public developer surface. Treat Gensolve as **context for how a clinician's day is shaped**, not as an integration route.

---

## 7. THE COMPELLING-PROBLEM QUESTION ⭐

### The honest headline

**From public material alone, no NZ concussion supplier visibly complains about anything.** There are no published waitlist notices, no capacity warnings, no "we are experiencing delays" banners, no outcome claims, no case studies, no white papers, and no methodological differentiation on any of the twelve pages fetched. If the friction were public, it would be here. It is not.

**So the compelling problem cannot be sourced from what clinics say. It has to be sourced from the gap between what ACC measures and what clinics can currently show.** That gap is verifiable, and it is real.

### What the verified evidence actually supports

**1. ACC pays them to say NO, and gives them almost nothing to say no WITH.**
The Stage 1 → Stage 2 progression target is **≤65%** (July 2025 OG Table 4). Roughly one in three assessed clients is supposed to be turned away from treatment. Eligibility itself turns on a subjective phrase — *"They are at risk of delayed recovery"* — and *"It is the Supplier's responsibility to ensure that the referred Client meets these eligibility criteria."* The only instrument ACC names anywhere is **BIST**, a symptom questionnaire. **The supplier carries the whole burden of a rationing decision, is measured on it against a numeric ceiling, and has one self-report symptom screen to make it with.** An objective physiological measure is exactly what is missing from that decision — and it is a *triage* argument, not a treatment argument.

**2. The 16-week clock with a $3,914.49 ceiling.**
*"It is expected that Suppliers will work to ensure the Client achieves the service objectives within 16 weeks"* and *"The Supplier is responsible for ensuring that the maximum funding limit is not exceeded. Should the Supplier exceed the maximum funding limit, ACC may choose to recover the overpayment."* (March 2025 OG). **Every episode is a fixed-price contract with a clawback.** The economic unit is roughly 8 hours of allied health therapy inside ~$3,900. Anything that shortens time-to-discharge converts directly to margin — and anything that lengthens it is unpaid work.

**3. Eight hours to plan, ten business days to commit.**
The ACC884 must be filed within 10 business days of Stage 1 starting, and on it the clinician *"will recommend the types of services and number of hours required up to a maximum of 8 hours."* **They are committing to a dose, in writing, to the funder, early, on limited information — and it is later graded against goal achievement bands.** That is a real, recurring, uncomfortable decision that happens on every single client. It is the closest thing to a live pain point that the primary sources support.

**4. Two ways they are visibly exposed.**
- **The four contract-holders with no public concussion capability** (Geneva, Hemisphere, Tui, What Ever It Takes) — re-verified in §3. They hold an obligation they do not visibly resource.
- **Undifferentiated commodity positioning across the board.** Twelve suppliers, and not one names a tool, a protocol, a duration or a number. They compete on footprint and speed of access. In a market where ACC shares non-anonymised performance data between competitors (Service Schedule cl. 13.4, per `NZ-ACC-TARGET-LIST.md`), **having nothing to differentiate on is itself the exposure.**

### What is NOT the problem — say this out loud before building a pitch on it

- ❌ **Reporting burden.** One form, at most twice per episode. It is light. (§4)
- ❌ **ACC32 extensions.** Not part of this contract. Do not mention. (§2)
- ❌ **"You are contractually obliged to assess exercise tolerance."** True but weak — one mention, in a sub-clause, unmeasured, and nobody has ever been pulled up on it. (§5)
- ❌ **"Get more clients into Stage 2."** Actively counter to ACC's ≤65% target. (§4)
- ❌ **Gensolve integration.** No public API, no partner programme, no self-serve path. (§6)

### The reframe the evidence supports

The compelling problem is **not** *"you can't deliver a treatment ACC asks for."*
It is: **"every client forces you to make two high-stakes judgements — do they progress past Stage 1, and how many of your 8 hours do they get — you must commit to both in writing within 10 business days, you are graded on both against a national ceiling, you carry a clawback if you're wrong, and the only instrument ACC gives you is a symptom questionnaire."**

An individually measured heart-rate threshold is the objective input to *that* decision. It is a **triage and dosing** argument, not a rehab-modality argument. That reframe is what the ground truth supports, and it is a materially different pitch from the one currently in `NZ-ACC-TARGET-LIST.md` §4.

---

## 8. WHAT COULD NOT BE OBTAINED

| Item | Status | Next step |
|---|---|---|
| **TBI Health concussion service page** | Blocked — WebFetch empty body; curl on apex returns 169 bytes; Wayback refused by WebFetch | Real browser. Highest-value missing item — likely the most clinically sophisticated supplier. |
| **Bay Rehab site content** | curl returned 227 bytes; keyword sweep low-confidence | Real browser |
| **Gensolve NZ product docs** (`docs.gensolve.com/help/gpm_nz/`) | Live (HTTP 200) but JavaScript-gated, 961-byte shell | Real browser — this is the only public window into what Gensolve actually does in NZ |
| **Gensolve support/help centre** (`support.gensolve.com/hc/en-gb`) | HTTP 403 — customer-authenticated | Requires a customer login; ask a supplier contact |
| **Whether Gensolve has a customer-facing API** | UNVERIFIED — nothing public either way | Ask Gensolve directly, or ask Active+/Align Health |
| **Average/median episode duration** | Not published by ACC or any supplier | OIA to ACC (bundle with the §8.4/§8.5 requests in `NZ-ACC-TARGET-LIST.md`) |
| **Actual Stage 1→Stage 2 progression rates by supplier** | Not published; ACC holds it (six-monthly reports, ACC data) | OIA to ACC |
| **Current Service Schedule funding cap** | The $3,914.49 figure is from the **March 2025** OG. The July 2025 OG removed it. Whether it changed in the schedule effective 01 July 2026 is **UNVERIFIED** | Check the Service Schedule PDF (already in `NZ-ACC-TARGET-LIST.md` §9) before quoting the number to a supplier |
| **What Ever It Takes** | Not re-fetched this round | Low priority |
| **Habit Health "Standard Concussion Service" detail** | Only two sentences published | — |

### One thing to correct in `NZ-ACC-TARGET-LIST.md`
§3 of that document lists "Service progression — Proportion of clients who enter Stage 2 from Stage 1" as a measure benchmarked at *"National Average or one deviation higher."* The **Operational Guidelines give it a hard directional target of ≤65%** — a ceiling. The two framings point in opposite directions and the guidelines version should govern any outreach copy. See §4 above.

---

## ROUND 3 — grading, referral allocation, and the wider neuro-rehab surface

**Researched:** 2026-07-20. Answers: how suppliers are graded, whether grading has consequences (funding / contract / referral volume / reputation), whether SST data could serve the graded measures, the size and shape of ACC's wider rehab market, and what claim data ACC publishes.

### RIGOUR + METHOD NOTE

`acc.co.nz` is Imperva-blocked to both WebFetch and curl (a live re-fetch this round returned **HTTP 200 / 212 bytes**). Everything below was recovered via the **Wayback Machine** — CDX for discovery (`40,894` archived acc.co.nz URLs since 2022), `https://web.archive.org/web/<TS>id_/<URL>` for raw bytes. Non-ACC sources fetched live. Every claim carries the URL fetched plus a quote. Failed fetches are marked UNVERIFIED.

**⚠️ PROVENANCE WARNING ON THE CENTRAL DOCUMENT OF THIS ROUND.** The single most important finding rests on a PDF that is **not in the Wayback Machine**. The file `concussion-services-service-schedule.pdf` in the working scratchpad (md5 `85effdb59c70f99f0f9d188c576a9c25`, 572,457 bytes) does not match any of the three archived snapshots of that URL (2023-03-30 → Dec 2022 schedule; 2024-05-21 → Mar 2024 schedule; 2025-10-09 → July 2025 schedule). It was fetched **live from acc.co.nz earlier on 2026-07-20**, before the Imperva block engaged. Its internal evidence is self-consistent and dates it forward of every archived version:

| Evidence | Value |
|---|---|
| PDF `CreationDate` (embedded metadata) | **Thu 28 May 2026** (July 2025 schedule: 5 Jun 2025) |
| Page footer | `Service Schedule Concussion Services 01 July 2026` |
| cl. 1.1 Term | `1 July 2025` → close of **30 June 2027** |
| cl. 1.2 extension | **one** further term of one year (July 2025 schedule: two) |
| cl. 3.1.2 Maximum Funding Limit | **$4,120.00** (July 2025 schedule: $4,078.00) |

**Treat it as the current schedule effective 01 July 2026, but re-download it from acc.co.nz in a real browser before quoting any of it to a supplier.** It is called **"the 2026 schedule"** below; the Wayback-verified `20251009113522` version is **"the July 2025 schedule"**.

---

### R3.0 The short version — and three corrections to §4 above

1. **The ≤65% ceiling is gone.** The 2026 schedule replaced all three percentage targets with **six** measures, every one benchmarked to "National Average or one deviation [higher/lower]" and every one sourced from **ACC data**. There is not a single numeric target left in Part B: Table 4, and not a single supplier-self-reported measure. §R3.1.
2. **Four of the six new measures are return-to-work measures.** `ACC-AS-BUYER.md` R2 states "ACC's own concussion contract does not measure RTW." **That is now wrong.** The 2026 schedule measures RTW effectiveness, RTW efficiency and RTW sustainability — in ACC's own currency, the one SST's own doc called "the weakest link". §R3.1.
3. **Referral allocation is GEOGRAPHIC and ADMINISTRATIVE, and performance plays no part in it.** ACC's internal procedure directs staff to "**Identify and select a contracted provider in the client's geographic area**" from a "Contracted Suppliers by Geographic Area of Coverage" list. There is no panel, no rotation, no scoring, no client choice, and no performance input anywhere in the process. **Grading does not move referral volume.** §R3.2c — this is the answer to the round's critical question and it is largely a negative one.
4. **Grading has one hard consequence and it is not money.** No bonus, no penalty, no at-risk payment, no rate variation exists in any version of the schedule. The consequence chain is Standard T&Cs cl. 13–14: evaluation → performance improvement plan → (supplier pays for repeat evaluation) → notice of breach → termination in 10 business days. §R3.2a–b.
5. **cl. 13.4 — non-anonymised performance sharing between competing suppliers — was DELETED from the July 2025 schedule and RESTORED in the 2026 schedule.** `ACC-AS-BUYER.md` §7 leans on it. It is live again, but it was absent for a year. §R3.2d.
6. **ACC's rehab contracts do not mention exercise. At all.** Nine schedules were grepped for `exercise | exertion | graded activity | conditioning | physical activity | aerobic | fitness | heart rate`. Across Training for Independence, TBI Residential Rehabilitation, Pain Management, Non-Acute Rehabilitation Pathways and Specialist Paediatric & Adolescent Rehabilitation the total substantive hits is **zero** — every "exercise" occurrence is the boilerplate "Good Industry Practice **is the exercise of** due care" definition. The sole real hit in the entire corpus is Vocational Rehabilitation cl. 5.19. §R3.4.

---

### R3.1 HOW SUPPLIERS ARE ACTUALLY GRADED

The framework lives in **Part B, clause 12 + Part B: Table 4** of the Service Schedule. Clause 12.1 is identical across every version: *"Supplier performance monitoring requirements are described in detail in the Concussion Services Operational Guidelines."* It has changed three times in three years.

#### Generation 1 — the Mar 2024 schedule (term 1 Jul 2023 → 30 Jun 2025)
`https://web.archive.org/web/20240521125230id_/https://www.acc.co.nz/assets/contracts/concussion-services-service-schedule.pdf`

| Measure | Description (verbatim) | Target | Source |
|---|---|---|---|
| Client Outcome Measurement | "Clients who enter Treatment and Rehabilitation services (Stage 2) complete an outcome measurement tool on completion of the service. E.g. Brain Injury Screening Tool (BIST)" | **≥70%** | Supplier Data |
| Client Outcomes | "Proportion of clients who enter Treatment and Rehabilitation services (Stage 2) from Assessment and Triage services (Stage 1)." | **≤65%** | ACC Data |
| Timeliness | "The ACC884 Education and Risk Assessment Report is submitted to ACC within ten business days of referral acceptance." | **≥90%** | Supplier Data |

#### Generation 2 — the July 2025 schedule (term 1 Jul 2025 → 30 Jun 2026)
`https://web.archive.org/web/20251009113522id_/https://www.acc.co.nz/assets/contracts/concussion-services-service-schedule.pdf`

Same three measures. The BIST completion target was **raised 70% → 85%**, and the timeliness clock was **re-anchored from "referral acceptance" to "commencement of Stage 1 Services"**:

> "**Client outcome measurement** — Clients who enter Treatment and Rehabilitation Services (Stage 2) complete an outcome measurement tool on completion of the Service. e.g. Brain Injury Screening Tool (BIST). — **≥85% of Clients in Stage 2 complete an outcome measurement** — Supplier data
> **Quality** — Proportion of Clients who enter Treatment and Rehabilitation Services (Stage 2) from Education and Assessment Services (Stage 1). — **≤65%** — ACC data
> **Timeliness** — The Client Summary Report (ACC884) is submitted to ACC within ten Business days of commencement of Stage 1 Services. — **≥90%** — Supplier data"

**This is the version §4 above documents, and its ≤65% reading is correct for that version.** Note the label change: the progression measure was "Client Outcomes" in 2024 and is "**Quality**" here. ACC reclassified turning people away as a quality indicator.

#### Generation 3 — the 2026 schedule (term 1 Jul 2025 → 30 Jun 2027) ⭐ CURRENT
Live fetch 2026-07-20, see provenance warning above.

Clause 12.2 now lists three *categories*:
> "12.2.1 Service progression. 12.2.2 Timeliness of Service entry. 12.2.3 Return to work outcomes."

**Part B: Table 4 – Performance Measurement (2026), verbatim, all six rows:**

| Measure | Description | Target | Source |
|---|---|---|---|
| Service progression | "Proportion of Clients who enter Treatment and Rehabilitation Services (Stage 2) from Education and Assessment Services (Stage 1)." | National Average or one deviation **higher** | ACC data |
| Timeliness of Service entry | "Proportion of Clients who enter Education and Assessment Services (Stage 1) **within two weeks of injury date**." | National Average or one deviation **higher** | ACC data |
| Timeliness of Service entry | "Proportion of Clients who enter Education and Assessment Services (Stage 1) **after six months of injury date**." | National Average or one deviation **higher** | ACC data |
| Return to work outcome – **Effectiveness** | "Proportion of Clients receiving weekly compensation **for more than 26 weeks** following entry into Education and Assessment Services (Stage 1)." | National Average or one deviation **higher** | ACC data |
| Return to work outcome – **Efficiency** | "**Average number of weeks of weekly compensation received** following entry into Education and Assessment Services (Stage 1)." | National Average or one deviation **higher** | ACC data |
| Return to work outcome – **Sustainability** | "Proportion of Clients who have **sustained their return to work for at least three months**." | National Average or one deviation **lower** | ACC data |

**Read the four structural changes.**

1. **Zero numeric targets.** Grep of the 2026 schedule for `65%`, `85%`, `90%`, `70%` returns **nothing**. Everything is relative to the national average of the other 24 suppliers.
2. **Zero supplier-reported measures.** All six rows read "ACC data". The BIST-completion measure and the ACC884-timeliness measure — the two a supplier could directly control by filing forms — were **removed from the graded framework entirely**. (BIST/outcome-measure data still appears in the six-monthly narrative report under Table 5, but it is no longer a Performance Measure.)
3. **Return to work is now three of six measures**, computed off weekly-compensation records the supplier never touches.
4. **A new volume trigger.** Clause 12.3 defines how benchmarking bites, and 12.3.2 has nothing to do with clinical quality:

> "12.3 To avoid doubt, where a Performance Measure specifies a target of 'National Average or one deviation [higher/lower]' (as the case may be) the Supplier's performance will be benchmarked against the National Average, having regard to the following:
> **12.3.1** Where performance is materially different from the National Average including (but not limited to) where it **exceeds the upper or lower range of the distribution**; demonstrates a **sustained adverse trend over time**; or **differs materially from that of comparable suppliers in the absence of a clear difference in the client groups or injury types being treated**.
> **12.3.2** Where the **volume of eligible claims being treated by the Supplier falls below the median** for the National Average for the relevant reporting period (**at ACC's discretion**)."

Definition (2026 schedule, Part B definitions):
> "**National Average** means the national average of all Suppliers of Concussion Services for that Performance Measurement (as determined by ACC data) for the relevant reporting period."

**12.3.1's third limb is the interesting one:** a supplier whose numbers differ from its peers must be able to point to a **clear difference in the client groups or injury types being treated**. That is a case-mix defence, and it is written into the contract as the only accepted explanation for being an outlier.

**So: is ≤65% a target, a cap, a review trigger, or tied to payment?** For the July 2025 schedule it was a **ceiling with no payment consequence** — a review trigger. For the current 2026 schedule the question no longer applies: **there is no 65% figure**, and progression is judged against whatever the other 24 suppliers did. It is now possible to be graded badly for progressing *too few* clients as well as too many, because 12.3.1 flags performance that "exceeds the upper **or lower** range of the distribution".

---

### R3.2 DOES GRADING HAVE CONSEQUENCES?

#### (a) FUNDING — no. Verified negative.

Grep of both the July 2025 and 2026 schedules for `bonus | penalt | at risk | withhold | abate | incentiv | clawback` returns **no performance-linked hits** in either. Prices are flat fee-for-service against fixed item codes (TBI05/TBI21/TBI26/TBI22 all **$155.27/hr** in the 2026 schedule, unchanged; TBI27 $193.72; TBI28 $304.42; TBI29 $75.31; TBI30 $608.88 single fee; TBI13 $64.56; TBI14 $101.48). The only price mechanism is unilateral and unrelated to performance:

> "4.1 ACC will review pricing when, at **ACC's sole discretion**, we consider a review necessary." — 2026 schedule, Part A cl. 4

**There is no at-risk payment, no bonus, no penalty and no performance-linked rate variation in the Concussion Services contract. A supplier that grades badly earns exactly the same per hour as one that grades well.**

The only money consequence is the funding cap and its clawback, which is not a performance measure: **$4,120.00 excl GST** in the 2026 schedule (cl. 3.1.2), **$4,078.00** in the July 2025 schedule. ⚠️ **Both supersede the $3,914.49 figure in §2 above**, which came from the March 2025 Operational Guidelines. Do not quote $3,914.49.

#### (b) CONTRACT — yes, and the chain is fully specified. Just not in the Service Schedule.

The Service Schedule itself contains nothing beyond cl. 1.2.2 (*"ACC being satisfied with the performance of the Services by the Supplier"* as an extension precondition) and cl. 1.4 (*"There is no obligation on the part of ACC to extend the Term… **even if the Supplier has satisfactorily performed all the Services**"*). Grep for `improvement plan | remediat | performance manage` in the 2026 schedule returns only unrelated hits.

The teeth are in **ACC's Contract for Services – Standard Terms and Conditions (April 2018)**, which the schedule incorporates:
`https://web.archive.org/web/20230202033452id_/https://www.acc.co.nz/assets/contracts/health-contract-terms-conditions.pdf`

**Clause 13 — Evaluation.** ACC may evaluate "any and all aspects of this Contract" (13.2), "itself or by using an appropriate subcontractor or other government agency" (13.4), on 10 business days' notice or as little as 24 hours (13.5), with access to "your records and premises and the records and premises of any relevant subcontractor", and the evaluator "may… attend Services being provided, and talk with Clients" (13.6). And the cost rule:

> "13.7. We will not charge you and you will not charge us for any initial evaluation process. **You will pay for any further evaluations about the same performance issues if you have not improved your Service standards to the level required by ACC** within an agreed length of time."

**Clause 14 — "Improving services".** This is the escalation ladder, verbatim:

> "14.1. Reports and communications provided by you in relation to Service delivery, **ACC monitoring of data** and Service delivery, and findings from evaluations (including audits) may be used by ACC… to improve Service performance.
> 14.2. ACC and you will discuss reports to identify any issues and decide: (a) if performance could be expected to change, or **(b) if there are other factors that provide a reasonable basis for the identified performance.**
> 14.3. If a change in performance is required, then we will work with you to develop required action(s)…
> 14.5. If improvements have been evidenced, but further change in performance is required, both Parties will agree to an **extension of the performance improvement plan**…
> **14.6. If we do not observe sufficient improvement… or if you do not agree to a performance improvement plan, we may issue a notice of breach of contract under clause 20.8.**"

> "20.8. …that Party may give notice to the other specifying the breach. The notice must give the other Party **10 business days** to stop or to remedy the breach…
> 20.9. If the breach has not stopped or been remedied within 10 business days, the Party that gave the notice may forward… a **notice of termination** of: (a) this Contract and all of the Services, or (b) any particular Service Schedule(s)."

**The complete chain: ACC data monitoring → discussion → performance improvement plan → extension → notice of breach → termination in 10 business days, with the supplier paying for repeat evaluations along the way.**

⭐ **Clause 14.2(b) is the commercially important sentence in this entire round.** ACC is contractually required to consider *"other factors that provide a reasonable basis for the identified performance"* before requiring change. Read together with 2026 schedule cl. 12.3.1 — outlier status is judged *"in the absence of a clear difference in the client groups or injury types being treated"* — **the contract explicitly makes room for a supplier to explain its numbers with evidence about its case mix.** That is the only place in the whole framework where a supplier's own data can alter its grading outcome. See §R3.3.

#### (c) REFERRAL VOLUME — NO. This is the round's critical answer and it is a clean negative. ⭐

**Source: ACC's own internal process document, recovered from Wayback.**
`https://web.archive.org/web/20240521125149id_/https://www.acc.co.nz/assets/Policy-and-procedure-documents/set-up-concussion-service.pdf`
Header: *"ACC > Claims Management > Manage Claims > Manage Social Interventions / Supports > Set Up Concussion Service — Uncontrolled Copy Only : Version 29.0 : Last Edited Tuesday, 17 January 2023"*. Five pages, swimlaned by role (Recovery Assistant / Recovery Coordinator / Recovery Partner / Recovery Administrator).

**How a client is actually allocated, verbatim, Activity 4.0 (Recovery Administrator):**

> "**b Identify and select a contracted provider in the client's geographic area.**"
> "NOTE **What if a preferred provider has been specified in the task?** Select the vendor from the **Contracted Supplier by Geographic Area Coverage** list. Go to task (d)."
> "**c** Add the selected Provider as a participant on the claim."
> "**d** Approve the purchase order."
> "**e** Select 'Add documents' and generate the **TBI01 – Concussion Service Approve – Vendor letter**."

Supporting references named in the document: *"Contracted Suppliers by Geographic Area of Coverage"* and *"Service Contracts and Contracted Providers - MFP spreadsheet"*.

Handling a decline (Activity 3.0):
> "NOTE **What if you receive an NGCM - Admin Request task for a re-referral if a Provider cannot accept a referral?** If the provider was chosen by the **RTM** in the original referral, go back to the RTM to advise of the decline. If the provider was chosen by **admin** then you need to choose an alternate provider"

Paediatric routing:
> "NOTE **What if the referral is for a child?** Go to the **Concussion Service Providers** link and choose a provider who offers child and youth service."

**Answer each sub-question directly:**

| Question | Verified answer |
|---|---|
| Does ACC direct the referral? | **Yes, when ACC is the referrer.** A Recovery Administrator (or the Recovery Team Member) picks the supplier and raises the purchase order. |
| Does the client choose? | **No. Zero occurrences** of client choice, preference or consent to provider selection anywhere in the five-page procedure. The only client contact scripted is the decline letter (TBI02) when they are found ineligible. |
| Does the GP choose? | **Effectively yes, on the majority route.** Per §1 above, GP/NP and Te Whatu Ora referrals (ACC883 / ACC7988) need **no purchase order and no ACC prior approval** — the referrer sends it straight to a supplier of their choosing. ACC's internal procedure only engages when **ACC itself** initiates. |
| Is it geographic? | **Yes, explicitly.** "a contracted provider in the client's **geographic area**", off a "Contracted Supplier by **Geographic Area Coverage** list". |
| Is there a panel or rotation? | **No.** No rotation rule, no round-robin, no allocation quota, no scoring appears anywhere. |
| Does supplier performance influence the steering? | **No.** The words *performance*, *quality*, *outcome*, *rating* and *measure* do **not** appear in the selection steps. The only selection filters are geography and the child/youth flag. |

**Two exceptions worth knowing, both verbatim from the same document:**
- **RTM preference overrides admin.** "What if a preferred provider has been specified in the task? Select the vendor from the Contracted Supplier by Geographic Area Coverage list." Individual Recovery Team Members can and do name a supplier — an undocumented, relationship-driven channel with no published criteria. **This is the only lever on referral volume the evidence supports, and it is personal, not systemic.**
- **Named suppliers get bespoke pathways.** "NOTE **What if you are sending the referral to Habit or ABI?** These providers are participating in the **Secondary Care Proof of Concept**. Do not set up an initial purchase order." And separately, a **Middlemore hospital TBI Pathways pilot programme** "which removes the need for prior approval for concussion services". **Two of the largest suppliers already sit inside ACC pilot pathways that bypass the normal PO process.** ⚠️ Neither the Secondary Care Proof of Concept nor the Middlemore TBI Pathways pilot appears in any public ACC page found this round — **UNVERIFIED beyond this internal document, and both are worth an OIA.**

**Bottom line for 2(c): grading does not move referrals. Geography, referrer habit and individual RTM relationships move referrals.** Any pitch premised on "better numbers will win you more volume" is unsupported by the evidence and a National Manager will know it. What performance *can* do is lose you the contract at renewal (cl. 1.2.2) or trigger a performance improvement plan (T&Cs cl. 14) — a downside-only mechanism.

#### (d) PUBLICATION / REPUTATION — one live provision, restored after a year's absence, plus nothing public.

**Supplier-to-supplier sharing.** The clause `ACC-AS-BUYER.md` §7 relies on:

> "**13.4** The Supplier consents to ACC sharing **non-anonymised** ACC information in its reports, including information relating to **the Supplier's performance under this Contract**, with **all other contracted suppliers** providing Concussion Services to ACC."
> — 2026 schedule, Part B cl. 13.4

**⚠️ Correction of record: this clause is ABSENT from the July 2025 schedule.** That version's clause 13 stops at 13.3 (grep confirms: only 13.1, 13.2, 13.3 exist). So cl. 13.4 was present pre-2025, deleted for the 2025–26 year, and restored for 2026–27. It is live now — but the SST "supplier performance visibility" argument was, for a year, resting on a deleted clause. **Re-verify it in the browser before building a pitch on it.**

**Client- or referrer-facing publication: none.** ACC's public provider directory is
`https://web.archive.org/web/20260128065810id_/https://www.acc.co.nz/for-providers/treatment-recovery/referring-to-rehabilitation/concussion-service-providers/`

> "Find a concussion service provider in your area. **Search the regional list** for a concussion service provider close to you. **See which providers accept child and youth referrals.**"

Each entry carries exactly three fields: **supplier name, referral email address, territorial-authority locations, and a Yes/No "Provides child and youth service" flag.** No performance data, no outcome data, no rating, no volume, no waiting time. **25 unique suppliers** are listed (counted by unique referral email), 11 of them covering Auckland. This directory is the totality of what a referrer or client can see, and it makes suppliers look interchangeable by design.

**Nothing else is published.** No ACC page found this round publishes any supplier-level concussion performance figure.

---

### R3.3 COULD SST DATA SERVE THE GRADED MEASURES? — honest, measure by measure

Assessed against the **2026** framework, since that is what a supplier is now graded on.

| 2026 measure | Source | Could SST contribute? | Honest assessment |
|---|---|---|---|
| **Service progression** (Stage 1 → Stage 2) | ACC data | **Indirectly — as decision support, not as data** | ACC computes this from its own claims records. SST cannot touch the number. It can change the *clinical decision* that generates the number, and it can supply the case-mix defence under cl. 12.3.1 / T&C 14.2(b). This is the strongest honest claim and it is a narrow one. |
| **Timeliness of entry — within two weeks of injury** | ACC data | **No.** | Driven entirely by referrer behaviour upstream of the supplier. Nothing the supplier does after receiving the referral moves it. A supplier's score here is largely a function of its referrer mix. |
| **Timeliness of entry — after six months of injury** | ACC data | **No.** | Same. This measures which clients get sent to you, not what you do. |
| **RTW Effectiveness** (>26 weeks on weekly comp) | ACC data | **Only through actual outcomes** | Computed from compensation records. SST can only move it by genuinely shortening recovery — which is precisely the evidence SST does not have (see `ACC-AS-BUYER.md` §7). Do not imply otherwise. |
| **RTW Efficiency** (avg weeks of weekly comp) | ACC data | **Only through actual outcomes** | Same. |
| **RTW Sustainability** (RTW held ≥3 months) | ACC data | **Only through actual outcomes** | Same — and note the target direction is *lower* deviation, i.e. you are penalised for falling below peers. Arguably the measure most plausibly connected to exercise tolerance (premature RTW → relapse), and the one with the least evidence behind that connection. |

**Blunt version: five of the six graded measures are computed from ACC claims data that a supplier cannot influence except through real outcomes, and the two entry-timeliness measures it cannot influence at all.** The BIST-completion measure — the one a documentation tool could have gamed — was removed from the graded set in 2026. **Any pitch of the form "our data improves your scorecard" is false under the current framework.** Say so first.

**On the progression measure specifically — this is where a real argument exists.** Two contract provisions, quoted above, do exactly one thing: they create a defence.

- 2026 schedule cl. 12.3.1 flags a supplier whose numbers differ from peers *"in the absence of a **clear difference in the client groups or injury types being treated**"*.
- Standard T&Cs cl. 14.2(b) obliges ACC, before requiring change, to decide *"if there are **other factors that provide a reasonable basis for the identified performance**"*.

An objective, individually measured exercise-tolerance result — a heart-rate threshold, a serial re-test, an adherence record — is admissible evidence under both. It supports a progression decision **in either direction**: a measured HRt well below the prognostic threshold justifies progressing a client into Stage 2 against a peer-average that would otherwise flag you as over-progressing; a normal exercise tolerance justifies discharging at Stage 1 and defends you against the opposite flag. And because 12.3.1 now flags outliers at **both** ends of the distribution, the defence is symmetric — which the old ≤65% ceiling was not.

**But be precise about what that is worth.** It is a *defence at a six-monthly performance conversation*, not a scorecard input, and not referral volume. It matters to a supplier only in the moment they are already being asked to explain themselves. That is a real but narrow commercial hook, and it should be sold as risk mitigation to a National Manager, not as growth.

---

### R3.4 THE WIDER ACC NEURO-REHAB SURFACE

Nine ACC rehabilitation Service Schedules were recovered from Wayback and text-extracted. **All are pre-block snapshots; several are past their stated End Date and may have been reissued — check terms before quoting.**

| Contract | Schedule fetched (Wayback TS) | Term stated | Funds | Indicative codes / rates (excl GST) |
|---|---|---|---|---|
| **Concussion Services** | `20251009113522` + live 2026 | 1 Jul 2025 → 30 Jun 2027 | Triage, Stage 1 education/assessment, Stage 2 therapy | TBI05/21/22/26 **$155.27/hr**; TBI27 $193.72; TBI28 $304.42; TBI30 $608.88; cap **$4,120.00**/client |
| **Training for Independence – Tamariki & Rangatahi** | `20260409154416` (`titr-schedule.pdf`) | 1 Jul 2023 → **30 Jun 2028** | Rehab planning + delivered training toward independence | TITR01 planning **$155.27/hr**; TITR02 psychologist $193.72/hr; TITR11 delivery $155.27/hr; TITR13 $102.73/hr; TITR14 Key Worker **$466.72 set monthly**; TITR05/06 report writing paid per hour |
| **Training for Independence – Adults with Sensitive Claims** | `20220216192937` | to 30 Jun 2022 (**stale**) | Same shape, sensitive-claims cohort | TI01D rehab planning $121.75/hr (2022 pricing) |
| **Training for Independence – Te Ata Tū** | `20241125110318` | — | Kaupapa Māori TI variant | — |
| **Training for Independence – Children & Youth** | `20220216164720` | — (**stale**) | — | — |
| **TBI Residential Rehabilitation** | `20250227153753` | 1 May 2020 → 31 Mar 2026 | Inpatient/residential neuro rehab beds + day rehab | TRR06 active residential **$1,424.61 per bed/day**; TRD01 day rehab $648.67 flat; TRR10 bed retention $265.71; TRR20 provider advice $142.22/hr; TRR21 initial medical $307.11 |
| **Pain Management Services** | `20250227155245` | 1 Dec 2021 → 30 Nov 2025 | Triage + banded community/tertiary packages | PN01 triage **$565.07 fixed**; PN100A Community L1 **$2,724.58 package**; PN200A Community L2 **$4,959.23**; PN300A Tertiary **$7,616.01**; PN350A **$9,910.63**; PN410 specialist pain medicine $1,047.41 |
| **Vocational Rehabilitation** | `20230330034058` | 1 Mar 2021 → 30 Apr 2024 (**stale**) | Stay at Work / Back to Work outcome-priced packages | VRS21 $763.91 **set fee**; VRS22 $886.26; VRB11 $785.11; VRB12 $965.25; VRTT2 travel $123.00/hr |
| **Non-Acute Rehabilitation Pathways** | `20250227134231` | 1 Jul 2023 → 30 Jun 2026 | Inpatient non-acute rehab bed-days | NRP05 exceptionally complex **$1,353.28 per day**; values to $39,707.70 appear in the schedule |
| **Specialist Paediatric & Adolescent Rehabilitation** | `20220216192832` | — (**stale**) | Paediatric specialist rehab | — |

#### Does any of them mention exercise? Verified sweep. ⭐

Every schedule above was grepped case-insensitively for `exercise`, `exertion`, `graded activity`, `conditioning`, `physical activity`, `aerobic`, `fitness`, `heart rate`, `exercise physiolog`.

| Schedule | Substantive hits |
|---|---|
| Training for Independence – Tamariki & Rangatahi | **0** (1 × "exercise" = "Good Industry Practice is **the exercise of** due care") |
| Training for Independence – Adults (Sensitive Claims) | **0** |
| Training for Independence – Children & Youth | **0** |
| Training for Independence – Te Ata Tū | **0** |
| TBI Residential Rehabilitation | **0** (1 × boilerplate) |
| Pain Management Services | **0** (1 × boilerplate) |
| Non-Acute Rehabilitation Pathways | **0** |
| Specialist Paediatric & Adolescent Rehabilitation | **0** |
| **Vocational Rehabilitation** | **2 — the only real hits in the corpus** |

The Vocational Rehabilitation hits, verbatim, both inside cl. 5.19 *Work Specific Functional Rehabilitation*:

> "5.19.3.2. Provision of task and context specific rehabilitation in areas essential to the Client's pre-injury job or identified job options. Where applicable, **incorporating exercises that mimic what the Client does at their pre-injury job** or in an identified job option."
> "5.19.3.3. Educating the Client on the management of their injury, injury prevention and **completing exercises independently**."
> "5.19.4.1. Service must address work specific barriers that cannot be addressed through a graduated return to work, work trial or with the support of treating providers."

**This is a decisive negative finding and it should change the strategy.** ACC's rehabilitation contracts do not purchase exercise. Training for Independence buys *training toward independence in daily activities*, priced per hour of clinician time, with no physiological content whatsoever. TBI Residential buys *bed-days*. Pain Management buys *packages*. Non-Acute Rehab buys *bed-days*. The only ACC contract in the corpus that contemplates exercise at all frames it as **job-task mimicry**, not conditioning — and it is explicitly not neuro.

**"Escalated Care": UNVERIFIED as a contract.** Two ACC provider-news pages about an "Escalated Care Pathways (ECP) pilot" exist in the archive (`.../escalated-care-pathways-ecp-pilot-continues-to-show-positive-benefits/`, `.../escalated-care-pathways-showing-positive-benefits/`), but **no Escalated Care service schedule exists in the ACC contracts directory** and neither page was fetched this round. Do not describe Escalated Care as a contract. **No ACC "Stroke" or "Community Rehabilitation" contract exists** in the contracts directory either — the nearest equivalents are Non-Acute Rehabilitation Pathways and Home & Community Support.

#### How many suppliers hold each, and is this a larger market?

**The suppliers are largely the same organisations.** Counted from ACC's public provider directories:

- **Concussion Services — 25 suppliers** (`.../concussion-service-providers/`, archived `20260128065810`).
- **Pain Management — ~20 suppliers** (`.../pain-management-service-provider`, archived `20250821045035`, counted by unique non-ACC referral email). The overlap with the concussion list is heavy and named: **Active+, APM Workcare, Habit Health, Proactive Rehab, TBI Health Group, Body In Motion, Advantage South, Southern Rehab** all appear on both, alongside DHB/Te Whatu Ora pain centres (Auckland, Capital & Coast, Hutt Valley, Canterbury) that do not do concussion.
- **Vocational Rehabilitation** — provider page fetched (`20250731090544`) but yielded **no parseable supplier emails**. **UNVERIFIED count.**

**The honest read on "is concussion the entry point to a bigger market".**

**Yes on customer overlap — and that is the real finding.** The same six or seven national multi-site groups hold concussion *and* pain *and* (per the Concussion OG's onward-referral list in §1 above: Vocational Rehabilitation, Home and Community Support, Neuropsychology, Psychology, Training for Independence, Pain Management) sit across ACC's whole rehab surface. Landing Active+ or Habit or Proactive or TBI Health for concussion puts you inside an organisation that already holds several other ACC contracts. **The expansion path is account expansion within a supplier, not contract expansion across ACC.**

**No on contract fit.** Not one of the adjacent contracts funds, specifies, or even mentions graded exercise, exertion testing or conditioning. There is no second contract to sell the same capability into. Pain Management is package-priced and buys a programme, not an assessment; Training for Independence buys ADL training by the hour; the residential contracts buy beds. **A heart-rate-guided exertion product has exactly one contractual home at ACC, and it is the sub-clause of TBI22 already documented in §5 above.**

**On size.** ACC does not publish spend by rehabilitation contract, so this cannot be ranked. On unit economics alone the concussion contract is the *smallest* of those examined — a **$4,120** per-client cap against Pain Management packages of **$4,959–$9,910** and TBI Residential at **$1,424.61 per bed-day** (≈$43,000/month). **Concussion is the low-value end of ACC's rehab spend, not the entry to a bigger one.** Its value as a wedge is the *number of suppliers* it touches (25, nearly all of the multi-contract nationals), not the money in it.

---

### R3.5 PUBLISHED ACC DATA — what exists to benchmark against

**Concussion-specific supplier or claim data: none published. Verified negative.**

- **NZ Government open data catalogue** (`https://catalogue.data.govt.nz/api/3/action/package_search`, queried live 2026-07-20). ACC has **99 datasets**. A query for `concussion OR "brain injury"` returns **exactly one** result — *"OIA Response - #50395"* (`https://catalogue.data.govt.nz/dataset/oia-response-50395`, contents not retrieved — **UNVERIFIED**). ACC's published datasets are overwhelmingly injury-cause OIA releases: eye injuries, football injuries, ACL injuries, e-scooter injuries, horse injuries, playground injuries, washing-line injuries. **There is no concussion claims dataset, no service-level dataset and no supplier-performance dataset.**
- **ACC does publish "Weekly claims data"** — a live nav item on ACC's provider section (visible in the Jan 2026 archived page, path `https://www.acc.co.nz/for-providers/provider-news-and-events/weekly-claims-data/`). **Not fetched this round — UNVERIFIED whether it breaks out concussion or supplier.** Worth one browser visit; it is the only recurring ACC data publication found.
- **ACC's own six-monthly supplier reports hold the benchmark data and are not published.** Part B: Table 5 requires referral counts by source, median time to ACC884, and goal-achievement bands for the general population and specifically for Māori. ACC holds all of it. None is public. **OIA is the only route** (consistent with §8 above and `NZ-ACC-TARGET-LIST.md` §8.4).

**The one published quantification of the TBI market — and it is nine years old.**
`https://web.archive.org/web/...id_/https://www.acc.co.nz/...` — *Traumatic Brain Injury Strategy and Action Plan (2017–2021)*, ACC (local copy `tbistrat.pdf`; **⚠️ the exact Wayback URL for this file was not re-recorded this round — treat the citation as needing a re-fetch**):

> "In New Zealand it is estimated that up to **36,000 people suffer TBIs each year, of which 95% are mild**. The majority do not seek medical assistance or report this to ACC."
> "ACC statistics show that nearly **14,000 people are treated for TBIs each year**. The cost of TBI-related claims was **$83.5 million in the 2015 financial year**."
> "**over half of ACC's serious injury claims relating to TBI**… TBIs are second only to stroke for their impacts on employment and income (Dixon, 2015)."
> "Just over **20% of all TBIs in New Zealand are sustained through sport-related activity**."

And a line from the same document that reads as if written for this product:

> "**some measures used in the sector are not comparable or shared between health providers, which makes it difficult to monitor a person's progress and the overall effectiveness of services.**"

**Use the $83.5m / 14,000 figures with the FY2015 date attached, or not at all.** They are the only published TBI cost and volume numbers found, they are a decade stale, and quoting them undated in front of ACC would be the exact "hasn't read the material" failure this document series exists to prevent.

---

### R3.6 WHAT COULD NOT BE VERIFIED THIS ROUND

| Item | Status | Next step |
|---|---|---|
| **The 2026 Service Schedule itself** | Live-fetched pre-block; **not in Wayback**; md5 `85effdb59c70f99f0f9d188c576a9c25` | **Re-download from acc.co.nz in a real browser and diff.** Everything in R3.0–R3.3 depends on it. |
| **Whether the July 2025 schedule was ever operative** | Two schedules both start 1 Jul 2025 with different end dates (30 Jun 2026 vs 30 Jun 2027) and different Part B: Table 4 | Ask `ConcussionServices@acc.co.nz` which schedule governs, or OIA |
| **Concussion Services Operational Guidelines matching the 2026 schedule** | cl. 12.1 says monitoring detail lives there; only the July 2025 OG (18pp) and March 2025 OG (43pp) were recovered | Re-fetch `concussion-og.pdf` in a browser |
| **"Secondary Care Proof of Concept" (Habit, ABI)** | Named only in ACC's internal procedure doc; **no public trace** | OIA — potentially the highest-value unknown in this document |
| **"Middlemore hospital TBI Pathways pilot programme"** | Same — internal doc only, removes prior-approval requirement | OIA |
| **Whether the internal procedure (v29.0, Jan 2023) is current** | It is a 2024 archive of a 2023 document | OIA for the current version |
| **Escalated Care Pathways** | Two provider-news pages exist in CDX; **not fetched**; no service schedule found | Fetch both pages; do not call it a contract until then |
| **Vocational Rehabilitation supplier count** | Provider page fetched, no emails parsed | Real browser |
| **ACC "Weekly claims data"** | Page exists in nav; not fetched | Real browser — cheapest remaining data lead |
| **OIA Response #50395** | Only concussion/brain-injury hit in ACC's open data; contents not retrieved | `https://catalogue.data.govt.nz/dataset/oia-response-50395` |
| **TBI Strategy 2017–2021 Wayback URL** | Quotes verified from a local copy; canonical archive URL not re-recorded | Re-fetch before citing |
| **Spinal Cord Injury Rehabilitation schedule** | Only Wayback snapshot is the Imperva block page (189 bytes) | Real browser |
| **Whether current TI / Pain / VR schedules have been reissued** | Several fetched schedules are past their stated End Date | Real browser before quoting any rate |

### R3.7 THE ONE-PARAGRAPH IMPLICATION

Grading in this contract is **downside-only and disconnected from volume**. There is no bonus, no penalty, no rate variation, and — verified from ACC's own internal allocation procedure — **no performance input into who gets referred to whom**; allocation is geography plus the personal preference of a Recovery Team Member. What grading *can* do is trigger a performance improvement plan under Standard T&Cs cl. 14, make the supplier pay for repeat evaluations under cl. 13.7, and cost them the contract at renewal under cl. 1.2.2. And from 1 July 2026 the framework a supplier is judged by became **six ACC-computed measures with no numeric targets, four of them return-to-work, none of them supplier-reported** — which removes the last measure a documentation tool could have improved and makes any "we'll lift your scorecard" claim false. The single defensible commercial hook that survives is narrow and precise: **2026 schedule cl. 12.3.1 and Standard T&Cs cl. 14.2(b) both oblige ACC to hear a case-mix explanation before requiring change, and an objective exercise-tolerance measurement is the only kind of evidence a concussion supplier could bring to that conversation.** Sell it as the defence in the six-monthly performance meeting. Do not sell it as growth, and do not sell concussion as the door into a larger ACC exercise market — nine adjacent rehabilitation schedules were swept and **not one of them purchases exercise at all.**
