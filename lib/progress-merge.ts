/**
 * Server-side, field-level merge of a STORED progress entry with an INCOMING one.
 *
 * WHY THIS EXISTS (2026-08-05 adversarial round on 89f206c6)
 *
 * POST /api/progress is a full overwrite. The retention pass added in 89f206c6
 * protected a stored entry only when the INCOMING entry for that module was a
 * zero-progress default:
 *
 *     if (!incomingReal && storedReal) toPersist[k] = stored
 *
 * That fixes exactly one shape of the two-tab race — the stale tab that never
 * opened the module. It does nothing for the far more common shape, because you
 * have to OPEN a module to complete it and `markModuleStarted` stamps
 * `startedAt` on mount. So a second tab sitting on the same module holds an
 * entry that IS "real" (startedAt / activeStudyMinutes), `incomingReal` is true,
 * retention passes it straight through, and the stale entry REPLACES the
 * completion the other tab just recorded. localStorage is origin-shared, so the
 * stale tab's autosave destroys the local copy in the same moment — the buyer
 * re-sits the module, and the CCM certificate gate re-locks.
 *
 * Proven with the real functions:
 *   tab A saves module 3 {startedAt, quizCompleted, completed}
 *   tab B ticks its 60s study timer and saves {startedAt, activeStudyMinutes}
 *   -> stored module 3 completed = false, quizScore = null
 *
 * The fix is to merge FIELDS rather than choose an entry. Every field here is
 * monotone in the direction of "more work done", which is the same contract the
 * client's mergeModuleProgress already implements — the server was the only
 * side that could still go backwards.
 *
 * TYPE-AGNOSTIC BY DESIGN: the client holds Date objects, the DB holds ISO
 * strings. Timestamps are compared by value and returned as whichever ORIGINAL
 * was chosen, so neither side is coerced into the other's representation.
 */

type Json = Record<string, unknown>

/** A stored/incoming entry carries progress a user would be upset to lose. */
export function hasRealProgress(p: Json): boolean {
  return (
    p.completed === true ||
    p.quizCompleted === true ||
    Boolean(p.startedAt) ||
    (p.quizAnswers != null &&
      typeof p.quizAnswers === 'object' &&
      Object.keys(p.quizAnswers as Json).length > 0) ||
    (typeof p.activeStudyMinutes === 'number' && p.activeStudyMinutes > 0)
  )
}

/** ms since epoch for a Date | ISO string, or null when unusable. */
function ms(v: unknown): number | null {
  if (v == null) return null
  const t = v instanceof Date ? v.getTime() : new Date(String(v)).getTime()
  return Number.isNaN(t) ? null : t
}

/** Whichever timestamp is earlier, preserving the original representation. */
function earliest(a: unknown, b: unknown): unknown {
  const ta = ms(a)
  const tb = ms(b)
  if (ta === null) return b ?? a ?? null
  if (tb === null) return a
  return ta <= tb ? a : b
}

