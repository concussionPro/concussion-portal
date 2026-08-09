/**
 * SST RESEARCH DATA LAYER — the structure that makes later analysis and
 * publication possible without re-contacting anyone.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CENTRAL DESIGN DECISION: LINKABILITY NOW, PERMISSION LATER.
 *
 * You cannot retroactively consent a participant. You CAN retroactively analyse
 * data that was already structured, de-identified and linkable at the moment it
 * was collected — either because the participant consents later, or because an
 * HREC grants a waiver of consent for low-risk de-identified secondary use
 * (NHMRC National Statement 2.3.10).
 *
 * Both of those routes are only open if a STABLE PSEUDONYMOUS KEY existed at
 * collection time. If it didn't, the back catalogue is unusable no matter what
 * anyone later agrees to, because you cannot tell which rows belong to the
 * person doing the agreeing.
 *
 * So: `researchRef` is minted for EVERY participant from first use. It is an
 * opaque random UUID carrying no personal information — minting it is not
 * research, collects nothing extra, and needs no consent. What consent gates is
 * USE, recorded per session as `researchConsentVersion`. That single split is
 * what makes the archive salvageable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A SECOND CONSENT AT ALL.
 *
 * The existing `dataConsent` in store.ts is deliberately scoped to quality
 * assurance and service evaluation, and its own comment says so: "NOT
 * research-purpose; that distinction keeps collection out of the HREC gate."
 * That was the right call for shipping, but it means nothing gathered under it
 * may be published. Service-evaluation exemptions do not cover generalisable
 * findings.
 *
 * `RESEARCH_CONSENT` is therefore separate, explicit, opt-in, versioned, and
 * independently revocable. A participant may consent to QA and decline
 * research; the reverse is not offered, because research use presupposes the
 * QA-grade collection.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DE-IDENTIFICATION IS DONE ON THE CLIENT, BEFORE TRANSMISSION.
 *
 * The server never receives a date of birth or a date of injury. It receives
 * `ageBand` and `daysSinceInjury` — both derived locally. This is deliberate:
 * a date of injury plus a clinic plus a session timestamp is close to
 * re-identifying in a small city, and "we hold it but promise not to look" is a
 * weaker position than not holding it.
 *
 * Days-since-injury is the single most important covariate in concussion
 * recovery research. Without it a threshold trajectory cannot be separated from
 * natural history, and the dataset is close to uninterpretable. It is the one
 * field that most needs to exist before volume arrives.
 */

/**
 * Bump when the participant-facing wording materially changes. Stored per
 * session so an analysis can state exactly what each participant agreed to,
 * and so a wording change never silently re-scopes past consent.
 */
export const RESEARCH_CONSENT_VERSION = 1

/**
 * WHAT VERSION 1 COVERS — the wording an HREC approves and a participant agrees
 * to. Held here so the scope is reviewable in a diff rather than living only in
 * a PDF, and so a change to it forces a version bump next to the change.
 *
 * THE LINKAGE CLAUSE IS THE ONE THAT CANNOT BE RETROFITTED. Every other gap in
 * this design is recoverable later: researchRef is minted for everyone from
 * first use, so a consent obtained afterwards — or an HREC waiver — can still
 * reach data already collected. Consent to LINK to records held outside this
 * product cannot be obtained retrospectively in the same way, because a
 * participant who was never told linkage was contemplated has not agreed to it,
 * and no architecture fixes that.
 *
 * It is named explicitly rather than implied because the highest-value planned
 * analysis depends on it: whether exercise-tolerance trajectory predicts
 * recovery BEYOND the neurocognitive testing a clinic already performs. That
 * comparison needs the clinic's own neurocognitive records joined to SST
 * sessions at episode grain. An HREC will require the linkage named, not
 * inferred from a general "research use" clause.
 *
 * NOTE ON DIRECTION OF TRANSFER: linkage happens at the CLINIC, which holds the
 * mapping from patient to record. Only de-identified, researchRef-keyed rows
 * move to CEA. Receiving identifiable neurocognitive records here would defeat
 * the pseudonymity the rest of this module exists to guarantee.
 */
