import { PrismaClient } from "@namegame/db";
import { JobHandler } from "@namegame/queue";
import {
  getNotificationUrl,
  getRandomNotificationText,
} from "@namegame/notifications";
import { nanoid } from "nanoid";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail =
  process.env.FROM_EMAIL_NO_REPLY || "NameGame <no-reply@mail.namegame.app>";

/**
 * Generate HTML email for daily chat notification
 */
function generateEmailHtml(
  ssoLink: string,
  unsubscribeLink: string,
  firstName: string | undefined,
  notificationTitle: string,
  notificationBody: string,
  emoji: string
): string {
  const name = firstName || "there";
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      background-color: #ffffff;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      padding: 20px 20px 48px;
    }
    .header {
      text-align: center;
      padding: 10px 0;
    }
    .header h1 {
      color: black;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      line-height: 1.5;
    }
    .header .tagline {
      color: gray;
      font-size: 16px;
      font-weight: normal;
      font-style: italic;
    }
    .content {
      color: #000;
      font-size: 14px;
      line-height: 24px;
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
      color: #fff !important;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      margin: 16px 0;
    }
    .small-text {
      color: #666;
      font-size: 12px;
      line-height: 20px;
      margin-top: 16px;
    }
    .hr {
      border: none;
      border-top: 1px solid #cccccc;
      margin: 12px 0;
    }
    .footer {
      color: #8898aa;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 20px 20px 48px !important;
      }
      .header h1 {
        font-size: 22px !important;
      }
      .content {
        font-size: 16px !important;
      }
      .button {
        padding: 12px 24px !important;
        font-size: 16px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        NameGame
        <br>
        <span class="tagline">Life is relationships</span>
      </h1>
    </div>
    
    <div class="content">
      <p>Hi ${name},</p>
      <p>${notificationBody}</p>
      <a href="${ssoLink}" class="button">View Messages</a>
      <p class="small-text">We only send this if you have new messages and no more than daily.</p>
    </div>
    
    <hr class="hr">
    
    <div class="footer">
      <p style="margin-bottom: 8px;">
        <a href="${unsubscribeLink}" style="color: #8898aa; text-decoration: underline;">Unsubscribe</a> from daily digest emails
      </p>
      <p style="margin: 4px 0;">NameGame</p>
      <p style="margin: 4px 0;">Sandy, UT 84070</p>
      <p style="margin: 4px 0;">&copy; ${year} NameGame</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for daily chat notification
 */
function generateEmailText(
  ssoLink: string,
  unsubscribeLink: string,
  firstName: string | undefined,
  notificationBody: string
): string {
  const name = firstName || "there";
  const year = new Date().getFullYear();

  return `
Hi ${name},

${notificationBody}

View your messages: ${ssoLink}

We only send this if you have new messages and no more than daily.

Unsubscribe: ${unsubscribeLink}

NameGame
Sandy, UT 84070
${year} NameGame
  `.trim();
}

/**
 * Generate a one-time login code for email SSO links
 */
async function generateOneTimeLoginCode(userId: string): Promise<string> {
  const code = nanoid(32);

  await prisma.code.create({
    data: {
      userId,
      code,
    },
  });

  return code;
}

/**
 * Daily job to send email notifications to users with unread chat messages
 * Runs at 5:30 PM Mountain Time daily (5 hours after push notifications)
 * Only sends to users with verified emails who have unread messages
 */
export const sendDailyChatEmails: JobHandler = async () => {
  const startTime = Date.now();

  try {
    console.log("[DailyChatEmails] Starting daily chat email job");

    // Find users with unread messages AND verified emails
    // Excludes messages sent by the user themselves
    const usersWithUnread = await prisma.$queryRaw<
      Array<{
        userId: string;
        email: string;
        firstName: string | null;
      }>
    >`
      SELECT DISTINCT 
        u.id as "userId",
        u.email,
        u."firstName"
      FROM chat_participants cp
      INNER JOIN chat_messages cm ON cm."conversationId" = cp."conversationId"
      INNER JOIN "User" u ON u.id = cp."userId"
      WHERE (cp."lastReadAt" IS NULL OR cm."createdAt" > cp."lastReadAt")
      AND cm."authorId" != cp."userId"
      AND u.email IS NOT NULL
      AND u."emailVerified" IS NOT NULL
    `;

    console.log(
      `[DailyChatEmails] Found ${usersWithUnread.length} users with unread messages and verified emails`
    );

    if (usersWithUnread.length === 0) {
      console.log("[DailyChatEmails] No users to notify");
      return;
    }

    let totalSuccess = 0;
    let totalFailure = 0;

    // Generate random notification text once for this batch
    const notificationText = getRandomNotificationText();
    console.log(
      `[DailyChatEmails] Using notification text: "${notificationText.title}" / "${notificationText.body}"`
    );

    // Extract emoji from the body (first emoji before the text)
    const emojiMatch = notificationText.body.match(/^([\p{Emoji}]+)/u);
    const emoji = emojiMatch ? emojiMatch[1].charAt(0) : "💬";

    // Send email to each user
    for (const { userId, email, firstName } of usersWithUnread) {
      try {
        // Generate one-time login code for SSO
        const loginCode = await generateOneTimeLoginCode(userId);
        // Use centralized URL helper (falls back to NEXT_PUBLIC_APP_URL in worker context)
        const ssoUrl = getNotificationUrl(
          `/one-time-login/${loginCode}?openChat=true`
        );
        const unsubscribeUrl = getNotificationUrl(
          `/one-time-login/${loginCode}?emailUnsubscribe=true`
        );

        // Generate email HTML and text
        const emailHtml = generateEmailHtml(
          ssoUrl,
          unsubscribeUrl,
          firstName || undefined,
          notificationText.title,
          notificationText.body,
          emoji
        );

        const emailText = generateEmailText(
          ssoUrl,
          unsubscribeUrl,
          firstName || undefined,
          notificationText.body
        );

        // Send via Resend
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `${emoji} ${notificationText.title} ${emoji}`,
          html: emailHtml,
          text: emailText,
        });

        totalSuccess++;
        console.log(`[DailyChatEmails] Email sent to ${email}`);
      } catch (error) {
        console.error(`[DailyChatEmails] Error for user ${userId}: ${error}`);
        totalFailure++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[DailyChatEmails] Completed in ${duration}ms. Sent: ${totalSuccess}, Failed: ${totalFailure}`
    );
  } catch (error) {
    console.error(`[DailyChatEmails] Job failed: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};
