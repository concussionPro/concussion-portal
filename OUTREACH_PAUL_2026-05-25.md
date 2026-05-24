# Outreach — Paul Williamson (CRO, Heidi Health)

Send Monday 2026-05-25, afternoon AU time.

Demo URL: `https://portal.concussion-education-australia.com/d/heidi-h8k3q9p`

The slug pre-fills Paul's name on the NDA acceptance page, sets a 7-day demo cookie, and lands him on the guided tour (`/courses/heidi-tour`). The new "Start here · 3-stop tour" pinned card walks him through the three Heidi-relevant surfaces in ~6 minutes.

---

## Email draft

**Subject:** CPD layer for Heidi Evidence + Scribe — 6 min look

Hi Paul,

Quick follow-up. I've built the CPD layer for Heidi Evidence + Scribe end-to-end and it's live on the platform. The 3-stop tour is ~6 minutes:

→ https://portal.concussion-education-australia.com/d/heidi-h8k3q9p

The framing in one sentence: every Heidi Evidence guideline review is literature-review CPD, every Scribe session adds clinical-reasoning CPD, AHPRA already counts both — but your AU users log none of it. The tour shows the platform that turns those events into audit-grade CPD against the right Board ceiling.

What's running today:
- AI in Clinical Practice course (9 modules, AHPRA-aligned, Heidi recommended as Tier A throughout) — launches publicly 1 June.
- Concussion Clinical Mastery (live, Osteopathy Australia–endorsed, A$1,190) on the same platform.
- Passive-CPD categoriser keyed against all 15 AHPRA Boards + RACGP + ACRRM.
- POST /api/cpd/events — curlable today, ~2 engineer-weeks your side for an integration MVP.

I'm at OA Conference 16–17 October on the Gold Coast (concussion talk, Heidi demoed live in-session if you're game). Happy to lock 30 min before then — Tuesday or Wednesday next week works.

The demo URL is NDA-gated and tied to your name. 7-day cookie, you can come and go without re-agreeing.

Zac
Founder, Concussion Education Australia
[ABN] · [phone] · z.lew87@gmail.com

---

## Talking points (for live conversation)

Use only the ones Paul asks about. Don't volunteer.

### 1. Why this matters for Heidi commercially
- Healthcare CPD is a ~A$480M AU vertical, fragmented, no provider >30% share, no quality authority.
- Heidi has the distribution + event stream nobody else has — Scribe and Evidence sessions are already happening at scale in AU.
- Competitors (Abridge, Nabla, DeepScribe) are scribe-only — no Evidence equivalent, no CPD framing available to them. This is a structural moat.
- The CPD layer is a wedge product. Once Heidi is the auto-CPD source, switching cost goes up significantly per AU user.

### 2. What "integration" actually means
- One POST endpoint: `POST /api/cpd/events`. Reads Heidi's existing event metadata.
- No new UX surface in Heidi. No replatforming. ~2 engineer-weeks your side.
- 6-week joint MVP — co-branded pilot to a subset of AU AHPRA users.
- I'm the CPD layer; you're the workflow layer. Clean division of labour, neither party reinvents the other.

### 3. Revenue model — options to discuss
Three credible structures, in order of complexity:
- **Affiliate / revenue share** — Heidi recommends CEA courses to AU users at cost. Simplest. Aligned incentives.
- **White-label CPD inside Heidi** — Heidi-branded CPD record inside the Heidi app, powered by CEA. More integration work, deeper moat.
- **Acquisition** — CEA's IP + AU regulator relationships + course pipeline at fair valuation. Discuss only if Paul opens that door.

### 4. Things Paul will probably ask
- *"Are you OA-endorsed for the AI course too?"* — In progress. CCM is endorsed today; AI course endorsement pending. Honest answer.
- *"Why should we partner vs build this ourselves?"* — Three reasons: 12 months of AHPRA Board calibration work already done; clinician-network trust (osteopath, OA conference speaker, AU sub base); CEA absorbs the regulatory risk of CPD claims, Heidi doesn't have to own that.
- *"What's your scale today?"* — 487 subscribers, 17 paying customers. Honest. The play here is Heidi distribution multiplying that, not me pretending I'm already at scale.
- *"Why are you so confident the polyvagal / wellness market won't dilute this?"* — Different audience. CEA is AHPRA-clinician-facing, evidence-graded, regulator-aligned. The course content (see Vagus course Module 1) directly critiques the wellness-market overclaims.

### 5. What NOT to over-promise
- Don't claim the AI course is OA-endorsed yet (it isn't).
- Don't promise specific user numbers Heidi can hit through the integration — Paul will ask, but say "we'd model that together with your AU user-base data".
- Don't commit to an exclusivity deal in this first conversation. Floats only.
- Don't bring up acquisition unless Paul does.

---

## Pre-send checklist (Monday morning)

- [ ] Click the demo URL in an incognito window. Confirm NDA page loads with Paul's name pre-filled.
- [ ] After NDA acceptance, confirm the guided tour shows the "Start here · 3-stop tour" pinned section at top.
- [ ] Click stop 1 → AI course landing. Confirm AdminPreviewBadge shows. No 404s.
- [ ] Click stop 2 → passive CPD demo. Confirm event timeline renders.
- [ ] Click stop 3 → integration spec page. Confirm curl example visible.
- [ ] Click "References" inside AI course. Confirm new "Go Deeper · Podcasts, Videos, Webinars" category renders with 8 entries.
- [ ] Click "Hub → Literature search". Confirm 8 suggested-query buttons render. Click one to confirm PubMed query runs.
- [ ] Confirm `HEIDI_DEMO_KEY` env var is set in Vercel production.
- [ ] Send email from `zac@concussion-education-australia.com` (not the Gmail).
- [ ] Set a calendar follow-up for 2026-06-01 — if no reply, single bump.

---

## If Paul doesn't reply within a week

Single follow-up. No more.

> Hi Paul, no pressure on the below — sending a single bump in case it landed in spam. The demo is still active at the same URL.
>
> Quick context: OA Conference is locking the agenda in early June. Knowing if you'd want to be in the room (or remote dial-in to my talk) helps me know what to flag in advance.
>
> If this isn't the right time, no worries — pointer to who else at Heidi might be a better fit is welcome.
>
> Zac

If no reply after the bump: stand down for 6 weeks, then a different angle (e.g., a relevant AHPRA development, an OA conference moment, a specific Heidi product release).
