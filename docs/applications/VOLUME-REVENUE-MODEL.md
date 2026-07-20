# Expected Volume & Revenue Model — Two Tracks

**Concussion Education Australia · built 20 July 2026**

Track A = CPD accreditation markets (product: **Concussion Rehab Mastery / CRM**).
Track B = NZ/ACC scheme market (product: **per-org licence + per-seat Concussion Clinical Mastery / CCM**).

---

## ⚠️ READ THIS BEFORE ANY NUMBER IN THIS DOCUMENT

**This is a model, not research.** Almost every revenue figure below is the product of an assumption I made, not a fact anyone verified. The population counts are mostly *asserted* — they do not appear in the submission packs in this directory and carry no source URL anywhere in the repo.

Every number is tagged. The tags are load-bearing:

| Tag | Meaning | How much to trust it |
|---|---|---|
| **`[V]`** | **VERIFIED** — appears in a submission pack *with* a named source | Reasonably. Still no URLs in the packs; see caveat below. |
| **`[D]`** | **DOC-ASSERTED** — stated in a pack, but with no citation or source | Treat as a working belief, not a fact. |
| **`[B]`** | **BRIEF-SUPPLIED** — given to me by Zac; **not found in any pack** | Unverified. These drive the whole model. |
| **`[A]`** | **ASSUMPTION** — invented by me for this model | Do not repeat these to anyone as facts. |
| **`[DEC]`** | **DECISION PENDING** — a price or term not yet set | Not a forecast; an open choice. |

**The single most important caveat.** I audited all seven submission packs. **Not one of them contains a market-size figure with a citation URL.** The population numbers in my brief — 164 CEP-UK registrants, 1,831 HPCSA biokineticists, 1,600 BASA, 50,000 ACSM certified, ~5,000 CSEP, 21,000 ACC claims, Active+ 1,400 clinicians — appear in the packs only in two cases (164 and ~5,000, both unsourced). The rest are **`[B]`: asserted in the brief and verified nowhere in this repo.** If any of them is materially wrong, the corresponding line in this model is wrong by the same factor.

**The packs also contain no price for CRM in any currency.** Every pack carries `[ZAC: confirm price]` as an unfilled placeholder. The USD $347 / $99 / $297 figures used throughout come from the brief `[B]`, not from any pack.

---

## 0. Global inputs

### Pricing `[B]` — from brief, not in any pack

| Item | Value | Tag |
|---|---|---|
| CRM licence, standard | USD $347 one-off | `[B]` |
| CRM annual renewal | USD $99/yr | `[B]` |
| CRM founding cohort, first 50 | USD $297 | `[B]` |
| Founding-cohort total discount | 50 × $50 = **$2,500**, one-off, portfolio-wide | `[A]` — I assume the 50 seats are shared across all markets, not 50 per market |
| CCM per-seat, organisational volume rate | USD $395 | `[DEC]` — **not set anywhere.** I invented this. AUD $1,400 sticker / $1,190 early-bird is the individual in-person rate; org volume must be lower. Decide before quoting. |

### FX rates used `[A]`

USD/GBP 1.27 · USD/ZAR 18.2 · USD/CAD 1.37 · USD/NZD 1.65. Spot at time of writing, unhedged, not locked.

### Renewal retention `[A]`

| Scenario | Rate | Justification |
|---|---|---|
| Conservative | 30% | Renewal must deliver *new* value each year. If year 2 is the same content, most lapse. |
| **Base** | **55%** | Statutory-CPD markets (ZA, ACSM, CIMSPA) have a recurring obligation, which is the strongest renewal driver at a $99 price point. Non-mandated markets will lapse harder. 55% is a blended figure across both types. |
| Optimistic | 70% | Requires annual content refresh *and* re-accreditation so the renewal itself carries fresh CEC/CPD credit. |

**This is an assumption with no empirical basis in CEA's own data.** There is no CRM renewal history to fit it to.

---

# TRACK A — CPD accreditation markets

## A1. Addressable populations and their provenance

