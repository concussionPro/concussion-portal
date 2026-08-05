'use client'

import { useState } from 'react'
import {
  Activity,
  Plus,
  Trash2,
  HeartPulse,
  Target,
  ClipboardCheck,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react'
import {
  computePrescription,
  PROVOCATION_RISE,
  EXHAUSTION_RPE,
  type Prescription,
} from '@/lib/sst-trainer/protocol'

type Termination = 'symptom' | 'exhaustion'

interface Stage {
  id: number
  load: string // speed / incline, free text
  hr: string // bpm
  rpe: string // 6–20
  symptom: string // 0–10
}

let nextId = 100
function makeStage(): Stage {
  return { id: nextId++, load: '', hr: '', rpe: '', symptom: '' }
}

// The clinical core: HRt = HR at the FIRST stage where the symptom score
// rose >= 3 points above the resting baseline (Buffalo symptom-provocation
// threshold). The 80–90% HRt band is the sub-symptom-threshold training zone.
// Source the rise threshold from the engine so the tool stays in lockstep.
const SYMPTOM_RISE_THRESHOLD = PROVOCATION_RISE

// The OTHER validated BCTT termination criterion: voluntary exhaustion at
// Borg RPE >= 17 with no symptom provocation. It was collected and range-
// checked but never applied, while the public page claimed the tool applies
// "the standard termination rules" — so an RPE-limited test could still mint
// an HRt off a later stage. Sourced from the engine, same as the symptom rise.
const EXHAUSTION_RPE_THRESHOLD = EXHAUSTION_RPE

// Sane input bounds. Out-of-range values are rejected with a clear message
// rather than silently producing a "valid" HRt.
const SYMPTOM_MIN = 0
const SYMPTOM_MAX = 10
const RPE_MIN = 6
const RPE_MAX = 20
const HR_MIN = 30
const HR_MAX = 250

type ComputeResult =
  | { kind: 'need-baseline' }
  | { kind: 'range-error'; message: string }
  | { kind: 'hr-missing'; stageNumber: number }
  | { kind: 'no-complete-stage' }
  | { kind: 'no-threshold'; rpeEndpointStage: number | null }
  // The test hit the voluntary-exhaustion endpoint (RPE >= 17) BEFORE symptoms
  // rose >= 3 points. Stages beyond that are past the protocol's termination
  // point, so no HRt is minted from them.
  | {
      kind: 'rpe-endpoint-first'
      rpeEndpointStage: number
      rpeEndpointValue: number
      symptomStageNumber: number
    }
  | {
      kind: 'ok'
      hrt: number
      triggerStageNumber: number
      triggerSymptom: number
      rpeEndpointStage: number | null
      rx: Prescription
    }

function num(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function computeResult(stages: Stage[], baseline: string): ComputeResult {
  const baselineNum = num(baseline)
  if (baselineNum === null) return { kind: 'need-baseline' }
  if (baselineNum < SYMPTOM_MIN || baselineNum > SYMPTOM_MAX) {
    return {
      kind: 'range-error',
      message: `Resting baseline symptom score must be between ${SYMPTOM_MIN} and ${SYMPTOM_MAX}.`,
    }
  }

  // Reject out-of-range stage inputs before computing anything.
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]
    const hr = num(s.hr)
    const rpe = num(s.rpe)
    const sym = num(s.symptom)
    if (hr !== null && (hr < HR_MIN || hr > HR_MAX)) {
      return { kind: 'range-error', message: `Stage ${i + 1}: heart rate must be between ${HR_MIN} and ${HR_MAX} bpm.` }
    }
    if (rpe !== null && (rpe < RPE_MIN || rpe > RPE_MAX)) {
      return { kind: 'range-error', message: `Stage ${i + 1}: RPE must be between ${RPE_MIN} and ${RPE_MAX}.` }
    }
    if (sym !== null && (sym < SYMPTOM_MIN || sym > SYMPTOM_MAX)) {
      return { kind: 'range-error', message: `Stage ${i + 1}: symptom score must be between ${SYMPTOM_MIN} and ${SYMPTOM_MAX}.` }
    }
  }

  // TERMINATION RULE 2 (voluntary exhaustion): the first stage at RPE >= 17.
  // Computed up front so it can be compared against the symptom crossing.
  let rpeEndpointStage: number | null = null
  let rpeEndpointValue = 0
  for (let i = 0; i < stages.length; i++) {
    const rpe = num(stages[i].rpe)
    if (rpe !== null && rpe >= EXHAUSTION_RPE_THRESHOLD) {
      rpeEndpointStage = i + 1
      rpeEndpointValue = rpe
      break
    }
  }

  // TERMINATION RULE 1 (symptom exacerbation): the threshold sits on the FIRST
  // stage whose symptom score rose >= 3 above baseline — regardless of whether
  // HR was entered (matches the engine contract: HRt = HR at that minute). If
  // that crossing stage has no HR, surface a validation error rather than
  // skipping to a later (higher) HR.
  let completeStageCount = 0
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]
    const sym = num(s.symptom)
    const hr = num(s.hr)
    if (sym !== null && hr !== null) completeStageCount++
    if (sym === null) continue
    if (sym - baselineNum >= SYMPTOM_RISE_THRESHOLD) {
      const stageNumber = i + 1
      // Whichever endpoint came FIRST terminates the test. If the patient hit
      // voluntary exhaustion earlier, the later symptom rise is past the
      // protocol's endpoint and must not be reported as an HRt.
      if (rpeEndpointStage !== null && rpeEndpointStage < stageNumber) {
        return {
          kind: 'rpe-endpoint-first',
          rpeEndpointStage,
          rpeEndpointValue,
          symptomStageNumber: stageNumber,
        }
      }
      if (hr === null) return { kind: 'hr-missing', stageNumber }
      return {
        kind: 'ok',
        hrt: hr,
        triggerStageNumber: stageNumber,
        triggerSymptom: sym,
        rpeEndpointStage,
        rx: computePrescription(hr),
      }
    }
  }

  if (completeStageCount === 0) return { kind: 'no-complete-stage' }
  return { kind: 'no-threshold', rpeEndpointStage }
}

