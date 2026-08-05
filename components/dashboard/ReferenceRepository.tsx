'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Lock, Search, ExternalLink, FileText, Award, Star, Sparkles } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackShopClick, trackEvent, trackSearch } from '@/lib/analytics'
import type { Reference } from '@/data/references'

// The citation database itself lives in data/references.ts (SERVER-only) and
// arrives via the authed GET /api/references once access is confirmed —
// inlining it here compiled the entire paid dataset into a public chunk.

const CATEGORY_LABELS: Array<{ id: string; label: string }> = [
  { id: 'Pathophysiology', label: 'Pathophysiology & Mechanisms' },
  { id: 'Assessment', label: 'Assessment & Diagnosis' },
  { id: 'PPCS & Phenotypes', label: 'Persistent Post-Concussive Symptoms' },
  { id: 'Autonomic', label: 'Autonomic Dysfunction' },
  { id: 'Sleep & Circadian', label: 'Sleep & Circadian' },
  { id: 'CSF & Glymphatic', label: 'CSF & Glymphatic' },
  { id: 'Imaging', label: 'Neuroimaging' },
  { id: 'Biomarkers', label: 'Biomarkers' },
  { id: 'CTE', label: 'Chronic Traumatic Encephalopathy' },
  { id: 'Vestibular & Oculomotor', label: 'Vestibular & Oculomotor' },
  { id: 'Cervicogenic', label: 'Cervicogenic & Musculoskeletal' },
  { id: 'Treatment', label: 'Treatment & Rehabilitation' },
  { id: 'EEG & Neurophysiology', label: 'EEG & Neurophysiology' },
  { id: 'Nutrition', label: 'Nutrition & Supplementation' },
  { id: 'Return to Activity', label: 'Return to Activity' },
  { id: 'Legal & Regulatory', label: 'Legal & Regulatory' },
]

interface ReferenceRepositoryProps {
  accessLevel: 'online-only' | 'full-course' | null
  loading: boolean
}

