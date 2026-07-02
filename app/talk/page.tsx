'use client'

/**
 * /talk — the after-hours conversion step for prospect-portal traffic.
 *
 * NO Cal.com iframe here: inline Cal/Stripe/YouTube embeds silently fail
 * via X-Frame-Options (killed live B2B conversion 2026-06-08). Booking is
 * a direct new-tab link, same pattern as the prospect dashboard CTAs.
 *
 * Primary: big "Book a 15-min call" button (new tab to Cal).
 * Secondary: the after-hours request form — the portal's "Only free after
 * 5pm?" CTA lands here pre-filled, and submissions feed /api/talk-request
 * → talk_requests, which the engagement engine treats as a terminal
 * "contact confirmed" signal. Tertiary: direct email fallback.
 */
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight, Brain, CheckCircle2, Loader2, Mail, Moon } from 'lucide-react'
import { trackEvent, setIdentity } from '@/lib/analytics'

const ZAC_EMAIL = 'zac@concussion-education-australia.com'

function TalkInner() {
  const params = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [clinic, setClinic] = useState('')
  const [preferredTimes, setPreferredTimes] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const slug = params.get('slug') || ''
  const afterHours = params.get('afterhours') === '1'
  const calUrl = `https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=talk_page&utm_campaign=talk_booking${slug ? `&utm_content=${encodeURIComponent(slug)}` : ''}`

  // Pre-fill from URL params (links from prospect emails / dashboard)
  useEffect(() => {
    const eName = params.get('name') || params.get('first') || ''
    const eEmail = params.get('email') || ''
    const eClinic = params.get('clinic') || ''
    if (eName) setName(decodeURIComponent(eName))
    if (eEmail) setEmail(decodeURIComponent(eEmail))
    if (eClinic) setClinic(decodeURIComponent(eClinic))
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
          role: '',
          teamSize: null,
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
      <div className="min-h-screen dashboard-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Got it.</h1>
          <p className="text-sm text-muted-foreground mb-1">
            I&apos;ll be in touch within 24 hours to lock a time.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Confirmation email is on its way to <strong className="text-foreground">{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dashboard-bg">
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-4 shadow-md shadow-accent/15">
            <Brain className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-2">
            Concussion Education Australia
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Talk it through with Zac
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            15 minutes on how the program fits your clinic — no contract, no slides.
          </p>
        </div>

        {/* Primary CTA — Cal.com in a NEW TAB (never an iframe) */}
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-track-cta="talk-book-cal"
          onClick={() => trackEvent('talk_cal_open', { prospect_slug: slug || undefined })}
          className="block rounded-2xl mb-6 relative overflow-hidden bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg group hover:shadow-xl transition-shadow"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
          <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90 mb-1">
                15 minutes · pick any slot
              </p>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">Book a 15-min call</h2>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 text-sm font-bold bg-white text-accent px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
              Open calendar
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </a>

        {/* After-hours request — the form the portal CTA promises */}
        <form onSubmit={handleSubmit} className="glass-premium rounded-2xl p-6 md:p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-accent" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">
                {afterHours ? 'Only free after 5pm?' : 'None of the calendar slots work?'}
              </p>
              <p className="text-xs text-muted-foreground">
                Send your window — I&apos;ll come back same-day with a time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Your name" required>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="input" placeholder="Lauren Kidston" />
            </Field>
            <Field label="Email" required>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="lauren@advancedhealth.com.au" />
            </Field>
          </div>

          <Field label="Clinic / organisation">
            <input type="text" value={clinic} onChange={(e) => setClinic(e.target.value)}
              className="input" placeholder="Your clinic name" />
          </Field>

          <Field label="When works for you?" hint="A couple of windows is enough — e.g. 'Tue/Wed mornings, or after 5pm AEST'">
            <textarea rows={2} value={preferredTimes} onChange={(e) => setPreferredTimes(e.target.value)}
              className="input" placeholder="Mornings before 9, or after 5pm AEST — any day next week" />
          </Field>

          <Field label="Anything I should prep?" hint="Optional">
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
              className="input" placeholder="Team mix, scope, group pricing — anything specific" />
          </Field>

          {err && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">{err}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-accent hover:opacity-90 text-white font-semibold rounded-xl px-5 py-3.5 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Request a time →'}
          </button>

          <p className="text-[11px] text-center text-muted-foreground">
            Personal email — not an automated newsletter. The reply comes from Zac&apos;s own inbox.
          </p>
        </form>

        {/* Email fallback */}
        <div className="mt-6 text-center">
          <a
            href={`mailto:${ZAC_EMAIL}?subject=${encodeURIComponent('Concussion training — quick question')}`}
            data-track-cta="talk-email-zac"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Or just email {ZAC_EMAIL}
          </a>
        </div>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          background: rgba(255, 255, 255, 0.85);
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
      <span className="block text-xs font-semibold text-foreground/80 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  )
}

export default function TalkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen dashboard-bg flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
      <TalkInner />
    </Suspense>
  )
}
