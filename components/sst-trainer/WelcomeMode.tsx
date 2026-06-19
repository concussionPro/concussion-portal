'use client'

import { useState } from 'react'
import type { Condition } from '@/lib/sst-trainer/protocol'

export type TrainerMode = 'self-guided' | 'clinic-code'

export interface WelcomeSelection {
  mode: TrainerMode
  clinicCode: string | null
  condition: Condition
}

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'concussion', label: 'Concussion' },
  { value: 'mtbi', label: 'Mild TBI (mTBI)' },
  { value: 'tbi', label: 'Moderate–severe TBI' },
  { value: 'neuro-other', label: 'Other neuro condition' },
]

export default function WelcomeMode({
  initial,
  onContinue,
}: {
  initial?: Partial<WelcomeSelection>
  onContinue: (selection: WelcomeSelection) => void
}) {
  const [mode, setMode] = useState<TrainerMode>(initial?.mode ?? 'self-guided')
  const [clinicCode, setClinicCode] = useState(initial?.clinicCode ?? '')
  const [condition, setCondition] = useState<Condition>(initial?.condition ?? 'concussion')

  const codeRequiredButMissing = mode === 'clinic-code' && clinicCode.trim().length === 0

  return (
    // DESIGN: hero / cover screen — calm, reassuring first impression, brand teal #5b9aa6, generous whitespace, instrument-grade product mark
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        {/* DESIGN: product wordmark / logo lockup */}
        <h1 className="text-2xl font-semibold">Sub-Symptom-Threshold Trainer</h1>
        <p className="text-sm text-gray-600">
          Home-based, paced exercise that stays under your symptom limit — set up and overseen by your clinician.
        </p>
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">How are you using this?</legend>

        {/* DESIGN: large selectable mode cards (one-handed tappable) */}
        <button
          type="button"
          onClick={() => setMode('self-guided')}
          className={`rounded-lg border p-4 text-left ${
            mode === 'self-guided' ? 'border-[#5b9aa6] bg-[#5b9aa6]/10' : 'border-gray-300'
          }`}
        >
          <span className="block font-medium">Self-guided</span>
          <span className="block text-sm text-gray-600">Run it on your own, following the protocol.</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('clinic-code')}
          className={`rounded-lg border p-4 text-left ${
            mode === 'clinic-code' ? 'border-[#5b9aa6] bg-[#5b9aa6]/10' : 'border-gray-300'
          }`}
        >
          <span className="block font-medium">I have a clinic code</span>
          <span className="block text-sm text-gray-600">Pair with your clinician so they can review your results.</span>
        </button>
      </fieldset>

      {mode === 'clinic-code' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="clinic-code" className="text-sm font-medium">
            Clinic code
          </label>
          {/* DESIGN+TODO: real pairing backend (validate code → link patient to clinician dashboard). For now we just capture the string. */}
          <input
            id="clinic-code"
            type="text"
            value={clinicCode}
            onChange={(e) => setClinicCode(e.target.value.toUpperCase())}
            placeholder="e.g. CEA-4827"
            className="rounded-md border border-gray-300 p-3 text-base"
            autoCapitalize="characters"
          />
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">What are you training for?</legend>
        {/* DESIGN: segmented control / condition picker */}
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`rounded-md border p-3 text-sm ${
                condition === c.value ? 'border-[#5b9aa6] bg-[#5b9aa6]/10' : 'border-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* DESIGN: primary CTA — large, fixed-to-bottom on mobile, high contrast */}
      <button
        type="button"
        disabled={codeRequiredButMissing}
        onClick={() => onContinue({ mode, clinicCode: mode === 'clinic-code' ? clinicCode.trim() : null, condition })}
        className="rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white disabled:opacity-40"
      >
        Continue
      </button>
    </section>
  )
}
