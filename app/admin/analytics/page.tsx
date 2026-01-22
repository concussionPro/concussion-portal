'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, MousePointer, Download, Eye, ShoppingCart, BookOpen } from 'lucide-react'

interface AnalyticsSummary {
  totalEvents: number
  uniqueUsers: number
  uniqueSessions: number
  eventsByType: Record<string, number>
  topPages: Record<string, number>
  shopClicks: number
  enrollButtonClicks: number
  moduleCompletions: number
  downloads: number
  avgEventsPerSession: string
}

interface AnalyticsEvent {
  id: string
  userId: string | null
  email: string | null
  timestamp: number
  eventType: string
  eventData: any
  sessionId: string
  userAgent: string
  referrer: string
  path: string
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [timeRange, setTimeRange] = useState('7')
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const fetchAnalytics = async () => {
    if (!authenticated || !adminKey) return

    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/data?days=${timeRange}`, {
        headers: {
          'x-admin-key': adminKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setEvents(data.events.slice(0, 100)) // Show latest 100 events
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated) {
      fetchAnalytics()
    }
  }, [timeRange, authenticated])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Store admin key and authenticate
    setAuthenticated(true)
    fetchAnalytics()
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics Dashboard</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Admin API Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin API key"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-xs text-slate-600">User behavior and conversion tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-slate-200 text-sm font-semibold focus:border-blue-500 focus:outline-none"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-600">Unique Users</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{summary.uniqueUsers}</p>
                <p className="text-xs text-slate-500 mt-1">{summary.uniqueSessions} sessions</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <MousePointer className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-semibold text-slate-600">Total Events</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{summary.totalEvents}</p>
                <p className="text-xs text-slate-500 mt-1">{summary.avgEventsPerSession} avg/session</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-amber-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-semibold text-slate-600">Shop Clicks</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{summary.shopClicks}</p>
                <p className="text-xs text-slate-500 mt-1">{summary.enrollButtonClicks} enroll buttons</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-green-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-slate-600">Module Completions</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{summary.moduleCompletions}</p>
                <p className="text-xs text-slate-500 mt-1">{summary.downloads} downloads</p>
              </div>
            </div>

            {/* Event Types */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Events by Type</h2>
                <div className="space-y-3">
                  {Object.entries(summary.eventsByType)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{type}</span>
                        <span className="text-sm font-bold text-slate-900">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Top Pages</h2>
                <div className="space-y-3">
                  {Object.entries(summary.topPages).map(([path, count]) => (
                    <div key={path} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 truncate">{path}</span>
                      <span className="text-sm font-bold text-slate-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Events</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Time</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">User</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Event Type</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Path</th>
                      <th className="text-left py-2 px-3 text-slate-600 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-medium">
                          {event.email || event.userId || 'Anonymous'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {event.eventType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-xs">
                          {event.path}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-xs truncate max-w-xs">
                          {JSON.stringify(event.eventData).slice(0, 50)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Conversion Funnel</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Total Sessions</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-end px-3"
                      style={{ width: '100%' }}
                    >
                      <span className="text-xs font-bold text-white">{summary.uniqueSessions}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Pricing Views</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-end px-3"
                      style={{
                        width: `${((summary.eventsByType['pricing_view'] || 0) / summary.uniqueSessions) * 100}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">{summary.eventsByType['pricing_view'] || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Shop Clicks</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-end px-3"
                      style={{
                        width: `${(summary.shopClicks / summary.uniqueSessions) * 100}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">{summary.shopClicks}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Enroll Buttons</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-end px-3"
                      style={{
                        width: `${(summary.enrollButtonClicks / summary.uniqueSessions) * 100}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">{summary.enrollButtonClicks}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Shop Click Rate:</span>
                    <span className="ml-2 font-bold text-slate-900">
                      {((summary.shopClicks / summary.uniqueSessions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Enroll Button Rate:</span>
                    <span className="ml-2 font-bold text-slate-900">
                      {((summary.enrollButtonClicks / summary.uniqueSessions) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
