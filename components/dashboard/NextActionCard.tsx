'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { useSession } from '@/contexts/SessionContext'
import { getModulesMeta, getSCATModulesMeta } from '@/data/module-meta'
import { ArrowRight, Clock, Award, CheckCircle2, TrendingUp, Sparkles, Download, Mail, MapPin, Loader2, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { CONFIG } from '@/lib/config'

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
  const isPreview = accessLevel === 'preview'
  const paidModules = getModulesMeta()
  const scatModules = getSCATModulesMeta()
  const modules = isPreview ? scatModules : paidModules
  const completedModules = isPreview
    ? scatModules.filter(m => isModuleComplete(m.id)).length
    : getTotalCompletedModules()
  const totalModules = isPreview ? 6 : 8

  const nextModule = modules.find((m) => !isModuleComplete(m.id))
  const progressPercentage = Math.round((completedModules / totalModules) * 100)

  // Certificate state
  const [certificateStatus, setCertificateStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [certificateDownloading, setCertificateDownloading] = useState(false)
  const certTriggered = useRef(false)

  // Pool CTA state
  const [selectedCity, setSelectedCity] = useState('')
  const [poolSubmitting, setPoolSubmitting] = useState(false)
  const [poolResult, setPoolResult] = useState<{ success: boolean; message: string } | null>(null)

  const allComplete = !nextModule


  // Auto-trigger certificate email when all modules complete
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
          } else {
            setCertificateStatus('error')
          }
        })
        .catch(() => setCertificateStatus('error'))
    }
  }, [allComplete, accessLevel, userEmail])

  const handleDownloadCertificate = async () => {
    setCertificateDownloading(true)
    try {
      const certType = isPreview ? 'scat-mastery' : 'online-course'
      const res = await fetch(`/api/certificate?type=${certType}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CPD-Certificate-${certType}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      setCertificateStatus('error')
    } finally {
      setCertificateDownloading(false)
    }
  }

  const handleResendCertificate = async () => {
    setCertificateStatus('sending')
    try {
      const certType = isPreview ? 'scat-mastery' : 'online-course'
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: certType }),
        credentials: 'include',
      })
      const data = await res.json()
      setCertificateStatus(data.success ? 'sent' : 'error')
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
    } catch {
      setPoolResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setPoolSubmitting(false)
    }
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
                  ? "You've Mastered All 6 SCAT Modules"
                  : "You've Mastered All 8 Online Modules"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {isPreview
                  ? `Outstanding achievement — you've earned 2 free AHPRA CPD points. Upgrade to unlock ${CONFIG.COURSE.TOTAL_MODULES} modules covering VOMS, BESS & return-to-play, plus the Clinical Toolkit — up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD points.`
                  : accessLevel === 'online-only'
                  ? `Outstanding achievement — you've earned all ${CONFIG.COURSE.ONLINE_CPD_POINTS} online AHPRA CPD points. Download your certificate below, or add the workshop for ${CONFIG.COURSE.TOTAL_CPD_POINTS} total.`
                  : `Outstanding achievement — you've earned all ${CONFIG.COURSE.ONLINE_CPD_POINTS} online AHPRA CPD points. Complete the ${CONFIG.COURSE.IN_PERSON_CPD_POINTS}-hour in-person practical to earn your full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD point certificate.`}
              </p>

              {/* Certificate Section */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">
                    {isPreview ? 'Free CPD Certificate (2 points)' : 'CPD Certificate'}
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
              </div>

              {isPreview && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <p className="text-sm text-purple-800 font-medium mb-2">Ready to master VOMS, BESS testing &amp; return-to-play protocols? Earn up to {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD points with the full course.</p>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    View Full Course &rarr;
                  </button>
                </div>
              )}

              {accessLevel === 'online-only' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-blue-800 font-medium mb-2">You&apos;ve earned {CONFIG.COURSE.ONLINE_CPD_POINTS} online CPD points. Add the 6-hour workshop for {CONFIG.COURSE.TOTAL_CPD_POINTS} total.</p>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Add Workshop &rarr;
                  </button>
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
                    onClick={() => router.push('/pricing')}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 transition-all flex items-center gap-2"
                  >
                    Upgrade — Unlock 14 CPD Points
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
                  Join the waiting pool for your nearest city. Once 8+ clinicians are ready, we&apos;ll lock in a workshop date and send you booking details.
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
  return (
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
  )
}
