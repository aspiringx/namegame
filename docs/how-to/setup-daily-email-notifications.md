# Setup Daily Email Notifications on DigitalOcean

## Overview

This guide explains how to set up the daily email notification job on DigitalOcean, which sends emails to users with unread chat messages.

## Job Details

- **Job Name**: `send-daily-chat-emails`
- **Schedule**: 5:30 PM Mountain Time (5 hours after push notifications)
- **Purpose**: Email users with verified emails who have unread messages
- **Frequency**: Once per day

## DigitalOcean App Platform Setup

### 1. Create a New Job Component

Similar to the existing `daily-chat-notifications` job component:

1. Go to your DigitalOcean App Platform dashboard
2. Navigate to your `namegame` app
3. Click **Settings** tab
4. Under **Components**, click **Add Component**
5. Select **Job**

### 2. Configure the Job

**Component Settings:**

- **Name**: `daily-chat-email-notifications`
- **Source**: Same as your main app (GitHub repo)
- **Branch**: `main`
- **Source Directory**: `/`

**Job Trigger:**

- **Type**: Scheduled (Cron)
- **Schedule**: `At 5:30 PM (17:30) Mountain Time`
  - **Cron Expression**: `30 23 * * *` (5:30 PM MT = 11:30 PM UTC in winter)
  - Note: Adjust for DST if needed (MT is UTC-7 in summer, UTC-6 in winter)
  - For year-round consistency, use: `30 0 * * *` (5:30 PM MDT = 11:30 PM UTC)

**Resource Size:**

- **Plan**: Basic ($5/mo)
- **RAM**: 512 MB
- **vCPU**: 1 Shared

**Build Command:**

```bash
pnpm install && pnpm build:all
```

**Run Command:**

```bash
cd apps/worker && node -e "require('./dist/jobs/send-daily-chat-emails').sendDailyChatEmails().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"
```

### 3. Environment Variables

Ensure these environment variables are set (should already be configured at the app level):

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for sending emails
- `NEXT_PUBLIC_APP_URL` - Base URL for SSO links (e.g., `https://namegame.app`)
- `FROM_EMAIL_NO_REPLY` - From address for emails (e.g., `NameGame <no-reply@mail.namegame.app>`)

**Optional:**

- `NODE_ENV=production`

**Note:** Do not confuse `FROM_EMAIL_NO_REPLY` with `WEB_PUSH_EMAIL` (which is used for VAPID configuration in push notifications).

### 4. Verify Setup

After creating the component:

1. Check the **Runtime Logs** tab to see if the job runs successfully
2. Look for log messages like:
   ```
   [DailyChatEmails] Starting daily chat email job
   [DailyChatEmails] Found X users with unread messages and verified emails
   [DailyChatEmails] Using notification text: "..."
   [DailyChatEmails] Email sent to user@example.com
   [DailyChatEmails] Completed in Xms. Sent: Y, Failed: Z
   ```

## Timing Coordination

The email job runs **5 hours after** the push notification job:

- **Push Notifications**: 12:30 PM MT (`30 19 * * *` UTC)
- **Email Notifications**: 5:30 PM MT (`30 0 * * *` UTC)

This delay ensures:

1. Users who have push notifications enabled get notified first
2. If they read their messages via push, they won't get an email
3. Only users who still have unread messages after 5 hours get the email

## Resend Configuration

### Domain Setup

Ensure your sending domain is verified in Resend:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add domain: `namegame.app`
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain

### From Address

The job sends from the `FROM_EMAIL_NO_REPLY` environment variable, which should be configured as:
`NameGame <no-reply@mail.namegame.app>`

This address must be verified in your Resend account. The `mail.namegame.app` subdomain should have proper DNS records (SPF, DKIM, DMARC) configured.

## Testing

### Preview Email Template Locally

You can preview and test the email template in your browser using React Email's
dev server.

First ensure the app is running with this:

```bash
cd apps/web
pnpm dev
```

Or for the full production build from the root directory:

```bash
pnpm build:all
pnpm start:local
```

Then in another terminal tab.

```bash
cd apps/web
pnpm email-preview
```

This will start a local server at `http://localhost:3002` where you can:

- View all email templates in the `src/emails` directory
- See how they render in different email clients
- Test responsive design
- Make live edits and see changes instantly

The preview includes the `DailyChatNotificationEmailPreview` component with sample data.

### Manual Trigger (for testing)

You can manually trigger the job from your local environment:

```bash
cd apps/worker
pnpm build
node -e "require('./dist/jobs/send-daily-chat-emails').sendDailyChatEmails().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"
```

**Note:** This will send real emails to users with unread messages. Use with caution in production environments.

### Test Email Content

The email includes:

- **Subject**: `[emoji] [Random Adjective] Messages [emoji]`
- **Body**: Random fun notification text (same system as push notifications)
- **Button**: "View Messages" with SSO link
- **Footer**: "This is your daily digest. We'll never send more than one per day."

## Monitoring

### Success Metrics

Monitor these in the DigitalOcean logs:

- Number of users with unread messages
- Number of emails sent successfully
- Number of failures
- Job execution time

### Common Issues

**No emails sent:**

- Check that users have verified emails (`emailVerified IS NOT NULL`)
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for delivery status

**Job fails:**

- Check DATABASE_URL is accessible
- Verify all required environment variables are set
- Check Runtime Logs for error messages

## Cost Estimate

- **DigitalOcean Job**: $5/mo (runs once per day)
- **Resend**: Free tier includes 100 emails/day, then $0.001/email

For 100 daily active users: ~$5/mo total
For 1000 daily active users: ~$35/mo ($5 DO + $30 Resend)

## Related Documentation

- [Out-of-Band Notifications Design](../designs/out-of-band-notifications.md)
- [Push Notifications Setup](./test-mobile-device-localhost.md)
- [Email Templates](../../apps/web/src/emails/)
