# SST Trainer + Clinical Suite — end-to-end launch checklist

Single source of truth. Consolidated 2026-07-07. Supersedes scattered notes in
memory / `docs/sst-publications/04-venues.md` / `sst-gtm-strategy.md`.

Legend: **[DONE]** shipped & verified · **[OWNER]** only you can do it (accounts /
env / regulator / hardware) · **[TODO]** code/content work still open.

---

## 0. Two launches, don't conflate them

- **Launch A — WEB (near-term, the real one):** clinician suite + patient PWA at
  `/sst-trainer`. No app store needed. Gated by 3 owner switches (§2, §4). This is
  what "flip the switch" means.
- **Launch B — APP STORES (follow-on):** native iOS/Android wrappers, mainly to
  unlock the **iOS verified (BLE) tier**. Android already builds; iOS needs Xcode.
  Not required for Launch A — patients use the PWA + manual/Android-verified today.

Critical path to Launch A: **Stripe live (§2) → flip `SST_CLINICAL_LIVE` (§2) →
outreach on (§6).** (TGA is **not** on this path — it only bites for public
self-guided use, which stays off; see §4.)

---

## 1. Product / code — **[DONE]**

Full sweep completed this session (correctness, security, billing, compliance,
UX). Production build green, 394 tests pass, fixes adversarially verified.
- HRt-capture manual-mode bug, embedded clinic-code race, prognostic-flag
  wiring+display, rest-day messaging — fixed.
- Server-side trial-cap enforcement, entitlement leak, enumeration backstop — fixed.
- Compliance: SaMD "delivery layer" wording, disclaimers on every result branch
  + daily band, accurate consent copy — fixed.
- No remaining P0/P1 code blockers.

**Residual code items (non-blocking, your call):**
- [ ] **[OWNER-DECISION]** Should cancelling the paid subscription revoke *suite*
  access? Today suite = founding grant (`sst_entitled_at`), never revoked by
  billing; the paid sub's only enforced deliverable is the trial-cap lift. The
  `sst_subscriptions` table (by email) is currently inert. Decide + wire if yes.
- [ ] **[TODO]** IP-header spoofing on rate-limits is backstopped (global cap) but
  not fully closed — front the API with Cloudflare properly or accept the backstop.

---

## 2. Payments / Stripe — **[OWNER]** (the #1 pre-launch verification)

