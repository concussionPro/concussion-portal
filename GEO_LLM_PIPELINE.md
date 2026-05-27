# GEO + LLM Citation Pipeline
**Date:** 2026-05-27
**Purpose:** The new lever — get cited by ChatGPT / Claude / Perplexity / Gemini / Google AI Overviews when clinicians ask about CEA-relevant topics. This is replacing Google SERP rank-1 as the primary discovery surface.

---

## Why this matters

Clinicians ask LLMs more than they Google:
- "Best AI medical scribe for Australian clinicians" → ChatGPT answers with named providers
- "Where to learn concussion management online" → Claude answers with named courses
- "AHPRA AI guidelines summary" → Perplexity cites the source it trusts most

The LLM's answer is now the SERP position 1. Being the **named entity LLMs cite** is the highest-leverage move CEA can make. No paid acquisition, no peak-body gatekeeper, no compliance overhead in a foreign market.

The research agent confirmed: "AI medical scribe" search is **+600% YoY globally** and not regulator-gated. Topic-driven content that ranks in LLM answers converts via the existing `/pricing-international` funnel.

---

## What's already in place (audit, 2026-05-27)

| Surface | Status |
|---|---|
| `public/robots.txt` allows AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, cohere-ai, Google-Extended) | ✓ |
| `public/llms.txt` (LLM content index — new emerging standard) | ✓ Updated 2026-05-27 with AI course + lead magnet + 5 pillar blog posts + AI-focused Q&As |
| `lib/schema-markup.ts` utilities (Organization, MedicalWebPage, Course, FAQ, Author with hasCredential) | ✓ |
| Organization schema knowsAbout — broadened to include AI topics | ✓ Updated 2026-05-27 |
| 5 pillar blog posts in AI cluster with FAQPage + BlogPostSchema | ✓ |
| `/ai-safety-checklist` landing — MedicalWebPage + Organization + FAQPage schema | ✓ Updated 2026-05-27 |
| `/courses/ai-in-clinical-practice` landing — Course schema | ⏳ Will add when course goes live (1 June 2026) |
| `public/llms-full.txt` — referenced in llms.txt but file does not exist | ⏳ To build |

---

## The keyword-scraping pipeline (the user's ask)

**Goal:** know what clinicians are actually asking LLMs. Reverse-engineer the question → write the cited answer → measure citation.

### Stage 1 — Query discovery (monthly, ~2h)

Sources for "what are clinicians asking LLMs":

1. **Direct query testing.** Run a fixed list of 30-50 candidate queries through ChatGPT, Claude, Perplexity, Gemini. Record:
   - Does CEA get named? (yes/no)
   - What sources DO get cited? (RACGP, AHPRA, peak-body, competing courses)
   - What's the answer quality / shape?

   Example queries to test:
   - "best AI medical scribe for Australian clinicians"
   - "Heidi vs Lyrebird vs ChatGPT for clinical notes"
   - "AHPRA AI guidelines summary"
   - "concussion course Australia online"
   - "how to use SCAT6 sideline"
   - "NDIS allied health report writing with AI"
   - "VOMS assessment for physiotherapists"
   - "AI scribe Privacy Act compliance"
   - "return-to-play protocol Amsterdam 2023"
   - "persistent post-concussion symptoms management"

2. **Google "people also ask" boxes** for the same queries — these are derived from real user-question logs and feed the AI Overview crawler. Capture them; turn into FAQ schema entries.

3. **Reddit AU healthcare communities** (r/PhysicalTherapy, r/Physiotherapy, r/MedicineAustralia, r/AusNursing) — high-engagement clinical questions are what people would ask an LLM if they didn't ask Reddit.

4. **ChatGPT plugin/share-link audits** — searches for `site:chat.openai.com` and `site:claude.ai/chat` sometimes surface shared conversations. Limited but useful signal.

