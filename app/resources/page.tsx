'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, CheckSquare, ArrowRight, CheckCircle2 } from 'lucide-react'
import { CONFIG } from '@/lib/config'

export default function ResourcesPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // In production: send to email service
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitted(true)
    setIsLoading(false)

    // Store email for trial access
    localStorage.setItem('resourceEmail', email)
  }

  const resources = [
    {
      title: 'SCAT6 Quick Reference',
      description: 'Laminated card format with red flags and scoring criteria',
      fileSize: '420 KB',
      downloadUrl: '/resources/scat6-quick-reference.pdf',
      icon: FileText
    },
    {
      title: 'Red Flags Emergency Poster',
      description: 'A4 clinic wall poster for immediate referral criteria',
      fileSize: '290 KB',
      downloadUrl: '/resources/red-flags-poster.pdf',
      icon: CheckSquare
    },
    {
      title: '3-Minute Screening Checklist',
      description: 'Rapid patient intake form for concussion assessment',
      fileSize: '180 KB',
      downloadUrl: '/resources/3-minute-screening.pdf',
      icon: CheckSquare
    },
    {
      title: 'Return-to-Play Decision Tree',
      description: 'Visual flowchart for graduated RTP protocol',
      fileSize: '380 KB',
      downloadUrl: '/resources/rtp-decision-tree.pdf',
      icon: FileText
    },
    {
      title: 'Patient Education Handout',
      description: 'What to expect after concussion - professional handout',
      fileSize: '225 KB',
      downloadUrl: '/resources/patient-education.pdf',
      icon: FileText
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-xl font-bold text-slate-900"
            >
              Concussion<span className="text-[#6b9da8]">Pro</span>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Login
              </button>
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-[#6b9da8] text-white rounded-lg text-sm font-semibold hover:bg-[#5b8d96] transition-colors"
              >
                Enroll Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Free Clinical Resources
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Professional concussion assessment tools for your clinic
          </p>
        </div>

        {!submitted ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Get Instant Access
              </h2>
              <p className="text-slate-600">
                Enter your email to download all 5 professional resources
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                AHPRA-compliant resources. No spam, unsubscribe anytime.
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
                We've sent download links to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-slate-600">
                Don't see it? Check your spam folder.
              </p>
            </div>

            <div className="text-center pt-6 border-t border-teal-200">
              <p className="text-slate-700 mb-4">
                Want full access to 8 interactive modules and 40 AHPRA CPD points?
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

        {/* Resources Grid */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6">What You'll Get</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors"
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
                      <p className="text-xs text-slate-500">{resource.fileSize} PDF</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            © 2026 Concussion Education Australia · AHPRA Accredited CPD
          </p>
        </div>
      </footer>
    </div>
  )
}
