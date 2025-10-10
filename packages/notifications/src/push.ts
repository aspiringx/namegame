import webPush, { type WebPushError } from 'web-push';
import { PrismaClient } from '@namegame/db';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
function initializeFirebase() {
  if (firebaseInitialized) return;
  
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  console.log('[Push] Checking FIREBASE_SERVICE_ACCOUNT...');
  console.log('[Push] Exists:', !!serviceAccountEnv);
  console.log('[Push] Type:', typeof serviceAccountEnv);
  console.log('[Push] Length:', serviceAccountEnv?.length);
  
  if (!serviceAccountEnv) {
    console.error('[Push] FIREBASE_SERVICE_ACCOUNT is not set!');
    return;
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    console.log('[Push] Successfully parsed service account');
    console.log('[Push] Project ID:', serviceAccount.project_id);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    firebaseInitialized = true;
    console.log('[Push] ✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('[Push] ❌ Failed to initialize Firebase Admin SDK');
    console.error('[Push] Error:', error);
    console.error('[Push] First 100 chars of env var:', serviceAccountEnv?.substring(0, 100));
  }
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
}

interface SendPushOptions {
  userId?: string;
  endpoint?: string;
  prisma?: PrismaClient;
}

/**
 * Configure VAPID details for web-push
 * Call this before sending any notifications
 */
export function configureVapid() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const vapidPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const vapidEmail = process.env.WEB_PUSH_EMAIL || 'mailto:notifications@namegame.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured. Set NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY');
  }

  console.log(`[Push] Configuring VAPID with subject: ${vapidEmail}`);
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Check if endpoint is FCM (Chrome/Android)
 */
function isFCMEndpoint(endpoint: string): boolean {
  return endpoint.includes('fcm.googleapis.com');
}

/**
 * Send push notification via Firebase Admin SDK (for Chrome/Android)
 */
async function sendViaFirebase(
  subscription: { endpoint: string; p256dh: string; auth: string; fcmToken: string | null },
  payload: PushNotificationPayload
): Promise<void> {
  // Initialize Firebase if not already done
  initializeFirebase();
  
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized');
  }

  // Use the stored FCM token (from getToken())
  if (!subscription.fcmToken) {
    throw new Error('No FCM token available for this subscription');
  }
  const token = subscription.fcmToken;
  console.log('[Firebase] Sending notification');
  console.log('[Firebase] Using stored FCM token:', token.substring(0, 20) + '...');
  console.log('[Firebase] Payload:', JSON.stringify({ title: payload.title, body: payload.body }));

  // Send via Firebase Admin SDK
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.icon,
          badge: payload.badge,
        },
        fcmOptions: {
          link: payload.data?.url,
        },
      },
    });
    console.log('[Firebase] Successfully sent message:', response);
  } catch (error: any) {
    console.error('[Firebase] Error details:', {
      code: error.code,
      message: error.message,
      details: error.errorInfo
    });
    throw error;
  }
}

/**
 * Send push notification to user(s)
 * @param payload - The notification content
 * @param options - Either userId (send to all user's devices) or endpoint (send to specific device)
 * @returns Number of successful sends and number of failures
 */
export async function sendPushNotification(
  payload: PushNotificationPayload,
  options: SendPushOptions
): Promise<{ successCount: number; failureCount: number }> {
  const { userId, endpoint, prisma: providedPrisma } = options;
  
  // Use provided prisma instance or create new one
  const prisma = providedPrisma || new PrismaClient();
  const shouldDisconnect = !providedPrisma;

  try {
    // Configure VAPID for web-push (Safari/Firefox/Edge - all non-Chrome browsers)
    configureVapid();

    // Fetch subscriptions
    let subscriptions;
    if (endpoint) {
      const sub = await prisma.pushSubscription.findUnique({
        where: { endpoint }
      });
      subscriptions = sub ? [sub] : [];
    } else if (userId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }, // Get newest first
        take: 10 // Limit to 10 most recent
      });
    } else {
      throw new Error('Must provide either userId or endpoint');
    }

    if (subscriptions.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const notificationPayload = JSON.stringify(payload);
    let successCount = 0;
    let failureCount = 0;

    // Send to all subscriptions (route to appropriate service)
    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        // Use Firebase for Chrome/Android, web-push for others
        if (isFCMEndpoint(sub.endpoint)) {
          console.log('[Push] Sending via Firebase Admin SDK (Chrome/Android)');
          return sendViaFirebase(sub, payload);
        } else {
          console.log('[Push] Sending via web-push (Safari/Firefox/Edge)');
          return webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
        }
      })
    );

    // Process results and clean up expired subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        const error = result.reason as WebPushError;
        
        // Log detailed error information
        console.error(`Push notification failed for subscription ${subscriptions[i].id}:`, {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body,
          endpoint: subscriptions[i].endpoint.substring(0, 50) + '...'
        });
        
        // Only delete subscription if it's truly expired/gone (410, 404)
        // Do NOT delete on 401/403 (authorization issues - likely VAPID config mismatch)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: subscriptions[i].id }
          });
          console.log(`Deleted expired/gone subscription: ${subscriptions[i].id}`);
        } else if (error.statusCode === 401 || error.statusCode === 403) {
          console.error(`Authorization error (likely VAPID mismatch) - NOT deleting subscription ${subscriptions[i].id}`);
        } else {
          console.error(`Unexpected error sending push notification to ${subscriptions[i].id}:`, error);
        }
      }
    }

    return { successCount, failureCount };
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}
