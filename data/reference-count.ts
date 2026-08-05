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
 */
export const REFERENCE_COUNT = 144
