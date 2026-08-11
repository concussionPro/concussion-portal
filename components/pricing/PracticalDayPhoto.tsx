import Image from 'next/image'

/**
 * The practical-day media card — one component, per-stream content.
 *
 * PLACEMENT (owner): directly under the tab's title, above the price cards.
 * MUST be a direct child of .stream-body — the /pricing embed orders children
 * by the #workshop-photo id, and nested inside the hero it is display:none'd
 * by the nth-child hider.
 *
 * PER-STREAM CONTENT (owner 2026-08-11: "EPs DO NOT ASSESS"):
 *  - ccm: the real workshop photograph — a cranial-nerve exam mid-teach. The
 *    photo IS assessment, which is exactly the CCM promise.
 *  - crm: that same photo is the WRONG promise for exercise physiologists, and
 *    every crop of it still shows the exam. Until a real exertion-segment
 *    photo from the day exists, the CRM card shows the product truth instead:
 *    the graded session live on the patient's watch. Swap the src when the
 *    photo arrives — the copy already matches EP scope.
 *
 * LANDSCAPE, full content width: fixed strip heights crop the source into the
 * wide cinematic band. A max-w-4xl wrapper rendered the 4:3 source squarish
 * (owner: "use the landscape version").
 */
const STREAMS = {
  ccm: {
    src: '/workshop-training.jpg',
    alt: 'Zac Lewis training a team of clinicians — hands-on concussion examination practice',
    eyebrow: 'The practical day',
    headline: 'Assess \u2192 prescribe, supervised \u2014 hands-on with real subjects.',
    body: 'SCAT6, VOMS, BESS, cervical and cranial-nerve assessment with expert feedback \u2014 then turning each screen into a graded exercise prescription. OSCE-assessed competency.',
  },
  crm: {
    src: '/crm-practical-visual.jpg',
    alt: 'Graded exertion session delivered live on the patient\u2019s own watch \u2014 threshold band and minutes on screen',
    eyebrow: 'The practical day',
    headline: 'Prescribe \u2192 deliver, supervised \u2014 graded exertional rehab protocols, hands-on.',
    body: 'Graded exertion testing on real subjects, threshold-band prescription, session delivery and progression rules \u2014 squarely in EP scope. OSCE-assessed competency.',
  },
} as const

export function PracticalDayPhoto({ stream = 'ccm' }: { stream?: keyof typeof STREAMS }) {
  const c = STREAMS[stream]
  return (
    <div id="workshop-photo" className="mb-6 rounded-2xl overflow-hidden relative shadow-lg">
      <Image
        src={c.src}
        alt={c.alt}
        width={1200}
        height={675}
        className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">{c.eyebrow}</p>
        <h3 className="text-base sm:text-xl font-bold leading-tight">{c.headline}</h3>
        <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">{c.body}</p>
      </div>
    </div>
  )
}
