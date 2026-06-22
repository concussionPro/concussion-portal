import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'
const AMBER = '#c2772e'

/**
 * Module 2 — cerebral autoregulation and neurovascular coupling.
 * Left: CBF vs CPP plot showing the normal autoregulatory plateau and the
 * post-concussion narrowed / right-shifted / pressure-passive curve.
 * Right: neurovascular coupling unit — neuron → astrocyte → arteriole —
 * with a post-concussion uncoupling callout.
 */
export function CbfAutoregulation() {
  // ── graph geometry ──────────────────────────────────────────────
  const ox = 80   // x-axis left (y-axis line)
  const oy = 280  // y-axis bottom (x-axis line)
  const pw = 310  // plot width
  const ph = 210  // plot height (upward)

  const f = (n: number) => n.toFixed(1)
  // CPP 40–160 mmHg → x pixel
  const tx = (cpp: number) => ox + ((cpp - 40) / 120) * pw
  // CBF 0–90 mL/100g/min → y pixel (inverted: higher CBF = lower y)
  const ty = (cbf: number) => oy - (cbf / 90) * ph

  // Normal autoregulation: flat low, transition to plateau at ~70 CPP,
  // plateau to ~126 CPP, then passive breakthrough.
  const normalPath = [
    `M${f(tx(40))},${f(ty(12))}`,
    `L${f(tx(62))},${f(ty(12))}`,
    `C${f(tx(70))},${f(ty(12))} ${f(tx(72))},${f(ty(50))} ${f(tx(75))},${f(ty(50))}`,
    `L${f(tx(125))},${f(ty(50))}`,
    `C${f(tx(136))},${f(ty(50))} ${f(tx(148))},${f(ty(73))} ${f(tx(160))},${f(ty(79))}`,
  ].join(' ')

  // Post-concussion: pressure-passive at low CPP, narrowed pseudo-plateau
  // at 95–120 that slopes upward (not flat = less autoregulation), then
  // steeper breakthrough — right-shifted relative to normal.
  const pcPath = [
    `M${f(tx(40))},${f(ty(5))}`,
    `L${f(tx(78))},${f(ty(5))}`,
    `C${f(tx(88))},${f(ty(5))} ${f(tx(95))},${f(ty(43))} ${f(tx(102))},${f(ty(43))}`,
    `L${f(tx(120))},${f(ty(52))}`,
    `C${f(tx(132))},${f(ty(57))} ${f(tx(148))},${f(ty(78))} ${f(tx(160))},${f(ty(84))}`,
  ].join(' ')

  // ── NVC section geometry ────────────────────────────────────────
  const nx = 440        // NVC section left x
  const nw = 338        // NVC section width
  const nc = nx + nw / 2  // NVC centre x
  const ni = nx + 36    // icon centre x

  return (
    <InfographicFrame
      eyebrow="Module 2 · Vascular physiology"
      title="Cerebral autoregulation &amp; neurovascular coupling"
      ariaLabel="Two-part diagram. Left: a plot of cerebral blood flow (mL per 100 g per minute) on the y-axis against cerebral perfusion pressure (mmHg) on the x-axis. A teal curve shows the normal autoregulatory plateau where CBF stays flat near 50 between CPP 70 and 126, then rises steeply outside that range. An amber dashed curve shows the post-concussion state: the pseudo-plateau is narrowed to roughly CPP 95–120, right-shifted, and slopes gently upward rather than being flat, indicating residual pressure-passive flow throughout. Right: the neurovascular coupling unit as three stacked boxes. Box one: Neuron, fires action potential and releases glutamate, raising local metabolic demand. Box two: Astrocyte, detects potassium accumulation and glutamate via endfeet, then releases nitric oxide and prostaglandins. Box three: Arteriole, smooth muscle relaxes and lumen widens to raise local CBF. An amber callout below states: post-concussion uncoupled — astrocyte–arteriole signalling is disrupted so local CBF fails to match metabolic demand, deepening the energy crisis."
      caption="Post-concussion, the autoregulatory plateau narrows and right-shifts — and disrupted neurovascular coupling means local blood flow can no longer reliably follow metabolic demand, compounding the neurometabolic energy crisis."
    >
      <svg viewBox="0 0 800 390" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>Cerebral autoregulation curves and neurovascular coupling unit</title>
        <defs>
          <marker id="cbf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={TEAL} />
          </marker>
          <linearGradient id="cbf-nvc-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6fafa" />
            <stop offset="1" stopColor="#eef4f4" />
          </linearGradient>
        </defs>

        {/* ══ LEFT: autoregulation graph ══ */}

        {/* shaded normal autoregulatory plateau band */}
        <rect
          x={f(tx(75))} y={f(ty(50))}
          width={f(tx(125) - tx(75))} height={f(oy - ty(50))}
          fill={TEAL} fillOpacity="0.07"
        />

        {/* axes */}
        <line x1={ox} y1={oy} x2={ox + pw} y2={oy} stroke="#cfe3e4" strokeWidth="1.5" />
        <line x1={ox} y1={oy} x2={ox} y2={oy - ph} stroke="#cfe3e4" strokeWidth="1.5" />

        {/* Y-axis grid + ticks + labels */}
        {[0, 25, 50, 75].map((cbf) => (
          <g key={cbf}>
            <line x1={ox} y1={f(ty(cbf))} x2={ox + pw} y2={f(ty(cbf))} stroke="#cfe3e4" strokeWidth="1" strokeDasharray={cbf === 0 ? 'none' : '4 4'} />
            <line x1={ox - 5} y1={f(ty(cbf))} x2={ox} y2={f(ty(cbf))} stroke="#cfe3e4" strokeWidth="1.5" />
            <text x={ox - 8} y={f(ty(cbf) + 4)} textAnchor="end" fontSize="10" fill={SUB}>{cbf}</text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x="22" y={f(oy - ph / 2)}
          textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SUB}
          transform={`rotate(-90 22 ${f(oy - ph / 2)})`}
        >
          CBF (mL/100g/min)
        </text>

        {/* X-axis ticks + labels */}
        {[60, 80, 100, 120, 140, 160].map((cpp) => (
          <g key={cpp}>
            <line x1={f(tx(cpp))} y1={oy} x2={f(tx(cpp))} y2={oy + 5} stroke="#cfe3e4" strokeWidth="1.5" />
            <text x={f(tx(cpp))} y={oy + 16} textAnchor="middle" fontSize="10" fill={SUB}>{cpp}</text>
          </g>
        ))}
        <text x={f(ox + pw / 2)} y={oy + 32} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SUB}>
          Cerebral Perfusion Pressure (mmHg)
        </text>

        {/* normal curve */}
        <path d={normalPath} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinejoin="round" />

        {/* post-concussion curve */}
        <path d={pcPath} fill="none" stroke={AMBER} strokeWidth="2.5" strokeDasharray="8 4" strokeLinejoin="round" />

        {/* graph title */}
        <text x={f(ox + pw / 2)} y={oy - ph - 14} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={INK}>
          Autoregulation Curves
        </text>

        {/* legend */}
        <line x1={ox + 4} y1={oy - ph + 18} x2={ox + 28} y2={oy - ph + 18} stroke={TEAL} strokeWidth="2.5" />
        <text x={ox + 32} y={oy - ph + 22} fontSize="10.5" fill={INK}>Normal</text>
        <line x1={ox + 4} y1={oy - ph + 36} x2={ox + 28} y2={oy - ph + 36} stroke={AMBER} strokeWidth="2.5" strokeDasharray="8 4" />
        <text x={ox + 32} y={oy - ph + 40} fontSize="10.5" fill={INK}>Post-concussion</text>

        {/* plateau annotation */}
        <text x={f(tx(100))} y={f(ty(50) - 9)} textAnchor="middle" fontSize="10" fontWeight="700" fill={TEAL}>plateau</text>

        {/* post-concussion annotation */}
        <text x={f(tx(108))} y={f(ty(6))} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={AMBER}>narrowed + right-shifted</text>

        {/* pressure-passive annotation on left slope */}
        <text x={f(tx(54))} y={f(ty(28))} textAnchor="middle" fontSize="9" fill={SUB} fontStyle="italic">pressure-passive</text>

        {/* lower limit dashed marker (normal) */}
        <line x1={f(tx(75))} y1={f(ty(50) - 4)} x2={f(tx(75))} y2={oy} stroke="#cfe3e4" strokeWidth="1" strokeDasharray="3 4" />
        {/* upper limit dashed marker (normal) */}
        <line x1={f(tx(125))} y1={f(ty(50) - 4)} x2={f(tx(125))} y2={oy} stroke="#cfe3e4" strokeWidth="1" strokeDasharray="3 4" />

        {/* ══ RIGHT: Neurovascular Coupling ══ */}

        {/* section heading */}
        <text x={nc} y={26} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={INK}>
          Neurovascular Coupling
        </text>
        <line x1={nx} y1={33} x2={nx + nw} y2={33} stroke="#cfe3e4" strokeWidth="1" />

        {/* ── Box 1: Neuron ── */}
        <rect x={nx} y={40} width={nw} height={62} rx="13" fill="url(#cbf-nvc-bg)" stroke={TEAL} strokeWidth="1.5" />
        {/* icon: filled circle with lightning-bolt path */}
        <circle cx={ni} cy={71} r={18} fill={TEAL} />
        <path
          d="M2,-9 L-4,0 L0,0 L-3,9 L4,0 L0,0 Z"
          fill="#ffffff"
          transform={`translate(${ni} 71)`}
        />
        <text x={ni + 28} y={63} fontSize="13" fontWeight="800" fill={INK}>Neuron</text>
        <text x={ni + 28} y={79} fontSize="11" fill={SUB}>fires action potential · releases glutamate</text>
        <text x={ni + 28} y={94} fontSize="11" fill={SUB}>→ local metabolic demand rises</text>

        {/* connector 1 → 2 */}
        <line x1={nc} y1={104} x2={nc} y2={118} stroke={TEAL} strokeWidth="2" markerEnd="url(#cbf-arrow)" />
        <text x={nc + 8} y={113} fontSize="9.5" fill={SUB}>endfeet contact</text>

        {/* ── Box 2: Astrocyte ── */}
        <rect x={nx} y={120} width={nw} height={64} rx="13" fill="url(#cbf-nvc-bg)" stroke={TEAL} strokeWidth="1.5" />
        {/* icon: circle with radiating arms = astrocyte */}
        <circle cx={ni} cy={152} r={18} fill="#e7f2f3" stroke={TEAL} strokeWidth="1.5" />
        <line x1={ni} y1={135} x2={ni} y2={144} stroke={TEAL} strokeWidth="1.8" />
        <line x1={ni} y1={160} x2={ni} y2={169} stroke={TEAL} strokeWidth="1.8" />
        <line x1={ni - 18} y1={152} x2={ni - 10} y2={152} stroke={TEAL} strokeWidth="1.8" />
        <line x1={ni + 10} y1={152} x2={ni + 18} y2={152} stroke={TEAL} strokeWidth="1.8" />
        <line x1={ni - 12} y1={141} x2={ni - 6} y2={147} stroke={TEAL} strokeWidth="1.5" />
        <line x1={ni + 6} y1={157} x2={ni + 12} y2={163} stroke={TEAL} strokeWidth="1.5" />
        <circle cx={ni} cy={152} r={7} fill={TEAL} />
        <text x={ni + 28} y={144} fontSize="13" fontWeight="800" fill={INK}>Astrocyte</text>
        <text x={ni + 28} y={160} fontSize="11" fill={SUB}>detects K⁺ rise + glutamate via endfeet</text>
        <text x={ni + 28} y={175} fontSize="11" fill={SUB}>→ releases NO + prostaglandins (vasoactive)</text>

        {/* connector 2 → 3 */}
        <line x1={nc} y1={186} x2={nc} y2={200} stroke={TEAL} strokeWidth="2" markerEnd="url(#cbf-arrow)" />
        <text x={nc + 8} y={195} fontSize="9.5" fill={SUB}>vasoactive signal</text>

        {/* ── Box 3: Arteriole ── */}
        <rect x={nx} y={202} width={nw} height={62} rx="13" fill="url(#cbf-nvc-bg)" stroke={TEAL} strokeWidth="1.5" />
        {/* icon: vessel cross-section (concentric circles) */}
        <circle cx={ni} cy={233} r={18} fill="#e7f2f3" stroke={TEAL} strokeWidth="1.5" />
        <circle cx={ni} cy={233} r={11} fill="none" stroke={TEAL} strokeWidth="2.5" />
        <circle cx={ni} cy={233} r={4} fill={TEAL} />
        <text x={ni + 28} y={226} fontSize="13" fontWeight="800" fill={INK}>Arteriole</text>
        <text x={ni + 28} y={242} fontSize="11" fill={SUB}>smooth muscle relaxes · lumen widens</text>
        <text x={ni + 28} y={257} fontSize="11" fontWeight="700" fill={TEAL}>↑ local CBF matches metabolic demand</text>

        {/* ── Post-concussion uncoupled callout ── */}
        <rect x={nx} y={278} width={nw} height={86} rx="13" fill="#f0e6d9" stroke={AMBER} strokeWidth="1.5" />
        <text x={nx + 14} y={300} fontSize="12" fontWeight="800" fill="#a8631f">POST-CONCUSSION: UNCOUPLED</text>
        <text x={nx + 14} y={318} fontSize="11" fill={INK}>Astrocyte–arteriole signalling disrupted</text>
        <text x={nx + 14} y={334} fontSize="11" fill={INK}>Local CBF fails to match metabolic demand</text>
        <text x={nx + 14} y={350} fontSize="11" fill={SUB}>→ deepens the neurometabolic energy crisis</text>
      </svg>
    </InfographicFrame>
  )
}
