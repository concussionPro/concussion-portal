import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

interface RelatedPost {
  title: string
  description: string
  href: string
  readTime: string
}

// All available posts for cross-linking
const ALL_POSTS: Record<string, RelatedPost> = {
  'concussion-update-2026': {
    title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Obsolete',
    description: 'Active recovery protocols, SCAT6/SCOAT6 two-tool system, and vestibular-ocular screening define the new standard.',
    href: '/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
    readTime: '10 min',
  },
  'voms-screening': {
    title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
    description: '50-80% of concussed athletes report dizziness (Mucha et al., 2014; Kontos et al., 2017). Learn how VOMS screening fills this critical gap.',
    href: '/blog/vestibular-ocular-screening-voms-concussion',
    readTime: '12 min',
  },
  'return-to-play': {
    title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins',
    description: 'Digital symptom tracking, cognitive screening, balance testing, stepwise protocols, and holistic SCAT6 integration.',
    href: '/blog/return-to-play-decisions-concussion-clinicians',
    readTime: '11 min',
  },
  'scat6-guide': {
    title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
    description: 'Step-by-step guide covering symptom evaluation, cognitive screening, neurological examination, and balance assessment.',
    href: '/blog/how-to-use-scat6-clinicians-guide',
    readTime: '14 min',
  },
  'scat6-vs-scoat6': {
    title: 'SCAT6 vs SCOAT6: Which Tool to Use When?',
    // AHPRA publishes no concussion assessment guidelines — "under AHPRA
    // guidelines" was a false attribution rendered on three posts.
    description: 'Critical differences between SCAT6 and SCOAT6 — when to use each tool under current consensus guidance.',
    href: '/blog/scat6-vs-scoat6-difference',
    readTime: '7 min',
  },
  'concussion-myths': {
    title: '7 Concussion Myths Clinicians Should Stop Believing',
    description: 'Evidence-based debunking of persistent concussion misconceptions still affecting clinical practice.',
    href: '/blog/concussion-myths-clinicians-should-stop-believing',
    readTime: '9 min',
  },
  'bess-testing': {
    title: 'BESS Balance Testing for Concussion: A Complete Guide',
    description: 'Step-by-step guide to administering and scoring the Balance Error Scoring System.',
    href: '/blog/bess-balance-testing-concussion-guide',
    readTime: '11 min',
  },
  'baseline-testing': {
    title: 'Pre-Season Baseline Testing for Concussion',
    description: 'Why individual baselines improve concussion detection. SCAT6, BESS, and VOMS baseline protocols.',
    href: '/blog/pre-season-baseline-testing-concussion-guide',
    readTime: '10 min',
  },
  'scat6-pdf': {
    title: 'Free SCAT6 PDF Download - Fillable Form with Auto-Scoring',
    description: 'Download free digitally fillable SCAT6 PDF with automatic scoring. Updated for Amsterdam 2023.',
    href: '/blog/free-scat6-pdf-download',
    readTime: '5 min',
  },
  'ahpra-cpd': {
    title: 'AHPRA CPD Requirements: Where Concussion Education Fits',
    description: 'Annual CPD requirements for physios, osteos, chiros, and EPs — how concussion education counts.',
    href: '/blog/ahpra-cpd-requirements-concussion-education',
    readTime: '8 min',
  },
  '21-day-stand-down': {
    title: '21-Day Concussion Stand-Down in Youth Sport',
    // "mandatory" removed: the post itself describes a position statement that
    // NSOs have voluntarily adopted, not a legal mandate.
    description: 'Australia\'s 21-day stand-down guidance, which sports enforce it, and what clinicians need to do.',
    href: '/blog/21-day-concussion-stand-down-youth-sport-australia',
    readTime: '9 min',
  },
  'ais-position-statement': {
    title: 'AIS Concussion and Brain Health Position Statement 2024',
    description: 'Key takeaways: 21-day stand-down for youth, expanded physio role, alignment with UK and NZ guidelines.',
    href: '/blog/ais-concussion-brain-health-position-statement-2024',
    readTime: '10 min',
  },
  'nsw-combat-sports': {
    title: 'NSW Mandatory Concussion Training for Combat Sports',
    description: 'Combat Sports Amendment Act 2024: what changed, who it affects, and why it matters beyond the ring.',
    href: '/blog/nsw-mandatory-concussion-training-combat-sports',
    readTime: '8 min',
  },
  // --- Posts keyed by their FULL directory slug ---------------------------
  // The AI and PPCS clusters were written after this map and were never added
  // to it, so every one of their `slugs` lookups missed. Titles/descriptions
  // below are the TITLE/DESCRIPTION constants from each post, trimmed for the
  // card; read times are the post's own stated read time.
  'heidi-vs-lyrebird-ai-scribe-australian-clinicians': {
    title: 'Heidi vs Lyrebird vs ChatGPT for Clinical Notes: An Australian Comparison',
    description: 'Side-by-side on AHPRA AI guidelines, Australian Privacy Principles, NDIS audit risk, and indemnity insurer positions.',
    href: '/blog/heidi-vs-lyrebird-ai-scribe-australian-clinicians',
    readTime: '9 min',
  },
  'ahpra-ai-guidelines-explained-australian-clinicians': {
    title: 'AHPRA AI Guidelines Explained: What Australian Clinicians Actually Need to Do',
    description: 'The four obligations every AU clinician must meet when using AI in patient care: consent, responsibility, data location, documentation integrity.',
    href: '/blog/ahpra-ai-guidelines-explained-australian-clinicians',
    readTime: '7 min',
  },
  'ai-scribe-privacy-act-compliance-australia': {
    title: 'AI Scribe Privacy Act Compliance for Australian Clinicians — APP 8 Explained',
    description: 'Why AU-resident scribes are compliant by default and US-resident tools need explicit patient consent for offshore disclosure.',
    href: '/blog/ai-scribe-privacy-act-compliance-australia',
    readTime: '8 min',
  },
  'ai-medical-scribe-comparison-2026': {
    title: 'AI Medical Scribe Comparison 2026 — Heidi vs Lyrebird vs Tortus vs Abridge vs Suki vs DAX',
    description: 'Six AI scribes side-by-side for AU/UK/US/CA clinicians: data residency, HIPAA/GDPR/Privacy Act fit, specialty support, and which one suits which practice.',
    href: '/blog/ai-medical-scribe-comparison-2026',
    readTime: '11 min',
  },
  'when-not-to-use-ai-clinical-notes-clinicians': {
    title: 'When NOT to Use AI for Clinical Notes — 7 Red Flags for Australian Clinicians',
    description: 'Mental health disclosures, mandatory reporting, medicolegal cases, paediatric consent: when to switch the AI scribe off.',
    href: '/blog/when-not-to-use-ai-clinical-notes-clinicians',
    readTime: '6 min',
  },
  'chatgpt-ndis-reports-allied-health-australia': {
    title: 'Can I Use ChatGPT for NDIS Reports? An Allied Health Compliance Guide',
    description: 'Privacy Act exposure, NDIA audit risk, and the safe alternatives for AU allied health practitioners.',
    href: '/blog/chatgpt-ndis-reports-allied-health-australia',
    readTime: '8 min',
  },
  'cervicogenic-drivers-chronic-concussion': {
    title: 'Cervicogenic Drivers in Chronic Concussion',
    description: 'Cervical contribution to persistent post-concussion symptoms — assessment, cervicogenic dizziness vs headache, and manual therapy applications.',
    href: '/blog/cervicogenic-drivers-chronic-concussion',
    readTime: '7 min',
  },
  'persistent-post-concussion-symptoms-clinician-workup': {
    title: 'Persistent Post-Concussion Symptoms (PPCS): A Clinician\'s Workup',
    description: 'PPCS criteria, vestibulo-ocular and cervical workup, escalation pathways, and active rehabilitation protocols.',
    href: '/blog/persistent-post-concussion-symptoms-clinician-workup',
    readTime: '10 min',
  },
  'vestibulo-ocular-workup-ppcs': {
    title: 'Vestibulo-Ocular Workup for Persistent Post-Concussion Symptoms — Beyond VOMS',
    description: 'Convergence insufficiency, BPPV after head trauma, gaze stability, VOR exercises, and when to refer for a vestibular specialist.',
    href: '/blog/vestibulo-ocular-workup-ppcs',
    readTime: '8 min',
  },
  // Newest post (12 Jul 2026). Registered here so it is cross-linkable at all —
  // a post absent from this map can never appear in any Related Articles block,
  // which is how the AI/PPCS cluster lost its internal linking (see above).
  'cervicogenic-vs-migraine-vs-tension-headache-differential': {
    title: 'Cervicogenic vs Migraine vs Tension Headache — The Post-Concussion Differential',
    description: 'Post-concussion headache is a timing category, not a diagnosis. Phenotype it: distinguishing features, comparison table, and why the phenotype drives management.',
    href: '/blog/cervicogenic-vs-migraine-vs-tension-headache-differential',
    readTime: '8 min',
  },
}

/** Full-slug → entry index, so a caller may pass EITHER the short key above
 *  ('scat6-guide') or the post's directory slug
 *  ('how-to-use-scat6-clinicians-guide'). Ten posts passed directory slugs,
 *  every lookup missed, `.filter(Boolean)` emptied the list and the component
 *  returned null — the whole Related Articles block silently vanished from the
 *  newest AI and PPCS clusters, and with it their internal linking. */
const BY_HREF: Record<string, RelatedPost> = Object.fromEntries(
  Object.values(ALL_POSTS).map((p) => [p.href.replace('/blog/', ''), p]),
)

export function RelatedPosts({ slugs }: { slugs: string[] }) {
  const posts = slugs
    .map(slug => ALL_POSTS[slug] ?? BY_HREF[slug])
    .filter(Boolean)
    .slice(0, 3)

  if (posts.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Related Articles</h3>
      <div className="grid gap-4">
        {posts.map(post => (
          <Link
            key={post.href}
            href={post.href}
            className="group flex gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors mb-1 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1">{post.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {post.readTime}
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
