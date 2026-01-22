'use client'

import { useParams, useRouter } from 'next/navigation'
import { getAllModules } from '@/data/modules'
import { useProgress } from '@/contexts/ProgressContext'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, FileText, PlayCircle, Brain, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function CourseNavigation() {
  const router = useRouter()
  const params = useParams()
  const currentModuleId = parseInt(params.id as string)
  const modules = getAllModules()
  const { isModuleComplete, getModuleProgress } = useProgress()
  const [expandedModules, setExpandedModules] = useState<number[]>([currentModuleId])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const navigateToSection = (moduleId: number, sectionId?: string) => {
    router.push(`/modules/${moduleId}${sectionId ? `#${sectionId}` : ''}`)
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-lg"
        aria-label="Toggle navigation"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-slate-800" />
        ) : (
          <Menu className="w-6 h-6 text-slate-800" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={cn(
        "h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300",
        "w-full sm:w-96 md:w-80",
        "fixed md:sticky md:top-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
            Published
          </span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-start gap-3 text-left hover:opacity-70 transition-all w-full group"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors leading-tight">
              Concussion Clinical Mastery
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Click brain icon to return home</p>
          </div>
        </button>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id)
            const isActive = currentModuleId === module.id
            const isComplete = isModuleComplete(module.id)
            const progress = getModuleProgress(module.id)

            return (
              <div key={module.id} className="space-y-0.5">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2.5 rounded-lg transition-all text-left group",
                    isActive ? "bg-slate-100" : "hover:bg-slate-50"
                  )}
                >
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-0.5 mt-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                  </div>

                  {/* Expand/Collapse Icon */}
                  <div className="mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Module {module.id}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 leading-tight mb-1">
                      {module.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {module.duration} • {module.points} CPD points
                    </div>
                  </div>
                </button>

                {/* Module Sections/Lessons */}
                {isExpanded && (
                  <div className="ml-9 space-y-0.5 mt-0.5">
                    {/* Module Content */}
                    <button
                      onClick={() => navigateToSection(module.id, 'video')}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                        "hover:bg-slate-50"
                      )}
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">
                        Module Content
                      </span>
                      {progress.videoCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 ml-auto" />
                      )}
                      {!progress.videoCompleted && (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-full ml-auto" />
                      )}
                    </button>

                    {/* Content Sections */}
                    {module.sections.map((section, sectionIndex) => (
                      <button
                        key={section.id}
                        onClick={() => navigateToSection(module.id, section.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                          "hover:bg-slate-50"
                        )}
                      >
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 truncate">
                          {section.title}
                        </span>
                      </button>
                    ))}

                    {/* Quiz */}
                    <button
                      onClick={() => navigateToSection(module.id, 'quiz')}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left group",
                        "hover:bg-slate-50"
                      )}
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">
                        Knowledge Check
                      </span>
                      {progress.quizCompleted && (progress.quizScore || 0) >= 2 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 ml-auto" />
                      )}
                      {(!progress.quizCompleted || (progress.quizScore || 0) < 2) && (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-full ml-auto" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Your Progress</span>
            <span className="font-semibold text-slate-800">
              {modules.filter(m => isModuleComplete(m.id)).length} / {modules.length} Modules
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${(modules.filter(m => isModuleComplete(m.id)).length / modules.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
