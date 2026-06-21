/**
 * Return-to-Sport / Return-to-Learn pathway engine.
 *
 * The AU-guideline state machine behind the RTP Tracker. Pure functions, no I/O,
 * no `Date.now()` — every time-dependent call takes an injected `now` (ISO) so
 * the logic is deterministic and unit-testable, and reusable identically across
 * the athlete/parent surface, the institution dashboard and the clinician hub.
 *
 * EVIDENCE BASE (referenced inline; full citations in the RTP spec + course):
 *  - AIS / SMA / ACSEP 2024 Australian Concussion Guidelines for Youth &
 *    Community Sport, and the Amsterdam 2023 (6th) International Consensus
 *    Statement on Concussion in Sport (Patricios et al., BJSM 2023).
 *  - Graded Return to Sport (GRTS): a stepwise progression, >=24 hours at each
 *    stage with no symptom worsening before advancing; symptom worsening drops
 *    the athlete back a stage and restarts that stage's 24-hour clock.
 *  - Youth & community AU rules: a minimum 21-day stand-down from the injury
 *    date before any return to contact/collision, AND at least 14 days
 *    symptom-free before commencing contact training. The earliest contact date
 *    is the LATER of (injury + 21d) and (symptom-free + 14d).
 *  - Full-contact practice (the contact gate) requires a recorded
 *    medical-practitioner clearance. This tool TRACKS and RECOMMENDS; it never
 *    clears — scope-accurate, the same discipline as the course.
 *  - Return to Learn (RTL) runs in parallel and must be complete (full-time
 *    school) before contact.
 *  - Red-flag symptoms halt the pathway and trigger emergency/medical referral.
 */

// ── Stages ──────────────────────────────────────────────────────────────────

/**
 * Graded Return to Sport stage (0-6). Anchored to the prompt/spec scheme:
 * 0 = symptom-limited activity … 5 = full-contact practice (clearance-gated) …
 * 6 = return to competition. Stages 0-4 are non-contact; entry to 5 is the gate.
 */
export type GrtsStage = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Return to Learn stage (0-4). Parallel to GRTS; stage 4 (full-time school) must
 * be reached before contact training (GRTS stage 5).
 */
export type RtlStage = 0 | 1 | 2 | 3 | 4

export const GRTS_STAGE_NAMES: Record<GrtsStage, string> = {
  0: 'Symptom-limited activity',
  1: 'Light aerobic exercise',
  2: 'Sport-specific exercise',
  3: 'Non-contact training drills',
  4: 'Progressive non-contact training',
  5: 'Full-contact practice',
  6: 'Return to competition',
}

export const RTL_STAGE_NAMES: Record<RtlStage, string> = {
  0: 'Initial rest (no school)',
  1: 'Daily activities at home',
  2: 'School activities at home (homework, reading)',
  3: 'Return to school part-time',
  4: 'Return to school full-time',
}

/** The contact gate: full-contact practice. */
export const GRTS_CONTACT_STAGE: GrtsStage = 5
/** Terminal stage: returned to competition. */
export const GRTS_RETURN_STAGE: GrtsStage = 6
/** RTL is "complete" (full-time school) at stage 4. */
export const RTL_COMPLETE_STAGE: RtlStage = 4

// ── Rule constants (AU youth & community) ───────────────────────────────────

/** >=24 hours at a stage with no symptom worsening before advancing. */
export const HOURS_PER_STAGE = 24
/** Minimum 21-day stand-down from the injury date before contact/collision. */
export const STAND_DOWN_DAYS = 21
/** At least 14 days symptom-free before commencing contact training. */
export const SYMPTOM_FREE_DAYS = 14

// ── Data shapes ─────────────────────────────────────────────────────────────

export interface SymptomLog {
  /** ISO timestamp of the check-in. */
  loggedAt: string
  /** 22-item PCSS total (0-132); higher = worse. */
  pcssTotal: number
  /** A red-flag symptom (emergency referral trigger) was reported. */
  redFlag: boolean
}

