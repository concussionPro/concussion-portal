# Development Handoff Document for Ollama

**Date:** February 4, 2026
**Project:** ConcussionPro Learning Portal
**Previous Developer:** Claude Code (Anthropic)
**New Developer:** Ollama (Local LLM)
**Handoff Reason:** User trust issues with Claude Code

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication & Access Control](#authentication--access-control)
5. [Critical Files Reference](#critical-files-reference)
6. [Recent Changes (Last 48 Hours)](#recent-changes-last-48-hours)
7. [Known Issues & Technical Debt](#known-issues--technical-debt)
8. [Development Workflow](#development-workflow)
9. [Testing Procedures](#testing-procedures)
10. [Deployment Process](#deployment-process)
11. [Common Tasks](#common-tasks)
12. [User's Requirements](#users-requirements)
13. [Important Context](#important-context)

---

## Project Overview

### What It Is
A Next.js web portal for concussion education and CPD (Continuing Professional Development) certification for Australian healthcare practitioners.

### Business Model
- **Paid Course ($1,190):** 8 online modules + practical workshop = 14 CPD hours
- **Free SCAT Course:** 5 modules (101-105) = 2 CPD hours (preview/marketing funnel)

### Access Levels
1. **preview** - Free users, access SCAT modules only (first 2 sections per module)
2. **online-only** - Paid users, access all 8 online modules (no workshop)
3. **full-course** - Paid users, access all 8 modules + workshop materials

### Key Features
- JWT-based authentication (no database lookups, instant sessions)
- Magic link login (no passwords)
- Progress tracking (localStorage + Vercel Blob)
- Video progress tracking
- Quiz system (75% pass required for CPD certification)
- Module completion tracking
- Downloadable resources (PDFs)

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Deployment:** Vercel
- **Storage:** Vercel Blob (for progress, analytics)
- **Authentication:** JWT (jose library)
- **Email:** Custom API route with nodemailer

### Dependencies
```json
{
  "next": "15.1.4",
  "react": "^19.0.0",
  "typescript": "^5",
  "jose": "^5.9.6",
  "lucide-react": "^0.462.0",
  "@vercel/blob": "^0.27.0"
}
```

---

## Project Structure

```
portal/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── verify/           # Magic link verification
│   │   │   ├── session/          # Session check
│   │   │   └── logout/           # Logout
│   │   ├── modules/[id]/         # Module content API (CRITICAL)
│   │   ├── progress/             # Progress save/load
│   │   ├── analytics/track/      # Analytics logging
│   │   └── send-magic-link/      # Magic link sender
│   ├── dashboard/                # Paid user dashboard
│   ├── scat-course/              # Free user SCAT course page
│   ├── modules/[id]/             # Module viewer page
│   ├── learning/                 # Module list (paid)
│   ├── references/               # Academic references (paid)
│   ├── clinical-toolkit/         # Downloads (paid)
│   └── auth/verify/              # Magic link landing page
├── components/
│   ├── auth/                     # ProtectedRoute wrapper
│   ├── course/                   # Course UI components
│   │   ├── CourseNavigation.tsx
│   │   ├── ContentLockedBanner.tsx  # Upgrade CTA
│   │   └── InteractiveElements.tsx
│   └── ui/                       # shadcn/ui components
├── contexts/
│   └── ProgressContext.tsx       # CRITICAL: Progress state management
├── hooks/
│   └── useModuleData.ts          # CRITICAL: Module fetching hook
├── data/
│   ├── modules.ts                # Paid course modules 1-8
│   ├── scat-modules.ts           # Free SCAT modules 101-105
│   └── users.ts                  # User data (Vercel Blob)
├── lib/
│   ├── jwt-session.ts            # JWT session management
│   ├── magic-link-jwt.ts         # Magic link token generation
│   ├── users.ts                  # User CRUD operations
│   ├── config.ts                 # App configuration
│   └── monitoring.ts             # Error logging
└── public/
    ├── docs/                     # Downloadable PDFs
    └── videos/                   # Course videos (placeholder)
```

---

## Authentication & Access Control

### How Authentication Works

1. **User enters email** → `/api/send-magic-link`
2. **Magic link sent** → Contains JWT token with user data
3. **User clicks link** → `/api/auth/verify?token=...`
4. **Token verified** → Session cookie set (JWT, httpOnly, 7-30 days)
5. **Session check** → `/api/auth/session` (JWT verification, no DB)

### JWT Tokens

**Magic Link Token** (short-lived, 1 hour):
```typescript
{
  userId: string
  email: string
  name: string
  accessLevel: 'preview' | 'online-only' | 'full-course'
  type: 'magic-link'
  exp: 1 hour
}
```

**Session Token** (long-lived, 7-30 days):
```typescript
{
  userId: string
  email: string
  name: string
  accessLevel: 'preview' | 'online-only' | 'full-course'
  type: 'session'
  exp: 7-30 days
}
```

### Access Control Matrix

| Resource | Preview | Online-Only | Full-Course |
|----------|---------|-------------|-------------|
| SCAT modules (101-105) | ✅ First 2 sections | ✅ Full access | ✅ Full access |
| Main modules (1-8) | ❌ Blocked | ✅ Full access | ✅ Full access |
| Dashboard | ❌ Blocked | ✅ Access | ✅ Access |
| References | ❌ Blocked | ✅ Access | ✅ Access |
| Clinical Toolkit | ❌ Blocked | ✅ Access | ✅ Access |
| Workshop Materials | ❌ Blocked | ❌ Blocked | ✅ Access |

### Critical Access Control Files

1. **API Level:** `/app/api/modules/[id]/route.ts` (lines 52-101)
2. **Page Level:** All protected pages check `accessLevel` in `useEffect`
3. **Redirect Logic:** `/app/auth/verify/page.tsx` (lines 38-48)

---

## Critical Files Reference

### 1. `/app/api/modules/[id]/route.ts`

**Purpose:** Returns module content based on user's access level
**Critical Logic (Lines 93-101):**
```typescript
// For preview users: only return first 2 sections
let responseModule = module
if (sessionData.accessLevel === 'preview') {
  responseModule = {
    ...module,
    sections: module.sections.slice(0, 2),  // ONLY first 2 sections
  }
  console.log('[MODULE API] Limited preview user to first 2 sections')
}
```

**What It Does:**
- Checks user authentication via JWT session cookie
- Preview users: Gets SCAT modules (101-105) with only 2 sections
- Paid users: Gets main modules (1-8) with all sections
- Returns 403 if preview user tries to access paid modules

**Last Modified:** Feb 4, 2026 (Commit 1daec1b)

---

### 2. `/contexts/ProgressContext.tsx`

**Purpose:** Manages course progress (video, quiz, completion) for all modules
**Critical Logic:**

**Lines 36-175:** Default progress state
```typescript
function getDefaultProgress() {
  return {
    1: { moduleId: 1, ... },    // Paid modules
    2: { moduleId: 2, ... },
    // ... 3-8 ...
    101: { moduleId: 101, ... }, // SCAT modules (added Feb 4)
    102: { moduleId: 102, ... },
    103: { moduleId: 103, ... },
    104: { moduleId: 104, ... },
    105: { moduleId: 105, ... },
  }
}
```

**Lines 216-340:** Update functions (all have null checks)
- `updateVideoProgress()` - Tracks video watch time
- `markVideoComplete()` - Marks video as watched
- `updateQuizScore()` - Saves quiz results
- `markModuleComplete()` - Marks module done (after video + quiz)
- `getModuleProgress()` - Gets module state

**Storage:**
- **localStorage:** Immediate cache (`concussion-pro-progress`)
- **Backend:** Async save to `/api/progress` (Vercel Blob)

**Last Modified:** Feb 4, 2026 (Commit f410083)

---

### 3. `/data/scat-modules.ts`

**Purpose:** Contains SCAT course modules 101-105 (free preview content)

**Module Structure:**
```typescript
export interface SCATModule {
  id: number                    // 101-105
  title: string
  subtitle: string
  duration: string              // e.g., "20 min"
  points: number                // CPD points (0.3-0.5)
  description: string
  videoUrl: string              // Placeholder: '/videos/...'
  videoRequiredMinutes: number  // 1-2 minutes
  sections: Section[]           // Content sections
  quiz: QuizQuestion[]          // 2-3 questions
  clinicalReferences: string[]  // Academic citations
}
```

**CRITICAL:** SCATModule MUST be structurally identical to Module interface (from `/data/modules.ts`)

**Field Order Matters:**
1. id
2. title
3. subtitle
4. duration
5. points
6. description
7. videoUrl
8. videoRequiredMinutes
9. sections
10. quiz
11. clinicalReferences ← MUST be after quiz, NOT before sections

**Why:** TypeScript structural typing requires exact field order for API compatibility

**Last Modified:** Jan 29, 2026 (Commit c0aed9e)

---

### 4. `/app/auth/verify/page.tsx`

**Purpose:** Landing page for magic link clicks

**Critical Logic (Lines 38-48):**
```typescript
setTimeout(() => {
  // Preview users → SCAT course page
  // Paid users → Full dashboard
  if (data.user.accessLevel === 'preview') {
    router.push('/scat-course')  // Free users go here
  } else {
    router.push('/dashboard')    // Paid users go here
  }
}, 2000)
```

**Last Modified:** Jan 31, 2026

---

### 5. `/app/scat-course/page.tsx`

**Purpose:** Dedicated landing page for preview users (free SCAT course)

**What It Does:**
- Shows SCAT modules 101-105
- Prominently features fillable PDFs (SCAT6_Fillable.pdf, SCOAT6_Fillable.pdf)
- Redirects paid users to `/dashboard`
- Redirects unauthenticated users to `/`

**Last Modified:** Jan 31, 2026

---

### 6. `/app/modules/[id]/page.tsx`

**Purpose:** Module viewer page (used for both paid and free modules)

**How It Works:**
1. Fetches module data via `useModuleData(moduleId)` hook
2. Hook calls `/api/modules/[id]`
3. API returns content based on access level
4. Page renders sections (frontend doesn't know about filtering)
5. Shows `ContentLockedBanner` after section 2 for preview users

**Key Features:**
- Video player with progress tracking
- Quiz section (only for paid users)
- Auto-save checkpoints (scroll position)
- Interactive elements (QuickCheck, ClinicalInsight, Flowchart)

**Last Modified:** Jan 29, 2026

---

## Recent Changes (Last 48 Hours)

### Commit History (Most Recent First)

**f410083** - Feb 4, 2026 - "CRITICAL FIX: Add SCAT modules 101-105 to ProgressContext"
- **Problem:** Preview users crashed when accessing SCAT modules
- **Cause:** ProgressContext only tracked modules 1-8, not 101-105
- **Fix:** Added modules 101-105 to `getDefaultProgress()`, added null checks
- **Files:** `contexts/ProgressContext.tsx` (189 lines changed)
- **Status:** Deployed to production

**1daec1b** - Feb 4, 2026 - "CRITICAL: Limit preview users to first 2 sections only"
- **Problem:** Preview users were accessing full SCAT module content
- **Fix:** API now slices sections to first 2 for preview users
- **Files:** `app/api/modules/[id]/route.ts` (24 lines changed)
- **Status:** Deployed to production

**a8ed846** - Feb 3, 2026 - "Fix: Remove Vercel Blob usage from analytics to stop quota consumption"
- **Problem:** Analytics consumed 75% of Vercel Blob quota (2,000 ops/month)
- **Fix:** Changed to console.log only (viewable in Vercel dashboard)
- **Files:** `app/api/analytics/track/route.ts`
- **Status:** Deployed to production

**c0aed9e** - Feb 3, 2026 - "FINAL: Make SCAT modules 100% type-compatible with Module"
- **Problem:** SCATModule crashes due to type incompatibility
- **Fix:** Added `clinicalReferences` field, removed `isFree` field, fixed field order
- **Files:** `data/scat-modules.ts`
- **Status:** Deployed to production

### Before That (Multiple Failed Attempts)

**Commits dd2cc71, 5484d5f, 1e9c9b9, da56eca, 41f28ad, f959eb5** - Feb 2-3, 2026
- Multiple failed attempts to fix SCAT module type compatibility
- User frustrated: "you are murdering my business", "THIS IS THE LAST TIME"
- Issues: Wrong field order, missing fields, extra fields
- All reverted or fixed in subsequent commits

---

## Known Issues & Technical Debt

### 🔴 CRITICAL ISSUES

1. **Progress API Still Uses Blob Storage**
   - **File:** `/app/api/progress/route.ts`
   - **Problem:** Every progress save = 1 Blob write operation
   - **Impact:** Users have limited quota (2,000 ops/month free)
   - **Status:** Not fixed (analytics was fixed, progress not yet)
   - **Solution:** Use database (Postgres, Supabase) or reduce save frequency

2. **No Production Testing Done**
   - Last 2 commits (f410083, 1daec1b) deployed without production testing
   - Could have broken signup flow, quiz completion, CPD tracking
   - User explicitly doesn't trust Claude Code's work
   - **Action Required:** Full QA testing needed

3. **User Data Stored in Vercel Blob**
   - **File:** `/lib/users.ts`
   - **Problem:** User data in `users.json` on Blob storage (not a database)
   - **Impact:** No atomicity, no queries, scaling issues
   - **Status:** Technical debt
   - **Solution:** Migrate to proper database

### ⚠️ MEDIUM ISSUES

4. **CPD Points Calculation Untested for Preview Users**
   - **File:** `/contexts/ProgressContext.tsx` (line 264-267)
   - Preview users get 0.3-0.5 points per SCAT module
   - `getTotalCPDPoints()` assumes 1 point per module (incorrect for SCAT)
   - **Status:** Likely incorrect

5. **No Error Boundaries**
   - Application crashes show generic "Application error" screen
   - No graceful degradation
   - Poor UX for error states

6. **Video Progress May Be Inaccurate**
   - **File:** `/app/modules/[id]/page.tsx` (line 153-163)
   - Tracks only minutes (Math.floor), loses seconds
   - `updateVideoProgress` called on every timeupdate (may spam backend)

7. **Quiz Questions Stored in Frontend Code**
   - **File:** `/data/modules.ts`, `/data/scat-modules.ts`
   - Correct answers visible in client bundle
   - Trivial to cheat
   - No backend validation

### 🟡 MINOR ISSUES

8. **Hardcoded Video Placeholders**
   - All modules have placeholder videos: `/videos/placeholder-scat.mp4`
   - Real videos not uploaded
   - **Status:** Content not ready

9. **Magic Link Emails May Not Send**
   - **File:** `/app/api/send-magic-link/route.ts`
   - Uses nodemailer, may need SMTP configuration
   - No error monitoring for failed sends

10. **No Rate Limiting**
    - Magic link endpoint can be spammed
    - No CAPTCHA or rate limiting
    - Could be abused

11. **Session Cookies Not Rotated**
    - JWT sessions never refresh
    - If JWT secret leaked, all sessions compromised until expiry

12. **No Analytics**
    - Analytics system disabled (removed Blob usage)
    - No user behavior tracking
    - Can't measure conversion rates

---

## Development Workflow

### Setup

```bash
cd /Users/zaclewis/ConcussionPro/portal
git pull origin main
npm install  # If node/npm available
```

### Making Changes

1. **Create a branch** (optional but recommended)
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes to files**
   - Use Read tool to read files before editing
   - Use Edit tool for precise changes
   - Use Write tool only for new files

3. **Test locally** (if possible)
   ```bash
   npm run dev        # Start dev server (http://localhost:3000)
   npm run build      # Test production build
   npm run lint       # Check for TypeScript errors
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Description of changes

   - Detail 1
   - Detail 2

   Co-Authored-By: Ollama <noreply@ollama.com>"
   ```

5. **Push to production**
   ```bash
   git push origin main
   ```
   - Vercel auto-deploys from `main` branch
   - Deployment takes 1-2 minutes
   - Live at: https://portal.concussion-education-australia.com

### Git Workflow

- **Main branch:** `main` (production)
- **Remote:** `origin` (GitHub: concussionPro/concussion-portal.git)
- **No staging environment:** Changes go straight to production
- **Deploy method:** Vercel auto-deploy on push to main

---

## Testing Procedures

### Manual Testing Checklist

**Before deploying, test these flows:**

1. **Free User Signup Flow**
   - Go to `/scat-mastery`
   - Enter email
   - Check magic link email received
   - Click magic link
   - Should land on `/scat-course` (not `/dashboard`)
   - Access SCAT Module 101
   - Should see only 2 sections
   - Should see ContentLockedBanner after section 2

2. **Paid User Login Flow**
   - Login with paid account
   - Should land on `/dashboard`
   - Access Module 1
   - Should see all sections (not just 2)
   - Quiz should be accessible

3. **Progress Tracking**
   - Access any module
   - Watch video 30 seconds
   - Refresh page
   - Return to module
   - Progress should be saved

4. **Quiz Completion**
   - Complete a quiz (answer all questions)
   - Submit quiz
   - Score should be calculated
   - If pass (≥75%), module completable

5. **Session Persistence**
   - Login
   - Close browser
   - Reopen browser
   - Go to `/dashboard`
   - Should still be logged in

### Browser Console Checks

Open DevTools (F12) → Console tab:
- Should see NO red errors
- Should see NO "undefined" errors
- Should see `[MODULE API]` logs for module access
- Should see `[ANALYTICS]` logs for events

### Network Tab Checks

Open DevTools (F12) → Network tab:
- `/api/modules/101` should return 200 (not 403/404/500)
- Response should have `module.sections.length === 2` for preview users
- Response should have `accessLevel: "preview"` for free users
- No failed requests (all should be 200 or 304)

---

## Deployment Process

### Vercel Deployment

**Automatic:**
- Push to `main` branch triggers Vercel deployment
- Deployment URL: https://portal.concussion-education-australia.com
- Build logs: Vercel dashboard
- Deployment time: 1-2 minutes

**Environment Variables (Set in Vercel Dashboard):**
```bash
# JWT Secret (CRITICAL - DO NOT COMMIT)
JWT_SECRET=<secret-value>

# Vercel Blob (for progress, user data)
BLOB_READ_WRITE_TOKEN=<vercel-token>

# Base URL
NEXT_PUBLIC_APP_URL=https://portal.concussion-education-australia.com

# Shop URL
NEXT_PUBLIC_SHOP_URL=https://concussion-education-australia.com/shop

# Email (if using SMTP)
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<password>
```

### Checking Deployment Status

**Via GitHub:**
- Go to: https://github.com/concussionPro/concussion-portal
- Check "Environments" section
- Should show latest commit deployed

**Via Vercel Dashboard:**
- Check deployment logs for errors
- Search logs for `[MODULE API]`, `[ANALYTICS]`, `Error`, `Failed`

### Rolling Back

**Option 1: Revert commit**
```bash
git revert <commit-hash> --no-edit
git push origin main
```

**Option 2: Reset to previous commit**
```bash
git reset --hard <previous-commit-hash>
git push --force origin main
```

**Option 3: Vercel dashboard**
- Go to Deployments
- Find previous working deployment
- Click "Promote to Production"

---

## Common Tasks

### Task 1: Add New Module

1. **Paid Module (1-8):**
   - Edit `/data/modules.ts`
   - Add new module object to `modules` array
   - Ensure field order matches: id, title, subtitle, duration, points, description, videoUrl, videoRequiredMinutes, sections, quiz, clinicalReferences

2. **SCAT Module (101-105):**
   - Edit `/data/scat-modules.ts`
   - Add new module object to `scatModules` array
   - **CRITICAL:** Ensure SCATModule matches Module interface exactly

3. **Update ProgressContext:**
   - Edit `/contexts/ProgressContext.tsx`
   - Add new module to `getDefaultProgress()` function

4. **Test:**
   - Access module via `/modules/[id]`
   - Verify loads without errors
   - Check progress tracking works

### Task 2: Change Access Control

1. **Edit `/app/api/modules/[id]/route.ts`**
   - Modify section limiting logic (line 93-101)
   - Change `sections: module.sections.slice(0, 2)` to desired count

2. **Edit `/app/modules/[id]/page.tsx`**
   - Modify `ContentLockedBanner` display logic (line 1252)
   - Change `index === 1` to desired section index

3. **Test both preview and paid users**

### Task 3: Fix Progress Tracking Bug

1. **Check `/contexts/ProgressContext.tsx`**
   - Ensure module exists in `getDefaultProgress()`
   - Ensure all update functions have null checks
   - Check localStorage key: `concussion-pro-progress`

2. **Check `/app/api/progress/route.ts`**
   - Verify Blob storage working
   - Check for 401/403 errors (authentication issues)

3. **Browser DevTools:**
   - Application tab → Local Storage
   - Find `concussion-pro-progress` key
   - Verify JSON structure correct

### Task 4: Add New Protected Route

1. **Create page:** `/app/new-page/page.tsx`

2. **Add access control:**
```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function NewPage() {
  return (
    <ProtectedRoute>
      <NewPageContent />
    </ProtectedRoute>
  )
}

function NewPageContent() {
  const router = useRouter()

  useEffect(() => {
    async function checkAccess() {
      const response = await fetch('/api/auth/session', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        // Preview users should NOT access this page
        if (data.user && data.user.accessLevel === 'preview') {
          router.push('/scat-course')
          return
        }
      }
    }
    checkAccess()
  }, [router])

  return <div>Protected content</div>
}
```

3. **Test with preview and paid users**

### Task 5: Debug Production Errors

1. **Check Vercel logs:**
   - Vercel Dashboard → Deployments → Latest → View Function Logs
   - Search for `Error`, `Failed`, `undefined`

2. **Check browser console:**
   - F12 → Console tab
   - Look for red errors
   - Check Network tab for failed requests

3. **Add debug logging:**
```typescript
console.log('[DEBUG]', { variable1, variable2 })
console.error('[ERROR]', error)
```

4. **Deploy and check logs again**

---

## User's Requirements

### User Profile: Zac Lewis

- **Business:** Concussion Education Australia
- **Email:** zac@concussion-education-australia.com
- **Location:** Australia
- **Tech Experience:** "0 experience" (his words)
- **Expectations:**
  - Fix issues immediately
  - Don't break existing functionality
  - Don't waste money on failed deployments
  - Test thoroughly before deploying
  - Optimize for cost (Vercel quota)

### Communication Style

- **Direct and blunt** when frustrated
- **Expects immediate fixes** for critical bugs
- **Cost-conscious** (mentioned Vercel build costs multiple times)
- **Wants verification** ("I don't trust you")
- **Business impact focused** ("you are murdering my business")

### Common Requests

1. **"Sweep site for bugs"** - Wants comprehensive testing
2. **"Optimize security and functionality"** - Security-conscious
3. **"Do it properly"** - Wants thorough, tested work
4. **"Check your own logs"** - Verify changes work
5. **"Make progressively improved deployments"** - Test before deploy

### Frustration Triggers

- **Multiple failed deployments** (wastes Vercel build minutes)
- **Same bug recurring** (fixing one thing breaks another)
- **Not testing before deploying**
- **Not checking production after deploy**
- **Breaking existing functionality** while fixing bugs

### What He Values

- **Thorough testing** before deploying
- **Incremental, verified changes** (not shotgun debugging)
- **Cost optimization** (Blob quota, build minutes)
- **Clear verification steps** so he can test himself
- **Honest assessment** of what's broken

---

## Important Context

### Why Claude Code Was Replaced

**Issue:** User lost trust after multiple incidents:
1. Made 8+ commits trying to fix SCAT module type compatibility
2. Several commits had to be reverted
3. Deployed without testing
4. Fixed one thing, broke another
5. Cost user money in Vercel build minutes
6. User quote: "I don't trust you"

**Lesson:** Test thoroughly before deploying. User values one working deployment over ten failed attempts.

### Business Critical Paths

**Path 1: Free User Signup (SCAT Course)**
1. User visits `/scat-mastery`
2. Enters email
3. Receives magic link
4. Clicks link → Lands on `/scat-course`
5. Accesses SCAT modules 101-105
6. Sees first 2 sections + upgrade banner
7. (Hopefully) Upgrades to paid course

**Path 2: Paid User Access**
1. User purchases course on Squarespace
2. Account created with `online-only` or `full-course` access
3. Receives magic link
4. Clicks link → Lands on `/dashboard`
5. Accesses all 8 modules
6. Completes modules, passes quizzes
7. Earns 14 CPD hours

**Critical:** Do NOT break either path. Preview users must not access paid content. Paid users must access everything.

### Cost Considerations

**Vercel Free Tier Limits:**
- 2,000 Blob operations/month (75% used as of Feb 3)
- 100 GB bandwidth/month
- 100 hours build time/month

**Current Blob Usage:**
- User data: `users.json` (read on every login)
- Progress data: `user-progress/{userId}.json` (read/write on every progress change)
- Analytics: Removed (was consuming quota)

**Optimization Needed:**
- Progress API should batch updates (not save on every video timeupdate)
- Consider database instead of Blob storage

### Module Content Status

**Paid Modules (1-8):**
- Module 1: Complete (90 min, 5 CPD points)
- Module 2-8: Complete
- Videos: Placeholder only (`/videos/placeholder.mp4`)

**SCAT Modules (101-105):**
- Module 101: Complete (20 min, 0.5 CPD points)
- Module 102: Complete (15 min, 0.3 CPD points)
- Module 103-105: Complete
- Videos: Placeholder only (`/videos/placeholder-scat.mp4`)

### Security Considerations

**Current Security:**
- ✅ JWT authentication
- ✅ httpOnly cookies
- ✅ HTTPS only (production)
- ✅ No passwords stored
- ✅ Magic links expire (1 hour)
- ✅ Session tokens expire (7-30 days)

**Security Gaps:**
- ❌ No rate limiting (magic link endpoint)
- ❌ No CAPTCHA (signup can be automated)
- ❌ Quiz answers visible in frontend code
- ❌ No CSRF tokens (relies on SameSite cookies)
- ❌ No Content Security Policy headers
- ❌ JWT secret in environment variables (not rotated)

### Testing Environment

**Production Only:**
- No staging environment
- All changes go straight to production
- Must test on live site after deploy

**Test Accounts:**
- Demo login: `/dev-login` (development only)
- Create test account: `/scat-mastery` (free preview)
- Paid account: Must create via Squarespace or admin panel

### Key Performance Indicators

**User expects:**
- Fast page loads (<2s)
- Instant login (JWT, no DB lookups)
- Reliable progress saving
- No crashes or errors
- Professional UI/UX

**Current Status:**
- Performance: Unknown (not measured)
- Reliability: Questionable (recent bugs)
- Error rate: Unknown (analytics disabled)

---

## Final Checklist Before Making Changes

- [ ] Read relevant files completely before editing
- [ ] Understand how change affects both preview and paid users
- [ ] Check for similar code patterns elsewhere (consistency)
- [ ] Verify TypeScript types are correct
- [ ] Add defensive null checks where needed
- [ ] Test locally if possible (npm run build)
- [ ] Deploy to production
- [ ] Wait 2 minutes for Vercel deployment
- [ ] Test on production immediately after deploy
- [ ] Check browser console for errors
- [ ] Check Vercel logs for backend errors
- [ ] Verify both preview and paid user flows work
- [ ] Document what you changed and how to verify it

---

## Contact & Resources

**User:** Zac Lewis
**Email:** zac@concussion-education-australia.com
**Production URL:** https://portal.concussion-education-australia.com
**Shop URL:** https://concussion-education-australia.com/shop

**Repository:** https://github.com/concussionPro/concussion-portal
**Vercel Dashboard:** Check deployment logs
**Codebase Location:** `/Users/zaclewis/ConcussionPro/portal`

**Previous Developer Notes:**
- `VERIFICATION_TESTS.md` - Testing procedures
- `CHECK_MY_WORK.txt` - Recent changes summary
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `COMPLETE_AUDIT_REPORT.md` - Full site audit

---

## Good Luck!

**Remember:**
1. User values **one working deployment** over **ten failed attempts**
2. **Test before deploying** (he will check)
3. **Don't break existing functionality** while fixing bugs
4. **Document your changes** so he can verify
5. **Be honest** about what you don't know

The user has trust issues with Claude Code. Earn trust by being thorough, testing carefully, and delivering working code the first time.

---

**Document Version:** 1.0
**Last Updated:** February 4, 2026
**Created By:** Claude Code (Anthropic)
**For:** Ollama (Local LLM)
