/**
 * Pipeline-stage classification for the B2B prospect matrix.
 *
 * Every NON-ARCHIVED prospect lands in EXACTLY ONE stage. First match wins,
 * top to bottom:
 *
 *   1. replied            — status='replied'. Sequence stopped; Zac's move.
 *   2. engaged            — status='engaged'. Personal lane (deliberately
 *                           excluded from templated sends).
 *   3. dead               — status won/lost/bounced/engaged-elsewhere.
 *                           Checked BEFORE the send stages: a lost clinic
 *                           with a T1 send is NOT "awaiting T2" — the cron
 *                           excludes these statuses forever, so showing them
 *                           mid-sequence would misrepresent the pipeline.
 *                           Won is split out as a subcount (the ✓ column).
 *   4. t3-sent            — has a production 'final' send. Sequence complete;
 *                           silence → long-nurture.
 *   5. t2-sent            — has a production 'followup' send. T3 fires +8 BD.
 *   6. t1-sent            — has a production 'initial' send. T2 fires +7 BD.
 *   7. ready              — Hunter-clean AND status='approved', no production
 *                           sends. Will fire when scheduled_send_at arrives.
 *   8. awaiting-approval  — Hunter-clean AND status='researching', no sends.
 *                           Needs Zac's approve/archive decision.
 *   9. blocked            — everything else with no production sends:
 *                           NOT Hunter-clean (unverified / score<80 / role /
 *                           accept-all / disposable), or a data-inconsistent
 *                           status with no sends. Stranded until re-verified
 *                           or enriched. Catch-all guarantees exhaustiveness.
 *
 * "Production send" = prospect_outreach_log row whose audit_key does NOT
 * contain ':test:'. Hunter-clean mirrors the cron HARD GATE in
 * lib/prospect/process-scheduled.ts: score IS NOT NULL AND score>=80 AND
 * NOT role AND NOT accept_all AND NOT disposable.
 */
import type { DealType } from './pricing'

export type PipelineStage =
  | 'booked'
  | 'replied'
  | 'engaged'
  | 't3-sent'
  | 't2-sent'
  | 't1-sent'
  | 'ready'
  | 'awaiting-approval'
  | 'blocked'
  | 'dead'

/** Display order for the matrix columns (left → right). Booked first — it's
 *  the conversion event this whole engine exists to produce. */
export const PIPELINE_STAGES: PipelineStage[] = [
  'booked',
  'replied',
  'engaged',
  't3-sent',
  't2-sent',
  't1-sent',
  'ready',
  'awaiting-approval',
  'blocked',
  'dead',
]

/** Statuses the cold cron will never send to again (besides replied/engaged). */
const DEAD_STATUSES = new Set(['won', 'lost', 'bounced', 'engaged-elsewhere'])

export interface HunterFields {
  score: number | null
  role: boolean
  acceptAll: boolean
  disposable: boolean
}

/**
 * The cron HARD GATE, TS-side. Strict: never-verified (score NULL) does NOT
 * pass — the gate requires a positive verification.
 */
export function isHunterClean(h: HunterFields): boolean {
  return h.score != null && h.score >= 80 && !h.role && !h.acceptAll && !h.disposable
}

export interface StageInput {
  status: string
  /** A confirmed Cal.com booking (cal_booked_at set) — the conversion event. */
  hasBooking: boolean
  /** Production sends only (audit_key NOT LIKE '%:test:%'). */
  hasInitialSend: boolean
  hasFollowupSend: boolean
  hasFinalSend: boolean
  hunterClean: boolean
}

export function classifyStage(i: StageInput): PipelineStage {
  // A booked call is the goal — it outranks every softer signal, and a
  // not-yet-dead prospect with a booking belongs in Booked, not Engaged.
  if (i.hasBooking && !DEAD_STATUSES.has(i.status)) return 'booked'
  if (i.status === 'replied') return 'replied'
  if (i.status === 'engaged') return 'engaged'
  if (DEAD_STATUSES.has(i.status)) return 'dead'
  if (i.hasFinalSend) return 't3-sent'
  if (i.hasFollowupSend) return 't2-sent'
  if (i.hasInitialSend) return 't1-sent'
  if (i.hunterClean && i.status === 'approved') return 'ready'
  if (i.hunterClean && i.status === 'researching') return 'awaiting-approval'
  return 'blocked'
}

// ── Matrix builder ──────────────────────────────────────────────────────────

export interface StageCell {
  count: number
  /** Sum of offer-matched dealValue across the cell (AUD). */
  dealValue: number
  /** Won subcount — only ever non-zero in the 'dead' column. */
  won: number
}

export interface StageMatrix {
  stages: PipelineStage[]
  tiers: DealType[]
  cells: Record<DealType, Record<PipelineStage, StageCell>>
  total: Record<PipelineStage, StageCell>
  /** Non-archived prospects classified — must equal the sum of all cells. */
  poolSize: number
  archived: number
}

export interface MatrixRowInput {
  stage: PipelineStage
  dealType: DealType
  dealValue: number
  status: string
}

const TIERS: DealType[] = ['on-site', 'hub-pack', 'individual']

function emptyStageRecord(): Record<PipelineStage, StageCell> {
  const rec = {} as Record<PipelineStage, StageCell>
  for (const s of PIPELINE_STAGES) rec[s] = { count: 0, dealValue: 0, won: 0 }
  return rec
}

/**
 * Build the pipeline matrix from already-classified rows. Archived rows must
 * be filtered out BEFORE calling (pass archivedCount for the reconciliation
 * note). Every row lands in exactly one cell; poolSize === Σ cells.
 */
export function buildStageMatrix(rows: MatrixRowInput[], archivedCount = 0): StageMatrix {
  const cells = {
    'on-site': emptyStageRecord(),
    'hub-pack': emptyStageRecord(),
    individual: emptyStageRecord(),
  } as Record<DealType, Record<PipelineStage, StageCell>>
  const total = emptyStageRecord()

  for (const r of rows) {
    const cell = cells[r.dealType][r.stage]
    cell.count += 1
    cell.dealValue += r.dealValue
    const tot = total[r.stage]
    tot.count += 1
    tot.dealValue += r.dealValue
    if (r.status === 'won') {
      cell.won += 1
      tot.won += 1
    }
  }

  return {
    stages: PIPELINE_STAGES,
    tiers: TIERS,
    cells,
    total,
    poolSize: rows.length,
    archived: archivedCount,
  }
}
