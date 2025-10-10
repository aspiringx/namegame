import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('[Firebase Client] Initializing with project:', firebaseConfig.projectId);

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Only initialize messaging in browser and if supported
let messaging: ReturnType<typeof getMessaging> | null = null;
let messagingPromise: Promise<ReturnType<typeof getMessaging> | null> | null = null;

if (typeof window !== 'undefined') {
  messagingPromise = isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
    return null;
  });
}

// Helper to get messaging (waits for initialization)
async function getMessagingInstance() {
  if (messagingPromise) {
    await messagingPromise;
  }
  return messaging;
}

export { messaging, getToken, onMessage, getMessagingInstance };
