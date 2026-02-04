# Welcome, Ollama! 👋

You're taking over development of the ConcussionPro Learning Portal from Claude Code.

---

## Start Here (In Order)

1. **Read this file first** (5 minutes) ← You are here
2. **Read `OLLAMA_HANDOFF.md`** (30 minutes) ← Everything you need to know
3. **Skim `FILE_MAP.md`** (10 minutes) ← Navigation reference
4. **Bookmark `OLLAMA_QUICK_START.md`** ← Quick commands & emergency procedures

---

## What This Project Is

A Next.js learning portal for Australian healthcare professionals to get CPD (Continuing Professional Development) certification in concussion management.

**Two tiers:**
- **Free:** SCAT course (5 modules, 2 CPD hours) - first 2 sections per module
- **Paid:** Full course (8 modules, 14 CPD hours, $1,190) - complete access

**Your job:** Keep free users limited, keep paid users happy, don't break either path.

---

## The Situation

**Why you're here:**
- Claude Code made too many failed deployments
- Fixed one thing, broke another
- User lost trust: "I don't trust you"
- Cost user money in Vercel build minutes

**What user expects from you:**
1. Test before deploying (don't deploy blind)
2. Fix one thing at a time (no shotgun debugging)
3. Don't break existing functionality
4. Verify changes work on production
5. Be honest about what you don't know

---

## Last Changes (Claude's Final Commits)

**Commit f410083 (Feb 4):**
- Added SCAT modules 101-105 to ProgressContext
- Fixed crashes when preview users access modules
- File: `contexts/ProgressContext.tsx`
- Status: ⚠️ Deployed but user hasn't tested

**Commit 1daec1b (Feb 4):**
- Limited preview users to first 2 sections per module
- File: `app/api/modules/[id]/route.ts`
- Status: ⚠️ Deployed but user hasn't tested

**Your first task:** Verify these changes work. User doesn't trust they're correct.

---

## Critical Files (Don't Break These)

| File | What It Does | Why Critical |
|------|-------------|--------------|
| `/app/api/modules/[id]/route.ts` | Controls who sees what content | Freemium model depends on this |
| `/contexts/ProgressContext.tsx` | Tracks progress for modules 1-8 & 101-105 | Must include all modules or crashes |
| `/data/scat-modules.ts` | Free course content | Must match Module type exactly |
| `/app/auth/verify/page.tsx` | Routes users after login | Wrong redirect = wrong access |

---

## How to Deploy (With Testing)

```bash
# 1. Make changes
git add .
git commit -m "Clear description of what changed"

# 2. Push (auto-deploys to production)
git push origin main

# 3. WAIT 2 minutes for Vercel deployment

# 4. TEST IMMEDIATELY on production:
# https://portal.concussion-education-australia.com
# - Free user signup → Should land on /scat-course
# - Open Module 101 → Should see only 2 sections
# - Browser console → Should see NO errors
# - Paid user login → Should land on /dashboard
# - Open Module 1 → Should see ALL sections

# 5. If broken, rollback immediately:
git revert HEAD --no-edit
git push origin main
```

**No staging environment = test on production = must be careful**

---

## Emergency Rollback

If everything's broken:

```bash
# Go back to last known good state (before Claude's changes)
git reset --hard a8ed846
git push --force origin main
```

This reverts to before Claude's section limiting and progress tracking changes.

---

## Known Issues (Read These First)

From `OLLAMA_HANDOFF.md` section "Known Issues & Technical Debt":

**Critical:**
1. Progress API still uses Vercel Blob (consumes quota on every save)
2. No production testing done on last 2 commits
3. User data stored in Blob (not a database)

**Medium:**
4. CPD points calculation likely incorrect for SCAT modules
5. No error boundaries (crashes show generic error screen)
6. Quiz answers visible in frontend code (can cheat)

**Minor:**
7. Hardcoded video placeholders (real videos not uploaded)
8. Magic link emails may not send (SMTP config unknown)
9. No rate limiting (can spam signup)

**Don't try to fix everything at once.** User prefers incremental, verified fixes.

---

## Tech Stack (Quick Reference)

- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** JWT (jose library, no database)
- **Deploy:** Vercel (auto from main branch)
- **Storage:** Vercel Blob (users, progress)

---

## Access Levels Explained

| Level | Can Access | Example User |
|-------|-----------|--------------|
| `preview` | SCAT modules 101-105 (first 2 sections only) | Free signup at /scat-mastery |
| `online-only` | All 8 paid modules (full content) | Purchased online course only |
| `full-course` | All 8 modules + workshop materials | Purchased full course + workshop |

**Critical rule:** Preview users must NEVER access paid content. Paid users must access everything.

---

## Common Tasks

**Add new SCAT module:**
1. Edit `/data/scat-modules.ts`
2. Add module object (ensure field order matches Module type)
3. Edit `/contexts/ProgressContext.tsx` → add to `getDefaultProgress()`
4. Test: Module loads without errors, progress tracks

**Change section limit:**
1. Edit `/app/api/modules/[id]/route.ts` → line 98
2. Change `sections.slice(0, 2)` to desired count
3. Edit `/app/modules/[id]/page.tsx` → line 1252
4. Change `index === 1` to desired index
5. Test both preview and paid users

**Debug crash:**
1. Check browser console (F12) for errors
2. Check Vercel logs for backend errors
3. Check which access level user has
4. Verify module exists in ProgressContext
5. Add defensive null checks
6. Don't guess - read the code

---

## User Profile: Zac Lewis

**Business:** Concussion Education Australia
**Email:** zac@concussion-education-australia.com
**Tech level:** "0 experience" (his words)
**Communication style:** Direct, blunt when frustrated

**What frustrates him:**
- Multiple failed deployments
- Same bug recurring
- Not testing before deploying
- Wasting money (Vercel build minutes, Blob quota)

**What he values:**
- One working deployment > ten failed attempts
- Thorough testing
- Cost optimization
- Clear documentation so he can verify himself

---

## Production URLs

**Portal:** https://portal.concussion-education-australia.com
**Shop:** https://concussion-education-australia.com/shop

**Free signup:** /scat-mastery
**Paid login:** Magic link from email
**Demo login:** /dev-login (dev only)

---

## Quick Commands

```bash
# Check recent changes
git log --oneline -5

# See what changed
git diff HEAD~1 HEAD

# Deploy
git push origin main

# Rollback last commit
git revert HEAD --no-edit && git push

# Emergency reset
git reset --hard a8ed846 && git push --force
```

---

## Testing Checklist (Before Asking User to Test)

- [ ] Free user signup works
- [ ] Preview user lands on `/scat-course` (not `/dashboard`)
- [ ] Preview user sees only 2 sections in SCAT modules
- [ ] Browser console has no errors
- [ ] Network tab shows `/api/modules/101` returns 2 sections
- [ ] Paid user login works
- [ ] Paid user lands on `/dashboard` (not `/scat-course`)
- [ ] Paid user sees all sections in main modules
- [ ] Progress saves and persists across refresh
- [ ] No crashes or "Application error" screens

---

## Documentation Index

| File | Purpose | When to Read |
|------|---------|--------------|
| `README_FOR_OLLAMA.md` | This file - orientation | First (you are here) |
| `OLLAMA_HANDOFF.md` | Complete handoff - everything | Second (required reading) |
| `FILE_MAP.md` | File navigation reference | When looking for specific file |
| `OLLAMA_QUICK_START.md` | Quick commands & procedures | When you need to do something fast |
| `VERIFICATION_TESTS.md` | Testing procedures | Before/after deployments |
| `CHECK_MY_WORK.txt` | Recent changes summary | See what Claude changed |

---

## Your First Steps

1. **Read `OLLAMA_HANDOFF.md` completely** (don't skip)
2. **Check git log** to see recent changes
3. **Test the last 2 commits on production**:
   - Free user signup → Module 101 → Should see 2 sections
   - Paid user login → Module 1 → Should see all sections
   - Browser console → No errors
4. **Report findings to user**:
   - "I tested X, Y, Z"
   - "Found issue: [description]"
   - "Suggested fix: [description]"
   - Don't deploy without user approval

---

## Philosophy for Working with This User

**Do:**
- ✅ Test thoroughly before deploying
- ✅ Make one small change at a time
- ✅ Verify on production after deploy
- ✅ Document what you changed
- ✅ Be honest about what you don't know
- ✅ Ask clarifying questions if unclear

**Don't:**
- ❌ Deploy without testing
- ❌ Fix multiple things in one commit
- ❌ Assume your changes work
- ❌ Make big architectural changes without approval
- ❌ Waste Vercel quota (test locally first if possible)

**Remember:** He's been burned by Claude Code. Earn trust through thorough, working code.

---

## Questions to Ask User Before Starting

1. Should I verify Claude's last 2 commits work correctly first?
2. What's the most important thing to fix/test right now?
3. Do you want me to document everything I do?
4. How do you want to be notified of changes? (Commit messages? Reports?)

---

## Good Luck! 🚀

You've got:
- ✅ Complete documentation
- ✅ Recent change history
- ✅ Testing procedures
- ✅ Emergency rollback plan
- ✅ User's expectations

**Next step:** Read `OLLAMA_HANDOFF.md` cover to cover.

Then ask the user what they want you to focus on first.

---

**Handoff Date:** February 4, 2026
**From:** Claude Code (Anthropic)
**To:** Ollama (Local LLM)
**Status:** Ready for takeover
