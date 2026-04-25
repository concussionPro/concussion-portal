/**
 * HMAC-signed survey URLs.
 *
 * Email survey CTAs link to /s/<survey>?u=<userId>&a=<answer>&t=<sig>.
 * Token binds (surveyKey, userId, answer) so a recipient can't change
 * one of those values to attribute a different answer to a different user.
 *
 * Stateless verification — no DB lookup needed before recording the answer.
 */

import crypto from 'crypto'

function getSecret(): string {
  const s = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!s) throw new Error('SESSION_SECRET or MAGIC_LINK_SECRET must be set for survey tokens')
  return s
}

export function signSurveyAnswer(surveyKey: string, userId: string, answer: string): string {
  const payload = `${surveyKey}.${userId}.${answer}`
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')
    .slice(0, 24) // truncated — enough entropy for non-repudiation, short enough for an email link
}

export function verifySurveyAnswer(surveyKey: string, userId: string, answer: string, token: string): boolean {
  const expected = signSurveyAnswer(surveyKey, userId, answer)
  if (expected.length !== token.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}
