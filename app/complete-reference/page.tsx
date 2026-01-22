'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BookMarked, Download, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function CompleteReferencePage() {
  useAnalytics()
  const [accessLevel, setAccessLevel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
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
  }, [])

  const hasAccess = accessLevel === 'online-only' || accessLevel === 'full-course'

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px]">
            {/* Header Card */}
            <div className="glass rounded-xl p-6 mb-6 border-l-4 border-[#64a8b0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Complete Clinical Reference 2026
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive concussion management guide - All protocols in one document
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-3 mt-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>📄 5.8 MB PDF</span>
                  <span>•</span>
                  <span>📑 Comprehensive protocols & flowcharts</span>
                  <span>•</span>
                  <span>🔄 Updated January 2026</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="glass rounded-xl p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">Checking access...</p>
              </div>
            ) : !hasAccess ? (
              <div className="glass rounded-xl p-8 text-center border-2 border-amber-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <BookMarked className="w-8 h-8 text-amber-600" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Premium Access Required
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Complete Clinical Reference is available to enrolled students.
                </p>
                <a
                  href="https://concussion-education-australia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                >
                  Enroll Now
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <>
                {/* Download Card */}
                <div className="glass rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-foreground mb-2">
                        📖 CCM Complete Reference 2026
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        All-in-one clinical reference guide covering every aspect of concussion management.
                        Includes assessment protocols, treatment algorithms, return-to-activity flowcharts,
                        legal considerations, and clinical pearls.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-accent">✓</span>
                          <span>Evidence-based protocols</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-accent">✓</span>
                          <span>Clinical decision flowcharts</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-accent">✓</span>
                          <span>Assessment tools & forms</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-accent">✓</span>
                          <span>Treatment algorithms</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <a
                        href="/api/complete-reference"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                      <a
                        href="/api/complete-reference"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary px-6 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Online
                      </a>
                    </div>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="glass rounded-xl p-2">
                  <iframe
                    src="/api/complete-reference"
                    className="w-full rounded-lg"
                    style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                    title="Complete Clinical Reference 2026"
                  />
                </div>

                {/* Usage Tips */}
                <div className="glass rounded-xl p-6 mt-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">
                    💡 How to Use This Reference
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span><strong>Bookmark key sections</strong> for quick access during clinical sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span><strong>Print specific protocols</strong> you use frequently for clinic binders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span><strong>Cross-reference with course modules</strong> for deeper understanding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span><strong>Use flowcharts</strong> to guide clinical decision-making with patients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span><strong>Download to your device</strong> for offline access in clinical settings</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
