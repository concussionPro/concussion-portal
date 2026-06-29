'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  Condition,
  Prescription,
  SessionLog,
  TestInput,
  ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { STEP_ORDER, type Step } from '@/components/sst-trainer/shell'
import type { WelcomeSelection } from '@/components/sst-trainer/WelcomeMode'
import { DEFAULT_HR_SOURCE, useLiveHr, type HrSource } from '@/components/sst-trainer/hr-source'
import type { LiveHrConnection } from '@/lib/sst-trainer/hr-live'
import SymptomSelect from '@/components/sst-trainer/SymptomSelect'
import Readiness, { type ReadinessResult } from '@/components/sst-trainer/Readiness'
import GuidedTest from '@/components/sst-trainer/GuidedTest'
import ResultPrescription from '@/components/sst-trainer/ResultPrescription'
import HomeHub from '@/components/sst-trainer/HomeHub'
import TrainingSession from '@/components/sst-trainer/TrainingSession'
import ProgressDashboard from '@/components/sst-trainer/ProgressDashboard'
import { syncSessionToClinic, pushLiveTick } from '@/lib/sst-trainer/clinic-sync'
import { SstAppShell } from '@/components/platform/SstAppShell'
import SstOnboarding, { type OnboardingResult } from '@/components/platform/SstOnboarding'
import SstPwaRegister from '@/components/platform/SstPwaRegister'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/app — the REAL, installable SST Trainer app (not a product tour).
//
// Rendered full-screen in SstAppShell: a slim app header (wordmark + glanceable
// live-HR pill + step progress) over the working flow — no device bezel, no
// chapter/pagination "tour" dots. It's an app you USE. Installable as a PWA
// (public/sst.webmanifest + public/sw.js, registered via <SstPwaRegister/>),
// and reachable via the single share link /demo/sst.
//
// The flow's 8 steps run the SAME state machine and real engine as /sst-trainer
// (detectThreshold → computePrescription → progressionDecision).
//
// HR sourcing — three first-class paths chosen in onboarding:
//   • any Bluetooth heart-rate wearable (Web Bluetooth HR profile: Polar / Wahoo
//     / WHOOP / Garmin-broadcast / any BLE strap),
//   • the phone camera (PPG), or
//   • manual entry for the clinician when no wearable is available.
// The first two open a REAL connection (see lib/sst-trainer/hr-live.ts) whose
// live bpm flows through useLiveHr into the threshold test + training screens.
// Manual feeds the same engine by hand. No bpm is ever fabricated.
// Gated + noindex by app/platform/layout.tsx; do not re-gate here.
// ─────────────────────────────────────────────────────────────────────────────

const STEP_CAPTION: Record<Step, string> = {
  welcome: 'Welcome',
  symptoms: 'Symptom profile',
  readiness: 'Safety check',
  test: 'Threshold test',
  result: 'Your prescription',
  home: 'Home',
  training: 'Live session',
  progress: 'Progress',
}

