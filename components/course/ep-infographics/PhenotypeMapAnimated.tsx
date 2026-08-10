'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the six phenotypes — finding, then treatment.
 *
 * CCM M7, CRM M5, CRM M7.
 *
 * WHY INTERACTIVE. The static map shows six labels and their interventions all
 * at once, which is the one presentation guaranteed not to be learned: the
 * whole clinical skill is going from a FINDING to a TREATMENT, and a grid shows
 * both simultaneously so the reader never makes the step themselves. Selecting
 * a phenotype and having the intervention arrive is the mapping being taught.
 */

const PHENOTYPES = [
  {
    id: 'vestibular',
    name: 'Vestibular',
    colour: '#0d7377',
    finding: 'Dizziness on head movement, imbalance, symptoms worse in busy visual environments.',
    test: 'VOMS — vestibulo-ocular reflex and visual motion sensitivity provoke.',
    rx: 'Habituation and gaze-stabilisation exercises, graded exposure to the provoking motion.',
  },
  {
    id: 'oculomotor',
    name: 'Oculomotor',
    colour: '#1b6ca8',
    finding: 'Reading difficulty, eye strain, headache with near work, losing place on the page.',
    test: 'VOMS — smooth pursuits, saccades, near point of convergence.',
    rx: 'Convergence and saccadic training, pacing of near work, referral for behavioural optometry where it does not settle.',
  },
  {
    id: 'cognitive',
    name: 'Cognitive / fatigue',
    colour: '#6b4c9a',
    finding: 'Mental fog, poor concentration, disproportionate fatigue after cognitive load.',
    test: 'History plus symptom-limited cognitive exertion.',
    rx: 'Cognitive pacing with graded load, sleep intervention, aerobic exercise below threshold.',
  },
  {
    id: 'migraine',
    name: 'Post-traumatic migraine',
    colour: '#a0522d',
    finding: 'Throbbing headache, photophobia, phonophobia, nausea.',
    test: 'Headache pattern and provocation history.',
    rx: 'Trigger management, medical review for prophylaxis, aerobic exercise — often the most responsive phenotype.',
  },
  {
    id: 'anxiety',
    name: 'Anxiety / mood',
    colour: '#b0448a',
    finding: 'Rumination, hypervigilance about symptoms, avoidance, sleep disruption.',
    test: 'Screening tools plus history. Frequently secondary to a prolonged recovery.',
    rx: 'Reassurance grounded in objective data, graded return to activity, psychology referral where it persists.',
  },
  {
    id: 'cervical',
    name: 'Cervicogenic',
    colour: '#3f7d3a',
    finding: 'Neck pain, headache from the occiput, symptoms reproduced by neck movement not by exertion.',
    test: 'Cervical flexion-rotation, joint palpation, proprioceptive testing.',
    rx: 'Manual therapy, deep neck flexor and proprioceptive retraining.',
  },
] as const

export function PhenotypeMapAnimated() {
  const [sel, setSel] = useState<string | null>(null)
  const p = PHENOTYPES.find((x) => x.id === sel)

  return (
    <InfographicFrame
      eyebrow="Phenotypes"
      title="The six concussion phenotypes"
      caption="Concussion is not one presentation. Naming the dominant phenotype is what turns 'rest and review' into a treatment plan — and most patients carry more than one."
      ariaLabel="Interactive map of six concussion phenotypes: vestibular, oculomotor, cognitive and fatigue, post-traumatic migraine, anxiety and mood, and cervicogenic. Selecting one reveals its hallmark presentation, the assessment that identifies it, and the targeted intervention."
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PHENOTYPES.map((x) => {
            const on = sel === x.id
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setSel(on ? null : x.id)}
                aria-pressed={on}
                className="rounded-lg px-2.5 py-2.5 text-[12px] font-bold leading-tight transition-colors"
                style={{
                  background: on ? x.colour : '#fff',
                  color: on ? '#fff' : '#3c5658',
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px #cfe3e4',
                }}
              >
                {x.name}
              </button>
            )
          })}
        </div>

        {p ? (
          <div
            className="flex flex-col gap-2 rounded-xl px-4 py-3.5"
            style={{ background: `${p.colour}0f`, border: `1px solid ${p.colour}40` }}
          >
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: p.colour }}>
                What you see
              </p>
              <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-[#2c4143]">{p.finding}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: p.colour }}>
                What identifies it
              </p>
              <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-[#2c4143]">{p.test}</p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: p.colour }}>
                What you do
              </p>
              <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-[#2c4143]">{p.rx}</p>
            </div>
          </div>
        ) : (
          <p className="m-0 rounded-xl border border-dashed border-[#cfe3e4] bg-[#f7fbfb] px-4 py-3.5 text-center text-[13px] text-[#7d9598]">
            Pick a phenotype to see the finding, the test that identifies it, and the intervention.
          </p>
        )}
      </div>
    </InfographicFrame>
  )
}
