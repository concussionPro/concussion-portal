# ConcussionPro Portal - Deployment Guide

Complete guide for deploying the ConcussionPro Portal to Vercel and integrating with Squarespace.

---

## 📋 Pre-Deployment Checklist

### Required Files & Content
- [ ] All PDF files in `public/docs/Clinical Toolkit/` or cloud storage
- [ ] Android chrome icons (192x192, 512x512)
- [ ] Favicon and other brand assets
- [ ] Environment variables configured

### Accounts Needed
- [ ] Vercel account (free tier works)
- [ ] GitHub/GitLab account (for repo hosting)
- [ ] Squarespace site with Commerce plan
- [ ] Email service provider (SendGrid, Resend, etc.) - optional for magic links

---

## 🚀 PART 1: Deploy to Vercel

### Step 1: Push Code to GitHub

```bash
cd /Users/zaclewis/ConcussionPro/portal

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ConcussionPro Portal ready for deployment"

# Create GitHub repository (via GitHub web interface or CLI)
# Then add remote and push
git remote add origin https://github.com/YOUR_USERNAME/concussionpro-portal.git
git branch -M main
git push -u origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to https://vercel.com
2. Sign up/Log in (use GitHub OAuth for easy integration)
3. Click **"Add New Project"**
4. Import your **concussionpro-portal** repository
5. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```bash
# Required for production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Squarespace Integration (get from Squarespace Developer portal)
SQUARESPACE_API_KEY=your_api_key_here
SQUARESPACE_SITE_ID=your_site_id_here
SQUARESPACE_WEBHOOK_SECRET=your_webhook_secret_here

# JWT Secret (generate a secure random string)
JWT_SECRET=generate_a_random_32_character_string_here

# Email (optional - for magic link authentication)
EMAIL_API_KEY=your_sendgrid_or_resend_api_key
EMAIL_FROM=noreply@concussion-education-australia.com

# File storage path (if using Vercel Blob Storage)
# Or configure S3/GCS credentials
FILES_PATH=/vercel/path/to/files
```

**To generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Deploy

1. Click **"Deploy"** in Vercel dashboard
2. Wait 2-3 minutes for build to complete
3. Your site will be live at: `https://concussionpro-portal.vercel.app`

### Step 5: Add Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain: `portal.concussion-education-australia.com`
3. Follow DNS configuration instructions (add CNAME or A record)
4. Wait for DNS propagation (5-60 minutes)

