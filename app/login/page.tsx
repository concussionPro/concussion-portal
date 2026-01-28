'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, AlertCircle, ArrowLeft, Check } from 'lucide-react'
import { CONFIG } from '@/lib/config'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [devMagicLink, setDevMagicLink] = useState('')

  const redirectTo = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    // Check if user has active session
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) {
          router.push(redirectTo)
        }
      })
      .catch(() => {
        // No active session, stay on login page
      })
  }, [router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      // Send magic link email via API
      const response = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmailSent(true)
        // In dev mode, save the magic link to display it
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="glass rounded-2xl p-8">
          {!emailSent ? (
            <>
              <div className="text-center mb-6">
                <div className="icon-container w-14 h-14 mx-auto mb-5">
                  <Mail className="w-7 h-7 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email to receive a secure login link
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="glass bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full glass pl-10 pr-3 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all border border-transparent"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3.5 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending login link...' : 'Send login link'}
                </button>
              </form>

              <div className="mt-5 p-4 glass rounded-xl border border-accent/20">
                <p className="text-xs text-muted-foreground text-center">
                  No password needed. We'll email you a secure link to access your course.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center">
                <div className="icon-container w-14 h-14 mx-auto mb-5 bg-green-100">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Check your email
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  We've sent a login link to <strong className="text-foreground">{email}</strong>
                </p>

                <div className="glass rounded-xl p-5 mb-6 border border-accent/20">
                  {devMagicLink ? (
                    <>
                      <div className="glass rounded-xl p-4 mb-4 border border-yellow-500/20 bg-yellow-50/50">
                        <p className="text-xs text-yellow-800 font-medium mb-2">
                          Development Mode - Email service not configured
                        </p>
                        <a
                          href={devMagicLink}
                          className="text-sm text-accent hover:underline break-all"
                        >
                          Click here to login directly
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Or use <a href="/dev-login" className="text-accent hover:underline">/dev-login</a> for easier access
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click the link in your email to access your course. The link expires in 15 minutes.
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                  className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Use a different email
                </button>
              </div>
            </>
          )}

          {!emailSent && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="glass px-2 py-1 text-muted-foreground font-medium">
                    Not enrolled yet?
                  </span>
                </div>
              </div>

              {/* Course CTA */}
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary py-3.5 rounded-xl text-base font-semibold inline-block text-center"
              >
                View course details
              </a>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact zac@concussion-education-australia.com
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="text-center mt-4">
            <a
              href="/dev-login"
              className="text-xs text-accent hover:underline"
            >
              Development: Direct Login (bypass email)
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
