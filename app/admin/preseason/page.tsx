'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, ClipboardList, Calendar, Mail, Search, QrCode } from 'lucide-react'
import { SstPatientQrCard } from '@/components/sst-trainer/SstPatientQrCard'

interface Clinic {
  clinicName: string
  contactName: string
  email: string
  code: string
  createdAt: string
}

interface Baseline {
  clinicCode: string
  clinicName?: string
  submittedAt: string
  athleteName?: string
  symptomCount?: number
  symptomSeverity?: number
  cognitiveScore?: number
}

export default function AdminPreseasonPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [baselines, setBaselines] = useState<Baseline[]>([])
  const [totalClinics, setTotalClinics] = useState(0)
  const [totalBaselines, setTotalBaselines] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  // Clinic whose SST patient-onboarding QR card is open (null = closed).
  const [qrClinic, setQrClinic] = useState<Clinic | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/preseason', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.success) {
        setClinics(data.clinics)
        setBaselines(data.baselines)
        setTotalClinics(data.totalClinics)
        setTotalBaselines(data.totalBaselines)
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch {
      setError('Failed to fetch preseason data')
    } finally {
      setLoading(false)
    }
  }

  const filteredClinics = clinics.filter(c =>
    !search || c.clinicName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading preseason data...</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Preseason Data</h1>
        <p className="text-slate-600">Clinic registrations and baseline submissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-600">Clinics Registered</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalClinics}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-slate-600">Baselines Submitted</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalBaselines}</p>
        </div>
      </div>

      {/* Search */}
      {clinics.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinic name, contact, or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Clinics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            Registered Clinics ({filteredClinics.length})
          </h2>
        </div>

        {filteredClinics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clinic Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Registered</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SST Patient App</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClinics.map((clinic, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{clinic.clinicName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{clinic.contactName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{clinic.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                        {clinic.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(clinic.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setQrClinic(clinic)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        QR &amp; link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No clinic registrations yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Clinics will appear here once the preseason registration flow is active
            </p>
          </div>
        )}
      </div>

      {/* Baselines Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            Baseline Submissions ({baselines.length})
          </h2>
        </div>

        {baselines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Athlete</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Clinic</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Symptoms</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Severity</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cognitive</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[...baselines].reverse().map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{b.athleteName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {b.clinicName || b.clinicCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">
                      {b.symptomCount != null ? `${b.symptomCount}/22` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">
                      {b.symptomSeverity != null ? `${b.symptomSeverity}/132` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums font-semibold text-slate-900">
                      {b.cognitiveScore != null ? `${b.cognitiveScore}/${b.cognitiveScore > 30 ? 50 : 30}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(b.submittedAt).toLocaleDateString('en-AU')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No baseline submissions yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Submissions will appear here once athletes complete baselines
            </p>
          </div>
        )}
      </div>

      {qrClinic && (
        <SstPatientQrCard
          clinicName={qrClinic.clinicName}
          code={qrClinic.code}
          onClose={() => setQrClinic(null)}
        />
      )}
    </div>
  )
}
