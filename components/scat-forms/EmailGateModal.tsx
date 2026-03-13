'use client'

import { useState } from 'react'
import { Download, Loader2, Mail, X } from 'lucide-react'

interface EmailGateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accentColor?: string // e.g. 'blue', 'purple', 'green'
}

const colorMap: Record<string, { bg: string; hover: string; ring: string }> = {
  blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' },
  purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500' },
  green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', ring: 'focus:ring-green-500' },
}

export function EmailGateModal({ isOpen, onClose, onSuccess, accentColor = 'blue' }: EmailGateModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const colors = colorMap[accentColor] || colorMap.blue

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/email-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      onSuccess()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
            <Download className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Download Your PDF Report</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Enter your email to download a formatted clinical report for your patient records.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mb-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent text-sm`}
                autoFocus
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${colors.bg} ${colors.hover} text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Get Your PDF Report
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
            You'll also get access to our free SCAT mastery course with 2 CPD points. No spam, unsubscribe anytime.
          </p>
        </form>
      </div>
    </div>
  )
}
