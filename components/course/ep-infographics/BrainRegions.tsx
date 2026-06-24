import { InfographicFrame } from './InfographicFrame'

/**
 * Module 1 — labelled lateral brain diagram showing concussion-relevant regions.
 *
 * The anatomy is hand-authored inline SVG line-art (no external image, no raster):
 * a single refined cerebrum outline with a few suggested sulci, a foliated
 * cerebellum and a tapering brainstem. Each region carries a very subtle tint and
 * an editorial leader-line label. Beneath the figure the course's own
 * region → function → concussion-symptom mapping is kept as a clean legend — the
 * load-bearing teaching content.
 */

// ── editorial palette ────────────────────────────────────────────────
const INK = '#16282b' // legend headings (matches course chrome)
const SUB = '#4a6a6e' // legend body
const STROKE = '#1f2933' // slate-800 — the anatomy outline
const LABEL = '#475569' // slate-600 — diagram labels
const LEADER = '#cbd5e1' // slate-300 — leader lines
const MONO = 'ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, monospace'

// restrained accents — a whisper of colour, never saturated primaries
const TEAL = '#14b8a6'
const SLATE = '#64748b'
const AMBER = '#f59e0b'
const INDIGO = '#6366f1'
const TEAL_DEEP = '#0d9488'
const SLATE_DEEP = '#475569'

// ── anatomy geometry (viewBox 700 × 560) ─────────────────────────────
const CEREBRUM =
  'M 118 250 C 120 172 205 116 305 116 C 398 116 458 152 496 208 ' +
  'C 518 240 520 266 500 292 C 489 306 472 312 452 315 ' +
  'C 430 318 408 323 384 336 C 350 356 318 370 284 372 ' +
  'C 244 374 208 367 184 349 C 163 334 138 318 129 294 ' +
  'C 123 278 118 264 118 250 Z'

const CEREBELLUM =
  'M 452 312 C 478 308 510 318 528 342 C 545 366 542 396 520 414 ' +
  'C 500 430 470 430 446 418 C 424 407 414 384 420 360 ' +
  'C 424 338 434 320 452 312 Z'

const BRAINSTEM =
  'M 398 344 C 404 378 402 414 388 440 C 383 450 369 449 365 438 ' +
  'C 356 410 360 374 372 344 C 378 352 392 352 398 344 Z'

const SULCI = [
  'M 306 132 C 300 176 314 214 298 252', // central sulcus
  'M 192 320 C 250 302 322 286 376 264', // sylvian / lateral fissure
  'M 150 200 C 200 184 248 188 286 202', // superior frontal
  'M 360 176 C 398 188 432 204 458 230', // intraparietal
  'M 214 344 C 268 338 318 344 358 334', // superior temporal
]

const FOLIA = [
  'M 470 345 C 488 348 502 356 512 368',
  'M 470 372 C 489 374 504 380 516 392',
  'M 468 396 C 485 398 498 404 508 414',
  'M 470 350 C 454 354 442 362 434 372',
  'M 468 378 C 452 382 442 390 436 400',
]

// ── diagram labels (leader-line + accent dot) ────────────────────────
type Label = {
  text: string
  accent: string
  tx: number
  ty: number
  anchor: 'start' | 'middle' | 'end'
  lx: number
  ly: number
  dx: number
  dy: number
}

const LABELS: Label[] = [
  { text: 'FRONTAL', accent: TEAL, tx: 92, ty: 186, anchor: 'end', lx: 98, ly: 185, dx: 162, dy: 182 },
  { text: 'PARIETAL', accent: SLATE, tx: 486, ty: 96, anchor: 'start', lx: 480, ly: 100, dx: 382, dy: 168 },
  { text: 'OCCIPITAL', accent: INDIGO, tx: 560, ty: 252, anchor: 'start', lx: 554, ly: 250, dx: 500, dy: 248 },
  { text: 'TEMPORAL', accent: AMBER, tx: 152, ty: 470, anchor: 'end', lx: 158, ly: 463, dx: 246, dy: 348 },
  { text: 'CEREBELLUM', accent: TEAL_DEEP, tx: 580, ty: 392, anchor: 'start', lx: 574, ly: 388, dx: 508, dy: 382 },
  { text: 'BRAINSTEM', accent: SLATE_DEEP, tx: 384, ty: 510, anchor: 'middle', lx: 384, ly: 502, dx: 384, dy: 446 },
]

// ── teaching legend (region → function → symptom) ────────────────────
type Region = {
  name: string
  swatch: string
  fn: string
  symptom: string
}

const REGIONS: Region[] = [
  {
    name: 'Frontal lobe',
    swatch: TEAL,
    fn: 'Executive function · attention · mood',
    symptom: 'Cognitive fog · poor concentration · emotional lability',
  },
  {
    name: 'Parietal lobe',
    swatch: SLATE,
    fn: 'Sensory integration · spatial awareness',
    symptom: 'Sensory overload · spatial disorientation',
  },
  {
    name: 'Temporal lobe',
    swatch: AMBER,
    fn: 'Memory · emotion · auditory processing',
    symptom: 'Memory gaps · irritability · noise sensitivity',
  },
  {
    name: 'Occipital lobe',
    swatch: INDIGO,
    fn: 'Vision · light processing',
    symptom: 'Photophobia · visual blur · screen intolerance',
  },
  {
    name: 'Cerebellum',
    swatch: TEAL_DEEP,
    fn: 'Balance · motor coordination',
    symptom: 'Dizziness · unsteady gait · poor coordination',
  },
  {
    name: 'Brainstem',
    swatch: SLATE_DEEP,
    fn: 'Autonomic regulation · arousal · nausea',
    symptom: 'Fatigue · nausea · exercise intolerance',
  },
]

