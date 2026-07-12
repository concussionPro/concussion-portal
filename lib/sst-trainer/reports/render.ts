/**
 * SST report RENDERER — one structured-content → HTML function for every skin.
 *
 * The skins in ./skins.ts emit a payer-neutral `ReportContent` structure
 * ({ title, sections }); this renderer is the single place that turns that
 * structure into clean, branded, print-ready HTML. A new skin never touches
 * this file; a new output format (PMS note, plain text) is a new renderer that
 * consumes the same `ReportContent`. That separation mirrors the engine/skin
 * split documented in skins.ts.
 *
 * VISUAL LANGUAGE: matches the existing gp-report-html.ts house style — CEA
 * teal (#0d7377) accents, slate ink, a thin teal footer rule, single-column A4
 * that prints to one page cleanly. No efficacy or diagnostic language is added
 * here; the renderer only lays out what a skin already wrote.
 *
 * ISOLATED: pure function, no I/O, no route wiring.
 */

import type { ReportContent, ReportSection } from './skins'

export interface RenderReportOptions {
  /**
   * When set, stamps a prominent DRAFT banner across the top and a faint
   * diagonal watermark down the page. Used for skins whose field mapping is
   * not yet verified against the authority's current form (e.g. ACC884 v2).
   */
  draftBanner?: string
  /** Supervising clinic / provider line shown under the title. */
  clinicName?: string
  /** Extra note appended to the standard decision-support footer line. */
  footerNote?: string
  /** Human date label for "Report generated …" (defaults to today, en-AU). */
  generatedOn?: string
}

const TEAL = '#0d7377'
const AMBER = '#b45309'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function todayEnAu(): string {
  return new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Section body paragraphs → escaped <p> block. */
function renderBody(body: string[] | undefined): string {
  if (!body || body.length === 0) return ''
  return body.map((p) => `<p class="body">${esc(p)}</p>`).join('\n')
}

/** Section fields → a label:value definition table (or an audit list). */
function renderFields(section: ReportSection): string {
  const fields = section.fields
  if (!fields || fields.length === 0) return ''
  const isAudit = section.kind === 'audit' || section.kind === 'trajectory'
  if (isAudit) {
    // Timestamped audit rows read best as a fixed-label ledger.
    const rows = fields
      .map(
        (f) =>
          `<tr><td class="k">${esc(f.label)}</td><td class="v mono">${esc(f.value)}</td></tr>`,
      )
      .join('\n')
    return `<table class="audit">${rows}</table>`
  }
  const rows = fields
    .map((f) => `<tr><th scope="row">${esc(f.label)}</th><td>${esc(f.value)}</td></tr>`)
    .join('\n')
  return `<table class="fields">${rows}</table>`
}

function renderSection(section: ReportSection): string {
  const cls = section.kind ? ` class="sec sec-${section.kind}"` : ' class="sec"'
  return `<section${cls}>
  <h2>${esc(section.heading)}</h2>
  ${renderBody(section.body)}
  ${renderFields(section)}
</section>`
}

/**
 * Turn a skin's `ReportContent` into standalone, print-ready branded HTML.
 * One renderer for every skin — the section `kind` drives the styling.
 */
export function renderReportContentToHtml(
  content: ReportContent,
  opts: RenderReportOptions = {},
): string {
  const generated = opts.generatedOn ?? todayEnAu()
  const draft = opts.draftBanner
    ? `<div class="draft-banner">${esc(opts.draftBanner)}</div>`
    : ''
  const watermark = opts.draftBanner ? `<div class="watermark" aria-hidden="true">DRAFT</div>` : ''
  const clinicLine = opts.clinicName
    ? `<span class="clinic">${esc(opts.clinicName)}</span> &middot; `
    : ''
  const footerExtra = opts.footerNote ? ` ${esc(opts.footerNote)}` : ''
  const sections = content.sections.map(renderSection).join('\n')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(content.title)}</title>
<style>
  :root { --teal: ${TEAL}; --amber: ${AMBER}; }
  * { box-sizing: border-box; }
  body {
    font: 13px/1.55 -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1e293b; max-width: 720px; margin: 32px auto; padding: 0 22px;
    position: relative;
  }
  h1 { font-size: 19px; margin: 0 0 3px; color: #0f172a; }
  h2 { font-size: 13.5px; margin: 20px 0 6px; color: #0f172a;
       border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
  .meta { color: #64748b; font-size: 11.5px; margin: 0 0 14px; }
  .meta .clinic { color: #334155; font-weight: 600; }
  .sec { margin-bottom: 4px; }
  .body { margin: 4px 0 8px; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; margin: 4px 0 6px; }
  table.fields th, table.fields td { border: 1px solid #e2e8f0; padding: 5px 9px; text-align: left; vertical-align: top; }
  table.fields th { background: #f8fafc; font-weight: 600; width: 38%; color: #334155; }
  table.audit td { border: 1px solid #eef2f6; padding: 4px 9px; vertical-align: top; }
  table.audit td.k { width: 26%; color: #475569; font-weight: 600; white-space: nowrap; }
  table.audit td.v { color: #1e293b; }
  .mono { font-family: 'SF Mono', ui-monospace, 'Menlo', monospace; font-size: 11.5px; }
  .sec-trajectory h2, .sec-audit h2 { color: var(--teal); }
  .sec-outcome, .sec-narrative { }
  .foot { margin-top: 26px; color: #64748b; font-size: 10.5px; border-top: 2px solid var(--teal); padding-top: 10px; }
  .sig { margin-top: 26px; }
  .sig span { display: inline-block; border-top: 1px solid #94a3b8; min-width: 280px; padding-top: 4px; color: #475569; font-size: 11.5px; }
  .draft-banner {
    background: repeating-linear-gradient(45deg, #fef3c7, #fef3c7 12px, #fde68a 12px, #fde68a 24px);
    border: 1.5px solid var(--amber); color: #7c2d12; font-weight: 700; font-size: 12.5px;
    text-align: center; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; letter-spacing: .2px;
  }
  .watermark {
    position: fixed; top: 42%; left: 50%; transform: translate(-50%, -50%) rotate(-32deg);
    font-size: 120px; font-weight: 800; color: rgba(180, 83, 9, 0.07);
    letter-spacing: 8px; pointer-events: none; z-index: 0; user-select: none;
  }
  body > *:not(.watermark) { position: relative; z-index: 1; }
  @media print { body { margin: 0 auto; } @page { margin: 14mm; } }
</style></head><body>
${watermark}
${draft}
<h1>${esc(content.title)}</h1>
<p class="meta">${clinicLine}Report generated ${esc(generated)} &middot; Generated by SST Trainer &middot; Concussion Education Australia</p>
${sections}
<div class="sig"><span>Supervising clinician — name, signature, date</span></div>
<p class="foot">Generated by SST Trainer (Concussion Education Australia) from clinic-supervised program data. Decision-support only — this report does not constitute a diagnosis, prognosis or clearance; the supervising clinician reviews and signs before transmission. Heart-rate values marked verified were captured from a connected sensor; manual or camera entries are never presented as verified.${footerExtra}</p>
</body></html>`
}
