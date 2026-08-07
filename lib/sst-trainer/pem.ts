import type { Condition } from './protocol'

/**
 * POST-EXERTIONAL MALAISE (PEM) SCREEN — a hard gate on graded exertion.
 *
 * WHY THIS EXISTS.
 *
 * SST prescribes dosed aerobic exertion. For concussion that is first-line
 * treatment (Amsterdam 2023). For a patient with POST-EXERTIONAL MALAISE it can
 * cause lasting harm, and that distinction is the single most important safety
 * boundary this product has.
 *
 * PEM is the cardinal feature of ME/CFS and is present in a substantial share
 * of long-COVID presentations: exertion — physical OR cognitive — triggers a
 * disproportionate symptom worsening that is characteristically DELAYED (often
 * 12–48h) and prolonged (>14h, sometimes days). Graded exercise therapy in this
 * population is the intervention that made the PACE trial notorious; NICE
 * withdrew its recommendation of GET for ME/CFS in the 2021 guideline (NG206)
 * on the basis of harm.
 *
 * `long-covid` is an accepted `Condition` in protocol.ts and always has been.
 * Until this module, nothing anywhere in the SST pipeline asked whether that
 * patient had PEM before issuing a heart-rate training band. That is the gap
 * this closes.
 *
 * DESIGN: FAIL CLOSED, AND FAIL LOUD.
 *  - For a PEM-risk condition, NO screen means NO prescription. Absence of an
 *    answer is never treated as absence of PEM.
 *  - A positive screen BLOCKS the prescription outright. It does not warn, it
 *    does not soften the dose. A clinician who disagrees can record their own
 *    clinical decision outside the tool; the tool will not compute a band.
 *  - Concussion is unaffected. Screening every mTBI patient for ME/CFS would be
 *    clinically wrong and would train clinicians to click through the gate,
 *    which is how safety interlocks die.
 *
 * SCORING follows the DePaul Symptom Questionnaire PEM subscale (Jason et al.),
 * the instrument used in the long-COVID and ME/CFS literature: each item is
 * rated for FREQUENCY and SEVERITY on 0–4, and an item counts as positive when
 * BOTH are ≥2 (i.e. at least "about half the time" and at least "moderate").
 * Any single positive item is treated as a positive screen here — this is a
 * safety gate, not a diagnostic instrument, and it is deliberately more
 * cautious than a research case definition.
 *
 * LANGUAGE DOCTRINE. Nothing in this product may describe itself as "graded
 * exercise therapy" to a PEM-positive patient, and the refusal must not read as
 * a paywall or a technical error. It is a clinical finding, and it says so.
 */

/** Conditions where PEM must be excluded before any exertion is prescribed. */
export const PEM_RISK_CONDITIONS: readonly Condition[] = ['long-covid', 'neuro-other', 'cancer'] as const

export function requiresPemScreen(condition: Condition): boolean {
  return (PEM_RISK_CONDITIONS as readonly string[]).includes(condition)
}

/** One DSQ-PEM item: how often, and how bad. Both 0–4. */
export interface PemItem {
  frequency: number
  severity: number
}

/**
 * The five DSQ-PEM items, in the order the form presents them. Wording is kept
 * close to the instrument so scores remain comparable to the literature.
 */
export const PEM_ITEMS = [
  'Dead, heavy feeling after starting to exercise',
  'Next-day soreness or fatigue after non-strenuous, everyday activities',
  'Mentally tired after the slightest effort',
  'Minimum exercise makes you physically tired',
  'Physically drained or sick after mild activity',
] as const

export interface PemScreen {
  /** Five items, in PEM_ITEMS order. */
  items: PemItem[]
  /** ISO date the screen was completed. */
  screenedAt: string
  /** Who completed it — the clinician records this against the patient. */
  screenedBy?: string
}

export type PemVerdict =
  | { status: 'clear'; positiveItems: 0 }
  | { status: 'positive'; positiveItems: number; reason: string }
  | { status: 'not-screened'; reason: string }
  | { status: 'invalid'; reason: string }

const inRange = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 4

/**
 * Score a screen. Returns `not-screened` for absent input — the caller must
 * treat that as blocking for PEM-risk conditions, never as a pass.
 */
export function scorePemScreen(screen: PemScreen | null | undefined): PemVerdict {
  if (!screen || !Array.isArray(screen.items) || screen.items.length !== PEM_ITEMS.length) {
    return {
      status: 'not-screened',
      reason: 'No post-exertional malaise screen on file for this patient.',
    }
  }
  for (const it of screen.items) {
    if (!it || !inRange(it.frequency) || !inRange(it.severity)) {
      return {
        status: 'invalid',
        reason: 'The PEM screen is incomplete — every item needs a frequency and a severity from 0 to 4.',
      }
    }
  }
  // DSQ-PEM: an item counts when BOTH frequency and severity are >= 2.
  const positive = screen.items.filter((it) => it.frequency >= 2 && it.severity >= 2).length
  if (positive > 0) {
    return {
      status: 'positive',
      positiveItems: positive,
      reason:
        `${positive} of ${PEM_ITEMS.length} screen items indicate post-exertional malaise. ` +
        'Graded exertion is not appropriate while PEM is present.',
    }
  }
  return { status: 'clear', positiveItems: 0 }
}

export interface PemGateResult {
  /** May a heart-rate training band be issued for this patient? */
  allowed: boolean
  verdict: PemVerdict
  /** Clinician-facing explanation. Empty when allowed. */
  message: string
  /** What to do instead. Empty when allowed. */
  guidance: string
}

/**
 * THE GATE. Call before computing or issuing any prescription.
 *
 * Concussion and the other non-PEM-risk conditions pass straight through — this
 * must not become a click-through that clinicians learn to dismiss.
 */
export function pemGate(condition: Condition, screen: PemScreen | null | undefined): PemGateResult {
  if (!requiresPemScreen(condition)) {
    return { allowed: true, verdict: { status: 'clear', positiveItems: 0 }, message: '', guidance: '' }
  }

  const verdict = scorePemScreen(screen)

  if (verdict.status === 'clear') {
    return { allowed: true, verdict, message: '', guidance: '' }
  }

  const guidance =
    verdict.status === 'positive'
      ? 'Manage within an energy envelope — pacing and activity management, not a graded exertion target. ' +
        'Re-screen before reconsidering, and refer to the treating doctor for review. ' +
        'NICE NG206 (2021) withdrew graded exercise therapy as a recommendation for ME/CFS on the basis of harm.'
      : 'Complete the five-item PEM screen with the patient before prescribing. ' +
        'For this condition an unanswered screen is treated as unsafe to proceed.'

  return { allowed: false, verdict, message: verdict.reason, guidance }
}
