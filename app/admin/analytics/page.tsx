'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, Users, MousePointer, ShoppingCart, TrendingUp } from 'lucide-react'

interface AnalyticsStats {
  totalEvents: number
  eventTypes: Record<string, number>
  uniqueUsers: number
  uniqueSessions: number
  topPages: Record<string, number>
  topButtons: Record<string, number>
}

const COLORS = ['#5b9aa6', '#6b9da8', '#7ba8b0', '#8ab2b8', '#9abcc0', '#aac6c8']

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentEvents, setRecentEvents] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/track')
      const data = await response.json()
      setStats(data.stats)
      setRecentEvents(data.recentEvents || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b9aa6] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Failed to load analytics</p>
      </div>
    )
  }

  // Prepare chart data
  const eventTypesData = Object.entries(stats.eventTypes).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    count: value,
  }))

  const topPagesData = Object.entries(stats.topPages).map(([name, value]) => ({
    name,
    views: value,
  }))

  const topButtonsData = Object.entries(stats.topButtons).map(([name, value]) => ({
    name,
    clicks: value,
  }))

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">User behavior and conversion tracking</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#5b9aa6]" />
              <span className="text-sm font-medium text-slate-600">Total Events</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalEvents.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#6b9da8]" />
              <span className="text-sm font-medium text-slate-600">Unique Users</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.uniqueUsers}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#7ba8b0]" />
              <span className="text-sm font-medium text-slate-600">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.uniqueSessions}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-5 h-5 text-[#8ab2b8]" />
              <span className="text-sm font-medium text-slate-600">Button Clicks</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {(stats.eventTypes.button_click || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Event Types */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Event Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {eventTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Pages</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPagesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#5b9aa6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Buttons */}
        {Object.keys(stats.topButtons).length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Button Clicks</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topButtonsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clicks" fill="#6b9da8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Events (Last 100)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Timestamp</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Event Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">User</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, index) => (
                  <tr key={event.id || index} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-slate-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {event.email || event.userId || 'Anonymous'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-xs">
                      {JSON.stringify(event.eventData)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
