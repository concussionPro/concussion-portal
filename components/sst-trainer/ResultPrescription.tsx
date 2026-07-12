'use client'

import {
  computePrescription,
  type Condition,
  type Prescription,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { BandBar, PrimaryButton, ScreenHeading, SecondaryButton, numFont } from './shell'

/**
 * Celebration beat on a ceiling advance: this re-test measured a HIGHER
 * threshold than the previous one. Honest by construction — both numbers are
 * real measured HRt values from persisted tests, and the "earned by k verified
 * sessions" subline renders only when the store genuinely holds k ≥ 1 verified
 * sessions between the two test dates. Tasteful: one gradient card, a rising
 * arc that draws itself in (CSS keyframes, reduced-motion aware), no confetti.
 */
function CeilingAdvance({
  fromHrt,
  toHrt,
  verifiedSessions,
}: {
  fromHrt: number
  toHrt: number
  verifiedSessions: number
}) {
  const delta = toHrt - fromHrt
  return (
    <div
      className="sst-celebrate sst-celebrate-halo relative overflow-hidden rounded-[20px] border-2 border-(--sst-accent) px-4 py-4"
      style={{ background: 'linear-gradient(180deg,var(--sst-tint-a),var(--sst-tint-b))' }}
    >
      <div className="flex items-center gap-3.5">
        {/* rising arc + arrowhead, drawing itself in */}
        <svg viewBox="0 0 56 56" className="h-[52px] w-[52px] flex-none" aria-hidden>
          <circle cx="28" cy="28" r="25" fill="none" stroke="var(--sst-accent)" strokeWidth="2" opacity="0.25" />
          <path
            d="M 12 40 Q 26 40 33 29 T 45 15"
            fill="none"
            stroke="var(--sst-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            className="sst-draw"
            style={{ ['--sst-dash' as string]: '60' }}
          />
          <path
            d="M 38 14 L 45.5 14 L 42 22"
            fill="none"
            stroke="var(--sst-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
            Measured progress
          </span>
          <span className="text-[21px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
            Your ceiling moved up <span className={numFont}>{delta}&nbsp;bpm</span>
          </span>
          <span className={`text-[12px] leading-snug text-(--sst-ink-2) ${numFont}`}>
            {fromHrt} → {toHrt} bpm — measured, not estimated
          </span>
        </div>
      </div>
      {verifiedSessions >= 1 && (
        <p className="m-0 mt-2.5 border-t border-(--sst-track-2) pt-2.5 text-[12px] font-semibold leading-snug text-(--sst-accent-ink)">
          Earned by {verifiedSessions} verified session{verifiedSessions === 1 ? '' : 's'} since your
          last test.
        </p>
      )}
    </div>
  )
}

export default function ResultPrescription({
  result,
  condition,
  hasPrescription,
  onContinue,
  onRetest,
  onExit,
  onKeepBand,
  previousHrt = null,
  verifiedSessionsSince = 0,
}: {
  result: ThresholdResult
  condition: Condition
  /** true if the user already has a saved prescription (i.e. this is a re-test) */
  hasPrescription: boolean
  /** physiologic branch only — receives the computed prescription, routes to home */
  onContinue: (rx: Prescription) => void
  /** re-run the threshold test — only offered on no-intolerance / invalid results */
  onRetest: () => void
  /** red-flag: leave the provoking flow for the safe hub (home if a band exists, else welcome) */
  onExit: () => void
  /** non-physiologic re-test with an existing band: keep it and return home */
  onKeepBand: () => void
  /** HRt of the previous MEASURED test (null on a first test) — drives the celebration */
  previousHrt?: number | null
  /** verified sessions logged between the previous test and this one (0 = omit the subline) */
  verifiedSessionsSince?: number
}) {
  // physiologic = HRt found → derive the training band from the engine
  const rx =
    result.interpretation === 'physiologic' && result.hrt !== null
      ? computePrescription(result.hrt, condition)
      : null

  // re-test is only a safe forward action when no exercise-driven threshold was
  // found (or the data was invalid) — NEVER after a red flag.
  const showRetestActions =
    result.interpretation === 'no-intolerance' || result.interpretation === 'invalid'

  return (
    <section className="flex flex-col gap-3.5 pt-1.5">
      <ScreenHeading title="Your result" />

      {result.interpretation === 'red-flag' && (
        <div className="rounded-[16px] border-[1.5px] border-(--sst-danger) bg-(--sst-danger-soft) p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-(--sst-danger-ink)">Stop and seek review</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-(--sst-danger-ink-2)">{result.message}</p>
          <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-(--sst-danger-ink-2)">
            Do not re-test or exercise again until a clinician has reviewed you.
          </p>
        </div>
      )}

      {result.interpretation === 'no-intolerance' && (
        <div className="rounded-[16px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-surface-2) p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-(--sst-ink-2)">
            No exercise-driven threshold found
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-(--sst-muted)">{result.message}</p>
        </div>
      )}

      {result.interpretation === 'invalid' && (
        <div className="rounded-[16px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-surface-2) p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-(--sst-ink-2)">Test incomplete</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-(--sst-muted)">{result.message}</p>
        </div>
      )}

      {rx && (
        <div className="flex flex-col gap-3">
          {/* ceiling advance — only when a previous MEASURED test exists and this
              one is genuinely higher (never on a first test or a fall) */}
          {previousHrt != null && rx.hrt > previousHrt && (
            <CeilingAdvance fromHrt={previousHrt} toHrt={rx.hrt} verifiedSessions={verifiedSessionsSince} />
          )}

          <div className="flex items-center justify-between rounded-[16px] bg-(--sst-surface-2) px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-(--sst-muted)">
                Heart-rate threshold
              </span>
              <span className="text-[11px] leading-tight text-(--sst-muted)">
                reached at minute {result.thresholdStage}
              </span>
            </div>
            <span className="flex items-baseline gap-1">
              <span className={`text-[30px] text-(--sst-ink) ${numFont}`}>{rx.hrt}</span>
              <span className="text-[11px] font-semibold text-(--sst-muted)">BPM</span>
            </span>
          </div>

          {/* hero band instrument */}
          <div
            className="rounded-[20px] border-2 border-(--sst-accent) px-4 pb-3 pt-4"
            style={{ background: 'linear-gradient(180deg,var(--sst-tint-a),var(--sst-tint-b))' }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
              Your training band
            </span>
            <div className="mb-3 mt-1.5 flex items-baseline gap-1.5">
              <span className={`text-[38px] text-(--sst-ink) ${numFont}`}>
                {rx.lowerBpm}–{rx.upperBpm}
              </span>
              <span className="text-[13px] font-semibold text-(--sst-muted)">bpm</span>
            </div>
            <BandBar hrt={rx.hrt} lower={rx.lowerBpm} upper={rx.upperBpm} />
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold leading-snug text-(--sst-danger-ink)">
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full border-2 border-(--sst-danger) text-[9px] text-(--sst-danger)">
                !
              </span>
              Do not exceed {rx.upperBpm} bpm.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] border border-(--sst-line-soft) bg-(--sst-card) px-3.5 py-3">
              <span className="text-[11px] font-medium text-(--sst-muted)">Session length</span>
              <div className={`mt-1 text-[18px] text-(--sst-ink) ${numFont}`}>
                {rx.sessionMinutes}
                <span className="text-[11px] text-(--sst-muted)"> min</span>
              </div>
            </div>
            <div className="rounded-[14px] border border-(--sst-line-soft) bg-(--sst-card) px-3.5 py-3">
              <span className="text-[11px] font-medium text-(--sst-muted)">Frequency</span>
              <div className={`mt-1 text-[18px] text-(--sst-ink) ${numFont}`}>
                {rx.daysPerWeek}
                <span className="text-[11px] text-(--sst-muted)"> days/wk</span>
              </div>
            </div>
          </div>

          {rx.prolongedRecoveryRisk && (
            <div className="rounded-[14px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) px-3.5 py-3">
              <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-warn-ink)">
                We&apos;ll start gently
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-(--sst-warn-ink-2)">
                Your starting threshold is on the lower side, which is common early on. Your clinician
                may keep sessions shorter and check in more often. Staying inside your band is exactly
                what helps — nothing to do differently today.
              </p>
            </div>
          )}

          <p className="m-0 rounded-[14px] bg-(--sst-surface-2) px-3.5 py-3 text-xs leading-relaxed text-(--sst-ink-2)">
            {rx.summary}
          </p>
          <p className="m-0 text-[10.5px] leading-snug text-(--sst-muted)">
            Not a diagnosis or return-to-play clearance. Share with your clinician and follow their
            guidance.
          </p>

          <PrimaryButton onClick={() => onContinue(rx)} className="rounded-[18px]">
            Continue to your home
          </PrimaryButton>
        </div>
      )}

      {/* red flag: the ONLY action is a non-provoking exit — never a re-test */}
      {result.interpretation === 'red-flag' && (
        <PrimaryButton onClick={onExit} className="rounded-[18px]">
          {hasPrescription ? 'Back to safety' : 'Exit'}
        </PrimaryButton>
      )}

      {/* no-intolerance / invalid: keep an existing band if there is one, then re-test */}
      {showRetestActions && (
        <div className="flex flex-col gap-2.5">
          {hasPrescription && (
            <SecondaryButton onClick={onKeepBand} className="rounded-[16px] p-3.5">
              Keep my current band — back to home
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onRetest} className="rounded-[16px] p-3.5">
            Re-test threshold
          </SecondaryButton>
        </div>
      )}

      {/* Not-a-diagnosis line on the non-physiologic branches too (the physiologic
          band carries its own above) — every result surface must disclaim. */}
      {!rx && (
        <p className="m-0 text-[10.5px] leading-snug text-(--sst-muted)">
          Not a diagnosis or return-to-play clearance. Share this with your clinician and follow their
          guidance.
        </p>
      )}
    </section>
  )
}
