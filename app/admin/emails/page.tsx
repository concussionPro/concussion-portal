'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Calendar, Clock, Download } from 'lucide-react'

interface EmailEntry {
  id: string
  email: string
  name: string
  accessLevel: string
  createdAt: string
  lastLogin: string | null
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'preview' | 'paid'>('all')

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/admin/emails')
      const data = await response.json()
      if (data.success) {
        setEmails(data.emails)
      }
    } catch (error) {
      console.error('Failed to load emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true
    if (filter === 'preview') return email.accessLevel === 'preview'
    if (filter === 'paid') return email.accessLevel === 'online-only' || email.accessLevel === 'full-course'
    return true
  })

  const exportCSV = () => {
    const csv = [
      ['Email', 'Name', 'Access Level', 'Created At', 'Last Login'],
      ...filteredEmails.map(e => [
        e.email,
        e.name,
        e.accessLevel,
        new Date(e.createdAt).toLocaleDateString(),
        e.lastLogin ? new Date(e.lastLogin).toLocaleDateString() : 'Never',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emails-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading emails...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Email Signups</h1>
          <p className="text-slate-600">All captured emails from free course signups</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-600">Total Signups</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{emails.length}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-600">Free Users</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {emails.filter(e => e.accessLevel === 'preview').length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-600">Paid Users</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {emails.filter(e => e.accessLevel === 'online-only' || e.accessLevel === 'full-course').length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-slate-600">Today</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {emails.filter(e => {
                const created = new Date(e.createdAt)
                const today = new Date()
                return created.toDateString() === today.toDateString()
              }).length}
            </p>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({emails.length})
            </button>
            <button
              onClick={() => setFilter('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'preview' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Free ({emails.filter(e => e.accessLevel === 'preview').length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'paid' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Paid ({emails.filter(e => e.accessLevel === 'online-only' || e.accessLevel === 'full-course').length})
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Email List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Signed Up
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{email.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{email.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          email.accessLevel === 'preview'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {email.accessLevel === 'preview' ? 'Free' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {email.lastLogin ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(email.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmails.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No emails found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
