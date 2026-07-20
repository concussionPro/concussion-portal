# PMS Write-Back Angle — Decision Review (Cliniko + Gensolve)

**Date:** 2026-07-20 · **Scope:** `lib/sst-trainer/pms/*` (adapter.ts, cliniko.ts, gensolve.ts, deliver.ts), `scripts/test-pms-writeback.ts`, all repo references.
**Method:** full code read + primary-source web verification (Cliniko developer portal + pricing; gensolve.com / docs.gensolve.com). Every claim is tagged **VERIFIED** (code line or URL cited) or **INFERENCE**.

---

## 0. Bottom line

| | Cliniko (AU) | Gensolve (NZ/ACC) |
|---|---|---|
| Code state | Complete adapter, 6 unvalidated `// VERIFY:` shapes, zero callers | Complete adapter, 12 `// VERIFY:` markers, PDF upload hard-gated off, zero callers |
| Validation cost | ~1 day, $0, self-serve (30-day free trial, API key included) | Weeks-to-months, partnership-gated (needs a cooperating tenant) |
| Commercial weight | Differentiator for clinic deals, not a closer | Distribution channel thesis, not a feature; nothing today depends on it |
| Next action | Spin a trial tenant, validate the 6 shapes, capture one demo screenshot | **Do nothing** until an NZ anchor clinic or ACC conversation exists |

Write-back is **not load-bearing for any current pitch**. Both pitch surfaces already (correctly) claim nothing about PMS — VERIFIED: `app/acc/layout.tsx:18-20` and `components/platform/SstPitch.tsx:18-20` carry explicit "NO PMS write-back claim" guards, and a repo-wide grep finds no PMS/Cliniko/Gensolve claim in `app/acc/page.tsx` or anywhere under `app/clinical-suite/`.

---

## 1. CODE STATE

### 1.1 Architecture (VERIFIED)

- `lib/sst-trainer/pms/adapter.ts` — the seam. `PmsAdapter` interface (`findPatient`, `readDemographics`, `writeNote`, `attachPdf`, optional `pollAppointments`), `PmsKind = 'cliniko' | 'gensolve'`, registry `getAdapter()` with exhaustiveness guard (adapter.ts:118-130). Deliberately standalone: no imports from the live SST app, no route wiring (adapter.ts:10-12).
- `lib/sst-trainer/pms/deliver.ts` — the "loop-closer": `reportContentToNoteText()` flattens a `ReportContent` into a plain-text note with a decision-support disclaimer (deliver.ts:22-35); `deliverReport()` writes note-always, PDF-when-supplied, note failure ≠ attachment failure (deliver.ts:62-74); `resolvePmsAdapter()` is the single entry point and returns a live adapter only when flag AND key are both present (deliver.ts:110-115).
- **Zero production callers.** VERIFIED by grep: `resolvePmsAdapter` / `deliverReport` / `pmsWritebackEnabled` are referenced only inside `deliver.ts` and `scripts/test-pms-writeback.ts`. No route, cron, or component touches the PMS layer. `PMS_WRITEBACK_ENABLED` / `CLINIKO_API_KEY` / `GENSOLVE_*` appear nowhere else in the codebase. Even with the flag on and a key set, **nothing would fire** — the integration is dormant by construction, matching the "isolated, flagged off" posture in memory.

### 1.2 Gates (VERIFIED)

| Gate | Location | Effect |
|---|---|---|
| `PMS_WRITEBACK_ENABLED === 'true'` | deliver.ts:82-84 | Default OFF; `resolvePmsAdapter` returns null without it |
| `CLINIKO_API_KEY` | deliver.ts:94-96 | No key → null config → no adapter |
| `GENSOLVE_API_KEY` (+ optional `GENSOLVE_PRACTICE_ID`, `PMS_USER_AGENT`) | deliver.ts:99-102 | Same |
| `GensolveAdapter.UPLOAD_CONTRACT_CONFIRMED = false` | gensolve.ts:68 | **Source-level** hard gate: `attachPdf` refuses with an explicit error (gensolve.ts:194-201) until the documents contract is sandbox-confirmed. Requires a code change to flip — cannot be enabled by env var. Correct posture. |
| No-throw discipline | both adapters + deliver.ts:14 | Every failure path returns `{ok:false, error}` or `[]`; a missing key can never crash a caller |

