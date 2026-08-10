'use client'

import { useState } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * ANIMATED: the red-flag escalation path, walked one question at a time.
 *
 * CCM M2 and CRM M2.
 *
 * WHY INTERACTIVE. A printed decision tree is read once and remembered as a
 * shape. What a clinician actually needs is the REHEARSAL — being asked the
 * questions in order, in the order they would ask them, and arriving at the
 * action. Walking it is a different cognitive act from looking at it, and this
 * is the one piece of course content where getting it wrong sends someone home
 * with a bleed.
 *
 * Deliberately fails toward escalation: any yes ends the walk immediately. The
 * tree never asks a second question after a positive, because in practice you
 * do not keep assessing — you stop and refer.
 */

const FLAGS = [
  { q: 'Deteriorating consciousness, or increasingly drowsy?', why: 'Progressive decline in GCS is the classic sign of an expanding intracranial lesion.' },
  { q: 'Worsening or severe headache?', why: 'A headache that escalates rather than settles suggests rising intracranial pressure.' },
  { q: 'Repeated vomiting?', why: 'More than one episode is a recognised marker of significant intracranial injury.' },
  { q: 'Seizure or convulsion?', why: 'Post-traumatic seizure requires immediate medical assessment.' },
  { q: 'Weakness, numbness or tingling in the limbs?', why: 'A focal neurological deficit points to structural injury, and to the cervical spine as well as the brain.' },
  { q: 'Neck pain or tenderness?', why: 'The cervical spine has to be cleared. Concussion and cervical injury share a mechanism.' },
  { q: 'Double vision?', why: 'Diplopia can indicate cranial nerve involvement or an orbital fracture.' },
  { q: 'Increasingly restless, agitated or combative?', why: 'A change in behaviour is often the earliest sign families notice, and is easily attributed to the person rather than the injury.' },
] as const

export function RedFlagDecisionAnimated() {
  const [i, setI] = useState(0)
  const [flagged, setFlagged] = useState<number | null>(null)
  const done = i >= FLAGS.length

  const answer = (yes: boolean) => {
    if (yes) setFlagged(i)
    else setI((n) => n + 1)
  }
  const reset = () => { setI(0); setFlagged(null) }

  return (
    <InfographicFrame
      eyebrow="Recognition"
      title="Red-flag escalation decision path"
      caption="Any single yes ends the assessment and starts the referral. You do not keep screening after a positive — you stop."
      ariaLabel="Interactive red-flag screen. Eight questions asked one at a time: deteriorating consciousness, worsening headache, repeated vomiting, seizure, limb weakness or numbness, neck pain, double vision, increasing agitation. Answering yes to any one ends the screen and directs immediate emergency referral."
    >
      <div className="flex flex-col gap-3">
        {flagged !== null ? (
          <div className="rounded-xl border-2 border-[#a0522d] bg-[#fbf0e8] px-4 py-3.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0522d]">
              Red flag — stop here
            </p>
            <p className="m-0 mt-1 text-[14px] font-bold leading-snug text-[#6b3a1c]">
              {FLAGS[flagged].q}
            </p>
            <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-[#6b3a1c]">
              {FLAGS[flagged].why}
            </p>
            <p className="m-0 mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-[13px] font-semibold leading-relaxed text-[#6b3a1c]">
              Emergency medical assessment now. Do not continue the screen, do not
              begin any assessment battery, and do not send them home to be watched.
            </p>
          </div>
        ) : done ? (
          <div className="rounded-xl border border-[#b9d9c6] bg-[#eef7f1] px-4 py-3.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d6b3f]">
              No red flags on this screen
            </p>
            <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#215c3c]">
              Proceed to assessment. Screen again at every review — red flags can appear hours
              after the injury, and a clear screen now is not a clear screen tomorrow.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#cfe3e4] bg-[#f5fafa] px-4 py-3.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0d7377]">
              {i + 1} of {FLAGS.length}
            </p>
            <p className="m-0 mt-1 text-[15px] font-bold leading-snug text-[#16282b]">{FLAGS[i].q}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => answer(true)}
                className="flex-1 rounded-lg bg-[#a0522d] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="flex-1 rounded-lg border border-[#cfe3e4] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4a6a6e] transition-colors hover:border-[#0d7377]"
              >
                No
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1" aria-hidden="true">
          {FLAGS.map((_, n) => (
            <span
              key={n}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background:
                  flagged === n ? '#a0522d' : n < i ? '#8fc4c4' : n === i && flagged === null ? '#0d7377' : '#e2eded',
              }}
            />
          ))}
        </div>

        {(flagged !== null || done) && (
          <button
            type="button"
            onClick={reset}
            className="self-start rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#7d9598] hover:text-[#0d7377]"
          >
            Run it again
          </button>
        )}
      </div>
    </InfographicFrame>
  )
}
