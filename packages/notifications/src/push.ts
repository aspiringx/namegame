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
  const vapidEmail = process.env.WEB_PUSH_EMAIL || 'https://www.namegame.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured. Set NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY');
  }

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
        
        // If subscription is expired/invalid, delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: subscriptions[i].id }
          });
          console.log(`Deleted expired subscription: ${subscriptions[i].id}`);
        } else {
          console.error('Error sending push notification:', error);
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
