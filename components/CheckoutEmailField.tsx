'use client'

/**
 * Low-friction email capture for CCM Stripe Checkout CTAs.
 * Prefills from /api/auth/session when logged in (non-demo); otherwise shows
 * a compact field so create-checkout can stamp customer_email for rescue.
 */
import { useEffect, useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isUsableSessionEmail(email: unknown): email is string {
  return (
    typeof email === 'string' &&
    EMAIL_RE.test(email) &&
    !email.endsWith('.local')
  )
}

export function useCheckoutEmail() {
  const [email, setEmail] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const e = data?.user?.email
        if (!data?.user?.isDemo && isUsableSessionEmail(e)) {
          setSessionEmail(e)
          setEmail(e)
        }
      })
      .catch(() => {
        /* anonymous — field stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const trimmed = email.trim().toLowerCase()
  const resolved =
    (sessionEmail && sessionEmail.toLowerCase()) ||
    (EMAIL_RE.test(trimmed) ? trimmed : null)

  return {
    email,
    setEmail,
    sessionEmail,
    /** Valid email to POST, or null if still missing/invalid. */
    resolved,
    loaded,
    /** True when the buyer must type an email (no session prefill). */
    needsField: loaded && !sessionEmail,
  }
}

export function CheckoutEmailField({
  email,
  setEmail,
  sessionEmail,
  disabled,
  className = '',
  inputId = 'checkout-email',
  placeholder = 'Email for your receipt & enrolment',
}: {
  email: string
  setEmail: (v: string) => void
  sessionEmail: string | null
  disabled?: boolean
  className?: string
  inputId?: string
  placeholder?: string
}) {
  if (sessionEmail) return null

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        Email for your receipt and enrolment
      </label>
      <input
        id={inputId}
        type="email"
        name="checkout-email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder={placeholder}
        value={email}
        disabled={disabled}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] disabled:opacity-50"
      />
      <p className="mt-1 text-[11px] leading-snug text-slate-500">
        Receipt & enrolment link if checkout is interrupted.
      </p>
    </div>
  )
}
