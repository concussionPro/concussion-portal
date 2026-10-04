#!/usr/bin/env node
/**
 * Gmail warm-lane setup, end to end, with NO secret ever printed.
 *
 *   node scripts/gmail-setup.mjs
 *
 * Reads ~/.cea-gmail.env (two lines: GMAIL_CLIENT_ID=… and GMAIL_CLIENT_SECRET=…),
 * runs the one-time OAuth consent (a browser tab opens; Zac clicks Allow as
 * zac@), then pushes GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and the new
 * GMAIL_REFRESH_TOKEN into the Vercel production env by piping each value
 * into `vercel env add`. On success the env file is deleted. Nothing sensitive
 * reaches stdout.
 */
import http from 'node:http'
import { exec, spawnSync } from 'node:child_process'
import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ENV_FILE = join(homedir(), '.cea-gmail.env')
if (!existsSync(ENV_FILE)) {
  console.error(`Missing ${ENV_FILE}. Create it with two lines:\nGMAIL_CLIENT_ID=...\nGMAIL_CLIENT_SECRET=...`)
  process.exit(1)
}
const kv = Object.fromEntries(
  readFileSync(ENV_FILE, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]
    }),
)
const CLIENT_ID = kv.GMAIL_CLIENT_ID
const CLIENT_SECRET = kv.GMAIL_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Env file must contain GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.')
  process.exit(1)
}
console.log(`Loaded client ${CLIENT_ID.slice(0, 12)}… (secret length ${CLIENT_SECRET.length}, not shown)`)

const PORT = 53682
const REDIRECT = `http://localhost:${PORT}/callback`
const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']
const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
  }).toString()

function vercelEnvAdd(name, value) {
  const r = spawnSync('npx', ['vercel', 'env', 'add', name, 'production', '--sensitive', '--force'], {
    input: value + '\n',
    encoding: 'utf8',
  })
  const ok = r.status === 0 || /Added Environment Variable|Updated Environment Variable/i.test(r.stdout + r.stderr)
  console.log(`${ok ? '✓' : '✗'} ${name} → Vercel production${ok ? '' : `\n${(r.stdout + r.stderr).replace(value, '[redacted]')}`}`)
  return ok
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname !== '/callback') return res.writeHead(404).end()
  const code = url.searchParams.get('code')
  const err = url.searchParams.get('error')
  if (err || !code) {
    res.writeHead(400, { 'content-type': 'text/plain' }).end(`Consent failed: ${err || 'no code'}`)
    console.error('Consent failed:', err || 'no code')
    server.close()
    process.exit(1)
  }
  const tokens = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
  }).then((r) => r.json())
  if (!tokens.refresh_token) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('Token exchange failed — see terminal.')
    console.error('Token exchange failed:', tokens.error, tokens.error_description || '')
    server.close()
    process.exit(1)
  }
  const who = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json())
  res.writeHead(200, { 'content-type': 'text/plain' }).end(`Done — consent granted for ${who.emailAddress}. You can close this tab.`)
  console.log('Consent granted for:', who.emailAddress)
  if (who.emailAddress !== 'zac@concussion-education-australia.com') {
    console.error('Wrong account — expected zac@concussion-education-australia.com. Nothing pushed. Re-run and sign in as zac@.')
    server.close()
    process.exit(1)
  }
  const ok =
    vercelEnvAdd('GMAIL_CLIENT_ID', CLIENT_ID) &&
    vercelEnvAdd('GMAIL_CLIENT_SECRET', CLIENT_SECRET) &&
    vercelEnvAdd('GMAIL_REFRESH_TOKEN', tokens.refresh_token)
  if (ok) {
    unlinkSync(ENV_FILE)
    console.log(`\nAll three set. ${ENV_FILE} deleted. Next: redeploy so production picks them up.`)
  } else {
    console.error('\nOne or more values did not reach Vercel. Env file kept so you can retry.')
  }
  server.close()
  process.exit(ok ? 0 : 1)
})

server.listen(PORT, () => {
  console.log('Browser consent opening — sign in as zac@concussion-education-australia.com and click Allow.')
  console.log('If no tab opens, paste this URL:\n' + authUrl + '\n')
  exec(`open "${authUrl}"`)
})