export interface Episode {
  /** ISO date of injury — the start of the 21-day stand-down clock. */
  injuryDate: string
  /** ISO date the athlete first became symptom-free — starts the 14-day clock. */
  symptomFreeDate?: string
  grtsStage: GrtsStage
  rtlStage: RtlStage
  /** ISO timestamp the current GRTS stage was entered (the 24-hour clock). */
  stageEnteredAt: string
  /**
   * PCSS load recorded on entry to the current stage. Used by applySymptomLog to
   * detect within-stage worsening for the 24-hour-rule regression. Optional so
   * callers that drive state purely through canAdvanceGrts/pathwayState (which
   * derive the baseline from the in-stage logs) need not maintain it.
   */
  stageBaselinePcss?: number
  /** A clinician has recorded medical clearance for full-contact practice. */
  clearedForContact?: boolean
}

export type AdvanceBlocker =
  | 'time-in-stage'      // <24h at the current stage
  | 'symptoms'           // symptoms worsened within the stage
  | 'stand-down'         // before injury + 21 days
  | 'symptom-free'       // not yet 14 days symptom-free (or not symptom-free yet)
  | 'rtl-incomplete'     // Return to Learn not yet full-time school
  | 'awaiting-clearance' // contact gate: no recorded medical clearance
  | 'red-flag'           // halted — emergency/medical referral

export interface AdvanceCheck {
  eligible: boolean
  reason: string
  blockedBy?: AdvanceBlocker
}

export interface PathwayState {
  grtsStage: GrtsStage
  grtsStageName: string
  rtlStage: RtlStage
  rtlStageName: string
  /** Eligibility to advance the GRTS stage right now. */
  advance: AdvanceCheck
  /** Projected earliest return-to-contact date (later-of-two-clocks), or null. */
  earliestContactDate: string | null
  /** Projected earliest return-to-competition date (contact + one 24h block). */
  projectedReturnToCompetition: string | null
  /** A red-flag symptom has been logged — halt + refer. */
  redFlag: boolean
  /** Symptoms have worsened within the current stage (regression territory). */
  regression: boolean
  /** Holding at the contact gate pending a recorded medical clearance. */
  awaitingClearance: boolean
  /** Plain-language status for the UI. */
  status: string
}

// ── Date helpers (UTC, deterministic) ───────────────────────────────────────

const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000

const ms = (iso: string): number => Date.parse(iso)
const addDaysIso = (iso: string, days: number): string =>
  new Date(ms(iso) + days * MS_PER_DAY).toISOString()
const hoursBetween = (fromIso: string, toIso: string): number =>
  (ms(toIso) - ms(fromIso)) / MS_PER_HOUR
/** Calendar date (YYYY-MM-DD, UTC) of a millisecond instant — for messaging. */
const isoDate = (millis: number): string => new Date(millis).toISOString().slice(0, 10)

// ── Pure rule functions ─────────────────────────────────────────────────────

/** A red-flag symptom was reported on this check-in. */
export function redFlagCheck(log: SymptomLog): boolean {
  return log.redFlag === true
}

/**
 * The earliest date contact/collision may resume — the LATER of the two AU
 * clocks: (injuryDate + 21 days) stand-down and (symptomFreeDate + 14 days)
 * symptom-free. Returns null while the athlete is not yet symptom-free, because
 * the 14-day symptom-free clock has not started and the date is not yet knowable.
 */
export function earliestContactDate(
  injuryDate: string,
  symptomFreeDate?: string,
): string | null {
  if (!symptomFreeDate) return null
  const standDownClear = ms(injuryDate) + STAND_DOWN_DAYS * MS_PER_DAY
  const symptomFreeClear = ms(symptomFreeDate) + SYMPTOM_FREE_DAYS * MS_PER_DAY
  return new Date(Math.max(standDownClear, symptomFreeClear)).toISOString()
}

/** Logs recorded at/after the current stage was entered, oldest-first. */
function inStageLogs(episode: Episode, logs: SymptomLog[]): SymptomLog[] {
  const entered = ms(episode.stageEnteredAt)
  return logs
    .filter((l) => ms(l.loggedAt) >= entered)
    .sort((a, b) => ms(a.loggedAt) - ms(b.loggedAt))
}

