# Progress Tracking Verification Test

**Date:** 2026-01-26
**Purpose:** Verify quiz completion → progress saves → module unlocks

---

## Test Flow Summary

```
User completes Module 1:
1. Watch video (required minutes)
2. Take quiz, score 75%+ (e.g., 16/20 = 80%)
3. Click "Mark Module Complete"
4. System saves progress to backend
5. Dashboard shows "1 / 8 Modules Complete"
6. User can access ANY of the remaining 7 modules
```

---

## Code Verification

### ✅ Quiz Submission Flow

**File:** `/app/modules/[id]/page.tsx:120-134`

```typescript
const handleQuizSubmit = () => {
  // Validate all questions answered
  if (Object.keys(quizAnswers).length !== module.quiz.length) {
    alert('Please answer all questions before submitting.')
    return
  }

  // Calculate score
  let correctCount = 0
  module.quiz.forEach((question) => {
    if (quizAnswers[question.id] === question.correctAnswer) {
      correctCount++
    }
  })

  // Save to ProgressContext (triggers backend sync)
  updateQuizScore(moduleId, correctCount, module.quiz.length)
  setQuizSubmitted(true)
}
```

**Result:** ✅ Quiz score saved with total questions

---

### ✅ 75% Validation

**File:** `/contexts/ProgressContext.tsx:287-303`

```typescript
const canMarkModuleComplete = (moduleId: number, requiredMinutes: number): boolean => {
  const moduleProgress = progress[moduleId]
  if (!moduleProgress) return false

  // Calculate quiz pass percentage (must be >= 75%)
  const quizPassed = moduleProgress.quizCompleted &&
                     moduleProgress.quizScore !== null &&
                     moduleProgress.quizTotalQuestions !== null &&
                     moduleProgress.quizTotalQuestions > 0 &&
                     (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75

  return (
    moduleProgress.videoCompleted &&
    moduleProgress.videoWatchedMinutes >= requiredMinutes &&
    quizPassed
  )
}
```

**Result:** ✅ Enforces 75% minimum

---

### ✅ Module Completion

**File:** `/contexts/ProgressContext.tsx:249-258`

```typescript
const markModuleComplete = (moduleId: number) => {
  setProgress((prev) => ({
    ...prev,
    [moduleId]: {
      ...prev[moduleId],
      completed: true,
      completedAt: new Date(),
    },
  }))
}
```

**Result:** ✅ Sets module as completed

---

### ✅ Backend Sync

**File:** `/contexts/ProgressContext.tsx:191-211`

```typescript
// Save progress to backend and localStorage whenever it changes
useEffect(() => {
  async function saveProgress() {
    if (isInitialized && typeof window !== 'undefined') {
      // Save to localStorage immediately (sync)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))

      // Save to backend (async)
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ progress }),
        })
      } catch (error) {
        console.error('Failed to save progress to backend:', error)
      }
    }
  }

  saveProgress()
}, [progress, isInitialized])
```

**Result:** ✅ Auto-saves to backend on every progress change

---

### ✅ Progress Counter

**File:** `/contexts/ProgressContext.tsx:260-262`

```typescript
const getTotalCompletedModules = () => {
  return Object.values(progress).filter((p) => p.completed).length
}
```

**Result:** ✅ Counts completed modules (1/8, 2/8, etc.)

---

### ✅ Module Access (No Sequential Locking)

**File:** `/hooks/useModuleAccess.ts:24-37`

```typescript
// Check session-based authentication (JWT)
try {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  })

  if (response.ok) {
    const data = await response.json()
    if (data.success && data.user && data.user.accessLevel) {
      // Both online-only and full-course users have full module access
      const hasPaidAccess = data.user.accessLevel === 'online-only' ||
                           data.user.accessLevel === 'full-course'
      setHasFullAccess(hasPaidAccess)
    }
  }
}
```

**Result:** ✅ ALL 8 modules unlocked for paid users (no sequential locking)

---

## Manual Test Procedure

### Test 1: Complete Module 1 with 75%+ Score

1. **Login** to https://portal.concussion-education-australia.com
   - Use Sam's email: gospersam@gmail.com
   - Click magic link from email

2. **Navigate to Module 1**
   - Click "Module 1: Introduction to Concussion"

3. **Complete Video**
   - Watch video OR scrub to required timestamp
   - System marks video as complete

4. **Take Quiz - Pass with 75%+**
   - Scroll to "Knowledge Check" section
   - Answer questions (example: 16/20 correct = 80%)
   - Click "Submit Knowledge Check"
   - **Expected:** Green box "Knowledge Check Passed!"
   - **Expected:** Shows score "16 out of 20 (80%)"

5. **Mark Module Complete**
   - Scroll to "Ready to Complete" section (appears after passing quiz)
   - Click "Mark Module Complete" button
   - **Expected:** Redirects to `/learning` (dashboard)

