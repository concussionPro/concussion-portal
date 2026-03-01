'use client'

import { Lock, ArrowRight, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ContentLockedBanner() {
  const router = useRouter()

  return (
    <div className="relative my-8">
      {/* Fade out effect */}
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-white z-10"></div>

      {/* Lock banner */}
      <div className="relative z-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border-2 border-slate-700">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          {/* Headline */}
          <h3 className="text-2xl font-bold text-white mb-3">
            Unlock Full Module Access
          </h3>
          <p className="text-slate-300 text-base mb-6 leading-relaxed max-w-2xl mx-auto">
            You've seen a preview of this module. Get instant access to the <strong className="text-white">complete course</strong>, all 8 modules, downloadable resources, and earn <strong className="text-white">14 CPD hours</strong>.
          </p>

          {/* Value props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-amber-400 mb-1">8</div>
              <div className="text-sm text-slate-300">Complete Modules</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold text-amber-400 mb-1">14</div>
              <div className="text-sm text-slate-300">CPD Hours</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <div className="text-sm text-slate-300">AHPRA Accredited</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/preview')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Enroll Now - $1,190
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-slate-400 text-sm mt-4">
            Includes full-day practical workshop + 8 online modules
          </p>
        </div>
      </div>

      {/* Blur overlay for content below */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-10"></div>
    </div>
  )
}
