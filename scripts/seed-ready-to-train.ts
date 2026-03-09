/**
 * Seed script: Write pre-collected interest data into Blob storage
 * as ready-to-train-{city}.json files.
 *
 * Run once: npx tsx scripts/seed-ready-to-train.ts
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env
 */

import 'dotenv/config'
import { put, list as listBlobs } from '@vercel/blob'

interface ReadyToTrainRegistration {
  email: string
  name: string
  city: string
  registeredAt: string
  completedAt: string
}

const seedData: Record<string, Array<{ email: string; name?: string }>> = {
  sydney: [
    { email: 'micah@purposehealthcare.com.au' },
    { email: 'cole@canterburyosteopathy.co.nz' },
  ],
  melbourne: [
    { email: 'cliff@williamstownosteo.com.au' },
    { email: 'joz9292@gmail.com' },
    { email: 'kyles@coastphysio.com.au' },
    { email: 'contact@peninsulaconcussionclinic.com.au', name: 'Lachlan Williams' },
    { email: 'akondal62@gmail.com', name: 'Amandeep' },
    { email: 'billyfgunn96@gmail.com' },
    { email: 'patrick.heenan20@gmail.com' },
  ],
  adelaide: [
    { email: 'agatadvier@gmail.com' },
    { email: 'chloe.taylor42@hotmail.com' },
    { email: 'ciska_helm@yahoo.co.uk' },
  ],
  wa: [
    { email: 'adam.spiroff@outlook.com' },
    { email: 'mereesha@injurysense.com.au' },
  ],
  'byron-bay': [
    { email: 'jessica.r.hendriks@gmail.com' },
  ],
}

async function loadExisting(blobPath: string): Promise<ReadyToTrainRegistration[]> {
  try {
    const { blobs } = await listBlobs()
    const existing = blobs
      .filter(b => b.pathname === blobPath)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    if (existing.length > 0) {
      const res = await fetch(`${existing[0].url}?t=${Date.now()}`, { cache: 'no-store' })
      return await res.json()
    }
  } catch (err) {
    console.warn(`Could not load existing data for ${blobPath}:`, err)
  }
  return []
}

async function seed() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is required. Set it in .env')
    process.exit(1)
  }

  const now = new Date().toISOString()

  for (const [city, entries] of Object.entries(seedData)) {
    const blobPath = `ready-to-train-${city}.json`
    const existing = await loadExisting(blobPath)
    const existingEmails = new Set(existing.map(r => r.email.toLowerCase()))

    let added = 0
    for (const entry of entries) {
      const email = entry.email.toLowerCase()
      if (existingEmails.has(email)) {
        console.log(`  Skip (duplicate): ${email}`)
        continue
      }

      existing.push({
        email,
        name: entry.name || email.split('@')[0],
        city,
        registeredAt: now,
        completedAt: now,
      })
      added++
    }

    await put(blobPath, JSON.stringify(existing, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })

    console.log(`${city}: ${added} added, ${existing.length} total`)
  }

  console.log('\nSeed complete!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
