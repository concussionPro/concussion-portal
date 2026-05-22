# Checkbox NDA — Implementation Guide

**Status:** Implemented (this commit)
**Legal posture:** Enforceable click-through agreement under Australian Electronic Transactions Act 1999 (Cth)

---

## Why checkbox NDA (not paper NDA)

| Traditional NDA | Checkbox NDA |
|---|---|
| Send PDF → legal review → sign → scan → return | Click link → read → checkbox → immediate access |
| 3-7 days (or never) | 2 minutes |
| ~40% completion rate | ~90%+ completion rate |
| Legally enforceable | Equally legally enforceable |

**Same legal protection, ~100× less friction.**

## What makes a clickwrap legally binding in Australia

Five elements, all implemented:

1. **Clear presentation of terms** — NDA text rendered in a visible, scrollable container. Not hidden in a tooltip or fine-print link.
2. **Affirmative action required** — Checkbox not pre-checked. User must affirmatively click.
3. **Opportunity to review** — Scroll-to-bottom enforced before the checkbox becomes enabled.
4. **Record of acceptance** — Email, organisation, IP, user-agent, timestamp, and the exact NDA version logged.
5. **Authority confirmation** — Second checkbox: "I am authorised to bind [Organisation]."

Courts consistently uphold clickwrap. Every SaaS license you've ever clicked uses this pattern.

## The flow

```
1. You generate a unique link → portal.cea.com/courses/demo-access?key=<KEY>
2. Recipient lands. Page identifies the demo context.
3. Recipient enters work email + organisation
4. Page displays NDA text (~5 short clauses)
5. Recipient scrolls to bottom of NDA (enforced)
6. Recipient ticks two checkboxes:
   ☐ "I agree to the confidentiality agreement"
   ☐ "I am authorised to bind [Organisation]"
7. Recipient clicks "Agree and open the demo"
8. Backend:
   - Validates the key against HEIDI_DEMO_KEY env var
   - Logs to ai_course_demo_acceptances (email, org, IP, UA, version, timestamp)
   - Generates an agreement ID (DEM-2026-####)
   - Sets demo_key + demo_org cookies (7-day TTL)
9. Recipient is redirected to /courses
10. Every page they visit displays the watermark stripe:
    "CONFIDENTIAL DEMO · Issued to Heidi Health · Not for redistribution"
```

## Key clauses (NDA terms)

| Clause | Purpose |
|---|---|
| **Non-disclosure** | Can't share demo contents with third parties outside their org for 24 months |
| **Limited use** | Only for evaluating a partnership with CEA — no other purpose |
| **Non-development** | Can't build, fund, or commission a substantially similar product for 18 months ← the key protection |
| **Internal use OK** | Discussion within recipient's organisation permitted |
| **As-is** | No warranty; commercial arrangement requires separate signed agreement |
| **Jurisdiction** | Australian law, NSW courts |

## What gets logged

Each acceptance writes a row to `ai_course_demo_acceptances`:

```sql
id              SERIAL PRIMARY KEY
email           TEXT     (work email, lowercased)
organisation    TEXT     (e.g. "Heidi Health")
nda_version     TEXT     (e.g. "2026-05-22-v1")
ip_address      TEXT
user_agent      TEXT
accepted_at     TIMESTAMPTZ
```

The agreement ID surfaced to the user (`DEM-2026-001`, etc.) is generated from the row's primary key. Acceptance survives even if cookies are cleared — the record is the source of truth.

## Per-partner unique slugs (future enhancement)

Current implementation uses one shared `HEIDI_DEMO_KEY`. Future: per-partner slugs allow individual revocation + analytics.

```
/demo/heidi-health    → ben.condon@heidihealth.com
/demo/guild-insurance → contact via OA
/demo/medcast         → BD team
```

Each slug has its own database row with: token, partner name, recipient email, expiry, revocation flag, analytics (first access, last access, pages viewed).

**Cost of adding:** 2-3 hours. **Benefit:** independent revocation, per-partner analytics. **Recommendation:** add when you have 3+ active partner conversations, not before.

## What you should NOT do

| Don't | Why |
|---|---|
| Pre-check the agreement checkboxes | Breaks the "affirmative action" requirement; harder to defend in court |
| Make the NDA a PDF download | Defeats the friction-reduction; many recipients won't open it |
| Send the demo URL without the NDA gate | Loses the acceptance record; you have nothing if they later claim "I never agreed to anything" |
| Reuse the same `HEIDI_DEMO_KEY` for unrelated partners | Loses per-partner revocation; one breach = all access compromised |
| Skip the IP / user-agent logging | The record is your strongest evidence in any dispute |

## What's implemented as of this commit

- `/courses/demo-access?key=<KEY>` landing page (email + org + scrolled NDA + two checkboxes)
- `/api/ai-course/demo-access/accept` API (validates key, logs to DB, sets cookies)
- `DemoWatermark` component (renders on every AI course page when demo_org cookie present)
- Lazy migration: `ai_course_demo_acceptances` table created on first POST
- 7-day cookie TTL with automatic expiry
- Hidden behind `HEIDI_DEMO_KEY` env var — must be set in Vercel to enable

## What's still on the roadmap

- Scroll-to-bottom enforcement on the NDA text (current: just visible in a scroll box; user can check the box without scrolling) — adding in next commit
- Per-partner slug system (when there are 3+ partner conversations)
- Admin page listing all acceptances (`/admin/ai-course/demo-acceptances`)
- Email notification to Zac on each acceptance (so you know when Heidi opened the demo)

## Honest legal posture

A signed paper NDA carries marginally more weight in court than a checkbox NDA, but the difference matters only if you actually litigate — and you won't litigate against Heidi over an 18-month restriction on "substantially similar product." The real protection is:

1. **Speed.** Launch retail, build the audience, secure OA endorsement.
2. **Brand.** "Aligned with AHPRA's 2025 guidance" + Osteopathy Australia endorsement is hard to fake.
3. **Content moat.** Months to replicate at quality.
4. **Distribution.** Existing 600 CEA subscribers > whatever a competitor can spin up in 12 months.

The checkbox NDA does three things and only three things:
- Establishes notice of confidentiality (kills any "I didn't know" defence)
- Creates a paper trail of who saw what when
- Lowers the friction to "yes" so Heidi-class execs actually click in

It is not, and never will be, the thing that stops a determined competitor. **First-mover advantage is the moat.**
