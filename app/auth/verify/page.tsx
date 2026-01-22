'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { verifyMagicToken } from '@/lib/magicLink'
import { login } from '@/lib/auth'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email || !token) {
      setStatus('error')
      setErrorMessage('Invalid login link. Please request a new one.')
      return
    }

    // Verify the magic token
    const isValid = verifyMagicToken(email, token)

    if (isValid) {
      // Check if user is enrolled (has paid)
      const isPaidUser = localStorage.getItem('isPaidUser') === 'true'

      // Create user session
      login({
        id: email,
        email: email,
        name: email.split('@')[0],
        enrolledAt: new Date().toISOString(),
      })

      setStatus('success')

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      setStatus('error')
      setErrorMessage('This login link has expired or already been used. Please request a new one.')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        <div className="glass rounded-2xl p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="icon-container w-14 h-14 mx-auto mb-5">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                Verifying your login...
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we authenticate you
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="icon-container w-14 h-14 mx-auto mb-5 bg-green-100">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                Login successful!
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Welcome back. Redirecting to your dashboard...
              </p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="icon-container w-14 h-14 mx-auto mb-5 bg-red-100">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                Verification failed
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary py-3 px-6 rounded-xl text-base font-semibold"
              >
                Request new login link
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact zac@concussion-education-australia.com
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
