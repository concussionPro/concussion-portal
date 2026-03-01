'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { User, Mail, Shield, Bell, LogOut, Trash2, CheckCircle2, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SessionUser {
  email: string
  accessLevel: string
  name?: string
  enrolledAt?: string
  createdAt?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  useAnalytics()

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

  const getEnrolledDate = () => {
    const dateStr = user?.enrolledAt || user?.createdAt
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
                        <div className="text-xs text-slate-600 mt-1">133+ academic references</div>
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

                    {isFullCourse && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">In-Person Workshop</div>
                          <div className="text-xs text-slate-600 mt-1">Full-day practical training (6 CPD hours)</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          INCLUDED
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Only show upgrade CTA for non-paid users */}
                  {!isPaidUser && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900 font-semibold mb-2">
                        Unlock Full Access
                      </p>
                      <p className="text-xs text-amber-700 mb-3">
                        Enroll in the complete course to access all modules, workshops, and premium resources.
                      </p>
                      <button
                        onClick={() => router.push('/preview')}
                        className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Enroll Now — $1,190
                      </button>
                    </div>
                  )}

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

                {/* Notifications */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-[#5b9aa6]" strokeWidth={2} />
                    <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Course Updates</div>
                        <div className="text-xs text-slate-600 mt-1">New modules and content releases</div>
                      </div>
                      <div className="text-xs text-slate-500">Coming Soon</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Progress Reminders</div>
                        <div className="text-xs text-slate-600 mt-1">Weekly study reminders</div>
                      </div>
                      <div className="text-xs text-slate-500">Coming Soon</div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2} />
                    <h2 className="text-xl font-bold text-red-900">Account Actions</h2>
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
