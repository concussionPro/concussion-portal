import { sql } from '@/lib/db'

/**
 * Self-cleaning analytics findings engine.
 *
 * THE POINT OF THE SITE IS TO SELL COURSES (owner, 2026-07-27). This engine
 * exists because dashboard insights die unread: nobody makes optimisation
 * changes by staring at charts. Instead, a weekly cron runs the analysis and
 * maintains a table of OPEN WORK ORDERS — each one a concrete site change,
 * anchored to a money step (purchase, checkout start, enrol click, cal
 * booking, demo tour), with the evidence attached.
 *
 * SELF-CLEANING: findings are keyed; each run re-evaluates every heuristic.
 * A condition that still holds refreshes `last_seen`; one that no longer
 * holds auto-RESOLVES its finding. Nothing accumulates, nothing goes stale.
 *
 * THE LOOP: the digest email lands Monday morning; Zac says "run the
 * analytics pass" to Claude, which reads GET /api/admin/analytics-findings
 * and implements the open orders. The data then closes them.
 *
 * Small-n discipline: this site's traffic is low. Every rule triggers on
 * ABSOLUTE counts (visitors, clicks), never percentages of tiny bases.
 * Visitor-stitching uses eventData.visitorId (persistent localStorage id).
 */

export interface Finding {
  key: string
  severity: 1 | 2 | 3 // 1 = money leak, 2 = pipeline gap, 3 = signal
  title: string
  evidence: string
  proposedChange: string
}

interface Ev {
  type: string
  data: Record<string, unknown>
  sessionId: string
  ts: number
  referrer: string | null
  path: string | null
}

const MONEY_PAGES = ['/pricing', '/pricing-international', '/concussion-rehab-mastery', '/acc', '/uk', '/clinics']
const AI_DOMAINS = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'poe.com', 'you.com']

function domainOf(ref: string | null): string {
  if (!ref) return '(direct)'
  try {
    return new URL(ref).hostname.replace(/^www\./, '')
  } catch {
    return '(direct)'
  }
}

export async function loadWindow(days: number, endMs: number): Promise<Ev[]> {
  const startMs = endMs - days * 24 * 60 * 60 * 1000
  const { rows } = await sql`
    SELECT event_type, event_data, session_id, timestamp_ms, referrer, path
    FROM analytics_events
    WHERE timestamp_ms >= ${startMs} AND timestamp_ms < ${endMs}
    ORDER BY timestamp_ms ASC
  `
  return rows.map((r) => ({
    type: r.event_type as string,
    data: (typeof r.event_data === 'string' ? JSON.parse(r.event_data) : r.event_data ?? {}) as Record<string, unknown>,
    sessionId: r.session_id as string,
    ts: Number(r.timestamp_ms),
    referrer: (r.referrer as string) ?? null,
    path: (r.path as string) ?? null,
  }))
}

