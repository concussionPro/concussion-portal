'use client'

/**
 * Client renderer for one EP module. Reuses the existing flagship
 * DynamicContentRenderer (the EP module content uses the same `###` / `[CALLOUT:]`
 * / bullet conventions), plus a simple quiz + references block. No new rendering
 * engine — it just feeds section.content arrays to the shared renderer.
 */
import { useState } from 'react'
import Link from 'next/link'
import { DynamicContentRenderer } from '@/components/course/DynamicContentRenderer'
import type { Module } from '@/data/modules'

export function EpModuleView({
  module,
  prevHref,
  nextHref,
}: {
  module: Module
  prevHref: string | null
  nextHref: string | null
}) {
  return (
    <article className="prose-none">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
        Module {module.id} · {module.duration} · {module.points} CPD {module.points === 1 ? 'point' : 'points'}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">{module.title}</h1>
      <p className="mt-1 text-lg text-slate-600">{module.subtitle}</p>
      <p className="mt-4 text-slate-700">{module.description}</p>

      <div className="mt-8 space-y-10">
        {module.sections.map((section, i) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-3 text-xl font-bold text-slate-900">{section.title}</h2>
            <DynamicContentRenderer content={section.content} sectionIndex={i} />
          </section>
        ))}
      </div>

      {module.quiz?.length > 0 && <QuizBlock quiz={module.quiz} />}

      {module.clinicalReferences?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-xl font-bold text-slate-900">References</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            {module.clinicalReferences.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </section>
      )}

      <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
        {prevHref ? (
          <Link href={prevHref} className="text-sm font-semibold text-teal-700 hover:underline">← Previous module</Link>
        ) : <span />}
        {nextHref ? (
          <Link href={nextHref} className="text-sm font-semibold text-teal-700 hover:underline">Next module →</Link>
        ) : <span />}
      </nav>
    </article>
  )
}

function QuizBlock({ quiz }: { quiz: Module['quiz'] }) {
  const [revealed, setRevealed] = useState<Record<string, number>>({})
  return (
    <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Knowledge check</h2>
      <div className="space-y-6">
        {quiz.map((q) => {
          const picked = revealed[q.id]
          return (
            <div key={q.id}>
              <p className="font-semibold text-slate-800">{q.question}</p>
              <ul className="mt-2 space-y-1.5">
                {q.options.map((opt, i) => {
                  const isAnswered = picked !== undefined
                  const isCorrect = i === q.correctAnswer
                  return (
                    <li key={i}>
                      <button
                        onClick={() => setRevealed((r) => ({ ...r, [q.id]: i }))}
                        className={
                          'w-full rounded-md border px-3 py-2 text-left text-sm transition ' +
                          (!isAnswered
                            ? 'border-slate-200 bg-white hover:border-teal-300'
                            : isCorrect
                              ? 'border-green-400 bg-green-50 text-green-800'
                              : i === picked
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-slate-200 bg-white text-slate-500')
                        }
                      >
                        {opt}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {picked !== undefined && (
                <p className="mt-2 text-sm text-slate-600"><strong>Why:</strong> {q.explanation}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
