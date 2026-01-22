# ConcussionPro Portal - Deployment Guide

**Complete beginner-friendly guide to deploy your learning portal**

---

## 📋 Overview

You'll be deploying to **Vercel** (free hosting for Next.js apps) and using a **subdomain** to keep it separate from your main Squarespace site.

**Recommended Setup:**
- Main site: `concussion-education-australia.com` (stays on Squarespace)
- Portal: `portal.concussion-education-australia.com` or `app.concussion-education-australia.com` (Vercel)

**Total Time:** ~30 minutes
**Cost:** $0 (Vercel free tier is generous)

---

## Step 1: Push Code to GitHub (10 minutes)

### 1.1 Check Git Status

Open Terminal in your portal folder and run:

```bash
git status
```

If you see "fatal: not a git repository", run:

```bash
git init
git add .
git commit -m "Initial commit - ConcussionPro Portal

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `concussion-portal` (or whatever you prefer)
3. **Visibility:** Private (recommended for your business)
4. **DO NOT** initialize with README (you already have code)
5. Click **Create repository**

### 1.3 Push to GitHub

GitHub will show you commands. Copy and run them in Terminal:

```bash
git remote add origin https://github.com/YOUR-USERNAME/concussion-portal.git
git branch -M main
git push -u origin main
```

**Replace `YOUR-USERNAME`** with your actual GitHub username.

✅ **Checkpoint:** Refresh GitHub page - you should see all your code!

---

## Step 2: Deploy to Vercel (10 minutes)

### 2.1 Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click **Continue with GitHub**
3. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project

1. Click **Add New...** → **Project**
2. Find your `concussion-portal` repository
3. Click **Import**

### 2.3 Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (leave as default)

**Build Command:** Leave default

**Environment Variables** - Click "Add" and add these:

```
NEXT_PUBLIC_SITE_URL=https://portal.concussion-education-australia.com
```

(We'll update this with your actual domain later)

4. Click **Deploy**

⏳ **Wait 2-3 minutes** for first deployment...

✅ **Checkpoint:** You'll see "Congratulations!" when done. Click **Visit** to see your live site!

**You'll get a URL like:** `concussion-portal-abc123.vercel.app`

---

## Step 3: Custom Domain Setup (10 minutes)

### Option A: Using Squarespace Domain (Recommended)

1. **In Vercel:**
   - Go to your project → Settings → Domains
   - Type: `portal.concussion-education-australia.com`
   - Click **Add**

2. **Vercel will show DNS records to add.** Copy these values:

   ```
   Type: CNAME
   Name: portal
   Value: cname.vercel-dns.com
   ```

3. **In Squarespace:**
   - Go to Settings → Domains → DNS Settings
   - Click **Add Record**
   - Select **CNAME Record**
   - Host: `portal`
   - Data: `cname.vercel-dns.com`
   - Click **Add**

4. **Wait 5-60 minutes** for DNS to propagate

✅ **Checkpoint:** Visit `https://portal.concussion-education-australia.com` - your portal should load!

### Option B: Buy New Domain (Alternative)

If you want a completely separate domain like `concussionpro.com.au`:

1. Buy domain on Namecheap/GoDaddy
2. In Vercel: Settings → Domains → Add your domain
3. Follow Vercel's nameserver instructions

---

## Step 4: Payment Integration (15 minutes)

Your portal uses **Squarespace for checkout** → **Webhook to grant access**

### 4.1 Create Webhook Endpoint

We need to add a webhook handler to receive purchase notifications from Squarespace.

**I'll help you build this in the next step.** For now, here's the overview:

1. **Squarespace sends webhook** when someone purchases
2. **Your portal receives it** at `/api/webhook/purchase`
3. **Portal grants access** by creating user account with credentials
4. **Portal sends email** with login details

### 4.2 Squarespace Webhook Setup

1. **In Squarespace:**
   - Settings → Advanced → Webhooks
   - Click **Add Webhook**
   - URL: `https://portal.concussion-education-australia.com/api/webhook/purchase`
   - Topics: Select `order.create`
   - Click **Save**

### 4.3 Product SKU Mapping

You need to tell the portal which Squarespace products give which access:

**Squarespace Products:**
- "Online Only - $497" → SKU: `ONLINE-ONLY`
- "Complete Course - $1,190" → SKU: `FULL-COURSE`

We'll use these SKUs to determine what access level to grant.

---

## Step 5: Environment Variables (Production)

After deployment, add these environment variables in Vercel:

1. Go to Vercel Project → Settings → Environment Variables
2. Add these:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://portal.concussion-education-australia.com

# Squarespace Webhook (we'll generate this)
WEBHOOK_SECRET=your-secret-key-here

# Email Service (for sending login credentials)
# We'll use Resend.com (free tier: 3,000 emails/month)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Step 6: Post-Deployment Checklist

After your site is live:

### Update Links

- [ ] Update Squarespace checkout links to point to your live domain
- [ ] Update `CONFIG.SHOP_URL` if needed (currently uses your Squarespace shop)

### Test Purchase Flow

1. [ ] Make a test purchase on Squarespace
2. [ ] Verify webhook received
3. [ ] Check user account created
4. [ ] Verify login email sent
5. [ ] Login to portal and test access

### Set Up Email Sending

1. [ ] Sign up for Resend.com (free tier)
2. [ ] Verify your domain for email sending
3. [ ] Add `RESEND_API_KEY` to Vercel environment variables

### Security

- [ ] Enable Vercel password protection (optional, for testing)
- [ ] Add rate limiting to login endpoint
- [ ] Review CORS settings for API routes

---

## Common Issues & Solutions

### "This site can't be reached"
- **Cause:** DNS not propagated yet
- **Solution:** Wait 15-60 minutes, clear browser cache

### Build fails on Vercel
- **Cause:** Missing dependencies or environment variables
- **Solution:** Check build logs in Vercel dashboard

### Webhook not receiving data
- **Cause:** Squarespace webhook not configured correctly
- **Solution:** Check webhook URL is exact, verify SSL certificate

### Users can't login
- **Cause:** Authentication not configured
- **Solution:** We need to set up the webhook handler (next step)

---

## Next Steps

**Immediate:**
1. I can help you build the webhook handler for payment processing
2. Set up email service for sending login credentials
3. Create user database/authentication system

**Would you like me to:**
- [ ] Build the webhook handler now?
- [ ] Set up the email service integration?
- [ ] Create a simple admin panel to manually grant access?

---

## Quick Commands Reference

**Deploy updates:**
```bash
git add .
git commit -m "Your update message"
git push
```
(Vercel auto-deploys when you push to GitHub!)

**View live site:**
```bash
open https://portal.concussion-education-australia.com
```

**Check deployment status:**
Visit: https://vercel.com/dashboard

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Squarespace Webhooks:** https://developers.squarespace.com/webhooks

**Need help?** The portal is set up for easy deployment - most issues can be solved by checking the Vercel build logs.
