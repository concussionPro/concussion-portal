import { NextResponse } from 'next/server'

/**
 * RETIRED (owner, 2026-07-05): the A$97 Reference+Toolkit bundle is no
 * longer purchasable. The webhook handler + isBookOwner access + the legacy
 * upgrade credit remain for existing owners; only NEW purchases are closed.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This product is no longer available. See /pricing for current options.' },
    { status: 410 },
  )
}
