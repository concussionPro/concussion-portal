---
name: content-spin
description: Take one input (a clinical insight, conference talk, regulatory update, or topic) and produce LinkedIn post + email + AI-SEO blog post + optional X thread for Concussion Education Australia, in Zac's clinician-to-clinician voice. Always reads docs/brand-voice.md first. Use when Zac says "spin this", "make content from", "write up the talk", "turn this into content", or similar.
---

# content-spin

Produce 3–4 pieces of brand-aligned content from one input, for Concussion Education Australia (CEA). Every output is in Zac's clinician-to-clinician voice and must pass the brand-voice quality gate before being shown.

## Inputs the user might give you

- A clinical scenario from this week's practice
- A talk Zac just gave (or is about to give)
- A regulatory update (new ANZ guideline, AFL ruling, RACGP CPD change)
- A research paper worth talking about
- A bare topic ("write something about VOMS")
- An angry/contrarian take ("I'm sick of clinicians using SCAT5 still — write something")

## Pre-flight (always, every time)

1. **Read `docs/brand-voice.md`** at the project root before drafting anything. The brand voice doc is the source of truth — never improvise tone or positioning from training data.
2. **Identify which persona(s)** from §3 of the brand voice doc this content targets. Default = Persona A (audit-anxious osteo) unless the input is explicitly sport-medicine or GP-flavoured.
3. **Identify which switching force** the content addresses (push / pull / habit / anxiety from §4). Most posts should address ONE force, not all four.
4. **Note any specific proof points or sources** the content can cite (real ones — never fabricate).

## Outputs (in this order)

### 1. LinkedIn post

- Hook: clinical scenario, regulatory hook, contrarian take, or specific stat. NO "Hot take" or "Unpopular opinion" or any LinkedIn-bait opener.
- Body: 100–250 words. Short paragraphs (1–3 lines). Specific over abstract.
- Multi-image or native-PDF format suggested where it'd boost engagement (note this in the output).
- End with: implication for the reader. Soft CTA optional, never required.
- Tag relevant orgs (Osteopathy Australia, SMA, AIS, RACGP) only when natural — never as engagement bait.
- Tone check: must pass the §9 anti-examples test from brand-voice.md.

### 2. Email to list

- Subject: under 50 chars, no exclamation marks, specific over clever.
- Preview text: 1 sentence that reinforces the subject without repeating it.
- Body: ~150–300 words. One CTA only. Reply-friendly.
- Sign-off: "Zac" or "Zac Lewis, Concussion Education Australia" depending on formality.
- Compliance: include unsubscribe placeholder `{{unsubscribe_url}}` in the footer.

### 3. AI-SEO blog post

- 800–1500 words.
- Open with a **definition block** answering the primary query directly (2–3 sentences).
- Include at least one of: structured **comparison table**, **step-by-step block**, **statistic block** with cited sources.
- End with an **FAQ block** (4–6 questions, schema-ready format).
- Cite ≥3 authoritative sources with links — peak bodies, guidelines, or peer-reviewed papers (real ones — verify via WebSearch if uncertain).
- Author attribution: "Zac Lewis, Osteopath · Concussion Education Australia · {today's date}".
- Include suggested URL slug, meta description (≤155 chars), and target query at the top of the output.
- Include suggested JSON-LD schema (FAQ + Article + HowTo as appropriate) at the bottom.

### 4. X / Twitter thread (only if the input warrants it)

- 5–8 posts, ≤280 chars each.
- Hook post must stand alone if separated from the thread.
- End with a soft link to the blog post or a relevant CEA page.
- Skip this output entirely if the input doesn't have thread-shaped legs (e.g. single clinical tip → no thread; conference talk recap → yes thread).

## Quality gate — run BEFORE showing output

For each piece, score against these dimensions on a 1–5 scale. Target ≥4 on every dimension.

| Dimension | Pass criteria |
|---|---|
| **Voice match** | Reads like Zac (peer, evidence-based, direct, Australian). No marketer-speak. |
| **Specificity** | Contains ≥1 number, named protocol, clinical scenario, or regulatory reference. |
| **Anti-examples** | Zero phrases from brand-voice.md §9 anti-examples list. |
| **Single-purpose** | Addresses one switching force / one main idea — not a kitchen-sink post. |
| **Action clarity** | Reader knows what to think or do next without being told. |
| **Source integrity** | All citations are real (verified via WebSearch if not in your knowledge). No fabricated stats, papers, or quotes. |

If any dimension scores <4, **rewrite the piece** before showing it. Do not show the user an output that fails the gate.

## Output format

Show all pieces in one response, with clear section headers:

```
---
## LinkedIn post

[content]

> Voice: 5 · Specificity: 5 · Anti-examples: 5 · Single-purpose: 4 · Action: 5 · Sources: N/A

---
## Email

**Subject:** [subject]
**Preview:** [preview]

[body]

> [scores]

---
## Blog post

**Title:** [title]
**Slug:** /blog/[slug]
**Meta description:** [≤155 chars]
**Target query:** "[query]"

[content with definition block, body, FAQ, sources, JSON-LD]

> [scores]

---
## X thread (optional)

[content]

> [scores]
```

End with: a one-line **human-pass note** flagging what Zac should add (clinical detail only he has, hot takes, recent patient anonymised story, etc.) before publishing.

## What this skill does NOT do

- ❌ Schedule or publish content (Zac approves and publishes himself)
- ❌ Generate images or video
- ❌ Write content for non-clinicians (parents, athletes, lay public — out of scope)
- ❌ Make medical claims CEA can't substantiate (see brand-voice.md §12)
- ❌ Improvise on tone/positioning — always defer to docs/brand-voice.md

## When to suggest the user invokes it

If Zac mentions any of: gave a talk, ran a workshop, saw an interesting case, read a new guideline, has a contrarian take, wants to "post about" something, has time to do marketing this week — offer to run `/content-spin` and ask what the input is.
