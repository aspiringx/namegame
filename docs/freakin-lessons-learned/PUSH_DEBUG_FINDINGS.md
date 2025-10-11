# Push Notifications Debug Findings - 2025-10-11

## Critical Discovery

**The auto-subscribe is happening DURING PAGE LOAD, not from user interaction.**

### Evidence

1. **Server logs show `[SaveSubscription]` before any user action**
2. **Stack trace points to `/me` page rendering**
3. **Confirm popup only appeared when manually clicking "Enable Notifications"**

### The Mystery

The `subscribe()` function has a confirm dialog that should block auto-subscription, but `saveSubscription()` is still being called during SSR/hydration.

**This suggests one of two things:**
1. There's a SECOND code path that calls `saveSubscription()` directly (bypassing `subscribe()`)
2. The client-side `subscribe()` is being called BEFORE the confirm dialog was added

## Token Validation Issue

**Every token created fails with "registration-token-not-registered"**

This means:
- `getToken()` returns a token
- Token gets saved to database
- When we try to send to it, Firebase says it doesn't exist

**Possible causes:**
1. Token is never properly registered with Firebase
2. Token is invalidated immediately after creation
3. Service worker lifecycle is breaking the token
4. There's a timing issue between token creation and registration

## Next Steps

### 1. Test Token Immediately After Creation

When you subscribe, the console will print:
```
[Push] 🧪 IMMEDIATELY test this token with: node test-firebase-send.js "TOKEN_HERE"
```

**Copy that command and run it in the terminal IMMEDIATELY.**

**Expected results:**
- ✅ If it works: Token is valid, something else is breaking it later
- ❌ If it fails: Token was never valid, `getToken()` has a bug

### 2. Find the Auto-Subscribe Source

The confirm dialog will show you WHEN subscribe is being called. If it appears on page load (without clicking), we know there's an auto-subscribe.

**If no confirm appears but `[SaveSubscription]` still logs:**
- There's a second code path calling `saveSubscription()` directly
- Need to search for server-side calls to the action

### 3. Check Service Worker State

When subscribing, check DevTools → Application → Service Workers:
- Should show ONE active service worker
- Should NOT show "waiting" or "installing"
- Should NOT update between subscription and send

## Files Modified Today

1. **`/apps/web/src/hooks/usePushNotifications.ts`**
   - Added confirm dialog to block auto-subscribe
   - Added detailed logging with stack traces
   - Added command to test token immediately

2. **`/apps/web/src/actions/push.ts`**
   - Added stack trace logging to `saveSubscription()`

3. **`/packages/notifications/src/push.ts`**
   - Added logging for subscription lookup

## Testing Protocol

1. **Clean state:**
   ```bash
   # Delete all subscriptions
   DELETE FROM "PushSubscription" WHERE "userId" = 'YOUR_USER_ID';
   
   # Clear browser data
   - IndexedDB (firebase-*)
   - Service Workers
   - LocalStorage
   ```

2. **Navigate to `/me`**
   - Check console for auto-subscribe logs
   - Check if confirm dialog appears
   - Note the stack trace

3. **Click "Enable Notifications"**
   - Confirm dialog should appear
   - Click OK
   - Copy the test command from console
   - Run it IMMEDIATELY in terminal

4. **If terminal test succeeds:**
   - Token is valid
   - Navigate to `/push-test`
   - Try sending from browser
   - Compare results

5. **If terminal test fails:**
   - Token was never valid
   - Check Network tab for `/registrations` response
   - Compare token in response vs console log
   - This is a Firebase SDK bug

## Hypothesis

**Most likely scenario:** 
`getToken()` is returning tokens that are not properly registered with Firebase's backend. This could be due to:
- Service worker not being fully active when `getToken()` is called
- VAPID key mismatch
- Firebase project configuration issue
- Network timing issue during registration

**Test this by:**
1. Ensuring service worker is FULLY active before calling `getToken()`
2. Adding a delay after `getToken()` before saving to database
3. Verifying the token with Firebase immediately after creation

## Commands

```bash
# Rebuild everything
cd packages/notifications && pnpm build
cd ../../apps/web && pnpm build

# Test token directly
cd packages/notifications
node test-firebase-send.js "TOKEN_HERE"

# Check database
psql -d namegame -c "SELECT id, fcmToken, createdAt FROM \"PushSubscription\" ORDER BY createdAt DESC LIMIT 5;"

# Clear subscriptions
psql -d namegame -c "DELETE FROM \"PushSubscription\" WHERE \"userId\" = 'YOUR_USER_ID';"
```

## Firebase Configuration

- **Project:** namegame-d5341
- **SDK Version:** v12
- **VAPID Key:** BDJxMN1j8RsPL8l4AWtS...
- **Service Worker:** /sw.js

## References

- [Firebase getToken() docs](https://firebase.google.com/docs/reference/js/messaging.md#gettoken)
- [FCM registration tokens](https://firebase.google.com/docs/cloud-messaging/js/client#access_the_registration_token)
- [Service Worker lifecycle](https://web.dev/service-worker-lifecycle/)