### 1.3 Cliniko adapter (`cliniko.ts`) — what's implemented

VERIFIED (code): HTTP Basic with API key as username + empty password (cliniko.ts:34-39); shard-derived base URL `https://api.<shard>.cliniko.com/v1` (cliniko.ts:57-59); mandatory identifying User-Agent defaulting to a CEA contact string (cliniko.ts:61); `findPatient` via `q[]` filters; `readDemographics`; `writeNote` → `POST /treatment_notes` with the `content.sections[].questions[]` tree (cliniko.ts:118-133); `attachPdf` → the documented 3-step S3 presigned-POST flow (cliniko.ts:142-213); `pollAppointments` reading `did_not_arrive` (no webhooks; cliniko.ts:215-229).

**Auth/UA/rate-limit model confirmed against the current primary docs** (https://docs.api.cliniko.com/developer-portal): API key as basic-auth username "with or without the shard suffix"; User-Agent with app name + contact email is required ("future requests may be automatically blocked" without it); **no scopes — "the API key will have the same permissions as the user it belongs to"**; 200 requests/min/user. **The 3-step attachment flow matches the current docs exactly** (GET `/patients/:id/attachment_presigned_post` → multipart POST to S3 with fields before file → POST `/patient_attachments` with `patient_id`, `description`, `upload_url`) — https://docs.api.cliniko.com/guides/uploading_patient_attachments. `POST /treatment_notes` exists as a documented operation and the production base URL example is `https://api.au1.cliniko.com/v1` (https://docs.api.cliniko.com/openapi/treatmentnote/).

**`// VERIFY:` inventory — 6 unvalidated shapes** (VERIFIED against code):

| Line | Shape | Why it matters |
|---|---|---|
| cliniko.ts:44 | Shard parsed from last `-` in the key; `au1` default | Wrong shard → wrong host → every call fails. Low risk: current docs show the shard scheme and `au1` production base. |
| cliniko.ts:76 | Patient search syntax `q[]=first_name:~<term>` | Wrong syntax fails **soft** (empty list) → clinician can't find the patient → the whole clinician-picks-patient flow dead-ends silently. |
| cliniko.ts:220 | Updated-since filter `q[]=updated_at:>=<iso>` | Wrong key → poll returns wrong window → attendance (ACC885/DNA) data wrong or empty. |
| cliniko.ts:238 | `date_of_birth` format `'YYYY-MM-DD'` | DOB flows into report headers; format drift → wrong/garbled DOB on a clinical document. |
| cliniko.ts:243-246 | Appointment→patient linkage read as flat `patient_id` | **Most likely actually wrong** — the comment itself says Cliniko nests patient linkage as `patient.links.self`. If so, `patientId` is always `''` and attendance can never be matched to a patient. |
| cliniko.ts:248 | `starts_at` ISO 8601 | Appointment timestamps in reports. |

Unmarked risk worth flagging (INFERENCE from docs read): the adapter's minimal question uses `type: 'text'` (cliniko.ts:124) while the current docs speak of "paragraph questions" for HTML answers — the question-type vocabulary is itself effectively a seventh unvalidated shape.

**Doc drift (VERIFIED):** cliniko.ts:18 cites `https://github.com/redguava/cliniko-api`, which is now an **archived stub** redirecting to https://docs.api.cliniko.com/developer-portal. Update the comment when touching the file.

### 1.4 Gensolve adapter (`gensolve.ts`) — what's implemented

VERIFIED (code): bearer-token auth; NZ default base `https://nzgpm.gensolve.com/api` (gensolve.ts:47); optional `X-Practice-Id` header; `findPatient`/`readDemographics` on `/clients`; NZ-specific `readAccConditions()` pulling ACC45 claim number + S60.. read code (gensolve.ts:124-138); `writeNote` resolves the ACC condition first and attaches the note to `conditionId` when one exists (gensolve.ts:140-184); `attachPdf` hard-gated off; `pollAppointments` on the documented `GET /appointments/by_date`.

The file header (gensolve.ts:8-22) states what was confirmed against docs.gensolve.com in a prior session (per-region hosts, Secret Key + API User exchanged for a bearer token, tenant API enablement + **caller IP whitelisting** required) vs what is not publicly documented (the OpenAPI.json and per-resource schemas live behind the tenant-auth `/api/` portal). I could not re-verify the confirmed half this session — the GPM help-centre pages (docs.gensolve.com/help/gpm_nz/) render content via JS and return empty to fetches — so treat the auth model as **code-comment-sourced, previously verified**; the "not publicly reachable" half I directly reproduced.

**`// VERIFY:` inventory — 12 markers** (VERIFIED against code):

| Line | Shape | Why it matters |
|---|---|---|
| gensolve.ts:21-22 | Header: everything marked VERIFY is best-effort, never smoke-tested | Global caveat |
| gensolve.ts:29 | `POST /notes` resource existence | **The entire write-back path.** If the path or resource name is wrong, every note write 404s. Biggest single unknown. |
| gensolve.ts:30 | `POST /documents` | PDF filing (already gated off) |
| gensolve.ts:85 | `X-Practice-Id` tenant-scoping header | Wrong/missing scoping → 401s or cross-practice ambiguity |
| gensolve.ts:93 | `/clients?search=` param name | Soft-fails to empty → patient lookup dead-ends |
| gensolve.ts:128 | `/conditions?clientId=&insurer=ACC` params | Wrong params → **ACC claim number + S60.. read code never resolve** → the exact fields the ACC skins exist for stay blank, and notes file client-level instead of on the claim |
| gensolve.ts:161-163 | `/notes` payload field names incl. `conditionId` attach key | Wrong names → 400s, or worse, silently accepted with fields dropped |
| gensolve.ts:207-210 | Documents contract: path, multipart vs base64, field names | Why `UPLOAD_CONTRACT_CONFIRMED` exists |
| gensolve.ts:245 | `by_date?from=` param + attendance field | Attendance window wrong → ACC885 wrong |
| gensolve.ts:264 | `dateOfBirth` format | Report header DOB |
| gensolve.ts:278 | Attendance representation (boolean vs status string) | See defect below |
| gensolve.ts:281 | `startTime` ISO 8601 | Timestamps |

**Defect found (VERIFIED, gensolve.ts:303-310):** `toPmsAppointment` defaults `attended = true` when neither `attended` nor `status` is present. For a feed that drives ACC885 (Did Not Attend) reporting, defaulting an unknown to "attended" is the wrong fail-safe — an unrecognized shape would report perfect attendance. Should default to excluding the record (or an explicit `unknown`), never to `attended: true`.

### 1.5 Test harness (`scripts/test-pms-writeback.ts`)

VERIFIED: honest shape-test — mocks global fetch, asserts the note-text flattening, the deliverReport contract (note load-bearing, attachment non-fatal), the flag/key gating matrix, and that each adapter issues a request of the documented method/host. Its own header states it "proves the request SHAPES match the contract; it does not certify a live round-trip" (test-pms-writeback.ts:8-9). Minor drift: the run instruction says `node scripts/test-pms-writeback.mjs` (line 11) but only the `.ts` file exists — needs `tsx`/type-stripping or a rename to run.

### 1.6 The patient-identity gap (the real structural blocker)

**VERIFIED — nothing bridges SST's identity model to a PMS patient id:**

- SST persistence is de-identified by design: the store holds a clinic-chosen `patient_label`, not a name (`lib/sst-trainer/reports/load.ts:11,27`; `app/api/sst/report/route.ts:19` — "clinic-chosen `patient_label` (de-identified by design)"). The label is even used as the report's `firstName` fallback (load.ts:114).
- `PmsAdapter.writeNote/attachPdf` require a PMS `patientId` (Cliniko numeric id / Gensolve client id).
- Grep confirms: no mapping table, no schema column, no route that calls `findPatient`, no code path that ever produces a PMS patient id. The two identity systems never touch.

**Smallest honest bridge (INFERENCE — design recommendation):** clinician-picks-at-report-time, **no stored mapping**.

1. On the (future) report screen, after the clinician has generated a report for `patient_label`, offer "File to Cliniko" → a search box calling `findPatient(query)` with a name **the clinician types** (they know who "Patient A" is; SST does not and should not).
2. Show the candidates with `readDemographics` (name + DOB) and require an explicit pick + confirm — this doubles as the wrong-patient-write safeguard.
3. Call `deliverReport()` with the chosen id **in that request**. Persist at most a delivery audit line (timestamp, adapter name, PMS note id, clinic code) — never the name↔label join.

Why this is the right shape: it preserves SST's de-identification stance (the identity join exists only in the clinician's head and one transient request), it needs zero schema migration, it is the strongest possible answer to a privacy/governance review ("SST never holds identified patient data — the clinician performs the join inside their own PMS session"), and it matches the existing manual reality (clinician transcribes/attaches today).

