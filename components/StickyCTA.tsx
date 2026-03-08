'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'

// Pages where the sticky CTA should NOT appear
const EXCLUDED_PATHS = [
  '/pricing',
  '/checkout',
  '/login',
  '/dashboard',
  '/settings',
  '/learning',
  '/modules',
  '/admin',
  '/auth',
  '/scat-course',
  '/scat-forms',
  '/clinical-toolkit',
  '/resources',
  '/references',
  '/complete-reference',
  '/certificate',
]

export function StickyCTA() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Show after scrolling 400px
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('sticky_cta_dismissed')) {
      setDismissed(true)
    }
  }, [])

  // Don't show on excluded paths
  const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p))
  if (isExcluded || dismissed || !visible) return null

  const deadline = CONFIG.EARLY_BIRD_DEADLINE
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('sticky_cta_dismissed', '1')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slideUp">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="hidden sm:block">
              {daysLeft > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold whitespace-nowrap">
                  {daysLeft}d left
                </span>
              )}
            </div>
            <p className="text-sm text-white/80 truncate">
              <span className="font-semibold text-white">Stop guessing on concussion cases.</span>
              <span className="hidden sm:inline"> 14 CPD points</span>
              {daysLeft > 0 && (
                <span className="text-amber-300 font-semibold"> — early bird: save $210</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-white/90 transition-all"
            >
              View Pricing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
