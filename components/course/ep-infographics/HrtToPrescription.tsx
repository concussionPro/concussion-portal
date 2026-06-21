import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'
const AMBER = '#c2772e'

/**
 * Module 3/4 — converting HRt into the sub-symptom-threshold training band.
 * Input (HRt) → ×80–90% band on a HR gauge → FITT dose, with the ≥2-point
 * symptom stop-rule as the governing strip beneath.
 */
export function HrtToPrescription() {
  // gauge geometry — track from 0 to ~170 bpm mapped across the gauge width
  const gx = 210
  const gw = 300
  const maxBpm = 170
  const bpmToX = (b: number) => gx + (b / maxBpm) * gw
  const zoneL = bpmToX(120)
  const zoneR = bpmToX(135)
  const threshX = bpmToX(150)

  return (
    <InfographicFrame
      eyebrow="Module 3–4 · From threshold to dose"
      title="HRt → the sub-symptom-threshold training band"
      ariaLabel="Input to dose diagram. The heart rate at symptom threshold, HRt, of 150 beats per minute is multiplied by 80 to 90 percent to set a training band of 120 to 135 beats per minute, shown as a highlighted zone on a heart-rate gauge sitting just below the 150 threshold line. That band becomes a FITT prescription: frequency most days, 5 to 7 sessions a week; intensity 80 to 90 percent of HRt; time about 20 minutes continuous; type walking, stationary cycling or treadmill. The governing rule beneath: if symptoms rise 2 or more points, ease off regardless of heart rate."
      caption="The test result personalises the dose: train inside an 80–90% band that loads the system without crossing the symptom ceiling."
    >
      <svg viewBox="0 0 760 380" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>Converting HRt into the training band and FITT prescription</title>
        <defs>
          <marker id="hrt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={TEAL} />
          </marker>
        </defs>

        {/* INPUT card */}
        <rect x="24" y="44" width="150" height="120" rx="16" fill={INK} />
        <text x="99" y="78" textAnchor="middle" fontSize="12" fontWeight="700" fill="#cfe9ea" letterSpacing="0.5">HRt</text>
        <text x="99" y="116" textAnchor="middle" fontSize="34" fontWeight="800" fill="#ffffff">150</text>
        <text x="99" y="136" textAnchor="middle" fontSize="12" fill="#cfe9ea">bpm</text>
        <text x="99" y="154" textAnchor="middle" fontSize="10.5" fill="#9fc4c6">symptom threshold</text>

        {/* ×80–90% connector */}
        <line x1="178" y1="104" x2="206" y2="104" stroke={TEAL} strokeWidth="2.5" markerEnd="url(#hrt-arrow)" />
        <text x="192" y="92" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={TEAL}>× 80–90%</text>

        {/* gauge */}
        <text x={gx} y="44" fontSize="11.5" fontWeight="700" fill={SUB}>Heart-rate gauge</text>
        <rect x={gx} y="78" width={gw} height="22" rx="11" fill="#eef4f4" stroke="#cfe3e4" />
        <rect x={zoneL} y="78" width={zoneR - zoneL} height="22" rx="11" fill={TEAL} />
        {/* threshold marker */}
        <line x1={threshX} y1="66" x2={threshX} y2="112" stroke={AMBER} strokeWidth="2" strokeDasharray="4 3" />
        <text x={threshX} y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill={AMBER}>150 · threshold</text>
        {/* band label */}
        <text x={(zoneL + zoneR) / 2} y="132" textAnchor="middle" fontSize="14" fontWeight="800" fill={TEAL}>120–135 bpm</text>
        <text x={(zoneL + zoneR) / 2} y="150" textAnchor="middle" fontSize="11" fill={SUB}>target training band</text>

        {/* connector to FITT */}
        <line x1={gx + gw} y1="89" x2={gx + gw + 24} y2="89" stroke={TEAL} strokeWidth="2.5" markerEnd="url(#hrt-arrow)" />

        {/* FITT card */}
        <rect x={gx + gw + 26} y="44" width="186" height="200" rx="16" fill="#e7f2f3" stroke={TEAL} />
        <text x={gx + gw + 46} y="72" fontSize="13" fontWeight="800" fill={TEAL}>FITT DOSE</text>
        {[
          { k: 'F', v: 'Most days · 5–7 / wk' },
          { k: 'I', v: '80–90% of HRt' },
          { k: 'T', v: '~20 min continuous' },
          { k: 'T', v: 'Walk · bike · treadmill' },
        ].map((row, i) => (
          <g key={i}>
            <circle cx={gx + gw + 54} cy={102 + i * 34} r="12" fill={TEAL} />
            <text x={gx + gw + 54} y={106 + i * 34} textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff">{row.k}</text>
            <text x={gx + gw + 74} y={106 + i * 34} fontSize="12" fill={INK}>{row.v}</text>
          </g>
        ))}

        {/* stop-rule strip */}
        <rect x="24" y="296" width="712" height="52" rx="14" fill="#f0e6d9" stroke={AMBER} />
        <text x="48" y="320" fontSize="13" fontWeight="800" fill="#a8631f">STOP RULE</text>
        <text x="140" y="320" fontSize="12.5" fill={INK}>Symptoms rise ≥ 2 points → ease off — the symptom always overrides the number.</text>
        <text x="48" y="338" fontSize="11" fill={SUB}>Start nearer 80% if highly symptomatic or deconditioned; 90% if tolerating exertion well.</text>
      </svg>
    </InfographicFrame>
  )
}
