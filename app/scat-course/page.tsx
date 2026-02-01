'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Lock, BookOpen, Award, Clock, FileText, ExternalLink, Download } from 'lucide-react'
import { getSCATModules } from '@/data/scat-modules'
import { useProgress } from '@/contexts/ProgressContext'

export default function SCATCoursePage() {
  const router = useRouter()
  const { isModuleComplete } = useProgress()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [accessChecked, setAccessChecked] = useState(false)

  // Get SCAT modules directly - no API call needed
  const modules = getSCATModules()

  useEffect(() => {
    // Check if user is logged in and has preview access
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
        setAccessChecked(true)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load course:', error)
        router.push('/')
      })
  }, [router])

  const totalCPD = modules.reduce((sum, m) => sum + m.points, 0)
  const completedModules = modules.filter(m => isModuleComplete(m.id)).length
  const progress = modules.length > 0 ? (completedModules / modules.length) * 100 : 0

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
        {/* Clinical-Grade Fillable PDFs - PRIMARY RECOMMENDATION */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  ✅ Use These Clinical-Grade Fillable PDFs
                </h2>
                <p className="text-slate-700 mb-2">
                  These are the TESTED, auto-calculating forms used by 3,200+ clinicians.
                </p>
                <p className="text-green-800 font-bold">
                  ✓ All calculations verified • Safe for clinical use
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
                <div
                  key={module.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer ${
                    completed
                      ? 'border-green-200 hover:border-green-300'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => router.push(`/modules/${module.id}`)}
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
                          <div className="text-xs text-slate-500">{module.points} CPD hours</div>
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
                </div>
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
