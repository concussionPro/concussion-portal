# Heidi Cold Email — Paul Williamson (CRO), Primary

**Recipient:** Paul Williamson, Chief Revenue Officer, Heidi Health
**Trigger:** Send only AFTER 20-30 paying customers + initial OA-review-for-AI-course signal
**Subject options** (pick one):
- A: "$6M GMV opportunity — Heidi already runs the workflow"
- B: "CPD marketplace inside Heidi — $1.5M ARR vertical, 30 customers proven"
- C: "Marketplace partnership for Heidi — recurring revenue from an existing workflow"

Recommended: **Option A** — leads with the dollar number and the structural advantage.

---

## Body (~280 words)

Hi Paul,

I'm Zac Lewis — Australian osteopath, founder of Concussion Education Australia (Osteopathy Australia–endorsed, 600+ practitioners). Congrats on the CRO role.

I've identified a recurring-revenue vertical that maps tightly to Heidi's structural advantage: research already happens in your platform.

**The opportunity.** Australian clinicians do 100-400 hours of CPD-qualifying activity per year inside their daily workflow — literature searches via Evidence, guideline reviews, case research. None of it gets logged because manual CPD tracking has too much friction. End of year, they panic-buy formal courses.

Heidi can capture those hours automatically. One discreet prompt after a session: *"You spent 45 min researching diabetes — log as CPD?"* One tap, AHPRA-ready. 60-80% of an AHPRA clinician's 50-hour annual requirement, earned passively. The 10-20h gap they still need is the monetisation surface — a curated CPD marketplace.

