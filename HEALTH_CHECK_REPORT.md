# Health Check Report

**Date**: November 24, 2025
**Status**: ⚠️ **Multiple Issues Found**

---

## 🚨 Critical Issues (Must Fix)

### 1. Missing API Endpoints (2)
These endpoints are being called but don't have handlers:

- **`GET /api/releases/upcoming`** 
  - Called in: `lib/api.ts` (line 338)
  - Function: `getUpcomingReleases()`
  - Impact: Upcoming releases section fails silently (wrapped in try/catch)
  - **Fix**: Create `app/api/releases/upcoming/route.ts`

- **`GET /api/analytics/suggestion-accuracy`**
  - Called in: `lib/api.ts` (line 276)
  - Function: `getDashboardStats()`
  - Impact: Suggestion accuracy metric shows 0
  - **Fix**: Create `app/api/analytics/suggestion-accuracy/route.ts` OR remove if not needed

### 2. Duplicate/Conflicting AuthContext Paths
Two different contexts with same name exist:
- `context/AuthContext.tsx` (old location)
- `app/contexts/AuthContext.tsx` (new location)

**All files import from correct location** (`@/contexts/AuthContext`), but the old file should be deleted to avoid confusion.

### 3. Inconsistent App Layout Auth Protection
- **`app/(app)/layout.tsx`** - No auth check, relies on parent
- **`app/(app)/page.tsx`** - Has auth check calling `/api/auth/me`
- **Root `app/page.tsx`** - Has auth check with redirect
- **`app/(auth)/layout.tsx`** - Public, no auth check (correct)

**Issue**: Protected routes (/(app)/*) don't enforce auth at layout level. A user could navigate directly to protected routes.

**Fix**: Add auth check to `app/(app)/layout.tsx`

### 4. Inconsistent Route Patterns in app/(app)/page.tsx
Page uses old route pattern without `/(app)/` prefix:
- Line 76: `href="/movies"` → should be `/(app)/movies`
- Line 86: `href="/suggestions"` → should be `/(app)/suggestions`
- Line 96: `href="/watchlist"` → should be `/(app)/watchlist`
- Line 106: `href="/friends"` → should be `/(app)/friends`
- Line 26: `window.location.href = "/login"` → should be `/(auth)/login`

---

## ⚠️ Medium Issues

### 5. Missing Auth Headers in Fetch Calls
Multiple pages don't include auth headers in API calls:
- `app/(app)/friends/page.tsx` (line 40, 66)
- `app/(app)/calendar/page.tsx` (line 32-34)
- `app/(app)/movies/page.tsx` (line 30)
- `app/(app)/watchlist/page.tsx` (likely)
- `app/(app)/suggestions/page.tsx` (line 26)

**Issue**: API endpoints require auth but fetch calls omit `Authorization` header
**Fix**: Use helper from `lib/api.ts` or add: `headers: { Authorization: 'Bearer ' + localStorage.getItem('movienight_token') }`

### 6. API Response Format Inconsistency
Pages expect `data.data` structure but some might return differently:
- `app/(app)/friends/page.tsx` expects `result.data` (line 48)
- `app/(app)/calendar/page.tsx` expects `eventsData.data` (line 49)
- `app/(app)/movies/page.tsx` expects `data.data` (line 38)

**Issue**: Not all API endpoints confirmed to return `{ success, data }` format
**Fix**: Verify all route handlers return consistent structure

### 7. Type Mismatch in Friends Page
Friends page local types don't match API response types:
- Expects: `Friend { id, userId, username }`
- API likely returns: `Friend { id, username, email, avatar?, etc }`
- Expects: `FriendRequest { id, fromUserId, toUserId?, username, createdAt }`
- API returns: `FriendRequest { id, fromUser: { id, name, username, avatar? }, ...}`

**Impact**: Type mismatches could cause runtime errors
**Fix**: Align types with actual API response or import from `lib/api.ts`

### 8. Signup Minimum Password Length Mismatch
- `app/(auth)/signup/page.tsx` requires 8 characters (line 120)
- `app/api/auth/signup/route.ts` requires 6 characters (line 13)

**Issue**: Frontend validation stricter than backend
**Fix**: Either reduce frontend to 6 or increase backend to 8

### 9. Hard-coded Route References in Home Page
`app/page.tsx` (root home) has hard-coded route navigations that assume pages exist:
- `/movie-search` → doesn't exist (fixed in critical fixes)
- `/releases` → exists but inconsistent routing pattern
- `/movie-night` → exists
- `/suggest` → exists

**Fix**: All fixed in critical fixes, but verify all pages exist

---

## 🔍 Minor Issues

### 10. Missing Error Messages in Some Pages
Several pages don't show error messages to users:
- `app/(app)/friends/page.tsx` (line 76) - error silently logged
- `app/(app)/calendar/page.tsx` (line 132) - generic error message

### 11. No Toast/Notification Feedback
Most API calls don't provide user feedback on success/failure:
- Friend requests complete silently
- Notification updates don't show confirmation
- Should use Sonner toast (already set up in layout)

### 12. Missing Loading States
Some pages lack proper loading UI:
- `app/(app)/friends/page.tsx` - loads on mount but no skeleton/skeleton
- Individual action buttons don't show loading state while submitting

### 13. No Pagination Support
API responses might have many results but pages don't implement pagination:
- Movies list (line 50 limit hardcoded)
- Friends list
- Suggestions list
- Events list

### 14. Session Expiration Not Handled
Auth context checks 30-day expiration (line 84), but:
- Token could expire during active session
- No token refresh mechanism
- No auto-logout on expired token

### 15. Unused Dependencies
In context/AuthContext.tsx (old file):
- Line 37, 42 show `[REDACTED:password]` comments (security/clarity issue)

---

## 📋 Quick Fix Priority

**Do First (Blocks functionality):**
1. Create `/api/releases/upcoming` endpoint
2. Add auth check to `app/(app)/layout.tsx`
3. Fix route patterns in `app/(app)/page.tsx`
4. Add auth headers to all protected page fetch calls
5. Delete old `context/AuthContext.tsx` file

**Do Second (Improves UX):**
6. Align type definitions with actual API responses
7. Add toast notifications for user feedback
8. Fix password requirement mismatch (frontend vs backend)
9. Add error display in all pages

**Do Third (Nice to have):**
10. Add loading states to buttons
11. Implement pagination
12. Add token refresh mechanism
13. Add proper logout handling

---

## 📊 Summary

| Category | Count | Status |
|----------|-------|--------|
| Critical Issues | 4 | 🚨 |
| Medium Issues | 6 | ⚠️ |
| Minor Issues | 5 | 🔍 |
| **Total** | **15** | **Need Action** |

**Recommended Next Steps:**
1. Run critical fixes immediately
2. Address auth headers across all protected pages
3. Create missing API endpoints
4. Add proper error handling and user feedback
5. Sync type definitions between frontend/backend
