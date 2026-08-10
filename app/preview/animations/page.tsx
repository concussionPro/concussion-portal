import type { Metadata } from 'next'
import { HrtToPrescriptionAnimated } from '@/components/course/ep-infographics/HrtToPrescriptionAnimated'
import { AutonomicDysfunctionAnimated } from '@/components/course/ep-infographics/AutonomicDysfunctionAnimated'
import { NeurometabolicCascadeAnimated } from '@/components/course/ep-infographics/NeurometabolicCascadeAnimated'
import { GradedReturnToSportAnimated } from '@/components/course/ep-infographics/GradedReturnToSportAnimated'
import { CbfAutoregulationAnimated } from '@/components/course/ep-infographics/CbfAutoregulationAnimated'
import { SstaeMechanismAnimated } from '@/components/course/ep-infographics/SstaeMechanismAnimated'
import { RedFlagDecisionAnimated } from '@/components/course/ep-infographics/RedFlagDecisionAnimated'
import { PhenotypeMapAnimated } from '@/components/course/ep-infographics/PhenotypeMapAnimated'
import { FittFrameworkAnimated } from '@/components/course/ep-infographics/FittFrameworkAnimated'
import { LoadMonitoringAnimated } from '@/components/course/ep-infographics/LoadMonitoringAnimated'
import { RecoveryTimelineAnimated } from '@/components/course/ep-infographics/RecoveryTimelineAnimated'

/**
 * REVIEW PAGE for animated course infographics — approval before embedding.
 *
 * Owner directive: build them all, look at them, THEN embed. The courses are
 * live with paying customers, so nothing reaches a module until it has been
 * seen here.
 *
 * Each card states its target placements and roughly how much text it is
 * intended to carry, so the review question is "does this earn its place",
 * not "is this nice".
 *
 * `noindex` — an unlisted internal surface, not a public page.
 */

export const metadata: Metadata = {
  title: 'Animation review — internal',
  robots: { index: false, follow: false },
}

const ITEMS = [
  {
    id: 'hrt-to-prescription',
    Component: HrtToPrescriptionAnimated,
    placements: 'CCM M7 · CRM M3 · CRM M4',
    status: 'LIVE — already embedded',
    live: true,
    rationale:
      'The band does not exist until the threshold fires. A static chart shows the finished result and hides the causality, which is the thing being taught.',
  },
  {
    id: 'autonomic-dysfunction',
    Component: AutonomicDysfunctionAnimated,
    placements: 'CCM M7 · CRM M1 · CRM M2 · CRM M4 · CRM M7',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'Most-used infographic in either course (5 placements). The teaching point is a change of state — letting the learner flip between healthy and concussed does the comparison for them.',
  },
  {
    id: 'neurometabolic-cascade',
    Component: NeurometabolicCascadeAnimated,
    placements: 'CCM M1 · CRM M1',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'Opens both courses and sits in the heaviest pure-text stretch (CRM M1 ≈ 7,800 words). Order and overlap are the content: demand spikes as supply fails, and the gap between the curves is why exertion provokes symptoms.',
  },
  {
    id: 'cbf-autoregulation',
    Component: CbfAutoregulationAnimated,
    placements: 'CCM M1 · CRM M1 · CRM M4',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'Autoregulation is a RELATIONSHIP — perfusion held flat while pressure swings. A static curve shows the shape but not the behaviour. Dragging pressure and watching flow either hold or follow demonstrates in seconds what the text spends four paragraphs on, and it is the mechanistic justification for SSTAE itself.',
  },
  {
    id: 'graded-return-to-sport',
    Component: GradedReturnToSportAnimated,
    placements: 'CCM M6 · CRM M6',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'Every static version is six boxes in a row, and every clinician still asks the same two questions: what happens if symptoms return, and how long does each stage take. Those are the actual content. Stepping through — with the drop-back rule firing as a consequence rather than sitting in a footnote — answers both.',
  },
  {
    id: 'sstae-mechanism',
    Component: SstaeMechanismAnimated,
    placements: 'CCM M4 · CRM M4',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'The claim is comparative: three ways of managing the same injury produce three different curves. A static diagram can assert that; only a comparison the learner drives makes the magnitude land — and the magnitude is the argument for the whole intervention. The rest arm is deliberately not flat, because overstating it is the kind of claim that gets a course pulled apart in review.',
  },
  {
    id: 'red-flag-decision',
    Component: RedFlagDecisionAnimated,
    placements: 'CCM M2 · CRM M2',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'A printed decision tree is read once and remembered as a shape. What a clinician needs is the rehearsal — being asked the questions in the order they would ask them and arriving at the action. Fails toward escalation: any yes ends the walk, because in practice you do not keep assessing, you stop and refer.',
  },
  {
    id: 'phenotype-map',
    Component: PhenotypeMapAnimated,
    placements: 'CCM M7 · CRM M5 · CRM M7',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'The static map shows six labels and six interventions at once — the one presentation guaranteed not to be learned, because the whole clinical skill is going from a FINDING to a TREATMENT and a grid shows both simultaneously. Selecting one and having the intervention arrive is the mapping being taught.',
  },
  {
    id: 'fitt-framework',
    Component: FittFrameworkAnimated,
    placements: 'CCM M7 · CRM M4',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'FITT as a table is four words and four values, and teaches nothing — the learner already knows what frequency means. What they cannot do from a table is turn a NUMBER into a PRESCRIPTION. Moving the threshold and watching the band follow is the skill, and the evidence caveat sits on the face of it rather than in a footnote.',
  },
  {
    id: 'load-monitoring',
    Component: LoadMonitoringAnimated,
    placements: 'CCM M6 · CRM M6',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'Not a concept to understand but a judgement to practise: given this trace, progress, hold or de-load? Four cases, committing to a call before the answer. The fourth is deliberately the one where symptoms look fine and the right answer is still to hold — a trace read on symptoms alone would call it a success.',
  },
  {
    id: 'recovery-timeline',
    Component: RecoveryTimelineAnimated,
    placements: 'CCM M2 · CRM M1',
    status: 'AWAITING APPROVAL',
    live: false,
    rationale:
      'The number every patient asks for is "how long", and the honest answer is a distribution. A static curve gets read as an average and the average gets quoted back to patients as a promise. Dragging the day marker makes the spread the subject rather than the mean.',
  },
]

