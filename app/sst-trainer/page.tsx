'use client'

import { useState } from 'react'
import type {
  Condition,
  Prescription,
  SessionLog,
  TestInput,
  ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import WelcomeMode, { type WelcomeSelection } from '@/components/sst-trainer/WelcomeMode'
import SymptomSelect from '@/components/sst-trainer/SymptomSelect'
import Readiness, { type ReadinessResult } from '@/components/sst-trainer/Readiness'
import GuidedTest from '@/components/sst-trainer/GuidedTest'
import ResultPrescription from '@/components/sst-trainer/ResultPrescription'
import TrainingSession from '@/components/sst-trainer/TrainingSession'
import ProgressDashboard from '@/components/sst-trainer/ProgressDashboard'

type Step = 'welcome' | 'symptoms' | 'readiness' | 'test' | 'result' | 'training' | 'progress'

/**
 * Flow orchestrator for the Sub-Symptom-Threshold Trainer (client-only state
 * machine). Holds all app state and steps through the screens. Persistence /
 * pairing backend is out of scope for this scaffold — state lives in memory.
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
    // DESIGN: app shell — mobile-first PWA frame, single column, safe-area padding, optional top progress indicator
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white text-gray-900">
      {/* DESIGN: step/progress chrome (e.g. "Step 2 of 5") could live here */}

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
          onStartTraining={(rx) => {
            setPrescription(rx)
            setStep('training')
          }}
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
          onCancel={() => setStep(sessions.length > 0 ? 'progress' : 'result')}
        />
      )}

      {step === 'progress' && prescription && (
        <ProgressDashboard
          rx={prescription}
          sessions={sessions}
          onNewSession={() => setStep('training')}
          onRetest={() => setStep('readiness')}
        />
      )}
    </main>
  )
}
