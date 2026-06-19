'use client'

import { useState } from 'react'
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
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-[#b06a52]">
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
                  on ? 'border-[#d2463a] bg-[#fbeae8]' : 'border-[#d4e0e1] bg-white'
                }`}
              >
                <span
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-xs font-bold text-white ${
                    on ? 'border-[#d2463a] bg-[#d2463a]' : 'border-[#b9c9ca] bg-white'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
                <span className="text-[13.5px] leading-snug text-[#16282b]">{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {blocked && (
        <div className="rounded-[16px] border-[1.5px] border-[#d2463a] bg-[#fbeae8] p-3.5">
          <p className="m-0 text-sm font-bold text-[#b1392e]">Stop — do not start the test.</p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-[#8a4036]">
            One of these can be a warning sign. Seek medical review now — your clinician, or emergency
            care if severe — before any exertion.
          </p>
        </div>
      )}

      {!blocked && (
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] font-semibold leading-tight text-[#3b4f52]">
                Symptoms at rest, right now
              </span>
              <span className={`text-[18px] text-[#5b9aa6] ${numFont}`}>
                {restingScore}
                <span className="text-xs text-[#9bafb0]">/10</span>
              </span>
            </div>
            <SegmentBars
              value={restingScore}
              onChange={setRestingScore}
              variant="ramp"
              ariaLabel="Resting symptom score, 0 to 10"
            />
            <div className="flex justify-between text-[10px] font-medium text-[#9bafb0]">
              <span>0 · none</span>
              <span>10 · severe</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConsented((c) => !c)}
            aria-pressed={consented}
            className={`flex w-full items-start gap-3 rounded-[16px] border-[1.5px] p-3 text-left transition ${
              consented ? 'border-[#5b9aa6] bg-[#e7f2f3]' : 'border-[#d4e0e1] bg-white'
            }`}
          >
            <span
              className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-xs font-bold text-white ${
                consented ? 'border-[#5b9aa6] bg-[#5b9aa6]' : 'border-[#b9c9ca] bg-white'
              }`}
            >
              {consented ? '✓' : ''}
            </span>
            <span className="text-xs leading-relaxed text-[#3b4f52]">
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
          disabled={blocked || !consented}
          onClick={() => onContinue({ restingSymptomScore: restingScore })}
          className="flex-[1.4]"
        >
          Start test
        </PrimaryButton>
      </div>
    </section>
  )
}
