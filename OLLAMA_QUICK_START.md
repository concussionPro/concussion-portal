# Ollama Quick Start Guide

**TL;DR:** Preview users get 2 sections of SCAT modules. Paid users get everything. Don't break either path.

---

## Critical Files (Touch These Carefully)

1. **`/app/api/modules/[id]/route.ts`** - Controls who sees what content
2. **`/contexts/ProgressContext.tsx`** - Tracks progress (must include modules 1-8 AND 101-105)
3. **`/data/scat-modules.ts`** - Free course content (MUST match Module type exactly)
4. **`/app/auth/verify/page.tsx`** - Routes users after login (preview → SCAT, paid → dashboard)

---

## Common Commands

```bash
# Check recent changes
git log --oneline -5

# See what changed in last commit
git show HEAD --stat

# Deploy to production
git add .
git commit -m "Your message"
git push origin main

# Rollback last commit
git revert HEAD --no-edit
git push origin main

# Check Vercel logs (if CLI available)
vercel logs --limit 50
```

---

## Emergency Rollback

```bash
# Go back to last known good state (before Claude's changes)
git reset --hard a8ed846
git push --force origin main
```

---

## Testing Checklist

1. **Free user signup** → Should land on `/scat-course`
2. **Open SCAT Module 101** → Should see only 2 sections
3. **Check browser console** → Should see NO errors
4. **Check Network tab** → `/api/modules/101` should return 2 sections
5. **Paid user login** → Should land on `/dashboard`
6. **Open Module 1** → Should see ALL sections

---

## Key Concepts

**Access Levels:**
- `preview` = Free (SCAT modules only, 2 sections)
- `online-only` = Paid (all 8 modules, full content)
- `full-course` = Paid + workshop

**Module IDs:**
- `1-8` = Paid modules
- `101-105` = SCAT modules (free)

**How Section Limiting Works:**
```
User requests module 101
  ↓
API checks session cookie (JWT)
  ↓
If preview: sections.slice(0, 2)
If paid: all sections
  ↓
Frontend displays what API sends
```

---

## User's Top Requirements

1. Don't break free signup flow (his business depends on it)
2. Don't break paid user access (they paid $1,190)
3. Test before deploying (he checks, will catch you)
4. Don't waste Vercel quota (costs him money)
5. Fix one thing at a time (not shotgun debugging)

---

## What Claude Did (Last 2 Commits)

**Commit f410083:**
- Added SCAT modules 101-105 to ProgressContext
- Fixed crashes when preview users access SCAT modules

**Commit 1daec1b:**
- Limited preview users to 2 sections per module
- API now sends only first 2 sections to preview users

**Status:** Deployed but not tested by user. He doesn't trust Claude.

---

## If Something Breaks

1. Check browser console first (F12)
2. Check Vercel logs second
3. Check which access level user has
4. Verify module ID exists in ProgressContext
5. Verify API returns correct section count
6. Don't guess - read the code first

---

## Production URL

https://portal.concussion-education-australia.com

Test immediately after deploying. User will check.

---

## You're Taking Over Because...

Claude Code:
- Made 8+ commits for one bug fix
- Deployed without testing
- Fixed one thing, broke another
- Cost user money
- Lost user's trust

**Don't repeat these mistakes.**

Test → Deploy → Verify. One working commit > ten broken ones.

---

Good luck. Read `OLLAMA_HANDOFF.md` for full details.