**DNS Configuration Example:**
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
```

---

## 🔗 PART 2: Integrate with Squarespace

### Overview
The goal is to have users purchase the course on Squarespace, then automatically get access to the portal.

### Architecture Options

#### **Option A: Webhook Integration (Recommended)**

**Flow:**
1. User purchases course on Squarespace → $1,190 payment
2. Squarespace sends webhook to Vercel API endpoint
3. Vercel creates user account and sends magic link email
4. User clicks link → authenticated → full access

**Implementation:**

1. **Create Webhook Endpoint** (already exists at `/app/api/webhooks/squarespace/route.ts`):

```typescript
// app/api/webhooks/squarespace/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-squarespace-signature')
    const body = await request.text()

    const expectedSignature = crypto
      .createHmac('sha256', process.env.SQUARESPACE_WEBHOOK_SECRET!)
      .update(body)
      .digest('base64')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)

    // Check if it's an order completion
    if (data.type === 'order.create' && data.data.fulfillmentStatus === 'FULFILLED') {
      const order = data.data
      const customerEmail = order.customerEmail

      // Create user account in your database
      // Send magic link email to customerEmail
      // Set isPaidUser = true for this email

      // TODO: Implement database logic here

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: 'Event not processed' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

2. **Configure Squarespace Webhook:**
   - Go to Squarespace → **Settings** → **Advanced** → **Developer API**
   - Enable API access
   - Go to **Webhooks**
   - Add new webhook:
     - **URL**: `https://your-vercel-domain.vercel.app/api/webhooks/squarespace`
     - **Events**: Select `order.create`
     - **Secret**: Generate and save (add to Vercel env vars)

3. **Test Webhook:**
   - Make a test purchase on Squarespace
   - Check Vercel logs to see webhook received
   - Verify user account created

#### **Option B: Manual Enrollment (Simpler - Good for Launch)**

**Flow:**
1. User purchases on Squarespace
2. You receive order notification email
3. You manually create user account:
   - Set `localStorage.setItem('isPaidUser', 'true')` for that user
   - Send them login credentials

**Implementation:**

Create an admin script to add paid users:

```typescript
// scripts/add-paid-user.ts
// Run this locally to add paid users manually

const email = 'customer@example.com'

// Add to enrolled users
const user = {
  id: Date.now().toString(),
  email: email,
  name: 'Customer Name',
  enrolledAt: new Date().toISOString(),
  isPaid: true
}

// You would store this in a database
// For now, you can send them a magic link to login
console.log(`User ${email} granted full access`)
```

#### **Option C: Squarespace Member Areas Integration**

Use Squarespace's member areas feature:
1. Create a member area product on Squarespace
2. When user purchases, they get Squarespace member account
3. Embed the Vercel portal in Squarespace using an `<iframe>`
4. Use postMessage to communicate auth status between Squarespace and portal

---

## 🔐 PART 3: Secure Payment Verification

### CRITICAL: Replace Client-Side Auth

Currently, the portal uses `localStorage.getItem('isPaidUser')` which is insecure. Replace with server-side verification:

### Option 1: Database Lookup

```typescript
// lib/auth-server.ts
import { db } from './database' // Your database client

export async function verifyPaidUser(email: string): Promise<boolean> {
  const user = await db.users.findUnique({ where: { email } })
  return user?.isPaid === true && user?.subscriptionActive === true
}
```

### Option 2: Squarespace API Verification

```typescript
// lib/squarespace-verify.ts
export async function verifySquarespaceOrder(email: string): Promise<boolean> {
  const response = await fetch(
    `https://api.squarespace.com/1.0/commerce/orders?customerEmail=${email}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.SQUARESPACE_API_KEY}`,
      }
    }
  )

  const orders = await response.json()
  return orders.some(order =>
    order.fulfillmentStatus === 'FULFILLED' &&
    order.lineItems.some(item => item.productName.includes('ConcussionPro Course'))
  )
}
```

### Option 3: Session-Based Auth (Recommended)

```typescript
// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyPaidUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session_token')

  if (!session) {
    return NextResponse.json({ isPaid: false }, { status: 401 })
  }

  // Verify session and check payment status from database
  const user = await verifySessionAndGetUser(session.value)

  return NextResponse.json({
    isPaid: user?.isPaid || false,
    email: user?.email
  })
}
```

Then update client-side to use server verification:

```typescript
// lib/trial.ts - UPDATED VERSION
export async function hasFullModuleAccess(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify')
    const data = await response.json()
    return data.isPaid === true
  } catch {
    return false
  }
}
```

---

## 📁 PART 4: File Storage Setup

### Option A: Vercel Blob Storage (Recommended)

1. Install Vercel Blob:
```bash
npm install @vercel/blob
```

2. Upload files to Vercel Blob:
```bash
# Using Vercel CLI
vercel blob upload "Concussion Clinical Cheat Sheet.pdf" --token YOUR_TOKEN
```

3. Update download route:
```typescript
// app/api/download/route.ts
import { head, download } from '@vercel/blob'

