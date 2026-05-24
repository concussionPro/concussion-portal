'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Loader2 } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
}

interface QuizResult {
  passed: boolean
  score: number
  total: number
  passMark: number
  feedback: Array<{
    questionId: string
    correct: boolean
    correctIndex: number
    rationale: string
  }>
  certificate: null | {
    certificateId: string
    name: string
    email: string
    issuedAt: string
    expiresAt: string
    isValid: boolean
  }
}

export function QuizClient({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  const handleSubmit = async () => {
    setError(null)
    if (!allAnswered) {
      setError('Answer all questions before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai-course/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
          })),
        }),
      })
      if (!res.ok) {
        setError('Submission failed — please try again.')
        return
      }
      const data: QuizResult = await res.json()
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Network error — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div>
        <div className={`rounded-2xl p-6 mb-8 ${
          result.passed
            ? 'bg-emerald-50 border-2 border-emerald-300'
            : 'bg-amber-50 border-2 border-amber-300'
        }`}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2">
            {result.passed ? '✓ Passed' : 'Not yet'}
          </p>
          <p className="text-4xl font-bold text-foreground mb-2">
            {result.score} / {result.total}
          </p>
          <p className="text-sm text-muted-foreground">
            Pass mark: {result.passMark} / {result.total}. {result.passed ? 'Your certificate has been issued.' : 'Review the feedback below and re-attempt.'}
          </p>
          {result.passed && result.certificate && (
            <Link
              href={`/courses/ai-in-clinical-practice/certificate`}
              className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              View certificate →
            </Link>
          )}
        </div>

        <h2 className="text-lg font-bold mb-4">Feedback</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const fb = result.feedback.find((f) => f.questionId === q.id)
            if (!fb) return null
            return (
              <div key={q.id} className="card rounded-xl p-5">
                <div className="flex items-start gap-3 mb-2">
                  {fb.correct ? (
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      {i + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            idx === fb.correctIndex
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium'
                              : idx === answers[q.id]
                                ? 'bg-red-50 border border-red-300 text-red-900'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                          }`}
                        >
                          {opt}
                          {idx === fb.correctIndex && <span className="text-xs ml-2">(correct)</span>}
                          {idx === answers[q.id] && idx !== fb.correctIndex && <span className="text-xs ml-2">(your answer)</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      <span className="font-semibold">Why:</span> {fb.rationale}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!result.passed && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => { setResult(null); setAnswers({}) }}
              className="px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              Re-attempt quiz
            </button>
            <Link
              href="/courses/ai-in-clinical-practice"
              className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-foreground font-semibold text-sm hover:border-accent/40 hover:bg-slate-50 transition-colors"
            >
              Review modules first →
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="card rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              {i + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    answers[q.id] === idx
                      ? 'bg-accent/10 border border-accent/40'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={idx}
                    checked={answers[q.id] === idx}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                    className="mt-1"
                  />
                  <span className="text-sm text-foreground flex-1">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {Object.keys(answers).length} / {questions.length} answered
        </p>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="px-6 py-3 rounded-xl bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit
        </button>
      </div>
    </div>
  )
}
