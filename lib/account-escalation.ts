/**
 * "Does this account own anything?" — the guard for EMAIL-ONLY instant login.
 *
 * /api/signup-free and /api/email-gate mint a real session cookie from an email
 * address ALONE (no link, no token). That is fine for a brand-new lead and for
 * an account that owns nothing. For anybody else it is an account takeover: the
 * browser that types the address becomes the customer.
 *
 * The 2026-07-12 guard asked only `access_level !== 'preview'`. Every
 * entitlement shipped since then rides ALONGSIDE a 'preview' access level,
 * because the product streams are deliberately isolated:
 *
 *   - CRM / EP course, and every short course → course_purchases rows
 *   - SST clinic (Clinical Testing workspace) → users.sst_entitled_at
 *   - Clinical Reference Text bundle          → users.reference_book_purchased_at
 *   - AI-course / RTP enrolment               → users.ai_course_enrolled
 *   - Hub Pack owner                          → course_hubs.owner_email
 *
 * so a paying CRM buyer and an SST clinic owner both looked exactly like a free
 * lead. Posting their address returned a live session for their account, which
 * reads their paid course, their clinic's private viewKey (and through it every
 * patient's label + heart-rate history), and their Stripe billing portal.
 *
 * FAILS CLOSED: any error answers `true`, i.e. "treat as owned — send a magic
 * link instead of a cookie". Never mint a session we cannot prove is unowned.
 */
import type { User } from '@/lib/users'
import { isBookOwner, hasSstEntitlement } from '@/lib/users'
import { getOwnedCourses } from '@/lib/course-purchases'
import { isUserEnrolled } from '@/lib/ai-course/access'
import { getHubByOwner } from '@/lib/course-hub'

export async function hasElevatedEntitlement(
  user: Pick<User, 'email' | 'accessLevel'>,
): Promise<boolean> {
  // Paid CCM level — the original check, still the cheapest signal.
  if (user.accessLevel !== 'preview') return true

  const email = user.email.trim().toLowerCase()
  if (!email) return true

  try {
    const [ownedCourses, sstClinic, bookBundle, aiEnrolled, hub] = await Promise.all([
      getOwnedCourses(email),
      hasSstEntitlement(email),
      isBookOwner(email),
      isUserEnrolled(email),
      getHubByOwner(email),
    ])
    return (
      ownedCourses.length > 0 ||
      sstClinic ||
      bookBundle ||
      aiEnrolled ||
      hub !== null
    )
  } catch (err) {
    console.error(
      `[account-escalation] entitlement lookup failed for ${email.slice(0, 3)}*** — failing closed:`,
      err,
    )
    return true
  }
}
