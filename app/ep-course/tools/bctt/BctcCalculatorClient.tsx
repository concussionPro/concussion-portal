'use client'

import { useState, useMemo } from 'react'
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
const SYMPTOM_RISE_THRESHOLD = 3

interface Computed {
  hrt: number
  triggerStageNumber: number
  triggerSymptom: number
  bandLow: number // 80%
  bandHigh: number // 90%
}

function num(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
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

  // Find the first stage where symptom score rose >= 3 above baseline.
  const result = useMemo<Computed | null>(() => {
    if (baselineNum === null) return null
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i]
      const sym = num(s.symptom)
      const hr = num(s.hr)
      if (sym === null || hr === null) continue
      if (sym - baselineNum >= SYMPTOM_RISE_THRESHOLD) {
        return {
          hrt: hr,
          triggerStageNumber: i + 1,
          triggerSymptom: sym,
          bandLow: Math.round(hr * 0.8),
          bandHigh: Math.round(hr * 0.9),
        }
      }
    }
    return null
  }, [stages, baselineNum])

  // No threshold + exhaustion-limited => did NOT demonstrate exercise
  // intolerance (likely not the physiological phenotype).
  const noIntolerance = submitted && baselineNum !== null && result === null && termination === 'exhaustion'
  const inconclusive = submitted && baselineNum !== null && result === null && termination === 'symptom'
  const needBaseline = submitted && baselineNum === null

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
          One row per stage / minute. Heart rate and symptom score are required to find the threshold; speed/incline and RPE are for your record.
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
                const isTrigger = result?.triggerStageNumber === i + 1 && submitted
                return (
                  <tr key={s.id} className={`border-b border-slate-100 ${isTrigger ? 'bg-[#5b9aa6]/10' : ''}`}>
                    <td className="py-2 pr-3 font-semibold text-slate-700">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={s.load}
                        onChange={(e) => updateStage(s.id, 'load', e.target.value)}
                        placeholder="e.g. 5.3 km/h / 2%"
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
            const isTrigger = result?.triggerStageNumber === i + 1 && submitted
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
                      placeholder="e.g. 5.3 km/h / 2%"
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

      {noIntolerance && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5" /> No symptom threshold reached
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            {displayName} completed an exhaustion / RPE-limited test <strong>without provoking symptoms</strong> (no stage
            rose ≥{SYMPTOM_RISE_THRESHOLD} points above the resting baseline of {baselineNum}). This patient did{' '}
            <strong>not demonstrate exercise intolerance</strong> on the Buffalo protocol — the physiological
            (autonomic / exercise-intolerance) phenotype is unlikely to be the driver here.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-900">
            <strong>No sub-symptom-threshold aerobic prescription is generated.</strong> Flag this back to the referring
            clinician for re-evaluation — consider cervicogenic, vestibulo-ocular, or other non-physiological
            contributors that sit outside an HRt-driven aerobic program.
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

      {submitted && result && (
        <div className="overflow-hidden rounded-2xl border border-[#5b9aa6]/40 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#5b9aa6] to-[#4d8893] p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/80">
              <HeartPulse className="h-4 w-4" /> Heart-rate threshold
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-5xl font-bold leading-none">{result.hrt}</span>
              <span className="pb-1 text-lg font-semibold">bpm</span>
            </div>
            <p className="mt-2 text-sm text-white/90">
              Triggered at <strong>stage {result.triggerStageNumber}</strong> — symptom score rose to{' '}
              {result.triggerSymptom} (≥{SYMPTOM_RISE_THRESHOLD} above the baseline of {baselineNum}).
            </p>
          </div>

          <div className="p-6">
            {/* Training band */}
            <div className="rounded-xl border border-[#5b9aa6]/30 bg-[#5b9aa6]/5 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#4d8893]">
                Sub-symptom-threshold training band · 80–90% HRt
              </span>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {result.bandLow}–{result.bandHigh} <span className="text-xl font-semibold text-slate-500">bpm</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-rose-600">
                Do not exceed {result.bandHigh} bpm during training.
              </p>
            </div>

            {/* Prescription summary */}
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
                <ClipboardCheck className="h-4 w-4" /> Prescription summary
              </h3>
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                Stationary cycle or treadmill, <strong>20 minutes continuous</strong>, <strong>6 days/week</strong>, at a
                heart-rate target of <strong>{result.bandLow}–{result.bandHigh} bpm</strong> (80–90% of an HRt of{' '}
                {result.hrt} bpm), RPE roughly <strong>11–13</strong>. Stop the session if symptoms rise{' '}
                <strong>≥2 points</strong> above the pre-session baseline. Re-test on the Buffalo protocol in{' '}
                <strong>~1–2 weeks</strong> to re-establish HRt and progress the training band as tolerance improves.
              </p>
            </div>

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