**The economics.** 15,000 AU users × $400/year avg CPD spend = **$6M GMV. At 25% marketplace commission: $1.5M ARR.** At your 50k 2027-28 target, $5M ARR. Improves ARPU + retention + competitive moat (passive tracking requires in-platform workflow — Lyrebird and Medcast can't copy).

**The traction.** 30 paying customers in the first three weeks at $297 (course + 12-month CPD record), $9k ARR growing ~20%/month, OA reviewing for endorsement. Compliance angle (AHPRA's 2025 AI guidance) is the wedge for enterprise sales — solves "how do we ensure compliant AI use?" objection.

I've built the platform: passive-CPD demo, curated marketplace shell, certification infrastructure, monthly content-refresh pipeline. Live and partner-gated.

**The ask.** 20 minutes to walk through the model. If commercial fit is there, happy to loop in Ben for clinical validation as a next step.

— Zac
zac@concussion-education-australia.com

**Demo (NDA-gated):** portal.concussion-education-australia.com/courses/demo-access?key=[insert one-time key]
**Attached:** 1-pager covering passive-CPD economics, three commercial paths, pilot scope

---

## Why this version of the email works for a CRO

| Lever | Effect |
|---|---|
| Opens with traction (30 customers, $9k ARR, growing 20%/mo) | Signals "this isn't theory — there's already a revenue pattern." CROs respond to revenue signals. |
| Names a specific number ($1.5M ARR at 25% commission) | Gives him a concrete figure to anchor against his own bookings target. |
| Frames Heidi's existing infrastructure as the moat | Doesn't ask him to build anything — just to capture what's already happening. |
| Anti-Medcast / anti-Lyrebird framing | Pre-empts the "why doesn't an incumbent do this?" question. |
| Specific KPI improvements (ARPU + retention + moat) | Maps directly to CRO OKRs without being explicit about it. |
| "Loop in Ben for clinical validation" | Signals you understand Heidi's org structure. Implies you're not trying to bypass clinical governance. |
| 20-minute call ask | Lowest-commitment yes. CROs measure their day in 15-min blocks. |
| Demo URL inline | Lets him verify the build is real before deciding to reply. |

## What this email does NOT do

| Avoids | Why |
|---|---|
| Lead with "fourth act of Care Partner strategy" | That's strategic / product framing — Dr Condon's territory, not Paul's. Leading there signals you don't know his job. |
| Mention the AHPRA Code of Conduct in para 1 | Compliance is the wedge, not the lede. Paul cares about revenue; clinical validation is the secondary check. |
| Use words like "vision," "alignment," "strategic fit" | These slow a CRO down. Use "opportunity," "ARR," "commission," "traction." |
| Ask for a "strategic discussion" | Ask for "20 minutes to walk through the model" — operationally specific, low commitment. |
| Multi-party pressure framing | Don't say "I'm talking to 2-3 partners" in the first email. It can read as shopped if not done carefully. Save for the follow-up if needed. |

---

## Send-day checklist

1. **Generate one-time `HEIDI_DEMO_KEY`** (32-byte random hex) and set in Vercel env
2. **Verify demo flow** — `/courses/demo-access?key=<KEY>` → NDA accept → `/courses` with watermark
3. **Render `docs/heidi-onepager.md`** → PDF
4. **Confirm Paul Williamson's email** via LinkedIn (sales-navigator-style verification or RocketReach)
5. **Cross-check his title is still CRO at Heidi** (people change roles)
6. **Send window:** Tuesday-Thursday 8-10am US-Pacific or AEST evening (he's in SF per public profile)
7. **CC:** no one. **BCC:** yourself.
8. **Follow-up cadence:** 5 days (CRO inboxes move fast — don't wait 7 like with clinical), 12 days (one new data point — e.g. "ARR up to $14k since I emailed"), then drop.

## Demo prep (15 min)

1. Confirm `/courses/cpd-record/passive` (the killer feature) renders correctly
2. Confirm `/courses` marketplace catalogue with 2 verified + 2 placeholder providers
3. Confirm `/courses/cpd-record` audit-export dashboard
4. Confirm `/courses/ai-in-clinical-practice` Module 1 loads with infographics + quizzes
5. Confirm CCM access via demo cookie: `/dashboard` + `/modules/1` + `/reference`
6. Take the AI quiz, generate a certificate, confirm PDF export works
7. Have `docs/heidi-dr-condon-strategic-brief.md` and `docs/heidi-contact-strategy.md` open for follow-ups

## Call-day walkthrough (20 min, CRO-paced)

1. **1 min** — Recap the $1.5M ARR opportunity at current scale; $5M at 50k users.
2. **3 min** — `/courses/cpd-record/passive` demo. The one-tap prompt + event timeline + moat panel. *"This is what no scribe competitor can copy."*
3. **2 min** — `/courses` marketplace shell + `/courses/how-we-vet` curation policy. *"This is the supply side — we vet, you distribute."*
4. **2 min** — `/courses/ai-in-clinical-practice` Module 1 (proof of content quality — show one section).
5. **2 min** — Certification flow + verifiable URL. *"Cert renewal is the recurring layer."*
6. **3 min** — CCM dashboard quick tour (`/dashboard`, `/modules/1`). *"We have an existing $1,190 product that's OA-endorsed — proof we can deliver clinical content at this quality."*
7. **3 min** — Commercial models: white-label licensing ($150-300k/yr + bounty), endorse-and-distribute (30% rev share), build-it-together (hire-Zac).
8. **4 min** — Discuss next step. If yes: scope a 100-user pilot, agree timeline, agree what success looks like. If maybe: agree on what data he needs to see in 30 days.

---

## If Paul declines

If Paul says "not us, talk to X" — that's a routed referral, treat as a warm intro. If X is Dr Condon, the original email frame (strategic-vision Dr Condon track) becomes the right one.

If Paul says "interesting, not now" — drop into a 30-day nurture. Send one update per month (new ARR milestone, new partner signed, OA endorsement confirmed). Reopen the conversation at month 4-6 with new traction.

If Paul ghosts after 12 days — pivot to Dr Condon. Subject: "Following up on a partnership note I sent Paul Williamson — Zac Lewis, CEA." Reference the same demo URL.

---

## The Dr Condon fallback email

Saved at `docs/heidi-cold-email-condon-fallback.md` — the original strategic-vision version. Use only if Paul Williamson declines or ghosts, OR if you have a warm intro to Dr Condon via a mutual contact.
