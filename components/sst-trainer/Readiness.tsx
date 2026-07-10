'use client'

import { useState } from 'react'
import { MAX_RESTING_TO_TEST } from '@/lib/sst-trainer/protocol'
import { RED_FLAGS } from '@/lib/sst-trainer/symptoms'
import { PrimaryButton, ScreenHeading, SecondaryButton, SegmentBars, numFont } from './shell'

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
    <section className="flex flex-col gap-[15px] pt-1.5">
      <ScreenHeading title="Before you start" sub="A quick safety check." />

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-(--sst-flag-ink)">
          Any of these right now?
        </span>
        <div className="flex flex-col gap-[7px]">
          {RED_FLAGS.map((f) => {
            const on = redFlags.has(f.id)
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFlag(f.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-[14px] border-[1.5px] px-3 py-3 text-left transition ${
                  on ? 'border-(--sst-danger) bg-(--sst-danger-soft)' : 'border-(--sst-line) bg-(--sst-card)'
                }`}
              >
                <span
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-xs font-bold text-(--sst-on-accent) ${
                    on ? 'border-(--sst-danger) bg-(--sst-danger)' : 'border-(--sst-check-border) bg-(--sst-card)'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
                <span className="text-[13.5px] leading-snug text-(--sst-ink)">{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {blocked && (
        <div className="rounded-[16px] border-[1.5px] border-(--sst-danger) bg-(--sst-danger-soft) p-3.5">
          <p className="m-0 text-sm font-bold text-(--sst-danger-ink)">Stop — do not start the test.</p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-(--sst-danger-ink-2)">
            One of these can be a warning sign. Seek medical review now — your clinician, or emergency
            care if severe — before any exertion.
          </p>
        </div>
      )}

      {!blocked && (
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] font-semibold leading-tight text-(--sst-ink-2)">
                Symptoms at rest, right now
              </span>
              <span className={`text-[18px] text-(--sst-accent) ${numFont}`}>
                {restingScore}
                <span className="text-xs text-(--sst-muted)">/10</span>
              </span>
            </div>
            <SegmentBars
              value={restingScore}
              onChange={setRestingScore}
              variant="ramp"
              ariaLabel="Resting symptom score, 0 to 10"
            />
            <div className="flex justify-between text-[10px] font-medium text-(--sst-muted)">
              <span>0 · none</span>
              <span>10 · severe</span>
            </div>
          </div>

          {/* Resting symptoms >=8: today is not a test day. A provocation test on
              top of severe resting symptoms is uninterpretable and unkind. */}
          {restingScore >= MAX_RESTING_TO_TEST && (
            <div className="rounded-[16px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) p-3.5">
              <p className="m-0 text-sm font-bold text-(--sst-warn-ink)">Today isn&rsquo;t the day.</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-(--sst-warn-ink-2)">
                Your symptoms are already high at rest. Rest today and retry when they settle below{' '}
                {MAX_RESTING_TO_TEST} out of 10. If they stay this high, check in with your
                clinician.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setConsented((c) => !c)}
            aria-pressed={consented}
            className={`flex w-full items-start gap-3 rounded-[16px] border-[1.5px] p-3 text-left transition ${
              consented ? 'border-(--sst-accent) bg-(--sst-accent-soft)' : 'border-(--sst-line) bg-(--sst-card)'
            }`}
          >
            <span
              className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-xs font-bold text-(--sst-on-accent) ${
                consented ? 'border-(--sst-accent) bg-(--sst-accent)' : 'border-(--sst-check-border) bg-(--sst-card)'
              }`}
            >
              {consented ? '✓' : ''}
            </span>
            <span className="text-xs leading-relaxed text-(--sst-ink-2)">
              I understand this isn&apos;t a diagnosis or return-to-play clearance, should be overseen
              by my clinician, and I&apos;ll stop if I feel unwell.
            </span>
          </button>
        </div>
      )}

      <div className="flex gap-2.5 pt-0.5">
        <SecondaryButton onClick={onBack} className="flex-1">
          Back
        </SecondaryButton>
        <PrimaryButton
          disabled={blocked || !consented || restingScore >= MAX_RESTING_TO_TEST}
          onClick={() => onContinue({ restingSymptomScore: restingScore })}
          className="flex-[1.4]"
        >
          {restingScore >= MAX_RESTING_TO_TEST ? 'Rest today' : 'Start test'}
        </PrimaryButton>
      </div>
    </section>
  )
}
