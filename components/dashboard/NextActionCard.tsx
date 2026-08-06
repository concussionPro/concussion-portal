'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import { useCourseTier } from './useCourseTier'
import { getModulesMeta, getSCATModulesMeta } from '@/data/module-meta'
import { epDisplayId, epProgressId, epModulesMeta } from '@/data/ep-module-meta'
import { ArrowRight, Clock, Award, CheckCircle2, TrendingUp, Sparkles, Download, Mail, MapPin, Loader2, Lock, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CONFIG, upgradePriceFor } from '@/lib/config'
import { COURSES, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'
import { trackEvent } from '@/lib/analytics'

// Short-course cross-sell for completers — sourced from the catalogue (single
// source of truth for price + CPD hours) so this copy can never drift from checkout.
const CROSS_SELL_COURSES = ['ai-in-clinical-practice', 'vagus-nerve']
  .map(id => COURSES.find(c => c.id === id))
  .filter((c): c is NonNullable<typeof c> => !!c)

// Ready-to-Train waiting-pool NOMINATION selector — all cities stay listed,
// including ones whose last round has already run (a completed city simply
// starts collecting demand for its next round). The surrounding copy must
// frame this as a nomination, never as a scheduled date.
const POOL_CITIES = Object.values(CONFIG.LOCATIONS).map(loc => ({
  value: loc.slug,
  label: loc.city,
}))

export function NextActionCard() {
  const router = useRouter()
  const { getTotalCompletedModules, isModuleComplete } = useProgress()
  const { user } = useSession()

  const accessLevel = user?.accessLevel || ''
  const userEmail = user?.email || ''
  // A CRM buyer is access_level 'preview' but a paying EP customer — this card
  // drives module targets AND the certificate type, so classifying them as free
  // pointed them at SCAT modules and would have issued a SCAT certificate.
  // Their own stream lives at /ep-course with its own card, so this CCM/SCAT
  // card simply does not apply to them.
  const { isFreeTier, ownsCrm } = useCourseTier(accessLevel)
  const isPreview = isFreeTier
  const paidModules = getModulesMeta()
  const scatModules = getSCATModulesMeta()
  const modules = isPreview ? scatModules : paidModules
  const completedModules = isPreview
    ? scatModules.filter(m => isModuleComplete(m.id)).length
    : getTotalCompletedModules()
  const totalModules = isPreview ? 3 : 8

  const nextModule = modules.find((m) => !isModuleComplete(m.id))
  const progressPercentage = Math.round((completedModules / totalModules) * 100)

  // Certificate state
  const [certificateStatus, setCertificateStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [certificateDownloading, setCertificateDownloading] = useState(false)
  /** The server's OWN reason a certificate could not be issued (which module to
   *  retake, etc.) — kept separate from the email status so a failed download
   *  never renders the "email failed, download it instead" line. */
  const [certificateError, setCertificateError] = useState<string | null>(null)
  const certTriggered = useRef(false)

  // Pool CTA state
  const [selectedCity, setSelectedCity] = useState('')
  const [poolSubmitting, setPoolSubmitting] = useState(false)
  const [poolResult, setPoolResult] = useState<{ success: boolean; message: string } | null>(null)

  const allComplete = !nextModule


  // Auto-trigger certificate email when all modules complete.
  //
  // Dedupe is SERVER-SIDE: POST /api/certificate is idempotent — it inserts an
  // email_audit_log key (certificate_email_<type>_<userId>) with ON CONFLICT DO
  // NOTHING and skips the send when the key already exists, returning
  // { success: true, emailSent: false }. The localStorage flag below is only a
  // per-device fast-path to avoid the network call; a second device may still
  // fire the POST, but the server will never double-send the email.
  useEffect(() => {
    if (allComplete && accessLevel && userEmail && !certTriggered.current) {
      certTriggered.current = true
      // All paid users get online-course cert (8 CPD). In-person cert issued manually by instructor.
      const certType = isPreview ? 'scat-mastery' : 'online-course'
      const sentKey = `cert-sent-${certType}-${userEmail}`
      if (typeof window !== 'undefined' && localStorage.getItem(sentKey)) return
      setCertificateStatus('sending')
      fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: certType }),
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCertificateStatus('sent')
            if (typeof window !== 'undefined') localStorage.setItem(sentKey, '1')
            // Only fire analytics when the server actually sent the email this
            // time (emailSent=false means it was already emailed previously —
            // don't double-count course_complete from a second device).
            if (data.emailSent) {
              trackEvent('course_complete', { courseType: certType, accessLevel, modules: totalModules })
            }
          } else {
            setCertificateStatus('error')
          }
        })
        .catch(() => setCertificateStatus('error'))
    }
  }, [allComplete, accessLevel, userEmail])

  const handleDownloadCertificate = async () => {
    setCertificateDownloading(true)
    setCertificateError(null)
    try {
      const certType = isPreview ? 'scat-mastery' : 'online-course'
      const res = await fetch(`/api/certificate?type=${certType}`, { credentials: 'include' })
      if (!res.ok) {
        // Surface the SERVER's reason. This used to throw a generic error and
        // set certificateStatus='error', which renders "Certificate email
        // failed — you can still download it below" — i.e. a failed DOWNLOAD
        // told the clinician to download it. The certificate route re-verifies
        // every quiz from the saved answers and names the module to retake;
        // discarding that left a dead-end button under a green banner.
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Download failed. Please try again.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CPD-Certificate-${certType}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setCertificateError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setCertificateDownloading(false)
    }
  }

  const handleResendCertificate = async () => {
    setCertificateStatus('sending')
    setCertificateError(null)
    try {
      const certType = isPreview ? 'scat-mastery' : 'online-course'
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: certType }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      setCertificateStatus(data?.success ? 'sent' : 'error')
      if (!data?.success && data?.error) setCertificateError(data.error)
    } catch {
      setCertificateStatus('error')
    }
  }

  const handlePoolSubmit = async () => {
    if (!selectedCity) return
    setPoolSubmitting(true)
    setPoolResult(null)

    try {
      const res = await fetch('/api/ready-to-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ city: selectedCity }),
      })
      const data = await res.json()
      setPoolResult({
        success: res.ok,
        message: data.message || data.error || 'Something went wrong.',
      })
      if (res.ok) trackEvent('workshop_pool_join', { city: selectedCity })
    } catch {
      setPoolResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setPoolSubmitting(false)
    }
  }

  // CRM-only buyers have their own stream dashboard (/ep-course/dashboard).
  // This card speaks CCM/SCAT — modules, progress, certificate type — so the
  // CCM body must not render for them. Returning null left their /dashboard
  // with NO continue affordance at all, so render the CRM equivalent instead
  // (2026-08-05 CRM/CCM parity audit).
  if (ownsCrm && accessLevel !== 'online-only' && accessLevel !== 'full-course') {
    const CRM_IDS = epModulesMeta.map((m) => epProgressId(m.id))
    const crmDone = CRM_IDS.filter((id) => isModuleComplete(id)).length
    const nextCrm = CRM_IDS.find((id) => !isModuleComplete(id))
    const crmComplete = crmDone === CRM_IDS.length
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-accent/20 relative overflow-hidden"
      >
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Concussion Rehab Mastery
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              {crmComplete ? 'All modules complete' : crmDone === 0 ? 'Start your first module' : 'Pick up where you left off'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {crmComplete
                ? 'Claim your ESSA CPD certificate from your course dashboard.'
                : `${crmDone} of ${CRM_IDS.length} modules complete.`}
            </p>
            <Link
              href={crmComplete || !nextCrm ? '/ep-course/dashboard' : `/ep-course/modules/${epDisplayId(nextCrm)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
            >
              {crmComplete ? 'Go to your certificate' : 'Continue the course'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  /* ── All Complete ───────────────────────────── */
  if (allComplete) {
    const showPoolCTA = accessLevel === 'online-only'
    const certType = isPreview ? 'scat-mastery' : 'online-course'

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-accent/20 relative overflow-hidden"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  All Complete
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                {isPreview
                  ? "You've Mastered All 3 SCAT Modules"
                  : "You've Mastered All 8 Online Modules"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {isPreview
                  ? `Outstanding achievement — you've completed the SCAT6 Mastery course. Upgrade to unlock ${CONFIG.COURSE.TOTAL_MODULES} modules covering VOMS, BESS & return-to-play, plus the Clinical Toolkit — up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD hours.`
                  : accessLevel === 'online-only'
                  ? `Outstanding achievement — you've earned all ${CONFIG.COURSE.ONLINE_CPD_POINTS} online AHPRA-aligned CPD hours. Download your certificate below, or add the workshop for ${CONFIG.COURSE.TOTAL_CPD_POINTS} total.`
                  : `Outstanding achievement — you've earned all ${CONFIG.COURSE.ONLINE_CPD_POINTS} online AHPRA-aligned CPD hours. Complete the ${CONFIG.COURSE.IN_PERSON_CPD_POINTS}-hour in-person practical to earn your full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hour certificate.`}
              </p>

              {/* Certificate Section */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">
                    {isPreview ? 'Certificate of Completion' : `CPD Certificate (${CONFIG.COURSE.ONLINE_CPD_POINTS} points)`}
                  </span>
                </div>
                {certificateStatus === 'sending' && (
                  <p className="text-xs text-emerald-700 mb-3 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating and emailing your certificate...
                  </p>
                )}
                {certificateStatus === 'sent' && (
                  <p className="text-xs text-emerald-700 mb-3">
                    Certificate emailed to <span className="font-semibold">{userEmail}</span>
                  </p>
                )}
                {certificateStatus === 'error' && (
                  <p className="text-xs text-red-600 mb-3">
                    Certificate email failed — you can still download it below.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={certificateDownloading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {certificateDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Download Certificate
                  </button>
                  <button
                    onClick={handleResendCertificate}
                    disabled={certificateStatus === 'sending'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Certificate
                  </button>
                </div>
                {certificateError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                    <p className="text-xs text-red-700">{certificateError}</p>
                  </div>
                )}
              </div>

              {isPreview && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <p className="text-sm text-purple-800 font-medium mb-2">Ready to master VOMS, BESS testing &amp; return-to-play protocols? Earn up to {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD hours with the full course.</p>
                  <button
                    onClick={() => { trackEvent('upgrade_cta_click', { source: 'completion_card', from: 'preview' }); router.push('/pricing') }}
                    className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    View Full Course &rarr;
                  </button>
                </div>
              )}

              {accessLevel === 'online-only' && (() => {
                // Early-bird upgrade price (no city context here — the /upgrade
                // page prices per-city; pre-launch every city is early-bird)
                const price = upgradePriceFor()
                return (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                    <p className="text-sm text-blue-900 font-bold mb-1">Add the hands-on workshop — ${price} AUD</p>
                    <p className="text-xs text-blue-700 mb-3">Earn {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD hours with supervised SCAT6, VOMS &amp; BESS practice.</p>
                    <button
                      onClick={() => { trackEvent('upgrade_cta_click', { source: 'completion_card', from: 'online-only' }); router.push('/upgrade') }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      Upgrade to Workshop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[11px] text-blue-600 font-medium mt-2">
                      Lifetime access included
                    </p>
                  </div>
                )
              })()}

              {/* More CPD from CEA — completers see a next step */}
              {CROSS_SELL_COURSES.length > 0 && (
                <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-50 to-teal-50/40 p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-teal-700" strokeWidth={1.8} />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">More CPD from CEA</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CROSS_SELL_COURSES.map(c => (
                      <Link
                        key={c.id}
                        href={c.route}
                        onClick={() => trackEvent('cross_sell_click', { courseId: c.id, source: 'completion_card', accessLevel })}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white/70 px-3.5 py-2.5 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-foreground leading-tight truncate">{c.title}</span>
                          <span className="block text-[11px] text-muted-foreground leading-tight">
                            {c.cpdHours} CPD {c.cpdHours === 1 ? 'hr' : 'hrs'}{getEffectivePrice(c).price !== null && <> · A${getEffectivePrice(c).price!.toLocaleString('en-AU')}</>}
                          </span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600/60 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/learning')}
                  className="action-pill"
                >
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Review Modules
                </button>
                {isPreview ? (
                  <button
                    onClick={() => { trackEvent('upgrade_cta_click', { source: 'completion_primary', from: 'preview' }); router.push('/pricing') }}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 transition-all flex items-center gap-2"
                  >
                    Unlock all {CONFIG.COURSE.TOTAL_MODULES} modules · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hrs (up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the workshop)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : accessLevel !== 'online-only' ? (
                  <button
                    onClick={() => router.push('/in-person')}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 transition-all"
                  >
                    Book Workshop
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pool CTA — only for online-only users */}
        {showPoolCTA && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-blue-200 relative overflow-hidden"
          >
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 tracking-tight">
                  Ready for Hands-On Training?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Join the waiting pool for your nearest city. We run workshops as demand opens up in each city — we&apos;ll send booking details when the next date is confirmed.
                </p>

                {poolResult?.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800 font-medium">{poolResult.message}</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <label htmlFor="pool-city" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                        Your City
                      </label>
                      <select
                        id="pool-city"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-blue-400 transition-colors"
                      >
                        <option value="">Select a city...</option>
                        {POOL_CITIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handlePoolSubmit}
                      disabled={!selectedCity || poolSubmitting}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {poolSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join the Waiting Pool'
                      )}
                    </button>
                  </div>
                )}

                {poolResult && !poolResult.success && (
                  <p className="text-sm text-red-600 mt-2">{poolResult.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </>
    )
  }

  /* ── Next Module ────────────────────────────── */

  // Workshop upgrade nudge for online-only users at 25/50/75% milestones
  const showWorkshopNudge = accessLevel === 'online-only' && progressPercentage >= 25
  const workshopNudge = (() => {
    if (!showWorkshopNudge) return null
    const price = upgradePriceFor()
    const milestone = progressPercentage >= 75 ? 75 : progressPercentage >= 50 ? 50 : 25
    const message = milestone >= 75
      ? "You're nearly done — lock in hands-on skills while the theory is fresh."
      : milestone >= 50
      ? 'Halfway through the theory. The workshop turns this knowledge into clinical confidence.'
      : 'Great start. Add the workshop to practise SCAT6, VOMS & BESS with expert feedback.'
    return { price, message, milestone }
  })()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-premium rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 border border-accent/10 relative overflow-hidden group hover:border-accent/20 transition-colors"
      >
        {/* Subtle accent gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex items-start gap-4 sm:gap-5">
          {/* Module number badge */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/15">
            <span className="text-xl sm:text-2xl font-bold text-white">
              {isPreview ? nextModule.id - 100 : nextModule.id}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Your Next Step
              </span>
            </div>

            {/* Title & description */}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight">
              {nextModule.title}
            </h2>
            <p className="text-sm text-accent font-semibold mb-1.5">{nextModule.subtitle}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {nextModule.description}
            </p>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="action-pill text-xs py-1 px-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {nextModule.duration}
              </span>
              <span className="action-pill text-xs py-1 px-3">
                <Award className="w-3.5 h-3.5 text-accent" />
                {nextModule.points} CPD {nextModule.points === 1 ? 'Point' : 'Points'}
              </span>
              <span className="action-pill text-xs py-1 px-3">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                {progressPercentage}% Complete
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/modules/${nextModule.id}`)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 hover:bg-accent-dark transition-all flex items-center gap-2 group/btn"
            >
              {completedModules === 0
                ? `Begin Module ${isPreview ? nextModule.id - 100 : nextModule.id}`
                : `Continue Module ${isPreview ? nextModule.id - 100 : nextModule.id}`}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="relative z-10 mt-5 pt-4 border-t border-border/30">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="font-medium text-muted-foreground">{isPreview ? 'SCAT Course Progress' : 'Course Progress'}</span>
            <span className="font-semibold text-accent">
              {completedModules} / {totalModules} modules ({progressPercentage}%)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Workshop upgrade nudge — online-only users at 25/50/75% */}
      {workshopNudge && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="glass-premium rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 mb-0.5">
                Add the hands-on workshop — ${workshopNudge.price} AUD
              </p>
              <p className="text-xs text-slate-600 mb-3">
                {workshopNudge.message}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { trackEvent('upgrade_cta_click', { source: `milestone_${workshopNudge.milestone}`, from: 'online-only' }); router.push('/upgrade') }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Workshop
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-blue-600 font-medium">
                  Lifetime access included
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
