'use client'

import { useState } from 'react'
import {
  detectThreshold,
  PROVOCATION_RISE,
  type Condition,
  type TestStage,
  type TestInput,
  type TestTermination,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { CONCUSSION_SYMPTOMS } from '@/lib/sst-trainer/symptoms'
import { SegmentBars, numFont } from './shell'

// BCTT max test duration (modified Balke ~15 incline stages + speed ramp; the
// test runs well under ~20 min). Reaching this without a >=3-pt rise ends the
// test as exhaustion-limited (no exercise-driven threshold).
const MAX_STAGES = 20

/** Decorative minute progress ring. */
function MinuteRing({ minute }: { minute: number }) {
  const cx = 120
  const cy = 120
  const r = 95
  const frac = Math.min(0.999, (minute - 1) / (MAX_STAGES - 1))
  const a = frac * 2 * Math.PI
  const x = cx + r * Math.sin(a)
  const y = cy - r * Math.cos(a)
  const large = frac > 0.5 ? 1 : 0
  return (
    <svg viewBox="0 0 240 240" className="block h-full w-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dde7e7" strokeWidth={9} />
      {frac > 0 && (
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`}
          fill="none"
          stroke="#5b9aa6"
          strokeWidth={9}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export default function GuidedTest({
  condition,
  restingSymptomScore,
  selectedSymptomIds,
  onComplete,
  onAbort,
}: {
  condition: Condition
  restingSymptomScore: number
  selectedSymptomIds: string[]
  /** receives the engine result + the raw input that produced it */
  onComplete: (result: ThresholdResult, input: TestInput) => void
  /** leave the test without recording a result (back to readiness, or home if a band exists) */
  onAbort: () => void
}) {
  // only the symptoms the user told us they get
  const userSymptoms = CONCUSSION_SYMPTOMS.filter((s) => selectedSymptomIds.includes(s.id))

  const [recordedStages, setRecordedStages] = useState<TestStage[]>([])
  const [minute, setMinute] = useState(1)

  // current (in-progress) minute inputs
  const [heartRate, setHeartRate] = useState('')
  const [symptomScore, setSymptomScore] = useState(restingSymptomScore)
  const [tappedSymptoms, setTappedSymptoms] = useState<Set<string>>(new Set())

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue > 0

  // reaching a >=3-pt rise this minute means logging it sets the HRt
  const reachesThreshold = symptomScore - restingSymptomScore >= PROVOCATION_RISE

  const toggleSymptom = (id: string) => {
    setTappedSymptoms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentStage = (): TestStage => ({
    minute,
    heartRate: hrValue as number,
    symptomScore,
    symptomsReported: [...tappedSymptoms],
  })

  const finish = (termination: TestTermination, stages: TestStage[]) => {
    const input: TestInput = { restingSymptomScore, stages, termination, condition }
    onComplete(detectThreshold(input), input)
  }

  /** Log this minute. Auto-ends the test on a >=3-pt rise (HRt) or at MAX_STAGES. */
  const logMinute = () => {
    if (!hrValid) return
    const stages = [...recordedStages, currentStage()]
    if (reachesThreshold) return finish('symptom-limited', stages)
    if (minute >= MAX_STAGES) return finish('exhaustion-limited', stages)
    setRecordedStages(stages)
    setMinute((m) => m + 1)
    // fresh entry for every stage — no HR / symptom carry-over from the last minute
    setTappedSymptoms(new Set())
    setHeartRate('')
    setSymptomScore(restingSymptomScore)
  }

  /** Early termination (exhaustion / red-flag). */
  const endEarly = (termination: TestTermination) => {
    const stages =
      termination === 'red-flag' && !hrValid
        ? recordedStages
        : hrValid
          ? [...recordedStages, currentStage()]
          : recordedStages
    finish(termination, stages)
  }

  return (
    <section className="flex flex-col gap-3 pt-1">
      {/* abort / back — never a dead end */}
      <button
        type="button"
        onClick={onAbort}
        className="-ml-1 -mt-0.5 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-[#7d9092] transition active:scale-[0.98]"
      >
        ← Back
      </button>

      {/* hero: minute ring + live/entered HR */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-[114px] w-[114px] flex-none">
          <MinuteRing minute={minute} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold tracking-[0.14em] text-[#849c9c]">MIN</span>
            <span className={`text-[40px] leading-[0.9] text-[#16282b] ${numFont}`}>{minute}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor="hr"
            className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#849c9c]"
          >
            Heart rate
          </label>
          {/* TODO: replace with HealthKit / Web Bluetooth live HR feed. Manual entry for now. */}
          <div className="flex items-baseline gap-1.5">
            <input
              id="hr"
              type="number"
              inputMode="numeric"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="—"
              className={`w-[88px] border-none bg-transparent p-0 text-[46px] leading-[0.92] text-[#5b9aa6] outline-none placeholder:text-[#bcd0d2] ${numFont}`}
            />
            <span className="text-[11px] font-semibold text-[#9bafb0]">BPM</span>
          </div>
          <span className="text-[11px] leading-tight text-[#9bafb0]">
            rested {restingSymptomScore}/10 · enter from your monitor
          </span>
        </div>
      </div>

      {/* symptom chips */}
      <div className="flex flex-col gap-[7px]">
        <span className="text-xs font-semibold text-[#3b4f52]">Any of your symptoms now?</span>
        <div className="flex flex-wrap gap-[7px]">
          {userSymptoms.map((s) => {
            const on = tappedSymptoms.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSymptom(s.id)}
                aria-pressed={on}
                className={`rounded-full border-[1.5px] px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? 'border-[#5b9aa6] bg-[#5b9aa6] text-white'
                    : 'border-[#d4e0e1] bg-white text-[#3b4f52]'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* compact symptom level */}
      <div className="flex items-center gap-2.5">
        <span className="whitespace-nowrap text-[11.5px] font-semibold text-[#3b4f52]">
          Symptom level
        </span>
        <div className="flex-1">
          <SegmentBars
            value={symptomScore}
            onChange={setSymptomScore}
            variant="flat"
            ariaLabel="Current symptom level, 0 to 10"
          />
        </div>
        <span className={`w-4 text-right text-[15px] text-[#5b9aa6] ${numFont}`}>{symptomScore}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={!hrValid}
          onClick={logMinute}
          className="w-full rounded-[15px] p-3.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)] transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: reachesThreshold ? '#3c7681' : '#5b9aa6' }}
        >
          {reachesThreshold ? 'Log — this reaches your threshold' : `Log minute ${minute} & continue`}
        </button>
        <p className="m-0 text-center text-[10px] leading-tight text-[#9bafb0]">
          Test ends automatically at a {PROVOCATION_RISE}-point rise from rest (sets your HRt), or at
          minute {MAX_STAGES}.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#dde7e7] pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#849c9c]">
          End the test early
        </span>
        <p className="m-0 -mt-0.5 text-[10.5px] leading-snug text-[#9bafb0]">
          Symptom exacerbation ends the test on its own — log it above. Use these only for exhaustion
          or a red flag.
        </p>
        <button
          type="button"
          disabled={!hrValid}
          onClick={() => endEarly('exhaustion-limited')}
          className="rounded-[14px] border-[1.5px] border-[#cdd9da] bg-white p-3 text-[13.5px] font-semibold text-[#5d7174] transition active:scale-[0.98] disabled:opacity-40"
        >
          Stop — exhausted (RPE maxed, no symptoms)
        </button>
        <button
          type="button"
          onClick={() => endEarly('red-flag')}
          className="rounded-[14px] bg-[#d2463a] p-3 text-[13.5px] font-bold text-white shadow-[0_8px_18px_-9px_rgba(210,70,58,0.85)] transition active:scale-[0.98]"
        >
          ⚑ Red flag — stop now
        </button>
      </div>

      {recordedStages.length > 0 && (
        <div
          className={`rounded-[12px] bg-[#eef4f4] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#5d7174] ${numFont}`}
        >
          {recordedStages
            .map((s) => `${s.minute}m · ${s.heartRate}bpm · sx${s.symptomScore}`)
            .join('    ')}
        </div>
      )}
    </section>
  )
}
