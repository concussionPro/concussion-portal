/**
 * SST Trainer end-to-end smoke test (real browser, manual-HR path).
 * Drives the full patient loop + verifies clinician-hub truth.
 *
 * Run:
 *   1. NEXT_PUBLIC_SST_STAGE_SECONDS=3 PORT=3789 npm run dev   (fast stage timer)
 *   2. node scripts/sst-e2e-smoke.mjs                          (needs playwright)
 *
 * Proves: code prefill+validate → symptoms → readiness → modality →
 * guided test (3 stages, threshold @142) → prescription (band 114–128) →
 * training session → save → reload persistence → server sync → hub renders
 * real numbers (not zeros). Requires DEMO00 (keyless demo clinic).
 * Cleanup DEMO00 test rows:  DELETE FROM sst_clinic_sessions
 *   WHERE upper(clinic_code)='DEMO00' AND patient_label ILIKE 'E2E %';
 */
// clinician hub verification. Fails loudly on any broken step.
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:3789'
const SHOTS = process.env.SHOTS || '/tmp/sst-shots'
const PATIENT = 'E2E Garmin ' + Date.now().toString().slice(-6)
import { mkdirSync } from 'fs'
mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }) // iPhone-ish
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE: ${m.text().slice(0, 300)}`) })

const shot = async (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })
const step = async (name, fn) => {
  try { await fn(); console.log(`OK   ${name}`) }
  catch (e) { console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); await shot(`FAIL-${name.replace(/\W+/g, '-')}`); throw e }
}

// ── 1. Land via QR link ──────────────────────────────────────────────────────
await step('load /sst-trainer?clinic=DEMO00', async () => {
  await page.goto(`${BASE}/sst-trainer?clinic=DEMO00`, { waitUntil: 'networkidle', timeout: 60000 })
})
await shot('01-landing')

// ── 2. Onboarding: code prefilled+validated, name, goal, manual HR ───────────
await step('clinic code prefilled + validated', async () => {
  await page.waitForSelector('text=/Demo Clinic/i', { timeout: 20000 })
})
await step('enter name', async () => {
  const nameInput = page.locator('input').filter({ hasNot: page.locator('[type=checkbox]') }).nth(1)
  // find by placeholder first
  const byPh = page.getByPlaceholder(/name/i)
  if (await byPh.count()) await byPh.first().fill(PATIENT)
  else await nameInput.fill(PATIENT)
})
await step('pick a goal', async () => {
  // goal grid: click the first goal option button
  const goal = page.getByRole('button', { name: /return|sport|work|school|training|running|gym|daily/i }).first()
  await goal.click()
})
await step('choose manual HR', async () => {
  await page.getByText(/type it in yourself/i).first().click()
})
await shot('02-onboarding-filled')
await step('continue past onboarding', async () => {
  const btn = page.getByRole('button', { name: /continue|start/i }).last()
  await btn.click()
  await page.waitForTimeout(800)
})
await shot('03-after-onboarding')

// ── 3. Symptoms ──────────────────────────────────────────────────────────────
await step('select symptoms', async () => {
  await page.waitForSelector('text=/headache/i', { timeout: 15000 })
  await page.getByText(/^headache$/i).first().click()
  await page.getByText(/dizziness/i).first().click()
  await page.getByRole('button', { name: /continue/i }).last().click()
})
await shot('04-symptoms')

// ── 4. Readiness ─────────────────────────────────────────────────────────────
await step('readiness: acknowledge + start', async () => {
  await page.waitForTimeout(600)
  // the acknowledgement is a custom aria-pressed toggle button
  const ack = page.locator('button[aria-pressed]').last()
  if ((await ack.getAttribute('aria-pressed')) !== 'true') await ack.click()
  const start = page.getByRole('button', { name: /start|begin/i }).last()
  await start.click()
})
await shot('05-readiness-done')

// ── 5. Modality setup ────────────────────────────────────────────────────────
await step('choose modality', async () => {
  await page.waitForSelector('text=/treadmill|stationary bike|brisk/i', { timeout: 15000 })
  await page.getByText(/brisk walking/i).first().click()
  const go = page.getByRole('button', { name: /start|begin|continue/i }).last()
  if (await go.isVisible().catch(() => false)) await go.click()
})
await shot('06-modality')

// ── 6. Guided test: 3 stages manual, then threshold on stage 3 ───────────────
const logStage = async (hr, symptomTarget) => {
  const hrInput = page.locator('input[inputmode=numeric], input[type=number]').first()
  await hrInput.fill(String(hr))
  if (symptomTarget != null) {
    const slider = page.locator('input[type=range]').first()
    await slider.fill(String(symptomTarget))
  }
  // wait out the 60s stage timer? NO — that would make this test 3+ min.
  // The spec says symptom-spike logs are ALWAYS allowed; for normal stages we
  // must wait for stage end. To keep e2e fast we accelerate via the app's own
  // rule: use the threshold/symptom path where possible, else wait for the
  // "Log minute" button to enable (up to 65s).
  const logBtn = page.getByRole('button', { name: /log/i }).first()
  await logBtn.click({ timeout: 70000 })
}
await step('test screen visible', async () => {
  await page.waitForSelector('text=/minute|stage/i', { timeout: 15000 })
})
await shot('07-test-start')
await step('stage 1 log (manual 110)', async () => { await logStage(110, null) })
await step('stage 2 log (manual 128)', async () => { await logStage(128, null) })
await step('stage 3 threshold (manual 142, symptoms +3)', async () => {
  const hrInput = page.locator('input[inputmode=numeric], input[type=number]').first()
  await hrInput.fill('142')
  // symptom level is a radiogroup (role=radio, aria-label 0..10) — click "3"
  const grp = page.locator('[role=radiogroup][aria-label*="symptom" i]').first()
  await grp.locator('[role=radio][aria-label="3"]').click()
  const thrBtn = page.getByRole('button', { name: /threshold|reaches/i }).first()
  await thrBtn.click({ timeout: 10000 })
})
await shot('08-test-threshold')

// ── 7. Result → prescription ─────────────────────────────────────────────────
await step('result shows HRt 142 and band 114–128', async () => {
  await page.waitForSelector('text=142', { timeout: 15000 })
  await page.waitForSelector('text=/114|115/', { timeout: 5000 })
})
await shot('09-result')
await step('continue to home', async () => {
  await page.getByRole('button', { name: /continue/i }).last().click()
  await page.waitForSelector('text=/session|band|welcome/i', { timeout: 15000 })
})
await shot('10-home')

// ── 8. Training session: brief, log readings, complete via early finish ─────
await step('start session', async () => {
  await page.getByRole('button', { name: /start.*session|session/i }).first().click()
  await page.waitForTimeout(800)
})
await shot('11-session')
await step('log 2 manual readings in band', async () => {
  for (const hr of [118, 122]) {
    const hrInput = page.locator('input[inputmode=numeric], input[type=number]').first()
    await hrInput.fill(String(hr))
    await page.getByRole('button', { name: /^log/i }).first().click()
    await page.waitForTimeout(300)
  }
})
await step('early finish', async () => {
  const finish = page.getByRole('button', { name: /finish|complete|end session/i }).first()
  await finish.click()
  await page.waitForTimeout(500)
  // possible confirm dialog
  const confirm = page.getByRole('button', { name: /finish|yes|end/i }).last()
  if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {})
})
await shot('12-summary')
await step('summary: end-feel + save', async () => {
  await page.getByRole('button', { name: /^same$/i }).first().click({ timeout: 10000 })
  await page.getByRole('button', { name: /save/i }).first().click()
  await page.waitForTimeout(1500)
})
await shot('13-after-save')

// ── 9. Persistence: reload lands on Home ────────────────────────────────────
await step('reload → welcome back (no re-onboarding)', async () => {
  await page.goto(`${BASE}/sst-trainer`, { waitUntil: 'networkidle' })
  await page.waitForSelector(`text=/welcome back/i`, { timeout: 15000 })
})
await shot('14-persistence')

// ── 10. Server truth: DEMO00 roster shows the patient with real numbers ─────
await step('API: clinic-sessions has the patient + non-zero session', async () => {
  const res = await ctx.request.get(`${BASE}/api/sst/clinic-sessions?code=DEMO00`)
  const data = await res.json()
  const me = (data.patients || []).find((p) => p.name === PATIENT)
  if (!me) throw new Error(`patient not in roster: ${JSON.stringify(data.patients?.map((p) => p.name))}`)
  if (me.hrt !== 142) throw new Error(`hrt=${me.hrt}, expected 142`)
  const s = me.sessions?.[me.sessions.length - 1]
  if (!s) throw new Error('no sessions synced')
  const avg = s.avgHeartRate ?? s.avgHr
  if (!avg || avg < 100) throw new Error(`avg HR looks wrong: ${JSON.stringify(s).slice(0, 200)}`)
  console.log(`     synced: hrt=${me.hrt} band=${me.bandLow}-${me.bandHigh} avg=${avg} eventType=${s.eventType}`)
})

// ── 11. Clinical hub renders the real patient (not zeros, not fixtures-only) ─
await step('clinical hub shows patient with real numbers', async () => {
  const hub = await ctx.newPage()
  hub.on('pageerror', (e) => errors.push(`HUB PAGEERROR: ${e.message}`))
  await hub.goto(`${BASE}/clinical-hub?clinic=DEMO00`, { waitUntil: 'networkidle', timeout: 60000 })
  await hub.waitForSelector(`text=${PATIENT}`, { timeout: 20000 })
  await hub.waitForTimeout(1500) // let the real-data fetch replace the roster + select
  // click the roster card (last match — the pinned review-queue entry is first)
  await hub.locator(`text=${PATIENT}`).last().click()
  await hub.waitForTimeout(1000)
  const body = await hub.textContent('body')
  if (!/HR threshold\s*142/.test(body.replace(/\s+/g,' '))) throw new Error('HRt 142 not in detail pane')
  if (/avg 0|0 bpm · 0 min/.test(body)) throw new Error('zeros rendered — payload mapping broken')
  console.log('     hub detail: ' + (body.replace(/\s+/g,' ').match(/HR threshold.{0,60}/)||[''])[0])
  await hub.screenshot({ path: `${SHOTS}/15-hub.png` })
})

console.log(errors.length ? `\nJS ERRORS (${errors.length}):\n` + errors.slice(0, 12).join('\n') : '\nNo JS errors.')
await browser.close()
process.exit(errors.some((e) => e.startsWith('PAGEERROR')) ? 2 : 0)
