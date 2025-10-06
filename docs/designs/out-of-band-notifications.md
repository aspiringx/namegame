# Out-of-Band Notifications Design

## Overview

System for notifying users of activity (starting with chat messages but extending
to other info like new group members, content, etc.) outside the app via push
notifications and email. Designed to prevent spam while keeping users engaged.

## Guiding Principles

1. **Push First**: Push notifications are more immediate and less intrusive than email, but only possible for users who have enabled notifications in their user profile.

We need to make this more visible while also reassuring users about our limits.
Last night my wife's first response was "I hate push notifications and never
choose them... my phone starts going crazy." She's referring (at least in part)
to a large family Telegram chat group where everyone starts responding and buzzing
everyone with every new message.

We need a good way for people to immediately know
this doesn't work this way. Maybe even branding it. Instead of "Enable Notifications"
call it something like "Enable Non-Annoying Notifications" and clearly say why,
maybe in an expandable "Learn More" section.

Also reassure people that they can turn it off any time by just tapping
"Disable Non-Annoying Notifications" in their profile. They don't need to go dig
into phone or browser settings to remember how to turn them off.

**Suggested UI for "Learn More" expandable section:**

```
Enable Non-Annoying Notifications
[Learn More ▼]

When expanded:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Maximum 1 notification per day
✓ Bundles multiple messages into one
✓ Respects your sleep schedule (no 2am buzzes)
✓ Never includes message content (just "You have some messages from...")
✓ Turn off anytime in your profile - no digging through phone settings

[Enable Non-Annoying Notifications]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Key messaging elements:**
- Checkmarks create positive framing
- Specific numbers ("1 per day") are more trustworthy than vague promises
- "No 2am buzzes" speaks directly to sleep anxiety
- Privacy angle (no message content, just sender names)
- Reinforces the easy opt-out

2. **Digest Over Individual**: Batch multiple events into a single notification to reduce noise
3. **Strict Rate Limiting**: Guarantee users won't be overwhelmed with notifications
4. **Multi-Channel Support**: One notification event can be delivered via multiple channels (push, email, SMS future)
5. **Timezone Aware**: Respect user's local time to avoid notifications during sleep hours

## Current Delivery Channels

### Implemented

- **Push Notifications**: Via Web Push API, tracked in `PushSubscription` table
  - Works best on installed PWAs (Save to Home Screen)
  - Browser-only subscriptions more limited (especially Safari)
  - Users may have multiple device subscriptions
- **Email**: Via Resend (see `src/lib/mail.ts`)
  - Requires verified email address
  - Secondary to push notifications

### Future Consideration

- **SMS/Text**: Not planned due to complexity and cost of allowing app users to initiate texts

## Phase 1: Push Notifications (Current Implementation)

### Notification Strategy

**Smart Delay with Frequency Cap:**

- First unread message triggers a 15-30 minute delay timer
- Additional messages within that window are batched into the same notification
- Maximum frequency: 1 notification per 24 hours per user (daily limit)
- Timezone-aware delivery: Notifications delayed if user is in "quiet hours" (e.g., 10 PM - 7 AM local time)

### Notification Content

**Digest Format:**

```
"You have some messages from Joe, Benson and others"
[Tap to open]
```

**Alternative (if only one sender):**
```
"You have some messages from Sarah"
[Tap to open]
```

**Rationale:**

- No individual message content (privacy + simplicity)
- No counts (gentler, less anxiety-inducing than "You have 47 unread messages")
- Shows sender names to provide context without being overwhelming
- "and others" when more than 2-3 senders (keeps it brief)
- Links to app with chat drawer open (via `?openChat=true` query param)
- User sees green dots and can choose which conversations to read
- No specific conversation links (keeps it simple, encourages app engagement)

### Database Schema

#### New Table: `NotificationQueue`

```prisma
model NotificationQueue {
  id                String   @id @default(cuid())
  userId            String
  type              String   // 'chat_digest'
  status            String   // 'pending', 'sent', 'failed', 'cancelled'
  scheduledFor      DateTime // When to send (respects timezone + quiet hours)
  channels          Json     // ['push', 'email'] - which channels to use
  metadata          Json     // { conversationIds: [], messageCount: 3, conversationCount: 2 }
  sentAt            DateTime?
  failureReason     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status, scheduledFor])
  @@index([status, scheduledFor])
}
```

#### New Table: `NotificationLog`

```prisma
model NotificationLog {
  id                String   @id @default(cuid())
  userId            String
  type              String   // 'chat_digest'
  channel           String   // 'push', 'email'
  sentAt            DateTime @default(now())
  metadata          Json     // Details about what was sent

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sentAt])
  @@index([sentAt])
}
```

#### User Preferences (Future)

```prisma
model User {
  // ... existing fields
  notificationFrequency String?  @default("daily") // 'immediate', 'hourly', 'daily', 'off'
  notificationChannels  Json?    @default("['push', 'email']") // Preferred channels
  quietHoursStart       Int?     @default(22) // 10 PM in user's timezone
  quietHoursEnd         Int?     @default(7)  // 7 AM in user's timezone
  timezone              String?  @default("America/Denver") // User's timezone
}
```

### Worker Process Flow

**Worker Job: `process-notification-queue`**

- Runs every 5-10 minutes
- Processes notifications where `status = 'pending'` and `scheduledFor <= NOW()`

**Steps:**

1. Query pending notifications due for delivery
2. For each notification:
   - Check rate limit: Has user received a notification in last 24 hours? (query `NotificationLog`)
   - If rate limited: Cancel or reschedule
   - Determine delivery channels:
     - **Push**: Check `PushSubscription` table for active subscriptions
     - **Email**: Check if user has verified email
   - Send via each channel
   - Log delivery in `NotificationLog`
   - Update `NotificationQueue` status to 'sent'

### Triggering Notifications

**When a new chat message is created:**

1. Identify all conversation participants (excluding sender)
2. For each participant:
   - Check if they have unread messages
   - Check if a pending notification already exists for this user
   - If no pending notification:
     - Create `NotificationQueue` entry with `scheduledFor = NOW() + 15-30 minutes`
   - If pending notification exists:
     - Update metadata to include new message count
     - Don't change `scheduledFor` (batching window)

### Rate Limiting Implementation

**Daily Limit (Phase 1):**

```typescript
async function canSendNotification(userId: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentNotifications = await prisma.notificationLog.count({
    where: {
      userId,
      sentAt: { gte: oneDayAgo },
    },
  });

  return recentNotifications === 0;
}
```

**Future: User-configurable frequency**

- Respect `user.notificationFrequency` setting
- Adjust rate limit check accordingly

### Timezone-Aware Delivery

**Quiet Hours Check:**

```typescript
function isQuietHours(user: User): boolean {
  const userTime = new Date().toLocaleString("en-US", {
    timeZone: user.timezone || "America/Denver",
  });
  const hour = new Date(userTime).getHours();

  const start = user.quietHoursStart || 22;
  const end = user.quietHoursEnd || 7;

  // Handle overnight quiet hours (e.g., 10 PM - 7 AM)
  if (start > end) {
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}
```

**Rescheduling:**

- If notification is due during quiet hours, reschedule to `quietHoursEnd` in user's timezone
- Ensures user wakes up to notification rather than being woken by it

## Deep Linking to Chat

### URL Parameter for Auto-Opening Chat

**Implementation:**
- Add `?openChat=true` query parameter to notification links
- Example: `https://namegame.app?openChat=true`
- On app load, check for this parameter and automatically open the chat drawer
- User sees their conversation list with green dots indicating unread messages
- User can choose which conversations to read

**Code Location:**
- Check query param in root layout or main app component
- Trigger `ChatDrawer` open state if parameter present
- Remove parameter from URL after opening (clean URL)

**Benefits:**
- Simple implementation (no complex routing)
- Works across all pages (home, group pages, etc.)
- User maintains control (sees all conversations, chooses what to read)
- No need to track specific conversation IDs in notification payload

## Push Notification Implementation

### Web Push API

- Uses service worker to receive notifications
- Requires VAPID keys (already configured)
- Subscription stored in `PushSubscription` table

### Sending Push Notifications

```typescript
import webpush from "web-push";

async function sendPushNotification(userId: string, payload: object) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      )
    )
  );

  // Clean up failed subscriptions (expired/invalid)
  // Log successful deliveries
}
```

## Email Notification Implementation

### Using Existing Resend Infrastructure

- Leverage `src/lib/mail.ts` patterns
- Create new email template for chat digest
- Send to verified email addresses only

### Email Template

```typescript
export const ChatDigestEmail = ({
  firstName,
  messageCount,
  conversationCount,
  appUrl,
}: {
  firstName: string;
  messageCount: number;
  conversationCount: number;
  appUrl: string;
}) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Heading>Hi {firstName},</Heading>
        <Text>
          You have {messageCount} new message{messageCount !== 1 ? "s" : ""}
          in {conversationCount} conversation{conversationCount !== 1
            ? "s"
            : ""}.
        </Text>
        <Button href={appUrl}>Open NameGame</Button>
      </Container>
    </Body>
  </Html>
);
```

## Future Enhancements

### User Preferences UI

- Allow users to configure:
  - Notification frequency (immediate/hourly/daily/off)
  - Preferred channels (push/email/both)
  - Quiet hours window
  - Timezone (auto-detect with manual override)

### Notification Types

- Chat messages (Phase 1)
- Group invitations
- Event reminders
- @mentions
- System announcements

### Advanced Features

- Per-conversation notification settings (mute specific conversations)
- VIP contacts (always notify immediately)
- Smart bundling (group related notifications)
- Read receipts integration (cancel notification if user reads in-app before delivery)

## Implementation Checklist

### Phase 1: Push Notifications

- [ ] Create database migrations for `NotificationQueue` and `NotificationLog`
- [ ] Add timezone field to User table
- [ ] Implement notification queue creation on new messages
- [ ] Build worker job to process notification queue
- [ ] Implement rate limiting logic
- [ ] Add quiet hours detection and rescheduling
- [ ] Create push notification sending function
- [ ] Test with multiple devices/subscriptions
- [ ] Add monitoring and error handling

### Phase 2: Email Fallback

- [ ] Create email digest template
- [ ] Integrate with Resend via existing mail.ts
- [ ] Add email channel to notification queue processing
- [ ] Test email delivery

### Phase 3: User Preferences

- [ ] Build notification settings UI
- [ ] Add user preference fields to database
- [ ] Update worker to respect user preferences
- [ ] Add timezone auto-detection

## Technical Considerations

### Worker Infrastructure

- Runs on DigitalOcean worker service (separate from web/chat services)
- Needs access to same database
- Should be idempotent (safe to run multiple times)
- Implement job locking to prevent duplicate sends

### Performance

- Batch database queries where possible
- Use indexes on `NotificationQueue` and `NotificationLog` for efficient queries
- Consider pagination for users with many subscriptions

### Reliability

- Retry failed push notifications (with exponential backoff)
- Clean up expired push subscriptions
- Log all notification attempts for debugging
- Alert on high failure rates

### Privacy

- Never include message content in notifications
- Respect user's notification preferences
- Allow easy opt-out
- Clear data retention policy for notification logs

## Success Metrics

- Notification delivery rate (sent vs failed)
- User engagement (app opens after notification)
- Opt-out rate
- Average time from message to notification delivery
- Rate limit hit frequency (are we being too aggressive?)
