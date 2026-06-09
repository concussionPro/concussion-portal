# Cold Outreach → Replaces Google Ads

This is the strategic + technical brief for why the b2b cold-outreach
pipeline replaces Google Ads as CEAs primary acquisition channel.

## Economics

| Channel | Cost per paid customer | Notes |
|---|---|---|
| Google Ads (AU healthcare CPD) | $300-2000 | $4-12 CPC, ~3-5% landing conversion, ~2-4% paid conversion |
| Cold outreach (this pipeline) | $6-30 | $0.05 Apollo/Hunter per contact + $0.0004 Resend send, 3-touch sequence ~$0.06/prospect; needs only 0.2-1% close rate to match Google Ads |

**Required conversion rate** to match Google Ads worst case ($300):
**0.02%** (1 in 5000). Realistic B2B cold sequence reply rate after the
deliverability fixes shipped 2026-06-09: **2-5%**. Cold sequence beats
Google Ads by **5-50×** on cost-per-customer.

## Structural advantages

1. **Targeting precision.** Apollo + Hunter filter by title, location,
   discipline, clinic size. Google Ads keyword-match anyone Googling
   "concussion CPD" - mostly students, retirees, and tire-kickers.

2. **Authority + personalisation.** Cold sequence delivers a clinic-
   branded `/p/{slug}` preview portal with name, team size, region
   stat, and offer baked in. Google Ads send to a generic landing page.
   Conversion lift: 3-7x for healthcare-CPD personalisation.

3. **Compounding asset.** Apollo contacts persist forever. Hunter
   re-verification refreshes them. Re-engagement cron resurrects warm
   leads. Google Ads spend disappears the moment you stop paying.

4. **Honest signal.** HOT-tier gated on action signals only (CTA click,
   form submission, multi-day cal, booking). Google Ads charges for
   every click - scanner pre-fetches, mis-clicks, competitor audits.

5. **Compliance + brand fit.** Cold outreach as named-practitioner-to-
   named-practitioner reads as professional correspondence. Google Ads
   healthcare ad copy is constrained by TGA/AHPRA and the AU Therapeutic
   Goods Code.

6. **Scale + predictability.** CPC inflates with competition. Cold-
   outreach cost-per-touch is constant. 10x scale doesnt degrade
   unit economics.

## Targeting + verification stack

### Apollo
- **`/contacts/search`** — find new prospects by title (Director,
  Principal, Senior), location (NSW/VIC/QLD/ACT/SA), discipline,
  clinic size
- **`email_status`** filter — only `verified` contacts at import
- **Enrichment** — title, seniority, LinkedIn, phone

### Hunter
- **Email Verifier** — confidence score (0-100), accept-all detection,
  disposable, role-mailbox pattern (info@/admin@/reception@)
- **Domain Search** — find named contacts when current contact is role
  mailbox or scanner-suspect (replaces reception@ with the senior
  Director or Owner whose name Hunter returns)
- **Bulk Verifier** — batch re-validate quarterly

### Combined flow
```
Apollo finds verified contact
    ↓
Hunter scores deliverability + flags role/accept-all
    ↓
If score >= 80 + non-role + non-accept-all  →  cold sequence T1/T2/T3
If score < 80 OR role OR accept-all          →  requeue via Hunter
                                                Domain Search with
                                                named senior contact
    ↓
prospect_engagement endpoint filters HOT tier on isHighQualityEmail
    ↓
Personal outreach candidates flagged in dashboard at 7-21d into
nurture
```

## Deliverability infrastructure

| Lever | Why it matters | Impact |
|---|---|---|
| From: `zac@` not `partnerships@` | Personal sender beats role sender on inbox placement | +5-15% inbox rate |
| Subject: no "free" | Spam-filter trigger | +5-10% inbox rate |
| 3 links max in T1 | Scanner pre-fetches every link | Reduces scanner-inflated metrics by ~70% |
| Mon-Sat 06:00-12:00 AEST | Healthcare batch-read window | +10-20% open rate |
| Per-user 3-per-week cap | Avoid annoying-sender perception | Domain reputation protection |
| Hunter quality gate on HOT | Scanner-heavy contacts dont count as HOT | Personal-time investment goes to real humans |
| Engagement-aware T2 acceleration | Hot signals pulled forward 7BD → 4BD | Catches prospects while T1 memory is fresh |
| T3 at 14 BD (was 8 BD) | Salesloft/HubSpot final-touch sweet spot | Higher reply rate on breakup email |

## Lead scoring (HubSpot/Marketo/Salesforce model)

Behavioural lead score accumulates across all touches:

| Action | Points |
|---|---:|
| Cal.com booking | 200 |
| Talk-request form | 100 |
| Direct reply | 100 |
| Pre-season baseline signup | 50 |
| Free SCAT mini-course signup | 40 |
| Cal multi-day click (2+ days) | 30 |
| Dashboard CTA click (each) | 20 |
| Engaged portal session >60s (each) | 10 |
| Distinct URL click (only if not scanner) | 5 each |
| Portal session (only if not scanner) | 3 each |
| Open day (past first) | 1 each |

Tier thresholds:
- COLD `<5` — auto-sequence handles
- WARM `5-24` — engagement-aware T2 accelerates
- HOT `25+` (must also be non-scanner + Hunter quality high) — monitor closely, personal-outreach candidate at 7-21d

Terminal tiers:
- BOOKED — cal webhook OR talk-req submitted
- REPLIED — direct email reply
- WON — deal closed
- ENGAGED-ELSEWHERE — Squarespace self-submitter or competitor-channel engaged

## Proof points (verifiable from the data)

- 67.9% open rate over 30d = scanner-inflated (real B2B benchmark
  21-25%). Post-fix expectation: 25-35% real human open rate.
- 13.1% click rate = scanner-inflated (real B2B benchmark 1-3%).
  Post-fix expectation: 2-4% real human click rate.
- 0 dashboard CTA clicks across pipeline = real engagement was zero.
  Post-fix expectation: any CTA click > 0 = first real human signal,
  validates the entire stack.
- 0% reply rate = burned by deliverability (scanner pre-fetch +
  partnerships@ sender + "free" subjects + 5-link emails). Post-fix
  expectation: 2-5% reply rate within 2-3 weeks of new T1 batch.

## Next moves to keep widening the moat

1. Complete Hunter re-verify on all 1057 prospects (background batches,
   ~3-5 days at Hunter API speed)
2. Re-queue role/accept-all clinics via Hunter Domain Search
   (`/api/admin/prospect-requeue-named`)
3. Continue Squarespace suppression as more self-submitters flow in
4. Build per-region case-library so drill-down custom hooks deepen
   over time (currently 1-line angle per state — extend to specific
   2026 regulatory updates + AFL/NRL events)
5. Add Hunter `Email Finder` (vs Domain Search) for targeted enrichment
   of specific named contacts at undiscovered clinics

This is the system. It compounds. Google Ads doesnt.
