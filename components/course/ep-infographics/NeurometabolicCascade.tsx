import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'

/**
 * Module 1 — the neurometabolic cascade as an energy crisis.
 * Vertical flow: mechanical force → ionic flux/glutamate → pump overdrive →
 * the demand-up / supply-down split → supply–demand mismatch → energy crisis.
 */
export function NeurometabolicCascade() {
  return (
    <InfographicFrame
      eyebrow="Module 1 · Pathophysiology"
      title="The neurometabolic cascade — the brain's energy crisis"
      ariaLabel="Flow diagram. Step 1 mechanical force stretches membranes and forces ion channels open. Step 2 ionic flux: potassium floods out, calcium floods in, glutamate is released causing excitotoxicity. Step 3 the sodium-potassium pumps go into overdrive to reset the gradient. This splits into two: energy demand rises through hyperglycolysis while energy supply falls as cerebral blood flow drops. The two converge into a supply-demand mismatch where peak demand meets reduced delivery and lactate rises. The result is an energy crisis and window of vulnerability, in which cognitive and physical exertion draw on one depleted budget."
      caption="After impact, fuel demand spikes at the exact moment blood-flow supply falls — that mismatch is the vulnerability window an EP trains within."
    >
      <svg viewBox="0 0 720 540" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>The neurometabolic cascade of concussion</title>
        <defs>
          <marker id="nm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={TEAL} />
          </marker>
          <linearGradient id="nm-crisis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d7377" />
            <stop offset="1" stopColor="#16282b" />
          </linearGradient>
        </defs>

        {/* Steps 1–3 */}
        {[
          { n: '1', y: 16, t: 'Mechanical force', s: 'Membranes stretch · ion channels forced open' },
          { n: '2', y: 88, t: 'Ionic flux + glutamate', s: 'K⁺ out · Ca²⁺ in · glutamate flood (excitotoxicity)' },
          { n: '3', y: 160, t: 'Pumps in overdrive', s: 'Na⁺/K⁺-ATPase fires hard to reset the gradient' },
        ].map((step) => (
          <g key={step.n}>
            <rect x="80" y={step.y} width="560" height="56" rx="14" fill="#eef4f4" stroke="#cfe3e4" />
            <circle cx="112" cy={step.y + 28} r="17" fill={TEAL} />
            <text x="112" y={step.y + 33} textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffffff">{step.n}</text>
            <text x="146" y={step.y + 24} fontSize="15" fontWeight="700" fill={INK}>{step.t}</text>
            <text x="146" y={step.y + 43} fontSize="12" fill={SUB}>{step.s}</text>
          </g>
        ))}

        {/* connectors between steps */}
        <line x1="360" y1="72" x2="360" y2="86" stroke={TEAL} strokeWidth="2" markerEnd="url(#nm-arrow)" />
        <line x1="360" y1="144" x2="360" y2="158" stroke={TEAL} strokeWidth="2" markerEnd="url(#nm-arrow)" />

        {/* split to demand / supply */}
        <path d="M360 216 L360 234 L222 234 L222 250" fill="none" stroke={TEAL} strokeWidth="2" markerEnd="url(#nm-arrow)" />
        <path d="M360 216 L360 234 L498 234 L498 250" fill="none" stroke={TEAL} strokeWidth="2" markerEnd="url(#nm-arrow)" />

        {/* demand card */}
        <rect x="80" y="252" width="284" height="66" rx="14" fill="#e7f2f3" stroke={TEAL} />
        <text x="100" y="282" fontSize="13.5" fontWeight="800" fill={TEAL}>ENERGY DEMAND ↑</text>
        <text x="100" y="303" fontSize="12" fill={SUB}>Hyperglycolysis — glucose &amp; ATP burn spike</text>

        {/* supply card */}
        <rect x="384" y="252" width="256" height="66" rx="14" fill="#f1eee9" stroke="#c2772e" />
        <text x="404" y="282" fontSize="13.5" fontWeight="800" fill="#a8631f">ENERGY SUPPLY ↓</text>
        <text x="404" y="303" fontSize="12" fill={SUB}>Cerebral blood flow falls</text>

        {/* converge to mismatch */}
        <path d="M222 318 L222 338 L360 338 L360 352" fill="none" stroke={TEAL} strokeWidth="2" />
        <path d="M512 318 L512 338 L360 338" fill="none" stroke={TEAL} strokeWidth="2" markerEnd="url(#nm-arrow)" />

        {/* mismatch card */}
        <rect x="150" y="354" width="420" height="58" rx="14" fill="#dcebd0" opacity="0" />
        <rect x="150" y="354" width="420" height="58" rx="14" fill="#fff" stroke="#c2772e" strokeWidth="1.5" />
        <text x="360" y="380" textAnchor="middle" fontSize="14" fontWeight="800" fill="#a8631f">SUPPLY–DEMAND MISMATCH</text>
        <text x="360" y="399" textAnchor="middle" fontSize="12" fill={SUB}>Peak demand meets reduced delivery · lactate rises</text>

        <line x1="360" y1="412" x2="360" y2="440" stroke={TEAL} strokeWidth="2.5" markerEnd="url(#nm-arrow)" />

        {/* crisis card */}
        <rect x="120" y="442" width="480" height="78" rx="16" fill="url(#nm-crisis)" />
        <text x="360" y="476" textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff" letterSpacing="0.5">ENERGY CRISIS · VULNERABILITY WINDOW</text>
        <text x="360" y="499" textAnchor="middle" fontSize="12.5" fill="#cfe9ea">Cognitive + physical exertion share one depleted budget</text>
      </svg>
    </InfographicFrame>
  )
}
