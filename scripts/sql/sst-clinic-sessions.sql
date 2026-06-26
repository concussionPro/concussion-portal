-- SST sessions that flow back to a clinician via the patient's CLINIC CODE.
-- Uses the SAME registry as the preseason baseline tool (Vercel KV
-- `clinic:{code}`): a clinic registers once, gets ONE code, and uses it for both
-- pre-season baselines and SST rehab. The clinician reads sessions by code.
-- Isolated from billing/course tables. Run once against Neon.

CREATE TABLE IF NOT EXISTS sst_clinic_sessions (
  id             TEXT PRIMARY KEY,
  clinic_code    TEXT NOT NULL,        -- validated against kv `clinic:{code}` (same registry as preseason)
  clinic_name    TEXT,                 -- resolved from the registry at ingest
  patient_label  TEXT,                 -- name/identifier the patient enters (optional)
  session_type   TEXT NOT NULL,        -- 'threshold' | 'training'
  hrt_bpm        INTEGER,
  band_low       INTEGER,
  band_high      INTEGER,
  condition      TEXT,
  payload        JSONB NOT NULL,       -- full test/session detail
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sst_clinic_sessions_code
  ON sst_clinic_sessions (upper(clinic_code), created_at DESC);