export const RESEARCH_CONSENT_SCOPE_V1 = [
  'use of de-identified session data (heart rate, symptoms, adherence) for research',
  'use of de-identified demographic and injury-timing information',
  'linkage, performed by the treating clinic, to neurocognitive or other clinical ' +
    'assessment records the clinic already holds for the same episode of care',
  'publication of aggregate findings that cannot identify an individual',
  'sharing of the de-identified dataset with independent researchers for re-analysis',
] as const

/**
 * Age BANDS, never a birth date. Bands are sufficient for the covariate
 * (adolescents recover differently from adults) and materially harder to
 * re-identify from. The youngest band starts at 13 because the product is not
 * validated below that and a child cohort carries its own ethics requirements.
 */
export const AGE_BANDS = ['13-17', '18-24', '25-34', '35-49', '50-64', '65+'] as const
export type AgeBand = (typeof AGE_BANDS)[number]

/**
 * Recorded as reported. 'other' and 'undisclosed' are distinct: one is an
 * answer, the other is a refusal, and collapsing them loses information and is
 * disrespectful. Both are analysed as-is, never imputed.
 */
export const SEXES = ['female', 'male', 'other', 'undisclosed'] as const
export type Sex = (typeof SEXES)[number]

/** How an episode of care ended — the endpoint a trajectory needs. */
export const EPISODE_OUTCOMES = [
  'resolved-cleared',   // objective resolution on re-test, clinician cleared
  'resolved-no-clear',  // symptoms resolved, no formal clearance recorded
  'referred-on',        // escalated to another discipline
  'discontinued',       // patient stopped attending
  'lost-to-followup',
] as const
export type EpisodeOutcome = (typeof EPISODE_OUTCOMES)[number]

/**
 * Episode-level record: one INJURY, not one patient. A patient with two
 * concussions eighteen months apart is two episodes and must never be pooled —
 * prior concussion is itself a recovery modifier.
 */
export interface ResearchEpisode {
  episodeRef: string
  researchRef: string
  clinicCode: string
  consentVersion: number | null
  ageBand: AgeBand | null
  sex: Sex | null
  /** Days from injury to the FIRST session of this episode. */
  daysInjuryToFirstSession: number | null
  priorConcussions: number | null
  /** Validated symptom score (PCSS/SCAT6 symptom severity, 0-132) at intake. */
  baselineSymptomScore: number | null
  dischargeSymptomScore: number | null
  outcome: EpisodeOutcome | null
  /** Days from injury to return to sport/work, when one was recorded. */
  daysInjuryToReturn: number | null
}

/**
 * The maximum score on the SCAT6 / PCSS symptom-severity scale: 22 items rated
 * 0-6. Bounds-checked on write so a page that sends a 0-10 single item (what
 * the product captures today) can never be silently stored as if it were the
 * validated instrument.
 */
export const SYMPTOM_SCORE_MAX = 132

export function isValidSymptomScore(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= SYMPTOM_SCORE_MAX
}

/**
 * Days since injury, computed on the client from a date the server never sees.
 * Returns null rather than a guess for anything implausible — a negative value
 * (injury "after" the session) or an interval beyond two years is a data-entry
 * error, and a wrong covariate is worse than a missing one because it silently
 * biases the model instead of dropping the row.
 */
export const MAX_DAYS_SINCE_INJURY = 730

export function daysSinceInjury(injuryISO: string, sessionAt: Date): number | null {
  const injury = new Date(injuryISO)
  if (Number.isNaN(injury.getTime())) return null
  const days = Math.floor((sessionAt.getTime() - injury.getTime()) / 86_400_000)
  if (days < 0 || days > MAX_DAYS_SINCE_INJURY) return null
  return days
}

/** Age band from a birth year — the client never transmits the year itself. */
export function ageBandFromBirthYear(birthYear: number, now: Date): AgeBand | null {
  if (!Number.isInteger(birthYear)) return null
  const age = now.getFullYear() - birthYear
  if (age < 13 || age > 120) return null
  if (age < 18) return '13-17'
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 50) return '35-49'
  if (age < 65) return '50-64'
  return '65+'
}

