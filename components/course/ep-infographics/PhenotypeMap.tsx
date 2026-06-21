import type { ReactNode } from 'react'
import { InfographicFrame } from './InfographicFrame'

/**
 * Module 5 — the concussion phenotypes and the EP "lane".
 * A responsive card grid: each phenotype shows what the EP treats with exercise
 * vs where the EP refers / co-manages. A filled chip = EP-led exercise; an
 * outline chip = refer / co-manage.
 */

type Lane = 'lead' | 'comanage' | 'refer'

function Chip({ lane, label }: { lane: Lane; label: string }) {
  if (lane === 'lead') {
    return (
      <span className="inline-block rounded-full bg-[#0d7377] px-2.5 py-1 text-[11px] font-bold text-white">
        {label}
      </span>
    )
  }
  if (lane === 'comanage') {
    return (
      <span className="inline-block rounded-full border border-[#0d7377] bg-[#e7f2f3] px-2.5 py-1 text-[11px] font-bold text-[#0d7377]">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full border border-[#c2772e] bg-[#f6efe6] px-2.5 py-1 text-[11px] font-bold text-[#a8631f]">
      {label}
    </span>
  )
}

function PhenotypeCard({
  icon,
  name,
  blurb,
  lane,
  chip,
}: {
  icon: ReactNode
  name: string
  blurb: string
  lane: Lane
  chip: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#cfe3e4] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#e7f2f3] text-[#0d7377]">
          {icon}
        </span>
        <h5 className="text-[14px] font-bold leading-tight text-[#16282b]">{name}</h5>
      </div>
      <p className="text-[12px] leading-snug text-[#4a6a6e]">{blurb}</p>
      <div className="mt-auto pt-1">
        <Chip lane={lane} label={chip} />
      </div>
    </div>
  )
}

const ic = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
)

export function PhenotypeMap() {
  const cards: Array<React.ComponentProps<typeof PhenotypeCard>> = [
    {
      name: 'Physiological / autonomic',
      blurb: 'Exercise intolerance, low symptom-threshold HR, impaired cerebral autoregulation.',
      lane: 'lead',
      chip: 'EP lead · aerobic Rx',
      icon: ic(<><path d="M3 12h3l2 5 4-10 2 5h7" /></>),
    },
    {
      name: 'Vestibular',
      blurb: 'Dizziness, gaze instability and motion sensitivity with head movement.',
      lane: 'comanage',
      chip: 'EP exercise · refer BPPV',
      icon: ic(<><path d="M6 8a6 6 0 0 1 12 0c0 4-3 4-3 7a3 3 0 0 1-3 3" /><circle cx="9.5" cy="9.5" r="1.4" /></>),
    },
    {
      name: 'Ocular',
      blurb: 'Convergence insufficiency, saccade/pursuit deficits, screen-reading strain.',
      lane: 'comanage',
      chip: 'EP exercise · refer optometry',
      icon: ic(<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.4" /></>),
    },
    {
      name: 'Cervicogenic',
      blurb: 'Neck-driven headache, dizziness and proprioceptive error from cervical injury.',
      lane: 'comanage',
      chip: 'EP exercise · refer red flags',
      icon: ic(<><path d="M12 3v7" /><path d="M9 6c0 2-2 3-2 6a5 5 0 0 0 10 0c0-3-2-4-2-6" /><circle cx="12" cy="4" r="1.4" /></>),
    },
    {
      name: 'Cognitive / mood',
      blurb: 'Fogginess, fatigue, irritability, anxiety and low mood after concussion.',
      lane: 'refer',
      chip: 'EP supports · refer psychology',
      icon: ic(<><path d="M12 4a5 5 0 0 0-5 5c0 1-1 2-1 3a3 3 0 0 0 3 3v2a2 2 0 0 0 2 2h2" /><path d="M12 4a5 5 0 0 1 5 5c0 1 1 2 1 3a3 3 0 0 1-3 3" /></>),
    },
  ]

  return (
    <InfographicFrame
      eyebrow="Module 5 · Phenotype-specific rehabilitation"
      title="The concussion phenotypes & the EP lane"
      ariaLabel="Five concussion phenotypes and the exercise physiologist's lane. Physiological or autonomic: EP-led with aerobic prescription. Vestibular: EP delivers exercise but refers suspected BPPV. Ocular: EP delivers exercise but refers to optometry. Cervicogenic: EP delivers exercise but refers on red flags. Cognitive or mood: EP supports via exercise but refers to psychology. Filled chips mark EP-led exercise; outline chips mark refer or co-manage."
      caption="Across all five phenotypes the EP delivers graded exercise — leading the physiological lane and co-managing or referring the vestibular, ocular, cervical and mood drivers."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <PhenotypeCard key={c.name} {...c} />
        ))}
        {/* legend cell */}
        <div className="flex flex-col justify-center gap-2.5 rounded-xl border border-dashed border-[#cfe3e4] bg-[#f6fafa] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a6a6e]">Legend</p>
          <div className="flex items-center gap-2"><Chip lane="lead" label="EP treats" /><span className="text-[11px] text-[#4a6a6e]">with exercise</span></div>
          <div className="flex items-center gap-2"><Chip lane="refer" label="Refer" /><span className="text-[11px] text-[#4a6a6e]">/ co-manage</span></div>
        </div>
      </div>
    </InfographicFrame>
  )
}
