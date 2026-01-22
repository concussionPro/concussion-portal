'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your login link...')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid link - no token provided')
      return
    }

    // Verify token
    fetch(`/api/auth/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Verification failed')
        }
        return res.json()
      })
      .then((data) => {
        setStatus('success')
        setMessage('Login successful! Redirecting to your dashboard...')

        // Save user session
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'Link expired or invalid')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-[#5b9aa6] mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h1>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back!</h1>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Common issues:</p>
                <ul className="text-sm text-left text-slate-600 space-y-1">
                  <li>• Link has expired (links last 24 hours)</li>
                  <li>• Link has already been used</li>
                  <li>• Link is invalid or corrupted</li>
                </ul>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 w-full px-6 py-3 bg-[#5b9aa6] text-white rounded-lg font-semibold hover:bg-[#5898a0] transition-colors"
                >
                  Go to Homepage
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyMagicLink() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-[#5b9aa6] animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
