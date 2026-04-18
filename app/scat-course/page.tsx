'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Lock, BookOpen, Award, Clock, FileText, Download, ArrowRight } from 'lucide-react'
import { trackFreeCourseCompletion } from '@/lib/analytics'
import { getSCATModulesMeta } from '@/data/module-meta'
import { useProgress } from '@/contexts/ProgressContext'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { MelbourneWorkshopCallout } from '@/components/MelbourneWorkshopCallout'

export default function SCATCoursePage() {
  const router = useRouter()
  const { isModuleComplete } = useProgress()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [accessChecked, setAccessChecked] = useState(false)
  const [certificateStatus, setCertificateStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [certificateDownloading, setCertificateDownloading] = useState(false)
  const certTriggered = useRef(false)

  // Get SCAT modules directly - no API call needed
  const modules = getSCATModulesMeta()

  useEffect(() => {
    // Check if user is logged in and has preview access
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login')
          return
        }

        setUserEmail(data.user.email)
        setAccessChecked(true)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load course:', error)
        router.push('/login')
      })
  }, [router])

  const totalCPD = modules.reduce((sum, m) => sum + m.points, 0)
  const completedModules = modules.filter(m => isModuleComplete(m.id)).length
  const progress = modules.length > 0 ? (completedModules / modules.length) * 100 : 0
  const allComplete = completedModules === modules.length && modules.length > 0

  // Auto-trigger certificate email when all modules completed
  useEffect(() => {
    if (allComplete && accessChecked && !certTriggered.current) {
      certTriggered.current = true
      // Check if certificate was already sent this session
      const sentKey = `cert-sent-scat-${userEmail}`
      if (typeof window !== 'undefined' && localStorage.getItem(sentKey)) return
      trackFreeCourseCompletion(userEmail)
      setCertificateStatus('sending')
      fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scat-mastery' }),
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
  }, [allComplete, accessChecked, userEmail])

  const handleDownloadCertificate = async () => {
    setCertificateDownloading(true)
    try {
      const res = await fetch('/api/certificate?type=scat-mastery', { credentials: 'include' })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CPD-Certificate-SCAT-Mastery.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Certificate download error:', error)
    } finally {
      setCertificateDownloading(false)
    }
  }

  const handleResendCertificate = async () => {
    setCertificateStatus('sending')
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scat-mastery' }),
        credentials: 'include',
      })
      const data = await res.json()
      setCertificateStatus(data.success ? 'sent' : 'error')
    } catch {
      setCertificateStatus('error')
    }
  }

  if (loading || !accessChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteNav />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white pt-[120px]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ConcussionPro Home
              </Link>
              <h1 className="text-3xl font-bold mb-2">Free SCAT6/SCOAT6 Mastery Course</h1>
              <p className="text-blue-100">Welcome back! Continue your learning journey.</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">Logged in as</div>
              <div className="font-semibold">{userEmail}</div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-semibold">Progress</span>
              </div>
              <div className="text-2xl font-bold">{completedModules} / {modules.length}</div>
              <div className="text-sm text-blue-100 mt-1">Modules completed</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-semibold">Certificate</span>
              </div>
              <div className="text-2xl font-bold">Included</div>
              <div className="text-sm text-blue-100 mt-1">Certificate of Completion</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">Time Investment</span>
              </div>
              <div className="text-2xl font-bold">~1 Hour</div>
              <div className="text-sm text-blue-100 mt-1">Self-paced learning</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold">Course Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Melbourne workshop — persistent callout for free-course users */}
        {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
          <div className="mb-8">
            <MelbourneWorkshopCallout
              variant={allComplete ? 'card' : 'banner'}
              source={allComplete ? 'scat_course_complete' : 'scat_course_in_progress'}
            />
          </div>
        )}

        {/* Certificate Banner — shown when course is complete */}
        {allComplete && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-emerald-900 mb-1">
                  Course Complete — Your Certificate is Ready!
                </h2>
                <p className="text-sm text-emerald-800 mb-4">
                  You've completed the SCAT Mastery course.
                  {certificateStatus === 'sent' && ' Your certificate has been emailed to you.'}
                  {certificateStatus === 'sending' && ' Emailing your certificate now...'}
                  {certificateStatus === 'error' && ' We had trouble emailing your certificate, but you can download it below.'}
                  {' '}Save it in your CPD portfolio for at least 5 years for audit purposes.
                </p>
                <div className="flex flex-wrap gap-3 mb-5">
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={certificateDownloading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {certificateDownloading ? 'Downloading...' : 'Download Certificate PDF'}
                  </button>
                  {certificateStatus !== 'sending' && (
                    <button
                      onClick={handleResendCertificate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 border border-emerald-300 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      {certificateStatus === 'sent' ? 'Resend Email' : 'Email Certificate'}
                    </button>
                  )}
                </div>
                <div className="pt-4 border-t border-emerald-200">
                  <p className="text-sm text-emerald-800 font-semibold mb-2">
                    Ready for the full course?
                  </p>
                  <p className="text-sm text-emerald-700 mb-3">
                    Unlock {CONFIG.COURSE.TOTAL_MODULES} modules covering VOMS, BESS, return-to-play protocols, phenotype-based rehabilitation, and more. Online from ${CONFIG.COURSE.PRICE_ONLINE} · Complete from ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} (early bird).
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    See Pricing &amp; Options
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinical-Grade Fillable PDFs - PRIMARY RECOMMENDATION */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Use These Clinical-Grade Fillable PDFs
                </h2>
                <p className="text-slate-700 mb-2">
                  These are TESTED, auto-calculating forms verified for clinical use.
                </p>
                <p className="text-green-800 font-bold">
                  All calculations verified. Safe for clinical use.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <a
              href="/docs/SCAT6_Fillable.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-300 hover:border-green-500 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Download className="w-6 h-6 text-green-700" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
                  RECOMMENDED
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">SCAT6 Fillable PDF</h3>
              <p className="text-slate-600 text-sm mb-3">Clinical-grade fillable PDF with auto-calculating scores. Opens in new tab.</p>
              <div className="text-sm text-green-700 font-semibold">
                → Download & Use in Clinical Practice
              </div>
            </a>

            <a
              href="/docs/SCOAT6_Fillable.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-300 hover:border-purple-500 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Download className="w-6 h-6 text-purple-700" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  RECOMMENDED
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">SCOAT6 Fillable PDF</h3>
              <p className="text-slate-600 text-sm mb-3">Clinical-grade fillable PDF for office assessments. Opens in new tab.</p>
              <div className="text-sm text-purple-700 font-semibold">
                → Download & Use in Clinical Practice
              </div>
            </a>
          </div>

          {/* Web Forms - Beta Option */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900">
              <strong>Alternative:</strong> We also have web-based versions available at{' '}
              <a href="/scat-forms/scat6" target="_blank" className="underline font-semibold hover:text-amber-700">
                /scat-forms/scat6
              </a>
              {' '}and{' '}
              <a href="/scat-forms/scoat6" target="_blank" className="underline font-semibold hover:text-amber-700">
                /scat-forms/scoat6
              </a>
              {' '}(experimental - use PDFs above for clinical work).
            </p>
          </div>
        </div>

        {/* Course Modules */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Course Modules</h2>

          <div className="space-y-4">
            {modules.map((module) => {
              const completed = isModuleComplete(module.id)

              return (
                <Link
                  key={module.id}
                  href={`/modules/${module.id}`}
                  className={`block bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                    completed
                      ? 'border-green-200 hover:border-green-300'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      completed ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{module.title}</h3>
                          <p className="text-slate-600 text-sm">{module.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-600">{module.duration}</div>
                          <div className="text-xs text-slate-500">{module.points > 0 ? `${module.points} CPD ${module.points === 1 ? 'point' : 'points'}` : 'Free module'}</div>
                        </div>
                      </div>

                      {completed && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mt-2">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border-2 border-purple-200">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Unlock the Full {CONFIG.COURSE.TOTAL_MODULES}-Module Course
              </h3>
              <p className="text-slate-700 mb-4">
                Go deeper with advanced concussion management — phenotype-based rehabilitation, BESS testing, VOMS protocols, return-to-play frameworks, and clinical case studies. Up to {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD points ({CONFIG.COURSE.ONLINE_CPD_POINTS} online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS} workshop).
              </p>
              <ul className="grid md:grid-cols-2 gap-2 mb-4">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  {CONFIG.COURSE.TOTAL_MODULES} online modules ({CONFIG.COURSE.ONLINE_CPD_POINTS} CPD)
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Full-day hands-on workshop ({CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD)
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Clinical Toolkit &amp; 140+ references
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Lifetime access &amp; digital certificate
                </li>
              </ul>
              <div className="bg-white/80 rounded-lg p-3 mb-5 border border-purple-100">
                <p className="text-sm text-slate-800">
                  <strong>Online from ${CONFIG.COURSE.PRICE_ONLINE}</strong> · Complete from <strong>${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} (early bird)</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  7-day satisfaction guarantee · Afterpay / Klarna available
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                View Pricing &amp; Enrol
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
