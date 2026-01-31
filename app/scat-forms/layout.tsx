'use client'

import { usePathname, useRouter } from 'next/navigation'
import { FileText, ArrowLeft, GraduationCap, Sparkles } from 'lucide-react'
import { CONFIG } from '@/lib/config'

export default function SCATFormsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const isSCAT6 = pathname?.includes('/scat6')
  const isSCOAT6 = pathname?.includes('/scoat6')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SCAT Forms Suite</h1>
              <p className="text-sm text-slate-500">World Standard Concussion Assessment Tools</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SCAT6 Card */}
            <button
              onClick={() => router.push('/scat-forms/scat6')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isSCAT6
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${isSCAT6 ? 'bg-blue-500' : 'bg-blue-100'}`}>
                  <FileText className={`w-6 h-6 ${isSCAT6 ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">SCAT6™</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Sport Concussion Assessment Tool
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• For Adolescents (13+) & Adults</p>
                    <p>• Acute phase (within 72 hours to 7 days)</p>
                    <p>• 9 pages • On-field & Off-field assessment</p>
                  </div>
                </div>
              </div>
            </button>

            {/* SCOAT6 Card */}
            <button
              onClick={() => router.push('/scat-forms/scoat6')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isSCOAT6
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${isSCOAT6 ? 'bg-purple-600' : 'bg-purple-100'}`}>
                  <FileText className={`w-6 h-6 ${isSCOAT6 ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">SCOAT6™</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Sport Concussion Office Assessment Tool
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• For Adolescents (13+) & Adults</p>
                    <p>• Office environment (3-30 days post-injury)</p>
                    <p>• 15 pages • Comprehensive clinical assessment</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Course Promotion Banner - Subtle Sales Funnel */}
        {(isSCAT6 || isSCOAT6) && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6 mb-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Confident using this form clinically?</h3>
                  <span className="badge text-xs">14 CPD Hours</span>
                </div>
                <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                  <strong>Most clinicians miss subtle signs.</strong> Beyond the form: master VOMS interpretation, vestibular red flags, BESS scoring nuances, and evidence-based RTP decisions. AHPRA-accredited with hands-on practice.
                </p>
                <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">🔥 Limited workshop spots</span>
                  <span>•</span>
                  <span>500+ Australian clinicians trained</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push('/preview')}
                    className="text-sm px-4 py-2 bg-white border-2 border-blue-400 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    Preview Course Free
                  </button>
                  <a
                    href={CONFIG.SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
                  >
                    Secure Your Spot →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        {children}
      </div>
    </div>
  )
}
