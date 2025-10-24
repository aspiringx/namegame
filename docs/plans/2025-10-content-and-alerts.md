# Content & Notifications Implementation Plan

**Date:** October 24, 2025  
**Status:** Planning

## Overview

Implement a comprehensive content system (events, announcements, static pages) with in-app notifications to complement the existing chat system. This enables groups to share time-sensitive information, coordinate events, and maintain persistent content beyond real-time conversations.

---

## Current State

**Chat Infrastructure (Stabilized):**
- ✅ Real-time chat with WebSocket support
- ✅ Direct messages and group conversations
- ✅ Message reactions, soft delete, admin moderation
- ✅ Unread tracking via `lastReadAt`
- ✅ ChatIcon in header with green dot indicator
- ✅ Push notifications for daily chat summaries

**Missing Infrastructure:**
- ❌ No content models (events, announcements, static pages)
- ❌ No notification/bell icon in header
- ❌ No in-app notification system
- ❌ No event RSVP or calendar integration
- ❌ No content commenting system

---

## Phase 1: Database Schema for Content

**Goal:** Establish database foundation for all content types and notifications.

### Models to Add

#### 1. Content Model
```prisma
model Content {
  id            String    @id @default(cuid())
  type          String    // 'event' | 'announcement' | 'page'
  title         String
  body          String    @db.Text
  authorId      String
  groupId       Int
  publishedAt   DateTime?
  scheduledFor  DateTime? // For scheduled publishing
  
  // Event-specific fields (nullable for non-events)
  eventDate     DateTime?
  eventEndDate  DateTime?
  eventLocation String?
  allowRSVP     Boolean   @default(false)
  
  // Engagement settings
  allowComments Boolean   @default(true)
  isPinned      Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete
  
  // Relations
  author        User      @relation(fields: [authorId], references: [id])
  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  comments      ContentComment[]
  rsvps         EventRSVP[]
  tags          ContentTag[]
  notifications Notification[]
  
  @@map("content")
}
```

#### 2. ContentComment Model
```prisma
model ContentComment {
  id        String    @id @default(cuid())
  contentId String
  authorId  String
  body      String    @db.Text
  parentId  String?   // For threaded replies (1 level deep)
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? // Soft delete
  
  // Relations
  content   Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id])
  parent    ContentComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   ContentComment[] @relation("CommentReplies")
  
  @@map("content_comments")
}
```

#### 3. EventRSVP Model
```prisma
model EventRSVP {
  id         String   @id @default(cuid())
  contentId  String
  userId     String
  status     String   // 'yes' | 'no' | 'maybe'
  guestCount Int      @default(0)
  notes      String?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relations
  content    Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])
  
  @@unique([contentId, userId])
  @@map("event_rsvps")
}
```

#### 4. Notification Model
```prisma
model Notification {
  id             String   @id @default(cuid())
  userId         String
  type           String   // 'chat' | 'content' | 'event_reminder' | 'comment' | 'rsvp'
  title          String
  body           String?
  actionUrl      String?
  
  // Polymorphic relations (nullable)
  contentId      String?
  conversationId String?
  
  readAt         DateTime?
  createdAt      DateTime  @default(now())
  
  // Relations
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  content        Content?          @relation(fields: [contentId], references: [id], onDelete: Cascade)
  conversation   ChatConversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([userId, readAt])
  @@map("notifications")
}
```

#### 5. ContentTag Model
```prisma
model ContentTag {
  id        Int      @id @default(autoincrement())
  code      String
  label     String
  groupId   Int
  color     String?  // Hex color for UI
  
  createdAt DateTime @default(now())
  
  // Relations
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  content   Content[]
  
  @@unique([groupId, code])
  @@map("content_tags")
}
```

### Tasks
- [ ] Add models to `schema.prisma`
- [ ] Update User model to include `contentPosts`, `contentComments`, `eventRSVPs`, `notifications` relations
- [ ] Update Group model to include `content`, `contentTags` relations
- [ ] Update ChatConversation model to add `notifications` relation
- [ ] Create migration: `npx prisma migrate dev --name add_content_system`
- [ ] Generate Prisma client
- [ ] Create seed data for testing (sample events, announcements)

---

## Phase 2: Bell Icon & Notification UI

**Goal:** Add notification icon to header with drawer interface for viewing in-app notifications.

### Components to Create