export default function PlatformAppPage() {
  const [step, setStep] = useState<Step>('welcome')

  // onboarding selections (the new design) → flow into the existing machine
  const [device, setDevice] = useState<HrSource>(DEFAULT_HR_SOURCE)
  // the REAL paired heart-rate connection (null = manual entry).
  const [connection, setConnection] = useState<LiveHrConnection | null>(null)
  const [welcome, setWelcome] = useState<WelcomeSelection | null>(null)
  const [goalLabel, setGoalLabel] = useState<string | null>(null)

  // collected across the engine-backed flow (mirrors /sst-trainer)
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([])
  const [restingSymptomScore, setRestingSymptomScore] = useState(0)
  const [, setTestInput] = useState<TestInput | null>(null)
  const [thresholdResult, setThresholdResult] = useState<ThresholdResult | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [sessions, setSessions] = useState<SessionLog[]>([])
  // Completion timestamps — the weekly adherence ring counts only the last 7
  // days, not lifetime sessions.
  const [sessionTimes, setSessionTimes] = useState<number[]>([])
  const [progressionCheckpoint, setProgressionCheckpoint] = useState(0)

  const condition: Condition = welcome?.condition ?? 'concussion'

  // Per-clinic QR deep link (/sst-trainer?clinic=CODE) → pre-fill the clinic code
  // in onboarding. Read client-side (no Suspense bailout).
  const [urlClinicCode, setUrlClinicCode] = useState<string | undefined>(undefined)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('clinic')?.trim()
    if (code) setUrlClinicCode(code.toUpperCase())
  }, [])

  // Live HR feed from the REAL paired connection (same value drives the
  // threshold-test ramp and the training gauge). Null connection → 'manual'.
  const feed = useLiveHr(connection)

  // Release the hardware when the app unmounts (GATT disconnect / camera stop).
  useEffect(() => {
    return () => {
      connection?.stop()
    }
  }, [connection])

  // LIVE in-session monitoring: while training with a clinic code, push the
  // current HR/band every 3s so the clinician dashboard can watch in real time.
  // A ref carries the latest values so the interval stays stable (no resets).
  const liveRef = useRef({ bpm: feed.bpm, code: welcome?.clinicCode, name: welcome?.patientName, low: prescription?.lowerBpm, high: prescription?.upperBpm })
  liveRef.current = { bpm: feed.bpm, code: welcome?.clinicCode, name: welcome?.patientName, low: prescription?.lowerBpm, high: prescription?.upperBpm }
  useEffect(() => {
    if (step !== 'training' || !welcome?.clinicCode) return
    const start = Date.now()
    const tick = () => {
      const d = liveRef.current
      pushLiveTick({
        clinicCode: d.code, patientLabel: d.name, bpm: d.bpm,
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

  const stepIndex = STEP_ORDER.indexOf(step)

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
      {/* Register the no-op service worker so the app is installable to a home
          screen (PWA). Renders nothing. */}
      <SstPwaRegister />
      {step === 'welcome' && (
        <SstOnboarding
          device={device}
          initialClinicCode={urlClinicCode}
          onPair={handlePair}
          onStart={(r: OnboardingResult) => {
            setWelcome(r.welcome)
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
          onBack={() => setStep('symptoms')}
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
          liveHr={feed.bpm}
          hrSourceLabel={device.name}
          hrStatus={feed.status}
          onComplete={(result, input) => {
            setThresholdResult(result)
            setTestInput(input)
            setStep('result')
          }}
          onAbort={() => setStep(prescription ? 'home' : 'readiness')}
        />
      )}

      {step === 'result' && thresholdResult && (
        <ResultPrescription
          result={thresholdResult}
          condition={condition}
          hasPrescription={prescription !== null}
          onContinue={(rx) => {
            setPrescription(rx)
            // Assessment / re-test → clinician. interpretation is the recovery
            // marker: 'physiologic' = in rehab, 'no-intolerance' = clearance signal.
            syncSessionToClinic({
              clinicCode: welcome?.clinicCode,
              patientLabel: welcome?.patientName,
              sessionType: 'threshold',
              hrtBpm: rx.hrt,
              bandLow: rx.lowerBpm,
              bandHigh: rx.upperBpm,
              condition,
              payload: {
                interpretation: thresholdResult?.interpretation,
                thresholdStage: thresholdResult?.thresholdStage,
                restingSymptomScore,
                symptoms: selectedSymptomIds,
              },
            })
            setStep('home')
          }}
          onRetest={() => setStep('readiness')}
          onExit={() => setStep(prescription ? 'home' : 'welcome')}
          onKeepBand={() => setStep('home')}
        />
      )}

      {step === 'home' && prescription && welcome && (
        <HomeHub
          rx={prescription}
          condition={condition}
          mode={welcome.mode}
          clinicCode={welcome.clinicCode}
          goalLabel={goalLabel ?? undefined}
          deviceName={device.name}
          sessionsThisWeek={sessionTimes.filter((t) => Date.now() - t < 604800000).length}
          onStartSession={() => setStep('training')}
          onProgress={() => setStep('progress')}
          onRetest={() => setStep('readiness')}
        />
      )}

      {step === 'training' && prescription && (
        <TrainingSession
          rx={prescription}
          liveHr={feed.bpm}
          hrSourceLabel={device.name}
          hrStatus={feed.status}
          onComplete={(log) => {
            setSessions((prev) => [...prev, log])
            setSessionTimes((prev) => [...prev, Date.now()])
            // Rehab session → clinician (HR, minutes, symptom Δ).
            syncSessionToClinic({
              clinicCode: welcome?.clinicCode,
              patientLabel: welcome?.patientName,
              sessionType: 'training',
              hrtBpm: prescription?.hrt,
              bandLow: prescription?.lowerBpm,
              bandHigh: prescription?.upperBpm,
              condition,
              payload: log,
            })
            setStep('progress')
          }}
          onCancel={() => setStep(prescription ? 'home' : 'result')}
        />
      )}

      {step === 'progress' && prescription && (
        <ProgressDashboard
          rx={prescription}
          sessions={sessions}
          onHome={() => setStep('home')}
          onNewSession={() => setStep('training')}
          canApply={sessions.length > progressionCheckpoint}
          onApplyCeiling={(newCeilingBpm) => {
            setPrescription((prev) => {
              if (!prev) return prev
              const upperBpm = newCeilingBpm
              const lowerBpm = prev.lowerBpm + (newCeilingBpm - prev.upperBpm)
              return {
                ...prev,
                upperBpm,
                lowerBpm,
                summary: `Train at ${lowerBpm}–${upperBpm} bpm. Aim for ${prev.sessionMinutes} minutes, ${prev.daysPerWeek} days a week. Keep your heart rate under ${upperBpm} bpm. Stop the session if your symptoms rise ${prev.stopRisePoints} or more points above how you felt before you started.`,
              }
            })
            setProgressionCheckpoint(sessions.length)
            setStep('home')
          }}
        />
      )}
    </SstAppShell>
  )
}
