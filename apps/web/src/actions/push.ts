'use server'

import { auth } from '@/auth'
import db from '@/lib/prisma'
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
  fcmToken?: string,
  deviceInfo?: { browser?: string; os?: string; deviceType?: string },
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

  // Detect browser from endpoint (fallback if not provided)
  let browser = deviceInfo?.browser || 'unknown'
  if (!deviceInfo?.browser) {
    if (endpoint.includes('fcm.googleapis.com')) {
      browser = 'chrome'
    } else if (endpoint.includes('web.push.apple.com')) {
      browser = 'safari'
    } else if (endpoint.includes('notify.windows.com')) {
      browser = 'edge'
    } else if (endpoint.includes('updates.push.services.mozilla.com')) {
      browser = 'firefox'
    }
  }

  // Log subscription details for debugging
  console.log('[SaveSubscription] New subscription:', {
    endpoint: endpoint.substring(0, 50) + '...',
    userId,
    browser,
    os: deviceInfo?.os,
    deviceType: deviceInfo?.deviceType,
    hasFcmToken: !!fcmToken
  })
  console.log('[SaveSubscription] Stack trace:', new Error().stack)

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
        fcmToken: fcmToken || null,
        browser: browser,
        os: deviceInfo?.os || null,
        deviceType: deviceInfo?.deviceType || null,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        fcmToken: fcmToken || null,
        browser: browser,
        os: deviceInfo?.os || null,
        deviceType: deviceInfo?.deviceType || null,
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

  try {
    // Use the centralized push notification function with proper error handling
    const { sendPushNotification } = await import('@namegame/notifications')
    
    const result = await sendPushNotification(payload, { endpoint, prisma: db })
    
    if (result.successCount > 0) {
      return { success: true, message: 'Notification sent successfully.' }
    } else if (result.failureCount > 0) {
      return { success: false, message: 'Failed to send notification. Check server logs for details.' }
    } else {
      return { success: false, message: 'No subscriptions found for this endpoint.' }
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, message: 'Failed to send notification.' }
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

export async function getUserSubscriptions(): Promise<{
  success: boolean
  subscriptions: any[]
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, subscriptions: [] }
  }

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, subscriptions }
  } catch (error) {
    console.error('Error fetching user subscriptions:', error)
    return { success: false, subscriptions: [] }
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
    AND cm."authorId" != cp."userId"
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

  // Use centralized push notification function
  const { sendPushNotification } = await import('@namegame/notifications')
  
  const payload = {
    title: 'New Messages',
    body: "Looks like you have new messages. Since this is a non-annoying notification, you can check them if you feel like it... or not.",
    icon: '/icon.png',
    badge: '/icon.png',
    data: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}?openChat=true`,
    },
  }

  let sent = 0
  let failed = 0

  // Send to each subscription individually to track success/failure
  for (const sub of subscriptionsToNotify) {
    const result = await sendPushNotification(payload, { endpoint: sub.endpoint, prisma: db })
    sent += result.successCount
    failed += result.failureCount
  }

  return {
    success: true,
    sent,
    failed,
    message: `Sent ${sent} notifications, ${failed} failed.`,
  }
}
