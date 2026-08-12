import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { kv } from '@vercel/kv'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { normalisePatientCode } from '@/lib/sst-trainer/patient-identity'
import { pemGate } from '@/lib/sst-trainer/pem'
import { parseSessionResearchFields } from '@/lib/sst-trainer/research'
import { getClinicUsage, getClinic } from '@/lib/sst-trainer/clinic-registry'
import { detectThreshold, computePrescription, CONDITIONS } from '@/lib/sst-trainer/protocol'
import type { TestStage, TestInput, Condition } from '@/lib/sst-trainer/protocol'

/**
 * POST /api/sst/session
 *
 * Data flow back to the clinician via the patient's CLINIC CODE. When a patient
 * has entered a clinic code, the SST app posts each completed threshold test +
 * training session here so their treating clinician can review them (read by
 * code on the Clinical Hub). The clinic code is the key — no account needed on
 * the patient side. Isolated table (sst_clinic_sessions); never touches course
 * users or billing. Best-effort: a failure must never block the patient's
 * session UI, so the client fires this fire-and-forget.
 */
async function notifyPlanFull(clinicCode: string, usage: { patientCount: number; cap: number | null }) {
  const rec = await getClinic(clinicCode)
  const email = rec?.email?.trim().toLowerCase()
  if (!email) return
  const monthKey = new Date().toISOString().slice(0, 7)
  const auditKey = `sst_planfull_${clinicCode}_${monthKey}`
  await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  // SUPPRESSION BEFORE THE AUDIT KEY (2026-08-06 state audit): both exits
  // below returned WITHOUT releasing the month key, and the rollback at the
  // bottom only covers a failed send. So one transient DB blip on the
  // suppression read burned the key and a PAYING clinic silently lost its
  // only notice — for the rest of the calendar month — that new patients were
  // being refused at the cap. That notice IS the upgrade prompt. Checking
  // first costs one indexed select and leaves the key claimable.
  try {
    const { rows: sup } = await sql`SELECT 1 FROM email_suppression WHERE LOWER(email) = ${email} LIMIT 1`
    if (sup.length > 0) return
  } catch {
    return // fail closed — key untouched, the next refusal retries
  }
  const { rowCount: fresh } = await sql`
    INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
    ON CONFLICT (audit_key) DO NOTHING
  `
  if (!fresh) return
  const first = (rec?.contactName || '').trim().split(/\s+/)[0] || ''
  const sent = await sendEmail({
    to: email,
    subject: 'A new patient couldn’t start — your SST plan is at its limit',
    html: `<p style="margin:0 0 1em 0;">Hi${first ? ' ' + escapeHtml(first) : ''},</p><p style="margin:0 0 1em 0;">A new patient just tried to start a session at ${escapeHtml(rec?.clinicName || 'your clinic')} but your plan is at its active-patient limit (${usage.patientCount}${usage.cap != null ? ` of ${usage.cap}` : ''} active in the last 30 days). Existing patients are unaffected — only new admissions are paused.</p><p style="margin:0 0 1em 0;"><a href="https://portal.concussion-education-australia.com/clinical-testing">Upgrade from your workspace</a> (Manage billing → change plan) and the patient can start straight away.</p><p style="margin:0;">Zac Lewis<br/>Concussion Education Australia</p>`,
    tags: [{ name: 'type', value: 'sst-plan-full' }],
  })
  // Send failed → release the month key so the next refusal retries.
  if (!sent) await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`.catch(() => {})
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit({ key: `sst-session:${ip}`, limit: 30, windowSec: 60 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const clinicCode = typeof body.clinicCode === 'string' ? body.clinicCode.trim().toUpperCase() : ''
    const sessionType = body.sessionType === 'threshold' || body.sessionType === 'training' ? body.sessionType : null
    if (!clinicCode || clinicCode.length < 3 || clinicCode.length > 40) {
      return NextResponse.json({ error: 'Valid clinic code required' }, { status: 400 })
    }
    if (!sessionType) {
      return NextResponse.json({ error: 'sessionType must be threshold|training' }, { status: 400 })
    }

    // Validate the clinic code against the SAME registry the preseason baseline
    // tool uses (Vercel KV `clinic:{code}`) — one clinic code for both tools.
    // DEMO00 is the shared demo code; anything else must be a registered clinic.
    let clinic: { clinicName?: string } | null =
      clinicCode === 'DEMO00'
        ? { clinicName: 'Demo Clinic' }
        : await kv.get<{ clinicName?: string }>(`clinic:${clinicCode}`).catch(() => null)
    if (!clinic && clinicCode !== 'DEMO00') {
      // KV blip must not 404 a VALID clinic: the client treats 4xx as
      // permanent and drops the event, so a transient cache failure was
      // destroying clinical sessions outright (2026-08-05 journey sim).
      // The PG mirror is the durable record — same guard getClinicUsage uses.
      try {
        const { rows } = await sql<{ clinic_name: string }>`
          SELECT clinic_name FROM sst_clinics WHERE code = ${clinicCode} LIMIT 1
        `
        if (rows[0]) clinic = { clinicName: rows[0].clinic_name }
      } catch (err) {
        console.error('[sst-session] PG clinic fallback failed:', err)
      }
    }
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
    }
    const clinicName = clinic.clinicName ?? null

    const intOrNull = (v: unknown) => {
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n) : null
    }
    const patientLabel = typeof body.patientLabel === 'string' ? body.patientLabel.trim().slice(0, 80) || null : null
    // ALLOWLIST at the write boundary (2026-08-06 server-surface audit): this
    // value was stored raw (40-char slice only) and later cast `as Condition`
    // straight into the prescription engine's defaults table. An unrecognised
    // string 500-ed the patient's GP/ACC884 report on read, and a prototype key
    // ('toString') produced a NaN-NaN bpm band that was then written into the
    // integer band columns. Unrecognised → null, which every reader already
    // treats as the 'concussion' default.
    const rawCondition = typeof body.condition === 'string' ? body.condition.trim() : ''
    const condition = (CONDITIONS as readonly string[]).includes(rawCondition)
      ? (rawCondition as Condition)
      : null
    // Cap the payload so a malformed client can't write unbounded JSON.
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    if (JSON.stringify(payload).length > 20_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Trial-cap ADMISSION gate (server-side — the UI gate in onboarding is a
    // crafted-client bypass otherwise). Identity = the install UUID
    // (payload.patientRef) first, label as fallback — the SAME identity the
    // clinic hub groups by (2026-08-04 audit B1: keying the cap on label alone
    // let label-reuse and unlabeled writes mint unlimited free patients while
    // the hub happily charted them as distinct people). An ALREADY-SEEN
    // patient is NEVER blocked, so mid-treatment data always syncs
    // (clinical-safety rule).
    const patientRef =
      typeof (payload as Record<string, unknown>).patientRef === 'string'
        ? String((payload as Record<string, unknown>).patientRef).trim().slice(0, 64)
        : ''
    if (clinicCode !== 'DEMO00') {
      // (Red-flag clinic alerts below send without a suppression check BY
      // DECISION — clinical-safety notifications to the treating clinic are
      // not marketing; 2026-08-05 sweep #9.)
      const { rows: seen } = await sql<{ one: number }>`
        SELECT 1 AS one FROM sst_clinic_sessions
        WHERE upper(clinic_code) = ${clinicCode}
          AND (
            (${patientRef} <> '' AND payload->>'patientRef' = ${patientRef})
            OR (${patientLabel ?? ''} <> '' AND lower(trim(coalesce(patient_label, ''))) = ${(patientLabel ?? '').toLowerCase()})
          )
        LIMIT 1
      `
      if (seen.length === 0) {
        const usage = await getClinicUsage(clinicCode)
        if (!usage.canAddPatient) {
          // AUTO-PROMPT (owner 2026-08-05): the moment a paid clinic loses an
          // admission to its caseload cap, tell the owner — audit-keyed to
          // once per clinic per month. Suppression fail-closed per doctrine.
          if (usage.plan === 'active') {
            // AWAITED (final sweep #14): void'd sends can be frozen with the
            // lambda after the 402 returns — burning the monthly audit key
            // with no email and no delete-on-fail.
            await notifyPlanFull(clinicCode, usage).catch((err) =>
              console.error('[sst-session] plan-full notify failed:', err),
            )
          }
          return NextResponse.json(
            usage.plan === 'trial'
              ? {
                  // Same allowance, different truth: an enrolment's included
                  // year having lapsed is not "a free trial", and the clinician
                  // reading this over the patient's shoulder paid for it.
                  error: usage.includedLapsed ? 'included-period-ended' : 'trial-full',
                  message: usage.includedLapsed
                    ? 'This clinic’s included platform period has ended — ask your clinician to renew.'
                    : 'This clinic’s free trial is full — ask your clinician to add you.',
                }
              : { error: 'plan-full', message: 'This clinic’s plan is at its active-patient limit — ask your clinician to add you.' },
            { status: 402 },
          )
        }
      }
    }

    // ── Server-side reconciliation of the clinically-loaded fields ───────────
    // For a THRESHOLD test the clearance signal (`interpretation`) and the HRt
    // drive the GP report's clearance recommendation, so they must not be
    // trusted from the client body. Re-derive them from the raw stage data the
    // same client sent, using the SAME detectThreshold the client ran. A
    // tampered client can therefore no longer post interpretation:'no-intolerance'
    // + a fabricated HRt to trip clearanceReady — it would have to forge a full,
    // plausible stage table, which the clinician reviews and signs off. The band
    // is re-derived from the verified HRt to stay consistent.
    let storedHrt = intOrNull(body.hrtBpm)
    let storedBandLow = intOrNull(body.bandLow)
    let storedBandHigh = intOrNull(body.bandHigh)
    const payloadForStore: Record<string, unknown> = { ...(payload as Record<string, unknown>) }

    // PATIENT IDENTITY (2026-08-09). `patientCode` is the clinic-scoped, minted
    // identity key; `patientRef` is an INSTALL uuid and `patientLabel` is free
    // text a clinician typed. Only the code can neither collide (two "John S"
    // merging into one record) nor split (the same human on a phone and a
    // laptop reporting as two). It is normalised and stored as a top-level
    // payload field so the report query and the research extract both key on
    // the same value.
    //
    // Additive: a client that sends no code behaves exactly as before.
    const rawPatientCode = (payload as Record<string, unknown>).patientCode
    const patientCode = normalisePatientCode(rawPatientCode)
    if (patientCode) payloadForStore.patientCode = patientCode
    else delete payloadForStore.patientCode

    // Research fields ride the same payload. parseSessionResearchFields FAILS
    // TO NULL on anything malformed — in particular a consent version that does
    // not exist is stored as "not enrolled", never trusted, because a
    // permissive parse here would enrol someone in wording never shown to them.
    const researchFields = parseSessionResearchFields(payload)
    payloadForStore.researchConsentVersion = researchFields.researchConsentVersion
    if (researchFields.daysSinceInjury !== null && researchFields.daysSinceInjury !== undefined) {
      payloadForStore.daysSinceInjury = researchFields.daysSinceInjury
    } else {
      delete payloadForStore.daysSinceInjury
    }

    // CRITICAL (2026-08-05 final sweep #1): an ABORTED test must never be
    // re-derived — a walk-out at minute 2 has no ≥3-pt rise, so detectThreshold
    // returns 'no-intolerance' and every downstream surface (hub clearance
    // banner, ACC884 "tolerance recovered", RTP/RTW progression) presents a
    // quitter as recovered. Event rows (test-aborted / red-flag-cleared) are
    // NOT tests: interpretation forced 'invalid', hrt/band nulled so they can
    // never become the "latest threshold" a report or hub card reads.
    const evType = typeof (payload as { eventType?: unknown }).eventType === 'string'
      ? String((payload as { eventType?: unknown }).eventType)
      : ''
    // 'orthostatic-test' (NASA lean, POTS pathway) is a different instrument
    // riding the threshold transport — same rule: never a graded test.
    const isEventRow =
      evType === 'test-aborted' || evType === 'red-flag-cleared' || evType === 'orthostatic-test'
    if (sessionType === 'threshold' && isEventRow) {
      payloadForStore.interpretation = 'invalid'
      delete payloadForStore.thresholdStage
      storedHrt = null
      storedBandLow = null
      storedBandHigh = null
    }
    // FAIL CLOSED (2026-08-05 adversarial review): this ran only when the body
    // HAPPENED to carry a stages array, so omitting `stages` (or sending
    // `stages: null` / a string / an object) skipped reconciliation entirely and
    // the client's own `interpretation: 'no-intolerance'` + `hrtBpm` were stored
    // verbatim — a one-request forged clearance with no stage table at all.
    // A threshold row with no readable stage table is now derived from an EMPTY
    // stage set, which detectThreshold answers 'invalid'.
    if (sessionType === 'threshold' && !isEventRow) {
      const rawStages: unknown[] = Array.isArray((payload as { stages?: unknown }).stages)
        ? (payload as { stages: unknown[] }).stages
        : []
      const stages: TestStage[] = rawStages
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          minute: Number(s.minute),
          heartRate: Number(s.heartRate),
          symptomScore: Number(s.symptomScore),
          // RPE must ride along: it is the SECOND validated BCTT termination
          // criterion, and detectThreshold needs it to tell a genuine
          // exhaustion-limited test (RPE >= 17 → 'no-intolerance', the
          // clearance signal) from one that simply stopped early ('invalid').
          // Dropping it here meant the server ran a DIFFERENT computation from
          // the client it claims to reconcile against, so a forged
          // 'no-intolerance' only had to omit RPE to survive re-derivation.
          rpe: Number.isFinite(Number(s.rpe)) ? Number(s.rpe) : undefined,
          hrVerified: s.hrVerified === true,
        }))
        // Plausibility, server-side: the web GuidedTest already refuses a
        // reading outside 30-240 bpm and the watch clamps 30-250, but nothing
        // enforced it here — a posted stage table of HR 0 rows derived an HRt
        // of 0 and, through computePrescription, a 0-0 bpm training band.
        .filter(
          (s) =>
            Number.isFinite(s.minute) &&
            Number.isFinite(s.symptomScore) &&
            Number.isFinite(s.heartRate) &&
            s.heartRate >= 30 &&
            s.heartRate <= 250,
        )

      // Read the canonical key, falling back to the watch's legacy `restingSymptom`
      // key so older watch builds still reconcile against the right baseline.
      const rp = payload as { restingSymptomScore?: unknown; restingSymptom?: unknown }
      const restingRaw = Number(rp.restingSymptomScore ?? rp.restingSymptom)
      const resting = Number.isFinite(restingRaw) ? restingRaw : 0
      const termRaw = (payload as { termination?: unknown }).termination
      const termination = (typeof termRaw === 'string' ? termRaw : 'completed') as TestInput['termination']

      const derived = detectThreshold({ restingSymptomScore: resting, stages, termination })

      const claimedInterp = (payload as { interpretation?: unknown }).interpretation
      if (typeof claimedInterp === 'string' && claimedInterp !== derived.interpretation) {
        console.warn(
          `SST session: client interpretation '${claimedInterp}' != server-derived '${derived.interpretation}' (clinic ${clinicCode.slice(0, 3)}***) — using server value`,
        )
      }

      payloadForStore.interpretation = derived.interpretation
      payloadForStore.thresholdStage = derived.thresholdStage
      storedHrt = derived.hrt != null ? Math.round(derived.hrt) : null

      /**
       * PEM INTERLOCK — ENFORCED HERE, ON THE SERVER.
       *
       * The gate has to sit at the point the BAND IS COMPUTED, not at the
       * screen that collects the answers. A client that skips the PEM screen,
       * an older app build, an offline replay, or a direct POST would otherwise
       * all obtain a training band for a PEM-risk condition — and the interlock
       * would be advisory decoration. Placing it here makes it unbypassable.
       *
       * FAILS CLOSED. A PEM-risk condition with no screen in the payload, an
       * incomplete screen, or any positive item yields NO BAND. The session
       * itself is still recorded — refusing to store a clinical event would
       * lose data — but no prescription is derived from it, and the reason is
       * written to the row so the clinician's surface can explain the refusal
       * as a clinical finding rather than a fault.
       */
      const pemScreenRaw = (payload as { pemScreen?: unknown }).pemScreen
      const gate = pemGate(
        condition ?? 'concussion',
        (pemScreenRaw ?? null) as Parameters<typeof pemGate>[1],
      )

      if (!gate.allowed) {
        storedBandLow = null
        storedBandHigh = null
        payloadForStore.pemBlocked = true
        payloadForStore.pemVerdict = gate.verdict.status
        console.warn(
          `[sst-session] PEM interlock BLOCKED a prescription for clinic ${clinicCode} ` +
            `(condition=${condition ?? 'concussion'}, verdict=${gate.verdict.status})`,
        )
      } else if (storedHrt != null) {
        // `condition` is allowlisted above, so computePrescription can no
        // longer throw or return a NaN band here.
        const rx = computePrescription(storedHrt, condition ?? 'concussion')
        storedBandLow = rx.lowerBpm
        storedBandHigh = rx.upperBpm
      } else {
        storedBandLow = null
        storedBandHigh = null
      }
    }

    // DEMO00 never persists (2026-08-04 audit B2: the world-writable demo row
    // set defaced the dataset every prospect opens, and was an uncapped
    // anonymous INSERT lane). The demo patient flow completes client-side;
    // demo clinician reads serve a curated fixture.
    if (clinicCode === 'DEMO00') {
      return NextResponse.json({ ok: true, demo: true })
    }

    // Red-flag self-clear (2026-08-04 audit P2-7): the lock is self-clearable
    // by design ("my clinician has cleared me"), but the clinician had no
    // real-time signal. Email the clinic the moment the event lands, keyed
    // per patient/day so repeats don't spam.
    const eventType = String((payload as Record<string, unknown>).eventType || '')
    if (eventType === 'red-flag-cleared') {
      try {
        const { rows: clin } = await sql<{ email: string; clinic_name: string }>`
          SELECT email, clinic_name FROM sst_clinics WHERE code = ${clinicCode} LIMIT 1`
        const to = clin[0]?.email
        if (to) {
          const dayKey = new Date().toISOString().slice(0, 10)
          const who = patientLabel || patientRef || 'a patient'
          // ONE expression for the key — the insert and the rollback below
          // must never be able to drift apart.
          const alertKey = `sst_redflag_clear_${clinicCode}_${who}_${dayKey}`
          const { rowCount: fresh } = await sql`
            INSERT INTO email_audit_log (audit_key, sent_at)
            VALUES (${alertKey}, NOW())
            ON CONFLICT (audit_key) DO NOTHING`
          if (fresh) {
            const sent = await sendEmail({
              to,
              subject: `SST alert: ${who} resumed after a red-flag hold`,
              html: `<p style="margin:0 0 1em 0;">${escapeHtml(String(who))} at ${escapeHtml(clin[0].clinic_name)} tapped &ldquo;my clinician has cleared me&rdquo; after a red-flag hold and has resumed activity in SST Trainer.</p><p style="margin:0 0 1em 0;">If you did not clear this patient, contact them now. The event is logged in your Clinical Hub.</p>`,
              tags: [{ name: 'type', value: 'sst-redflag-alert' }],
            })
            // Release the day key on failure so the NEXT event re-fires the
            // alert. sendEmail returns false rather than throwing on a Resend
            // failure, so the catch below never saw it: the audit row was
            // committed before the send and never rolled back, which silently
            // and permanently suppressed a CLINICAL SAFETY alert — a patient
            // self-resuming after a red-flag hold with the clinician never
            // told. Same contract as notifyPlanFull above and
            // sendOrRollbackAudit in cron/send-nurture-emails.
            if (!sent) {
              console.error(`[sst-session] red-flag alert send FAILED for clinic ${clinicCode} — releasing audit key`)
              await sql`DELETE FROM email_audit_log WHERE audit_key = ${alertKey}`.catch(() => {})
            }
          }
        }
      } catch (err) {
        console.error('[sst-session] red-flag alert failed (non-fatal):', err)
      }
    }

    // Idempotency (final sweep #15): offline replays are at-least-once — the
    // client stamps a syncId at enqueue; reusing it as the row id makes
    // duplicate deliveries no-ops instead of duplicate clinical rows.
    //
    // ENTROPY GATE (2026-08-06 residual sweep). The shape test used to be
    // `/^[0-9a-fA-F-]{16,64}$/` alone, which is a character-class check, not an
    // identifier check: it accepts zero-entropy constants like
    // "0000000000000000" or "----------------". `sst_clinic_sessions.id` is a
    // GLOBAL primary key (not scoped by clinic_code), and the insert below is
    // ON CONFLICT DO NOTHING returning {ok:true} — so one buggy or tampered
    // client emitting a constant syncId would have its first session stored and
    // every subsequent session, at every clinic, SILENTLY DISCARDED with a
    // success response. Requiring real variety in the id makes a genuine
    // random/UUID value pass and a degenerate one fall through to a
    // server-minted UUID (worst case: a replay isn't deduped, which is the
    // pre-idempotency behaviour — never a lost clinical record).
    const syncIdRaw = (payload as Record<string, unknown>).syncId
    const syncIdOk =
      typeof syncIdRaw === 'string' &&
      /^[0-9a-fA-F-]{16,64}$/.test(syncIdRaw) &&
      new Set(syncIdRaw.toLowerCase().replace(/-/g, '')).size >= 6
    const rowId = syncIdOk ? (syncIdRaw as string).toLowerCase() : crypto.randomUUID()
    const { rowCount: stored } = await sql`
      INSERT INTO sst_clinic_sessions
        (id, clinic_code, clinic_name, patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at)
      VALUES (
        ${rowId}, ${clinicCode}, ${clinicName}, ${patientLabel}, ${sessionType},
        ${storedHrt}, ${storedBandLow}, ${storedBandHigh},
        ${condition}, ${JSON.stringify(payloadForStore)}::jsonb, now()
      )
      ON CONFLICT (id) DO NOTHING
    `
    // A swallowed conflict is the intended no-op for a replay, but it is also
    // the exact signature of a clinical write being lost to a colliding id.
    // It used to be invisible — the route returned {ok:true} either way.
    if (!stored) {
      console.warn(
        `[sst-session] insert deduped by ON CONFLICT — clinic ${clinicCode}, session ${sessionType}, id ${rowId}. Expected for an offline replay; investigate if the clinic reports a missing session.`,
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SST session ingest error:', err)
    return NextResponse.json({ error: 'Could not save session' }, { status: 500 })
  }
}
