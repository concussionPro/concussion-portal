#set page(paper: "a4", margin: (x: 1.9cm, y: 2.0cm), footer: context [
  #set text(size: 8pt, fill: rgb("#94a3b8"))
  Concussion Education Australia Pty Ltd · ABN 74 688 155 508 · INTERNAL — send list & pitch pack
  #h(1fr) Page #counter(page).display() of #counter(page).final().first()
])
#set text(font: "Helvetica Neue", size: 9.5pt, fill: rgb("#0f172a"))
#set par(leading: 0.62em)

#let accent = rgb("#0d9488")
#let slate = rgb("#475569")
#let muted = rgb("#64748b")

#let tag(t, c) = box(fill: c.lighten(82%), stroke: 0.5pt + c, radius: 3pt, inset: (x: 5pt, y: 2.5pt), text(size: 7.5pt, weight: "bold", fill: c.darken(20%), t))

#let org(n, name, tier, variant, to, contact, note) = block(breakable: false, spacing: 8pt)[
  #block(fill: rgb("#f8fafc"), stroke: 0.5pt + rgb("#e2e8f0"), radius: 6pt, inset: 10pt, width: 100%)[
    #grid(columns: (1fr, auto), align: (left, right),
      [#text(weight: "bold", size: 10.5pt)[#n. #name] #h(4pt) #tag("TIER " + tier, slate) #h(2pt) #tag("VARIANT " + variant, accent)],
      [])
    #v(3pt)
    #text(size: 9pt)[#text(weight: "bold", fill: accent)[To:] #raw(to)]
    #v(1pt)
    #text(size: 9pt)[#text(weight: "bold")[Contact:] #contact]
    #v(1pt)
    #text(size: 8.5pt, fill: muted)[#note]
  ]
]

// ── TITLE ────────────────────────────────────────────────────────────────
#block[
  #text(size: 20pt, weight: "bold", tracking: -0.3pt)[ACC Concussion Services — Supplier Outreach]
  #v(2pt)
  #text(size: 10.5pt, fill: muted)[Complete send list · verified addresses · citation-backed pitch — compiled 27 July 2026]
]
#v(4pt)
#line(length: 100%, stroke: 2pt + accent)
#v(8pt)

// ── THE PLAY ─────────────────────────────────────────────────────────────
#text(size: 12.5pt, weight: "bold")[The play, in one paragraph]
#v(3pt)
The contract obliges every supplier to deliver #text(weight: "bold")["assessment of exercise tolerance and/or functional capacity" (Cl. 5.8.2.1.2)] — while mandating a team (medical, neuropsych, psychology, OT, physio — #text(weight: "bold")[Cl. 5.2.1]) in which no discipline is trained at entry in graded exercise testing. Performance is scored from ACC's own data, #text(weight: "bold")[shared non-anonymised with every other supplier (Cl. 13.4)], and the one-year extension to 2028 is #text(weight: "bold")[conditional on ACC being satisfied (Cl. 1.2.2)]. #text(fill: accent, weight: "bold")[SST delivers the measured functional outcome and compiles the ACC884 as care happens; ESSA-accredited training (No. PDNF26077, 16 CPD) puts documented competency in the Cl. 15.2 quality file.]

#v(6pt)
#block(fill: rgb("#f0fdfa"), stroke: 0.5pt + accent, radius: 6pt, inset: 10pt, width: 100%)[
  #text(size: 9pt, weight: "bold", fill: accent.darken(15%))[EVIDENCE LINE — cite, never paraphrase]
  #v(3pt)
  #set text(size: 8.7pt)
  • Sub-symptom-threshold aerobic exercise is the consensus first-line treatment — Patricios et al., #emph[Br J Sports Med] 2023 (Amsterdam 6th Consensus). \
  • Median recovery 13 vs 17 days in the pivotal RCT — Leddy et al., #emph[JAMA Pediatrics] 2019 (n=103, adolescents; population caveat stays on /acc, not in the email). \
  • \~Two-thirds of rehab clinicians don't prescribe it — Dobney & Gagnon, #emph[Physiotherapy Canada] 2021 (n=555). \
  • ACC's January 2026 sport-concussion guideline endorses aerobic exercise — the funder endorsed the treatment and left the method open. Never pitch ACC as behind the evidence. \
  • Protocol: DOI 10.5281/zenodo.21482634 · Demo estate: portal.concussion-education-australia.com/acc
]

