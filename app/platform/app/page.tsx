'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  canRetest,
  computePrescription,
  progressionDecision,
  sessionVerification,
  RETEST_MIN_HOURS,
  type Condition,
  type Prescription,
  type TestInput,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import {
  clearState,
  defaultState,
  loadState,
  savePatientStateDebounced,
  type PersistedSession,
  type PersistedTest,
  type WelcomeSelection,
} from '@/lib/sst-trainer/store'
import { STEP_ORDER, PrimaryButton, SecondaryButton, type Step } from '@/components/sst-trainer/shell'
import { DEFAULT_HR_SOURCE, HR_SOURCES, hrSourceById, useLiveHr, type HrSource } from '@/components/sst-trainer/hr-source'
import SstConnectWizard from '@/components/platform/SstConnectWizard'
import type { LiveHrConnection } from '@/lib/sst-trainer/hr-live'
import SymptomSelect from '@/components/sst-trainer/SymptomSelect'
import Readiness, { type ReadinessResult } from '@/components/sst-trainer/Readiness'
import GuidedTest from '@/components/sst-trainer/GuidedTest'
import ResultPrescription from '@/components/sst-trainer/ResultPrescription'
import HomeHub from '@/components/sst-trainer/HomeHub'
import TrainingSession from '@/components/sst-trainer/TrainingSession'
import ProgressDashboard from '@/components/sst-trainer/ProgressDashboard'
import SstInstallPrompt from '@/components/sst-trainer/SstInstallPrompt'
import {
  flushPendingSyncs,
  pushLiveTick,
  syncDailyCheckin,
  syncSessionToClinic,
  type SyncEventType,
} from '@/lib/sst-trainer/clinic-sync'
import { daysSinceInjury } from '@/lib/sst-trainer/research'
import DailyCheckin from '@/components/sst-trainer/DailyCheckin'
import { SstAppShell } from '@/components/platform/SstAppShell'
import SstOnboarding, { type OnboardingResult } from '@/components/platform/SstOnboarding'
import SstPwaRegister from '@/components/platform/SstPwaRegister'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/app — the REAL, installable SST Trainer app (not a product tour).
//
// PERSISTENCE: everything clinically meaningful lives in localStorage
// (lib/sst-trainer/store.ts, `sst:v1`) and rehydrates on launch — a patient who
// closed the app yesterday lands on HOME with their band, not on onboarding.
// The install UUID rides along as `patientRef` on every sync + live tick.
//
// PROTOCOL INTEGRITY (lib/sst-trainer/protocol.ts):
//  - advance evidence = VERIFIED sessions only (live Bluetooth HR);
//  - the ceiling can never exceed the measured HRt (at the cap → re-test);
//  - REGRESS auto-applies (safety never waits for a tap) with an undo;
//  - re-tests are spaced (48h / 1 per day) and a red-flag locks test + training
//    behind an explicit clinician-clearance acknowledgement;
//  - camera PPG is a resting spot-check only — it never feeds a live session
//    and can never verify one.
//
// SYNC COMPLETENESS: physiologic / no-intolerance / red-flag / aborted tests,
// completed / symptom-stopped / abandoned sessions all sync (eventType in
// payload); failures queue in the store and retry on launch + 'online'.
// Gated + noindex by app/platform/layout.tsx; do not re-gate here.
// ─────────────────────────────────────────────────────────────────────────────

type AppStep = Step | 'checkin' | 'locked'

const STEP_CAPTION: Record<AppStep, string> = {
  welcome: 'Welcome',
  symptoms: 'Symptom profile',
  readiness: 'Safety check',
  test: 'Threshold test',
  result: 'Your prescription',
  home: 'Home',
  training: 'Live session',
  progress: 'Progress',
  checkin: 'Quick check-in',
  locked: 'Medical review',
}

const WEEK_MS = 604_800_000
/**
 * THE NEXT-DAY CHECK-IN WINDOW — 12 to 36 hours, both bounds.
 *
 * The lower bound existed; the upper did not, so an answer given three days
 * later was stored as "the next-day check-in" for that session. The published
 * protocol (v2 §5) and the analysis pipeline both define exacerbation as the
 * rating 12-36h after the session, so an unbounded window meant the product was
 * generating a different variable from the one its own protocol defines — and
 * the framework paper would have validated a protocol it does not cite.
 *
 * Past 36h the session is NOT re-prompted: the observation is missing, and
 * missing must stay missing. Coding a late answer as the next-day response, or
 * a skipped one as "no flare", both bias the estimate toward the null.
 */
const CHECKIN_AFTER_MS = 12 * 3_600_000
const CHECKIN_BEFORE_MS = 36 * 3_600_000

/** Calendar-day key for the check-in skip marker ("skip holds for today"). */
function todayKey(): string {
  return new Date().toDateString()
}

/** LOCAL calendar date as YYYY-MM-DD — the daily check-in is about the
 *  patient's day, so this is deliberately not toISOString() (UTC would put an
 *  evening Sydney answer on tomorrow's date). */
function localDateIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Tuesday's session" / "yesterday's session" for the next-day check-in. */
function sessionDayLabel(at: number): string {
  const d = new Date(at)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOf(today) - startOf(d)) / 86_400_000)
  if (dayDiff <= 1) return 'yesterday’s'
  return `${d.toLocaleDateString('en-AU', { weekday: 'long' })}’s`
}

