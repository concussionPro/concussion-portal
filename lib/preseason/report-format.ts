/**
 * Report formatting for pre-season baselines: print an unanswered field as
 * unanswered.
 *
 * WHY THIS EXISTS. A baseline is the reference every future post-injury
 * comparison is measured against, so a blank must never be rendered as a
 * clinical value the athlete never gave. Two fields used to arrive pre-answered
 * and were printed as fact:
 *
 *   - `previousConcussions` was seeded '0', so an athlete who never touched it
 *     filed a baseline asserting NO previous concussions — the single strongest
 *     risk factor, fabricated as a negative.
 *   - `feelNormalPercent` was seeded '100' on a slider with no null position,
 *     so scrolling past filed "100% of normal" — a perfect asymptomatic
 *     reference.
 *
 * Both now default to '' in the form (see app/preseason/b/[code]/page.tsx), the
 * same doctrine already applied to the 22-item symptom scale (UNRATED) and the
 * orientation section ("not administered", never 0/5).
 *
 * These helpers only translate a genuinely EMPTY value. A real 0 still prints
 * as 0 and a real 100 still prints as 100 — which matters because older
 * clients, and any submission queued offline before this change, still send the
 * old pre-filled defaults and must keep rendering as the numbers they are.
 */

/** Rendered in place of a value the athlete never supplied. */
export const NOT_ANSWERED = 'Not answered'

/** Print a raw string field, or NOT_ANSWERED when it is blank. */
export function notAnswered(v?: string | null): string {
  return v != null && String(v).trim() !== '' ? String(v) : NOT_ANSWERED
}

/** Print a percentage field with its '%' suffix, or NOT_ANSWERED when blank. */
export function percentOrNotAnswered(v?: string | null): string {
  return v != null && String(v).trim() !== '' ? `${String(v).trim()}%` : NOT_ANSWERED
}