#v(6pt)
#block(fill: rgb("#fff7ed"), stroke: 0.5pt + rgb("#f59e0b"), radius: 6pt, inset: 9pt, width: 100%)[
  #set text(size: 8.7pt)
  #text(weight: "bold", fill: rgb("#92400e"))[STANDING RULES:] never "renewal point" (term runs to 30 June 2027 — a National Manager will catch it) · never imply ACC is behind the evidence · referral inboxes get the pass-to cover line, never the bare pitch · one follow-up at +7 business days, no third touch · replies are the only metric · the first call that lands gets THE question: #text(weight: "bold")[who pays — supplier margin, or recoverable within the funded service?]
]

#v(10pt)
// ── MASTER PITCH ─────────────────────────────────────────────────────────
#text(size: 12.5pt, weight: "bold")[THE OPENER — final. Demo + calendar links included (named-B2B lane; the zero-link rule is the bulk-engine doctrine, not this one).]
#v(3pt)
#block(stroke: (left: 2.5pt + accent), inset: (left: 10pt, top: 4pt, bottom: 4pt))[
  #set text(size: 9.5pt)
  #text(weight: "bold")[Subject: Improved sub-threshold rehab for concussion]
  #v(2pt)
  #text(size: 8.5pt, fill: muted)[Inbox-routed variant (admin triage needs a forwarding cue): "Improved sub-threshold rehab for concussion — measured, and it writes the ACC884"]
  #v(4pt)
  Hi \[Name\],
  #v(3pt)
  Prescribed sub-symptom aerobic exercise cuts median concussion recovery from 17 days to 13 (Leddy 2019, #emph[JAMA Pediatrics]) — but that rehab happens at home, at intensities nobody measured, and come reporting time you're proving outcomes to ACC from notes.
  #v(3pt)
  That bugged me enough in my own caseload that I built the fix: a guided test measures each patient's heart-rate threshold, their own watch verifies every home session, and the ACC884 compiles itself as care happens.
  #v(3pt)
  Behind it sits the only Australian concussion training endorsed by Osteopathy Australia and accredited by ESSA — so your physios and OTs run it properly, not just own it.
  #v(3pt)
  You can see the whole thing without a call — a sample ACC884 and the working clinician dashboard, no login: #text(weight: "bold")[portal.concussion-education-australia.com/acc]
  #v(3pt)
  And if a trained team and standardised, self-writing ACC884s across your service is worth 20 minutes: #text(weight: "bold")[cal.com/zac-lewis-so8zjs/30min]
  #v(3pt)
  Zac Lewis · Osteopath — Concussion Education Australia
]
#v(4pt)
#text(size: 9pt, fill: muted)[Two links, no attachments. 19 of 22 route via admin inboxes — the demo link survives the forwarding chain where a reply-CTA dies. Booking link converts the ready ones without a round-trip.]

#v(10pt)
#text(size: 12.5pt, weight: "bold")[THE REPLY — sent the moment anyone answers. Carries everything.]
#v(3pt)
#block(stroke: (left: 2.5pt + slate), inset: (left: 10pt, top: 4pt, bottom: 4pt))[
  #set text(size: 9pt)
  \[Name\] — here it is.
  #v(3pt)
  Everything is live, no login: #text(weight: "bold")[portal.concussion-education-australia.com/acc] — a sample ACC884 compiled from a demonstration episode, the clinician dashboard on an example caseload, and the patient app itself. Click through in any order.
  #v(3pt)
  How it hangs together: a guided graded test measures the client's heart-rate threshold; home sessions run in-band on the client's own watch — verified, never self-reported; the ACC884 content compiles as care is delivered instead of being rebuilt from notes at the deadline. Protocol published: DOI 10.5281/zenodo.21482634.
  #v(3pt)
  The training is written for the physios and OTs already on your team — graded exercise testing, threshold prescription and progression, return to work and sport, persistent symptoms, and the documentation. Endorsed by Osteopathy Australia; ESSA-accredited. It doubles as documented team competency for your quality file.
  #v(3pt)
  Easiest next step — grab any time that suits: #text(weight: "bold")[cal.com/zac-lewis-so8zjs/30min]
  #v(3pt)
  Zac
]
#v(4pt)
#text(size: 9pt, fill: muted)[The reply carries: /acc (demo estate — sample ACC884 + DEMO00 dashboard + patient app) and the cal.com booking link. NO attachments, ever — everything lives at the link. The pricing question ("who pays — supplier margin or recoverable within the funded service?") is asked ON the call, never in writing first.]

#v(8pt)
#text(size: 9.5pt)[#text(weight: "bold")[Cover line for every inbox-routed address:] "Could you please pass this to \[name / role\] — it concerns \[Org\]'s ACC Concussion Services contract. Thank you." #h(6pt) #text(weight: "bold")[Follow-up:] one, at +7 business days, quoting the original — no new links, no third touch.]

#pagebreak()

