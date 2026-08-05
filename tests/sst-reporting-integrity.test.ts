import { describe, it, expect } from 'vitest'
import {
  gpReport,
  acc884,
  acc885,
  rtpClearance,
  rtwSummary,
  medicolegalRecord,
  type ReportInput,
  type ReportContent,
} from '@/lib/sst-trainer/reports/skins'
import { reportContentToNoteText } from '@/lib/sst-trainer/pms/deliver'
import { getReportSkins } from '@/lib/sst-trainer/reports/jurisdiction'
import type { PersistedSession, PersistedTest } from '@/lib/sst-trainer/store'

/**
 * SST REPORTING INTEGRITY.
 *
 * The defect class this file exists to prevent: a report handed to a GP, an
 * insurer or ACC printing a NEGATIVE/normal finding for a value the clinician
 * never entered — "0", "nil", "no risk flag", "verified". Missing data must
 * print as missing.
 *
 * Everything here is over the PURE skin layer (no DB, no I/O), which is where
 * every jurisdiction report's wording is decided.
 */

const DAY = 86_400_000
const now = Date.now()

function input(over: Partial<ReportInput> = {}): ReportInput {
  return {
    jurisdiction: 'AU',
    patient: { firstName: 'Test', lastName: 'Patient' },
    prescription: null,
    latestTest: null,
    thresholdHistory: [],
    sessions: [],
    episode: { startedAt: new Date(now - 20 * DAY).toISOString(), reportedAt: new Date(now).toISOString() },
    ...over,
  }
}

function test_(over: Partial<PersistedTest> = {}): PersistedTest {
  return {
    at: now - 10 * DAY,
    interpretation: 'physiologic',
    hrt: 140,
    thresholdStage: 6,
    modality: 'treadmill',
    restingSymptomScore: 2,
    ...over,
  }
}

function session(over: Partial<PersistedSession> = {}): PersistedSession {
  return {
    date: new Date(now - 5 * DAY).toISOString(),
    at: now - 5 * DAY,
    avgHeartRate: 118,
    peakHeartRate: 126,
    preSymptom: 2,
    peakSymptom: 2,
    completedMinutes: 20,
    ...over,
  } as PersistedSession
}

/** Flatten a report into one searchable string — the same text a PMS note carries. */
function textOf(c: ReportContent): string {
  return reportContentToNoteText(c)
}

const ALL_SKINS: Array<[string, (i: ReportInput) => ReportContent]> = [
  ['gp-report', gpReport],
  ['acc884', acc884],
  ['rtp-clearance', rtpClearance],
  ['rtw-summary', rtwSummary],
  ['medicolegal', medicolegalRecord],
]

// ── 1. MISSING DATA MUST NOT RENDER AS A NORMAL FINDING ──────────────────────