/** Pure analysis — visitor-stitched, money-anchored. Exported for tests. */
export function analyze(events: Ev[]): Finding[] {
  const findings: Finding[] = []
  const client = events.filter((e) => !e.sessionId.startsWith('server_'))

  // Visitor stitching: persistent id when present, session id as fallback.
  const visitorOf = (e: Ev) =>
    typeof e.data.visitorId === 'string' && e.data.visitorId ? (e.data.visitorId as string) : `s:${e.sessionId}`
  const byVisitor = new Map<string, Ev[]>()
  for (const e of client) {
    const v = visitorOf(e)
    const arr = byVisitor.get(v) || []
    arr.push(e)
    byVisitor.set(v, arr)
  }

  const visitors = (pred: (evs: Ev[]) => boolean) =>
    [...byVisitor.values()].filter(pred).length

  const isPv = (e: Ev) => e.type === 'page_view'
  const purchases = events.filter((e) => e.type === 'purchase_complete').length
  const checkoutIntent = visitors((evs) =>
    evs.some((e) => ['enroll_button_click', 'enrol_click', 'checkout_start', 'shop_click'].includes(e.type)),
  )
  const pricingViewers = visitors((evs) => evs.some((e) => isPv(e) && MONEY_PAGES.includes(e.path || '')))
  const tourStarts = events.filter((e) => e.type === 'demo_tour_start').length
  const calClicks = events.filter((e) => e.type === 'cal_click').length
  const accViewers = visitors((evs) => evs.some((e) => isPv(e) && e.path === '/acc'))

  // ── 1. THE money leak: buying interest that never reaches Stripe ─────────
  if (pricingViewers >= 8 && checkoutIntent === 0) {
    findings.push({
      key: 'pricing-no-intent',
      severity: 1,
      title: 'Pricing surfaces take traffic, zero enrol/checkout clicks',
      evidence: `${pricingViewers} visitors reached a pricing surface; 0 clicked enrol/checkout. Purchases: ${purchases}.`,
      proposedChange:
        'Rework the pricing surfaces: single dominant CTA above the fold, price anchored against CPD-budget framing, remove competing links. Then re-measure.',
    })
  }
  if (checkoutIntent >= 3 && purchases === 0) {
    findings.push({
      key: 'intent-no-purchase',
      severity: 1,
      title: 'Checkout intent exists but no purchases landed',
      evidence: `${checkoutIntent} visitors clicked enrol/checkout; 0 verified purchases.`,
      proposedChange:
        'Walk the live checkout end-to-end (both streams). Check Stripe abandoned sessions for the drop step; strengthen the recovery email; consider a checkout-page reassurance strip (CPD hours, invoice, refund terms).',
    })
  }

  // ── 2. ACC pipeline (the current revenue focus) ──────────────────────────
  if (accViewers >= 5 && tourStarts === 0) {
    findings.push({
      key: 'acc-no-tour',
      severity: 2,
      title: '/acc gets prospects but nobody enters the workspace tour',
      evidence: `${accViewers} visitors on /acc, 0 demo tour entries.`,
      proposedChange:
        'The tour CTA is not landing: move "Tour the clinician workspace" above the fold on /acc and repeat it after the sample-ACC884 block.',
    })
  }
  if (tourStarts >= 3 && calClicks === 0) {
    findings.push({
      key: 'tour-no-booking',
      severity: 2,
      title: 'Prospects tour the workspace but never book',
      evidence: `${tourStarts} tour entries, 0 cal.com clicks.`,
      proposedChange:
        'The tour ends nowhere: add a persistent "Book 20 minutes" affordance inside the demo workspace (sidebar demo card + after the sample report).',
    })
  }

  // ── 3. Exit-before-money: where money-page sessions die ──────────────────
  const exits = new Map<string, number>()
  for (const evs of byVisitor.values()) {
    const pvs = evs.filter(isPv).sort((a, b) => a.ts - b.ts)
    if (pvs.length === 0) continue
    const touchedMoney = pvs.some((e) => MONEY_PAGES.includes(e.path || ''))
    const intent = evs.some((e) => ['enroll_button_click', 'enrol_click', 'checkout_start', 'shop_click', 'cal_click'].includes(e.type))
    if (touchedMoney && !intent) {
      const exit = pvs[pvs.length - 1].path || '?'
      exits.set(exit, (exits.get(exit) || 0) + 1)
    }
  }
  const topExit = [...exits.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topExit && topExit[1] >= 5) {
    findings.push({
      key: `exit-${topExit[0]}`,
      severity: 2,
      title: `Money-path sessions die on ${topExit[0]}`,
      evidence: `${topExit[1]} visitors reached a pricing surface, took no money action, and exited on ${topExit[0]}.`,
      proposedChange: `Rework ${topExit[0]}: it is the last page buyers see before leaving. Cut length, restate the offer, put the next step at the exit point.`,
    })
  }

  // ── 4. Channels → money (incl. AI/LLM referrals and referral sources) ────
  const channelMoney = new Map<string, { v: number; money: number }>()
  for (const evs of byVisitor.values()) {
    const first = evs[0]
    const ed = first.data
    const firstUtm = (ed.firstUtm && typeof ed.firstUtm === 'object' ? ed.firstUtm : {}) as Record<string, string>
    const utmMedium = firstUtm.utm_medium || ''
    let ref = domainOf(first.referrer)
    if (ref === '(direct)' && typeof ed.firstReferrer === 'string') ref = domainOf(ed.firstReferrer as string)
    const ch =
      utmMedium === 'email' ? 'Email'
      : AI_DOMAINS.some((d) => ref === d || ref.endsWith('.' + d)) ? 'AI / LLM'
      : ref === '(direct)' ? 'Direct'
      : ['google.com', 'bing.com', 'duckduckgo.com'].some((d) => ref.endsWith(d)) ? 'Organic Search'
      : `Referral: ${ref}`
    const c = channelMoney.get(ch) || { v: 0, money: 0 }
    c.v++
    if (
      evs.some((e) => (isPv(e) && MONEY_PAGES.includes(e.path || '')) ||
        ['enroll_button_click', 'checkout_start', 'cal_click'].includes(e.type))
    ) c.money++
    channelMoney.set(ch, c)
  }
  for (const [ch, c] of channelMoney) {
    if (c.v >= 10 && c.money === 0) {
      findings.push({
        key: `channel-dead-${ch}`,
        severity: 2,
        title: `${ch} sends visitors who never touch a money page`,
        evidence: `${c.v} visitors from ${ch}; 0 reached pricing//acc or clicked a money CTA.`,
        proposedChange: `The ${ch} landing experience is mismatched with the traffic: check which pages this channel enters on and add a route to the relevant offer above the fold.`,
      })
    }
  }
  const ai = channelMoney.get('AI / LLM')
  if (ai && ai.v > 0) {
    findings.push({
      key: 'geo-llm-arriving',
      severity: 3,
      title: `GEO is working: ${ai.v} visitor(s) arrived from AI assistants`,
      evidence: `${ai.v} AI/LLM-referred visitors this window; ${ai.money} reached a money surface.`,
      proposedChange:
        'Double down on the pages being cited: check which paths AI-referred visitors land on and extend that page pattern (clear claims + named source + date) to the money pages.',
    })
  }

  // ── 5. Dead landers: real entries, zero second page ──────────────────────
  const landers = new Map<string, { entries: number; bounced: number }>()
  for (const evs of byVisitor.values()) {
    const pvs = evs.filter(isPv).sort((a, b) => a.ts - b.ts)
    if (pvs.length === 0) continue
    const entry = pvs[0].path || '?'
    const l = landers.get(entry) || { entries: 0, bounced: 0 }
    l.entries++
    // Self-contained landers (tabs, in-page checkout) produce ONE pageview by
    // design — any interaction event means the visitor engaged, not bounced.
    const interacted = evs.some((e) => !isPv(e))
    if (new Set(pvs.map((p) => p.path)).size <= 1 && !interacted) l.bounced++
    landers.set(entry, l)
  }
  // App/tool surfaces are NOT funnel pages — a patient running /sst-trainer or
  // an athlete on a baseline link "bounces" by design. Flagging them was a
  // false positive (owner-confirmed 2026-07-27).
  const APP_SURFACES = ['/sst-trainer', '/clinical-hub', '/preseason/b/', '/demo/', '/clinical-testing']
  for (const [page, l] of landers) {
    if (l.entries >= 8 && l.bounced === l.entries && !APP_SURFACES.some((p) => page.startsWith(p))) {
      findings.push({
        key: `lander-dead-${page}`,
        severity: 2,
        title: `${page} takes entries and loses every one of them`,
        evidence: `${l.entries} visitors entered on ${page}; none viewed a second page.`,
        proposedChange: `${page} has no working next step: add one — a single link to the stream-relevant offer, above the fold.`,
      })
    }
  }

  return findings.sort((a, b) => a.severity - b.severity)
}