6. **Verify Progress Saved**
   - **Expected:** Dashboard shows "1 / 8 Modules Complete"
   - **Expected:** Module 1 has green checkmark
   - **Expected:** "1 CPD Points Earned"

7. **Test Persistence (Critical)**
   - Log out completely
   - Close browser
   - Log back in with fresh magic link
   - **Expected:** Still shows "1 / 8 Modules Complete"
   - **Expected:** Module 1 still marked complete

8. **Verify Next Module Access**
   - Click "Module 2: Concussion Diagnosis & Initial Assessment"
   - **Expected:** Module 2 loads successfully
   - **Expected:** Can start Module 2 immediately

---

### Test 2: Complete Module 1 with <75% Score (Fail)

1. **Take Quiz - Fail with <75%**
   - Answer questions (example: 10/20 correct = 50%)
   - Click "Submit Knowledge Check"
   - **Expected:** Amber box "Review Required"
   - **Expected:** Shows score "10 out of 20 (50%)"
   - **Expected:** Message: "Please review the content and try again"

2. **Verify Retake Button**
   - **Expected:** Orange "Retake Quiz" button visible
   - Click "Retake Quiz"
   - **Expected:** Quiz resets (all answers cleared)
   - **Expected:** Auto-scrolls to quiz section

3. **Retake and Pass**
   - Answer questions again (example: 18/20 = 90%)
   - Click "Submit Knowledge Check"
   - **Expected:** Green box "Knowledge Check Passed!"

4. **Complete Module**
   - Click "Mark Module Complete"
   - **Expected:** Progress saves to 1/8

---

### Test 3: Progress Persists Across Devices

1. **Complete Module 1 on Desktop**
   - Follow Test 1 procedure
   - Verify "1 / 8 Modules Complete"

2. **Login on Mobile Device**
   - Request magic link on mobile
   - Login to dashboard
   - **Expected:** Shows "1 / 8 Modules Complete"
   - **Expected:** Module 1 marked complete

3. **Complete Module 2 on Mobile**
   - Complete video + quiz on mobile
   - Mark module complete
   - **Expected:** Shows "2 / 8 Modules Complete"

4. **Return to Desktop**
   - Refresh desktop browser
   - **Expected:** Shows "2 / 8 Modules Complete"
   - **Expected:** Both Module 1 and 2 marked complete

---

## Backend Verification

### Check Progress in Blob Storage

Sam's progress stored at:
```
Vercel Blob Storage:
user-progress/cc3d16e36dcfe82239efd4f44958ef0e.json
```

**API Endpoint:**
```bash
# Must be authenticated (have session cookie)
curl -b cookies.txt https://portal.concussion-education-australia.com/api/progress
```

**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "1": {
      "moduleId": 1,
      "completed": true,
      "videoWatchedMinutes": 45,
      "videoCompleted": true,
      "quizScore": 16,
      "quizTotalQuestions": 20,
      "quizCompleted": true,
      "startedAt": "2026-01-26T...",
      "completedAt": "2026-01-26T..."
    },
    "2": {
      "moduleId": 2,
      "completed": false,
      "videoWatchedMinutes": 0,
      "videoCompleted": false,
      "quizScore": null,
      "quizTotalQuestions": null,
      "quizCompleted": false,
      "startedAt": null,
      "completedAt": null
    }
    // ... modules 3-8
  }
}
```

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Complete video | `videoCompleted: true` |
| Score 75%+ on quiz | `quizCompleted: true`, `quizScore: 16`, `quizTotalQuestions: 20` |
| Mark module complete | `completed: true`, `completedAt: Date` |
| Auto-save to backend | POST to `/api/progress` (triggers on state change) |
| Dashboard counter | Shows "1 / 8 Modules Complete" |
| CPD points | Shows "1 CPD Points Earned" |
| Module 2+ access | ✅ All modules unlocked (no sequential requirement) |
| Page reload | Progress restored from backend |
| Different browser | Progress syncs across devices |
| Fail quiz (<75%) | "Retake Quiz" button appears |
| Retake quiz | Quiz resets, can try again |

---

## ✅ Code Verification Complete

All code paths verified:
- ✅ Quiz scoring: 75% minimum enforced
- ✅ Progress saving: Auto-syncs to backend on every change
- ✅ Module completion: Sets `completed: true` and `completedAt`
- ✅ Progress counter: Counts completed modules (1/8, 2/8, etc.)
- ✅ Module access: All 8 modules unlocked for paid users
- ✅ Persistence: Loads from backend on mount
- ✅ Cross-device: Stored by userId in Vercel Blob
- ✅ Quiz retake: Button appears on failure

**Recommendation:** Manual test with Sam's account to verify end-to-end flow.
