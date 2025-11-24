# MovieNight Repository Review

## Summary
Found **5 broken API routes** being called from `lib/api.ts` that don't exist in the backend, and confirmed dummy data usage is documented but limited.

---

## 🚨 BROKEN ROUTES (Critical)

### 1. **Search Users Route** ❌
- **Called from**: `lib/api.ts` line 93
- **Function**: `searchUsers(query: string)`
- **API Call**: `GET /api/auth/search-users?q=...`
- **Status**: **NO ENDPOINT EXISTS**
- **Impact**: Friend search feature will fail silently
- **Used in**: Unknown (no components found calling this)

### 2. **Get Notifications Routes** ❌ (3 endpoints)
- **Called from**: `lib/api.ts` lines 170-217
- **Functions**:
  - `getNotifications(userId)` → `GET /api/notifications/{userId}`
  - `getUnreadNotificationCount(userId)` → `GET /api/notifications/{userId}/unread-count`
  - `markNotificationAsRead(userId, notificationId)` → `POST /api/notifications/{userId}/mark-read`
  - `deleteNotification(userId, notificationId)` → `DELETE /api/notifications/{userId}/{notificationId}`
- **Status**: **NO ENDPOINT EXISTS**
- **Impact**: All notification features will fail
- **Severity**: High - affects user communication

### 3. **Friend Request Routes** ❌ (2 endpoints)
- **Called from**: `lib/api.ts` lines 110-128
- **Functions**:
  - `getIncomingRequests(userId)` → `GET /api/friends/{userId}/incoming`
  - `getOutgoingRequests(userId)` → `GET /api/friends/{userId}/outgoing`
- **Status**: **PARTIALLY IMPLEMENTED**
- **What exists**: `GET /api/friends` returns `{ friends, incomingRequests, outgoingRequests }` in one call
- **What's missing**: Separate `/incoming` and `/outgoing` endpoints
- **Impact**: Friend request features might work via main `/api/friends` but individual endpoint calls will fail
- **Fix**: Update client to use single `/api/friends` endpoint instead of three separate ones

### 4. **Analytics Endpoint** ❌
- **Called from**: `lib/api.ts` line 287
- **Function**: `getDashboardStats()` internal call
- **API Call**: `GET /api/analytics/suggestion-accuracy/{userId}`
- **Status**: **NO ENDPOINT EXISTS** (has fallback handling)
- **Impact**: Suggestion accuracy will always be 0 (has error handling)
- **Severity**: Low - graceful fallback exists

### 5. **User ID Path Parameter Issue**
- **Called from**: `lib/api.ts` lines 103, 113, 123, 272
- **Pattern**: Functions call `GET /api/friends/{userId}` with user ID as path param
- **Current Backend**: `GET /api/friends` expects user from auth token, not param
- **Impact**: Routes will fail because backend doesn't accept path param
- **Status**: Design mismatch between client and server

---

## 📊 DUMMY DATA USAGE

### Confirmed Dummy Data (from HARDCODED_FIXES_SUMMARY.md)

#### ✅ Fixed (Dynamic Data)
1. **Dashboard Statistics**
   - Friends count: Now dynamic
   - Active suggestions: Now dynamic
   - Trending movies: Now loaded from API
   - Upcoming releases: Now loaded from API

#### ⚠️ Still Using Dummy/Placeholder Values
1. **Movies Watched This Week** - Hardcoded to `0` (line 305 in lib/api.ts)
   - TODO: Implement watched movies tracking
   
2. **Watch Count on Trending Movies** - Hardcoded to `0` (line 337 in lib/api.ts)
   - TODO: Implement real watch count tracking

3. **Social Activity Feed** - Uses mock activity data (mentioned as lower priority)

4. **Suggestion Accuracy** - Falls back to `0` when API endpoint missing (line 299)

---

## ✅ EXISTING WORKING ROUTES

The following endpoints ARE properly implemented and working:

### Authentication (`/api/auth`)
- ✅ POST /api/auth/login
- ✅ POST /api/auth/signup
- ✅ GET /api/auth/me
- ✅ POST /api/auth/logout

### Friends (`/api/friends`)
- ✅ GET /api/friends (returns all friends + incoming/outgoing requests)
- ✅ POST /api/friends/request
- ✅ PATCH /api/friends/[id] (accept/reject)
- ✅ DELETE /api/friends/[id]

### Events (`/api/events`)
- ✅ POST /api/events
- ✅ GET /api/events
- ✅ GET /api/events/[id]
- ✅ PATCH /api/events/[id]
- ✅ DELETE /api/events/[id]

### Movies (`/api/movies`)
- ✅ GET /api/movies
- ✅ GET /api/movies/[id]

### Watch History (`/api/watch`)
- ✅ POST /api/watch/desire
- ✅ GET /api/watch/desire
- ✅ POST /api/watch/mark-watched
- ✅ GET /api/watch/history

### Suggestions (`/api/suggestions`)
- ✅ POST /api/suggestions
- ✅ GET /api/suggestions

---

## 🔧 RECOMMENDATIONS

### Priority 1: Fix Route Mismatches
1. **Remove separate friend request endpoints from lib/api.ts**:
   - Delete `getIncomingRequests()` function
   - Delete `getOutgoingRequests()` function
   - Update all components to extract from `GET /api/friends` response instead

2. **Fix user ID parameter issue**:
   - Remove `{userId}` path params from notification and friend queries
   - All should use auth token to identify current user
   - Update `lib/api.ts` functions to remove userId parameter where not needed

### Priority 2: Create Missing Endpoints
1. **Add search users endpoint** OR remove `searchUsers()` function if not used
2. **Add notifications API** (`/api/notifications`) or remove notification functions
3. **Add analytics endpoint** (`/api/analytics/suggestion-accuracy`) or use fallback properly

### Priority 3: Replace Dummy Data
1. Implement watched movies tracking (currently `0`)
2. Implement watch count tracking (currently `0`)
3. Replace mock social activity feed with real data

---

## Files to Update

1. **lib/api.ts** - Remove/fix the 5 broken function calls
2. **Components using these functions** - Need to identify and update
3. **Create missing API routes** - Either create or remove client-side calls

---

## Next Steps

1. Run TypeScript check to find compilation errors related to broken endpoints
2. Search components for usage of `searchUsers`, `getNotifications`, `getIncomingRequests`, `getOutgoingRequests`
3. Create missing API endpoints or refactor client to use existing ones
4. Test friend requests and notifications flows
