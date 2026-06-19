'use client'

import { useState } from 'react'
import { RED_FLAGS } from '@/lib/sst-trainer/symptoms'

export interface ReadinessResult {
  restingSymptomScore: number
}

export default function Readiness({
  initialRestingScore,
  onBack,
  onContinue,
}: {
  initialRestingScore?: number
  onBack: () => void
  onContinue: (result: ReadinessResult) => void
}) {
  const [redFlags, setRedFlags] = useState<Set<string>>(new Set())
  const [restingScore, setRestingScore] = useState(initialRestingScore ?? 0)
  const [consented, setConsented] = useState(false)

  const blocked = redFlags.size > 0

  const toggleFlag = (id: string) => {
    setRedFlags((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    // DESIGN: safety / readiness screen — serious but not alarming; red-flag block state must be unmistakable
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Before you start</h1>
        <p className="text-sm text-gray-600">A quick safety check.</p>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">
          Are you experiencing any of these right now?
        </legend>
        {/* DESIGN: red-flag checklist — visually distinct (warning treatment), large tap targets */}
        <ul className="flex flex-col gap-2">
          {RED_FLAGS.map((f) => {
            const isOn = redFlags.has(f.id)
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => toggleFlag(f.id)}
                  aria-pressed={isOn}
                  className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-base ${
                    isOn ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      isOn ? 'border-red-500 bg-red-500 text-white' : 'border-gray-400'
                    }`}
                  >
                    {isOn ? '✓' : ''}
                  </span>
                  {f.label}
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>

      {blocked && (
        // DESIGN: hard-stop emergency message — prominent, unambiguous
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Stop — do not start the test.</p>
          <p className="mt-1">
            One or more of these can be a warning sign. Please seek medical review now (your treating
            clinician, or emergency care if symptoms are severe) before any exertion.
          </p>
        </div>
      )}

      {!blocked && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="resting-score" className="text-sm font-medium">
              How are your symptoms right now, at rest? ({restingScore}/10)
            </label>
            {/* DESIGN: instrument-grade 0–10 slider — big thumb, clear scale labels, one-handed */}
            <input
              id="resting-score"
              type="range"
              min={0}
              max={10}
              step={1}
              value={restingScore}
              onChange={(e) => setRestingScore(Number(e.target.value))}
              className="w-full accent-[#5b9aa6]"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 — none</span>
              <span>10 — severe</span>
            </div>
          </div>

          {/* DESIGN: consent / scope acknowledgement card */}
          <label className="flex items-start gap-3 rounded-md border border-gray-300 p-3 text-sm">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-1 accent-[#5b9aa6]"
            />
            <span>
              I understand this tool is not a diagnosis and not a return-to-play clearance. It should
              be set up and overseen by my clinician. I will stop if I feel unwell.
            </span>
          </label>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-300 p-4 text-base font-medium"
        >
          Back
        </button>
        {/* DESIGN: primary CTA — disabled until consent + no red flags */}
        <button
          type="button"
          disabled={blocked || !consented}
          onClick={() => onContinue({ restingSymptomScore: restingScore })}
          className="flex-1 rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white disabled:opacity-40"
        >
          Start test
        </button>
      </div>
    </section>
  )
}
