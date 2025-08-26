'use server'

import { auth } from '@/auth'
import db from '@/lib/prisma'
import webPush, { type WebPushError } from 'web-push'
import { z } from 'zod'

if (
  process.env.WEB_PUSH_EMAIL &&
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY &&
  process.env.WEB_PUSH_PRIVATE_KEY
) {
  webPush.setVapidDetails(
    `mailto:${process.env.WEB_PUSH_EMAIL}`,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  )
} else {
  console.error('VAPID keys are not configured. Push notifications will fail.')
}

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

export async function saveSubscription(
  subscription: unknown,
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'User not authenticated.' }
  }
  const userId = session.user.id

  const parsedSubscription = subscriptionSchema.safeParse(subscription)
  if (!parsedSubscription.success) {
    return {
      success: false,
      message: `Invalid subscription object: ${parsedSubscription.error.message}`,
    }
  }

  const { endpoint, keys } = parsedSubscription.data

  try {
    // Upsert to handle cases where the subscription already exists for the endpoint
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })
    return { success: true, message: 'Subscription saved.' }
  } catch (error) {
    console.error('Error saving subscription:', error)
    return { success: false, message: 'Failed to save subscription.' }
  }
}

export async function deleteSubscription(
  endpoint: string,
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'User not authenticated.' }
  }

  try {
    await db.pushSubscription.deleteMany({
      where: {
        endpoint: endpoint,
        userId: session.user.id,
      },
    })
    return { success: true, message: 'Subscription deleted successfully.' }
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return { success: false, message: 'Failed to delete subscription.' }
  }
}

export async function sendNotification(
  payload: any,
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'User not authenticated.' }
  }

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: session.user.id },
    })

    if (subscriptions.length === 0) {
      return { success: false, message: 'No push subscriptions found for user.' }
    }

    const notificationPayload = JSON.stringify(payload)

    const sendPromises = subscriptions.map((sub) =>
      webPush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload,
        )
        .catch((error: WebPushError) => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Subscription has expired or is no longer valid: ', sub.id)
            return db.pushSubscription.delete({ where: { id: sub.id } })
          } else {
            console.error('Error sending push notification:', error)
          }
        }),
    )

    await Promise.all(sendPromises)

    return { success: true, message: 'Notifications sent successfully.' }
  } catch (error) {
    console.error('Error sending notifications:', error)
    return { success: false, message: 'Failed to send notifications.' }
  }
}