5. **Anthropic / OpenAI usage telemetry** — Anthropic publishes the Economic Index (https://www.anthropic.com/economic-index) showing economic use cases by category. Healthcare professional usage is broken out.

### Stage 2 — Gap analysis (monthly, ~30min)

For each tested query:
- **Cited:** good. Reinforce.
- **Not cited, but should be:** content gap. Write a pillar piece or update an existing one with the exact-match phrasing.
- **Cited but wrong information:** schema error or stale content. Fix.
- **Cited by competitor (Medcast, Physio Network, BMJ):** they're winning that lane. Decide whether to compete or cede.

### Stage 3 — Content fix (1-3 hours per gap)

Apply the rules already established (the search-keyword rule for courses applies here too):

1. **Title contains the exact LLM question phrasing.** "How do I use SCAT6 sideline?" → blog post titled "How to Use SCAT6 Sideline — Clinician's Guide"
2. **First 100 words = direct answer.** LLM crawlers weight the opening paragraph heavily. Lead with the answer, not the setup.
3. **FAQPage schema with the exact question** verbatim. LLMs match on the schema field.
4. **Author with hasCredential** (Zac, AHPRA-registered Osteopath). E-E-A-T signal.
5. **Reviewed-date stamp** within last 6 months. Freshness signal.
6. **Cite authoritative sources** inline (AHPRA, TGA, BJSM, JOSPT, peak-body links). LLMs prefer pages that themselves cite primary sources.
7. **Internal link graph** — every pillar post links to ≥3 related CEA pieces. Topical cluster signals to LLMs.

### Stage 4 — Measurement (monthly, ~30min)

Track 3 metrics over time:
- **CEA citation rate**: of the 30-50 tested queries, what % name CEA in the answer? Target: >40% within 6 months.
- **Branded query share**: when an LLM answers a query in CEA's space, what % of the time is CEA the recommended option (vs background mention)? Target: >25%.
- **Funnel conversion from LLM traffic**: organic Vercel Analytics referrer = chat.openai.com / claude.ai / perplexity.ai / gemini.google.com. Track conversion to lead magnet signup and course purchase.

---

## What to build next (in priority order)

| Priority | Item | Cost | Why |
|---|---|---|---|
| P0 | `public/llms-full.txt` — comprehensive content index | 1 hour | Already referenced in llms.txt; file doesn't exist (404 for any LLM trying to follow the link) |
| P0 | Cross-jurisdiction AI scribe blog post — "AI Medical Scribe Comparison 2026 — Heidi vs Lyrebird vs Tortus vs Abridge vs DAX" | 3 hours | The +600% YoY global query. Single highest-impact GEO bet. Targets UK/US/Canada/AU searchers via /pricing-international |
| P1 | Admin LLM-query-test page — runs a fixed query list through ChatGPT API + Anthropic API and reports CEA citation rate weekly | 4 hours | Automates Stage 1+4. Without this, manual auditing is the bottleneck |
| P1 | Author bio pages (`/about/zac-lewis`) with full hasCredential + sameAs schema | 1 hour | Direct entity match for LLM "who is the author of this CEA content" queries |
| P2 | Course schema on `/courses/ai-in-clinical-practice` (when course goes live) | 30 min | Standard Course schema with hasCourseInstance, offers, provider |
| P2 | Reverse-cite scrape — find pages already linking to CEA and request schema-compliant backlinks (peak-body sites, podcasts, conference programs) | Variable | Off-page authority signals matter for LLM trust scoring |
| P3 | "Knowledge base" pages — `/resources/what-is-scat6`, `/resources/voms-assessment-protocol`, `/resources/ahpra-ai-guidelines-summary` — pure reference content with MedicalEntity schema | 6 hours | Becomes the citable source LLMs prefer over blog posts for definitional queries |

---

## The Squarespace + Portal trust anchor (user's note)

Two domains both branded `concussion-education-australia.com`:
- `concussion-education-australia.com` (Squarespace, brand landing)
- `portal.concussion-education-australia.com` (this Next.js app)

These reinforce each other in LLM training data because they share the root brand. Recommendations:

1. **Cross-link both domains** consistently. Every Squarespace page should link to the relevant portal page; every portal blog should link back to a Squarespace authority surface (founder bio, brand story, accreditation listing).
2. **Canonical strategy**: Squarespace = brand and identity surface; Portal = product, content, conversion surface. The portal is the "official source" for clinical content. Make sure portal pages set canonical to themselves (already done).
3. **Sitemap referencing both domains** — already exists for portal; Squarespace has its own.
4. **Schema sameAs**: Organization schema already lists both URLs in sameAs[]. ✓

---

## The one-sentence operating principle

**Every piece of CEA content is written to be the answer an LLM gives when a clinician asks "where do I learn about X?" — and the system to test, measure, and improve that citation rate runs monthly without hand-holding.**

The blog cluster + AI Safety Checklist already executes this for AI clinical practice. The next move is:
1. Ship `llms-full.txt` and the cross-jurisdiction AI scribe comparison post (P0)
2. Build the admin LLM-test page so we measure citation rate, not guess (P1)
3. Apply the same playbook to the next course (PPCS, per research agent #2)
