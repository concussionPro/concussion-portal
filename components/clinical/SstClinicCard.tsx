'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'
import { SstPatientQrCard } from '@/components/sst-trainer/SstPatientQrCard'
import { PmsConnect } from '@/components/clinical/PmsConnect'
import { SstTeamSection } from '@/components/clinical/SstTeamSection'
import {
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Send,
  Loader2,
  LayoutDashboard,
  Users,
  FileText,
} from 'lucide-react'

/**
 * The clinician's clinic-code panel — provision once, then code + patient
 * link + QR + email-invite + hub access. Shared by /clinical-testing and the
 * embedded instrument pages (flagship surface).
 */

interface Clinic {
  code: string
  clinicName: string
  viewKey: string
}

interface Usage {
  plan: 'trial' | 'active'
  patientCount: number
  cap: number | null
  canAddPatient: boolean
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        // clipboard.writeText REJECTS on a denied permission / non-secure
        // context. The unhandled rejection made the button do nothing at all,
        // silently — say so instead, the link is on screen to copy by hand.
        const fail = () => {
          setFailed(true)
          setTimeout(() => setFailed(false), 3000)
        }
        if (!navigator.clipboard?.writeText) return fail()
        void navigator.clipboard
          .writeText(text)
          .then(() => {
            setFailed(false)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          })
          .catch(fail)
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : failed ? 'Copy it by hand' : label}
    </button>
  )
}

