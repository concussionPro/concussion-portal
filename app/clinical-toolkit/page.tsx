'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getCurrentUser } from '@/lib/auth'
import { FileText, Download, Lock, CheckCircle2, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CONFIG } from '@/lib/config'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackDownload, trackShopClick, trackEvent } from '@/lib/analytics'

interface ToolkitResource {
  id: string
  title: string
  description: string
  fileSize: string
  category: 'assessment' | 'treatment' | 'templates' | 'education' | 'flowcharts'
  isFree: boolean
  fileName: string
}

const toolkitResources: ToolkitResource[] = [
  {
    id: 'scat6',
    title: 'SCAT6 Fillable',
    description: 'Sport Concussion Assessment Tool (6th Edition) - Fillable PDF for comprehensive concussion assessment',
    fileSize: '3.5 MB',
    category: 'assessment',
    isFree: false,
    fileName: 'SCAT6_Fillable.pdf'
  },
  {
    id: 'scoat6',
    title: 'SCOAT6 Fillable',
    description: 'Sport Concussion Office Assessment Tool (6th Edition) - Streamlined clinical assessment',
    fileSize: '12.6 MB',
    category: 'assessment',
    isFree: false,
    fileName: 'SCOAT6_Fillable.pdf'
  },
  {
    id: 'cheat-sheet',
    title: 'Concussion Clinical Cheat Sheet',
    description: 'Quick reference guide for acute concussion management and red flags',
    fileSize: '146 KB',
    category: 'assessment',
    isFree: false,
    fileName: 'Concussion Clinical Cheat Sheet.pdf'
  },
  {
    id: 'myth-buster',
    title: 'Concussion Myth-Buster Sheet',
    description: 'Educational resource debunking common concussion myths for patients and families',
    fileSize: '47 KB',
    category: 'education',
    isFree: false,
    fileName: 'Concussion Myth-Buster Sheet .pdf'
  },
  {
    id: 'pcs-flowchart',
    title: 'Post-Concussion Syndrome (PCS) Clinical Flowchart',
    description: 'Diagnostic and management decision tree for persistent post-concussion symptoms',
    fileSize: '96 KB',
    category: 'flowcharts',
    isFree: false,
    fileName: 'Post-Concussion Syndrome (PCS) Clinical Flowchart.pdf'
  },
  {
    id: 'referral-flowchart',
    title: 'Referral Flowchart',
    description: 'Multidisciplinary referral pathways and clinical decision-making guide',
    fileSize: '53 KB',
    category: 'flowcharts',
    isFree: false,
    fileName: 'Referral Flowchart.pdf'
  },
  {
    id: 'rtp-rtl',
    title: 'Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder',
    description: 'Evidence-based graduated return-to-activity protocols with stage-by-stage guidance',
    fileSize: '78 KB',
    category: 'treatment',
    isFree: false,
    fileName: 'Return-to-Play (RTP) & Return-to-Learn (RTL) Progression Ladder.pdf'
  },
  {
    id: 'rts-template',
    title: 'Return-to-School Plan Template',
    description: 'Customizable template for school accommodations and graduated return-to-learn planning',
    fileSize: '9 KB',
    category: 'templates',
    isFree: false,
    fileName: 'Return-to-School Plan Template (DOCX).docx'
  },
  {
    id: 'employer-letter',
    title: 'Employer / School Letter Template',
    description: 'Professional letter template for workplace and educational accommodations',
    fileSize: '7.5 KB',
    category: 'templates',
    isFree: false,
    fileName: 'Employer _ School Letter Template.docx'
  },
  {
    id: 'email-templates',
    title: 'Email Template Pack',
    description: 'Professional email templates for patient communication and follow-up',
    fileSize: '7.4 KB',
    category: 'templates',
    isFree: false,
    fileName: 'Email Template Pack.docx'
  },
  {
    id: 'patient-expectations',
    title: '"What to Expect After a Concussion"',
    description: 'Patient education handout explaining recovery timeline and symptom management',
    fileSize: '83 KB',
    category: 'education',
    isFree: false,
    fileName: '"What to Expect After a Concussion" .pdf'
  },
  {
    id: 'rehab-flow',
    title: 'RehabFlow Clinical Pathway',
    description: 'Visual rehabilitation flowchart for concussion recovery progression',
    fileSize: '216 KB',
    category: 'flowcharts',
    isFree: false,
    fileName: 'RehabFlow.png'
  },
]

const categoryLabels = {
  assessment: 'Assessment Tools',
  treatment: 'Treatment Protocols',
  templates: 'Clinical Templates',
  education: 'Patient Education',
  flowcharts: 'Clinical Flowcharts'
}

