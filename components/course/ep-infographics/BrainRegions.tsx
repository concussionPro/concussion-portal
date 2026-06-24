import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const SUB = '#4a6a6e'

/**
 * Labelled lateral brain diagram showing concussion-relevant regions.
 *
 * The anatomy itself is a credible, recognised public-domain lateral diagram
 * (Brain Lobes / Brainlobes.svg, King of Hearts et al., released to the public
 * domain via Wikimedia Commons — see attribution beneath the figure). Around it
 * we keep the course's own region → function → concussion-symptom mapping as a
 * clean clinical legend, which is the load-bearing teaching content.
 */

type Region = {
  name: string
  dot: string
  fn: string
  symptom: string
}

const REGIONS: Region[] = [
  {
    name: 'Frontal lobe',
    dot: '#0d7377',
    fn: 'Executive function · attention · mood',
    symptom: 'Cognitive fog · poor concentration · emotional lability',
  },
  {
    name: 'Parietal lobe',
    dot: '#1a5f7a',
    fn: 'Sensory integration · spatial awareness',
    symptom: 'Sensory overload · spatial disorientation',
  },
  {
    name: 'Temporal lobe',
    dot: '#5b8fa0',
    fn: 'Memory · emotion · auditory processing',
    symptom: 'Memory gaps · irritability · noise sensitivity',
  },
  {
    name: 'Occipital lobe',
    dot: '#4a3f6b',
    fn: 'Vision · light processing',
    symptom: 'Photophobia · visual blur · screen intolerance',
  },
  {
    name: 'Cerebellum',
    dot: '#c2772e',
    fn: 'Balance · motor coordination',
    symptom: 'Dizziness · unsteady gait · poor coordination',
  },
  {
    name: 'Brainstem',
    dot: '#a8631f',
    fn: 'Autonomic regulation · arousal · nausea',
    symptom: 'Fatigue · nausea · exercise intolerance',
  },
]

export function BrainRegions() {
  return (
    <InfographicFrame
      eyebrow="Module 1 · Neuroanatomy"
      title="Brain regions relevant to concussion"
      ariaLabel="Lateral brain diagram with six labelled regions. Frontal lobe: executive function, attention and mood — affected in cognitive fog and emotional lability. Parietal lobe: sensory integration and spatial awareness — affected in sensory overload. Temporal lobe: memory, emotion and auditory processing — affected in memory difficulty, irritability and noise sensitivity. Occipital lobe: vision and light processing — affected in light sensitivity and visual disturbance. Cerebellum: balance and motor coordination — affected in dizziness and unsteady gait. Brainstem: autonomic regulation, arousal and nausea — affected in fatigue, nausea and exercise intolerance."
      caption="Concussion symptoms map directly onto the regions disrupted by the neurometabolic cascade — understanding the anatomy explains why no two presentations are identical."
    >
      <div className="flex flex-col gap-4">
        {/* Anatomy image */}
        <figure className="m-0">
          <div className="flex items-center justify-center rounded-xl border border-[#cfe3e4] bg-white px-3 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/infographics/brain-lobes.svg"
              alt="Lateral view of the human brain with the frontal, parietal, temporal and occipital lobes and the cerebellum labelled."
              width={313}
              height={286}
              loading="lazy"
              decoding="async"
              className="h-auto w-full max-w-[360px]"
            />
          </div>
          <figcaption className="mt-1.5 text-center text-[10.5px] leading-snug text-[#90a9ac]">
            Source: Brain Lobes (Brainlobes.svg), King of Hearts et al. — Public domain, via Wikimedia Commons.
          </figcaption>
        </figure>

        {/* Region → function → symptom legend */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {REGIONS.map((r) => (
            <div
              key={r.name}
              className="flex items-start gap-3 rounded-xl border border-[#cfe3e4] bg-[#f6fafa] px-3.5 py-3"
            >
              <span
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-white"
                style={{ background: r.dot }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-bold leading-tight" style={{ color: INK }}>
                  {r.name}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: SUB }}>
                  {r.fn}
                </p>
                <p
                  className="mt-1 text-[11.5px] font-semibold leading-snug"
                  style={{ color: '#a8631f' }}
                >
                  → {r.symptom}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InfographicFrame>
  )
}