#### 1. NotificationIcon Component
- Location: `src/components/NotificationIcon.tsx`
- Similar pattern to `ChatIcon.tsx`
- Bell icon from lucide-react
- Green dot indicator for unread notifications
- Click opens notification drawer
- Expose ref for programmatic opening

#### 2. NotificationDrawer Component
- Location: `src/components/NotificationDrawer.tsx`
- Reuse existing `Drawer` component
- List of notifications sorted by `createdAt` desc
- Group by date (Today, Yesterday, This Week, Older)
- Each notification shows:
  - Icon based on type
  - Title and body
  - Time ago
  - Read/unread indicator
- Click notification → mark as read + navigate to `actionUrl`
- "Mark all as read" button at top
- Empty state when no notifications

#### 3. NotificationItem Component
- Location: `src/components/NotificationItem.tsx`
- Individual notification card
- Different icons per type (MessageSquare, Calendar, Bell, MessageCircle)
- Unread: bold text, colored background
- Read: normal text, transparent background

### API Routes to Create

#### GET /api/notifications
- Fetch user's notifications
- Query params: `?limit=50&offset=0&unreadOnly=false`
- Return: `{ notifications: Notification[], unreadCount: number }`
- Order by `createdAt` desc

#### PATCH /api/notifications/[id]/read
- Mark single notification as read
- Set `readAt` to current timestamp
- Return updated notification

#### PATCH /api/notifications/read-all
- Mark all user's unread notifications as read
- Return count of notifications updated

#### POST /api/notifications (internal)
- Create notification (called by server actions)
- Validate user has access to related content/conversation
- Return created notification

### Header Integration
- [ ] Add `NotificationIcon` next to `ChatIcon` in `Header.tsx`
- [ ] Pass ref for deep linking support
- [ ] Add notification deep link handler (similar to chat)

### Tasks
- [ ] Create `NotificationIcon` component with green dot logic
- [ ] Create `NotificationDrawer` component
- [ ] Create `NotificationItem` component
- [ ] Implement API routes
- [ ] Add to Header
- [ ] Create notification utility functions (`createNotification`, `markAsRead`)
- [ ] Test with manual notification creation

---

## Phase 3: Content Creation & Display

**Goal:** Enable admins to create and publish content; enable all members to view content.

### Admin Content Creation

#### Content Creation Page
- Location: `src/app/g/[slug]/admin/content/new/page.tsx`
- Admin-only route (check `isGroupAdmin`)
- Form with:
  - Type selector (Event, Announcement, Page)
  - Title input
  - Rich text editor for body (consider react-quill or tiptap)
  - Event-specific fields (conditional on type):
    - Date/time picker
    - End date/time (optional)
    - Location input with map link preview
    - "Allow RSVP" toggle
  - Tag selector (multi-select from group tags)
  - "Allow comments" toggle
  - "Pin to top" toggle
  - Publish options: "Publish now" or "Schedule for later"
- Server action: `createContent`

#### Content Edit Page
- Location: `src/app/g/[slug]/admin/content/[id]/edit/page.tsx`
- Same form as creation, pre-populated
- Server action: `updateContent`
- "Delete content" button (soft delete)

#### Content Management Page
- Location: `src/app/g/[slug]/admin/content/page.tsx`
- Table view of all group content
- Columns: Type, Title, Author, Published, Views, Comments, Actions
- Filter by type, published status
- Sort by date, views, comments
- Quick actions: Edit, Delete, Pin/Unpin

### Content Display

#### Content Feed Page
- Location: `src/app/g/[slug]/feed/page.tsx`
- All content types mixed chronologically
- Pinned content at top
- Card view with:
  - Type badge
  - Title
  - Excerpt (first 200 chars)
  - Author, date
  - Comment count, RSVP count (for events)
  - Tags
- Infinite scroll or pagination
- Filter by type, tags

#### Events Page
- Location: `src/app/g/[slug]/events/page.tsx`
- Calendar view (month grid) + list view toggle
- Filter by tags
- Upcoming events highlighted
- Past events in separate section or grayed out