| Market | Population | Tag | Notes on provenance |
|---|---:|---|---|
| CEP-UK / AHCS | 164 portfolio-route registrants | `[D]` `[B]` | The *only* market figure that appears in both the brief and a pack. Pack says "approximately 164", **no source URL**. |
| South Africa HPCSA | 1,831 biokineticists | `[B]` | **Not in the HPCSA pack at all.** Pack contains zero population figures. |
| South Africa BASA | ~1,600 members | `[B]` | Not in pack. **Assume heavy overlap with the 1,831** — I model a single addressable base of 1,831, not 3,431. `[A]` |
| ACSM | ~50,000 certified | `[B]` | **Not in the ACSM pack.** Pack has no count of any certification holder. |
| CASES (UK) | Not stated | `[A]` | Pack gives **no membership count** — only "social following of roughly 53,000" `[D]`, which is reach, not market. I assume **800** UK sport & exercise scientists with an SEM / graded-exertion caseload. This is a guess. |
| CSEP (Canada) | ~5,000 CPT + CEP | `[D]` `[B]` | Pack states "~5,000", no source. |
| CIMSPA (UK) | Not stated | `[A]` | Pack has **zero** population figures — the only pack with none at all. I assume **20,000** addressable members. Low confidence. |
| SESNZ | Not stated | `[A]` | No count in pack. I assume **250** CEPNZ/SESNZ clinical registrants. |

## A2. Year-1 conversion assumptions — every line justified

**None of these rates is observed. All are `[A]`.** They are reasoned from the demand character each pack describes.

| Market | Cons. | **Base** | Opt. | Justification for the base rate |
|---|---:|---:|---:|---|
| **CEP-UK** | 6% | **14%** | 25% | Highest rate in the model, and it earns it: an enumerable list of 164, **up to £650 of allocated CPD funding each** `[D]` (≈USD $825 — the price is *below* the budget, so price is not the objection), a competency framework CRM maps onto, and a **hard 31 Dec 2026 route closure** `[D]`. Three conditions rarely coincide. Discounted from what a funded+deadlined offer would normally convert because of the reachability gate: the pack flags UK GDPR/PECR lawful basis as "a real gate, not a formality", and if AHCS won't release or forward the list, effective reach collapses. |
| **South Africa** | 0.5% | **1.2%** | 2.5% | Statutory CPD makes this a genuine purchase, not discretionary `[D]`. But the pack's own instruction is explicit: *"Do not model this as a topic-competition win. Model it as a distribution problem with a favourable product position."* BioCPD owns the channel `[D]`; CEA has no route to the buyer. 1.2% ≈ 22 sales assumes CEA reaches roughly a quarter of the population in year 1 and converts ~5% of those. **See the price warning in A6 — this rate may be optimistic by a wide margin.** |
| **ACSM** | 0.05% | **0.15%** | 0.4% | Deliberately the lowest rate against the largest population. The pack is blunt that this is *"SCOPE EXPANSION, not unmet pain"* `[D]` — holders are not in distress about concussion, they have 60 CECs per 3-year cycle to fill and CRM covers ~13% of one `[D]`. Demand is obligation-driven and passive: discovery happens via catalogue browsing, not search intent. Zero concussion provision in the catalogue `[D]` means no competition for the term but also no established demand for it. 0.15% = 75 units from 50,000 — i.e. 1 in 667 certificants over a full year. Modest by design. |
| **CASES** | 0.8% | **1.9%** | 3.8% | Pack's own verdict: *"the demand here is real but narrow"* `[D]`. Real, because the practitioner carries graded-exertion responsibility without formal concussion-protocol training — a duty-of-care exposure. Narrow, because it only bites for those with an SEM caseload. Applied to a small assumed base (800), so the absolute number stays small regardless. Distribution is genuine (credits logo, e-newsletter, quarterly magazine, ~53k social) `[D]`. |
| **CSEP** | 0.02% | **0.10%** | 0.3% | Near-zero, per instruction and per the pack, which is the bluntest document in the set: *"in Canada the need is already met"*, CCMI is *"entrenched"* with *"a head start measured in years"*, and *"the realistic outcome is... not a Canadian revenue line"* `[D]`. 5 units is incidental spillover from a free directory listing, not a market. |
| **CIMSPA** | 0.02% | **0.06%** | 0.15% | Pack's own words: *"the demand here is manufactured, and that is the whole reason this listing exists... Members are not searching for concussion training. They are searching for endorsed points."* `[D]` Compliance buyers optimise for cheapest-compliant, and at $347 CRM will rarely be the cheapest way to bank 5 endorsed points. The 8-of-10-points coverage `[D]` is a real hook for the minority who want one purchase to clear the year. |
| **SESNZ** | 0.4% | **1.6%** | 4% | Small absolute base. Pack calls the listing *"a cheap credibility adjunct"* and says explicitly *"the SESNZ listing is not the New Zealand play. The ACC supplier channel is."* `[D]` Modelled as a trickle, with its real value booked in Track B. |

