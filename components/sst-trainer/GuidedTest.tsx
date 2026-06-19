'use client'

import { useState } from 'react'
import {
  detectThreshold,
  type Condition,
  type TestStage,
  type TestInput,
  type TestTermination,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { CONCUSSION_SYMPTOMS } from '@/lib/sst-trainer/symptoms'

export default function GuidedTest({
  condition,
  restingSymptomScore,
  selectedSymptomIds,
  onComplete,
}: {
  condition: Condition
  restingSymptomScore: number
  selectedSymptomIds: string[]
  /** receives the engine result + the raw input that produced it */
  onComplete: (result: ThresholdResult, input: TestInput) => void
}) {
  // only the symptoms the user told us they get
  const userSymptoms = CONCUSSION_SYMPTOMS.filter((s) => selectedSymptomIds.includes(s.id))

  const [recordedStages, setRecordedStages] = useState<TestStage[]>([])
  const [minute, setMinute] = useState(1)

  // current (in-progress) minute inputs
  const [heartRate, setHeartRate] = useState('')
  const [symptomScore, setSymptomScore] = useState(restingSymptomScore)
  const [tappedSymptoms, setTappedSymptoms] = useState<Set<string>>(new Set())

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue > 0

  const toggleSymptom = (id: string) => {
    setTappedSymptoms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** snapshot of the current minute as a TestStage (used to log or to close out on stop) */
  const currentStage = (): TestStage => ({
    minute,
    heartRate: hrValue as number,
    symptomScore,
    symptomsReported: [...tappedSymptoms],
  })

  /** record this minute and advance to the next stage */
  const logMinute = () => {
    if (!hrValid) return
    setRecordedStages((prev) => [...prev, currentStage()])
    setMinute((m) => m + 1)
    setTappedSymptoms(new Set())
    // carry HR/score forward as the starting estimate for the next minute
  }

  /** terminate the test: include the current minute, run the engine, hand up */
  const finish = (termination: TestTermination) => {
    // red-flag can stop instantly even without a valid HR reading
    const stages =
      termination === 'red-flag' && !hrValid ? recordedStages : [...recordedStages, currentStage()]
    const input: TestInput = { restingSymptomScore, stages, termination, condition }
    onComplete(detectThreshold(input), input)
  }

  return (
    // DESIGN: live-test screen — must be readable mid-exercise, one-handed; big HR readout, minute timer, calm pacing
    <section className="flex flex-col gap-6 p-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Guided test</h1>
        {/* DESIGN: stage/minute indicator — large, glanceable; ideally a ring timer */}
        <span className="text-sm text-gray-600">Minute {minute}</span>
      </header>

      <p className="text-xs text-gray-500">
        Resting symptoms were {restingSymptomScore}/10. Each minute, enter your heart rate and tell us
        if any of your symptoms have started.
      </p>

      {/* DESIGN: hero HR input — oversized numeric, live device HR later */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hr" className="text-sm font-medium">
          Heart rate (bpm)
        </label>
        {/* DESIGN+TODO: replace with HealthKit / Web Bluetooth live HR feed */}
        <input
          id="hr"
          type="number"
          inputMode="numeric"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="—"
          className="rounded-md border border-gray-300 p-4 text-2xl"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Any of your symptoms right now?</span>
        {/* DESIGN: symptom chips — big tap targets, wrap, selected = teal */}
        <div className="flex flex-wrap gap-2">
          {userSymptoms.map((s) => {
            const isOn = tappedSymptoms.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSymptom(s.id)}
                aria-pressed={isOn}
                className={`rounded-full border px-3 py-2 text-sm ${
                  isOn ? 'border-[#5b9aa6] bg-[#5b9aa6] text-white' : 'border-gray-300'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="symptom-score" className="text-sm font-medium">
          Overall symptom level ({symptomScore}/10)
        </label>
        {/* DESIGN: 0–10 slider — same instrument styling as readiness */}
        <input
          id="symptom-score"
          type="range"
          min={0}
          max={10}
          step={1}
          value={symptomScore}
          onChange={(e) => setSymptomScore(Number(e.target.value))}
          className="w-full accent-[#5b9aa6]"
        />
      </div>

      {/* DESIGN: primary "log minute" action — large, advances the ramp */}
      <button
        type="button"
        disabled={!hrValid}
        onClick={logMinute}
        className="rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white disabled:opacity-40"
      >
        Log minute {minute} &amp; continue
      </button>

      {/* DESIGN: termination controls — clearly separated from "continue"; red-flag is the most prominent danger action */}
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
        <button
          type="button"
          disabled={!hrValid}
          onClick={() => finish('symptom-limited')}
          className="rounded-lg border border-[#5b9aa6] p-4 text-base font-medium text-[#5b9aa6] disabled:opacity-40"
        >
          Stop — my symptoms came on
        </button>
        <button
          type="button"
          disabled={!hrValid}
          onClick={() => finish('exhaustion-limited')}
          className="rounded-lg border border-gray-400 p-4 text-base font-medium text-gray-700 disabled:opacity-40"
        >
          Stop — I&apos;m exhausted (no symptoms)
        </button>
        <button
          type="button"
          onClick={() => finish('red-flag')}
          className="rounded-lg bg-red-600 p-4 text-base font-semibold text-white"
        >
          Red flag — stop now
        </button>
      </div>

      {recordedStages.length > 0 && (
        // DESIGN: recorded-stages strip — compact timeline of logged minutes
        <div className="text-xs text-gray-500">
          Logged: {recordedStages.map((s) => `${s.minute}m@${s.heartRate}bpm/${s.symptomScore}`).join('  ·  ')}
        </div>
      )}
    </section>
  )
}
