/**
 * Resolve the buyer email that must be stamped on a Stripe Checkout Session
 * as customer_email — so checkout.session.expired rescue has someone to email.
 *
 * Session email (logged-in / email-gated) wins over the body field. Demo
 * placeholders are never accepted as a checkout identity.
 */
import { emailSchema } from '@/lib/schemas'
import { isDemoEmail } from '@/lib/demo-session'

/** Course types that mint a Stripe Checkout Session via /api/create-checkout. */
export const CHECKOUT_EMAIL_REQUIRED_TYPES = [
  'online-only',
  'full-course',
  'secure-seat',
  'international-online',
  'clinic-hub-pack',
] as const

export type CheckoutEmailRequiredType = (typeof CHECKOUT_EMAIL_REQUIRED_TYPES)[number]

export function isCheckoutEmailRequired(courseType: string): boolean {
  return (CHECKOUT_EMAIL_REQUIRED_TYPES as readonly string[]).includes(courseType)
}

export const CHECKOUT_EMAIL_REQUIRED_MESSAGE =
  'Enter your email so we can send your enrolment link if checkout is interrupted.'

/**
 * Pick a valid customer email from session + optional body email.
 * Returns normalized lowercase email, or an error suitable for a 400 body.
 */
export function resolveCheckoutCustomerEmail(
  sessionEmail: string | undefined,
  bodyEmail: string | undefined,
): { ok: true; email: string } | { ok: false; error: string } {
  const candidate =
    sessionEmail && !isDemoEmail(sessionEmail)
      ? sessionEmail
      : bodyEmail && !isDemoEmail(bodyEmail)
        ? bodyEmail
        : undefined
  const parsed = emailSchema.safeParse(candidate)
  if (!parsed.success) {
    return { ok: false, error: CHECKOUT_EMAIL_REQUIRED_MESSAGE }
  }
  return { ok: true, email: parsed.data }
}
