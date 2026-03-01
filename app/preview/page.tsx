'use client'

import { useState } from 'react'
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
import { getAllModules } from '@/data/modules'
import { CONFIG } from '@/lib/config'
import { CourseSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import CountdownTimer from '@/components/CountdownTimer'
import { PricingOptions } from '@/components/PricingOptions'

const moduleIcons = [Brain, FileText, Activity, Clock, Users, Target, BookOpen, Scale]

export default function PreviewPage() {
  const router = useRouter()
  const modules = getAllModules()
  const [expandedModule, setExpandedModule] = useState<number>(0) // All collapsed by default

  // Find next workshop within 3 weeks
  const now = new Date()
  const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)

  const upcomingWorkshops = Object.entries(CONFIG.LOCATIONS)
    .map(([key, location]) => ({ key, ...location }))
    .filter(location => location.dateObj > now && location.dateObj <= threeWeeksFromNow)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

  const nextWorkshop = upcomingWorkshops[0] || null

  // First TWO sections of ALL modules unlocked (to show breadth)
  const isUnlocked = (moduleId: number, sectionIndex: number) => {
    return sectionIndex === 0 || sectionIndex === 1 // First TWO sections of every module
  }

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
        {/* Sticky Header */}
      <div className="sticky top-0 z-50 glass border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900">
                Course Preview
              </h1>
              <p className="text-xs md:text-sm text-slate-600 hidden sm:block">
                8 online modules + full-day practical · 14 AHPRA CPD hours
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  const pricingEl = document.getElementById('pricing-section')
                  if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-3 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white rounded-lg text-xs md:text-sm font-semibold hover:from-[#5898a0] hover:to-[#5b8d96] transition-all shadow-lg flex items-center gap-1.5 md:gap-2"
              >
                <Sparkles className="w-3.5 md:w-4 h-3.5 md:h-4" />
                <span className="hidden sm:inline">Enroll Now - $1,190</span>
                <span className="sm:hidden">Enroll</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero CTA - More Prominent */}
        <div className="relative bg-gradient-to-br from-[#5b9aa6] via-[#6b9da8] to-[#8a8d8e] rounded-3xl border-2 border-blue-400 p-10 md:p-12 mb-10 overflow-hidden shadow-2xl">
          {/* Animated background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-black mb-6 shadow-lg animate-bounce">
              <Eye className="w-5 h-5" />
              🔥 PREVIEW: 16 Sections Unlocked 🔥
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              Explore the Full Course Structure
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              See exactly what you'll learn across all 8 modules. We've unlocked the <span className="font-bold text-amber-300">first TWO sections</span> of each module
              so you can preview the breadth of content—from acute assessment to return-to-activity protocols. Full course includes <span className="font-bold text-amber-300">100+ sections</span> with
              interactive quizzes, clinical flowcharts, and downloadable resources.
            </p>
            <div className="flex flex-col items-center justify-center gap-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const pricingEl = document.getElementById('pricing-section')
                    if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group px-6 md:px-12 py-4 md:py-5 bg-white text-[#5b9aa6] rounded-2xl text-lg md:text-xl font-black hover:bg-amber-400 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-3 hover:scale-105 transform w-full sm:w-auto"
                >
                  <Sparkles className="w-5 md:w-6 h-5 md:h-6 group-hover:animate-spin flex-shrink-0" />
                  <span className="text-center">Full Course + Workshop - $1,190</span>
                  <ArrowRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
                <button
                  onClick={() => {
                    const pricingEl = document.getElementById('pricing-section')
                    if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group px-6 md:px-12 py-4 md:py-5 bg-white text-[#5b9aa6] rounded-2xl text-lg md:text-xl font-black hover:bg-blue-100 transition-all shadow-2xl flex items-center justify-center gap-2 md:gap-3 hover:scale-105 transform w-full sm:w-auto"
                >
                  <span className="text-center">Online Only - $497</span>
                  <ArrowRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              </div>
              <button
                onClick={() => router.push('/assessment')}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Or Try Free Knowledge Test
              </button>
            </div>
            <p className="text-blue-200 text-sm font-semibold">
              ✓ Choose Any Workshop Date · ✓ 14 CPD points - AHPRA Aligned · ✓ Lifetime Access
            </p>
          </div>
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
            const hasUnlockedContent = true // All modules have first section unlocked

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
                        {hasUnlockedContent && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-[#5b8d96] border border-teal-200 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            PREVIEW AVAILABLE
                          </span>
                        )}
                        {!hasUnlockedContent && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        )}
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
                          <span className="font-medium">{module.sections.length} Sections</span>
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

                {/* Module Sections (Expandable) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6">
                    <div className="space-y-3">
                      {module.sections.map((section, sectionIdx) => {
                        const unlocked = isUnlocked(module.id, sectionIdx)

                        return (
                          <div
                            key={section.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                              unlocked
                                ? 'bg-white border-teal-200 hover:border-teal-400 hover:shadow-md cursor-pointer'
                                : 'bg-slate-100 border-slate-200 opacity-75'
                            }`}
                            onClick={() => {
                              if (unlocked) {
                                router.push(`/modules/${module.id}`)
                              }
                            }}
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                              {unlocked ? (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7ba8b0] to-emerald-600 flex items-center justify-center shadow-sm">
                                  <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-300 flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-slate-500" />
                                </div>
                              )}
                            </div>

                            {/* Section Info */}
                            <div className="flex-1">
                              <h4 className={`text-base font-bold mb-1 ${unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                                {section.title}
                              </h4>
                              {section.content && section.content.length > 0 && (
                                <p className={`text-sm leading-relaxed ${unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                                  {section.content[0].substring(0, 150)}...
                                </p>
                              )}
                              {!unlocked && (
                                <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">
                                  <Lock className="w-3 h-3" />
                                  Enroll to unlock
                                </div>
                              )}
                            </div>

                            {unlocked && (
                              <ChevronRight className="w-5 h-5 text-[#6b9da8] flex-shrink-0 mt-1" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pricing Options */}
        <div id="pricing-section" className="mt-16 mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              Flexible Enrollment
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Choose Your Learning Path
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Can't commit to a workshop date yet? Start with online modules and upgrade anytime.
            </p>
          </div>
          <PricingOptions variant="compact" />
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#5b9aa6] to-[#6b9da8] rounded-2xl p-8 md:p-12 text-white text-center shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              Transform Your Concussion Practice
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Ready to Unlock All 8 Modules + In-Person Training?
            </h2>
            <p className="text-blue-100 mb-6 text-lg leading-relaxed">
              One price includes everything: 8 online modules (8 CPD hrs) + full-day practical workshop (6 CPD hrs)
              = 14 total AHPRA CPD hours. Lifetime access. Flexible workshop dates in Melbourne, Sydney, and Byron Bay.
            </p>
            <button
              onClick={() => router.push('/in-person')}
              className="text-blue-200 hover:text-white underline text-sm font-semibold mb-6"
            >
              View full workshop agenda →
            </button>
            <div className="flex flex-col items-center justify-center gap-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const pricingEl = document.getElementById('pricing-section')
                    if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group px-6 md:px-10 py-3.5 md:py-4 bg-white text-[#5b9aa6] rounded-xl text-base md:text-lg font-bold hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-105 transform w-full sm:w-auto"
                >
                  <span className="text-center">Full Course + Workshop - $1,190</span>
                  <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
                <button
                  onClick={() => {
                    const pricingEl = document.getElementById('pricing-section')
                    if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group px-6 md:px-10 py-3.5 md:py-4 bg-white text-[#5b9aa6] rounded-xl text-base md:text-lg font-bold hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-105 transform w-full sm:w-auto"
                >
                  <span className="text-center">Online Only - $497</span>
                  <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              </div>
              <button
                onClick={() => router.push('/assessment')}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Try Free Knowledge Test
              </button>
            </div>
            <p className="text-blue-100 text-sm">
              Melbourne Feb 7 · Sydney March 7 · Byron Bay March 28 · Code: <span className="font-bold">SCAT6</span> for early bird pricing
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
