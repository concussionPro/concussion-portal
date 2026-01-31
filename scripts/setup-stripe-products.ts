/**
 * Stripe Product Setup Script
 *
 * Run once to create products and prices in Stripe
 * Usage: npx tsx scripts/setup-stripe-products.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

async function setupProducts() {
  console.log('🚀 Creating Stripe products and prices...\n')

  try {
    // Product 1: Individual Professional
    const individualProduct = await stripe.products.create({
      name: 'Individual Professional',
      description: 'Comprehensive concussion education with 10 CPD hours, lifetime access, and clinical toolkit',
      metadata: {
        access_level: 'online-only',
        cpd_hours: '10',
      },
    })

    const individualAnnual = await stripe.prices.create({
      product: individualProduct.id,
      unit_amount: 49000, // $490 AUD
      currency: 'aud',
      recurring: { interval: 'year' },
      nickname: 'Annual',
    })

    const individualMonthly = await stripe.prices.create({
      product: individualProduct.id,
      unit_amount: 4900, // $49 AUD
      currency: 'aud',
      recurring: { interval: 'month' },
      nickname: 'Monthly',
    })

    console.log('✅ Individual Professional:')
    console.log(`   Annual: ${individualAnnual.id}`)
    console.log(`   Monthly: ${individualMonthly.id}\n`)

    // Product 2: Premium Professional
    const premiumProduct = await stripe.products.create({
      name: 'Premium Professional',
      description: 'Everything in Individual + quarterly webinars, advanced workshops, priority support',
      metadata: {
        access_level: 'online-only',
        cpd_hours: '10',
        premium: 'true',
      },
    })

    const premiumAnnual = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 89000, // $890 AUD
      currency: 'aud',
      recurring: { interval: 'year' },
      nickname: 'Annual',
    })

    const premiumMonthly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 8900, // $89 AUD
      currency: 'aud',
      recurring: { interval: 'month' },
      nickname: 'Monthly',
    })

    console.log('✅ Premium Professional:')
    console.log(`   Annual: ${premiumAnnual.id}`)
    console.log(`   Monthly: ${premiumMonthly.id}\n`)

    // Product 3: Team License
    const teamProduct = await stripe.products.create({
      name: 'Clinic/Team License',
      description: '5-user team access with white-label certificates, team dashboard, and dedicated support',
      metadata: {
        access_level: 'online-only',
        cpd_hours: '10',
        team_size: '5',
      },
    })

    const teamAnnual = await stripe.prices.create({
      product: teamProduct.id,
      unit_amount: 478800, // $4,788 AUD
      currency: 'aud',
      recurring: { interval: 'year' },
      nickname: 'Annual',
    })

    console.log('✅ Clinic/Team License:')
    console.log(`   Annual: ${teamAnnual.id}\n`)

    // Product 4: SCAT Mastery Short Course
    const scatProduct = await stripe.products.create({
      name: 'SCAT6/SCOAT6 Mastery + Clinical Toolkit',
      description: '2-hour short course with clinical toolkit, checklists, and certificate (2 CPD hours)',
      metadata: {
        access_level: 'preview',
        cpd_hours: '2',
        short_course: 'true',
      },
    })

    const scatPrice = await stripe.prices.create({
      product: scatProduct.id,
      unit_amount: 0, // FREE as lead magnet
      currency: 'aud',
      nickname: 'One-time',
    })

    console.log('✅ SCAT Mastery Short Course:')
    console.log(`   One-time: ${scatPrice.id}\n`)

    // Output summary for .env.local
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Copy these to your .env.local file:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`STRIPE_PRICE_INDIVIDUAL_ANNUAL=${individualAnnual.id}`)
    console.log(`STRIPE_PRICE_INDIVIDUAL_MONTHLY=${individualMonthly.id}`)
    console.log(`STRIPE_PRICE_PREMIUM_ANNUAL=${premiumAnnual.id}`)
    console.log(`STRIPE_PRICE_PREMIUM_MONTHLY=${premiumMonthly.id}`)
    console.log(`STRIPE_PRICE_TEAM_ANNUAL=${teamAnnual.id}`)
    console.log(`STRIPE_PRICE_SCAT_MASTERY=${scatPrice.id}`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Error creating products:', error)
    throw error
  }
}

setupProducts()
