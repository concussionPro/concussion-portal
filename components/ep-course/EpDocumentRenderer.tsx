/**
 * Renders an EpDocument as a clean, printable "sheet". Server component (no
 * hooks). The page chrome (nav, back link, print button) is marked print:hidden
 * by the page; this renderer is the part that prints.
 *
 * Block types are intentionally simple and map to genuinely usable, fillable
 * clinical artefacts: ruled fill-in fields, checkbox lists, blank recording
 * grids, and scope/key callouts consistent with the EP modules.
 */

import { Key, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { DocBlock, EpDocument } from '@/data/ep-documents'
import { SCOPE_FOOTER } from '@/data/ep-documents'

const CALLOUT_STYLE = {
  key: {
    Icon: Key,
    wrap: 'border-teal-200 bg-teal-50',
    icon: 'text-teal-600',
    label: 'text-teal-800',
  },
  scope: {
    Icon: ShieldAlert,
    wrap: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    label: 'text-blue-800',
  },
  warning: {
    Icon: AlertTriangle,
    wrap: 'border-amber-300 bg-amber-50',
    icon: 'text-amber-600',
    label: 'text-amber-800',
  },
} as const

const CALLOUT_LABEL = { key: 'Key', scope: 'Scope', warning: 'Red flag' } as const

function RuledField({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {hint && <span className="text-[11px] italic text-slate-400">{hint}</span>}
      </div>
      <div className="mt-5 border-b border-slate-300" />
    </div>
  )
}

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'section':
      return (
        <h2 className="mt-8 border-b-2 border-slate-200 pb-1.5 text-base font-bold uppercase tracking-[0.06em] text-slate-800">
          {block.title}
        </h2>
      )
    case 'sub':
      return <h3 className="mt-5 text-sm font-bold text-slate-800">{block.title}</h3>
    case 'p':
      return <p className="mt-3 text-sm leading-relaxed text-slate-700">{block.text}</p>
    case 'note':
      return (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          {block.text}
        </p>
      )
    case 'list':
      return (
        <ul className="mt-3 space-y-1.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'checklist':
      return (
        <div className="mt-3">
          {block.title && <p className="mb-2 text-sm font-semibold text-slate-700">{block.title}</p>}
          <ul className="space-y-2">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 border-slate-400" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'fields':
      return (
        <div className={`mt-4 grid gap-x-8 gap-y-5 ${block.cols === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {block.items.map((f, i) => (
            <RuledField key={i} label={f.label} hint={f.hint} />
          ))}
        </div>
      )
    case 'grid':
      return (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {block.columns.map((c, i) => (
                  <th
                    key={i}
                    className="border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-semibold text-slate-700"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: block.rows }).map((_, r) => (
                <tr key={r}>
                  {block.columns.map((_, c) => (
                    <td key={c} className="h-8 border border-slate-300 px-2 py-1 align-top" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.note && <p className="mt-2 text-[11px] italic leading-relaxed text-slate-400">{block.note}</p>}
        </div>
      )
    case 'callout': {
      const s = CALLOUT_STYLE[block.tone]
      const Icon = s.Icon
      return (
        <div className={`mt-4 flex gap-3 rounded-lg border p-3.5 ${s.wrap}`}>
          <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${s.icon}`} />
          <p className="text-sm leading-relaxed text-slate-700">
            <span className={`font-bold ${s.label}`}>{CALLOUT_LABEL[block.tone]}: </span>
            {block.text}
          </p>
        </div>
      )
    }
    case 'signature':
      return (
        <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <RuledField label="AEP name" />
          <RuledField label="ESSA accreditation no." />
          <RuledField label="Signature" />
          <RuledField label="Date" />
        </div>
      )
    default:
      return null
  }
}

export function EpDocumentRenderer({ doc }: { doc: EpDocument }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-10">
      <header className="border-b-2 border-slate-800 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">
          Concussion Education Australia · EP Clinical Document
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{doc.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{doc.purpose}</p>
      </header>

      <div className="mt-2">
        {doc.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-4">
        <p className="text-[11px] leading-relaxed text-slate-400">{SCOPE_FOOTER}</p>
        <p className="mt-2 text-[11px] text-slate-400">
          Confidential health information once completed — handle and store per the Australian Privacy Principles.
          © Concussion Education Australia. Provided to enrolled clinicians for use in their own practice.
        </p>
      </footer>
    </article>
  )
}
