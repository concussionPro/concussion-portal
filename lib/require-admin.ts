/**
 * Unified admin auth check for API routes that live outside /api/admin/*
 * (where middleware already enforces). Accepts:
 *   - admin_session cookie (browser, after /api/admin/login)
 *   - x-admin-key header (scripts, curl)
 *   - Authorization: Bearer <ADMIN_API_KEY> (cron, CLIs)
 */

import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session'

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

export function isAdminRequest(request: NextRequest | Request): boolean {
  // Cookie path — NextRequest exposes cookies; plain Request doesn't, fall back to header.
  const cookieVal = 'cookies' in request
    ? (request as NextRequest).cookies.get(ADMIN_COOKIE_NAME)?.value
    : parseCookieHeader(request.headers.get('cookie') || '', ADMIN_COOKIE_NAME)
  if (cookieVal && verifyAdminSessionToken(cookieVal)) return true

  const envKey = process.env.ADMIN_API_KEY
  if (!envKey) return false

  const headerKey = request.headers.get('x-admin-key')
  if (headerKey && timingSafeStringEqual(headerKey, envKey)) return true

  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const bearer = auth.slice(7)
    if (timingSafeStringEqual(bearer, envKey)) return true
  }

  return false
}

function parseCookieHeader(header: string, name: string): string | undefined {
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}