describe('missing data never prints as a negative/normal finding', () => {
  it('ACC884 does not claim "no prolonged-recovery risk flag" when no threshold was ever measured', () => {
    const t = textOf(acc884(input({ prescription: null })))
    expect(t).not.toContain('No prolonged-recovery risk flag raised')
    expect(t).toMatch(/not assessed/i)
  })

  it('ACC884 DOES report the negative when a threshold WAS measured and no flag fired', () => {
    const t = textOf(
      acc884(
        input({
          prescription: {
            hrt: 150,
            lowerBpm: 120,
            upperBpm: 135,
            sessionMinutes: 20,
            daysPerWeek: 5,
            prolongedRecoveryRisk: false,
          } as ReportInput['prescription'],
        }),
      ),
    )
    expect(t).toContain('No prolonged-recovery risk flag raised')
  })

  it('ACC884 does not state a graded-test outcome when no graded test is on record', () => {
    const t = textOf(acc884(input({ latestTest: null })))
    expect(t).not.toContain('symptom-limited on graded testing')
    expect(t).toMatch(/no valid graded test is on record/i)
  })

  it('an "invalid" latest test is treated as no test, not as a symptom-limited finding', () => {
    const t = textOf(
      acc884(
        input({
          latestTest: { hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'invalid', message: '' },
        }),
      ),
    )
    expect(t).not.toContain('symptom-limited on graded testing')
    expect(t).toMatch(/no valid graded test is on record/i)
  })

  it('RTP record does not assert "Still symptom-limited" with no test on record', () => {
    const t = textOf(rtpClearance(input({ latestTest: null })))
    expect(t).not.toContain('Still symptom-limited')
    expect(t).toContain('Not established')
    // and it must NOT read as clearable
    expect(t).not.toContain('Basis to progress the RTS pathway')
  })

  it('RTW summary makes no capacity statement with no test on record', () => {
    const t = textOf(rtwSummary(input({ latestTest: null })))
    expect(t).not.toContain('remains symptom-limited')
    expect(t).toMatch(/no capacity statement can be made/i)
  })

  it('medicolegal record NEVER prints "verified (live HR)" for a session with no provenance', () => {
    // hrVerified undefined = the app never recorded a source for this session.
    const t = textOf(medicolegalRecord(input({ sessions: [session({ hrVerified: undefined })] })))
    expect(t).not.toContain('verified (live HR)')
    expect(t).toContain('NOT RECORDED')
  })

  it('medicolegal record still distinguishes explicitly-unverified from verified', () => {
    const verified = textOf(medicolegalRecord(input({ sessions: [session({ hrVerified: true })] })))
    expect(verified).toContain('verified (live HR)')
    const manual = textOf(medicolegalRecord(input({ sessions: [session({ hrVerified: false })] })))
    expect(manual).toContain('UNVERIFIED (manual/camera)')
    expect(manual).not.toContain('HR provenance NOT RECORDED')
  })

  it('ACC885 does not assert the client gave no prior notice when that is unknown', () => {
    const unknown = textOf(acc885(input()))
    expect(unknown).toMatch(/Client notified in advance: Not recorded/)
    // and it still supports the real, known case
    const known = textOf(acc885(input(), { at: new Date(now).toISOString(), notifiedInAdvance: false }))
    expect(known).toContain('Client notified in advance: No')
  })

  it('trajectory reports absence rather than an empty-looking normal result', () => {
    for (const [name, skin] of ALL_SKINS) {
      const t = textOf(skin(input()))
      expect(t, name).toMatch(/No serial threshold measurements recorded|No graded tests on record/)
    }
  })
})

// ── 2. RED FLAGS SURVIVE ONTO EVERY REPORT ───────────────────────────────────

describe('red-flag events reach every report that carries a progression statement', () => {
  const withRedFlag = input({
    thresholdHistory: [
      test_({ at: now - 20 * DAY, interpretation: 'red-flag', hrt: 118 }),
      test_({ at: now - 3 * DAY, interpretation: 'no-intolerance', hrt: null }),
    ],
    latestTest: { hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'no-intolerance', message: '' },
  })

  it.each(ALL_SKINS)('%s discloses a red-flag test in the episode', (_name, skin) => {
    const t = textOf(skin(withRedFlag))
    expect(t).toMatch(/RED-FLAG EVENTS DURING THIS EPISODE/i)
    expect(t).toMatch(/stopped on a red-flag response/i)
  })

  it('never prints a "no red flags" line when there were none (absence stays silent)', () => {
    for (const [name, skin] of ALL_SKINS) {
      const t = textOf(skin(input({ thresholdHistory: [test_()] })))
      expect(t, name).not.toMatch(/red.flag/i)
    }
  })

  it('an RTP summary with a red flag still shows the clearance basis alongside it', () => {
    const t = textOf(rtpClearance(withRedFlag))
    expect(t).toContain('Basis to progress the RTS pathway') // latest test IS recovered
    expect(t).toMatch(/stopped on a red-flag response/i) // …but the red flag is on the page
  })

  it('a red-flag LATEST test never reads as symptom-limited-but-progressing', () => {
    const t = textOf(
      acc884(
        input({
          thresholdHistory: [test_({ interpretation: 'red-flag' })],
          latestTest: { hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'red-flag', message: '' },
        }),
      ),
    )
    expect(t).toMatch(/NOT established/i)
    expect(t).not.toContain('objective exercise tolerance recovered')
  })
})

// ── 3. VERIFIED-SESSION SHARE IS STRICT ──────────────────────────────────────

