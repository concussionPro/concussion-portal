'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { User, Mail, Shield, LogOut, CheckCircle2, Crown, Award, Download, Loader2, Pencil, X, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useProgress } from '@/contexts/ProgressContext'
import { useRouter } from 'next/navigation'
import { CONFIG } from '@/lib/config'
import { MelbourneWorkshopCallout } from '@/components/MelbourneWorkshopCallout'

interface SessionUser {
  email: string
  accessLevel: string
  name?: string
  createdAt?: string
  nurtureUnsubscribed?: boolean
  progressEmailsOptedOut?: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [certDownloading, setCertDownloading] = useState(false)
  const [certEmailStatus, setCertEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const [certError, setCertError] = useState<string | null>(null)

  // SCAT certificate state (for preview users)
  const [scatCertDownloading, setScatCertDownloading] = useState(false)
  const [scatCertEmailStatus, setScatCertEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Name editing state
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // Marketing toggle state
  const [marketingSaving, setMarketingSaving] = useState(false)

  // Progress emails toggle state
  const [progressSaving, setProgressSaving] = useState(false)

  const { getTotalCompletedModules, isModuleComplete } = useProgress()

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
            setNameValue(data.user.name || '')
          }
        }
      } catch (error) {
        console.error('Failed to load user session:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const isPaidUser =
    user?.accessLevel === 'online-only' || user?.accessLevel === 'full-course'
  const isFullCourse = user?.accessLevel === 'full-course'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (_) {
      // ignore
    }
    router.push('/')
  }

  const getAccessLabel = () => {
    if (isFullCourse) return 'Full Course'
    if (isPaidUser) return 'Online Course'
    if (user?.accessLevel === 'preview') return 'Free Preview'
    return 'Student Account'
  }

  const completedModules = getTotalCompletedModules()
  const allModulesComplete = completedModules === 8

  // SCAT mastery (preview users): check if all 3 free modules are complete
  const scatModuleIds = [101, 102, 103]
  const completedScatModules = scatModuleIds.filter(id => isModuleComplete(id)).length
  const allScatComplete = completedScatModules === 3
  const isPreviewUser = user?.accessLevel === 'preview'

  const getCertType = () => {
    // All paid users get the online-course certificate (8 CPD).
    // The in-person workshop certificate is issued manually by the instructor.
    if (isPaidUser) return 'online-course'
    return null
  }

  const handleDownloadCert = async () => {
    const certType = getCertType()
    if (!certType) return
    setCertError(null)
    setCertDownloading(true)
    try {
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
    } catch (error) {
      setCertError('Failed to download certificate. Please try again.')
    } finally {
      setCertDownloading(false)
    }
  }

  const handleEmailCert = async () => {
    const certType = getCertType()
    if (!certType) return
    setCertError(null)
    setCertEmailStatus('sending')
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: certType }),
        credentials: 'include',
      })
      const data = await res.json()
      setCertEmailStatus(data.success ? 'sent' : 'error')
    } catch (error) {
      setCertEmailStatus('error')
      setCertError('Failed to email certificate. Please try again.')
    }
  }

  const handleDownloadScatCert = async () => {
    setCertError(null)
    setScatCertDownloading(true)
    try {
      const response = await fetch('/api/certificate?type=scat-mastery', { credentials: 'include' })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'CPD-Certificate.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setCertError('Failed to download certificate. Please try again.')
    } finally {
      setScatCertDownloading(false)
    }
  }

  const handleEmailScatCert = async () => {
    setCertError(null)
    setScatCertEmailStatus('sending')
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scat-mastery' }),
        credentials: 'include',
      })
      const data = await res.json()
      setScatCertEmailStatus(data.success ? 'sent' : 'error')
    } catch (error) {
      setScatCertEmailStatus('error')
      setCertError('Failed to email certificate. Please try again.')
    }
  }

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameSaving) return
    setNameSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
        credentials: 'include',
      })
      if (res.ok) {
        setUser(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
        setEditingName(false)
      }
    } catch {
      // keep editing state
    } finally {
      setNameSaving(false)
    }
  }

  const handleToggleMarketing = async () => {
    if (!user || marketingSaving) return
    const newValue = !user.nurtureUnsubscribed
    setMarketingSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurtureUnsubscribed: newValue }),
        credentials: 'include',
      })
      if (res.ok) {
        setUser(prev => prev ? { ...prev, nurtureUnsubscribed: newValue } : prev)
      }
    } catch {
      // ignore
    } finally {
      setMarketingSaving(false)
    }
  }

  const handleToggleProgress = async () => {
    if (!user || progressSaving) return
    const newValue = !user.progressEmailsOptedOut
    setProgressSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressEmailsOptedOut: newValue }),
        credentials: 'include',
      })
      if (res.ok) {
        setUser(prev => prev ? { ...prev, progressEmailsOptedOut: newValue } : prev)
      }
    } catch {
      // ignore
    } finally {
      setProgressSaving(false)
    }
  }

  const getEnrolledDate = () => {
    const dateStr = user?.createdAt
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1000px]">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#64a8b0] to-[#7ba8b0] flex items-center justify-center">
                  <User className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Settings
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage your account and preferences
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#5b9aa6] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Account Information */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="w-5 h-5 text-[#5b9aa6]" strokeWidth={2} />
                    <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Name (editable) */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Name
                      </label>
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            className="flex-1 px-4 py-3 bg-white rounded-lg border-2 border-[#5b9aa6] text-slate-900 outline-none"
                            autoFocus
                            maxLength={100}
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={nameSaving || !nameValue.trim()}
                            className="p-2.5 bg-[#5b9aa6] text-white rounded-lg hover:bg-[#4a8a96] transition-colors disabled:opacity-50"
                          >
                            {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setEditingName(false); setNameValue(user?.name || '') }}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                            {user?.name || 'Not set'}
                          </div>
                          <button
                            onClick={() => setEditingName(true)}
                            className="p-2.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            title="Edit name"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Email Address
                      </label>
                      <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                        {user?.email || 'Loading...'}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Account Type
                      </label>
                      <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 flex items-center gap-2">
                        {isPaidUser && <Crown className="w-4 h-4 text-amber-500" />}
                        {getAccessLabel()}
                      </div>
                    </div>

                    {getEnrolledDate() && (
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">
                          Enrolled Since
                        </label>
                        <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                          {getEnrolledDate()}
                        </div>
                      </div>
                    )}

                    {/* Marketing emails toggle */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Marketing Emails
                      </label>
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-600">
                          {user?.nurtureUnsubscribed ? 'Unsubscribed from marketing emails' : 'Receiving course updates and tips'}
                        </span>
                        <button
                          onClick={handleToggleMarketing}
                          disabled={marketingSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            !user?.nurtureUnsubscribed ? 'bg-[#5b9aa6]' : 'bg-slate-300'
                          } ${marketingSaving ? 'opacity-50' : ''}`}
                          role="switch"
                          aria-checked={!user?.nurtureUnsubscribed}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                              !user?.nurtureUnsubscribed ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Module progress emails toggle */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">
                        Module Progress Emails
                      </label>
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-600">
                          {user?.progressEmailsOptedOut ? 'Not receiving module progress reminders' : 'Reminders to continue your modules'}
                        </span>
                        <button
                          onClick={handleToggleProgress}
                          disabled={progressSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            !user?.progressEmailsOptedOut ? 'bg-[#5b9aa6]' : 'bg-slate-300'
                          } ${progressSaving ? 'opacity-50' : ''}`}
                          role="switch"
                          aria-checked={!user?.progressEmailsOptedOut}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                              !user?.progressEmailsOptedOut ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Level */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-[#5b9aa6]" strokeWidth={2} />
                    <h2 className="text-xl font-bold text-slate-900">Course Access</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Online Modules</div>
                        <div className="text-xs text-slate-600 mt-1">8 modules with CPD certification</div>
                      </div>
                      {isPaidUser ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          FULL ACCESS
                        </div>
                      ) : (
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                          PREVIEW
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Clinical Toolkit</div>
                        <div className="text-xs text-slate-600 mt-1">SCAT6, flowcharts, templates</div>
                      </div>
                      {isPaidUser ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          FULL ACCESS
                        </div>
                      ) : (
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                          PREVIEW
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Reference Repository</div>
                        <div className="text-xs text-slate-600 mt-1">140+ academic references</div>
                      </div>
                      {isPaidUser ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          FULL ACCESS
                        </div>
                      ) : (
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                          PREVIEW
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">In-Person Workshop</div>
                        <div className="text-xs text-slate-600 mt-1">Full-day practical training (6 CPD points)</div>
                      </div>
                      {isFullCourse ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          INCLUDED
                        </div>
                      ) : isPaidUser ? (
                        <a href="/upgrade" className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors">
                          ADD WORKSHOP →
                        </a>
                      ) : (
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          NOT INCLUDED
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show confirmation message for paid users */}
                  {isPaidUser && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm text-emerald-900 font-semibold">
                          You have full course access
                        </p>
                      </div>
                      <p className="text-xs text-emerald-700">
                        All modules, clinical resources, and reference materials are unlocked for your account.
                      </p>
                    </div>
                  )}
                </div>

                {/* Certificate */}
                {isPaidUser && (
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Award className="w-5 h-5 text-[#5b9aa6]" strokeWidth={2} />
                      <h2 className="text-xl font-bold text-slate-900">CPD Certificate</h2>
                    </div>

                    {allModulesComplete ? (
                      <>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-900">
                              Certificate Available
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700 mb-1">
                            Online Course — {CONFIG.COURSE.ONLINE_CPD_POINTS} AHPRA CPD points
                            {isFullCourse && (
                              <span className="block text-emerald-500 mt-0.5">
                                Workshop CPD ({CONFIG.COURSE.TOTAL_CPD_POINTS - CONFIG.COURSE.ONLINE_CPD_POINTS} points) awarded at your workshop
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-emerald-600">
                            All {completedModules} modules completed with 75%+ quiz scores
                          </p>
                        </div>

                        {certEmailStatus === 'sent' && (
                          <p className="text-xs text-emerald-700 mb-3">
                            Certificate emailed to <span className="font-semibold">{user?.email}</span>
                          </p>
                        )}
                        {certEmailStatus === 'error' && (
                          <p className="text-xs text-red-600 mb-3">
                            Email failed — use the download button instead.
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleDownloadCert}
                            disabled={certDownloading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#5b9aa6] text-white rounded-lg hover:bg-[#4a8a96] transition-colors disabled:opacity-50"
                          >
                            {certDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            Download PDF
                          </button>
                          <button
                            onClick={handleEmailCert}
                            disabled={certEmailStatus === 'sending'}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white text-[#5b9aa6] border-2 border-[#5b9aa6] rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50"
                          >
                            {certEmailStatus === 'sending' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Email to Me
                          </button>
                        </div>

                        {certError && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{certError}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          {completedModules}/8 modules completed
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Complete all 8 modules with 75%+ quiz scores to earn your certificate.
                        </p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-[#5b9aa6] h-2 rounded-full transition-all"
                            style={{ width: `${(completedModules / 8) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SCAT6 Mastery Certificate + Upgrade CTA (preview users) */}
                {isPreviewUser && (
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Award className="w-5 h-5 text-[#5b9aa6]" strokeWidth={2} />
                      <h2 className="text-xl font-bold text-slate-900">SCAT6 Mastery Certificate</h2>
                    </div>

                    {allScatComplete ? (
                      <>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-900">
                              Certificate of Completion
                            </span>
                          </div>
                          <p className="text-xs text-emerald-700">
                            All 3 SCAT6 Mastery modules completed. Download or email your certificate below.
                          </p>
                        </div>

                        {scatCertEmailStatus === 'sent' && (
                          <p className="text-xs text-emerald-700 mb-3">
                            Certificate emailed to <span className="font-semibold">{user?.email}</span>
                          </p>
                        )}
                        {scatCertEmailStatus === 'error' && (
                          <p className="text-xs text-red-600 mb-3">
                            Email failed — use the download button instead.
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleDownloadScatCert}
                            disabled={scatCertDownloading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#5b9aa6] text-white rounded-lg hover:bg-[#4a8a96] transition-colors disabled:opacity-50"
                          >
                            {scatCertDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            Download Certificate
                          </button>
                          <button
                            onClick={handleEmailScatCert}
                            disabled={scatCertEmailStatus === 'sending'}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white text-[#5b9aa6] border-2 border-[#5b9aa6] rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50"
                          >
                            {scatCertEmailStatus === 'sending' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            Email Certificate
                          </button>
                        </div>

                        {certError && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{certError}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          {completedScatModules}/3 modules completed
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Complete all 3 SCAT6 Mastery modules to finish the course.
                        </p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-[#5b9aa6] h-2 rounded-full transition-all"
                            style={{ width: `${(completedScatModules / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                      <p className="text-sm text-purple-800 font-medium mb-2">Ready for more? Earn up to {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD points with the full course.</p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
                      >
                        View Full Course &rarr;
                      </button>
                    </div>

                    {/* Melbourne workshop callout for preview users */}
                    {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
                      <div className="mt-4">
                        <MelbourneWorkshopCallout source={allScatComplete ? 'settings_scat_complete' : 'settings_scat_progress'} />
                      </div>
                    )}
                  </div>
                )}

                {/* Account Actions */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <LogOut className="w-5 h-5 text-slate-500" strokeWidth={2} />
                    <h2 className="text-xl font-bold text-slate-900">Account Actions</h2>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>

                  <p className="text-xs text-slate-500 mt-4">
                    Need help? Contact support at zac@concussion-education-australia.com
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
