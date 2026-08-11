# MSCC × Nookal — go-live runbook

Owner-facing runbook for bringing Melbourne Sports Concussion Clinic (Nookal
PMS) live on SST filing. Written 2026-08-11, the day the adapter shipped
(`b92afe2a`, sweep `fbc298ed`). The Mac Mail draft "SST × Nookal — 2-minute
setup" mirrors the clinic-facing half of this.

## What MSCC's practice manager does (the ONLY work on their side)

1. **Generate the API key** in Nookal: `Setup → Connections → API Keys →
   Generate API Key`.
2. **Tick every Location the key should cover.** Nookal keys are scoped
   per-location at generation — with MSCC's two entities, an un-ticked
   location is silently invisible to SST. Tick all locations SST should file
   into.
3. **Paste the key into SST**: Clinical Testing → SST Trainer → "Clinic code &
   sharing" → Connect practice software → choose **Nookal** → paste → Connect.
   The connection self-verifies instantly (a bad key is rejected on the spot;
   an existing working connection is never destroyed by a typo).
4. **Nominate a TEST patient** that exists in their Nookal (a dummy record is
   fine) and tell us its name.

That's it. No practitioner mapping, no case setup, no other configuration —
SST resolves the patient's newest case (or creates an "SST — concussion
episode" case) and the authoring practitioner automatically.

## What WE do before any real record is touched (go-live protocol)

The adapter's unverified live shapes carry `// VERIFY:` markers in
`lib/sst-trainer/pms/nookal.ts`. One filing against their TEST patient
confirms all of them at once:

1. Connect probe passes with their key (proves auth transport + envelope).
2. From the hub, file ONE report (GP report) against the nominated test
   patient.
3. In their Nookal, eyeball: the treatment note (full report text, correct
   case), and the PDF attachment (opens, watermark-free, correct document).
4. Check `nookal.ts` VERIFY markers off as confirmed: auth (query param vs
   x-api-key header), response envelope/casing, addCase create-response shape,
   S3 PUT content-type, fuzzy_search flag value.
5. Only then file against a real patient.

If step 2 fails partially (note lands, attachment fails), the UI reports it
exactly — the note carries the full report text either way.

## Env / flags involved

- Per-clinic connection: stored encrypted via the tenant layer — nothing to
  set in Vercel for MSCC.
- `PMS_WRITEBACK_ENABLED=true` must be set (global write-back gate).
- `NOOKAL_API_KEY` / `NOOKAL_PRACTITIONER_ID` env vars exist only for the
  env-configured lane (cron/testing) — NOT needed for MSCC's tenant connect.

## Nookal partner-listing (separate thread)

Nookal runs a curated Integrations directory; target category **"Exercise and
Prescription Management"** (Physitrack, VALD, Wibbi live there). Door:
info@nookal.com (no dedicated partnerships address). Wants: working
integration (done), a "Connect SST with Nookal" guide (draft from this
runbook's clinic half), security posture (reuse the PracSuite questionnaire
answers; Nookal advertises SOC 2 Type 2). Approach AFTER MSCC is live — a
referenceable mutual customer is the strongest opener.
