'use client'

import { useState, useEffect } from 'react'
import type {
  Condition,
  Prescription,
  SessionLog,
  TestInput,
  ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { AppShell, type Step } from '@/components/sst-trainer/shell'
import WelcomeMode, { type WelcomeSelection } from '@/components/sst-trainer/WelcomeMode'
import SstInstallPrompt from '@/components/sst-trainer/SstInstallPrompt'
import SymptomSelect from '@/components/sst-trainer/SymptomSelect'
import Readiness, { type ReadinessResult } from '@/components/sst-trainer/Readiness'
import GuidedTest from '@/components/sst-trainer/GuidedTest'
import ResultPrescription from '@/components/sst-trainer/ResultPrescription'
import HomeHub from '@/components/sst-trainer/HomeHub'
import TrainingSession from '@/components/sst-trainer/TrainingSession'
import ProgressDashboard from '@/components/sst-trainer/ProgressDashboard'
import { syncSessionToClinic } from '@/lib/sst-trainer/clinic-sync'

/**
 * Flow orchestrator for the Sub-Symptom-Threshold Trainer (client-only state
 * machine). Holds all app state and steps through the screens. Persistence /
 * pairing backend is out of scope for this scaffold — state lives in memory.
 *
 * Flow (matches the design's startStep enum):
 *   welcome → symptoms → readiness → test → result → home → training → progress
 *
 * Engine wiring (all in lib/sst-trainer/protocol.ts):
 *  - GuidedTest          → detectThreshold()
 *  - ResultPrescription  → computePrescription()
 *  - ProgressDashboard   → progressionDecision()
 */
export default function SstTrainerPage() {
  const [step, setStep] = useState<Step>('welcome')

  // collected across the flow
  const [welcome, setWelcome] = useState<WelcomeSelection | null>(null)
  // Deep-link prefill: a per-clinic QR points to /sst-trainer?clinic=CODE so the
  // patient lands with their clinic code already filled + clinic-code mode on —
  // they just add their name and go. Read client-side (no SSR/Suspense needed).
  const [prefill, setPrefill] = useState<Partial<WelcomeSelection> | undefined>(undefined)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('clinic')?.trim()
    if (code) setPrefill({ mode: 'clinic-code', clinicCode: code.toUpperCase() })
  }, [])
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([])
  const [restingSymptomScore, setRestingSymptomScore] = useState(0)
  const [, setTestInput] = useState<TestInput | null>(null)
  const [thresholdResult, setThresholdResult] = useState<ThresholdResult | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [sessions, setSessions] = useState<SessionLog[]>([])
  // session count at the last applied band change — a further apply requires
  // new sessions beyond this (see ProgressDashboard canApply)
  const [progressionCheckpoint, setProgressionCheckpoint] = useState(0)

  const condition: Condition = welcome?.condition ?? 'concussion'

  return (
    <AppShell step={step}>
      {step === 'welcome' && (
        <>
        <SstInstallPrompt />
        <WelcomeMode
          initial={welcome ?? prefill}
          onContinue={(selection) => {
            setWelcome(selection)
            setStep('symptoms')
          }}
        />
        </>
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
          onContinue={(r: ReadinessResult) => {
            setRestingSymptomScore(r.restingSymptomScore)
            setStep('test')
          }}
        />
      )}

      {step === 'test' && (
        <GuidedTest
          condition={condition}
          restingSymptomScore={restingSymptomScore}
          selectedSymptomIds={selectedSymptomIds}
          onComplete={(result, input) => {
            setThresholdResult(result)
            setTestInput(input)
            setStep('result')
          }}
          // abort the test → readiness, or straight home if a band already exists
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
          // red-flag exit: a saved band means go to the safe hub; otherwise welcome
          onExit={() => setStep(prescription ? 'home' : 'welcome')}
          // keep the existing band after a non-physiologic re-test result
          onKeepBand={() => setStep('home')}
        />
      )}

      {step === 'home' && prescription && welcome && (
        <HomeHub
          rx={prescription}
          condition={condition}
          mode={welcome.mode}
          clinicCode={welcome.clinicCode}
          sessionsThisWeek={sessions.length}
          onStartSession={() => setStep('training')}
          onProgress={() => setStep('progress')}
          onRetest={() => setStep('readiness')}
        />
      )}

      {step === 'training' && prescription && (
        <TrainingSession
          rx={prescription}
          onComplete={(log) => {
            setSessions((prev) => [...prev, log])
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
          // a band change must be earned by NEW sessions since the last apply —
          // prevents ratcheting the ceiling by re-clicking against the same data
          canApply={sessions.length > progressionCheckpoint}
          // apply an advance/regress decision: shift the whole band by the delta,
          // refresh the summary copy, checkpoint the session count, return home
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
    </AppShell>
  )
}
