'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { BookMarked, Download, ExternalLink, AlertCircle, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { REFERENCE_COUNT } from '@/data/reference-count'

/**
 * Complete Clinical Reference viewer.
 *
 * PDF lives in private-docs/ and is served ONLY via app/docs/[...slug] (middleware
 * entitlement first). Do NOT blob-fetch through /api/reference/download — that
 * buffered ~5.8MB through serverless (4.5MB cap) and left the UI on Loading forever.
 *
 * Demo cookies can mint a synthetic full-course session user, but middleware
 * never streams paid /docs for demo — treat demo as gated with clearer copy
 * (never a broken entitled iframe).
 */
export default function CompleteReferencePage() {
  const router = useRouter()
  const [accessLevel, setAccessLevel] = useState<string | null>(null)
  const [bookOwner, setBookOwner] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewFailed, setPreviewFailed] = useState(false)

  // Gated dynamic route → private-docs (streamed). Same path Download uses.
  const pdfUrl = '/docs/CCM_Complete_Reference_2026.pdf'

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)

    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            if (data.user.isDemo) setIsDemo(true)
            if (data.user.accessLevel !== 'preview') {
              setAccessLevel(data.user.accessLevel)
            }
            if (data.user.bookOwner) setBookOwner(true)
          }
        }
      } catch (error) {
        console.error('Access check failed:', error)
      } finally {
        window.clearTimeout(timeout)
        setLoading(false)
      }
    }

    checkAccess()
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [router])

  const entitled =
    accessLevel === 'online-only' || accessLevel === 'full-course' || bookOwner
  const hasAccess = entitled && !isDemo

  // Soft probe so a denied stream fails closed to download options (iframe
  // often fires no onError for PDF MIME).
  useEffect(() => {
    if (!hasAccess || typeof window === 'undefined') return
    const controller = new AbortController()
    const t = window.setTimeout(() => controller.abort(), 15000)
    fetch(pdfUrl, { method: 'HEAD', credentials: 'include', signal: controller.signal })
      .then((r) => {
        if (!r.ok) setPreviewFailed(true)
      })
      .catch(() => {
        /* HEAD may be unsupported — leave iframe + blank fallback UI */
      })
      .finally(() => window.clearTimeout(t))
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [hasAccess, pdfUrl])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6 max-w-[1400px]">
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
                    Comprehensive concussion management guide — All protocols in one document
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-3 mt-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>5.8 MB PDF</span>
                  <span>•</span>
                  <span>Comprehensive protocols & flowcharts</span>
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
                  {isDemo ? 'Included with enrolment' : 'Included with the course'}
                </h2>
                <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                  {isDemo
                    ? 'You\u2019re in a demo browse. The Complete Clinical Reference (5.8 MB PDF) streams for Online and Complete students via a real student login — demo cookies cannot open paid /docs.'
                    : 'The Complete Clinical Reference streams for enrolled Online and Complete students (and Reference+Toolkit owners). Sign in with your student account, or enrol to unlock it.'}
                </p>
                <ul className="mx-auto mb-5 max-w-sm list-none space-y-1 text-left">
                  {['256 referenced pages — the full clinical text', 'Assessment: SCAT6, VOMS, BESS, cervical, oculomotor', 'Phenotype-directed management & PPCS pathways', 'Return-to-play / learn / work frameworks', `${REFERENCE_COUNT} citations, linked to the reference repository`].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]/50" />{t}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="/pricing"
                    className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                  >
                    Enrol Now
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="/login?redirect=/complete-reference"
                    className="btn-secondary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
                  >
                    Student login
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="glass rounded-xl p-5 sm:p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                        CCM Complete Reference 2026
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        All-in-one clinical reference guide covering every aspect of concussion management.
                        Includes assessment protocols, treatment algorithms, return-to-activity flowcharts,
                        legal considerations, and clinical pearls.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>Evidence-based protocols</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>Clinical decision flowcharts</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>Assessment tools & forms</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          <span>Treatment algorithms</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-shrink-0">
                      <a
                        href={pdfUrl}
                        download="CCM_Complete_Reference_2026.pdf"
                        className="btn-primary px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                      >
                        <Download className="w-4 h-4 flex-shrink-0" />
                        Download PDF
                      </a>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        View in New Tab
                      </a>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-2">
                  {!previewFailed ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full rounded-lg bg-white"
                      style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                      title="Complete Clinical Reference 2026"
                      onError={() => setPreviewFailed(true)}
                    />
                  ) : (
                    <div className="w-full rounded-lg bg-white flex flex-col items-center justify-center py-16 px-4" style={{ minHeight: '400px' }}>
                      <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        PDF Preview Unavailable
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                        Your browser couldn&apos;t load the inline preview. Use Download PDF or View in New Tab above.
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={pdfUrl}
                          download="CCM_Complete_Reference_2026.pdf"
                          className="px-5 py-2.5 bg-[#5b9aa6] text-white rounded-lg font-semibold text-sm hover:bg-[#4a8a96] transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </a>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in New Tab
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Fallback if iframe stays blank (some browsers fire no onError for PDF MIME). */}
                  {!previewFailed && (
                    <p className="print:hidden text-center text-[11px] text-slate-500 mt-2 mb-1">
                      Preview blank?{' '}
                      <button
                        type="button"
                        className="underline text-accent font-semibold"
                        onClick={() => setPreviewFailed(true)}
                      >
                        Show download options
                      </button>
                      {' '}or use Download PDF / View in New Tab above.
                    </p>
                  )}
                </div>

                <div className="glass rounded-xl p-6 mt-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">
                    How to Use This Reference
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