describe('verified-session share is strict on every skin', () => {
  it('counts only hrVerified === true', () => {
    const t = textOf(
      gpReport(
        input({
          sessions: [
            session({ hrVerified: true }),
            session({ hrVerified: false }),
            session({ hrVerified: undefined }),
          ],
        }),
      ),
    )
    expect(t).toContain('Sessions (verified / total): 1 / 3')
  })
})

// ── 4. JURISDICTION — AN AU REPORT MUST NOT CITE ACC FORMS ───────────────────

describe('jurisdiction discipline', () => {
  it('AU offers no ACC skins; NZ does', () => {
    expect(getReportSkins('AU')).not.toContain('acc884')
    expect(getReportSkins('AU')).not.toContain('acc885')
    expect(getReportSkins('NZ')).toContain('acc884')
    expect(getReportSkins('INTL')).toEqual(['gp-report', 'medicolegal'])
  })

  it('the AU-available skins never name an ACC form', () => {
    const au = input({
      jurisdiction: 'AU',
      thresholdHistory: [test_()],
      sessions: [session({ hrVerified: true })],
      latestTest: { hrtFound: true, hrt: 140, thresholdStage: 6, interpretation: 'physiologic', message: '' },
    })
    for (const skin of [gpReport, rtpClearance, rtwSummary, medicolegalRecord]) {
      const t = textOf(skin(au))
      expect(t).not.toMatch(/ACC\s?8\d\d|ACC32|ACC45/)
    }
  })

  it('the ACC884 only claims to supply CONTENT for ACC’s own form', () => {
    const t = textOf(acc884(input({ jurisdiction: 'NZ' })))
    expect(t).toContain('ACC884 Client Summary Report')
    // extension of treatment is the ACC32, never asserted as done here
    expect(t).toContain('ACC32')
  })
})

// ── 5. SYNC IDEMPOTENCY (the write side's duplicate/clobber contract) ────────

/**
 * The ingest route keys the row id off the client-stamped `payload.syncId` and
 * inserts ON CONFLICT (id) DO NOTHING. This reproduces that contract over an
 * in-memory table: a retried/replayed sync must be a no-op, and must never
 * overwrite an already-stored (more complete) record with a partial one.
 */
const SYNC_ID_RE = /^[0-9a-fA-F-]{16,64}$/

function rowIdFor(payload: Record<string, unknown>, fallback: string): string {
  const raw = payload.syncId
  return typeof raw === 'string' && SYNC_ID_RE.test(raw) ? raw.toLowerCase() : fallback
}

function ingest(table: Map<string, Record<string, unknown>>, payload: Record<string, unknown>, fallbackId: string) {
  const id = rowIdFor(payload, fallbackId)
  if (table.has(id)) return { inserted: false, id } // ON CONFLICT DO NOTHING
  table.set(id, payload)
  return { inserted: true, id }
}

