# Squarespace Setup Guide for ConcussionPro Portal
## Complete Beginner-Friendly Instructions

This guide will walk you through connecting your Squarespace store to the ConcussionPro portal so that when someone purchases the course, they automatically get access.

---

## Overview: What We're Setting Up

When someone buys your course on Squarespace:
1. Squarespace sends a notification (webhook) to your portal
2. Your portal creates their account and marks them as a paid user
3. They automatically receive two emails:
   - Welcome email with course info
   - Login link to access the portal immediately

**No manual work needed!** Everything happens automatically.

---

## Step 1: Set Up Your Email Service (Resend)

We use Resend to send emails. It's free for up to 100 emails/day (3,000/month).

### 1.1: Create Resend Account

1. Go to https://resend.com
2. Click **"Sign Up"** in the top right
3. Sign up with your email
4. Verify your email address

### 1.2: Add Your Domain

1. In Resend dashboard, click **"Domains"** in the left sidebar
2. Click **"Add Domain"**
3. Enter your domain: `concussion-education-australia.com`
4. Follow the DNS setup instructions:
   - Copy the DNS records shown
   - Go to your domain registrar (where you bought the domain)
   - Add those DNS records
   - Wait 10-60 minutes for DNS to propagate
5. Click **"Verify Domain"** in Resend

**Can't verify your domain right now?**
- For testing, you can use Resend's sandbox mode
- Emails will only go to your verified email address
- You can verify the domain later before going live

### 1.3: Get Your API Key

