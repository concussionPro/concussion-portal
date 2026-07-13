/**
 * SST reporting — jurisdiction resolver.
 *
 * The core SST engine is PAYER-NEUTRAL: it produces the same measured facts
 * (HRt trajectory, band, verified sessions, stop-rule events) everywhere. What
 * changes by country is the SKIN — which report templates a clinician can emit.
 * This resolver is the single map from jurisdiction → available skins, so adding
 * a jurisdiction or a skin never touches the engine or the PMS adapters.
 */

/** Where the clinician/patient are being reported into. */
export type Jurisdiction = 'AU' | 'NZ' | 'INTL'

/**
 * The report templates SST can render. Each maps to a function in skins.ts.
 *
 * PRESCRIBED FORMS vs FREE-FORM (primary-source verified):
 *  - `acc884`/`acc885` are REAL prescribed ACC forms — we render the measured
 *    CONTENT to transcribe onto ACC's fillable form (the form layout is
 *    authoritative). `acc884` = Client Summary Report (outcome/end-of-service);
 *    `acc885` = Did Not Attend Report. Outcome reporting is the ACC884 — there
 *    is NO separate ACC progress-report form.
 *  - `rtw-summary` is a DATA SUMMARY only — the mandated AU workers-comp forms
 *    are state-specific (NSW AHTR, VIC AHRMP, QLD Form 32); this supplies data
 *    to populate them, it is not the form.
 *  - `rtp-clearance` supplies data for the sport clearance form (ASC Concussion
 *    referral & clearance form; AFL Medical Clearance form) — not a replacement.
 *  - `gp-report` and `medicolegal` are genuinely FREE-FORM: no standard form
 *    exists for a GP referral letter or a clinical/audit record.
 */
export type ReportSkinKind =
  | 'gp-report' // GP / referrer letter — no standard form (free-form)
  | 'rtp-clearance' // data for the sport clearance form (ASC / AFL)
  | 'rtw-summary' // data for the state workers-comp form (AHTR / AHRMP / Form 32)
  | 'medicolegal' // clinical/audit record — no standard form (free-form)
  | 'acc884' // NZ ACC Client Summary Report (prescribed form)
  | 'acc885' // NZ ACC Did Not Attend Report (prescribed form)

/** A resolved skin the UI can offer (kind + display label). */
export interface ReportSkin {
  kind: ReportSkinKind
  label: string
}

const SKIN_LABELS: Record<ReportSkinKind, string> = {
  'gp-report': 'GP / referrer report',
  'rtp-clearance': 'Return-to-play data (for the sport clearance form)',
  'rtw-summary': 'Return-to-work data (for the state WorkCover form)',
  medicolegal: 'Medicolegal record',
  acc884: 'ACC884 Client Summary Report',
  acc885: 'ACC885 Did Not Attend report',
}

const SKINS_BY_JURISDICTION: Record<Jurisdiction, ReportSkinKind[]> = {
  // NZ: ACC-first — the payer forms come before the generic clinical letters.
  NZ: ['acc884', 'acc885', 'gp-report', 'medicolegal'],
  // AU: sport + work + GP; no single national injury payer, so no ACC skins.
  AU: ['gp-report', 'rtp-clearance', 'rtw-summary', 'medicolegal'],
  // International: only the payer-neutral letters travel everywhere.
  INTL: ['gp-report', 'medicolegal'],
}

/** The skin kinds available in a jurisdiction (order = suggested UI order). */
export function getReportSkins(j: Jurisdiction): ReportSkinKind[] {
  return SKINS_BY_JURISDICTION[j]
}

/** The skins as {kind,label} pairs for direct UI rendering. */
export function getReportSkinOptions(j: Jurisdiction): ReportSkin[] {
  return getReportSkins(j).map((kind) => ({ kind, label: SKIN_LABELS[kind] }))
}

/** Human label for a single skin kind. */
export function reportSkinLabel(kind: ReportSkinKind): string {
  return SKIN_LABELS[kind]
}