export default function BctcCalculatorClient() {
  const [name, setName] = useState('')
  const [baseline, setBaseline] = useState('')
  const [termination, setTermination] = useState<Termination>('symptom')
  const [stages, setStages] = useState<Stage[]>([makeStage(), makeStage(), makeStage()])
  const [submitted, setSubmitted] = useState(false)

  function updateStage(id: number, field: keyof Stage, value: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
    setSubmitted(false)
  }

  function addStage() {
    setStages((prev) => [...prev, makeStage()])
    setSubmitted(false)
  }

  function removeStage(id: number) {
    setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))
    setSubmitted(false)
  }

  const baselineNum = num(baseline)

  // Computed directly during render — the React Compiler memoizes this for us
  // (a manual useMemo here trips "Existing memoization could not be preserved").
  const result = computeResult(stages, baseline)

  const ok = submitted && result.kind === 'ok' ? result : null
  const needBaseline = submitted && result.kind === 'need-baseline'
  const rangeError = submitted && result.kind === 'range-error' ? result.message : null
  const hrMissingStage = submitted && result.kind === 'hr-missing' ? result.stageNumber : null
  const needStages = submitted && result.kind === 'no-complete-stage'

  const rpeFirst = submitted && result.kind === 'rpe-endpoint-first' ? result : null

  // No threshold but >=1 complete stage. Exhaustion-limited => did NOT
  // demonstrate exercise intolerance; symptom-limited => inconclusive data.
  // A recorded RPE >= 17 IS the exhaustion endpoint, so it counts even if the
  // clinician left the radio on "symptom-limited" — the data outranks the radio.
  const rpeEndpointStage =
    submitted && (result.kind === 'no-threshold' || result.kind === 'ok') ? result.rpeEndpointStage : null
  const noIntolerance =
    submitted && result.kind === 'no-threshold' && (termination === 'exhaustion' || result.rpeEndpointStage !== null)
  const inconclusive =
    submitted && result.kind === 'no-threshold' && termination === 'symptom' && result.rpeEndpointStage === null

  const displayName = name.trim() || 'this patient'

  return (
    <div className="mt-8 space-y-6">
      {/* PATIENT + BASELINE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b9aa6]/15 text-[#5b9aa6]">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          Test details
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Patient / athlete name <span className="font-normal text-slate-400">(optional)</span></span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. J. Smith"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#5b9aa6] focus:ring-2 focus:ring-[#5b9aa6]/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Resting baseline symptom score (0–10)</span>
            <input
              type="number"
              min={0}
              max={10}
              value={baseline}
              onChange={(e) => {
                setBaseline(e.target.value)
                setSubmitted(false)
              }}
              placeholder="Captured at rest, pre-test"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#5b9aa6] focus:ring-2 focus:ring-[#5b9aa6]/20"
            />
          </label>
        </div>
      </div>

      {/* STAGE TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b9aa6]/15 text-[#5b9aa6]">
              <Activity className="h-5 w-5" />
            </span>
            Graded test stages
          </h2>
          <button
            type="button"
            onClick={addStage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b9aa6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4d8893]"
          >
            <Plus className="h-4 w-4" /> Add stage
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          One row per stage / minute. Heart rate and symptom score are required to find the threshold; speed/incline is
          for your record. RPE is applied: a stage at RPE ≥{EXHAUSTION_RPE_THRESHOLD} is the voluntary-exhaustion
          endpoint and terminates the test.
        </p>
        {/* Buffalo incline is DEGREES, not percent. The placeholder said "2%",
            which teaches the wrong protocol on a page that ranks for "BCTT
            protocol" (2026-08-05 crawl). */}
        <p className="mt-1.5 text-xs text-slate-500">
          Buffalo protocol: fixed walking speed, incline raised <strong>1 degree (1°) per minute</strong> — degrees, not
          percent. Once incline reaches its ceiling, speed is increased instead.
        </p>

        {/* Desktop / wide table */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Speed / incline</th>
                <th className="py-2 pr-3">HR (bpm)</th>
                <th className="py-2 pr-3">RPE (6–20)</th>
                <th className="py-2 pr-3">Symptom (0–10)</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {stages.map((s, i) => {
                const isTrigger = ok?.triggerStageNumber === i + 1
                return (
                  <tr key={s.id} className={`border-b border-slate-100 ${isTrigger ? 'bg-[#5b9aa6]/10' : ''}`}>
                    <td className="py-2 pr-3 font-semibold text-slate-700">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={s.load}
                        onChange={(e) => updateStage(s.id, 'load', e.target.value)}
                        placeholder="e.g. 5.3 km/h / 2° incline"
                        className="w-32 rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-[#5b9aa6] focus:ring-1 focus:ring-[#5b9aa6]/30"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        value={s.hr}
                        onChange={(e) => updateStage(s.id, 'hr', e.target.value)}
                        placeholder="bpm"
                        className="w-20 rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-[#5b9aa6] focus:ring-1 focus:ring-[#5b9aa6]/30"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={6}
                        max={20}
                        value={s.rpe}
                        onChange={(e) => updateStage(s.id, 'rpe', e.target.value)}
                        placeholder="RPE"
                        className="w-20 rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-[#5b9aa6] focus:ring-1 focus:ring-[#5b9aa6]/30"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={s.symptom}
                        onChange={(e) => updateStage(s.id, 'symptom', e.target.value)}
                        placeholder="0–10"
                        className="w-20 rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-[#5b9aa6] focus:ring-1 focus:ring-[#5b9aa6]/30"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeStage(s.id)}
                        disabled={stages.length === 1}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Remove stage ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="mt-4 space-y-4 sm:hidden">
          {stages.map((s, i) => {
            const isTrigger = ok?.triggerStageNumber === i + 1
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 ${isTrigger ? 'border-[#5b9aa6] bg-[#5b9aa6]/10' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Stage {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeStage(s.id)}
                    disabled={stages.length === 1}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    aria-label={`Remove stage ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="col-span-2 block text-xs font-semibold text-slate-600">
                    Speed / incline
                    <input
                      type="text"
                      value={s.load}
                      onChange={(e) => updateStage(s.id, 'load', e.target.value)}
                      placeholder="e.g. 5.3 km/h / 2° incline"
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal outline-none focus:border-[#5b9aa6]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    HR (bpm)
                    <input
                      type="number"
                      value={s.hr}
                      onChange={(e) => updateStage(s.id, 'hr', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal outline-none focus:border-[#5b9aa6]"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    RPE (6–20)
                    <input
                      type="number"
                      value={s.rpe}
                      onChange={(e) => updateStage(s.id, 'rpe', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal outline-none focus:border-[#5b9aa6]"
                    />
                  </label>
                  <label className="col-span-2 block text-xs font-semibold text-slate-600">
                    Symptom score (0–10)
                    <input
                      type="number"
                      value={s.symptom}
                      onChange={(e) => updateStage(s.id, 'symptom', e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal outline-none focus:border-[#5b9aa6]"
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* TERMINATION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Test termination reason</h2>
        <div className="mt-4 space-y-3">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${termination === 'symptom' ? 'border-[#5b9aa6] bg-[#5b9aa6]/5' : 'border-slate-200'}`}>
            <input
              type="radio"
              name="termination"
              checked={termination === 'symptom'}
              onChange={() => {
                setTermination('symptom')
                setSubmitted(false)
              }}
              className="mt-0.5 h-4 w-4 accent-[#5b9aa6]"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Symptom-limited</span>
              <span className="block text-xs text-slate-500">Test stopped because symptoms were provoked.</span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${termination === 'exhaustion' ? 'border-[#5b9aa6] bg-[#5b9aa6]/5' : 'border-slate-200'}`}>
            <input
              type="radio"
              name="termination"
              checked={termination === 'exhaustion'}
              onChange={() => {
                setTermination('exhaustion')
                setSubmitted(false)
              }}
              className="mt-0.5 h-4 w-4 accent-[#5b9aa6]"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Exhaustion / RPE-limited</span>
              <span className="block text-xs text-slate-500">Test stopped at volitional fatigue / RPE max with no symptom provocation.</span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b9aa6] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4d8893] sm:w-auto"
        >
          <Target className="h-4 w-4" /> Calculate HRt &amp; prescription
        </button>
      </div>

      {/* ===== OUTPUT ===== */}
      {needBaseline && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Enter a resting baseline symptom score (0–10) to calculate the heart-rate threshold.</p>
        </div>
      )}

      {rangeError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{rangeError} Correct the value to calculate a valid heart-rate threshold.</p>
        </div>
      )}

      {hrMissingStage !== null && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Stage {hrMissingStage} reached the symptom threshold (a rise of ≥{SYMPTOM_RISE_THRESHOLD} points above the
            baseline) but has no heart rate — enter the HR at that minute to get a valid HRt. The threshold is anchored to
            the HR at the moment symptoms were provoked, so no prescription is generated until it is recorded.
          </p>
        </div>
      )}

      {needStages && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <p>Enter your test stages — at least one stage needs both a heart rate and a symptom score before a result can be calculated.</p>
        </div>
      )}

      {noIntolerance && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5" /> No symptom threshold reached
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            {displayName} completed an exhaustion / RPE-limited test <strong>without provoking symptoms</strong> (no stage
            rose ≥{SYMPTOM_RISE_THRESHOLD} points above the resting baseline of {baselineNum})
            {rpeEndpointStage !== null && (
              <> — the voluntary-exhaustion endpoint (RPE ≥{EXHAUSTION_RPE_THRESHOLD}) was reached at{' '}
              <strong>stage {rpeEndpointStage}</strong></>
            )}
            . This patient did <strong>not demonstrate exercise intolerance</strong> on the Buffalo protocol — the
            physiological (autonomic / exercise-intolerance) phenotype is unlikely to be the driver here.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            <strong>No sub-symptom-threshold aerobic prescription is generated.</strong> Flag this back to the referring
            clinician for re-evaluation — consider cervicogenic, vestibulo-ocular, or other non-physiological
            contributors that sit outside an HRt-driven aerobic program.
          </p>
        </div>
      )}

      {rpeFirst && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5" /> Test ended at voluntary exhaustion, not symptom provocation
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            RPE reached {rpeFirst.rpeEndpointValue} (≥{EXHAUSTION_RPE_THRESHOLD}) at{' '}
            <strong>stage {rpeFirst.rpeEndpointStage}</strong> — that is the Buffalo protocol&rsquo;s
            voluntary-exhaustion termination point. The ≥{SYMPTOM_RISE_THRESHOLD}-point symptom rise you recorded first
            appears at <strong>stage {rpeFirst.symptomStageNumber}</strong>, which is past the endpoint.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            <strong>No heart-rate threshold or prescription is generated</strong> from stages beyond the termination
            point. If the test genuinely continued past stage {rpeFirst.rpeEndpointStage}, correct the RPE entries; if it
            stopped there, this is an exhaustion-limited test that did not demonstrate exercise intolerance.
          </p>
        </div>
      )}

      {inconclusive && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <p>
            The test was marked symptom-limited, but no recorded stage shows a symptom rise of ≥{SYMPTOM_RISE_THRESHOLD}{' '}
            points above the baseline of {baselineNum}. Check the stage data — confirm the heart rate and symptom score at
            the point symptoms were provoked are entered.
          </p>
        </div>
      )}

      {ok && (
        <div className="overflow-hidden rounded-2xl border border-[#5b9aa6]/40 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#5b9aa6] to-[#4d8893] p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/80">
              <HeartPulse className="h-4 w-4" /> Heart-rate threshold
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-5xl font-bold leading-none">{ok.hrt}</span>
              <span className="pb-1 text-lg font-semibold">bpm</span>
            </div>
            <p className="mt-2 text-sm text-white/90">
              Triggered at <strong>stage {ok.triggerStageNumber}</strong> — symptom score rose to{' '}
              {ok.triggerSymptom} (≥{SYMPTOM_RISE_THRESHOLD} above the baseline of {baselineNum}).
            </p>
          </div>

          <div className="p-6">
            {/* Training band */}
            <div className="rounded-xl border border-[#5b9aa6]/30 bg-[#5b9aa6]/5 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d8893]">
                Sub-symptom-threshold training band · 80–90% HRt
              </span>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {ok.rx.lowerBpm}–{ok.rx.upperBpm} <span className="text-xl font-semibold text-slate-500">bpm</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-rose-600">
                Do not exceed {ok.rx.upperBpm} bpm during training.
              </p>
            </div>

            {/* Prescription summary */}
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
                <ClipboardCheck className="h-4 w-4" /> Prescription summary
              </h3>
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                Stationary cycle or treadmill, <strong>{ok.rx.sessionMinutes} minutes continuous</strong>,{' '}
                <strong>{ok.rx.daysPerWeek} days/week</strong>, at a heart-rate target of{' '}
                <strong>{ok.rx.lowerBpm}–{ok.rx.upperBpm} bpm</strong> (80–90% of an HRt of {ok.hrt} bpm), RPE roughly{' '}
                <strong>11–13</strong>. Stop the session if symptoms rise{' '}
                <strong>≥{ok.rx.stopRisePoints} points</strong> above the pre-session baseline. Re-test on the Buffalo
                protocol in <strong>~1–2 weeks</strong> to re-establish HRt and progress the training band as tolerance
                improves.
              </p>
            </div>

            {/* Validated prognostic flag (Haider 2019). computePrescription
                has always returned this; it was simply never rendered, so the
                one finding on this screen with published predictive value was
                invisible to the clinician reading it. */}
            {ok.rx.prolongedRecoveryRisk && ok.rx.clinicianNote && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Prolonged-recovery risk flag</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-900">{ok.rx.clinicianNote}</p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-800">
                    Prognostic only — it does <strong>not</strong> change the prescription above. The training band is
                    already individualised by being a percentage of this patient&rsquo;s own HRt.
                  </p>
                </div>
              </div>
            )}

            {/* Termination record — which of the two standard endpoints applied. */}
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              <strong>Termination:</strong> symptom exacerbation (≥{SYMPTOM_RISE_THRESHOLD}-point rise) at stage{' '}
              {ok.triggerStageNumber}
              {ok.rpeEndpointStage !== null
                ? ` — voluntary exhaustion (RPE ≥${EXHAUSTION_RPE_THRESHOLD}) was also recorded at stage ${ok.rpeEndpointStage}, at or after the symptom endpoint.`
                : ` — voluntary exhaustion (RPE ≥${EXHAUSTION_RPE_THRESHOLD}) was not reached.`}
            </p>

            {/* Scope reminder */}
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <p className="text-sm leading-relaxed text-blue-900">
                <strong>Scope reminder:</strong> the Accredited Exercise Physiologist delivers and progresses this
                sub-symptom-threshold program. Medical clearance for return-to-sport remains the decision of the referring
                clinician — report progress as a recommendation, never as clearance.
              </p>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This calculator is a clinical aid that automates the Buffalo HRt and 80–90% band arithmetic. It does not
              replace clinical judgement, the pre-test contraindication screen, or in-session monitoring.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
