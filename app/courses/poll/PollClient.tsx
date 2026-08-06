'use client'

import { useState, useMemo } from 'react'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import type { PollTopic } from '@/lib/polls'

interface PollClientProps {
  topics: PollTopic[]
  initialTallies: Array<{ topicSlug: string; votes: number }>
  initialVoterCount: number
}

export function PollClient({ topics, initialTallies, initialVoterCount }: PollClientProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tallies, setTallies] = useState(initialTallies)
  const [voterCount, setVoterCount] = useState(initialVoterCount)
  const [error, setError] = useState<string | null>(null)

  const tallyBySlug = useMemo(
    () => Object.fromEntries(tallies.map((t) => [t.topicSlug, t.votes])),
    [tallies]
  )
  const maxVotes = Math.max(1, ...tallies.map((t) => t.votes))

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else if (next.size < 3) next.add(slug)
      return next
    })
    setError(null)
  }

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setError('Pick at least one topic.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email needed to send your 40% launch-week discount.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          topicSlugs: Array.from(selected),
          source: 'poll-page',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not submit vote — try again.')
        setSubmitting(false)
        return
      }
      setTallies(data.tallies || [])
      setVoterCount(data.voterCount || voterCount + 1)
      setSubmitted(true)
    } catch {
      setError('Network error — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    // The confirmation used to REPLACE the topic grid while telling the voter
    // "Live results update below" — there was nothing below, and no next
    // action at all. It is now a banner ABOVE the (now read-only) results, so
    // the sentence is true and the page still has somewhere to go.
    return (
      <>
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-8 py-10 text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-emerald-300 mx-auto mb-4 flex items-center justify-center">
            <Check className="w-7 h-7 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Vote recorded.</h2>
          <p className="text-sm text-foreground/80 mb-4 max-w-md mx-auto leading-relaxed">
            Your picks are counted below. When the winning course is built we&rsquo;ll email{' '}
            <strong>{email}</strong> with the 40% launch-week code.
          </p>
          <p className="text-sm font-semibold text-foreground mb-5">
            {voterCount} clinicians have voted
          </p>
          {/* Was a pure dead end. Everything the voter can act on TODAY lives
              on /courses — the short courses that are already live. */}
          <a
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-foreground/90"
          >
            See the courses that are live now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Read-only tally — the "results below" the banner promises. */}
        <div className="grid sm:grid-cols-2 gap-3">
          {topics.map((t) => {
            const voteCount = tallyBySlug[t.slug] || 0
            const widthPct = (voteCount / maxVotes) * 100
            const isMine = selected.has(t.slug)
            return (
              <div
                key={t.slug}
                className={`rounded-2xl border-2 p-5 ${isMine ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.category}</span>
                  {isMine && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      <Check className="h-3 w-3" /> Your pick
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground leading-tight mb-1.5">{t.title}</h3>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span>~{t.estimatedDurationMin} min · A${t.estimatedPriceAUD}</span>
                  <span className="tabular-nums font-semibold">{voteCount} votes</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Topic grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {topics.map((t) => {
          const isSelected = selected.has(t.slug)
          const voteCount = tallyBySlug[t.slug] || 0
          const widthPct = (voteCount / maxVotes) * 100
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => toggle(t.slug)}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-slate-200 bg-white hover:border-accent/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.category}</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-accent bg-accent' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground leading-tight mb-1.5">{t.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.description}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                <span>~{t.estimatedDurationMin} min · A${t.estimatedPriceAUD}</span>
                <span className="tabular-nums font-semibold">{voteCount} votes</span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Vote count indicator */}
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          {selected.size} of 3 topics selected
        </p>
      </div>

      {/* Email + submit */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4">
        <label className="text-sm font-semibold text-foreground block mb-2">
          Your work email
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          We&rsquo;ll send your 40% launch-week discount code when the winner is built (one course per voter, no spam, unsubscribe anytime).
        </p>
        <input
          type="text"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@clinic.com.au"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {error && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selected.size === 0}
          className="mt-4 w-full px-5 py-3 rounded-xl bg-foreground text-white font-semibold text-base hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Recording vote…' : `Submit ${selected.size > 0 ? `${selected.size} vote${selected.size > 1 ? 's' : ''}` : 'your vote'}`}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </>
  )
}
