'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: FITT, built from a real measured threshold.
 *
 * CCM M7, CRM M4.
 *
 * WHY INTERACTIVE. FITT as a static table is four words and four values, and it
 * teaches nothing — the learner already knows what frequency and intensity
 * mean. What they cannot do from a table is TURN A NUMBER INTO A PRESCRIPTION.
 * Moving the threshold and watching the band move with it is the skill.
 *
 * The evidence caveat is on the page, not buried: intensity, duration and
 * frequency are inherited from trial protocols rather than dose-optimised, and
 * they differ between the trials current guidance rests on. Presenting them as
 * settled would be the easy thing and the wrong one.
 */

export function FittFrameworkAnimated() {
  const [hrt, setHrt] = useState(142)
  const lo = Math.round(hrt * 0.8)
  const hi = Math.round(hrt * 0.9)

  const ROWS = [
    { k: 'Frequency', v: 'Most days', note: 'Inherited from the trial protocols — 20 min daily in the Buffalo work, 3–5 sessions a week in others. Never compared head to head.' },
    { k: 'Intensity', v: `${lo}–${hi} bpm`, note: '80–90% of the measured threshold. The only one of the four that is individual to this patient, which is why the test matters.' },
    { k: 'Time', v: '~20 minutes', note: 'Trial convention. Shorter is a reasonable starting point where tolerance is poor.' },
    { k: 'Type', v: 'Treadmill, bike, walking', note: 'Whatever holds heart rate steady and can be monitored. Sport-specific work belongs to the return-to-sport strategy, not here.' },
  ]

  return (
    <InfographicFrame
      eyebrow="Module 4 · Prescription"
      title="The FITT framework, from a measured threshold"
      caption="Only one of the four is individual to the patient — and it is the one that requires a graded test to obtain."
      ariaLabel="Interactive FITT prescription. Adjusting the measured heart-rate threshold moves the prescribed intensity band, which is 80 to 90 percent of it. Frequency, time and type are protocol conventions rather than individualised values."
    >
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between text-[12px] font-semibold text-[#4a6a6e]">
            <span>Measured threshold (HRt)</span>
            <span className="text-[15px] font-bold tabular-nums text-[#16282b]">{hrt} bpm</span>
          </span>
          <input
            type="range" min={110} max={180} value={hrt}
            onChange={(e) => setHrt(Number(e.target.value))}
            className="w-full accent-[#0d7377]"
            aria-label="Measured heart-rate threshold in beats per minute"
          />
        </label>

        <div className="rounded-xl border-2 border-[#0d7377] bg-[#0d7377]/[0.07] px-4 py-3 text-center">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
            Prescribed training band
          </p>
          <p className="m-0 mt-0.5 text-[26px] font-extrabold tabular-nums leading-tight text-[#0d7377]">
            {lo}–{hi} <span className="text-[14px] font-bold">bpm</span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {ROWS.map((r) => (
            <div key={r.k} className="rounded-lg border border-[#dcebeb] bg-white px-3.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-bold text-[#16282b]">{r.k}</span>
                <span className="text-[13px] font-bold tabular-nums text-[#0d7377]">{r.v}</span>
              </div>
              <p className="m-0 mt-1 text-[12px] leading-relaxed text-[#5b7375]">{r.note}</p>
            </div>
          ))}
        </div>

        <p className="m-0 rounded-lg border border-[#e4cfa4] bg-[#fbf2e1] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#5c4415]">
          <strong>On the evidence for these values.</strong> Intensity, duration and frequency are
          inherited from trial protocols rather than derived from dose-optimisation studies, and they
          differ between the trials current guidance rests on. Record what you prescribed rather than
          assuming a single convention — the published protocol says the same.
        </p>
      </div>
    </InfographicFrame>
  )
}
