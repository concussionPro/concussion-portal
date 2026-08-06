'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PrimaryButton,
  SecondaryButton,
  SegmentBars,
  numFont,
} from '@/components/sst-trainer/shell'
import {
  GRTS_STAGE_NAMES,
  RTL_STAGE_NAMES,
  GRTS_CONTACT_STAGE,
  RTL_COMPLETE_STAGE,
  type PathwayState,
} from '@/lib/rtp/protocol'
import { PCSS_SYMPTOMS, RED_FLAG_SYMPTOMS, PCSS_ITEM_MAX } from '@/lib/rtp/symptoms'

const MINOR_CONSENT_AGE = 16
const TEAL = '#5b9aa6'
const INK = '#16282b'

interface StateResponse {
  athleteName: string
  sport: string | null
  injuryDate: string
  status: string
  state: PathwayState
  logCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 py-8 font-[family-name:var(--font-hanken)] text-[#16282b]"
      style={{
        background:
          'radial-gradient(125% 95% at 50% -5%, #f5f9f9 0%, #e7eeee 52%, #dbe5e5 100%)',
      }}
    >
      <div className="flex w-full max-w-[460px] flex-col overflow-hidden rounded-[34px] border border-[#e2ecec] bg-[#f4f8f8] shadow-[0_30px_60px_-24px_rgba(20,40,42,0.4),0_6px_18px_rgba(20,40,42,0.12)]">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-[#f4f8f8] px-6 pb-2 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-[#5b9aa6]">
            <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-[#5b9aa6]" />
            RTP PATHWAY
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
            PRE-LAUNCH
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-1">{children}</div>
      </div>
      <p className="m-0 text-xs font-medium tracking-[0.02em] text-[#5d7174]">{caption}</p>
    </main>
  )
}

function Heading({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <h1 className="m-0 text-[21px] font-extrabold leading-tight tracking-[-0.02em]">{title}</h1>
      {sub && <p className="m-0 text-[12.5px] leading-snug text-[#5d7174]">{sub}</p>}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function RtpAthleteApp({ code, orgCode }: { code: string; orgCode?: string }) {
  const isNew = code === 'new'
  if (isNew) return <OnboardingFlow orgCode={orgCode} />
  return <Dashboard code={code} />
}

// ── Onboarding (consent → episode) ──────────────────────────────────────────────

function OnboardingFlow({ orgCode }: { orgCode?: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'consent' | 'details'>('consent')

  // consent
  const [dob, setDob] = useState('')
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianAgreed, setGuardianAgreed] = useState(false)

  // details
  const [name, setName] = useState('')
  const [sex, setSex] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [injuryDate, setInjuryDate] = useState('')
  const [sport, setSport] = useState('')
  const [mechanism, setMechanism] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const age = ageFromDob(dob)
  const isMinor = age !== null && age < MINOR_CONSENT_AGE
  const canConsent =
    !!dob && consentAgreed && (!isMinor || (guardianName.trim().length > 0 && guardianAgreed))

  const submit = async () => {
    setError('')
    if (!name.trim() || !injuryDate) {
      setError('Athlete name and injury date are required.')
      return
    }
    setSubmitting(true)
    try {
      const consent = {
        agreed: true,
        atISO: new Date().toISOString(),
        version: 'rtp-v1',
        ...(isMinor ? { guardian: { name: guardianName.trim(), agreed: true } } : {}),
      }
      const res = await fetch('/api/rtp/athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgCode: orgCode || undefined,
          name: name.trim(),
          dob,
          sex: sex || undefined,
          parentEmail: parentEmail.trim() || undefined,
          injuryDate,
          sport: sport.trim() || undefined,
          mechanism: mechanism.trim() || undefined,
          consent,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not start the pathway.')
        setSubmitting(false)
        return
      }
      router.push(`/rtp/a/${data.shareCode}`)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  if (phase === 'consent') {
    return (
      <Shell caption="Consent">
        <Heading
          title="Before you start — consent"
          sub={orgCode ? `Joining via club code ${orgCode}` : 'Free individual tracking'}
        />
        <p className="mb-3 text-[13px] leading-relaxed text-[#3b4f52]">
          This tool collects <strong>personal and health information</strong> (name, date of birth,
          sex, injury details, and your daily symptom check-ins) so the concussion return-to-sport
          and return-to-learn pathway can be tracked and managed to the 2024 Australian guidelines.
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-[#3b4f52]">
          Please read how we handle this information in our{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#3c7681] underline"
          >
            Privacy Policy
          </a>{' '}
          before continuing.
        </p>

        <label className="mb-1 block text-xs font-semibold">Athlete date of birth *</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mb-1 w-full rounded-xl border border-[#cdd9da] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/50"
        />
        {age !== null && (
          <p className="mb-3 text-[11px] text-[#5d7174]">
            Age: {age} years{isMinor ? ' — a parent/guardian must also consent below.' : ''}
          </p>
        )}

        <label className="mb-3 mt-2 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={consentAgreed}
            onChange={(e) => setConsentAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <span className="text-[13px]">
            I consent to the collection and handling of this personal and health information for
            concussion pathway tracking, as described above and in the Privacy Policy.
          </span>
        </label>

        {isMinor && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <p className="mb-2 text-[13px] font-semibold text-amber-800">
              Parent / guardian consent required
            </p>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Parent or guardian full name"
              className="mb-2 w-full rounded-xl border border-[#cdd9da] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/50"
            />
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={guardianAgreed}
                onChange={(e) => setGuardianAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0"
              />
              <span className="text-[13px]">
                I am the parent/guardian and I consent on the athlete&apos;s behalf.
              </span>
            </label>
          </div>
        )}

        <PrimaryButton
          onClick={() => setPhase('details')}
          disabled={!canConsent}
          className="w-full"
        >
          I consent — continue
        </PrimaryButton>
      </Shell>
    )
  }

  return (
    <Shell caption="The injury">
      <Heading title="About the injury" sub="A few details to open the pathway." />

      <div className="flex flex-col gap-3">
        <Field label="Athlete name *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sex">
            <select value={sex} onChange={(e) => setSex(e.target.value)} className="input">
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Injury date *">
            <input
              type="date"
              value={injuryDate}
              onChange={(e) => setInjuryDate(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Sport">
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="e.g. AFL, rugby, netball"
            className="input"
          />
        </Field>
        <Field label="Mechanism (optional)">
          <input
            type="text"
            value={mechanism}
            onChange={(e) => setMechanism(e.target.value)}
            placeholder="e.g. head clash in a tackle"
            className="input"
          />
        </Field>
        <Field label="Parent / guardian email (optional)">
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="for updates"
            className="input"
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-[13px] font-semibold text-red-600">{error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        <PrimaryButton onClick={submit} disabled={submitting} className="w-full">
          {submitting ? 'Opening pathway…' : 'Open pathway'}
        </PrimaryButton>
        <SecondaryButton onClick={() => setPhase('consent')} className="w-full">
          Back
        </SecondaryButton>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #cdd9da;
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(91, 154, 166, 0.5);
        }
      `}</style>
    </Shell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────────

function Dashboard({ code }: { code: string }) {
  const [data, setData] = useState<StateResponse | null>(null)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState<'home' | 'checkin' | 'summary'>('home')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/rtp/state?code=${encodeURIComponent(code)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        setLoadError(json.error || 'Could not load this pathway.')
        return
      }
      setData(json)
      setLoadError('')
    } catch {
      setLoadError('Network error loading the pathway.')
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  if (loadError) {
    return (
      <Shell caption="Pathway">
        <Heading title="Pathway unavailable" />
        <p className="text-[13px] text-[#3b4f52]">{loadError}</p>
      </Shell>
    )
  }
  if (!data) {
    return (
      <Shell caption="Loading">
        <p className="py-10 text-center text-sm text-[#5d7174]">Loading pathway…</p>
      </Shell>
    )
  }

  if (view === 'checkin') {
    return <CheckIn code={code} onDone={() => { setView('home'); load() }} onCancel={() => setView('home')} />
  }
  if (view === 'summary') {
    return <Summary data={data} onBack={() => setView('home')} />
  }

  return <PathwayHome code={code} data={data} onCheckIn={() => setView('checkin')} onSummary={() => setView('summary')} onRefresh={load} setData={setData} />
}

// ── Pathway home ────────────────────────────────────────────────────────────────

function statusTone(s: PathwayState): { bg: string; ring: string; text: string } {
  if (s.redFlag) return { bg: '#fef2f2', ring: '#f6caca', text: '#b42323' }
  if (s.regression) return { bg: '#fef6ec', ring: '#f3dcb8', text: '#9a6212' }
  if (s.awaitingClearance) return { bg: '#fef6ec', ring: '#f3dcb8', text: '#9a6212' }
  if (s.advance.eligible) return { bg: '#eef7f3', ring: '#bfe2d2', text: '#1f7a52' }
  return { bg: '#eef4f5', ring: '#cddee1', text: '#3b4f52' }
}

function PathwayHome({
  code,
  data,
  onCheckIn,
  onSummary,
  setData,
}: {
  code: string
  data: StateResponse
  onCheckIn: () => void
  onSummary: () => void
  onRefresh: () => void
  setData: (d: StateResponse) => void
}) {
  const s = data.state
  const tone = statusTone(s)
  const [busy, setBusy] = useState(false)
  // /api/rtp/advance answers 400 (RTL already complete), 409 (engine refused —
  // carries `reason`), 429 and 500. Every one of those used to be swallowed
  // silently, so a refused advance looked like a dead button. Say what happened.
  const [advanceError, setAdvanceError] = useState('')

  const advance = async (track: 'grts' | 'rtl') => {
    setBusy(true)
    setAdvanceError('')
    try {
      const res = await fetch('/api/rtp/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, track }),
      })
      const json = await res.json()
      if (res.ok && json.state) {
        setData({ ...data, state: json.state })
        return
      }
      setAdvanceError(json.reason || json.error || 'Could not advance the stage. Please try again.')
    } catch {
      setAdvanceError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell caption="Pathway">
      <Heading
        title={data.athleteName}
        sub={`${data.sport || 'Sport —'} · injured ${fmtDate(data.injuryDate)}`}
      />

      {/* status banner */}
      <div
        className="mb-4 rounded-2xl p-3.5 text-[13px] font-medium leading-snug"
        style={{ background: tone.bg, boxShadow: `inset 0 0 0 1px ${tone.ring}`, color: tone.text }}
      >
        {s.status}
      </div>

      {/* GRTS stepper */}
      <SectionLabel>Return to Sport (GRTS)</SectionLabel>
      <StageTrack
        count={7}
        current={s.grtsStage}
        names={GRTS_STAGE_NAMES as Record<number, string>}
        gateIndex={GRTS_CONTACT_STAGE}
        gateLocked={s.awaitingClearance}
      />

      {/* RTL stepper */}
      <SectionLabel className="mt-4">Return to Learn (RTL)</SectionLabel>
      <StageTrack
        count={5}
        current={s.rtlStage}
        names={RTL_STAGE_NAMES as Record<number, string>}
      />

      {/* projected dates */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <DateCard label="Earliest contact" value={fmtDate(s.earliestContactDate)} />
        <DateCard label="Earliest competition" value={fmtDate(s.projectedReturnToCompetition)} />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-[#5d7174]">
        Projected from the later of the 21-day stand-down and 14-day symptom-free clocks. Shown once
        the athlete records a symptom-free day.
      </p>

      {/* advance eligibility */}
      <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-[inset_0_0_0_1px_#e2ecec]">
        <p className="text-[12px] font-semibold text-[#3b4f52]">Advancing a stage</p>
        <p className="mt-1 text-[12.5px] leading-snug text-[#5d7174]">{s.advance.reason}</p>
        {advanceError && (
          <p className="mt-2 text-[12.5px] font-semibold leading-snug text-red-600">{advanceError}</p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <PrimaryButton
            onClick={() => advance('grts')}
            disabled={busy || !s.advance.eligible}
            className="w-full"
          >
            Advance sport stage
          </PrimaryButton>
          {s.rtlStage < RTL_COMPLETE_STAGE && (
            <SecondaryButton onClick={() => advance('rtl')} disabled={busy} className="w-full">
              Progress return-to-learn stage
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={onCheckIn} className="w-full">
          Daily symptom check-in
        </PrimaryButton>
        <SecondaryButton onClick={onSummary} className="w-full">
          Clearance-ready summary
        </SecondaryButton>
      </div>
    </Shell>
  )
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#5b9aa6] ${className}`}>
      {children}
    </p>
  )
}

function StageTrack({
  count,
  current,
  names,
  gateIndex,
  gateLocked,
}: {
  count: number
  current: number
  names: Record<number, string>
  gateIndex?: number
  gateLocked?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, i) => {
          const done = i < current
          const here = i === current
          const isGate = gateIndex === i
          let bg = '#d4e3e3'
          if (done) bg = '#a7c7cc'
          if (here) bg = TEAL
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="flex h-7 w-full items-center justify-center rounded-md text-[11px] font-bold text-white"
                style={{ background: bg, color: done || here ? '#fff' : '#5d7174' }}
              >
                {isGate && gateLocked ? '🔒' : i}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 text-[12.5px] font-semibold" style={{ color: INK }}>
        {names[current]}
      </p>
    </div>
  )
}

function DateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-[inset_0_0_0_1px_#e2ecec]">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#5d7174]">{label}</p>
      <p className={`mt-0.5 text-[15px] font-bold ${numFont}`} style={{ color: INK }}>
        {value}
      </p>
    </div>
  )
}

// ── Daily check-in ──────────────────────────────────────────────────────────────

function CheckIn({
  code,
  onDone,
  onCancel,
}: {
  code: string
  onDone: () => void
  onCancel: () => void
}) {
  const [ratings, setRatings] = useState<number[]>(() => PCSS_SYMPTOMS.map(() => 0))
  const [redFlags, setRedFlags] = useState<boolean[]>(() => RED_FLAG_SYMPTOMS.map(() => false))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const total = ratings.reduce((a, b) => a + b, 0)
  const anyRedFlag = redFlags.some(Boolean)

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const dominant = PCSS_SYMPTOMS.filter((_, i) => ratings[i] >= 4)
      const res = await fetch('/api/rtp/symptom-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, pcssTotal: total, dominantSymptoms: dominant, redFlag: anyRedFlag }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Could not save your check-in.')
        setSubmitting(false)
        return
      }
      onDone()
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Shell caption="Daily check-in">
      <Heading title="How are you today?" sub="Rate each symptom 0 (none) to 6 (severe)." />

      {/* red-flag screen first */}
      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/60 p-3.5">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-red-700">
          Emergency red flags
        </p>
        <p className="mb-2 text-[12px] text-[#7a3b3b]">
          Tick any that apply. Any red flag means stop and seek urgent medical review.
        </p>
        <div className="flex flex-col gap-1.5">
          {RED_FLAG_SYMPTOMS.map((rf, i) => (
            <label key={rf} className="flex cursor-pointer items-start gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={redFlags[i]}
                onChange={(e) =>
                  setRedFlags((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                }
                className="mt-0.5 h-4 w-4 flex-shrink-0"
              />
              {rf}
            </label>
          ))}
        </div>
      </div>

      {anyRedFlag && (
        <div className="mb-4 rounded-2xl bg-[#fef2f2] p-3 text-[13px] font-semibold text-[#b42323] shadow-[inset_0_0_0_1px_#f6caca]">
          Red flag selected — this check-in will halt the pathway and prompt urgent medical review.
        </div>
      )}

      {/* PCSS items */}
      <SectionLabel>Symptoms ({total}/{PCSS_SYMPTOMS.length * PCSS_ITEM_MAX})</SectionLabel>
      <div className="flex flex-col gap-3">
        {PCSS_SYMPTOMS.map((sym, i) => (
          <div key={sym}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[13px] font-medium">{sym}</span>
              <span className={`text-[13px] font-bold ${numFont}`} style={{ color: TEAL }}>
                {ratings[i]}
              </span>
            </div>
            <SegmentBars
              ariaLabel={sym}
              value={ratings[i]}
              danger={ratings[i] >= 4}
              onChange={(v) => setRatings((prev) => prev.map((r, j) => (j === i ? Math.min(PCSS_ITEM_MAX, v) : r)))}
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-[13px] font-semibold text-red-600">{error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        <PrimaryButton onClick={submit} disabled={submitting} className="w-full">
          {submitting ? 'Saving…' : 'Save check-in'}
        </PrimaryButton>
        <SecondaryButton onClick={onCancel} disabled={submitting} className="w-full">
          Cancel
        </SecondaryButton>
      </div>
    </Shell>
  )
}

// ── Clearance-ready summary ──────────────────────────────────────────────────────

function Summary({ data, onBack }: { data: StateResponse; onBack: () => void }) {
  const s = data.state
  return (
    <Shell caption="Summary">
      <div className="rounded-2xl bg-white p-5 shadow-[inset_0_0_0_1px_#e2ecec]">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-[#5b9aa6]">
          <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-[#5b9aa6]" />
          CONCUSSION EDUCATION AUSTRALIA
        </div>
        <h1 className="text-[19px] font-extrabold leading-tight">Pathway summary</h1>
        <p className="mt-1 text-[12px] text-[#5d7174]">
          Managed to the 2024 Australian Concussion Guidelines for Youth &amp; Community Sport.
        </p>

        <dl className="mt-4 space-y-2.5 text-[13px]">
          <Row k="Athlete" v={data.athleteName} />
          <Row k="Sport" v={data.sport || '—'} />
          <Row k="Injury date" v={fmtDate(data.injuryDate)} />
          <Row k="Return-to-Sport stage" v={`${s.grtsStage}/6 — ${s.grtsStageName}`} />
          <Row k="Return-to-Learn stage" v={`${s.rtlStage}/4 — ${s.rtlStageName}`} />
          <Row k="Earliest contact date" v={fmtDate(s.earliestContactDate)} />
          <Row k="Earliest competition date" v={fmtDate(s.projectedReturnToCompetition)} />
          <Row
            k="Medical clearance"
            v={s.awaitingClearance ? 'Awaiting recorded clearance for full-contact practice' : 'Not blocking at this stage'}
          />
          <Row k="Status" v={s.status} />
        </dl>

        <p className="mt-4 border-t border-[#e2ecec] pt-3 text-[11px] leading-snug text-[#5d7174]">
          This tool tracks and recommends to the national guideline — it does not provide a medical
          clearance. Full-contact practice requires a recorded medical-practitioner clearance. Red-flag
          symptoms mean stop all activity and seek urgent medical review.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={() => window.print()} className="w-full">
          Print / save as PDF
        </PrimaryButton>
        <SecondaryButton onClick={onBack} className="w-full">
          Back to pathway
        </SecondaryButton>
      </div>
    </Shell>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-[#5d7174]">{k}</dt>
      <dd className="text-right font-semibold" style={{ color: INK }}>
        {v}
      </dd>
    </div>
  )
}