describe('clinic sync idempotency', () => {
  it('a retried sync of the same event does not duplicate the row', () => {
    const table = new Map<string, Record<string, unknown>>()
    const body = { syncId: '7f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8', eventType: 'session-completed', completedMinutes: 20 }
    expect(ingest(table, body, 'fb1').inserted).toBe(true)
    expect(ingest(table, body, 'fb2').inserted).toBe(false)
    expect(ingest(table, body, 'fb3').inserted).toBe(false)
    expect(table.size).toBe(1)
  })

  it('a later PARTIAL replay cannot clobber the stored complete record', () => {
    const table = new Map<string, Record<string, unknown>>()
    const syncId = '7f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8'
    ingest(table, { syncId, completedMinutes: 20, peakSymptom: 2, hrVerified: true }, 'fb1')
    ingest(table, { syncId, completedMinutes: 3 }, 'fb2') // stale/incomplete replay
    expect(table.get(syncId)).toMatchObject({ completedMinutes: 20, hrVerified: true })
  })

  it('two DISTINCT events in the same millisecond stay two rows', () => {
    const table = new Map<string, Record<string, unknown>>()
    ingest(table, { syncId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', n: 1 }, 'fb1')
    ingest(table, { syncId: 'ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee', n: 2 }, 'fb2')
    expect(table.size).toBe(2)
  })

  it('the legacy no-crypto.randomUUID syncId fallback is still accepted as an id', () => {
    // clinic-sync.ts builds this shape on very old WebViews.
    const legacy = `${Date.now().toString(16)}-${(0x1234abcd).toString(16).padStart(8, '0')}-${(0x9876fedc).toString(16).padStart(8, '0')}`
    expect(SYNC_ID_RE.test(legacy)).toBe(true)
  })
})

// ── 6. LATEST TEST = WHEN IT HAPPENED, NOT WHEN IT SYNCED ────────────────────

/** The clause shared by reports/load.ts, clinic-sessions and both GP exporters. */
function occurredIso(r: { payload: Record<string, unknown> | null; created_at: string }): string {
  const raw = r.payload?.occurredAt
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return r.created_at
  const inserted = new Date(r.created_at).getTime()
  if (!Number.isFinite(inserted) || raw > inserted + 60_000 || raw < inserted - 365 * 86_400_000) {
    return r.created_at
  }
  return new Date(raw).toISOString()
}

describe('offline flush ordering', () => {
  const iso = (ms: number) => new Date(ms).toISOString()

  it('a late-flushed OLD test does not become the "latest" test', () => {
    // Test A taken 10 days ago (offline, flushed today); test B taken 2 days ago
    // (synced immediately). Insert order puts A last.
    const rows = [
      { payload: { occurredAt: now - 2 * DAY, interpretation: 'physiologic' }, created_at: iso(now - 2 * DAY) },
      { payload: { occurredAt: now - 10 * DAY, interpretation: 'no-intolerance' }, created_at: iso(now) },
    ]
    const byInsert = rows[rows.length - 1]
    expect(byInsert.payload.interpretation).toBe('no-intolerance') // the OLD bug

    const byOccurred = [...rows].sort((a, b) => Date.parse(occurredIso(a)) - Date.parse(occurredIso(b)))
    expect(byOccurred[byOccurred.length - 1].payload.interpretation).toBe('physiologic')
  })

  it('a whole queue flushed at once keeps its real multi-day date range', () => {
    const flushedAt = now
    const rows = [
      { payload: { occurredAt: now - 21 * DAY }, created_at: iso(flushedAt) },
      { payload: { occurredAt: now - 14 * DAY }, created_at: iso(flushedAt) },
      { payload: { occurredAt: now - 7 * DAY }, created_at: iso(flushedAt) },
    ]
    const dates = rows.map(occurredIso)
    expect(new Set(dates).size).toBe(3) // NOT all collapsed onto the sync date
    expect(Date.parse(dates[2]) - Date.parse(dates[0])).toBe(14 * DAY)
  })

  it('a client cannot date a session into the future', () => {
    const r = { payload: { occurredAt: now + 30 * DAY }, created_at: iso(now) }
    expect(occurredIso(r)).toBe(iso(now))
  })

  it('legacy rows with no occurredAt fall back to insert time', () => {
    const r = { payload: { eventType: 'session-completed' }, created_at: iso(now - 3 * DAY) }
    expect(occurredIso(r)).toBe(iso(now - 3 * DAY))
  })
})

// ── 7. THE DISPLAY-ONLY "(2)" SUFFIX NEVER REACHES A DOCUMENT ────────────────

describe('patient identity on printed documents', () => {
  /** Mirrors labelOf() in the hub and patients page. */
  const labelOf = (p: { name: string; label?: string }) =>
    (p.label || '').trim() || p.name.replace(/\s\(\d+\)$/, '')

  it('strips the roster disambiguation suffix', () => {
    expect(labelOf({ name: 'James M (2)' })).toBe('James M')
    expect(labelOf({ name: 'James M (2)', label: 'James M' })).toBe('James M')
    expect(labelOf({ name: 'James M' })).toBe('James M')
  })

  it('a bracketed name that is genuinely part of the label survives via label', () => {
    expect(labelOf({ name: 'Sam (school) (2)', label: 'Sam (school)' })).toBe('Sam (school)')
  })

  it('the report header prints the supplied identity, not the raw label, when given', () => {
    const t = textOf(gpReport(input({ patient: { firstName: 'James', lastName: 'Mitchell' } })))
    expect(t).toContain('James Mitchell')
  })
})
