'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Download, ArrowRight, Mail, Loader2 } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

function SuccessContent() {
  const search = useSearchParams()
  const sessionId = search.get('session_id')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }
    // Poll the download endpoint — once it returns 200, the webhook has
    // flagged the user as book_owner and access is live. Usually lands in
    // < 2 s. Fall back to a short timeout if polling fails.
    let cancelled = false
    const startedAt = Date.now()
    async function poll() {
      for (let i = 0; i < 15 && !cancelled; i++) {
        try {
          const res = await fetch('/api/reference/download', { method: 'HEAD' })
          if (res.ok) { setStatus('ok'); return }
        } catch { /* continue */ }
        await new Promise((r) => setTimeout(r, 500))
      }
      if (!cancelled) {
        // After ~7.5s without success, still show OK — user has the receipt
        // email anyway and can retry the download
        console.warn(`Polling took ${Date.now() - startedAt}ms without 200; showing success UI anyway`)
        setStatus('ok')
      }
    }
    poll()
    return () => { cancelled = true }
  }, [sessionId])

  return (
    <>
      <SiteNav />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-[120px] pb-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Payment received — your reference is ready.
          </h1>

          <p className="text-slate-600 mb-8">
            You&apos;ve got lifetime access. The PDF opens in your browser; save a copy to your desktop for offline use.
          </p>

          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Setting up your access...</span>
            </div>
          )}

          {status === 'ok' && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <a
                  href="/api/reference/download"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </a>
                <p className="text-xs text-slate-500 mt-3">
                  Or open directly in your browser and save from there.
                </p>
              </div>

              <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-6 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-teal-900 mb-1">
                      Check your inbox
                    </h3>
                    <p className="text-sm text-teal-800 leading-relaxed mb-3">
                      We&apos;ve sent a confirmation + login link. The PDF also lives inside your ConcussionPro account for lifetime access across devices.
                    </p>
                    <p className="text-sm text-teal-800 leading-relaxed">
                      <strong>Next step:</strong> book owners get A$100 off the full online course (8 CPD hours, interactive quizzes, curated clinical video library, CPD certificate). The reference is Part 1; the course is Part 2.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-900 hover:text-teal-700 mt-2"
                    >
                      See the course →
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === 'error' && (
            <p className="text-red-600 text-sm">
              Something went wrong. Check your email for the receipt — if the PDF link isn&apos;t there, reply to the receipt email and we&apos;ll sort it.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default function BookSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
