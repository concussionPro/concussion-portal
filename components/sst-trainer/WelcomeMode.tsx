'use client'

import { useState } from 'react'
import type { Condition } from '@/lib/sst-trainer/protocol'
import { PrimaryButton } from './shell'

export type TrainerMode = 'self-guided' | 'clinic-code'

export interface WelcomeSelection {
  mode: TrainerMode
  clinicCode: string | null
  /** Patient name — only captured in clinic-code mode so the clinician can tell
   *  their patients apart in the dashboard (mirrors the preseason athlete name). */
  patientName: string | null
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
  const [patientName, setPatientName] = useState(initial?.patientName ?? '')
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

      {/* Clinic-code mode: code links to the clinician (validated server-side at
          /api/sst/session); the name lets them tell their patients apart. */}
      {mode === 'clinic-code' && (
        <div className="flex flex-col gap-3">
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="patient-name" className="text-xs font-semibold text-[#3b4f52]">
              Your name
            </label>
            <input
              id="patient-name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="So your clinician can find you"
              autoCapitalize="words"
              className="w-full rounded-[14px] border-[1.5px] border-[#cfdbdc] bg-white px-3.5 py-3 text-base text-[#16282b] outline-none focus:border-[#5b9aa6]"
            />
          </div>
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
            patientName: mode === 'clinic-code' ? patientName.trim() || null : null,
            condition,
          })
        }
      >
        Continue
      </PrimaryButton>

      {/* Secondary entry to the SCAT6 baseline & serial-testing instrument. The
          primary flow above (find your training threshold) stays the main path;
          this is a quiet, separate-tool affordance. */}
      <a
        href="/preseason"
        className="group mt-0.5 flex items-center gap-3 rounded-[16px] border-[1.5px] border-[#d4e0e1] bg-white px-4 py-3 text-left no-underline transition active:scale-[0.99] hover:border-[#5b9aa6]"
      >
        <span className="relative h-9 w-9 flex-none rounded-[11px] bg-[#e7f2f3]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2"
            stroke="#3c7681"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12h4l2 6 4-14 2 8h6" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13px] font-bold leading-tight text-[#16282b]">
            Baseline &amp; serial testing
          </span>
          <span className="text-[10.5px] leading-tight text-[#7d9092]">
            Capture or review a SCAT6 baseline and track recovery over time
          </span>
        </span>
        <span className="flex-none text-[#a7c0c2] transition group-hover:text-[#5b9aa6]" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </a>
    </section>
  )
}
