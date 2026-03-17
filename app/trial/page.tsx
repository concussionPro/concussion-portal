'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, CheckCircle2, ArrowRight, Award, Clock } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'

export default function TrialPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Store trial email locally as fallback
    localStorage.setItem('trialEmail', email)
    localStorage.setItem('trialStarted', 'true')

    // Persist lead server-side (sends welcome email + creates user)
    try {
      await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Don't block the trial experience if API fails
    }

    // Redirect to free SCAT mastery course
    router.push('/scat-mastery')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Free SCAT6 Course', url: '/trial' },
      ]} />
      <SiteNav />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16 pt-[80px]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-[#5b8d96] px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Play className="w-4 h-4" />
            Free Trial
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Start Free SCAT6 Course
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-2">
            Master the SCAT6 assessment and earn 2 CPD points — completely free
          </p>
          <p className="text-base text-slate-500">
            No credit card required · 5 modules · AHPRA aligned
          </p>
        </div>

        {/* Trial Access Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              What's Included in Your Free Course
            </h2>
            <div className="space-y-4">
              {[
                '5 complete modules covering SCAT6 assessment mastery',
                'Interactive learning elements and quick knowledge checks',
                'Earn 2 AHPRA-aligned CPD points on completion',
                'Final quiz to test your knowledge',
                'No credit card required — start learning immediately'
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6b9da8] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleStartTrial} className="border-t border-slate-200 pt-8">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@clinic.com"
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#7ba8b0] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#6b9da8] to-[#5b9aa6] text-white rounded-xl font-semibold hover:from-[#5b8d96] hover:to-[#5898a0] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Starting Your Course...' : 'Start Free Course'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-xs text-slate-500 mt-4 text-center">
              By starting your trial, you agree to receive course updates via email
            </p>
          </form>
        </div>

        {/* Course Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-[#6b9da8]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">AHPRA Aligned</h3>
            <p className="text-sm text-slate-600">
              Earn CPD points recognized for Australian health practitioner registration
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-[#5b9aa6]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Self-Paced</h3>
            <p className="text-sm text-slate-600">
              Complete all 5 modules at your own pace, on any device
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-purple-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No Commitment</h3>
            <p className="text-sm text-slate-600">
              Complete the free course. Upgrade to full 8-module course only if you love it
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-slate-900 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready for More?
          </h3>
          <p className="text-slate-300 mb-6">
            After completing your free SCAT6 course, unlock the full 8-module professional course and earn all 14 CPD points (8 online + 6 in-person workshop). Covers VOMS protocols, return-to-play frameworks, and advanced rehabilitation pathways.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">8</div>
              <div className="text-sm text-slate-400">Total Modules</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">14</div>
              <div className="text-sm text-slate-400">CPD Points (Complete)</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">~10</div>
              <div className="text-sm text-slate-400">Online Hours</div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-lg"
            >
              See Full Course &amp; Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer rendered by FooterWrapper in root layout */}
    </div>
  )
}
