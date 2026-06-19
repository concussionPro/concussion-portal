'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Mail, MailOpen, Users, ClipboardList, UserPlus, LogOut, Upload, Handshake, GraduationCap, Wrench } from 'lucide-react'

const NAV_LINKS = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/email-analytics', label: 'Email Engagement', icon: MailOpen },
  { href: '/admin/ready-to-train', label: 'Ready to Train', icon: Users },
  { href: '/admin/preseason', label: 'Preseason', icon: ClipboardList },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/create-user', label: 'Create User', icon: UserPlus },
  { href: '/admin/import-contacts', label: 'Import Contacts', icon: Upload },
  { href: '/admin/partnerships', label: 'Partnerships', icon: Handshake },
  { href: '/admin/alumni', label: 'Alumni', icon: GraduationCap },
]

export default function AdminNavBar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1 overflow-x-auto">
          <Link
            href="/admin/analytics"
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
          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex-shrink-0"
            title="Sign out of admin"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