/** True if any in-stage check-in rose above the level the stage was entered at. */
function worsenedInStage(episode: Episode, logs: SymptomLog[]): boolean {
  const inStage = inStageLogs(episode, logs)
  if (inStage.length < 2) return false
  const base = inStage[0].pcssTotal
  return inStage.some((l) => l.pcssTotal > base)
}

/**
 * Whether the athlete is eligible to advance the GRTS stage now, and if not, the
 * binding blocker. Encodes, in priority order: red-flag halt → terminal stage →
 * within-stage symptom worsening → the >=24h-in-stage rule → and (only when
 * entering full contact, GRTS stage 4 -> 5) the RTL-complete requirement, the
 * later-of-two-clocks stand-down/symptom-free gate, and the recorded
 * medical-clearance gate. The engine NEVER auto-advances into contact.
 */
export function canAdvanceGrts(
  episode: Episode,
  logs: SymptomLog[],
  now: string,
): AdvanceCheck {
  // 0. Red-flag symptom anywhere in the episode halts all progression.
  if (logs.some(redFlagCheck)) {
    return {
      eligible: false,
      blockedBy: 'red-flag',
      reason:
        'A red-flag symptom has been logged. Halt the pathway and arrange urgent medical review — no progression.',
    }
  }

  // Terminal: already returned to competition.
  if (episode.grtsStage >= GRTS_RETURN_STAGE) {
    return {
      eligible: false,
      reason: 'Already at return to competition — the graded pathway is complete.',
    }
  }

  // 1. No symptom worsening within the stage (the 24-hour rule's pre-condition).
  if (worsenedInStage(episode, logs)) {
    return {
      eligible: false,
      blockedBy: 'symptoms',
      reason:
        'Symptoms have worsened at this stage. Hold (or drop back a stage) — the 24-hour clock must run with no worsening before advancing.',
    }
  }

  // 2. At least 24 hours at the current stage.
  const hrs = hoursBetween(episode.stageEnteredAt, now)
  if (hrs < HOURS_PER_STAGE) {
    const remaining = Math.max(0, Math.ceil(HOURS_PER_STAGE - hrs))
    return {
      eligible: false,
      blockedBy: 'time-in-stage',
      reason: `At least ${HOURS_PER_STAGE} hours with no symptom worsening are needed at this stage before advancing (${remaining} h remaining).`,
    }
  }

  // 3. Gates specific to ENTERING full-contact practice (stage 4 -> 5).
  if (episode.grtsStage === 4) {
    // 3a. Return to Learn must be complete (full-time school).
    if (episode.rtlStage < RTL_COMPLETE_STAGE) {
      return {
        eligible: false,
        blockedBy: 'rtl-incomplete',
        reason:
          'Return to Learn must be complete (full-time school) before contact training.',
      }
    }

    // 3b. The two calendar clocks — the later of the two binds.
    const standDownClear = ms(episode.injuryDate) + STAND_DOWN_DAYS * MS_PER_DAY
    if (!episode.symptomFreeDate) {
      return {
        eligible: false,
        blockedBy: 'symptom-free',
        reason: `Not yet symptom-free — the ${SYMPTOM_FREE_DAYS}-day symptom-free clock for contact training has not started.`,
      }
    }
    const symptomFreeClear =
      ms(episode.symptomFreeDate) + SYMPTOM_FREE_DAYS * MS_PER_DAY
    if (ms(now) < Math.max(standDownClear, symptomFreeClear)) {
      // Report whichever clock is the binding (later) constraint.
      if (symptomFreeClear >= standDownClear) {
        return {
          eligible: false,
          blockedBy: 'symptom-free',
          reason: `At least ${SYMPTOM_FREE_DAYS} days symptom-free are required before contact training (earliest ${isoDate(symptomFreeClear)}).`,
        }
      }
      return {
        eligible: false,
        blockedBy: 'stand-down',
        reason: `A minimum ${STAND_DOWN_DAYS}-day stand-down from injury is required before contact (earliest ${isoDate(standDownClear)}).`,
      }
    }

    // 3c. Recorded medical clearance — the engine tracks/recommends, never clears.
    if (episode.clearedForContact !== true) {
      return {
        eligible: false,
        blockedBy: 'awaiting-clearance',
        reason:
          'Awaiting recorded medical clearance for full-contact practice. The pathway cannot enter contact until a clinician records clearance.',
      }
    }
  }

  const next = (episode.grtsStage + 1) as GrtsStage
  return {
    eligible: true,
    reason: `Eligible to advance to "${GRTS_STAGE_NAMES[next]}".`,
  }
}