Architecture: **tier-based** subscription (not monthly/annual — that's stale).
Two webhooks, two jobs — **both must be registered or subscribing half-works.**

**Env vars (Vercel):**
- [ ] `STRIPE_SST_SINGLE_PRICE_ID` = `price_…` (A$49 → set)
- [ ] `STRIPE_SST_CLINIC_PRICE_ID` = `price_…` (A$99)
- [ ] `STRIPE_SST_ENTERPRISE_PRICE_ID` = `price_…` (A$149)
- [ ] `STRIPE_SST_WEBHOOK_SECRET` = `whsec_…` (for the dedicated webhook)
- (Standard `STRIPE_SECRET_KEY` already live for the course.)
> You said you set the three price IDs — **re-confirm they're `price_…` not
> `prod_…`**, and that they're recurring/subscription prices.

**Stripe dashboard — register BOTH webhook endpoints:**
- [ ] `…/api/webhooks/stripe` — the MAIN webhook. On `checkout.session.completed`
  (product=`sst-trainer`) it calls `setSstClinicPlan(clinicCode,'active')` →
  **lifts the patient trial cap**. Also `customer.subscription.updated/deleted`
  revert to trial. **This is the enforced deliverable — must be registered.**
- [ ] `…/api/webhooks/stripe-sst` — dedicated SST webhook (own secret). Writes the
  `sst_subscriptions` table by email. Currently gates nothing (see §1 decision);
  register it anyway so the record exists, or consciously skip.
- [ ] Enable `checkout.session.expired` on the main webhook (already noted as a
  standing gap).

**DB:**
- [ ] Run `scripts/sql/sst-subscriptions.sql` on Neon (if using the dedicated table).
- Trial cap: `TRIAL_PATIENT_CAP=3`, enforced **server-side** (admission gate at
  `/api/sst/session` + clinician invite). Already live in code.

**Test before launch:**
- [ ] One real subscription: trial clinic → 3 patients → 4th blocked → subscribe →
  webhook flips plan → 4th admits. Confirm both webhooks fired.

---

## 3. App stores (Launch B) — Android **[DONE]**, iOS **[OWNER]**

Packages at `~/Documents/SS Trainer/` (outside repo). Both wrappers now point at
the valid public `/sst-trainer` start_url.
- **Android — [DONE]:** debug APK built (`SST-Trainer-debug.apk`, native BLE) +
  Play TWA package (`SST - Google Play package.zip`). Either ships. `assetlinks.json`
  live. Play Console (Org, $25) — [OWNER] upload the `.aab`, keep the keystore.
- **iOS — [OWNER] (blocked on Xcode):** this Mac has no Xcode. Steps: enrol Apple
  Developer (Org, $99/yr; DUNS done) → `xcodes install --latest` →
  `cd sst-native && ./setup.sh && npm run open:ios` → set Team/signing → Run on
  iPhone with a wearable in broadcast mode → Archive → App Store Connect. This is
  what unlocks the **iOS verified BLE tier** (Web Bluetooth is absent on iOS).
- [ ] **[OWNER]** Second screenshot set (5× 1290×2796 exist) + **corrected Apple
  privacy nutrition label** (clinic mode DOES collect the patient name — the draft
  said it didn't).
- Privacy policy live at `/sst-privacy`. **[TODO]** re-check it against the new
  consent copy (name → clinician; de-identified opt-in).

---

## 4. Regulatory — **NOT a Launch A blocker**

- **Launch A is clinician-gated → clinical-decision-support / clinician-in-the-loop.**
  The clinician prescribes, supervises, and can independently review the basis for
  every output (the measured HRt + transparent band math). That posture sits in the
  CDSS territory the TGA carves out, not "SaMD that diagnoses/treats." Combined with
  the disclaimers on every surface and noindex, the supervised suite is defensible
  to launch **without** a formal TGA opinion. **[OWNER, optional]** a brief
  regulatory sanity-check is prudent but not a gate.
- **The TGA/SaMD opinion only matters for PUBLIC SELF-GUIDED use** (a patient running
  the provocative graded test with no clinician). That path is deliberately OFF
  (`NEXT_PUBLIC_SST_SELF_GUIDED=false`) — do NOT flip it until the opinion is in
  (`docs/sst-publications/12-…OPEN`). So TGA gates a *future* self-guided expansion,
  not this launch.
- Compliance copy pass done this session (delivery-layer wording, disclaimers,
  consent). A `cea-compliance-review` on the final consent + store label before
  Launch B is worth it.

---

## 5. Papers (parallel authority track — NOT a launch blocker)

Three real, submission-grade drafts in `docs/sst-publications/`. `/publications`
page is hidden until DOIs land. Ranked by closeness:
1. [ ] **Clinical review** → **medRxiv** now (→ *Journal of Concussion*). Closest —
   verify ⚠ citations + format. Days away.
2. [ ] **Protocol/workflow paper** → **protocols.io** → *JMIR Res Protocols*.
   Highest adoption leverage. (Now listed on `/publications`.)
3. [ ] **Tools/methods paper** → **JMIR mHealth** (closed-source dev paper).
- Discipline holds: construct/methods-level, **no efficacy/diagnosis claims**. The
  **measured-vs-estimated HRt** wedge is the defensible positioning (construct
  superiority, not outcome).
- **Retired:** severity-adjusted-dosing paper (stress-tested → redundant; verdict
  banner in `docs/severity-adjusted-sstae-dosing-paper.md`). Do not pursue.

---

## 6. Outreach — engine **[DONE]**, activation **[OWNER]**

Cold B2B outreach is the primary channel (no paid ads).
- **Pool:** 1,137 verified net-new clinics (Apollo cleaned 3,014→1,137). Send order
  **stage-first**. Suppression enforced **fail-closed on every lane**.
- **Engine:** autonomous cron (T1→T2→T3 cadence; replies-only metric; <80-word
  value-first notes, no links, no surveillance/"free" language). Targeting: large
  on-site > hub pack > individuals; unis/hospitals never.
- [ ] **[OWNER]** Confirm reply-forwarding is wired (replies to zac@ must forward to
  the Resend inbound address or `status='replied'` never fires).
- [ ] **[TODO, optional]** The credentialled/published-clinician dive — mine the
  1,137 for research-active clinicians as the strongest founding clinics / advocates.
- ICP for the SST pitch: **tool-less clinics** (CCMI disqualified from cold pitch).

---

## 7. Go-live order (Launch A)

1. [ ] Stripe: confirm 3 price IDs + **both** webhooks + run one live sub test (§2).
2. [ ] Confirm `NEXT_PUBLIC_SST_SELF_GUIDED=false` (clinician-gated only — keeps TGA
   out of scope; §4). No TGA opinion needed for this launch.
3. [ ] Flip **`SST_CLINICAL_LIVE=true`** (opens the suite to course-buyers + entitled).
4. [ ] Founding cohort: confirm the founding signup → portal magic-link flow live
   (owner can already reach `/clinical-testing`).
5. [ ] Turn the outreach engine to live send on the 1,137 (§6).
6. [ ] (Parallel) medRxiv the clinical review; iOS build for the verified tier.

**Bottom line:** the code is done and verified. Launch A is gated only by the
Stripe verification and flipping one env flag — both owner actions. TGA is not a
gate (clinician-gated); it only applies if you later open self-guided use.