// ── WAVE 1 ───────────────────────────────────────────────────────────────
#text(size: 13pt, weight: "bold")[SEND LIST — all go out together. Order below is expected-value only.]
#v(5pt)
#org("1", "What Ever It Takes", "2", "A", "charmeyne@whateverittakes.co.nz  ·  brad@whateverittakes.co.nz   [DIRECT — published on own site]", [#text(weight: "bold")[Charmeyne Te Nana-Williams — Director] · Brad Takai — Clinical Manager], "Holds the contract across Auckland/BoP/Waikato and publishes ZERO concussion content — the sharpest capability gap with a DIRECT decision-maker address. The best send on this list.")
#org("2", "Hemisphere Health", "3", "A", "referrals@hemispherehealth.co.nz   [inbox + cover to the Newburns]", [#text(weight: "bold")[Dr Scott Newburn — Occupational Medicine Specialist & Director] · Gemma Newburn — Physiotherapist & Director], "7 staff, husband-and-wife owner-operators, Nelson contract, no concussion content, no procurement layer. Highest-probability fast close. RTW metrics are Scott's native professional language — add the line: 'for a two-director practice, the ACC884 compiling itself is your own hours back each cycle.'")
#org("3", "Geneva Healthcare", "1", "A", "info@genevahealth.com   [cover to Shane Rossiter]", [#text(weight: "bold")[Shane Rossiter — ACC & Specialist Team Manager]], "Contract held via NZ Health Group (2025 GETS awardee); no concussion service marketed anywhere. Frame as capability STAND-UP — greenfield, nothing displaced, 11 regions of upside.")
#org("4", "Bay Rehab", "2", "B", "admin@bayrehab.co.nz   [cover to Joss McDougall]", [#text(weight: "bold")[Joss McDougall — Managing Director, Physiotherapist]], "~75 staff, Tauranga. Decision-maker and clinician are the SAME PERSON — the master pitch lands without translation. Explicit ACC concussion service.")
#org("5", "Rope Neuro Rehabilitation", "2", "B", "admin@ropeneurorehab.co.nz   [cover to Julie Rope]", [#text(weight: "bold")[Julie Rope — Director & Senior Clinical Practitioner]], "22 clinicians, pure neuro specialisation, founder-led, contract-literate (ACC883 pathway described on site). Excellent early independent-reference candidate for Auckland.")


#org("6", "Axis Sports Medicine", "1", "B†", "info@axissportsmedicine.co.nz   [cover to Dr Fulcher]", [#text(weight: "bold")[Dr Mark Fulcher — Managing Director] · Dr Dan Exeter — Clinical Director], "† PEER REGISTER — they know Leddy; never explain the rationale. Sell the between-visit telemetry, cross-site consistency (8 sites incl. Queenstown) and clean data export. Use the Axis-specific copy in SENDS-2026-07-27.md.")
#org("7", "Active+", "1", "B", "headoffice@activeplus.co.nz   [cover to Dr Pauline Penny]", [#text(weight: "bold")[Dr Pauline Penny — Head of Service Delivery, Multidisciplinary Community Rehab]], "THE ANCHOR: 17/17 regions, 1,400+ clinicians, self-described 25% of all ACC concussion programmes. Angle = one measured standard across every region + documented competency at scale. Long procurement cycle — run in parallel, never wait on it.")
#org("8", "Laura Fergusson Brain Injury Trust", "2", "B", "hello@lfbit.co.nz   [cover to Pat Hopkins]", [#text(weight: "bold")[Pat Hopkins — Clinical Manager, Community Rehab] · Kathryn Jones — CEO], "220+ employees; a dedicated brain-injury CHARITY — the highest mission-alignment on the list. Warm the tone; the most detailed ACC concussion presentation of any supplier (ACC883 + ACC7412 pathways published).")
#org("9", "Align Health", "2", "B", "contracts@alignhealth.co.nz   [the only contracts@ on the list — lowest-friction door]", [Olivia Monaghan Johnson — Director (per Companies Office; site names nobody)], "8 sites, ~30 physios, Waikato. Explicit 'fully funded ACC pathway' page. The contracts@ address means the pitch lands on a desk that thinks in contract terms — lead with Cl. 5.8.2.1.2.")
#org("10", "Body In Motion Physio & Rehab", "2", "B", "admin@bodyinmotion.co.nz   [cover to the Concussion Service lead]", [Leadership unpublished — cover-line to role, not name], "~11 sites across BoP/Taranaki/Waikato; quotes the contract language verbatim on its own concussion page. Physio-led and contract-literate.")


