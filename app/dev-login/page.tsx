'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, AlertCircle, Check } from 'lucide-react'

export default function DevLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    try {
      // Use direct-login API (bypasses email)
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed. Please check your email.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="icon-container w-14 h-14 mx-auto mb-5 bg-green-100">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
              Login successful!
            </h1>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="icon-container w-14 h-14 mx-auto mb-5">
              <Mail className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
              Development Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Direct login (bypasses email verification)
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
                  placeholder="your@email.com"
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
              {isLoading ? 'Logging in...' : 'Login directly'}
            </button>
          </form>

          <div className="mt-5 p-4 glass rounded-xl border border-yellow-500/20 bg-yellow-50/50">
            <p className="text-xs text-yellow-800 text-center font-medium">
              Development Mode Only - Email verification bypassed
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Available test accounts:
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setEmail('demo@concussionpro.com')}
                className="text-xs text-accent hover:underline block w-full"
              >
                demo@concussionpro.com
              </button>
              <button
                onClick={() => setEmail('zac@concussion-education-australia.com')}
                className="text-xs text-accent hover:underline block w-full"
              >
                zac@concussion-education-australia.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
