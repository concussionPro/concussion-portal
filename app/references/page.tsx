'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ReferenceRepository } from '@/components/dashboard/ReferenceRepository'
import { useState, useEffect } from 'react'
import { Loader2, Lock, BookOpen, ArrowRight } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { REFERENCE_COUNT } from '@/data/reference-count'

export default function ReferencesPage() {
  const router = useRouter()
  const [accessLevel, setAccessLevel] = useState<'online-only' | 'full-course' | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessChecked, setAccessChecked] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            // Bundle (Reference + Toolkit) buyers get the same access to the
            // reference repository as online-only course holders.
            if (data.user.accessLevel === 'preview') {
              if (data.user.bookOwner) {
                setAccessLevel('online-only')
              } else {
                setIsPreview(true)
              }
            } else {
              setAccessLevel(data.user.accessLevel)
            }
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        setLoading(false)
        setAccessChecked(true)
      }
    }
    checkAccess()
  }, [router])

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-600">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px]">
            {isPreview || !accessLevel ? (
              /* Locked state — shows what they're missing */
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#64a8b0] to-[#7ba8b0] flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Reference Repository
                      </h1>
                      <p className="text-sm text-slate-600 mt-1">
                        {REFERENCE_COUNT} peer-reviewed references supporting the course content
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-teal-50 border-2 border-purple-200 rounded-xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-slate-900 mb-1">
                        Full Reference Library Included With the Course
                      </p>
                      <p className="text-sm text-slate-700 mb-4">
                        Every recommendation in the course is backed by peer-reviewed evidence. Enrol to access the complete searchable reference repository — organised by module, filterable by topic, and linked directly to course content.
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-teal-700 transition-all"
                      >
                        Unlock References — Enrol from ${CONFIG.COURSE.PRICE_ONLINE}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Greyed-out preview of reference categories */}
                <div className="pointer-events-none select-none relative">
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                    {[
                      { title: 'Module 1 — Concussion Foundations', count: 18 },
                      { title: 'Module 2 — Pathophysiology', count: 22 },
                      { title: 'Module 3 — Assessment (SCAT6)', count: 19 },
                      { title: 'Module 4 — Vestibular & Ocular (VOMS)', count: 16 },
                      { title: 'Module 5 — Balance (BESS)', count: 14 },
                      { title: 'Module 6 — Concussion Phenotypes', count: 20 },
                      { title: 'Module 7 — Return-to-Play Protocols', count: 17 },
                      { title: 'Module 8 — Persistent Symptoms (PCS)', count: 18 },
                    ].map((mod, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-500">{mod.title}</span>
                        </div>
                        <span className="text-xs text-slate-400">{mod.count} refs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ReferenceRepository accessLevel={accessLevel} loading={loading} />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
