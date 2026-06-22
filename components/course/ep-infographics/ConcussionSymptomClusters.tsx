import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'

/**
 * The four concussion symptom domains — Physical/Somatic, Cognitive,
 * Emotional/Affective, Sleep — rendered as a 2×2 card grid with
 * colour-coded headers and bulleted symptom lists.
 */

type Domain = {
  label: string
  accent: string
  accentText: string
  bg: string
  border: string
  symptoms: string[]
  icon: string
}

const DOMAINS: Domain[] = [
  {
    label: 'Physical / Somatic',
    accent: TEAL,
    accentText: '#ffffff',
    bg: '#eef4f4',
    border: '#cfe3e4',
    icon: 'P',
    symptoms: [
      'Headache',
      'Pressure in the head',
      'Neck pain',
      'Nausea / vomiting',
      'Dizziness / balance problems',
      'Visual disturbance',
      'Sensitivity to light (photophobia)',
      'Sensitivity to noise (phonophobia)',
      'Fatigue / low energy',
      'Feeling slowed down',
    ],
  },
  {
    label: 'Cognitive',
    accent: '#1a5f7a',
    accentText: '#ffffff',
    bg: '#e8f0f5',
    border: '#b8d0dc',
    icon: 'C',
    symptoms: [
      'Feeling "in a fog"',
      'Difficulty concentrating',
      'Memory problems',
      'Slowed thinking / processing',
      'Difficulty with reading / screens',
      'Easily distracted',
      'Word-finding difficulty',
    ],
  },
  {
    label: 'Emotional / Affective',
    accent: '#c2772e',
    accentText: '#ffffff',
    bg: '#f6efe6',
    border: '#e0c4a0',
    icon: 'E',
    symptoms: [
      'Irritability / low frustration tolerance',
      'Sadness or low mood',
      'Anxiety or nervousness',
      'Feeling more emotional than usual',
      'Emotional lability',
    ],
  },
  {
    label: 'Sleep',
    accent: '#4a3f6b',
    accentText: '#ffffff',
    bg: '#eeeaf5',
    border: '#c8bfe0',
    icon: 'S',
    symptoms: [
      'Sleeping more than usual',
      'Sleeping less than usual',
      'Difficulty falling asleep',
      'Disrupted sleep / frequent waking',
      'Unrefreshing sleep',
    ],
  },
]

export function ConcussionSymptomClusters() {
  return (
    <InfographicFrame
      eyebrow="Module 1 · Symptom recognition"
      title="The four concussion symptom domains"
      ariaLabel="Four symptom clusters. Physical or somatic: headache, pressure in the head, neck pain, nausea, dizziness, visual disturbance, light sensitivity, noise sensitivity, fatigue, feeling slowed down. Cognitive: feeling in a fog, difficulty concentrating, memory problems, slowed thinking, difficulty with reading or screens, easily distracted, word-finding difficulty. Emotional or affective: irritability, sadness, anxiety, feeling more emotional, emotional lability. Sleep: sleeping more or less than usual, difficulty falling asleep, disrupted sleep, unrefreshing sleep."
      caption="Symptoms span four independent but often co-occurring domains — a thorough intake must screen all four, not just the physical cluster."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DOMAINS.map((domain) => (
          <div
            key={domain.label}
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: domain.border, background: domain.bg }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-2.5"
              style={{ background: domain.accent }}
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: 'rgba(255,255,255,0.18)', color: domain.accentText }}
                aria-hidden="true"
              >
                {domain.icon}
              </span>
              <h5
                className="text-[13.5px] font-bold tracking-wide"
                style={{ color: domain.accentText }}
              >
                {domain.label}
              </h5>
            </div>
            {/* Symptom list */}
            <ul className="px-4 py-3 space-y-1.5">
              {domain.symptoms.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span
                    className="mt-[3px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: domain.accent }}
                    aria-hidden="true"
                  />
                  <span className="text-[12px] leading-snug" style={{ color: INK }}>
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Footnote */}
      <p className="mt-3 text-[11px] leading-snug" style={{ color: SUB }}>
        Based on Sport Concussion Assessment Tool (SCAT6) symptom checklist domains.
        Symptom severity is rated 0–6 for each item during clinical assessment.
      </p>
    </InfographicFrame>
  )
}
