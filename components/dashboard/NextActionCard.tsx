'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { getModulesMeta } from '@/data/module-meta'
import { ArrowRight, Clock, Award, CheckCircle2, TrendingUp, Sparkles, Download, Mail, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function NextActionCard() {
  const router = useRouter()
  const { getTotalCompletedModules, isModuleComplete } = useProgress()
  const modules = getModulesMeta()
  const completedModules = getTotalCompletedModules()

  const nextModule = modules.find((m) => !isModuleComplete(m.id))
  const progressPercentage = Math.round((completedModules / 8) * 100)

  // Certificate state
  const [certificateStatus, setCertificateStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [certificateDownloading, setCertificateDownloading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState('')
  const certTriggered = useRef(false)

  const allComplete = !nextModule

  // Fetch session on mount to get email + accessLevel
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserEmail(data.user.email || '')
          setAccessLevel(data.user.accessLevel || '')
        }
      })
      .catch(() => {})
  }, [])

  // Auto-trigger certificate email when all modules complete
  useEffect(() => {
    if (allComplete && accessLevel && !certTriggered.current) {
      certTriggered.current = true
      const certType = accessLevel === 'full-course' ? 'full-course' : 'online-course'
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
      const certType = accessLevel === 'full-course' ? 'full-course' : 'online-course'
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
      const certType = accessLevel === 'full-course' ? 'full-course' : 'online-course'
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

  /* ── All Complete ───────────────────────────── */
  if (allComplete) {
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
                All Complete
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
              You&apos;ve Mastered All 8 Online Modules
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Outstanding achievement — you&apos;ve earned all 8 online AHPRA CPD points. Complete the 6-hour in-person practical to earn your full 14 CPD point certificate.
            </p>

            {/* Certificate Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">CPD Certificate</span>
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

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/learning')}
                className="action-pill"
              >
                <TrendingUp className="w-4 h-4 text-accent" />
                Review Modules
              </button>
              <button
                onClick={() => router.push('/in-person')}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent text-white shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 transition-all"
              >
                Book Workshop
              </button>
            </div>
          </div>
        </div>
      </motion.div>
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
          <span className="text-xl sm:text-2xl font-bold text-white">{nextModule.id}</span>
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
              1 CPD Point
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
            {completedModules === 0 ? 'Begin Module 1' : `Continue Module ${nextModule.id}`}
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
          <span className="font-medium text-muted-foreground">Course Progress</span>
          <span className="font-semibold text-accent">
            {completedModules} / 8 modules ({progressPercentage}%)
          </span>
        </div>
      </div>
    </motion.div>
  )
}
