/**
 * Self-optimizing subject-line engine for the CEA cold-outreach system.
 *
 * THE ASK (Zac): "the analytics engine should be dynamic — make changes based
 * off data as engagement comes in." This module is the decision core: given
 * the live performance of each subject-line VARIANT (identified by a stable,
 * clinic-agnostic `key`, never the rendered text), it picks which variant the
 * next send should use — favouring the one that earns the most real human
 * portal visits, but only once it has enough evidence to trust the numbers.
 *
 * POLICY — epsilon-greedy with a cold-start (uniform-warmup) guard:
 *
 *   1. COLD START (uniform warmup): if ANY candidate variant has fewer than
 *      `minSamplesPerKey` sends, we do NOT exploit. We return the deterministic
 *      slug-hash pick — the same rotation the engine used before this optimizer
 *      existed. This guarantees every variant gets a fair, even share of early
 *      sends so no variant is judged (and abandoned) on noise. With zero data
 *      the engine therefore behaves EXACTLY as it did before.
 *
 *   2. EXPLOIT vs EXPLORE (once every variant has ≥ minSamplesPerKey sends):
 *        - with probability `epsilon` we EXPLORE — return the slug-hash pick,
 *          keeping every variant alive so a late-blooming winner can still be
 *          discovered (guards against locking onto an early fluke).
 *        - otherwise we EXPLOIT — return the variant with the highest
 *          conversion rate (realViews / sends).
 *
 * DETERMINISM: every "random" decision is derived from the clinic slug, NOT
 * Math.random(). The same prospect retried (cron re-run, manual fire-now,
 * concurrent invocations) always resolves to the same variant — no flip-flop,
 * no duplicate-looking A/B noise, and the result is unit-testable. The explore
 * coin and the pick use two independent hash families so the explore decision
 * isn't perfectly correlated with which variant explore then returns.
 *
 * ATTRIBUTION (what "conversion" means here): a `realView` is a scanner-
 * filtered prospect_portal_views hit — `duration_seconds >= 60` OR
 * `interaction_type = 'cta_click'` — whose utm_campaign matches the touch
 * (cold_t1/t2/t3) and whose clinic received a send that used this variant key.
 * Microsoft Defender / Mimecast scanners don't dwell or click CTAs, so this is
 * a real-human signal, not open/click noise. The query lives in
 * process-scheduled.ts; this module is pure and never touches the DB.
 */

/** Live performance for one subject-line variant key, for one touch. */
export interface VariantStat {
  /** Production sends that used this variant key for this touch. */
  sends: number
  /** Distinct clinics with a scanner-filtered portal visit attributed to it. */
  realViews: number
}

/** Defaults shared by the optimizer, the admin readout, and the UI threshold. */
export const DEFAULT_EPSILON = 0.25
export const DEFAULT_MIN_SAMPLES_PER_KEY = 15

// Large prime modulus for mapping a hash into a [0,1) pseudo-random.
const EXPLORE_MODULUS = 2_147_483_647

/**
 * Sum-of-char-codes hash — IDENTICAL family to `variantIndex()` in
 * email-templates.ts. Keeping it identical is what makes the cold-start /
 * explore pick reproduce the engine's pre-existing deterministic rotation
 * when callers pass candidate keys in the same order as the eligible variants.
 */
function sumCharCodes(slug: string): number {
  return slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

/**
 * Deterministic slug-hash pick among candidate keys. ORDER-PRESERVING: it
 * indexes into `candidateKeys` as given, so when process-scheduled passes the
 * keys in eligible-variant order this returns the very key the old slug-hash
 * rotation would have rendered (backward compatibility / retry stability).
 */
function slugHashPick(candidateKeys: string[], slug: string): string {
  return candidateKeys[sumCharCodes(slug) % candidateKeys.length]
}

/**
 * djb2-style hash, independent of `sumCharCodes`, used only for the explore
 * coin so the explore decision is decorrelated from the pick.
 */
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export interface ChooseSubjectKeyArgs {
  /** Eligible variant keys for THIS clinic + touch, in eligible-variant order. */
  candidateKeys: string[]
  /** Clinic slug — the deterministic seed for every pick/explore decision. */
  slug: string
  /** key → live performance. Missing keys are treated as zero sends/views. */
  stats: Map<string, VariantStat>
  /** Explore probability once warmed up. Default 0.25. */
  epsilon?: number
  /** Per-variant send threshold before exploitation is allowed. Default 15. */
  minSamplesPerKey?: number
}

/**
 * Pick the subject-line variant key for the next send. Pure + deterministic.
 * See the file header for the full policy. Falls back to the deterministic
 * slug-hash pick whenever there isn't enough data to trust exploitation.
 */
export function chooseSubjectKey({
  candidateKeys,
  slug,
  stats,
  epsilon = DEFAULT_EPSILON,
  minSamplesPerKey = DEFAULT_MIN_SAMPLES_PER_KEY,
}: ChooseSubjectKeyArgs): string {
  if (candidateKeys.length === 0) return ''
  if (candidateKeys.length === 1) return candidateKeys[0]

  // ── Cold-start guard: any under-sampled arm → pure exploration (warmup) ──
  // We never exploit while a variant still lacks evidence, so early sends are
  // spread evenly and no variant is killed off on a couple of unlucky sends.
  const underSampled = candidateKeys.some(
    (k) => (stats.get(k)?.sends ?? 0) < minSamplesPerKey,
  )
  if (underSampled) return slugHashPick(candidateKeys, slug)

  // ── Warmed up: epsilon-greedy. Explore coin is deterministic per slug. ──
  const exploreRoll = (djb2(`${slug}:sbjexplore`) % EXPLORE_MODULUS) / EXPLORE_MODULUS
  if (exploreRoll < epsilon) return slugHashPick(candidateKeys, slug)

  // ── Exploit: highest conversion rate (realViews / sends). ──
  const rated = candidateKeys.map((key) => {
    const st = stats.get(key)
    const rate = st && st.sends > 0 ? st.realViews / st.sends : 0
    return { key, rate }
  })
  const maxRate = Math.max(...rated.map((r) => r.rate))
  // Tie-break deterministically by slug hash among the joint-best variants.
  const tied = rated.filter((r) => Math.abs(r.rate - maxRate) <= 1e-9).map((r) => r.key)
  return tied.length === 1 ? tied[0] : slugHashPick(tied, slug)
}

/** One row of the admin readout. */
export interface VariantPerformanceRow {
  key: string
  sends: number
  realViews: number
  /** realViews / sends, 0 when no sends. */
  convRate: number
}

/**
 * Flatten + sort variant stats for the admin dashboard: best conversion rate
 * first, then most sends, then key (stable, alphabetical) as the final
 * tie-break so the readout order is deterministic.
 */
export function summarizeVariantPerformance(
  stats: Map<string, VariantStat>,
): VariantPerformanceRow[] {
  return [...stats.entries()]
    .map(([key, s]) => ({
      key,
      sends: s.sends,
      realViews: s.realViews,
      convRate: s.sends > 0 ? s.realViews / s.sends : 0,
    }))
    .sort(
      (a, b) =>
        b.convRate - a.convRate || b.sends - a.sends || a.key.localeCompare(b.key),
    )
}
