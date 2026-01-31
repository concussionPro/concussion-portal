'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, CheckCircle, Zap, Clock, FileText, ArrowRight, Shield } from 'lucide-react'

export default function SCAT6DownloadPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Sign up for free course which includes PDFs
      const response = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
        }),
      })

      const data = await response.json()

      if (data.success && data.loginLink) {
        alert('Success! Check your email for your fillable SCAT6 & SCOAT6 PDFs + free course access.')
        window.location.href = data.loginLink
      } else {
        alert(data.error || 'Error processing request. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('Error processing request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-teal-400 to-emerald-400 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
            ✓ 100% FREE - No Credit Card Required
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Free Fillable SCAT6 & SCOAT6 PDFs
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Auto-calculating, digitally fillable PDFs + FREE training course on how to use them correctly
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              className="w-full px-6 py-4 rounded-lg text-slate-900 font-semibold text-lg border-2 border-white/30 focus:border-white focus:outline-none mb-3"
              disabled={loading}
            />
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-white text-teal-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-teal-50 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Get Free PDFs + Training →'}
            </button>
            <p className="text-sm text-white/75 mt-3">
              ✓ Instant email delivery • No credit card required
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>2026 Updated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Auto-calculating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Fillable PDFs</span>
            </div>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What You'll Receive Instantly</h2>
          <p className="text-xl text-slate-600">Everything you need for proper concussion assessment</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Fillable SCAT6 PDF</h3>
            </div>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>Auto-calculating scores (saves 5+ minutes per assessment)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>Digitally fillable - no printing required</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>2026 updated to Berlin Consensus standards</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>For sideline/acute assessment (0-72 hours)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Fillable SCOAT6 PDF</h3>
            </div>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Comprehensive clinic-based assessment tool</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Serial monitoring capability for tracking recovery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Return-to-play/learn/work decision support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>For clinic visits (Day 1-7+ post-injury)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BONUS: Free Training */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500 rounded-lg flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-900 mb-3">
                BONUS: FREE Training Course Included (Worth $99)
              </h3>
              <p className="text-lg text-slate-700 mb-4">
                Having the PDFs isn't enough - 40% of GPs don't feel confident using them correctly. Our FREE 2-hour course teaches you:
              </p>
              <ul className="grid md:grid-cols-2 gap-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>When to use SCAT6 vs SCOAT6 (most clinicians get this wrong)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Red flag recognition that prevents medicolegal liability</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Step-by-step walkthrough of every section</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>2 AHPRA-aligned CPD hours + certificate</span>
                </li>
              </ul>
              <div className="bg-white/50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-slate-700">
                  <strong>⚖️ Legal Note:</strong> The 2023 Berlin Consensus requires you use the correct tool at the correct time. Our training ensures you're compliant and protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Better Than Printing */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Fillable PDFs Beat Printing
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Save 5+ Minutes</h3>
              <p className="text-slate-600">Auto-calculating scores means no manual addition or errors</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Printing Needed</h3>
              <p className="text-slate-600">Fill out on tablet, laptop, or phone. Email to patient instantly.</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Always Up-to-Date</h3>
              <p className="text-slate-600">2026 version aligned with latest Berlin Consensus guidelines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-500 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Your Free SCAT6 & SCOAT6 PDFs?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join 3,247+ Australian healthcare professionals using evidence-based concussion protocols
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              className="w-full px-6 py-4 rounded-lg text-slate-900 font-semibold text-lg border-2 border-white/30 focus:border-white focus:outline-none mb-3"
              disabled={loading}
            />
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-white text-teal-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-teal-50 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Get Free PDFs + Training Now →'}
            </button>
            <p className="text-sm text-white/75 mt-3">
              ✓ Delivered to your inbox in 60 seconds • No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
