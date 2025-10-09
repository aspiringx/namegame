# Firebase Push Notification Setup for Chrome/Android

## Current Status

- ✅ **Safari/iOS**: Working with VAPID keys only (uses Apple Push Notification Service)
- ✅ **Firefox**: Working with VAPID keys only (uses Mozilla Push Service)
- ❌ **Chrome/Android**: Failing with 410 errors (requires Firebase Cloud Messaging setup)

## Why Firebase is Needed

Chrome and Android use Firebase Cloud Messaging (FCM) for push notifications. While older implementations worked with just VAPID keys, Google now requires a Firebase project for web push notifications.

## Setup Steps

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Enter project name: `namegame` (or your preferred name)
4. Disable Google Analytics (optional, not needed for push notifications)
5. Click "Create project"

### 2. Enable Cloud Messaging

1. In your Firebase project, go to Project Settings (gear icon)
2. Click on "Cloud Messaging" tab
3. Under "Web Push certificates", click "Generate key pair"
4. Copy the "Key pair" value (this is your VAPID public key)
   - **Note**: You can use this OR keep your existing VAPID keys. If you keep existing keys, you need to add them to Firebase.

### 3. Get Firebase Configuration

1. In Project Settings, scroll down to "Your apps"
2. Click the web icon (`</>`) to add a web app
3. Register app with nickname: `namegame-web`
4. Copy the Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Add Environment Variables

Add these to your `.env` file and DigitalOcean environment variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Use Firebase-generated VAPID key or keep existing
# NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=<Firebase VAPID key or existing key>
```

### 5. Install Firebase SDK

```bash
cd apps/web
pnpm add firebase
```

### 6. Initialize Firebase in Your App

Create `apps/web/src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Only initialize messaging in browser
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export { messaging, getToken, onMessage };
```

### 7. Update Service Worker Registration

The service worker needs to use Firebase's messaging service worker. Update `apps/web/src/hooks/usePushNotifications.ts` to use Firebase's `getToken()` instead of the native Push API for Chrome users.

### 8. Server-Side Configuration

The server-side push sending code (`packages/notifications/src/push.ts`) should continue to work as-is. Firebase uses the same VAPID authentication on the server side.

## Testing

After setup:

1. Clear all browser data for namegame.app
2. Refresh the page
3. Enable notifications
4. Send a test notification
5. Chrome should now receive notifications successfully

## Cost

Firebase Cloud Messaging is **completely free** with no limits on the number of notifications sent.

## Troubleshooting

### Still Getting 410 Errors

- Verify Firebase project is created and Cloud Messaging is enabled
- Check that all environment variables are set correctly in DigitalOcean
- Ensure the VAPID public key matches between Firebase and your env vars
- Clear browser data and re-subscribe

### Notifications Not Appearing

- Check macOS System Settings → Notifications → Chrome → "Allow notifications" is ON
- Verify the service worker is active in DevTools → Application → Service Workers
- Check browser console for Firebase initialization errors

## Alternative: Skip Chrome for Now

Since Safari (iOS/Mac) and Firefox work perfectly without Firebase, you can:

1. Document Chrome as "coming soon"
2. Focus on Safari for iOS users (your primary audience)
3. Add Firebase support later when Chrome users become a priority

Most users will be on mobile (Safari on iOS) where push notifications work great!
