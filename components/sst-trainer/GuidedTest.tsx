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
import {
  clearHeartbeat,
  loadHeartbeat,
  saveHeartbeat,
  TEST_HEARTBEAT_KEY,
} from '@/lib/sst-trainer/heartbeat'
import { PrimaryButton, SecondaryButton, SymptomStepper, numFont } from './shell'
import { useWakeLock } from './use-wake-lock'

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
  // Inert in production — the override is a test-only accelerator, so a stray
  // prod env var can never shorten the clinical Buffalo stage below 60s.
  if (process.env.NODE_ENV === 'production') return 60
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

/**
 * Everything an interrupted graded test needs to resume honestly: only stages
 * the patient actually logged — never synthesised readings. The interrupted
 * minute itself re-runs from scratch (HR recovers during an interruption, so
 * logging a post-interruption reading against pre-interruption effort would
 * fabricate the stage).
 */
interface TestHeartbeat {
  startedAt: number
  phase: 'ramp'
  modality: TestModality
  minute: number
  stageStartAt: number
  stages: TestStage[]
  restingSymptomScore: number
  rpe: number
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--sst-line-soft)" strokeWidth={9} />
      {frac > 0 && (
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`}
          fill="none"
          stroke={elapsedSec >= STAGE_SECONDS ? 'var(--sst-good)' : 'var(--sst-accent)'}
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

  // ── wake lock: the graded test is an exertion screen too ───────────────────
  useWakeLock(phase === 'ramp')

  // ── interruption recovery: 5s heartbeat + resume-on-remount ────────────────
  // A dropped call / accidental close mid-ramp must not discard logged stages.
  const testStartRef = useRef<number>(0)
  const [resume, setResume] = useState<TestHeartbeat | null>(null)
  useEffect(() => {
    const hb = loadHeartbeat<TestHeartbeat>(TEST_HEARTBEAT_KEY)
    if (!hb) return
    // The readiness baseline was re-taken with a different score since the
    // interruption — the old stages' threshold math no longer applies. Discard.
    if (
      hb.data.restingSymptomScore !== restingSymptomScore ||
      !hb.data.modality ||
      typeof hb.data.startedAt !== 'number'
    ) {
      clearHeartbeat(TEST_HEARTBEAT_KEY)
      return
    }
    setResume(hb.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hbRef = useRef<TestHeartbeat | null>(null)
  useEffect(() => {
    hbRef.current =
      phase === 'ramp' && modality
        ? {
            startedAt: testStartRef.current || Date.now(),
            phase: 'ramp',
            modality,
            minute,
            stageStartAt: stageStartRef.current,
            stages: recordedStages,
            restingSymptomScore,
            rpe,
          }
        : null
  })
  useEffect(() => {
    if (phase !== 'ramp') return
    const iv = setInterval(() => {
      if (hbRef.current) saveHeartbeat(TEST_HEARTBEAT_KEY, hbRef.current)
    }, 5000)
    return () => clearInterval(iv)
  }, [phase])

  /** Restore an interrupted ramp: logged stages return; the broken minute re-runs. */
  const applyResume = () => {
    if (!resume) return
    setModality(resume.modality)
    setRecordedStages(Array.isArray(resume.stages) ? resume.stages : [])
    setMinute(resume.minute)
    setRpe(resume.rpe)
    setSymptomScore(restingSymptomScore)
    setHeartRate('')
    lastLiveRef.current = ''
    setTappedSymptoms(new Set())
    testStartRef.current = resume.startedAt
    // Restart the interrupted minute from zero — HR drops during a pause, so a
    // post-interruption reading must not be logged against pre-pause effort.
    stageStartRef.current = Date.now()
    setStageElapsed(0)
    cuedRef.current = false
    autoLoggedRef.current = false
    finishingRef.current = false
    setResume(null)
    setPhase('ramp')
  }

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
    clearHeartbeat(TEST_HEARTBEAT_KEY) // the test is over — nothing to resume
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
    // confirm — but ONLY for a typed reading. This guard exists to catch a
    // manual-entry typo; on a LIVE stream the patient isn't typing, so a big
    // delta is sensor variance, not a typo — a confirm modal there would fire
    // falsely AND block the auto-logger (a stable live HR was showing a bogus
    // "jump of N bpm" and freezing minute logging). Live feeds skip the guard.
    const prev = recordedStages[recordedStages.length - 1]
    if (!opts.confirmed && prev && hrStatus !== 'streaming' && Math.abs((hrValue as number) - prev.heartRate) > HR_JUMP_CONFIRM) {
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
    // Interrupted test found — offer Resume / Discard before a fresh setup.
    if (resume) {
      const startedLabel = new Date(resume.startedAt).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return (
        <section className="flex min-h-[60vh] flex-col justify-center gap-4 pt-1">
          <div className="rounded-[18px] border-[1.5px] border-(--sst-accent) bg-(--sst-accent-soft) px-4 py-4">
            <p className="m-0 text-[16px] font-extrabold leading-snug text-(--sst-ink)">
              You have a test in progress from {startedLabel}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-(--sst-ink-2)">
              {resume.stages.length > 0
                ? `${resume.stages.length} logged minute${resume.stages.length === 1 ? '' : 's'} are safe — minute ${resume.minute} restarts from zero.`
                : 'Pick up where you left off — the interrupted minute restarts from zero.'}
            </p>
          </div>
          <PrimaryButton onClick={applyResume} className="rounded-[18px] py-[17px] text-base">
            Resume
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              clearHeartbeat(TEST_HEARTBEAT_KEY)
              setResume(null)
            }}
            className="p-3"
          >
            Discard
          </SecondaryButton>
        </section>
      )
    }
    return (
      <section className="flex flex-col gap-4 pt-1">
        <button
          type="button"
          onClick={() => onAbort({ started: false, stages: [] })}
          className="-ml-1 -mt-0.5 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-(--sst-faint) transition active:scale-[0.98]"
        >
          ← Back
        </button>

        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
            How will you do this test?
          </h1>
          <p className="m-0 text-[12.5px] leading-snug text-(--sst-muted)">
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
                  on ? 'border-(--sst-accent) bg-(--sst-accent-soft)' : 'border-(--sst-line) bg-(--sst-card)'
                }`}
              >
                <span className="text-[15px] font-bold leading-tight text-(--sst-ink)">{m.label}</span>
                <span className="text-[11.5px] leading-snug text-(--sst-faint)">{m.sub}</span>
              </button>
            )
          })}
        </div>

        <PrimaryButton
          disabled={modality === null}
          onClick={() => {
            testStartRef.current = Date.now()
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
    <section className="flex flex-col gap-[9px] pt-1">
      {/* abort / back — never a dead end (and never a silent discard) */}
      <button
        type="button"
        onClick={() => {
          clearHeartbeat(TEST_HEARTBEAT_KEY) // explicit abort — nothing to resume
          onAbort({ started: true, stages: recordedStages })
        }}
        className="-ml-1 -mt-0.5 self-start rounded-[10px] px-1 py-0.5 text-[12px] font-semibold text-(--sst-faint) transition active:scale-[0.98]"
      >
        ← End test without a result
      </button>

      {/* hero: stage countdown ring + live/entered HR */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-[114px] w-[114px] flex-none">
          <StageRing elapsedSec={stageElapsed} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold tracking-[0.14em] text-(--sst-muted)">
              MIN {minute}
            </span>
            <span
              className={`text-[34px] leading-[0.9] ${numFont}`}
              style={{ color: stageDone ? 'var(--sst-good)' : 'var(--sst-ink)' }}
            >
              {stageDone ? '✓' : `0:${String(remaining).padStart(2, '0')}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor="hr"
            className="text-[10px] font-semibold uppercase tracking-[0.05em] text-(--sst-muted)"
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
                // A jump-confirm intercept left autoLoggedRef latched true, so
                // after "Fix it" the corrected value could never auto-log and a
                // manual test wedged. A typed correction re-arms the auto-logger.
                // (Re-arming at the intercept itself would loop: "Fix it" with
                // the value unchanged would instantly re-fire the confirm.)
                autoLoggedRef.current = false
              }}
              placeholder="—"
              className={`w-[88px] border-none bg-transparent p-0 text-[46px] leading-[0.92] text-(--sst-accent) outline-none placeholder:text-(--sst-placeholder) ${numFont}`}
            />
            <span className="text-[11px] font-semibold text-(--sst-muted)">BPM</span>
          </div>
          {hrStatus === 'streaming' ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight text-(--sst-good)">
              <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-(--sst-good)" />
              {hrSourceLabel ?? 'Watch'} · live
            </span>
          ) : hrStatus === 'connecting' ? (
            <span className="text-[11px] leading-tight text-(--sst-warn-dim)">
              Signal dropped — re-connecting {hrSourceLabel ?? 'your device'}…
            </span>
          ) : (
            <span className="text-[11px] leading-tight text-(--sst-muted)">
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
        <div className="rounded-[14px] border border-(--sst-line) bg-(--sst-tint-a) px-3.5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-(--sst-accent-ink)">
            {minute === 1 ? 'Start' : `Minute ${minute} — step up`}
          </span>
          <p className="m-0 mt-1 text-[13px] font-semibold leading-snug text-(--sst-ink)">
            {effortInstruction(modality as TestModality, minute)}
          </p>
        </div>
      )}

      {/* Effort: no per-minute Borg slider (you're exercising — you won't fiddle a
          slider each minute). Symptom level below drives the threshold; this single
          tap captures the other BCTT stop criterion — voluntary exhaustion (RPE >17). */}
      <button
        type="button"
        onClick={() => setRpe((r) => (r >= EXHAUSTION_RPE ? 8 : EXHAUSTION_RPE))}
        aria-pressed={rpe >= EXHAUSTION_RPE}
        className={`flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] px-3.5 py-3 text-[13.5px] font-semibold transition active:scale-[0.98] ${
          rpe >= EXHAUSTION_RPE
            ? 'border-(--sst-warn) bg-(--sst-warn-soft) text-(--sst-warn-ink)'
            : 'border-(--sst-line) bg-(--sst-card) text-(--sst-ink-2)'
        }`}
      >
        {rpe >= EXHAUSTION_RPE ? '✓ At my limit — logging as final stage' : 'I’ve reached my limit — can’t go harder'}
      </button>

      {nearMaxEffort && (
        <div className="rounded-[14px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-warn-ink)">
            That&rsquo;s maximal effort — log this as your final stage.
          </p>
        </div>
      )}

      {/* symptom chips */}
      <div className="flex flex-col gap-[7px]">
        <span className="text-xs font-semibold text-(--sst-ink-2)">Any of your symptoms now?</span>
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
                    ? 'border-(--sst-accent) bg-(--sst-accent) text-(--sst-on-accent)'
                    : 'border-(--sst-line) bg-(--sst-card) text-(--sst-ink-2)'
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
        <span className="text-xs font-semibold text-(--sst-ink-2)">
          Symptom level <span className="font-normal text-(--sst-muted)">· 0 none → 10 worst</span>
        </span>
        <div className="max-w-[360px]">
          <SymptomStepper value={symptomScore} onChange={setSymptomScore} ariaLabel="Symptom level" />
        </div>
      </div>

      {/* HR-jump confirm — never silently mint an HRt from a typo */}
      {confirmJump !== null && (
        <div className="rounded-[14px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-warn-ink)">
            That&rsquo;s a jump of {confirmJump} bpm since last minute. Is {hrValue} right?
          </p>
          <div className="mt-2.5 flex gap-2">
            <SecondaryButton onClick={() => setConfirmJump(null)} className="flex-1 p-2.5 text-[12.5px]">
              Fix it
            </SecondaryButton>
            <button
              type="button"
              onClick={() => logMinute({ confirmed: true, finalStage: nearMaxEffort })}
              className="flex-1 rounded-2xl bg-(--sst-warn) p-2.5 text-[12.5px] font-bold text-(--sst-on-accent) transition active:scale-[0.98]"
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
              className="w-full rounded-[15px] p-3.5 text-sm font-bold text-(--sst-on-accent) shadow-[0_8px_18px_-8px_rgba(60,118,129,0.7)] transition active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--sst-accent-ink)' }}
            >
              Log — this reaches your threshold
            </button>
          ) : (
            // Threshold reached but NO reading yet (manual mode) — the fix for
            // the frozen-test bug: tell them to enter the HR, which then logs.
            <div className="rounded-[14px] border-[1.5px] border-(--sst-accent-ink) bg-(--sst-accent-soft) px-3.5 py-3 text-center">
              <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-accent-ink)">
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
            className="w-full rounded-[15px] p-3.5 text-sm font-bold text-(--sst-on-accent) shadow-[0_8px_18px_-8px_rgba(160,106,28,0.6)] transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--sst-warn-ink)' }}
          >
            Log final stage — maximal effort
          </button>
        ) : stageDone && !hrValid ? (
          <div className="rounded-[14px] border-[1.5px] border-(--sst-accent) bg-(--sst-accent-soft) px-3.5 py-3 text-center">
            <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-accent-ink)">
              Minute {minute} is up — type this minute&rsquo;s heart rate and it logs automatically.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-[14px] bg-(--sst-surface-2) px-3.5 py-2.5 text-center">
            {justLogged ? (
              <p className="m-0 text-[13px] font-bold leading-snug text-(--sst-good)">
                Minute {justLogged} logged ✓
              </p>
            ) : (
              <p className="m-0 text-[13px] font-semibold leading-snug text-(--sst-ink-2)">
                Logs automatically at <span className={numFont}>0:00</span> — keep stepping the effort up.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-(--sst-line-soft) pt-3">
        <button
          type="button"
          onClick={() => endEarly('exhaustion-limited')}
          className="flex-1 rounded-[14px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) p-3 text-[13px] font-semibold text-(--sst-muted) transition active:scale-[0.98]"
        >
          Stop — exhausted
        </button>
        <button
          type="button"
          onClick={() => endEarly('red-flag')}
          className="flex-1 rounded-[14px] bg-(--sst-danger) p-3 text-[13px] font-bold text-(--sst-on-accent) shadow-[0_8px_18px_-9px_rgba(210,70,58,0.85)] transition active:scale-[0.98]"
        >
          ⚑ Warning sign
        </button>
      </div>

      {recordedStages.length > 0 && (
        <div className="rounded-[12px] bg-(--sst-surface-2) px-3 py-2.5">
          <p className="m-0 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-(--sst-ghost)">
            Logged this test
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recordedStages.map((s) => (
              <span
                key={s.minute}
                className={`rounded-full bg-(--sst-card) px-2 py-0.5 text-[10.5px] text-(--sst-muted) ${numFont}`}
              >
                {s.minute}m · {s.heartRate} bpm · sx {s.symptomScore}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
