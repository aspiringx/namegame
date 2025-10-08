import webPush, { type WebPushError } from 'web-push';
import { PrismaClient } from '@namegame/db';

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
    // Configure VAPID if not already done
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
        where: { userId }
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

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        )
      )
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
