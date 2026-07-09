'use client'

import {
  computePrescription,
  type Condition,
  type Prescription,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { BandBar, PrimaryButton, ScreenHeading, SecondaryButton, numFont } from './shell'

export default function ResultPrescription({
  result,
  condition,
  hasPrescription,
  onContinue,
  onRetest,
  onExit,
  onKeepBand,
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
        <div className="rounded-[16px] border-[1.5px] border-[#d2463a] bg-[#fbeae8] p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-[#b1392e]">Stop and seek review</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8a4036]">{result.message}</p>
          <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-[#8a4036]">
            Do not re-test or exercise again until a clinician has reviewed you.
          </p>
        </div>
      )}

      {result.interpretation === 'no-intolerance' && (
        <div className="rounded-[16px] border-[1.5px] border-[#cdd9da] bg-[#eef4f4] p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-[#3b4f52]">
            No exercise-driven threshold found
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5d7174]">{result.message}</p>
        </div>
      )}

      {result.interpretation === 'invalid' && (
        <div className="rounded-[16px] border-[1.5px] border-[#cdd9da] bg-[#eef4f4] p-3.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-[#3b4f52]">Test incomplete</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5d7174]">{result.message}</p>
        </div>
      )}

      {rx && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-[16px] bg-[#eef4f4] px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-[#5d7174]">
                Heart-rate threshold
              </span>
              <span className="text-[11px] leading-tight text-[#5d7174]">
                reached at minute {result.thresholdStage}
              </span>
            </div>
            <span className="flex items-baseline gap-1">
              <span className={`text-[30px] text-[#16282b] ${numFont}`}>{rx.hrt}</span>
              <span className="text-[11px] font-semibold text-[#5d7174]">BPM</span>
            </span>
          </div>

          {/* hero band instrument */}
          <div
            className="rounded-[20px] border-2 border-[#5b9aa6] px-4 pb-3 pt-4"
            style={{ background: 'linear-gradient(180deg,#eef6f6,#e3f0f1)' }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3c7681]">
              Your training band
            </span>
            <div className="mb-3 mt-1.5 flex items-baseline gap-1.5">
              <span className={`text-[38px] text-[#16282b] ${numFont}`}>
                {rx.lowerBpm}–{rx.upperBpm}
              </span>
              <span className="text-[13px] font-semibold text-[#5d7174]">bpm</span>
            </div>
            <BandBar hrt={rx.hrt} lower={rx.lowerBpm} upper={rx.upperBpm} />
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold leading-snug text-[#b1392e]">
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full border-2 border-[#d2463a] text-[9px] text-[#d2463a]">
                !
              </span>
              Do not exceed {rx.upperBpm} bpm.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] border border-[#dde7e7] bg-white px-3.5 py-3">
              <span className="text-[11px] font-medium text-[#5d7174]">Session length</span>
              <div className={`mt-1 text-[18px] text-[#16282b] ${numFont}`}>
                {rx.sessionMinutes}
                <span className="text-[11px] text-[#5d7174]"> min</span>
              </div>
            </div>
            <div className="rounded-[14px] border border-[#dde7e7] bg-white px-3.5 py-3">
              <span className="text-[11px] font-medium text-[#5d7174]">Frequency</span>
              <div className={`mt-1 text-[18px] text-[#16282b] ${numFont}`}>
                {rx.daysPerWeek}
                <span className="text-[11px] text-[#5d7174]"> days/wk</span>
              </div>
            </div>
          </div>

          {rx.prolongedRecoveryRisk && (
            <div className="rounded-[14px] border-[1.5px] border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-3">
              <p className="m-0 text-[12.5px] font-bold leading-snug text-[#a06a1c]">
                Your threshold is on the low side
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#8a6a2c]">
                A heart-rate threshold this low (under 135 bpm) is linked to a slower recovery in the
                research (Haider et&nbsp;al. 2019). Stay inside the band, and let your clinician guide how
                long and how often you train — they may keep sessions shorter and check in more often.
              </p>
            </div>
          )}

          <p className="m-0 rounded-[14px] bg-[#eef4f4] px-3.5 py-3 text-xs leading-relaxed text-[#3b4f52]">
            {rx.summary}
          </p>
          <p className="m-0 text-[10.5px] leading-snug text-[#5d7174]">
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
        <p className="m-0 text-[10.5px] leading-snug text-[#5d7174]">
          Not a diagnosis or return-to-play clearance. Share this with your clinician and follow their
          guidance.
        </p>
      )}
    </section>
  )
}
