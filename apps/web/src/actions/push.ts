'use server'

import { auth } from '@/auth'
import db from '@/lib/prisma'
import webPush, { type WebPushError } from 'web-push'
import { z } from 'zod'

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
    // Find an existing subscription by its endpoint.
    const existingSubscription = await db.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (existingSubscription) {
      // If it exists and belongs to a different user, delete it.
      if (existingSubscription.userId !== userId) {
        await db.pushSubscription.delete({ where: { endpoint } })
      }
    }

    // Upsert the subscription. This will create it if it doesn't exist,
    // or update it if it already belongs to the current user.
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: userId, // Ensure userId is explicitly set on update
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
  endpoint?: string,
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'User not authenticated.' }
  }

  if (!endpoint) {
    return { success: false, message: 'No subscription endpoint provided.' }
  }

  // Configure VAPID details just-in-time to ensure keys are fresh.
  if (
    !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !process.env.WEB_PUSH_PRIVATE_KEY
  ) {
    console.error(
      'VAPID keys are not configured. Push notifications will fail.',
    )
    return {
      success: false,
      message: 'VAPID keys are not configured on the server.',
    }
  }

  const subject = process.env.WEB_PUSH_EMAIL
    ? process.env.WEB_PUSH_EMAIL
    : 'https://www.namegame.app'

  webPush.setVapidDetails(
    subject,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  )

  try {
    const subscription = await db.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (!subscription) {
      return { success: false, message: 'Subscription not found.' }
    }

    console.log(
      'Server-side subscription object:',
      JSON.stringify(subscription, null, 2),
    )

    const subscriptions = [subscription]

    if (subscriptions.length === 0) {
      return {
        success: false,
        message: 'No push subscriptions found for user.',
      }
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
            console.log(
              'Subscription has expired or is no longer valid: ',
              sub.id,
            )
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

export async function getSubscription(
  endpoint: string,
): Promise<{ success: boolean; subscription: any | null }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, subscription: null }
  }

  try {
    const subscription = await db.pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
        userId: session.user.id,
      },
    })
    return { success: true, subscription: subscription }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return { success: false, subscription: null }
  }
}

export async function getSubscriptions(params?: {
  cursor?: string
  limit?: number
  search?: string
}): Promise<{
  subscriptions: { endpoint: string; userName: string; userId: string; createdAt: Date }[]
  hasMore: boolean
  nextCursor: string | null
}> {
  const limit = params?.limit || 20
  const search = params?.search?.toLowerCase()

  const subscriptions = await db.pushSubscription.findMany({
    where: search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : undefined,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
    take: limit + 1, // Fetch one extra to check if there are more
    ...(params?.cursor ? { cursor: { endpoint: params.cursor }, skip: 1 } : {}),
  })

  const hasMore = subscriptions.length > limit
  const items = hasMore ? subscriptions.slice(0, limit) : subscriptions
  const nextCursor = hasMore ? items[items.length - 1].endpoint : null

  return {
    subscriptions: items.map((sub) => ({
      endpoint: sub.endpoint,
      userName: `${sub.user.firstName}${sub.user.lastName ? ' ' + sub.user.lastName : ''}`,
      userId: sub.userId,
      createdAt: sub.createdAt,
    })),
    hasMore,
    nextCursor,
  }
}

export async function sendDailyChatNotifications(
  endpoints: string[]
): Promise<{ success: boolean; sent: number; failed: number; message: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, sent: 0, failed: 0, message: 'User not authenticated.' }
  }

  // Check if user is super admin
  if (!session.user.isSuperAdmin) {
    return { success: false, sent: 0, failed: 0, message: 'Unauthorized.' }
  }

  // Configure VAPID details
  if (
    !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !process.env.WEB_PUSH_PRIVATE_KEY
  ) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      message: 'VAPID keys are not configured on the server.',
    }
  }

  const subject = process.env.WEB_PUSH_EMAIL
    ? process.env.WEB_PUSH_EMAIL
    : 'https://www.namegame.app'

  webPush.setVapidDetails(
    subject,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  )

  // Get subscriptions for selected endpoints
  const subscriptions = await db.pushSubscription.findMany({
    where: {
      endpoint: { in: endpoints },
    },
  })

  if (subscriptions.length === 0) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      message: 'No subscriptions found for selected devices.',
    }
  }

  // Check which users actually have unread messages
  const userIds = [...new Set(subscriptions.map(s => s.userId))]
  
  if (userIds.length === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      message: 'No users found for selected devices.',
    }
  }
  
  const usersWithUnread = await db.$queryRaw<Array<{ userId: string }>>`
    SELECT DISTINCT cp."userId"
    FROM chat_participants cp
    INNER JOIN chat_messages cm ON cm."conversationId" = cp."conversationId"
    WHERE (cp."lastReadAt" IS NULL OR cm."createdAt" > cp."lastReadAt")
    AND cp."userId" = ANY(${userIds}::text[])
  `

  const userIdsWithUnread = new Set(usersWithUnread.map(u => u.userId))
  
  // Filter subscriptions to only include users with unread messages
  const subscriptionsToNotify = subscriptions.filter(s => userIdsWithUnread.has(s.userId))

  if (subscriptionsToNotify.length === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      message: 'No users with unread messages among selected devices.',
    }
  }

  const payload = {
    title: 'New Messages',
    body: "Looks like you have new messages. Since this is a non-annoying notification, you can check them if you feel like it... or not.",
    icon: '/icon.png',
    badge: '/icon.png',
    data: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}?openChat=true`,
    },
  }

  const notificationPayload = JSON.stringify(payload)
  let sent = 0
  let failed = 0

  const sendPromises = subscriptionsToNotify.map((sub) =>
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
      .then(() => {
        sent++
      })
      .catch(async (error: WebPushError) => {
        failed++
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('Deleted expired subscription:', sub.id)
          await db.pushSubscription.delete({ where: { id: sub.id } })
        } else {
          console.error('Error sending push notification:', error)
        }
      }),
  )

  await Promise.all(sendPromises)

  return {
    success: true,
    sent,
    failed,
    message: `Sent ${sent} notifications, ${failed} failed.`,
  }
}