export default function AnimationReviewPage() {
  return (
    <main className="min-h-screen bg-[#f4f8f8] px-5 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d7377]">
            Internal review
          </p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#16282b] sm:text-3xl">
            Animated course infographics
          </h1>
          <p className="m-0 max-w-[62ch] text-[14px] leading-relaxed text-[#4a6a6e]">
            Nothing here changes course content. Each animation replaces the static image already
            rendering at the same <code className="rounded bg-[#e2efef] px-1 py-0.5 text-[12px]">[INFOGRAPHIC: id]</code>{' '}
            marker, so approving one is a single registry line and every existing placement upgrades
            at once. Reverting is the same line.
          </p>
          <p className="m-0 max-w-[62ch] text-[13px] leading-relaxed text-[#7d5a1c]">
            <strong>Still silent.</strong> These carry no narration — that needs a voice tool we
            haven&rsquo;t chosen. Judge the visual; the audio is what turns them into video.
          </p>
        </header>

        <nav aria-label="Jump to an animation" className="flex flex-wrap gap-1.5">
          {ITEMS.map(({ id, live }) => (
            <a
              key={id}
              href={`#${id}`}
              className={[
                'rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold no-underline transition-colors',
                live
                  ? 'bg-[#dff0e6] text-[#1d6b3f] hover:bg-[#cbe7d6]'
                  : 'bg-white text-[#4a6a6e] ring-1 ring-[#dcebeb] hover:ring-[#0d7377]',
              ].join(' ')}
            >
              {id}
            </a>
          ))}
        </nav>

        {ITEMS.map(({ id, Component, placements, status, live, rationale }) => (
          <section id={id} key={id} className="scroll-mt-6 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#dcebeb]">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <code className="rounded bg-[#eef6f6] px-1.5 py-0.5 text-[12.5px] font-bold text-[#0d7377]">
                {id}
              </code>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  live ? 'bg-[#dff0e6] text-[#1d6b3f]' : 'bg-[#fbf2e1] text-[#8a6320]',
                ].join(' ')}
              >
                {status}
              </span>
              <span className="ml-auto text-[12px] text-[#7d9598]">{placements}</span>
            </div>

            <p className="m-0 text-[13px] leading-relaxed text-[#4a6a6e]">
              <strong className="text-[#16282b]">Why animated:</strong> {rationale}
            </p>

            <Component />
          </section>
        ))}

        <footer className="rounded-xl border border-[#dcebeb] bg-white p-4">
          <p className="m-0 text-[13px] leading-relaxed text-[#4a6a6e]">
            <strong className="text-[#16282b]">That is all of them.</strong> Eleven animations
            covering every infographic id that carries a placement in either course — 26 placements
            in total, and not one course-content edit. Approving any is a single registry line.
          </p>
        </footer>
      </div>
    </main>
  )
}