## A3. Year-1 unit volumes and gross revenue

| Market | Pop. | Cons. units | **Base units** | Opt. units | **Base revenue @ $347** |
|---|---:|---:|---:|---:|---:|
| CEP-UK | 164 | 10 | **23** | 41 | **$7,981** |
| South Africa | 1,831 | 9 | **22** | 46 | **$7,634** |
| ACSM | 50,000 | 25 | **75** | 200 | **$26,025** |
| CASES | 800 `[A]` | 6 | **15** | 30 | **$5,205** |
| CSEP | 5,000 | 1 | **5** | 15 | **$1,735** |
| CIMSPA | 20,000 `[A]` | 4 | **12** | 30 | **$4,164** |
| SESNZ | 250 `[A]` | 1 | **4** | 10 | **$1,388** |
| **Total** | — | **56** | **156** | **372** | **$54,132** |
| *less* founding-cohort discount | | −$2,500 | −$2,500 | −$2,500 | **−$2,500** |
| **Gross revenue** | | **$16,932** | **$51,632** | **$126,584** | |

**ACSM is 48% of the base-case Track A revenue** on the lowest conversion rate in the model. That concentration is a risk, not a strength — see §5 Sensitivity.

## A4. Application costs and payback

All figures `[B]` from the brief unless noted. Converted at the §0 rates.

| Market | Year-1 cost (USD) | Recurring | Units to payback @ $347 | Tag / note |
|---|---:|---:|---:|---|
| CEP-UK | **$0** | $0 | **0** | `[D]` Pack confirms: *"no provider scheme to apply to here and no fee to pay."* Only zero-cost market with strong demand. |
| SESNZ | **$0** | $0 | **0** | `[D]` Pack: *"Expect this to be free. Ask anyway."* Not confirmed. |
| South Africa | **~$110** | ~$110 per activity, cadence unknown | **1** | `[V]`-ish: R1,380 is a **UCT published benchmark, explicitly "not a quote"** `[D]`. **Per-activity, not per-provider**, and **non-refundable whether approved, declined or withdrawn** `[D]`. |
| CSEP | **~$180** | Unknown | **1** | `[B]` CAD $0–500; midpoint CAD $250. Pack says fee is **unpublished** and *"do not chase this if the fee is material"* `[D]`. Route 1 self-report is **free** `[D]`. |
| ACSM | **~$450** | ~$300/yr `[A]` | **2** | `[B]` $300–600, midpoint. Pack says the fee is **unpublished, revealed only inside the Formstack form** `[D]`, with an annual renewal. |
| CASES | **~$570** | ~$400/yr `[A]` | **2** | `[B]` £300–600, midpoint. **Pack has no fee figure at all** and warns the £1,800+VAT website figure is degree endorsement (CUES), **not** CPD — *"do not budget from it"* `[D]`. Rejections refunded minus £50 `[D]`. |
| CIMSPA | **~$1,065** | ~$1,065/yr | **4/yr, recurring** | `[D]` £700+VAT year 1 = £140 admin + £280 partner licence + £280 per product. **Year-2 re-endorsement rate is unconfirmed** `[D]`. Admin fee payable **before review**. |
| **Total** | **~$2,375** | **~$1,820/yr** | | |

**Payback read.** Six of seven markets clear their application cost inside two sales. Only **CIMSPA** carries a materially recurring cost against a market the pack itself calls manufactured — 4 sales a year just to stand still, against a base forecast of 12. It is positive but thin, and it is the one line where a conversion miss turns the market cash-negative.

## A5. Year-3 build

**Growth multipliers on year-1 base units — all `[A]`:**

CEP-UK ×0.15 (route **closes 31 Dec 2026** `[D]` — this market is a one-year window, then it is gone). South Africa ×1.8 then ×2.5 (channel is built, not bought). ACSM ×2.0 then ×2.7 (catalogue listing ramp is the dominant year-2/3 effect). CASES ×1.3/×1.6. CSEP ×1.0 flat. CIMSPA ×1.5/×1.8. SESNZ ×1.5/×2.0.

