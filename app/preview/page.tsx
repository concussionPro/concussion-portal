'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lock,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  PlayCircle,
  FileText,
  Brain,
  Activity,
  Target,
  Users,
  BookOpen,
  Scale,
  Zap,
  Eye,
} from 'lucide-react'
import { getPreviewModules } from '@/data/preview-modules'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { CourseSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import { PricingOptions } from '@/components/PricingOptions'
import { PreviewSectionContent } from '@/components/course/PreviewSectionContent'
import { EmailCaptureInline } from '@/components/EmailCaptureInline'

const moduleIcons = [Brain, FileText, Activity, Clock, Users, Target, BookOpen, Scale]

interface PreviewModuleData {
  id: number
  title: string
  subtitle: string
  duration: string
  points: number
  description: string
  totalSections: number
  previewSections: { id: string; title: string; content: string[] }[]
  sectionTitles: string[]
}

export default function PreviewPage() {
  const router = useRouter()
  const modules = getPreviewModules()
  const [expandedModule, setExpandedModule] = useState<number>(0)
  const [previewContent, setPreviewContent] = useState<PreviewModuleData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchPreviewContent() {
      setLoading(true)
      try {
        const res = await fetch('/api/preview-content')
        if (res.ok) {
          const data = await res.json()
          setPreviewContent(data)
        }
      } catch (error) {
        console.error('Failed to fetch preview content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPreviewContent()
  }, [])

  const toggleModule = (moduleId: number) => {
    setExpandedModule(expandedModule === moduleId ? 0 : moduleId)
  }

  return (
    <>
      {/* Schema Markup for SEO */}
      <CourseSchema />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Course Preview', url: '/preview' },
      ]} />

      <div className="min-h-screen bg-slate-50">
        <SiteNav />

      <div className="max-w-7xl mx-auto px-6 pt-[80px] pb-8">
        {/* Hero - Value-First */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-[#5b8d96] px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Eye className="w-4 h-4" />
            Preview Free — No Signup Required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
            Explore the Course Before You Commit
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Preview Module 1 content — from concussion myths to injury mechanisms — and see
            the quality of all 8 modules. The full course includes 100+ sections with
            interactive quizzes, clinical flowcharts, and downloadable resources.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#64a8b0] to-[#7ba8b0] flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Quizzes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Clinical reasoning questions throughout each module with detailed explanations
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7ba8b0] to-emerald-500 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Clinical Flowcharts</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Step-by-step decision trees and assessment protocols for real-world application
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Visual Infographics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Key concepts, clinical insights, and warnings presented visually for retention
            </p>
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-4">
          {modules.map((module, idx) => {
            const ModuleIcon = moduleIcons[idx]
            const isExpanded = expandedModule === module.id
            const preview = previewContent.find(p => p.id === module.id)

            return (
              <div
                key={module.id}
                className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-blue-300 hover:shadow-lg"
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(module.id)}
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-5">
                    {/* Module Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#64a8b0] to-[#7ba8b0] flex items-center justify-center shadow-lg">
                        <ModuleIcon className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-slate-500 tracking-wider">
                          MODULE {module.id}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          PREVIEW AVAILABLE
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                        {module.title}
                      </h3>
                      <p className="text-sm text-[#5b9aa6] font-semibold mb-3">
                        {module.subtitle}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{module.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">1 CPD Point</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{preview ? `${preview.totalSections} Sections` : 'Interactive Content'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: Section Content + Lock Overlay */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6 animate-fadeInUp">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : preview && preview.previewSections.length > 0 ? (
                      <div className="space-y-6">
                        {/* All unlocked sections */}
                        {preview.previewSections.map((section, sIdx) => (
                          <PreviewSectionContent
                            key={section.id}
                            moduleId={module.id}
                            section={section}
                            sectionNumber={sIdx + 1}
                          />
                        ))}

                        {/* Lock overlay: remaining locked sections (modules 2-8) */}
                        {preview.sectionTitles.length > preview.previewSections.length && (
                          <div className="relative">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                                  <Lock className="w-4 h-4" />
                                  {preview.sectionTitles.length - preview.previewSections.length} more sections in this module
                                </div>
                              </div>
                              <div className="p-4 space-y-2">
                                {preview.sectionTitles.slice(preview.previewSections.length).map((title, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 opacity-60"
                                  >
                                    <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <span className="text-sm text-slate-500 truncate">{title}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="p-4 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => router.push('/pricing')}
                                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#64a8b0] to-[#7ba8b0] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Enrol to unlock all {preview.totalSections} sections
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500 mb-4">Preview content loading...</p>
                        <button
                          onClick={() => router.push('/pricing')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#64a8b0] to-[#7ba8b0] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          <Lock className="w-4 h-4" />
                          Enrol to access
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Email capture — after content preview, before knowledge check */}
        <div className="mt-10 mb-10 max-w-2xl mx-auto">
          <EmailCaptureInline />
        </div>

        {/* Quick Knowledge Check — after content preview so users see value first */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 md:p-8 mt-10 mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Quick Knowledge Check</h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">Test your concussion management knowledge.</p>
          <div className="space-y-4">
            {[
              {
                q: 'A 16-year-old athlete passes the SCAT6 cognitive screen 15 minutes post-impact. Can they return to play?',
                a: 'No. A normal cognitive screen does NOT clear an athlete. The SCAT6 is one component of a multi-domain assessment, and no same-day return to play is permitted for anyone under 18.',
              },
              {
                q: 'An athlete reports zero symptoms 48 hours post-concussion. Are they recovered?',
                a: 'Not necessarily. Symptom resolution does not equal brain recovery. A graduated return-to-sport protocol must be completed, and some deficits (balance, vestibular-ocular) may persist despite symptom clearance.',
              },
              {
                q: 'You perform the BESS test and the athlete has 4 errors on double-leg stance. Is this abnormal?',
                a: 'It depends on their baseline. Without pre-injury baseline data, you can\'t determine if this represents a change. This is why baseline testing is critical — and why this course teaches you to interpret scores in context.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer list-none flex items-start gap-3 hover:bg-slate-100 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.q}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 ml-auto group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-4 pl-14">
                  <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => router.push('/assessment')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
            >
              Take the Full Knowledge Test
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500">Free — see where you stand</span>
          </div>
        </div>

        {/* Pricing Options */}
        <div id="pricing-section" className="mt-16 mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              Flexible Enrolment
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Choose Your Learning Path
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start online at your own pace, or get the full certification with hands-on workshop.
            </p>
          </div>
          <PricingOptions variant="compact" />
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#5b9aa6] opacity-[0.08] blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-emerald-500 opacity-[0.06] blur-[80px] pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-tight">
                  Stop second-guessing your concussion assessments.
                </h2>
                <p className="text-white/60 mb-6 leading-relaxed">
                  8 modules covering everything from acute sideline assessment to return-to-play clearance. Add a full-day practical for hands-on SCAT6, VOMS, and BESS training.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const pricingEl = document.getElementById('pricing-section')
                      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="group px-6 py-3.5 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    View Pricing
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.push('/assessment')}
                    className="px-6 py-3.5 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Free Knowledge Test
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: '14 CPD Points', desc: '8 online + 6 workshop' },
                  { label: 'Lifetime Access', desc: 'Content updated regularly' },
                  { label: 'Clinical Toolkit', desc: 'Flowcharts, templates, forms' },
                  { label: 'Flexible Dates', desc: `Next workshops ${CONFIG.WORKSHOP.NEXT_ROUND}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-xs text-white/50 ml-2">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
