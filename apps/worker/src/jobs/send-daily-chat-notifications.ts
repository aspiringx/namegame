import { PrismaClient } from '@namegame/db'
import { JobHandler } from '@namegame/queue'
import {
  sendPushNotification,
  getNotificationUrl,
  getRandomNotificationText,
} from '@namegame/notifications'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

/**
 * Generate a one-time login code for push notifications
 */
async function generateOneTimeLoginCode(userId: string): Promise<string> {
  const code = nanoid(32)

  await prisma.code.create({
    data: {
      userId,
      code,
    },
  })

  return code
}

/**
 * Daily job to send push notifications to users with unread chat messages
 * Runs at 12:30 PM Mountain Time daily
 */
export const sendDailyChatNotifications: JobHandler = async () => {
  const startTime = Date.now()

  try {
    console.log('[DailyChatNotifications] Starting daily chat notification job')

    // Find users with unread messages using raw SQL
    // Excludes messages sent by the user themselves
    const usersWithUnread = await prisma.$queryRaw<Array<{ userId: string }>>`
      SELECT DISTINCT cp."userId"
      FROM chat_participants cp
      INNER JOIN chat_messages cm ON cm."conversationId" = cp."conversationId"
      WHERE (cp."lastReadAt" IS NULL OR cm."createdAt" > cp."lastReadAt")
      AND cm."authorId" != cp."userId"
      AND EXISTS (
        SELECT 1 FROM "PushSubscription" ps WHERE ps."userId" = cp."userId"
      )
    `

    console.log(
      `[DailyChatNotifications] Found ${usersWithUnread.length} users with unread messages`,
    )

    if (usersWithUnread.length === 0) {
      console.log('[DailyChatNotifications] No users to notify')
      return
    }

    let totalSuccess = 0
    let totalFailure = 0

    // Generate random notification text once for this batch
    const notificationText = getRandomNotificationText()
    console.log(
      `[DailyChatNotifications] Using notification text: "${notificationText.title}" / "${notificationText.body}"`,
    )

    // Send notification to each user
    for (const { userId } of usersWithUnread) {
      try {
        // Generate one-time login code for SSO
        const loginCode = await generateOneTimeLoginCode(userId)
        // Use centralized URL helper (falls back to NEXT_PUBLIC_APP_URL in worker context)
        const ssoUrl = getNotificationUrl(
          `/one-time-login/${loginCode}?chat=open`,
        )

        const { successCount, failureCount } = await sendPushNotification(
          {
            title: notificationText.title,
            body: notificationText.body,
            icon: '/icon.png',
            badge: '/icon.png',
            data: {
              url: ssoUrl,
            },
          },
          { userId, prisma },
        )

        totalSuccess += successCount
        totalFailure += failureCount
      } catch (error) {
        console.error(
          `[DailyChatNotifications] Error for user ${userId}: ${error}`,
        )
        totalFailure++
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[DailyChatNotifications] Completed in ${duration}ms. Sent: ${totalSuccess}, Failed: ${totalFailure}`,
    )
  } catch (error) {
    console.error(`[DailyChatNotifications] Job failed: ${error}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
