'use client'

import { useEffect, useState, Suspense } from 'react'

/**
 * /join-clinic?key=CEA-XXXX-XXXX — a clinic team member redeems their clinic's
 * Hub access key for their own login. The key (forwarded by whoever bought the
 * clinic access) is the auth; the server enforces the paid seat cap.
 */
export default function JoinClinicPage() {
  return (
    <Suspense fallback={null}>
      <JoinClinic />
    </Suspense>
  )
}

function JoinClinic() {
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'clinician' | 'admin'>('clinician')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get('key')
    if (k) setKey(k.trim().toUpperCase())
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('submitting')
    try {
      const res = await fetch('/api/hub/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: key, email, name, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setStatus('idle')
        return
      }
      setStatus('done')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <Wrap>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">✓</div>
          <h1 className="text-xl font-bold text-slate-900">You&rsquo;re in</h1>
          <p className="mt-2 text-sm text-slate-600">
            We&rsquo;ve emailed <strong>{email}</strong> a one-click login link. Open it to start —
            your full course access, clinical toolkit and forms are all ready.
          </p>
          <p className="mt-3 text-xs text-slate-400">No email in a minute? Check spam, or contact your clinic.</p>
        </div>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <h1 className="text-xl font-bold text-slate-900">Join your clinic&rsquo;s CEA access</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Your clinic has full access to the Concussion Clinical Mastery course + toolkit. Redeem your
        seat below and we&rsquo;ll email you a login.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <Field label="Clinic access key">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="CEA-XXXX-XXXX"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono tracking-wide focus:border-teal-500 focus:outline-none"
          />
        </Field>
        <Field label="Your name">
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none" />
        </Field>
        <Field label="Your work email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none" />
        </Field>
        <Field label="Your role">
          <div className="flex gap-2">
            {(['clinician', 'admin'] as const).map((r) => (
              <button type="button" key={r} onClick={() => setRole(r)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${role === r ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                {r === 'admin' ? 'Front-desk / admin' : 'Clinician'}
              </button>
            ))}
          </div>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={status === 'submitting'}
          className="w-full rounded-lg bg-[#16243f] px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
          {status === 'submitting' ? 'Setting up…' : 'Get my login'}
        </button>
      </form>
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}
