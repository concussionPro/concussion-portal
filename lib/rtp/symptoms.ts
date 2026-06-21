/**
 * Shared symptom constants for the RTP Tracker — kept in one place so the
 * athlete surface, the API and any future clinician view score identically.
 *
 * PCSS = the 22-item Post-Concussion Symptom Scale, the same symptom list used
 * by the SCAT6 / preseason baseline tools. Each item is rated 0–6, so the total
 * runs 0–132 — exactly the `pcssTotal` range the engine (lib/rtp/protocol.ts)
 * expects.
 */

/** The 22-item PCSS, in SCAT6 order (max 6 per item → 132 total). */
export const PCSS_SYMPTOMS = [
  'Headache',
  'Pressure in head',
  'Neck pain',
  'Nausea or vomiting',
  'Dizziness',
  'Blurred vision',
  'Balance problems',
  'Sensitivity to light',
  'Sensitivity to noise',
  'Feeling slowed down',
  'Feeling like in a fog',
  "Don't feel right",
  'Difficulty concentrating',
  'Difficulty remembering',
  'Fatigue or low energy',
  'Confusion',
  'Drowsiness',
  'More emotional',
  'Irritability',
  'Sadness',
  'Nervous or anxious',
  'Trouble falling asleep',
] as const

export const PCSS_ITEM_MAX = 6
export const PCSS_TOTAL_MAX = PCSS_SYMPTOMS.length * PCSS_ITEM_MAX // 132

/**
 * SCAT6 red-flag list. ANY of these checked on a check-in flags the log as a
 * red flag — the engine then halts the pathway and surfaces an emergency /
 * medical-referral instruction. These are deliberately separate from the PCSS
 * severity items: a red flag is an emergency trigger, not a graded symptom.
 */
export const RED_FLAG_SYMPTOMS = [
  'Neck pain or tenderness',
  'Double vision',
  'Weakness or tingling/burning in arms or legs',
  'Severe or increasing headache',
  'Seizure or convulsion',
  'Loss of consciousness',
  'Deteriorating conscious state',
  'Repeated vomiting',
  'Increasingly restless, agitated or combative',
] as const
