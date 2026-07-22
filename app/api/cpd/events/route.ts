import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { findBoard, passiveCeiling } from '@/lib/ai-course/cpd-requirements'

/**
 * POST /api/cpd/events — integration endpoint referenced by the
 * Heidi integration spec at /courses/integration.
 *
 * Working stub. Accepts the documented event shape, categorises against
 * the AHPRA per-Board reference data, returns the documented response
 * shape. No PII is read — only metadata (duration, kind, topic tags).
 *
 * Preview-only: gated behind ADMIN_API_KEY (x-admin-key) or the
 * partner demo key (HEIDI_DEMO_KEY via x-demo-key or demo_key cookie).
 * Once an actual partnership is in place this swaps to per-partner
 * issued API keys with rate-limiting + signed request bodies.
 */

const KIND_TO_CATEGORY: Record<string, { category: string; subcategory: string; promptCopyPrefix: string }> = {
  literature_search: {
    category: 'Educational Activities',
    subcategory: 'Literature review',
    promptCopyPrefix: 'spent reading and reviewing peer-reviewed literature',
  },
  guideline_review: {
    category: 'Educational Activities',
    subcategory: 'Clinical guideline review',
    promptCopyPrefix: 'spent reviewing clinical guidelines',
  },
  case_research: {
    category: 'Educational Activities',
    subcategory: 'Case-based research',
    promptCopyPrefix: 'spent researching evidence for a clinical case',
  },
  scribe_reflection: {
    category: 'Reviewing Performance',
    subcategory: 'Documentation reflection',
    promptCopyPrefix: 'spent reflecting on session documentation',
  },
}

type CpdEvent = {
  userId: string
  sessionId: string
  kind: keyof typeof KIND_TO_CATEGORY
  durationMin: number
  topicTags?: string[]
  completedAt: string
  ahpraBoard?: string
}

function generateCpdLogId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `cpd_${ts}_${rand}`
}

async function isAuthorised(req: Request): Promise<boolean> {
  const headerList = await headers()
  const cookieStore = await cookies()

  const adminKey = headerList.get('x-admin-key')
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) return true

  // Demo key: header or cookie only. The ?demo= query param is intentionally
  // NOT accepted (it leaks the key into logs / Referer). Fail-closed if unset.
  const demoKey = process.env.HEIDI_DEMO_KEY
  if (demoKey) {
    if (headerList.get('x-demo-key') === demoKey) return true
    if (cookieStore.get('demo_key')?.value === demoKey) return true
  }

  return false
}

function validate(body: unknown): { ok: true; value: CpdEvent } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body must be a JSON object' }
  const b = body as Record<string, unknown>
  if (typeof b.userId !== 'string' || !b.userId) return { ok: false, error: 'userId required (string)' }
  if (typeof b.sessionId !== 'string' || !b.sessionId) return { ok: false, error: 'sessionId required (string)' }
  if (typeof b.kind !== 'string' || !(b.kind in KIND_TO_CATEGORY)) {
    return { ok: false, error: `kind must be one of: ${Object.keys(KIND_TO_CATEGORY).join(', ')}` }
  }
  if (typeof b.durationMin !== 'number' || b.durationMin <= 0 || b.durationMin > 480) {
    return { ok: false, error: 'durationMin required (1-480)' }
  }
  if (typeof b.completedAt !== 'string' || isNaN(Date.parse(b.completedAt))) {
    return { ok: false, error: 'completedAt required (ISO-8601 string)' }
  }
  if (b.topicTags !== undefined && (!Array.isArray(b.topicTags) || !b.topicTags.every((t) => typeof t === 'string'))) {
    return { ok: false, error: 'topicTags must be array of strings if provided' }
  }
  if (b.ahpraBoard !== undefined && typeof b.ahpraBoard !== 'string') {
    return { ok: false, error: 'ahpraBoard must be string slug if provided' }
  }
  return { ok: true, value: b as unknown as CpdEvent }
}

export async function POST(req: Request) {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 })
  }

  const v = validate(body)
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: v.error }, { status: 400 })
  }
  const event = v.value

  const mapping = KIND_TO_CATEGORY[event.kind]
  const cpdLogId = generateCpdLogId()
  const durationHours = +(event.durationMin / 60).toFixed(2)

  let boardCalibration: {
    board: string | null
    countsTowardAnnual: boolean
    remainingHoursEstimate: number | null
    passiveCeilingPercent: number | null
  } = {
    board: event.ahpraBoard ?? null,
    countsTowardAnnual: true,
    remainingHoursEstimate: null,
    passiveCeilingPercent: null,
  }

  if (event.ahpraBoard) {
    const board = findBoard(event.ahpraBoard)
    const ceiling = passiveCeiling(event.ahpraBoard)
    if (board) {
      boardCalibration = {
        board: board.slug,
        countsTowardAnnual: true,
        remainingHoursEstimate: board.annualHours
          ? Math.max(0, +(board.annualHours - durationHours).toFixed(2))
          : null,
        passiveCeilingPercent: ceiling?.passivePercent ?? null,
      }
    } else {
      boardCalibration.countsTowardAnnual = false
    }
  }

  const topicSummary = event.topicTags?.length ? `on ${event.topicTags.slice(0, 3).join(', ')}` : 'researching evidence'
  const promptCopy = `You ${mapping.promptCopyPrefix} ${topicSummary} for ${event.durationMin} min. Log as CPD?`

  return NextResponse.json({
    ok: true,
    cpdLogId,
    category: mapping.category,
    subcategory: mapping.subcategory,
    durationHours,
    boardCalibration,
    promptUser: true,
    promptCopy,
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/cpd/events',
    method: 'POST',
    auth: 'x-admin-key header OR x-demo-key header OR demo_key cookie',
    contract: {
      request: {
        userId: 'string (required)',
        sessionId: 'string (required)',
        kind: Object.keys(KIND_TO_CATEGORY),
        durationMin: 'number 1-480 (required)',
        topicTags: 'string[] (optional)',
        completedAt: 'ISO-8601 string (required)',
        ahpraBoard: 'string slug (optional, see /courses/cpd-record/requirements)',
      },
      response: {
        ok: 'boolean',
        cpdLogId: 'string',
        category: 'string',
        subcategory: 'string',
        durationHours: 'number',
        boardCalibration: {
          board: 'string | null',
          countsTowardAnnual: 'boolean',
          remainingHoursEstimate: 'number | null',
          passiveCeilingPercent: 'number | null',
        },
        promptUser: 'boolean',
        promptCopy: 'string',
      },
    },
    note: 'Working stub for partner-pitch validation. Production version adds per-partner API keys, signed request bodies, idempotency on sessionId, rate limiting, and webhook callbacks on log entry.',
  })
}