#org("11", "Tui Allied Health", "3", "A", "referrals@tuialliedhealth.co.nz   [inbox]", [Leadership unpublished — Companies Office lookup pending], "8 staff, Hamilton, newly contracted in the 2025 round, no concussion content. Strong DESIGN-PARTNER profile — offer the pilot explicitly.")
#org("12", "Focus on Potential", "2", "C", "performance@focusonpotential.com   [cover to Cassandra Hopkins]", [#text(weight: "bold")[Cassandra Hopkins — Founder & Director]], "200+ clinicians (part of Access Community Health) — Tier 1 by size. Lists a concussion service, never says ACC.")
#org("13", "Rehab Taranaki", "3", "C", "admin@rehabtaranaki.co.nz   [cover to the Concussion/Neuro Physiotherapist]", [No owner named — one staffer titled Concussion/Neuro Physiotherapist], "Self-identifies as 'the leading provider of concussion services in Taranaki' — the warmest Tier 3 lead. Differentiation frame: their local rival is #14.")
#org("14", "Assessment Providers Taranaki", "3", "C", "admin@aptrehab.co.nz   [cover to the directors]", [#text(weight: "bold")[Dianne Mains & Helen Poppelwell — Directors since 2000] (Companies Office ✓)], "Two owner-directors, est. 2000, competing with Rehab Taranaki in the same small market — the Cl. 13.4 visibility argument lands hardest where two rivals share one region.")
#org("15", "Astech SRS", "2", "C", "mail@astechnz.com   [cover to Lynda Strathdee]", [#text(weight: "bold")[Lynda Strathdee — Founder] (Lorraine Grundy — advisory)], "Team of 23, Christchurch. Concussion mentioned only inside general TBI copy.")
#org("16", "APM Workcare", "1", "B", "nzreferrals@apmworkcare.co.nz   [cover to Emma Davidson]", [#text(weight: "bold")[Emma Davidson — Head of Clinical Excellence]], "Global parent, 15 regions, explicit ACC concussion service. Clinical-excellence title = the right desk for the measured-outcome argument.")
#org("17", "Habit Health", "1", "B", "via habit.health contact form   [to Mark Shirley — no email published]", [#text(weight: "bold")[Mark Shirley — Chief Innovation Officer] · Lauren Kilkolly — GM Regional Performance], "Largest by footprint: 125 locations, 2,500+ clinicians. New-capability pitch to the innovation desk; Kilkolly owns the performance metrics if Shirley doesn't bite.")
#org("18", "Advantage South", "2", "C", "referrals@advantagesouth.co.nz   [inbox]", [No leadership named — Companies Office lookup pending], "Dunedin/Timaru/Cromwell/Invercargill — covers Queenstown-Lakes; the Cromwell site is ~45 min from Queenstown. Relevant to the design-partner geography.")
#org("19", "Motus Health", "2", "C", "merivale@motushealth.co.nz  or  sportshub@motushealth.co.nz   [cover]", [Unverified — site blocks automation (403)], "A dedicated concussion-services URL exists; per-clinic addresses recovered. The sportshub@ address suggests the right clinical culture.")
#org("20", "Coastal Rehab Services", "2", "A", "admin@coastalrehabservices.co.nz   [inbox]", [⚠ Names surfaced in search are UNCONFIRMED — do not use any name], "Directory-described concussion/mTBI rehab across BoP; own site unverifiable (TLS broken). Role-addressed cover only.")

#v(8pt)
// ── HELD ─────────────────────────────────────────────────────────────────
#text(size: 13pt, weight: "bold")[EXCEPTIONS]
#v(5pt)
#org("21", "ABI Rehabilitation + Proactive Rehab — ONE GROUP", "1", "B", "enquiry@abi-rehab.co.nz  ·  enquiries@proactivehealthcare.co.nz", [Dr Christine Howard-Brown — CE (covers BOTH) · Michelle Wilkinson — GM (BOTH) · Dr Hamish Reid — Medical Director], "Shared executives — a pitch to one is visible to the other. ONE deliberate approach after wave-1 learnings; never two independent emails.")
#org("22", "TBI Health Group", "1", "—", "tbireferrals@tbihealth.co.nz   [cover to the clinical lead — role-addressed]", [Unverified — site blocks all automated checks], "Likely the most clinically sophisticated Tier 1 and the hardest to impress. Founder does a manual browser pass on leadership before any send.")
#org("23", "Specialist Rehab Services", "2", "—", "referrals@srsltd.co.nz   [cover to the clinical lead — role-addressed]", [Snippet-named founders are LOW-CONFIDENCE — do not use], "Widest Tier 2 footprint (5 regions). Site returns corrupted content; manual check first.")
#org("24", "Canterbury DHB (legacy entity)", "—", "—", "braininjuryrehab@cdhb.health.nz   [DEPRIORITISED]", [Entity folded into Te Whatu Ora — contracting arrangement unverified], "Public-sector procurement, no training budget, uncertain entity. A credibility reference later, not outreach now.")
