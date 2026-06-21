import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'
const AMBER = '#c2772e'

/**
 * Module 6 — the 6-stage graded return-to-sport ladder (Amsterdam 2023).
 * Ascending steps; stages 1–4 are AEP-delivered (teal), a medical-clearance
 * gate sits before stage 5, and stages 5–6 are medically gated (ink).
 */
export function GradedReturnToSport() {
  const stages = [
    { n: 1, t: 'Symptom-limited activity', gated: false },
    { n: 2, t: 'Light aerobic exercise', gated: false },
    { n: 3, t: 'Sport-specific exercise', gated: false },
    { n: 4, t: 'Non-contact training', gated: false },
    { n: 5, t: 'Full-contact practice', gated: true },
    { n: 6, t: 'Return to sport', gated: true },
  ]
  const bw = 116
  const xstep = 124
  const x0 = 24
  const bottom = 372
  const rise = 40
  const topAt = (i: number) => bottom - 92 - i * rise

  return (
    <InfographicFrame
      eyebrow="Module 6 · Graded return to sport (Amsterdam 2023)"
      title="The 6-stage return-to-sport ladder"
      ariaLabel="An ascending six-step ladder. Stage 1 symptom-limited activity, stage 2 light aerobic exercise, stage 3 sport-specific exercise, and stage 4 non-contact training are all delivered by the exercise physiologist. A medical-clearance gate then sits between stage 4 and stage 5. Stage 5 full-contact practice and stage 6 return to sport are medically gated and require clearance. A minimum of 24 hours symptom-free is required between every step, dropping back a stage if symptoms recur."
      caption="The AEP delivers stages 1–4 and brings the athlete to the gate in peak condition; medical clearance is required before stages 5–6. Minimum 24 h symptom-free between steps."
    >
      <svg viewBox="0 0 800 430" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>The six-stage graded return-to-sport ladder</title>

        {/* 24h rule banner */}
        <rect x="24" y="14" width="752" height="34" rx="11" fill="#e7f2f3" stroke="#cfe3e4" />
        <text x="400" y="36" textAnchor="middle" fontSize="12.5" fill={INK}>
          <tspan fontWeight="800" fill={TEAL}>≥ 24 h</tspan> symptom-free at each step before progressing — symptoms recur → drop back a stage
        </text>

        {/* steps */}
        {stages.map((s, i) => {
          const x = x0 + i * xstep
          const top = topAt(i)
          const fill = s.gated ? INK : TEAL
          const sub = s.gated ? '#9fc4c6' : '#cfe9ea'
          // wrap title into up to two lines
          const words = s.t.split(' ')
          const mid = Math.ceil(words.length / 2)
          const line1 = words.slice(0, mid).join(' ')
          const line2 = words.slice(mid).join(' ')
          return (
            <g key={s.n}>
              <rect x={x} y={top} width={bw} height={bottom - top} rx="12" fill={fill} />
              <circle cx={x + bw / 2} cy={top + 26} r="15" fill="#ffffff" />
              <text x={x + bw / 2} y={top + 31} textAnchor="middle" fontSize="15" fontWeight="800" fill={fill}>{s.n}</text>
              <text x={x + bw / 2} y={top + 56} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#ffffff">{line1}</text>
              <text x={x + bw / 2} y={top + 71} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#ffffff">{line2}</text>
              <text x={x + bw / 2} y={bottom - 12} textAnchor="middle" fontSize="9.5" fill={sub}>{s.gated ? 'medically gated' : 'AEP delivers'}</text>
            </g>
          )
        })}

        {/* clearance gate between stage 4 (i=3) and stage 5 (i=4) */}
        {(() => {
          const gx = x0 + 4 * xstep - 4 // left edge of stage 5
          const gyTop = topAt(4)
          return (
            <g>
              <line x1={gx} y1={gyTop - 26} x2={gx} y2={bottom} stroke={AMBER} strokeWidth="2.5" strokeDasharray="5 4" />
              {/* lock */}
              <g transform={`translate(${gx - 16} ${gyTop - 54})`}>
                <rect x="0" y="12" width="32" height="22" rx="4" fill={AMBER} />
                <path d="M6 12 v-5 a10 10 0 0 1 20 0 v5" fill="none" stroke={AMBER} strokeWidth="3" />
                <circle cx="16" cy="22" r="3" fill="#ffffff" />
              </g>
              <text x={gx} y={gyTop - 60} textAnchor="middle" fontSize="11" fontWeight="800" fill="#a8631f">Medical clearance</text>
            </g>
          )
        })()}

        {/* legend */}
        <g>
          <rect x="24" y="396" width="16" height="16" rx="4" fill={TEAL} />
          <text x="48" y="409" fontSize="12" fill={INK}>AEP delivers (stages 1–4)</text>
          <rect x="250" y="396" width="16" height="16" rx="4" fill={INK} />
          <text x="274" y="409" fontSize="12" fill={INK}>Medical clearance gates 5–6</text>
          <text x="520" y="409" fontSize="11.5" fill={SUB}>Back to normal school/work before resuming contact</text>
        </g>
      </svg>
    </InfographicFrame>
  )
}
