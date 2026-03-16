'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, CheckSquare, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'

export default function ResourcesPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Signup failed')
      setSubmitted(true)
      localStorage.setItem('resourceEmail', email)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resources = [
    {
      title: 'Concussion Clinical Cheat Sheet',
      description: 'One-page reference: red flags, symptom scoring thresholds, and acute management steps',
      format: 'PDF',
      icon: FileText
    },
    {
      title: 'SCAT6 & SCOAT6 Fillable Forms',
      description: 'Auto-scoring digital assessment forms mapped to official BJSM specifications',
      format: 'PDF',
      icon: CheckSquare
    },
    {
      title: '"What to Expect After a Concussion"',
      description: 'Patient handout covering recovery timeline, activity modifications, and when to seek help',
      format: 'PDF',
      icon: FileText
    },
    {
      title: 'Return-to-Play & Return-to-Learn Ladder',
      description: 'Graduated progression stages with specific criteria for advancing each step',
      format: 'PDF',
      icon: CheckSquare
    },
    {
      title: 'PCS Clinical Flowchart',
      description: 'Decision tree for persistent post-concussion symptoms: when to refer, which specialist, what to document',
      format: 'PDF',
      icon: FileText
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      <div className="max-w-4xl mx-auto px-6 py-16 pt-[80px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Free Clinical Resources
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            5 downloadable tools for concussion assessment and management
          </p>
        </div>

        {/* Resources Grid — shown FIRST so clinicians see value before email gate */}
        <div className="mb-10">
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-slate-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#6b9da8]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1">
                        {resource.title}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {resource.description}
                      </p>
                      <p className="text-xs text-slate-500">{resource.format}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Email gate — AFTER resources are visible */}
        {!submitted ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Download All 5 Resources
              </h2>
              <p className="text-slate-600">
                Enter your email and we'll send the download links directly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@clinic.com"
                  required
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#7ba8b0] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#6b9da8] text-white rounded-xl font-semibold hover:bg-[#5b8d96] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Sending...' : 'Download'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                No spam, unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border-2 border-teal-200 p-8 mb-12">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#7ba8b0] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-700 mb-4">
                Download links sent to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-slate-600">
                Check your spam folder if you don't see it within a few minutes.
              </p>
            </div>

            <div className="text-center pt-6 border-t border-teal-200">
              <p className="text-slate-700 mb-4">
                Want structured training with 14 AHPRA CPD points?
              </p>
              <button
                onClick={() => router.push('/trial')}
                className="px-6 py-3 bg-[#6b9da8] text-white rounded-xl font-semibold hover:bg-[#5b8d96] transition-colors inline-flex items-center gap-2"
              >
                Try Module 1 Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CTA to Trial */}
        {!submitted && (
          <div className="bg-slate-900 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Ready for the Full Course?
            </h3>
            <p className="text-slate-300 mb-6">
              Try Module 1 free. No credit card required.
            </p>
            <button
              onClick={() => router.push('/trial')}
              className="px-6 py-3 bg-[#6b9da8] text-white rounded-xl font-semibold hover:bg-[#5b8d96] transition-colors inline-flex items-center gap-2"
            >
              Try Module 1 Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