| Market | Yr-1 new | Yr-2 new | Yr-3 new |
|---|---:|---:|---:|
| CEP-UK | 23 | 3 | 3 |
| South Africa | 22 | 40 | 55 |
| ACSM | 75 | 150 | 200 |
| CASES | 15 | 20 | 24 |
| CSEP | 5 | 5 | 5 |
| CIMSPA | 12 | 18 | 22 |
| SESNZ | 4 | 6 | 8 |
| **Total new** | **156** | **242** | **317** |

**Base-case Track A P&L, 55% renewal retention `[A]`:**

| Line | Year 1 | Year 2 | Year 3 |
|---|---:|---:|---:|
| New licences @ $347 | $54,132 | $83,974 | $109,999 |
| Founding discount | −$2,500 | — | — |
| Renewals @ $99 | — | $8,514 (86 seats) | $17,820 (180 seats) |
| **Gross revenue** | **$51,632** | **$92,488** | **$127,819** |
| Application costs | −$2,375 | −$1,820 | −$1,820 |
| **Net revenue** | **$49,257** | **$90,668** | **$125,999** |
| **Cumulative net** | $49,257 | $139,925 | **$265,924** |

Conservative 3-yr cumulative net ≈ **$81,000** `[A]`. Optimistic ≈ **$690,000** `[A]`.

## A6. ⚠️ Two structural risks the model cannot price

**1. South African price/PPP mismatch — this could zero the market.** USD $347 ≈ **R6,300**. For context, the *entire accreditation fee* for a short course in South Africa is R1,380 `[D]`. A single CPD activity priced at 4.5× its own accreditation cost, sold into a profession where the incumbent (BioCPD) sets local price expectations, is very likely mispriced for the market. **The 1.2% base conversion assumes a price that may be unsellable.** If ZA needs regional pricing at, say, R1,800 (~$99), the revenue per unit drops 71% and the market needs 3.5× the volume to deliver the same line. Resolve pricing before spending the accreditation fee — which is **non-refundable regardless of outcome** `[D]`.

**2. South Africa has a hard sequencing rule.** *"HPCSA has not permitted retrospective accreditation of CPD activities since 1 November 2024"* `[D]`. Accreditation must precede enrolment. **Any ZA sale made before accreditation is unrecoverable CPD for the buyer** — geo-gate the checkout or you sell something that does not do what it says.

---

# TRACK B — NZ / ACC scheme market

## B1. Market facts and their provenance

| Fact | Value | Tag |
|---|---|---|
| New ACC concussion claims/yr | ~21,000 | `[B]` — **not in the SESNZ pack.** Pack contains no claim volumes at all. |
| Funded service episodes/yr | ~3,000–5,000 (15–25% referral rate) | `[B]` — not in pack. |
| Supplier organisations nationally | "a few dozen" → **30 modelled** | `[B]` + `[A]`. **Pack names no supplier at all.** |
| Largest supplier: Active+ | 1,400+ clinicians | `[B]` — **Active+ is not mentioned anywhere in the pack.** |
| Contract cycle | Started 1 July 2025, 1+1+1 — **year-one renewal point is now** | `[B]` |
| ACC884 six-monthly outcome reporting is mandated | Yes | `[D]` — the one ACC fact the pack does carry. |
| Mandated team composition = medical, neuropsych, psych, OT, physio — **none trained in exercise testing** | Yes | `[D]` — and this is the whole commercial thesis: the supplier is contractually obliged to deliver guideline-concordant care (post-Amsterdam 2022, that means HR-threshold-derived exercise) but the competency sits outside the mandated team. Solvable with training rather than a hire. |

**Why CCM and not CRM:** the buyer's clinicians are physiotherapists and OTs, not exercise physiologists. `[B]`

## B2. THE CRITICAL UNKNOWN — modelled both ways, deliberately unresolved

> **Is SST paid by the supplier out of contract margin, or is it recoverable within the funded service?**

This one question sets the licence price by an order of magnitude, and **I am not picking one.**

| | **LOW CASE — margin-funded** | **HIGH CASE — recoverable in-service** |
|---|---|---|
| Annual org licence `[B]` | **USD $3,000** | **USD $30,000** |
| Buyer's mental model | A cost against a thin contract margin. Procurement-scrutinised, benchmarked against other training spend. | An input to a funded service line. Priced against the value of the episode, not against margin. |
| Sales cycle | Longer. Needs an ROI case. | Shorter. Budget already exists. |
| Ceiling | Capped by supplier margin, which is small. | Capped by episode volume, which is large. |