export function BrainRegions() {
  return (
    <InfographicFrame
      eyebrow="Module 1 · Neuroanatomy"
      title="Brain regions relevant to concussion"
      ariaLabel="Lateral line-art diagram of the human brain with six labelled regions. Frontal lobe: executive function, attention and mood — affected in cognitive fog and emotional lability. Parietal lobe: sensory integration and spatial awareness — affected in sensory overload. Temporal lobe: memory, emotion and auditory processing — affected in memory difficulty, irritability and noise sensitivity. Occipital lobe: vision and light processing — affected in light sensitivity and visual disturbance. Cerebellum: balance and motor coordination — affected in dizziness and unsteady gait. Brainstem: autonomic regulation, arousal and nausea — affected in fatigue, nausea and exercise intolerance."
      caption="Concussion symptoms map directly onto the regions disrupted by the neurometabolic cascade — understanding the anatomy explains why no two presentations are identical."
    >
      <div className="flex flex-col gap-4">
        {/* ── Hand-authored lateral brain line-art ── */}
        <figure className="m-0">
          <div className="flex items-center justify-center rounded-xl border border-[#cfe3e4] bg-white px-3 py-4">
            <svg
              viewBox="0 0 700 560"
              className="h-auto w-full max-w-[520px]"
              preserveAspectRatio="xMidYMid meet"
            >
              <title>Lateral view of the brain with six labelled regions</title>
              <defs>
                <clipPath id="br-cerebrum">
                  <path d={CEREBRUM} />
                </clipPath>
                <clipPath id="br-cerebellum">
                  <path d={CEREBELLUM} />
                </clipPath>
              </defs>

              {/* brainstem (behind) */}
              <path d={BRAINSTEM} fill={SLATE_DEEP} fillOpacity="0.08" />
              <path d={BRAINSTEM} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />

              {/* cerebellum + folia */}
              <path d={CEREBELLUM} fill={TEAL_DEEP} fillOpacity="0.08" />
              <g clipPath="url(#br-cerebellum)" stroke={STROKE} strokeOpacity="0.22" strokeWidth="1" fill="none" strokeLinecap="round">
                {FOLIA.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
              <path d={CEREBELLUM} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />

              {/* cerebrum base fill — hides the tuck of cerebellum / brainstem */}
              <path d={CEREBRUM} fill="#ffffff" />

              {/* subtle lobe tints, clipped to the cerebrum */}
              <g clipPath="url(#br-cerebrum)">
                <ellipse cx="185" cy="212" rx="108" ry="104" fill={TEAL} fillOpacity="0.09" />
                <ellipse cx="378" cy="182" rx="96" ry="82" fill={SLATE} fillOpacity="0.09" />
                <ellipse cx="256" cy="322" rx="104" ry="58" fill={AMBER} fillOpacity="0.09" />
                <ellipse cx="470" cy="248" rx="72" ry="86" fill={INDIGO} fillOpacity="0.09" />
              </g>

              {/* suggested sulci, clipped */}
              <g clipPath="url(#br-cerebrum)" stroke={STROKE} strokeOpacity="0.26" strokeWidth="1.1" fill="none" strokeLinecap="round">
                {SULCI.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>

              {/* cerebrum outline */}
              <path d={CEREBRUM} fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />

              {/* labels + leader lines */}
              {LABELS.map((l) => (
                <g key={l.text}>
                  <line x1={l.lx} y1={l.ly} x2={l.dx} y2={l.dy} stroke={LEADER} strokeWidth="1" />
                  <circle cx={l.dx} cy={l.dy} r="3.4" fill={l.accent} stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    x={l.tx}
                    y={l.ty}
                    textAnchor={l.anchor}
                    fontFamily={MONO}
                    fontSize="11.5"
                    fontWeight="600"
                    letterSpacing="1.6"
                    fill={LABEL}
                  >
                    {l.text}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <figcaption className="mt-1.5 text-center text-[10.5px] leading-snug text-[#90a9ac]">
            Schematic lateral view — original illustration, not drawn to anatomical scale.
          </figcaption>
        </figure>

        {/* ── Region → function → symptom legend ── */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
          {REGIONS.map((r) => (
            <div key={r.name} className="flex items-start gap-2.5">
              <span
                className="mt-[3px] h-2.5 w-2.5 flex-shrink-0 rounded-[3px] ring-2 ring-white"
                style={{ background: r.swatch }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className="text-[12.5px] font-semibold leading-tight tracking-wide"
                  style={{ color: INK }}
                >
                  {r.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: SUB }}>
                  {r.fn}
                </p>
                <p className="mt-1 text-[11px] leading-snug" style={{ color: '#8a9ea0' }}>
                  <span style={{ color: r.swatch }}>→</span> {r.symptom}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InfographicFrame>
  )
}