export default function ClinicalToolkitPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [accessLevel, setAccessLevel] = useState<'online-only' | 'full-course' | null>(null)
  const [loading, setLoading] = useState(true)
  useAnalytics() // Track page views

  useEffect(() => {
    // Check session-based access level
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            // CRITICAL: Preview users should NOT access clinical toolkit - redirect to SCAT course
            if (data.user.accessLevel === 'preview') {
              router.push('/scat-course')
              return
            }

            setAccessLevel(data.user.accessLevel)
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [router])

  const filteredResources = selectedCategory === 'all'
    ? toolkitResources
    : toolkitResources.filter(r => r.category === selectedCategory)

  const handleDownload = (resource: ToolkitResource) => {
    // Both online-only and full-course users have access to toolkit
    if (!accessLevel) {
      trackShopClick('toolkit-locked-resource', { resourceId: resource.id, resourceTitle: resource.title })
      router.push('/preview')
      return
    }

    // Track download
    trackDownload(resource.fileName, resource.category, { resourceId: resource.id, resourceTitle: resource.title })

    // Download file via API endpoint
    window.open(`/api/download?file=${encodeURIComponent(resource.fileName)}`, '_blank')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px]">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#64a8b0] to-[#7ba8b0] flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Clinical Toolkit
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Professional resources for concussion assessment and management
                  </p>
                </div>
              </div>

              {/* Unauthenticated users - prompt to enroll */}
              {!accessLevel && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Star className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Unlock Full Toolkit Access
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Enroll to access all clinical resources, templates, flowcharts, and assessment tools.
                    </p>
                    <button
                      onClick={() => router.push('/preview')}
                      className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              )}

              {/* Online-only users - upgrade to full course */}
              {accessLevel === 'online-only' && (
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Upgrade to Full Course + Practical Skills Training
                      </h3>
                      <p className="text-sm text-slate-700 mb-4">
                        You have full access to all online modules and clinical toolkit. Upgrade to include the full-day hands-on workshop to earn your complete 14 AHPRA CPD certificate (8 online + 6 in-person).
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            trackShopClick('toolkit-online-only-upgrade', { accessLevel: 'online-only' })
                            router.push('/preview')
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-teal-700 transition-all text-center"
                        >
                          Upgrade Now - Add Workshop for $693
                        </button>
                        <button
                          onClick={() => {
                            trackEvent('view_workshop_details', { source: 'toolkit-upgrade-banner' })
                            router.push('/in-person')
                          }}
                          className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all text-center"
                        >
                          View Workshop Dates and Locations
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#5b9aa6] text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                }`}
              >
                All Resources
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === key
                      ? 'bg-[#5b9aa6] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                // All resources are locked for unauthenticated users
                // Both online-only and full-course users get full access
                const isLocked = !accessLevel

                return (
                  <div
                    key={resource.id}
                    className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                      isLocked
                        ? 'border-slate-200 opacity-60'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-lg cursor-pointer'
                    }`}
                    onClick={() => !isLocked && handleDownload(resource)}
                  >
                    {/* Icon and Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isLocked
                          ? 'bg-slate-100'
                          : 'bg-gradient-to-br from-blue-50 to-teal-50'
                      }`}>
                        {isLocked ? (
                          <Lock className="w-6 h-6 text-slate-400" strokeWidth={2} />
                        ) : resource.isFree ? (
                          <CheckCircle2 className="w-6 h-6 text-[#6b9da8]" strokeWidth={2} />
                        ) : (
                          <FileText className="w-6 h-6 text-[#5b9aa6]" strokeWidth={2} />
                        )}
                      </div>

                      {resource.isFree && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200">
                          FREE
                        </span>
                      )}

                      {isLocked && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          LOCKED
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className={`text-lg font-bold mb-2 ${
                      isLocked ? 'text-slate-500' : 'text-slate-900'
                    }`}>
                      {resource.title}
                    </h3>

                    <p className={`text-sm leading-relaxed mb-4 ${
                      isLocked ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {resource.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">
                        {resource.fileSize}
                      </span>

                      {!isLocked && (
                        <button className="flex items-center gap-1 text-sm font-semibold text-[#5b9aa6] hover:text-[#5898a0] transition-colors">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}

                      {isLocked && (
                        <button className="flex items-center gap-1 text-sm font-semibold text-slate-400">
                          <Lock className="w-4 h-4" />
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty State */}
            {filteredResources.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-slate-600 font-medium">No resources found in this category</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
