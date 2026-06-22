import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'

/**
 * Labelled lateral brain diagram showing concussion-relevant regions.
 * Each region is rendered as an SVG path approximating its anatomical
 * position on a right-lateral view, with a label line and two-line
 * function / symptom annotation.
 */
export function BrainRegions() {
  return (
    <InfographicFrame
      eyebrow="Module 1 · Neuroanatomy"
      title="Brain regions relevant to concussion"
      ariaLabel="Lateral brain diagram with six labelled regions. Frontal lobe: executive function, attention and mood — affected in cognitive fog and emotional lability. Temporal lobe: memory and emotion — affected in memory difficulty and irritability. Parietal lobe: sensory integration and spatial awareness — affected in sensory overload. Occipital lobe: vision and light processing — affected in light sensitivity and visual disturbance. Cerebellum: balance and motor coordination — affected in dizziness and unsteady gait. Brainstem: autonomic regulation, arousal and nausea — affected in fatigue, nausea and exercise intolerance."
      caption="Concussion symptoms map directly onto the regions disrupted by the neurometabolic cascade — understanding the anatomy explains why no two presentations are identical."
    >
      <svg
        viewBox="0 0 780 460"
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Brain regions relevant to concussion — lateral view</title>
        <defs>
          <marker
            id="br-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill={TEAL} />
          </marker>
        </defs>

        {/* ── Brain silhouette ── */}
        {/* Outer cortex shape — right lateral view */}
        <path
          d="M230 310
             C210 310 185 295 175 270
             C162 240 168 210 178 188
             C190 162 205 148 218 138
             C235 125 250 120 268 118
             C285 116 300 118 316 120
             C335 122 355 128 375 136
             C398 146 418 162 432 182
             C448 205 454 232 450 258
             C446 282 434 300 418 312
             C400 326 378 330 355 332
             C330 334 300 334 275 332
             C258 330 242 322 230 310Z"
          fill="#eef4f4"
          stroke="#cfe3e4"
          strokeWidth="2"
        />

        {/* Cerebellum */}
        <path
          d="M390 310
             C408 308 426 312 438 324
             C452 338 456 358 448 374
             C440 388 422 394 404 390
             C386 386 370 374 364 360
             C358 346 360 328 370 318
             C376 313 383 311 390 310Z"
          fill="#dceef0"
          stroke="#cfe3e4"
          strokeWidth="1.5"
        />

        {/* Brainstem */}
        <path
          d="M300 326
             C316 328 334 330 348 336
             C356 340 360 348 358 358
             C356 370 346 378 334 382
             C322 386 308 384 298 378
             C286 370 280 358 282 346
             C284 336 292 328 300 326Z"
          fill="#e4ecee"
          stroke="#cfe3e4"
          strokeWidth="1.5"
        />

        {/* ── Region highlight overlays ── */}
        {/* Frontal lobe — anterior superior */}
        <path
          d="M218 138 C230 128 250 120 268 118 C285 116 300 118 312 124
             C300 148 284 162 270 172 C254 164 236 152 218 138Z"
          fill={TEAL}
          opacity="0.18"
        />

        {/* Temporal lobe — inferior mid */}
        <path
          d="M178 250 C182 240 190 228 202 218
             C210 226 216 242 218 258 C214 272 206 282 196 286
             C184 278 178 264 178 250Z"
          fill="#c2772e"
          opacity="0.18"
        />

        {/* Parietal lobe — superior mid */}
        <path
          d="M310 120 C332 122 355 128 374 136
             C368 158 356 174 340 182 C322 172 308 152 310 120Z"
          fill="#5b8fa0"
          opacity="0.22"
        />

        {/* Occipital lobe — posterior */}
        <path
          d="M420 210 C436 232 448 256 450 278
             C438 290 424 302 410 310 C400 300 394 280 396 258
             C400 238 410 222 420 210Z"
          fill="#8b6fc2"
          opacity="0.18"
        />

        {/* ── Sulcal lines for realism ── */}
        <path d="M270 172 C280 190 286 210 284 232" fill="none" stroke="#cfe3e4" strokeWidth="1.2" />
        <path d="M340 182 C346 200 348 222 344 244" fill="none" stroke="#cfe3e4" strokeWidth="1.2" />
        <path d="M226 210 C238 220 252 228 262 240" fill="none" stroke="#cfe3e4" strokeWidth="1.2" />
        <path d="M380 158 C392 178 402 200 404 224" fill="none" stroke="#cfe3e4" strokeWidth="1.2" />

        {/* ── Label: Frontal lobe (top-left) ── */}
        <line x1="258" y1="138" x2="110" y2="80" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="10" y="30" width="180" height="50" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="20" y="50" fontSize="12.5" fontWeight="700" fill={INK}>Frontal lobe</text>
        <text x="20" y="64" fontSize="10.5" fill={SUB}>Executive · attention · mood</text>
        <text x="20" y="76" fontSize="10" fill="#c2772e">→ Fog · lability</text>

        {/* ── Label: Temporal lobe (left mid) ── */}
        <line x1="190" y1="256" x2="110" y2="218" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="10" y="188" width="175" height="50" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="20" y="208" fontSize="12.5" fontWeight="700" fill={INK}>Temporal lobe</text>
        <text x="20" y="222" fontSize="10.5" fill={SUB}>Memory · emotion</text>
        <text x="20" y="234" fontSize="10" fill="#c2772e">→ Memory gaps · irritability</text>

        {/* ── Label: Parietal lobe (top centre-right) ── */}
        <line x1="342" y1="138" x2="390" y2="60" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="330" y="14" width="190" height="50" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="340" y="34" fontSize="12.5" fontWeight="700" fill={INK}>Parietal lobe</text>
        <text x="340" y="48" fontSize="10.5" fill={SUB}>Sensory integration · spatial</text>
        <text x="340" y="60" fontSize="10" fill="#c2772e">→ Sensory overload</text>

        {/* ── Label: Occipital lobe (right) ── */}
        <line x1="436" y1="256" x2="558" y2="200" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="560" y="170" width="200" height="50" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="570" y="190" fontSize="12.5" fontWeight="700" fill={INK}>Occipital lobe</text>
        <text x="570" y="204" fontSize="10.5" fill={SUB}>Vision · light processing</text>
        <text x="570" y="216" fontSize="10" fill="#c2772e">→ Photophobia · visual blur</text>

        {/* ── Label: Cerebellum (bottom right) ── */}
        <line x1="428" y1="350" x2="558" y2="340" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="560" y="314" width="200" height="50" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="570" y="334" fontSize="12.5" fontWeight="700" fill={INK}>Cerebellum</text>
        <text x="570" y="348" fontSize="10.5" fill={SUB}>Balance · motor coordination</text>
        <text x="570" y="360" fontSize="10" fill="#c2772e">→ Dizziness · unsteady gait</text>

        {/* ── Label: Brainstem (bottom left) ── */}
        <line x1="288" y1="368" x2="180" y2="390" stroke={TEAL} strokeWidth="1.4" markerEnd="url(#br-arrow)" />
        <rect x="10" y="368" width="200" height="52" rx="8" fill="white" stroke="#cfe3e4" strokeWidth="1" />
        <text x="20" y="388" fontSize="12.5" fontWeight="700" fill={INK}>Brainstem</text>
        <text x="20" y="402" fontSize="10.5" fill={SUB}>Autonomic · arousal · nausea</text>
        <text x="20" y="414" fontSize="10" fill="#c2772e">→ Fatigue · nausea · exercise intolerance</text>

        {/* ── Orientation label ── */}
        <text x="160" y="446" fontSize="10" fill={SUB} textAnchor="middle">← Anterior</text>
        <text x="440" y="446" fontSize="10" fill={SUB} textAnchor="middle">Posterior →</text>
        <line x1="80" y1="440" x2="510" y2="440" stroke="#cfe3e4" strokeWidth="1" strokeDasharray="4 3" />
        <text x="310" y="446" fontSize="9.5" fill="#aac8cb" textAnchor="middle">Right lateral view</text>
      </svg>
    </InfographicFrame>
  )
}