export default function PlatformAppPage({
  publicSurface = false,
  embeddedClinicCode = null,
}: {
  /**
   * true when rendered on the PUBLIC /sst-trainer route: patients arrive with
   * their clinic's code (the paying clinic's distribution). Self-guided mode —
   * the full product without a code — exists only on this gated /platform/app
   * surface (paid/enrolled/admin), never on the public one.
   */
  publicSurface?: boolean
  /**
   * When rendered INSIDE the clinician portal (/clinical-testing/sst), the
   * clinician's own clinic code is known — wire it in and skip the
   * Self-guided/Clinic-code chooser entirely (patients never use this page;
   * owner 2026-07-06). Pre-fills clinic-code mode with this code.
   */
  embeddedClinicCode?: string | null
}) {
  const [step, setStep] = useState<AppStep>('welcome')
  const [hydrated, setHydrated] = useState(false)
  const [welcomeBack, setWelcomeBack] = useState(false)

  // onboarding selections (the new design) → flow into the existing machine
  const [device, setDevice] = useState<HrSource>(DEFAULT_HR_SOURCE)
  // the REAL paired heart-rate connection (null = manual entry).
  const [connection, setConnection] = useState<LiveHrConnection | null>(null)
  const [welcome, setWelcome] = useState<WelcomeSelection | null>(null)
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [goal, setGoal] = useState<string | null>(null)
  const [goalLabel, setGoalLabel] = useState<string | null>(null)

  // collected across the engine-backed flow (mirrors /sst-trainer)
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([])
  const [restingSymptomScore, setRestingSymptomScore] = useState(0)
  const [thresholdResult, setThresholdResult] = useState<ThresholdResult | null>(null)
  const [thresholdHistory, setThresholdHistory] = useState<PersistedTest[]>([])
  const [prescription, setPrescription] = useState<(Prescription & { createdAt: number }) | null>(null)
  // Sessions under the CURRENT prescription — a re-test archives the old ones,
  // so progression only ever evaluates evidence earned inside the current band.
  const [sessions, setSessions] = useState<PersistedSession[]>([])
  const [archivedSessions, setArchivedSessions] = useState<PersistedSession[]>([])
  // Fail-closed progression: ONLY verified sessions (live Bluetooth HR) count
  // toward advancing the band. The ceiling can never be ratcheted up on
  // unverified data — the defensible wedge.
  const [verifiedSessions, setVerifiedSessions] = useState(0)
  const [progressionCheckpoint, setProgressionCheckpoint] = useState(0)
  const [decisionCheckpoint, setDecisionCheckpoint] = useState(0)

  // safety state
  const [lastRedFlagAt, setLastRedFlagAt] = useState<number | null>(null)
  const [redFlagLocked, setRedFlagLocked] = useState(false)
  const [redFlagClearedAt, setRedFlagClearedAt] = useState<number | null>(null)
  const [lastTestAt, setLastTestAt] = useState<number | null>(null)
  const [lastRegressAt, setLastRegressAt] = useState<number | null>(null)
  // true when the last auto-applied down-adjustment was the REST rail (two
  // flares in a row) vs a plain regress — drives the stronger Home message.
  const [restPrescribed, setRestPrescribed] = useState(false)

  // transient UI
  const [retestNotice, setRetestNotice] = useState<string | null>(null)
  const [regressUndo, setRegressUndo] = useState<{ lowerBpm: number; upperBpm: number } | null>(null)
  const [confirmStartOver, setConfirmStartOver] = useState(false)
  const [confirmCleared, setConfirmCleared] = useState(false)
  const [checkinIdx, setCheckinIdx] = useState<number | null>(null)
  // "Skip for now" persists for the rest of the day — the check-in must never
  // re-ambush on every open, and must never gate 'Start today's session'.
  const [checkinSkippedOn, setCheckinSkippedOn] = useState<string | null>(null)
  // DAILY check-in (rest-day comparator) — last answered local date + score.
  // The score is kept so a session completed later the same day re-sends the
  // row with trained=true instead of re-asking the question.
  const [dailyCheckinOn, setDailyCheckinOn] = useState<string | null>(null)
  const [dailyCheckinScore, setDailyCheckinScore] = useState<number | null>(null)

  const installIdRef = useRef<string>('')
  const condition: Condition = welcome?.condition ?? 'concussion'

  // ── hydration: land returning patients on HOME, not onboarding ─────────────
  useEffect(() => {
    const stored = loadState()
    const s = stored ?? defaultState()
    installIdRef.current = s.installId
    if (stored) {
      if (s.clinicCode || s.patientName || s.prescription) {
        setWelcome({
          mode: s.mode,
          dataConsent: s.dataConsent,
          clinicCode: s.clinicCode,
          patientName: s.patientName,
          condition: 'concussion', // the only live pathway today
          patientCode: s.patientCode,
          injuryDate: s.injuryDate,
          ageBand: s.ageBand,
          sex: s.sex,
          researchConsent: s.researchConsent,
        })
      }
      setClinicName(s.clinicName)
      setGoal(s.goal)
      setGoalLabel(s.goalLabel)
      setSelectedSymptomIds(s.selectedSymptomIds)
      setRestingSymptomScore(s.restingSymptomScore)
      setPrescription(s.prescription)
      setThresholdHistory(s.thresholdHistory)
      setSessions(s.sessions)
      setArchivedSessions(s.archivedSessions)
      setVerifiedSessions(s.verifiedSessions)
      setProgressionCheckpoint(s.progressionCheckpoint)
      setDecisionCheckpoint(s.decisionCheckpoint)
      setLastRedFlagAt(s.lastRedFlagAt)
      setRedFlagLocked(s.redFlagLocked)
      setRedFlagClearedAt(s.redFlagClearedAt)
      setLastTestAt(s.lastTestAt)
      setLastRegressAt(s.lastRegressAt)
      setCheckinSkippedOn(s.checkinSkippedOn)
      setDailyCheckinOn(s.dailyCheckinOn)
      setDailyCheckinScore(s.dailyCheckinScore)

      if (s.redFlagLocked) {
        setStep('locked')
      } else if (s.prescription) {
        // Next-day check-in: on an open >=12h after a session with no answer
        // yet — UNLESS the patient already skipped it today (the skip persists
        // for the day; the check-in returns tomorrow).
        const skippedToday = s.checkinSkippedOn === todayKey()
        const idx = skippedToday
          ? -1
          : s.sessions.findIndex(
              (sess) => {
                if (sess.nextDayCheckin) return false
                const age = Date.now() - sess.at
                return age >= CHECKIN_AFTER_MS && age <= CHECKIN_BEFORE_MS
              },
            )
        if (idx >= 0) {
          setCheckinIdx(idx)
          setStep('checkin')
        } else {
          setStep('home')
        }
        setWelcomeBack(true)
      }
    } else {
      // brand-new install: persist the freshly generated install id promptly
      savePatientStateDebounced({ ...s }, 50)
    }
    setHydrated(true)
    // retry any clinical events that failed to sync last time
    void flushPendingSyncs()
  }, [])

  // retry queued syncs whenever connectivity returns
  useEffect(() => {
    const onOnline = () => void flushPendingSyncs()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // ── persist on every meaningful transition (debounced) ─────────────────────
  useEffect(() => {
    if (!hydrated) return
    savePatientStateDebounced({
      installId: installIdRef.current,
      mode: welcome?.mode ?? 'clinic-code',
      clinicCode: welcome?.clinicCode ?? null,
      clinicName,
      patientName: welcome?.patientName ?? null,
      dataConsent: welcome?.dataConsent ?? false,
      goal,
      goalLabel,
      selectedSymptomIds,
      restingSymptomScore,
      prescription,
      thresholdHistory,
      sessions,
      archivedSessions,
      verifiedSessions,
      progressionCheckpoint,
      decisionCheckpoint,
      lastRedFlagAt,
      redFlagLocked,
      redFlagClearedAt,
      lastTestAt,
      lastRegressAt,
      checkinSkippedOn,
      patientCode: welcome?.patientCode ?? null,
      injuryDate: welcome?.injuryDate ?? null,
      ageBand: welcome?.ageBand ?? null,
      sex: welcome?.sex ?? null,
      researchConsent: welcome?.researchConsent ?? false,
      dailyCheckinOn,
      dailyCheckinScore,
    })
  }, [
    hydrated, welcome, clinicName, goal, goalLabel, selectedSymptomIds, restingSymptomScore,
    prescription, thresholdHistory, sessions, archivedSessions, verifiedSessions,
    progressionCheckpoint, decisionCheckpoint, lastRedFlagAt, redFlagLocked, redFlagClearedAt,
    lastTestAt, lastRegressAt, checkinSkippedOn, dailyCheckinOn, dailyCheckinScore,
  ])

  // Per-clinic QR deep link (/sst-trainer?clinic=CODE) → pre-fill the clinic code
  // in onboarding. Read client-side; the onboarding component is KEYED on this
  // value so it genuinely remounts pre-filled (and auto-validates) once read.
  const [urlClinicCode, setUrlClinicCode] = useState<string | undefined>(undefined)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('clinic')?.trim()
    if (code) setUrlClinicCode(code.toUpperCase())
  }, [])

  // Live HR feed from the REAL paired connection. Null connection → 'manual'.
  const feed = useLiveHr(connection)

  // Camera PPG is a RESTING SPOT-CHECK only (motion artefact makes it invalid
  // during exercise) — the header pill still shows it, but the test + training
  // screens only ever receive a live feed from a Bluetooth stream.
  const sessionFeed = useMemo(
    () =>
      device.connect === 'bluetooth'
        ? feed
        : { bpm: null, status: 'manual' as const, live: false },
    [device.connect, feed],
  )

  // Release the hardware when the app unmounts (GATT disconnect / camera stop).
  useEffect(() => {
    return () => {
      connection?.stop()
    }
  }, [connection])

  // LIVE in-session monitoring: while training with a clinic code, push the
  // current HR/band every 3s so the clinician dashboard can watch in real time.
  // A ref carries the latest values so the interval stays stable (no resets).
  const liveRef = useRef({ bpm: sessionFeed.bpm, code: welcome?.clinicCode, name: welcome?.patientName, low: prescription?.lowerBpm, high: prescription?.upperBpm })
  liveRef.current = { bpm: sessionFeed.bpm, code: welcome?.clinicCode, name: welcome?.patientName, low: prescription?.lowerBpm, high: prescription?.upperBpm }
  useEffect(() => {
    if (step !== 'training' || !welcome?.clinicCode) return
    const start = Date.now()
    const tick = () => {
      const d = liveRef.current
      pushLiveTick({
        clinicCode: d.code, patientLabel: d.name, patientRef: installIdRef.current, bpm: d.bpm,
        bandLow: d.low ?? null, bandHigh: d.high ?? null,
        elapsedSec: Math.round((Date.now() - start) / 1000), phase: 'training',
      })
    }
    tick()
    const iv = setInterval(tick, 3000)
    return () => clearInterval(iv)
  }, [step, welcome?.clinicCode])

  // Pair a source: stop any previous connection, then adopt the new one.
  const handlePair = (d: HrSource, conn: LiveHrConnection | null) => {
    setConnection((prev) => {
      if (prev && prev !== conn) prev.stop()
      return conn
    })
    setDevice(d)
  }

  // Header reconnect — the HR pill on every monitored screen opens this so a
  // dropped watch/strap can be re-paired mid-session (and 'Manual entry' becomes
  // a "link a device" action). Reuses the same connect flow as onboarding.
  const [reconnectOpen, setReconnectOpen] = useState(false)

  // ── sync helper: identity + consent ride on every clinical event ────────────
  const syncEvent = (input: {
    sessionType: 'threshold' | 'training'
    eventType: SyncEventType
    hrtBpm?: number | null
    bandLow?: number | null
    bandHigh?: number | null
    payload?: Record<string, unknown>
  }) => {
    syncSessionToClinic({
      clinicCode: welcome?.clinicCode,
      patientLabel: welcome?.patientName,
      patientRef: installIdRef.current,
      condition,
      ...input,
      payload: {
        ...(input.payload ?? {}),
        dataConsent: welcome?.dataConsent ?? false,
        hrSource: device.connect,
        deviceName: connection?.label ?? null,
        // Minted clinic-scoped identity (intake 2026-08-09). Without it every
        // row resolved by install-UUID/label fallback — the exact merge/split
        // failure the code exists to prevent. Null for pre-intake patients;
        // the server-side fallbacks still apply.
        patientCode: welcome?.patientCode ?? null,
        // Derived on device at event time; the injury date itself never leaves.
        daysSinceInjury: welcome?.injuryDate ? daysSinceInjury(welcome.injuryDate, new Date()) : null,
      },
    })
  }

  // ── progression (page-owned so regress can auto-apply) ─────────────────────
  const decision = useMemo(
    () => (prescription ? progressionDecision(prescription, sessions) : null),
    [prescription, sessions],
  )
  const decisionFresh = sessions.length > decisionCheckpoint

  // ── recovery curve + celebration derivations ────────────────────────────────
  // Previous MEASURED test: at the result step the just-finished test is
  // already the last measured entry in thresholdHistory, so its predecessor is
  // the second-last. Null until a second measured test exists.
  const previousMeasured = useMemo(() => {
    const measured = thresholdHistory.filter((t) => t.hrt != null)
    return measured.length >= 2 ? measured[measured.length - 2] : null
  }, [thresholdHistory])
  // Verified sessions genuinely banked between the two test dates. A new band
  // now archives the old band's sessions AT completion (so the result screen
  // can never lose it), so count across archived + current — the date window
  // scopes it to the gap between the two tests either way. Only
  // hrVerified === true counts; 0 hides the subline.
  const verifiedSinceLastTest = useMemo(() => {
    if (!previousMeasured) return 0
    const upper = lastTestAt ?? Date.now()
    return [...archivedSessions, ...sessions].filter(
      (s) => s.hrVerified === true && s.at > previousMeasured.at && s.at <= upper,
    ).length
  }, [sessions, archivedSessions, previousMeasured, lastTestAt])

  const applyCeiling = (newCeilingBpm: number) => {
    setPrescription((prev) => {
      if (!prev) return prev
      const delta = newCeilingBpm - prev.upperBpm
      const upperBpm = newCeilingBpm
      const lowerBpm = prev.lowerBpm + delta
      return {
        ...prev,
        upperBpm,
        lowerBpm,
        summary: `Train at ${lowerBpm}–${upperBpm} bpm. Aim for ${prev.sessionMinutes} minutes, ${prev.daysPerWeek} days a week. Don't let your heart rate go above ${upperBpm} bpm. Stop the session if your symptoms rise more than ${prev.stopRisePoints} points above how you felt before you started — a small rise of up to ${prev.stopRisePoints} points is okay.`,
      }
    })
  }

  // REGRESSION IS NEVER GATED: apply immediately with a notice (undo available)
  // rather than waiting for a tap-through. Checkpointed so the same flare data
  // can't ratchet the band down twice.
  useEffect(() => {
    if (!hydrated || !prescription || !decision) return
    // 'rest' (two flares in a row) eases the ceiling back too — apply it like a
    // regress; the ProgressDashboard shows the rest-day + clinician-check prompt.
    if ((decision.decision !== 'regress' && decision.decision !== 'rest') || decision.newCeilingBpm == null) return
    if (!decisionFresh) return
    setRegressUndo({ lowerBpm: prescription.lowerBpm, upperBpm: prescription.upperBpm })
    applyCeiling(decision.newCeilingBpm)
    setRestPrescribed(decision.decision === 'rest')
    setLastRegressAt(Date.now())
    setDecisionCheckpoint(sessions.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, decision, decisionFresh])

  // ── re-test gate ─────────────────────────────────────────────────────────────
  // The one-test-per-calendar-day rule is the DEFAULT and is not weakened: the
  // patient-initiated path (Home / Progress / result "Re-test") always calls
  // this with directed=false.
  //
  // CLINICIAN-DIRECTED OVERRIDE: after a red-flag clearance the treating
  // clinician may want a fresh threshold the same day — reviewing the patient is
  // exactly what the hold was waiting for. That path is explicit (a two-tap
  // confirmation the patient must make), eligibility-gated (only while the
  // clearance is more recent than the last test), and RECORDED — it is stamped
  // onto the test that follows so the clinician's report says the test was
  // clinician-directed. It never bypasses a LIVE red-flag lock; canRetest
  // checks that first.
  const [clinicianDirected, setClinicianDirected] = useState(false)
  const [confirmDirected, setConfirmDirected] = useState(false)
  const directedEligible =
    !redFlagLocked && redFlagClearedAt != null && (lastTestAt == null || redFlagClearedAt > lastTestAt)

  const tryRetest = (directed = false) => {
    const useDirected = directed && directedEligible
    const gate = canRetest(Date.now(), lastTestAt, {
      afterRegress: lastRegressAt != null && (lastTestAt == null || lastRegressAt > lastTestAt),
      clinicianDirected: useDirected,
      redFlagLocked,
    })
    if (!gate.allowed) {
      setClinicianDirected(false)
      setRetestNotice(gate.reason)
      // without a prescription 'home' renders nothing — stay on the result
      // screen and surface the notice there
      setStep(redFlagLocked ? 'locked' : prescription ? 'home' : 'result')
      return
    }
    setClinicianDirected(useDirected)
    setRetestNotice(null)
    setConfirmDirected(false)
    setStep('readiness')
  }

  /**
   * The explicit clinician-directed action. Rendered ONLY beside a re-test
   * refusal, and only when a clearance since the last test makes it legitimate.
   */
  const directedRetestPrompt = retestNotice && directedEligible && (
    <div className="rounded-[16px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-3.5 py-3">
      {!confirmDirected ? (
        <button
          type="button"
          onClick={() => setConfirmDirected(true)}
          className="text-[12.5px] font-semibold text-(--sst-accent-ink) underline decoration-(--sst-underline) underline-offset-2"
        >
          My clinician has asked me to re-test today
        </button>
      ) : (
        <>
          <p className="m-0 text-[12.5px] leading-snug text-(--sst-ink-2)">
            Confirm: since your warning sign, a clinician has reviewed you and asked for a fresh
            threshold test today. This is recorded on the test your clinician sees.
          </p>
          <div className="mt-2.5 flex gap-2">
            <SecondaryButton onClick={() => setConfirmDirected(false)} className="flex-1 p-2.5 text-[12.5px]">
              Not today
            </SecondaryButton>
            <PrimaryButton onClick={() => tryRetest(true)} className="flex-1 p-2.5 text-[12.5px]">
              Yes — re-test now
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  )

  // ── start over ───────────────────────────────────────────────────────────────
  const startOver = () => {
    connection?.stop()
    clearState()
    window.location.reload()
  }

  const sessionsThisWeek = useMemo(
    () => [...archivedSessions, ...sessions].filter((s) => Date.now() - s.at < WEEK_MS).length,
    [archivedSessions, sessions],
  )

  // ── daily check-in (rest-day comparator) ────────────────────────────────────
  // Clinic-code + minted patient code only: the server keys the check-in table
  // on the code, and a row it can't tie to a patient is noise. Never gates the
  // session — an unanswered day is a missing observation and stays missing.
  // DEMO00 shows the card WITHOUT a patient code so the instrument is
  // demonstrable live: the answer lands as a local receipt only (sync no-ops
  // with no patient code, and the server rejects demo writes regardless).
  const canDailyCheckin =
    welcome?.mode === 'clinic-code' &&
    !!welcome?.clinicCode &&
    !!prescription &&
    (!!welcome?.patientCode || welcome.clinicCode.trim().toUpperCase() === 'DEMO00')
  const dailyCheckinAnswered =
    dailyCheckinOn === localDateIso(new Date()) ? dailyCheckinScore : null

  const saveDailyCheckin = (score: number) => {
    const today = localDateIso(new Date())
    // `trained` is asserted from THIS device's own session log for the date —
    // deliberately not inferred server-side, where an unsynced session would
    // silently reclassify a training day as a rest day (the one
    // misclassification that corrupts the comparator).
    const trainedToday = [...archivedSessions, ...sessions].some(
      (s) => localDateIso(new Date(s.at)) === today,
    )
    syncDailyCheckin({
      clinicCode: welcome?.clinicCode,
      patientCode: welcome?.patientCode,
      onDate: today,
      symptomScore: score,
      trained: trainedToday,
      daysSinceInjury: welcome?.injuryDate ? daysSinceInjury(welcome.injuryDate, new Date()) : null,
    })
    setDailyCheckinOn(today)
    setDailyCheckinScore(score)
  }

  const stepIndex = Math.max(0, STEP_ORDER.indexOf((STEP_ORDER as readonly string[]).includes(step) ? (step as Step) : 'home'))

  const hasCompletedSession = sessions.length + archivedSessions.length > 0
  const checkinSession = checkinIdx !== null ? sessions[checkinIdx] : undefined

  const regressNotice = regressUndo && prescription && (
    <div className="rounded-[16px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) px-3.5 py-3">
      <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-warn-ink)">
        {restPrescribed
          ? 'Take a rest day today — check in with your clinician.'
          : `Your band was eased back to ${prescription.lowerBpm}–${prescription.upperBpm} bpm.`}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-(--sst-warn-ink-2)">
        {restPrescribed
          ? `Two sessions in a row provoked your symptoms, so we eased your band back to ${prescription.lowerBpm}–${prescription.upperBpm} bpm. Rest today and speak with your clinician before your next session — repeated flaring means the dose is too much, not that you should push through it.`
          : 'Recent sessions kept provoking symptoms, so the app lowered your ceiling for you. Train there for now — it rebuilds.'}
      </p>
      <button
        type="button"
        onClick={() => {
          applyCeiling(regressUndo.upperBpm)
          setRegressUndo(null)
        }}
        className="mt-2 rounded-[10px] px-2 py-1 text-[11.5px] font-bold text-(--sst-warn-ink) underline decoration-(--sst-warn) underline-offset-2"
      >
        Undo — keep my old band
      </button>
    </div>
  )

  return (
    <SstAppShell
      // HONESTY: the chip names the source that is actually FEEDING the app.
      // A failed pair (camera permission denied, strap dropped) leaves `device`
      // set to the tapped source with no connection — the chip then claimed
      // "Camera (resting)" / "Bluetooth HR" for the whole session while the
      // patient was in fact typing every reading. No live connection = manual.
      deviceName={
        connection === null && device.connect !== 'manual'
          ? DEFAULT_HR_SOURCE.statusLabel
          : device.statusLabel
      }
      connected={connection !== null}
      stepIndex={stepIndex}
      totalSteps={STEP_ORDER.length}
      caption={STEP_CAPTION[step]}
      showProgress={prescription === null && step !== 'locked' && step !== 'checkin'}
      bpm={feed.bpm}
      hrStatus={feed.status}
      onReconnect={() => setReconnectOpen(true)}
      forceLight={!!embeddedClinicCode}
    >
      {/* Register the service worker (app-shell cache → installed app opens
          offline to the last state; localStorage carries the data). */}
      <SstPwaRegister />

      {/* Reconnect wizard — opened from the header HR pill on any monitored
          screen. On connect, swaps in the live BLE source; 'Type it in' keeps
          the manual source. */}
      <SstConnectWizard
        open={reconnectOpen}
        onClose={() => setReconnectOpen(false)}
        onConnected={(conn) => {
          handlePair(hrSourceById('bluetooth-hr') ?? HR_SOURCES[0], conn)
          setReconnectOpen(false)
        }}
        onManual={() => {
          const manual = HR_SOURCES.find((s) => s.connect === 'manual')
          if (manual) handlePair(manual, null)
          setReconnectOpen(false)
        }}
      />

      {/* start-over confirm — clearing a prescription is never one accidental tap */}
      {confirmStartOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16243f]/45 px-6">
          <div className="w-full max-w-[340px] rounded-[20px] bg-(--sst-card) p-5 shadow-[0_24px_48px_-16px_rgba(20,36,63,0.5)]">
            <p className="m-0 text-[15px] font-extrabold text-(--sst-navy)">Start over?</p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-(--sst-muted)">
              This clears your band, sessions and test history from this phone. Anything already
              sent to your clinician stays with them.
            </p>
            <div className="mt-3.5 flex gap-2">
              <SecondaryButton onClick={() => setConfirmStartOver(false)} className="flex-1 p-3">
                Keep my data
              </SecondaryButton>
              <button
                type="button"
                onClick={startOver}
                className="flex-1 rounded-2xl bg-(--sst-danger) p-3 text-sm font-bold text-(--sst-on-accent) transition active:scale-[0.98]"
              >
                Clear everything
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'welcome' && hydrated && (
        <SstOnboarding
          key={urlClinicCode ?? embeddedClinicCode ?? 'no-clinic-param'}
          device={device}
          allowSelfGuided={!publicSurface && !embeddedClinicCode}
          initialClinicCode={urlClinicCode ?? embeddedClinicCode ?? undefined}
          onPair={handlePair}
          onStart={(r: OnboardingResult) => {
            setWelcome(r.welcome)
            setClinicName(r.clinicName)
            setGoal(r.goal)
            setGoalLabel(r.goalLabel)
            // Intake → server (2026-08-11: onboarding captured these and the
            // page dropped them). Best-effort: covariates also reachable via
            // the clinician's patients screen, so a lost PATCH degrades, it
            // doesn't corrupt. The injury DATE stays on device — only the
            // derived day count is sent.
            if (r.welcome.clinicCode && r.welcome.patientCode) {
              void fetch('/api/sst/patient', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clinicCode: r.welcome.clinicCode,
                  patientCode: r.welcome.patientCode,
                  ageBand: r.welcome.ageBand ?? null,
                  sex: r.welcome.sex ?? null,
                  researchConsent: r.welcome.researchConsent === true,
                  daysSinceInjury: r.welcome.injuryDate
                    ? daysSinceInjury(r.welcome.injuryDate, new Date())
                    : null,
                }),
              }).catch(() => {})
            }
            setStep('symptoms')
          }}
        />
      )}

      {step === 'symptoms' && (
        <SymptomSelect
          initialSelected={selectedSymptomIds}
          onBack={() => setStep('welcome')}
          onContinue={(ids) => {
            setSelectedSymptomIds(ids)
            setStep('readiness')
          }}
        />
      )}

      {step === 'readiness' && (
        <div className="flex flex-col gap-3">
          {retestNotice && (
            <p className="m-0 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 text-[11.5px] leading-snug text-(--sst-muted)">
              {retestNotice}
            </p>
          )}
          {directedRetestPrompt}
          <Readiness
            initialRestingScore={restingSymptomScore}
            onBack={() => setStep(prescription ? 'home' : 'symptoms')}
            onContinue={(res: ReadinessResult) => {
              setRestingSymptomScore(res.restingSymptomScore)
              // The repeat path (welcome→symptoms→readiness) bypassed the
              // re-test spacing gate tryRetest enforces — same rules here,
              // including the clinician-directed override the patient has
              // already explicitly confirmed to get this far.
              const gate = canRetest(Date.now(), lastTestAt, {
                afterRegress: lastRegressAt != null && (lastTestAt == null || lastRegressAt > lastTestAt),
                clinicianDirected: clinicianDirected && directedEligible,
                redFlagLocked,
              })
              if (!gate.allowed) {
                setRetestNotice(gate.reason)
                if (redFlagLocked) setStep('locked')
                else if (prescription) setStep('home')
                // else stay here — the notice above explains why the test won't start
                return
              }
              setRetestNotice(null)
              setStep('test')
            }}
          />
        </div>
      )}

      {step === 'test' && (
        <GuidedTest
          condition={condition}
          restingSymptomScore={restingSymptomScore}
          selectedSymptomIds={selectedSymptomIds}
          liveHr={sessionFeed.bpm}
          hrSourceLabel={connection?.label ?? device.name}
          hrStatus={sessionFeed.status}
          onComplete={(result: ThresholdResult, input: TestInput) => {
            const now = Date.now()
            // Whether THIS test ran on the clinician-directed override. Read
            // before the state is cleared below, and recorded both locally and
            // in the synced payload — the override is never silent.
            const wasDirected = clinicianDirected
            setThresholdResult(result)
            setLastTestAt(now)
            setClinicianDirected(false)
            setThresholdHistory((prev) => [
              ...prev,
              {
                at: now,
                interpretation: result.interpretation,
                hrt: result.hrt,
                thresholdStage: result.thresholdStage,
                modality: input.modality ?? null,
                restingSymptomScore: input.restingSymptomScore,
                // Distinct minutes of the graded ramp actually recorded. The
                // exhaustion arm returns the clearance-grade 'no-intolerance'
                // from a ramp of ANY length, so the dose travels with the
                // finding (mirrored server-side in reports/load.ts).
                stagesRecorded: new Set(
                  input.stages.map((st) => st.minute).filter((m) => Number.isFinite(m)),
                ).size,
                ...(wasDirected ? { clinicianDirected: true } : {}),
              },
            ])
            // Every completed test syncs — physiologic, no-intolerance AND red-flag.
            const suggested = result.hrt !== null ? computePrescription(result.hrt, condition) : null
            const ver = sessionVerification(
              input.stages.map((s) => ({ verified: s.hrVerified === true })),
              device.connect,
            )
            const eventType: SyncEventType =
              result.interpretation === 'physiologic'
                ? 'threshold-physiologic'
                : result.interpretation === 'no-intolerance'
                  ? 'threshold-no-intolerance'
                  : result.interpretation === 'red-flag'
                    ? 'threshold-red-flag'
                    : 'test-aborted' // 'invalid' = not enough data to be a test
            syncEvent({
              sessionType: 'threshold',
              eventType,
              hrtBpm: result.hrt,
              bandLow: suggested?.lowerBpm ?? null,
              bandHigh: suggested?.upperBpm ?? null,
              payload: {
                interpretation: result.interpretation,
                thresholdStage: result.thresholdStage,
                restingSymptomScore: input.restingSymptomScore,
                symptoms: selectedSymptomIds,
                modality: input.modality ?? null,
                stages: input.stages,
                termination: input.termination,
                hrVerified: ver.hrVerified,
                verifiedReadingPct: ver.verifiedReadingPct,
                // Prognostic flag (Haider 2019) — carried to the clinician so
                // the hub/GP report can surface the low-threshold caution + note.
                prolongedRecoveryRisk: suggested?.prolongedRecoveryRisk ?? false,
                clinicianNote: suggested?.clinicianNote ?? null,
                // Same-day re-test under the clinician-directed override —
                // stamped so the clinician's report says the spacing rule was
                // lifted on their instruction, not bypassed by the patient.
                clinicianDirected: wasDirected,
              },
            })
            if (result.interpretation === 'red-flag') {
              setRedFlagLocked(true)
              setLastRedFlagAt(now)
            }
            // A physiologic band persists IMMEDIATELY — a result screen closed
            // before "Continue" must not lose the measured band (the Continue
            // tap below is pure navigation). Adopting a new band from a re-test
            // resets progression evidence: old sessions archive
            // (display/history only); the clean-run count starts fresh.
            if (result.interpretation === 'physiologic' && suggested) {
              if (prescription) {
                setArchivedSessions((prev) => [...prev, ...sessions])
                setSessions([])
                setVerifiedSessions(0)
                setProgressionCheckpoint(0)
                setDecisionCheckpoint(0)
                setRegressUndo(null)
              }
              setPrescription({ ...suggested, createdAt: now })
            }
            setStep('result')
          }}
          onAbort={(info) => {
            // an abandoned test consumes the clinician's direction — a second
            // same-day attempt needs a fresh explicit confirmation
            setClinicianDirected(false)
            if (info.started) {
              // an aborted test is a clinical event too — never a silent discard
              syncEvent({
                sessionType: 'threshold',
                eventType: 'test-aborted',
                payload: {
                  stages: info.stages,
                  restingSymptomScore,
                  symptoms: selectedSymptomIds,
                  // belt to the server's event-row guard: an abort must never
                  // re-derive as a completed test (final sweep #1)
                  termination: 'aborted',
                  interpretation: 'invalid',
                },
              })
            }
            setStep(prescription ? 'home' : 'readiness')
          }}
        />
      )}

      {step === 'result' && thresholdResult && (
        <div className="flex flex-col gap-3">
          {retestNotice && (
            <p className="m-0 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 text-[11.5px] leading-snug text-(--sst-muted)">
              {retestNotice}
            </p>
          )}
          {directedRetestPrompt}
          <ResultPrescription
          result={thresholdResult}
          condition={condition}
          hasPrescription={prescription !== null}
          // the band was adopted + persisted at test completion — pure navigation
          onContinue={() => setStep('home')}
          onRetest={() => tryRetest()}
          onExit={() => setStep(redFlagLocked ? 'locked' : prescription ? 'home' : 'welcome')}
          onKeepBand={() => setStep('home')}
          previousHrt={previousMeasured?.hrt ?? null}
          verifiedSessionsSince={verifiedSinceLastTest}
          />
        </div>
      )}

      {step === 'home' && prescription && welcome && (
        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
          {hasCompletedSession && <SstInstallPrompt />}
          {regressNotice}
          {directedRetestPrompt}
          {canDailyCheckin && (
            <DailyCheckin answeredScore={dailyCheckinAnswered} onSave={saveDailyCheckin} />
          )}
          <HomeHub
            rx={prescription}
            condition={condition}
            mode={welcome.mode}
            clinicCode={welcome.clinicCode}
            clinicName={clinicName}
            patientName={welcome.patientName}
            welcomeBack={welcomeBack}
            goalLabel={goalLabel ?? undefined}
            deviceName={device.statusLabel}
            history={thresholdHistory}
            sessionsThisWeek={sessionsThisWeek}
            onStartSession={() => {
              setWelcomeBack(false)
              setStep('training')
            }}
            onProgress={() => setStep('progress')}
            onRetest={() => tryRetest()}
            retestBlockedReason={retestNotice}
            onStartOver={() => setConfirmStartOver(true)}
          />
        </div>
      )}

      {step === 'training' && prescription && (
        <TrainingSession
          rx={prescription}
          initialPreSymptom={restingSymptomScore}
          liveHr={sessionFeed.bpm}
          hrSourceLabel={connection?.label ?? device.name}
          hrStatus={sessionFeed.status}
          hrConnect={device.connect}
          onComplete={(log) => {
            const persisted: PersistedSession = { ...log, at: Date.now() }
            setSessions((prev) => [...prev, persisted])
            if (log.hrVerified) setVerifiedSessions((n) => n + 1) // verified-only counts toward progression
            // A check-in answered THIS MORNING said trained=false — it was
            // true when given. Re-send today's row with trained=true (same
            // score; the server upserts on clinic+patient+date) so this day
            // never reads as a rest day in the comparator.
            {
              const today = localDateIso(new Date())
              if (dailyCheckinOn === today && dailyCheckinScore != null) {
                syncDailyCheckin({
                  clinicCode: welcome?.clinicCode,
                  patientCode: welcome?.patientCode,
                  onDate: today,
                  symptomScore: dailyCheckinScore,
                  trained: true,
                  daysSinceInjury: welcome?.injuryDate
                    ? daysSinceInjury(welcome.injuryDate, new Date())
                    : null,
                })
              }
            }
            // Rehab session → clinician (HR, minutes, symptom Δ, zone time).
            syncEvent({
              sessionType: 'training',
              eventType: log.symptomLimited ? 'session-symptom-stopped' : 'session-completed',
              hrtBpm: prescription.hrt,
              bandLow: prescription.lowerBpm,
              bandHigh: prescription.upperBpm,
              payload: { ...log },
            })
            setStep('progress')
          }}
          onCancel={(info) => {
            // a cancelled session is an abandoned-session record, not a silent
            // discard — unless the page-hide handler already synced one for
            // this attempt (info.alreadyRecorded), in which case this tap is
            // just the patient closing the screen they came back to.
            if (!info.alreadyRecorded) {
              syncEvent({
                sessionType: 'training',
                eventType: 'session-abandoned',
                hrtBpm: prescription.hrt,
                bandLow: prescription.lowerBpm,
                bandHigh: prescription.upperBpm,
                payload: { ...info },
              })
            }
            setStep('home')
          }}
          onInterrupted={(info) => {
            // The tab/app was killed mid-session (phone call, swipe-away, OS
            // reclaim). Same record shape as Cancel — a session that vanishes
            // must still reach the clinician. If the patient comes back and
            // saves, the completed log carries the same sessionUid and the
            // clinic read side keeps only that one.
            syncEvent({
              sessionType: 'training',
              eventType: 'session-abandoned',
              hrtBpm: prescription.hrt,
              bandLow: prescription.lowerBpm,
              bandHigh: prescription.upperBpm,
              payload: { ...info },
            })
          }}
        />
      )}

      {step === 'progress' && prescription && decision && (
        <ProgressDashboard
          rx={prescription}
          sessions={sessions}
          decision={decision}
          history={thresholdHistory}
          retest={{
            nextRetestAt: lastTestAt != null ? lastTestAt + RETEST_MIN_HOURS * 3_600_000 : null,
            redFlagLocked,
          }}
          notice={regressNotice}
          onHome={() => setStep('home')}
          onNewSession={() => setStep('training')}
          onRetest={() => tryRetest()}
          canApply={decisionFresh && verifiedSessions > progressionCheckpoint}
          onApplyCeiling={(newCeilingBpm) => {
            applyCeiling(newCeilingBpm)
            setProgressionCheckpoint(verifiedSessions)
            setDecisionCheckpoint(sessions.length)
            setRegressUndo(null)
            setStep('home')
          }}
        />
      )}

      {/* ── next-day check-in: one question, one tap ─────────────────────────── */}
      {step === 'checkin' && checkinSession && (
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1 lg:min-h-full lg:items-center lg:justify-center lg:pt-0">
          <div className="flex w-full flex-col gap-4 lg:max-w-[520px] lg:rounded-[24px] lg:border lg:border-(--sst-line-strong) lg:bg-(--sst-card) lg:p-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
              Quick check-in
            </h1>
            <p className="m-0 text-[13.5px] leading-snug text-(--sst-muted)">
              How did you pull up after {sessionDayLabel(checkinSession.at)} session?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {(
              [
                ['better', 'Better'],
                ['same', 'Same'],
                ['worse', 'Worse'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSessions((prev) =>
                    prev.map((s, i) =>
                      i === checkinIdx ? { ...s, nextDayCheckin: id, nextDayFlare: id === 'worse' } : s,
                    ),
                  )
                  setCheckinIdx(null)
                  setStep('home')
                }}
                className="rounded-[16px] border-[1.5px] border-(--sst-line) bg-(--sst-card) px-4 py-4 text-left text-[16px] font-bold text-(--sst-navy) transition active:scale-[0.99] lg:bg-(--sst-surface-2) hover:lg:border-(--sst-accent)"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              // persist the skip for the rest of today — reopening the app must
              // not re-ambush; the check-in comes back tomorrow.
              setCheckinSkippedOn(todayKey())
              setCheckinIdx(null)
              setStep('home')
            }}
            className="self-center rounded-[10px] px-2 py-1 text-[12px] font-semibold text-(--sst-ghost)"
          >
            Skip for now
          </button>
          </div>
        </section>
      )}

      {/* ── red-flag lock: test + training paused until clinical clearance ───── */}
      {step === 'locked' && (
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1">
          <div className="rounded-[18px] border-2 border-(--sst-danger) bg-(--sst-danger-soft) px-4 py-4">
            <p className="m-0 text-[17px] font-extrabold leading-snug text-(--sst-danger-ink)">
              Seek medical review
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-(--sst-danger-ink-2)">
              You stopped for a warning sign
              {lastRedFlagAt
                ? ` on ${new Date(lastRedFlagAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}`
                : ''}
              . Testing and training are paused until a clinician has reviewed you. Contact your
              treating clinician, or emergency care if it&rsquo;s severe.
            </p>
          </div>
          {retestNotice && (
            <p className="m-0 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 text-[11.5px] leading-snug text-(--sst-muted)">
              {retestNotice}
            </p>
          )}
          {!confirmCleared ? (
            <SecondaryButton onClick={() => setConfirmCleared(true)} className="rounded-[16px] p-3.5">
              My clinician has cleared me
            </SecondaryButton>
          ) : (
            <div className="rounded-[16px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-3.5 py-3">
              <p className="m-0 text-[12.5px] leading-snug text-(--sst-ink-2)">
                Confirm: a clinician has reviewed you and said you can resume. This is recorded for
                your clinician to see.
              </p>
              <div className="mt-2.5 flex gap-2">
                <SecondaryButton onClick={() => setConfirmCleared(false)} className="flex-1 p-2.5 text-[12.5px]">
                  Not yet
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => {
                    const now = Date.now()
                    setRedFlagLocked(false)
                    setRedFlagClearedAt(now)
                    setConfirmCleared(false)
                    setRetestNotice(null)
                    // the acknowledgement is logged locally AND to the clinic
                    syncEvent({
                      sessionType: 'threshold',
                      eventType: 'red-flag-cleared',
                      payload: { acknowledgedAt: now, redFlagAt: lastRedFlagAt },
                    })
                    setStep(prescription ? 'home' : 'welcome')
                  }}
                  className="flex-1 p-2.5 text-[12.5px]"
                >
                  Yes — resume
                </PrimaryButton>
              </div>
            </div>
          )}
        </section>
      )}
    </SstAppShell>
  )
}
