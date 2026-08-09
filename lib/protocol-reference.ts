/**
 * THE PUBLISHED PROTOCOL — one source of truth for how it is cited.
 *
 * Before this module the DOI was a hardcoded string on twenty-plus surfaces:
 * every accreditation page (ACSM, CSEP, CEP-UK, SESNZ, HPCSA, CIMSPA), the
 * course dashboards, the pricing components, the evidence and cases pages, the
 * Cliniko listing and the international syllabus email. When v2 was deposited on
 * 2026-08-09 every one of them was still pointing at v1's version DOI — so an
 * accreditation reviewer clicking through from a submission would have read a
 * superseded document containing no PEM interlock.
 *
 * Centralising it means the next deposit is a one-line change here rather than
 * a sweep somebody has to remember.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONCEPT vs VERSION — Zenodo mints both, and they are not interchangeable.
 *
 *   CONCEPT DOI   resolves to the LATEST version, forever.
 *   VERSION DOI   resolves to one fixed deposit.
 *
 * Use CONCEPT for "our protocol is published, here it is" — the marketing,
 * accreditation and course surfaces. A reader should always land on current
 * guidance, and a pinned link would keep sending reviewers to a document
 * missing the safety layer.
 *
 * Use VERSION for a CONFORMANCE CLAIM — the clinical report states which
 * version the care delivered conformed to. That must not silently re-scope when
 * v3 is deposited: a signed, transmitted document asserting conformance would
 * otherwise change meaning under the clinician's feet.
 */

/** Always resolves to the latest deposited version. */
export const PROTOCOL_DOI = '10.5281/zenodo.21482633'
export const PROTOCOL_DOI_URL = `https://doi.org/${PROTOCOL_DOI}`

/** The version currently shipped and conformed to. */
export const PROTOCOL_VERSION = 2
export const PROTOCOL_VERSION_DOI = '10.5281/zenodo.21855932'
export const PROTOCOL_VERSION_DOI_URL = `https://doi.org/${PROTOCOL_VERSION_DOI}`

export const PROTOCOL_TITLE =
  'A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise ' +
  'Rehabilitation after Concussion (mild Traumatic Brain Injury)'

/** Short label for a link or badge: "Published protocol v2". */
export const PROTOCOL_LABEL = `Published protocol v${PROTOCOL_VERSION}`

/**
 * Visible DOI text that STATES THE VERSION while keeping the link itself
 * version-proof: "DOI 10.5281/zenodo.21482633 (v2)". An accreditation reviewer
 * reading a bare concept DOI has no way to know whether the document they are
 * about to open includes the safety layer; this tells them.
 */
export const PROTOCOL_DOI_LABEL = `DOI ${PROTOCOL_DOI} (v${PROTOCOL_VERSION})`

/** Full citation, for pages that print one. */
export const PROTOCOL_CITATION =
  `Lewis, Z. (2026). ${PROTOCOL_TITLE} (Version ${PROTOCOL_VERSION}). ` +
  `Zenodo. ${PROTOCOL_DOI_URL}`

/** What v2 added — used where a surface explains why the version matters. */
export const PROTOCOL_V2_SUMMARY =
  'Version 2 adds the post-exertional malaise interlock, the delivered-dose ' +
  'verification standard, and daily symptom surveillance.'
