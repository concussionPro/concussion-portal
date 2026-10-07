import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' })
const dir = '/private/tmp/claude-501/-Users-zaclewis/32abe5fa-409f-4a89-8149-b3acaa75794b/scratchpad'
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const go = (u) => p.goto('http://localhost:3115' + u, { waitUntil: 'load', timeout: 60000 })
await go('/blog/ais-concussion-brain-health-position-statement-2024'); await p.waitForTimeout(1200)
await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(400)
await p.screenshot({ path: dir + '/wo-blog-strip.png' })
await go('/scat-forms/scat6'); await p.waitForTimeout(1200)
await p.screenshot({ path: dir + '/wo-scat6-strip.png' })
await go('/concussion-rehab-mastery'); await p.waitForTimeout(1500)
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600)
await p.screenshot({ path: dir + '/wo-crm-endcap.png' })
await go('/clinical-hub'); await p.waitForTimeout(1800)
// open first demo patient
const row = await p.locator('text=recovery').first().isVisible().catch(() => false)
await p.locator('main, body').first()
const patient = p.locator('[class*=cursor-pointer], button, tr, div').filter({ hasText: /yrs|F ·|M ·/ }).first()
try { await patient.click({ timeout: 4000 }) } catch {}
await p.waitForTimeout(1200)
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600)
await p.screenshot({ path: dir + '/wo-hub-booking.png' })
// demo tour → sidebar card
await go('/demo/clinic'); await p.waitForTimeout(2500)
await p.screenshot({ path: dir + '/wo-demo-sidebar.png' })
await b.close(); console.log('done')
