# Complete File Map - What Each File Does

## Authentication & Sessions

```
/lib/jwt-session.ts
├─ createJWTSession() - Creates 7-30 day session token
├─ verifySessionToken() - Verifies session cookie
└─ Used by: All protected API routes

/lib/magic-link-jwt.ts
├─ createMagicToken() - Creates 1-hour magic link token
├─ verifyMagicTokenJWT() - Verifies magic link token
└─ Used by: /api/send-magic-link, /api/auth/verify

/app/api/auth/verify/route.ts
├─ GET endpoint for magic link clicks
├─ Verifies token → Creates session → Sets cookie
└─ User lands here after clicking email link

/app/api/auth/session/route.ts
├─ GET endpoint to check current session
├─ Returns user data from JWT (no DB lookup)
└─ Used by: All protected pages on load

/app/api/auth/logout/route.ts
├─ POST endpoint to clear session
└─ Deletes session cookie

/app/api/send-magic-link/route.ts
├─ POST endpoint to send login email
├─ Creates magic token → Sends email with link
└─ Called by: Login form, signup form

/app/auth/verify/page.tsx
├─ Landing page after clicking magic link
├─ Calls /api/auth/verify
├─ CRITICAL: Routes preview → /scat-course, paid → /dashboard
└─ Shows "Verifying..." animation
```

## Module Content & Access Control

```
/app/api/modules/[id]/route.ts ⚠️ CRITICAL
├─ GET endpoint for module content
├─ Checks JWT session for access level
├─ Preview: Returns SCAT modules (101-105) with 2 sections only
├─ Paid: Returns main modules (1-8) with all sections
└─ Returns 403 if preview tries to access paid modules

/data/modules.ts
├─ Contains paid course modules 1-8
├─ Each module: title, sections, quiz, references
└─ Used by: Paid users only

/data/scat-modules.ts ⚠️ CRITICAL
├─ Contains free SCAT modules 101-105
├─ MUST be type-compatible with Module interface
├─ Field order matters for structural typing
└─ Used by: Preview users only

/hooks/useModuleData.ts
├─ React hook to fetch module data
├─ Calls /api/modules/[id]
├─ Returns: { module, loading, error, accessLevel }
└─ Used by: /app/modules/[id]/page.tsx

/app/modules/[id]/page.tsx
├─ Module viewer page (both paid and free)
├─ Fetches module via useModuleData()
├─ Renders sections, video, quiz
├─ Shows ContentLockedBanner after section 2 for preview
└─ Tracks progress via ProgressContext
```

## Progress Tracking

```
/contexts/ProgressContext.tsx ⚠️ CRITICAL
├─ React context for progress state
├─ Tracks modules 1-8 AND 101-105 (must include both)
├─ Functions:
│  ├─ updateVideoProgress() - Track video watch time
│  ├─ markVideoComplete() - Mark video done
│  ├─ updateQuizScore() - Save quiz results
│  ├─ markModuleComplete() - Mark module done
│  ├─ getModuleProgress() - Get progress for module
│  └─ getTotalCPDPoints() - Calculate total points
├─ Storage: localStorage + /api/progress (Blob)
└─ Used by: All module pages

/app/api/progress/route.ts
├─ GET: Load user progress from Vercel Blob
├─ POST: Save user progress to Vercel Blob
├─ ⚠️ Consumes Blob quota on every save
└─ TODO: Optimize or migrate to database
```

## User Pages (Preview Users)

```
/app/scat-course/page.tsx
├─ Landing page for preview users
├─ Shows SCAT modules 101-105
├─ Prominently features fillable PDFs
├─ Redirects paid users to /dashboard
└─ Preview users land here after login

/app/scat-mastery/page.tsx
├─ Public signup page for free SCAT course
├─ Email capture form
├─ Sends magic link via /api/signup-free
└─ Marketing funnel entry point
```

## User Pages (Paid Users)

