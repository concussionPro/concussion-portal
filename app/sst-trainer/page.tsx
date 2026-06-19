'use client'

import { useState } from 'react'
import type {
  Condition,
  Prescription,
  SessionLog,
  TestInput,
  ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { AppShell, type Step } from '@/components/sst-trainer/shell'
import WelcomeMode, { type WelcomeSelection } from '@/components/sst-trainer/WelcomeMode'
import SymptomSelect from '@/components/sst-trainer/SymptomSelect'
import Readiness, { type ReadinessResult } from '@/components/sst-trainer/Readiness'
import GuidedTest from '@/components/sst-trainer/GuidedTest'
import ResultPrescription from '@/components/sst-trainer/ResultPrescription'
import HomeHub from '@/components/sst-trainer/HomeHub'
import TrainingSession from '@/components/sst-trainer/TrainingSession'
import ProgressDashboard from '@/components/sst-trainer/ProgressDashboard'

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
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([])
  const [restingSymptomScore, setRestingSymptomScore] = useState(0)
  const [, setTestInput] = useState<TestInput | null>(null)
  const [thresholdResult, setThresholdResult] = useState<ThresholdResult | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [sessions, setSessions] = useState<SessionLog[]>([])

  const condition: Condition = welcome?.condition ?? 'concussion'

  return (
    <AppShell step={step}>
      {step === 'welcome' && (
        <WelcomeMode
          initial={welcome ?? undefined}
          onContinue={(selection) => {
            setWelcome(selection)
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
        />
      )}

      {step === 'result' && thresholdResult && (
        <ResultPrescription
          result={thresholdResult}
          condition={condition}
          onContinue={(rx) => {
            setPrescription(rx)
            setStep('home')
          }}
          onRetest={() => setStep('readiness')}
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
        />
      )}
    </AppShell>
  )
}
