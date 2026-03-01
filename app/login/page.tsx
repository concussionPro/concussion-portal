'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, AlertCircle, ArrowLeft, Check, Brain, Shield, Award } from 'lucide-react'
import { CONFIG } from '@/lib/config'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [devMagicLink, setDevMagicLink] = useState('')
  const redirectTo = '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmailSent(true)
        if (data.devMode && data.magicLink) {
          setDevMagicLink(data.magicLink)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send login link. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-teal-100/40 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-100/30 to-transparent blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5b9aa6] to-[#6b9da8] flex items-center justify-center shadow-lg shadow-teal-200/50">
                <Brain className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                Concussion<span className="text-[#5b9aa6]">Pro</span>
              </span>
            </div>
          </div>

          {/* Glassmorphic login card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-white/80">
            {!emailSent ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b9aa6]/10 to-[#6b9da8]/10 flex items-center justify-center mx-auto mb-4 border border-[#5b9aa6]/20">
                    <Mail className="w-7 h-7 text-[#5b9aa6]" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-sm text-slate-500">
                    Enter your email to receive a secure login link
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-3 mb-5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/80 pl-10 pr-4 py-3.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending login link...' : 'Send login link'}
                  </button>
                </form>

                <div className="mt-5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/50">
                  <div className="flex items-center gap-2 justify-center">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500 text-center">
                      No password needed. We'll email you a secure login link.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    Check your email
                  </h1>
                  <p className="text-sm text-slate-500 mb-6">
                    We've sent a login link to <strong className="text-slate-900">{email}</strong>
                  </p>

                  <div className="bg-slate-50/60 rounded-xl p-5 mb-6 border border-slate-200/50">
                    {devMagicLink ? (
                      <>
                        <div className="bg-amber-50/80 rounded-xl p-4 mb-4 border border-amber-200">
                          <p className="text-xs text-amber-800 font-medium mb-2">
                            Development Mode — Email service not configured
                          </p>
                          <a
                            href={devMagicLink}
                            className="text-sm text-[#5b9aa6] hover:underline break-all font-medium"
                          >
                            Click here to login directly
                          </a>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          Or use <a href="/dev-login" className="text-[#5b9aa6] hover:underline">/dev-login</a> for easier access
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 mb-3">
                          Click the link in your email to access your course. The link expires in 15 minutes.
                        </p>
                        <p className="text-xs text-slate-500">
                          Don't see it? Check your spam folder.
                        </p>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail('')
                    }}
                    className="text-sm text-[#5b9aa6] hover:text-[#4a8a96] transition-colors font-medium"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}

            {!emailSent && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/70 px-3 py-1 text-slate-400 font-medium rounded">
                      Not enrolled yet?
                    </span>
                  </div>
                </div>

                <a
                  href={CONFIG.SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl text-base font-semibold inline-block text-center bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  View course details
                </a>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Award className="w-3.5 h-3.5" />
              <span>AHPRA Compliant</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Need help? Contact zac@concussion-education-australia.com
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mt-4">
              <a
                href="/dev-login"
                className="text-xs text-[#5b9aa6] hover:underline"
              >
                Development: Direct Login (bypass email)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#5b9aa6] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
