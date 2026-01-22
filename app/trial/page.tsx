'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle2, ArrowRight, Award, Clock } from 'lucide-react'

export default function TrialPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Store trial email
    localStorage.setItem('trialEmail', email)
    localStorage.setItem('trialStarted', 'true')

    await new Promise(resolve => setTimeout(resolve, 800))

    // Redirect to Module 1
    router.push('/modules/1')
  }

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
                Already Enrolled? Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-[#5b8d96] px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Play className="w-4 h-4" />
            Free Trial
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Try Module 1 Free
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-2">
            Experience our premium CPD course at no cost
          </p>
          <p className="text-base text-slate-500">
            No credit card required · Full module access
          </p>
        </div>

        {/* Trial Access Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              What's Included in Your Free Trial
            </h2>
            <div className="space-y-4">
              {[
                'Full access to Module 1: What is a Concussion?',
                'Interactive learning elements and quick knowledge checks',
                'Downloadable clinical resources and cheat sheets',
                'Final quiz to test your knowledge',
                'Earn 1 CPD point upon completion'
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
              {isLoading ? 'Starting Your Trial...' : 'Start Free Trial'}
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
            <h3 className="font-bold text-slate-900 mb-2">AHPRA Accredited</h3>
            <p className="text-sm text-slate-600">
              Earn CPD points recognized for Australian health practitioner registration
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-[#5b9aa6]" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">45 Minutes</h3>
            <p className="text-sm text-slate-600">
              Complete Module 1 at your own pace, on any device
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-purple-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No Commitment</h3>
            <p className="text-sm text-slate-600">
              Try Module 1 free. Upgrade to full course only if you love it
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-slate-900 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            After Your Free Trial
          </h3>
          <p className="text-slate-300 mb-6">
            If you love Module 1, unlock the remaining 7 modules and earn 39 additional CPD points. Full course includes SCAT6 mastery, VOMS protocols, return-to-play frameworks, and advanced rehabilitation pathways.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">8</div>
              <div className="text-sm text-slate-400">Total Modules</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">40</div>
              <div className="text-sm text-slate-400">CPD Points</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-teal-400 mb-1">~6</div>
              <div className="text-sm text-slate-400">Hours Total</div>
            </div>
          </div>
        </div>
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
