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

/**
 * Decide direct-vs-nurture from engagement signals. Pure.
 *
 * THRESHOLD MODEL (Zac 2026-06-14): a manual email from Zac is the CLOSE, not a
 * nudge — the dashboard already pitches the product, so a personal note only
 * adds value once a prospect is genuinely WARM. Initial interest (a single
 * pricing view, a browse) is NOT warm — the intent-aware T2 handles that and we
 * WAIT for the real buy signal: a return visit. 'direct' fires only on a
 * genuine buying signal worth Zac's time.
 */
export function decideOutreach(sig: EngagementSignals): OutreachDecision {
  const funnel = sig.sectionFunnel ?? {}
  const dwellS = Math.round((sig.maxDwellMs ?? 0) / 1000)
  const sessions = sig.sessions ?? 1
  const openedTrial = (funnel['module-1-trial'] ?? 0) > 0
  const sawPricing = (funnel['pricing'] ?? 0) > 0
  const hitNextStep = (funnel['next-step'] ?? 0) > 0
  const returned = sessions >= 2

  const fired: string[] = []
  for (const section of Object.keys(INTENT_WEIGHTS)) {
    if ((funnel[section] ?? 0) > 0) fired.push(section)
  }
  const salesReady = fired.filter((s) => SALES_READY.has(s))

  // ── The 'direct' gate — only genuine buying signals (the CLOSE) ──────────
  //  • RETURNED to the page (sessions ≥2) with any real intent — the #1 signal
  //  • hit the NEXT-STEP CTA — explicit "what's next"
  //  • opened the TRIAL *and* viewed pricing — deep, both feet in
  //  • studied pricing hard (≥45s dwell on a pricing visit)
  const returnedWarm = returned && (salesReady.length > 0 || dwellS >= 20)
  const deepTrial = openedTrial && sawPricing
  const studiedPricing = sawPricing && dwellS >= 45
  const isDirect = returnedWarm || hitNextStep || deepTrial || studiedPricing

  // Score (for sorting only) — rewards the direct triggers heavily.
  let score = 0
  for (const [section, weight] of Object.entries(INTENT_WEIGHTS)) {
    if ((funnel[section] ?? 0) > 0) score += weight
  }
  if (returned) score += 35
  if (hitNextStep) score += 20
  if (deepTrial) score += 25
  if (dwellS >= 45) score += 15
  else if (dwellS >= 20) score += 8
  score = Math.min(100, Math.round(score))

  const action: OutreachAction = isDirect ? 'direct' : 'nurture'
  const reason = buildReason({ action, salesReady, fired, dwellS, sessions, openedTrial, returned, hitNextStep, deepTrial, studiedPricing, sawPricing })
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
  returned: boolean
  hitNextStep: boolean
  deepTrial: boolean
  studiedPricing: boolean
  sawPricing: boolean
}): string {
  const { action, salesReady, fired, dwellS, sessions, openedTrial, returned, hitNextStep, deepTrial, studiedPricing, sawPricing } = p
  const named = salesReady.map((s) => LABEL[s] ?? s)

  if (action === 'direct') {
    // Lead with the SPECIFIC buying signal that earned the close.
    if (returned) return `Close personally — came back ${sessions}× (the strongest signal). They're considering, not just curious; a human reply closes a warm lead the sequence can't.`
    if (hitNextStep) return `Close personally — hit the next-step CTA, an explicit "what now?". They've asked; reply with the next step before the moment cools.`
    if (deepTrial) return `Close personally — opened the trial AND viewed pricing. Both feet in; a tailored note (dates, a quote for their clinic) closes it.`
    if (studiedPricing) return `Close personally — studied pricing for ${dwellS}s. Seriously evaluating cost; offer to walk the numbers through for their clinic.`
    return `Close personally — ${named.join(' + ')}, ${dwellS}s. Genuine buying intent worth a human close.`
  }

  // nurture — explain WHY waiting beats interrupting
  if (studiedPricing === false && sawPricing) {
    return `Let the T2 land, then watch for a RETURN visit. Viewed pricing once = curious, not ready — your email adds nothing the page didn't. The pricing-aware T2 nudges; a return visit is the signal to step in.`
  }
  if (!salesReady.length && dwellS < 10) {
    return `Keep in nurture — skimmed ${dwellS}s, didn't reach pricing or the trial. Far too early to spend your time; the sequence warms them.`
  }
  if (!salesReady.length) {
    return `Keep in nurture — read ${dwellS}s but no pricing / trial / next-step. Interested, not warm; the sequence is the right next touch — watch for a return visit.`
  }
  return `Keep in nurture — light touch on ${named.join(' + ')} (${dwellS}s), single visit. Not warm enough to interrupt; the dashboard already pitches it. Wait for a return visit.`
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
