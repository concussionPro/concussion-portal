import { modules } from '@/data/modules'
import { scatModules } from '@/data/scat-modules'

/**
 * Server-side quiz verification (2026-07-05 audit fix).
 *
 * Certificates are AHPRA CPD documents, but issuance previously trusted a
 * client-authored progress blob (`completed`, `quizScore`) — forgeable with
 * one fetch(). The server holds every answer key, so completion is now
 * RECOMPUTED here from the stored per-question answers: passing requires
 * actually having answered the quiz.
 */

export interface QuizVerification {
  ok: boolean
  score: number
  total: number
  reason: 'pass' | 'no-quiz-data' | 'no-answers' | 'below-threshold'
}

const PASS_THRESHOLD = 0.75

function answerKeyFor(moduleId: number): Map<string, number> | null {
  const source =
    moduleId >= 101 && moduleId <= 103
      ? scatModules.find((m) => m.id === moduleId)
      : modules.find((m) => m.id === moduleId)
  if (!source || !source.quiz?.length) return null
  return new Map(source.quiz.map((q) => [q.id, q.correctAnswer]))
}

/** Recompute a module's quiz result from stored answers. Fail closed. */
export function verifyModuleQuiz(
  moduleId: number,
  answers: Record<string, number> | null | undefined,
): QuizVerification {
  const key = answerKeyFor(moduleId)
  if (!key) return { ok: false, score: 0, total: 0, reason: 'no-quiz-data' }
  if (!answers) return { ok: false, score: 0, total: key.size, reason: 'no-answers' }
  let score = 0
  for (const [qid, correct] of key) {
    if (answers[qid] === correct) score += 1
  }
  const ok = key.size > 0 && score / key.size >= PASS_THRESHOLD
  return { ok, score, total: key.size, reason: ok ? 'pass' : 'below-threshold' }
}
