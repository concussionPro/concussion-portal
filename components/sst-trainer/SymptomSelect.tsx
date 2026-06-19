'use client'

import { useState } from 'react'
import { CONCUSSION_SYMPTOMS } from '@/lib/sst-trainer/symptoms'

export default function SymptomSelect({
  initialSelected,
  onBack,
  onContinue,
}: {
  initialSelected?: string[]
  onBack: () => void
  onContinue: (selectedSymptomIds: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected ?? []))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    // DESIGN: symptom-picker screen — scannable checklist, calm, clear "your symptoms" framing
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Pick your symptoms</h1>
        <p className="text-sm text-gray-600">
          Choose the symptoms you actually get, so we only ask about those during the test.
        </p>
      </header>

      {/* DESIGN: two-column checklist on wider screens; big tap targets; selected = teal */}
      <ul className="flex flex-col gap-2">
        {CONCUSSION_SYMPTOMS.map((s) => {
          const isOn = selected.has(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={isOn}
                className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-base ${
                  isOn ? 'border-[#5b9aa6] bg-[#5b9aa6]/10' : 'border-gray-300'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    isOn ? 'border-[#5b9aa6] bg-[#5b9aa6] text-white' : 'border-gray-400'
                  }`}
                >
                  {isOn ? '✓' : ''}
                </span>
                {s.label}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-300 p-4 text-base font-medium"
        >
          Back
        </button>
        {/* DESIGN: primary CTA */}
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => onContinue([...selected])}
          className="flex-1 rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </section>
  )
}
