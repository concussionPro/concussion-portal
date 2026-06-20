'use client'

import { useState } from 'react'
import type { Condition } from '@/lib/sst-trainer/protocol'
import { PrimaryButton } from './shell'

export type TrainerMode = 'self-guided' | 'clinic-code'

export interface WelcomeSelection {
  mode: TrainerMode
  clinicCode: string | null
  condition: Condition
}

/**
 * The care pathways from the design, mapped to engine Conditions.
 *
 * Only the neuro family is selectable: the symptom inventory (SCAT/PCSS) and the
 * readiness red-flags rendered downstream are concussion-specific, so serving
 * them to a cancer / cardiac / long-COVID patient would be clinically wrong.
 * The expansion pathways stay visible as "Coming soon" (disabled) until they get
 * their own symptom + red-flag vocabularies.
 */
const PATHWAYS: { value: Condition; label: string; sub: string; comingSoon?: boolean }[] = [
  { value: 'concussion', label: 'Concussion', sub: 'Concussion · mTBI' },
  { value: 'cancer', label: 'Cancer', sub: 'prehab & rehab', comingSoon: true },
  { value: 'long-covid', label: 'Long COVID', sub: 'POTS · dysautonomia', comingSoon: true },
  { value: 'cardiac', label: 'Cardiac', sub: '& pulmonary rehab', comingSoon: true },
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
    <section className="flex flex-col gap-4 pt-1.5">
      {/* product lockup */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="relative h-[34px] w-[34px] flex-none rounded-full border-[2.5px] border-[#5b9aa6]">
            <span className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b9aa6]" />
          </span>
          <h1 className="m-0 text-[21px] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Sub-Symptom
            <br />
            Threshold Trainer
          </h1>
        </div>
        <p className="m-0 text-[13px] leading-snug text-[#5d7174]">
          Prescribed, threshold-paced exercise rehab — one platform, your pathway, overseen by your
          clinician.
        </p>
      </div>

      {/* mode segmented control */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849c9c]">
          How are you using this?
        </span>
        <div className="flex gap-1 rounded-[14px] bg-[#e7eeee] p-1">
          {(
            [
              ['self-guided', 'Self-guided'],
              ['clinic-code', 'Clinic code'],
            ] as const
          ).map(([m, label]) => {
            const on = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-[10px] p-2.5 text-[13px] font-semibold transition ${
                  on
                    ? 'bg-white text-[#16282b] shadow-[0_1px_2px_rgba(20,40,42,0.14)]'
                    : 'bg-transparent text-[#7d9092]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* TODO: real clinic pairing backend (validate code → link patient to clinician dashboard). For now we just capture the string. */}
      {mode === 'clinic-code' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clinic-code" className="text-xs font-semibold text-[#3b4f52]">
            Clinic code
          </label>
          <input
            id="clinic-code"
            type="text"
            value={clinicCode}
            onChange={(e) => setClinicCode(e.target.value.toUpperCase())}
            placeholder="e.g. CEA-4827"
            autoCapitalize="characters"
            className="w-full rounded-[14px] border-[1.5px] border-[#cfdbdc] bg-white px-3.5 py-3 text-base tracking-[0.06em] text-[#16282b] outline-none font-[family-name:var(--font-space)] focus:border-[#5b9aa6]"
          />
        </div>
      )}

      {/* care pathway picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849c9c]">
          Care pathway
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PATHWAYS.map((p) => {
            const on = condition === p.value
            if (p.comingSoon) {
              return (
                <div
                  key={p.value}
                  aria-disabled="true"
                  className="flex cursor-not-allowed flex-col gap-0.5 rounded-[14px] border-[1.5px] border-dashed border-[#d4e0e1] bg-[#f4f8f8] px-3 py-2.5 text-left opacity-70"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[13px] font-bold leading-tight text-[#7d9092]">
                      {p.label}
                    </span>
                    <span className="rounded-full bg-[#e7eeee] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.04em] text-[#849c9c]">
                      Soon
                    </span>
                  </div>
                  <span className="text-[10px] leading-tight text-[#9bafb0]">Coming soon</span>
                </div>
              )
            }
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setCondition(p.value)}
                aria-pressed={on}
                className={`flex flex-col gap-0.5 rounded-[14px] border-[1.5px] px-3 py-2.5 text-left transition ${
                  on ? 'border-[#5b9aa6] bg-[#e7f2f3]' : 'border-[#d4e0e1] bg-white'
                }`}
              >
                <span className="text-[13px] font-bold leading-tight text-[#16282b]">{p.label}</span>
                <span className="text-[10px] leading-tight text-[#7d9092]">{p.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <PrimaryButton
        disabled={codeRequiredButMissing}
        onClick={() =>
          onContinue({
            mode,
            clinicCode: mode === 'clinic-code' ? clinicCode.trim() : null,
            condition,
          })
        }
      >
        Continue
      </PrimaryButton>
    </section>
  )
}
