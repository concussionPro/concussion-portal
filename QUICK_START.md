# ConcussionPro Portal - Quick Start

## Deploy in 10 Minutes

### Step 1: Push to GitHub
```bash
git init && git add . && git commit -m "Deploy"
git remote add origin https://github.com/YOUR_USERNAME/concussionpro-portal.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to vercel.com → New Project
2. Import your repo → Deploy
3. Done! Live at: your-app.vercel.app

### Step 3: Add Environment Variables
Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_SECRET=generate_with_openssl_rand_base64_32
SQUARESPACE_WEBHOOK_SECRET=from_squarespace_api_dashboard
```

### Step 4: Configure Squarespace
Settings → Developer API → Webhooks → Add:
- URL: your-app.vercel.app/api/webhooks/squarespace
- Events: order.create
- Secret: (copy to Vercel)

### Done! 🎉
Visit your-app.vercel.app
Login: demo@concussionpro.com / demo123

See DEPLOYMENT_GUIDE.md for full details.
