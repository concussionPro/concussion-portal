'use client'

import { useState } from 'react'
import { Loader2, Check, ArrowRight } from 'lucide-react'

export function TeamTrainingInquiryForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [format, setFormat] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead-magnet/team-training-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          orgName: orgName.trim() || undefined,
          teamSize: teamSize.trim() || undefined,
          format: format.trim() || undefined,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || 'Submission failed. Try again.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5 mb-2">
          <Check className="w-4 h-4" /> Inquiry received
        </p>
        <p className="text-sm text-emerald-800 leading-relaxed">
          Zac will be in touch personally within 1-2 business days to discuss your team&apos;s training needs. You&apos;ll also get a confirmation email at <strong>{email}</strong>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Email <span className="text-red-600">*</span></label>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@clinic.com.au"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            autoComplete="given-name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic / org name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Optional"
            autoComplete="organization"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Team size</label>
          <select
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          >
            <option value="">— select —</option>
            <option value="under-8">Fewer than 8</option>
            <option value="8-12">8–12 clinicians</option>
            <option value="13-25">13–25 clinicians</option>
            <option value="26-50">26–50 clinicians</option>
            <option value="50+">50+ clinicians</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          >
            <option value="">— select —</option>
            <option value="in-person">In-person at our site</option>
            <option value="online-live">Online — live cohort</option>
            <option value="hybrid">Hybrid (online + in-person workshop)</option>
            <option value="open">Open — discuss options</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Location / city</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Brisbane QLD, Melbourne VIC, Sydney NSW"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Topics of interest, timeline, specific clinician mix, anything else?"
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send inquiry <ArrowRight className="w-4 h-4" /></>}
      </button>

      {error && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      )}

      <p className="text-[10px] text-slate-500 italic">
        Zac responds personally to every team inquiry within 1-2 business days. No spam, no automated sales sequence.
      </p>
    </form>
  )
}