```
/app/dashboard/page.tsx ⚠️ BLOCKS PREVIEW
├─ Main dashboard for paid users
├─ Shows progress, CPD points, modules
├─ Redirects preview users to /scat-course
└─ Landing page for paid users after login

/app/learning/page.tsx ⚠️ BLOCKS PREVIEW
├─ Module list for paid users (modules 1-8)
├─ Redirects preview users to /scat-course
└─ Shows completion status

/app/references/page.tsx ⚠️ BLOCKS PREVIEW
├─ Academic references (145 citations)
├─ Redirects preview users to /scat-course
└─ Paid resource

/app/clinical-toolkit/page.tsx ⚠️ BLOCKS PREVIEW
├─ Downloadable clinical resources
├─ Redirects preview users to /scat-course
└─ Paid resource

/app/complete-reference/page.tsx ⚠️ BLOCKS PREVIEW
├─ Complete clinical guide PDF
├─ Redirects preview users to /scat-course
└─ Paid resource
```

## User Management

```
/lib/users.ts
├─ getUserByEmail() - Find user by email
├─ createUser() - Create new user
├─ updateLastLogin() - Update login timestamp
└─ Storage: Vercel Blob (users.json)

/data/users.ts
├─ Mock users for development
└─ Not used in production

/app/api/admin/create-user/route.ts
├─ POST endpoint to create users
├─ Admin only
└─ Sets access level (preview/online-only/full-course)
```

## Components

```
/components/auth/ProtectedRoute.tsx
├─ Wrapper for protected pages
├─ Shows loading state
└─ Redirects to / if not logged in

/components/course/ContentLockedBanner.tsx
├─ Upgrade CTA shown to preview users
├─ Appears after section 2
├─ Links to shop ($1,190 course)
└─ Shows: "8 modules, 14 CPD hours, AHPRA"

/components/course/CourseNavigation.tsx
├─ Sidebar navigation for modules
├─ Shows progress indicators
└─ Different modules for preview vs paid

/components/course/InteractiveElements.tsx
├─ QuickCheck - True/false questions
├─ ClinicalInsight - Tips and warnings
├─ KeyConcept - Summary boxes
└─ Flowchart - Decision trees
```

## Configuration

```
/lib/config.ts
├─ Central configuration file
├─ URLs: App, shop, contact
├─ Course details: 8 modules, 14 CPD hours, $1,190
├─ Training locations and dates
└─ Feature flags

/.env.local (not in git)
├─ JWT_SECRET
├─ BLOB_READ_WRITE_TOKEN
├─ SMTP credentials
└─ Other secrets
```

## Analytics & Monitoring

```
/app/api/analytics/track/route.ts
├─ POST endpoint to log events
├─ Currently: console.log only (no Blob)
├─ ⚠️ Was consuming Blob quota, removed Feb 3
└─ TODO: Integrate real analytics (GA, Mixpanel)

/lib/monitoring.ts
├─ logAuthFailure() - Log auth errors
├─ logCriticalError() - Log critical errors
└─ Currently: console.log only
```

## Public Resources

```
/public/docs/
├─ SCAT6_Fillable.pdf - Free SCAT6 form
├─ SCOAT6_Fillable.pdf - Free SCOAT6 form
├─ Concussion Clinical Cheat Sheet.pdf
├─ Concussion Myth-Buster Sheet.pdf
└─ 20+ other clinical PDFs

/public/videos/
├─ placeholder.mp4 - Placeholder for paid modules
├─ placeholder-scat.mp4 - Placeholder for SCAT modules
└─ ⚠️ Real videos not uploaded yet
```

## Build & Deployment

```
/package.json
├─ Dependencies: next, react, jose, etc.
├─ Scripts: dev, build, start, lint
└─ npm install to install

/tsconfig.json
├─ TypeScript configuration
└─ Strict mode enabled

/next.config.js
├─ Next.js configuration
└─ Minimal config

/.gitignore
├─ Ignores: node_modules, .env.local, .vercel
└─ Standard Next.js ignores

/vercel.json
├─ Vercel deployment config
└─ Auto-deploys from main branch
```

## Documentation (You Are Here)

