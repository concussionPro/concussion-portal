'use client'

import { useState } from 'react'
import { Check, AlertCircle, Loader2, Mail, DollarSign, User } from 'lucide-react'

export default function AdminCreateUser() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<'497' | '1190'>('1190')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [magicLink, setMagicLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, amount: parseInt(amount) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setStatus('success')
      setMessage(`✅ User created! ${data.emailSent ? 'Email sent' : 'Copy magic link below'} to ${email}`)
      setMagicLink(data.magicLink || '')

      // Clear form after 10 seconds (give time to copy link)
      setTimeout(() => {
        setEmail('')
        setName('')
        setAmount('1190')
        setStatus('idle')
        setMessage('')
        setMagicLink('')
      }, 10000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create User & Send Access
          </h1>
          <p className="text-slate-600">
            Manually grant portal access after Squarespace purchase
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Customer Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="customer@example.com"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-[#5b9aa6] focus:outline-none text-slate-900"
              />
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Customer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Smith"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-[#5b9aa6] focus:outline-none text-slate-900"
              />
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Purchase Amount
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAmount('497')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    amount === '497'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl font-black text-slate-900">$497</div>
                  <div className="text-xs text-slate-600 mt-1">Online Only</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('1190')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    amount === '1190'
                      ? 'border-[#5b9aa6] bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl font-black text-slate-900">$1,190</div>
                  <div className="text-xs text-slate-600 mt-1">Full Course</div>
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <>
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-900">{message}</p>
                </div>

                {magicLink && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-xs font-bold text-blue-900 mb-2">🔗 Magic Login Link (copy & send manually):</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={magicLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-xs font-mono text-blue-900"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(magicLink)
                          alert('Link copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-xs hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-900">{message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white rounded-xl font-bold text-lg hover:from-[#5898a0] hover:to-[#5b8d96] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  Create User & Send Email
                </>
              )}
            </button>
          </form>

          {/* Instructions */}
          <div className="mt-8 pt-8 border-t-2 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">📋 Quick Instructions:</h3>
            <ol className="text-sm text-slate-600 space-y-2">
              <li><strong>1.</strong> Receive order notification from Squarespace</li>
              <li><strong>2.</strong> Copy customer email and name</li>
              <li><strong>3.</strong> Select purchase amount ($497 or $1,190)</li>
              <li><strong>4.</strong> Click "Create User & Send Email"</li>
              <li><strong>5.</strong> Customer receives login email instantly! ✅</li>
            </ol>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <p className="text-xs text-amber-900">
            <strong>🔒 Security Note:</strong> This page should be bookmarked and kept private.
            Consider adding password protection in production.
          </p>
        </div>
      </div>
    </div>
  )
}