export function SstClinicCard({
  /** Lifts the resolved clinic to the page — on first load AND the moment it is
   *  provisioned, so surfaces above this card (e.g. the clinic profile) stop
   *  needing a full reload to notice (2026-08-05 crawl #1). */
  onClinicResolved,
}: {
  onClinicResolved?: (clinic: Clinic | null) => void
} = {}) {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [clinicName, setClinicName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [qrVariant, setQrVariant] = useState<null | 'patient' | 'clinician'>(null)
  // patient invite
  const [patientEmail, setPatientEmail] = useState('')
  const [patientName, setPatientName] = useState('')
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')
  const [billingBusy, setBillingBusy] = useState(false)
  // ?subscribed=1 = back from Stripe checkout; the webhook may lag the
  // redirect by a few seconds — show an activating state instead of trial
  // CTAs, and refetch shortly (2026-08-05 sweep #11).
  const [justSubscribed, setJustSubscribed] = useState(false)
  // …but the wait must END. If the webhook never lands (or never will), the
  // "activating…" line used to sit there forever WITH the trial badge and the
  // subscribe CTA both suppressed — a clinic at its cap, freshly charged, with
  // no forward action on screen. After the last refetch we stop hiding them.
  const [activationStalled, setActivationStalled] = useState(false)

  // Truthful copy for the two states that legitimately have nothing to open:
  // a comped clinic (plan=active, no Stripe customer — the 25 alumni) and a
  // seated non-owner. Both used to flash "Opening…" then nothing, forever
  // (2026-08-05 crawl #4).
  const BILLING_COPY: Record<string, string> = {
    'no-customer': 'This clinic’s access is complimentary — there’s no subscription to manage.',
    'not-owner': 'Only the clinic owner can manage billing.',
    'no-clinic': 'Create your clinic code before managing billing.',
  }

  const openBillingPortal = async () => {
    if (billingBusy) return
    // DEMO00 has no session and no billing — leave the demo workspace exactly
    // as it was rather than surfacing a "Forbidden" to a prospect.
    if (clinic?.code === 'DEMO00') return
    setBillingBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sst/billing-portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.url) window.location.href = data.url
      else setError(BILLING_COPY[data?.code as string] || data?.error || 'Could not open billing portal.')
    } catch {
      setError('Could not open billing portal — check your connection and try again.')
    } finally {
      setBillingBusy(false)
    }
  }

  const onClinicResolvedRef = useRef(onClinicResolved)
  onClinicResolvedRef.current = onClinicResolved

  useEffect(() => {
    const load = () =>
      fetch('/api/clinical-testing/clinic', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          setClinic(d?.clinic ?? null)
          setUsage(d?.usage ?? null)
          onClinicResolvedRef.current?.(d?.clinic ?? null)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    void load()
    if (new URLSearchParams(window.location.search).get('subscribed') === '1') {
      setJustSubscribed(true)
      // webhook race: refetch twice while Stripe's event lands
      const t1 = setTimeout(load, 4000)
      const t2 = setTimeout(load, 12000)
      const t3 = setTimeout(() => setActivationStalled(true), 20000)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [])

  const create = useCallback(async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/clinical-testing/clinic', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName: clinicName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Something went wrong.')
      setClinic(data.clinic)
      onClinicResolvedRef.current?.(data.clinic ?? null)
      // The freshly provisioned clinic starts on the trial plan — reflect it
      // without waiting for a reload.
      void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.usage) setUsage(d.usage) })
        .catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }, [clinicName])

  const isDemoClinic = clinic?.code === 'DEMO00'

  const invite = useCallback(async () => {
    setInviteState('sending')
    setInviteError('')
    if (isDemoClinic) {
      setTimeout(() => { setInviteState('sent'); setPatientEmail(''); setTimeout(() => setInviteState('idle'), 2500) }, 500)
      return
    }
    try {
      const res = await fetch('/api/clinical-testing/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail: patientEmail.trim(), patientName: patientName.trim() || undefined }),
      })
      const data = await res.json()
      // The cap refusal carries the CURRENT usage — adopting it was skipped on
      // the error path, so a clinic whose patients joined by QR (not by invite)
      // kept seeing a stale "0 of 3 used" badge with no upgrade CTA while the
      // server refused every new patient (2026-08-06 census).
      if (data?.usage) setUsage(data.usage)
      if (!res.ok) throw new Error(data?.error || 'Send failed.')
      setInviteState('sent')
      setPatientEmail('')
      setTimeout(() => setInviteState('idle'), 2500)
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Send failed.')
      setInviteState('error')
    }
  }, [patientEmail, patientName, isDemoClinic])

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://portal.concussion-education-australia.com'
  const patientUrl = clinic ? `${origin}/j/${encodeURIComponent(clinic.code)}` : ''
  const hubUrl = clinic
    ? `/clinical-hub?clinic=${encodeURIComponent(clinic.code)}&k=${encodeURIComponent(clinic.viewKey)}`
    : ''
  const baselineUrl = clinic ? `${origin}/preseason/b/${encodeURIComponent(clinic.code)}` : ''

  if (!loaded) {
    return (
      <div className="glass-premium rounded-2xl p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Loading your clinic…</p>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="glass-premium rounded-2xl p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
          One-time setup
        </p>
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
          Create your clinic code
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 max-w-xl">
          One 6-character code links patients to you across both tools: SST Trainer sessions sync to
          your Clinical Hub, and the same code runs your pre-season baseline link. Takes one field.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Clinic or practice name"
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void create()}
            disabled={creating || clinicName.trim().length < 2}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {creating ? 'Setting up…' : 'Create my code'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="glass-premium rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
            {clinic.clinicName}
          </p>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Your clinic code</h2>
          <p className="mt-1 font-mono text-[34px] font-extrabold tracking-[0.3em] text-accent leading-none">
            {clinic.code}
          </p>
          {usage?.plan === 'trial' && usage.cap != null && (!justSubscribed || activationStalled) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Free trial · {usage.patientCount} of {usage.cap} patients used
              </span>
              {/* Never offer a SECOND checkout to someone who just paid and is
                  waiting on the webhook — /api/sst/subscribe only 409s once the
                  plan actually flips, so this button is the double-bill path
                  while activation is stalled. They get the manual route instead. */}
              {!usage.canAddPatient && !justSubscribed && (
                <Link href="/clinical-testing/subscribe" className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white hover:bg-accent/90">
                  Subscribe to add more →
                </Link>
              )}
            </div>
          )}
          {usage?.plan === 'active' && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {usage.cap == null
                  ? 'Subscribed · unlimited patients'
                  : `Subscribed · ${usage.patientCount} of ${usage.cap} new patients this month`}
              </span>
              {/* DEMO00 has no session and no billing: openBillingPortal returns
                  immediately for it, so these rendered as buttons that did
                  literally nothing on click for every prospect on the tour.
                  Don't render a control that can't act. */}
              {!isDemoClinic && usage.cap != null && !usage.canAddPatient && (
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={billingBusy}
                  className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {billingBusy ? 'Opening…' : 'Plan full — upgrade →'}
                </button>
              )}
              {!isDemoClinic && (
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={billingBusy}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {billingBusy ? 'Opening…' : 'Manage billing'}
                </button>
              )}
            </div>
          )}
          {justSubscribed && usage?.plan === 'trial' && (
            activationStalled ? (
              <p className="mt-2 max-w-md text-[11.5px] font-semibold leading-snug text-amber-800">
                Your payment went through but this clinic still shows the trial plan. Reload in a
                minute — if it still hasn’t switched, email {CONFIG.CONTACT_EMAIL} with your clinic
                code and we’ll activate it by hand. Don’t pay again.
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                Payment received — activating your plan… this updates within a minute.
              </p>
            )
          )}
          {/* Billing / plan errors were only rendered in the PRE-provisioning
              branch, so every failure from "Manage billing" and "Plan full —
              upgrade" was invisible (2026-08-05 crawl #4). */}
          {error && (
            <p className="mt-2 max-w-md text-[11.5px] font-semibold leading-snug text-amber-800">{error}</p>
          )}
          <SstTeamSection demo={isDemoClinic} />
        </div>
        {/* No `flex-none`: it pinned this row to the max-content width of
            Patients + Live hub + Documents on one line, which is wider than a
            375px screen, so the whole workspace scrolled sideways. The row
            already wraps internally — let it shrink and wrap. */}
        <div className="flex flex-wrap gap-2">
          {!isDemoClinic && (
            <Link
              href="/clinical-testing/patients"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Patients
            </Link>
          )}
          <Link
            href={hubUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Live hub
          </Link>
          {!isDemoClinic && (
            <Link
              href="/clinical-testing/documents"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Documents
            </Link>
          )}
        </div>
      </div>

      <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
        Patients open the link below, enter their name, and every graded test and training session
        lands in your hub. The same code runs your baseline link for clubs.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="max-w-full truncate rounded-lg bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
          {patientUrl}
        </code>
        <CopyButton text={patientUrl} label="Copy patient link" />
        {/* The PATIENT card is the one clinicians hand out — it carries the
            code only. The clinician card additionally prints the clinic's
            private hub key, so it is a separate, explicitly-labelled action
            (2026-08-05: the only printable card was the keyed one, beside a
            warning to print a patient version that had no button). */}
        <button
          type="button"
          onClick={() => setQrVariant('patient')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" /> Patient QR card
        </button>
        <button
          type="button"
          onClick={() => setQrVariant('clinician')}
          title="Includes your private hub key — for your own records, not for patients"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" /> Clinician card (has your key)
        </button>
        <CopyButton text={clinic.code} label="Copy code" />
      </div>

      {/* iPhone patients — native path. Store link once live; TestFlight
          public link as the pre-store bridge; nothing when neither exists
          (the web link works everywhere, manual HR entry on iPhone). */}
      {/* Patient devices — every load path, per platform. Prescription-only
          framing throughout: patients get in with YOUR code, no other door. */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          Getting the trainer onto patient devices
        </p>
        <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0 text-[12.5px] leading-relaxed text-slate-600">
          <li>
            <strong className="text-slate-800">iPhone:</strong>{' '}
            {CONFIG.FEATURES.SST_IOS_APP_LIVE ? (
              <>the{' '}
                <a href={CONFIG.SST_APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline">App Store app</a>{' '}
                — pairs Bluetooth HR live (iPhone browsers can&rsquo;t), then your clinic code.</>
            ) : (
              <>the{' '}
                <a href={CONFIG.SST_TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline">TestFlight beta</a>{' '}
                (via Apple&rsquo;s free TestFlight app) — pairs Bluetooth HR live, then your clinic code. App Store release in review; your QR and patient link route iPhones here automatically.</>
            )}
          </li>
          <li>
            <strong className="text-slate-800">Android:</strong> no install needed — your patient link
            opens in Chrome with live HR pairing, and Chrome&rsquo;s menu offers &ldquo;Install app&rdquo;
            to put it on their home screen.
          </li>
          <li>
            <strong className="text-slate-800">Desktop / laptop:</strong> the same patient link in
            Chrome or Edge — live pairing works there too (treadmill + laptop setups).
          </li>
          <li>
            <strong className="text-slate-800">Wearables:</strong> live pairing with anything that
            broadcasts heart rate (Garmin, Polar, Wahoo, chest straps). Apple Watch and Fitbit
            don&rsquo;t broadcast — those patients type each reading, which the flow supports.
          </li>
        </ul>
        <p className="m-0 mt-1.5 text-[11.5px] text-slate-400">
          Access is by your clinic code only — patients can&rsquo;t use the trainer without your
          prescription.
        </p>
      </div>

      {/* PMS plugin — connect the clinic's own Gensolve/Cliniko tenant */}
      {clinic && <PmsConnect code={clinic.code} viewKey={clinic.viewKey} demo={isDemoClinic} />}

      {/* email the link straight to a patient */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-foreground mb-2">Email the app link to a patient</p>
        <div className="flex flex-wrap gap-2">
          {/* The name was WIRED (state + payload) but had no input, so it was
              always blank. Two consequences: every invite opened "Hi," and —
              the real one — the server's re-send exemption for an EXISTING
              patient requires the name, so at the cap a clinic could not
              re-send the link to a patient it was already treating, despite
              the refusal promising "your existing patients keep working"
              (2026-08-06 census). */}
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient name (as in your hub)"
            className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <input
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            placeholder="patient@email.com"
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void invite()}
            disabled={inviteState === 'sending' || !patientEmail.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {inviteState === 'sending' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : inviteState === 'sent' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {inviteState === 'sending' ? 'Sending…' : inviteState === 'sent' ? 'Sent' : 'Send invite'}
          </button>
        </div>
        {inviteState === 'error' && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            {inviteError}
            {/* The refusal text NAMES the next step ("Subscribe", "Manage
                billing") but shipped as flat prose with nothing to click. */}
            {usage?.canAddPatient === false &&
              (usage.plan === 'active' ? (
                !isDemoClinic && (
                  <button
                    type="button"
                    onClick={openBillingPortal}
                    disabled={billingBusy}
                    className="ml-1.5 underline underline-offset-2 disabled:opacity-50"
                  >
                    {billingBusy ? 'Opening…' : 'Open billing →'}
                  </button>
                )
              ) : (
                <Link href="/clinical-testing/subscribe" className="ml-1.5 underline underline-offset-2">
                  Subscribe →
                </Link>
              ))}
          </p>
        )}
      </div>

      {/* baseline link — same code, second tool */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold text-foreground mb-2">
          Pre-season baseline link (for clubs &amp; teams)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-lg bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
            {baselineUrl}
          </code>
          <CopyButton text={baselineUrl} label="Copy baseline link" />
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          Athletes self-complete the SCAT6 baseline in ~5 minutes; each report is emailed to your
          clinic and stored for repeat-test comparison.
        </p>
      </div>

      {/* Clinician-facing data transparency — you are the custodian of your
          patients' data; this is what the tool collects and where it goes. */}
      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11.5px] leading-relaxed text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">How patient data is handled</summary>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4">
          <li><strong>What&rsquo;s collected:</strong> the patient&rsquo;s name (so you can identify them), their heart rate during sessions, symptom ratings, and the graded-test / training results.</li>
          <li><strong>Where it goes:</strong> straight to your clinic, keyed to your code. It&rsquo;s stored in an Australian-region database and appears only in <em>your</em> hub — reachable only with your private view key, never by other clinics or by patients.</li>
          <li><strong>Your patients&rsquo; consent:</strong> at sign-up each patient is told their name and results go to their clinician, and is offered a separate, optional opt-in for CEA to use their data — with the name removed — to improve the service. Declining doesn&rsquo;t affect their care.</li>
          <li><strong>Your role:</strong> you are the treating clinician and the custodian of your patients&rsquo; records. The tool is decision-support you oversee — not a diagnosis or clearance.</li>
        </ul>
        <p className="mt-2 m-0">Full patient privacy policy: <a href="/sst-privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline">/sst-privacy</a>.</p>
      </details>

      {qrVariant && (
        <SstPatientQrCard
          clinicName={clinic.clinicName}
          code={clinic.code}
          viewKey={clinic.viewKey}
          variant={qrVariant}
          onClose={() => setQrVariant(null)}
        />
      )}
    </div>
  )
}
