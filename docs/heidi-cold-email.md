# Heidi Cold Email — Final (Passive CPD lead)

**Recipient:** Dr Ben Condon, Clinical Director, Heidi Health
**Subject options** (pick one):
- A: "Heidi already runs 200 hrs/yr of CPD activity per user — uncaptured"
- B: "The CPD market is fragmented; Heidi already owns the daily layer"
- C: "Free 100-user pilot — the passive CPD angle no scribe competitor can copy"

Recommended: **Option A** — leads with the killer quant.

---

## Body (~270 words)

Hi Ben,

I'm Zac Lewis — Australian osteopath, founder of Concussion Education Australia.

You said in February that Heidi is moving from "AI scribe" to "AI Care Partner" — with Evidence and Comms as the next acts. I think the fourth act is **clinical education** — and I've found the structural angle no scribe competitor can copy.

**Your users already do 100-400 hours/year of CPD-qualifying activity inside Heidi.** Literature searches via Evidence. Guideline reviews. Case research between consults. None of it gets logged because manual CPD tracking has too much friction. End of year, they panic-buy formal courses to fill the gap.

What if Heidi captured that automatically? Time tracking is native. One discreet prompt: *"You spent 45 min researching diabetes — log as CPD?"* One tap → auto-categorised → audit-ready. **60-80% of an AHPRA clinician's 50-hour annual requirement, earned passively.**

Medcast can't copy this — they can't see what their users do on PubMed. Lyrebird can't copy this — they have no literature surface. Heidi already owns the daily research workflow. **This is the moat.**

The economics: at 15k AU users × $300-400 avg residual CPD spend (formal courses to fill the 10-20h gap) = **$1.5-2M ARR**. At your 50k 2027 target, $5-7M.

**The ask: free 3-month pilot with 100 of your AU users.** I've built the proof of concept — AHPRA-aligned compliance course + multi-provider marketplace shell + a working passive-CPD demo. Demo is live and admin-gated.

I'll cover content + cert maintenance. You give me 100 users. We measure completion + qualitative feedback. If the data says yes, we discuss white-label or hire — but that's downstream.

20 minutes for a walk-through?

— Zac
zac@concussion-education-australia.com

**Demo (admin-gated, key below):** portal.concussion-education-australia.com/courses/cpd-record/passive
**Demo access:** portal.concussion-education-australia.com/api/ai-course/demo-access?key=[insert one-time key]
**Attached:** 1-pager covering the passive-CPD economics, three pain points, and pilot scope

---

## Why this version wins

| Lever | Effect |
|---|---|
| Lead with the quant (200 hours/year captured) | Heidi exec brain immediately runs the math. Self-validates the opportunity. |
| Frames Heidi's existing infrastructure as the moat | He doesn't need to build anything new. Just expose what's already happening. |
| Anti-Medcast / anti-Lyrebird framing | Pre-emptively answers "why does this beat Medcast?" — the answer is in the email. |
| Free pilot ask | Lowest-commitment yes. No budget, no contract, no legal. |
| Passive CPD demo URL up front | Lets him see the killer feature in 30 seconds before reading the email twice. |
| "Downstream" framing of bigger asks | Removes pressure. The pilot is the only ask today. |

## Demo prep (15 min before sending)

1. Set `HEIDI_DEMO_KEY` in Vercel env to a random 32-byte hex string
2. Verify `/api/ai-course/demo-access?key=<KEY>` redirects to /courses and sets the cookie
3. Click through `/courses` → `/courses/how-we-vet` → `/courses/ai-in-clinical-practice` Module 1 → `/courses/cpd-record` → `/courses/cpd-record/passive` (the new mockup)
4. Issue yourself a certificate via the quiz to confirm cert PDF generation
5. Have `docs/passive-cpd-insight.md` and `docs/heidi-dr-condon-strategic-brief.md` open in tabs

## Call-day walkthrough (20 min)

1. **2 min** — Restate the passive CPD insight. 200 hrs/year × 15k users = 3M hours Heidi could capture.
2. **3 min** — `/courses/cpd-record/passive` demo. The one-tap prompt + event timeline + moat panel.
3. **3 min** — `/courses/cpd-record` — formal CPD dashboard for the residual gap.
4. **4 min** — `/courses/ai-in-clinical-practice` Module 1. Proof of content quality + visual density.
5. **3 min** — `/courses` marketplace shell + `/courses/how-we-vet` curation policy.
6. **5 min** — Pilot proposal. 100 users, 3 months, free. Success metric: >60% completion + enterprise-customer interest signal. Downstream paths exist but pilot is the only ask today.

## Send-day checklist

1. Generate one-time `HEIDI_DEMO_KEY` (rotated after pitch concludes)
2. Render `docs/heidi-onepager.md` → PDF
3. Find Ben's email (LinkedIn, Heidi careers, or `b.condon@heidihealth.com` pattern)
4. CC: no one. BCC: yourself for record.
5. Send window: Tuesday-Thursday 8-10am AEST
6. Follow-up cadence: 7 days (light), 14 days (one new data point), then drop

## What if he replies "interesting, but not now" (60% base case)

Don't push. Drop into the nurture sequence:
- Monthly email with one update — new module, regulator change, indemnity-carrier position drift
- Each email reinforces that the content-refresh pipeline is real and the platform is alive
- Next strategic-planning cycle at Heidi (usually 6-9 months out), the relationship has matured

The pitch is structured for a no-answer to be useful too — Heidi sees the platform in action, you stay top-of-mind for the next budget cycle.
