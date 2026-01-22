'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getCurrentUser, logout } from '@/lib/auth'
import { User, Mail, Shield, Bell, LogOut, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-64 flex-1">
          <div className="px-8 py-10 max-w-[1000px]">
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
                    {user?.email || 'Not available'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Account Type
                  </label>
                  <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    {user?.email === 'demo@concussionpro.com' ? 'Demo Account' : 'Student Account'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Enrolled Since
                  </label>
                  <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    {user?.enrolledAt ? new Date(user.enrolledAt).toLocaleDateString() : 'N/A'}
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
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                    PREVIEW
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Clinical Toolkit</div>
                    <div className="text-xs text-slate-600 mt-1">SCAT6, flowcharts, templates</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                    PREVIEW
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Reference Repository</div>
                    <div className="text-xs text-slate-600 mt-1">145 academic references</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                    PREVIEW
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900 font-semibold mb-2">
                  Unlock Full Access
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Enroll in the complete course to access all modules, workshops, and premium resources.
                </p>
                <a
                  href="https://concussion-education-australia.com/shop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Enroll Now - $1,190
                </a>
              </div>
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

            {/* Danger Zone */}
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
