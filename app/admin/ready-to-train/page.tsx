'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, Calendar, Mail, Download } from 'lucide-react'

interface Registration {
  email: string
  name: string
  city: string
  registeredAt: string
  completedAt: string
}

interface CityData {
  city: string
  label: string
  count: number
  registrations: Registration[]
}

const TARGET = 8

export default function AdminReadyToTrainPage() {
  const [cities, setCities] = useState<CityData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const adminKey = sessionStorage.getItem('admin_api_key')
    if (!adminKey) {
      setError('Admin key not found. Please re-authenticate.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/ready-to-train', {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCities(data.cities)
        setTotalCount(data.totalCount)
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch {
      setError('Failed to fetch ready-to-train data')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['City', 'Name', 'Email', 'Registered', 'Completed'],
      ...cities.flatMap(c =>
        c.registrations.map(r => [
          c.label,
          r.name,
          r.email,
          new Date(r.registeredAt).toLocaleDateString(),
          r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '',
        ])
      ),
    ]
    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ready-to-train-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading pool data...</p>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ready to Train Pool</h1>
          <p className="text-slate-600">
            {totalCount} total registrations across {cities.length} cities
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cities.map(city => {
          const progress = Math.min((city.count / TARGET) * 100, 100)
          const isReady = city.count >= TARGET

          return (
            <div
              key={city.city}
              className={`bg-white rounded-lg p-6 shadow-sm border ${
                isReady ? 'border-green-300 bg-green-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <MapPin className={`w-5 h-5 ${isReady ? 'text-green-600' : 'text-blue-600'}`} />
                <h3 className="text-lg font-bold text-slate-900">{city.label}</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-2">
                {city.count} <span className="text-base font-normal text-slate-500">/ {TARGET}</span>
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    isReady ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {isReady
                  ? 'Ready to schedule workshop!'
                  : `${TARGET - city.count} more needed`}
              </p>
            </div>
          )
        })}

        {/* Total card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Total</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalCount}</p>
          <p className="text-xs text-slate-500 mt-2">Across all cities</p>
        </div>
      </div>

      {/* Tables per city */}
      {cities.map(city => (
        <div key={city.city} className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">
              {city.label} ({city.count})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Registered</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {city.registrations.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{r.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(r.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {city.registrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No registrations yet</p>
            </div>
          )}
        </div>
      ))}

      {cities.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No ready-to-train registrations yet</p>
          <p className="text-slate-400 text-sm mt-1">Registrations will appear here when users join the pool</p>
        </div>
      )}
    </div>
  )
}