Honest consequence: **`pollAppointments` is useless under this design** — attendance polling requires a persistent label↔patient mapping to attribute DNAs. Either drop attendance from scope or accept a stored mapping later as a deliberate, consented upgrade. Don't pretend the polling path works without one.

---

## 2. VALIDATION PATH

### 2.1 Cliniko — self-serve, ~1 day, $0

VERIFIED against primary sources:

- **Free trial:** 30 days, "you don't even need to enter any payment details" (https://www.cliniko.com/pricing/). Post-trial from $45/month (1 practitioner).
- **A trial tenant is enough for the API:** the developer portal's own instruction for getting a key is "sign up for a free trial and go to the 'My Info' link… Click 'Manage API keys'" (https://docs.api.cliniko.com/developer-portal). API keys are per-user.
- **Scopes:** none — the key inherits the owning user's permissions. Rate limit 200 req/min/user.

Realistic elapsed time (INFERENCE): **half a day to one day.** Sign up → create a fake test patient → run the adapter against the tenant → confirm/fix the 6 VERIFY shapes (the appointment patient-linkage one at cliniko.ts:243 will probably need the `patient.links.self` parse) → one treatment-note write + one PDF attachment → screenshot the note and the filed PDF inside Cliniko. Wholly within Zac's control; no counterparty. The blocker named in memory ("needs API creds Claude does not have") dissolves — the creds are a free-trial signup away.

### 2.2 Gensolve — partnership-gated, weeks-to-months, not startable alone

- VERIFIED this session: gensolve.com and gensolve.com/nz have **no developer program, no API page, no partner-integration program, no sandbox, no free trial** — demo access is contact-form-gated. The NZ page claims "New Zealand's most popular practice management software… over 1,000 practices."
- VERIFIED (code comment, previously confirmed): API access is per-practice — Secret Key + API User, tenant must have API access enabled, **caller IP whitelisted** (gensolve.ts:11-13). The OpenAPI.json and resource schemas are only readable from inside an authorized tenant (gensolve.ts:17-19).
- INFERENCE: there are exactly two routes in: **(a)** a cooperating NZ pilot clinic that already runs GPM creates an API user and whitelists CEA's IP — days of clinic-side admin once such a clinic exists, but the clinic must exist first; **(b)** approach Gensolve directly for vendor/integration status — an unbounded business-development timeline with a company that publicly advertises no such program. Either way: **weeks at absolute best, months realistically, and zero progress possible before an NZ counterparty exists.** Note the IP-whitelisting requirement is also awkward for Vercel serverless (egress IPs are not fixed) — a production integration likely needs a static-egress proxy, another reason not to start early.

---

## 3. COMMERCIAL WEIGHT

Context (VERIFIED in repo/memory): AU clinics running Cliniko are the SST clinical-suite market; NZ ACC suppliers running Gensolve are the organisational-deal market (`docs/applications/NZ-ACC-SUPPLIER-PACK.md` et al.); both current pitch surfaces claim nothing about PMS (§0); `deliver.ts:4-9` frames write-back as the structural inverse of ZEDOC's named #1 failure ("standalone, no PMS integration — the killer").

### Cliniko (AU clinic deals)

- **What it unlocks/accelerates:** the "zero double-entry" line in clinic pitches and demos — report lands in the patient's file in the PMS the clinic already lives in. It converts SST from "another tab" to "part of the record". Directly answers the standalone-tool objection the ACC-funded sector evaluation named.
- **What its absence costs today:** approximately nothing in the *current* pitches, because they promise nothing. The manual workaround (download PDF → drag into Cliniko) costs a clinician under a minute per report. No deal in the current pipeline is conditioned on it.
- **Verdict:** **differentiator, not a closer.** (INFERENCE) It will not win a deal that the report content doesn't win, but it hardens retention and is the single best *demo moment* for a Cliniko-running clinic. It trends toward table-stakes as clinic count grows; it is not load-bearing for the first ~10 clinic deals.

### Gensolve (NZ / ACC organisational)

- **What it unlocks/accelerates:** not the ACC deal itself — ACC procures outcomes and reporting, not PMS plumbing, and the ACC884/885 skins + report route are the load-bearing assets there. The real prize is the **distribution thesis**: the Ontario precedent (Embodia et al. selling HCAI integration as the channel) maps to Gensolve as the rail into 1,000+ NZ practices — "works inside the PMS every ACC physio supplier already uses" is a channel, not a feature. That only materializes via a Gensolve partnership, which (VERIFIED) has no public on-ramp.
- **What its absence costs today:** nothing. The /acc pitch correctly claims only "compiles the ACC884 to transcribe onto ACC's form." Per memory (`sst_acc_guild_cliniko_targets.md`), the actual pre-demo blockers on the ACC track are that the skins path has **no UI entry point** and **`claimRef`/`dob` are always blank** — both upstream of, and more urgent than, any PMS write.
- **Verdict:** **nice-to-have now; potentially a channel play later.** (INFERENCE) Honest read: Gensolve write-back is not load-bearing for anything currently pursued. It becomes worth real effort only when either an NZ pilot clinic or a Gensolve partnership conversation exists — and at that point it upgrades from feature to distribution.

---

## 4. RECOMMENDATION

### Sequence

1. **Cliniko first, minimum slice, opportunistically soon.** It costs ~1 day and $0, and it retires 6 VERIFY markers plus produces a demo asset. Trigger: the next time clinic-suite demo material is being prepared, or the first pitch to a clinic known to run Cliniko — whichever comes first. Given the cost, doing it before a specific trigger is defensible; letting it block anything else is not.
2. **Gensolve: explicitly deferred.** Trigger = an NZ anchor (a pilot supplier clinic willing to create an API user, or ACC/Gensolve naming integration in a real conversation). Until then, zero effort — the code is correctly parked behind `UPLOAD_CONTRACT_CONFIRMED=false` and honest VERIFY markers. First act when triggered: pull the tenant's OpenAPI.json, confirm `/notes` and `/documents`, fix the `attended=true` default (§1.4), then flip the gate.

### Minimum demonstrable slice (Cliniko)

- Trial tenant + fake test patient (never a real one).
- Run the adapter with `PMS_WRITEBACK_ENABLED=true` **locally only**: one `writeNote` + one `attachPdf`, confirm/fix the 6 VERIFY shapes, screenshot the treatment note and filed PDF inside Cliniko.
- Update cliniko.ts comments to the new docs URL; convert each confirmed `// VERIFY:` to `// CONFIRMED (tenant, date)`.
- **Do not** wire a production route, store any credential in Vercel, or add a pitch claim yet. The screenshot may be shown in demos as "built and validated, enabled per-clinic on request" — which would then be literally true.

### Full production path (what the slice does NOT cover)

- **Patient identity:** the clinician-picks-at-report-time bridge (§1.6) with mandatory demographics confirmation before write — wrong-patient-write is the #1 clinical-governance risk and the confirm step is the mitigation. No stored name↔label mapping. Drop attendance polling from scope (it silently requires a stored mapping).
- **Per-clinic credentials:** env vars are single-tenant by construction (deliver.ts:91-103). Production needs encrypted per-clinic key storage + a "create a restricted API user for SST" onboarding instruction — load-bearing because (VERIFIED) Cliniko keys carry the **full permissions of their user, with no scopes**; a clinic should never hand SST a practice-principal's key.
- **Idempotency/retries:** none exist; a retried request double-posts a duplicate treatment note into a medical record. Needs a delivery-audit table keyed per report before any auto-retry.
- **Error surfacing:** adapters fail soft (empty lists / `{ok:false}`) — right for the seam, wrong for the clinician UX; failures must be shown, not swallowed.
- **Gensolve extras:** fix the attended-defaults-true bug; static-egress IP for the whitelist; condition-attach verification so notes land on the ACC claim.

### Privacy / clinical-governance posture (both adapters)

Writing a report **into** a patient record makes CEA a processor/agent operating inside the clinic's health-records obligations — NZ: Health Information Privacy Code 2020 (clinic is the agency; CEA holds info as its agent and may not use it for its own purposes; notifiable-breach duties apply); AU: APPs + state health-records acts. (INFERENCE as to characterization; the obligations themselves are statutory.) A clinic's clinical-governance lead will ask, and the answers should be pre-written:

1. What exactly is written, and what is read? (Answer: one note + one PDF written; name/DOB read only at selection time; nothing else.)
2. Where do our API credentials live, and who at CEA can use them? (Needs the per-clinic encrypted store; recommend a restricted API user.)
3. Does CEA store our patients' identities? (Under the recommended bridge: **no** — SST stays de-identified; the join happens transiently at the clinician's instruction. This is the strongest card in the deck; the bridge design protects it.)
4. What prevents a write to the wrong patient, and what is the amend/retract procedure if it happens? (Confirm-demographics step; documented correction procedure in the PMS.)
5. Is there an audit trail of every write? (Delivery-audit table: who, when, which PMS record id.)
6. What are the data-processing terms? (A short processor/agent clause in the clinic agreement before the first production write.)

