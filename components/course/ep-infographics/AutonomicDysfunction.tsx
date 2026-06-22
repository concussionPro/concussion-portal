import { InfographicFrame } from './InfographicFrame'

const INK = '#16282b'
const TEAL = '#0d7377'
const SUB = '#4a6a6e'
const AMBER = '#c2772e'
const AMBER_DARK = '#a8631f'

/**
 * Module 2–3 — post-concussion autonomic dysfunction.
 * Vertical flow: sympathovagal imbalance (↑ sympathetic / ↓ vagal) →
 * blunted baroreflex sensitivity → exercise intolerance, with HRt shown as
 * the ceiling that graded sub-symptom-threshold exercise works beneath.
 */
export function AutonomicDysfunction() {
  // ── layout constants ─────────────────────────────────────────
  const mx = 24    // left margin
  const cw = 712   // content width (760 – 2 × 24)
  const mid = mx + cw / 2  // horizontal centre = 380

  // Section y-positions
  const s1y = 18   // section 1: sympathovagal imbalance header
  const s1bY = 46  // two detail boxes start
  const s1bH = 86  // detail box height

  const arrowY1 = s1bY + s1bH + 4   // 136 → arrow top
  const arrowY1b = arrowY1 + 16      // 152 → arrow bottom

  const s2y = arrowY1b + 2           // 154 → baroreflex box
  const s2h = 60

  const arrowY2 = s2y + s2h + 4     // 218
  const arrowY2b = arrowY2 + 16     // 234

  const s3y = arrowY2b + 2          // 236 → three consequence boxes
  const s3h = 66

  const arrowY3 = s3y + s3h + 4     // 306
  const arrowY3b = arrowY3 + 16     // 322

  const s4y = arrowY3b + 2          // 324 → HRt ceiling strip
  const s4h = 90

  // Symmetrical two-box split (row 1)
  const halfW = (cw - 12) / 2       // 350
  const b1x = mx                    // 24
  const b2x = mx + halfW + 12       // 386

  // Three-box split (row 3)
  const thirdW = Math.floor((cw - 20) / 3)  // 230
  const c1x = mx, c2x = mx + thirdW + 10, c3x = mx + (thirdW + 10) * 2
  const c1w = thirdW, c2w = thirdW, c3w = cw - (thirdW + 10) * 2  // 232

  return (
    <InfographicFrame
      eyebrow="Module 2–3 · Autonomic physiology"
      title="Post-concussion autonomic dysfunction"
      ariaLabel="Vertical flow diagram with four sections. Section one: sympathovagal imbalance. Two side-by-side boxes. Left box (dark teal): sympathetic activation up — tonic excess sympathetic tone, resting tachycardia, heightened arousal and poor sleep. Right box (amber): vagal withdrawal down — reduced heart rate variability, impaired baroreflex sensitivity, blunted parasympathetic recovery. Section two: blunted baroreflex sensitivity. Baroreceptors fire but the reflex arc is dampened — heart rate and vascular tone fail to adjust proportionately to positional change or exertion, destabilising cerebral perfusion pressure. Section three: three consequence boxes. Orthostatic intolerance — heart rate rises more than 30 bpm on standing, causing dizziness. Heart rate dysregulation — exaggerated or blunted heart rate response to exertion. Exercise intolerance — symptoms are provoked below the normal exertion threshold; the symptom threshold heart rate HRt is the clinical ceiling. Section four: the HRt ceiling strip. A dashed line marks HRt at the top. Below it is the sub-symptom-threshold training zone where graded aerobic exercise at 80 to 90 percent of HRt retrains autonomic tone without provoking symptoms. Consistent aerobic work progressively raises HRt and restores sympathovagal balance."
      caption="Autonomic imbalance — excess sympathetic tone paired with vagal withdrawal — sets a low symptom ceiling (HRt). Graded sub-symptom aerobic exercise works beneath that ceiling to progressively restore balance."
    >
      <svg viewBox="0 0 760 430" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title>Post-concussion autonomic dysfunction flow diagram</title>
        <defs>
          <marker id="aut-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={TEAL} />
          </marker>
          <linearGradient id="aut-symp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#16282b" />
            <stop offset="1" stopColor="#0d5558" />
          </linearGradient>
        </defs>

        {/* ══ SECTION 1: Sympathovagal Imbalance ══ */}

        {/* header bar */}
        <rect x={mx} y={s1y} width={cw} height={24} rx="8" fill="#eef4f4" stroke="#cfe3e4" strokeWidth="1" />
        <text x={mid} y={s1y + 15.5} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={INK} letterSpacing="0.3">
          SYMPATHOVAGAL IMBALANCE
        </text>

        {/* LEFT: ↑ Sympathetic (dark) */}
        <rect x={b1x} y={s1bY} width={halfW} height={s1bH} rx="13" fill="url(#aut-symp)" />
        <text x={b1x + 16} y={s1bY + 22} fontSize="13.5" fontWeight="800" fill="#ffffff">↑ SYMPATHETIC</text>
        <text x={b1x + 16} y={s1bY + 40} fontSize="11" fill="#9fc4c6">Tonic excess sympathetic tone</text>
        <text x={b1x + 16} y={s1bY + 55} fontSize="11" fill="#9fc4c6">Resting tachycardia</text>
        <text x={b1x + 16} y={s1bY + 70} fontSize="11" fill="#9fc4c6">Heightened arousal · poor sleep</text>

        {/* RIGHT: ↓ Parasympathetic/Vagal (amber-tinted) */}
        <rect x={b2x} y={s1bY} width={halfW} height={s1bH} rx="13" fill="#f6efe6" stroke={AMBER} strokeWidth="1.5" />
        <text x={b2x + 16} y={s1bY + 22} fontSize="13.5" fontWeight="800" fill={AMBER_DARK}>↓ PARASYMPATHETIC (VAGAL)</text>
        <text x={b2x + 16} y={s1bY + 40} fontSize="11" fill={AMBER_DARK}>Vagal withdrawal</text>
        <text x={b2x + 16} y={s1bY + 55} fontSize="11" fill={AMBER_DARK}>Reduced heart rate variability (HRV)</text>
        <text x={b2x + 16} y={s1bY + 70} fontSize="11" fill={AMBER_DARK}>Blunted parasympathetic recovery</text>

        {/* connector 1 → 2 */}
        <line x1={mid} y1={arrowY1} x2={mid} y2={arrowY1b} stroke={TEAL} strokeWidth="2" markerEnd="url(#aut-arrow)" />
        <text x={mid + 10} y={arrowY1 + 11} fontSize="9.5" fill={SUB}>dampened cardiac autonomic control</text>

        {/* ══ SECTION 2: Blunted Baroreflex ══ */}
        <rect x={mx} y={s2y} width={cw} height={s2h} rx="13" fill="#eef4f4" stroke={TEAL} strokeWidth="1.5" />
        <text x={mid} y={s2y + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>BLUNTED BAROREFLEX SENSITIVITY</text>
        <text x={mid} y={s2y + 37} textAnchor="middle" fontSize="11" fill={SUB}>Baroreceptors fire but the reflex arc is dampened — HR and vascular resistance</text>
        <text x={mid} y={s2y + 51} textAnchor="middle" fontSize="11" fill={SUB}>fail to adjust proportionately to exertion or postural change, destabilising CPP</text>

        {/* connector 2 → 3 */}
        <line x1={mid} y1={arrowY2} x2={mid} y2={arrowY2b} stroke={TEAL} strokeWidth="2" markerEnd="url(#aut-arrow)" />
        <text x={mid + 10} y={arrowY2 + 11} fontSize="9.5" fill={SUB}>impaired cardiovascular regulation</text>

        {/* ══ SECTION 3: Consequences ══ */}

        {/* Box A: Orthostatic intolerance */}
        <rect x={c1x} y={s3y} width={c1w} height={s3h} rx="12" fill="#eef4f4" stroke="#cfe3e4" strokeWidth="1" />
        <text x={c1x + c1w / 2} y={s3y + 19} textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>Orthostatic Intolerance</text>
        <text x={c1x + c1w / 2} y={s3y + 36} textAnchor="middle" fontSize="10.5" fill={SUB}>HR ↑ &gt; 30 bpm on standing</text>
        <text x={c1x + c1w / 2} y={s3y + 51} textAnchor="middle" fontSize="10.5" fill={SUB}>dizziness · presyncope</text>

        {/* Box B: HR dysregulation */}
        <rect x={c2x} y={s3y} width={c2w} height={s3h} rx="12" fill="#eef4f4" stroke="#cfe3e4" strokeWidth="1" />
        <text x={c2x + c2w / 2} y={s3y + 19} textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>HR Dysregulation</text>
        <text x={c2x + c2w / 2} y={s3y + 36} textAnchor="middle" fontSize="10.5" fill={SUB}>Exaggerated or blunted</text>
        <text x={c2x + c2w / 2} y={s3y + 51} textAnchor="middle" fontSize="10.5" fill={SUB}>HR rise on exertion</text>

        {/* Box C: Exercise intolerance (highlighted) */}
        <rect x={c3x} y={s3y} width={c3w} height={s3h} rx="12" fill="#e7f2f3" stroke={TEAL} strokeWidth="1.5" />
        <text x={c3x + c3w / 2} y={s3y + 19} textAnchor="middle" fontSize="12" fontWeight="800" fill={TEAL}>Exercise Intolerance</text>
        <text x={c3x + c3w / 2} y={s3y + 36} textAnchor="middle" fontSize="10.5" fill={SUB}>Symptoms below normal</text>
        <text x={c3x + c3w / 2} y={s3y + 51} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={TEAL}>↓ HRt captures the ceiling</text>

        {/* connector 3 → 4 */}
        <line x1={mid} y1={arrowY3} x2={mid} y2={arrowY3b} stroke={TEAL} strokeWidth="2" markerEnd="url(#aut-arrow)" />
        <text x={mid + 10} y={arrowY3 + 11} fontSize="9.5" fill={SUB}>symptom threshold reached</text>

        {/* ══ SECTION 4: HRt Ceiling Strip ══ */}
        <rect x={mx} y={s4y} width={cw} height={s4h} rx="13" fill="#f6fafa" stroke="#cfe3e4" strokeWidth="1" />

        {/* symptom zone (above HRt) */}
        <rect x={mx} y={s4y} width={cw} height={26} rx="13" fill="#f0e6d9" />
        {/* flatten bottom corners of amber zone */}
        <rect x={mx} y={s4y + 13} width={cw} height={13} fill="#f0e6d9" />
        <text x={mx + 16} y={s4y + 17} fontSize="11" fontWeight="800" fill={AMBER_DARK}>SYMPTOM ZONE  (above HRt)</text>
        <text x={mx + cw - 16} y={s4y + 17} textAnchor="end" fontSize="10.5" fontWeight="800" fill={AMBER}>HRt</text>

        {/* HRt dashed ceiling line */}
        <line x1={mx} y1={s4y + 26} x2={mx + cw} y2={s4y + 26} stroke={AMBER} strokeWidth="2" strokeDasharray="8 4" />

        {/* sub-symptom zone */}
        <text x={mx + 16} y={s4y + 46} fontSize="12.5" fontWeight="800" fill={TEAL}>SUB-SYMPTOM-THRESHOLD TRAINING ZONE</text>
        <text x={mx + 16} y={s4y + 63} fontSize="11" fill={INK}>Graded aerobic exercise at 80–90% HRt — loads the system without crossing the symptom ceiling</text>
        <text x={mx + 16} y={s4y + 79} fontSize="11" fill={SUB}>Consistent work progressively raises HRt and restores sympathovagal balance over weeks</text>
      </svg>
    </InfographicFrame>
  )
}