1. In Resend dashboard, click **"API Keys"** in the left sidebar
2. Click **"Create API Key"**
3. Name it: `ConcussionPro Portal`
4. Permission: Select **"Sending access"**
5. Click **"Add"**
6. **COPY THE KEY IMMEDIATELY** (you can't see it again!)
7. Save it somewhere safe (we'll use it in Step 4)

---

## Step 2: Find Your Squarespace Product ID

You need to find the ID of your ConcussionPro course product.

### 2.1: Go to Your Product

1. Log in to your Squarespace admin
2. Go to **Commerce** → **Products**
3. Click on your **ConcussionPro course product**

### 2.2: Find the Product ID

**Option A: From the URL**
- Look at the URL in your browser
- It will look like: `...com/commerce/products/673abc123def456...`
- The long string of letters/numbers after `/products/` is your Product ID
- Example: `673abc123def456`

**Option B: From Product Settings**
1. In your product page, scroll down to **"Advanced"**
2. Look for **"Product ID"** or **"SKU"**
3. Copy that value

**Write it down!** You'll need this in Step 4.

---

## Step 3: Deploy Your Portal to Production

Before Squarespace can send webhooks, your portal needs to be live on the internet.

### 3.1: Choose a Hosting Platform

**Recommended: Vercel** (easiest for Next.js apps)

#### Deploy to Vercel:

1. Go to https://vercel.com
2. Click **"Sign Up"** (use GitHub account if you have one)
3. Click **"Add New Project"**
4. Import your portal code:
   - If code is on GitHub: Select the repository
   - If code is local: Use Vercel CLI or drag & drop the folder
5. Configure the project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click **"Deploy"**

### 3.2: Get Your Production URL

After deployment, Vercel will give you a URL like:
- `https://your-project-name.vercel.app`

You can also add a custom domain:
1. In Vercel project settings, go to **"Domains"**
2. Add your domain: `portal.concussion-education-australia.com`
3. Follow DNS instructions to point your domain to Vercel

**Write down your production URL!** You'll need it in the next step.

---

## Step 4: Configure Environment Variables

Now we'll add all the settings to your production portal.

### 4.1: Set Up Environment Variables in Vercel

1. In your Vercel project dashboard, click **"Settings"**
2. Click **"Environment Variables"** in the left sidebar
3. Add each variable below:

#### Add These Variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-portal-url.com` | Your production URL from Step 3 |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Your API key from Step 1.3 |
| `SQUARESPACE_WEBHOOK_SECRET` | `choose_a_secret_password_123` | Make up a strong, random password |
| `COURSE_PRODUCT_ID` | `673abc123def456` | Your product ID from Step 2 |

**For `SQUARESPACE_WEBHOOK_SECRET`:**
- Make up a random string (like a password)
- Example: `my_super_secret_webhook_password_2026`
- Write it down - you'll need it in Step 5!

### 4.2: Redeploy

After adding environment variables:
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for it to finish (takes 1-2 minutes)

---

## Step 5: Set Up Squarespace Webhook

Now we'll tell Squarespace to notify your portal when someone makes a purchase.

### 5.1: Enable Developer Mode in Squarespace

1. Log in to your Squarespace admin
2. Go to **Settings** → **Advanced** → **Developer API Keys**
3. If you don't see this option:
   - Go to **Settings** → **Advanced**
   - Look for **"Developer Mode"** or **"API"**
   - Enable it

### 5.2: Create Webhook

1. In Squarespace, go to **Settings** → **Advanced** → **Webhooks**
   - (If you don't see Webhooks, try: **Settings** → **Developer Tools** → **Webhooks**)
2. Click **"Create Webhook"** or **"Add Webhook"**
3. Fill in the details:

| Field | Value |
|-------|-------|
| **Event Type** | `order.create` (or "Order Created") |
| **Endpoint URL** | `https://your-portal-url.com/api/webhooks/squarespace` |
| **Secret** | The secret you created in Step 4.1 |

**Important:** Make sure the endpoint URL is correct:
- Use your production URL from Step 3
- Add `/api/webhooks/squarespace` at the end
- Example: `https://concussionpro.vercel.app/api/webhooks/squarespace`

4. Click **"Save"** or **"Create"**

---

## Step 6: Test the Complete Flow

Let's make sure everything works!

### 6.1: Test in Squarespace (Optional)

Some Squarespace plans allow webhook testing:
1. In your webhook settings, look for **"Test"** or **"Send Test Webhook"**
2. Click it
3. Check your webhook endpoint logs (we'll set this up next)

### 6.2: Make a Real Test Purchase

**Option A: Free Test Order (Recommended)**
1. In Squarespace, go to **Commerce** → **Products**
2. Temporarily set your course price to **$0.00**
3. Visit your Squarespace store
4. Add the course to cart and "purchase" it (no payment needed for $0)
5. Use your own email for testing
6. Check your email - you should receive:
   - Welcome email
   - Login link email
7. Click the login link - you should be logged in!
8. **DON'T FORGET** to change the price back to $1,190

**Option B: Real Purchase with Refund**
1. Complete a real purchase on your site
2. Test the full flow
3. Refund yourself in Squarespace admin

### 6.3: Check the Logs

In Vercel:
1. Go to your project dashboard
2. Click **"Deployments"** → Click on the latest deployment
3. Click **"View Function Logs"**
4. You should see logs like:
   ```
   📦 Received Squarespace order: [order ID]
   ✅ Course purchased by: test@example.com
   📧 Welcome email sent to: test@example.com
   ```

**If you don't see these logs:**
- The webhook might not be configured correctly
- Check Step 5.2 again

---

## Step 7: Update Your Squarespace Store (Optional)

You might want to add a link to the portal on your Squarespace site:

### Add "Login" Link to Navigation

1. In Squarespace, go to **Pages**
2. Click **"+"** to add a new page
3. Select **"Link"**
4. Set:
   - **Title:** "Student Login" or "Access Course"
   - **URL:** `https://your-portal-url.com/login`
   - **Open in new tab:** Check this
5. Drag it to your main navigation
6. Click **"Save"**

---

## Troubleshooting

### ❌ "Emails not sending"

**Check:**
1. Is your domain verified in Resend?
   - Go to Resend → Domains
   - Status should be "Verified" (green)
2. Is `RESEND_API_KEY` set correctly in Vercel?
   - Go to Vercel → Settings → Environment Variables
   - Make sure there are no extra spaces
3. Check Resend logs:
   - Go to Resend → Logs
   - Look for failed sends and error messages

**Quick fix:**
- Use Resend sandbox mode for testing
- Add your email to verified senders
- You can verify the domain later

### ❌ "Webhook not triggered"

**Check:**
1. Is the webhook URL correct?
   - Should end in `/api/webhooks/squarespace`
   - Should use your production URL (not localhost)
2. Is the webhook enabled in Squarespace?
   - Go to Settings → Webhooks
   - Check that status is "Active"
3. Did you redeploy after adding environment variables?
   - Vercel → Deployments → Redeploy

**Test it:**
```bash
# Test your webhook endpoint manually
curl -X POST https://your-portal-url.com/api/webhooks/squarespace \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### ❌ "Magic link expired or doesn't work"

**Check:**
1. Are you clicking the link within 15 minutes?
   - Links expire after 15 minutes for security
   - Request a new one if expired
2. Have you already used the link?
   - Each link can only be used once
   - Request a new one if needed
3. Is `NEXT_PUBLIC_BASE_URL` set correctly?
   - Should match your production URL exactly

### ❌ "User can't access modules after purchase"

**Check:**
1. Did the webhook fire successfully?
   - Check Vercel logs (Step 6.3)
2. Is the product ID correct?
   - Verify in Squarespace (Step 2)
   - Check `COURSE_PRODUCT_ID` in Vercel environment variables
3. Did they use the magic link to log in?
   - They need to click the login link from email
   - Can't just visit the site - must authenticate first

**Manual fix (temporary):**
```javascript
// In browser console on your portal:
localStorage.setItem('isPaidUser', 'true')
// Then refresh the page
```

### ❌ "Getting 500 errors"

**Check Vercel logs:**
1. Vercel → Deployments → View Function Logs
2. Look for red error messages
3. Common issues:
   - Missing environment variables
   - Typos in environment variable values
   - Database connection issues

---

## Production Checklist

Before going live, make sure:

- [x] Domain verified in Resend
- [x] All environment variables set in Vercel
- [x] Webhook endpoint tested and working
- [x] Test purchase completed successfully
- [x] Welcome email received
- [x] Login link works
- [x] User can access modules after purchase
- [x] Course price set back to correct amount ($1,190)
- [x] "Student Login" link added to Squarespace navigation

---

## Getting Help

If you get stuck:

1. **Check the logs first:**
   - Vercel: Deployments → Function Logs
   - Resend: Dashboard → Logs
   - Squarespace: Settings → Webhooks → View Activity

2. **Common issues are usually:**
   - Typos in environment variables
   - Wrong URLs (using localhost instead of production)
   - Unverified email domain
   - Expired webhook secrets

3. **Need more help?**
   - Email: zac@concussion-education-australia.com
   - Include: Screenshots of error messages and relevant logs

---

## What's Next?

### Optional Enhancements (Later):

1. **Add Database (Recommended for Production)**
   - Set up Supabase (free tier)
   - Store user data permanently
   - Track progress across devices
   - See: `SQUARESPACE_INTEGRATION_GUIDE.md` for details

2. **Add Workshop Date Selection**
   - Let users choose their workshop date during enrollment
   - Send reminder emails before workshop
   - Generate certificates after completion

3. **Analytics**
   - Track course completion rates
   - Monitor login activity
   - Measure engagement

4. **Custom Domain**
   - Use `portal.concussion-education-australia.com`
   - Looks more professional
   - Easy to set up in Vercel

---

## Cost Breakdown

**Required services:**
- Vercel (hosting): **FREE** for hobby projects
- Resend (email): **FREE** up to 3,000 emails/month

**Optional (for production):**
- Vercel Pro (if you need more): **$20/month**
- Resend Pro (more emails): **$20/month**
- Supabase (database): **FREE** for small usage

**Total to start: $0/month** ✅

---

You're all set! 🎉

Once you complete these steps, your portal will automatically handle:
- User enrollment after payment
- Welcome emails
- Login access
- Module unlocking
- Progress tracking

All automatically, with zero manual work from you!
