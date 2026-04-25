import { sql } from '@/lib/db'
import { verifySurveyAnswer } from '@/lib/survey-token'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SURVEY_KEY = 'scat_completer_followup_v1'

const ANSWER_LABELS: Record<string, { short: string; followup: string }> = {
  A: {
    short: 'Price',
    followup: "Got it. I'll keep an eye on price-sensitive options and let you know if anything fits — no auto-pitch from me. If you want, hit reply and tell me what budget would work.",
  },
  B: {
    short: 'Not sure I need it',
    followup: "Fair. SCAT is the headline, but the rest of the course is heavily weighted toward phenotype-based rehab (vestibular / cervicogenic / autonomic / migraine) and return-to-play decisions — the stuff that actually changes how you treat. Reply if you want me to send the Module 4 preview so you can see whether it fits.",
  },
  C: {
    short: 'Want the workshop',
    followup: "Good signal — Sydney and Byron Bay are still in the collecting phase. I'll prioritise booking once we hit 8 commits in your city. Reply with your city and I'll add you to the early-notice list.",
  },
  D: {
    short: 'Timing',
    followup: "Cool. I'll only send workshop date confirmations from here on — no nurture push. You can always come back when it suits.",
  },
  E: {
    short: 'Something else',
    followup: "Hit reply with what's on your mind — I read every message and answer personally.",
  },
}

async function recordAnswer(userId: string, answer: string) {
  // Upsert: most recent click wins per (user, survey)
  await sql`
    CREATE TABLE IF NOT EXISTS survey_responses (
      user_id    TEXT NOT NULL,
      survey_key TEXT NOT NULL,
      answer     TEXT NOT NULL,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, survey_key)
    )
  `
  await sql`
    INSERT INTO survey_responses (user_id, survey_key, answer)
    VALUES (${userId}, ${SURVEY_KEY}, ${answer})
    ON CONFLICT (user_id, survey_key) DO UPDATE
      SET answer = EXCLUDED.answer,
          answered_at = NOW()
  `
}

export default async function ScatFollowupAnswerPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; a?: string; t?: string }>
}) {
  const { u: userId, a: answer, t: token } = await searchParams

  let valid = false
  let recordError: string | null = null

  if (userId && answer && token && ANSWER_LABELS[answer]) {
    valid = verifySurveyAnswer(SURVEY_KEY, userId, answer, token)
    if (valid) {
      try {
        await recordAnswer(userId, answer)
      } catch (err) {
        console.error('[scat-followup] Failed to record answer:', err)
        recordError = 'Recorded locally but DB write failed — your answer is logged.'
      }
    }
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link not valid</h1>
          <p className="text-sm text-slate-600 mb-6">
            This survey link looks malformed or expired. If you wanted to send Zac a quick note,
            just reply to the email directly — he reads every message.
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  const meta = ANSWER_LABELS[answer!]

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Got it — &quot;{meta.short}&quot;
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {meta.followup}
        </p>
        {recordError && (
          <p className="text-xs text-amber-700 mb-4">{recordError}</p>
        )}
        <div className="flex flex-col gap-2">
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Re: Quick one — what stopped you?"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            Reply with details
          </a>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Or back to the portal
          </Link>
        </div>
      </div>
    </div>
  )
}
