'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, Calendar, Mail, Download, CheckCircle, Clock, Eye, Trash2, Loader2 } from 'lucide-react'

interface PaidRegistrant {
  name: string
  email: string
  createdAt: string
  /**
   * Which stream sold the seat. The practical day is SHARED between CCM and
   * CRM, and a CRM buyer's users.access_level stays 'preview' — so they were
   * missing from this board entirely until practicalDayAttendees() unioned
   * both (lib/users.ts). Shown so the roster tells you who's in the room.
   */
  stream?: 'ccm' | 'crm'
}

interface PaidCity {
  city: string
  label: string
  count: number
  threshold: number
  registrants: PaidRegistrant[]
}

interface ReadyRegistration {
  email: string
  name: string
  registeredAt: string
  completedAt: string
}

interface ReadyCity {
  city: string
  label: string
  count: number
  registrations: ReadyRegistration[]
}

interface InterestRegistration {
  email: string
  name: string
  source: string
  createdAt: string
}

interface InterestCity {
  city: string
  label: string
  count: number
  registrations: InterestRegistration[]
}

const TARGET = 8

export default function AdminReadyToTrainPage() {
  const [paidEnrollments, setPaidEnrollments] = useState<PaidCity[]>([])
  const [paidTotal, setPaidTotal] = useState(0)
  const [readyToUpgrade, setReadyToUpgrade] = useState<ReadyCity[]>([])
  const [readyTotal, setReadyTotal] = useState(0)
  const [interest, setInterest] = useState<InterestCity[]>([])
  const [interestTotal, setInterestTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/ready-to-train', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success) {
        setPaidEnrollments(data.paidEnrollments || [])
        setPaidTotal(data.paidTotal || 0)
        setReadyToUpgrade(data.readyToUpgrade || [])
        setReadyTotal(data.readyTotal || 0)
        setInterest(data.interest || [])
        setInterestTotal(data.interestTotal || 0)
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch {
      setError('Failed to fetch workshop pipeline data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInterest = async (email: string, city: string, name: string) => {
    if (!confirm(`Remove ${name || email} (${city}) from interest list? This cannot be undone.`)) return
    const key = `${email}|${city}`
    setDeleting(prev => new Set(prev).add(key))
    try {
      const res = await fetch(
        `/api/admin/workshop-interest-list?email=${encodeURIComponent(email)}&city=${encodeURIComponent(city)}`,
        { method: 'DELETE', cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(`Delete failed: ${data?.error || 'unknown error'}`)
        return
      }
      setInterest(prev =>
        prev
          .map(c =>
            c.city !== city
              ? c
              : {
                  ...c,
                  registrations: c.registrations.filter(r => r.email.toLowerCase() !== email.toLowerCase()),
                  count: c.registrations.filter(r => r.email.toLowerCase() !== email.toLowerCase()).length,
                }
          )
          .filter(c => c.count > 0)
      )
      setInterestTotal(prev => prev - 1)
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'network error'}`)
    } finally {
      setDeleting(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Section', 'City', 'Name', 'Email', 'Date', 'Source'],
      ...paidEnrollments.flatMap(c =>
        c.registrants.map(r => [
          'Paid',
          c.label,
          r.name,
          r.email,
          new Date(r.createdAt).toLocaleDateString(),
          r.stream === 'crm' ? 'stripe (CRM)' : 'stripe (CCM)',
        ])
      ),
      ...readyToUpgrade.flatMap(c =>
        c.registrations.map(r => [
          'Ready to Upgrade',
          c.label,
          r.name,
          r.email,
          new Date(r.registeredAt).toLocaleDateString(),
          'completed-online',
        ])
      ),
      ...interest.flatMap(c =>
        c.registrations.map(r => [
          'Interest',
          c.label,
          r.name,
          r.email,
          new Date(r.createdAt).toLocaleDateString(),
          r.source,
        ])
      ),
    ]
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workshop-pipeline-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading pipeline data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Workshop Pipeline</h1>
          <p className="text-slate-600">
            {paidTotal} paid &middot; {readyTotal} ready to upgrade &middot; {interestTotal} interested
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ═══════════════════ SECTION 1: PAID ENROLLMENTS ═══════════════════ */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-slate-900">Paid Enrollments</h2>
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            {paidTotal} confirmed
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Full-course users who have paid. {TARGET} per city needed to confirm a workshop date.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {paidEnrollments.map(city => {
            const progress = Math.min((city.count / city.threshold) * 100, 100)
            const isReady = city.count >= city.threshold

            return (
              <div
                key={city.city}
                className={`bg-white rounded-lg p-5 shadow-sm border ${
                  isReady ? 'border-green-300 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className={`w-4 h-4 ${isReady ? 'text-green-600' : 'text-green-500'}`} />
                  <h3 className="text-base font-bold text-slate-900">{city.label}</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-2">
                  {city.count} <span className="text-sm font-normal text-slate-500">/ {city.threshold}</span>
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full transition-all ${isReady ? 'bg-green-500' : 'bg-green-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {isReady ? 'Ready to schedule!' : `${city.threshold - city.count} more needed`}
                </p>
              </div>
            )
          })}
        </div>

        {/* Paid registrants table */}
        {paidEnrollments.filter(c => c.count > 0).map(city => (
          <div key={city.city} className="bg-white rounded-lg shadow-sm border border-green-200 mb-4 overflow-hidden">
            <div className="px-6 py-3 border-b border-green-100 bg-green-50">
              <h3 className="text-sm font-bold text-green-800">{city.label} — {city.count} paid</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Stream</th>
                  <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {city.registrants.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {r.email}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.stream === 'crm' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {r.stream === 'crm' ? 'CRM' : 'CCM'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ═══════════════════ SECTION 2: READY TO UPGRADE ═══════════════════ */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Ready to Upgrade</h2>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {readyTotal} waiting
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Online-only users who completed all 8 modules and chose a city. High intent — they want the workshop.
        </p>

        {readyToUpgrade.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 text-center py-10">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No ready-to-upgrade registrations yet</p>
          </div>
        ) : (
          readyToUpgrade.map(city => (
            <div key={city.city} className="bg-white rounded-lg shadow-sm border border-blue-200 mb-4 overflow-hidden">
              <div className="px-6 py-3 border-b border-blue-100 bg-blue-50">
                <h3 className="text-sm font-bold text-blue-800">{city.label} — {city.count} ready</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Email</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Registered</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {city.registrations.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {r.email}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {new Date(r.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* ═══════════════════ SECTION 3: INTEREST ═══════════════════ */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-slate-500" />
          <h2 className="text-xl font-bold text-slate-900">Interest Registrations</h2>
          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
            {interestTotal} interested
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          People who registered interest but haven&apos;t purchased yet. Lower intent — lead gen data.
        </p>

        {interest.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 text-center py-10">
            <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No interest registrations yet</p>
          </div>
        ) : (
          interest.map(city => (
            <div key={city.city} className="bg-white rounded-lg shadow-sm border border-slate-200 mb-4 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700">{city.label} — {city.count} interested</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Email</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Source</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {city.registrations.map((r, i) => {
                    const key = `${r.email}|${city.city}`
                    const isDeleting = deleting.has(key)
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {r.email}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">{r.source}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeleteInterest(r.email, city.city, r.name)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Remove ${r.email} from interest list`}
                            title="Remove from interest list"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
