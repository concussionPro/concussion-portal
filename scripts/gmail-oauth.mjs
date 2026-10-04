#!/usr/bin/env node
/**
 * One-time Gmail OAuth consent for the warm-mail lane (send as zac@ via the
 * Gmail API). Dependency-free.
 *
 *   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/gmail-oauth.mjs
 *
 * Opens a consent URL, catches Google's redirect on localhost:53682, swaps the
 * code for tokens and prints the REFRESH TOKEN to this terminal only. Nothing
 * is written to disk. Put the token into Vercel yourself:
 *
 *   npx vercel env add GMAIL_REFRESH_TOKEN production
 *
 * Scopes: gmail.send (send as the signed-in user) + gmail.readonly (reply
 * detection). Revoke any time at myaccount.google.com/permissions.
 */
import http from 'node:http'
import { exec } from 'node:child_process'

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in the environment first (see the instructions).')
  process.exit(1)
}

const PORT = 53682
const REDIRECT = `http://localhost:${PORT}/callback`
const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    access_type: 'offline', // refresh token
    prompt: 'consent', // force a refresh token even if previously granted
    scope: SCOPES.join(' '),
  }).toString()

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }
  const code = url.searchParams.get('code')
  const err = url.searchParams.get('error')
  if (err || !code) {
    res.writeHead(400, { 'content-type': 'text/plain' }).end(`Consent failed: ${err || 'no code'}`)
    console.error('Consent failed:', err || 'no code')
    server.close()
    process.exit(1)
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('No refresh token returned — see terminal.')
    console.error('No refresh_token in response:', JSON.stringify({ ...tokens, access_token: '[redacted]' }))
    server.close()
    process.exit(1)
  }
  // Confirm which account consented, so the token is never the wrong mailbox.
  const who = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json())
  res.writeHead(200, { 'content-type': 'text/plain' }).end(
    `Done — consent granted for ${who.emailAddress}. Go back to the terminal; you can close this tab.`,
  )
  console.log('\nConsent granted for:', who.emailAddress)
  console.log('\nGMAIL_REFRESH_TOKEN (copy the next line, then run: npx vercel env add GMAIL_REFRESH_TOKEN production):\n')
  console.log(tokens.refresh_token)
  console.log('\nThis token was printed only here. Clear your terminal scrollback after adding it to Vercel.\n')
  server.close()
})

server.listen(PORT, () => {
  console.log('Opening Google consent in your browser. Sign in as zac@concussion-education-australia.com.\n')
  console.log('If it does not open, paste this URL:\n\n' + authUrl + '\n')
  exec(`open "${authUrl}"`)
})
