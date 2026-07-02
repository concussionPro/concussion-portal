'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  canRetest,
  computePrescription,
  progressionDecision,
  sessionVerification,
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
import { DEFAULT_HR_SOURCE, useLiveHr, type HrSource } from '@/components/sst-trainer/hr-source'
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
  syncSessionToClinic,
  type SyncEventType,
} from '@/lib/sst-trainer/clinic-sync'
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
const CHECKIN_AFTER_MS = 12 * 3_600_000

/** "Tuesday's session" / "yesterday's session" for the next-day check-in. */
function sessionDayLabel(at: number): string {
  const d = new Date(at)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOf(today) - startOf(d)) / 86_400_000)
  if (dayDiff <= 1) return 'yesterday'
  return `${d.toLocaleDateString('en-AU', { weekday: 'long' })}’s`
}

export default function PlatformAppPage() {
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

  // transient UI
  const [retestNotice, setRetestNotice] = useState<string | null>(null)
  const [regressUndo, setRegressUndo] = useState<{ lowerBpm: number; upperBpm: number } | null>(null)
  const [confirmStartOver, setConfirmStartOver] = useState(false)
  const [confirmCleared, setConfirmCleared] = useState(false)
  const [checkinIdx, setCheckinIdx] = useState<number | null>(null)

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

      if (s.redFlagLocked) {
        setStep('locked')
      } else if (s.prescription) {
        // Next-day check-in: on an open >=12h after a session with no answer yet.
        const idx = s.sessions.findIndex(
          (sess) => !sess.nextDayCheckin && Date.now() - sess.at >= CHECKIN_AFTER_MS,
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
    })
  }, [
    hydrated, welcome, clinicName, goal, goalLabel, selectedSymptomIds, restingSymptomScore,
    prescription, thresholdHistory, sessions, archivedSessions, verifiedSessions,
    progressionCheckpoint, decisionCheckpoint, lastRedFlagAt, redFlagLocked, redFlagClearedAt,
    lastTestAt, lastRegressAt,
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
      },
    })
  }

  // ── progression (page-owned so regress can auto-apply) ─────────────────────
  const decision = useMemo(
    () => (prescription ? progressionDecision(prescription, sessions) : null),
    [prescription, sessions],
  )
  const decisionFresh = sessions.length > decisionCheckpoint

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
        summary: `Train at ${lowerBpm}–${upperBpm} bpm. Aim for ${prev.sessionMinutes} minutes, ${prev.daysPerWeek} days a week. Keep your heart rate under ${upperBpm} bpm. Stop the session if your symptoms rise ${prev.stopRisePoints} or more points above how you felt before you started.`,
      }
    })
  }

  // REGRESSION IS NEVER GATED: apply immediately with a notice (undo available)
  // rather than waiting for a tap-through. Checkpointed so the same flare data
  // can't ratchet the band down twice.
  useEffect(() => {
    if (!hydrated || !prescription || !decision) return
    if (decision.decision !== 'regress' || decision.newCeilingBpm == null) return
    if (!decisionFresh) return
    setRegressUndo({ lowerBpm: prescription.lowerBpm, upperBpm: prescription.upperBpm })
    applyCeiling(decision.newCeilingBpm)
    setLastRegressAt(Date.now())
    setDecisionCheckpoint(sessions.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, decision, decisionFresh])

  // ── re-test gate ─────────────────────────────────────────────────────────────
  const tryRetest = () => {
    const gate = canRetest(Date.now(), lastTestAt, {
      afterRegress: lastRegressAt != null && (lastTestAt == null || lastRegressAt > lastTestAt),
      redFlagLocked,
    })
    if (!gate.allowed) {
      setRetestNotice(gate.reason)
      setStep(redFlagLocked ? 'locked' : 'home')
      return
    }
    setRetestNotice(null)
    setStep('readiness')
  }

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

  const stepIndex = Math.max(0, STEP_ORDER.indexOf((STEP_ORDER as readonly string[]).includes(step) ? (step as Step) : 'home'))

  const hasCompletedSession = sessions.length + archivedSessions.length > 0
  const checkinSession = checkinIdx !== null ? sessions[checkinIdx] : undefined

  const regressNotice = regressUndo && prescription && (
    <div className="rounded-[16px] border-[1.5px] border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-3">
      <p className="m-0 text-[12.5px] font-bold leading-snug text-[#a06a1c]">
        Your band was eased back to {prescription.lowerBpm}–{prescription.upperBpm} bpm.
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-[#8a6320]">
        Recent sessions kept provoking symptoms, so the app lowered your ceiling for you. Train
        there for now — it rebuilds.
      </p>
      <button
        type="button"
        onClick={() => {
          applyCeiling(regressUndo.upperBpm)
          setRegressUndo(null)
        }}
        className="mt-2 rounded-[10px] px-2 py-1 text-[11.5px] font-bold text-[#a06a1c] underline decoration-[#d79a3a] underline-offset-2"
      >
        Undo — keep my old band
      </button>
    </div>
  )

  return (
    <SstAppShell
      deviceName={device.name}
      connected={connection !== null}
      stepIndex={stepIndex}
      totalSteps={STEP_ORDER.length}
      caption={STEP_CAPTION[step]}
      bpm={feed.bpm}
      hrStatus={feed.status}
    >
      {/* Register the service worker (app-shell cache → installed app opens
          offline to the last state; localStorage carries the data). */}
      <SstPwaRegister />

      {/* start-over confirm — clearing a prescription is never one accidental tap */}
      {confirmStartOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16243f]/45 px-6">
          <div className="w-full max-w-[340px] rounded-[20px] bg-white p-5 shadow-[0_24px_48px_-16px_rgba(20,36,63,0.5)]">
            <p className="m-0 text-[15px] font-extrabold text-[#16243f]">Start over?</p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-[#5d7174]">
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
                className="flex-1 rounded-2xl bg-[#d2463a] p-3 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Clear everything
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'welcome' && hydrated && (
        <SstOnboarding
          key={urlClinicCode ?? 'no-clinic-param'}
          device={device}
          initialClinicCode={urlClinicCode}
          onPair={handlePair}
          onStart={(r: OnboardingResult) => {
            setWelcome(r.welcome)
            setClinicName(r.clinicName)
            setGoal(r.goal)
            setGoalLabel(r.goalLabel)
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
        <Readiness
          initialRestingScore={restingSymptomScore}
          onBack={() => setStep(prescription ? 'home' : 'symptoms')}
          onContinue={(res: ReadinessResult) => {
            setRestingSymptomScore(res.restingSymptomScore)
            setStep('test')
          }}
        />
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
            setThresholdResult(result)
            setLastTestAt(now)
            setThresholdHistory((prev) => [
              ...prev,
              {
                at: now,
                interpretation: result.interpretation,
                hrt: result.hrt,
                thresholdStage: result.thresholdStage,
                modality: input.modality ?? null,
                restingSymptomScore: input.restingSymptomScore,
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
              },
            })
            if (result.interpretation === 'red-flag') {
              setRedFlagLocked(true)
              setLastRedFlagAt(now)
            }
            setStep('result')
          }}
          onAbort={(info) => {
            if (info.started) {
              // an aborted test is a clinical event too — never a silent discard
              syncEvent({
                sessionType: 'threshold',
                eventType: 'test-aborted',
                payload: {
                  stages: info.stages,
                  restingSymptomScore,
                  symptoms: selectedSymptomIds,
                },
              })
            }
            setStep(prescription ? 'home' : 'readiness')
          }}
        />
      )}

      {step === 'result' && thresholdResult && (
        <ResultPrescription
          result={thresholdResult}
          condition={condition}
          hasPrescription={prescription !== null}
          onContinue={(rx) => {
            // Adopting a NEW band from a re-test resets progression evidence:
            // old sessions archive (display/history only); the clean-run count
            // starts fresh inside the new band.
            if (prescription) {
              setArchivedSessions((prev) => [...prev, ...sessions])
              setSessions([])
              setVerifiedSessions(0)
              setProgressionCheckpoint(0)
              setDecisionCheckpoint(0)
              setRegressUndo(null)
            }
            setPrescription({ ...rx, createdAt: Date.now() })
            setStep('home')
          }}
          onRetest={tryRetest}
          onExit={() => setStep(redFlagLocked ? 'locked' : prescription ? 'home' : 'welcome')}
          onKeepBand={() => setStep('home')}
        />
      )}

      {step === 'home' && prescription && welcome && (
        <div className="flex flex-col gap-3">
          {hasCompletedSession && <SstInstallPrompt />}
          {regressNotice}
          <HomeHub
            rx={prescription}
            condition={condition}
            mode={welcome.mode}
            clinicCode={welcome.clinicCode}
            clinicName={clinicName}
            patientName={welcome.patientName}
            welcomeBack={welcomeBack}
            goalLabel={goalLabel ?? undefined}
            deviceName={device.name}
            sessionsThisWeek={sessionsThisWeek}
            onStartSession={() => {
              setWelcomeBack(false)
              setStep('training')
            }}
            onProgress={() => setStep('progress')}
            onRetest={tryRetest}
            retestBlockedReason={retestNotice}
            onStartOver={() => setConfirmStartOver(true)}
          />
        </div>
      )}

      {step === 'training' && prescription && (
        <TrainingSession
          rx={prescription}
          liveHr={sessionFeed.bpm}
          hrSourceLabel={connection?.label ?? device.name}
          hrStatus={sessionFeed.status}
          hrConnect={device.connect}
          onComplete={(log) => {
            const persisted: PersistedSession = { ...log, at: Date.now() }
            setSessions((prev) => [...prev, persisted])
            if (log.hrVerified) setVerifiedSessions((n) => n + 1) // verified-only counts toward progression
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
            // a cancelled session is an abandoned-session record, not a silent discard
            syncEvent({
              sessionType: 'training',
              eventType: 'session-abandoned',
              hrtBpm: prescription.hrt,
              bandLow: prescription.lowerBpm,
              bandHigh: prescription.upperBpm,
              payload: { ...info },
            })
            setStep('home')
          }}
        />
      )}

      {step === 'progress' && prescription && decision && (
        <ProgressDashboard
          rx={prescription}
          sessions={sessions}
          decision={decision}
          notice={regressNotice}
          onHome={() => setStep('home')}
          onNewSession={() => setStep('training')}
          onRetest={tryRetest}
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
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#16282b]">
              Quick check-in
            </h1>
            <p className="m-0 text-[13.5px] leading-snug text-[#5d7174]">
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
                className="rounded-[16px] border-[1.5px] border-[#d4e0e1] bg-white px-4 py-4 text-left text-[16px] font-bold text-[#16243f] transition active:scale-[0.99]"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckinIdx(null)
              setStep('home')
            }}
            className="self-center rounded-[10px] px-2 py-1 text-[12px] font-semibold text-[#9bafb0]"
          >
            Skip for now
          </button>
        </section>
      )}

      {/* ── red-flag lock: test + training paused until clinical clearance ───── */}
      {step === 'locked' && (
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1">
          <div className="rounded-[18px] border-2 border-[#d2463a] bg-[#fbeae8] px-4 py-4">
            <p className="m-0 text-[17px] font-extrabold leading-snug text-[#b1392e]">
              Seek medical review
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#8a4036]">
              You stopped for a warning sign
              {lastRedFlagAt
                ? ` on ${new Date(lastRedFlagAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}`
                : ''}
              . Testing and training are paused until a clinician has reviewed you. Contact your
              treating clinician, or emergency care if it&rsquo;s severe.
            </p>
          </div>
          {retestNotice && (
            <p className="m-0 rounded-[12px] bg-[#eef4f4] px-3.5 py-2.5 text-[11.5px] leading-snug text-[#5d7174]">
              {retestNotice}
            </p>
          )}
          {!confirmCleared ? (
            <SecondaryButton onClick={() => setConfirmCleared(true)} className="rounded-[16px] p-3.5">
              My clinician has cleared me
            </SecondaryButton>
          ) : (
            <div className="rounded-[16px] border-[1.5px] border-[#cdd9da] bg-white px-3.5 py-3">
              <p className="m-0 text-[12.5px] leading-snug text-[#3b4f52]">
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
