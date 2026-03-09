'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Lock, ShieldAlert, BarChart3, Mail, Users, ClipboardList, UserPlus } from 'lucide-react'

const NAV_LINKS = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/ready-to-train', label: 'Ready to Train', icon: Users },
  { href: '/admin/preseason', label: 'Preseason', icon: ClipboardList },
  { href: '/admin/create-user', label: 'Create User', icon: UserPlus },
]

/**
 * Admin layout — requires ADMIN_API_KEY to access.
 * Prompts for admin key, stores in sessionStorage only.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [adminKey, setAdminKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if admin key is stored in session
    const storedKey = sessionStorage.getItem('admin_api_key')
    if (storedKey) {
      verifyKey(storedKey)
    } else {
      setIsVerifying(false)
    }
  }, [])

  const verifyKey = async (key: string) => {
    setIsVerifying(true)
    setError('')
    try {
      // Verify against the monitoring endpoint which already checks admin key
      const res = await fetch('/api/admin/monitoring', {
        headers: { 'x-admin-key': key },
      })
      if (res.ok) {
        setAdminKey(key)
        sessionStorage.setItem('admin_api_key', key)
      } else {
        setError('Invalid admin key')
        sessionStorage.removeItem('admin_api_key')
      }
    } catch {
      setError('Failed to verify admin key')
    }
    setIsVerifying(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputKey.trim()) {
      verifyKey(inputKey.trim())
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
            <p className="text-sm text-slate-600">Enter your admin API key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-key" className="block text-sm font-medium text-slate-700 mb-1">
                Admin API Key
              </label>
              <input
                id="admin-key"
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter admin key..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Verify Access
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="block w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavBar />
      {children}
    </div>
  )
}

function AdminNavBar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1 overflow-x-auto">
          <Link
            href="/admin"
            className="text-sm font-bold text-slate-900 mr-4 flex-shrink-0"
          >
            Admin
          </Link>
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
