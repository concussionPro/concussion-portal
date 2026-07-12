/**
 * Blog publishing schedule — the cadence enforcer.
 *
 * Each entry below represents a planned Friday blog drop. The cron
 * /api/cron/publish-scheduled-blog runs Thursday 23:00 UTC (Friday 9am
 * AEST) and surfaces any post whose publishAt date has arrived but
 * which isn't yet indexed. Posts written ahead of time can sit in the
 * drafts queue without being visible.
 *
 * Visibility rule: a post is "live" iff its slug appears in
 * app/blog/page.tsx index AND in sitemap.ts. The cron's job is to
 * remind us (via logged warning) when a publishAt has passed but the
 * post isn't indexed. It does NOT automatically modify those files —
 * doing so reliably in a Next.js build is fragile. The cron emits the
 * reminder + the slug to publish; the actual index/sitemap update is
 * a 30-second manual ritual Friday morning.
 *
 * Future enhancement: build a fully-automated publishAt mechanism by
 * filtering blog index + sitemap at runtime using this schedule. Skip
 * until cadence discipline is proven over a few weeks.
 */

export interface ScheduledBlogPost {
  /** URL slug — must match folder name in app/blog/[slug]/ */
  slug: string
  /** Title (for cron reminder only — actual title lives in the post file) */
  title: string
  /** ISO 8601 publish target. The cron flags this slug for publishing on/after this date. */
  publishAt: string
  /** Draft status — has the post file been written? */
  draftStatus: 'not-started' | 'drafted' | 'reviewed' | 'live'
  /** Optional notes about target keyword cluster, intended CTA, etc. */
  notes?: string
}

/**
 * The 12-week calendar from ROADMAP_AND_SYSTEM.md §7.
 * Friday publishes. Times converted to UTC (AEST UTC+10 → subtract 10 hours).
 * 09:00 AEST Friday = 23:00 UTC Thursday.
 */
export const BLOG_SCHEDULE: ScheduledBlogPost[] = [
  // 2026-06-05 reserved for AI course launch — NO new blog
  {
    slug: 'ahpra-ai-code-section-by-section',
    title: 'AHPRA AI Code Section-by-Section — Plain English for Australian Clinicians',
    publishAt: '2026-06-11T23:00:00Z', // Fri 12 Jun 2026, 09:00 AEST
    draftStatus: 'not-started',
    notes: 'Deep-dive that LLMs cite; expands AHPRA AI cluster. Targets "ahpra ai code" + section-numbered queries.',
  },
  {
    slug: 'patient-consent-ai-scribe-scripts',
    title: 'How to Get Patient Consent for AI Scribe Use — Word-for-Word Scripts',
    publishAt: '2026-06-18T23:00:00Z', // Fri 19 Jun 2026
    draftStatus: 'not-started',
    notes: 'Practical / high-search-intent; complements AI course Module 1. Targets "ai scribe patient consent script" + variants.',
  },
  {
    slug: 'heidi-health-review-2026-australian-clinicians',
    title: 'Heidi Health Review 2026 — An Australian Clinician\'s Honest Take',
    publishAt: '2026-06-25T23:00:00Z', // Fri 26 Jun 2026
    draftStatus: 'not-started',
    notes: 'Targets "heidi review" branded query. Partnership pitch context — keep balanced/fair.',
  },
  {
    slug: 'ppcs-children-adolescents-different-timeline',
    title: 'PPCS in Children + Adolescents — Different Timeline, Different Workup',
    publishAt: '2026-07-02T23:00:00Z', // Fri 3 Jul 2026
    draftStatus: 'not-started',
    notes: 'Expands PPCS cluster; paediatric angle. Consult with paediatric-credentialed reviewer before publishing.',
  },
  {
    slug: 'cervicogenic-vs-migraine-vs-tension-headache-differential',
    title: 'Cervicogenic Headache vs Migraine vs Tension — Differential for Clinicians',
    publishAt: '2026-07-09T23:00:00Z', // Fri 10 Jul 2026
    draftStatus: 'live', // published 2026-07-12
    notes: 'Cervicogenic Dizziness validation begins — Course #3 (Q4 2026).',
  },
  {
    slug: 'lyrebird-vs-heidi-solo-practitioners',
    title: 'Lyrebird vs Heidi — When Each Wins for Solo Practitioners',
    publishAt: '2026-07-16T23:00:00Z', // Fri 17 Jul 2026
    draftStatus: 'not-started',
    notes: 'Branded-query targeting; complements 26 Jun Heidi review.',
  },
  {
    slug: 'active-concussion-recovery-sub-threshold-exercise',
    title: 'Active Concussion Recovery — Sub-Threshold Exercise Prescription Guide',
    publishAt: '2026-07-23T23:00:00Z', // Fri 24 Jul 2026
    draftStatus: 'not-started',
    notes: 'High-intent practical post; complements CCM Online. Targets "concussion exercise prescription" + variants.',
  },
  {
    slug: 'ppcs-waitlist-status-update-course-preview',
    title: 'PPCS Course Preview — Inside the Forthcoming Clinical Mastery Program',
    publishAt: '2026-07-30T23:00:00Z', // Fri 31 Jul 2026
    draftStatus: 'not-started',
    notes: 'Validation-gate decision week (assumes ≥100 waitlist signups). If gate fails, swap this slot for an evergreen concussion post.',
  },
  {
    slug: 'cervicogenic-dizziness-test-vs-bppv',
    title: 'Cervicogenic Dizziness — The Test That Differentiates It From BPPV',
    publishAt: '2026-08-06T23:00:00Z', // Fri 7 Aug 2026
    draftStatus: 'not-started',
    notes: 'Cervicogenic Dizziness validation post #2 — drives Course #3 waitlist (parallel to PPCS launch).',
  },
  {
    slug: 'vestibular-rehab-msk-clinician-refer-or-manage',
    title: 'Vestibular Rehabilitation for the MSK Clinician — When to Refer vs Manage',
    publishAt: '2026-08-13T23:00:00Z', // Fri 14 Aug 2026
    draftStatus: 'not-started',
    notes: 'Vestibular MSK validation begins — Course #4 (Q1 2027).',
  },
  // 2026-08-21 reserved for PPCS course launch — NO new blog
]

/**
 * Returns the list of scheduled posts whose publishAt date has passed
 * but which haven't yet been marked 'live'. Used by the cron reminder.
 */
export function getOverduePosts(now: Date = new Date()): ScheduledBlogPost[] {
  return BLOG_SCHEDULE.filter(
    (p) => p.draftStatus !== 'live' && new Date(p.publishAt) <= now
  )
}

/**
 * Returns the next post due to publish (whether or not its draft is ready).
 * Lets the Friday-morning ritual surface "what's up next" without scrolling.
 */
export function getNextScheduledPost(now: Date = new Date()): ScheduledBlogPost | null {
  return (
    BLOG_SCHEDULE.filter((p) => new Date(p.publishAt) > now).sort(
      (a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
    )[0] || null
  )
}
