# IP Protection Strategy — AI Course / CPD Platform

**Status:** Strategy doc; some elements implemented, some recommended-only
**Last reviewed:** 2026-05-22

---

## The hard truth

You cannot protect the *idea* (passive CPD tracking is obvious once stated). You can protect:

1. The working demo (code, content, infrastructure)
2. The compliance course content (your IP, months to replicate at quality)
3. Your execution speed (first-mover advantage)
4. Brand and endorsements (OA endorsement is hard to replicate)

The single best protection is **launching retail first, then pitching with traction**.

---

## Honest review of the 4-level staged disclosure

Original proposal: L1 cold email → L2 first call → L3 NDA + sample → L4 deal signed.

**What's right:** the principle of progressive disclosure — never give everything away upfront.

**What's overcooked:** Four levels is too friction-heavy for B2B. Pre-screening senior execs through a video-only L1 to a no-screenshare L2 signals defensiveness rather than confidence. Real version:

| Level | What they see | Friction |
|---|---|---|
| **L1 — Cold email + 1-pager** | High-level pitch, business case, problem framing, the killer insight | Zero |
| **L2 — Demo with checkbox NDA + watermark + expiry** | Read-only demo of the marketplace, course shell, passive-CPD mockup, certification flow | One checkbox |
| **L3 — Deal terms agreed** | Full admin, content library, source code, technical docs | Signed paper agreement |

Two levels of protection, not four. A Heidi exec who can't book 20 minutes after a one-pager isn't going to commit to a partnership anyway.

## Honest review of multi-party pressure

Original proposal: pitch Heidi + Guild + Medcast simultaneously, tell each "first to commit gets exclusivity."

**This is risky.** The Australian AI healthcare market is small. Heidi and Guild may share advisors, investors, board members. If they find out you're shopping the deal — and they will — it signals you don't have a preferred partner, just a price. Hurts perceived value.

**Better:** Pick the highest-leverage target (Heidi). Run that pitch all the way through. If Heidi says "interesting, not now" — *then* approach Guild as the next-best, and only mention "we're also in conversations with one other partner" without naming them. Multi-party is a fallback, not an opening move.

The exception: Guild Insurance is *already* in motion via OA. Closing that loop is independent of the Heidi pitch and can happen in parallel without creating multi-party pressure.

---

## Launch-first strategy — strong recommendation

**Don't pitch Heidi first. Launch retail to the existing 600 CEA subscribers, get 20-50 paying customers, then pitch with revenue and traction.**

| Week | What |
|---|---|
| 1-2 | Soft-launch to CEA list at $297. Goal: 20-50 customers = $6-15k ARR + market signal. |
| 3-4 | OA endorsement for the AI course (extension of the existing concussion endorsement). |
| 5 | Pitch Heidi with: "30+ customers, OA-endorsed, $9k+ ARR growing weekly." |
| 6-9 | Heidi conversation matures or doesn't. Either way, you're already a business. |

**Why this works:**
- You stop *asking* for partnership and start *offering* it
- Revenue + endorsement + customer count = leverage no cold-pitch can match
- If they steal the idea, you already have a revenue stream and brand
- If they say yes, you negotiate from strength, not from need

**Counter-argument:** the AI compliance window is short — AHPRA's 2025 guidance creates urgency, competitors are watching. The "should I launch first or pitch first" question is really "is the alpha-window six weeks or six months?" Realistic answer: six months. Launch-first wins.

---

## What I'm building now — practical protection layer

| Protection | Effort | Status |
|---|---|---|
| `HEIDI_DEMO_KEY` env var + scoped demo access (already shipped) | Done | Live |
| `/courses/demo-access` landing — checkbox NDA + email capture + access grant | 1-2 hrs | Building now |
| Watermark on every course page when demo-key cookie present | 30 min | Building now |
| 7-day automatic expiry of demo cookie | 15 min | Building now |
| Access log — every demo viewer recorded (email, IP, timestamp, NDA agreement) | 30 min | Building now |
| Auto-redirect to expired-access page after 7 days | Trivial | Building now |

Total: ~2 hours. Lands today.

## On the checkbox NDA specifically

**Yes — this is the right balance.** Better than nothing, less friction than a paper NDA.

**What it does:**
- Forces affirmative agreement (legally enforceable under the Electronic Transactions Act 1999 if structured correctly)
- Captures email + IP + timestamp + the exact wording the user agreed to
- Establishes notice of confidentiality — makes any later "we built this independently" claim harder
- Provides basis for damages if breached

**What it does NOT do:**
- Stop a determined bad actor (no NDA does)
- Bind people the original viewer forwards the URL to (each first-access requires re-agreement)
- Replace a signed mutual NDA for actual deal negotiations

**Recommended NDA scope:**
- 18-month restriction on building a "substantially similar product" using the demo as a basis
- 24-month restriction on disclosing demo contents to third parties
- Permission to discuss within the recipient's organisation
- Carve-out for independent development without reference to the demo
- Australian law, NSW courts (or your preferred jurisdiction)

I'm building this with a clean checkbox UI on the landing page, not a 5-page legal scroll.

---

## What's missing from the original brief

Three protections worth considering that weren't in the original strategy:

### 1. Trademark filing — A$250-500

Register "Concussion Education Australia" and any product names (e.g. "AI in Clinical Practice" — though that's a generic phrase and may not be registrable). The certificate brand and any distinctive course names are registrable. Australian trademarks via IP Australia. Worth doing.

### 2. Patent attorney consult — A$300-500 for 1-hour consultation

The *idea* of passive CPD tracking isn't patentable. A *specific implementation* might be — e.g. "system and method for converting workflow-tracked clinical research activity into auditable CPD records." Even if no patent is filed, an hour with a patent attorney will tell you what is and isn't defensible. The conversation alone is useful intelligence.

Don't spend $10k on provisional patents without first knowing whether there's a defensible claim.

### 3. Prior-art publication

If a patent isn't viable, *publish the design*. A blog post titled "How healthcare AI tools should track passive CPD" with a timestamp creates prior art. Means no one else can patent the same idea later. Free, takes an hour, defensive moat against someone else trying to lock you out.

This is a 30-minute action with significant downside protection. Recommended.

---

## What protection actually buys you

Worst case: a determined competitor with funding decides to copy. They build it in 12 months. By then:
- You have 200-500 retail customers if you launched first
- $60-150k ARR
- OA endorsement on at least one product
- Multi-provider marketplace shell (the "supply" is the hard part — content + curation, not the platform shell)
- 12 months of content-refresh pipeline maintenance experience
- A brand clinicians associate with this category

The competitor builds the platform; you have the audience and the content. **Best protection isn't legal — it's speed and brand.**

---

## My recommendation for this week

1. **Build the demo-access NDA + watermark + expiry layer** (today, 2 hours — happening in this commit)
2. **Soft-launch retail to the CEA list** (this week, just send a single email)
3. **Schedule a 1-hr patent attorney consult** (next week, $300-500)
4. **Publish the passive-CPD blog post as prior art** (this week, 1 hour)
5. **Get OA on the AI course endorsement track** (this week, send email)
6. **Wait on the Heidi pitch until you have 20+ customers + OA endorsement signal** (3-4 weeks)

This sequence:
- Makes the Heidi pitch land from a position of strength
- Builds revenue alongside the partnership conversation
- Creates IP protections that don't cost much
- Doesn't depend on Heidi for survival

**The pitch is now insurance, not strategy.** Heidi is upside, not lifeline.
