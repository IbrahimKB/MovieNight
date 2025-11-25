# MovieNight - Quick Fix Checklist

**Priority:** HIGH | **Time Estimate:** 45 minutes - 2 hours | **Difficulty:** EASY

---

## 🔴 BLOCKING ISSUES (Fix First)

### [ ] 1. Fix Next.js 15 Dynamic Route Params (3 files)

**Files:**
- [ ] `app/api/admin/users/[id]/promote/route.ts`
- [ ] `app/api/admin/users/[id]/reset-password/route.ts`
- [ ] `app/api/admin/users/[id]/route.ts`

**What to change:**
Find all occurrences of this pattern:
```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }  // ❌ OLD
)
```

Change to:
```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ NEW
)
{
  const { id } = await params;  // Add this line
  // ... rest of code
}
```

Also for DELETE in the third file.

**Time:** 10 minutes
**Effort:** Copy-paste + await one line

---

### [ ] 2. Fix Login Page Form State

**File:** `app/(auth)/login/page.tsx`

**What's wrong:**
Form uses `formData` and `setFormData` but they're not defined in state.

**What to fix:**
Add state declaration near the top with other useState calls:
```typescript
const [formData, setFormData] = useState({
  emailOrUsername: '',
  password: '',
});
```

Also ensure the button uses correct variable names (look for `loading` → should be `isLoading`)

**Time:** 10 minutes
**Effort:** Copy-paste state initialization

---

### [ ] 3. Fix Suggest Page Type Errors

**File:** `app/(app)/suggest/page.tsx`

**What's wrong:**
Parameter has implicit `any` type on line 538

**Fix:**
Add type annotation: `(rating: number) =>`

**Time:** 5 minutes
**Effort:** Add `: number` type

---

### [ ] 4. Fix Watchlist Page Type Errors

**File:** `app/(app)/watchlist/page.tsx`

**What's wrong:**
Parameter has implicit `any` type on line 403

**Fix:**
Add type annotation: `(value: number) =>`

**Time:** 5 minutes
**Effort:** Add `: number` type

---

## 🟡 SECONDARY ISSUES (Fix Next)

### [ ] 5. Fix Admin Page Component Imports

**File:** `app/(app/)/admin/page.tsx`

**What's wrong:**
Import errors for:
- `@/components/ui/alert-dialog` 
- `@/components/ui/label`
- `@/components/ui/alert`

**Status:** Should now be fixed! (These components were created)

**What to do:**
- Run `npm run typecheck` to verify
- If still errors, check import paths match created files

**Time:** 2 minutes
**Effort:** Verify imports (already created)

---

## ✅ ALREADY COMPLETED

- [x] Created 11 UI component files
- [x] Fixed friends/page.tsx file corruption
- [x] Fixed signup/page.tsx JSX closing tag
- [x] Fixed signup/page.tsx variable naming (loading → isLoading)

---

## 🧪 VERIFICATION STEPS

After fixing the blocking issues, run these commands:

```bash
# 1. Check TypeScript (should have no errors)
npm run typecheck

# 2. Build project (should succeed)
npm run build

# 3. Start dev server (should start on port 3000)
npm run dev
```

If all succeed: ✅ **YOU'RE DONE!**

---

## 📋 Detailed Fix Instructions

### Fix #1: Dynamic Route Params (10 min)

1. Open `app/api/admin/users/[id]/promote/route.ts`
2. Find this line: `{ params }: { params: { id: string } }`
3. Change to: `{ params }: { params: Promise<{ id: string }> }`
4. Find the function body
5. Add this at the start: `const { id } = await params;`
6. Repeat for other 2 files

**Repeat for:**
- `app/api/admin/users/[id]/reset-password/route.ts`
- `app/api/admin/users/[id]/route.ts` (for DELETE method)

---

### Fix #2: Login Form State (10 min)

1. Open `app/(auth)/login/page.tsx`
2. Find the `useState` declarations (near top)
3. Add after `isLoading` state:
```typescript
const [formData, setFormData] = useState({
  emailOrUsername: '',
  password: '',
});
```

4. Find any uses of `loading` (should be `isLoading`)
5. Change them

---

### Fix #3 & #4: Type Annotations (10 min)

**For suggest page (line 538):**
```typescript
// Before:
.map((rating) => {

// After:
.map((rating: number) => {
```

**For watchlist page (line 403):**
```typescript
// Before:
.map((value) => {

// After:
.map((value: number) => {
```

---

## 📊 Progress Tracker

```
[██████████████████░░] 90% Complete
  
Done:
  ✅ UI Components (11 files created)
  ✅ Friends page (file restored)
  ✅ Signup page (JSX fixed)
  
Remaining (45 min):
  ⏳ Fix 3 API routes (10 min)
  ⏳ Fix login page (10 min)
  ⏳ Fix type errors (10 min)
  ⏳ Verify build (15 min)
```

---

## 🎯 Success Criteria

After all fixes:
- [ ] `npm run typecheck` returns: `0 errors`
- [ ] `npm run build` returns: ✅ Compiled successfully
- [ ] `npm run dev` starts without errors
- [ ] Application loads at http://localhost:3000

---

## 🚨 If You Get Stuck

1. **TypeScript says `Cannot find module`?**
   - Check file exists in components/ui/
   - Check import path matches filename

2. **Build still fails?**
   - Run: `npm install` (refresh node_modules)
   - Run: `npm run build` again

3. **Dynamic route errors persist?**
   - Make sure you changed BOTH the type signature AND added `await params`
   - Check file was saved

4. **Need to revert?**
   - `git checkout [filename]` to restore original

---

## ⏱️ Time Estimate Breakdown

| Task | Time | Status |
|------|------|--------|
| Fix 3 API routes | 10 min | ⏳ TODO |
| Fix login form | 10 min | ⏳ TODO |
| Fix type errors | 10 min | ⏳ TODO |
| Verify & test | 15 min | ⏳ TODO |
| **TOTAL** | **45 min** | ⏳ |

**Actual time may vary:** ±15 minutes

---

## 📝 Notes

- All UI components have been created and should work
- Component files are in `components/ui/` directory
- Follow same patterns as existing components
- Use Tailwind classes for styling
- All exports are named exports (not default)

---

## ✨ After Fixes are Done

1. Commit your changes:
```bash
git add .
git commit -m "Fix TypeScript compilation and Next.js 15 compatibility"
```

2. Push to repo:
```bash
git push origin main
```

3. Deploy (if using CI/CD):
```bash
# Your CI/CD will build and deploy automatically
```

4. Test in production:
- Visit your deployed app
- Test login/signup
- Test API endpoints
- Verify database connection

---

## 📚 Reference Links

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Zod Validation Docs](https://zod.dev/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [React Hooks Guide](https://react.dev/reference/react/hooks)

---

**Generated:** November 25, 2025  
**Status:** READY TO FIX  
**Confidence:** HIGH - Clear, actionable steps

Good luck! 🚀