#### Individual Content Page
- Location: `src/app/g/[slug]/content/[id]/page.tsx`
- Full content display
- Breadcrumb: Group > Feed/Events > Title
- For events:
  - Date, time, location with map link
  - RSVP widget
  - Attendee list (who's going)
- Comment section at bottom
- Share button (copy link)
- "Add to calendar" button (for events)

### Components

#### ContentCard
- Location: `src/components/ContentCard.tsx`
- Preview card for lists
- Props: content, showExcerpt, compact mode

#### ContentPage
- Location: `src/components/ContentPage.tsx`
- Full content display
- Handles all content types
- Includes comment section

#### EventCalendar
- Location: `src/components/EventCalendar.tsx`
- Month grid view of events
- Click date → show events for that day
- Navigate months
- Consider using react-big-calendar or build custom

#### RSVPWidget
- Location: `src/components/RSVPWidget.tsx`
- Yes/No/Maybe buttons
- Guest count input (when Yes)
- Notes textarea
- Shows current RSVP status
- Shows attendee count per status

### Server Actions

#### createContent
- Location: `src/app/g/[slug]/admin/content/actions.ts`
- Validate admin permission
- Create content record
- Create notifications for group members
- Return content ID

#### updateContent
- Similar to create, but update existing

#### deleteContent
- Soft delete (set `deletedAt`)

#### getContent
- Fetch single content by ID
- Include author, tags, RSVP counts, comment counts

#### getGroupContent
- Fetch all content for group
- Filter by type, tags, published status
- Pagination support

### Tasks
- [ ] Create content creation form and page
- [ ] Create content edit page
- [ ] Create content management page
- [ ] Create content feed page
- [ ] Create events page with calendar
- [ ] Create individual content page
- [ ] Create all content components
- [ ] Implement server actions
- [ ] Add navigation links (header, sidebar)
- [ ] Create notifications when content published

---

## Phase 4: Comments & Engagement

**Goal:** Enable members to comment on content and engage in discussions.

### Comment System

#### Comment Section Component
- Location: `src/components/CommentSection.tsx`
- Displays all comments for content
- Nested replies (1 level deep)
- "Add comment" form at top
- Each comment shows:
  - Author avatar and name
  - Comment text
  - Time ago
  - Reply button
  - Delete button (for author or admin)
- Optimistic updates for new comments
- Pagination or "Load more" for large threads

#### Comment Form Component
- Location: `src/components/CommentForm.tsx`
- Textarea with auto-resize
- Character limit indicator
- Submit button
- Cancel button (for replies)

### API Routes

#### GET /api/content/[id]/comments
- Fetch all comments for content
- Include author info
- Nested structure for replies
- Pagination support

#### POST /api/content/[id]/comments
- Create new comment
- Validate user is group member
- Create notification for content author
- Create notification for parent comment author (if reply)
- Return created comment

#### DELETE /api/content/comments/[id]
- Soft delete comment
- Validate user is author or admin
- Return success

### Optional: Content-Specific Chat

#### "Discuss" Button
- On content page, add "Discuss this event" button
- Creates dedicated chat conversation linked to content
- Conversation name: "[Event Name] Discussion"
- Appears in chat drawer with content context
- Link back to content from chat

#### Implementation
- Add `contentId` field to `ChatConversation` model
- Create server action: `createContentChat`
- Update chat UI to show content context
- Add link to content page in chat header

### Tasks
- [ ] Create `CommentSection` component
- [ ] Create `CommentForm` component
- [ ] Implement comment API routes
- [ ] Add comment section to content pages
- [ ] Create notifications for comments
- [ ] (Optional) Implement content-specific chat
- [ ] Test comment threading and notifications

---

## Phase 5: Calendar Integration & Reminders

**Goal:** Enable users to add events to personal calendars and receive timely reminders.

### iCal Export

#### API Routes

##### GET /api/g/[slug]/events.ics
- Generate iCal file for all group events
- Include all published events (past and future)
- Standard iCal format with:
  - Event title, description, location
  - Start/end times
  - URL back to event page
- Set proper headers: `Content-Type: text/calendar`

##### GET /api/g/[slug]/events/[id].ics
- Generate iCal file for single event
- Same format as above

#### UI Integration
- "Add to Calendar" button on event pages
- Dropdown with options:
  - Download .ics file
  - Copy iCal URL (for calendar subscriptions)
  - Quick links: Google Calendar, Apple Calendar, Outlook

### Event Reminders

#### Background Job
- Location: `apps/worker/src/jobs/send-event-reminders.ts`
- Runs every hour (or more frequently)
- Query upcoming events:
  - Events in next 25 hours (for 1-day reminder)
  - Events in next 2 hours (for 1-hour reminder)
- For each event:
  - Find users with "yes" RSVP
  - Check if reminder already sent (track in separate table or notification)
  - Create in-app notification
  - Send push notification
  - Send email (optional)

#### ReminderSent Model (optional)
```prisma
model ReminderSent {
  id        String   @id @default(cuid())
  contentId String
  userId    String
  type      String   // '1_day' | '1_hour'
  sentAt    DateTime @default(now())
  
  @@unique([contentId, userId, type])
  @@map("reminders_sent")
}
```

### Enhanced Daily Notification

#### Update Daily Summary Email
- Location: `apps/worker/src/jobs/send-daily-chat-notifications.ts`
- Add sections:
  - **Upcoming Events** (next 7 days with RSVP status)
  - **New Announcements** (last 24 hours)
  - **Unread Notifications** (count with link)
- Update email template
- Add links to notification drawer and event pages

#### Update Push Notification
- Include event count and announcement count
- Deep link to notification drawer

### Tasks
- [ ] Implement iCal generation routes
- [ ] Add "Add to Calendar" button to event pages
- [ ] Create event reminder background job
- [ ] Add reminder tracking (ReminderSent model or use Notification)
- [ ] Schedule reminder job in worker
- [ ] Update daily email template
- [ ] Update daily push notification
- [ ] Test calendar export with various calendar apps
- [ ] Test reminder delivery timing

---

## Architecture Decisions

### Content vs Chat Separation
- **Content**: Traditional request/response, no WebSocket needed
- **Chat**: Real-time, existing WebSocket infrastructure
- Keep separate but allow optional linking (event → discussion chat)
- Content is persistent and discoverable; chat is ephemeral and conversational

### Notification Strategy
- **In-app**: Notification model + bell icon (immediate, always available)
- **Push**: Existing daily summary + event reminders (batch, opt-in)
- **Email**: Leverage existing daily email system (batch, fallback)
- Avoid notification fatigue: batch where possible, allow user preferences

### Permissions
- **Content creation**: Admin-only initially (can expand to all members later)
- **Comments**: All group members (not guests)
- **RSVP**: All group members (not guests)
- **Viewing**: Respect existing group access rules (members only, no public)

### Rich Text Editor
- Start simple: textarea with markdown support
- Consider upgrading to WYSIWYG later (react-quill, tiptap)
- Store as plain text or markdown in database
- Sanitize HTML output to prevent XSS

### Event Calendar
- Start with list view + simple month grid
- Consider react-big-calendar for richer calendar UI
- Mobile-first: ensure calendar is touch-friendly
- Support both one-time and recurring events (future enhancement)

---

## Testing Strategy

### Unit Tests
- Notification creation logic
- iCal generation
- Comment threading
- RSVP status updates

### Integration Tests
- Content creation flow (admin creates → members see → notifications sent)
- Comment flow (user comments → author notified → reply)
- RSVP flow (user RSVPs → count updates → reminder sent)
- Calendar export (generate .ics → validate format)

### Manual Testing Checklist
- [ ] Admin can create all content types
- [ ] Members see content in feed
- [ ] Notifications appear in bell icon
- [ ] Clicking notification navigates correctly
- [ ] Comments post and display correctly
- [ ] RSVP updates immediately
- [ ] Calendar export works in Google/Apple/Outlook
- [ ] Reminders send at correct times
- [ ] Daily email includes new content
- [ ] Mobile UI is responsive and touch-friendly

---

## Estimated Timeline

- **Phase 1** (Database): 1-2 days
- **Phase 2** (Notifications UI): 2-3 days
- **Phase 3** (Content System): 3-4 days
- **Phase 4** (Comments): 2-3 days
- **Phase 5** (Calendar/Reminders): 2-3 days

**Total: ~2 weeks** for full content system with calendar integration.

---

## Future Enhancements

### Not in Initial Scope
- Recurring events
- Event registration with forms
- Content approval workflow
- User-generated content (non-admin posts)
- Content analytics (views, engagement metrics)
- Email notifications for individual content
- Content versioning/history
- Draft saving and preview
- Image uploads in content body
- Video embeds
- Polls/surveys
- Content categories beyond tags
- Advanced calendar features (timezone support, all-day events)