export async function GET(request: NextRequest) {
  const fileName = searchParams.get('file')

  // Get file from Vercel Blob
  const blob = await download(`clinical-toolkit/${fileName}`)

  return new NextResponse(blob.body, {
    headers: {
      'Content-Type': blob.contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
```

### Option B: AWS S3 (For Large Files)

1. Create S3 bucket: `concussionpro-files`
2. Upload PDFs/DOCX files
3. Update download route to generate signed URLs
4. Add AWS credentials to Vercel environment variables

### Option C: Keep in Git (Not Recommended for Large Files)

If files are small (<10MB total):
1. Put files in `public/docs/Clinical Toolkit/`
2. They'll be deployed with the app
3. Download route already checks this path

---

## 🧪 PART 5: Testing Your Deployment

### Test Checklist

```bash
# Test homepage
curl https://your-domain.vercel.app/

# Test authentication
# Login as demo user: demo@concussionpro.com / demo123

# Test module access
# Navigate to /modules/1 - should show preview (2 sections)

# Test file downloads
# Try downloading SCAT6 (free) - should work
# Try downloading premium file without auth - should redirect to shop

# Test Reference Repository
# Should load all 145 references

# Test Clinical Toolkit
# Should show all resources with lock icons on premium items

# Test Settings page
# Should load without 404 error
```

### Monitor Deployment

```bash
# View real-time logs
vercel logs --follow

# Check build logs
vercel logs --build
```

---

## 🔧 PART 6: Post-Deployment Configuration

### 1. Update Squarespace Shop Links

On Squarespace, update all "Enroll Now" buttons to link to:
```
https://your-portal-domain.vercel.app/
```

Or create a landing page on Squarespace that links to the portal.

### 2. Set Up Email Notifications

Configure SendGrid/Resend to send:
- Welcome email with portal login link
- Course completion certificates
- Weekly progress reminders

### 3. Add Analytics

Add to `app/layout.tsx`:

```typescript
// Google Analytics
{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
  <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
    <Script id="google-analytics">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
      `}
    </Script>
  </>
)}
```

### 4. Enable HTTPS Only

In Vercel → Settings → General:
- ✅ Enable "Force HTTPS"
- ✅ Enable "Automatically replace HTTP with HTTPS"

---

## 🎯 Quick Start Commands

### Deploy from scratch:

```bash
# 1. Prepare repository
cd /Users/zaclewis/ConcussionPro/portal
git init
git add .
git commit -m "Production ready deployment"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/concussionpro-portal.git
git push -u origin main

# 3. Install Vercel CLI (optional)
npm install -g vercel

# 4. Login to Vercel
vercel login

# 5. Deploy
vercel --prod

# 6. Set environment variables
vercel env add NEXT_PUBLIC_APP_URL
vercel env add SQUARESPACE_API_KEY
vercel env add JWT_SECRET
# ... add all required env vars

# 7. Redeploy with new env vars
vercel --prod
```

---

## 📞 Support & Troubleshooting

### Common Issues

**1. "Build failed" error:**
- Check Vercel build logs for specific error
- Verify all dependencies in package.json
- Run `npm run build` locally first

**2. "Module not found" errors:**
- Clear Vercel cache: Settings → Clear Build Cache
- Redeploy

**3. Environment variables not working:**
- Make sure variables are set in Vercel dashboard
- Prefix client-side variables with `NEXT_PUBLIC_`
- Redeploy after adding variables

**4. Files not downloading:**
- Check file paths in Vercel Blob Storage or S3
- Verify authentication logic in download route
- Check browser console for errors

**5. Squarespace webhook not firing:**
- Test webhook with Squarespace test mode
- Check webhook signature verification
- View Vercel function logs for errors

### Getting Help

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Squarespace API: https://developers.squarespace.com/

---

## ✅ Launch Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel successfully
- [ ] Environment variables configured
- [ ] Custom domain added (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Files uploaded to storage (Blob/S3)
- [ ] Squarespace webhook configured
- [ ] Test purchase completed successfully
- [ ] Demo account works (demo@concussionpro.com)
- [ ] All pages load without errors
- [ ] Mobile responsive design verified
- [ ] Settings page accessible
- [ ] File downloads working
- [ ] Reference Repository loads
- [ ] Analytics tracking active
- [ ] Error monitoring enabled (Sentry)
- [ ] Backup/disaster recovery plan in place

---

## 🚀 You're Ready to Launch!

Your ConcussionPro Portal is now live and integrated with Squarespace.

**Next Steps:**
1. Send test invitation to trusted beta users
2. Monitor logs and user feedback
3. Iterate based on real user behavior
4. Scale up as enrollment grows

Good luck! 🎉