/**
 * The research fields a session carries. Every one is optional: a clinic that
 * never enrols anyone in research keeps working exactly as before, and a
 * participant who declines simply has `researchConsentVersion === null`.
 */
export interface SessionResearchFields {
  researchRef?: string
  episodeRef?: string
  researchConsentVersion?: number | null
  daysSinceInjury?: number | null
}

/** Opaque, no personal information, safe to mint for everyone from first use. */
export function isResearchRef(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

/**
 * Normalise the research fields off an untrusted sync payload.
 *
 * FAILS TO NULL, NEVER TO A DEFAULT. In particular `researchConsentVersion` is
 * only accepted as a positive integer no greater than the current version —
 * a client claiming consent version 99 is claiming agreement to wording that
 * does not exist, and a truthy-coercion here would enrol someone in a study
 * they never agreed to. This is the one field in the product where a permissive
 * parse is an ethics breach rather than a bug.
 */
export function parseSessionResearchFields(payload: unknown): SessionResearchFields {
  const p = (payload ?? {}) as Record<string, unknown>
  const out: SessionResearchFields = {}

  if (isResearchRef(p.researchRef)) out.researchRef = p.researchRef.toLowerCase()
  if (isResearchRef(p.episodeRef)) out.episodeRef = p.episodeRef.toLowerCase()

  const v = p.researchConsentVersion
  out.researchConsentVersion =
    typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= RESEARCH_CONSENT_VERSION ? v : null

  const d = p.daysSinceInjury
  out.daysSinceInjury =
    typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= MAX_DAYS_SINCE_INJURY ? d : null

  // Consent is what licenses USE. Without it the covariate is still stored —
  // it is de-identified and was collected for care — but the extract below
  // filters the row out, so nothing unconsented reaches an analysis.
  return out
}

/**
 * WHAT AN ANALYSIS MAY SEE.
 *
 * A single place that defines the consented cohort, so no ad-hoc query can
 * quietly widen it. Two conditions, both required:
 *   - the session carries a research consent version, AND
 *   - it carries a researchRef, so it can be attributed to a participant.
 *
 * `minConsentVersion` exists for the case where wording changes materially
 * enough that an HREC restricts an analysis to the newer cohort.
 */
export function researchCohortFilterSql(minConsentVersion = 1): string {
  return `research_consent_version IS NOT NULL
      AND research_consent_version >= ${Number(minConsentVersion) || 1}
      AND research_ref IS NOT NULL`
}

/**
 * The primary analysis this dataset exists to support.
 *
 * Almost every SSTAE study reports PRESCRIBED dose. This product records
 * DELIVERED dose — seconds below/in/above the prescribed band, with heart-rate
 * readings marked verified only when they came from a live sensor feed — and
 * pairs it with a next-day check-in. That combination is what makes the
 * following question answerable, and it is currently answered by convention
 * rather than by measurement:
 *
 *   Does time spent above the sub-symptom band predict next-day symptom
 *   exacerbation, and is there a tolerable excursion budget?
 *
 * It is worth running whichever way it falls. A dose-response quantifies a rule
 * that is presently asserted; a null result de-escalates a restriction that
 * makes the intervention burdensome and plausibly drives dropout.
 *
 * The unit of analysis is the SESSION, nested within episode within
 * participant — which is why the required participant n is far lower than a
 * between-subjects design would need. At roughly fifteen sessions per episode,
 * 60-80 participants yields on the order of a thousand session observations.
 *
 * ANALYSIS MUST BE MIXED-EFFECTS. Sessions within a participant are not
 * independent, and someone who flares easily contributes many correlated rows.
 * Pooling them would inflate significance — the most likely way this dataset
 * produces a wrong published answer.
 */
export const PRIMARY_ANALYSIS_UNIT = 'session' as const

/** Verified-adherence floor for a session to enter the primary analysis. A
 *  typed-in heart rate cannot evidence time-above-band, so unverified sessions
 *  are descriptive only. Mirrors VERIFIED_READING_MIN_PCT in protocol.ts. */
export const RESEARCH_MIN_VERIFIED_PCT = 80


/**
 * ═════════════════════════════════════════════════════════════════════════════
 * FLARE — THE PRIMARY OUTCOME DEFINITION. LOCKED BEFORE DATA.
 *
 * This constant exists so the definition is fixed in a commit that predates the
 * first observation. Choosing a flare threshold after seeing the distribution is
 * the most available form of outcome switching in this study, and it would be
 * invisible in the write-up. Changing any value below after recruitment opens
 * must be a visible commit with a stated reason, and must be disclosed.
 *
 * MAGNITUDE: >= 2 points on the 0-10 symptom item. Chosen to match the
 * >= 2-point rise that already terminates a training session in protocol.ts
 * (SESSION_STOP_RISE), so "what counts as worse" means the same thing in the
 * prescription and in the analysis. A 1-point move on a 0-10 single item is
 * within measurement noise.
 *
 * DURATION: sustained at the next-day check-in, 12-36h after the session. PEM
 * and exertional exacerbation are characteristically DELAYED, so an immediate
 * post-session reading would miss the phenomenon entirely; that is what
 * `endFeel` captures separately and it is NOT the outcome.
 *
 * MISSING IS NOT NEGATIVE. A patient who does not answer is unobserved. Coding
 * silence as "no flare" would bias the estimate toward the null, and the people
 * least likely to answer are the ones who feel worst.
 */
export const FLARE_MIN_RISE = 2
export const FLARE_WINDOW_HOURS = { min: 12, max: 36 } as const

export type FlareOutcome = 'flare' | 'no-flare' | 'unobserved'

export function classifyFlare(
  preSymptom: number | null | undefined,
  nextDaySymptom: number | null | undefined,
  answered: boolean,
): FlareOutcome {
  if (!answered || typeof nextDaySymptom !== 'number' || typeof preSymptom !== 'number') {
    return 'unobserved'
  }
  return nextDaySymptom - preSymptom >= FLARE_MIN_RISE ? 'flare' : 'no-flare'
}

/**
 * WHY A DAY HAD NO SESSION.
 *
 * Without this, a gap between sessions is uninterpretable — and gaps are the
 * comparator the whole exacerbation claim rests on. A day off because the
 * clinician paused training is clinically different from a day off because the
 * patient felt terrible, which is different again from a day off because they
 * were at a wedding. Pooling them makes rest days look bad for reasons that have
 * nothing to do with rest.
 *
 * This does NOT make the rest-day comparator clean — days skipped for symptoms
 * remain confounded with the outcome. It makes the confounding VISIBLE and
 * adjustable rather than baked in.
 */
export const MISSED_SESSION_REASONS = [
  'symptomatic',        // felt too unwell — CONFOUNDED with the outcome
  'clinician-paused',   // interlock or clinical decision
  'rest-day',           // prescribed or planned non-training day
  'life',               // work, travel, unrelated illness
  'forgot',
  'other',
] as const
export type MissedSessionReason = (typeof MISSED_SESSION_REASONS)[number]

/** Reasons that are NOT independent of symptom state. Any analysis using rest
 *  days as a comparator must handle these separately or exclude them. */
export const CONFOUNDED_MISS_REASONS: readonly MissedSessionReason[] = ['symptomatic', 'clinician-paused']

export function isMissedSessionReason(v: unknown): v is MissedSessionReason {
  return typeof v === 'string' && (MISSED_SESSION_REASONS as readonly string[]).includes(v)
}

/**
 * A DAY-LEVEL observation: the row that makes exacerbation attributable.
 *
 * Every symptom datum in the product currently hangs off a session, so days
 * without a session are invisible. A flare rate measured only on training days
 * describes the natural fluctuation of concussion as much as the response to a
 * dose. This is the comparator.
 */
export interface DailyCheckin {
  researchRef?: string
  /** Local date the check-in refers to (YYYY-MM-DD), client-derived. */
  onDate: string
  symptomScore: number
  trained: boolean
  missedReason?: MissedSessionReason
  daysSinceInjury?: number | null
}
