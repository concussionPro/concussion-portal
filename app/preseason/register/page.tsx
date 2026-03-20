'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, User, Mail, AlertCircle, Check, Copy, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'
import { trackEvent, trackLeadConversion, ANALYTICS_EVENTS } from '@/lib/analytics'

export default function RegisterPage() {
  const router = useRouter()

  const [clinicName, setClinicName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<{ code: string; athleteLink: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!clinicName || !contactName || !email) {
      setError('All fields are required')
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
      const response = await fetch('/api/preseason/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName, contactName, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess({ code: data.code, athleteLink: data.athleteLink })
        trackEvent(ANALYTICS_EVENTS.PRESEASON_CLINIC_REGISTER, {
          clinicName,
          email: email.toLowerCase(),
          code: data.code,
        })
        // Fire Google Ads conversion for preseason registration
        trackLeadConversion(
          '74x1CLfT0IccEJWXu_9C',
          75,
          email.toLowerCase()
        )
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.athleteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = success.athleteLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative">
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/preseason"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Preseason
        </Link>

        <div className="glass rounded-2xl p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="icon-container w-14 h-14 mx-auto mb-5">
                  <Building2 className="w-7 h-7 text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Register Your Clinic
                </h1>
                <p className="text-sm text-muted-foreground">
                  Get a unique link for your athletes in seconds
                </p>
              </div>

              {error && (
                <div className="glass bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="clinicName" className="block text-sm font-semibold text-foreground mb-1.5">
                    Clinic name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="clinicName"
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="e.g. Bayside Sports Physio"
                      className="w-full glass pl-10 pr-3 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all border border-transparent"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactName" className="block text-sm font-semibold text-foreground mb-1.5">
                    Contact name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="contactName"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      className="w-full glass pl-10 pr-3 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all border border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                    Clinic email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="clinic@example.com"
                      className="w-full glass pl-10 pr-3 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all border border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Baseline reports will be sent here</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3.5 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registering...' : 'Get Your Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="icon-container w-14 h-14 mx-auto mb-5 bg-green-100">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                You're all set!
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Share this link with your sports clubs and teams
              </p>

              <div className="glass rounded-xl p-4 mb-4 border border-accent/20">
                <p className="text-xs text-muted-foreground mb-2">Your athlete link:</p>
                <p className="text-sm font-mono text-accent break-all font-bold mb-3">{success.athleteLink}</p>
                <button
                  onClick={copyLink}
                  className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              <div className="glass rounded-xl p-4 mb-6 border border-accent/10 text-left">
                <p className="text-xs font-semibold text-foreground mb-2">Clinic Code</p>
                <p className="text-2xl font-bold text-accent tracking-widest text-center">{success.code}</p>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                A confirmation email with your link has been sent to your clinic email.
              </p>

              <button
                onClick={() => {
                  setSuccess(null)
                  setClinicName('')
                  setContactName('')
                  setEmail('')
                }}
                className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
              >
                Register another clinic
              </button>
            </div>
          )}
        </div>

        {/* Free course promo */}
        <div className="glass rounded-2xl p-6 mt-6">
          <div className="text-center mb-3">
            <p className="text-sm font-semibold text-foreground mb-1">
              Free SCAT6/SCOAT6 Mastery Course
            </p>
            <p className="text-xs text-muted-foreground">
              Learn how to properly administer and interpret every SCAT6 section. 2 AHPRA CPD points, certificate included.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/scat-mastery"
              className="w-full btn-primary py-2.5 rounded-lg text-sm font-semibold text-center block"
            >
              Get Free Course (2 CPD pts) →
            </Link>
            <Link
              href={CONFIG.SHOP_URL}
              className="text-xs text-muted-foreground hover:text-accent text-center font-medium transition-colors block"
            >
              Or view our full {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD point course →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