```
/OLLAMA_HANDOFF.md ⭐ START HERE
├─ Complete handoff documentation
├─ Everything Ollama needs to know
└─ 13 sections covering entire project

/OLLAMA_QUICK_START.md
├─ Quick reference guide
├─ Common commands
└─ Emergency procedures

/FILE_MAP.md (this file)
├─ What each file does
└─ Navigation reference

/VERIFICATION_TESTS.md
├─ Testing procedures
├─ How to verify changes work
└─ Created by Claude Code

/CHECK_MY_WORK.txt
├─ Summary of recent changes
├─ Verification checklist
└─ Created by Claude Code

/DEPLOYMENT_CHECKLIST.md
├─ Production deployment guide
└─ Environment variables

/COMPLETE_AUDIT_REPORT.md
├─ Full site audit
├─ Module content analysis
└─ Created earlier by Claude Code
```

## Key File Relationships

### Authentication Flow
```
User clicks magic link
  ↓
/app/auth/verify/page.tsx (frontend)
  ↓
/app/api/auth/verify/route.ts (backend)
  ↓
/lib/magic-link-jwt.ts (verifies token)
  ↓
/lib/jwt-session.ts (creates session)
  ↓
Session cookie set
  ↓
Redirect to /scat-course or /dashboard
```

### Module Access Flow
```
User opens /modules/101
  ↓
/app/modules/[id]/page.tsx (frontend)
  ↓
/hooks/useModuleData.ts (fetches data)
  ↓
/app/api/modules/[id]/route.ts (backend) ⚠️
  ↓
/lib/jwt-session.ts (checks session)
  ↓
If preview: /data/scat-modules.ts (first 2 sections)
If paid: /data/modules.ts (all sections)
  ↓
Module rendered with sections
```

### Progress Tracking Flow
```
User watches video / completes quiz
  ↓
/app/modules/[id]/page.tsx (calls progress functions)
  ↓
/contexts/ProgressContext.tsx (updates state)
  ↓
localStorage.setItem() (immediate cache)
  ↓
/app/api/progress/route.ts (backend save)
  ↓
Vercel Blob storage (persistent)
```

## Files Changed by Claude (Last 48h)

```
✅ app/api/modules/[id]/route.ts (Feb 4)
   - Added section limiting for preview users
   - Lines 93-101

✅ contexts/ProgressContext.tsx (Feb 4)
   - Added SCAT modules 101-105 to default state
   - Added null checks to update functions
   - Lines 115-175, 216-340

✅ app/api/analytics/track/route.ts (Feb 3)
   - Removed Blob usage, switched to console.log
   - Entire file rewritten

✅ data/scat-modules.ts (Feb 3)
   - Fixed type compatibility with Module
   - Added clinicalReferences field
   - Fixed field order
```

## Files You'll Likely Need to Touch

**For most tasks:**
- `/app/api/modules/[id]/route.ts` - Access control
- `/contexts/ProgressContext.tsx` - Progress tracking
- `/data/scat-modules.ts` or `/data/modules.ts` - Content

**For new features:**
- Create new page in `/app/new-page/page.tsx`
- Add access control checks (copy from `/app/dashboard/page.tsx`)
- Add to navigation if needed

**For bugs:**
- Read the file completely first
- Check related files (follow imports)
- Add defensive null checks
- Test locally if possible

## Files You Should NOT Touch

❌ `/lib/jwt-session.ts` - Authentication core (fragile)
❌ `/lib/magic-link-jwt.ts` - Magic link core (fragile)
❌ `/.env.local` - Secrets (never commit)
❌ `/node_modules/` - Dependencies (don't edit)
❌ `/.next/` - Build output (auto-generated)

## Quick Navigation

**Working on authentication?**
→ Start with `/lib/jwt-session.ts` and `/app/api/auth/`

**Working on module access?**
→ Start with `/app/api/modules/[id]/route.ts`

**Working on progress tracking?**
→ Start with `/contexts/ProgressContext.tsx`

**Working on UI/UX?**
→ Start with `/app/` pages and `/components/`

**Working on content?**
→ Start with `/data/modules.ts` or `/data/scat-modules.ts`

**Fixing a bug?**
→ Read `OLLAMA_HANDOFF.md` "Known Issues" section first

---

**Total Files:** ~100+
**Critical Files:** ~10
**Files Changed by Claude:** 4
**Files You'll Touch Most:** 5-10

Start with `OLLAMA_HANDOFF.md` for full context, use this file for navigation.
