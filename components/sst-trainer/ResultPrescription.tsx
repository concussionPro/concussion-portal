'use client'

import {
  computePrescription,
  type Condition,
  type Prescription,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'

export default function ResultPrescription({
  result,
  condition,
  onStartTraining,
  onRetest,
}: {
  result: ThresholdResult
  condition: Condition
  /** only meaningful in the physiologic branch — receives the computed prescription */
  onStartTraining: (rx: Prescription) => void
  onRetest: () => void
}) {
  // physiologic = HRt found → derive the training band from the engine
  const rx =
    result.interpretation === 'physiologic' && result.hrt !== null
      ? computePrescription(result.hrt, condition)
      : null

  return (
    // DESIGN: results screen — the payoff moment; instrument-grade clarity on the band, reassuring tone
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Your result</h1>
      </header>

      {result.interpretation === 'red-flag' && (
        // DESIGN: emergency state — unmistakable stop treatment, no prescription
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Stop and seek review</p>
          <p className="mt-1">{result.message}</p>
        </div>
      )}

      {result.interpretation === 'no-intolerance' && (
        // DESIGN: "no exercise intolerance" state — neutral, points back to clinician
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold">No exercise-driven symptom threshold found</p>
          <p className="mt-1">{result.message}</p>
        </div>
      )}

      {result.interpretation === 'invalid' && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold">Test incomplete</p>
          <p className="mt-1">{result.message}</p>
        </div>
      )}

      {rx && (
        <>
          <div className="rounded-lg border border-gray-300 p-4">
            <p className="text-sm text-gray-600">Heart-rate threshold (HRt)</p>
            {/* DESIGN: big HRt readout */}
            <p className="text-3xl font-semibold">{rx.hrt} bpm</p>
            <p className="mt-1 text-xs text-gray-500">Reached at minute {result.thresholdStage}.</p>
          </div>

          {/* DESIGN: the hero "training band" — the single most important number-pair in the app; gauge/dial treatment */}
          <div className="rounded-lg border-2 border-[#5b9aa6] bg-[#5b9aa6]/10 p-4">
            <p className="text-sm font-medium text-[#5b9aa6]">Your training band</p>
            <p className="text-3xl font-semibold">
              {rx.lowerBpm}–{rx.upperBpm} bpm
            </p>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Do not exceed {rx.upperBpm} bpm.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-gray-500">Session length</p>
              <p className="text-lg font-medium">{rx.sessionMinutes} min</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-gray-500">Frequency</p>
              <p className="text-lg font-medium">{rx.daysPerWeek} days/week</p>
            </div>
          </div>

          {/* DESIGN: plain-language summary card */}
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">{rx.summary}</p>

          {/* DESIGN: scope reminder — quiet but always present */}
          <p className="text-xs text-gray-500">
            This is not a diagnosis or a return-to-play clearance. Share this with your clinician and
            follow their guidance.
          </p>

          {/* DESIGN: primary CTA */}
          <button
            type="button"
            onClick={() => onStartTraining(rx)}
            className="rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white"
          >
            Start a training session
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onRetest}
        className="rounded-lg border border-gray-300 p-4 text-base font-medium"
      >
        Re-test threshold
      </button>
    </section>
  )
}
