'use client'

import { useEffect, useRef, useState } from 'react'
import { PrimaryButton, SecondaryButton, numFont } from './shell'
import { useWakeLock } from './use-wake-lock'

/**
 * ORTHOSTATIC (NASA LEAN) TEST — the POTS-pathway analogue of the graded
 * threshold test (owner, 2026-08-12 POTS enablement).
 *
 * Protocol: rest supine, record resting HR; stand (against a wall, still);
 * record HR at 1, 3, 5 and 10 minutes. A SUSTAINED rise of ≥30 bpm within
 * 10 minutes of standing (≥40 bpm for adolescents) is the adult orthostatic
 * criterion used in POTS assessment (Freeman et al. 2011, Auton Neurosci;
 * Sheldon et al. 2015, Heart Rhythm — HRS expert consensus).
 *
 * HONESTY RAILS, same as the graded test:
 *  - This is a SCREENING measurement for the clinician, never a diagnosis —
 *    the result screen says so in those words.
 *  - Live-fed readings are captured at the mark; manual entries are typed and
 *    carry hrVerified=false in the synced payload. Nothing is estimated.
 *  - The synced record is an event (eventType 'orthostatic-test'), excluded
 *    from the HRt trajectory and report threshold history — it is a different
 *    instrument and must never masquerade as a graded exertion test.
 */

const SUPINE_SECONDS = 120
const STAND_MARKS = [1, 3, 5, 10] as const
/** Adult sustained-rise criterion (bpm). Adolescents use 40 — the result copy says so. */
const ADULT_RISE = 30

export interface OrthostaticReading {
  atMin: number
  bpm: number
  verified: boolean
}

export interface OrthostaticResult {
  supineBpm: number
  supineVerified: boolean
  readings: OrthostaticReading[]
  maxDelta: number
  /** rise ≥ ADULT_RISE at BOTH the 5- and 10-minute marks */
  sustained: boolean
}

