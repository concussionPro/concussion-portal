'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the six-stage graded return to sport, and the rule that governs it.
 *
 * Placed in CCM M6 and CRM M6 — modules where the text is a long prose
 * description of a sequence, which is the worst possible medium for a sequence.
 *
 * WHY INTERACTIVE RATHER THAN A DIAGRAM. Every static version of this graphic
 * in the literature shows six boxes in a row, and every clinician reading it
 * still asks the same two questions: what happens if symptoms return, and how
 * long does each stage take. Those are the ACTUAL content, and a row of boxes
 * cannot answer either. Stepping through — with the symptom-return rule firing
 * as a consequence rather than sitting in a footnote — answers both.
 *
 * The 24-hour minimum and the drop-back rule are protocol, not illustration.
 */

const STAGES = [
  {
    n: 1,
    name: 'Symptom-limited activity',
    goal: 'Gradual reintroduction of work/school',
    activity: 'Daily activities that do not provoke symptoms.',
  },
  {
    n: 2,
    name: 'Light aerobic exercise',
    goal: 'Increase heart rate',
    activity: 'Walking or stationary cycling at slow to medium pace. No resistance training.',
  },
  {
    n: 3,
    name: 'Sport-specific exercise',
    goal: 'Add movement',
    activity: 'Running or skating drills. No head-impact activities.',
  },
  {
    n: 4,
    name: 'Non-contact training drills',
    goal: 'Exercise, coordination and cognitive load',
    activity: 'Harder training drills. May start progressive resistance training.',
  },
  {
    n: 5,
    name: 'Full-contact practice',
    goal: 'Restore confidence, assess functional skills',
    activity: 'Normal training activities — after medical clearance.',
  },
  {
    n: 6,
    name: 'Return to sport',
    goal: 'Return to competition',
    activity: 'Normal game play.',
  },
] as const

export function GradedReturnToSportAnimated() {
  const [stage, setStage] = useState(1)
  const [flared, setFlared] = useState(false)

  const advance = () => {
    setFlared(false)
    setStage((s) => Math.min(s + 1, STAGES.length))
  }

  // The rule that makes the strategy a strategy: symptoms return → back one
  // stage, and 24 hours symptom-free before trying again.
  const provoke = () => {
    setFlared(true)
    setStage((s) => Math.max(1, s - 1))
  }

  const s = STAGES[stage - 1]
  const done = stage === STAGES.length

  return (
    <InfographicFrame
      eyebrow="Return to sport"
      title="The six-stage graded return-to-sport strategy"
      caption="A minimum of 24 hours at each stage. If symptoms return, drop back one stage and only progress again after 24 symptom-free hours — which is why the strategy has no fixed duration."
      ariaLabel="Interactive six-stage return-to-sport ladder. Stage 1 symptom-limited activity, stage 2 light aerobic exercise, stage 3 sport-specific exercise, stage 4 non-contact training drills, stage 5 full-contact practice after medical clearance, stage 6 return to sport. Each stage requires a minimum of 24 hours, and a return of symptoms drops the athlete back one stage."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-1" aria-hidden="true">
          {STAGES.map((st) => {
            const reached = st.n <= stage
            return (
              <button
                key={st.n}
                type="button"
                onClick={() => { setFlared(false); setStage(st.n) }}
                title={st.name}
                className="group flex flex-1 flex-col items-center gap-1"
              >
                <span
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: 14 + st.n * 11,
                    background: st.n === stage ? '#0d7377' : reached ? '#8fc4c4' : '#e2eded',
                  }}
                />
                <span
                  className={[
                    'text-[10.5px] font-bold tabular-nums',
                    st.n === stage ? 'text-[#0d7377]' : reached ? 'text-[#5b8385]' : 'text-[#a5b8b9]',
                  ].join(' ')}
                >
                  {st.n}
                </span>
              </button>
            )
          })}
        </div>

        <div className="rounded-lg border border-[#cfe3e4] bg-[#f5fafa] px-3.5 py-3">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
            Stage {s.n} · minimum 24 hours
          </p>
          <p className="m-0 mt-0.5 text-[14px] font-bold text-[#16282b]">{s.name}</p>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#2c5457]">{s.activity}</p>
          <p className="m-0 mt-1.5 text-[12px] italic text-[#4a6a6e]">Goal — {s.goal}</p>
        </div>

        {flared && (
          <p className="m-0 rounded-lg border border-[#e0c3ad] bg-[#fbf0e8] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#6b3a1c]">
            <strong>Symptoms returned — back one stage.</strong> Rest until symptom-free for 24 hours,
            then attempt this stage again. This is why the strategy has no fixed timeline: it is
            governed by response, not by the calendar.
          </p>
        )}

        {done && !flared && (
          <p className="m-0 rounded-lg border border-[#b9d9c6] bg-[#eef7f1] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#1d6b3f]">
            <strong>Return to sport.</strong> Note that stage 5 required medical clearance — the
            ladder does not issue it, and neither does this course.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={advance}
            disabled={done}
            className="rounded-lg bg-[#0d7377] px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            24 hours symptom-free → next stage
          </button>
          <button
            type="button"
            onClick={provoke}
            disabled={stage === 1}
            className="rounded-lg border border-[#e0c3ad] bg-white px-4 py-2 text-[13px] font-bold text-[#a0522d] transition-colors hover:bg-[#fbf0e8] disabled:opacity-40"
          >
            Symptoms returned
          </button>
          <button
            type="button"
            onClick={() => { setStage(1); setFlared(false) }}
            className="ml-auto rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#7d9598] hover:text-[#0d7377]"
          >
            Reset
          </button>
        </div>
      </div>
    </InfographicFrame>
  )
}
