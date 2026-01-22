# ConcussionPro Portal - Deployment Checklist

## Quick Start (30 minutes)

This checklist covers everything you need to deploy your portal and connect it to Squarespace.

---

## ✅ Phase 1: Email Service Setup (10 mins)

### Resend Account
- [ ] Created account at https://resend.com
- [ ] Verified your email address
- [ ] Added domain: `concussion-education-australia.com`
- [ ] Added DNS records to your domain registrar
- [ ] Verified domain (or noted to verify later)
- [ ] Created API key
- [ ] Saved API key securely (starts with `re_`)

**📝 Note your API key here:**
```
RESEND_API_KEY=re_________________________________
```

---

## ✅ Phase 2: Squarespace Product ID (5 mins)

### Find Your Product
- [ ] Logged in to Squarespace admin
- [ ] Navigated to Commerce → Products
- [ ] Found your ConcussionPro course product
- [ ] Copied the Product ID from the URL or Advanced settings

**📝 Note your Product ID here:**
```
COURSE_PRODUCT_ID=_________________________________
```

---

## ✅ Phase 3: Deploy to Production (10 mins)

### Vercel Deployment
- [ ] Created account at https://vercel.com
- [ ] Connected your GitHub account (or uploaded code)
- [ ] Created new project from your portal code
- [ ] Deployed successfully
- [ ] Got production URL (e.g., `your-project.vercel.app`)
- [ ] (Optional) Added custom domain

**📝 Note your production URL here:**
```
NEXT_PUBLIC_BASE_URL=https://___________________________
```

---

## ✅ Phase 4: Environment Variables (5 mins)

### Configure in Vercel
- [ ] Opened Vercel project Settings
- [ ] Clicked Environment Variables
- [ ] Added `NEXT_PUBLIC_BASE_URL` (your production URL)
- [ ] Added `RESEND_API_KEY` (from Phase 1)
- [ ] Added `COURSE_PRODUCT_ID` (from Phase 2)
- [ ] Added `SQUARESPACE_WEBHOOK_SECRET` (make up a strong password)
- [ ] Redeployed the project

**📝 Note your webhook secret here (keep it private!):**
```
SQUARESPACE_WEBHOOK_SECRET=_________________________________
```

---

## ✅ Phase 5: Squarespace Webhook (5 mins)

### Set Up Webhook
- [ ] Logged in to Squarespace
- [ ] Navigated to Settings → Advanced → Webhooks
- [ ] Created new webhook
- [ ] Set event type: `order.create`
- [ ] Set endpoint URL: `https://your-url.com/api/webhooks/squarespace`
- [ ] Set secret: (the one you created in Phase 4)
- [ ] Saved webhook
- [ ] Verified status is "Active"

---

## ✅ Phase 6: Testing (10 mins)

### Test the Flow
- [ ] Temporarily set course price to $0 in Squarespace
- [ ] Made a test purchase with your email
- [ ] Received welcome email
- [ ] Received login link email
- [ ] Clicked login link
- [ ] Successfully accessed dashboard
- [ ] Verified all 8 modules are unlocked
- [ ] Set course price back to $1,190

### Check Logs
- [ ] Checked Vercel function logs
- [ ] Saw "Order received" message
- [ ] Saw "Welcome email sent" message
- [ ] No error messages in logs
- [ ] Checked Resend logs for sent emails

---

## ✅ Phase 7: Final Polish (Optional)

### Squarespace Store Updates
- [ ] Added "Student Login" link to navigation
- [ ] Updated order confirmation page
- [ ] Added portal link to order confirmation email

### Domain Setup (Optional)
- [ ] Purchased/configured custom domain
- [ ] Added `portal.concussion-education-australia.com`
- [ ] Updated DNS records
- [ ] Updated `NEXT_PUBLIC_BASE_URL` in Vercel
- [ ] Redeployed

---

## 🚀 Go Live!

Once all checkboxes are ticked:

- [ ] **FINAL TEST**: Make one more test purchase
- [ ] **VERIFY**: Complete flow works end-to-end
- [ ] **ANNOUNCE**: Your portal is ready for students!

---

## 📞 Support

**Having issues?**

1. Check the `SQUARESPACE_SETUP_GUIDE.md` for detailed troubleshooting
2. Review Vercel and Resend logs for error messages
3. Email: zac@concussion-education-australia.com

---

## 🎯 Success Metrics

After launch, you should see:

- ✅ Students automatically enrolled after purchase
- ✅ Welcome emails sent immediately
- ✅ Login links working reliably
- ✅ Zero manual work to grant access
- ✅ Happy students accessing course instantly

---

## 🔜 Future Enhancements

Once the basics are working, consider:

1. **Database Integration** - Store users permanently (see `SQUARESPACE_INTEGRATION_GUIDE.md`)
2. **Workshop Date Selection** - Let students choose dates
3. **Analytics** - Track completion and engagement
4. **Automated Reminders** - Email students before workshops
5. **Certificate Generation** - Auto-generate certificates after completion

---

**Time to complete:** ~30-45 minutes
**Cost to run:** $0/month (free tiers)
**Maintenance:** Zero manual work after setup

You've got this! 🎉
