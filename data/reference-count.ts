/**
 * Size of the Reference Repository — the ONE number every customer-facing
 * surface must quote.
 *
 * It lived three different ways at once: "140+" (home, /clinical-suite, /uk,
 * /pricing-international), "136 peer-reviewed" (/acsm, /cep-uk, /hpcsa, /csep,
 * /sesnz) and a fabricated "120" built by summing invented per-category totals
 * on the prospect + proposal reference pages. The real dataset holds 144.
 *
 * WHY A LITERAL, NOT `references.length`: data/references.ts is PAID course
 * content and must never be imported by a client component — importing it for
 * a count would compile the whole dataset into a public static chunk (exactly
 * the leak fixed in 2026-08). This module is client-safe; the literal is kept
 * honest by tests/course-content-integrity.test.ts, which fails the build if it
 * ever drifts from references.length.
 *
 * Adding or removing a reference? Update this number and the test will confirm.
 *
 * SCOPE — READ BEFORE USING (2026-08-06, Register C). REFERENCE_COUNT is the
 * CCM Reference Repository ONLY. Concussion Rehab Mastery is a different course
 * with a different, smaller evidence base, and ten CRM surfaces were rendering
 * this number as if it were theirs: /acsm, /cep-uk, /csep, /sesnz, /hpcsa,
 * /cases, /cimspa, /platform/evidence, /ep-course/dashboard and the CRM
 * international page — every one of them an accreditation- or
 * regulator-facing landing page. Use CRM_REFERENCE_COUNT there.
 *
 * The consolidation note above is where it went wrong: "136 peer-reviewed" was
 * listed as one of three sloppy variants of the CCM number and "fixed" to 144,
 * but on those five pages 136 had been the CRM's own figure. The rewrite
 * replaced a roughly-right number with a confidently wrong one, and a comment
 * was added to the CRM international page telling future editors never to write
 * 136 — which entrenched it.
 */
export const REFERENCE_COUNT = 144

/**
 * CRM (Concussion Rehab Mastery) evidence base — DISTINCT works.
 *
 * The EP modules author citations as plain strings on `clinicalReferences`;
 * the same paper legitimately underpins several modules. Deduplicated (the
 * repository a CRM buyer actually browses at /ep-course/references) that is
 * CRM_REFERENCE_COUNT works. Counting every per-module occurrence gives
 * CRM_CITATION_TOTAL.
 *
 * Quote CRM_REFERENCE_COUNT for "N peer-reviewed references" — a reference is
 * a work, not an occurrence of one. Only use CRM_CITATION_TOTAL where the copy
 * says "citations across the modules" and means it.
 *
 * Literals for the same client-safety reason as REFERENCE_COUNT (data/ep-modules
 * is paid content and must not reach a public chunk). Both are locked against
 * lib/ep-references.ts by tests/factual-claims-lock.test.ts.
 */
export const CRM_REFERENCE_COUNT = 63
export const CRM_CITATION_TOTAL = 136
