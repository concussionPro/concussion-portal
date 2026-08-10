'use client'

import { useState } from 'react'
import { PrimaryButton, SymptomStepper, numFont } from './shell'

/**
 * DAILY CHECK-IN — the rest-day comparator, as a Home card.
 *
 * One 0–10 symptom answer per day, whether or not the patient trained. This is
 * what makes a next-day flare interpretable: without the flare rate on days
 * with NO exertion, a symptom rise after a session describes the natural
 * fluctuation of concussion as much as the response to a dose.
 *
 * Deliberately a card on Home rather than a gate screen: the session-anchored
 * next-day check-in already asks its question on open, and two ambushes stack.
 * This never blocks "Start today's session" — an unanswered day is a missing
 * observation, and missing must stay missing (never re-prompted as recall).
 *
 * The card collapses to a one-line receipt once answered; tapping it re-opens
 * the stepper (the server upserts on clinic+patient+date, so a corrected
 * answer replaces rather than duplicates).
 */
export default function DailyCheckin({
  answeredScore,
  onSave,
}: {
  /** today's already-recorded score, or null when today is unanswered */
  answeredScore: number | null
  onSave: (score: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [score, setScore] = useState(answeredScore ?? 0)

  if (answeredScore != null && !editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setScore(answeredScore)
          setEditing(true)
        }}
        className="flex w-full items-center justify-between rounded-[16px] border border-(--sst-line-soft) bg-(--sst-card) px-4 py-3 text-left transition active:scale-[0.99] lg:mx-auto lg:max-w-[560px]"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[12.5px] font-bold text-(--sst-ink)">Daily check-in — done</span>
          <span className="text-[11px] text-(--sst-muted)">Tap to change today&rsquo;s answer</span>
        </span>
        <span
          className={`flex h-[34px] w-[46px] flex-none items-center justify-center rounded-[12px] bg-(--sst-accent-soft) text-[17px] font-bold text-(--sst-accent-ink) ${numFont}`}
        >
          {answeredScore}
        </span>
      </button>
    )
  }

  return (
    <div className="w-full rounded-[18px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-4 py-3.5 lg:mx-auto lg:max-w-[560px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
          Daily check-in
        </span>
        <span className="text-[10.5px] text-(--sst-muted)">0 none · 10 worst</span>
      </div>
      <p className="m-0 mt-1 text-[13.5px] font-semibold leading-snug text-(--sst-ink)">
        How are your symptoms today?
      </p>
      <p className="m-0 mt-0.5 text-[11.5px] leading-snug text-(--sst-muted)">
        Answer on rest days too — those days are what make your trend readable.
      </p>
      <div className="mt-2.5">
        <SymptomStepper value={score} onChange={setScore} compact ariaLabel="Today's symptom level" />
      </div>
      <PrimaryButton
        onClick={() => {
          setEditing(false)
          onSave(score)
        }}
        className="mt-2.5 w-full p-3 text-[13.5px]"
      >
        Log today
      </PrimaryButton>
    </div>
  )
}
