'use client'

import { useEffect, useState } from 'react'
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
import { SstAppShell } from '@/components/platform/SstAppShell'
import SstOnboarding, { type OnboardingResult } from '@/components/platform/SstOnboarding'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/app — the device-framed "Get the app" experience.
//
// The screenshot's 8 pagination dots map 1:1 to the engine flow's 8 steps
// (welcome → … → progress). This page wraps the redesigned welcome/onboarding
// (Self-guided vs Clinic-code, goal, HR-source pairing) and then hands the
// collected { mode, goal, device } into the SAME working state machine and real
// engine used by /sst-trainer (detectThreshold → computePrescription →
// progressionDecision), rendered inside the watch frame.
//
// HR sourcing: the device paired in onboarding opens a REAL connection
// (Web Bluetooth heart-rate profile, or camera PPG — see lib/sst-trainer/
// hr-live.ts). That connection's live bpm flows through useLiveHr into the
// threshold test and training screens. Apple Watch / Fitbit have no live web
// feed, so they stay on manual entry. No bpm is ever fabricated.
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
  const [progressionCheckpoint, setProgressionCheckpoint] = useState(0)

  const condition: Condition = welcome?.condition ?? 'concussion'

  // Live HR feed from the REAL paired connection (same value drives the
  // threshold-test ramp and the training gauge). Null connection → 'manual'.
  const feed = useLiveHr(connection)

  // Release the hardware when the app unmounts (GATT disconnect / camera stop).
  useEffect(() => {
    return () => {
      connection?.stop()
    }
  }, [connection])

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
    >
      {step === 'welcome' && (
        <SstOnboarding
          device={device}
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
          sessionsThisWeek={sessions.length}
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
