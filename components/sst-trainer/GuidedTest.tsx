'use client'

import { useEffect, useRef, useState } from 'react'
import {
  detectThreshold,
  isVerifiedReading,
  EXHAUSTION_RPE,
  HR_JUMP_CONFIRM,
  PROVOCATION_RISE,
  type Condition,
  type TestModality,
  type TestStage,
  type TestInput,
  type TestTermination,
  type ThresholdResult,
} from '@/lib/sst-trainer/protocol'
import { CONCUSSION_SYMPTOMS } from '@/lib/sst-trainer/symptoms'
import { PrimaryButton, SecondaryButton, SegmentBars, numFont } from './shell'

// BCTT max test duration (modified Balke ~15 incline stages + speed ramp; the
// test runs well under ~20 min). Reaching this without a >=3-pt rise ends the
// test as exhaustion-limited (no exercise-driven threshold).
const MAX_STAGES = 20
/**
 * Each stage is one minute — the Buffalo protocol steps effort every minute.
 * Overridable ONLY for automated end-to-end testing via
 * NEXT_PUBLIC_SST_STAGE_SECONDS (e.g. 3); production is always 60.
 */
const STAGE_SECONDS = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_SST_STAGE_SECONDS)
  return Number.isFinite(raw) && raw >= 1 && raw <= 60 ? raw : 60
})()

// ── stage-indexed effort script (Buffalo convention, in plain words) ─────────

const MODALITIES: { id: TestModality; label: string; sub: string }[] = [
  { id: 'treadmill', label: 'Treadmill', sub: 'Raise the incline each minute' },
  { id: 'bike', label: 'Stationary bike', sub: 'Raise the resistance each minute' },
  { id: 'walk', label: 'Brisk walking', sub: 'Walk a little faster each minute' },
  { id: 'other', label: 'Other aerobic exercise', sub: 'Elliptical, rower, swim, step — anything steady' },
]

function effortInstruction(modality: TestModality, minute: number): string {
  if (minute === 1) {
    switch (modality) {
      case 'treadmill':
        return 'Start walking at a brisk, comfortable pace — keep the treadmill flat for this first minute.'
      case 'bike':
        return 'Start pedalling at an easy, steady pace with light resistance.'
      case 'walk':
        return 'Start walking at an easy, comfortable pace.'
      case 'other':
        return 'Start at an easy, steady effort you can keep up — just enough to get moving.'
    }
  }
  switch (modality) {
    case 'treadmill':
      return minute <= 15
        ? 'Increase the incline one notch. You should feel it get slightly harder each minute.'
        : 'Keep the incline where it is — nudge the speed up a touch instead.'
    case 'bike':
      return 'Increase the resistance one step (or pedal a little harder). You should feel it get slightly harder each minute.'
    case 'walk':
      return 'Walk a little faster than the last minute — enough that it feels slightly harder.'
    case 'other':
      return 'Lift the effort one small step — enough that it feels slightly harder than the last minute.'
  }
}

// ── gentle end-of-stage cue: a short chime + a vibration pulse ───────────────

function stageEndCue() {
  try {
    type AudioContextCtor = typeof AudioContext
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
    if (Ctor) {
      const ctx = new Ctor()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
      setTimeout(() => void ctx.close().catch(() => {}), 700)
    }
  } catch {
    /* no audio — the visual + vibration cues still fire */
  }
  try {
    navigator.vibrate?.(250)
  } catch {
    /* unsupported */
  }
}