### Single recommended next action per adapter

- **Cliniko:** Zac signs up for a 30-day free trial tenant (no card needed), generates an API key under My Info → Manage API keys, and runs the adapter against it — validate the 6 VERIFY shapes, write one note + attach one PDF to a fake patient, screenshot for the demo library. ~1 day, $0. Keep `PMS_WRITEBACK_ENABLED` off in prod.
- **Gensolve:** no action. Park until an NZ pilot clinic or a Gensolve/ACC conversation exists; then request an API user + IP whitelist on their tenant and read the OpenAPI.json before touching the code (except the small `attended=true` default fix, which is worth making now).

---

*Sources: cliniko.com/pricing · docs.api.cliniko.com/developer-portal · docs.api.cliniko.com/guides/uploading_patient_attachments · docs.api.cliniko.com/openapi/treatmentnote · github.com/redguava/cliniko-api (archived) · gensolve.com · gensolve.com/nz · docs.gensolve.com (JS-rendered, not fetchable) · repo code as cited inline.*

---

## LIVE VALIDATION RESULT — 2026-07-20 (au5 trial tenant)

All six Cliniko `VERIFY:` shapes resolved against a real tenant. Full pass after two adapter fixes:

| Shape | Result |
|---|---|
| Shard from key suffix (`-au5`) | ✅ as coded |
| `q[]=first_name:~` patient search | ✅ as coded |
| `date_of_birth` = YYYY-MM-DD | ✅ as coded |
| `POST /treatment_notes` | ❌→fixed: `title` is REQUIRED top-level and `draft` must be explicit; 201 with both |
| 3-step presigned attachment flow | ✅ as coded (201, attachment id returned) |
| `updated_at:>=` poll filter + `starts_at` ISO | ✅ as coded |
| Appointment→patient linkage | ❌→fixed: NO flat `patient_id` exists; id parsed from `patient.links.self` URL. End-to-end confirmed: adapter poll now attributes the appointment (`attended=true`) |

**The Cliniko adapter is production-shape-correct as of this validation.** Still gated off (`PMS_WRITEBACK_ENABLED`), still no production caller, and the patient-identity bridge (clinician picks the PMS patient at report time) remains unbuilt — those are the remaining gaps, not API correctness.

Note the integration model: per-tenant API key pasted by the clinic. **There is no Cliniko marketplace approval required for this to work, and no SST listing on Cliniko exists today** — a listing in Cliniko's public integrations directory is an optional marketing/partnership step to pursue separately once the feature is live.
