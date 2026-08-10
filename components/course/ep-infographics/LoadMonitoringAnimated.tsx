'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: reading a load/symptom trace, which is the actual weekly skill.
 *
 * CCM M6, CRM M6.
 *
 * WHY INTERACTIVE. Load monitoring is not a concept to understand, it is a
 * JUDGEMENT to practise: given this week's trace, do you progress, hold or
 * de-load? A static example shows one answer to one trace. Cycling through four
 * traces and committing to a call before seeing the answer is the rehearsal —
 * and the fourth one is deliberately the case where symptoms look fine and the
 * right answer is still to hold.
 */

const CASES = [
  {
    id: 'progress',
    load: [30, 34, 38, 42, 46, 50, 54],
    sym: [3, 3, 2, 2, 2, 1, 1],
    verdict: 'progress',
    label: 'Progress',
    text: 'Load rising, symptoms falling. This is the trace you are trying to produce — increase the band on the next re-test.',
  },
  {
    id: 'hold',
    load: [40, 44, 48, 52, 52, 52, 52],
    sym: [2, 3, 4, 5, 5, 4, 4],
    verdict: 'hold',
    label: 'Hold',
    text: 'Symptoms climbed as load did, then settled once load stopped rising. Hold at this level until they return to baseline before progressing again.',
  },
  {
    id: 'deload',
    load: [45, 52, 58, 64, 70, 74, 78],
    sym: [2, 3, 5, 6, 7, 8, 8],
    verdict: 'deload',
    label: 'De-load',
    text: 'Load and symptoms rising together with no plateau. Drop back to the last tolerated level and re-test — this is the pattern that becomes a multi-week setback if it is chased.',
  },
  {
    id: 'quiet',
    load: [50, 30, 20, 15, 12, 10, 8],
    sym: [2, 2, 2, 2, 2, 2, 2],
    verdict: 'hold',
    label: 'Hold — and ask why',
    text: 'Symptoms flat and unremarkable, but load has collapsed. Nothing here is a symptom problem: they have stopped training. A trace read on symptoms alone would call this a success.',
  },
] as const

export function LoadMonitoringAnimated() {
  const [i, setI] = useState(0)
  const [guess, setGuess] = useState<string | null>(null)
  const c = CASES[i]

  const next = () => { setI((n) => (n + 1) % CASES.length); setGuess(null) }

  const W = 100, H = 40
  const line = (arr: readonly number[], max: number) =>
    arr.map((v, n) => `${n ? 'L' : 'M'}${((n / (arr.length - 1)) * W).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`).join(' ')

  return (
    <InfographicFrame
      eyebrow="Return to activity"
      title="Reading a week of load against symptoms"
      caption="Progress, hold or de-load. The call is made on the two traces together — either one alone will mislead you."
      ariaLabel="Interactive load-monitoring exercise. Four one-week traces of training load against symptom score. For each, the reader decides whether to progress, hold or de-load before the answer is revealed."
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-[#dcebeb] bg-white p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 132 }} preserveAspectRatio="none">
            <path d={line(c.load, 90)} fill="none" stroke="#0d7377" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path d={line(c.sym, 10)} fill="none" stroke="#d79a3a" strokeWidth="2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-1.5 flex flex-wrap gap-4 text-[11px] text-[#7d9598]">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-3 rounded-sm bg-[#0d7377]" /> training load</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[3px] w-3 rounded-sm bg-[#d79a3a]" /> symptoms</span>
            <span className="ml-auto">one week</span>
          </div>
        </div>

        {guess === null ? (
          <>
            <p className="m-0 text-center text-[12.5px] font-semibold text-[#4a6a6e]">
              What would you do next week?
            </p>
            <div className="flex gap-1.5">
              {[
                { k: 'progress', l: 'Progress' },
                { k: 'hold', l: 'Hold' },
                { k: 'deload', l: 'De-load' },
              ].map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setGuess(o.k)}
                  className="flex-1 rounded-lg border border-[#cfe3e4] bg-white px-3 py-2.5 text-[13px] font-bold text-[#3c5658] transition-colors hover:border-[#0d7377]"
                >
                  {o.l}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              className="rounded-xl px-4 py-3"
              style={
                guess === c.verdict
                  ? { background: '#eef7f1', border: '1px solid #b9d9c6' }
                  : { background: '#fbf0e8', border: '1px solid #e0c3ad' }
              }
            >
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: guess === c.verdict ? '#1d6b3f' : '#a0522d' }}>
                {guess === c.verdict ? 'Agreed' : `Not quite — ${c.label}`}
              </p>
              <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#2c4143]">{c.text}</p>
            </div>
            <button
              type="button"
              onClick={next}
              className="self-start rounded-lg bg-[#0d7377] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Next trace
            </button>
          </>
        )}
      </div>
    </InfographicFrame>
  )
}
