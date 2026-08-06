'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Upload, Loader2, CheckCircle2, AlertCircle, Download, ArrowLeft } from 'lucide-react'

interface Contact {
  email: string
  name?: string
  date?: string
  acceptsMarketing?: boolean
}

interface ImportResult {
  success: boolean
  created?: number
  emailed?: number
  skipped?: number
  errors?: number
  skippedNoConsent?: number
  /** Dropped because the address is on email_suppression (unsub / bounce /
   *  complaint / STOP). Zero-tolerance policy — must be visible, not silent. */
  skippedSuppressed?: number
  total?: number
  error?: string
}

// Parse Squarespace CSV export format: Email, First Name, Last Name, Created On, ...
// Tolerates extra columns and missing name fields.
function parseCsv(raw: string): Contact[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []

  const parseRow = (row: string) => {
    // Minimal CSV parser — handles quoted fields with embedded commas
    const out: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '"') {
        if (inQ && row[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQ = !inQ
        }
      } else if (ch === ',' && !inQ) {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur)
    return out.map((s) => s.trim())
  }

  const header = parseRow(lines[0]).map((h) => h.toLowerCase())
  const emailIdx = header.findIndex((h) => h === 'email' || h.includes('email'))
  const firstIdx = header.findIndex((h) => h === 'first name' || h === 'firstname' || h.startsWith('first'))
  const lastIdx = header.findIndex((h) => h === 'last name' || h === 'lastname' || h.startsWith('last'))
  const dateIdx = header.findIndex((h) => h.includes('created') || h.includes('date') || h.includes('signed up'))
  // Squarespace export: 'Accepts Marketing' column. Truthy values like
  // 'yes' / 'true' / '1' / '✓' = consented. Anything else (including empty) = not consented.
  const acceptsMarketingIdx = header.findIndex((h) => h.includes('accepts marketing') || h === 'marketing' || h.includes('subscribed'))

  if (emailIdx < 0) return []

  const contacts: Contact[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i])
    const email = (cells[emailIdx] || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue
    const first = firstIdx >= 0 ? cells[firstIdx]?.trim() : ''
    const last = lastIdx >= 0 ? cells[lastIdx]?.trim() : ''
    const name = [first, last].filter(Boolean).join(' ')
    const date = dateIdx >= 0 ? cells[dateIdx]?.trim() : undefined
    let acceptsMarketing: boolean | undefined = undefined
    if (acceptsMarketingIdx >= 0) {
      const v = (cells[acceptsMarketingIdx] || '').trim().toLowerCase()
      acceptsMarketing = v === 'yes' || v === 'true' || v === '1' || v === '✓' || v === 'y'
    }
    contacts.push({
      email: email.toLowerCase(),
      ...(name ? { name } : {}),
      ...(date ? { date } : {}),
      ...(acceptsMarketing !== undefined ? { acceptsMarketing } : {}),
    })
  }
  return contacts
}

export default function ImportContactsPage() {
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const parsed = useMemo(() => parseCsv(csv), [csv])
  // Upper bound only: the server also drops declined-marketing, suppressed
  // and already-existing addresses, so the real send count is ≤ this.
  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return parsed.filter(
      (c) => c.acceptsMarketing !== false && c.date && new Date(c.date).getTime() >= cutoff,
    ).length
  }, [parsed])

  async function handleImport() {
    if (parsed.length === 0 || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/import-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contacts: parsed }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) setCsv('')
    } catch (e) {
      setResult({ success: false, error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsv(text)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Import Squarespace Contacts</h1>
        <p className="text-slate-600 text-sm mb-6">
          The Squarespace Profiles API requires a Commerce Advanced plan, so the 4-hourly sync cron can&apos;t run.
          Use this page instead: export CSV from Squarespace, paste or upload here, we create preview accounts and
          send the Day 0 welcome email to anyone signed up in the last 30 days.
        </p>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            How to export from Squarespace
          </h2>
          <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
            <li>Squarespace Dashboard → <strong>Contacts</strong></li>
            <li>Click <strong>Export</strong> (top-right) → choose CSV → include Email, First Name, Last Name, Created On</li>
            <li>Open the downloaded file, copy all → paste below, or use the file picker</li>
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-900">CSV</label>
            <label className="text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-900 inline-flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload .csv file
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
            </label>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={12}
            placeholder="Email,First Name,Last Name,Created On,Accepts Marketing&#10;mmilosev@gmail.com,,, Apr 25 2026,&#10;..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />

          {parsed.length > 0 && (
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
              <strong>{parsed.length}</strong> valid email{parsed.length === 1 ? '' : 's'} parsed.
              {recentCount > 0 && (
                <> Up to <strong>{recentCount}</strong> signed up in the last 30 days will receive the welcome email (suppressed and already-existing addresses are skipped server-side); older ones are imported silently.</>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={handleImport}
              disabled={parsed.length === 0 || loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import {parsed.length > 0 ? `${parsed.length} contact${parsed.length === 1 ? '' : 's'}` : ''}
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-xl border p-4 ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {result.success ? (
                  <>
                    <p className="font-semibold text-emerald-900 mb-1">Import complete</p>
                    <p className="text-emerald-800">
                      {result.created} created, {result.emailed} welcome email{result.emailed === 1 ? '' : 's'} sent,{' '}
                      {result.skipped} skipped (already existed),{' '}
                      {result.skippedNoConsent ?? 0} skipped (declined marketing),{' '}
                      {result.skippedSuppressed ?? 0} skipped (suppressed — unsub/bounce/complaint),{' '}
                      {result.errors} errors — {result.total} total processed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-900 mb-1">Import failed</p>
                    <p className="text-red-800">{result.error}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