/** Whichever timestamp is later, preserving the original representation. */
function latest(a: unknown, b: unknown): unknown {
  const ta = ms(a)
  const tb = ms(b)
  if (ta === null) return b ?? a ?? null
  if (tb === null) return a
  return ta >= tb ? a : b
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const answerCount = (v: unknown): number =>
  v != null && typeof v === 'object' ? Object.keys(v as Json).length : 0

/** Union two attempt logs by timestamp, oldest first, capped. Mirrors the client. */
const MAX_ATTEMPT_HISTORY = 25
function mergeAttemptHistory(a: unknown, b: unknown): unknown {
  const la = Array.isArray(a) ? a : []
  const lb = Array.isArray(b) ? b : []
  if (la.length === 0 && lb.length === 0) return a ?? b ?? null
  const seen = new Map<string, unknown>()
  for (const e of [...la, ...lb]) {
    if (e && typeof e === 'object' && typeof (e as Json).at === 'string') {
      seen.set((e as Json).at as string, e)
    }
  }
  return [...seen.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([, e]) => e)
    .slice(-MAX_ATTEMPT_HISTORY)
}

/**
 * Merge one module's stored and incoming entries, keeping the more advanced
 * value on every axis. Never returns less progress than either input.
 *
 * Quiz fields travel TOGETHER (a score is meaningless beside another attempt's
 * answers): they are taken wholesale from whichever side is further along, with
 * the incoming side winning a tie so the latest submission stays authoritative
 * — the certificate route re-verifies the stored answers, so the live set must
 * be the most recent one.
 *
 * EXCEPT when the tie-winner carries NO answers (2026-08-06 state audit). Every
 * other axis in this function is monotone; quiz answers were the one field that
 * could go BACKWARDS, and they are the only thing /api/certificate actually
 * trusts (lib/quiz-verify.ts returns 'no-answers' → a hard 403 on the CPD
 * document). A client that posts a completed quiz with quizAnswers null — every
 * pre-2026-08 record does, see the migration in contexts/ProgressContext.tsx —
 * tied on score with a stored entry that HAS the answers, won the tie, and
 * overwrote the evidence with null. Measured on production 2026-08-06: 4 such
 * rows across 2 accounts, one of them a paying customer, permanently unable to
 * download a certificate they had passed. An answer-less submission is not a
 * "more recent authoritative" one — it is the same attempt with the proof
 * missing, so it must never displace a side that still holds it.
 */
export function mergeProgressEntry(stored: Json, incoming: Json): Json {
  const storedRank = stored.quizCompleted === true ? 2 + num(stored.quizScore) : answerCount(stored.quizAnswers) > 0 ? 1 : 0
  const incomingRank = incoming.quizCompleted === true ? 2 + num(incoming.quizScore) : answerCount(incoming.quizAnswers) > 0 ? 1 : 0
  const incomingHasAnswers = answerCount(incoming.quizAnswers) > 0
  const storedHasAnswers = answerCount(stored.quizAnswers) > 0
  const quizSource =
    incomingRank > storedRank
      ? incoming
      : incomingRank < storedRank
        ? stored
        // Tie: latest wins, unless it would trade real answers for none.
        : (!incomingHasAnswers && storedHasAnswers) ? stored : incoming

  return {
    // Anything either side knows about, with the fields below taking precedence.
    ...stored,
    ...incoming,

    moduleId: incoming.moduleId ?? stored.moduleId,
    // Monotone: a completion recorded anywhere is never un-recorded by a save.
    completed: stored.completed === true || incoming.completed === true,
    completedAt: earliest(stored.completedAt, incoming.completedAt),

    quizCompleted: stored.quizCompleted === true || incoming.quizCompleted === true,
    quizScore: quizSource.quizScore ?? null,
    quizTotalQuestions: quizSource.quizTotalQuestions ?? null,
    quizAnswers:
      quizSource.quizCompleted === true
        ? (quizSource.quizAnswers ?? null)
        : answerCount(incoming.quizAnswers) >= answerCount(stored.quizAnswers)
          ? (incoming.quizAnswers ?? null)
          : (stored.quizAnswers ?? null),
    quizSubmittedAt: latest(stored.quizSubmittedAt, incoming.quizSubmittedAt),
    // Attempts only ever go UP — a device that saw fewer submissions must not
    // erase attempts recorded elsewhere.
    quizAttempts: Math.max(num(stored.quizAttempts), num(incoming.quizAttempts)),
    quizAttemptHistory: mergeAttemptHistory(stored.quizAttemptHistory, incoming.quizAttemptHistory),

    startedAt: earliest(stored.startedAt, incoming.startedAt),
    activeStudyMinutes: Math.max(num(stored.activeStudyMinutes), num(incoming.activeStudyMinutes)),
    lastActiveAt: latest(stored.lastActiveAt, incoming.lastActiveAt),
  }
}

/**
 * Apply the stored row over the map about to be persisted.
 *
 * Every stored module id is considered, not just the gated ones: full-overwrite
 * semantics hurt the ordinary two-tab case just as badly, and Module 1 — the
 * first module every buyer studies — was among the ids left unprotected.
 */
export function retainStoredProgress(
  toPersist: Record<string, unknown>,
  stored: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!stored || typeof stored !== 'object') return toPersist
  for (const [k, v] of Object.entries(stored)) {
    if (!v || typeof v !== 'object') continue
    const incoming = toPersist[k]
    if (incoming == null || typeof incoming !== 'object') {
      // Key absent entirely (e.g. stripped as unentitled) — keep the history.
      if (hasRealProgress(v as Json)) toPersist[k] = v
      continue
    }
    toPersist[k] = mergeProgressEntry(v as Json, incoming as Json)
  }
  return toPersist
}