export function ReferenceRepository({ accessLevel, loading }: ReferenceRepositoryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [references, setReferences] = useState<Reference[]>([])
  const [fetching, setFetching] = useState(false)

  // Both online-only and full-course users have access
  const hasAccess = !!accessLevel

  // The dataset only exists server-side — fetch it once access is confirmed.
  useEffect(() => {
    if (!hasAccess) return
    let alive = true
    setFetching(true)
    void fetch('/api/references', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && Array.isArray(d?.references)) setReferences(d.references)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setFetching(false)
      })
    return () => {
      alive = false
    }
  }, [hasAccess])

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All References', count: references.length },
      ...CATEGORY_LABELS.map(({ id, label }) => ({
        id,
        label,
        count: references.filter(r => r.category === id).length,
      })),
    ],
    [references]
  )

  const filteredReferences = references.filter(ref => {
    const matchesCategory = selectedCategory === 'all' || ref.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.journal.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Track search when user types
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      trackSearch(query, filteredReferences.length)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden">
      {/* Lock overlay for unauthenticated users */}
      {!hasAccess && !loading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Reference Repository Locked
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Access <strong className="text-slate-900">140+ evidence-based references</strong> from leading journals and researchers. Available exclusively to course enrollees.
            </p>
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border-2 border-teal-200">
              <Award className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-xs text-teal-900 font-semibold">
                Premium Resource - Enrol to Unlock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reference Repository</h2>
            <p className="text-sm text-slate-600">140+ evidence-based research articles</p>
          </div>
        </div>
      </div>

      {/* New & Evolving Evidence Section */}
      {(() => {
        const newReferences = references.filter(r => r.isNew)
        if (newReferences.length === 0) return null

        return (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">New &amp; Evolving Evidence</h3>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {newReferences.length} new
              </span>
              {!hasAccess && (
                <span className="ml-auto text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Enrol to access
                </span>
              )}
            </div>

            <div className={`relative rounded-xl border-2 ${hasAccess ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50' : 'border-slate-200 bg-slate-50'} overflow-hidden`}>
              {/* Blur overlay for free users */}
              {!hasAccess && (
                <div className="absolute inset-0 z-10 backdrop-blur-[3px] bg-white/40 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">
                      Stay current with the latest research
                    </p>
                    <p className="text-xs text-slate-600 mb-3 max-w-xs">
                      Enrolees get access to regularly updated evidence — we add new papers as they&apos;re published.
                    </p>
                    <a
                      href="/pricing"
                      onClick={() => trackShopClick('new-evidence-cta', { accessLevel: accessLevel || 'none' })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                    >
                      Unlock Latest Research
                    </a>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                {newReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className={`bg-white rounded-lg p-4 border ${hasAccess ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200'} transition-all ${hasAccess ? 'group' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded">
                            {ref.category}
                          </span>
                          <span className="text-xs text-slate-500">{ref.year}</span>
                          <span className="text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            New
                          </span>
                        </div>
                        <h4 className={`font-bold text-sm leading-snug mb-1 ${hasAccess ? 'text-slate-900 group-hover:text-amber-700' : 'text-slate-500'} transition-colors`}>
                          {ref.title}
                        </h4>
                        <p className={`text-xs ${hasAccess ? 'text-slate-600' : 'text-slate-400'}`}>{ref.authors}</p>
                        <p className={`text-xs italic ${hasAccess ? 'text-slate-500' : 'text-slate-400'}`}>{ref.journal}</p>
                      </div>
                      {hasAccess && (ref.doi || ref.url) && (
                        <a
                          href={ref.doi ? `https://doi.org/${ref.doi}` : ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('reference_view', { referenceId: ref.id, title: ref.title, category: ref.category, isNew: true })}
                          className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-amber-600" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasAccess && (
                <div className="px-4 pb-3">
                  <p className="text-[11px] text-slate-400 text-center">
                    Updated March 2026 — new papers added as they&apos;re published
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Online-only users - upgrade to full course */}
      {accessLevel === 'online-only' && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Upgrade to Full Course + Practical Skills Training
              </h3>
              <p className="text-sm text-slate-700 mb-4">
                You have full access to all online modules and research references. Upgrade to include the full-day hands-on workshop to earn your complete 14 AHPRA CPD hour certificate (8 online + 8 in-person).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/upgrade"
                  onClick={() => trackShopClick('references-online-only-upgrade', { accessLevel: 'online-only' })}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-teal-700 transition-all text-center"
                >
                  Upgrade Now - Add Workshop for ${(CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE).toLocaleString()}
                </a>
                <a
                  href="/in-person"
                  onClick={() => trackEvent('view_workshop_details', { source: 'references-upgrade-banner' })}
                  className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all text-center"
                >
                  View Workshop Details
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by author, title, or journal..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm"
            disabled={!hasAccess}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            disabled={!hasAccess}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cat.label} <span className="ml-1 opacity-75">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* References List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredReferences.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-teal-300 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wide bg-teal-50 px-2 py-1 rounded">
                    {ref.category}
                  </span>
                  <span className="text-xs text-slate-500">{ref.year}</span>
                  {ref.isNew && (
                    <span className="text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug group-hover:text-teal-700 transition-colors">
                  {ref.title}
                </h3>

                <p className="text-sm text-slate-600 mb-1">{ref.authors}</p>
                <p className="text-sm text-slate-500 italic">{ref.journal}</p>
              </div>

              {(ref.doi || ref.url) && (
                <a
                  href={ref.doi ? `https://doi.org/${ref.doi}` : ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('reference_view', { referenceId: ref.id, title: ref.title, category: ref.category })}
                  className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 hover:bg-teal-100 flex items-center justify-center transition-colors group-hover:bg-teal-100"
                >
                  <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!fetching && filteredReferences.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No references found matching your search</p>
        </div>
      )}
    </div>
  )
}