**Answering this question is the highest-value hour of work in either track.** It is one conversation with one ACC supplier or ACC contract manager.

## B3. Deal-count assumptions `[A]`

| Scenario | Yr-1 deals | Avg seats/deal | Justification |
|---|---:|---:|---|
| Conservative | 2 | 6 | Two mid-size suppliers say yes off a founder-led approach at renewal. Assumes no large logo. |
| **Base** | **5** | **8** | 5 of ~30 suppliers = **17% national share in year one.** Aggressive for most markets; defensible here because the buyer set is tiny and enumerable, the renewal point is live now, and the ACC884 outcome-reporting obligation gives a procurement argument rather than a CPD argument `[D]`. |
| Optimistic | 10 | 12 | 33% national share including one large logo (Active+ scale would alone add ~60 seats `[A]`). |

**Seat counts are assumptions.** No supplier headcount data exists in this repo beyond the Active+ figure `[B]`.

## B4. Year-1 revenue, both scenarios

**LOW CASE — $3,000 licence**

| Scenario | Deals | Licence rev | Seats | Seat rev @ $395 | **Total** |
|---|---:|---:|---:|---:|---:|
| Conservative | 2 | $6,000 | 12 | $4,740 | **$10,740** |
| **Base** | **5** | **$15,000** | **40** | **$15,800** | **$30,800** |
| Optimistic | 10 | $30,000 | 120 | $47,400 | **$77,400** |

**HIGH CASE — $30,000 licence**

| Scenario | Deals | Licence rev | Seats | Seat rev @ $395 | **Total** |
|---|---:|---:|---:|---:|---:|
| Conservative | 2 | $60,000 | 12 | $4,740 | **$64,740** |
| **Base** | **5** | **$150,000** | **40** | **$15,800** | **$165,800** |
| Optimistic | 10 | $300,000 | 120 | $47,400 | **$347,400** |

## B5. Year-3 build

Assumptions `[A]`: licence retention **80%/yr**; **+4 new deals** in each of years 2 and 3; seat revenue continues at ~45 seats/yr from clinician churn (~20%) plus new-deal onboarding.

Active orgs by year 3: 5×0.8² + 4×0.8 + 4 ≈ **10.4**.

| | Yr-1 base | Yr-2 base | **Yr-3 base** |
|---|---:|---:|---:|
| **LOW** — licence | $15,000 | $19,200 | $31,200 |
| **LOW** — seats | $15,800 | $17,775 | $17,775 |
| **LOW total** | **$30,800** | **$36,975** | **$48,975** |
| **HIGH** — licence | $150,000 | $192,000 | $312,000 |
| **HIGH** — seats | $15,800 | $17,775 | $17,775 |
| **HIGH total** | **$165,800** | **$209,775** | **$329,775** |

**Application costs for Track B: $0.** There is no accreditation body to pay. The real cost is founder sales time (~20 days year 1 `[A]`) and possibly ACC-alignment documentation.

**The 80% retention assumption has a specific cliff.** The ACC contract cycle is 1+1+1 `[B]` — the entire scheme re-tenders. If a supplier loses its ACC contract, its CEA licence goes with it, regardless of how satisfied it was. That is a correlated risk across the whole book, not independent per-account churn. 80% is reasonable within a cycle and unreliable across a re-tender.

---

# 4. The two tracks side by side — and the founder's question

## 4.1 Year-1 base case

| | Track A (CPD, all 7 markets) | Track B LOW | Track B HIGH |
|---|---:|---:|---:|
| Gross revenue | $51,632 | $30,800 | $165,800 |
| Costs netted | −$2,375 | $0 | $0 |
| **Net revenue** | **$49,257** | **$30,800** | **$165,800** |
| Transactions required | **156 sales** | **5 deals** | **5 deals** |
| Revenue per transaction | $331 | $6,160 | $33,160 |

## 4.2 Direct answer to the thesis

> *"~10 organisational deals could match the entire CPD-track projection from a handful of sales rather than several hundred."*

**The thesis is correct in the HIGH case and wrong in the LOW case. It hinges entirely on the funding-mechanism question.**

