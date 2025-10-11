# Push Notifications Debugging Summary

## Current Status
Firebase Cloud Messaging (FCM) v12 is implemented for Chrome/Android, but tokens are being invalidated immediately after creation.

## The Problem
1. **Terminal test succeeds** - `test-firebase-send.js` can send notifications successfully
2. **Browser push-test fails** - Same token fails when sent from the web app
3. **Auto-subscription mystery** - A subscription is being created automatically on page load with an invalid token

## Key Findings

### Token Pattern
- **Good tokens** (from manual subscription): Work in terminal, fail in browser
- **Bad tokens** (from auto-subscription): Created on page load, always fail
- Tokens have format: `{prefix}:APA91b{suffix}` (e.g., `durP97X0wdpTh676Vebdyq:APA91b...`)

### Auto-Subscription Issue
On page load, `[SaveSubscription]` is logged, indicating `saveSubscription()` is being called automatically. This creates an invalid token that interferes with the manually created token.

**Stack trace added** in `/apps/web/src/actions/push.ts` line 59 to identify the caller.

### Service Worker Lifecycle
- Removed `self.skipWaiting()` and `clientsClaim()` from immediate execution
- These were causing service worker updates to invalidate tokens
- Now only called on explicit message or during activate event

## Files Modified

### Core Implementation
1. **`/apps/web/src/lib/firebase.ts`**
   - Upgraded to Firebase v12
   - Added debug logging
   - Enabled Firebase debug mode

2. **`/apps/web/src/worker/index.ts`**
   - Upgraded to Firebase v12 with ES modules
   - Fixed service worker lifecycle to prevent token invalidation
   - Removed aggressive skipWaiting/clientsClaim

3. **`/apps/web/src/hooks/usePushNotifications.ts`**
   - Added extensive logging for token creation
   - Added warnings to verify token matches network response
   - Enhanced error handling

4. **`/packages/notifications/src/push.ts`**
   - Added logging for subscription lookup
   - Will show exactly what's being queried from database

5. **`/apps/web/src/actions/push.ts`**
   - Added stack trace to identify auto-subscription caller

## Next Steps

### 1. Identify Auto-Subscription Source
Run the app and check logs for:
```
[SaveSubscription] Stack trace: ...
```
This will show what's calling `saveSubscription()` on page load.

### 2. Verify Token Consistency
When manually subscribing:
1. Check console for: `[Push] ✅ Firebase token received from getToken(): ...`
2. Check Network tab for `/registrations` response
3. Verify the `token` field in response matches console log EXACTLY
4. If they don't match, Firebase SDK has a bug

### 3. Test Token Immediately
After getting a token from `getToken()`:
1. Immediately test with `test-firebase-send.js`
2. If it works, the token is valid
3. If it fails, the token was never properly registered with Firebase

### 4. Check Service Worker Updates
- Ensure service worker isn't being updated between subscription and send
- Check DevTools → Application → Service Workers
- Look for "waiting" or "installing" states

## Potential Root Causes

### Theory 1: Auto-Subscribe on Page Load
Something is calling `subscribe()` when the page loads, creating a bad token before the user manually subscribes.

**Evidence:**
- `[SaveSubscription]` logs appear on page load
- No manual button click occurred

**Fix:**
- Identify caller via stack trace
- Remove auto-subscribe logic

### Theory 2: Service Worker Lifecycle
Service worker updates invalidate tokens immediately after creation.

**Status:** Partially addressed by removing `skipWaiting()`

**Next:**
- Test if tokens persist across page navigations
- Verify service worker isn't being updated on every build

### Theory 3: Firebase SDK Bug
`getToken()` returns a different token than what was registered with Firebase.

**Test:**
- Compare console log token with Network response token
- If different, this is a Firebase SDK bug
- May need to downgrade or find workaround

### Theory 4: IndexedDB Caching
Firebase SDK is reading cached tokens from IndexedDB instead of the current one.

**Test:**
- Clear IndexedDB before each test
- Check `firebase-installations-store` and `firebase-messaging-store`
- Verify only one token exists

## Testing Protocol

### Clean Test
1. Stop server
2. Clear all IndexedDB databases (firebase-*)
3. Unregister all service workers
4. Delete all PushSubscription records from database
5. Rebuild: `pnpm build`
6. Start: `pnpm start`
7. Navigate to app
8. **Check logs for auto-subscription**
9. Manually click "Enable Notifications"
10. Check console for token
11. Check Network tab for /registrations response
12. Verify tokens match
13. Immediately test with terminal: `node test-firebase-send.js "TOKEN"`
14. If works, navigate to /push-test
15. Test from browser
16. Compare results

### Expected Behavior
- No auto-subscription on page load
- Manual subscription creates valid token
- Token works in both terminal and browser
- Token persists across page navigations
- Token survives service worker updates

## Environment
- **Firebase Project:** namegame-d5341
- **Firebase SDK:** v12 (upgraded from v10)
- **Browser:** Chrome on macOS
- **Service Worker:** Workbox with custom Firebase integration
- **Database:** PostgreSQL with Prisma

## Useful Commands

```bash
# Rebuild web app
cd apps/web && pnpm build

# Rebuild notifications package
cd packages/notifications && pnpm build

# Test token directly
cd packages/notifications
node test-firebase-send.js "TOKEN_HERE"

# Check database
psql -d namegame -c "SELECT id, endpoint, fcmToken, createdAt FROM \"PushSubscription\" ORDER BY createdAt DESC LIMIT 5;"
```

## References
- [Firebase Cloud Messaging Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
