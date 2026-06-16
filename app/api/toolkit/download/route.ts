import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import {
  DISCHARGE_TEMPLATES,
  OUTREACH_TEMPLATES,
  ADMIN_COURSE_MODULES,
  DOCUMENTATION_PRINCIPLES,
  type DischargeTemplate,
  type OutreachTemplate,
  type AdminCourseModule,
} from '@/data/hub-program-content'
import { isAdminRequest } from '@/lib/require-admin'
import { verifySessionToken } from '@/lib/jwt-session'
import { isBookOwner } from '@/lib/users'

type Kit = 'all' | 'clinical' | 'outreach' | 'admin'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const kit = (url.searchParams.get('kit') ?? 'all') as Kit

  if (!['all', 'clinical', 'outreach', 'admin'].includes(kit)) {
    return NextResponse.json({ error: 'Invalid kit' }, { status: 400 })
  }

  // Auth — PAID ACCESS ONLY. Downloads ship the full, copyable template files,
  // so they are never available to prospects. Two paths only:
  //  1. Admin session / header — full access.
  //  2. Paid user session cookie (same gating as /api/download): accessLevel
  //     online-only / full-course, or bundle (reference + toolkit) buyer
  //     flagged in the DB via reference_book_purchased_at.
  // Prospect access keys (cold-pitch /p/<slug> portals) get NO download — the
  // on-screen preview is title/structure-only and print/PDF is blocked. A `k`
  // query param is ignored here on purpose; downloading requires a purchase.
  const isAdmin = isAdminRequest(req)

  if (!isAdmin) {
    const sessionToken = req.cookies.get('session')?.value
    const sessionData = sessionToken ? verifySessionToken(sessionToken) : null
    if (!sessionData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const paidAccess =
      sessionData.accessLevel === 'online-only' ||
      sessionData.accessLevel === 'full-course'
    const bundleOwner = !paidAccess ? await isBookOwner(sessionData.email) : false
    if (!paidAccess && !bundleOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const zip = new JSZip()
  const rootName = 'Hub-Program-Toolkit'
  const root = zip.folder(rootName)!

  // README
  root.file('README.md', readme(kit, null))

  if (kit === 'all' || kit === 'clinical') {
    const folder = root.folder('01-Clinical-Toolkit')!
    DISCHARGE_TEMPLATES.forEach((t, i) => {
      folder.file(`${String(i + 1).padStart(2, '0')}-${t.slug}.html`, renderClinicalHTML(t))
    })
    folder.file('00-Documentation-Principles.html', renderPrinciplesHTML(DOCUMENTATION_PRINCIPLES))
  }

  if (kit === 'all' || kit === 'outreach') {
    const folder = root.folder('02-Outreach-Kit')!
    OUTREACH_TEMPLATES.forEach((t, i) => {
      folder.file(`${String(i + 1).padStart(2, '0')}-${t.slug}.html`, renderOutreachHTML(t))
    })
  }

  if (kit === 'all' || kit === 'admin') {
    const folder = root.folder('03-Admin-Workflow')!
    ADMIN_COURSE_MODULES.forEach((m) => {
      folder.file(`${String(m.id).padStart(2, '0')}-${m.slug}.html`, renderAdminModuleHTML(m))
    })
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const filename = `${rootName}-${new Date().toISOString().split('T')[0]}.zip`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML generation — portable standalone docs (system fonts, inline CSS)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a2332;line-height:1.55;font-size:13px;padding:32px;max-width:820px;margin:0 auto;background:#fff}
  h1{font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.1;margin-bottom:12px}
  h2{font-size:16px;font-weight:700;margin-top:20px;margin-bottom:8px;letter-spacing:-0.005em}
  p{margin:8px 0}
  .mark{display:flex;align-items:center;gap:10px;border-bottom:1px solid #cbd5e1;padding-bottom:14px;margin-bottom:20px}
  .mark .logo{width:36px;height:36px;border-radius:50%;border:2px solid #0d7377;flex:none;position:relative}
  .mark .logo::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1.5px solid #0a5a5e}
  .mark .logo::before{content:"";position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:#f59e0b;transform:translate(-50%,-50%)}
  .mark b{font-size:13px;font-weight:700;letter-spacing:-0.005em}
  .mark span{font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;display:block;margin-top:2px}
  .eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#0a5a5e;font-weight:700;margin-bottom:8px}
  .meta-row{display:flex;gap:8px;align-items:center;margin-bottom:12px;font-size:11px;color:#64748b}
  .badge{padding:3px 8px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase}
  .badge-accent{background:#0a5a5e;color:#fff}
  .badge-slate{background:#1e293b;color:#fff}
  .badge-amber{background:#f59e0b;color:#fff}
  .purpose,.aud{font-size:12.5px;color:#475569;margin-bottom:5px}
  .purpose b,.aud b{color:#1a2332}
  .field{display:inline-block;border-bottom:1px dotted #0a5a5e;background:#e6f3f4;padding:0 6px;color:#0a5a5e;font-weight:600;border-radius:2px 2px 0 0;min-width:140px;cursor:text;outline:none}
  .field:empty::before{content:attr(data-ph);color:#94a3b8;font-weight:400;font-style:italic}
  .field:focus{background:#fff7ed;box-shadow:0 0 0 2px #f59e0b;border-bottom-color:#f59e0b}
  .fillable-hint{background:#fffbeb;border:1px solid #fde68a;border-radius:5px;padding:9px 13px;font-size:11px;color:#92400e;margin-bottom:16px;line-height:1.5}
  @media print{.field{background:#fff;box-shadow:none;color:#1a2332;border-bottom:1px solid #1a2332;min-width:160px}.field:empty::before{content:""}.fillable-hint{display:none}}
  .checklist{margin:16px 0;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:12px 16px}
  .checklist .ct{font-size:9px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;color:#0a5a5e;margin-bottom:8px}
  .checklist ul{list-style:none}
  .checklist li{position:relative;padding:3px 0 3px 22px;font-size:11.5px}
  .checklist li::before{content:"";position:absolute;left:0;top:4px;width:12px;height:12px;border:1.5px solid #0d7377;border-radius:2px}
  .signoff{display:grid;grid-template-columns:1.2fr 1.4fr 0.8fr;gap:24px;margin-top:32px;page-break-inside:avoid}
  .signoff .line{border-bottom:1.5px solid #1a2332;height:30px}
  .signoff .lab{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-top:5px}
  .compliance{margin-top:20px;background:#0f172a;color:#e2e8f0;border-radius:6px;padding:14px 18px;page-break-inside:avoid}
  .compliance .ct{font-size:9px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;color:#5eead4;margin-bottom:6px}
  .compliance p{font-size:10.5px;line-height:1.55;margin:4px 0;color:#cbd5e1}
  .subject{background:#f8fafc;border:1px solid #e2e8f0;padding:8px 12px;border-radius:5px;margin:8px 0 16px}
  .subject .sl{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;font-weight:700;margin-bottom:4px}
  .followup{margin-top:18px;page-break-inside:avoid}
  .followup .ft{font-size:9px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;color:#0a5a5e;margin-bottom:6px}
  .followup table{width:100%;border-collapse:collapse}
  .followup td{border-top:1px solid #e2e8f0;padding:7px 6px 7px 0;font-size:11.5px;vertical-align:top}
  .followup td:first-child{font-family:ui-monospace,monospace;font-size:10px;color:#0a5a5e;width:64px;white-space:nowrap}
  .advert-note{margin-top:20px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:5px;padding:12px 16px;page-break-inside:avoid}
  .advert-note .ant{font-size:9px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;color:#334155;margin-bottom:6px}
  .advert-note p{font-size:11px;color:#475569;line-height:1.5}
  .outcomes{margin:14px 0;background:#e6f3f4;border-radius:5px;padding:12px 16px}
  .outcomes .oct{font-size:9px;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;color:#0a5a5e;margin-bottom:6px}
  .outcomes ul{list-style:none}
  .outcomes li{position:relative;padding:3px 0 3px 22px;font-size:11.5px}
  .outcomes li::before{content:"✓";position:absolute;left:0;top:2px;color:#0d7377;font-weight:700}
  .kc{margin-top:20px;border:1.5px solid #0d7377;border-radius:6px;padding:14px 18px;background:#f0f9fa;page-break-inside:avoid}
  .kc .kct{font-size:9px;text-transform:uppercase;letter-spacing:0.16em;color:#0a5a5e;font-weight:700;margin-bottom:8px}
  .kc .kcq{font-weight:700;font-size:12.5px;margin-bottom:9px}
  .kc-opts{list-style:none}
  .kc-opts li{position:relative;padding:5px 0 5px 28px;font-size:11.5px}
  .kc-opts li .kl{position:absolute;left:0;top:4px;font-family:ui-monospace,monospace;font-size:9px;font-weight:700;color:#64748b;border:1px solid #cbd5e1;border-radius:3px;width:18px;height:18px;display:grid;place-items:center;background:#fff}
  .kc-opts li.correct{font-weight:700}
  .kc-opts li.correct .kl{color:#fff;background:#0d7377;border-color:#0d7377}
  .kc-ans{margin-top:10px;border-top:1px dashed #cbd5e1;padding-top:9px;font-size:11px;color:#475569}
  .kc-ans b{color:#0a5a5e}
  @media print{body{padding:0;max-width:none}}
  @page{size:A4;margin:14mm}
`

function doc(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${BASE_CSS}</style>
</head><body>${body}</body></html>`
}

function letterhead(): string {
  return `<div class="mark"><div class="logo"></div><div><b>Concussion Education Australia</b><span>Concussion Clinical Mastery · Hub Program</span></div></div>`
}

// Shown at the top of any doc that contains fillable fields. Hidden on print.
function fillableHint(): string {
  return `<div class="fillable-hint"><b>✎ This is a fillable template.</b> Click any highlighted field to type your clinic's details, then <b>File → Print → Save as PDF</b>. You can also print it blank and complete by hand. Apply your clinic letterhead before issuing to patients.</div>`
}

// Render {field_name} placeholders as genuinely fillable inputs: each is a
// contenteditable span the clinic clicks and types into directly in the
// browser, then prints to PDF (or prints blank and completes by hand). The
// field-name shows as a greyed prompt that disappears as soon as they type.
function parseFields(text: string): string {
  return escapeHtml(text).replace(
    /\{([a-z_]+)\}/g,
    (_, name) => `<span class="field" contenteditable="true" spellcheck="false" data-ph="${name.replace(/_/g, ' ')}"></span>`,
  )
}

function renderClinicalHTML(t: DischargeTemplate): string {
  const body = `
${letterhead()}
<p class="eyebrow">Clinical Toolkit · Discharge Template</p>
<div class="meta-row">
  <span class="badge badge-accent">Clinical toolkit</span>
  <span>${t.estimatedReadMinutes} min read</span>
</div>
<h1>${escapeHtml(t.title)}</h1>
${fillableHint()}
<p class="purpose"><b>When to use.</b> ${escapeHtml(t.purpose)}</p>
<p class="aud"><b>Recipient:</b> ${escapeHtml(t.audience)}</p>
<div class="checklist">
  <div class="ct">Before you issue — clinician checklist</div>
  <ul>
    <li>Every field completed — no blanks or {braces} left in.</li>
    <li>Reviewed, signed and dated by the treating clinician.</li>
    <li>Patient / guardian consent obtained to share with this recipient.</li>
    <li>A signed copy retained in the patient record.</li>
  </ul>
</div>
${t.sections.map((s) => `${s.heading ? `<h2>${parseFields(s.heading)}</h2>` : ''}${s.body.map((line) => `<p>${parseFields(line)}</p>`).join('')}`).join('')}
<div class="signoff">
  <div><div class="line"></div><div class="lab">Practitioner signature</div></div>
  <div><div class="line"></div><div class="lab">Name &amp; AHPRA registration no.</div></div>
  <div><div class="line"></div><div class="lab">Date</div></div>
</div>
<div class="compliance">
  <div class="ct">Compliance &amp; disclaimer</div>
  ${t.complianceFooter.map((line) => `<p>${parseFields(line)}</p>`).join('')}
</div>
`
  return doc(t.title, body)
}

function renderOutreachHTML(t: OutreachTemplate): string {
  const body = `
${letterhead()}
<p class="eyebrow">Outreach Kit · ${escapeHtml(t.channel.replace('-', ' '))}</p>
<div class="meta-row">
  <span class="badge badge-slate">Outreach kit</span>
  <span>${escapeHtml(t.channel.replace('-', ' '))}</span>
</div>
<h1>${escapeHtml(t.title)}</h1>
${fillableHint()}
<p class="purpose"><b>When to use.</b> ${escapeHtml(t.purpose)}</p>
<p class="aud"><b>Recipient:</b> ${escapeHtml(t.audience)}</p>
${t.subject ? `<div class="subject"><div class="sl">Subject line</div><div>${parseFields(t.subject)}</div></div>` : ''}
${t.sections.map((s) => `${s.heading ? `<h2>${parseFields(s.heading)}</h2>` : ''}${s.body.map((line) => `<p>${parseFields(line)}</p>`).join('')}`).join('')}
${t.followUpSchedule && t.followUpSchedule.length ? `
<div class="followup">
  <div class="ft">Follow-up schedule</div>
  <table>${t.followUpSchedule.map((r) => `<tr><td>+${r.day} day${r.day !== 1 ? 's' : ''}</td><td>${parseFields(r.action)}</td></tr>`).join('')}</table>
</div>` : ''}
<div class="advert-note">
  <div class="ant">Advertising compliance note</div>
  <p>This outreach material describes the clinic's capability and training. No specific clinical-outcome claims, comparative statements about other providers, or testimonials about treatment results are included. AHPRA advertising guidelines (s.133 National Law) apply — review any locally-added testimonials or claims before sending. Use the clinic letterhead and treating clinician name on outbound copies.</p>
</div>
`
  return doc(t.title, body)
}

function renderAdminModuleHTML(m: AdminCourseModule): string {
  const body = `
${letterhead()}
<p class="eyebrow">Front-Desk Micro-Course · Module ${m.id}</p>
<div class="meta-row">
  <span class="badge badge-amber">Module ${m.id}</span>
  <span>${m.durationMinutes} min</span>
</div>
<h1>${escapeHtml(m.title)}</h1>
<div class="outcomes">
  <div class="oct">You will be able to</div>
  <ul>${m.learningOutcomes.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
</div>
${m.sections.map((s) => `${s.heading ? `<h2>${escapeHtml(s.heading)}</h2>` : ''}${s.body.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}`).join('')}
${m.knowledgeCheck ? `
<div class="kc">
  <div class="kct">Knowledge check</div>
  <div class="kcq">${escapeHtml(m.knowledgeCheck.question)}</div>
  <ul class="kc-opts">
    ${m.knowledgeCheck.options.map((opt, i) => `<li class="${i === m.knowledgeCheck!.correctIndex ? 'correct' : ''}"><span class="kl">${String.fromCharCode(65 + i)}</span>${escapeHtml(opt)}</li>`).join('')}
  </ul>
  <div class="kc-ans"><b>Correct answer: ${String.fromCharCode(65 + m.knowledgeCheck.correctIndex)}.</b> ${escapeHtml(m.knowledgeCheck.rationale)}</div>
</div>` : ''}
`
  return doc(m.title, body)
}

function renderPrinciplesHTML(p: { title: string; body: string[] }): string {
  const body = `
${letterhead()}
<p class="eyebrow">Reference · Global Documentation Principles</p>
<h1>${escapeHtml(p.title)}</h1>
${p.body.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
<p style="font-size:11px;color:#64748b;font-style:italic;margin-top:16px">Not a substitute for the clinic's own indemnity insurer review. The clinic's PI insurer (Avant / Guild / MIPS) should sign off on the local-letterhead version before issue.</p>
`
  return doc(p.title, body)
}

function readme(kit: Kit, prospectName: string | null): string {
  const scope = kit === 'all' ? 'Full toolkit' : `${kit.charAt(0).toUpperCase() + kit.slice(1)} only`
  const note = prospectName
    ? `\n\nThis preview download was generated for ${prospectName.replace(/-/g, ' ')}. Some folders (Admin Workflow) are not included in preview mode — they activate once the Hub Program is in place.`
    : ''
  return `# Concussion Hub Program — Toolkit

${scope}. Generated ${new Date().toISOString().split('T')[0]}.

## Folders

- 01-Clinical-Toolkit/ — 6 fillable AHPRA-aligned discharge templates (GP handover, school RTP, parent plan, sports club RTP, WorkCover, NDIS) + global Documentation Principles.
- 02-Outreach-Kit/ — 6 referral-building outreach templates (school intro, sports club, GP practice, surf life saving, triathlon/cycling, capability one-pager) with follow-up schedules.
- 03-Admin-Workflow/ — 8 front-desk micro-course modules + knowledge checks.

## How to use

Each HTML file is a standalone, fillable, print-ready document. Open in any browser, then **click any highlighted field and type your clinic's / patient's details directly** — no editing required. When done, File → Print → Save as PDF. (You can also print blank and complete by hand.) Apply your clinic letterhead before issue.

## Compliance

All clinical templates carry a built-in compliance & disclaimer footer covering: scope of practice, AHPRA record-keeping, patient consent, current consensus (Amsterdam 2023), and AI-drafting integrity. Recommend the clinic's indemnity insurer (Avant / Guild / MIPS) signs off on the on-letterhead version before issue.

## Source

Concussion Education Australia · concussion-education-australia.com${note}
`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