/**
 * Apply a single symptom check-in, returning a new Episode (pure). Implements the
 * 24-hour rule: a within-stage worsening (PCSS above the stage-entry baseline)
 * drops the athlete back one GRTS stage and resets that stage's 24-hour clock to
 * the worsening check-in. A red-flag log halts (no stage change here — the halt
 * is surfaced by canAdvanceGrts/pathwayState). The first log of a stage
 * establishes the baseline; stable/improving logs leave the stage unchanged.
 */
export function applySymptomLog(episode: Episode, log: SymptomLog): Episode {
  // Red flag: do not mutate the stage — the halt is derived from the logs.
  if (redFlagCheck(log)) return episode

  // First check-in of the stage establishes the worsening baseline.
  if (episode.stageBaselinePcss === undefined) {
    return { ...episode, stageBaselinePcss: log.pcssTotal }
  }

  // Worsening above the stage-entry baseline → regress one stage + reset clock.
  if (log.pcssTotal > episode.stageBaselinePcss) {
    const regressed = Math.max(0, episode.grtsStage - 1) as GrtsStage
    return {
      ...episode,
      grtsStage: regressed,
      stageEnteredAt: log.loggedAt,
      stageBaselinePcss: log.pcssTotal,
    }
  }

  // Stable or improving: hold the stage and the existing baseline.
  return episode
}

/**
 * The overall pathway snapshot: current stages, advancement eligibility, the
 * projected earliest contact + return-to-competition dates, and the red-flag /
 * regression / clearance signals, with a plain-language status string for the UI.
 */
export function pathwayState(
  episode: Episode,
  logs: SymptomLog[],
  now: string,
): PathwayState {
  const advance = canAdvanceGrts(episode, logs, now)
  const redFlag = logs.some(redFlagCheck)
  const regression = worsenedInStage(episode, logs)
  const contactDate = earliestContactDate(episode.injuryDate, episode.symptomFreeDate)
  // One clean 24-hour block at full-contact practice (stage 5) precedes
  // competition (stage 6), so the earliest competition date is contact + 1 day.
  const projectedReturnToCompetition = contactDate ? addDaysIso(contactDate, 1) : null
  const awaitingClearance =
    advance.blockedBy === 'awaiting-clearance' ||
    (episode.grtsStage === GRTS_CONTACT_STAGE && episode.clearedForContact !== true)

  const name = GRTS_STAGE_NAMES[episode.grtsStage]
  let status: string
  if (redFlag) {
    status =
      'Red flag reported — stop all activity and seek urgent medical review. No progression.'
  } else if (episode.grtsStage >= GRTS_RETURN_STAGE) {
    status = 'Returned to competition — the graded pathway is complete.'
  } else if (regression) {
    status = `Symptoms worsened at "${name}". Hold or drop back a stage and restart the 24-hour symptom-free clock.`
  } else if (awaitingClearance) {
    status = `Holding at the contact gate — awaiting recorded medical clearance for full-contact practice.`
  } else if (advance.eligible) {
    const next = (episode.grtsStage + 1) as GrtsStage
    status = `At "${name}". Eligible to advance to "${GRTS_STAGE_NAMES[next]}".`
  } else {
    status = `At "${name}". ${advance.reason}`
  }

  return {
    grtsStage: episode.grtsStage,
    grtsStageName: name,
    rtlStage: episode.rtlStage,
    rtlStageName: RTL_STAGE_NAMES[episode.rtlStage],
    advance,
    earliestContactDate: contactDate,
    projectedReturnToCompetition,
    redFlag,
    regression,
    awaitingClearance,
    status,
  }
}