| Question | LOW case | HIGH case |
|---|---|---|
| Does 10 deals match the whole CPD track (yr-1 base, $49,257)? | **Yes — $77,400 at 10 deals, 1.6× the CPD track.** But 10 deals is the *optimistic* scenario: 33% national share in year one. | **Yes, overwhelmingly.** 10 deals = $347,400 = **7× the CPD track.** |
| How many deals to match the CPD track exactly? | **~8 deals** (~27% national share) | **~1.5 deals** |
| Does the *base* case (5 deals) match it? | **No — $30,800 is 63% of the CPD track.** | **Yes — $165,800 is 3.4× the CPD track.** |
| Year 3 | $48,975 vs CPD $125,999 — Track B is **39%** of Track A | $329,775 vs $125,999 — Track B is **2.6×** Track A |

**The precise answer:**

- **If SST is recoverable within the funded service (HIGH):** the thesis is not just correct, it is understated. **Two deals** beat the entire seven-market CPD portfolio, and they beat it in weeks rather than a year. Under this scenario Track A is a credibility and distribution asset, and Track B is the business.
- **If SST comes out of supplier margin (LOW):** the thesis fails at the base case. Matching the CPD track requires **~8 of ~30 suppliers — 27% of the national market in year one**, which is not "a handful". Track B is then a good, high-margin, low-cost-of-sale *complement* to the CPD track, worth ~60% of it, not a replacement for it.
- **In both cases Track B is dramatically more efficient per unit of effort** — 5 conversations versus 156 individual transactions, with **zero application fees** against Track A's $2,375. Even the LOW case earns its place; it just doesn't earn the headline.

**Neither case argues for abandoning Track A.** CEP-UK and SESNZ cost $0 to enter, and SESNZ is explicitly the credibility adjunct that makes the ACC supplier conversation easier `[D]`. The accreditations are also what make the CCM seats defensible inside a supplier's own quality reporting.

## 4.3 Portfolio year-1 base case

| | Total net revenue |
|---|---:|
| Track A + Track B LOW | **$80,057** |
| Track A + Track B HIGH | **$215,057** |

---

# 5. Rankings — these two orders are genuinely different

## 5.1 By expected revenue per unit of founder effort (year-1 base)

Effort estimates are `[A]`, in founder-days.

| Rank | Market | Yr-1 base net | Effort (days) | **$/day** |
|---:|---|---:|---:|---:|
| 1 | **NZ/ACC — HIGH case** | $165,800 | 20 | **$8,290** |
| 2 | **ACSM** | $25,575 | 8 | **$3,197** |
| 3 | SESNZ | $1,388 | 0.5 | $2,776 ⚠️ |
| 4 | CSEP | $1,555 | 1 | $1,555 ⚠️ |
| 5 | **NZ/ACC — LOW case** | $30,800 | 20 | **$1,540** |
| 6 | **CEP-UK** | $7,981 | 6 | **$1,330** |
| 7 | South Africa | $7,524 | 7 | $1,075 |
| 8 | CASES | $4,635 | 6 | $773 |
| 9 | CIMSPA | $3,099 | 6 | $517 |

⚠️ **The ratio lies at the bottom of the table.** SESNZ and CSEP rank 3rd and 4th on efficiency purely because their denominators round to nothing. Neither produces a revenue line worth managing. Do them because they are nearly free and they support other channels — not because this ranking flatters them. **Rank by absolute contribution and you get: NZ/ACC, ACSM, CEP-UK, South Africa, everything else.**

## 5.2 By time to first dollar

