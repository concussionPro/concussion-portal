'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Calendar } from 'lucide-react'
import { trackEvent, setIdentity } from '@/lib/analytics'

function TalkInner() {
  const params = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [clinic, setClinic] = useState('')
  const [role, setRole] = useState('')
  const [teamSize, setTeamSize] = useState<string>('')
  const [preferredTimes, setPreferredTimes] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showCalFallback, setShowCalFallback] = useState(false)

  const afterHours = params.get('afterhours') === '1'

  // Pre-fill from URL params (links from prospect emails / dashboard)
  useEffect(() => {
    const eName = params.get('name') || params.get('first') || ''
    const eEmail = params.get('email') || ''
    const eClinic = params.get('clinic') || ''
    const eRole = params.get('role') || ''
    if (eName) setName(decodeURIComponent(eName))
    if (eEmail) setEmail(decodeURIComponent(eEmail))
    if (eClinic) setClinic(decodeURIComponent(eClinic))
    if (eRole) setRole(decodeURIComponent(eRole))
    // After-hours flow: pre-fill the "when works" field with their evening
    // window so the form is one-tap-submit for clinicians who only have
    // post-clinic availability. They came in via the "Only free after 5pm?"
    // CTA on the prospect portal — they've already self-declared the need.
    if (params.get('afterhours') === '1') {
      setPreferredTimes('After 5pm AEST any weeknight, or anytime Saturday morning')
    }

    trackEvent('talk_page_view', {
      prospect_slug: params.get('slug') || undefined,
      utm_source: params.get('utm_source') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      after_hours: params.get('afterhours') === '1',
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setErr(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/talk-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          clinic: clinic.trim(),
          role: role.trim(),
          teamSize: teamSize ? parseInt(teamSize, 10) : null,
          preferredTimes: preferredTimes.trim(),
          message: message.trim(),
          prospectSlug: params.get('slug') || null,
          utmSource: params.get('utm_source') || null,
          utmCampaign: params.get('utm_campaign') || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      setIdentity(email)
      trackEvent('talk_request_submit', {
        team_size: teamSize || undefined,
        has_preferred_times: !!preferredTimes,
        prospect_slug: params.get('slug') || undefined,
      })
      setDone(true)
    } catch (e) {
      setErr((e as Error).message || 'Failed to send — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Got it.</h1>
          <p className="text-sm text-slate-600 mb-1">I&apos;ll be in touch within 24 hours to lock a time.</p>
          <p className="text-xs text-slate-500">Confirmation email is on its way to <strong>{email}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-14">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            15 minutes to walk through your team&apos;s concussion CPD
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto">
            Tell me a bit about your clinic and what you&apos;d like to cover — I&apos;ll reply
            personally within 24 hours with a time that works for both of us.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Your name" required>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="input" placeholder="Lauren Kidston" />
            </Field>
            <Field label="Email" required>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="lauren@advancedhealth.com.au" />
            </Field>
            <Field label="Clinic / organisation">
              <input type="text" value={clinic} onChange={(e) => setClinic(e.target.value)}
                className="input" placeholder="Advanced Health" />
            </Field>
            <Field label="Your role">
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                className="input" placeholder="Principal Physiotherapist" />
            </Field>
          </div>

          <Field label="How many clinicians on your team?">
            <input type="number" min={1} max={500} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
              className="input max-w-[200px]" placeholder="6" />
          </Field>

          <Field label="When works for you?" hint="A couple of windows is enough — e.g. 'Tue/Wed mornings, or after 5pm AEST'">
            <textarea rows={2} value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)}
              className="input" placeholder="Mornings before 9, or after 5pm AEST — any day next week" />
          </Field>

          <Field label="What would you like to walk through?" hint="Optional — anything specific I should prep">
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              className="input" placeholder="What's the rollout look like for a team of 6? Any AHPRA-specific gotchas? Group pricing?" />
          </Field>

          {err && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">{err}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold rounded-xl px-5 py-3.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send to Zac →'}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            Personal email — not an automated newsletter. Reply Zac sends comes from his own inbox.
          </p>
        </form>

        {/* Secondary option — Cal.com self-serve fallback */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setShowCalFallback((v) => !v)
              if (!showCalFallback) trackEvent('talk_cal_fallback_open', {})
            }}
            className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <Calendar className="w-3.5 h-3.5" />
            Prefer to pick a specific slot yourself?
          </button>
          {showCalFallback && (
            <div className="mt-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <iframe
                src="https://cal.com/zac-lewis-so8zjs/30min?embed=1&embedType=inline"
                title="Pick a time on Cal.com"
                className="w-full h-[650px] border-0"
                allow="camera; microphone; autoplay; fullscreen"
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          background: white;
          transition: border-color .15s, box-shadow .15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, .15);
        }
      `}</style>
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  )
}

export default function TalkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <TalkInner />
    </Suspense>
  )
}
