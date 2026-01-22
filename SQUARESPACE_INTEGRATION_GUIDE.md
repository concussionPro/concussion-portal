# ConcussionPro Portal - Squarespace Payment Integration Guide

## Current Security Status

### ⚠️ CRITICAL SECURITY ISSUES TO FIX

**1. Default Access Bypass (HIGH RISK)**
- **File:** `/lib/trial.ts` line 27
- **Issue:** `return true` as default gives everyone access to all modules
- **Fix:** Change to `return false` immediately

**2. Demo Credentials (MEDIUM RISK)**
- **File:** `/lib/auth.ts` lines 16-19
- **Issue:** Hardcoded demo credentials `demo@concussionpro.com / demo123`
- **Fix:** Remove before production launch

**3. Preview Content Exposure (LOW RISK)**
- **Current:** First section of all 8 modules is visible in preview
- **Issue:** Users see ~10% of content for free
- **Assessment:** This is actually GOOD for conversion (shows value)
- **Recommendation:** Keep as-is, it's a feature not a bug

---

## Authentication System Overview

### Current Setup
- **Storage:** Browser localStorage (client-side only)
- **Auth Method:** Email + password
- **Protection:** `<ProtectedRoute>` wrapper on module pages
- **Access Control:** `hasModuleAccess()` function checks paid status

### What's Protected ✅
- `/dashboard` - User dashboard (requires login)
- `/modules/[id]` - All module content (requires login + paid status)
- `/learning` - Learning suite (requires login)
- `/clinical-toolkit` - Resources (requires login)

### What's Public ✅
- `/` - Homepage
- `/preview` - Course preview (first section of each module)
- `/assessment` - Free knowledge test
- `/in-person` - Workshop details
- `/login` - Login page

---

## SOLUTION: Simplified Email-Only Login + Squarespace Integration

### Step 1: Implement Magic Link Authentication

Replace password authentication with magic links (like Notion, Slack, Linear):

**Create:** `/lib/magicLink.ts`
```typescript
import { sendEmail } from './email'

export async function sendMagicLink(email: string): Promise<boolean> {
  // Generate secure token (6-digit code or URL token)
  const token = Math.random().toString(36).substring(2, 15)
  const expiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes

  // Store token in database or localStorage for demo
  if (typeof window !== 'undefined') {
    const tokens = JSON.parse(localStorage.getItem('magic_tokens') || '{}')
    tokens[email] = { token, expiresAt }
    localStorage.setItem('magic_tokens', JSON.stringify(tokens))
  }

  // Send email with login link
  const loginUrl = `${window.location.origin}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`

  return await sendEmail({
    to: email,
    subject: 'Your ConcussionPro Login Link',
    html: `
      <h2>Login to ConcussionPro</h2>
      <p>Click the link below to access your course:</p>
      <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #5b9aa6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
        Access Your Course
      </a>
      <p>This link expires in 15 minutes.</p>
      <p>Or enter this code: <strong>${token.substring(0, 6).toUpperCase()}</strong></p>
    `
  })
}

export function verifyMagicLink(email: string, token: string): boolean {
  if (typeof window === 'undefined') return false

  const tokens = JSON.parse(localStorage.getItem('magic_tokens') || '{}')
  const stored = tokens[email]

  if (!stored) return false
  if (stored.expiresAt < Date.now()) return false
  if (stored.token !== token) return false

  // Valid token - clean up
  delete tokens[email]
  localStorage.setItem('magic_tokens', JSON.stringify(tokens))

  return true
}
```

**Updated Login Flow:**
```tsx
// app/login/page.tsx - Simplified
<form onSubmit={handleSubmit}>
  <input
    type="email"
    placeholder="your.email@clinic.com"
    required
  />
  <button type="submit">
    Send Login Link
  </button>
</form>

// After submission:
// "Check your email! We sent you a login link to {email}"
```

---

## Step 2: Squarespace Checkout Integration

### Architecture Overview

```
User clicks "Enroll Now"
  → Redirects to Squarespace checkout (shop URL)
  → User enters email + payment info
  → Squarespace processes payment
  → Webhook fired to your server
  → Server verifies purchase & creates user account
  → User receives email: "Welcome! Click to access course"
  → User clicks link → auto-logged in → access granted
```

### Implementation Options

#### **OPTION A: Webhook + Backend API (Recommended)**

**Requirements:**
- Backend server (Node.js, Python Flask, Vercel serverless function)
- Database to store users (Supabase, Firebase, PostgreSQL)
- Email service (Resend, SendGrid, Postmark)

**Squarespace Webhook Setup:**
1. Go to Squarespace → Settings → Advanced → Webhooks
2. Add webhook endpoint: `https://your-api.com/webhooks/squarespace-order`
3. Subscribe to: `order.create` event

