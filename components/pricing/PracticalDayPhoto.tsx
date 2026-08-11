import Image from 'next/image'

/**
 * THE practical-day photo card — ONE component, both streams.
 *
 * The in-person day is SHARED between CCM and CRM (one room, one date, both
 * cohorts), and until 2026-08-11 the two pricing tabs carried two different
 * hand-written versions of this block with different eyebrows, headlines and
 * skill lists — which read as two different products for the same day.
 *
 * PLACEMENT (owner): directly under the tab's title, above the price cards.
 * On the tabbed /pricing embed the stream-body CSS orders children by id —
 * `#workshop-photo` is order 2, right beneath the page title. The CRM copy of
 * this block never carried the id, which is WHY it sank to the bottom of that
 * tab (`.stream-body > *` defaults to order 5). One component, one id.
 */
export function PracticalDayPhoto() {
  return (
    <div id="workshop-photo" className="max-w-4xl mx-auto mb-6 rounded-2xl overflow-hidden relative shadow-lg">
      <Image
        src="/workshop-training.jpg"
        alt="Zac Lewis training a team of clinicians — hands-on concussion examination practice"
        width={1200}
        height={675}
        className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">The practical day</p>
        <h3 className="text-base sm:text-xl font-bold leading-tight">
          Assess &rarr; prescribe, supervised &mdash; the same full-day workshop every clinician takes.
        </h3>
        <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">
          SCAT6, VOMS, BESS, cervical and cranial-nerve assessment on real subjects with expert
          feedback &mdash; then turning each screen into an in-scope exercise prescription.
          OSCE-assessed competency.
        </p>
      </div>
    </div>
  )
}
