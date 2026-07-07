-- ────────────────────────────────────────────────────────────────────────────
-- sst_sessions_research — the ONLY sanctioned surface for SECONDARY use of SST
-- session data (service-improvement / QA now; a future ethics-approved
-- retrospective study later).
--
-- Why this exists (owner directive 2026-07-08: "clean data-wise; collect for
-- care now, HREC later"):
--   * The base table `sst_clinic_sessions` is CARE data — the clinician reads it
--     to treat their own patient, and it legitimately holds the patient's name
--     (patient_label). That primary use is fine and needs no consent gate.
--   * ANY secondary use (analytics, QA, or a future retrospective study) must be
--     de-identified AND limited to patients who opted in. This view enforces both
--     by construction, so no one ever runs QA/research over identifiable rows.
--
-- Clean-by-construction guarantees:
--   1. CONSENT-FILTERED — only rows where the patient ticked the optional
--      service-improvement opt-in (payload.dataConsent = 'true'). Decliners and
--      unknown are excluded.
--   2. NAME STRIPPED — patient_label and clinic_name are dropped; patients and
--      clinics appear only as salted-hash pseudonyms (stable, for grouping,
--      non-reversible without the salt).
--   3. DEVICE NAME STRIPPED — a wearable name can be personalised.
--
-- Retrospective-study note: because the base data is retained and this view is
-- de-identified + consent-limited, a future HREC can approve a retrospective
-- study on it under a waiver of consent (National Statement §2.3.10–2.3.11)
-- WITHOUT any research representation being made to patients today. Do NOT add
-- "research" wording to the in-app consent until that HREC + a research-specific
-- consent are actually in place.
--
-- Run once against Neon. Set a real secret salt before running.
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Replace this with a real, secret, stored-out-of-band salt before running.
-- (Keeps the pseudonyms non-reversible by anyone who only has the view output.)
--   e.g. openssl rand -hex 16
\set salt 'REPLACE_WITH_A_SECRET_SALT'

CREATE OR REPLACE VIEW sst_sessions_research AS
SELECT
  id,
  -- pseudonymous clinic + patient (salted SHA-256; stable for grouping)
  encode(digest(:'salt' || '|c|' || upper(clinic_code), 'sha256'), 'hex')                              AS clinic_ref,
  encode(digest(:'salt' || '|p|' || upper(clinic_code) || '|' ||
                COALESCE(payload->>'patientRef', COALESCE(patient_label, id)), 'sha256'), 'hex')        AS patient_ref,
  session_type,
  hrt_bpm,
  band_low,
  band_high,
  condition,
  -- clinical detail only; identifiers removed
  (payload - 'patientRef' - 'deviceName') AS detail,
  created_at
FROM sst_clinic_sessions
WHERE payload->>'dataConsent' = 'true';   -- opted-in to secondary use ONLY

-- Usage: SELECT * FROM sst_sessions_research;  -- never query sst_clinic_sessions
-- directly for QA/research. Grant analytics roles access to the VIEW, not the table.