**Backend Implementation:**

```javascript
// api/webhooks/squarespace-order.js (Vercel serverless function)
import { db } from '@/lib/database'
import { sendMagicLink } from '@/lib/magicLink'

export default async function handler(req, res) {
  // Verify webhook signature (Squarespace provides this)
  const signature = req.headers['x-squarespace-signature']
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const order = req.body

  // Check if order contains ConcussionPro course
  const courseProduct = order.lineItems.find(item =>
    item.productId === 'YOUR_SQUARESPACE_PRODUCT_ID' // Get from Squarespace
  )

  if (!courseProduct) {
    return res.status(200).json({ message: 'Not a course order' })
  }

  // Extract customer email
  const email = order.customerEmail
  const name = `${order.billingAddress.firstName} ${order.billingAddress.lastName}`

  // Create user in database
  const user = await db.users.create({
    email,
    name,
    enrolledAt: new Date().toISOString(),
    isPaidUser: true,
    orderId: order.id,
    squarespaceCustomerId: order.customerId,
  })

  // Send welcome email with magic link
  await sendMagicLink(email, {
    subject: 'Welcome to ConcussionPro! 🎉',
    template: 'welcome',
    data: { name }
  })

  res.status(200).json({ success: true })
}
```

**Database Schema (Supabase example):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_paid_user BOOLEAN DEFAULT true,
  order_id TEXT,
  squarespace_customer_id TEXT,
  workshop_date DATE,
  workshop_location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### **OPTION B: Manual Enrollment (Simple, No Code)**

**Process:**
1. User pays on Squarespace
2. You receive order notification email
3. You manually add their email to a Google Sheet or Airtable
4. User tries to login → system checks Google Sheet → grants access