| Rank | Market | Time to first revenue | Gate |
|---:|---|---|---|
| 1 | **CEP-UK** | **2–4 weeks** | No application, no fee `[D]`. Only gate is UK GDPR/PECR lawful basis for the contact list — *"a real gate, not a formality"* `[D]`. If AHCS won't release or forward, this collapses to an AHCS-partnership play. |
| 2 | **NZ/ACC** | **4–12 weeks** | Pure sales cycle. **No accreditation gate at all.** Renewal point is live now `[B]` — this window is open and will close. |
| 3 | CSEP (Route 1) | 2–4 weeks | Free member self-report `[D]` — but near-zero volume. |
| 4 | SESNZ | 2–6 weeks | Listing, not review. Turnaround unknown `[D]`. |
| 5 | CASES | 6–10 weeks | ≥2-week review **floor** `[D]`, actual turnaround unknown; distribution arrives on newsletter/magazine cycles. |
| 6 | South Africa | 8–14 weeks | Accreditation **must precede enrolment** `[D]`; turnaround unknown; fee sunk regardless of outcome `[D]`. |
| 7 | **ACSM** | **~4 weeks review + 3–6 month listing ramp** `[B]`/`[A]` | Review is fast; **revenue is not.** Catalogue-driven passive discovery takes months to reach steady state. The largest Track A line is also the slowest to arrive. |
| 8 | CIMSPA | 8–14 weeks | **Bi-monthly submission windows** `[D]` — paying into a closed window buys a wait, not a review. Resubmission adds 30 working days `[D]`. |

**The two rankings disagree in a way that matters.** ACSM is #2 on revenue-per-effort and #7 on speed. CEP-UK is #6 on revenue-per-effort and #1 on speed *and* has a hard expiry. **Sequence by deadline, not by size:** CEP-UK and NZ/ACC first because their windows close; ACSM immediately after because its ramp needs the most calendar time to pay off in year 1.

---

# 6. Sensitivity — the three assumptions that move the answer

### 1. The NZ funding mechanism — **by far the largest single lever**

| | Portfolio yr-1 net |
|---|---:|
| LOW ($3k licence) | $80,057 |
| HIGH ($30k licence) | $215,057 |
| **Swing** | **+$135,000 — 2.7× the entire Track A base case** |

This is one unanswered question, resolvable by one conversation, worth more than every accreditation application combined. **Nothing else in this model deserves attention until it is answered.**

### 2. ACSM conversion rate — the concentration risk in Track A

ACSM is **48%** of Track A base revenue on the model's *lowest* conversion rate.

| Rate | ACSM yr-1 | Track A yr-1 gross | Change |
|---|---:|---:|---:|
| 0.05% (cons) | $8,675 | $34,282 | −34% |
| **0.15% (base)** | **$26,025** | **$51,632** | — |
| 0.40% (opt) | $69,400 | $95,007 | +84% |

The rate is applied to a population figure (50,000) that is **`[B]` — asserted in the brief and absent from the ACSM pack**. A wrong population *and* a wrong conversion rate compound. Verify the certificant count before treating this line as real.

### 3. South African price fit — a binary, not a slider

Not a conversion-rate sensitivity but a go/no-go. At $347 (≈R6,300) against an incumbent setting local price norms, the base 1.2% may be optimistic by 3–5×. At a PPP-adjusted ~$99, unit revenue falls 71% and needs 3.5× volume to compensate. **The market is either priced right and works, or priced wrong and returns nothing** — and the accreditation fee is spent either way `[D]`.

### Honourable mention: renewal retention

Irrelevant to year 1. Moves year-3 recurring revenue between $9,720 (30%) and $22,680 (70%) — third-order on the P&L. **But it is first-order on enterprise value**, because recurring revenue is what a multiple attaches to. Worth engineering for even though it barely shows up in these tables.

---

# 7. What to do with this model

1. **Answer the NZ funding question this week.** It is worth more than the rest of this document.
2. **Start CEP-UK now.** $0 cost, fastest to revenue, and it expires 31 December 2026 — this market does not exist in year 2.
3. **Resolve the UK GDPR/PECR list question in parallel**, because it determines whether CEP-UK is direct outreach or an AHCS partnership.
4. **Submit ACSM early despite it being slow** — the listing ramp is the long pole in year-1 Track A revenue.
5. **Decide the CCM per-seat price before any ACC conversation.** It is `[DEC]` — undecided — and you cannot quote from this model.
6. **Decide ZA regional pricing before paying the ZA accreditation fee.** The fee is non-refundable and the sequencing rule is unforgiving.
7. **Defer CIMSPA.** The pack's own advice, and this model agrees: recurring cost against manufactured demand, worst revenue-per-effort in the portfolio, and *"the market is created by a rule, and rules do not churn."* `[D]`
8. **Replace `[B]` figures with sourced ones.** Seven population numbers currently carry the model and none of them has a citation.

---

*Every figure in this document tagged `[A]`, `[B]` or `[DEC]` is a modelled or asserted number, not a researched one. Do not quote them to a partner, an accreditor, or an investor as findings.*
