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
