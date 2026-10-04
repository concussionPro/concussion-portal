/**
 * Gmail API client for the WARM lane — mail a human might reply to, sent as
 * zac@ from Zac's own Google Workspace mailbox (Zac 2026-10-04: five Resend
 * seat-lane emails delivered, zero replies; every email he sends from his own
 * mailbox gets answered).
 *
 * Dependency-free: OAuth refresh + two REST calls. Credentials live only in
 * the Vercel env (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN),
 * minted once by scripts/gmail-setup.mjs with gmail.send + gmail.readonly.
 *
 * Transactional mail (magic links, invoices, certificates) never comes
 * through here — it stays on Resend where speed and webhooks matter.
 */

export const GMAIL_SENDER = 'zac@concussion-education-australia.com'
export const GMAIL_SENDER_NAME = 'Zac Lewis'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://gmail.googleapis.com/gmail/v1/users/me'

let cached: { token: string; expiresAt: number } | null = null

export function gmailConfigured(): boolean {
  return !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN)
}

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID || '',
      client_secret: process.env.GMAIL_CLIENT_SECRET || '',
      refresh_token: process.env.GMAIL_REFRESH_TOKEN || '',
      grant_type: 'refresh_token',
    }),
  })
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(`gmail token refresh failed: ${data.error || res.status} ${data.error_description || ''}`.trim())
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) },
  })
  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const msg = typeof body === 'object' && body && 'error' in body ? JSON.stringify((body as { error: unknown }).error).slice(0, 300) : String(body).slice(0, 300)
    throw new Error(`gmail ${init.method || 'GET'} ${path} → ${res.status}: ${msg}`)
  }
  return body as T
}

/** RFC 2047 encode a header value when it carries non-ASCII (em dashes, names). */
export function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface MimeInput {
  to: string
  subject: string
  text: string
  html?: string
  /** Reply-To defaults to the sender; override only for a shared inbox. */
  replyTo?: string
  /** Extra headers (e.g. In-Reply-To / References when continuing a thread). */
  headers?: Record<string, string>
}

/**
 * Build the RFC 822 message. Plain text FIRST so a text-only reader shows the
 * note as written; HTML is the optional second alternative. Body parts are
 * base64 so UTF-8 survives every hop untouched. No tracking, no list headers:
 * this lane is one person writing to another.
 */
export function buildMime(m: MimeInput): string {
  const boundary = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  const lines: string[] = [
    `From: ${encodeHeader(GMAIL_SENDER_NAME)} <${GMAIL_SENDER}>`,
    `To: ${m.to}`,
    `Reply-To: ${m.replyTo || GMAIL_SENDER}`,
    `Subject: ${encodeHeader(m.subject)}`,
    'MIME-Version: 1.0',
  ]
  for (const [k, v] of Object.entries(m.headers || {})) lines.push(`${k}: ${v}`)
  const part = (type: string, body: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset="UTF-8"`, 'Content-Transfer-Encoding: base64', '', Buffer.from(body, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n')].join('\r\n')
  if (m.html) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, '', part('text/plain', m.text), part('text/html', m.html), `--${boundary}--`)
  } else {
    lines.push('Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '', Buffer.from(m.text, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'))
  }
  return lines.join('\r\n')
}

/**
 * Minimal HTML alternative derived from the plain text: paragraphs with real
 * spacing, the system font, links clickable, nothing else — so Gmail and
 * Outlook render the note the way a person would have typed it, while the
 * text part stays the canonical copy.
 */
export function textToSimpleHtml(text: string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const link = (t: string) => t.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#0d7377">${u}</a>`)
  const paras = text.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)
  const body = paras
    .map((p) => `<p style="margin:0 0 16px;line-height:1.5">${link(esc(p)).replace(/\n/g, '<br>')}</p>`)
    .join('')
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#0a0f14;max-width:620px">${body}</div>`
}

export interface GmailSendResult { id: string; threadId: string }

/** Send as zac@. The message lands in Zac's Sent folder like any other. */
export async function gmailSend(m: MimeInput): Promise<GmailSendResult> {
  const raw = base64url(Buffer.from(buildMime(m), 'utf8'))
  return api<GmailSendResult>('/messages/send', { method: 'POST', body: JSON.stringify({ raw }) })
}

export interface ThreadMessageMeta {
  id: string
  from: string
  date: string
  snippet: string
  internalDate: number
}

/**
 * Messages in a thread, metadata only. A message whose From is not zac@ is a
 * reply from the other side — the signal every sequence must stop on.
 */
export async function gmailThreadMessages(threadId: string): Promise<ThreadMessageMeta[]> {
  const t = await api<{ messages?: Array<{ id: string; snippet?: string; internalDate?: string; payload?: { headers?: Array<{ name: string; value: string }> } }> }>(
    `/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,
  )
  return (t.messages || []).map((msg) => {
    const h = (n: string) => msg.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value || ''
    return { id: msg.id, from: h('From'), date: h('Date'), snippet: msg.snippet || '', internalDate: Number(msg.internalDate || 0) }
  })
}

export function isReplyFromOtherSide(from: string): boolean {
  return !!from && !from.toLowerCase().includes(GMAIL_SENDER)
}

export async function gmailProfile(): Promise<{ emailAddress: string }> {
  return api<{ emailAddress: string }>('/profile')
}
