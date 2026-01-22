# Vercel Deployment Guide - ConcussionPro Learning Portal

## 🚀 Complete Step-by-Step Deployment Instructions

---

## Prerequisites

✅ Clinical Toolkit files copied to `public/docs/Clinical Toolkit/` ✅ DONE
✅ Complete Reference PDF copied to `public/docs/` ✅ DONE
✅ Resend email API key obtained (see RESEND_SETUP_GUIDE.md)
✅ GitHub repository (or can deploy from local)
✅ Vercel account (free tier works)

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or if you prefer using npx (no global install):
```bash
npx vercel --version
```

---

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate. Choose your preferred method:
- GitHub
- GitLab
- Bitbucket
- Email

---

## Step 3: Link Your Project

Navigate to your project directory:
```bash
cd /Users/zaclewis/ConcussionPro/portal
```

Initialize Vercel:
```bash
vercel
```

You'll be prompted with:
- **Set up and deploy?** → YES
- **Which scope?** → Select your account
- **Link to existing project?** → NO (first time) or YES (if already created)
- **What's your project's name?** → `concussion-pro-portal` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)
- **Override settings?** → NO (use detected settings)

Vercel will detect:
- ✅ Next.js framework
- ✅ Build command: `next build`
- ✅ Output directory: `.next`
- ✅ Development command: `next dev`

---

## Step 4: Add Environment Variables

**CRITICAL:** Add these environment variables BEFORE deploying:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

```bash
# Authentication
JWT_SECRET=<generate-strong-random-string-here>
ADMIN_API_KEY=<generate-strong-random-string-here>

# Email Service (CRITICAL)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Squarespace Webhook
SQUARESPACE_WEBHOOK_SECRET=<your-webhook-secret>

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**For each variable:**
- Click **"Add New"**
- Enter **Name** and **Value**
- Select **Environments:** Production, Preview, Development (check all)
- Click **"Save"**

### Option B: Via CLI

```bash
# Authentication
vercel env add JWT_SECRET
# Paste your secret when prompted, select Production

vercel env add ADMIN_API_KEY
# Paste your admin key, select Production

# Email (CRITICAL)
vercel env add RESEND_API_KEY
# Paste your Resend API key (re_xxxxx), select Production

# Webhook
vercel env add SQUARESPACE_WEBHOOK_SECRET
# Paste webhook secret, select Production

# App URL
vercel env add NEXT_PUBLIC_APP_URL
# Enter: https://your-project-name.vercel.app, select Production
```

### Generating Secure Secrets

For `JWT_SECRET` and `ADMIN_API_KEY`, generate strong random strings:

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets.

---

## Step 5: Configure Resend Domain

Your Resend domain `concussion-education-australia.com` is already set up! ✅

**Status Check:**
- ✅ Domain verified
- ✅ DKIM configured
- ✅ SPF configured
- ✅ Region: Tokyo (ap-northeast-1)

**To use this domain in emails:**

1. Update email sender in your code (already configured to use `RESEND_API_KEY`)
2. Default sender will be: `noreply@concussion-education-australia.com`

**Optional: Custom "From" name:**
- Edit email templates to use: `"ConcussionPro Team <noreply@concussion-education-australia.com>"`

---

## Step 6: Deploy to Production

```bash
vercel --prod
```

This will:
1. Build your Next.js application
2. Upload build artifacts
3. Deploy to production URL
4. Return your live URL

**Expected output:**
```
✅ Production: https://concussion-pro-portal.vercel.app [copied to clipboard]
📝 Inspect: https://vercel.com/...
```

---

## Step 7: Configure Custom Domain (Optional)

### If you have a custom domain:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `concussionpro.com.au` (or whatever you own)
4. Vercel will provide DNS records to add:
   - **A Record:** `76.76.21.21`
   - **CNAME Record:** `cname.vercel-dns.com`
5. Add these records to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)
6. Wait for DNS propagation (5-60 minutes)
7. Vercel will auto-provision SSL certificate

---

## Step 8: Test Production Deployment

### Test 1: Homepage
Visit: `https://your-project-name.vercel.app`
- ✅ Should load homepage
- ✅ Check mobile menu works
- ✅ Verify all images load

### Test 2: Authentication Flow
1. Go to `/login`
2. Click "Try Demo Account"
3. Verify redirect to dashboard
4. Check all modules visible

### Test 3: Email Service (CRITICAL)
```bash
# Test magic link email
curl -X POST https://your-project-name.vercel.app/api/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

**Expected:**
- API returns success
- Email arrives within 1 minute
- Magic link works (logs you in)

### Test 4: File Downloads
1. Login as authenticated user
2. Go to Clinical Toolkit
3. Click any PDF
4. Verify file downloads successfully

### Test 5: Complete Reference
1. Navigate to "Complete Reference" in sidebar
2. Verify PDF viewer loads
3. Test download button
4. Verify 5.8 MB PDF downloads

---

## Step 9: Configure Squarespace Webhook

1. Log into Squarespace → **Commerce** → **Webhooks**
2. Click **"Add Webhook"**
3. Configure:
   - **URL:** `https://your-project-name.vercel.app/api/webhooks/squarespace`
   - **Event:** `order.create`
   - **Secret:** Same value you added to `SQUARESPACE_WEBHOOK_SECRET`