/** Stage ring: fills over the 60-second stage; centre shows the countdown. */
function StageRing({ elapsedSec }: { elapsedSec: number }) {
  const cx = 120
  const cy = 120
  const r = 95
  const frac = Math.min(0.999, elapsedSec / STAGE_SECONDS)
  const a = frac * 2 * Math.PI
  const x = cx + r * Math.sin(a)
  const y = cy - r * Math.cos(a)
  const large = frac > 0.5 ? 1 : 0
  return (
    <svg viewBox="0 0 240 240" className="block h-full w-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dde7e7" strokeWidth={9} />
      {frac > 0 && (
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`}
          fill="none"
          stroke={elapsedSec >= STAGE_SECONDS ? '#3c7a1f' : '#5b9aa6'}
          strokeWidth={9}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export default function GuidedTest({
  condition,
  restingSymptomScore,
  selectedSymptomIds,
  onComplete,
  onAbort,
  liveHr = null,
  hrSourceLabel,
  hrStatus = 'manual',
}: {
  condition: Condition
  restingSymptomScore: number
  selectedSymptomIds: string[]
  /** receives the engine result + the raw input that produced it */
  onComplete: (result: ThresholdResult, input: TestInput) => void
  /** leave the test without a result. started=true means the ramp had begun (sync as aborted). */
  onAbort: (info: { started: boolean; stages: TestStage[] }) => void
  /** live bpm from a paired Bluetooth stream (null = manual entry) */
  liveHr?: number | null
  /** paired source name, e.g. "Polar H10" */
  hrSourceLabel?: string
  /** feed state for the live/connecting/manual chip */
  hrStatus?: 'idle' | 'connecting' | 'streaming' | 'manual'
}) {
  // only the symptoms the user told us they get
  const userSymptoms = CONCUSSION_SYMPTOMS.filter((s) => selectedSymptomIds.includes(s.id))

  const [phase, setPhase] = useState<'setup' | 'ramp'>('setup')
  const [modality, setModality] = useState<TestModality | null>(null)

  const [recordedStages, setRecordedStages] = useState<TestStage[]>([])
  const [minute, setMinute] = useState(1)

  // current (in-progress) minute inputs
  const [heartRate, setHeartRate] = useState('')
  const [symptomScore, setSymptomScore] = useState(restingSymptomScore)
  const [rpe, setRpe] = useState(8)
  const [tappedSymptoms, setTappedSymptoms] = useState<Set<string>>(new Set())
  /** >40 bpm jump from last stage — needs an explicit confirm before logging */
  const [confirmJump, setConfirmJump] = useState<number | null>(null)
  /** guards the auto-logger so a stage logs at most once at its rollover */
  const autoLoggedRef = useRef(false)
  /** guards the threshold finish so it fires exactly once */
  const finishingRef = useRef(false)
  const [justLogged, setJustLogged] = useState<number | null>(null)

  // ── 60-second stage timer (Date.now()-based; immune to throttling) ─────────
  // 0 = not started; stamped on ramp start and on every stage rollover.
  const stageStartRef = useRef<number>(0)
  const [stageElapsed, setStageElapsed] = useState(0)
  const cuedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'ramp') return
    if (stageStartRef.current === 0) stageStartRef.current = Date.now()
    const iv = setInterval(() => {
      const sec = Math.floor((Date.now() - stageStartRef.current) / 1000)
      setStageElapsed(sec)
      if (sec >= STAGE_SECONDS && !cuedRef.current) {
        cuedRef.current = true
        stageEndCue()
      }
    }, 250)
    return () => clearInterval(iv)
  }, [phase, minute])

  const stageDone = stageElapsed >= STAGE_SECONDS

  // When a live source is streaming, the paired device drives the HR field — but
  // a MANUAL override must stick (a typed correction shouldn't be wiped within a
  // second). We only auto-fill when the field is empty or still showing the last
  // streamed value; once the patient types something different, live stops
  // clobbering it until they clear it.
  //
  // STALE-FEED RULE: when the feed drops (liveHr null / status back to
  // connecting), CLEAR the field if it still shows the last live value — a dead
  // feed must never sit on screen looking like a current heart rate.
  const lastLiveRef = useRef<string>('')
  useEffect(() => {
    if (typeof liveHr === 'number' && Number.isFinite(liveHr)) {
      const next = String(liveHr)
      setHeartRate((cur) => {
        if (cur === '' || cur === lastLiveRef.current) {
          lastLiveRef.current = next
          return next
        }
        return cur // manual override — leave it
      })
    } else {
      setHeartRate((cur) => (cur !== '' && cur === lastLiveRef.current ? '' : cur))
    }
  }, [liveHr])

  const hrValue = heartRate.trim() === '' ? null : Number(heartRate)
  // Plausibility cap: reject a fat-finger (e.g. 1500) that would become HRt and
  // yield a dangerous training band. Physiologic HR range only.
  const hrValid = hrValue !== null && Number.isFinite(hrValue) && hrValue >= 30 && hrValue <= 240

  // reaching a >=3-pt rise this minute means logging it sets the HRt.
  // A symptom spike may ALWAYS be logged early — never make someone wait out
  // the minute while their symptoms climb.
  const reachesThreshold = symptomScore - restingSymptomScore >= PROVOCATION_RISE
  const nearMaxEffort = rpe >= EXHAUSTION_RPE && !reachesThreshold

  // Log opens at stage end — but a symptom spike or maximal effort may always
  // be logged immediately (never make someone wait out the minute while
  // symptoms climb or at their limit).

  const toggleSymptom = (id: string) => {
    setTappedSymptoms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentStage = (): TestStage => ({
    minute,
    heartRate: hrValue as number,
    rpe,
    symptomScore,
    symptomsReported: [...tappedSymptoms],
    // verified iff the live feed is FRESH right now and the field equals it
    hrVerified: isVerifiedReading(hrValue, liveHr ?? null, hrStatus === 'streaming'),
  })

  const finish = (termination: TestTermination, stages: TestStage[]) => {
    const input: TestInput = {
      restingSymptomScore,
      stages,
      termination,
      condition,
      modality: modality ?? undefined,
    }
    onComplete(detectThreshold(input), input)
  }

  /** Log this minute. Auto-ends the test on a >=3-pt rise (HRt) or at MAX_STAGES. */
  const logMinute = (opts: { confirmed?: boolean; finalStage?: boolean } = {}) => {
    if (!hrValid) return
    // HR sanity: an implausible jump from the last stage needs an explicit
    // confirm — never silently mint an HRt from a typo.
    const prev = recordedStages[recordedStages.length - 1]
    if (!opts.confirmed && prev && Math.abs((hrValue as number) - prev.heartRate) > HR_JUMP_CONFIRM) {
      setConfirmJump(Math.abs((hrValue as number) - prev.heartRate))
      finishingRef.current = false // intercepted — let a resolved re-attempt fire
      return
    }
    setConfirmJump(null)
    const stages = [...recordedStages, currentStage()]
    if (reachesThreshold) return finish('symptom-limited', stages)
    if (opts.finalStage || minute >= MAX_STAGES) return finish('exhaustion-limited', stages)
    setRecordedStages(stages)
    setJustLogged(minute)
    setMinute((m) => m + 1)
    // fresh entry for every stage — no HR / symptom carry-over from the last
    // minute (RPE carries: effort only ramps up)
    setTappedSymptoms(new Set())
    setHeartRate('')
    lastLiveRef.current = ''
    setSymptomScore(restingSymptomScore)
    stageStartRef.current = Date.now()
    setStageElapsed(0)
    cuedRef.current = false
    autoLoggedRef.current = false
  }

  // Auto-log each minute (owner: "stats should log each minute automatically,
  // not manual"). At the minute's end, once a valid HR is on screen (a live
  // feed, or a typed reading in manual mode), record the stage and step up —
  // no button tap. Threshold spikes and maximal effort still resolve through
  // their own paths below; manual mode with no reading yet simply waits.
  useEffect(() => {
    if (phase !== 'ramp') return
    if (!stageDone || !hrValid || confirmJump !== null) return
    if (reachesThreshold || nearMaxEffort) return
    if (autoLoggedRef.current) return
    autoLoggedRef.current = true
    logMinute({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageDone, hrValid, confirmJump, phase])

  // Threshold crossed → the test ends itself. Setting a ≥3-point rise IS the
  // report — never ask for a confirming tap while someone's symptoms climb.
  // Depends on hrValid too: in MANUAL mode the patient may cross the symptom
  // threshold BEFORE typing the reading — the HRt must still capture the moment
  // they enter it (previously this only fired on a symptomScore change, so a
  // late-typed HR left the test frozen with no HRt recorded). One-shot guarded;
  // the HR-jump confirm inside logMinute still intercepts implausible values.
  useEffect(() => {
    if (reachesThreshold && hrValid && confirmJump === null && !finishingRef.current) {
      finishingRef.current = true
      logMinute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symptomScore, hrValid])

  /** Early termination (exhaustion / red-flag). */
  const endEarly = (termination: TestTermination) => {
    const stages =
      termination === 'red-flag' && !hrValid
        ? recordedStages
        : hrValid
          ? [...recordedStages, currentStage()]
          : recordedStages
    finish(termination, stages)
  }

  // ── setup: how are you doing this test? ─────────────────────────────────────
  if (phase === 'setup') {
    return (
      <section className="flex flex-col gap-4 pt-1">
        <button
          type="button"
          onClick={() => onAbort({ started: false, stages: [] })}
          className="-ml-1 -mt-0.5 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-[#7d9092] transition active:scale-[0.98]"
        >
          ← Back
        </button>

        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-[#16282b]">
            How will you do this test?
          </h1>
          <p className="m-0 text-[12.5px] leading-snug text-[#5d7174]">
            You&rsquo;ll step the effort up a little every minute while we watch your symptoms. Your
            clinician sees which one you used.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {MODALITIES.map((m) => {
            const on = modality === m.id
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() => setModality(m.id)}
                className={`flex flex-col gap-0.5 rounded-[16px] border-[1.5px] px-4 py-3.5 text-left transition active:scale-[0.99] ${
                  on ? 'border-[#5b9aa6] bg-[#e7f2f3]' : 'border-[#d4e0e1] bg-white'
                }`}
              >
                <span className="text-[15px] font-bold leading-tight text-[#16282b]">{m.label}</span>
                <span className="text-[11.5px] leading-snug text-[#7d9092]">{m.sub}</span>
              </button>
            )
          })}
        </div>

        <PrimaryButton
          disabled={modality === null}
          onClick={() => {
            stageStartRef.current = Date.now()
            setStageElapsed(0)
            cuedRef.current = false
            setPhase('ramp')
          }}
        >
          {modality === null ? 'Pick one to start' : 'Start minute 1'}
        </PrimaryButton>
      </section>
    )
  }

  const remaining = Math.max(0, STAGE_SECONDS - stageElapsed)

  return (
    <section className="flex flex-col gap-3 pt-1">
      {/* abort / back — never a dead end (and never a silent discard) */}
      <button
        type="button"
        onClick={() => onAbort({ started: true, stages: recordedStages })}
        className="-ml-1 -mt-0.5 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-[#7d9092] transition active:scale-[0.98]"
      >
        ← End test without a result
      </button>

      {/* hero: stage countdown ring + live/entered HR */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-[114px] w-[114px] flex-none">
          <StageRing elapsedSec={stageElapsed} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold tracking-[0.14em] text-[#849c9c]">
              MIN {minute}
            </span>
            <span
              className={`text-[34px] leading-[0.9] ${numFont}`}
              style={{ color: stageDone ? '#3c7a1f' : '#16282b' }}
            >
              {stageDone ? '✓' : `0:${String(remaining).padStart(2, '0')}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor="hr"
            className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#849c9c]"
          >
            Heart rate
          </label>
          {/* Live bpm from the paired connection auto-fills this field via the
              liveHr effect above; manual entry overrides; a stale feed clears it
              (dashes — never a frozen number). */}
          <div className="flex items-baseline gap-1.5">
            <input
              id="hr"
              type="number"
              inputMode="numeric"
              value={heartRate}
              onChange={(e) => {
                setHeartRate(e.target.value)
                setConfirmJump(null)
              }}
              placeholder="—"
              className={`w-[88px] border-none bg-transparent p-0 text-[46px] leading-[0.92] text-[#5b9aa6] outline-none placeholder:text-[#bcd0d2] ${numFont}`}
            />
            <span className="text-[11px] font-semibold text-[#9bafb0]">BPM</span>
          </div>
          {hrStatus === 'streaming' ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight text-[#3c7a1f]">
              <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#3c7a1f]" />
              {hrSourceLabel ?? 'Watch'} · live
            </span>
          ) : hrStatus === 'connecting' ? (
            <span className="text-[11px] leading-tight text-[#b58a32]">
              Signal dropped — re-connecting {hrSourceLabel ?? 'your device'}…
            </span>
          ) : (
            <span className="text-[11px] leading-tight text-[#9bafb0]">
              rested {restingSymptomScore}/10 · type it from your monitor
            </span>
          )}
        </div>
      </div>

      {/* per-stage effort instruction — the step-up cue. Shown only at the
          START of each minute (owner: no instructions panel while the program
          is actually running); it clears once they're pedalling so the running
          view is just timer + HR + how-you-feel. */}
      {stageElapsed < 12 && !stageDone && (
        <div className="rounded-[14px] border border-[#cfe0e2] bg-[#eef6f6] px-3.5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#3c7681]">
            {minute === 1 ? 'Start' : `Minute ${minute} — step up`}
          </span>
          <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-[#16282b]">
            {effortInstruction(modality as TestModality, minute)}
          </p>
        </div>
      )}

      {/* RPE — Borg 6–20 as a plain slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-[#3b4f52]">
            How hard does this feel? <span className="font-normal text-[#9bafb0]">· Borg RPE</span>
          </span>
          <span className={`text-[16px] text-[#5b9aa6] ${numFont}`}>
            {rpe}
            <span className="text-[11px] text-[#9bafb0]">/20</span>
          </span>
        </div>
        <input
          type="range"
          min={6}
          max={20}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          aria-label="How hard this feels, 6 easy to 20 maximal"
          className="w-full accent-[#5b9aa6]"
        />
        <div className="flex justify-between text-[10px] font-medium text-[#9bafb0]">
          <span>6 · easy</span>
          <span>20 · maximal</span>
        </div>
      </div>

      {nearMaxEffort && (
        <div className="rounded-[14px] border-[1.5px] border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-bold leading-snug text-[#a06a1c]">
            That&rsquo;s maximal effort — log this as your final stage.
          </p>
        </div>
      )}

      {/* symptom chips */}
      <div className="flex flex-col gap-[7px]">
        <span className="text-xs font-semibold text-[#3b4f52]">Any of your symptoms now?</span>
        <div className="flex flex-wrap gap-[7px]">
          {userSymptoms.map((s) => {
            const on = tappedSymptoms.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSymptom(s.id)}
                aria-pressed={on}
                className={`rounded-full border-[1.5px] px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? 'border-[#5b9aa6] bg-[#5b9aa6] text-white'
                    : 'border-[#d4e0e1] bg-white text-[#3b4f52]'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* symptom level — label row above the bars so the strip shares the same
          left/right edges as every other block (the inline label pushed the
          bars past the container edge) */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-[#3b4f52]">Symptom level</span>
          <span className={`text-[15px] text-[#5b9aa6] ${numFont}`}>
            {symptomScore}
            <span className="text-[10px] text-[#9bafb0]">/10</span>
          </span>
        </div>
        <SegmentBars
          value={symptomScore}
          onChange={setSymptomScore}
          variant="flat"
          ariaLabel="Current symptom level, 0 to 10"
        />
      </div>

      {/* HR-jump confirm — never silently mint an HRt from a typo */}
      {confirmJump !== null && (
        <div className="rounded-[14px] border-[1.5px] border-[#d79a3a] bg-[#fbf2e1] px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-bold leading-snug text-[#a06a1c]">
            That&rsquo;s a jump of {confirmJump} bpm since last minute. Is {hrValue} right?
          </p>
          <div className="mt-2.5 flex gap-2">
            <SecondaryButton onClick={() => setConfirmJump(null)} className="flex-1 p-2.5 text-[12.5px]">
              Fix it
            </SecondaryButton>
            <button
              type="button"
              onClick={() => logMinute({ confirmed: true, finalStage: nearMaxEffort })}
              className="flex-1 rounded-2xl bg-[#d79a3a] p-2.5 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
            >
              Yes — log it
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {reachesThreshold ? (
          hrValid ? (
            // Threshold reached WITH a reading — auto-logs via the effect above;
            // this button is the explicit manual fallback.
            <button
              type="button"
              disabled={confirmJump !== null}
              onClick={() => logMinute()}
              className="w-full rounded-[15px] p-3.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(60,118,129,0.7)] transition active:scale-[0.98] disabled:opacity-40"
              style={{ background: '#3c7681' }}
            >
              Log — this reaches your threshold
            </button>
          ) : (
            // Threshold reached but NO reading yet (manual mode) — the fix for
            // the frozen-test bug: tell them to enter the HR, which then logs.
            <div className="rounded-[14px] border-[1.5px] border-[#3c7681] bg-[#e7f2f3] px-3.5 py-3 text-center">
              <p className="m-0 text-[12.5px] font-bold leading-snug text-[#3c7681]">
                Your symptoms have reached your threshold — type your heart rate now to record it.
              </p>
            </div>
          )
        ) : nearMaxEffort ? (
          // Maximal effort ENDS the test — keep this an explicit action.
          <button
            type="button"
            disabled={!hrValid || confirmJump !== null}
            onClick={() => logMinute({ finalStage: true })}
            className="w-full rounded-[15px] p-3.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(160,106,28,0.6)] transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: '#a06a1c' }}
          >
            Log final stage — maximal effort
          </button>
        ) : stageDone && !hrValid ? (
          <div className="rounded-[14px] border-[1.5px] border-[#5b9aa6] bg-[#e7f2f3] px-3.5 py-3 text-center">
            <p className="m-0 text-[12.5px] font-bold leading-snug text-[#3c7681]">
              Minute {minute} is up — type this minute&rsquo;s heart rate and it logs automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-[14px] bg-[#eef4f4] px-3.5 py-3 text-center">
            <p className="m-0 text-[12px] font-semibold leading-snug text-[#5d7174]">
              {justLogged
                ? `Minute ${justLogged} logged ✓ — keep going, the next minute logs itself.`
                : 'Each minute logs itself when it ends. Just keep the effort stepping up and your rating current.'}
            </p>
          </div>
        )}
        <p className="m-0 text-center text-[10px] leading-tight text-[#9bafb0]">
          The test ends on its own at a {PROVOCATION_RISE}-point symptom rise (that sets your
          threshold), at maximal effort, or at minute {MAX_STAGES}. A symptom spike can be logged at
          any time — you never have to wait out the minute.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#dde7e7] pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#849c9c]">
          End the test early
        </span>
        <button
          type="button"
          onClick={() => endEarly('exhaustion-limited')}
          className="rounded-[14px] border-[1.5px] border-[#cdd9da] bg-white p-3 text-[13.5px] font-semibold text-[#5d7174] transition active:scale-[0.98]"
        >
          Stop — exhausted, no symptoms
        </button>
        <button
          type="button"
          onClick={() => endEarly('red-flag')}
          className="rounded-[14px] bg-[#d2463a] p-3 text-[13.5px] font-bold text-white shadow-[0_8px_18px_-9px_rgba(210,70,58,0.85)] transition active:scale-[0.98]"
        >
          ⚑ Warning sign — stop now
        </button>
      </div>

      {recordedStages.length > 0 && (
        <div
          className={`rounded-[12px] bg-[#eef4f4] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#5d7174] ${numFont}`}
        >
          {recordedStages
            .map((s) => `${s.minute}m · ${s.heartRate}bpm · sx${s.symptomScore}`)
            .join('    ')}
        </div>
      )}
    </section>
  )
}
