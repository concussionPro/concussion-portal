/**
 * On-platform poll system. Voters pick up to 3 candidate topics; the
 * winner gets built as the next monthly drop and voters receive an
 * early-bird discount code on launch.
 *
 * Schema lives in two tables, created lazily on first use:
 *   poll_votes — one row per (voter_email, topic_slug)
 *   poll_voters — one row per voter_email, captures who's voted + when
 *
 * Topics are hardcoded in TOPICS below — rotate quarterly. When a topic
 * wins and ships, replace it with a new candidate.
 */

import { sql } from './db'

export interface PollTopic {
  slug: string
  title: string
  description: string
  category: string
  /** Estimated duration of the future course in minutes */
  estimatedDurationMin: number
  estimatedPriceAUD: number
}

export const POLL_TOPICS: PollTopic[] = [
  {
    slug: 'pain-neuroscience',
    title: 'Pain Neuroscience for Allied Health',
    description: 'Modern pain-science framing, communicating pain mechanisms to patients, evidence-based explanatory models.',
    category: 'Clinical fundamentals',
    estimatedDurationMin: 75,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'long-covid',
    title: 'Long COVID — Assessment & Triage',
    description: 'Phenotyping post-acute COVID, autonomic vs respiratory vs cognitive clusters, when to refer.',
    category: 'Topical',
    estimatedDurationMin: 75,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'workers-comp-documentation',
    title: 'Workers Comp Documentation Deep-Dive',
    description: 'Medicolegal documentation, capacity statements, return-to-work certificates, AHPRA + insurer expectations.',
    category: 'Medicolegal',
    estimatedDurationMin: 90,
    estimatedPriceAUD: 147,
  },
  {
    slug: 'vestibular-beyond-voms',
    title: 'Vestibular Assessment Beyond VOMS',
    description: 'BPPV, vestibular migraine, vestibular hypofunction — assessment and management beyond the screening battery.',
    category: 'Specialty',
    estimatedDurationMin: 75,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'mental-health-first-response',
    title: 'Mental Health First Response for Non-MH Clinicians',
    description: 'Identifying acute distress, risk assessment, language, referral pathways. Designed for GP and allied health.',
    category: 'Clinical fundamentals',
    estimatedDurationMin: 60,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'telehealth-compliance',
    title: 'AHPRA-Compliant Telehealth Practice',
    description: 'Consent, documentation, jurisdiction, prescribing rules, indemnity implications across allied health and GP.',
    category: 'Medicolegal',
    estimatedDurationMin: 60,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'concussion-adults',
    title: 'Concussion in Adults (Non-Sport)',
    description: 'Work-related, falls, assault — different demographics, different recovery patterns. Companion to the sport-focused CCM.',
    category: 'Specialty',
    estimatedDurationMin: 90,
    estimatedPriceAUD: 147,
  },
  {
    slug: 'pharmacology-non-prescribers',
    title: 'Pharmacology Basics for Non-Prescribers',
    description: 'What allied health needs to know about medications they encounter — interactions, red flags, when to communicate with the GP.',
    category: 'Clinical fundamentals',
    estimatedDurationMin: 75,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'chronic-pain-evidence',
    title: 'Chronic Pain — Evidence-Based Interventions',
    description: 'What works (graded exposure, ACT, exercise prescription), what doesn\'t (passive modalities alone), how to structure a defensible chronic-pain plan.',
    category: 'Specialty',
    estimatedDurationMin: 90,
    estimatedPriceAUD: 147,
  },
  {
    slug: 'sleep-medicine-allied',
    title: 'Sleep Medicine for Allied Health',
    description: 'Sleep-disorder screening (CBT-I basics, OSA red flags), sleep hygiene that has actual evidence, when to refer.',
    category: 'Clinical fundamentals',
    estimatedDurationMin: 60,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'trauma-informed-practice',
    title: 'Trauma-Informed Practice for Primary Care',
    description: 'Practical changes to consult flow, language, and consent that improve outcomes — not vague feelings-based framing.',
    category: 'Clinical fundamentals',
    estimatedDurationMin: 75,
    estimatedPriceAUD: 97,
  },
  {
    slug: 'paediatric-concussion',
    title: 'Paediatric Concussion Management',
    description: 'Age-specific assessment, return-to-learn protocols, parent communication, school-liaison templates. Companion to adult CCM.',
    category: 'Specialty',
    estimatedDurationMin: 90,
    estimatedPriceAUD: 147,
  },
]

async function ensureTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS poll_voters (
      id SERIAL PRIMARY KEY,
      voter_email TEXT NOT NULL UNIQUE,
      voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id SERIAL PRIMARY KEY,
      voter_email TEXT NOT NULL,
      topic_slug TEXT NOT NULL,
      voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (voter_email, topic_slug)
    )
  `
}

export async function recordVotes(args: {
  email: string
  topicSlugs: string[]
  source?: string
}): Promise<{ ok: boolean; count: number }> {
  await ensureTables()
  const email = args.email.trim().toLowerCase()
  if (!email || args.topicSlugs.length === 0) return { ok: false, count: 0 }

  // Upsert voter
  await sql`
    INSERT INTO poll_voters (voter_email, source)
    VALUES (${email}, ${args.source || null})
    ON CONFLICT (voter_email) DO UPDATE SET voted_at = NOW()
  `

  // Insert each vote (idempotent on unique constraint)
  let count = 0
  for (const slug of args.topicSlugs.slice(0, 3)) {
    try {
      await sql`
        INSERT INTO poll_votes (voter_email, topic_slug)
        VALUES (${email}, ${slug})
        ON CONFLICT (voter_email, topic_slug) DO NOTHING
      `
      count++
    } catch {
      // skip invalid topic, keep going
    }
  }
  return { ok: true, count }
}

export interface TopicTally {
  topicSlug: string
  votes: number
}

export async function getTopicTallies(): Promise<TopicTally[]> {
  await ensureTables()
  const { rows } = await sql<{ topic_slug: string; votes: string }>`
    SELECT topic_slug, COUNT(*)::text AS votes
    FROM poll_votes
    GROUP BY topic_slug
    ORDER BY COUNT(*) DESC
  `
  return rows.map((r) => ({ topicSlug: r.topic_slug, votes: parseInt(r.votes, 10) }))
}

export async function getVoterCount(): Promise<number> {
  await ensureTables()
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count FROM poll_voters
  `
  return parseInt(rows[0]?.count ?? '0', 10)
}
