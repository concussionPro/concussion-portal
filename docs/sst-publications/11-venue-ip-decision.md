# SST Trainer — venue & IP decision record

**Decided:** 2026-06-29. **Status:** settled (after re-examination; the call flipped twice before landing here — this record exists so it isn't re-litigated).

## Decision

**Publish via JMIR mHealth (or JMIR Formative Research for a first cut). Code stays CLOSED.** Architecture is described rigorously in the paper; the implementation and tuned constants (PPG confidence cutoff, autocorrelation lag bounds, TTLs, graded-test ramp logic) stay proprietary.

## Why not JOSS / open-source (the case that was re-examined and rejected)

The only thing open-sourcing genuinely buys is the academic-rigour signal (reproducible, inspectable, citable). That's real but it's *one* credibility input among several we already have (OA/ESSA endorsement, a published methods paper, clinical reputation, the dataset). Against it:

- **You hand competitors the *design*, not the code — and the design is the wedge.** Open-sourcing `protocol.ts` + `GuidedTest.tsx` publishes exactly how we administer the graded test, compute the threshold, and gate the signal. Competitors won't import the code (licence/liability/provenance headaches); they'll *read the approach and reimplement it.* The valuable thing is the solution to "how do you measure HRt at home reliably" — which Rhea punts on with an age estimate *because they haven't solved it.* Open source solves it for them, publicly.
- **A better-distributed incumbent out-executes you with your own method.** If CCMI reads a JOSS paper and adds verified home-HRt to Wibbi, they ship it to 300+ existing clinics overnight. Open source is great when *you* hold the distribution advantage and want adoption; it's dangerous when your moat is still forming and an incumbent can run your playbook faster. We're in the second situation.
- **Licence tension is unresolvable.** Permissive (MIT/Apache) lets anyone close-and-commercialise it; copyleft (GPL/AGPL) makes commercial actors avoid it, killing the adoption-credibility benefit you wanted.

**The resolution keeps both:** publish the paper (architecture, design claim, four mechanisms, scope-disclaimed) → ~90% of the credibility; keep the code closed → ~0% of the blueprint disclosure. JMIR mHealth is built for exactly this (commercial digital-health tool, described rigorously, code not required).

## Consequences

- **"Open/auditable" is dropped as a differentiator** in all competitive framing (papers, pitch, marketing). It was contingent on the JOSS path.
- **The provisional filing-status gate is de-risked** (not eliminated): with no public *code*, there is no irreversible *implementation* disclosure. The *paper* still discloses the architecture — but a methods paper discloses architecture the way a patent spec does, and the tuned constants stay trade-secret. So: still confirm the SST provisional's filing/application number (doc 08) and decide convert-vs-lapse within the priority window, but it is no longer a publish-blocker.

## Corrected claim hierarchy (ranked by load-bearing weight)

1. **Measured > estimated HRt (vs Rhea)** — bulletproof, construct-superiority (not outcome). The headline. Carries the most.
2. **Clinician-gated, home-capable graded-test administration** — novel vs MOVE, but framed as *remote administration with concurrent validity pending a registered study*, explicitly NOT as having beaten the "exertion testing can't be done unsupervised remotely" consensus. Strong if scoped, fragile if overclaimed.
3. **Serial measured HRt as a trajectory instrument** — defensible operationalisation vs Buffalo's serial-measurement-as-marker; the curve is the tangible artifact. Solid, narrow.
4. **Fail-closed verification integration** — composition-novel, *supporting layer, not a pillar.* Don't lean on it.

The through-line: every "nobody does X" was rewritten to "X exists; our narrow contribution within X is Y." That discipline is now applied across docs 02 and 09.
