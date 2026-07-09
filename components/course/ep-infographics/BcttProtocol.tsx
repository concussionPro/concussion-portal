import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'
const AMBER = '#c2772e'

/**
 * Module 3 — the Buffalo Concussion Treadmill Test.
 * A rising Balke ramp (one bar per minute), the continuous HR/RPE/symptom
 * monitoring band, and the ≥3-point symptom-rise endpoint that captures HRt.
 */
export function BcttProtocol() {
  const bars = [0, 1, 2, 3, 4, 5, 6]
  const baseline = 312
  const x0 = 78
  const bw = 60
  const gap = 16
  const h = (i: number) => 30 + i * 30
  const flagIndex = 5 // minute at which symptom threshold is reached in this illustration

  return (
    <InfographicFrame
      eyebrow="Module 3 · The test that is the treatment"
      title="The Buffalo Concussion Treadmill Test (BCTT)"
      ariaLabel="Staged ramp diagram. Walking at about 5.4 km/h, the treadmill incline rises 1 degree each minute (then speed rises once incline maxes out), shown as bars of increasing workload across minutes 1 to 7. Every minute the clinician logs heart rate, rating of perceived exertion, and a 0 to 10 symptom score. The test stops when symptoms rise 3 or more points above baseline; the heart rate at that moment is captured as HRt, the symptom threshold — here illustrated at 148 beats per minute."
      caption="A controlled, near-linear ramp with monitoring every minute — the ≥3-point symptom rise pinpoints HRt, the single number that becomes the prescription."
    >
      <svg viewBox="0 0 760 430" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>The Buffalo Concussion Treadmill Test protocol</title>
        <defs>
          <linearGradient id="bctt-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d7377" />
            <stop offset="1" stopColor="#5b9aa6" />
          </linearGradient>
          <marker id="bctt-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={AMBER} />
          </marker>
        </defs>

        {/* monitoring band */}
        <rect x="60" y="20" width="640" height="40" rx="12" fill="#e7f2f3" stroke="#cfe3e4" />
        <text x="80" y="38" fontSize="12.5" fontWeight="800" fill={TEAL}>EVERY MINUTE →</text>
        <text x="200" y="38" fontSize="12.5" fill={INK}>log Heart Rate · RPE (Borg) · Symptom score (0–10)</text>
        <text x="80" y="52" fontSize="11" fill={SUB}>Belt never stops — readings taken on the move</text>

        {/* y axis label */}
        <text x="46" y="200" fontSize="11" fontWeight="700" fill={SUB} transform="rotate(-90 46 200)" textAnchor="middle">Workload (speed · incline ramp)</text>

        {/* baseline */}
        <line x1="60" y1={baseline} x2="700" y2={baseline} stroke="#cfe3e4" strokeWidth="1.5" />

        {/* bars */}
        {bars.map((i) => {
          const x = x0 + i * (bw + gap)
          const bh = h(i)
          const isFlag = i === flagIndex
          return (
            <g key={i}>
              <rect x={x} y={baseline - bh} width={bw} height={bh} rx="6" fill={isFlag ? '#f0e6d9' : 'url(#bctt-bar)'} stroke={isFlag ? AMBER : 'none'} strokeWidth={isFlag ? 1.5 : 0} />
              <text x={x + bw / 2} y={baseline + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>{i + 1}</text>
              <text x={x + bw / 2} y={baseline + 32} textAnchor="middle" fontSize="9.5" fill={SUB}>+{i + 1}°</text>
            </g>
          )
        })}
        <text x="380" y={baseline + 56} textAnchor="middle" fontSize="11" fontWeight="700" fill={SUB}>Time (minutes)</text>

        {/* threshold flag */}
        {(() => {
          const x = x0 + flagIndex * (bw + gap) + bw / 2
          return (
            <g>
              <text x={x} y={baseline - h(flagIndex) - 12} textAnchor="middle" fontSize="12" fontWeight="800" fill={AMBER}>▲ Symptoms +3</text>
              <line x1={x} y1={baseline - h(flagIndex) - 6} x2={x} y2={baseline - h(flagIndex) + 4} stroke={AMBER} strokeWidth="2" />
              <line x1={x} y1={baseline - h(flagIndex) / 2} x2="600" y2={baseline - h(flagIndex) / 2} stroke={AMBER} strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#bctt-arrow)" />
            </g>
          )
        })()}

        {/* HRt capture chip */}
        <rect x="592" y="244" width="150" height="60" rx="14" fill={INK} />
        <text x="667" y="268" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff">STOP → record HRt</text>
        <text x="667" y="288" textAnchor="middle" fontSize="11.5" fill="#cfe9ea">e.g. HRt = 148 bpm</text>
      </svg>
    </InfographicFrame>
  )
}
