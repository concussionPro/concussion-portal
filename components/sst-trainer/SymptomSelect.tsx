'use client'

import { useState } from 'react'
import { CONCUSSION_SYMPTOMS } from '@/lib/sst-trainer/symptoms'
import { PrimaryButton, ScreenHeading, SecondaryButton } from './shell'

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
    <section className="flex flex-col gap-3.5 pt-1.5">
      <ScreenHeading
        title="Pick your symptoms"
        sub="Choose the ones you actually get — we'll only ask about those during the test."
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {CONCUSSION_SYMPTOMS.map((s) => {
          const on = selected.has(s.id)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={on}
              className={`flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left transition ${
                on ? 'border-(--sst-accent) bg-(--sst-accent-soft)' : 'border-(--sst-line) bg-(--sst-card)'
              }`}
            >
              <span
                className={`flex h-[20px] w-[20px] flex-none items-center justify-center rounded-[6px] border-[1.5px] text-[10px] font-bold text-(--sst-on-accent) ${
                  on ? 'border-(--sst-accent) bg-(--sst-accent)' : 'border-(--sst-check-border) bg-(--sst-card)'
                }`}
              >
                {on ? '✓' : ''}
              </span>
              <span className="text-[13px] leading-tight text-(--sst-ink)">{s.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2.5 pt-0.5">
        <SecondaryButton onClick={onBack} className="flex-1">
          Back
        </SecondaryButton>
        <PrimaryButton
          disabled={selected.size === 0}
          onClick={() => onContinue([...selected])}
          className="flex-[1.4]"
        >
          {/* A disabled CTA must say WHY (same pattern as the welcome step's
              "Pick a goal to continue") — an unexplained grey button reads as
              a broken app, not as a missing choice. */}
          {selected.size === 0 ? 'Pick at least one to continue' : 'Continue'}
        </PrimaryButton>
      </div>
    </section>
  )
}
