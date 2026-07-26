import { MetadataRoute } from 'next'

// Honest static lastModified date for non-blog pages — bump when page content
// meaningfully changes. A rolling `new Date()` tells crawlers every page
// changed on every build, which erodes crawl-priority signals.
const STATIC_PAGES_LAST_MODIFIED = new Date('2026-06-01')

// Pages whose content/meta actually changed in the 2026-07-02 SEO sweep
// (scat6-download canonical fix, workshop-page meta + Sydney interest form).
const SEO_SWEEP_LAST_MODIFIED = new Date('2026-07-02')

// ESSA accreditation granted 2026-07-24 — the date the CRM stream and the
// dual-stream chooser became public.
const ESSA_LIVE_LAST_MODIFIED = new Date('2026-07-24')

// Blog posts carry their own datePublished/dateModified in their schema
// markup — sitemap lastModified mirrors each post's dateModified.
const BLOG_POSTS: Array<{ slug: string; dateModified: string; priority: number }> = [
  { slug: 'cervicogenic-vs-migraine-vs-tension-headache-differential', dateModified: '2026-07-12', priority: 0.9 },
  { slug: 'heidi-vs-lyrebird-ai-scribe-australian-clinicians', dateModified: '2026-05-27', priority: 0.9 },
  { slug: 'ahpra-ai-guidelines-explained-australian-clinicians', dateModified: '2026-05-27', priority: 0.9 },
  { slug: 'chatgpt-ndis-reports-allied-health-australia', dateModified: '2026-05-27', priority: 0.9 },
  { slug: 'ai-scribe-privacy-act-compliance-australia', dateModified: '2026-05-27', priority: 0.9 },
  { slug: 'when-not-to-use-ai-clinical-notes-clinicians', dateModified: '2026-05-27', priority: 0.85 },
  { slug: 'ai-medical-scribe-comparison-2026', dateModified: '2026-05-27', priority: 0.95 },
  { slug: 'persistent-post-concussion-symptoms-clinician-workup', dateModified: '2026-05-27', priority: 0.9 },
  { slug: 'cervicogenic-drivers-chronic-concussion', dateModified: '2026-05-27', priority: 0.85 },
  { slug: 'vestibulo-ocular-workup-ppcs', dateModified: '2026-05-27', priority: 0.85 },
  { slug: 'ahpra-cpd-requirements-concussion-education', dateModified: '2026-03-18', priority: 0.8 },
  { slug: '21-day-concussion-stand-down-youth-sport-australia', dateModified: '2026-03-18', priority: 0.8 },
  { slug: 'ais-concussion-brain-health-position-statement-2024', dateModified: '2026-03-18', priority: 0.8 },
  { slug: 'nsw-mandatory-concussion-training-combat-sports', dateModified: '2026-03-18', priority: 0.8 },
  { slug: 'free-scat6-pdf-download', dateModified: '2026-01-31', priority: 0.8 },
  { slug: 'scat6-vs-scoat6-difference', dateModified: '2026-01-31', priority: 0.8 },
  { slug: 'concussion-update-2026-wait-until-symptom-free-obsolete', dateModified: '2026-01-05', priority: 0.8 },
  { slug: 'vestibular-ocular-screening-voms-concussion', dateModified: '2025-10-18', priority: 0.8 },
  { slug: 'return-to-play-decisions-concussion-clinicians', dateModified: '2025-09-15', priority: 0.8 },
  { slug: 'how-to-use-scat6-clinicians-guide', dateModified: '2025-08-01', priority: 0.8 },
  { slug: 'bess-balance-testing-concussion-guide', dateModified: '2026-03-09', priority: 0.8 },
  { slug: 'concussion-myths-clinicians-should-stop-believing', dateModified: '2026-03-09', priority: 0.8 },
  { slug: 'pre-season-baseline-testing-concussion-guide', dateModified: '2026-03-09', priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing-international`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // CRM (exercise-physiology stream) went live with ESSA accreditation on
    // 2026-07-24 and renders `index, follow` — but was never added here, so the
    // newest revenue product was absent from the sitemap. Both pages are gated
    // on CONFIG.FEATURES.ESSA_ACCREDITED and public while it is true.
    {
      url: `${baseUrl}/concussion-rehab-mastery`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses/streams`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    // Per-module trial pages. These carry the SAME unlocked sections the
    // /preview page shows (Module 1: 3 sections, others: 1) — no extra content,
    // just one URL per module so each can rank for its own clinical intent.
    ...Array.from({ length: 8 }, (_, i) => ({
      url: `${baseUrl}/preview/${i + 1}`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: i === 0 ? 0.8 : 0.7,
    })),
    // International acquisition landings that are genuinely LIVE and honest
    // about what is/isn't accredited. These were crawlable but in no sitemap —
    // discoverable by accident, managed by nobody. The on-hold ones (/csep,
    // /hpcsa, /sesnz) and the ACC supplier pitch are noindex instead.
    {
      url: `${baseUrl}/uk`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/acsm`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/cimspa`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cep-uk`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // The free awareness short course — a real standalone acquisition asset.
    {
      url: `${baseUrl}/concussion-update`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Public Clinical Tools landing (canonical /clinical-suite, indexable).
    {
      url: `${baseUrl}/clinical-suite`,
      lastModified: ESSA_LIVE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/scat-mastery`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/preview`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/course`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/in-person`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // /trial removed — it 301s to /scat-mastery, redirects don't belong in sitemaps
    {
      url: `${baseUrl}/preseason`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat6-download`,
      lastModified: SEO_SWEEP_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat-forms`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat-forms/about`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat-forms/scat6`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat-forms/scoat6`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scat-forms/child-scat6`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // /assessment excluded — requires interaction, not crawlable content
    // /clinical-toolkit excluded — noindex page (authenticated content)
    {
      url: `${baseUrl}/terms`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/faq/scat-assessment`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ai-safety-checklist`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about/zac-lewis`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ppcs-waitlist`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/team-training`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date('2026-07-10'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/courses/ai-in-clinical-practice`,
      lastModified: SEO_SWEEP_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses/melbourne`,
      lastModified: SEO_SWEEP_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/courses/sydney`,
      lastModified: SEO_SWEEP_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly',
    priority: post.priority,
  }))

  return [...staticPages, ...blogPages]
}
