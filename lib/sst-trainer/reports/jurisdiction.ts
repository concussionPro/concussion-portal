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

/** The report templates SST can render. Each maps to a function in skins.ts. */
export type ReportSkinKind =
  | 'gp-report' // GP / referrer update — universal
  | 'rtp-clearance' // return-to-play clearance record (sport)
  | 'rtw-summary' // return-to-work summary (WorkCover-style)
  | 'medicolegal' // defensibility export — full audit trail
  | 'acc884' // NZ ACC allied-health treatment plan / extension
  | 'acc885' // NZ ACC progress / attendance report
  | 'six-monthly' // NZ ACC six-monthly review

/** A resolved skin the UI can offer (kind + display label). */
export interface ReportSkin {
  kind: ReportSkinKind
  label: string
}

const SKIN_LABELS: Record<ReportSkinKind, string> = {
  'gp-report': 'GP / referrer report',
  'rtp-clearance': 'Return-to-play clearance',
  'rtw-summary': 'Return-to-work summary',
  medicolegal: 'Medicolegal record',
  acc884: 'ACC884 treatment plan',
  acc885: 'ACC885 progress report',
  'six-monthly': 'ACC six-monthly review',
}

const SKINS_BY_JURISDICTION: Record<Jurisdiction, ReportSkinKind[]> = {
  // NZ: ACC-first — the payer forms come before the generic clinical letters.
  NZ: ['acc884', 'acc885', 'six-monthly', 'gp-report', 'medicolegal'],
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
