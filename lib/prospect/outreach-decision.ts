/**
 * Outreach decision engine (Zac 2026-06-14).
 *
 * Given a prospect's REAL, scanner-proof engagement signals (which pitch-page
 * sections they viewed + how long + whether they opened the trial), decide
 * whether their behaviour warrants Zac stepping in with a PERSONAL email NOW,
 * or whether they should keep flowing through the automated T1→T2→T3 nurture.
 *
 * The principle: Zac's warm, personal outreach converts; the automated
 * sequence keeps cold-but-not-dead prospects warm cheaply. So we only escalate
 * to "direct" when the data shows genuine buying intent — and we say WHY, and
 * why the others are better left in nurture.
 *
 * Pure + dependency-free → unit-testable and reusable by the daily report
 * email, the admin hot-leads panel, and the intent-aware nurture copy.
 */

/** Section ids tracked on the pitch page (data-track-section values). */
export type SectionFunnel = Record<string, number>

export interface EngagementSignals {
  /** section id → view count, from scanner-proof portal section_view events. */
  sectionFunnel: SectionFunnel
  /** Longest single-session dwell in ms (from the exit beacon). */
  maxDwellMs: number
  /** Distinct real sessions (a return visit is a strong signal). */
  sessions?: number
}

export type OutreachAction = 'direct' | 'nurture'

export interface OutreachDecision {
  action: OutreachAction
  /** 0-100 — higher = hotter. Drives sort order in the report/panel. */
  score: number
  /** Plain-English why, written for Zac. */
  reason: string
  /** The high-intent signals that fired (for chips/summaries). */
  signals: string[]
  /** True once the trial was actually opened — the strongest single signal. */
  openedTrial: boolean
}

// Sections that indicate buying intent, weighted by how much they signal it.
// pricing + trial + next-step are the "ready to talk" tier; the others are
// supporting interest.
const INTENT_WEIGHTS: Record<string, number> = {
  pricing: 30,            // looking at cost = evaluating the purchase
  'module-1-trial': 30,   // opened the actual product = deep intent
  'next-step': 25,        // hit the "what's next / book" CTA
  'individual-signup': 18,
  'onsite-hero': 12,      // engaged the tier-specific offer
  'toolkit-callout': 10,
  'trial-cta': 10,        // viewed (not opened) the trial section
  'learning-suite': 15,   // navigated INTO the learning area
  'toolkit-pack': 12,     // navigated INTO the toolkit
}

// The "sales-ready" sections — any one of these alone justifies a personal note.
const SALES_READY = new Set(['pricing', 'module-1-trial', 'next-step', 'learning-suite', 'toolkit-pack'])

// Friendly labels for reasons/chips.
const LABEL: Record<string, string> = {
  pricing: 'Pricing',
  'module-1-trial': 'opened the trial',
  'next-step': 'Next-step CTA',
  'individual-signup': 'signup',
  'onsite-hero': 'on-site offer',
  'toolkit-callout': 'toolkit',
  'trial-cta': 'trial CTA',
  'learning-suite': 'learning suite',
  'toolkit-pack': 'toolkit pack',
}

const DIRECT_SCORE_THRESHOLD = 25

/**
 * Decide direct-vs-nurture from engagement signals. Pure.
 */
export function decideOutreach(sig: EngagementSignals): OutreachDecision {
  const funnel = sig.sectionFunnel ?? {}
  const dwellS = Math.round((sig.maxDwellMs ?? 0) / 1000)
  const sessions = sig.sessions ?? 1
  const openedTrial = (funnel['module-1-trial'] ?? 0) > 0

  // Score = weighted sum of intent sections (capped per section so a single
  // re-viewed section can't dominate) + dwell bonus + return-visit bonus.
  let score = 0
  const fired: string[] = []
  for (const [section, weight] of Object.entries(INTENT_WEIGHTS)) {
    const views = funnel[section] ?? 0
    if (views > 0) {
      // diminishing returns on repeat views: full weight + 20% per extra view, capped
      score += Math.min(weight * 1.6, weight + (views - 1) * weight * 0.2)
      fired.push(section)
    }
  }
  if (dwellS >= 60) score += 20
  else if (dwellS >= 30) score += 12
  else if (dwellS >= 10) score += 5
  if (sessions >= 2) score += 12 // came back — high intent
  score = Math.min(100, Math.round(score))

  // Sales-ready sections present?
  const salesReady = fired.filter((s) => SALES_READY.has(s))
  const action: OutreachAction = score >= DIRECT_SCORE_THRESHOLD ? 'direct' : 'nurture'

  // Build the human reason.
  const reason = buildReason({ action, salesReady, fired, dwellS, sessions, openedTrial })

  // Signals list = the sales-ready ones first (named), for chips.
  const signals = [...salesReady, ...fired.filter((s) => !SALES_READY.has(s))].map((s) => LABEL[s] ?? s)

  return { action, score, reason, signals, openedTrial }
}

function buildReason(p: {
  action: OutreachAction
  salesReady: string[]
  fired: string[]
  dwellS: number
  sessions: number
  openedTrial: boolean
}): string {
  const { action, salesReady, fired, dwellS, sessions, openedTrial } = p
  const named = salesReady.map((s) => LABEL[s] ?? s)

  if (action === 'direct') {
    const bits: string[] = []
    if (openedTrial) bits.push('opened the Module 1 trial')
    const otherReady = named.filter((n) => n !== 'opened the trial')
    if (otherReady.length) bits.push(`viewed ${otherReady.join(' + ')}`)
    if (sessions >= 2) bits.push(`came back ${sessions}×`)
    if (dwellS >= 30) bits.push(`${dwellS}s on the page`)
    const why = bits.length ? bits.join(', ') : `${fired.length} sections, ${dwellS}s`
    return `Reach out personally — ${why}. Buying intent is clear; a warm note converts far better than another sequenced email.`
  }

  // nurture
  if (dwellS < 10 && fired.length <= 1) {
    return `Keep in nurture — only skimmed (${dwellS}s), didn't reach pricing or the trial. Too early for a personal note; let the sequence warm them.`
  }
  if (!salesReady.length) {
    return `Keep in nurture — engaged (${dwellS}s) but didn't hit pricing, the trial or next-step. Interested, not yet sales-ready; the follow-up keeps them moving.`
  }
  return `Keep in nurture — light touch on ${named.join(' + ')} (${dwellS}s). Some signal but not enough to interrupt; the sequence is the right next touch.`
}

/** Convenience: classify a batch + split into direct vs nurture, sorted hot-first. */
export function classifyBatch<T extends { engagement: EngagementSignals }>(
  rows: T[],
): { direct: Array<T & { decision: OutreachDecision }>; nurture: Array<T & { decision: OutreachDecision }> } {
  const decided = rows.map((r) => ({ ...r, decision: decideOutreach(r.engagement) }))
  decided.sort((a, b) => b.decision.score - a.decision.score)
  return {
    direct: decided.filter((d) => d.decision.action === 'direct'),
    nurture: decided.filter((d) => d.decision.action === 'nurture'),
  }
}