4. Click **"Save"**
5. Click **"Test"** to send test webhook

---

## Step 10: Enable Vercel Blob Storage (Optional but Recommended)

For analytics persistence:

1. Go to Vercel Dashboard → Your Project → **Storage**
2. Click **"Create Database"** → **"Blob"**
3. Click **"Create"**
4. Vercel auto-adds `BLOB_READ_WRITE_TOKEN` to environment variables

**What this enables:**
- Persistent analytics data across deployments
- Better performance for analytics dashboard
- No data loss on redeployments

---

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
vercel logs <deployment-url>
```

**Common issues:**
- TypeScript errors → Run `npm run build` locally first
- Missing dependencies → Run `npm install`
- Environment variables missing → Add via dashboard

### Environment Variables Not Working

1. Verify added in Vercel Dashboard → Settings → Environment Variables
2. Check they're enabled for "Production" environment
3. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

### Emails Not Sending

1. Verify `RESEND_API_KEY` is correct (starts with `re_`)
2. Check Resend dashboard → Logs for errors
3. Verify domain verification in Resend is complete
4. Check production logs: `vercel logs <deployment-url>`

### 404 on Clinical Toolkit Files

1. Verify files exist in `public/docs/Clinical Toolkit/`
2. Check file names match exactly (including spaces)
3. Files must be committed to git if deploying from GitHub
4. Try `vercel --prod --force` to force full rebuild

### Custom Domain Not Working

1. Verify DNS records added correctly
2. Wait 15-60 minutes for DNS propagation
3. Check SSL certificate status in Vercel dashboard
4. Try `https://` (not `http://`)

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Test homepage loads correctly
- [ ] Test mobile responsiveness (open on phone)
- [ ] Test authentication (demo account + magic link)
- [ ] Send test magic link email and verify it arrives
- [ ] Test all 8 modules load and display correctly
- [ ] Test clinical toolkit downloads (pick 2-3 files)
- [ ] Test complete reference PDF viewer
- [ ] Test references search and filtering
- [ ] Verify analytics dashboard loads (if admin)
- [ ] Check browser console for errors (F12)
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS + Android)

---

## Continuous Deployment

### Auto-Deploy from Git (Recommended)

If your code is in GitHub:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Git**
2. Connect your GitHub repository
3. Enable automatic deployments:
   - **Production Branch:** `main` or `master`
   - **Preview Branches:** All other branches

**Benefits:**
- Push to `main` → auto-deploys to production
- Push to other branches → creates preview URLs
- Pull requests get unique preview URLs for testing

### Manual Deployments

```bash
# Deploy preview (test before production)
vercel

# Deploy to production
vercel --prod

# Force rebuild (if caching issues)
vercel --prod --force
```

---

## Monitoring & Maintenance

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Last 100 logs
vercel logs
```

### Performance Monitoring

Vercel provides built-in analytics:
- Go to Dashboard → Your Project → **Analytics**
- Monitor:
  - Page views
  - Core Web Vitals
  - Error rates
  - Response times

### Cost Monitoring

**Free Tier Limits:**
- 100 GB bandwidth/month
- 100 GB-hours serverless execution/month
- Unlimited deployments

**Monitor usage:**
- Dashboard → Settings → Usage

---

## Security Best Practices

✅ Environment variables stored securely (not in code)
✅ HTTPS enforced (auto by Vercel)
✅ httpOnly cookies for sessions
✅ Server-side authentication checks
✅ File download authentication
✅ CORS configured correctly

**Additional recommendations:**
- Rotate JWT_SECRET every 6-12 months
- Monitor failed login attempts in analytics
- Enable Vercel Pro for advanced DDoS protection
- Set up uptime monitoring (e.g., UptimeRobot)

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Resend Docs:** https://resend.com/docs
- **Project Guides:**
  - `RESEND_SETUP_GUIDE.md`
  - `COMPLETE_AUDIT_REPORT.md`
  - `TEST_USER_FLOWS.md`

---

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View deployments
vercel ls

# View project info
vercel inspect
```

---

## 🎉 You're Live!

Once deployed, your ConcussionPro Learning Portal is live and ready for users to:
- ✅ Purchase courses via Squarespace
- ✅ Receive magic link emails via Resend
- ✅ Access all 8 modules with full content
- ✅ Download clinical toolkit resources
- ✅ View complete clinical reference PDF
- ✅ Track CPD hours and progress
- ✅ Access from any device (desktop + mobile)

**Next steps:**
1. Test end-to-end user journey
2. Send test purchase through Squarespace
3. Verify magic link email arrives
4. Confirm full user experience
5. Launch marketing! 🚀
