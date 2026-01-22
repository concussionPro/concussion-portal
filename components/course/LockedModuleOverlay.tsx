'use client'

import { Lock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LockedModuleOverlay({ moduleNumber, moduleTitle }: {
  moduleNumber: number
  moduleTitle: string
}) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-slate-600" strokeWidth={2} />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Module {moduleNumber} is Locked
          </h2>
          <p className="text-base text-slate-600 mb-6 leading-relaxed">
            <span className="font-semibold">{moduleTitle}</span> is part of the full course. Unlock all 8 online modules and earn your CPD points.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xl font-bold text-teal-600 mb-1">8</div>
              <div className="text-xs text-slate-600 leading-tight">Online Modules</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xl font-bold text-teal-600 mb-1">8</div>
              <div className="text-xs text-slate-600 leading-tight">Online CPD</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xl font-bold text-teal-600 mb-1">6</div>
              <div className="text-xs text-slate-600 leading-tight">In-Person CPD</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
              <div className="text-xl font-bold text-blue-600 mb-1">14</div>
              <div className="text-xs text-blue-700 font-semibold leading-tight">Total CPD</div>
            </div>
          </div>

          {/* In-Person Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-900 leading-relaxed">
              <span className="font-semibold">In-Person Component:</span> Course dates posted quarterly. If none work for you, start online modules today and we'll update you with future dates.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <a
              href="https://concussion-education-australia.com/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-center"
            >
              Unlock Full Course - $1,190
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all text-center"
            >
              Return to Dashboard
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Early bird pricing available with code <span className="font-semibold">SCAT6</span>
          </p>
        </div>
      </div>
    </div>
  )
}
