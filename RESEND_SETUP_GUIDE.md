# Resend Email Setup Guide

## 🚨 CRITICAL: Email service is required for users to receive magic links!

Without this configured, users cannot login after purchasing the course.

---

## Step 1: Create Resend Account

1. Go to **https://resend.com**
2. Click **"Sign Up"** (free tier available)
3. Enter your email and create password
4. Verify your email address

---

## Step 2: Get Your API Key

1. Log into Resend dashboard
2. Click **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Give it a name like "ConcussionPro Production"
5. Copy the API key (format: `re_xxxxxxxxxxxxx`)
   - **IMPORTANT:** Save this immediately - you can't view it again!

---

## Step 3: Add API Key to .env.local

Open `.env.local` file and replace:

```bash
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
```

With your actual key:

```bash
RESEND_API_KEY=re_abc123xyz789...
```

**Save the file.**

---

## Step 4: Test Email Sending Locally

Run this command to test:

```bash
curl -X POST http://localhost:3000/api/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL_HERE@gmail.com"}'
```

Replace `YOUR_EMAIL_HERE@gmail.com` with your actual email.

**Expected result:**
- You should receive email within 1 minute
- Email subject: "Your Magic Link for ConcussionPro"
- Email contains a clickable magic link

**If email doesn't arrive:**
- Check spam folder
- Verify API key is correct in `.env.local`
- Check server logs for errors

---

## Step 5: Configure Production (Vercel)

When deploying to Vercel, add environment variable:

1. Go to Vercel dashboard → Your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Your API key (re_xxxxxxxxxxxxx)
   - **Environments:** Production, Preview, Development (check all)
4. Click **"Save"**
5. Redeploy your app

---

## 📧 Email Configuration

### Default Sender Email
By default, Resend uses: `onboarding@resend.dev`

### Custom Domain (Optional)
To send from your own domain:

1. In Resend dashboard → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `concussionpro.com.au`)
4. Add DNS records shown by Resend
5. Wait for verification (usually 5-15 minutes)
6. Update sender email in code to use your domain

---

## 🔍 Troubleshooting

### "RESEND_API_KEY not configured" error
- Verify `.env.local` has the key
- Restart dev server: `npm run dev`
- Check for typos in variable name

### Emails not sending
- Check API key is valid (not expired)
- Check Resend dashboard for error logs
- Verify email address format is correct
- Check rate limits (free tier: 100 emails/day)

### "Invalid API key" error
- Key might be copied incorrectly
- Regenerate new key in Resend dashboard
- Make sure key starts with `re_`

---

## ✅ Verification Checklist

Before launching:
- [ ] Resend account created and verified
- [ ] API key generated and saved securely
- [ ] API key added to `.env.local`
- [ ] Dev server restarted
- [ ] Test email sent and received successfully
- [ ] Magic link in email works (logs you in)
- [ ] API key added to Vercel environment variables
- [ ] Production deployment tested with real email

---

## 💰 Pricing

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for initial launch

**Pro Tier ($20/month):**
- 50,000 emails/month
- Custom domain emails
- Email analytics
- Priority support

---

## 🔒 Security Notes

- **NEVER** commit API keys to git
- `.env.local` is in `.gitignore` (safe)
- Use different API keys for development vs production
- Rotate keys if compromised
- Monitor usage in Resend dashboard

---

## 📖 Additional Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend API Reference:** https://resend.com/docs/api-reference
- **Email Templates:** https://resend.com/docs/send-with-react

---

**Need help?** Check Resend dashboard → Logs to see email sending status and errors.
