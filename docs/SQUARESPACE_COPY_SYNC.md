# Squarespace ↔ Portal copy sync

Portal is the source of truth for price and CPD. Squarespace (marketing site) is
edited in the Squarespace UI — there is no portal API/env that rewrites SS HTML.
When SS drifts, update these pages manually with the strings below.

**Last checked against portal:** 2026-09-06 (`lib/config.ts` + `upgradePriceFor`)

## Canonical numbers (do not invent)

| Offer | Price | CPD |
| --- | --- | --- |
| Online only | **A$497** | **8** CPD hours |
| Complete (early bird) | **A$1,190** | **16** CPD hours (8 online + 8 practical) |
| Complete (standard / sticker) | **A$1,400** | **16** CPD hours |
| Unlock your seat (refundable) | **A$100** | Does **not** unlock modules |
| Online → Complete upgrade (early bird) | **A$693** (`upgradePriceFor` = early bird − online = 1190 − 497) | Adds practical day to reach **16** CPD |
| International Online | **US$347** (local FX table for GBP/EUR/CAD/NZD/ZAR) | **8** hours of learning |

Endorsement line (AU): AHPRA-aligned · Osteopathy Australia endorsed · open to
registered AHPRA / allied health clinicians (not OA/ESSA-only).

## Known drift to fix

Search Squarespace for these **stale** strings and replace:

### Homepage (site root / marketing home)

| Find (stale) | Replace with (portal-correct) |
| --- | --- |
| `$1400` or `A$1,400` as the **only** headline price without early-bird context | Lead with **Online A$497** · Complete from **A$1,190** early bird (A$1,400 standard) |
| `14 CPD` / `14 hours` / `14 CPD hours` | **16 CPD hours** (8 online + 8 practical day) — never 14 |
| `AOA Endorsed` (old brand) | **Osteopathy Australia endorsed** (OA) |
| Any claim that Unlock/secure-seat includes online modules | Unlock is **A$100 refundable** toward the practical-day cohort — **does not** unlock modules |
| Missing Online→Complete upgrade price | **A$693** early-bird upgrade (portal `/upgrade`) — not a separate Squarespace checkout |

Suggested homepage hero price line:

```text
Start Online — A$497 (8 CPD). Add the catered practical day when your city unlocks — Complete from A$1,190 early bird (16 CPD).
```

CTA target: `https://portal.concussion-education-australia.com/pricing` (AU) or
`/pricing-international` for overseas.

### Course / enrolment page (Squarespace course landing)

| Find (stale) | Replace with |
| --- | --- |
| Single price `A$1,400` / `$1400` as “the course” | Split offers: **Online A$497** · **Complete A$1,190** early bird / **A$1,400** standard |
| `14 CPD points` / `14 CPD hours` | **8 CPD** online · **up to 16 CPD** with practical day |
| “Register interest” / free EOI as primary soft-commit | Prefer portal **Unlock your seat (A$100)** or **Enrol Online** — free EOI is secondary notify-only |
| Meta description still saying 14 CPD or GP/PhD instructor | Use portal-aligned meta from `docs/seo-fixes-paste-ready.md` (16 CPD, OA-endorsed osteopath founder) |

Suggested course-page price block:

```text
Online — A$497 · 8 CPD hours · lifetime access · start today
Complete — A$1,190 early bird (A$1,400 standard) · 16 CPD · online + catered practical day
Upgrade Online → Complete — A$693 early bird (portal /upgrade)
Unlock your seat — A$100 refundable toward your city’s 12-clinician cohort (does not unlock modules)
```

Enrol CTAs must deep-link to the portal, not a Squarespace checkout:

- Online / Complete: `/pricing`
- International: `/pricing-international`
- Practical-day page: `/in-person`

## What portal cannot fix

- Squarespace CMS HTML, SEO titles, and button hrefs live in Squarespace.
- No `SQUARESPACE_*` env or API write path in this repo for page body copy.
- After editing SS, spot-check live homepage + course page against this table
  (price, CPD 16 not 14, Online A$497 present, Unlock not sold as full access).

## Owner checklist

- [ ] Homepage price line matches table
- [ ] Course page has Online A$497 + Complete 1190/1400 + upgrade A$693 + 16 CPD
- [ ] No “14 CPD” anywhere on SS
- [ ] Primary CTAs hit portal `/pricing` (or intl)
- [ ] Meta description updated (see `docs/seo-fixes-paste-ready.md`)
