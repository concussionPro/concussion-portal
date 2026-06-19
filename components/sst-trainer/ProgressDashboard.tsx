'use client'

import {
  progressionDecision,
  SESSION_STOP_RISE,
  type Prescription,
  type ProgressionDecision,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'

const DECISION_LABEL: Record<ProgressionDecision, string> = {
  advance: 'Advance',
  hold: 'Hold',
  regress: 'Ease back',
  refer: 'Check in with your clinician',
}

export default function ProgressDashboard({
  rx,
  sessions,
  onNewSession,
  onRetest,
}: {
  rx: Prescription
  sessions: SessionLog[]
  onNewSession: () => void
  onRetest: () => void
}) {
  // engine decides advance / hold / regress / refer from recent sessions
  const decision = progressionDecision(rx, sessions)

  // simple bar scale for the plain HR visualisation
  const maxHr = Math.max(rx.upperBpm, ...sessions.map((s) => s.peakHeartRate), 1)

  return (
    // DESIGN: progress dashboard — recovery-curve hero, calm sense of momentum
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Your progress</h1>
        <p className="text-sm text-gray-600">
          Band {rx.lowerBpm}–{rx.upperBpm} bpm · {sessions.length} session
          {sessions.length === 1 ? '' : 's'} logged
        </p>
      </header>

      {/* DESIGN: progression guidance card — the engine's call, plus what to do next */}
      <div className="rounded-lg border-2 border-[#5b9aa6] bg-[#5b9aa6]/10 p-4">
        <p className="text-sm font-medium text-[#5b9aa6]">{DECISION_LABEL[decision.decision]}</p>
        <p className="mt-1 text-sm text-gray-700">{decision.message}</p>
        {decision.newCeilingBpm !== undefined && (
          <p className="mt-2 text-sm font-medium">
            Suggested new ceiling: {decision.newCeilingBpm} bpm
          </p>
        )}
      </div>

      {/* DESIGN: recovery-curve chart — replace this plain bar list with a real chart */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Sessions</h2>
        {sessions.length === 0 && (
          <p className="text-sm text-gray-500">No sessions yet. Log your first one to see progress.</p>
        )}
        <ul className="flex flex-col gap-3">
          {sessions.map((s, i) => {
            const flare = s.nextDayFlare || s.peakSymptom - s.preSymptom >= SESSION_STOP_RISE
            return (
              <li key={`${s.date}-${i}`} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{s.date}</span>
                  <span>
                    avg {s.avgHeartRate} · peak {s.peakHeartRate} bpm · {s.completedMinutes} min
                  </span>
                </div>
                {/* DESIGN: bar = peak HR vs ceiling; elevate to a proper trend chart */}
                <div className="h-3 w-full rounded bg-gray-100">
                  <div
                    className={`h-3 rounded ${flare ? 'bg-amber-400' : 'bg-[#5b9aa6]'}`}
                    style={{ width: `${Math.min(100, (s.peakHeartRate / maxHr) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  symptoms {s.preSymptom} → {s.peakSymptom}
                  {flare ? ' · flare' : ' · clean'}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetest}
          className="flex-1 rounded-lg border border-gray-300 p-4 text-base font-medium"
        >
          Re-test threshold
        </button>
        {/* DESIGN: primary CTA */}
        <button
          type="button"
          onClick={onNewSession}
          className="flex-1 rounded-lg bg-[#5b9aa6] p-4 text-base font-medium text-white"
        >
          New session
        </button>
      </div>
    </section>
  )
}