export async function ensureFindingsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS analytics_findings (
      key TEXT PRIMARY KEY,
      severity INT NOT NULL,
      title TEXT NOT NULL,
      evidence TEXT NOT NULL,
      proposed_change TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `
}

/** Upsert this run's findings; auto-resolve open findings the data no longer
 *  supports. Returns counts for the digest. */
export async function reconcileFindings(current: Finding[]): Promise<{ opened: number; refreshed: number; resolved: number }> {
  await ensureFindingsTable()
  const currentKeys = new Set(current.map((f) => f.key))
  let opened = 0
  let refreshed = 0

  for (const f of current) {
    const { rowCount } = await sql`
      UPDATE analytics_findings
      SET severity = ${f.severity}, title = ${f.title}, evidence = ${f.evidence},
          proposed_change = ${f.proposedChange}, last_seen = NOW(),
          status = 'open', resolved_at = NULL
      WHERE key = ${f.key}
    `
    if (rowCount === 0) {
      await sql`
        INSERT INTO analytics_findings (key, severity, title, evidence, proposed_change)
        VALUES (${f.key}, ${f.severity}, ${f.title}, ${f.evidence}, ${f.proposedChange})
      `
      opened++
    } else {
      refreshed++
    }
  }

  // Self-cleaning: anything open that this run did not re-produce is resolved.
  const { rows: openRows } = await sql`SELECT key FROM analytics_findings WHERE status = 'open'`
  let resolved = 0
  for (const r of openRows) {
    if (!currentKeys.has(r.key as string)) {
      await sql`UPDATE analytics_findings SET status = 'resolved', resolved_at = NOW() WHERE key = ${r.key as string}`
      resolved++
    }
  }
  return { opened, refreshed, resolved }
}
