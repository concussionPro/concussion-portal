'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Lock, BookOpen, Award, Clock, FileText, ExternalLink } from 'lucide-react'

interface Module {
  id: number
  title: string
  subtitle: string
  duration: string
  points: number
  completed: boolean
}

export default function SCATCoursePage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/')
          return
        }

        // Check if user has preview access
        if (data.user.accessLevel !== 'preview') {
          // Paid users should use the main dashboard
          router.push('/dashboard')
          return
        }

        setUserEmail(data.user.email)

        // Load SCAT modules
        return fetch('/api/modules/list', { credentials: 'include' })
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.modules) {
          setModules(data.modules)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load course:', error)
        router.push('/')
      })
  }, [router])

  const totalCPD = modules.reduce((sum, m) => sum + m.points, 0)
  const completedModules = modules.filter(m => m.completed).length
  const progress = modules.length > 0 ? (completedModules / modules.length) * 100 : 0

  if (loading) {
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
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
                <span className="text-sm font-semibold">CPD Hours</span>
              </div>
              <div className="text-2xl font-bold">{totalCPD} Hours</div>
              <div className="text-sm text-blue-100 mt-1">AHPRA-aligned</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">Time Investment</span>
              </div>
              <div className="text-2xl font-bold">~2 Hours</div>
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
        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href="/scat-forms/scat6"
            target="_blank"
            className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200 hover:border-blue-400 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Web-Based SCAT6 Form</h3>
            <p className="text-slate-600">Use the interactive SCAT6 form with auto-calculating scores</p>
          </a>

          <a
            href="/scat-forms/scoat6"
            target="_blank"
            className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200 hover:border-purple-400 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Web-Based SCOAT6 Form</h3>
            <p className="text-slate-600">Use the interactive SCOAT6 form for clinic-based assessments</p>
          </a>
        </div>

        {/* Course Modules */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Course Modules</h2>

          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer ${
                  module.completed
                    ? 'border-green-200 hover:border-green-300'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => router.push(`/modules/${module.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    module.completed ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {module.completed ? (
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
                        <div className="text-xs text-slate-500">{module.points} CPD hours</div>
                      </div>
                    </div>

                    {module.completed && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mt-2">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                Want More? Upgrade to the Full Course
              </h3>
              <p className="text-slate-700 mb-4">
                Get access to 8 additional modules covering advanced concussion management, BESS testing, VOMS protocols, return-to-play frameworks, and more. 14 total CPD hours.
              </p>
              <ul className="grid md:grid-cols-2 gap-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  14 AHPRA CPD hours (vs 2 in free course)
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Advanced assessment protocols
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  100+ real case studies
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Quarterly live Q&A sessions
                </li>
              </ul>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                View Pricing & Upgrade →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