**Implementation:**
```typescript
// lib/enrollment.ts
export async function checkEnrollment(email: string): Promise<boolean> {
  // Fetch from Google Sheets API
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Enrollments!A:A?key=${API_KEY}`
  )
  const data = await response.json()
  const enrolledEmails = data.values.flat()

  return enrolledEmails.includes(email.toLowerCase())
}
```

**Pros:** No backend needed, works immediately
**Cons:** Manual work, doesn't scale, no automation

#### **OPTION C: Squarespace Commerce API (Advanced)**

Use Squarespace Commerce API to query orders programmatically.

**Implementation:**
```typescript
// lib/squarespaceVerify.ts
export async function verifyPurchase(email: string): Promise<boolean> {
  const response = await fetch(
    `https://api.squarespace.com/1.0/commerce/orders`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.SQUARESPACE_API_KEY}`,
        'User-Agent': 'ConcussionPro Portal'
      }
    }
  )

  const orders = await response.json()

  // Check if email has purchased the course product
  return orders.result.some(order =>
    order.customerEmail === email &&
    order.lineItems.some(item =>
      item.productId === process.env.COURSE_PRODUCT_ID
    ) &&
    order.fulfillmentStatus === 'FULFILLED'
  )
}
```

---

## Step 3: Immediate Security Fixes

**Fix 1: Lock Down Default Access**

```typescript
// lib/trial.ts
export function hasModuleAccess(moduleId: number): boolean {
  if (typeof window === 'undefined') return false // Changed from true

  const isPaidUser = localStorage.getItem('isPaidUser')

  // Paid users have access to everything
  if (isPaidUser === 'true') return true

  // Trial users only have access to Module 1
  const trialStarted = localStorage.getItem('trialStarted')
  if (trialStarted === 'true') {
    return moduleId === 1
  }

  // Default: NO ACCESS (was true, now false)
  return false
}
```

**Fix 2: Remove Demo Credentials**

```typescript
// lib/auth.ts
export function authenticate(email: string): Promise<User | null> {
  // Remove hardcoded demo credentials

  // Check backend API or database
  return checkEnrollment(email)
}
```

**Fix 3: Add Email Verification**

```typescript
// lib/auth.ts
export async function loginWithEmail(email: string): Promise<boolean> {
  // 1. Check if user is enrolled (paid)
  const isEnrolled = await checkEnrollment(email)

  if (!isEnrolled) {
    throw new Error('Email not found. Please enroll at concussion-education-australia.com')
  }

  // 2. Send magic link
  await sendMagicLink(email)

  return true
}
```

---

## Step 4: Recommended Implementation Plan

### Phase 1: Immediate (Before Launch) - 1 hour
1. ✅ Fix `hasModuleAccess()` default to `return false`
2. ✅ Remove demo credentials
3. ✅ Test that modules are actually locked without payment

### Phase 2: Simple Auth (Launch Day) - 2 hours
1. ✅ Implement magic link email authentication
2. ✅ Set up email service (Resend is easiest: resend.com)
3. ✅ Update login page to email-only (no password)
4. ✅ Create manual enrollment spreadsheet

### Phase 3: Payment Integration (Week 1) - 4 hours
1. ✅ Set up Squarespace webhook endpoint
2. ✅ Create Vercel serverless function to receive webhooks
3. ✅ Set up Supabase database for user storage
4. ✅ Test end-to-end: Purchase → Webhook → Email → Login → Access

### Phase 4: Polish (Week 2) - 2 hours
1. ✅ Add welcome email sequence
2. ✅ Add workshop date selection in enrollment flow
3. ✅ Add certificate generation after completion
4. ✅ Analytics tracking (who enrolled, completion rates)

---

## Email Service Setup (Resend - Recommended)

**Why Resend:**
- Free tier: 3,000 emails/month (enough for 100 students)
- 2-minute setup
- React email templates
- Great deliverability

**Setup:**
```bash
npm install resend
```

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink(email: string, token: string) {
  await resend.emails.send({
    from: 'ConcussionPro <noreply@concussion-education-australia.com>',
    to: email,
    subject: 'Your ConcussionPro Login Link',
    html: `
      <h2>Welcome to ConcussionPro!</h2>
      <p>Click below to access your course:</p>
      <a href="${process.env.NEXT_PUBLIC_URL}/auth/verify?token=${token}&email=${email}">
        Access Your Course
      </a>
      <p>This link expires in 15 minutes.</p>
    `
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'Zac from ConcussionPro <zac@concussion-education-australia.com>',
    to: email,
    subject: 'Welcome to ConcussionPro - Get Started',
    html: `
      <h2>Hi ${name},</h2>
      <p>Welcome to ConcussionPro! Your enrollment is confirmed.</p>
      <h3>What's Next:</h3>
      <ol>
        <li>Access your dashboard and start Module 1</li>
        <li>Choose your workshop date (Melbourne, Sydney, or Byron Bay)</li>
        <li>Complete all 8 modules before your workshop</li>
      </ol>
      <a href="${process.env.NEXT_PUBLIC_URL}/login">Access Your Course</a>
      <p>Questions? Reply to this email - I read every message.</p>
      <p>- Zac</p>
    `
  })
}
```

---

## Environment Variables Needed

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_URL=https://portal.concussion-education-australia.com

# For Squarespace integration
SQUARESPACE_WEBHOOK_SECRET=your_webhook_secret
SQUARESPACE_API_KEY=your_api_key # If using Commerce API
COURSE_PRODUCT_ID=your_product_id # From Squarespace

# Database (Supabase example)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

---

## Testing Checklist

### Before Launch:
- [ ] Try accessing `/modules/1` without login → Should redirect to `/login`
- [ ] Try accessing `/modules/1` after login but without payment → Should show "Enroll" message
- [ ] Try accessing `/dashboard` without login → Should redirect
- [ ] Test magic link email delivery (check spam folder)
- [ ] Test magic link expiration (15 minutes)
- [ ] Verify preview page doesn't expose full content

### After Squarespace Integration:
- [ ] Make test purchase on Squarespace
- [ ] Verify webhook received
- [ ] Verify user created in database
- [ ] Verify welcome email sent
- [ ] Verify login works
- [ ] Verify module access granted

---

## Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Resend (Email)** | 3,000/month | $20/mo for 50k |
| **Supabase (Database)** | 500MB, 50k rows | $25/mo for 8GB |
| **Vercel (Hosting)** | 100GB bandwidth | $20/mo Pro |
| **Total Monthly** | $0 | $65/mo |

**For 100 students/year:** Free tier is sufficient
**For 500+ students/year:** Upgrade to paid ($65/month)

---

## Support & Troubleshooting

### Common Issues:

**"Module still accessible without payment"**
- Check: Is `hasModuleAccess()` returning correct value?
- Check: Is `isPaidUser` localStorage variable set correctly?
- Fix: Clear localStorage and test again

**"Magic link not arriving"**
- Check: Email service API key correct?
- Check: Spam folder
- Check: Resend dashboard for delivery status
- Fix: Use different email provider or add SPF/DKIM records

**"Webhook not firing from Squarespace"**
- Check: Webhook endpoint URL correct and publicly accessible?
- Check: Squarespace webhook logs in dashboard
- Fix: Test with Postman first, then connect to Squarespace

---

## Next Steps

1. **Right now:** Fix security issues (change `return true` to `return false`)
2. **Today:** Set up Resend account and test sending emails
3. **Tomorrow:** Implement magic link authentication
4. **This week:** Set up Squarespace webhook integration
5. **Launch:** Test full flow with real purchase

**Need help?** Let me know which implementation option you prefer and I'll provide the exact code files to create.
