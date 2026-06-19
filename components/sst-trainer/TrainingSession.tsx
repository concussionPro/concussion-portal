'use client'

import { useState } from 'react'
import { SESSION_STOP_RISE, type Prescription, type SessionLog } from '@/lib/sst-trainer/protocol'

export default function TrainingSession({
  rx,
  onComplete,
  onCancel,
}: {
  rx: Prescription
  onComplete: (log: SessionLog) => void
  onCancel: () => void
}) {
  const [preSymptom, setPreSymptom] = useState(0)
  const [currentSymptom, setCurrentSymptom] = useState(0)
  const [peakSymptom, setPeakSymptom] = useState(0)
  const [heartRate, setHeartRate] = useState('')
  const [readings, setReadings] = useState<number[]>([])
  const [completedMinutes, setCompletedMinutes] = useState(rx.sessionMinutes)

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue > 0

  // in-band / over-ceiling indicator off the live reading
  const zone: 'below' | 'in-band' | 'over' | null =
    !hrValid ? null : hrValue < rx.lowerBpm ? 'below' : hrValue > rx.upperBpm ? 'over' : 'in-band'

  // SESSION_STOP_RISE rule: stop if symptoms rise >= 2 points from pre-session
  const symptomRise = currentSymptom - preSymptom
  const shouldStop = symptomRise >= SESSION_STOP_RISE

  const logReading = () => {
    if (!hrValid) return
    setReadings((prev) => [...prev, hrValue])
  }

  const updateSymptom = (v: number) => {
    setCurrentSymptom(v)
    setPeakSymptom((p) => Math.max(p, v))
  }

  const completeSession = () => {
    const allReadings = readings.length ? readings : hrValid ? [hrValue] : []
    const avgHeartRate = allReadings.length
      ? Math.round(allReadings.reduce((a, b) => a + b, 0) / allReadings.length)
      : 0
    const peakHeartRate = allReadings.length ? Math.max(...allReadings) : 0
    const log: SessionLog = {
      date: new Date().toISOString().slice(0, 10),
      avgHeartRate,
      peakHeartRate,
      preSymptom,
      peakSymptom: Math.max(peakSymptom, currentSymptom),
      completedMinutes,
    }
    onComplete(log)
  }

  return (
    // DESIGN: daily-session screen — large band reminder up top, live HR zone front and centre, one-handed
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Training session</h1>
        {/* DESIGN: persistent band reminder banner */}
        <p className="text-sm text-gray-600">
          Target {rx.lowerBpm}–{rx.upperBpm} bpm · keep under {rx.upperBpm} · aim for {rx.sessionMinutes} min
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label htmlFor="pre-symptom" className="text-sm font-medium">
          How do your symptoms feel before you start? ({preSymptom}/10)
        </label>
        <input
          id="pre-symptom"
          type="range"
          min={0}
          max={10}
          step={1}
          value={preSymptom}
          onChange={(e) => setPreSymptom(Number(e.target.value))}
          className="w-full accent-[#5b9aa6]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="session-hr" className="text-sm font-medium">
          Heart rate (bpm)
        </label>
        {/* DESIGN+TODO: replace with HealthKit / Web Bluetooth live HR feed */}
        <input
          id="session-hr"
          type="number"
          inputMode="numeric"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="—"
          className="rounded-md border border-gray-300 p-4 text-2xl"
        />
        {/* DESIGN: the live zone indicator — gauge/dial; colour-coded but accessible */}
        {zone && (
          <div
            className={`rounded-md p-3 text-center text-sm font-medium ${
              zone === 'in-band'
                ? 'bg-[#5b9aa6]/15 text-[#5b9aa6]'
                : zone === 'over'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {zone === 'in-band' && 'In your band — keep going'}
            {zone === 'over' && `Over ceiling — ease off (under ${rx.upperBpm} bpm)`}
            {zone === 'below' && 'Below band — you can lift the intensity a little'}
          </div>
        )}
        <button
          type="button"
          disabled={!hrValid}
          onClick={logReading}
          className="rounded-md border border-gray-300 p-3 text-sm font-medium disabled:opacity-40"
        >
          Log this reading {readings.length > 0 && `(${readings.length} so far)`}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="mid-symptom" className="text-sm font-medium">
          Symptom check — how do you feel now? ({currentSymptom}/10)
        </label>
        {/* DESIGN: mid-session symptom slider */}
        <input
          id="mid-symptom"
          type="range"
          min={0}
          max={10}
          step={1}
          value={currentSymptom}
          onChange={(e) => updateSymptom(Number(e.target.value))}
          className="w-full accent-[#5b9aa6]"
        />
        {shouldStop && (
          // DESIGN: within-session stop warning (SESSION_STOP_RISE rule)
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
            Your symptoms have risen {symptomRise} points. That&apos;s the stop signal — finish the
            session here and rest.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="completed-minutes" className="text-sm font-medium">
          Minutes completed
        </label>
        <input
          id="completed-minutes"
          type="number"
          inputMode="numeric"
          min={0}
          value={completedMinutes}
          onChange={(e) => setCompletedMinutes(Number(e.target.value))}
          className="rounded-md border border-gray-300 p-3 text-base"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 p-4 text-base font-medium"
        >
          Cancel
        </button>
        {/* DESIGN: primary CTA */}
        <button
          type="button"
          onClick={completeSession}
          className="flex-1 rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white"
        >
          Complete session
        </button>
      </div>
    </section>
  )
}