export default function OrthostaticTest({
  liveHr,
  hrStatus = 'manual',
  onComplete,
  onCancel,
}: {
  liveHr?: number | null
  hrStatus?: 'idle' | 'connecting' | 'streaming' | 'manual'
  onComplete: (result: OrthostaticResult) => void
  onCancel: () => void
}) {
  type Phase = 'intro' | 'supine' | 'stand' | 'result'
  const [phase, setPhase] = useState<Phase>('intro')
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)
  const [supine, setSupine] = useState<{ bpm: number; verified: boolean } | null>(null)
  const [readings, setReadings] = useState<OrthostaticReading[]>([])
  const [entry, setEntry] = useState('')

  useWakeLock(phase === 'supine' || phase === 'stand')

  useEffect(() => {
    if (phase !== 'supine' && phase !== 'stand') return
    startRef.current = Date.now()
    setElapsed(0)
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500)
    return () => clearInterval(iv)
  }, [phase])

  // Live feed pre-fills the entry field; a typed value wins (same rule as the
  // graded test — a manual correction must not be clobbered by the stream).
  const lastLiveRef = useRef('')
  useEffect(() => {
    if (typeof liveHr === 'number' && Number.isFinite(liveHr)) {
      const next = String(liveHr)
      setEntry((cur) => (cur === '' || cur === lastLiveRef.current ? ((lastLiveRef.current = next), next) : cur))
    }
  }, [liveHr])

  const entryBpm = entry.trim() === '' ? null : Number(entry)
  const entryValid = entryBpm !== null && Number.isFinite(entryBpm) && entryBpm >= 30 && entryBpm <= 240
  const entryVerified = entryValid && hrStatus === 'streaming' && String(liveHr ?? '') === entry.trim()

  const nextMark = STAND_MARKS.find((m) => !readings.some((r) => r.atMin === m)) ?? null
  const markDue = phase === 'stand' && nextMark !== null && elapsed >= nextMark * 60

  const finish = (list: OrthostaticReading[]) => {
    const sup = supine as { bpm: number; verified: boolean }
    const deltas = list.map((r) => r.bpm - sup.bpm)
    const at = (m: number) => list.find((r) => r.atMin === m)
    const sustained =
      (at(5)?.bpm ?? 0) - sup.bpm >= ADULT_RISE && (at(10)?.bpm ?? 0) - sup.bpm >= ADULT_RISE
    setPhase('result')
    onComplete({
      supineBpm: sup.bpm,
      supineVerified: sup.verified,
      readings: list,
      maxDelta: deltas.length ? Math.max(...deltas) : 0,
      sustained,
    })
  }

  const logMark = () => {
    if (!entryValid || nextMark === null) return
    const list = [...readings, { atMin: nextMark, bpm: entryBpm as number, verified: entryVerified }]
    setReadings(list)
    setEntry('')
    lastLiveRef.current = ''
    if (nextMark === STAND_MARKS[STAND_MARKS.length - 1]) finish(list)
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (phase === 'intro') {
    return (
      <section className="flex flex-col gap-4 pt-1">
        <button type="button" onClick={onCancel} className="-ml-1 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-(--sst-faint)">
          ← Back
        </button>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
            Orthostatic test (NASA lean)
          </h1>
          <p className="m-0 text-[12.5px] leading-snug text-(--sst-muted)">
            Lie down and rest, then stand still against a wall for ten minutes while your heart rate
            is recorded at set marks. A screening measurement for your clinician — not a diagnosis.
          </p>
        </div>
        <div className="rounded-[16px] border-[1.5px] border-(--sst-line) bg-(--sst-card) px-4 py-3.5">
          <p className="m-0 text-[12.5px] font-semibold text-(--sst-ink)">Before you start</p>
          <ul className="m-0 mt-1.5 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-snug text-(--sst-muted)">
            <li>Somewhere you can lie flat, next to a wall you can lean against.</li>
            <li>No caffeine for 2 hours; not straight after a meal or exercise.</li>
            <li>If you feel faint at any point, sit or lie down immediately — the test can wait.</li>
          </ul>
        </div>
        <PrimaryButton onClick={() => setPhase('supine')}>Start — lie down now</PrimaryButton>
      </section>
    )
  }

  if (phase === 'supine') {
    const done = elapsed >= SUPINE_SECONDS
    return (
      <section className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
            Lie still and rest
          </h1>
          <p className="m-0 text-[12.5px] leading-snug text-(--sst-muted)">
            Flat on your back, breathing normally. Your resting reading is taken at the end.
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-[44px] leading-none text-(--sst-ink) ${numFont}`}>{mmss(Math.max(0, SUPINE_SECONDS - elapsed))}</span>
          <span className="text-[12px] text-(--sst-muted)">remaining lying down</span>
        </div>
        {done && (
          <div className="flex flex-col gap-2 rounded-[16px] border-[1.5px] border-(--sst-accent) bg-(--sst-accent-soft) px-4 py-3.5">
            <span className="text-[12.5px] font-bold text-(--sst-accent-ink)">Record your lying heart rate now</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="—"
                className={`w-[96px] rounded-[12px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-3 py-2 text-[24px] text-(--sst-ink) outline-none ${numFont}`}
              />
              <span className="text-[11px] font-semibold text-(--sst-muted)">BPM {hrStatus === 'streaming' ? '· live' : '· from your monitor'}</span>
            </div>
            <PrimaryButton
              disabled={!entryValid}
              onClick={() => {
                setSupine({ bpm: entryBpm as number, verified: entryVerified })
                setEntry('')
                lastLiveRef.current = ''
                setPhase('stand')
              }}
              className="p-3 text-[13.5px]"
            >
              Logged — now stand up against the wall
            </PrimaryButton>
          </div>
        )}
        <button type="button" onClick={onCancel} className="self-center rounded-[10px] px-2 py-1 text-[12px] font-semibold text-(--sst-ghost)">
          Stop the test
        </button>
      </section>
    )
  }

  if (phase === 'stand') {
    return (
      <section className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
            Stand still — lean on the wall
          </h1>
          <p className="m-0 text-[12.5px] leading-snug text-(--sst-muted)">
            Heels ~15 cm from the wall, shoulders resting on it, no shifting or talking. Readings at
            the 1, 3, 5 and 10-minute marks. <strong>Feel faint? Sit down immediately.</strong>
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-[44px] leading-none text-(--sst-ink) ${numFont}`}>{mmss(elapsed)}</span>
          <span className="text-[12px] text-(--sst-muted)">standing{supine ? ` · lying was ${supine.bpm} bpm` : ''}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAND_MARKS.map((m) => {
            const r = readings.find((x) => x.atMin === m)
            return (
              <span key={m} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${numFont} ${r ? 'bg-(--sst-accent-soft) text-(--sst-accent-ink)' : 'bg-(--sst-surface-2) text-(--sst-muted)'}`}>
                {m} min{r ? ` · ${r.bpm}` : ''}
              </span>
            )
          })}
        </div>
        {markDue ? (
          <div className="flex flex-col gap-2 rounded-[16px] border-[1.5px] border-(--sst-accent) bg-(--sst-accent-soft) px-4 py-3.5">
            <span className="text-[12.5px] font-bold text-(--sst-accent-ink)">
              {nextMark}-minute mark — record your heart rate
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="—"
                className={`w-[96px] rounded-[12px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-3 py-2 text-[24px] text-(--sst-ink) outline-none ${numFont}`}
              />
              <span className="text-[11px] font-semibold text-(--sst-muted)">BPM {hrStatus === 'streaming' ? '· live' : '· from your monitor'}</span>
            </div>
            <PrimaryButton disabled={!entryValid} onClick={logMark} className="p-3 text-[13.5px]">
              Log {nextMark}-minute reading
            </PrimaryButton>
          </div>
        ) : (
          <p className="m-0 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 text-[12px] leading-snug text-(--sst-muted)">
            {nextMark ? `Next reading at the ${nextMark}-minute mark — keep leaning, keep still.` : 'All readings logged.'}
          </p>
        )}
        <SecondaryButton onClick={onCancel} className="self-center px-4 py-2 text-[12px]">
          Stop the test
        </SecondaryButton>
      </section>
    )
  }

  return null // 'result' is rendered by the page (it owns sync + navigation)
}
