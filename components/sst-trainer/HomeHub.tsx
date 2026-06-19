'use client'

import { useEffect, useState } from 'react'
import type { Condition, Prescription } from '@/lib/sst-trainer/protocol'
import { BandBar, PrimaryButton, SecondaryButton, numFont } from './shell'
import type { TrainerMode } from './WelcomeMode'

const PATHWAY_LABEL: Record<Condition, string> = {
  concussion: 'Concussion',
  mtbi: 'Concussion',
  tbi: 'Neuro rehab',
  'neuro-other': 'Neuro rehab',
  cancer: 'Cancer rehab',
  'long-covid': 'POTS · Long COVID',
  cardiac: 'Cardiac rehab',
}

/**
 * The daily home / hub (added by the design between result and training). Shows
 * the prescribed band, this week's adherence, and the entry to a session.
 */
export default function HomeHub({
  rx,
  condition,
  mode,
  clinicCode,
  sessionsThisWeek,
  onStartSession,
  onProgress,
  onRetest,
}: {
  rx: Prescription
  condition: Condition
  mode: TrainerMode
  clinicCode: string | null
  sessionsThisWeek: number
  onStartSession: () => void
  onProgress: () => void
  onRetest: () => void
}) {
  const [greeting, setGreeting] = useState('Welcome back')
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  const badge = `${PATHWAY_LABEL[condition]} · ${
    mode === 'clinic-code' ? `Linked ${clinicCode || 'clinic'}` : 'Self-guided'
  }`

  const target = rx.daysPerWeek
  const done = Math.min(sessionsThisWeek, target)

  return (
    <section className="flex flex-col gap-[15px] pt-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5b9aa6]">
          {badge}
        </span>
        <h1 className="m-0 text-[25px] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#16282b]">
          {greeting}
        </h1>
        <p className="m-0 text-[13.5px] leading-snug text-[#5d7174]">Ready when you are — no rush.</p>
      </div>

      <div
        className="rounded-[20px] border-2 border-[#5b9aa6] px-4 pb-3.5 pt-3.5"
        style={{ background: 'linear-gradient(180deg,#eef6f6,#e3f0f1)' }}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3c7681]">
          Today&apos;s band
        </span>
        <div className="mb-3 mt-1.5 flex items-baseline gap-1.5">
          <span className={`text-[36px] text-[#16282b] ${numFont}`}>
            {rx.lowerBpm}–{rx.upperBpm}
          </span>
          <span className="text-[13px] font-semibold text-[#5d7174]">bpm</span>
        </div>
        <BandBar hrt={rx.hrt} lower={rx.lowerBpm} upper={rx.upperBpm} />
      </div>

      <PrimaryButton onClick={onStartSession} className="rounded-[20px] py-[19px] text-base">
        Start today&apos;s session
      </PrimaryButton>

      <div className="flex items-center justify-between rounded-[16px] border border-[#dde7e7] bg-white px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] font-bold text-[#16282b]">This week</span>
          <span className="text-[11px] text-[#849c9c]">
            {done} of {target} days
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: target }, (_, i) => (
            <span
              key={i}
              className="h-[13px] w-[13px] rounded-full border-[1.5px]"
              style={{
                background: i < done ? '#5b9aa6' : '#ffffff',
                borderColor: i < done ? '#5b9aa6' : '#cdd9da',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2.5">
        <SecondaryButton onClick={onProgress} className="flex-1 p-3">
          Progress
        </SecondaryButton>
        <SecondaryButton onClick={onRetest} className="flex-1 p-3">
          Re-test
        </SecondaryButton>
      </div>
    </section>
  )
}
