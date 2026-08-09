'use client'

import { useState } from 'react'
import {
  PEM_ITEMS, PEM_FREQUENCY_ANCHORS, PEM_SEVERITY_ANCHORS, PEM_SOURCE,
  scorePemScreen, type PemScreen as PemScreenData,
} from '@/lib/sst-trainer/pem'
import { PrimaryButton } from '@/components/sst-trainer/shell'

/**
 * THE PEM SCREEN — the interlock's user interface.
 *
 * The gate logic has existed since 7 August; nothing called it, so nothing was
 * ever gated. This is the missing half.
 *
 * THE ANCHORS ARE THE POINT. A 0–4 control with no wording produces an
 * uncalibrated number that merely shares a range with the instrument. Both
 * scales render their published anchors ("About half the time", "Moderate"),
 * because the screening rule — both ratings ≥2 — only means what the paper says
 * it means if the respondent read those words.
 *
 * NO DEFAULT SELECTION. Every item starts unanswered and the button stays
 * disabled until all five have both ratings. A pre-selected 0 would let someone
 * tap through to "no PEM", which is precisely the failure the fail-closed design
 * exists to prevent — the gate would be defeated by the least engaged user.
 */
export function PemScreenForm({
  condition,
  onComplete,
  onCancel,
}: {
  condition: string
  onComplete: (screen: PemScreenData) => void
  onCancel?: () => void
}) {
  const [freq, setFreq] = useState<Array<number | null>>(PEM_ITEMS.map(() => null))
  const [sev, setSev] = useState<Array<number | null>>(PEM_ITEMS.map(() => null))

  const complete = freq.every((f) => f !== null) && sev.every((s) => s !== null)

  function submit() {
    if (!complete) return
    onComplete({
      items: PEM_ITEMS.map((_, i) => ({ frequency: freq[i] as number, severity: sev[i] as number })),
      screenedAt: new Date().toISOString().slice(0, 10),
    })
  }

  // Live preview so a clinician sitting with the patient sees the verdict form
  // as it is answered, rather than being surprised by a refusal at the end.
  const preview = complete
    ? scorePemScreen({
        items: PEM_ITEMS.map((_, i) => ({ frequency: freq[i] as number, severity: sev[i] as number })),
        screenedAt: 'preview',
      })
    : null

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.18em] text-(--sst-accent-ink)">
        Before we prescribe
      </p>
      <h2 className="mt-1 mb-1 text-[20px] font-bold leading-tight text-(--sst-ink-1)">
        Post-exertional malaise screen
      </h2>
      <p className="m-0 mb-4 text-[12.5px] leading-snug text-(--sst-ink-3)">
        For {condition.replace('-', ' ')}, we check for post-exertional malaise before setting any
        training band. Over the <strong>last six months</strong>, how often have you had each of
        these, and how bad was it?
      </p>

      {PEM_ITEMS.map((item, i) => (
        <div key={item} className="mb-3 rounded-xl border border-(--sst-line) bg-(--sst-surface-4) p-3">
          <p className="m-0 mb-2 text-[13px] font-semibold leading-snug text-(--sst-ink-1)">{item}</p>

          <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-wider text-(--sst-ink-4)">
            How often
          </p>
          <div className="mb-2.5 grid grid-cols-5 gap-1">
            {PEM_FREQUENCY_ANCHORS.map((anchor, v) => (
              <button
                key={anchor}
                type="button"
                onClick={() => setFreq((p) => p.map((x, j) => (j === i ? v : x)))}
                className={[
                  'rounded-lg px-1 py-1.5 text-[9.5px] font-semibold leading-tight transition-colors',
                  freq[i] === v
                    ? 'bg-(--sst-accent-ink) text-white'
                    : 'bg-(--sst-surface-2) text-(--sst-ink-3) hover:bg-(--sst-surface-3)',
                ].join(' ')}
              >
                {anchor}
              </button>
            ))}
          </div>

          <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-wider text-(--sst-ink-4)">
            How bad
          </p>
          <div className="grid grid-cols-5 gap-1">
            {PEM_SEVERITY_ANCHORS.map((anchor, v) => (
              <button
                key={anchor}
                type="button"
                onClick={() => setSev((p) => p.map((x, j) => (j === i ? v : x)))}
                className={[
                  'rounded-lg px-1 py-1.5 text-[9.5px] font-semibold leading-tight transition-colors',
                  sev[i] === v
                    ? 'bg-(--sst-accent-ink) text-white'
                    : 'bg-(--sst-surface-2) text-(--sst-ink-3) hover:bg-(--sst-surface-3)',
                ].join(' ')}
              >
                {anchor}
              </button>
            ))}
          </div>
        </div>
      ))}

      {preview?.status === 'positive' && (
        <div className="mb-3 rounded-xl border border-(--sst-warn-dim) bg-(--sst-warn-soft) p-3">
          <p className="m-0 text-[12.5px] font-semibold leading-snug text-(--sst-warn-ink)">
            Your answers indicate post-exertional malaise.
          </p>
          <p className="m-0 mt-1 text-[11.5px] leading-snug text-(--sst-warn-ink-2)">
            A graded exertion target is not the right approach while this is present. We will not set
            a training band — your clinician will work with you on pacing and activity management
            instead. This is a clinical finding, not an error.
          </p>
        </div>
      )}

      <PrimaryButton disabled={!complete} onClick={submit}>
        {complete ? 'Continue' : `Answer all ${PEM_ITEMS.length} items`}
      </PrimaryButton>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 w-full text-center text-[12px] font-semibold text-(--sst-ink-4)"
        >
          Back
        </button>
      )}

      <p className="mt-3 text-[10px] leading-snug text-(--sst-ink-4)">{PEM_SOURCE}</p>
    </div>
  )
}
